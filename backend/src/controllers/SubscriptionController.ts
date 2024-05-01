import { Request, Response } from "express";
import express from "express";
import * as Yup from "yup";
import * as Sentry from "@sentry/node";


import Stripe from 'stripe';
import Gerencianet from "gn-api-sdk-typescript";
import AppError from "../errors/AppError";

var axios = require('axios');

import options from "../config/Gn";
import Company from "../models/Company";
import Invoices from "../models/Invoices";
import Setting from "../models/Setting";;
import { getIO } from "../libs/socket";

import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

const app = express();


export const index = async (req: Request, res: Response): Promise<Response> => {
  const gerencianet = Gerencianet(options);
  return res.json(gerencianet.getSubscriptions());
};

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {

  //let mercadopagoURL;
  let stripeURL;
  let pix;
  let qrcode;
  let asaasURL;

  let key_STRIPE_PRIVATE = null;
  let key_MP_ACCESS_TOKEN = null;
  let key_GERENCIANET_PIX_KEY = null;
  let key_ASAAS_TOKEN = null;


  try {

    const buscacompanyId = 1;

    const getasaastoken = await Setting.findOne({
      where: { companyId: buscacompanyId, key: "asaastoken" },
    });
    key_ASAAS_TOKEN = getasaastoken?.value;

    const getmptoken = await Setting.findOne({
      where: { companyId: buscacompanyId, key: "mpaccesstoken" },
    });
    key_MP_ACCESS_TOKEN = getmptoken?.value;

    const getstripetoken = await Setting.findOne({
      where: { companyId: buscacompanyId, key: "stripeprivatekey" },
    });
    key_STRIPE_PRIVATE = getstripetoken?.value;

    const getpixchave = await Setting.findOne({
      where: { companyId: buscacompanyId, key: "efichavepix" },
    });
    key_GERENCIANET_PIX_KEY = getpixchave?.value;



  } catch (error) {
    console.error("Error retrieving settings:", error);
  }

  console.log(key_ASAAS_TOKEN);
  console.log(key_MP_ACCESS_TOKEN);

  const gerencianet = Gerencianet(options);
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    price: Yup.string().required(),
    users: Yup.string().required(),
    connections: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    console.log("Erro linha 32")
    throw new AppError("Dados Incorretos - Contate o Suporte!", 400);
  }

  const {
    firstName,
    price,
    users,
    connections,
    address2,
    city,
    state,
    zipcode,
    country,
    plan,
    invoiceId
  } = req.body;


  const valor = Number(price.toLocaleString("pt-br", { minimumFractionDigits: 2 }).replace(",", "."));
  const valorext = price;

  async function createMercadoPagoPreference() {
    if (key_MP_ACCESS_TOKEN) {
      const mercadopago = require("mercadopago");
      mercadopago.configure({
        access_token: key_MP_ACCESS_TOKEN
      });

      let preference = {
        external_reference: String(invoiceId),
        notification_url: String(process.env.MP_NOTIFICATION_URL),
        items: [
          {
            title: `#Fatura:${invoiceId}`,
            unit_price: valor,
            quantity: 1
          }
        ]
      };

      try {
        const response = await mercadopago.preferences.create(preference);
        //console.log("mercres", response);
        let mercadopagoURLb = response.body.init_point;
        //console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        //console.log(mercadopagoURLb);
        return mercadopagoURLb; // Retorna o valor para uso externo
      } catch (error) {
        console.log(error);
        return null; // Em caso de erro, retorna null ou um valor padrão adequado
      }
    }
  }

  const mercadopagoURL = await createMercadoPagoPreference();

  //console.log(mercadopagoURL);

  if (key_ASAAS_TOKEN && valor > 10) {

    var optionsGetAsaas = {
      method: 'POST',
      url: `https://www.asaas.com/api/v3/paymentLinks`,
      headers: {
        'Content-Type': 'application/json',
        'access_token': key_ASAAS_TOKEN
      },
      data: {
        "name": `#Fatura:${invoiceId}`,
        "description": `#Fatura:${invoiceId}`,
        //"endDate": "2021-02-05",
        "value": price.toLocaleString("pt-br", { minimumFractionDigits: 2 }).replace(",", "."),
        //"value": "50",
        "billingType": "UNDEFINED",
        "chargeType": "DETACHED",
        "dueDateLimitDays": 1,
        "subscriptionCycle": null,
        "maxInstallmentCount": 1,
        "notificationEnabled": true
      }
    };


    while (asaasURL === undefined) {
      try {
        const response = await axios.request(optionsGetAsaas);
        asaasURL = response.data.url;

        console.log('asaasURL:', asaasURL);

        // Handle the response here
        // You can proceed with the rest of your code that depends on asaasURL
      } catch (error) {
        console.error('Error:', error);
      }
    }




  }

  if (key_STRIPE_PRIVATE) {

    const stripe = new Stripe(key_STRIPE_PRIVATE, {
      apiVersion: '2022-11-15',
    });

    const sessionStripe = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `#Fatura:${invoiceId}`,
            },
            unit_amount: price.toLocaleString("pt-br", { minimumFractionDigits: 2 }).replace(",", "").replace(".", ""), // Replace with the actual amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: process.env.STRIPE_OK_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });


    const invoicesX = await Invoices.findByPk(invoiceId);
    const invoiX = await invoicesX.update({
      id: invoiceId,
      stripe_id: sessionStripe.id
    });

    //console.log(sessionStripe);

    stripeURL = sessionStripe.url;

  }

  if (key_GERENCIANET_PIX_KEY) {

    const body = {
      calendario: {
        expiracao: 3600
      },
      valor: {
        original: price.toLocaleString("pt-br", { minimumFractionDigits: 2 }).replace(",", ".")
      },
      chave: process.env.GERENCIANET_PIX_KEY,
      solicitacaoPagador: `#Fatura:${invoiceId}`
    };

    try {

      pix = await gerencianet.pixCreateImmediateCharge(null, body);

      qrcode = await gerencianet.pixGenerateQRCode({
        id: pix.loc.id
      });



    } catch (error) {
      console.log(error);
      //throw new AppError("Validation fails", 400);
    }

  }

  const updateCompany = await Company.findOne();

  if (!updateCompany) {
    throw new AppError("Company not found", 404);
  }

  return res.json({
    ...pix,
    valorext,
    qrcode,
    stripeURL,
    mercadopagoURL,
    asaasURL,
  });


};


