import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import { CalendarToday, LoyaltyRounded } from "@material-ui/icons";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import EventIcon from "@material-ui/icons/Event";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from '@material-ui/icons/LocalAtm';
import BusinessIcon from '@material-ui/icons/Business';
import RotateRight from "@material-ui/icons/RotateRight";
import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import LoyaltyRoundedIcon from '@material-ui/icons/LoyaltyRounded';
import { Can } from "../components/Can";
import { socketConnection } from "../services/socket";
import { isArray } from "lodash";
import api from "../services/api";
import BorderColorIcon from '@material-ui/icons/BorderColor';
import ToDoList from "../pages/ToDoList/";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import { AllInclusive, AttachFile, BlurCircular, DeviceHubOutlined, Schedule } from '@material-ui/icons';
import usePlans from "../hooks/usePlans";

import MailOutlineIcon from "@material-ui/icons/MailOutline"; // Importe o ícone de e-mail
import SendIcon from "@material-ui/icons/Send"; // Importe o ícone de enviar
import ScheduleIcon from '@material-ui/icons/Schedule';
import Typography from "@material-ui/core/Typography";
import useVersion from "../hooks/useVersion";

import dashboard from "../assets/icons/dashboard.png";
import tickets from "../assets/icons/tickets.png";
import email from "../assets/icons/email.png";
import enviaremail from "../assets/icons/enviaremail.png";
import emailsenviados from "../assets/icons/emailsenviados.png";
import agendarenvio from "../assets/icons/agendarenvio.png";
import envioagendado from "../assets/icons/envioagendado.png";
import kanbam from "../assets/icons/kanbam.png";
import painelkanbam from "../assets/icons/painelkanbam.png";
import tagskanbam from "../assets/icons/tagskanbam.png";  
import respostarapida from "../assets/icons/respostarapida.png";
import contatos from "../assets/icons/contatos.png";
import tarefas from "../assets/icons/tarefas.png";
import agendamentos from "../assets/icons/agendamentos.png";
import tags from "../assets/icons/tags.png";
import chatinterno from "../assets/icons/chatinterno.png";
import ajuda from "../assets/icons/ajuda.png";
import campanhas from "../assets/icons/campanhas.png";
import listagem from "../assets/icons/listagem.png";
import listasdecontatos from "../assets/icons/listasdecontatos.png";
import configuracao from "../assets/icons/configuracao.png";
import informativo from "../assets/icons/informativo.png";
import apiicon from "../assets/icons/apiicon.png";
import usuarios from "../assets/icons/usuarios.png";
import filas from "../assets/icons/ajuda.png";
import conexao from "../assets/icons/conexao.png";
import financeiro from "../assets/icons/financeiro.png";
import config from "../assets/icons/config.png";
import empresas from "../assets/icons/empresas.png";
import integracoes from "../assets/icons/integracoes.png";
import arquivos from "../assets/icons/arquivos.png";
import prompt from "../assets/icons/prompt.png";

const useStyles = makeStyles((theme) => ({
  ListSubheader: {
    height: 26,
    marginTop: "-15px",
    marginBottom: "-10px",
  },
}));


