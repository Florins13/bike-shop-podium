(() => {
  const root = document.querySelector('[data-podlet="cart"]');
  if (!root) return;

  const cartUrl = root.getAttribute('data-cart-url') || 'http://localhost:8082';

  // Event delegation for cart actions
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');

    if (action === 'remove' && id) {
      await fetch(`${cartUrl}/cart/delete/${id}`, { method: 'POST' });
      window.location.reload();
    }

    if (action === 'increase' && id) {
      await fetch(`${cartUrl}/cart/updateQuantity/${id}/increase`, { method: 'POST' });
      window.location.reload();
    }

    if (action === 'decrease' && id) {
      await fetch(`${cartUrl}/cart/updateQuantity/${id}/decrease`, { method: 'POST' });
      window.location.reload();
    }

    if (action === 'checkout') {
      window.location.href = '/checkout';
    }
  });
})();
