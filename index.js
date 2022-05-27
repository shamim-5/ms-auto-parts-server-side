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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("manufacturer_website").collection("services");
    const reviewCollection = client.db("manufacturer_website").collection("reviews");
    const orderCollection = client.db("manufacturer_website").collection("orders");
    const userCollection = client.db("manufacturer_website").collection("users");
    const addProductCollection = client.db("manufacturer_website").collection("products");

    // put method for userCollection where keep user data
    // generate token and send client to set localStorage
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
      res.send({ result, token });
    });

    // get services collection data
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // get added products addedProducts =>
    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = addProductCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //POST => addProduct => addProductCollection
    app.post("/product", async (req, res) => {
      // console.log(req.body);
      const products = req.body;
      const result = await addProductCollection.insertOne(products);
      res.send({ success: true, result });
    });

    // get user review  => myReview
    // app.get("/review", verifyJWT, async (req, res) => {
    //   const userEmail = req.query.email;
    //   if (userEmail) {
    //     const query = { email: userEmail };
    //     const review = await reviewCollection.find(query).toArray();
    //     return res.send(review);
    //   } else {
    //     return res.status(403).send({ message: "forbidden access" });
    //   }
    // });

    // get reviews collection data
    app.get("/review", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // post review that was confirmed by user => myReview
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send({ success: true, result });
    });

    // get single service
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // DELETE myOrder => order delete on onclick
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // DELETE manageProduct => product delete on onclick
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await addProductCollection.deleteOne(query);
      res.send(result);
    });

    // myOrder => get user data filter by user email from order collection
    app.get("/order", verifyJWT, async (req, res) => {
      const userEmail = req.query.email;
      if (userEmail) {
        const query = { email: userEmail };
        const orders = await orderCollection.find(query).toArray();
        return res.send(orders);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    // 1. allUser => get all user
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // 3. after set admin role get data from "/user/admin/:email"
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // 2. UserRole =>  get user email from useAuthState
    // user find email and set user.role = "admin"
    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount) {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    });

    // post order that was confirmed by user =>purchaseModal
    app.post("/order", async (req, res) => {
      const order = req.body;
      const query = { partsName: order.partsName, email: order.email };
      const exists = await orderCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, order: exists });
      }
      const result = await orderCollection.insertOne(order);
      return res.send({ success: true, result });
    });
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
