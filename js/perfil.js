/* ========================================
   MOVEFY - Profile Selection JavaScript
   Card selection and navigation
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.perfil-card');

  cards.forEach(card => {
    // Click handler
    card.addEventListener('click', () => selectProfile(card));
    
    // Keyboard handler
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectProfile(card);
      }
    });
  });

  function selectProfile(card) {
    const role = card.getAttribute('data-role');

    // Visual selection
    cards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    // Store role
    localStorage.setItem('movefy_role', role);

    // Add click ripple effect
    card.style.transform = 'scale(0.97)';
    setTimeout(() => {
      card.style.transform = '';
    }, 150);

    // Navigate after brief delay
    setTimeout(() => {
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.3s ease';
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 300);
    }, 400);
  }
});