export const createWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schema = Yup.object().shape({
    chave: Yup.string().required(),
    url: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    throw new AppError("Validation fails", 400);
  }

  const { chave, url } = req.body;

  const body = {
    webhookUrl: url
  };

  const params = {
    chave
  };

  try {
    const gerencianet = Gerencianet(options);
    const create = await gerencianet.pixConfigWebhook(params, body);
    return res.json(create);
  } catch (error) {
    console.log(error);
  }
};

export const stripewebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { type } = req.params;
  const { evento } = req.body;

  //console.log(req.body);
  //console.log(req.params);

  if (req.body.data.object.id) {

    if (req.body.type === "checkout.session.completed") {

      const stripe_id = req.body.data.object.id;

      const invoices = await Invoices.findOne({ where: { stripe_id: stripe_id } });
      const invoiceID = invoices.id;

      const companyId = invoices.companyId;
      const company = await Company.findByPk(companyId);

      const expiresAt = new Date(company.dueDate);
      expiresAt.setDate(expiresAt.getDate() + 30);
      const date = expiresAt.toISOString().split("T")[0];

      if (company) {
        await company.update({
          dueDate: date
        });
        const invoi = await invoices.update({
          id: invoiceID,
          status: 'paid'
        });
        await company.reload();
        const io = getIO();
        const companyUpdate = await Company.findOne({
          where: {
            id: companyId
          }
        });

        try {

          const companyId = company.id
          const whatsapps = await ListWhatsAppsService({ companyId: companyId });
          if (whatsapps.length > 0) {
            whatsapps.forEach(whatsapp => {
              StartWhatsAppSession(whatsapp, companyId);
            });
          }
        } catch (e) {
          Sentry.captureException(e);
        }

        io.emit(`company-${companyId}-payment`, {
          action: 'CONCLUIDA',
          company: companyUpdate
        });
      }

    }

  }

  return res.json({ ok: true });

};


export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { type } = req.params;
  const { evento } = req.body;
  if (evento === "teste_webhook") {
    return res.json({ ok: true });
  }
  if (req.body.pix) {
    const gerencianet = Gerencianet(options);
    req.body.pix.forEach(async (pix: any) => {
      const detahe = await gerencianet.pixDetailCharge({
        txid: pix.txid
      });

      if (detahe.status === "CONCLUIDA") {
        const { solicitacaoPagador } = detahe;
        const invoiceID = solicitacaoPagador.replace("#Fatura:", "");
        const invoices = await Invoices.findByPk(invoiceID);
        const companyId = invoices.companyId;
        const company = await Company.findByPk(companyId);

        const expiresAt = new Date(company.dueDate);
        expiresAt.setDate(expiresAt.getDate() + 30);
        const date = expiresAt.toISOString().split("T")[0];

        if (company) {
          await company.update({
            dueDate: date
          });
          const invoi = await invoices.update({
            id: invoiceID,
            status: 'paid'
          });
          await company.reload();
          const io = getIO();
          const companyUpdate = await Company.findOne({
            where: {
              id: companyId
            }
          });

          io.emit(`company-${companyId}-payment`, {
            action: detahe.status,
            company: companyUpdate
          });
        }

      }
    });

  }

  return res.json({ ok: true });
};
