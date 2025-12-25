const express = require('express');
const app = express();
const cloudinary = require('cloudinary').v2;
require("dotenv").config();
const cors = require('cors');
const port = process.env.PORT || 5000;


app.use(express.json({limit:'200mb'}));
app.use(express.urlencoded({limit:'200mb', extended: true }));
app.use(express.static('public'));
app.use(cors());


const admin = require("firebase-admin");


const serviceAccount = require(process.env.FIREBASE_ADMINFILE);

 // Configuration
    cloudinary.config({ 
        cloud_name: 'dujdr2tly', 
        api_key: '619283978744262', 
        api_secret: 'v4UDZmmAyH6w_euvc9pL2m4fPHA' // Click 'View API Keys' above to copy your API secret
    });

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
    const productsCollection = database.collection("productsCollection")
    const cartCollection = database.collection("cart");
    const userCollection = database.collection("userCollection");
    const checkOut = database.collection("checkout");

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
          cartCollection.find({ email: email }).toArray().then(docs => {
            res.json(docs)
          }).catch(err => {
            res.status(404).json({ meassage: 'some error' })
          })

        })

    })
    app.post('/admin', (req, res) => {
      const authHeader = req.headers.authorization;;
      if (!authHeader || authHeader === "Bearer null") {
        return res.status(401).json({ message: 'failed' });
      }
      const idToken = authHeader.split(" ")[1];
      getAuth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          console.log(decodedToken);
          if (decodedToken.admin) {
            res.json({ admin: true });
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
    app.post('/userCollection', (req, res) => {
       const user = req.body;
        console.log(user);
        const filter = userCollection.findOne({ uid: user.uid })
       .then(check => {
         if (!check) {
           userCollection.insertOne(user)
        .then(result => { res.json({ userMessage: 'successfully' }) })
        .catch(err => {
           res.status(500).json({ userMessage: 'failed' }); }) 
          } else { res.status(500).json({ message: 'allrewdy have user' }); }
         })
          .catch(err => { res.status(500).json({ message: 'failed' }) }) })
    app.post("/checkout", (req, res) => {
      const { dataSent, pd } = req.body;
      console.log(pd)
      
      const order = {
        order:pd.map(p => ({
        productId:p.id,
        productDes:p.des,
        productName:p.name,
        productQuantity:p.quantity,
        productPrice:p.price,
        productImg:p.img,
        email:dataSent.email,
        date:new Date(),
        firstName:dataSent.firstName,
        lastName:dataSent.lastName,
        address:dataSent.address,
        city:dataSent.city,
        phoneNumber:dataSent.phoneNumber,
        uid:dataSent.uid,
       }))
      }
      console.log(order)
      checkOut.insertOne(order).then(result => {
        res.json({ message: 'successful' })
      }).catch(err => {
        res.status(500).json({ message: 'failed' });
      })
    })

app.get('/checkoutuser', (req, res) => {
  checkOut.find({}).toArray()
    .then(allOrders => {
      // সব uid বের করুন
      const allUids = allOrders.flatMap(order => order.order.map(item => item.uid));

      // user collection থেকে filter করুন
      return userCollection.find({ uid: { $in: allUids } }).toArray();
    })
    .then(users => {
      // সব matching users পাঠান
      res.json(users);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch users' });
    });
});
app.get('/checkoutproducts', (req, res)=> {
  const email = req.query.email;
  console.log(email)
  checkOut.find({"order.email":email}).toArray()
  .then(document => {
    res.json(document)
  })
  .catch(err => {
    res.status(500).json({message:'failed'})
  })
})

app.post('/addproduct', (req, res)=> {
  console.log("hit req");
  const {image, price, name, des} = req.body;
  console.log(image, price, name, des)

  const uploadImage = cloudinary.uploader.upload(image, {
    resource_type:"auto"
  }).then(result => {
    const url = result.secure_url;
    const product = {
      name:name,
      price:price,
      img:url,
      quantity:1,
      des:des
    }
    return productsCollection.insertOne(product);

  }).then(insertResult => {
     res.json({message:"success"})
  }).catch(err => {
    res.status(400).json({message:"failed to upload product.."})
  })


})

app.delete('/deleteCartProductAfterCartCheckout', (req, res)=> {
  const email = req.body.logInEmail;
  console.log('delete email', email);
  cartCollection.deleteMany({email:email})
  .then(result => {
    res.json({message:'delete success..!'})
  }).catch(err => {
    res.json({message:'delete error..!'})
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