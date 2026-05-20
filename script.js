// Global variables
let map;
let routeLayer;
let markers = [];
let startCoords = null;
let endCoords = null;
let markerCounter = 0;

// DOM Elements
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');
const step4 = document.getElementById('step-4');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Step 1: Route berechnen
    document.getElementById('btn-route-berechnen').addEventListener('click', routeBerechnen);
    
    // Step 2: Navigation
    document.getElementById('btn-zurueck').addEventListener('click', () => showStep(1));
    document.getElementById('btn-weiter').addEventListener('click', () => showStep(3));
    
    // Step 3: Navigation
    document.getElementById('btn-zurueck-2').addEventListener('click', () => showStep(2));
    document.getElementById('btn-pdf').addEventListener('click', pdfErstellen);
    
    // Step 4: Navigation
    document.getElementById('btn-neu-starten').addEventListener('click', neuStarten);
    document.getElementById('btn-drucken').addEventListener('click', () => window.print());
    
    // Enter key support
    document.getElementById('ziel-adresse').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') routeBerechnen();
    });
});

function showStep(step) {
    // Hide all steps
    step1.style.display = 'none';
    step2.style.display = 'none';
    step3.style.display = 'none';
    step4.style.display = 'none';
    
    // Show requested step
    switch(step) {
        case 1:
            step1.style.display = 'block';
            break;
        case 2:
            step2.style.display = 'block';
            if (map) setTimeout(() => map.invalidateSize(), 100);
            break;
        case 3:
            step3.style.display = 'block';
            break;
        case 4:
            step4.style.display = 'block';
            break;
    }
    
    window.scrollTo(0, 0);
}

async function routeBerechnen() {
    console.log('Route berechnen gestartet');
    
    const startAdresse = document.getElementById('start-adresse').value.trim();
    const zielAdresse = document.getElementById('ziel-adresse').value.trim();
    
    console.log('Start:', startAdresse);
    console.log('Ziel:', zielAdresse);
    
    if (!startAdresse || !zielAdresse) {
        alert('Bitte gib sowohl Start- als auch Zieladresse ein.');
        return;
    }
    
    const btn = document.getElementById('btn-route-berechnen');
    btn.disabled = true;
    btn.textContent = 'Berechne Route...';
    
    try {
        // Geocoding für Start- und Zieladresse
        console.log('Geocoding Start...');
        startCoords = await geocodeAdresse(startAdresse);
        console.log('Start coords:', startCoords);
        
        console.log('Geocoding Ziel...');
        endCoords = await geocodeAdresse(zielAdresse);
        console.log('Ziel coords:', endCoords);
        
        if (!startCoords || !endCoords) {
            throw new Error('Adressen konnten nicht gefunden werden. Bitte überprüfe die Schreibweise.');
        }
        
        // Weiter zu Schritt 2 zuerst, dann Karte initialisieren
        console.log('Zeige Schritt 2');
        showStep(2);
        
        // Kurze Verzögerung damit DOM aktualisiert wird
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Karte initialisieren
        console.log('Initialisiere Karte...');
        initMap();
        
        // Route berechnen und anzeigen
        console.log('Berechne Route...');
        await routeAnzeigen(startCoords, endCoords);
        
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Route anzeigen';
    }
}

async function geocodeAdresse(adresse) {
    console.log('Geocoding:', adresse);
    
    // Füge "Kirchlengern" hinzu, falls nicht vorhanden
    let searchAdresse = adresse;
    if (!adresse.toLowerCase().includes('kirchlengern') && 
        !adresse.toLowerCase().includes('32105')) {
        searchAdresse += ', Kirchlengern, Deutschland';
    } else if (!adresse.toLowerCase().includes('deutschland')) {
        searchAdresse += ', Deutschland';
    }
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAdresse)}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Schulwegsicherheit-App/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Geocoding result:', data);
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
}

