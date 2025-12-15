/* SEISMOGUARD PRO v0.7 beta - STABLE CORE */

const CONFIG = {
    alarmThreshold: 4.5,
    criticalThreshold: 6.0,
    refreshRate: 60000,
    defaultLocation: [39.93, 32.85], // Ankara
    mapDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    mapLight: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    mapSatellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

let state = {
    map: null,
    tileLayer: null,
    userMarker: null,
    rangeCircle: null,
    markerGroup: null,
    userLat: CONFIG.defaultLocation[0],
    userLon: CONFIG.defaultLocation[1],
    radius: 500,
    minMagnitude: 0,
    timeFilterHours: 24,
    isRunning: false,
    theme: 'system',
    mapLayer: 'dark',
    processedIDs: new Set(),
    allQuakes: [],
    audioCtx: null,
    initialLoad: true
};

// --- UTILS ---
const getEl = (id) => document.getElementById(id);

function showToast(msg, type = 'info') {
    let container = getEl('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setListLoading(isLoading) {
    const loader = getEl('skeleton-loader');
    const list = getEl('log-list');
    if (isLoading) {
        if(loader) loader.classList.add('active');
        if(list) list.style.opacity = '0';
    } else {
        if(loader) loader.classList.remove('active');
        if(list) list.style.opacity = '1';
    }
}

const fetchWithTimeout = (url, options, timeout = 15000) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
    ]);
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateArrival(qLat, qLon) {
    try {
        const distKm = calculateDistance(state.userLat, state.userLon, qLat, qLon);
        const speedS = 3.5; // km/s
        const travelTimeSec = distKm / speedS;
        return { dist: Math.round(distKm), sec: Math.round(travelTimeSec) };
    } catch (e) {
        return { dist: 0, sec: 0 };
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function playSiren() {
    if (!state.audioCtx) return;
    try {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, state.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, state.audioCtx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(440, state.audioCtx.currentTime + 1.0);
        gain.gain.setValueAtTime(0.1, state.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 1.0);
        osc.start();
        osc.stop(state.audioCtx.currentTime + 1.0);
    } catch(e) { console.warn("Siren error", e); }
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    const initBtn = getEl('init-btn');
    const startScreen = getEl('start-screen');

    if (initBtn) {
        initBtn.addEventListener('click', () => {
            if (startScreen) {
                startScreen.classList.add('hidden');
                setTimeout(() => { startScreen.style.display = 'none'; }, 600);
            }
            
            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                state.audioCtx = new AudioContext();
            } catch (e) { console.warn("Audio Error"); }

            initializeMap();
            loadSettings();
            
            if (!getCookie('theme')) applyTheme(state.theme);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    pos => updateLocation(pos.coords.latitude, pos.coords.longitude),
                    err => {
                        console.warn("GPS Error:", err);
                        updateLocation(state.userLat, state.userLon);
                        showToast("Konum alınamadı, varsayılan kullanılıyor", "warning");
                    },
                    { timeout: 10000, enableHighAccuracy: false }
                );
            } else {
                updateLocation(state.userLat, state.userLon);
            }

            state.isRunning = true;
            startDataLoop();
        });
    }

    setupEventListeners();
}

