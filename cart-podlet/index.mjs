

// index.mjs
import express from "express";
import Podlet, { html } from "@podium/podlet";

const app = express();

const podlet = new Podlet({
  name: "cart-podlet",
  version: "1.0.0",
  pathname: "/",
  development: true, // this should be false outside of localhost
});

// podlet.js({ value: '/assets/bikes.js', defer: true });
// podlet.css({ value: '/assets/bikes.css' });


app.use(podlet.middleware());
// app.use('/assets', express.static('assets'));

app.get(podlet.content(), async (req, res) => {
  const cart = await fetch('http://localhost:8080/cart')
    .then(r => r.json());

  const itemsHtml = cart.cartItems.map(item => `
    <div class="cart-item">
      <h4>${item.bike.model}</h4>
      <img src="/assets/${item.bike.imageSource}" />
      <span>Price: ${item.bike.price}€</span>

      <div class="quantity-group">
        <button data-action="dec" data-id="${item.id}">-</button>
        <p>${item.quantity}</p>
        <button data-action="inc" data-id="${item.id}">+</button>
      </div>
    </div>
  `).join('');

  res.send(`
    <section data-podlet="cart">
      <div class="cart-container">${itemsHtml}</div>
      <div class="cart-summary">
        <h3>Total: ${cart.cartTotal} €</h3>
        <button ${cart.cartIsEmpty ? 'disabled' : ''}>Checkout</button>
      </div>
    </section>
  `);
});

app.get(podlet.manifest(), (req, res) => {
  res.status(200).send(podlet);
});

console.log("Server running at http://localhost:7102/");
app.listen(7102);