# Podium — Concepts & Project Setup

## What is Podium?

[Podium](https://podium-lib.io/) is a **server-side micro-frontend framework** for Node.js.  
It lets you split a web application into small, independently deployable **page fragments** called **podlets**, which are then assembled into complete pages by a central **layout** server.

Unlike client-side micro-frontends (e.g. Module Federation), Podium composes fragments **on the server** before HTML is sent to the browser. This means the browser sees one complete HTML page — it does not need to know about the individual podlets at all.

---

## Core Concepts

### Podlet

A **podlet** is an independent HTTP server that serves an HTML fragment (a piece of a page).  
You can think of it as a component running as its own service.

Each podlet exposes two mandatory routes:

| Route | Description |
|-------|-------------|
| `/` (content route) | Returns the HTML fragment |
| `/manifest.json` | Returns metadata about the podlet (name, version, assets, etc.) |

The manifest is the **contract** between a podlet and a layout — it tells the layout where to fetch assets and what routes the podlet exposes.

### Layout

A **layout** is the server that **composes podlets** into a complete HTML page.  
It registers one or more podlets by their manifest URLs, fetches their HTML fragments on every request, and injects them into a page template before responding to the browser.

### Podium Context

When the layout fetches a podlet, it injects a set of HTTP headers called the **Podium context**. These headers carry request information (locale, URL, user-agent, etc.) that podlets can use to generate personalised or dynamic content.

### Manifest JSON

An example manifest for the bike podlet looks like:

```json
{
  "name": "bikes-podlet",
  "version": "1.0.0",
  "content": "/",
  "fallback": "",
  "assets": {
    "js": "http://localhost:7101/assets/bike.js",
    "css": ""
  }
}
```

The layout reads this manifest once (and caches it) so it knows where to load the fragment and its assets from.

---

## Project Architecture

This project is the Podium-based frontend for the Bike Shop. It replicates the same UI as the Module Federation implementation but uses server-side composition.

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (:8000)                           │
│                    Layout Server                             │
│           /  → Shopping View (bikes + cart)                  │
│      /checkout → Checkout + Order History                    │
└───────┬──────────────────┬──────────────────┬───────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Bike Podlet  │   │ Cart Podlet  │   │ Order Podlet │
│   (:7101)    │   │   (:7102)    │   │   (:7103)    │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Bike Service │   │ Cart Service │   │ Order Service│
│   (:8081)    │   │   (:8082)    │   │   (:8083)    │
└──────────────┘   └──────────────┘   └──────────────┘
          (Microservices — separate Docker Compose)
```

| Service | Port | Role |
|---------|------|------|
| Layout | 8000 | Composes podlets into full pages, serves the browser |
| Bike Podlet | 7101 | Bike catalogue — search + add to cart |
| Cart Podlet | 7102 | Shopping cart with quantity controls |
| Order Podlet | 7103 | Checkout form, cart summary, order history |

---

## How a Podlet is Set Up

Every podlet follows the same pattern. Here is a walkthrough using `bike-podlet/index.mjs`:

### 1. Install dependencies

```bash
npm install express @podium/podlet
```

### 2. Create the Podlet instance

```js
import express from "express";
import Podlet from "@podium/podlet";

const app = express();

const podlet = new Podlet({
  name: "bikes-podlet",   // unique name — used by the layout to identify this podlet
  version: "1.0.0",       // bump this to bust the layout's manifest cache
  pathname: "/",           // base path the podlet is mounted on
  development: true,       // enables a dev UI when visiting the podlet directly
});
```

### 3. Register client-side assets

If the podlet ships JavaScript, declare it so the layout can inject the `<script>` tag:

```js
podlet.js({ value: `${PUBLIC_URL}/assets/bike.js`, defer: true });
```

The layout reads asset declarations from the manifest and injects them into the page `<head>` automatically — you do **not** add `<script>` tags yourself in the fragment HTML.

### 4. Mount middleware

```js
app.use('/assets', express.static('assets'));  // serve static files
app.use(podlet.middleware());                   // Podium middleware (required)
```

### 5. Content route — the HTML fragment

```js
app.get(podlet.content(), async (req, res) => {
  // fetch data from your backend service
  const bikes = await fetch(`${BIKE_SERVICE_URL}/bikes`).then(r => r.json());

  // return raw HTML — no <html>/<body> wrapper needed
  res.send(`
    <main data-podlet="bikes">
      ${bikes.map(bike => `<div class="bike__box">...</div>`).join('')}
    </main>
  `);
});
```

> **Note:** The fragment must **not** include `<html>`, `<head>`, or `<body>` tags — the layout provides those.

### 6. Manifest route

```js
app.get(podlet.manifest(), (req, res) => {
  res.status(200).send(podlet);  // @podium/podlet serialises itself to JSON
});
```

### 7. Start the server

```js
const PORT = process.env.PORT || 7101;
app.listen(PORT);
```

---

## How the Layout is Set Up

The layout lives in `layout/server.mjs`.

### 1. Install dependencies

```bash
npm install express @podium/layout
```

### 2. Create the Layout instance

```js
import express from "express";
import Layout, { html } from "@podium/layout";

const app = express();

const layout = new Layout({
  name: "my-layout",
  pathname: "/",
  development: true,
});
```

### 3. Register podlets

The layout fetches each podlet's manifest once and caches it. You register a podlet by pointing to its `manifest.json`:

```js
const bikesPodlet  = layout.client.register({
  name: "bikes",
  uri: `${BIKE_PODLET_URL}/manifest.json`,   // e.g. http://bike-podlet:7101/manifest.json
});

const cartPodlet   = layout.client.register({ name: "cart",   uri: `${CART_PODLET_URL}/manifest.json`  });
const ordersPodlet = layout.client.register({ name: "orders", uri: `${ORDER_PODLET_URL}/manifest.json` });
```

### 4. Mount middleware

```js
app.use('/assets', express.static('assets'));
app.use(layout.middleware());   // injects res.locals.podium, handles asset injection, etc.
```

### 5. Compose a page route

```js
app.get("/", async (req, res) => {
  const incoming = res.locals.podium;   // the Podium request context

  incoming.view.title = "Bicycles Shop";

  // fetch HTML fragments from podlets in parallel
  const [bikes, cart] = await Promise.all([
    bikesPodlet.fetch(incoming),
    cartPodlet.fetch(incoming),
  ]);

  // tell Podium which podlets are on this page (so their assets get injected)
  incoming.podlets = [bikes, cart];

  // compose the full HTML page; ${bikes} and ${cart} expand to the fragment HTML
  res.podiumSend(html`
    <html>
    <head>
      <title>Bicycles Shop</title>
      <link rel="stylesheet" href="/assets/styles.css">
    </head>
    <body>
      <header>...</header>

      <div style="display: flex;">
        ${bikes}
        ${cart}
      </div>

      <footer>...</footer>
    </body>
    </html>
  `);
});
```

`res.podiumSend()` is a Podium-augmented version of `res.send()` that also injects the `<script>` and `<link>` tags declared by each registered podlet's manifest.

---

## Environment Variables

### Bike Podlet

| Variable | Default | Description |
|----------|---------|-------------|
| `BIKE_SERVICE_URL` | `http://localhost:8081` | Bike service API — used server-side |
| `BIKE_SERVICE_URL_CLIENT` | `http://localhost:8081` | Bike service URL used by the browser (images) |
| `CART_SERVICE_URL_CLIENT` | `http://localhost:8082` | Cart service URL for browser requests |
| `PUBLIC_URL` | `http://localhost:7101` | Public base URL of this podlet (used to build asset URLs in manifest) |

### Cart Podlet

| Variable | Default | Description |
|----------|---------|-------------|
| `CART_SERVICE_URL` | `http://localhost:8082` | Cart service API — server-side |
| `CART_SERVICE_URL_CLIENT` | `http://localhost:8082` | Cart service URL for the browser |
| `BIKE_SERVICE_URL_CLIENT` | `http://localhost:8081` | Bike service URL for browser (images) |
| `PUBLIC_URL` | `http://localhost:7102` | Public base URL of this podlet |

### Order Podlet

| Variable | Default | Description |
|----------|---------|-------------|
| `ORDER_SERVICE_URL` | `http://localhost:8083` | Order service API — server-side |
| `CART_SERVICE_URL` | `http://localhost:8082` | Cart service API — server-side |
| `ORDER_SERVICE_URL_CLIENT` | `http://localhost:8083` | Order service URL for the browser |
| `CART_SERVICE_URL_CLIENT` | `http://localhost:8082` | Cart service URL for the browser |
| `PUBLIC_URL` | `http://localhost:7103` | Public base URL of this podlet |

### Layout

| Variable | Default | Description |
|----------|---------|-------------|
| `BIKE_PODLET_URL` | `http://localhost:7101` | Bike podlet base URL — used to build manifest URI |
| `CART_PODLET_URL` | `http://localhost:7102` | Cart podlet base URL |
| `ORDER_PODLET_URL` | `http://localhost:7103` | Order podlet base URL |
| `PORT` | `8000` | Port the layout server listens on |

> **Why two URLs for services?**  
> Server-side code (inside Docker) reaches microservices via internal Docker hostnames (e.g. `http://bike-service:8081`).  
> Client-side JavaScript (running in the browser) must use `localhost` mapped ports (e.g. `http://localhost:8081`).  
> Each `*_CLIENT` variable holds the browser-accessible URL that gets embedded in the rendered HTML.

---

## Docker Compose Setup

The project uses `docker-compose.yml` to run all four servers together.

### Networks

```yaml
networks:
  podium-net:
    driver: bridge            # internal network — layout ↔ podlets
  microservices-net:
    external: true
    name: software-engineering_default   # shared with the backend microservices Compose project
```

Podlets sit on **both** networks so they can talk to the backend microservices and also be reached by the layout.

### Starting everything

```bash
# 1. Start the microservices backend first (creates the shared Docker network)
cd /path/to/software-engineering
docker compose up -d

# 2. Start the Podium frontend
cd /path/to/bike-shop-podium
docker compose up --build
```

Then open http://localhost:8000 in your browser.

### Stopping

```bash
# Stop Podium frontend
docker compose down

# Stop microservices backend
cd /path/to/software-engineering
docker compose down
```

---

## Local Development (Without Docker)

Run each service in its own terminal. The microservices backend still needs to be running (via Docker or locally).

```bash
# Terminal 1 — Bike Podlet (http://localhost:7101)
cd bike-podlet
npm install
BIKE_SERVICE_URL=http://localhost:8081 \
BIKE_SERVICE_URL_CLIENT=http://localhost:8081 \
CART_SERVICE_URL_CLIENT=http://localhost:8082 \
node index.mjs

# Terminal 2 — Cart Podlet (http://localhost:7102)
cd cart-podlet
npm install
CART_SERVICE_URL=http://localhost:8082 \
CART_SERVICE_URL_CLIENT=http://localhost:8082 \
BIKE_SERVICE_URL_CLIENT=http://localhost:8081 \
node index.mjs

# Terminal 3 — Order Podlet (http://localhost:7103)
cd order-podlet
npm install
ORDER_SERVICE_URL=http://localhost:8083 \
CART_SERVICE_URL=http://localhost:8082 \
ORDER_SERVICE_URL_CLIENT=http://localhost:8083 \
CART_SERVICE_URL_CLIENT=http://localhost:8082 \
node index.mjs

# Terminal 4 — Layout (http://localhost:8000)
cd layout
npm install
node server.mjs
```

Verify each podlet is running by checking its manifest:

```bash
curl http://localhost:7101/manifest.json
curl http://localhost:7102/manifest.json
curl http://localhost:7103/manifest.json
```

Then open http://localhost:8000.

---

## Request Flow Summary

1. Browser requests `http://localhost:8000/`
2. Layout middleware runs, attaches the Podium context to `res.locals.podium`
3. Layout fetches HTML fragments from `bike-podlet` and `cart-podlet` in parallel
4. Each podlet queries its microservice, renders an HTML fragment, and returns it
5. Layout injects the fragments into the page template and calls `res.podiumSend()`
6. `res.podiumSend()` also injects any `<script>`/`<link>` tags declared in the podlet manifests
7. Browser receives one complete HTML page

---

## Further Reading

- [Podium documentation](https://podium-lib.io/docs/introduction/hello-podium/)
- [@podium/podlet API](https://podium-lib.io/docs/api/podlet)
- [@podium/layout API](https://podium-lib.io/docs/api/layout)
- [Podium context guide](https://podium-lib.io/docs/guides/context)
- [HTTP framework compatibility](https://podium-lib.io/docs/api/http-framework-compatibility)
