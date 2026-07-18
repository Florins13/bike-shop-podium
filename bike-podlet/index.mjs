// index.mjs
import express from "express";
import Podlet from "@podium/podlet";
const app = express();

const BIKE_SERVICE_URL = process.env.BIKE_SERVICE_URL || "http://localhost:8081";
const CART_SERVICE_URL_CLIENT = process.env.CART_SERVICE_URL_CLIENT || "http://localhost:8082";
const BIKE_SERVICE_URL_CLIENT = process.env.BIKE_SERVICE_URL_CLIENT || "http://localhost:8081";
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:7101";

const podlet = new Podlet({
  name: "bikes-podlet",
  version: "1.0.0",
  pathname: "/",
  development: process.env.NODE_ENV !== "production"
});

console.log(process.env.NODE_ENV)

podlet.js({ value: `${PUBLIC_URL}/assets/bike.js`, defer: true });

app.use('/assets', express.static('assets'));

app.use(podlet.middleware());

app.get(podlet.content(), async (req, res) => {
  try {
    const bikes = await fetch(`${BIKE_SERVICE_URL}/bikes`).then(r => r.json());

    const bikesHtml = bikes.length === 0
      ? `<p>There are no bikes.</p>`
      : bikes.map(bike => `
          <div class="bike__box">
            <h4>Model: ${bike.model}</h4>
            <img src="/assets/${bike.imageSource}" height="70" width="70" alt="${bike.model}">
            <span>Stock: ${bike.availableStock}</span>
            <span>Details: ${bike.details}</span>
            <span>Electric: ${bike.electric ? 'Yes' : 'No'}</span>
            <span>Price: ${bike.price}€</span>
            <button data-bike-id="${bike.id}" ${bike.availableStock <= 0 ? 'disabled' : ''}>
              Add to cart
            </button>
          </div>
        `).join('');

    res.send(`
      <main data-podlet="bikes" data-cart-url="${CART_SERVICE_URL_CLIENT}" style="padding: 20px;">
        <div style="margin-bottom:10px">
          <label for="search">Search </label>
          <input id="search" type="text" placeholder="Search bikes...">
        </div>
        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: space-evenly;">
          ${bikesHtml}
        </div>
      </main>
    `);
  } catch (error) {
    res.send(`
      <main data-podlet="bikes" style="padding: 20px;">
        <p>Unable to load bikes at this time.</p>
      </main>
    `);
  }
});

app.get(podlet.manifest(), (req, res) => {
  res.status(200).send(podlet);
});

const PORT = process.env.PORT || 7101;
console.log(`Bike podlet running at http://localhost:${PORT}/`);
app.listen(PORT);