function setupEventListeners() {
    const settingsBtn = getEl('settings-btn');
    const settingsModal = getEl('settings-modal');
    const filterBtn = getEl('filter-btn');
    const filterModal = getEl('filter-modal');
    const closeSettings = getEl('close-settings');
    const closeFilter = getEl('close-filter');

    if (settingsBtn) settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsModal.style.display = 'flex'; });
    if (filterBtn) filterBtn.addEventListener('click', (e) => { e.stopPropagation(); filterModal.style.display = 'flex'; });
    if (closeSettings) closeSettings.addEventListener('click', () => { settingsModal.style.display = 'none'; });
    if (closeFilter) closeFilter.addEventListener('click', () => { filterModal.style.display = 'none'; });

    const appLogo = getEl('app-logo');
    if (appLogo) appLogo.addEventListener('click', (e) => { e.stopPropagation(); toggleSolarPopup(); });

    const testBtn = getEl('test-alarm-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            if (settingsModal) settingsModal.style.display = 'none';
            
            const simLat = state.userLat + (Math.random() - 0.5) * 0.5;
            const simLon = state.userLon + (Math.random() - 0.5) * 0.5;
            const randomMag = parseFloat((Math.random() * (7.8 - 5.5) + 5.5).toFixed(1));
            const dist = calculateDistance(state.userLat, state.userLon, simLat, simLon);
            
            const simQuake = {
                id: 'sim-' + Date.now(),
                lat: simLat,
                lon: simLon,
                mag: randomMag,
                place: "SİMÜLASYON: TEST MERKEZİ",
                depth: 10.0,
                time: new Date().toLocaleTimeString(),
                timestamp: Date.now(),
                source: 'SIM'
            };

            state.allQuakes.unshift(simQuake);
            addMarker(simQuake);
            addLogItem(simQuake, dist);
            showSeismicWave(simQuake.lat, simQuake.lon, simQuake.mag);
            if(state.map) state.map.flyTo([simLat, simLon], 8);
            setTimeout(() => { triggerAlarm(simQuake, dist); }, 1500);
        });
    }

    const panelToggle = getEl('toggle-panel-btn');
    const infoPanel = getEl('info-panel');
    if (panelToggle && infoPanel) {
        panelToggle.addEventListener('click', () => { infoPanel.classList.toggle('panel-collapsed'); });
    }

    const recenterBtn = getEl('recenter-btn');
    if (recenterBtn) {
        recenterBtn.addEventListener('click', () => { if (state.map) state.map.flyTo([state.userLat, state.userLon], 6); });
    }

    const feltBtn = getEl('felt-btn');
    if (feltBtn) {
        feltBtn.addEventListener('click', function() {
            const btn = this;
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<div class="felt-icon"><i class="fas fa-check"></i></div><span>GÖNDERİLDİ</span>';
            btn.style.background = 'var(--primary)';
            showToast('Bildirim alındı!', 'success');
            setTimeout(() => { btn.innerHTML = originalHTML; btn.style.background = ''; }, 3000);
        });
    }

    // Filter Logic
    const sliderModal = getEl('radius-slider-modal');
    const applyFilter = getEl('apply-filter-btn');
    if (sliderModal) {
        sliderModal.addEventListener('input', (e) => {
            const val = getEl('range-val-modal');
            if (val) val.innerText = e.target.value + " km";
        });
    }
    if (applyFilter) {
        applyFilter.addEventListener('click', () => {
            if (sliderModal) {
                state.radius = parseInt(sliderModal.value);
                setCookie('radius', state.radius, 365);
            }
            if (filterModal) filterModal.style.display = 'none';
            renderList();
            drawRangeCircle();
            showToast("Filtreler uygulandı", "success");
        });
    }

    document.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.parentElement;
            parent.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const val = this.dataset.val;
            
            if (parent.id === 'theme-group') {
                applyTheme(val);
                setCookie('theme', val, 365);
            } else if (parent.id === 'layer-group') {
                state.mapLayer = val;
                updateMapLayer();
            } else if (parent.id === 'time-filter-group') {
                state.timeFilterHours = parseInt(val);
            } else if (parent.id === 'mag-filter-group') {
                state.minMagnitude = parseFloat(val);
            }
        });
    });

    const closeDetail = getEl('close-detail');
    if (closeDetail) closeDetail.addEventListener('click', () => { getEl('detail-panel').classList.remove('active'); });
}

window.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('.felt-btn') || target.closest('#recenter-btn') || target.closest('#filter-btn') || target.closest('#toggle-panel-btn') || target.closest('#app-logo') || target.closest('#settings-btn')) return;
    
    if (target.closest('.modal-footer a')) {
        e.preventDefault();
        const map = {'kvkk-btn': 'kvkk-modal', 'gdpr-btn': 'gdpr-modal', 'about-btn': 'about-modal', 'changelog-btn': 'changelog-modal'};
        const modal = getEl(map[target.closest('a').id]);
        if (modal) modal.style.display = 'flex';
        return;
    }
    
    const closeBtn = target.closest('.icon-btn');
    if (closeBtn && (closeBtn.id === 'close-settings' || closeBtn.id === 'close-filter' || closeBtn.classList.contains('close-text-modal'))) {
        const overlay = target.closest('.modal-overlay');
        if (overlay) overlay.style.display = 'none';
        return;
    }
    
    if (target.classList.contains('modal-overlay')) {
        target.style.display = 'none';
        return;
    }
    
    const solar = getEl('solar-popup');
    if (solar && solar.style.display === 'block' && !target.closest('#solar-popup') && !target.closest('#app-logo')) {
        solar.style.display = 'none';
    }
});

