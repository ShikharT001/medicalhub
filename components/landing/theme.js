import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#00856f",
      dark: "#00695a",
      light: "#34b49a",
    },
    secondary: {
      main: "#0c4f68",
    },
    background: {
      default: "#f4fbfa",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f2f3a",
      secondary: "#4d6a74",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Segoe UI, sans-serif",
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #d7ebe7",
          boxShadow: "0 14px 34px rgba(12, 51, 62, 0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 20,
        },
      },
    },
  },
});

export default theme;
