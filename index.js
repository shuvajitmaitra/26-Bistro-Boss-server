const express = require("express");
const cors = require("cors");
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

    // user related api
    app.post("/users", async(req, res)=>{
      const users = req.body
      const query = {email: users.email}
      const existingUser = await usersCollection.findOne(query)
      if(existingUser){
        return res.send({message: "user already exist", insertedId: null})
      }
      const result = await usersCollection.insertOne(users)
      res.send(result)
    })


    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray()
      res.send(result)
    })
    
    app.post("/carts", async(req, res)=>{
      const carts = req.body
      const result = await cartCollection.insertOne(carts)
      res.send(result)
    })
    app.get("/carts", async(req, res)=>{
      const email = req.query.email;
      const query = {email: email}
      const result = await cartCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/cart/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    client.connect();
    client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Crud is running...");
});

app.listen(port, () => {
  console.log(`Simple Crud is Running on port ${port}`);
});