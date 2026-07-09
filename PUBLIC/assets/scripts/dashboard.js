/* ========================================
   MOVEFY - Smart Dashboard Logic v3.1 (Premium)
   ======================================== */

// --- Protección de Autenticación ---
let sessionData = null;
try {
  sessionData = localStorage.getItem('movefy_session');
} catch (e) {
  console.warn('localStorage is blocked or unavailable:', e);
}

// Fallback: Read session data from URL parameters if localStorage is empty/blocked
if (!sessionData) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramName = urlParams.get('name');
    const paramEmail = urlParams.get('email');
    if (paramName && paramEmail) {
      sessionData = JSON.stringify({ name: paramName, email: paramEmail });
      // Try to save to localStorage as a cache for page reloads
      try {
        localStorage.setItem('movefy_session', sessionData);
      } catch (err) {}
    }
  } catch (urlErr) {
    console.error('Error parsing URL parameters:', urlErr);
  }
}

if (!sessionData) {
  alert('Acceso denegado. Por favor, inicia sesión.');
  window.location.href = 'login.html';
}
const session = JSON.parse(sessionData);

// --- Variables Globales ---
let map;
let routeLayerSafe = null;
let routeLayerFast = null;
let startMarker = null;
let endMarker = null;
let incidentMarkers = [];
let startCoords = null;
let endCoords = null;
let currentRouteSteps = [];
let searchDebounce = null;
let activeRouteType = 'safe'; 
let routeDataCache = { safe: null, fast: null };
let selectingPoint = null; 

const LIMA_CENTER = [-12.0464, -77.0428];
const LIMA_VIEWBOX = '-77.25,-11.75,-76.65,-12.35';

const communityIncidents = [
  { id: 1, type: 'suspicious', title: 'Actividad Sospechosa', desc: 'Av. Larco, Miraflores • hace 2 min', coords: [-12.1250, -77.0312], color: 'red', icon: 'lucide-alert-triangle' },
  { id: 2, type: 'police', title: 'Patrullaje Policial', desc: 'Calle Shell, Miraflores • hace 8 min', coords: [-12.1220, -77.0315], color: 'cyan', icon: 'lucide-shield' },
  { id: 3, type: 'blockage', title: 'Calle Bloqueada', desc: 'Ovalo Higuereta • hace 15 min', coords: [-12.1275, -77.0220], color: 'gray', icon: 'lucide-wrench' },
  { id: 4, type: 'accident', title: 'Accidente Menor', desc: 'Vía Expresa • hace 22 min', coords: [-12.1200, -77.0220], color: 'red', icon: 'lucide-car' }
];

let incidentsList = [...communityIncidents];

// ==========================================
//  INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupUserInfo();
  initMap();
  setupSearch();
  setupEventListeners();
  renderIncidentsList();
  renderIncidentMarkers();
  renderDirectionsEmpty();
});

function setupUserInfo() {
  const firstLetter = session.name ? session.name.charAt(0).toUpperCase() : 'U';
  document.querySelectorAll('.user-avatar-placeholder').forEach(el => el.textContent = firstLetter);
  document.querySelectorAll('.user-name-placeholder').forEach(el => el.textContent = session.name);
  document.querySelectorAll('.user-email-placeholder').forEach(el => el.textContent = session.email);
}

