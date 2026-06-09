/* =============================================
   MOVEFY DASHBOARD - JavaScript (Passenger View)
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // --- Global Navbar Avatar Sync ---
  const savedName = localStorage.getItem('movefy_nombre');
  if (savedName) {
    const parts = savedName.trim().split(' ');
    let initials = parts[0].charAt(0).toUpperCase();
    if (parts.length > 1) initials += parts[parts.length - 1].charAt(0).toUpperCase();
    document.querySelectorAll('.avatar').forEach(el => {
      if(!el.querySelector('img')) el.textContent = initials;
    });
  }

  // ---- Greeting with dynamic time ----
  const greetingText = document.getElementById('greetingText');
  const greetingDate = document.getElementById('greetingDate');

  function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let saludo = '¡Hola';
    if (hour < 12) saludo = '¡Buenos días';
    else if (hour < 18) saludo = '¡Buenas tardes';
    else saludo = '¡Buenas noches';

    const savedName = localStorage.getItem('movefy_nombre') || 'Usuario';
    const firstName = savedName.split(' ')[0];

    if (greetingText) greetingText.textContent = `${saludo}, ${firstName}!`;

    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaStr = now.toLocaleDateString('es-PE', opciones);
    if (greetingDate) greetingDate.textContent = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
  }
  updateGreeting();

  // ---- Section Navigation ----
  const sections = document.querySelectorAll('.dash-section');
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-section]');

  function showSection(sectionId) {
    sections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    // Update bottom nav active state
    bottomNavItems.forEach(item => {
      if (item.dataset.section === sectionId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Check URL params for initial section
  const urlParams = new URLSearchParams(window.location.search);
  const sectionParam = urlParams.get('section');
  if (sectionParam === 'destinos') {
    showSection('sectionDestinos');
  }

  // Quick action cards with data-section
  document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', (e) => {
      const sectionId = el.dataset.section;
      if (sectionId) {
        e.preventDefault();
        showSection(sectionId);
      }
    });
  });

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showSection(btn.dataset.section);
    });
  });

  // ---- Viajes Tabs ----
  const viajesTabs = document.querySelectorAll('.viajes-tab');
  viajesTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      viajesTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.viajes-content').forEach(c => c.classList.remove('active'));
      const targetTab = document.getElementById('tab' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1));
      if (targetTab) targetTab.classList.add('active');
    });
  });

  // ---- SOS Timer ----
  const sosActivateBtn = document.getElementById('sosActivateBtn');
  const sosCancelBtn = document.getElementById('sosCancelBtn');
  const sosTimerText = document.getElementById('sosTimerText');
  const sosTimerRing = document.getElementById('sosTimerRing');
  let sosInterval = null;
  let sosCount = 10;

  function startSOS() {
    sosCount = 10;
    sosTimerText.textContent = sosCount;
    sosTimerRing.classList.add('active');
    sosActivateBtn.classList.add('hidden');
    sosCancelBtn.classList.remove('hidden');

    sosInterval = setInterval(() => {
      sosCount--;
      sosTimerText.textContent = sosCount;

      if (sosCount <= 0) {
        clearInterval(sosInterval);
        sosTimerText.textContent = '!';
        // Simulate alert sent
        showToast('🚨 Alerta SOS enviada a tus contactos de emergencia y autoridades.');
        setTimeout(() => cancelSOS(), 3000);
      }
    }, 1000);
  }

  function cancelSOS() {
    clearInterval(sosInterval);
    sosCount = 10;
    sosTimerText.textContent = '10';
    sosTimerRing.classList.remove('active');
    sosActivateBtn.classList.remove('hidden');
    sosCancelBtn.classList.add('hidden');
  }

  if (sosActivateBtn) sosActivateBtn.addEventListener('click', startSOS);
  if (sosCancelBtn) sosCancelBtn.addEventListener('click', () => {
    cancelSOS();
    showToast('SOS cancelado correctamente.');
  });

  // ---- Toast Notifications ----
  function showToast(message) {
    const existing = document.querySelector('.dash-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'dash-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 72px;
      left: 50%;
      transform: translateX(-50%);
      background: #FFFFFF;
      color: #1E293B;
      padding: 14px 24px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 600;
      z-index: 9999;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      animation: toastIn 0.3s ease;
      max-width: 90%;
      text-align: center;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Add toast animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(-10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
    @keyframes toastOut { from { opacity:1; transform: translateX(-50%) translateY(0); } to { opacity:0; transform: translateX(-50%) translateY(-10px); } }
  `;
  document.head.appendChild(style);

  // ---- Cuidado Button ----
  const cuidadoBtn = document.getElementById('cuidadoBtn');
  if (cuidadoBtn) {
    cuidadoBtn.addEventListener('click', () => {
      showToast('⚠️ Revisa las alertas activas en tu zona antes de salir.');
    });
  }

  // ---- Report Button ----
  const reportBtn = document.getElementById('reportBtn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      showToast('📝 Función de reporte abierta. (Prototipo)');
    });
  }

  // ---- Planear viaje button ----
  const planearBtn = document.querySelector('.planear-viaje-btn');
  if (planearBtn) {
    planearBtn.addEventListener('click', () => {
      window.location.href = 'planificacion.html';
    });
  }

  // ---- Ver mapa buttons ----
  document.querySelectorAll('.viaje-ver-mapa').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = 'planificacion.html';
    });
  });

  // ---- Destino card clicks ----
  document.querySelectorAll('.destino-card:not(.recomendado)').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = 'planificacion.html';
    });
  });

});
