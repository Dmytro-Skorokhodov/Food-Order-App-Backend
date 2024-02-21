const fs = require("fs").promises;
const bodyParser = require("body-parser");
const express = require("express");
const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/meals", async (req, res) => {
  const meals = await fs.readFile("./data/available-meals.json", "utf8");
  res.json(JSON.parse(meals));
});

app.post("/orders", async (req, res) => {
  const orderData = req.body.order;
  console.log(orderData);

  if (orderData.items === null || orderData.items.length === 0) {
    return res
      .status(400)
      .json({
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

app.use((req, res) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  res.status(404).json({ message: "Not found" });
});



module.exports = app;
