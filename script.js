document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('beteiligung-form');
    const fileInput = document.getElementById('foto-upload');
    const filePreview = document.getElementById('file-preview');
    const submitButton = form?.querySelector('.btn-submit');
    const formStatus = document.getElementById('form-status');
    
    // GitHub Repository Info
    const GITHUB_OWNER = 'falkkrueger';
    const GITHUB_REPO = 'schulwegsicherheit-beteiligung';
    
    // File upload preview
    if (fileInput && filePreview) {
        const selectedFiles = new Map();
        
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            
            files.forEach(file => {
                if (file.size > 5 * 1024 * 1024) {
                    alert(`"${file.name}" ist zu groß (max. 5MB)`);
                    return;
                }
                
                if (!selectedFiles.has(file.name)) {
                    selectedFiles.set(file.name, file);
                    
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.dataset.filename = file.name;
                    fileItem.innerHTML = `
                        <span>📄 ${file.name}</span>
                        <span class="remove-file" title="Entfernen">×</span>
                    `;
                    
                    fileItem.querySelector('.remove-file').addEventListener('click', function() {
                        selectedFiles.delete(file.name);
                        fileItem.remove();
                        updateFileInput();
                    });
                    
                    filePreview.appendChild(fileItem);
                }
            });
            
            updateFileInput();
        });
        
        function updateFileInput() {
            const dataTransfer = new DataTransfer();
            selectedFiles.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
        }
    }
    
    // Form submission - Erstellt direkt ein GitHub Issue
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!submitButton) return;
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            
            try {
                // Sammle Formulardaten
                const formData = new FormData(form);
                
                // Sammle Checkbox-Werte
                const gefahren = [];
                form.querySelectorAll('input[name="gefahr[]"]:checked').forEach(cb => {
                    gefahren.push(cb.nextElementSibling.textContent.trim());
                });
                
                // Erstelle Issue-Text
                const issueTitle = `🚨 Schulwegsicherheit: ${formData.get('standort')}`;
                const issueBody = `## Neue Meldung zur Schulwegsicherheit

**Name:** ${formData.get('name')}
**E-Mail:** ${formData.get('email')}
**Telefon:** ${formData.get('telefon') || 'Nicht angegeben'}
**Adresse:** ${formData.get('adresse')}

### Schulweg
**Schule:** ${formData.get('schule')}
**Route:** ${formData.get('schulweg-beschreibung')}

### Gefahrenstelle
**Standort:** ${formData.get('standort')}

**Gemeldete Gefahren:**
${gefahren.map(g => `- ${g}`).join('\n') || '- Keine spezifischen Gefahren angegeben'}

### Details
${formData.get('beschreibung')}

### Verbesserungsvorschlag
${formData.get('vorschlag') || 'Kein Vorschlag'}

---
*Automatisch erstellt via Beteiligungsbogen*`;

                // Öffne GitHub Issues mit vorausgefülltem Formular
                const githubUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/new?` + 
                    `title=${encodeURIComponent(issueTitle)}&` +
                    `body=${encodeURIComponent(issueBody)}&` +
                    `labels=${encodeURIComponent('schulwegsicherheit,bürgermeldung')}`;
                
                // Speichere Daten im localStorage für den Fall, dass der Tab geschlossen wird
                localStorage.setItem('beteiligung_daten', JSON.stringify({
                    issueTitle,
                    issueBody,
                    timestamp: new Date().toISOString()
                }));
                
                // Weiterleitung zu GitHub
                window.location.href = githubUrl;
                
            } catch (error) {
                console.error('Error:', error);
                
                if (formStatus) {
                    formStatus.className = 'form-status error';
                    formStatus.innerHTML = `
                        <strong>Ein Fehler ist aufgetreten.</strong><br>
                        Bitte versuchen Sie es später erneut.
                    `;
                }
                
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
            }
        });
    }
    
    // Prüfe, ob wir von GitHub zurückkommen
    if (window.location.search.includes('success')) {
        // Zeige Erfolgsmeldung
        window.location.href = 'danke.html';
    }
    
    // Auto-resize textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 400) + 'px';
        });
    });
    
    // Form validation enhancement
    const requiredInputs = document.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.style.borderColor = 'var(--error)';
            } else {
                this.style.borderColor = '';
            }
        });
        
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = '';
            }
        });
    });
});