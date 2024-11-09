import { UserManager } from "oidc-client-ts";

import loginConfig from './LoginConfig';
import { api } from "../api/Api";
import { AuthProvider } from "react-admin-firebase/dist/misc/react-admin-models";
import { dataProvider } from "../api/DjDataProvider";

// Firebase
import { getAuth, signInWithEmailAndPassword, signOut, signInWithPopup, sendEmailVerification } from "firebase/auth";
import { GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, TwitterAuthProvider } from "firebase/auth";
import firebase from "firebase/compat/app";
import firebaseConfig from "./firebase/firebase.json";
import { UserProfile } from "../model/user-profile";
import { render } from "../api/Render";


class DashjoinAuthProvider implements AuthProvider {

  openIdConfig: any;

  /**
   * Returns UserManager of the current OpenID config
   * @returns UserManager
   */
  getUserManager() {

    this.openIdConfig = loginConfig?.openIdConfigs[this.getConfigIndex()];
    return new UserManager({
      authority: this.openIdConfig?.config.issuer as string,
      client_id: this.openIdConfig?.config.clientId as string,
      redirect_uri: this.openIdConfig?.config.redirectUri as string,
      response_type: "code",
      scope: this.openIdConfig?.config.scope,
      post_logout_redirect_uri: this.openIdConfig?.config.postLogoutRedirectUri as string,
      loadUserInfo: false
    });
  }

  /**
   * Sets the index of the OpenID config to use (if multiple configs are defined)
   * @param index 
   */
  setConfigIndex(index: number) {
    localStorage.setItem("openid-index", "" + index);
  }

  /**
   * Returns index of the current OpenID config
   * @returns index
   */
  getConfigIndex() {
    return Number(localStorage.getItem("openid-index") || 0);
  }

  getProfileFromToken = (tokenJson: string) => {
    const token = JSON.parse(tokenJson);
    if (token.type === "basic")
      return token;

    const jwt = JSON.parse(atob(token.id_token.split(".")[1]));
    return jwt;
  }

  cleanup() {
    // Remove the ?code&state from the URL
    window.history.replaceState(
      {},
      window.document.title,
      window.location.origin
    );
  }

  /**
   * Reads the user's profile and roles and sets the session state
   */
  async readProfile() {

    // clear cache
    api.clearCache()

    // Check the user's access rights upfront:
    // Try to read widgets table - if this is not allowed, user is known but is not active
    // TODO: handle this via user profile
    await api.get<any>("/rest/database/crud/config/Table/dj%2Fconfig%2Fwidget");

    const userProfile = await api.post<UserProfile>('/rest/service/profile', undefined);

    // console.log(userProfile)

    localStorage.setItem("roles", JSON.stringify(userProfile.roles));
    if (userProfile.email)
      localStorage.setItem("email", userProfile.email);
    localStorage.setItem('settings', JSON.stringify(userProfile.settings))

    const variable = userProfile.settings
    if (variable['on-login']) {
      await dataProvider.action(variable['on-login'], {
        roles: userProfile.roles,
        email: userProfile.email,
        variable,
        href: window.location.href,
        user: userProfile.username
      })
    }

    render.setProfileLoaded(true)
  }

  firebaseApp: firebase.app.App | undefined;

  getFirebase(): firebase.app.App {
    if (!this.firebaseApp) {
      this.firebaseApp = firebase.initializeApp(firebaseConfig);
    }
    return this.firebaseApp;
  }

  firebaseProviders: any = {
    google: GoogleAuthProvider,
    github: GithubAuthProvider,
    facebook: FacebookAuthProvider,
    twitter: TwitterAuthProvider,
  };

  sanitizeError(error: any) {
    console.log('error', error);
    // If we got an HTML error page:
    const errorStr = "" + error;
    if (errorStr.indexOf("<html") >= 0) {
      let errorMsg = "Login failed";
      if (errorStr.indexOf("ECONNREFUSED"))
        errorMsg = "Connection to Dashjoin service failed";

      return new Error(errorMsg);
    }
    // Cut off too long messages
    if (errorStr.length > 200) {
      return new Error(errorStr.substring(0, 200) + "...");
    }

    return error;
  }

