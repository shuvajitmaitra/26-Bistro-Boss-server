const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken")
require('dotenv').config()
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wyy6auz.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {


    const menuCollection = client.db("BistroBossDB").collection("menu");
    const usersCollection = client.db("BistroBossDB").collection("users");
    const cartCollection = client.db("BistroBossDB").collection("carts");
    // jwt related api
    app.post('/jwt', async (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })

    const verifyToken = (req, res, next) => {
      if (!req?.headers?.authorization) {
        return res.status(401).send({ message: "Unauthorized Access" })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: "Unauthorized Access" })
        }
        res.decoded = decoded
        next()
      })
    }

    // verify admin 
    const verifyAdmin = async (req, res, next) => {
      const email = res.decoded.email
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      isAdmin = user?.role === "admin"
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden access" })
      }
      next()
    }

    // admin check 
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email
      // if(email !== res?.decoded?.email){
      //   return res.status(403).send({message: "Forbidden access"})
      // }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let admin = false
      if (user) {
        admin = user?.role === "admin"
      }
      res.send({ admin })
    })
    // user related api
    app.post("/users", verifyToken, async (req, res) => {
      const users = req.body
      const query = { email: users.email }
      const existingUser = await usersCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null })
      }
      const result = await usersCollection.insertOne(users)
      res.send(result)
    })


    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })


    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/users/admin/:id', verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: "admin"
        }
      }

      const result = await usersCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })



    // menu related api
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray()
      res.send(result)
    })

    app.post("/menu", verifyToken, verifyAdmin, async (req, res) => {
      const data = req.body
      const result = await menuCollection.insertOne(data)
      res.send(result)
    })

    // single menu load
    app.get('/singleMenu/:id', async (req, res) => {
      const id = req.params.id
      console.log(id);
      const query = { _id: new ObjectId(id) }
      const result = await menuCollection.findOne(query)
      res.send(result)
    })
    // menu update
    app.patch('/menuUpdate/:id', async (req, res) => {
      const data = req.body
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: data?.name,
          category: data?.category,
          recipe: data?.recipe,
          price: data?.price,
          image: data.image,
        }
      }
      const result = await menuCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })

    // menu delete
    app.delete('/menuDelete/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await menuCollection.deleteOne(query)
      res.send(result)
    })

    app.post("/carts", async (req, res) => {
      const carts = req.body
      const result = await cartCollection.insertOne(carts)
      res.send(result)
    })
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await cartCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/cart/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    client.connect();
    client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    res.send(error)
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Crud is running...");
});

app.listen(port, () => {
  console.log(`Simple Crud is Running on port ${port}`);
});