(() => {
  const root = document.querySelector('[data-podlet="bikes"]');
  if (!root) return;

  const cartUrl = root.getAttribute('data-cart-url') || 'http://localhost:8082';
  const searchInput = root.querySelector('#search');
  const bikeBoxes = root.querySelectorAll('.bike__box');

  // Search filtering
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      bikeBoxes.forEach(box => {
        const model = box.querySelector('h4')?.textContent?.toLowerCase() || '';
        box.style.display = model.includes(term) ? '' : 'none';
      });
    });
  }

  // Add to cart
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-bike-id]');
    if (!btn || btn.disabled) return;

    const bikeId = btn.getAttribute('data-bike-id');
    if (!bikeId) return;

    await fetch(`${cartUrl}/cart/add/${bikeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    window.location.reload();
  });
})();
