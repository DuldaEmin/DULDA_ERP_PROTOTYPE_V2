const Modal = {
    open: (title, html, options = {}) => {
        const maxWidth = options.maxWidth || '450px';
        const showHeader = options.showHeader !== false;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'm';

        const headerHtml = showHeader
            ? `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
                <h3 style="margin:0; font-size:1.1rem; color:#334155; font-weight:700">${title || ''}</h3>
                <button onclick="Modal.close()" style="border:none; background:none; font-size:1.5rem; line-height:1; cursor:pointer; color:#64748b">&times;</button>
            </div>`
            : '';

        overlay.innerHTML = `<div class="modal-box" style="width:min(96vw, ${maxWidth}); max-width:${maxWidth}; max-height:90vh; overflow:auto">
            ${headerHtml}
            <div>${html}</div>
        </div>`;

        document.body.appendChild(overlay);
    },
    close: () => document.getElementById('m')?.remove()
};

window.addEventListener('DOMContentLoaded', App.init);

// --- ALUMINUM MODULE ---
// AluminumModule moved to aluminum_module_v2.js
