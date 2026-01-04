// index.mjs
import express from "express";
import Podlet, { html } from "@podium/podlet";

const app = express();

const podlet = new Podlet({
  name: "my-podlet",
  version: "1.0.0",
  pathname: "/",
  development: true, // this should be false outside of localhost
});

podlet.js({ value: '/assets/bike.js', defer: true });
// podlet.css({ value: '/assets/bikes.css' });

app.use('/assets', express.static('assets'));

app.use(podlet.middleware());

app.get(podlet.content(), async (req, res) => {
const bikes = await fetch('http://localhost:8080/bikes')
    .then(r => r.json());

  const bikesHtml = bikes.length === 0
    ? `<p>There are no bikes.</p>`
    : bikes.map(bike => `
        <div class="bike-card">
          <h4>Model: ${bike.model}</h4>
          <img src="/assets/${bike.imageSource}" />
          <span>Stock: ${bike.stock}</span>
          <span>Details: ${bike.details}</span>
          <span>Electric: ${bike.electric}</span>
          <span>Price: ${bike.price}€</span>

          <div class="button-group">
            ${
              bike.isInStock
                ? `<button data-bike-id="${bike.id}">Add to cart</button>`
                : `<button disabled>Out of stock</button>`
            }
          </div>
        </div>
      `).join('');

  res.send(`
    <main data-podlet="bikes">
      <div class="search-container">
        <label>Search</label>
        <input type="text" id="search" />
      </div>
      <div class="bikes-container">
        ${bikesHtml}
      </div>
    </main>
  `);
});

app.get(podlet.manifest(), (req, res) => {
  res.status(200).send(podlet);
});

console.log("Server running at http://localhost:7101/");
app.listen(7101);