/* ========================================
   MOVEFY - Planificación JavaScript
   Route selection, navigation start
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Route Option Selection ---
  const routeOptions = document.querySelectorAll('.route-option');
  
  routeOptions.forEach(option => {
    option.addEventListener('click', () => {
      routeOptions.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');

      const route = option.getAttribute('data-route');
      updateMapRoute(route);
    });
  });

  function updateMapRoute(routeType) {
    const routeLine = document.querySelector('.plan-route-line');
    const dangerZones = document.querySelectorAll('.plan-danger-zone');

    if (routeType === 'fast') {
      // Fast route: straight, passes through danger zones
      if (routeLine) {
        routeLine.style.background = 'linear-gradient(180deg, #94A3B8, #CBD5E1)';
        routeLine.style.boxShadow = '0 0 10px rgba(148, 163, 184, 0.3)';
        routeLine.style.right = '40%';
      }
      dangerZones.forEach(zone => {
        zone.style.opacity = '1';
        zone.style.borderColor = 'rgba(239, 68, 68, 0.7)';
      });
    } else {
      // Safe route: avoids danger zones
      if (routeLine) {
        routeLine.style.background = 'linear-gradient(180deg, var(--primary-cyan), var(--primary-cyan-light))';
        routeLine.style.boxShadow = '0 0 20px rgba(0, 212, 170, 0.4)';
        routeLine.style.right = '30%';
      }
      dangerZones.forEach(zone => {
        zone.style.opacity = '0.5';
        zone.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      });
    }
  }

  // --- Start Navigation ---
  const startNavBtn = document.getElementById('startNavBtn');
  if (startNavBtn) {
    startNavBtn.addEventListener('click', () => {
      const selectedRoute = document.querySelector('.route-option.selected');
      const routeType = selectedRoute ? selectedRoute.getAttribute('data-route') : 'safe';

      startNavBtn.disabled = true;
      startNavBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Calculando ruta...
      `;

      // Add spin animation
      const style = document.createElement('style');
      style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);

      setTimeout(() => {
        // Success state
        startNavBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          ¡Navegación iniciada!
        `;
        startNavBtn.style.background = '#059669';

        // Pulse the route line
        const routeLine = document.querySelector('.plan-route-line');
        if (routeLine) {
          routeLine.style.animation = 'routePulse 1s ease-in-out infinite';
          routeLine.style.width = '6px';
        }

        // Reset after 3 seconds
        setTimeout(() => {
          startNavBtn.disabled = false;
          startNavBtn.innerHTML = `
            Iniciar Navegación
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          `;
          startNavBtn.style.background = '';
          if (routeLine) {
            routeLine.style.width = '4px';
          }
        }, 3000);
      }, 2000);
    });
  }

  // --- New Route Button ---
  const newRouteBtn = document.querySelector('.plan-new-route-btn');
  if (newRouteBtn) {
    newRouteBtn.addEventListener('click', () => {
      const origenInput = document.getElementById('inputOrigen');
      const destinoInput = document.getElementById('inputDestino');
      
      if (origenInput) origenInput.value = '';
      if (destinoInput) destinoInput.value = '';
      
      if (origenInput) origenInput.focus();
      
      // Reset route selection
      routeOptions.forEach(o => o.classList.remove('selected'));
      
      // Flash button
      newRouteBtn.style.background = 'var(--primary-cyan-bg)';
      setTimeout(() => { newRouteBtn.style.background = ''; }, 300);
    });
  }

  // --- Map Controls ---
  let zoomLevel = 1;
  const mapBg = document.querySelector('.plan-map-bg');

  document.querySelectorAll('.map-control-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      switch(index) {
        case 0:
          zoomLevel = Math.min(zoomLevel + 0.1, 2);
          if (mapBg) mapBg.style.transform = `scale(${zoomLevel})`;
          break;
        case 1:
          zoomLevel = Math.max(zoomLevel - 0.1, 0.8);
          if (mapBg) mapBg.style.transform = `scale(${zoomLevel})`;
          break;
        case 2:
          btn.classList.toggle('active');
          break;
      }
      btn.style.transform = 'scale(0.9)';
      setTimeout(() => { btn.style.transform = ''; }, 150);
    });
  });

  // --- Input focus effects ---
  document.querySelectorAll('.plan-input-field').forEach(field => {
    const input = field.querySelector('input');
    if (input) {
      input.addEventListener('focus', () => {
        field.style.borderColor = 'var(--primary-cyan)';
        field.style.boxShadow = '0 0 0 3px rgba(0, 212, 170, 0.08)';
      });
      input.addEventListener('blur', () => {
        field.style.borderColor = '';
        field.style.boxShadow = '';
      });
    }
  });
});
