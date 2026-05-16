import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { loginUser, registerUser } from "../api/authApi";
import { saveToken } from "../api/authStorage";

type AuthPageProps = {
  onLogin: () => void;
};

export function AuthPage({ onLogin }: AuthPageProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    try {
      setError("");

      if (isRegisterMode) {
        await registerUser(email, password);
      }

      const result = await loginUser(email, password);

      saveToken(result.token);
      onLogin();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";

      setError(message);
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Smart Task Scheduler
            </Typography>

            <Typography variant="h6" gutterBottom>
              {isRegisterMode ? "Register" : "Login"}
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <Typography color="error">{error}</Typography>}

              <Button variant="contained" onClick={handleSubmit}>
                {isRegisterMode ? "Register" : "Login"}
              </Button>

              <Button
                variant="text"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
              >
                {isRegisterMode
                  ? "Already have an account? Login"
                  : "Need an account? Register"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
