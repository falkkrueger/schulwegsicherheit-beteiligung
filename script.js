document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('beteiligung-form');
    const fileInput = document.getElementById('foto-upload');
    const filePreview = document.getElementById('file-preview');
    const submitButton = form?.querySelector('.btn-submit');
    const formStatus = document.getElementById('form-status');
    
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
    
    // Form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!submitButton) return;
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            
            try {
                const formData = new FormData(form);
                
                // Log form data for debugging
                console.log('Sending form data...');
                
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    window.location.href = 'danke.html';
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                console.error('Error:', error);
                
                if (formStatus) {
                    formStatus.className = 'form-status error';
                    formStatus.innerHTML = `
                        <strong>Ein Fehler ist aufgetreten.</strong><br>
                        Bitte versuchen Sie es später erneut oder kontaktieren Sie uns unter info@spd-kirchlengern.de
                    `;
                }
                
                // Redirect to error page after a delay
                setTimeout(() => {
                    window.location.href = 'fehler.html';
                }, 3000);
            } finally {
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
            }
        });
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