function ListItemLink(props) {
  const { icon, primary, to, className } = props;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem button dense component={renderLink} className={className}>
        {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = (props) => {
  const classes = useStyles();
  const { drawerClose, collapsed } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false); const history = useHistory();
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);
  const [showKanban, setShowKanban] = useState(false);

  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const [openKanbanSubmenu, setOpenKanbanSubmenu] = useState(false);
  const [openEmailSubmenu, setOpenEmailSubmenu] = useState(false);
  const [version, setVersion] = useState(false);
  const { getPlanCompany } = usePlans();
  const { getVersion } = useVersion();

  useEffect(() => {
    async function fetchVersion() {
      const _version = await getVersion();
      setVersion(_version.version);
    }
    fetchVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("eshow")) {
      setShowEmail(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  async function fetchData() {

    if (window.location.pathname === "/login") return;

    const companyId = user.companyId;
    const planConfigs = await getPlanCompany(undefined, companyId);

    setShowCampaigns(planConfigs.plan.useCampaigns);
    setShowKanban(planConfigs.plan.useKanban)
    setShowOpenAi(planConfigs.plan.useOpenAi);
    setShowIntegrations(planConfigs.plan.useIntegrations);
    setShowSchedules(planConfigs.plan.useSchedules);
    setShowInternalChat(planConfigs.plan.useInternalChat);
    setShowExternalApi(planConfigs.plan.useExternalApi);
    setShowEmail(planConfigs.plan.useEmail);
  }

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const handleClickLogout = () => {
    //handleCloseMenu();
    handleLogout();
  };

  return (
    <div>
      <Can
        role={user.profile}
        perform={"drawer-service-items:view"}
        style={{
          overflowY: "scroll",
        }}
        no={() => (
          <>
            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20
              }}
              inset
              color="inherit">
              {i18n.t("mainDrawer.listTitle.service")}
            </ListSubheader>
            <>
              <div onClick={drawerClose}>
                <ListItemLink
                  to="/tickets"
                  primary={i18n.t("mainDrawer.listItems.tickets")}
                  icon={<img src={tickets} title="Atendimentos" alt="Atendimentos" style={{ width: '2em', height: '2em' }} />}
                />
                <ListItemLink
                  to="/quick-messages"
                  primary={i18n.t("mainDrawer.listItems.quickMessages")}
                  icon={<img src={respostarapida} title="Resposta Rápida" alt="Resposta Rápida" style={{ width: '1.7em', height: '1.7em' }} />}
                />
                {showKanban && (
                    <ListItemLink
                    to="/kanban"
                    primary="Kanban"
                    icon={<img src={kanbam} title="Kanbam" alt="Kanbam" style={{ width: '1.7em', height: '1.7em' }} />}
                  />          
                  )}
              </div>
            {showEmail && (
              <>
                <ListItem
                  button onClick={() => setOpenEmailSubmenu((prev) => !prev)}
                >
              <ListItemIcon>
              <img src={email} title="Email" alt="Email" style={{ width: '2em', height: '2em' }} />
              </ListItemIcon>
                <ListItemText primary={i18n.t('mainDrawer.listItems.email')} />
                {openEmailSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItem>
              <Collapse in={openEmailSubmenu} timeout="auto" unmountOnExit>
  <List component="div" disablePadding onClick={drawerClose}>
    <ListItem
      onClick={() => history.push('/Email')}
      button
      style={{ paddingLeft: 15 }}
    >
      <ListItemIcon>
      <img src={enviaremail} title="Enviar Email" alt="Enviar Email" style={{ width: '2em', height: '2em' }} />
      </ListItemIcon>
      <ListItemText primary={i18n.t("email.subMenus.send")} />
    </ListItem>
    <ListItem
      onClick={() => history.push('/EmailLis')}
      button
      style={{ paddingLeft: 15 }}
    >
      <ListItemIcon>
      <img src={emailsenviados} title="Emails Enviados" alt="Emails Enviados" style={{ width: '2em', height: '2em' }} />
      </ListItemIcon>
      <ListItemText primary={i18n.t("email.subMenus.sent")} />
    </ListItem>
    <ListItem
      onClick={() => history.push('/EmailScheduler')}
      button
      style={{ paddingLeft: 15 }}
    >
      <ListItemIcon>
      <img src={agendarenvio} title="Agendar Envio" alt="Agendar Envio" style={{ width: '2em', height: '2em' }} />
      </ListItemIcon>
      <ListItemText primary={i18n.t("email.subMenus.schedule")} />
    </ListItem>
    <ListItem
      onClick={() => history.push('/EmailsAgendado')}
      button
      style={{ paddingLeft: 15 }}
    >
      <ListItemIcon>
      <img src={envioagendado} title="Envio Agendado" alt="Envio Agendado" style={{ width: '2em', height: '2em' }} /> 
      </ListItemIcon>
      <ListItemText primary={i18n.t("email.subMenus.scheduled")} /> 
    </ListItem>
  </List>
</Collapse>
              </>
            )}
              <div onClick={drawerClose}>
                <ListItemLink
                  to="/todolist"
                  
                  primary={i18n.t("mainDrawer.listItems.tasks")}
                  icon={<img src={tarefas} title="Tarefas" alt="Tarefas" style={{ width: '1.7em', height: '1.7em' }} />}
                />
                <ListItemLink
                  to="/contacts"
                  
                  primary={i18n.t("mainDrawer.listItems.contacts")}
                  icon={<img src={contatos} title="Contatos" alt="Contatos" style={{ width: '1.7em', height: '1.7em' }} />}
                />
                {showSchedules && (
                  <>
                    <ListItemLink
                      to="/schedules"
                      
                      primary={i18n.t("mainDrawer.listItems.schedules")}
                      icon={<img src={agendamentos} title="Agendamentos" alt="Agendamentos" style={{ width: '1.7em', height: '1.7em' }} />}
                    />
                  </>
                )}
                <ListItemLink
                  to="/tags"
                  
                  primary={i18n.t("mainDrawer.listItems.tags")}
                  icon={<img src={tags} title="Tags" alt="Tags" style={{ width: '1.7em', height: '1.7em' }} />}
                />
                {showInternalChat && (
                  <>
                    <ListItemLink
                      to="/chats"
                      
                      primary={i18n.t("mainDrawer.listItems.chats")}
                      icon={
                        <Badge color="secondary" variant="dot" invisible={invisible}>
                          <img src={chatinterno} title="Chat Interno" alt="Chat interno" style={{ width: '1.7em', height: '1.7em' }} />
                        </Badge>
                      }
                    />
                  </>
                )}
                <ListItemLink
                  to="/helps"
                  
                  primary={i18n.t("mainDrawer.listItems.helps")}
                  icon={<img src={ajuda} title="Ajuda" alt="Ajuda" style={{ width: '1.7em', height: '1.7em' }} />}
                />
              </div>
            </>
          </>
        )}
      />

      <Can
        role={user.profile}
        perform={"drawer-admin-items:view"}
        yes={() => (
          <>
            <Divider />
            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20
              }}
              inset
              color="inherit">
              {i18n.t("mainDrawer.listTitle.management")}
            </ListSubheader>
            <div onClick={drawerClose}>
              <ListItemLink
                small
                to="/"
                primary="Dashboard"
                icon={<img src={dashboard} title="Dashboard" alt="Dashboard" style={{ width: '1.7em', height: '1.7em' }} />}
              />
            </div>
          </>
        )}
      />
      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            <Divider />
            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20
              }}
              inset
              color="inherit">
              {i18n.t("mainDrawer.listTitle.administration")}
            </ListSubheader>

            {showCampaigns && (
              <>
                <ListItem
                  button
                  onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
                >
                  <ListItemIcon>
                  <img src={campanhas} title="Campanhas" alt="Campanhas" style={{ width: '1.7em', height: '1.7em' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={i18n.t("mainDrawer.listItems.campaigns.menu")}
                  />
                  {openCampaignSubmenu ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </ListItem>
                <Collapse
                  style={{ paddingLeft: 15 }}
                  in={openCampaignSubmenu}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding onClick={drawerClose}>
                    <ListItem onClick={() => history.push("/campaigns")} button>
                      <ListItemIcon>
                      <img src={listagem} title="Listagem" alt="Listagem" style={{ width: '1.7em', height: '1.7em' }} />
                      </ListItemIcon>
                      <ListItemText primary={i18n.t("mainDrawer.listItems.campaigns.listing")} />
                    </ListItem>
                    <ListItem
                      onClick={() => history.push("/contact-lists")}
                      button
                    >
                      <ListItemIcon>
                      <img src={listasdecontatos} title="Listas de Contatos" alt="Listas de Contatos" style={{ width: '1.7em', height: '1.7em' }} />
                      </ListItemIcon>
                      <ListItemText primary={i18n.t("mainDrawer.listItems.campaigns.contactList")} />
                    </ListItem>
                    <ListItem
                      onClick={() => history.push("/campaigns-config")}
                      button
                    >
                      <ListItemIcon>
                      <img src={configuracao} title="Configurações" alt="Configurações" style={{ width: '1.7em', height: '1.7em' }} />
                      </ListItemIcon>
                      <ListItemText primary={i18n.t("mainDrawer.listItems.campaigns.config")} />
                    </ListItem>
                  </List>
                </Collapse>
              </>
            )}
            <div onClick={drawerClose}>
              {user.super && (
                <ListItemLink
                  to="/announcements"
                  primary={i18n.t("mainDrawer.listItems.annoucements")}
                  icon={<img src={informativo} title="Informativo" alt="Informativo" style={{ width: '1.7em', height: '1.7em' }} />}
                />
              )}
              {showOpenAi && (
                <ListItemLink
                  to="/prompts"
                  primary={i18n.t("mainDrawer.listItems.prompts")}
                  icon={<img src={prompt} title="Open.AI" alt="Open.AI" style={{ width: '1.7em', height: '1.7em' }} />}
                />
              )}

              {showIntegrations && (
                <ListItemLink
                  to="/queue-integration"
                  primary={i18n.t("mainDrawer.listItems.queueIntegration")}
                  icon={<img src={integracoes} title="Integrações" alt="Integrações" style={{ width: '1.7em', height: '1.7em' }} />}
                />
              )}
              <ListItemLink
                to="/connections"
                primary={i18n.t("mainDrawer.listItems.connections")}
                icon={
                  <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                    <img src={conexao} title="Conexão" alt="Conexão" style={{ width: '1.7em', height: '1.7em' }} />
                  </Badge>
                }
              />
              <ListItemLink
                to="/files"
                primary={i18n.t("mainDrawer.listItems.files")}
                icon={<img src={arquivos} title="Arquivos" alt="Arquivos" style={{ width: '1.7em', height: '1.7em' }} />}
              />
              <ListItemLink
                to="/queues"
                primary={i18n.t("mainDrawer.listItems.queues")}
                icon={<img src={filas} title="Filas e Chatbots" alt="Filas e Chatbots" style={{ width: '1.7em', height: '1.7em' }} />}
              />
              <ListItemLink
                to="/users"
                primary={i18n.t("mainDrawer.listItems.users")}
                icon={<img src={usuarios} title="Usuarios" alt="Usuarios" style={{ width: '1.7em', height: '1.7em' }} />}
              />
              {showExternalApi && (
                <>
                  <ListItemLink
                    to="/messages-api"
                    primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                    icon={<img src={apiicon} title="API" alt="API" style={{ width: '1.7em', height: '1.7em' }} />}
                  />
                </>
              )}
              <ListItemLink
                to="/financeiro"
                primary={i18n.t("mainDrawer.listItems.financeiro")}
                icon={<img src={financeiro} title="Financeiro" alt="Financeiro" style={{ width: '1.7em', height: '1.7em' }} />}
              />

              <ListItemLink
                to="/settings"
                primary={i18n.t("mainDrawer.listItems.settings")}
                icon={<img src={config} title="Configurações" alt="Configurações" style={{ width: '1.7em', height: '1.7em' }} />}
              />

              {user.super && (
                <ListItemLink
                  to="/companies"
                  primary={i18n.t("mainDrawer.listItems.companies")}
                  icon={<img src={empresas} title="Empresas" alt="Empresas" style={{ width: '1.7em', height: '1.7em' }} />}
                />)}
              { }
            </div>
          </>
        )}
      />
      <Divider />
      {!collapsed && <React.Fragment>
            <Typography style={{ fontSize: "12px", padding: "10px", textAlign: "right", fontWeight: "bold" }}>
            {i18n.t("mainDrawer.listItems.version")} : {version}
              </Typography>
            </React.Fragment>
            }

      <li>
        <ListItem
          button
          dense
          onClick={handleClickLogout}>
          <ListItemIcon><RotateRight /></ListItemIcon>
          <ListItemText primary={i18n.t("mainDrawer.listItems.exit")} />
        </ListItem>
      </li>
    </div>
  );
};

export default MainListItems;