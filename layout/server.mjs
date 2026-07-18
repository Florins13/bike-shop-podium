// server.mjs
import express from "express";
import Layout, { html } from "@podium/layout";

const app = express();

const BIKE_PODLET_URL = process.env.BIKE_PODLET_URL || "http://localhost:7101";
const CART_PODLET_URL = process.env.CART_PODLET_URL || "http://localhost:7102";
const ORDER_PODLET_URL = process.env.ORDER_PODLET_URL || "http://localhost:7103";

const layout = new Layout({
  name: "my-layout",
  pathname: "/",
  development: process.env.NODE_ENV !== "production",
  logger: console
});

console.log("ENV ->", process.env.NODE_ENV)

const bikesPodlet = layout.client.register({
  name: "bikes",
  uri: `${BIKE_PODLET_URL}/manifest.json`,
});

const cartPodlet = layout.client.register({
  name: "cart",
  uri: `${CART_PODLET_URL}/manifest.json`,
});

const ordersPodlet = layout.client.register({
  name: "orders",
  uri: `${ORDER_PODLET_URL}/manifest.json`,
});

app.use('/assets', express.static('assets'));

app.use(layout.middleware());

// Shopping view: bikes + cart side by side
app.get("/", async (req, res) => {
  const incoming = res.locals.podium;
  incoming.view.title = "Bicycles Shop";

  const [bikes, cart] = await Promise.all([
    bikesPodlet.fetch(incoming),
    cartPodlet.fetch(incoming),
  ]);

  incoming.podlets = [bikes, cart];
  res.podiumSend(html`
    <html>
    <head>
      <title>Bicycles Shop</title>
      <link rel="stylesheet" href="/assets/styles.css">
    </head>
    <body>
      <header class="header_bar">
        <div>
          <img onclick="window.location.href='/'" src="/assets/bicycle.png" style="cursor: pointer; height:70px; width:70px;" alt="Bikes">
        </div>
        <div onclick="window.location.href='/'">
          <h1 style="cursor: pointer;">Bicycles</h1>
        </div>
        <nav class="nav-style" style="display: flex; align-items: center;">
          <div>
            <img onclick="window.location.href='/'" src="/assets/shopping-cart.png" alt="Cart">
          </div>
          <div>
            <img onclick="window.location.href='/checkout'" src="/assets/orders.png" alt="Orders">
          </div>
          <div>
            <img onclick="console.log('Logout')" src="/assets/logout.png" alt="Logout">
          </div>
        </nav>
      </header>

      <div style="display: flex;justify-content: space-around;">
        ${bikes}
        ${cart}
      </div>

      <footer class="footer">
        <h3>&copy; 2026 UAB Rental Service</h3>
      </footer>
    </body>
    </html>
  `);
});

// Checkout view: form + cart summary + order history
app.get("/checkout", async (req, res) => {
  const incoming = res.locals.podium;
  incoming.view.title = "Checkout";

  const orders = await ordersPodlet.fetch(incoming);

  incoming.podlets = [orders];
  res.podiumSend(html`
    <html>
    <head>
      <title>Checkout</title>
      <link rel="stylesheet" href="/assets/styles.css">
    </head>
    <body>
      <header class="header_bar">
        <div>
          <img onclick="window.location.href='/'" src="/assets/bicycle.png" style="cursor: pointer; height:70px; width:70px;" alt="Bikes">
        </div>
        <div onclick="window.location.href='/'">
          <h1 style="cursor: pointer;">Bicycles</h1>
        </div>
        <nav class="nav-style" style="display: flex; align-items: center;">
          <div>
            <img onclick="window.location.href='/'" src="/assets/shopping-cart.png" alt="Cart">
          </div>
          <div>
            <img onclick="window.location.href='/checkout'" src="/assets/orders.png" alt="Orders">
          </div>
          <div>
            <img onclick="console.log('Logout')" src="/assets/logout.png" alt="Logout">
          </div>
        </nav>
      </header>

      ${orders}

      <footer class="footer">
        <h3>&copy; 2026 UAB Rental Service</h3>
      </footer>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8000;
console.log(`Layout server running at http://localhost:${PORT}/`);
app.listen(PORT);