// --- MAP & LOGIC ---
function initializeMap() {
    try {
        state.map = L.map('map', { zoomControl: false }).setView([state.userLat, state.userLon], 5);
        state.tileLayer = L.tileLayer(CONFIG.mapDark, { attribution: '&copy; CartoDB', maxZoom: 19 }).addTo(state.map);
        loadTectonicPlates();
        state.markerGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                let c = count < 10 ? 'small' : (count < 100 ? 'medium' : 'large');
                return new L.DivIcon({ html: `<div><span>${count}</span></div>`, className: `marker-cluster marker-cluster-${c}`, iconSize: new L.Point(40, 40) });
            }
        }).addTo(state.map);
        state.map.on('click', () => { getEl('detail-panel').classList.remove('active'); });
        setTimeout(() => { state.map.invalidateSize(); }, 500);
    } catch (err) { console.error(err); showToast("Harita Yüklenemedi", "error"); }
}

function loadTectonicPlates() {
    fetchWithTimeout('https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json', {}, 10000)
        .then(r => r.json())
        .then(data => {
            L.geoJSON(data, {
                style: { color: "#ff4757", weight: 2, opacity: 0.4, dashArray: '5, 5', className: 'tectonic-line' }
            }).addTo(state.map);
        })
        .catch(e => console.log("Levha sınırları yüklenemedi"));
}

function updateLocation(lat, lon) {
    state.userLat = lat; state.userLon = lon;
    if (state.userMarker && state.map) state.map.removeLayer(state.userMarker);
    const radarIcon = L.divIcon({
        className: 'user-radar-icon',
        html: '<div class="radar-core"></div><div class="radar-sweep"></div>',
        iconSize: [80, 80],
        iconAnchor: [40, 40]
    });
    if (state.map) {
        state.userMarker = L.marker([lat, lon], {icon: radarIcon, zIndexOffset: 1000}).addTo(state.map);
        drawRangeCircle();
        state.map.flyTo([lat, lon], 6, { duration: 1.5 });
    }
    renderList();
}

function drawRangeCircle() {
    if (!state.map) return;
    if (state.rangeCircle) state.map.removeLayer(state.rangeCircle);
    const isLight = document.body.classList.contains('light-mode');
    const color = isLight ? '#00a859' : '#00ff88';
    state.rangeCircle = L.circle([state.userLat, state.userLon], {
        color: color, weight: 2, fillColor: color, fillOpacity: 0.05,
        radius: state.radius * 1000, interactive: false
    }).addTo(state.map);
}

function renderList() {
    if (!state.markerGroup) return;
    state.markerGroup.clearLayers();
    const listEl = getEl('log-list');
    if(listEl) listEl.innerHTML = '';
    
    let hasData = false;
    let maxMag = 0;
    const now = Date.now();
    const cutoff = now - (state.timeFilterHours * 3600000);

    state.allQuakes.forEach(q => {
        if (q.timestamp < cutoff) return; // Time Filter
        
        const dist = calculateDistance(state.userLat, state.userLon, q.lat, q.lon);
        if (dist <= state.radius && q.mag >= state.minMagnitude) {
            if (q.mag > maxMag) maxMag = q.mag;
            addMarker(q);
            addLogItem(q, dist);
            hasData = true;
        }
    });

    const statMax = getEl('stat-max');
    const statCount = getEl('stat-count');
    if(statMax) statMax.innerText = maxMag.toFixed(1);
    if(statCount) statCount.innerText = state.markerGroup.getLayers().length;

    const isCritical = maxMag >= CONFIG.criticalThreshold;
    if (isCritical) document.body.classList.add('critical-mode');
    else document.body.classList.remove('critical-mode');

    if (!hasData && listEl) listEl.innerHTML = '<div class="empty-state">Menzil içinde deprem yok</div>';
}

