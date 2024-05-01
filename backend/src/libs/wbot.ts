import * as Sentry from "@sentry/node";
import makeWASocket, {
  WASocket,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  isJidBroadcast,
  CacheStore,
  proto
} from "@whiskeysockets/baileys";

import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger";
import authState from "../helpers/authState";
import { Boom } from "@hapi/boom";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { Store } from "./store";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import NodeCache from 'node-cache';

const loggerBaileys = MAIN_LOGGER.child({});
loggerBaileys.level = "error";

type Session = WASocket & {
  id?: number;
  store?: Store;
};

const sessions: Session[] = [];

const retriesQrCodeMap = new Map<number, number>();

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

export const removeWbot = async (
  whatsappId: number,
  isLogout = true
): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      if (isLogout) {
        sessions[sessionIndex].logout();
        sessions[sessionIndex].ws.close();
      }

      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(err);
  }
};

export const initWASocket = async (whatsapp: Whatsapp): Promise<Session> => {
  return new Promise(async (resolve, reject) => {
    try {
      (async () => {
        const io = getIO();

        const whatsappUpdate = await Whatsapp.findOne({
          where: { id: whatsapp.id }
        });

        if (!whatsappUpdate) return;

        const { id, name, provider } = whatsappUpdate;

        const { version, isLatest } = await fetchLatestBaileysVersion();
        const isLegacy = provider === "stable" ? true : false;

        logger.info(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
        logger.info(`isLegacy: ${isLegacy}`);
        logger.info(`Starting session ${name}`);
        let retriesQrCode = 0;

        let wsocket: Session = null;
        const store = makeInMemoryStore({
          logger: loggerBaileys
        });

        const { state, saveState } = await authState(whatsapp);

        const msgRetryCounterCache = new NodeCache();
        const userDevicesCache: CacheStore = new NodeCache();

        wsocket = makeWASocket({
          logger: loggerBaileys,
          printQRInTerminal: false,
          browser: Browsers.appropriate("AutoAtende"),
          auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
          },
          msgRetryCounterCache,
          shouldIgnoreJid: jid => isJidBroadcast(jid),
          version: [2,2323,4],
          patchMessageBeforeSending(message) {
            if (message.deviceSentMessage?.message?.listMessage?.listType === proto.Message.ListMessage.ListType.PRODUCT_LIST) {
              message = JSON.parse(JSON.stringify(message));
              message.deviceSentMessage.message.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
            }
            if (message.listMessage?.listType == proto.Message.ListMessage.ListType.PRODUCT_LIST) {
              message = JSON.parse(JSON.stringify(message));
              message.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
            }
            return message; 
          }
        });

        wsocket.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect, qr }) => {
            logger.info(
              `Socket  ${name} Connection Update ${connection || ""} ${lastDisconnect || ""
              }`
            );
            if (wsocket && wsocket.ev) { // Adicionando verificação para evitar referência nula
              if (connection === "close") {
                if ((lastDisconnect?.error as Boom)?.output?.statusCode === 403) {
                  await whatsapp.update({ status: "PENDING", session: "" });
                  await DeleteBaileysService(whatsapp.id);
                  io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                  removeWbot(id, false);
                }
                if (
                  (lastDisconnect?.error as Boom)?.output?.statusCode !==
                  DisconnectReason.loggedOut
                ) {
                  removeWbot(id, false);
                  setTimeout(
                    () => StartWhatsAppSession(whatsapp, whatsapp.companyId),
                    2000
                  );
                } else {
                  await whatsapp.update({ status: "PENDING", session: "" });
                  await DeleteBaileysService(whatsapp.id);
                  io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                  removeWbot(id, false);
                  setTimeout(
                    () => StartWhatsAppSession(whatsapp, whatsapp.companyId),
                    2000
                  );
                }
              }

              if (connection === "open") {
                await whatsapp.update({
                  status: "CONNECTED",
                  qrcode: "",
                  retries: 0
                });

                io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: whatsapp
                });

                const sessionIndex = sessions.findIndex(
                  s => s.id === whatsapp.id
                );
                if (sessionIndex === -1) {
                  wsocket.id = whatsapp.id;
                  sessions.push(wsocket);
                }

                resolve(wsocket);
              }

              if (qr !== undefined) {
                if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= 3) {
                  await whatsappUpdate.update({
                    status: "DISCONNECTED",
                    qrcode: ""
                  });
                  await DeleteBaileysService(whatsappUpdate.id);
                  io.emit("whatsappSession", {
                    action: "update",
                    session: whatsappUpdate
                  });
                  wsocket.ev.removeAllListeners("connection.update");
                  wsocket.ws.close();
                  wsocket = null;
                  retriesQrCodeMap.delete(id);
                } else {
                  logger.info(`Session QRCode Generate ${name}`);
                  retriesQrCodeMap.set(id, (retriesQrCode += 1));

                  await whatsapp.update({
                    qrcode: qr,
                    status: "qrcode",
                    retries: 0
                  });
                  const sessionIndex = sessions.findIndex(
                    s => s.id === whatsapp.id
                  );

                  if (sessionIndex === -1) {
                    wsocket.id = whatsapp.id;
                    sessions.push(wsocket);
                  }

                  io.emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: whatsapp
                  });
                }
              }
            } else {
              console.log("wsocket or wsocket.ev is null.");
            }
          }
        );
        wsocket.ev.on("creds.update", saveState);
        store.bind(wsocket.ev);
      })();
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      reject(error);
    }
  });
};