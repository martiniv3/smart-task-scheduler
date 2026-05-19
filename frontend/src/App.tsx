import { useMemo, useState } from "react";

import {
  Button,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";

import { TasksPage } from "./pages/TasksPage";
import { AuthPage } from "./pages/AuthPage";
import { isAuthenticated, removeToken } from "./api/authStorage";

function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
        },
      }),
    [darkMode],
  );
  function handleLogout() {
    removeToken();
    setLoggedIn(false);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className={darkMode ? "dark-mode" : "light-mode"}>
        {!loggedIn ? (
          <AuthPage onLogin={() => setLoggedIn(true)} />
        ) : (
          <>
            <Box
              sx={{
                p: 2,
                display: "flex",
                gap: 2,
                justifyContent: {
                  xs: "center",
                  sm: "flex-end",
                },
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setDarkMode((value) => !value)}
              >
                {darkMode ? "Light Mode" : "Dark Mode"}
              </Button>

              <Button variant="outlined" onClick={handleLogout}>
                Logout
              </Button>
            </Box>

            <TasksPage />
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
