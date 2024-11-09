import React from "react";
import { Login } from "react-admin";

import loginConfig from './LoginConfig';

import DialogSetupSuperUser from "./DialogSetupSuperUser";

import LoginPage from "./LoginPage";

/**
 * LoginSetupPage
 * 
 * Renders first time setup when coming from /setup
 * 
 * @param props 
 * @returns 
 */
const LoginSetupPage = (props: any) => { 
  // Set isSetup if we're coming from the /setup URL
  // eslint-disable-next-line no-restricted-globals
  const setupPath = history.state?.usr?.nextPathname;
  const isSetup = setupPath?.startsWith("/setup");

  return <>
    {isSetup &&
      <Login backgroundImage={loginConfig.backgroundImage} className={loginConfig.className} {...props}>
        <DialogSetupSuperUser></DialogSetupSuperUser>
      </Login>
    }
    {!isSetup &&
      <LoginPage {...props} />
    }
  </>
};

export default LoginSetupPage;
