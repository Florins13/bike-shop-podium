// index.mjs
import express from "express";
import Podlet from "@podium/podlet";

const app = express();

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:8082";
const CART_SERVICE_URL_CLIENT = process.env.CART_SERVICE_URL_CLIENT || "http://localhost:8082";
const BIKE_SERVICE_URL_CLIENT = process.env.BIKE_SERVICE_URL_CLIENT || "http://localhost:8081";
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:7102";

const podlet = new Podlet({
  name: "cart-podlet",
  version: "1.0.0",
  pathname: "/",
  development: true,
});

podlet.js({ value: `${PUBLIC_URL}/assets/cart.js`, defer: true });

app.use('/assets', express.static('assets'));

app.use(podlet.middleware());

app.get(podlet.content(), async (req, res) => {
  try {
    const cart = await fetch(`${CART_SERVICE_URL}/cart`).then(r => r.json());

    const itemsHtml = (!cart.cartItems || cart.cartItems.length === 0)
      ? ''
      : cart.cartItems.map(item => `
        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: space-evenly;">
          <div class="cart-bike__box">
            <button data-action="remove" data-id="${item.id}" style="width: 25px; align-self: end;">X</button>
            <h4 style="text-align: center;">Model: ${item.model}</h4>
            <img src="${BIKE_SERVICE_URL_CLIENT}/images/${item.imageSource}" height="70" width="70" alt="${item.model}">
            <span>Price: ${item.price}€</span>
            <div style="display: flex; align-items: center; gap: 20px;">
              <button data-action="decrease" data-id="${item.id}">-</button>
              <p>${item.quantity}</p>
              <button data-action="increase" data-id="${item.id}">+</button>
            </div>
          </div>
        </div>
      `).join('');

    const cartTotal = cart.cartItems
      ? cart.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
      : '0.00';

    const hasItems = cart.cartItems && cart.cartItems.some(item => item.quantity > 0);

    res.send(`
      <div data-podlet="cart" data-cart-url="${CART_SERVICE_URL_CLIENT}" style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: space-evenly; width: 250px;">
        Your Cart:
        ${itemsHtml}
      </div>
      <div style="display: flex; flex-direction: row; justify-content: center; gap: 5px;">
        <h3>Total: ${cartTotal} €</h3>
        <button data-action="checkout" ${!hasItems ? 'disabled' : ''} style="height: 30px; align-self: center;">
          Checkout
        </button>
      </div>
    `);
  } catch (error) {
    res.send(`
      <div data-podlet="cart" style="width: 250px;">
        <p>Your Cart:</p>
        <p>Unable to load cart.</p>
      </div>
    `);
  }
});

app.get(podlet.manifest(), (req, res) => {
  res.status(200).send(podlet);
});

const PORT = process.env.PORT || 7102;
console.log(`Cart podlet running at http://localhost:${PORT}/`);
app.listen(PORT);