function addMarker(q) {
    let color = q.mag >= 6.0 ? '#ff4757' : (q.mag >= 4.0 ? '#ffa502' : '#00ff9d');
    if (document.body.classList.contains('light-mode') && q.mag < 4.0) color = '#009432';
    let r = q.mag >= 6.0 ? 20 : (q.mag >= 4.0 ? 14 : 8);
    
    const m = L.circleMarker([q.lat, q.lon], { radius: r, fillColor: color, color: '#fff', weight: 1, opacity: 0.9, fillOpacity: 0.8 });
    const arrival = calculateArrival(q.lat, q.lon);
    const waveText = arrival.dist < 50 ? "Çok Yakın!" : `S-Dalgası: ~${arrival.sec} sn`;

    const popupContent = document.createElement('div');
    popupContent.className = 'map-popup-content';
    popupContent.innerHTML = `
        <div class="popup-header"><strong>${q.place}</strong></div>
        <div class="popup-meta">
            <span class="popup-mag" style="color:${color}">${q.mag.toFixed(1)}</span>
            <span class="popup-depth">${q.depth} km</span>
        </div>
        <div class="wave-est"><i class="fas fa-stopwatch"></i> <strong>${waveText}</strong></div>
        <div class="popup-time">${q.time}</div>
        <button class="popup-detail-btn">Detaylar & Analiz</button>
    `;

    const btn = popupContent.querySelector('.popup-detail-btn');
    if(btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDetail(q);
            m.closePopup();
        });
    }

    m.bindPopup(popupContent, { closeButton: false, className: 'custom-popup' });
    state.markerGroup.addLayer(m);
}

function addLogItem(q, dist) {
    const list = getEl('log-list');
    if(!list) return;
    const d = document.createElement('div');
    d.className = 'log-item';
    let bg = q.mag >= 6.0 ? 'bg-high' : (q.mag >= 4.0 ? 'bg-med' : 'bg-low');
    d.innerHTML = `<div><span class="quake-title">${q.place}</span><div class="quake-detail"><span><i class="far fa-clock"></i> ${q.time}</span><span><i class="fas fa-arrow-down"></i> ${q.depth}km</span><span><i class="fas fa-ruler-horizontal"></i> ${Math.floor(dist)}km</span></div></div><div class="mag-box ${bg}">${q.mag.toFixed(1)}</div>`;
    d.addEventListener('click', () => openDetail(q));
    list.appendChild(d);
}

function showSeismicWave(lat, lon, mag) {
    if (!state.map) return;
    const waveIcon = L.divIcon({
        className: 'seismic-wave-icon',
        html: `<div class="wave-ring p-wave"></div><div class="wave-ring s-wave"></div>`,
        iconSize: [300, 300],
        iconAnchor: [150, 150]
    });
    const waveMarker = L.marker([lat, lon], { icon: waveIcon, zIndexOffset: -100 }).addTo(state.map);
    setTimeout(() => { if(state.map) state.map.removeLayer(waveMarker); }, 4000);
}

function openDetail(q) {
    currentQuakeData = q;
    if (state.map) state.map.flyTo([q.lat, q.lon], 10);
    getEl('detail-loc').innerText = q.place;
    const mag = getEl('detail-mag');
    mag.innerText = q.mag.toFixed(1);
    mag.style.color = q.mag >= 6.0 ? 'var(--danger)' : (q.mag >= 4.0 ? 'var(--warning)' : 'var(--primary)');
    getEl('detail-depth').innerText = q.depth + " km";
    getEl('detail-time').innerText = q.time;
    getEl('detail-panel').classList.add('active');
    if(window.innerWidth < 768) getEl('info-panel').classList.add('panel-collapsed');

    const gm = getEl('gmaps-btn');
    const sh = getEl('share-btn');
    
    const nGm = gm.cloneNode(true); gm.parentNode.replaceChild(nGm, gm);
    nGm.addEventListener('click', () => window.open(`https://www.google.com/maps/search/?api=1&query=${q.lat},${q.lon}`, '_blank'));
    
    const nSh = sh.cloneNode(true); sh.parentNode.replaceChild(nSh, sh);
    nSh.addEventListener('click', () => {
        const txt = `Deprem Uyarısı! ${q.place} - ${q.mag}`;
        if(navigator.share) navigator.share({title:'SeismoGuard', text:txt, url:window.location.href}).catch(console.error);
        else navigator.clipboard.writeText(txt).then(()=>showToast('Kopyalandı', 'success'));
    });
}