// ==========================================
//  MAPA LEAFLET
// ==========================================
function initMap() {
  map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView(LIMA_CENTER, 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  L.control.attribution({ position: 'bottomleft', prefix: false })
    .addAttribution('© <a href="https://osm.org">OpenStreetMap</a>')
    .addTo(map);

  map.on('click', handleMapClick);
}

async function handleMapClick(e) {
  const { lat, lng } = e.latlng;
  let target;
  if (!startCoords) {
    target = 'origin';
  } else if (!endCoords) {
    target = 'destination';
  } else if (selectingPoint) {
    target = selectingPoint;
  } else {
    target = 'destination';
  }

  let placeName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es&zoom=18`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.display_name) {
      placeName = data.display_name.split(',').slice(0, 3).join(',').trim();
    }
  } catch (err) {
    console.warn('Geocodificación inversa falló:', err);
  }

  if (target === 'origin') {
    document.getElementById('inputOrigin').value = placeName;
    startCoords = [lat, lng];
    setMarker('start', startCoords, placeName);
    showMapToast('Origen seleccionado en el mapa');
  } else {
    document.getElementById('inputDestination').value = placeName;
    endCoords = [lat, lng];
    setMarker('end', endCoords, placeName);
    showMapToast('Destino seleccionado en el mapa');
  }

  selectingPoint = null;
  updateSelectButtons();

  if (startCoords && endCoords) {
    fetchRoutes(startCoords, endCoords);
  }
}

function showMapToast(message) {
  let toast = document.getElementById('mapToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mapToast';
    toast.className = 'map-toast';
    document.querySelector('.dashboard-map-container').appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

function updateSelectButtons() {
  const btnOrig = document.getElementById('btnSelectOriginMap');
  const btnDest = document.getElementById('btnSelectDestMap');
  if (btnOrig) btnOrig.classList.toggle('active', selectingPoint === 'origin');
  if (btnDest) btnDest.classList.toggle('active', selectingPoint === 'destination');
}

// ==========================================
//  BÚSQUEDA
// ==========================================
function setupSearch() {
  const originInput = document.getElementById('inputOrigin');
  const destInput = document.getElementById('inputDestination');
  const originResults = document.getElementById('originResults');
  const destResults = document.getElementById('destResults');

  originInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => geocodeSearch(originInput.value, originResults, 'origin'), 350);
  });

  destInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => geocodeSearch(destInput.value, destResults, 'destination'), 350);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-group')) {
      originResults.innerHTML = '';
      destResults.innerHTML = '';
      originResults.classList.remove('visible');
      destResults.classList.remove('visible');
    }
  });

  document.getElementById('btnSelectOriginMap').addEventListener('click', () => {
    selectingPoint = selectingPoint === 'origin' ? null : 'origin';
    updateSelectButtons();
    if (selectingPoint) showMapToast('Haz clic en el mapa para elegir el origen');
  });

  document.getElementById('btnSelectDestMap').addEventListener('click', () => {
    selectingPoint = selectingPoint === 'destination' ? null : 'destination';
    updateSelectButtons();
    if (selectingPoint) showMapToast('Haz clic en el mapa para elegir el destino');
  });
}

async function geocodeSearch(query, resultsContainer, type) {
  if (query.length < 3) {
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove('visible');
    return;
  }

  try {
    const queryWithCity = query.toLowerCase().includes('lima') ? query : query + ', Lima, Perú';
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}&countrycodes=pe&limit=8&accept-language=es&viewbox=${LIMA_VIEWBOX}&bounded=1&addressdetails=1`;
    const res = await fetch(url);
    const data = await res.json();

    resultsContainer.innerHTML = '';
    if (data.length === 0) {
      resultsContainer.innerHTML = '<div class="search-result-item no-result"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg> Sin resultados. Intenta con otra dirección.</div>';
      resultsContainer.classList.add('visible');
      return;
    }

    data.forEach(place => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      const iconSvg = getPlaceSvgIcon(place.type, place.class);
      item.innerHTML = `<span class="result-icon" style="flex-shrink:0;display:flex;">${iconSvg}</span><span>${place.display_name}</span>`;
      item.addEventListener('click', () => {
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        const shortName = place.display_name.split(',').slice(0, 2).join(',').trim();

        if (type === 'origin') {
          document.getElementById('inputOrigin').value = shortName;
          startCoords = [lat, lon];
          setMarker('start', startCoords, shortName);
        } else {
          document.getElementById('inputDestination').value = shortName;
          endCoords = [lat, lon];
          setMarker('end', endCoords, shortName);
        }

        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('visible');

        if (startCoords && endCoords) {
          fetchRoutes(startCoords, endCoords);
        }
      });
      resultsContainer.appendChild(item);
    });

    resultsContainer.classList.add('visible');
  } catch (err) {
    console.error('Error en geocodificación:', err);
  }
}

