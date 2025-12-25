require("dotenv").config();
var admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");

var serviceAccount = require(process.env.FIREBASE_ADMINFILE);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});




const uid = 'TaMRR3VIuRgaA8UhN1L3ChDSP562';

getAuth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('admin created..')
  });