  async login(args: any) {

    if (args.provider) {
      // Firebase social login provider
      const providerClass = this.firebaseProviders[args.provider];
      if (!providerClass)
        throw new Error(`Unknown login provider "${args.provider}"`);

      try {
        const instance = new providerClass();
        // Google: show consent/account choice screen
        if ("google" === args.provider)
          instance.setCustomParameters({ prompt: "consent" });

        this.getFirebase();
        const auth = getAuth();
        const cred = await signInWithPopup(auth, instance);

        await this.handleFirebaseLogin(cred);
        await this.readProfile()
        return true;
      } catch (error) {
        this.logout();
        throw this.sanitizeError(error);
      }
    }

    if (args.username && args.password) {

      if (args.username.indexOf("@") > 0) {
        // Firebase login
        this.getFirebase();
        const auth = getAuth();
        const cred = await signInWithEmailAndPassword(auth, args.username, args.password);

        // Force account activation/email verification
        if (!cred.user.emailVerified) {
          console.log("user", cred);
          await sendEmailVerification(cred.user);
          await this.logout();
          throw new Error("This account needs to be activated. Please check your e-mail");
        }

        await this.handleFirebaseLogin(cred);
      } else {
        // Local user login
        localStorage.setItem("token", JSON.stringify({
          type: "basic", name: args.username
        }));
        localStorage.setItem("auth-token", "Basic " + btoa(args.username + ":" + args.password));
      }

      try {
        await this.readProfile();
      } catch (error) {

        try {
          await this.logout();
        } catch (ignore) {
          // ignore any logout errors
        }

        throw this.sanitizeError(error);
      }

      return true;
    }
    // 1. Redirect to the issuer to ask authentication
    await this.getUserManager().signinRedirect();
    return; // Do not return anything, the login is still loading
  }

  private async handleFirebaseLogin(cred: any) {
    const user = cred.user;
    const id_token = await user.getIdToken();
    const profile = { id_token, ...user };
    localStorage.setItem("auth-firebase", "true");
    localStorage.setItem("token", JSON.stringify(profile));
    localStorage.setItem("auth-token", `Bearer ${id_token}`);
  }

  async logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("auth-token");
    localStorage.removeItem("roles");
    localStorage.removeItem('email')
    localStorage.removeItem('settings')
    sessionStorage.removeItem('variable')
    if (localStorage.getItem("openid")) {
      localStorage.removeItem("openid");
      const userManager = this.getUserManager();

      // Is a custom (manual) logoutRedirectUri set? Might be useful for SSO logout,
      // or for IdP where metadata does not have end_session_endpoint (i.e. auth0 default settings)
      if (this.openIdConfig?.config?.customEndSessionUri) {
        window.location.assign(this.openIdConfig?.config.customEndSessionUri);
      } else
        try {
          await userManager.signoutRedirect();
        } catch (error) {
          // We get an error "no end session endpoint" when the IDP's metadata does not contain
          // and "end_session_endoint" definition.
          // auth0 by default does not return it.
          // Customers need to contact auth0 support to enable:
          // https://auth0.com/docs/authenticate/login/logout/log-users-out-of-auth0
          console.warn("openId signout error", error);
        }
    }
    if (localStorage.getItem("auth-firebase")) {
      localStorage.removeItem("auth-firebase");
      console.log("firebase signout");

      this.getFirebase();
      const auth = getAuth();
      await signOut(auth);
    }

    return;
  }

  async checkError(error: any) {
    // TODO: check for auth errors still unreliable...
    console.warn('checkError', error);
    const msg = "" + error;
    if (msg.includes("status code 401") || msg.includes("Invalid username")) {
      console.warn('checkError reject');
      try {
        await this.logout();
      } catch (cerror) {
        console.warn('logout error', cerror);
      }
      Promise.reject();
    }
    return Promise.resolve();
  }

  checkAuth() {

    const token = localStorage.getItem("token");
    if (!token) {
      return Promise.reject();
    }

    // This is specific to the Google authentication implementation
    const jwt = this.getProfileFromToken(token);
    const now = new Date();

    return now.getTime() > jwt.exp * 1000
      ? Promise.reject()
      : Promise.resolve();
  }

  getPermissions() { return Promise.resolve(); }

  getIdentity() {
    const token = localStorage.getItem("token");
    const profile = token && this.getProfileFromToken(token);

    return Promise.resolve({
      id: profile.sub,
      fullName: profile.name,
      avatar: profile.picture,
    });
  }

  async handleCallback() {

    const user = await this.getUserManager().signinRedirectCallback();
    //console.log('signinRedirectCallback', user);
    if (user) {
      const profile = JSON.stringify(user);
      localStorage.setItem("token", profile);
      localStorage.setItem("auth-token", `Bearer ${user.id_token}`);

      const parsedProfile = this.getProfileFromToken(profile);
      localStorage.setItem("openid", parsedProfile.iss);

      try {
        await this.readProfile();
      } catch (error) {
        this.sanitizeError(error);

        return Promise.reject(error);
      }

      // redirectTo doesn't do anything?!
      // Remove the OpenID callback parameters in the URL:
      window.location.href = window.location.origin;
      // This will not be reached:
      return Promise.resolve({ redirectTo: '/' });
    }
    else {
      this.getUserManager().clearStaleState();
      return Promise.reject();
    }
  }
}

const authProvider = new DashjoinAuthProvider();

export default authProvider;
