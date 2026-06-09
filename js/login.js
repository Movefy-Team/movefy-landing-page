/* ========================================
   MOVEFY - Login JavaScript
   Password toggle, form validation, navigation
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Toggle Password Visibility ---
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');

  if (toggleBtn && passwordInput) {
    const eyeIcon = toggleBtn.querySelector('.eye-icon');
    const eyeOffIcon = toggleBtn.querySelector('.eye-off-icon');

    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      
      if (eyeIcon && eyeOffIcon) {
        eyeIcon.style.display = isPassword ? 'none' : 'block';
        eyeOffIcon.style.display = isPassword ? 'block' : 'none';
      }
    });
  }

  // --- Form Submission ---
  const loginForm = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!username || !password) {
        shakeElement(submitBtn);
        return;
      }

      // Check simulated database (localStorage)
      const storedEmail = localStorage.getItem('movefy_email');
      const storedPassword = localStorage.getItem('movefy_password');
      
      // Allow admin shortcut OR the registered user
      const isRegisteredUser = (username === storedEmail && password === storedPassword);
      const isAdmin = (username === 'admin@movefy.com' && password === 'admin123');

      if (!isRegisteredUser && !isAdmin) {
        shakeElement(submitBtn);
        // Show a brief error message
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Datos incorrectos';
        submitBtn.style.background = '#EF4444';
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.style.background = '';
        }, 2000);
        return;
      }

      // Loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spinner">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Ingresando...
      `;

      // Simulate login delay
      setTimeout(() => {
        if(isAdmin) {
          localStorage.setItem('movefy_nombre', 'Admin Movefy');
          localStorage.setItem('movefy_email', 'admin@movefy.com');
        }
        
        // Navigate to profile selection
        document.body.style.opacity = '0';
        setTimeout(() => {
          window.location.href = 'perfil.html';
        }, 300);
      }, 1200);
    });
  }

  // --- Shake Animation ---
  function shakeElement(el) {
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
  }

  // Add shake CSS
  const style = document.createElement('style');
  style.textContent = `
    .shake {
      animation: shake 0.5s ease;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
    .spinner {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // --- Input Focus Effects ---
  document.querySelectorAll('.input-wrapper').forEach(wrapper => {
    const input = wrapper.querySelector('input');
    if (input) {
      input.addEventListener('focus', () => {
        wrapper.style.borderColor = 'var(--primary-cyan)';
        wrapper.style.boxShadow = '0 0 0 3px rgba(0, 212, 170, 0.1)';
      });
      input.addEventListener('blur', () => {
        wrapper.style.borderColor = 'var(--border-color)';
        wrapper.style.boxShadow = 'none';
      });
    }
  });
});