function getPlaceSvgIcon(type, cls) {
  const s = 'width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  if (cls === 'building' || type === 'house' || type === 'residential')
    return `<svg ${s}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  if (cls === 'highway' || type === 'motorway')
    return `<svg ${s}><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>`;
  if (type === 'suburb' || type === 'neighbourhood')
    return `<svg ${s}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  if (type === 'city' || type === 'town')
    return `<svg ${s}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22V12h6v10"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/></svg>`;
  if (cls === 'shop')
    return `<svg ${s}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`;
  if (type === 'school' || type === 'university')
    return `<svg ${s}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 4 3 6 3s6-2 6-3v-5"/></svg>`;
  return `<svg ${s}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
}

function setMarker(type, coords, label) {
  if (type === 'start') {
    if (startMarker) map.removeLayer(startMarker);
    const iconHtml = `<div style="position:relative;width:36px;height:44px;">
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#00D4AA"/>
        <circle cx="18" cy="16" r="11" fill="white" fill-opacity="0.25"/>
        <text x="18" y="21" text-anchor="middle" fill="white" font-size="14" font-weight="700" font-family="Inter,sans-serif">A</text>
      </svg>
    </div>`;
    const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [36, 44], iconAnchor: [18, 44] });
    startMarker = L.marker(coords, { icon }).addTo(map).bindPopup(`<b>Origen:</b> ${label}`);
  } else {
    if (endMarker) map.removeLayer(endMarker);
    const iconHtml = `<div style="position:relative;width:36px;height:44px;">
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#EF4444"/>
        <circle cx="18" cy="16" r="11" fill="white" fill-opacity="0.25"/>
        <text x="18" y="21" text-anchor="middle" fill="white" font-size="14" font-weight="700" font-family="Inter,sans-serif">B</text>
      </svg>
    </div>`;
    const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [36, 44], iconAnchor: [18, 44] });
    endMarker = L.marker(coords, { icon }).addTo(map).bindPopup(`<b>Destino:</b> ${label}`);
  }

  map.setView(coords, 15);
}

// ==========================================
//  CÁLCULO DE RUTAS Y TRÁFICO (OSRM + SIMULACIÓN LIMA)
// ==========================================

function calculateRealLimaTraffic(route, isSafeRoute) {
  const distanceKm = route.distance / 1000;
  
  // 1. OBTENER HORA ACTUAL EN LIMA
  const now = new Date();
  const options = { timeZone: 'America/Lima', hour: 'numeric', minute: 'numeric', hour12: false };
  const limaTimeStr = now.toLocaleString('en-US', options);
  const [hour, minute] = limaTimeStr.split(':').map(Number);
  const currentHourFloat = hour + (minute / 60);

  // 2. DETERMINAR VELOCIDAD PROMEDIO BASE SEGÚN LA DISTANCIA
  let baseSpeedKmh = 24; // Rutas medias (Flujo por avenidas grandes)
  
  if (distanceKm <= 4) {
    baseSpeedKmh = 22; // Rutas cortas (Más semáforos, tráfico local de distrito)
  } else if (distanceKm > 10) {
    baseSpeedKmh = 22; // Rutas largas cross-city (Vías rápidas pero con cuellos de botella)
  }

  // 3. FACTOR DE TRÁFICO POR HORA PICO (Modifica la velocidad)
  let speedMultiplier = 0.85; // Tráfico regular de día (Lima nunca va al 100% de la velocidad base)
  
  if (currentHourFloat >= 7.0 && currentHourFloat <= 9.5) {
    speedMultiplier = 0.65; // Hora pico mañana
  } else if (currentHourFloat >= 17.5 && currentHourFloat <= 20.5) {
    speedMultiplier = 0.55; // Hora pico noche (peor congestión)
  } else if (currentHourFloat >= 12.5 && currentHourFloat <= 14.5) {
    speedMultiplier = 0.80; // Hora de almuerzo (colegios/oficinas)
  } else if (currentHourFloat >= 0.0 && currentHourFloat <= 5.0) {
    speedMultiplier = 1.5; // Madrugada (vía libre)
  }

  // 4. AJUSTE POR TIPO DE RUTA
  if (isSafeRoute) {
    // La ruta segura penaliza ligerísimamente por preferir grandes avenidas
    speedMultiplier *= 0.95; 
  }

  // 5. CÁLCULO DE TIEMPO FINAL
  let realSpeedKmh = baseSpeedKmh * speedMultiplier;
  
  // Límite mínimo absoluto de velocidad
  if (realSpeedKmh < 8) realSpeedKmh = 8;

  // Calculamos el tiempo en horas y lo pasamos a segundos
  const timeHours = distanceKm / realSpeedKmh;
  let finalDurationSecs = timeHours * 3600;
  
  // Añadimos penalidad microscópica por cantidad de giros
  const numberOfSteps = route.legs && route.legs[0] && route.legs[0].steps ? route.legs[0].steps.length : 0;
  finalDurationSecs += (numberOfSteps * 2);

  return finalDurationSecs;
}

async function fetchRoutes(from, to) {
  showRouteLoading(true);
  document.getElementById('routeToggle').style.display = 'none';
  document.getElementById('routeStatsPanel').style.display = 'none';

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      alert('No se encontró una ruta entre esos puntos.');
      showRouteLoading(false);
      return;
    }

    if (routeLayerSafe) map.removeLayer(routeLayerSafe);
    if (routeLayerFast) map.removeLayer(routeLayerFast);

    const routeFast = data.routes[0];
    const routeSafe = data.routes.length > 1 ? data.routes[1] : data.routes[0];

    // --- APLICAR MODELO DE TRÁFICO REAL DE LIMA ---
    routeFast.duration = calculateRealLimaTraffic(routeFast, false);
    routeSafe.duration = calculateRealLimaTraffic(routeSafe, true);
    
    routeDataCache.fast = routeFast;
    routeDataCache.safe = routeSafe;

    const fastMinutes = Math.round(routeFast.duration / 60);
    const safeMinutes = Math.round(routeSafe.duration / 60);

    const btnFast = document.getElementById('toggleFast');
    const btnSafe = document.getElementById('toggleSafe');
    btnFast.innerHTML = `<div class="toggle-icon"><i class="lucide-zap"></i></div>Ruta Óptima <span class="toggle-time">${fastMinutes} min</span>`;
    btnSafe.innerHTML = `<div class="toggle-icon"><i class="lucide-shield"></i></div>Ruta Segura <span class="toggle-time">${safeMinutes} min</span>`;

    document.getElementById('routeToggle').style.display = 'flex';
    drawBothRoutes();

    activeRouteType = 'safe';
    btnSafe.classList.add('active');
    btnFast.classList.remove('active');
    showRouteStats(routeSafe);

    const activeLayer = routeLayerSafe || routeLayerFast;
    if (activeLayer) map.fitBounds(activeLayer.getBounds(), { padding: [60, 60] });

  } catch (err) {
    console.error('Error al calcular rutas:', err);
    alert('Error al calcular la ruta. Verifica tu conexión.');
  }

  showRouteLoading(false);
}

function drawBothRoutes() {
  if (routeLayerSafe) map.removeLayer(routeLayerSafe);
  if (routeLayerFast) map.removeLayer(routeLayerFast);

  const safCoords = routeDataCache.safe.geometry.coordinates.map(c => [c[1], c[0]]);
  const fastCoords = routeDataCache.fast.geometry.coordinates.map(c => [c[1], c[0]]);

  if (activeRouteType === 'safe') {
    routeLayerFast = L.polyline(fastCoords, {
      color: '#FF7052', weight: 4, opacity: 0.3, lineCap: 'round', lineJoin: 'round', dashArray: '8,8'
    }).addTo(map);
    routeLayerSafe = L.polyline(safCoords, {
      color: '#00D4AA', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round'
    }).addTo(map);
  } else {
    routeLayerSafe = L.polyline(safCoords, {
      color: '#00D4AA', weight: 4, opacity: 0.3, lineCap: 'round', lineJoin: 'round', dashArray: '8,8'
    }).addTo(map);
    routeLayerFast = L.polyline(fastCoords, {
      color: '#FF7052', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round'
    }).addTo(map);
  }
}

function showRouteStats(route) {
  const distKm = (route.distance / 1000).toFixed(1);
  const durationMin = Math.round(route.duration / 60);
  const safetyScore = activeRouteType === 'safe'
    ? Math.floor(Math.random() * 8) + 90
    : Math.floor(Math.random() * 15) + 70;

  document.getElementById('safetyValue').textContent = safetyScore + '%';
  document.getElementById('etaValue').textContent = durationMin + ' min';
  document.getElementById('distanceValue').textContent = distKm + ' km';
  document.getElementById('routeStatsPanel').style.display = 'grid';

  currentRouteSteps = extractSteps(route);
  renderDirections(currentRouteSteps, distKm, durationMin);
}

function extractSteps(route) {
  const steps = [];
  if (route.legs && route.legs.length > 0) {
    route.legs[0].steps.forEach(step => {
      const maneuver = step.maneuver;
      const name = step.name || 'la calle';
      const dist = step.distance;
      const icon = getManeuverIcon(maneuver.type, maneuver.modifier);
      const distText = dist >= 1000 ? (dist / 1000).toFixed(1) + ' km' : Math.round(dist) + ' m';

      let instruction = '';
      if (maneuver.type === 'depart') {
        instruction = `Sal hacia ${name}`;
      } else if (maneuver.type === 'arrive') {
        instruction = `Has llegado a tu destino`;
      } else if (maneuver.type === 'turn') {
        const dir = translateModifier(maneuver.modifier);
        instruction = `Gira a la ${dir} en ${name}`;
      } else if (maneuver.type === 'new name' || maneuver.type === 'continue') {
        instruction = `Continúa por ${name}`;
      } else if (maneuver.type === 'merge') {
        instruction = `Incorpórate a ${name}`;
      } else if (maneuver.type === 'fork') {
        const dir = translateModifier(maneuver.modifier);
        instruction = `Toma el desvío hacia la ${dir} por ${name}`;
      } else if (maneuver.type === 'roundabout') {
        instruction = `En la rotonda, toma la salida hacia ${name}`;
      } else if (maneuver.type === 'end of road') {
        const dir = translateModifier(maneuver.modifier);
        instruction = `Al final de la calle, gira a la ${dir} en ${name}`;
      } else {
        instruction = `Avanza por ${name}`;
      }

      steps.push({ instruction, distance: distText, icon });
    });
  }
  return steps;
}

function translateModifier(mod) {
  const translations = {
    'left': 'izquierda', 'right': 'derecha',
    'sharp left': 'izquierda (cerrada)', 'sharp right': 'derecha (cerrada)',
    'slight left': 'izquierda (suave)', 'slight right': 'derecha (suave)',
    'straight': 'frente', 'uturn': 'vuelta en U'
  };
  return translations[mod] || mod || '';
}

function getManeuverIcon(type, modifier) {
  const s = 'width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  if (type === 'depart') return `<svg ${s}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
  if (type === 'arrive') return `<svg ${s}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
  if (type === 'turn' && modifier && modifier.includes('left')) return `<svg ${s}><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`;
  if (type === 'turn' && modifier && modifier.includes('right')) return `<svg ${s}><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>`;
  if (type === 'roundabout') return `<svg ${s}><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`;
  if (type === 'merge') return `<svg ${s}><path d="m8 6 4-4 4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/><path d="m20 22-5-5"/></svg>`;
  if (type === 'fork') return `<svg ${s}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`;
  if (type === 'end of road') return `<svg ${s}><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>`;
  return `<svg ${s}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
}

function showRouteLoading(show) {
  const loader = document.getElementById('routeLoader');
  if (loader) loader.style.display = show ? 'flex' : 'none';
}

// ==========================================
//  INDICACIONES DE RUTA
// ==========================================
function renderDirectionsEmpty() {
  const container = document.getElementById('directionsSteps');
  if (!container) return;
  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: var(--text-light);">
      <i class="lucide-map" style="font-size: 48px; margin-bottom: 16px; display: block; color: var(--border-color);"></i>
      <p style="font-size: 15px; font-weight: 600; color: var(--text-dark);">Busca un origen y destino para ver las indicaciones</p>
      <p style="font-size: 12px; margin-top: 8px; line-height: 1.5;">Puedes escribir una dirección o <b>hacer clic en el mapa</b> para seleccionar puntos.</p>
    </div>
  `;
}

