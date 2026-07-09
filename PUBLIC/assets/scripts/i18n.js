// i18n.js - Global Translation System

const translations = {
  es: {
    // Navigation (Landing)
    nav_routes: 'Rutas',
    nav_security: 'Seguridad',
    nav_fleet: 'Precios',
    nav_contact: 'Contacto',
    nav_login: 'Iniciar Sesión',
    nav_register: 'Registrarte',
    
    // Hero
    hero_title: 'Muévete con libertad, viaja con <span>seguridad</span>',
    hero_subtitle: 'La primer plataforma inteligente que prioriza tu integridad. Evita zonas de riesgo, reduce tiempos de traslado y toma decisiones informadas con datos en tiempo real.',
    hero_cta_start: 'Empezar mi viaje',
    hero_cta_more: 'Conoce más',
    float_card_1: '<strong>Juan Pérez</strong> · Ruta segura activa',
    float_card_2: '<strong>Secure Route</strong> · Tiempo real',
    float_card_3: '<strong>98%</strong> · Calificación seguridad',
    
    // Features
    features_title: 'Tecnología en Movimiento',
    features_subtitle: 'Nuestras herramientas están diseñadas para ofrecer seguridad absoluta y máxima rentabilidad operativa.',
    feature1_title: 'Rutas Dinámicas',
    feature1_desc: 'Recálculo instantáneo basado en tráfico, clima y zonas de riesgo detectadas por IA.',
    feature1_link: 'Descubre más',
    feature2_title: 'Escudo de Seguridad',
    feature2_desc: 'Protocolos de emergencia automáticos y monitoreo biométrico del conductor integrado.',
    feature2_link: 'Protocolos',
    feature3_title: 'Analítica Predictiva',
    feature3_desc: 'Visualización de datos avanzada para reducir el consumo de combustible hasta en un 25%.',
    feature3_link: 'Ver informes',
    // About the Product
    about_title: 'Sobre el Producto',
    about_subtitle: 'Mira Movefy en acción y descubre cómo revolucionamos la seguridad y navegación urbana.',
    about_team_title: 'Sobre el Equipo',
    about_team_subtitle: 'Conoce más acerca de nosotros y nuestra visión para un futuro más seguro.',

    // About Us
    team_nav: 'Nosotros',
    team_title: 'Nuestro Equipo',
    team_subtitle: 'Conoce a las mentes detrás de Movefy, dedicadas a construir la navegación urbana del futuro.',

    // Pricing
    pricing_title: 'Planes diseñados para ti',
    pricing_subtitle: 'Elige el nivel de protección e inteligencia que necesitas en tu ruta.',
    price_basic_title: 'Básico',
    price_basic_desc: 'Para moverte ocasionalmente por la ciudad.',
    price_basic_btn: 'Comenzar Gratis',
    price_popular: 'Más Elegido',
    price_pro_title: 'Movefy Pro',
    price_pro_desc: 'Seguridad total en tu día a día.',
    price_pro_btn: 'Probar Pro 7 días',
    price_fleet_title: 'Flotas & Empresas',
    price_fleet_desc: 'Control absoluto para tu negocio.',
    price_fleet_btn: 'Contactar Ventas',
    
    // CTA & Footer
    cta_title: '¿Listo para transformar su logística urbana?',
    cta_subtitle: 'Únase a las más de 500 empresas que ya están ahorrando tiempo y mejorando la seguridad de sus empleados con SafeRoute.',
    cta_btn_start: 'Empezar ahora gratis',
    cta_btn_expert: 'Hablar con un experto',
    footer_desc: 'Innovación en logística urbana y navegación de alta precisión. Diseñado para un futuro más seguro en las ciudades del mañana.',
    footer_copy: '© 2026 Movefy. Todos los derechos reservados.',
    footer_status: 'Sistema <a href="#">Operativo</a>',

    // Auth (Login / Register)
    auth_back: 'Volver al inicio',
    login_title: 'Bienvenido de nuevo',
    login_subtitle: 'Ingresa tus credenciales para acceder a Movefy',
    login_email: 'Correo Electrónico',
    login_pass: 'Contraseña',
    login_forgot: '¿Olvidaste tu contraseña?',
    login_btn: 'Iniciar Sesión',
    login_or: 'O continúa con',
    login_footer_1: '¿No tienes una cuenta?',
    login_footer_2: 'Regístrate',
    
    reg_title: 'Crea tu cuenta',
    reg_subtitle: 'Regístrate para empezar a viajar de forma segura',
    reg_name: 'Nombre Completo',
    reg_email: 'Correo Electrónico',
    reg_pass: 'Contraseña',
    reg_pass_conf: 'Confirmar Contraseña',
    reg_terms: 'Acepto los <a href="#">Términos y Condiciones</a> y la <a href="#">Política de Privacidad</a> de Movefy.',
    reg_btn: 'Crear Cuenta',
    reg_footer_1: '¿Ya tienes una cuenta?',
    reg_footer_2: 'Inicia Sesión',

    // Dashboard
    dash_search_1: '¿Desde dónde sales?',
    dash_search_2: '¿A dónde vas?',
    dash_type_safe: 'Ruta Segura',
    dash_type_fast: 'Ruta Rápida',
    dash_search_btn: 'Buscar Ruta',
    dash_alert_btn: 'Reportar Alerta',
    dash_layers: 'Capas del Mapa',
    dash_layer_traffic: 'Tráfico Real',
    dash_layer_incidents: 'Incidentes / Zonas Peligrosas',
    dash_layer_safe: 'Corredores Seguros',
    dash_stat_co2: 'CO2 Ahorrado',
    dash_stat_time: 'Tiempo Ahorrado',
    dash_stat_score: 'Score Seguridad',
    dash_routes_title: 'Rutas Guardadas',
    dash_routes_1: 'Casa - Trabajo',
    dash_routes_2: 'Trabajo - Universidad',
    dash_recent_alerts: 'Alertas Recientes',
    dash_alert_1: 'Accidente en Av. Javier Prado',
    dash_alert_1_time: 'Hace 5 min',
    dash_alert_2: 'Tráfico denso en Vía Expresa',
    dash_alert_2_time: 'Hace 12 min'
  },
  
  en: {
    // Navigation (Landing)
    nav_routes: 'Routes',
    nav_security: 'Security',
    nav_fleet: 'Pricing',
    nav_contact: 'Contact',
    nav_login: 'Sign In',
    nav_register: 'Sign Up',
    
    // Hero
    hero_title: 'Move freely, travel with <span>safety</span>',
    hero_subtitle: 'The first smart platform that prioritizes your safety. Avoid risk zones, reduce travel times, and make informed decisions with real-time data.',
    hero_cta_start: 'Start my journey',
    hero_cta_more: 'Learn more',
    float_card_1: '<strong>Juan Pérez</strong> · Safe route active',
    float_card_2: '<strong>Secure Route</strong> · Real time',
    float_card_3: '<strong>98%</strong> · Safety rating',
    
    // Features
    features_title: 'Technology in Motion',
    features_subtitle: 'Our tools are designed to provide absolute security and maximum operational profitability.',
    feature1_title: 'Dynamic Routes',
    feature1_desc: 'Instant recalculation based on traffic, weather, and AI-detected risk zones.',
    feature1_link: 'Discover more',
    feature2_title: 'Security Shield',
    feature2_desc: 'Automatic emergency protocols and integrated driver biometric monitoring.',
    feature2_link: 'Protocols',
    feature3_title: 'Predictive Analytics',
    feature3_desc: 'Advanced data visualization to reduce fuel consumption by up to 25%.',
    feature3_link: 'View reports',
    // About the Product
    about_title: 'About the Product',
    about_subtitle: 'See Movefy in action and discover how we revolutionize urban safety and navigation.',
    about_team_title: 'About the Team',
    about_team_subtitle: 'Learn more about us and our vision for a safer future.',

    // About Us
    team_nav: 'About Us',
    team_title: 'Our Team',
    team_subtitle: 'Meet the minds behind Movefy, dedicated to building the urban navigation of the future.',

    // Pricing
    pricing_title: 'Plans designed for you',
    pricing_subtitle: 'Choose the level of protection and intelligence you need on your route.',
    price_basic_title: 'Basic',
    price_basic_desc: 'For moving occasionally around the city.',
    price_basic_btn: 'Start for Free',
    price_popular: 'Most Popular',
    price_pro_title: 'Movefy Pro',
    price_pro_desc: 'Total safety in your daily life.',
    price_pro_btn: 'Try Pro 7 days',
    price_fleet_title: 'Fleets & Enterprises',
    price_fleet_desc: 'Absolute control for your business.',
    price_fleet_btn: 'Contact Sales',
    
    // CTA & Footer
    cta_title: 'Ready to transform your urban logistics?',
    cta_subtitle: 'Join the 500+ companies already saving time and improving employee safety with SafeRoute.',
    cta_btn_start: 'Get started for free',
    cta_btn_expert: 'Talk to an expert',
    footer_desc: 'Innovation in urban logistics and high-precision navigation. Designed for a safer future in the cities of tomorrow.',
    footer_copy: '© 2026 Movefy. All rights reserved.',
    footer_status: 'System <a href="#">Operational</a>',

    // Auth (Login / Register)
    auth_back: 'Back to home',
    login_title: 'Welcome back',
    login_subtitle: 'Enter your credentials to access Movefy',
    login_email: 'Email Address',
    login_pass: 'Password',
    login_forgot: 'Forgot your password?',
    login_btn: 'Sign In',
    login_or: 'Or continue with',
    login_footer_1: 'Don\'t have an account?',
    login_footer_2: 'Sign up',
    
    reg_title: 'Create your account',
    reg_subtitle: 'Sign up to start traveling safely',
    reg_name: 'Full Name',
    reg_email: 'Email Address',
    reg_pass: 'Password',
    reg_pass_conf: 'Confirm Password',
    reg_terms: 'I accept the <a href="#">Terms and Conditions</a> and the <a href="#">Privacy Policy</a> of Movefy.',
    reg_btn: 'Create Account',
    reg_footer_1: 'Already have an account?',
    reg_footer_2: 'Sign in',

    // Dashboard
    dash_search_1: 'Where are you leaving from?',
    dash_search_2: 'Where are you going?',
    dash_type_safe: 'Safe Route',
    dash_type_fast: 'Fast Route',
    dash_search_btn: 'Find Route',
    dash_alert_btn: 'Report Alert',
    dash_layers: 'Map Layers',
    dash_layer_traffic: 'Live Traffic',
    dash_layer_incidents: 'Incidents / Danger Zones',
    dash_layer_safe: 'Safe Corridors',
    dash_stat_co2: 'CO2 Saved',
    dash_stat_time: 'Time Saved',
    dash_stat_score: 'Safety Score',
    dash_routes_title: 'Saved Routes',
    dash_routes_1: 'Home - Work',
    dash_routes_2: 'Work - University',
    dash_recent_alerts: 'Recent Alerts',
    dash_alert_1: 'Accident on Javier Prado Ave',
    dash_alert_1_time: '5 mins ago',
    dash_alert_2: 'Heavy traffic on Via Expresa',
    dash_alert_2_time: '12 mins ago'
  }
};

