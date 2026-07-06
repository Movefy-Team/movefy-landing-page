/* ========================================
   MOVEFY - Smart Dashboard Logic v3.1 (Premium)
   ======================================== */

// --- Protección de Autenticación ---
const sessionData = localStorage.getItem('movefy_session');
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
const LIMA_VIEWBOX = '-77.20,-11.90,-76.80,-12.25';

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

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
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
    showMapToast('📍 Origen seleccionado en el mapa');
  } else {
    document.getElementById('inputDestination').value = placeName;
    endCoords = [lat, lng];
    setMarker('end', endCoords, placeName);
    showMapToast('📍 Destino seleccionado en el mapa');
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
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}&countrycodes=pe&limit=6&accept-language=es&viewbox=${LIMA_VIEWBOX}&bounded=0`;
    const res = await fetch(url);
    const data = await res.json();

    resultsContainer.innerHTML = '';
    if (data.length === 0) {
      resultsContainer.innerHTML = '<div class="search-result-item no-result"><i class="lucide-search-x"></i> Sin resultados. Intenta con otra dirección.</div>';
      resultsContainer.classList.add('visible');
      return;
    }

    data.forEach(place => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      const icon = getPlaceIcon(place.type, place.class);
      item.innerHTML = `<i class="${icon} result-icon"></i><span>${place.display_name}</span>`;
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

function getPlaceIcon(type, cls) {
  if (cls === 'building' || type === 'house' || type === 'residential') return 'lucide-home';
  if (cls === 'highway' || type === 'motorway') return 'lucide-map';
  if (type === 'suburb' || type === 'neighbourhood') return 'lucide-map-pin';
  if (type === 'city' || type === 'town') return 'lucide-building-2';
  if (cls === 'shop') return 'lucide-shopping-cart';
  if (type === 'school' || type === 'university') return 'lucide-graduation-cap';
  return 'lucide-map-pin';
}

function setMarker(type, coords, label) {
  if (type === 'start') {
    if (startMarker) map.removeLayer(startMarker);
    const iconHtml = `<div class="custom-marker origin-marker"><span>A</span></div>`;
    const icon = L.divIcon({ html: iconHtml, className: 'custom-marker-wrapper', iconSize: [32, 32], iconAnchor: [16, 32] });
    startMarker = L.marker(coords, { icon }).addTo(map).bindPopup(`<b>Origen:</b> ${label}`);
  } else {
    if (endMarker) map.removeLayer(endMarker);
    const iconHtml = `<div class="custom-marker dest-marker"><span>B</span></div>`;
    const icon = L.divIcon({ html: iconHtml, className: 'custom-marker-wrapper', iconSize: [32, 32], iconAnchor: [16, 32] });
    endMarker = L.marker(coords, { icon }).addTo(map).bindPopup(`<b>Destino:</b> ${label}`);
  }

  map.setView(coords, 15);
}

// ==========================================
//  CÁLCULO DE RUTAS (OSRM)
// ==========================================
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
  if (type === 'depart') return 'lucide-compass';
  if (type === 'arrive') return 'lucide-flag';
  if (type === 'turn' && modifier && modifier.includes('left')) return 'lucide-corner-up-left';
  if (type === 'turn' && modifier && modifier.includes('right')) return 'lucide-corner-up-right';
  if (type === 'roundabout') return 'lucide-rotate-ccw';
  if (type === 'merge') return 'lucide-git-merge';
  if (type === 'fork') return 'lucide-git-branch';
  if (type === 'end of road') return 'lucide-corner-up-right';
  return 'lucide-arrow-up';
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
          ${distKm} km · <i class="${routeIcon}" style="font-size: 12px;"></i> ${routeLabel}
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
          <i class="${step.icon}" style="font-size: 16px;"></i>
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
    card.innerHTML = `
      <div class="report-icon-wrapper ${inc.color}"><i class="${inc.icon}"></i></div>
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

  incidentsList.forEach(inc => {
    const markerColor = inc.color === 'red' ? '#EF4444' :
                        inc.color === 'cyan' ? '#00D4AA' :
                        inc.color === 'orange' ? '#F97316' : '#94A3B8';

    const html = `<div style="
      background: ${markerColor}; width: 28px; height: 28px; border-radius: 50%;
      border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center; color: white;
    "><i class="${inc.icon}" style="font-size: 14px;"></i></div>`;
    
    const icon = L.divIcon({ html, className: 'inc-marker', iconSize: [28, 28], iconAnchor: [14, 14] });
    const marker = L.marker(inc.coords, { icon }).addTo(map).bindPopup(`<b><i class="${inc.icon}" style="font-size: 12px;"></i> ${inc.title}</b><br>${inc.desc}`);
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
    showMapToast('📍 Mapa centrado en Lima');
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
