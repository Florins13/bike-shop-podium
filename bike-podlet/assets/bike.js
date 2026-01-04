(() => {
  const root = document.querySelector('[data-podlet="bikes"]');
  if (!root) return;

  root.addEventListener('click', async (e) => {
    // Get button and bike ID
    const btn = e.target.closest('button');
    if (!btn) return;

    const bikeId = Number(btn.getAttribute('data-bike-id'));
    if (!bikeId) return;

    // Handle Add to cart
      await fetch(`http://localhost:8080/cart/add/${bikeId}`, {
        method: 'POST'
      });
      window.location.reload();
  

    // // Handle Edit
    // if (btn.classList.contains('edit-btn')) {
    //   console.log('Edit bike:', bikeId);
    //   // Emit event or navigate to edit page
    // }

    // // Handle Delete
    // if (btn.classList.contains('delete-btn')) {
    //   console.log('Delete bike:', bikeId);
    //   // Emit event or call delete API
    // }
  });
})();
