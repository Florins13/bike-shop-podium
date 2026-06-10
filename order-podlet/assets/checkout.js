(() => {
  const root = document.querySelector('[data-podlet="orders"]');
  if (!root) return;

  const orderUrl = root.getAttribute('data-order-url') || 'http://localhost:8083';
  const form = root.querySelector('#checkout-form');
  const totalCell = root.querySelector('[data-buy-total]');

  // Toggle total display based on buy/rent radio
  const radioButtons = root.querySelectorAll('input[name="acquireType"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (totalCell) {
        const buyTotal = totalCell.getAttribute('data-buy-total');
        const rentTotal = totalCell.getAttribute('data-rent-total');
        totalCell.textContent = (e.target.value === 'rent' ? rentTotal : buyTotal) + ' €';
      }
    });
  });

  // Finalise order
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const body = {
        fullName: formData.get('fullName'),
        address: formData.get('address'),
        telephone: formData.get('telephone'),
        zipCode: formData.get('zipCode'),
        acquireType: formData.get('acquireType') || 'buy'
      };

      try {
        await fetch(`${orderUrl}/order/finalise`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        window.location.reload();
      } catch (error) {
        console.error('Error finalising order:', error);
      }
    });
  }
})();
