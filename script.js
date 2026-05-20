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
    const startAdresse = document.getElementById('start-adresse').value.trim();
    const zielAdresse = document.getElementById('ziel-adresse').value.trim();
    
    if (!startAdresse || !zielAdresse) {
        alert('Bitte gib sowohl Start- als auch Zieladresse ein.');
        return;
    }
    
    const btn = document.getElementById('btn-route-berechnen');
    btn.disabled = true;
    btn.textContent = 'Berechne Route...';
    
    try {
        // Geocoding für Start- und Zieladresse
        startCoords = await geocodeAdresse(startAdresse);
        endCoords = await geocodeAdresse(zielAdresse);
        
        if (!startCoords || !endCoords) {
            throw new Error('Adressen konnten nicht gefunden werden');
        }
        
        // Karte initialisieren
        initMap();
        
        // Route berechnen und anzeigen
        await routeAnzeigen(startCoords, endCoords);
        
        // Weiter zu Schritt 2
        showStep(2);
        
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Berechnen der Route: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Route anzeigen';
    }
}

async function geocodeAdresse(adresse) {
    // Füge "Kirchlengern" hinzu, falls nicht vorhanden
    if (!adresse.toLowerCase().includes('kirchlengern') && 
        !adresse.toLowerCase().includes('32105')) {
        adresse += ', Kirchlengern, Deutschland';
    } else if (!adresse.toLowerCase().includes('deutschland')) {
        adresse += ', Deutschland';
    }
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            display_name: data[0].display_name
        };
    }
    return null;
}

function initMap() {
    if (map) {
        map.remove();
    }
    
    // Karte erstellen
    map = L.map('map').setView([startCoords.lat, startCoords.lon], 13);
    
    // OpenStreetMap Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Klick-Event für Markierungen
    map.on('click', function(e) {
        markerHinzufuegen(e.latlng);
    });
}

async function routeAnzeigen(start, end) {
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
    
    // Route mit OpenRouteService oder OSRM
    try {
        const routeUrl = `https://router.project-osrm.org/route/v1/foot/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
        
        const response = await fetch(routeUrl);
        const data = await response.json();
        
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
        }
    } catch (error) {
        console.warn('Routenberechnung fehlgeschlagen, zeige direkte Verbindung');
        // Fallback: Direkte Linie
        routeLayer = L.polyline(
            [[start.lat, start.lon], [end.lat, end.lon]],
            {color: '#e3000f', weight: 5, opacity: 0.8, dashArray: '10, 10'}
        ).addTo(map);
        
        map.fitBounds(routeLayer.getBounds().pad(0.2));
    }
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
        // Temporär das Leaflet-UI ausblenden
        const mapElement = document.getElementById('map');
        
        html2canvas(mapElement, {
            useCORS: true,
            allowTaint: true,
            scale: 2
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            document.getElementById('pdf-karte-bild').src = imgData;
            resolve();
        }).catch(error => {
            console.error('Fehler beim Exportieren der Karte:', error);
            document.getElementById('pdf-karte-bild').src = '';
            document.getElementById('pdf-karte-bild').alt = 'Karte konnte nicht geladen werden';
            resolve();
        });
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