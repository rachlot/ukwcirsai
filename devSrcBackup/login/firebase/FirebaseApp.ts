// The singleton Firebase app instance

import firebase from 'firebase/compat/app';

import config from './firebase.json';
  
export const firebaseApp = firebase.initializeApp(config);
//console.log('firebase init', firebaseApp.name);