function initMap() {
    if (map) {
        map.remove();
    }
    
    // Karte erstellen - zuerst ohne setView
    map = L.map('map', {
        center: [startCoords.lat, startCoords.lon],
        zoom: 16,
        zoomControl: true
    });
    
    // OpenStreetMap Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // WICHTIG: invalidateSize() aufrufen nach kurzer Verzögerung
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
            console.log('Karte Größe aktualisiert');
        }
    }, 200);
    
    // Klick-Event für Markierungen
    map.on('click', function(e) {
        markerHinzufuegen(e.latlng);
    });
}

async function routeAnzeigen(start, end) {
    console.log('Route anzeigen:', start, end);
    
    // Start- und Ziel-Marker
    const startIcon = L.divIcon({
        className: 'custom-marker start-marker',
        html: '🏠',
        iconSize: [30, 30]
    });
    
    const endIcon = L.divIcon({
        className: 'custom-marker end-marker',
        html: '🏫',
        iconSize: [30, 30]
    });
    
    L.marker([start.lat, start.lon], {icon: startIcon})
        .addTo(map)
        .bindPopup('Start: ' + start.display_name);
    
    L.marker([end.lat, end.lon], {icon: endIcon})
        .addTo(map)
        .bindPopup('Ziel: ' + end.display_name);
    
    // Route mit OSRM
    try {
        const routeUrl = `https://router.project-osrm.org/route/v1/foot/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
        console.log('Route URL:', routeUrl);
        
        const response = await fetch(routeUrl, {
            headers: {
                'User-Agent': 'Schulwegsicherheit-App/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`OSRM HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Route data:', data);
        
        if (data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates;
            const latlngs = coordinates.map(coord => [coord[1], coord[0]]);
            
            // Route als Polyline zeichnen
            routeLayer = L.polyline(latlngs, {
                color: '#e3000f',
                weight: 5,
                opacity: 0.8
            }).addTo(map);
            
            // Karte an Route anpassen
            map.fitBounds(routeLayer.getBounds().pad(0.2));
            console.log('Route erfolgreich angezeigt');
        } else {
            console.warn('Keine Route gefunden');
            // Fallback: Direkte Linie
            zeigeFallbackRoute(start, end);
        }
    } catch (error) {
        console.error('Routenberechnung fehlgeschlagen:', error);
        zeigeFallbackRoute(start, end);
    }
}

function zeigeFallbackRoute(start, end) {
    console.log('Zeige Fallback-Route');
    // Fallback: Direkte Linie
    routeLayer = L.polyline(
        [[start.lat, start.lon], [end.lat, end.lon]],
        {color: '#e3000f', weight: 5, opacity: 0.8, dashArray: '10, 10'}
    ).addTo(map);
    
    // Berechne Bounds mit Padding
    const bounds = L.latLngBounds([[start.lat, start.lon], [end.lat, end.lon]]);
    map.fitBounds(bounds, {padding: [50, 50], maxZoom: 17});
}