function renderDirections(steps, distKm, durationMin) {
  const container = document.getElementById('directionsSteps');
  if (!container) return;

  const originName = document.getElementById('inputOrigin').value || 'Origen';
  const destName = document.getElementById('inputDestination').value || 'Destino';
  const routeLabel = activeRouteType === 'safe' ? 'Ruta Segura' : 'Ruta Óptima';
  const routeColor = activeRouteType === 'safe' ? 'var(--primary-cyan)' : 'var(--color-fastest)';
  const routeIcon = activeRouteType === 'safe' ? 'lucide-shield' : 'lucide-zap';

  let html = `
    <div class="directions-summary">
      <div class="directions-summary-left">
        <div class="directions-label">Desde</div>
        <div class="directions-place">${originName}</div>
      </div>
      <div class="directions-arrow"><i class="lucide-arrow-right"></i></div>
      <div class="directions-summary-left">
        <div class="directions-label">Hasta</div>
        <div class="directions-place">${destName}</div>
      </div>
      <div class="directions-summary-right">
        <div style="font-size: 20px; font-weight: 800; color: ${routeColor};">${durationMin} min</div>
        <div style="font-size: 11px; color: var(--text-light); display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
          ${distKm} km · ${routeLabel}
        </div>
      </div>
    </div>
  `;

  steps.forEach((step, i) => {
    const bgColor = i === steps.length - 1 ? '#E0FBF4' : '#F1F5F9';
    const iconColor = i === steps.length - 1 ? 'var(--primary-cyan)' : 'var(--text-gray)';
    html += `
      <div class="directions-step">
        <div class="step-number" style="background: ${bgColor}; color: ${iconColor};">
          ${step.icon}
        </div>
        <div class="step-text">${step.instruction}</div>
        <div class="step-dist">${step.distance}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ==========================================
//  INCIDENTES COMUNITARIOS
// ==========================================
const reportSvgIcons = {
  'lucide-alert-triangle': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  'lucide-shield': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  'lucide-wrench': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  'lucide-car': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'
};

function renderIncidentsList() {
  const container = document.getElementById('reportsList');
  if (!container) return;

  container.innerHTML = '';
  incidentsList.forEach(inc => {
    const card = document.createElement('div');
    card.className = 'report-card';
    card.onclick = () => {
      map.setView(inc.coords, 16);
      const idx = incidentsList.indexOf(inc);
      if (incidentMarkers[idx]) incidentMarkers[idx].openPopup();
    };
    const svgIcon = reportSvgIcons[inc.icon] || reportSvgIcons['lucide-alert-triangle'];
    card.innerHTML = `
      <div class="report-icon-wrapper ${inc.color}">${svgIcon}</div>
      <div class="report-info">
        <div class="report-title">${inc.title}</div>
        <div class="report-desc">${inc.desc}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderIncidentMarkers() {
  incidentMarkers.forEach(m => map.removeLayer(m));
  incidentMarkers = [];

  const svgIcons = {
    'lucide-alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" stroke="white" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="0.5" fill="white" stroke="white" stroke-width="1"/>',
    'lucide-shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    'lucide-wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    'lucide-car': '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="17" r="2" fill="none" stroke="white" stroke-width="2"/><circle cx="17" cy="17" r="2" fill="none" stroke="white" stroke-width="2"/>'
  };

  incidentsList.forEach(inc => {
    const markerColor = inc.color === 'red' ? '#EF4444' :
                        inc.color === 'cyan' ? '#00D4AA' :
                        inc.color === 'orange' ? '#F97316' : '#94A3B8';

    const svgPath = svgIcons[inc.icon] || svgIcons['lucide-alert-triangle'];
    const html = `<div style="
      background: ${markerColor}; width: 30px; height: 30px; border-radius: 50%;
      border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    "><svg width="16" height="16" viewBox="0 0 24 24" fill="none">${svgPath}</svg></div>`;
    
    const icon = L.divIcon({ html, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });
    const marker = L.marker(inc.coords, { icon }).addTo(map).bindPopup(`<b>${inc.title}</b><br>${inc.desc}`);
    incidentMarkers.push(marker);
  });
}

// ==========================================
//  EVENTOS DE INTERFAZ
// ==========================================
function setupEventListeners() {
  document.getElementById('zoomIn').onclick = () => map.zoomIn();
  document.getElementById('zoomOut').onclick = () => map.zoomOut();
  document.getElementById('centerMap').onclick = () => {
    map.setView(LIMA_CENTER, 13);
    showMapToast('Mapa centrado en Lima');
  };

  document.getElementById('btnBuscarRuta').addEventListener('click', () => {
    if (startCoords && endCoords) {
      fetchRoutes(startCoords, endCoords);
    } else {
      alert('Busca y selecciona un origen y un destino, o haz clic en el mapa.');
    }
  });

  document.getElementById('toggleSafe').addEventListener('click', () => {
    if (!routeDataCache.safe) return;
    activeRouteType = 'safe';
    document.getElementById('toggleSafe').classList.add('active');
    document.getElementById('toggleFast').classList.remove('active');
    drawBothRoutes();
    showRouteStats(routeDataCache.safe);
    if (routeLayerSafe) map.fitBounds(routeLayerSafe.getBounds(), { padding: [60, 60] });
  });

  document.getElementById('toggleFast').addEventListener('click', () => {
    if (!routeDataCache.fast) return;
    activeRouteType = 'fast';
    document.getElementById('toggleFast').classList.add('active');
    document.getElementById('toggleSafe').classList.remove('active');
    drawBothRoutes();
    showRouteStats(routeDataCache.fast);
    if (routeLayerFast) map.fitBounds(routeLayerFast.getBounds(), { padding: [60, 60] });
  });

  document.getElementById('btnIncidentAlert').onclick = () => document.getElementById('incidentModal').classList.add('open');
  document.getElementById('btnCloseModal').onclick = () => document.getElementById('incidentModal').classList.remove('open');

  const typeButtons = document.querySelectorAll('.type-select-btn');
  let selectedType = '';
  typeButtons.forEach(btn => {
    btn.onclick = () => {
      typeButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedType = btn.getAttribute('data-type');
    };
  });

  document.getElementById('btnSubmitIncident').onclick = () => {
    if (!selectedType) { alert('Selecciona un tipo de incidente.'); return; }

    const center = map.getCenter();
    const lat = center.lat + (Math.random() - 0.5) * 0.004;
    const lng = center.lng + (Math.random() - 0.5) * 0.004;

    const types = {
      suspicious: { title: 'Actividad Sospechosa', icon: 'lucide-alert-triangle', color: 'red' },
      police: { title: 'Patrullaje Policial', icon: 'lucide-shield', color: 'cyan' },
      blockage: { title: 'Calle Bloqueada', icon: 'lucide-wrench', color: 'gray' },
      accident: { title: 'Choque / Accidente', icon: 'lucide-car', color: 'red' }
    };

    const t = types[selectedType];
    incidentsList.unshift({
      id: Date.now(), type: selectedType, title: t.title,
      desc: 'Cerca de tu posición • ahora mismo',
      coords: [lat, lng], color: t.color, icon: t.icon
    });

    renderIncidentMarkers();
    renderIncidentsList();
    document.getElementById('incidentModal').classList.remove('open');
    typeButtons.forEach(b => b.classList.remove('selected'));
    selectedType = '';
    map.setView([lat, lng], 15);
  };

  const headerTabs = document.querySelectorAll('.header-tab');
  const screens = {
    explore: document.getElementById('mainMapScreen'),
    routes: document.getElementById('routesScreen'),
    alerts: document.getElementById('alertsScreen'),
    profile: document.getElementById('profileScreen')
  };

  headerTabs.forEach(tab => {
    tab.onclick = (e) => {
      e.preventDefault();
      headerTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-screen');
      Object.values(screens).forEach(s => { if (s) s.classList.remove('active'); });
      if (screens[target]) {
        screens[target].classList.add('active');
        if (target === 'explore') setTimeout(() => map.invalidateSize(), 100);
      }
    };
  });

  document.getElementById('btnSOS').addEventListener('click', handleSOS);
}

// ==========================================
//  BOTÓN SOS
// ==========================================
function handleSOS() {
  const modal = document.getElementById('sosModal');
  modal.classList.add('open');

  let countdown = 5;
  const countdownEl = document.getElementById('sosCountdown');
  const cancelBtn = document.getElementById('btnCancelSOS');
  countdownEl.textContent = countdown;

  const interval = setInterval(() => {
    countdown--;
    countdownEl.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(interval);
      modal.classList.remove('open');
      alert(
        '🚨 ¡ALERTA SOS ENVIADA!\n\n' +
        'Tu ubicación actual ha sido compartida con tus contactos de emergencia.\n\n' +
        '📞 Emergencias 105 (PNP)\n' +
        '📞 Serenazgo local\n' +
        '📞 Grupo Familiar\n\n' +
        'Mantén la calma. Ayuda en camino.'
      );
    }
  }, 1000);

  cancelBtn.onclick = () => {
    clearInterval(interval);
    modal.classList.remove('open');
  };
}

// ==========================================
//  CERRAR SESIÓN
// ==========================================
window.handleDashboardLogout = function() {
  if (confirm('¿Seguro que deseas cerrar sesión?')) {
    localStorage.removeItem('movefy_session');
    window.location.href = 'index.html';
  }
};
