// index.mjs
import express from "express";
import Podlet from "@podium/podlet";

const app = express();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:8083";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:8082";
const ORDER_SERVICE_URL_CLIENT = process.env.ORDER_SERVICE_URL_CLIENT || "http://localhost:8083";
const CART_SERVICE_URL_CLIENT = process.env.CART_SERVICE_URL_CLIENT || "http://localhost:8082";
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:7103";

const podlet = new Podlet({
  name: "order-podlet",
  version: "1.0.0",
  pathname: "/",
  development: process.env.NODE_ENV !== "production",
});

podlet.js({ value: `${PUBLIC_URL}/assets/checkout.js`, defer: true });

app.use('/assets', express.static('assets'));

app.use(podlet.middleware());

app.get(podlet.content(), async (req, res) => {
  try {
    const [cartData, orders] = await Promise.all([
      fetch(`${CART_SERVICE_URL}/cart`).then(r => r.json()),
      fetch(`${ORDER_SERVICE_URL}/order/history`).then(r => r.json()).catch(() => []),
    ]);

    const cartItems = cartData.cartItems || [];
    const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
    const rentTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity * 0.3), 0).toFixed(2);

    const cartTableHtml = cartItems.map(item => `
      <tr>
        <td>${item.model}</td>
        <td>${item.quantity}</td>
        <td>${item.price} €</td>
      </tr>
    `).join('');

    const ordersHtml = (!orders || orders.length === 0)
      ? ''
      : orders.map(order => `
        <tr>
          <td>${order.transaction || ''}</td>
          <td>${order.orderState || ''}</td>
          <td>${order.acquireType || ''}</td>
          <td style="display: flex; flex-direction: column;">
            ${order.shippingItems ? order.shippingItems.map(item => 
              `<span>${item.quantity}x ${item.bikeModel}</span>`
            ).join('') : ''}
          </td>
          <td>${order.totalPrice || 0} €</td>
          <td>
            <span>
              ${order.shippingAddress ? `${order.shippingAddress.fullName}, ${order.shippingAddress.address}, ${order.shippingAddress.telephone}. ${order.shippingAddress.zipCode}` : ''}
            </span>
          </td>
          <td>${order.userId || ''}</td>
        </tr>
      `).join('');

    res.send(`
      <div data-podlet="orders" data-order-url="${ORDER_SERVICE_URL_CLIENT}" data-cart-url="${CART_SERVICE_URL_CLIENT}">
        <h1 style="margin-left: 5px">Checkout</h1>

        <div style="padding: 20px; display: flex; justify-content: space-around;">
          <!-- Customer form -->
          <div>
            <form id="checkout-form" style="display: flex; flex-direction: column; align-items: baseline; gap: 5px;">
              <label for="fullName">Full name</label>
              <input id="fullName" name="fullName" required type="text"/>

              <label for="address">Address</label>
              <input id="address" name="address" required type="text"/>

              <label for="telephone">Telephone</label>
              <input id="telephone" name="telephone" required type="number"/>

              <label for="zipCode">Zipcode</label>
              <input id="zipCode" name="zipCode" required type="text"/>

              <div>
                <label for="buy">Buy</label>
                <input type="radio" id="buy" name="acquireType" value="buy" checked />

                <label for="rent">Rent for 3 days</label>
                <input type="radio" id="rent" name="acquireType" value="rent" />
              </div>

              <button type="submit" style="align-self: end;">Finalise</button>
            </form>
          </div>

          <!-- Order summary -->
          <div>
            <table>
              <tr>
                <th>Bike</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
              ${cartTableHtml}
              <tr>
                <td></td>
                <td style="text-align: end; font-weight: bold;">Total:</td>
                <td style="font-weight: bold;" data-buy-total="${cartTotal}" data-rent-total="${rentTotal}">${cartTotal} €</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Order history -->
        <div style="padding-left: 10px">
          <h3>Order history:</h3>
          <table style="width: 100%">
            <tr>
              <th>Transaction</th>
              <th>Order state</th>
              <th>Acquire Type</th>
              <th>Items:</th>
              <th>Total</th>
              <th>Address</th>
              <th>User</th>
            </tr>
            ${ordersHtml}
          </table>
        </div>
      </div>
    `);
  } catch (error) {
    res.send(`
      <div data-podlet="orders">
        <h1 style="margin-left: 5px">Checkout</h1>
        <p>Unable to load checkout data at this time.</p>
      </div>
    `);
  }
});

app.get(podlet.manifest(), (req, res) => {
  res.status(200).send(podlet);
});

const PORT = process.env.PORT || 7103;
console.log(`Order podlet running at http://localhost:${PORT}/`);
app.listen(PORT);
