const express = require('express');
const app = express();
require("dotenv").config();
const cors = require('cors');
const port = 5000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());


const admin = require("firebase-admin");

const serviceAccount = require(process.env.FIREBASE_ADMINFILE);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const { MongoClient, ObjectId } = require('mongodb');
const { getAuth } = require('firebase-admin/auth');

const uri = "mongodb+srv://ecomarceOne:Bo5Idf1vnoGl4Fet@realproject.sdmvcpx.mongodb.net/?appName=realProject";

const client = new MongoClient(uri);

client.connect()
  .then(() => {
    console.log("Successfully connected to MongoDB Atlas!");

    const database = client.db("eComarce");
    const cartCollection = database.collection("cart");

    app.post('/addcart', (req, res) => {
      const product = req.body;
      cartCollection.insertOne(product)
        .then(result => {
          res.json({ meassage: 'successfully added' })
        }).catch(err => {
          res.status(500).json({ meassage: 'failed' })
        })
    });
    app.get('/cartproducts', (req, res) => {
      const authHeader = req.headers.authorization;
      const email = req.query.email;
      console.log(email);
      if (!authHeader || authHeader === "Bearer null") {
        return res.status(401).json({ message: 'failed' });
      }
      const idToken = authHeader.split(" ")[1];
      getAuth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          console.log(decodedToken);
           cartCollection.find({email:email}).toArray().then(docs => {
           res.json(docs)
          }).catch(err => {
          res.status(404).json({ meassage: 'some error' })
         })
          
        })
      
    })
    app.post('/admin', (req, res)=> {
      const authHeader = req.headers.authorization;;
      if (!authHeader || authHeader === "Bearer null") {
        return res.status(401).json({ message: 'failed' });
      }
      const idToken = authHeader.split(" ")[1];
      getAuth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          console.log(decodedToken);
           if(decodedToken.admin){
            res.json({admin:true});
           }
          }).catch(err => {
          res.status(404).json({ meassage: 'some error' })
         })
          
        })
    app.delete('/deletecart', (req, res) => {
      const { id } = req.body;
      console.log(id)
      cartCollection.deleteOne({ _id: new ObjectId(id) }).then(result => {
        res.json(result.deletedCount > 0)
        console.log(result)
      }).catch(err => {
        res.status(500).json({ meassage: 'failed' })
      })
    })

  })
  .catch(err => {
    console.error("Connection error:", err);
  })

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});