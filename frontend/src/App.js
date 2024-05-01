import React, { useState, useEffect, useMemo } from "react";

import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";

import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import useSettings from "./hooks/useSettings";
import Favicon from "react-favicon";
import logoFavicon from "./assets/vector/favicon.svg";

import Routes from "./routes";

const queryClient = new QueryClient();

const App = () => {
    const [locale, setLocale] = useState();
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const preferredTheme = window.localStorage.getItem("preferredTheme");
    const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");
    const [primaryColorLight, setPrimaryColorLight] = useState("#0000FF");
    const [primaryColorDark, setPrimaryColorDark] = useState("#39ACE7");
    const [appLogoLight, setAppLogoLight] = useState("");
    const [appLogoDark, setAppLogoDark] = useState("");
    const [appLogoFavicon, setAppLogoFavicon] = useState("");
    const [appName, setAppName] = useState("");
    const { getPublicSetting } = useSettings();
  
    const colorMode = useMemo(
      () => ({
        toggleColorMode: () => {
          setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
        },
        setPrimaryColorLight: (color) => {
          setPrimaryColorLight(color);
        },
        setPrimaryColorDark: (color) => {
          setPrimaryColorDark(color);
        },
        setAppLogoLight: (file) => {
          setAppLogoLight(file); 
        },
        setAppLogoDark: (file) => {
          setAppLogoDark(file); 
        },
        setAppLogoFavicon: (file) => {
          setAppLogoFavicon(file);
        },
        setAppName: (name) => {
          setAppName(name);
        }
      }),
      []
    );

    const theme = useMemo(() => createTheme(
        {
            scrollbarStyles: {
                "&::-webkit-scrollbar": {
                    width: '8px',
                    height: '8px',
                    borderRadius: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                    boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
                    backgroundColor: mode === "light" ? primaryColorLight : primaryColorDark,
                    borderRadius: "8px",
                },
            },
            scrollbarStylesSoft: {
                "&::-webkit-scrollbar": {
                    width: "8px",
                    borderRadius: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: mode === "light" ? "#00bfff" : "#fff !important",
                    borderRadius: "8px",
                },
            },
            palette: {
      type: mode,
      primary: { main: mode === "light" ? primaryColorLight : primaryColorDark },
      textPrimary: mode === "light" ? primaryColorLight : primaryColorDark,
      borderPrimary: mode === "light" ? primaryColorLight : primaryColorDark,
                    dark: { main: mode === "light" ? "#1C2E36" : "#ffffff " },
                    light: { main: mode === "light" ? "#F3F3F3" : "#1C2E36" },
                    tabHeaderBackground: mode === "light" ? "#FFFFFF" : "#1C2E36", //Menu Atendimentos (Abertas, Grupos...)
                    optionsBackground: mode === "light" ? "#F1F5F5" : "#0F1B20", //Aba Atendimentos (Novos, Todos, Filas)
                    chatlist: mode === "light" ? "#1C2E36" : "#1C2E36", //
                    boxchatlist: mode === "light" ? "#ededed" : "#1C2E36", // ONDE???????????
                    messageIcons: mode === "light" ? "ff0378" : "#F3F3F3",
                    inputBackground: mode === "light" ? "#FFFFFF" : "#1C2E36", // ONDE???????????
                    options: mode === "light" ? "#FFFFFF" : "#1C2E36", //Configurações (Abas: Integrações IXC ASAAS...)
                    fontecor: mode === "light" ? primaryColorLight : primaryColorDark,
                    fancyBackground: mode === "light" ? "#F1F5F5" : "#0F1B20", //Cor Fundo Principal Escura
                    bordabox: mode === "light" ? "#F1F5F5" : "#0F1B20", //Borda acima de onde digita a mensagem
                    newmessagebox: mode === "light" ? "#F1F5F5" : "#0F1B20", //Em torno da Caixa de onde digita a mensagem
                    inputdigita: mode === "light" ? "#FFFFFF" : "#1C2E36", //Caixa de Texto Atendimento onde digita a mensagem
                    contactdrawer: mode === "light" ? "#fff" : "#1C2E36",
                    announcements: mode === "light" ? "#ededed" : "#1C2E36",
                    login: mode === "light" ? "#fff" : "#1C1C1C",
                    announcementspopover: mode === "light" ? "#fff" : "#1C2E36",
                    boxlist: mode === "light" ? "#ededed" : "#1C2E36",
                    total: mode === "light" ? "#fff" : "#1C2E36",
                    barraSuperior: mode === "light" ? primaryColorLight : "linear-gradient(to right, #31363d, #000000, #31363d)",//Barra Horizontal
                    boxticket: mode === "light" ? "#EEE" : "#1C2E36",
                    campaigntab: mode === "light" ? "#ededed" : "#1C2E36",
                    corTextobarra: mode === "light" ? "#0F1B20" : "#FFFFFF",
                    corTextosuporte: mode === "light" ? "#0F1B20" : "#FFFFFF",
                    barraLateral: mode === "light" ? "linear-gradient(to right, #F1F5F5, #FFFFFF, #F1F5F5)" : "linear-gradient(to right, #0F1B20, #0F1B20, #0F1B20)", //Barra Vertical
                    fundologoLateral: mode === "light" ? "linear-gradient(to right, #0F1B20, #0F1B20, #0F1B20)" : "linear-gradient(to right, #0F1B20, #0F1B20, #0F1B20)", //Fundo Logo Superior
                    listaInterno: mode === "light" ? "#E7ECEE" : "#2E4C59",
                    corIconesbarra: mode === "light" ? "#1C2E36" : "#00bfff",
    
                background: {
                        default: mode === "light" ? "#FFFFFF" : "#0F1B20",
                        paper: mode === "light" ? "#FFFFFF" : "#1C2E36",
                    },
            },
            mode,
            appLogoDark,
            appLogoLight,
            appLogoFavicon,
            appName,
        },
        locale
     ), [appLogoLight, appLogoDark, appLogoFavicon, appName, locale, mode, primaryColorDark, primaryColorLight]);

    useEffect(() => {
      const i18nlocale = localStorage.getItem("i18nextLng");
      const browserLocale = i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);
    
      if (browserLocale === "ptBR") {
        setLocale(ptBR);
      }
  }, []);

  useEffect(() => {
      window.localStorage.setItem("preferredTheme", mode);
  }, [mode]);
  
  useEffect(() => {
    getPublicSetting("primaryColorLight").then((color) => { color && setPrimaryColorLight(color) });
    getPublicSetting("primaryColorDark").then((color) => { color && setPrimaryColorDark(color) });
    getPublicSetting("appLogoLight").then((file) => { file && setAppLogoLight(file)});
    getPublicSetting("appLogoDark").then((file) => { file && setAppLogoDark(file)});
    getPublicSetting("appLogoFavicon").then((file) => { file && setAppLogoFavicon(file)});
      getPublicSetting("appName").then((name) => { setAppName(name || "AutoAtende")});
  }, [getPublicSetting]);
  
  return (
    <>
    <Favicon url={ ((appLogoFavicon) ? process.env.REACT_APP_BACKEND_URL + "/public/" + theme.appLogoFavicon : logoFavicon ) } />
      <ColorModeContext.Provider value={{ colorMode }}>
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
              <Routes />
          </QueryClientProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
      </>
  );
};

export default App;