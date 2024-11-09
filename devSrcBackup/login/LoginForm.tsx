import { Button, CardContent, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { LoginForm, useLogin, useNotify } from "react-admin";
import { Legal } from "../components/Legal";
import authProvider from "./AuthProvider";
import loginConfig from "./LoginConfig";
import CreateUserButton from "./firebase/DialogCreateUser";
import ForgotPasswordButton from "./firebase/DialogPasswordReset";
import { firebaseApp } from "./firebase/FirebaseApp";

const LoginFormEx = (props: any) => {
  const [loading, setLoading] = useState(false);
  const login = useLogin();
  const notify = useNotify();
  const timeout = false; //useTimeout(5000, "mytimer");

  firebaseApp.auth();

  const handleLogin = async (info: any) => {
    if (info.key)
      authProvider.setConfigIndex(info.key);
    setLoading(true);
    try {
      await login(info); // Do not provide code, just trigger the redirection
    } catch (error) {
      // Handle errors from AuthProvider (like Firebase popup-closed etc)
      setLoading(false);
      notify((error as Error).message, { type: 'error' });
    }
  };

  if (timeout) {
    handleLogin({ key: 0 });
    return <div></div>;
  }

  const gp = () => handleLogin(JSON.parse(atob('eyJ1c2VybmFtZSI6Imd1ZXN0QGRhc2hqb2luLmNvbSIsInBhc3N3b3JkIjoiSS5hbS5ndWVzdCEifQ==')))

  const emailLoginEnabled = loginConfig.emailLoginEnabled || window.location.href.endsWith('?admin')

  useEffect(() => {
    if (!emailLoginEnabled)
      if (!loginConfig.providers)
        if (!loginConfig.openIdConfigs)
          if (loginConfig.guestLoginEnabled)
            gp()
  }, []);

  const providers = loginConfig.providers && loginConfig.providers.split(" ");

  return (
    <div>
      <Legal />
      <div style={{ textAlign: "center" }}>{loginConfig.signInTabText}</div>

      {emailLoginEnabled && (
        <div>
          <LoginForm {...props}></LoginForm>
          {loginConfig.passwordResetEnabled && <ForgotPasswordButton  {...props}></ForgotPasswordButton>}
          {loginConfig.registrationEnabled && <CreateUserButton  {...props}></CreateUserButton>}
        </div>
      )}
      <CardContent>
        {providers && (providers).map((provider: string) =>
          <div key={provider} style={{ paddingTop: "5px" }}><Button
            type="button"
            color="primary"
            variant="contained"
            onClick={() => handleLogin({ provider })}
            disabled={loading}
            fullWidth
          >
            {loading && (
              <CircularProgress sx={{ marginRight: 1 }} size={18} thickness={2} />
            )}
            {provider}
          </Button><br />
          </div>
        )}

        {Object.entries(loginConfig.openIdConfigs || {}).map(([key, config]: [any, any]) =>
          <div key={key} style={{ paddingTop: "5px" }}><Button
            type="button"
            color="primary"
            variant="contained"
            onClick={() => handleLogin({ key })}
            disabled={loading}
            fullWidth
          >
            {loading && (
              <CircularProgress sx={{ marginRight: 1 }} size={18} thickness={2} />
            )}
            {config?.name}
          </Button><br />
          </div>
        )}
        {loginConfig.guestLoginEnabled && <div style={{ paddingTop: "5px" }}><Button
          type="button"
          color="primary"
          variant="contained"
          onClick={gp}
          disabled={loading}
          fullWidth
        >
          {loading && (
            <CircularProgress sx={{ marginRight: 1 }} size={18} thickness={2} />
          )}
          Login as Guest
        </Button><br />
        </div>
        }
      </CardContent>
    </div>
  );
};

export default LoginFormEx;