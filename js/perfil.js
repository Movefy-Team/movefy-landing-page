/* ========================================
   MOVEFY - Profile Configuration JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  const perfilForm = document.getElementById('perfilForm');
  
  // DOM Elements
  const inputNombre = document.getElementById('nombre');
  const inputEmail = document.getElementById('email');
  const inputTelefono = document.getElementById('telefono');
  const inputContacto1 = document.getElementById('contacto1');
  const inputContacto2 = document.getElementById('contacto2');
  const prefPeligro = document.getElementById('pref-peligro');
  const prefNotif = document.getElementById('pref-notif');
  
  // Load saved data from localStorage on init
  function loadProfile() {
    if (localStorage.getItem('movefy_nombre')) {
      inputNombre.value = localStorage.getItem('movefy_nombre');
    }
    if (localStorage.getItem('movefy_email')) {
      inputEmail.value = localStorage.getItem('movefy_email');
    }
    if (localStorage.getItem('movefy_telefono')) {
      inputTelefono.value = localStorage.getItem('movefy_telefono');
    }
    if (localStorage.getItem('movefy_contacto1')) {
      inputContacto1.value = localStorage.getItem('movefy_contacto1');
    }
    if (localStorage.getItem('movefy_contacto2')) {
      inputContacto2.value = localStorage.getItem('movefy_contacto2');
    }
    if (localStorage.getItem('movefy_pref_peligro') !== null) {
      prefPeligro.checked = localStorage.getItem('movefy_pref_peligro') === 'true';
    }
    if (localStorage.getItem('movefy_pref_notif') !== null) {
      prefNotif.checked = localStorage.getItem('movefy_pref_notif') === 'true';
    }
    
    // Update UI initial state
    updateProfileUI(inputNombre.value);
    
    // Sync Navbar Avatar
    syncNavbarAvatar(inputNombre.value);
  }

  function syncNavbarAvatar(nombreStr) {
    if(!nombreStr) return;
    const parts = nombreStr.trim().split(' ');
    let initials = parts[0].charAt(0).toUpperCase();
    if (parts.length > 1) {
      initials += parts[parts.length - 1].charAt(0).toUpperCase();
    }
    document.querySelectorAll('.avatar').forEach(el => {
      if(!el.querySelector('img')) el.textContent = initials;
    });
  }

  function updateProfileUI(nombreStr) {
    // Update Name Header
    const nameHeader = document.querySelector('.perfil-header h1');
    if (nameHeader && nombreStr) {
      nameHeader.textContent = nombreStr;
    }
    
    // Update avatar initials
    const avatarLarge = document.querySelector('.perfil-avatar-large');
    if (avatarLarge && nombreStr) {
      const parts = nombreStr.trim().split(' ');
      let initials = parts[0].charAt(0).toUpperCase();
      if (parts.length > 1) {
        initials += parts[parts.length - 1].charAt(0).toUpperCase();
      }
      
      const btnHTML = `<button class="edit-avatar-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </button>`;
      
      avatarLarge.innerHTML = initials + btnHTML;
    }
  }

  // Handle Form Submit
  if (perfilForm) {
    // Load data initially
    loadProfile();

    perfilForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nombre = inputNombre.value;
      
      // Save values to localStorage
      localStorage.setItem('movefy_nombre', nombre);
      localStorage.setItem('movefy_email', inputEmail.value);
      localStorage.setItem('movefy_telefono', inputTelefono.value);
      localStorage.setItem('movefy_contacto1', inputContacto1.value);
      localStorage.setItem('movefy_contacto2', inputContacto2.value);
      localStorage.setItem('movefy_pref_peligro', prefPeligro.checked);
      localStorage.setItem('movefy_pref_notif', prefNotif.checked);

      // Update UI
      updateProfileUI(nombre);
      syncNavbarAvatar(nombre);

      showToast('✅ Perfil guardado correctamente');
    });
  }

  // Toast Notification Function
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
});