async function toggleSolarPopup() {
    const p = getEl('solar-popup');
    if(!p) return;
    if(p.style.display === 'block') { p.style.display = 'none'; return; }
    p.style.display = 'block';
    getEl('sol-coords').innerText = `${state.userLat.toFixed(3)}, ${state.userLon.toFixed(3)}`;
    try {
        const res = await fetchWithTimeout(`https://api.sunrise-sunset.org/json?lat=${state.userLat}&lng=${state.userLon}&formatted=0`, {}, 5000);
        const d = await res.json();
        if(d.status === 'OK') {
            getEl('sol-rise').innerText = new Date(d.results.sunrise).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            getEl('sol-set').innerText = new Date(d.results.sunset).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        }
    } catch(e){}
}

function checkAlarm(q) {
    const dist = calculateDistance(state.userLat, state.userLon, q.lat, q.lon);
    if (dist <= state.radius && q.mag >= CONFIG.alarmThreshold) triggerAlarm(q, dist);
}

function triggerAlarm(q, dist) {
    const o = getEl('alarm-overlay');
    getEl('alarm-mag').innerText = q.mag;
    getEl('alarm-loc').innerText = q.place;
    getEl('alarm-dist').innerText = `Mesafe: ${Math.floor(dist)} km`;
    o.style.display = 'flex';
    playSiren();
    if(navigator.vibrate) navigator.vibrate([500, 200, 500, 200]);
}

function applyTheme(t) {
    state.theme = t;
    const d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if(d) document.body.classList.remove('light-mode');
    else document.body.classList.add('light-mode');
    updateMapLayer();
}

function updateMapLayer() {
    if(!state.tileLayer) return;
    if(state.mapLayer === 'satellite') state.tileLayer.setUrl(CONFIG.mapSatellite);
    else {
        const d = !document.body.classList.contains('light-mode');
        state.tileLayer.setUrl(d ? CONFIG.mapDark : CONFIG.mapLight);
    }
    drawRangeCircle();
}

window.stopAlarm = function() {
    getEl('alarm-overlay').style.display = 'none';
    if(navigator.vibrate) navigator.vibrate(0);
};

// --- FETCHING ---
async function startDataLoop() {
    if (!state.isRunning) return;
    showToast('Veriler güncellendi', 'info');
    
    if (state.initialLoad) {
        setListLoading(true);
        setTimeout(() => {
            if (state.initialLoad) { setListLoading(false); state.initialLoad = false; }
        }, 5000);
    }

    fetchWithTimeout('https://api.orhanaydogdu.com.tr/deprem/kandilli/live')
        .then(r => r.json())
        .then(d => { if(d.status) processQuakes(d.result, 'Kandilli'); })
        .catch(() => fetchRawKandilli());

    fetchRawKandilli();
    fetchAFAD();

    fetchWithTimeout('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson')
        .then(r => r.json())
        .then(d => processQuakes(d.features, 'USGS'))
        .catch(() => {});

    fetchEMSC();
    setTimeout(startDataLoop, CONFIG.refreshRate);
}

async function fetchEMSC() {
    try {
        const res = await fetchWithTimeout('https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=50&minmag=2.5');
        const d = await res.json();
        if(d.features) processQuakes(d.features, 'EMSC');
    } catch(e){}
}

async function fetchAFAD() {
    try {
        const proxy = 'https://corsproxy.io/?';
        const url = encodeURIComponent('https://deprem.afad.gov.tr/apiserver/events?limit=50&sort=eventDate,desc');
        const res = await fetchWithTimeout(proxy + url);
        const d = await res.json();
        if(d && d.length) processQuakes(d, 'AFAD');
    } catch(e){}
}

