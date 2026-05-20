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
        
        // Berechne Mittelpunkt und Zoom
        const midLat = (start.lat + end.lat) / 2;
        const midLon = (start.lon + end.lon) / 2;
        
        // Berechne Zoom basierend auf Distanz
        const dist = Math.sqrt(Math.pow(end.lat - start.lat, 2) + Math.pow(end.lon - start.lon, 2));
        let zoom = 16;
        if (dist > 0.02) zoom = 15;
        if (dist > 0.05) zoom = 14;
        if (dist > 0.1) zoom = 13;
        
        // Versuche verschiedene Static Map Services
        const services = [
            // MapQuest Open (kein API-Key nötig für niedrige Nutzung)
            `https://www.mapquestapi.com/staticmap/v5/map?` +
            `key=YOUR_KEY&center=${midLat},${midLon}&zoom=${zoom}&size=800,500&` +
            `locations=${start.lat},${start.lon}|${end.lat},${end.lon}`,
            
            // OpenStreetMap.de Static (einfacher)
            `https://staticmap.openstreetmap.de/staticmap.php?` +
            `center=${midLat},${midLon}&zoom=${zoom}&size=800x500&` +
            `markers=${start.lat},${start.lon},ol-marker-green|${end.lat},${end.lon},ol-marker-red`,
            
            // Geoapify (kostenlos bis 3000/Tag)
            `https://maps.geoapify.com/v1/staticmap?style=osm-carto&` +
            `width=800&height=500&center=lonlat:${midLon},${midLat}&zoom=${zoom}&` +
            `marker=lonlat:${start.lon},${start.lat};color:#00aa00|lonlat:${end.lon},${end.lat};color:#aa0000`
        ];
        
        const imgElement = document.getElementById('pdf-karte-bild');
        let currentService = 0;
        
        function tryNextService() {
            if (currentService >= services.length) {
                // Alle Services fehlgeschlagen - Fallback
                console.error('Kein Karten-Service verfügbar');
                imgElement.style.display = 'none';
                document.getElementById('pdf-karte-container').innerHTML = 
                    '<div style="padding: 40px; text-align: center; background: #f5f5f5; border-radius: 8px;">' +
                    '<p><strong>🗺️ Schulweg</strong></p>' +
                    '<p style="margin-top: 15px;"><b>Von:</b> ' + document.getElementById('start-adresse').value + '</p>' +
                    '<p><b>Nach:</b> ' + document.getElementById('ziel-adresse').value + '</p>' +
                    '<p style="margin-top: 15px; font-size: 0.9em; color: #666;">' +
                    'Koordinaten: ' + start.lat.toFixed(5) + ', ' + start.lon.toFixed(5) + ' → ' +
                    end.lat.toFixed(5) + ', ' + end.lon.toFixed(5) + '</p>' +
                    '</div>';
                resolve();
                return;
            }
            
            const url = services[currentService];
            console.log('Versuche Karten-Service', currentService + 1, ':', url);
            
            imgElement.src = url;
            imgElement.style.display = 'block';
            
            imgElement.onload = function() {
                console.log('Kartenbild erfolgreich geladen von Service', currentService + 1);
                resolve();
            };
            
            imgElement.onerror = function() {
                console.log('Service', currentService + 1, 'fehlgeschlagen');
                currentService++;
                tryNextService();
            };
        }
        
        tryNextService();
        
        // Timeout nach 10 Sekunden
        setTimeout(() => {
            if (!imgElement.complete || imgElement.naturalWidth === 0) {
                console.error('Timeout beim Laden der Karte');
                imgElement.onerror();
            }
        }, 10000);
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