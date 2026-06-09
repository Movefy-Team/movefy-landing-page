/* ========================================
   MOVEFY - Planificación JavaScript
   Interactive Map with Leaflet, OSRM, Autocomplete
   ======================================== */

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

  // --- Map Initialization ---
  const mapElement = document.getElementById('map');
  let map, routingControl;
  let originMarker, destMarker;
  
  // Danger Zones (Hotspots in Lima for demo purposes)
  const dangerZones = [
    { lat: -12.0630, lng: -77.0361, type: 'robo', name: 'Robo/Asalto' }, // Centro de Lima
    { lat: -12.0453, lng: -77.0311, type: 'accidente', name: 'Accidente de Tráfico' }, // Barrios Altos
    { lat: -12.0945, lng: -77.0234, type: 'bloqueo', name: 'Vía Bloqueada' }, // La Victoria (Gamarra)
  ];

  function createIncidentIcon(type) {
    const config = {
      robo: { bg: '#FEE2E2', border: '#EF4444', color: '#EF4444', svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' },
      accidente: { bg: '#FEF3C7', border: '#F59E0B', color: '#F59E0B', svg: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
      bloqueo: { bg: '#DBEAFE', border: '#3B82F6', color: '#3B82F6', svg: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' },
      sospechoso: { bg: '#EDE9FE', border: '#8B5CF6', color: '#8B5CF6', svg: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' }
    }[type] || { bg: '#FFF', border: '#000', color: '#000', svg: '<circle cx="12" cy="12" r="10"/>' };

    return L.divIcon({
      className: 'custom-incident-icon',
      html: `<div style="background-color: ${config.bg}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${config.border}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${config.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${config.svg}</svg>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  }

  // Helper to create removable marker
  function createRemovableMarker(mapRef, latlng, icon, title, desc) {
    const marker = L.marker(latlng, { icon: icon }).addTo(mapRef);
    const popupId = 'popup-' + Math.random().toString(36).substr(2, 9);
    
    const popupContent = `
      <div style="text-align: center; min-width: 140px; padding: 4px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: var(--primary-dark);">${title}</h4>
        <p style="margin: 0 0 10px 0; font-size: 11px; color: var(--text-gray);">${desc}</p>
        <button id="${popupId}" style="width: 100%; padding: 6px; background: #F1F5F9; color: #64748B; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;">Ocultar Alerta</button>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    
    marker.on('popupopen', function() {
      const btn = document.getElementById(popupId);
      if(btn) {
        btn.onclick = function() {
          mapRef.removeLayer(marker);
        };
      }
    });
    
    return marker;
  }

  const originIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #0EA5E9; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const destIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #00D4AA; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  if (mapElement) {
    // Initialize Leaflet map centered in Lima, Peru
    map = L.map('map').setView([-12.0464, -77.0428], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19
    }).addTo(map);

    // Add Danger Zones to map
    dangerZones.forEach(zone => {
      createRemovableMarker(
        map, 
        [zone.lat, zone.lng], 
        createIncidentIcon(zone.type), 
        zone.name, 
        'Incidente reportado por la comunidad.'
      );
    });

    // Attempt to get user's real location for "Mi Ubicación"
    const inputOrigen = document.getElementById('inputOrigen');
    if(inputOrigen && inputOrigen.value === 'Mi ubicación actual') {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          window.origCoords = L.latLng(position.coords.latitude, position.coords.longitude);
          if(originMarker) map.removeLayer(originMarker);
          originMarker = L.marker(window.origCoords, {icon: originIcon}).addTo(map);
          map.setView(window.origCoords, 14);
        }, (error) => {
          // Fallback to center of Lima if permission denied
          window.origCoords = L.latLng(-12.0464, -77.0428);
        });
      }
    }

    // Add Context Menu on map click
    window.clickedLatLng = null;

    map.on('click', function(e) {
      window.clickedLatLng = e.latlng;
      
      const popupContent = `
        <div class="map-context-menu" style="text-align: center; min-width: 150px; padding: 4px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: var(--primary-dark);">Opciones de Ubicación</h4>
          <button onclick="window.setDestinationFromMap()" style="width: 100%; margin-bottom: 8px; padding: 8px; background: var(--primary-cyan); color: var(--primary-dark); border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;">📍 Fijar como Destino</button>
          <button onclick="window.addReportFromMap()" style="width: 100%; padding: 8px; background: #EF4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;">⚠️ Añadir Reporte Aquí</button>
        </div>
      `;
      
      L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);
    });

    // Global Functions for Popup
    window.setDestinationFromMap = function() {
      map.closePopup();
      if(!window.clickedLatLng) return;
      
      const latlng = window.clickedLatLng;
      const inputDestino = document.getElementById('inputDestino');
      
      showToast('Buscando dirección...');
      
      // Reverse geocode via Nominatim
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const shortName = data.display_name.split(',').slice(0,2).join(',');
            if(inputDestino) inputDestino.value = shortName;
            
            // Set destination coordinate
            window.destCoords = latlng;
            if(destMarker) map.removeLayer(destMarker);
            destMarker = L.marker(latlng, {icon: destIcon}).addTo(map);
            
            checkAndRoute();
          }
        });
    };

    window.addReportFromMap = function() {
      map.closePopup();
      const reportModal = document.getElementById('reportModal');
      if(reportModal) {
        reportModal.classList.add('active');
      }
    };

    // --- Autocomplete Logic ---
    let debounceTimer;
    const origenList = document.getElementById('origenList');
    const destinoList = document.getElementById('destinoList');
    
    function setupAutocomplete(inputEl, listEl, isOrigin) {
      if(!inputEl || !listEl) return;
      
      inputEl.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        if (query.length < 3) {
          listEl.classList.remove('active');
          return;
        }

        debounceTimer = setTimeout(async () => {
          const results = await geocodeAddressMulti(query);
          listEl.innerHTML = '';
          
          if(results.length > 0) {
            results.forEach(res => {
              const li = document.createElement('li');
              li.className = 'autocomplete-item';
              li.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${res.display_name.split(',').slice(0,3).join(',')}</span>
              `;
              li.addEventListener('click', () => {
                inputEl.value = res.display_name.split(',')[0];
                listEl.classList.remove('active');
                
                const latlng = L.latLng(res.lat, res.lon);
                if(isOrigin) {
                  window.origCoords = latlng;
                  if(originMarker) map.removeLayer(originMarker);
                  originMarker = L.marker(latlng, {icon: originIcon}).addTo(map);
                  map.setView(latlng, 14);
                } else {
                  window.destCoords = latlng;
                  if(destMarker) map.removeLayer(destMarker);
                  destMarker = L.marker(latlng, {icon: destIcon}).addTo(map);
                }
                checkAndRoute();
              });
              listEl.appendChild(li);
            });
            listEl.classList.add('active');
          } else {
            listEl.classList.remove('active');
          }
        }, 500);
      });

      // Close list when clicking outside
      document.addEventListener('click', (e) => {
        if(!inputEl.contains(e.target) && !listEl.contains(e.target)) {
          listEl.classList.remove('active');
        }
      });
    }

    setupAutocomplete(document.getElementById('inputOrigen'), origenList, true);
    setupAutocomplete(document.getElementById('inputDestino'), destinoList, false);

    async function geocodeAddressMulti(address) {
      const query = encodeURIComponent(`${address}, Lima, Peru`);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=4`);
        return await res.json();
      } catch (err) {
        return [];
      }
    }

    // --- Automatic Routing ---
    function checkAndRoute() {
      if(window.origCoords && window.destCoords) {
        if(routingControl) {
          map.removeControl(routingControl);
        }
        if(window.mainLine) map.removeLayer(window.mainLine);
        if(window.altLine) map.removeLayer(window.altLine);
        window.mainLine = null;
        window.altLine = null;

        showToast('🔄 Calculando rutas...');

        // OSRM configuration for alternative routes
        routingControl = L.Routing.control({
          waypoints: [
            window.origCoords,
            window.destCoords
          ],
          router: L.Routing.osrmv1({
            language: 'es',
            profile: 'driving'
          }),
          lineOptions: {
            styles: [{ color: 'transparent', opacity: 0, weight: 0 }]
          },
          altLineOptions: {
            styles: [{ color: 'transparent', opacity: 0, weight: 0 }]
          },
          showAlternatives: true,
          show: false, // Hide instruction box
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true
        }).addTo(map);

        routingControl.on('routesfound', function(e) {
          const routes = e.routes;
          
          if(routes.length >= 1) {
            // "Safe Route" (Main route)
            const safeCard = document.getElementById('cardSafe');
            const safeTimeText = document.getElementById('safeTimeText');
            const safeMetaText = document.getElementById('safeMetaText');
            
            // Dynamic traffic based on real current hour
            const currentHour = new Date().getHours();
            let trafficMultSafe = 1.5;
            if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 18 && currentHour <= 20)) {
              trafficMultSafe = 2.2; // Hora Punta
            } else if (currentHour >= 23 || currentHour <= 5) {
              trafficMultSafe = 1.1; // Madrugada
            }
            
            // OSRM provides free-flow speed. Apply dynamic multiplier to simulate realistic Lima traffic.
            let timeSafe = Math.round((routes[0].summary.totalTime / 60) * trafficMultSafe);
            const distSafe = (routes[0].summary.totalDistance / 1000).toFixed(1);
            
            if(safeTimeText) safeTimeText.innerText = `Tiempo est. ${timeSafe} min`;
            if(safeMetaText) safeMetaText.innerText = `${distSafe} km`;
            
            // "Fast Route" (Alt route if exists, else same)
            const fastCard = document.getElementById('routeFast');
            const fastTimeText = document.getElementById('fastTimeText');
            
            // Draw main line manually
            window.mainLine = L.polyline(routes[0].coordinates, {
              color: '#00D4AA', opacity: 1, weight: 6
            }).addTo(map);

            if(routes.length > 1) {
              // Fast route gets slightly better traffic multiplier
              let trafficMultFast = trafficMultSafe * 0.85; 
              let timeFast = Math.round((routes[1].summary.totalTime / 60) * trafficMultFast);
              const distFast = (routes[1].summary.totalDistance / 1000).toFixed(1);
              
              // Force fast route to be realistically faster than safe route (e.g. at least 10% faster)
              if(timeFast >= timeSafe) timeFast = Math.max(1, timeSafe - Math.max(3, Math.floor(timeSafe * 0.1)));
              
              if(fastTimeText) fastTimeText.innerText = `Tiempo est. ${timeFast} min`;
              if(fastCard) fastCard.querySelector('h3').innerText = 'Ruta Rápida';
              if(fastCard) fastCard.querySelector('.route-meta').innerText = `${distFast} km`;
              if(fastCard) fastCard.querySelector('p').innerHTML = `La vía más <strong>rápida</strong> por avenidas principales. Sin embargo cruza algunas zonas con baja visibilidad.`;
              if(fastCard) fastCard.classList.remove('disabled-card');
              
              window.altLine = L.polyline(routes[1].coordinates, {
                color: '#3B82F6', opacity: 0.6, weight: 5, dashArray: '8, 8'
              }).addTo(map);
              
              showToast('✅ Rutas alternativas trazadas');
            } else {
              // If only 1 route found natively, force a secondary "demo" route
              const midIndex = Math.floor(routes[0].coordinates.length / 2);
              const midPoint = routes[0].coordinates[midIndex];
              // Create a 500m offset roughly
              const offsetPoint = L.latLng(midPoint.lat + 0.005, midPoint.lng + 0.005);
              
              const fallbackRouter = L.Routing.osrmv1({ language: 'es', profile: 'driving' });
              fallbackRouter.route([
                {latLng: window.origCoords},
                {latLng: offsetPoint},
                {latLng: window.destCoords}
              ], function(err, altRoutes) {
                if(!err && altRoutes && altRoutes.length > 0) {
                  const altRoute = altRoutes[0];
                  let trafficMultFast = trafficMultSafe * 0.85;
                  let timeFast = Math.round((altRoute.summary.totalTime / 60) * trafficMultFast);
                  const distFast = (altRoute.summary.totalDistance / 1000).toFixed(1);
                  
                  // Force fast route to be realistically faster than safe route
                  if(timeFast >= timeSafe) timeFast = Math.max(1, timeSafe - Math.max(3, Math.floor(timeSafe * 0.1)));
                  
                  if(fastTimeText) fastTimeText.innerText = `Tiempo est. ${timeFast} min`;
                  if(fastCard) fastCard.querySelector('h3').innerText = 'Ruta Rápida';
                  if(fastCard) fastCard.querySelector('.route-meta').innerText = `${distFast} km`;
                  if(fastCard) fastCard.querySelector('p').innerHTML = `La vía más <strong>rápida</strong> por avenidas principales. Sin embargo cruza algunas zonas con baja visibilidad.`;
                  if(fastCard) fastCard.classList.remove('disabled-card');
                  
                  // Draw fake line
                  window.altLine = L.polyline(altRoute.coordinates, {
                    color: '#3B82F6', opacity: 0.6, weight: 5, dashArray: '8, 8'
                  }).addTo(map);
                  
                  showToast('✅ Rutas alternativas trazadas');
                } else {
                  // Absolute fallback if even the forced route fails
                  if(fastTimeText) fastTimeText.innerText = `Tiempo est. ${timeSafe} min`;
                  if(fastCard) fastCard.querySelector('h3').innerText = 'Misma Ruta';
                  if(fastCard) fastCard.querySelector('p').innerHTML = `En este trayecto, la ruta más <strong>rápida</strong> y la ruta <strong>segura</strong> coinciden.`;
                  if(fastCard) fastCard.classList.add('disabled-card');
                  showToast('✅ Ruta trazada (Única vía óptima)');
                }
              });
            }
          }
        });
      }
    }
  }

  // --- Route Option Selection UI ---
  const routeOptions = document.querySelectorAll('.route-option');
  routeOptions.forEach(option => {
    option.addEventListener('click', () => {
      if(option.classList.contains('disabled-card')) return;
      
      routeOptions.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      
      const routeType = option.getAttribute('data-route');
      
      if(window.mainLine && window.altLine) {
        if(routeType === 'fast') {
          // Highlight altLine
          window.mainLine.setStyle({ color: '#00D4AA', opacity: 0.4, dashArray: '8,8', weight: 5 });
          window.altLine.setStyle({ color: '#3B82F6', opacity: 1, dashArray: '', weight: 6 });
          window.altLine.bringToFront();
        } else {
          // Highlight mainLine
          window.mainLine.setStyle({ color: '#00D4AA', opacity: 1, dashArray: '', weight: 6 });
          window.altLine.setStyle({ color: '#3B82F6', opacity: 0.4, dashArray: '8,8', weight: 5 });
          window.mainLine.bringToFront();
        }
      }
    });
  });

  // --- Start Navigation ---
  const startNavBtn = document.getElementById('startNavBtn');
  if (startNavBtn) {
    startNavBtn.addEventListener('click', () => {
      if(!window.origCoords || !window.destCoords) {
        showToast('⚠️ Selecciona un destino para calcular la ruta.');
        return;
      }

      startNavBtn.disabled = true;
      startNavBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Iniciando...
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
          ¡Navegando!
        `;
        startNavBtn.style.background = '#059669';
        showToast('📍 Siga las instrucciones en el mapa.');
        
        // Reset after 4 seconds
        setTimeout(() => {
          startNavBtn.disabled = false;
          startNavBtn.innerHTML = `
            Iniciar Navegación
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          `;
          startNavBtn.style.background = '';
        }, 4000);
      }, 1500);
    });
  }

  // --- Report Incident Modal Logic ---
  const reportModal = document.getElementById('reportModal');
  const closeReportModalBtn = document.getElementById('closeReportModalBtn');
  const reportTypeBtns = document.querySelectorAll('.report-type-btn');
  const submitReportBtn = document.getElementById('submitReportBtn');

  // --- SOS Button Logic ---
  const sosBtn = document.getElementById('sosEmergencyBtn');
  if (sosBtn) {
    sosBtn.addEventListener('click', () => {
      sosBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
      setTimeout(() => {
        showToast('🚨 SOS Activado. Notificando a tus contactos y policía...');
        sosBtn.style.background = '#059669'; // success green
        sosBtn.style.borderColor = '#A7F3D0';
        sosBtn.style.animation = 'none';
        sosBtn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        
        setTimeout(() => {
          sosBtn.style.background = '';
          sosBtn.style.borderColor = '';
          sosBtn.style.animation = '';
          sosBtn.innerHTML = '<span style="font-weight: 900; font-size: 18px; letter-spacing: 1px;">SOS</span>';
        }, 5000);
      }, 1500);
    });
  }

  if (reportModal && closeReportModalBtn) {
    // Close modal
    closeReportModalBtn.addEventListener('click', () => {
      reportModal.classList.remove('active');
      resetReportForm();
    });

    // Select report type
    reportTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        reportTypeBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        submitReportBtn.disabled = false;
      });
    });

    // Submit report
    if (submitReportBtn) {
      submitReportBtn.addEventListener('click', () => {
        const selectedBtn = document.querySelector('.report-type-btn.selected');
        if (selectedBtn) {
          const type = selectedBtn.getAttribute('data-type');
          
          submitReportBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Enviando...
          `;
          submitReportBtn.disabled = true;

          setTimeout(() => {
            reportModal.classList.remove('active');
            resetReportForm();
            showToast(`✅ Reporte de "${type}" enviado con éxito.`);
            
            // Draw a marker on the map for the report
            if(map) {
              const targetLatLng = window.clickedLatLng ? window.clickedLatLng : map.getCenter();
              createRemovableMarker(
                map,
                [targetLatLng.lat, targetLatLng.lng],
                createIncidentIcon(type),
                selectedBtn.innerText,
                'Reportado por ti hace un momento.'
              );
              
              window.clickedLatLng = null; // Reset
            }

          }, 1500);
        }
      });
    }
  }

  function resetReportForm() {
    reportTypeBtns.forEach(b => b.classList.remove('selected'));
    if (submitReportBtn) {
      submitReportBtn.disabled = true;
      submitReportBtn.innerHTML = 'Enviar Reporte';
    }
  }

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

  // Toast Function 
  function showToast(message) {
    const existing = document.querySelector('.dash-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'dash-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #1B2838;
      color: #FFFFFF;
      padding: 14px 24px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 600;
      z-index: 99999;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      animation: toastIn 0.3s ease;
      max-width: 90%;
      text-align: center;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
