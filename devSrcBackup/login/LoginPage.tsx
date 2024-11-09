import React from "react";
import { Login } from "react-admin";

import LoginForm from "./LoginForm";

import loginConfig from './LoginConfig';
import AuthCallback from "./AuthCallback";

/**
 * LoginPage
 * 
 * Detects OpenID login callback when code=XXX and state=XXX parameters are present in the URL
 * 
 * @param props 
 * @returns 
 */
const LoginPage = (props: any) => window.location.href.indexOf("code=")>=0
  && window.location.href.indexOf("state=")>=0 ? (
  <AuthCallback></AuthCallback>
) : (
  <Login backgroundImage={loginConfig.backgroundImage} className={loginConfig.className} {...props}>
    <LoginForm {...props} />
  </Login>
);

export default LoginPage;
