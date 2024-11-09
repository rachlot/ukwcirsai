import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
} from "@mui/material"

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { api } from "../api/Api";

export default function SetupDialog() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [passwd, setPasswd] = React.useState("");

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const [visible, setVisible] = React.useState(false);

  // Open dialog by default
  setTimeout( ()=>setOpen(true) );

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    // Reload page to get out of setup mode
    window.location.reload();
  };
  const handleSubmit = async () => {
    // Handle first super user setup:
    // Only username (no email) is given
    if (email.indexOf("@")<0) {
      return createInitialSuperUser();
    }

    setToastOpen(true);
    setToastMessage("Account creation failed: '@' not allowed in username");
  };

  /**
   * Create initial super user.
   * Only possible one time in a fresh/empty system.
   * @returns 
   */
  const createInitialSuperUser = async () => {
    try {
      const res = await api.post('/rest/info/createuser',
        { username: email, password: passwd, roles: ['admin'] });

      console.log('User creation', res);
    }
    catch (e) {
      console.log('User creation error', e);
      setToastOpen(true);
      setToastMessage('The super user could not be created.\nNote that a super user can only be created in an empty system after first setup.\nIf you are using the dashjoin installer and want to start over, delete the folder %USERPROFILE%\\.dashjoin (Windows) or $HOME/.dashjoin (Linux, MacOS).');
      return;
    }

    // TODO: use nice looking screen...
    // eslint-disable-next-line no-restricted-globals
    confirm('The super user was created. You can now log in.\n\n' +
      'Note that it is recommended to use this user temporarily to set up the primary login options, like\n' +
      ' - Social User login (Facebook, Google, etc.)\n' +
      ' - Enterprise Login (OpenID, SAML or OAuth 2.0, like Azure Active Directory, AWS Identity, or Okta)\n' +
      ' - Email/Password based login\n');
    // Reload to login screen:
    window.location.reload();
  };

  const handleOnChange = (event:any) => {
    const email = event.target.value;
    setEmail(email);
  };
  const handleOnChangePwd = (event:any) => {
    const pwd = event.target.value;
    setPasswd(pwd);
  };

  const handleToastClose = () => {
    setToastOpen(false);
    setToastOpen(false);
  };

  const handleVisibleClick = () => {
    setVisible(!visible);
  };

  return (
    <div>
      <Button variant="text" onClick={handleClickOpen} style={{width: '100%'}}>
        New User
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Setup Super User</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>Enter username and password for the initial Super User.<br/>
            This only works for first time setup in fresh systems</span>
          </DialogContentText>
          <TextField
            id="email"
            label="Username"
            type="text"
            style={{width: '100%'}}
            onChange={handleOnChange}
          />
          { false && 
          <TextField
            id="name"
            label="Name"
            type="text"
            style={{width: '100%'}}
            onChange={handleOnChange}
          />
          }
          <TextField
            id="password"
            label="Password"
            type={visible ? "text" : "password"}
            style={{width: '100%'}}
            onChange={handleOnChangePwd}

            InputProps={{
              endAdornment: (
                  <InputAdornment position="end">
                      <IconButton
                          onClick={handleVisibleClick}
                          size="large"
                      >
                          {visible ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                  </InputAdornment>
              ),
          }}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" autoFocus>
            Create Account
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={toastOpen}
        onClose={handleToastClose}
        autoHideDuration={6000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        message={toastMessage}
      ></Snackbar>
    </div>
  );
}