async function fetchRawKandilli() {
    try {
        const proxy = 'https://corsproxy.io/?';
        const url = encodeURIComponent('http://www.koeri.boun.edu.tr/scripts/lst1.asp');
        const res = await fetchWithTimeout(proxy + url);
        const txt = await res.text();
        const q = parseKandilliText(txt);
        if(q.length) processQuakes(q, 'KRDAE');
    } catch(e){}
}

function parseKandilliText(text) {
    const lines = text.split('\n');
    const res = [];
    const start = lines.findIndex(l => l.includes('----------')) + 1;
    for (let i = start; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l.length < 10) continue;
        try {
            const p = l.split(/\s+/);
            if (p.length < 9) continue;
            let mag = parseFloat(p[6]);
            if (isNaN(mag) || p[6] === '-.-') mag = parseFloat(p[5]);
            if (isNaN(mag) || p[5] === '-.-') mag = parseFloat(p[7]);
            if (isNaN(mag)) mag = 0;
            let placeParts = p.slice(8);
            if (placeParts.length > 0 && (placeParts[placeParts.length-1].includes('lksel') || placeParts[placeParts.length-1].includes('REVIZE'))) placeParts.pop();
            
            // Raw date parsing for timestamp
            const dateStr = p[0].replaceAll('.', '-');
            const timeStr = p[1];
            const timestamp = new Date(`${dateStr}T${timeStr}`).getTime();

            res.push({ id: `raw-${p[0]}-${p[1]}`, lat: parseFloat(p[2]), lon: parseFloat(p[3]), depth: parseFloat(p[4]), mag: mag, place: placeParts.join(' '), time: p[1], date: p[0], timestamp: timestamp, source: 'KRDAE' });
        } catch(e){}
    }
    return res;
}

function processQuakes(list, source) {
    let updated = false;
    list.slice(0, 60).reverse().forEach(item => {
        let q = normalize(item, source);
        if (!state.processedIDs.has(q.id)) {
            state.processedIDs.add(q.id);
            state.allQuakes.unshift(q);
            updated = true;
            if (!state.initialLoad) showSeismicWave(q.lat, q.lon, q.mag);
            if (state.processedIDs.size > 60) checkAlarm(q);
        }
    });
    if (updated || state.initialLoad) {
        renderList();
        if (state.initialLoad) { setListLoading(false); state.initialLoad = false; }
    }
}

function normalize(item, source) {
    let q = { source: source };
    if (source === 'AFAD') {
        q.id = 'afad-' + item.eventId;
        q.lat = parseFloat(item.latitude);
        q.lon = parseFloat(item.longitude);
        q.mag = parseFloat(item.magnitude);
        q.place = item.location;
        q.depth = parseFloat(item.depth);
        q.time = new Date(item.eventDate).toLocaleTimeString();
        q.timestamp = new Date(item.eventDate).getTime();
    } else if (source === 'Kandilli') {
        q.id = item.date_time;
        q.lat = item.geojson.coordinates[1];
        q.lon = item.geojson.coordinates[0];
        q.mag = parseFloat(item.mag);
        q.place = item.title;
        q.depth = item.depth;
        const dt = item.date_time.split(' ');
        q.time = dt[1];
        q.timestamp = new Date(item.date_time.replace(/\./g, '-')).getTime();
    } else if (source === 'KRDAE') {
        return item; // Already processed in parse
    } else if (source === 'EMSC') {
        q.id = item.properties.unid;
        q.lat = item.geometry.coordinates[1];
        q.lon = item.geometry.coordinates[0];
        q.mag = item.properties.mag;
        q.place = item.properties.flynn_region;
        q.depth = item.geometry.coordinates[2];
        q.time = new Date(item.properties.time).toLocaleTimeString();
        q.timestamp = new Date(item.properties.time).getTime();
    } else { // USGS
        q.id = item.id;
        q.lat = item.geometry.coordinates[1];
        q.lon = item.geometry.coordinates[0];
        q.mag = item.properties.mag;
        q.place = item.properties.place;
        q.depth = item.geometry.coordinates[2];
        q.time = new Date(item.properties.time).toLocaleTimeString();
        q.timestamp = new Date(item.properties.time).getTime();
    }
    return q;
}