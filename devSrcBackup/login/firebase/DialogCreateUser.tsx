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

import firebase from "firebase/compat/app";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function AlertDialog() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [passwd, setPasswd] = React.useState("");

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const [visible, setVisible] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleSubmit = async () => {
    console.log("creating account", email);
    try {
      const auth = firebase.auth();
      const cred = await auth.createUserWithEmailAndPassword(email, passwd);
      await cred.user?.sendEmailVerification();
      setOpen(false);
      setToastOpen(true);
      setToastMessage("Account created: "+email+". Please check your email to activate the account");
    } catch (error: any) {
      console.warn(error);
      setToastOpen(true);
      setToastMessage("Account creation failed: "+error.message);
    }
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
        <DialogTitle id="alert-dialog-title">Register New User</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Enter your E-Mail and initial password.<br/>You will receive an activation link.
          </DialogContentText>
          <TextField
            id="email"
            label="E-Mail"
            type="email"
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