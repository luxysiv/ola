import React, { useMemo, useState, useEffect, createContext, useContext } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

const STORAGE_KEY = "hdophim-color-mode";

function Root() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  // Nếu người dùng đã từng chọn thủ công, ưu tiên lựa chọn đó.
  // Nếu chưa, mặc định theo hệ thống.
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return prefersDarkMode ? "dark" : "light";
  });

  // Khi hệ thống đổi sáng/tối mà người dùng chưa từng tự chọn, tự động cập nhật theo hệ thống.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setMode(prefersDarkMode ? "dark" : "light");
    }
  }, [prefersDarkMode]);

  const colorMode = useMemo(() => ({
    toggleColorMode: () =>
      setMode((prev) => {
        const next = prev === "light" ? "dark" : "light";
        localStorage.setItem(STORAGE_KEY, next); // từ giờ ưu tiên lựa chọn thủ công
        return next;
      }),
    mode,
  }), [mode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#e50914" },
          secondary: { main: "#f5a623" },
          background: {
            default: mode === "dark" ? "#0a0a0f" : "#f0f0f5",
            paper: mode === "dark" ? "#141420" : "#ffffff",
          },
          text: {
            primary: mode === "dark" ? "#e8e8f0" : "#111122",
            secondary: mode === "dark" ? "#8888aa" : "#555577",
          },
          divider: mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
        },
        typography: {
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          h4: { fontWeight: 800, letterSpacing: "-0.5px" },
          h5: { fontWeight: 700 },
          h6: { fontWeight: 600 },
        },
        shape: { borderRadius: 10 },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                borderRadius: 10,
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: { fontWeight: 500 },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}
