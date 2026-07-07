/* ========================================
   MOVEFY - Main JavaScript
   Global functionality: navbar, scroll animations, navigation
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Navbar Scroll Effect ---
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Active Nav Link on Scroll ---
  const navLinks = document.querySelectorAll('.navbar-nav a[href^="#"]');
  const sections = [];
  
  navLinks.forEach(link => {
    const targetId = link.getAttribute('href');
    if (targetId !== '#') {
      const section = document.querySelector(targetId);
      if (section) {
        sections.push({ link, section });
      }
    }
  });

  if (sections.length > 0) {
    const updateActiveLink = () => {
      const scrollPos = window.scrollY + 100;
      
      sections.forEach(({ link, section }) => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', updateActiveLink, { passive: true });
  }

  // --- Scroll Animations (Intersection Observer) ---
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  if (animatedElements.length > 0) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
  }

  // --- Counter Animation ---
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-counter'));
    const suffix = counter.getAttribute('data-suffix') || '';
    const duration = 2000;
    let start = 0;
    const startTime = performance.now();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            counter.textContent = current + suffix;
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              counter.textContent = target + suffix;
            }
          };
          requestAnimationFrame(animate);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(counter);
  });

  // --- Page Transition Effect ---
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.3s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });

  // --- Auth Navbar State ---
  const sessionData = localStorage.getItem('movefy_session');
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      const navActions = document.querySelector('.navbar-actions');
      if (navActions) {
        navActions.innerHTML = `
          <span class="user-welcome" style="color: rgba(255, 255, 255, 0.9); font-size: var(--font-size-sm); font-weight: 500; margin-right: var(--spacing-sm);">
            Hola, <strong>${session.name}</strong>
          </span>
          <a href="dashboard.html" class="btn btn-sm btn-primary" style="margin-right: 8px; font-size: var(--font-size-xs); padding: 6px 12px;">Dashboard</a>
          <button class="btn btn-sm btn-secondary btn-logout" style="border-color: rgba(255,255,255,0.25); color: var(--text-white); background: rgba(255,255,255,0.05); padding: 6px 12px; font-size: var(--font-size-xs);" onclick="handleLogout()">
            Cerrar Sesión
          </button>
        `;
      }

      // Update hero start button to go to dashboard
      const heroBtn = document.querySelector('.hero-buttons .btn-primary');
      if (heroBtn) {
        heroBtn.setAttribute('href', 'dashboard.html');
        heroBtn.textContent = 'Ir a mi Dashboard';
      }
    } catch (err) {
      console.error('Error parsing session:', err);
    }
  }

  // Define global logout handler
  window.handleLogout = function() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
      localStorage.removeItem('movefy_session');
      window.location.reload();
    }
  };

});
