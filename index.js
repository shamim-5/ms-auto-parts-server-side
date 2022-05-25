const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

//MIDDLEWARE
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.it4et.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("manufacturer_website").collection("services");
    const reviewCollection = client.db("manufacturer_website").collection("reviews");
    const orderCollection = client.db("manufacturer_website").collection("orders");

    // get services collection data
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // get reviews collection data
    app.get("/review", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // get single service
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    })

    // post order that was confirmed by user
    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send({ success: true, result });
    })

  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World !");
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
