import { useState } from "react";
import { Button, Box } from "@mui/material";

import { TasksPage } from "./pages/TasksPage";
import { AuthPage } from "./pages/AuthPage";
import { isAuthenticated, removeToken } from "./api/authStorage";

function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  function handleLogout() {
    removeToken();
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return <AuthPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: {
            xs: "center",
            sm: "flex-end",
          },
        }}
      >
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <TasksPage />
    </>
  );
}

export default App;
