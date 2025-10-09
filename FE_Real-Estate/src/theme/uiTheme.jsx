import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  shape: { borderRadius: 10 }, // theo yêu cầu radius ~10px
  typography: {
    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
  },
  palette: { primary: { main: "#1d4ed8" } },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 20 } } },
    MuiCard: { styleOverrides: { root: { border: "1px solid #d6e0ff" } } },
  },
});

export default theme;
