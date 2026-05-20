# Schulwegsicherheit Beteiligungsbogen

Interaktiver Bürgerbeteiligungsbogen für die SPD Kirchlengern zur Erfassung von Gefahrenstellen und Verbesserungsvorschlägen im Bereich Schulwegsicherheit.

## Features

- ✅ Modernes, responsives Design
- ✅ Keine API-Keys oder Backend nötig
- ✅ Formspree-Integration für E-Mail-Versand
- ✅ Datei-Upload für Fotos
- ✅ Datenschutz-Checkbox
- ✅ Erfolgs-/Fehlerseiten

## Live-Demo

https://falkkrueger.github.io/schulwegsicherheit-beteiligung

## Technologie

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Formular-Service:** Formspree.io (kostenlos bis 50 Einreichungen/Monat)
- **Hosting:** GitHub Pages

## Einrichtung

### 1. Formspree einrichten

1. Auf [formspree.io](https://formspree.io) registrieren
2. Neues Formular erstellen
3. Endpoint-URL kopieren (z.B. `https://formspree.io/f/xyxxx`)
4. In `index.html` Zeile 31 austauschen:
   ```html
   action="https://formspree.io/f/DEINE_FORM_ID"
   ```

### 2. GitHub Pages aktivieren

1. Repository Settings → Pages
2. Branch: `main` → `/ (root)`
3. Speichern → Live in 1-2 Minuten

### 3. E-Mail-Adresse anpassen

In `index.html` Zeile 162 und `fehler.html` die Kontakt-E-Mail ändern.

## Anpassungen

### Schulen hinzufügen/ändern

In `index.html` Zeile 62-71 die Optionen anpassen:

```html
<option value="grundschule">Grundschule Kirchlengern</option>
<option value="andere-schule">Andere Schule</option>
```

### Gefahrenkategorien ändern

In `index.html` Zeile 84-122 die Checkbox-Gruppe anpassen.

### Design anpassen

In `styles.css` die CSS-Variablen ab Zeile 1:

```css
:root {
    --spd-red: #e3000f;      /* Hauptfarbe ändern */
    --background: #f5f5f5;   /* Hintergrund */
}
```

## Datenschutz

- Keine Daten werden auf Servern gespeichert
- Formular-Daten gehen direkt an Formspree
- Fotos werden mitgesendet (optional)
- Datenschutzerklärung verlinken (Zeile 159 in `index.html`)

## Lizenz

MIT License - für kommunale/öffentliche Projekte geeignet.

---

**Kontakt:** SPD Kirchlengern | info@spd-kirchlengern.de