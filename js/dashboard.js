/* ========================================
   MOVEFY - Dashboard JavaScript
   Route toggle, report interactions, map controls
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Route Toggle ---
  const toggleBtns = document.querySelectorAll('.route-toggle-btn');
  const statValue = document.querySelector('.stat-card.highlight .stat-value');
  const etaValue = document.querySelector('.stat-card:not(.highlight) .stat-value');

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const route = btn.getAttribute('data-route');
      if (route === 'seguro') {
        if (statValue) statValue.textContent = '98%';
        if (etaValue) etaValue.textContent = '18m';
      } else {
        if (statValue) statValue.textContent = '82%';
        if (etaValue) etaValue.textContent = '12m';
      }
    });
  });

  // --- Report Item Click ---
  const reportItems = document.querySelectorAll('.report-item');
  reportItems.forEach(item => {
    item.addEventListener('click', () => {
      reportItems.forEach(i => i.style.background = '');
      item.style.background = 'var(--bg-light)';
      
      // Flash the safe zone
      const safeZone = document.querySelector('.safe-zone-overlay');
      if (safeZone) {
        safeZone.style.borderColor = 'var(--warning-orange)';
        safeZone.style.background = 'rgba(249, 115, 22, 0.08)';
        setTimeout(() => {
          safeZone.style.borderColor = 'var(--primary-cyan)';
          safeZone.style.background = 'rgba(0, 212, 170, 0.08)';
        }, 1500);
      }
    });
  });

  // --- Report Button ---
  const reportBtn = document.getElementById('reportBtn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      // Simple modal simulation
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center; z-index: 9999;
        animation: fadeIn 0.2s ease;
      `;
      modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; text-align: center;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #E0FBF4; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 style="margin-bottom: 8px; color: #1E293B;">Reportar Incidente</h3>
          <p style="color: #64748B; font-size: 14px; margin-bottom: 24px;">Esta función estará disponible próximamente. ¡Gracias por contribuir a la seguridad!</p>
          <button onclick="this.closest('div[style]').parentElement.remove()" style="padding: 12px 32px; background: #1B2838; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Entendido</button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    });
  }

  // --- Map Controls ---
  let zoomLevel = 1;
  const mapBg = document.querySelector('.dashboard-map-bg');

  document.querySelectorAll('.map-control-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      switch(index) {
        case 0: // Zoom in
          zoomLevel = Math.min(zoomLevel + 0.1, 2);
          if (mapBg) mapBg.style.transform = `scale(${zoomLevel})`;
          break;
        case 1: // Zoom out
          zoomLevel = Math.max(zoomLevel - 0.1, 0.8);
          if (mapBg) mapBg.style.transform = `scale(${zoomLevel})`;
          break;
        case 2: // My location
          btn.style.background = 'var(--primary-cyan-bg)';
          btn.style.color = 'var(--primary-cyan)';
          setTimeout(() => {
            btn.style.background = '';
            btn.style.color = '';
          }, 2000);
          break;
        case 3: // Layers
          btn.classList.toggle('active');
          break;
      }

      // Button press feedback
      btn.style.transform = 'scale(0.9)';
      setTimeout(() => { btn.style.transform = ''; }, 150);
    });
  });

  // --- Swap locations ---
  const swapBtn = document.querySelector('.map-swap-btn');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const rows = document.querySelectorAll('.map-location-row span:not(.cyan)');
      const cyanRow = document.querySelector('.map-location-row .cyan');
      if (rows.length > 0 && cyanRow) {
        const temp = rows[0].textContent;
        rows[0].textContent = cyanRow.textContent;
        cyanRow.textContent = temp;
      }
      
      // Rotate animation
      swapBtn.style.transform = 'translateY(-50%) rotate(180deg)';
      setTimeout(() => {
        swapBtn.style.transform = 'translateY(-50%)';
      }, 300);
    });
  }

  // --- Animate stats on load ---
  const animateValue = (el, start, end, duration, suffix = '') => {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * (end - start) + start);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  if (statValue) animateValue(statValue, 0, 98, 1500, '%');
  if (etaValue) animateValue(etaValue, 0, 12, 1000, 'm');
});
