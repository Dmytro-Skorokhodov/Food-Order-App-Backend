const fs = require("fs").promises;
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const app = express();
const pg = require("pg");
const { stringify } = require("querystring");
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

app.get("/meals", async (req, res) => {
  try {
    const meals = await pool.query("SELECT * FROM meals;");
    const data = meals.rows;
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const orderResponse = await pool.query("SELECT * from orders");
    const data = orderResponse.rows;
    res.json(data);
  } catch (err) {
    res.status(err).json({ message: err });
  }
});

app.post("/orders", async (req, res) => {
  const orderData = req.body.order;

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

  await pool
    .query(
      "INSERT INTO orders (name, email, street, city, postal_code, order_id, meals) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        newOrder.name,
        newOrder.email,
        newOrder.street,
        newOrder.city,
        newOrder["postal-code"],
        newOrder.id,
        JSON.stringify(newOrder.items),
      ]
    )
    .then(() => {
      res.status(200).json({ message: "Order created!" });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

app.delete("/orders/:id", async (req, res) => {
  try {
    const idToDelete = req.params.id;

    // Define the DELETE query
    const deleteQuery = {
      text: "DELETE FROM orders WHERE id = $1",
      values: [idToDelete],
    };

    // Execute the DELETE query
    await pool.query(deleteQuery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use((req, res) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  res.status(404).json({ message: "Not found" });
});

pool.connect().catch((err) => {
  console.error(err);
});

module.exports = app;
