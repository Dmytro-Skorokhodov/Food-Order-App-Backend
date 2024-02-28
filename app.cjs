const fs = require("fs").promises;
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const app = express();
const pg = require("pg");
require("dotenv/config");

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

app.get("food-order-app-backend-smoky.vercel.app/meals", async (req, res) => {
  // const meals = await fs.readFile("./data/available-meals.json", "utf8");
  const meals = await pool.query("SELECT * FROM meals;");
  const data = meals.rows;
  res.json(data);
});

app.post("https://food-order-app-backend-smoky.vercel.app/orders", async (req, res) => {
  const orderData = req.body.order;
  console.log(orderData);

  if (orderData.items === null || orderData.items.length === 0) {
    return res.status(400).json({
      message:
        "Missing meals in order, please consider adding some meals before send an order.",
    });
  }

  if (
    orderData.email === null ||
    !orderData.email.includes("@") ||
    orderData.name === null ||
    orderData.name.trim() === "" ||
    orderData.street === null ||
    orderData.street.trim() === "" ||
    orderData["postal-code"] === null ||
    orderData["postal-code"].trim() === "" ||
    orderData.city === null ||
    orderData.city.trim() === ""
  ) {
    return res.status(400).json({
      message: "Missing data: Email, name, street, postal code or city is missing.",
    });
  }

  const newOrder = {
    ...orderData,
    id: (Math.random() * 1000).toString(),
  };
  const orders = await fs.readFile("./data/orders.json", "utf8");
  const allOrders = JSON.parse(orders);
  allOrders.push(newOrder);
  await fs.writeFile("./data/orders.json", JSON.stringify(allOrders));
  res.status(201).json({ message: "Order created!" });
});


app.get("https://food-order-app-backend-smoky.vercel.app", (req,res,next) => {
  res.status(200).json({message: "ITS WORKING!"});
})

app.use((req, res) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  res.status(404).json({ message: "Not found" });
});

pool
  .connect()
  .then(() => {
    res.send("Connected!");
  })
  .catch((err) => {
    console.error(err);
    
  });

module.exports = app;