function markerHinzufuegen(latlng) {
    markerCounter++;
    
    const markerIcon = L.divIcon({
        className: 'custom-marker danger-marker',
        html: `⚠️<span class="marker-number">${markerCounter}</span>`,
        iconSize: [40, 40]
    });
    
    const marker = L.marker(latlng, {icon: markerIcon, draggable: true}).addTo(map);
    
    // Popup mit Eingabefeld
    const popupContent = `
        <div class="marker-popup">
            <h4>Gefahrenstelle ${markerCounter}</h4>
            <textarea id="marker-desc-${markerCounter}" placeholder="Beschreibe die Gefahrenstelle..." rows="3"></textarea>
            <div class="marker-actions">
                <button onclick="markerSpeichern(${markerCounter})">Speichern</button>
                <button onclick="markerEntfernen(${markerCounter})" class="btn-danger">Löschen</button>
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent).openPopup();
    
    markers.push({
        id: markerCounter,
        marker: marker,
        lat: latlng.lat,
        lng: latlng.lng,
        beschreibung: ''
    });
    
    // Weiter-Button aktivieren
    document.getElementById('btn-weiter').disabled = false;
    
    updateMarkierungenListe();
}

function markerSpeichern(id) {
    const textarea = document.getElementById(`marker-desc-${id}`);
    const beschreibung = textarea ? textarea.value.trim() : '';
    
    const markerObj = markers.find(m => m.id === id);
    if (markerObj) {
        markerObj.beschreibung = beschreibung;
        markerObj.marker.closePopup();
        markerObj.marker.bindPopup(`<b>${id}.</b> ${beschreibung || 'Keine Beschreibung'}`);
    }
    
    updateMarkierungenListe();
}

function markerEntfernen(id) {
    const index = markers.findIndex(m => m.id === id);
    if (index > -1) {
        map.removeLayer(markers[index].marker);
        markers.splice(index, 1);
    }
    
    if (markers.length === 0) {
        document.getElementById('btn-weiter').disabled = true;
    }
    
    updateMarkierungenListe();
}

function updateMarkierungenListe() {
    const container = document.getElementById('markierungen-items');
    
    if (markers.length === 0) {
        container.innerHTML = '<p class="keine-markierungen">Noch keine Markierungen. Klicke auf die Karte!</p>';
        return;
    }
    
    container.innerHTML = markers.map((m, index) => `
        <div class="markierung-item" data-id="${m.id}">
            <span class="markierung-nummer">${index + 1}</span>
            <span class="markierung-text">${m.beschreibung || 'Keine Beschreibung'}</span>
            <button onclick="markerEntfernen(${m.id})" class="btn-remove" title="Löschen">×</button>
        </div>
    `).join('');
}

function pdfErstellen() {
    // Daten sammeln
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const notizen = document.getElementById('notizen').value;
    
    // PDF-Daten füllen
    document.getElementById('pdf-start').textContent = document.getElementById('start-adresse').value;
    document.getElementById('pdf-ziel').textContent = document.getElementById('ziel-adresse').value;
    
    // Markierungen ins PDF übertragen
    const pdfMarkierungen = document.getElementById('pdf-markierungen-liste');
    if (markers.length > 0) {
        pdfMarkierungen.innerHTML = markers.map((m, index) => `
            <div class="pdf-markierung-item">
                <strong>${index + 1}.</strong> Position: ${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}
                <br>${m.beschreibung || 'Keine Beschreibung'}
            </div>
        `).join('');
    } else {
        pdfMarkierungen.innerHTML = '<p>Keine Gefahrenstellen markiert.</p>';
    }
    
    // Notizen
    if (notizen) {
        document.getElementById('pdf-notizen-text').textContent = notizen;
        document.getElementById('pdf-notizen-section').style.display = 'block';
    }
    
    // Karte als Bild exportieren
    exportKarteAlsBild().then(() => {
        showStep(4);
    });
}

async function exportKarteAlsBild() {
    return new Promise((resolve) => {
        const start = startCoords;
        const end = endCoords;
        
        if (!start || !end) {
            resolve();
            return;
        }
        
        // Canvas-basierte Karte erstellen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 800;
        const height = 500;
        canvas.width = width;
        canvas.height = height;
        
        // Berechne Bounding Box mit Padding
        const padding = 0.002; // ca. 200m
        const minLat = Math.min(start.lat, end.lat) - padding;
        const maxLat = Math.max(start.lat, end.lat) + padding;
        const minLon = Math.min(start.lon, end.lon) - padding;
        const maxLon = Math.max(start.lon, end.lon) + padding;
        
        // Skalierungsfaktoren
        const latRange = maxLat - minLat;
        const lonRange = maxLon - minLon;
        const scaleX = width / lonRange;
        const scaleY = height / latRange;
        const scale = Math.min(scaleX, scaleY);
        
        // Hilfsfunktion: Koordinaten zu Pixeln
        function coordToPixel(lat, lon) {
            const x = (lon - minLon) * scale;
            const y = height - ((lat - minLat) * scale); // Y invertieren
            return { x, y };
        }
        
        // Lade OpenStreetMap Tiles als Hintergrund
        const tileSize = 256;
        const zoom = Math.floor(Math.log2(Math.max(width, height) / tileSize / Math.min(latRange, lonRange) * 111320)) + 1;
        const clampedZoom = Math.min(Math.max(zoom, 15), 18);
        
        // Berechne Tile-Koordinaten
        function latLonToTile(lat, lon, z) {
            const x = Math.floor((lon + 180) / 360 * Math.pow(2, z));
            const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
            return { x, y };
        }
        
        const startTile = latLonToTile(minLat, minLon, clampedZoom);
        const endTile = latLonToTile(maxLat, maxLon, clampedZoom);
        
        // Lade Tiles
        const tilesToLoad = [];
        for (let x = startTile.x; x <= endTile.x; x++) {
            for (let y = startTile.y; y <= endTile.y; y++) {
                tilesToLoad.push({ x, y, z: clampedZoom });
            }
        }
        
        let loadedTiles = 0;
        const totalTiles = tilesToLoad.length;
        
        // Zeichne zuerst Hintergrund
        ctx.fillStyle = '#e8f4f8';
        ctx.fillRect(0, 0, width, height);
        
        // Zeichne Straßen (einfache Darstellung)
        const startPixel = coordToPixel(start.lat, start.lon);
        const endPixel = coordToPixel(end.lat, end.lon);
        
        // Zeichne Verbindungslinie (Route)
        ctx.beginPath();
        ctx.moveTo(startPixel.x, startPixel.y);
        ctx.lineTo(endPixel.x, endPixel.y);
        ctx.strokeStyle = '#e3000f';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(startPixel.x, startPixel.y);
        ctx.lineTo(endPixel.x, endPixel.y);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Zeichne Markierungen
        // Start (Haus)
        ctx.fillStyle = '#00aa00';
        ctx.beginPath();
        ctx.arc(startPixel.x, startPixel.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏠', startPixel.x, startPixel.y);
        
        // Ende (Schule)
        ctx.fillStyle = '#e3000f';
        ctx.beginPath();
        ctx.arc(endPixel.x, endPixel.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🏫', endPixel.x, endPixel.y);
        
        // Zeichne Gefahrenstellen-Markierungen
        markers.forEach((m, index) => {
            const mPixel = coordToPixel(m.lat, m.lng);
            if (mPixel.x >= 0 && mPixel.x <= width && mPixel.y >= 0 && mPixel.y <= height) {
                ctx.fillStyle = '#ff6600';
                ctx.beginPath();
                ctx.arc(mPixel.x, mPixel.y, 10, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.fillText((index + 1).toString(), mPixel.x, mPixel.y);
            }
        });
        
        // Zeichne Legende
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(10, height - 90, 180, 80);
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, height - 90, 180, 80);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Legende:', 20, height - 70);
        
        // Legende Einträge
        ctx.fillStyle = '#00aa00';
        ctx.beginPath();
        ctx.arc(30, height - 50, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.fillText('Start (Zuhause)', 45, height - 46);
        
        ctx.fillStyle = '#e3000f';
        ctx.beginPath();
        ctx.arc(30, height - 30, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.fillText('Ziel (Schule)', 45, height - 26);
        
        // Konvertiere zu Bild
        const imgElement = document.getElementById('pdf-karte-bild');
        imgElement.src = canvas.toDataURL('image/png');
        imgElement.style.display = 'block';
        
        console.log('Karte als Canvas erstellt');
        resolve();
    });
}

function neuStarten() {
    // Reset all data
    markers.forEach(m => map.removeLayer(m.marker));
    markers = [];
    markerCounter = 0;
    
    document.getElementById('start-adresse').value = '';
    document.getElementById('ziel-adresse').value = '';
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('notizen').value = '';
    
    showStep(1);
}