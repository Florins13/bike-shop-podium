// index.mjs
import express from "express";
import Layout, { html } from "@podium/layout";

const app = express();

const layout = new Layout({
  name: "my-layout",
  pathname: "/",
  development: true, // this should be false outside of localhost
});

// Podlets have to be registered with the layout before they can be fetched
// Register podlets
const bikesPodlet = layout.client.register({
  name: "bikes",
  uri: "http://localhost:7101/manifest.json",
});

const cartPodlet = layout.client.register({
  name: "cart",
  uri: "http://localhost:7102/manifest.json",
});

app.use('/assets', express.static('assets'));

app.use(layout.middleware());

app.get(layout.pathname(), async (req, res) => {
  const incoming = res.locals.podium;
  incoming.view.title = "My Super Page";

  // Pass the Podium context to the podlet
    const [bikes, cart] = await Promise.all([
    bikesPodlet.fetch(incoming),
    cartPodlet.fetch(incoming),
  ]);

  // Register the podlet's JS and CSS assets with the layout's HTML template
  incoming.podlets = [bikes, cart];
  res.podiumSend(html`
      <html>
      <head>
        <title>Shop</title>
        <link rel="stylesheet" href="/assets/styles.css">
      </head>
      <body>
          <header class="header_bar">
      <div>
        <button class="icon-button" onclick="goToBikes()" aria-label="Bikes">
          <img src="/assets/bicycle.png" style="height:70px; width:70px;" alt="Bikes">
        </button>
      </div>
      <div>
        <button class="text-button" onclick="goToBikes()"><h1>Bicycles</h1></button>
      </div>
      <nav class="nav-style" style="display: flex; align-items: center;">
              <div>
        <button class="icon-button" onclick="goToOrders()" aria-label="Orders">
          <img src="/assets/orders.png" alt="Orders">
        </button>
      </div>
      <div>
        <button class="icon-button" onclick="goToCart()" aria-label="Cart">
          <img src="/assets/shopping-cart.png" alt="Cart">
        </button>
      </div>
      <div>
        <button class="icon-button" onclick="logOut()" aria-label="Logout">
          <img src="/assets/logout.png" alt="Logout">
        </button>
      </div>
      </nav>
    </header>
      <div style="display: flex;justify-content: space-around;">
      <section>${bikes}</section>
      <section>${cart}</section>
      </div>
      <footer class="footer">
      <h3>UAB</h3>
      </footer>
      </body>
      </html>
  `);
});

console.log("Server running at http://localhost:8000/");
app.listen(8000);