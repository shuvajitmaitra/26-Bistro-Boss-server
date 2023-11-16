const express = require("express");
const cors = require("cors");
require('dotenv').config()
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
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
    const cartCollection = client.db("BistroBossDB").collection("carts");



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