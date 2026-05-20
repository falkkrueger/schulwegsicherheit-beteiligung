# Schulwegsicherheit - Interaktive Beteiligung

Ein webbasiertes Tool für die SPD Kirchlengern zur Erfassung von Gefahrenstellen auf Schulwegen. Kinder können ihre Route visualisieren und Gefahren direkt auf einer Karte markieren.

## Features

- ✅ **Adress-Suche:** Start (Zuhause) und Ziel (Schule) eingeben
- ✅ **Routenberechnung:** Automatische Fußweg-Berechnung via OpenStreetMap
- ✅ **Interaktive Karte:** Klicken zum Markieren von Gefahrenstellen
- ✅ **Beschreibungen:** Zu jeder Markierung Notizen hinzufügen
- ✅ **PDF-Export:** Karte mit Markierungen als druckbares PDF
- ✅ **Mobile-optimiert:** Funktioniert auf Smartphones und Tablets

## Live-Demo

https://falkkrueger.github.io/schulwegsicherheit-beteiligung

## Anleitung für Eltern & Kinder

### So funktioniert's:

1. **Adressen eingeben**
   - Start: Deine Hausadresse
   - Ziel: Schuladresse
   - Auf "Route anzeigen" klicken

2. **Gefahren markieren**
   - Auf die Karte klicken, wo Gefahren bestehen
   - Beschreibung hinzufügen (z.B. "Kein Zebrastreifen")
   - Marker können verschoben werden

3. **PDF erstellen**
   - Name und E-Mail optional angeben
   - Weitere Notizen hinzufügen
   - PDF generieren und ausdrucken

4. **Einreichen**
   - Ausgedrucktes PDF dem Kind für die Schule mitgeben
   - Oder digital an SPD Kirchlengern senden

## Technische Umsetzung

### Verwendete Dienste:

- **Karten:** OpenStreetMap via Leaflet.js
- **Geocoding:** Nominatim (OpenStreetMap)
- **Routenberechnung:** OSRM (Open Source Routing Machine)
- **PDF-Export:** html2canvas

### Keine API-Keys nötig!

Alle verwendeten Dienste sind kostenlos und Open Source.

## Technologie

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Karten-Bibliothek:** Leaflet.js 1.9.4
- **PDF-Export:** html2canvas 1.4.1
- **Hosting:** GitHub Pages

## Datenschutz

- Keine Daten werden auf Servern gespeichert
- Alles läuft lokal im Browser
- PDF wird client-seitig generiert
- Keine Cookies, kein Tracking

## Lizenz

MIT License - für kommunale/öffentliche Projekte geeignet.

---

**Kontakt:** SPD Kirchlengern | info@spd-kirchlengern.de