const labelMap = { es: 'ES', en: 'EN' };

window.setLanguage = function(lang) {
  document.documentElement.lang = lang;
  const dict = translations[lang];
  if (!dict) return;

  // Translate all [data-i18n] tags
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      // Si el elemento es un input, se cambia el placeholder, sino el innerHTML
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = dict[key];
      } else {
        el.innerHTML = dict[key];
      }
    }
  });

  // Update title and meta for pages that have it
  if (window.location.pathname.includes('dashboard')) {
    document.title = lang === 'en' ? 'Dashboard - Movefy' : 'Dashboard - Movefy';
  } else if (window.location.pathname.includes('login')) {
    document.title = lang === 'en' ? 'Sign In - Movefy' : 'Iniciar Sesión - Movefy';
  } else if (window.location.pathname.includes('registro')) {
    document.title = lang === 'en' ? 'Sign Up - Movefy' : 'Registrarse - Movefy';
  } else {
    // Default to Landing
    if (lang === 'en') {
      document.title = 'Movefy - Safe Routes, Smart Travel';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', 'Movefy: The first smart platform that prioritizes your safety. Avoid risk zones, reduce travel times, and make informed decisions with real-time data.');
    } else {
      document.title = 'Movefy - Rutas Seguras, Viajes Inteligentes';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', 'Movefy: La primer plataforma inteligente que prioriza tu integridad. Evita zonas de riesgo, reduce tiempos de traslado y toma decisiones informadas con datos en tiempo real.');
    }
  }

  // Update toggle button text if exists
  const label = document.getElementById('currentLangLabel');
  if (label) label.textContent = labelMap[lang];

  // Update active state in dropdown if exists
  document.querySelectorAll('.lang-option').forEach(opt => {
    const isActive = opt.getAttribute('data-lang') === lang;
    opt.classList.toggle('active', isActive);
    opt.setAttribute('aria-selected', isActive);
  });

  localStorage.setItem('movefy-lang', lang);
};

// Initialize listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('langSelector');
  const toggle = document.getElementById('langToggle');

  if (toggle && selector) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = selector.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // Language option clicks
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      window.setLanguage(opt.getAttribute('data-lang'));
      if (selector) selector.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (selector && !selector.contains(e.target) && toggle && !toggle.contains(e.target)) {
      selector.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selector) {
      selector.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Load language from storage or default to 'es'
  const saved = localStorage.getItem('movefy-lang') || 'es';
  window.setLanguage(saved);
});
