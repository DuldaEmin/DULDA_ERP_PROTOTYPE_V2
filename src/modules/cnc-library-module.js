const CncLibraryModule = {
    state: {
        searchName: '',
        searchId: '',
        selectedId: null,
        formOpen: false,
        editingId: null,
        draftId: null,
        draftOperations: [],
        draftDrawing: null
    },

    ensureData: () => {
        if (!DB.data.data.cncCards) DB.data.data.cncCards = [];
    },

    render: (container, unitId) => {
        CncLibraryModule.ensureData();
        if (!CncLibraryModule.state.draftId) CncLibraryModule.state.draftId = CncLibraryModule.generateId();

        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        const cards = (DB.data.data.cncCards || []).filter(c => c.unitId === unitId);
        const filtered = cards
            .filter(c => {
                const nameOk = CncLibraryModule.state.searchName
                    ? String(c.productName || '').toLowerCase().includes(CncLibraryModule.state.searchName.toLowerCase())
                    : true;
                const idOk = CncLibraryModule.state.searchId
                    ? String(c.cncId || '').toLowerCase().includes(CncLibraryModule.state.searchId.toLowerCase()) ||
                    String(c.productCode || '').toLowerCase().includes(CncLibraryModule.state.searchId.toLowerCase())
                    : true;
                return nameOk && idOk;
            })
            .sort((a, b) => String(a.productName || '').localeCompare(String(b.productName || ''), 'tr'));

        const editingCard = CncLibraryModule.state.editingId
            ? cards.find(c => c.id === CncLibraryModule.state.editingId)
            : null;
        const ops = CncLibraryModule.renumber(CncLibraryModule.state.draftOperations);
        const drawing = CncLibraryModule.state.draftDrawing;
        const products = DB.data.data.products || [];

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> CNC Urun Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${CncLibraryModule.escape(unit?.name || '')}</div>
                        </div>
                    </div>
                    <button onclick="CncLibraryModule.startCreate()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">Urun ekle +</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="cnc_search_name" value="${CncLibraryModule.escape(CncLibraryModule.state.searchName)}" oninput="CncLibraryModule.setSearch('name', this.value, this.selectionStart)" placeholder="isimle ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                        <input id="cnc_search_id" value="${CncLibraryModule.escape(CncLibraryModule.state.searchId)}" oninput="CncLibraryModule.setSearch('id', this.value, this.selectionStart)" placeholder="ID / kod ile ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="cnc_table_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Urun ismi</th>
                                    <th style="padding:0.65rem; text-align:left;">Kodu</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:center;">Operasyon</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="6" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(card => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${CncLibraryModule.state.selectedId === card.id ? 'background:#eff6ff;' : ''}">
                                        <td style="padding:0.65rem; font-weight:700;">${CncLibraryModule.escape(card.productName || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace;">${CncLibraryModule.escape(card.productCode || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace;">${CncLibraryModule.escape(card.cncId || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center;">
                                            <button onclick="CncLibraryModule.viewCardOperations('${card.id}')" style="border:1px solid #93c5fd; background:#dbeafe; color:#1d4ed8; border-radius:0.5rem; padding:0.2rem 0.75rem; font-weight:700; cursor:pointer;">görüntüle</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="CncLibraryModule.startEdit('${card.id}')" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.2rem 0.5rem; cursor:pointer;">duzenle</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <label style="display:inline-flex; align-items:center; gap:0.35rem;">
                                                <input type="checkbox" ${CncLibraryModule.state.selectedId === card.id ? 'checked' : ''} onchange="CncLibraryModule.toggleRowSelect('${card.id}', this.checked)" style="width:16px; height:16px; cursor:pointer;">
                                                <button onclick="CncLibraryModule.selectCard('${card.id}')" style="border:1px solid ${CncLibraryModule.state.selectedId === card.id ? '#2563eb' : '#cbd5e1'}; background:${CncLibraryModule.state.selectedId === card.id ? '#dbeafe' : 'white'}; color:${CncLibraryModule.state.selectedId === card.id ? '#1d4ed8' : '#334155'}; border-radius:0.4rem; padding:0.2rem 0.6rem; font-weight:700; cursor:pointer;">sec</button>
                                            </label>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${CncLibraryModule.state.formOpen ? `
                    <div id="cnc_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editingCard ? 'Kart duzenle' : 'Yeni kart olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                ${editingCard ? `<button onclick="CncLibraryModule.deleteCard('${editingCard.id}')" style="border:1px solid #fecaca; background:#fef2f2; color:#b91c1c; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Sil</button>` : ''}
                                <button onclick="CncLibraryModule.cancelForm()" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="CncLibraryModule.saveCard('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 4;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun ismi *</label>
                                <input id="cnc_name" value="${CncLibraryModule.escape(editingCard?.productName || '')}" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun kodu *</label>
                                <input id="cnc_code" value="${CncLibraryModule.escape(editingCard?.productCode || '')}" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 2;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="cnc_id" disabled value="${CncLibraryModule.escape(editingCard?.cncId || CncLibraryModule.state.draftId)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">bagli urun ID/kod</label>
                                <input id="cnc_linked" list="cnc_refs" value="${CncLibraryModule.escape(editingCard?.linkedProductRef || '')}" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                <datalist id="cnc_refs">
                                    ${products.map(p => `<option value="${CncLibraryModule.escape(p.code || p.id || '')}">${CncLibraryModule.escape(p.name || '')}</option>`).join('')}
                                </datalist>
                            </div>
                        </div>

                        <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem; margin-top:0.8rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem;">
                                <strong style="font-size:0.92rem;">Operasyonlar</strong>
                                <button onclick="CncLibraryModule.openOperationModal()" style="border:1px solid #93c5fd; background:#eff6ff; color:#1d4ed8; border-radius:0.35rem; padding:0.2rem 0.5rem; cursor:pointer;">Operasyon ekle +</button>
                            </div>
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                        <th style="padding:0.4rem; text-align:left;">Sira</th>
                                        <th style="padding:0.4rem; text-align:left;">Operasyon</th>
                                        <th style="padding:0.4rem; text-align:left;">Makine</th>
                                        <th style="padding:0.4rem; text-align:center;">Sure(sn)</th>
                                        <th style="padding:0.4rem; text-align:center;">G kodu</th>
                                        <th style="padding:0.4rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${ops.length === 0 ? `<tr><td colspan="6" style="padding:0.8rem; text-align:center; color:#94a3b8;">Operasyon yok.</td></tr>` : ops.map((op, idx) => `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:0.4rem; font-weight:700;">${op.order}</td>
                                            <td style="padding:0.4rem;"><div style="font-weight:700;">${CncLibraryModule.escape(op.name || '-')}</div><div style="font-size:0.74rem; color:#64748b;">${CncLibraryModule.escape(op.note || '-')}</div></td>
                                            <td style="padding:0.4rem;">${CncLibraryModule.escape(op.machineType || '-')}</td>
                                            <td style="padding:0.4rem; text-align:center; font-weight:700;">${Number(op.durationSec || 0)}</td>
                                            <td style="padding:0.4rem; text-align:center;"><button onclick="CncLibraryModule.viewDraftOperation('${op.id}')" style="border:1px solid #cbd5e1; background:white; border-radius:0.3rem; padding:0.1rem 0.35rem; cursor:pointer;">Gor</button> <button onclick="CncLibraryModule.downloadDraftOperation('${op.id}')" style="border:1px solid #cbd5e1; background:white; border-radius:0.3rem; padding:0.1rem 0.35rem; cursor:pointer;">Indir</button></td>
                                            <td style="padding:0.4rem; text-align:right;"><button onclick="CncLibraryModule.moveDraftOperation('${op.id}', -1)" ${idx === 0 ? 'disabled' : ''} style="border:1px solid #cbd5e1; background:white; border-radius:0.3rem; padding:0.1rem 0.3rem; cursor:pointer;">↑</button> <button onclick="CncLibraryModule.moveDraftOperation('${op.id}', 1)" ${idx === ops.length - 1 ? 'disabled' : ''} style="border:1px solid #cbd5e1; background:white; border-radius:0.3rem; padding:0.1rem 0.3rem; cursor:pointer;">↓</button> <button onclick="CncLibraryModule.openOperationModal('${op.id}')" style="border:1px solid #cbd5e1; background:white; border-radius:0.3rem; padding:0.1rem 0.3rem; cursor:pointer;">duzenle</button> <button onclick="CncLibraryModule.removeDraftOperation('${op.id}')" style="border:1px solid #fecaca; background:#fef2f2; color:#b91c1c; border-radius:0.3rem; padding:0.1rem 0.3rem; cursor:pointer;">sil</button></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.65rem; margin-top:0.7rem;">
                            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.65rem;">
                                <strong style="font-size:0.9rem;">Teknik resim (PDF)</strong>
                                <input id="cnc_drawing" type="file" accept="application/pdf,.pdf" onchange="CncLibraryModule.handleDraftDrawingFile(this)" style="display:block; width:100%; margin:0.45rem 0;">
                                ${drawing ? `<div style="font-size:0.8rem; margin-bottom:0.35rem;">${CncLibraryModule.escape(drawing.name || 'teknik-resim.pdf')}</div><button onclick="CncLibraryModule.previewDraftDrawing()" style="border:1px solid #cbd5e1; background:white; border-radius:0.3rem; padding:0.1rem 0.35rem; cursor:pointer;">Goruntule</button> <button onclick="CncLibraryModule.downloadDraftDrawing()" style="border:1px solid #cbd5e1; background:white; border-radius:0.3rem; padding:0.1rem 0.35rem; cursor:pointer;">Indir</button> <button onclick="CncLibraryModule.clearDraftDrawing()" style="border:1px solid #fecaca; background:#fef2f2; color:#b91c1c; border-radius:0.3rem; padding:0.1rem 0.35rem; cursor:pointer;">Kaldir</button>` : `<div style="font-size:0.8rem; color:#94a3b8;">PDF yuklenmedi.</div>`}
                            </div>
                            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.65rem;">
                                <strong style="font-size:0.9rem;">Notlar</strong>
                                <textarea id="cnc_notes" rows="6" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical; margin-top:0.35rem;">${CncLibraryModule.escape(editingCard?.notes || '')}</textarea>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // UI rule: form always opens above list rows.
        if (CncLibraryModule.state.formOpen) {
            const formEl = document.getElementById('cnc_form_block');
            const tableEl = document.getElementById('cnc_table_block');
            if (formEl && tableEl && tableEl.parentElement) {
                tableEl.parentElement.insertBefore(formEl, tableEl);
            }
        }
    },

    setSearch: (field, value, caretPos = null) => {
        if (field === 'name') CncLibraryModule.state.searchName = value || '';
        if (field === 'id') CncLibraryModule.state.searchId = value || '';
        UI.renderCurrentPage();

        // Full re-render loses focus; restore cursor so typing can continue.
        setTimeout(() => {
            const targetId = field === 'name' ? 'cnc_search_name' : 'cnc_search_id';
            const inputEl = document.getElementById(targetId);
            if (!inputEl) return;
            inputEl.focus();
            const pos = Number.isFinite(caretPos) ? caretPos : String(inputEl.value || '').length;
            try { inputEl.setSelectionRange(pos, pos); } catch (_e) { }
        }, 0);
    },

    toggleRowSelect: (cardId, checked) => {
        CncLibraryModule.state.selectedId = checked ? cardId : null;
        UI.renderCurrentPage();
    },

    viewCardOperations: (cardId) => {
        const card = (DB.data.data.cncCards || []).find(c => c.id === cardId);
        if (!card) return;
        const operations = CncLibraryModule.renumber(card.operations || []);

        Modal.open(`Operasyonlar - ${CncLibraryModule.escape(card.productName || '')}`, `
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
                ${operations.length === 0 ? `<div style="padding:0.8rem; color:#94a3b8; text-align:center;">Operasyon yok.</div>` : operations.map(op => `
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                            <strong style="font-size:0.9rem; color:#0f172a;">${op.order}. ${CncLibraryModule.escape(op.name || '-')}</strong>
                            <span style="font-size:0.78rem; color:#475569;">${CncLibraryModule.escape(op.machineType || '-')} - ${Number(op.durationSec || 0)} sn</span>
                        </div>
                        <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.35rem;">${CncLibraryModule.escape(op.note || '-')}</div>
                        <div style="display:flex; gap:0.35rem;">
                            <button onclick="CncLibraryModule.viewSavedOperation('${card.id}','${op.id}')" style="border:1px solid #cbd5e1; background:white; border-radius:0.35rem; padding:0.15rem 0.45rem; cursor:pointer;">G kodu gor</button>
                            <button onclick="CncLibraryModule.downloadSavedOperation('${card.id}','${op.id}')" style="border:1px solid #cbd5e1; background:white; border-radius:0.35rem; padding:0.15rem 0.45rem; cursor:pointer;">G kodu indir</button>
                        </div>
                    </div>
                `).join('')}
                <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem; margin-top:0.35rem;">
                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.3rem; font-weight:700;">Kart notlari</div>
                    <div style="font-size:0.84rem; color:#334155; white-space:pre-wrap; min-height:48px;">${CncLibraryModule.escape(card.notes || '-')}</div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem; margin-top:0.2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.4rem;">
                        <div style="font-size:0.82rem; color:#64748b; font-weight:700;">Teknik resim (PDF) onizleme</div>
                        <div style="display:flex; gap:0.35rem;">
                            ${card.technicalDrawing?.dataUrl
                                ? `<button onclick="CncLibraryModule.previewSavedDrawing('${card.id}')" style="border:1px solid #cbd5e1; background:white; border-radius:0.35rem; padding:0.2rem 0.45rem; cursor:pointer;">Yeni sekmede gor</button>
                                   <button onclick="CncLibraryModule.downloadSavedDrawing('${card.id}')" style="border:1px solid #cbd5e1; background:white; border-radius:0.35rem; padding:0.2rem 0.45rem; cursor:pointer;">PDF indir</button>`
                                : ''
                            }
                        </div>
                    </div>

                    ${card.technicalDrawing?.dataUrl
                        ? `<iframe src="${card.technicalDrawing.dataUrl}" title="Teknik resim onizleme" style="width:100%; height:340px; border:1px solid #cbd5e1; border-radius:0.45rem; background:white;"></iframe>`
                        : `<div style="font-size:0.8rem; color:#94a3b8;">Teknik resim yok.</div>`
                    }
                </div>
            </div>
        `, { maxWidth: '740px' });
    },

    startCreate: () => {
        CncLibraryModule.state.formOpen = true;
        CncLibraryModule.state.editingId = null;
        CncLibraryModule.state.draftId = CncLibraryModule.generateId();
        CncLibraryModule.state.draftOperations = [];
        CncLibraryModule.state.draftDrawing = null;
        UI.renderCurrentPage();
    },

    startEdit: (cardId) => {
        const card = (DB.data.data.cncCards || []).find(c => c.id === cardId);
        if (!card) return;
        CncLibraryModule.state.formOpen = true;
        CncLibraryModule.state.editingId = cardId;
        CncLibraryModule.state.selectedId = cardId;
        CncLibraryModule.state.draftId = card.cncId;
        CncLibraryModule.state.draftOperations = CncLibraryModule.renumber((card.operations || []).map(op => ({ ...op })));
        CncLibraryModule.state.draftDrawing = card.technicalDrawing ? { ...card.technicalDrawing } : null;
        UI.renderCurrentPage();
    },

    cancelForm: () => {
        CncLibraryModule.state.formOpen = false;
        CncLibraryModule.state.editingId = null;
        CncLibraryModule.state.draftId = CncLibraryModule.generateId();
        CncLibraryModule.state.draftOperations = [];
        CncLibraryModule.state.draftDrawing = null;
        UI.renderCurrentPage();
    },

    selectCard: (cardId) => {
        CncLibraryModule.state.selectedId = cardId;
        CncLibraryModule.state.formOpen = false;
        CncLibraryModule.state.editingId = null;
        UI.renderCurrentPage();
    },

    saveCard: async (unitId) => {
        const name = document.getElementById('cnc_name')?.value.trim() || '';
        const code = (document.getElementById('cnc_code')?.value.trim() || '').toUpperCase();
        const linked = document.getElementById('cnc_linked')?.value.trim() || '';
        const notes = document.getElementById('cnc_notes')?.value.trim() || '';
        const drawingFile = document.getElementById('cnc_drawing')?.files?.[0];
        const ops = CncLibraryModule.renumber(CncLibraryModule.state.draftOperations);

        if (!name || !code) return alert('Urun ismi ve urun kodu zorunlu.');
        if (ops.length === 0) return alert('En az bir operasyon ekleyin.');
        if (ops.some(op => !op.name || !op.machineType || Number(op.durationSec || 0) <= 0 || (!String(op.gcodeText || '').trim() && !String(op.gcodeFileDataUrl || '').trim()))) {
            return alert('Operasyon ad, makine, sure ve G kodu zorunlu.');
        }

        const all = DB.data.data.cncCards || [];
        if (all.some(c => c.unitId === unitId && String(c.productCode || '').toLowerCase() === code.toLowerCase() && c.id !== CncLibraryModule.state.editingId)) {
            return alert('Ayni urun kodu ile kart zaten var.');
        }
        if (CncLibraryModule.isGlobalCodeTaken(code, CncLibraryModule.state.editingId ? {
            collection: 'cncCards',
            id: CncLibraryModule.state.editingId,
            field: 'productCode'
        } : null)) {
            return alert('Bu urun kodu zaten kullaniliyor. Tum kodlar benzersiz olmalidir.');
        }

        let drawing = CncLibraryModule.state.draftDrawing ? { ...CncLibraryModule.state.draftDrawing } : null;
        if (drawingFile) {
            const isPdf = String(drawingFile.name || '').toLowerCase().endsWith('.pdf') || String(drawingFile.type || '').toLowerCase().includes('pdf');
            if (!isPdf) return alert('Teknik resim sadece PDF olabilir.');
            drawing = { name: drawingFile.name, dataUrl: await CncLibraryModule.readAsDataUrl(drawingFile), uploadedAt: new Date().toISOString() };
        }

        const idx = all.findIndex(c => c.id === CncLibraryModule.state.editingId);
        const now = new Date().toISOString();
        let cncId = idx >= 0 ? (all[idx].cncId || CncLibraryModule.state.draftId) : CncLibraryModule.state.draftId;
        if (CncLibraryModule.isGlobalCodeTaken(cncId, CncLibraryModule.state.editingId ? {
            collection: 'cncCards',
            id: CncLibraryModule.state.editingId,
            field: 'cncId'
        } : null)) {
            cncId = CncLibraryModule.generateId();
        }
        const payload = {
            id: idx >= 0 ? all[idx].id : crypto.randomUUID(),
            unitId,
            productName: name,
            productCode: code,
            cncId,
            linkedProductRef: linked,
            notes,
            operations: ops,
            technicalDrawing: drawing,
            createdAt: idx >= 0 ? (all[idx].createdAt || now) : now,
            updatedAt: now
        };
        if (idx >= 0) all[idx] = payload;
        else all.push(payload);

        DB.data.data.cncCards = all;
        await DB.save();
        CncLibraryModule.state.selectedId = payload.id;
        CncLibraryModule.cancelForm();
    },

    deleteCard: async (cardId) => {
        const role = String(DB.data?.meta?.activeRole || 'super-admin').toLowerCase();
        if (role !== 'super-admin') return alert('Silme islemi sadece super admin icin acik.');
        if (!confirm('Bu kart tamamen silinsin mi?')) return;
        DB.data.data.cncCards = (DB.data.data.cncCards || []).filter(c => c.id !== cardId);
        await DB.save();
        CncLibraryModule.state.selectedId = null;
        CncLibraryModule.cancelForm();
    },

    openOperationModal: (operationId = '') => {
        const op = operationId ? (CncLibraryModule.state.draftOperations || []).find(x => x.id === operationId) : null;
        const machineOptions = ['CNC Torna', 'Isleme Merkezi'];
        Modal.open(op ? 'Operasyon duzenle' : 'Operasyon ekle', `
            <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <input id="op_name" placeholder="Operasyon ismi *" value="${CncLibraryModule.escape(op?.name || '')}" style="height:38px; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0 0.6rem;">
                <select id="op_machine" style="height:38px; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0 0.6rem;">
                    <option value="">Makine secin *</option>
                    ${machineOptions.map(m => `<option value="${m}" ${op?.machineType === m ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
                <input id="op_duration" type="number" min="1" placeholder="Operasyon suresi sn *" value="${Number(op?.durationSec || 0) || ''}" style="height:38px; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0 0.6rem;">
                <input id="op_note" placeholder="Operasyon notu" value="${CncLibraryModule.escape(op?.note || '')}" style="height:38px; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0 0.6rem;">
                <textarea id="op_gcode_text" rows="6" placeholder="G kodu *" style="border:1px solid #cbd5e1; border-radius:0.5rem; padding:0.55rem; font-family:monospace; resize:vertical;">${CncLibraryModule.escape(op?.gcodeText || '')}</textarea>
                <input id="op_gcode_file" type="file" accept=".txt,text/plain">
                <div style="font-size:0.75rem; color:#64748b;">${CncLibraryModule.escape(op?.gcodeFileName || 'Yuklu dosya yok')}</div>
                <button onclick="CncLibraryModule.saveOperation('${operationId}')" class="btn-primary">Kaydet</button>
            </div>
        `, { maxWidth: '620px' });
    },

    saveOperation: async (operationId = '') => {
        const name = document.getElementById('op_name')?.value.trim() || '';
        const machine = document.getElementById('op_machine')?.value || '';
        const duration = Number(document.getElementById('op_duration')?.value || 0);
        const note = document.getElementById('op_note')?.value.trim() || '';
        const gText = document.getElementById('op_gcode_text')?.value || '';
        const gFile = document.getElementById('op_gcode_file')?.files?.[0];
        const list = CncLibraryModule.state.draftOperations || [];
        const existing = operationId ? list.find(x => x.id === operationId) : null;

        if (!name) return alert('Operasyon ismi zorunlu.');
        if (!machine) return alert('Makine secimi zorunlu.');
        if (!Number.isFinite(duration) || duration <= 0) return alert('Sure 0 dan buyuk olmali.');

        let fileText = '';
        let fileDataUrl = '';
        let fileName = existing?.gcodeFileName || '';
        if (gFile) {
            const okTxt = String(gFile.name || '').toLowerCase().endsWith('.txt') || String(gFile.type || '').toLowerCase().includes('text');
            if (!okTxt) return alert('G kodu dosyasi TXT olmali.');
            fileText = await CncLibraryModule.readAsText(gFile);
            fileDataUrl = await CncLibraryModule.readAsDataUrl(gFile);
            fileName = gFile.name;
        }

        const gcodeText = String(gText || '').trim() || String(fileText || '').trim() || String(existing?.gcodeText || '').trim();
        const gcodeFileDataUrl = fileDataUrl || existing?.gcodeFileDataUrl || '';
        if (!gcodeText && !gcodeFileDataUrl) return alert('G kodu zorunlu.');

        const payload = {
            id: existing?.id || crypto.randomUUID(),
            order: existing?.order || (list.length + 1),
            name,
            machineType: machine,
            durationSec: duration,
            note,
            gcodeText,
            gcodeFileName: fileName,
            gcodeFileDataUrl
        };
        if (existing) {
            const idx = list.findIndex(x => x.id === existing.id);
            if (idx >= 0) list[idx] = payload;
        } else list.push(payload);

        CncLibraryModule.state.draftOperations = CncLibraryModule.renumber(list);
        Modal.close();
        UI.renderCurrentPage();
    },

    removeDraftOperation: (operationId) => {
        if (!confirm('Bu operasyon silinsin mi?')) return;
        CncLibraryModule.state.draftOperations = CncLibraryModule.renumber((CncLibraryModule.state.draftOperations || []).filter(x => x.id !== operationId));
        UI.renderCurrentPage();
    },

    moveDraftOperation: (operationId, dir) => {
        const list = CncLibraryModule.renumber(CncLibraryModule.state.draftOperations);
        const idx = list.findIndex(x => x.id === operationId);
        if (idx < 0) return;
        const t = idx + Number(dir || 0);
        if (t < 0 || t >= list.length) return;
        const tmp = list[idx];
        list[idx] = list[t];
        list[t] = tmp;
        CncLibraryModule.state.draftOperations = CncLibraryModule.renumber(list);
        UI.renderCurrentPage();
    },

    viewDraftOperation: (operationId) => {
        const op = (CncLibraryModule.state.draftOperations || []).find(x => x.id === operationId);
        CncLibraryModule.viewGCode(op);
    },

    downloadDraftOperation: (operationId) => {
        const op = (CncLibraryModule.state.draftOperations || []).find(x => x.id === operationId);
        CncLibraryModule.downloadGCode(op);
    },

    viewSavedOperation: (cardId, operationId) => {
        const card = (DB.data.data.cncCards || []).find(c => c.id === cardId);
        const op = (card?.operations || []).find(x => x.id === operationId);
        CncLibraryModule.viewGCode(op);
    },

    downloadSavedOperation: (cardId, operationId) => {
        const card = (DB.data.data.cncCards || []).find(c => c.id === cardId);
        const op = (card?.operations || []).find(x => x.id === operationId);
        CncLibraryModule.downloadGCode(op);
    },

    viewGCode: (op) => {
        if (!op) return;
        const txt = String(op.gcodeText || '').trim();
        if (!txt && op.gcodeFileDataUrl) return window.open(op.gcodeFileDataUrl, '_blank', 'noopener,noreferrer');
        if (!txt) return alert('G kodu bulunamadi.');
        Modal.open(`G kodu - ${CncLibraryModule.escape(op.name || '')}`, `<pre style="white-space:pre-wrap; word-break:break-word; background:#0f172a; color:#e2e8f0; border-radius:0.55rem; padding:0.75rem; max-height:60vh; overflow:auto; font-size:0.8rem; font-family:monospace;">${CncLibraryModule.escape(txt)}</pre>`, { maxWidth: '760px' });
    },

    downloadGCode: (op) => {
        if (!op) return;
        if (op.gcodeText) return CncLibraryModule.downloadText(op.gcodeText, op.gcodeFileName || 'gcode.txt');
        if (op.gcodeFileDataUrl) {
            const a = document.createElement('a');
            a.href = op.gcodeFileDataUrl;
            a.download = op.gcodeFileName || 'gcode.txt';
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
        }
        alert('Indirilecek G kodu yok.');
    },

    clearDraftDrawing: () => {
        CncLibraryModule.state.draftDrawing = null;
        UI.renderCurrentPage();
    },

    handleDraftDrawingFile: async (inputEl) => {
        const file = inputEl?.files?.[0];
        if (!file) return;
        const isPdf = String(file.name || '').toLowerCase().endsWith('.pdf') ||
            String(file.type || '').toLowerCase().includes('pdf');
        if (!isPdf) {
            alert('Teknik resim sadece PDF olabilir.');
            inputEl.value = '';
            return;
        }

        CncLibraryModule.state.draftDrawing = {
            name: file.name,
            dataUrl: await CncLibraryModule.readAsDataUrl(file),
            uploadedAt: new Date().toISOString()
        };
        UI.renderCurrentPage();
    },

    previewDraftDrawing: async () => {
        if (!CncLibraryModule.state.draftDrawing?.dataUrl) return;
        await CncLibraryModule.openPdfPreview(CncLibraryModule.state.draftDrawing.dataUrl);
    },

    downloadDraftDrawing: () => {
        if (!CncLibraryModule.state.draftDrawing?.dataUrl) return;
        const a = document.createElement('a');
        a.href = CncLibraryModule.state.draftDrawing.dataUrl;
        a.download = CncLibraryModule.state.draftDrawing.name || 'teknik-resim.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    previewSavedDrawing: async (cardId) => {
        const card = (DB.data.data.cncCards || []).find(c => c.id === cardId);
        if (!card?.technicalDrawing?.dataUrl) return;
        await CncLibraryModule.openPdfPreview(card.technicalDrawing.dataUrl);
    },

    downloadSavedDrawing: (cardId) => {
        const card = (DB.data.data.cncCards || []).find(c => c.id === cardId);
        if (!card?.technicalDrawing?.dataUrl) return;
        const a = document.createElement('a');
        a.href = card.technicalDrawing.dataUrl;
        a.download = card.technicalDrawing.name || 'teknik-resim.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    openPdfPreview: async (dataUrl) => {
        if (!dataUrl) return;

        const previewWin = window.open('about:blank', '_blank');
        if (!previewWin) {
            alert('Tarayici yeni pencereyi engelledi. Pop-up izni verip tekrar deneyin.');
            return;
        }

        previewWin.document.title = 'Teknik Resim';
        previewWin.document.body.style.margin = '0';
        previewWin.document.body.innerHTML = `
            <div style="height:100vh; display:flex; align-items:center; justify-content:center; font-family:Inter,sans-serif; color:#334155;">
                Teknik resim yukleniyor...
            </div>
        `;

        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            previewWin.location.replace(blobUrl);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
        } catch (error) {
            try {
                previewWin.location.replace(dataUrl);
            } catch (fallbackError) {
                previewWin.document.body.innerHTML = `
                    <div style="padding:1rem; font-family:Inter,sans-serif; color:#b91c1c;">
                        Teknik resim acilamadi.
                    </div>
                `;
            }
        }
    },

    generateId: () => {
        const cards = DB.data.data.cncCards || [];
        let maxNo = 0;
        cards.forEach(c => {
            const m = String(c.cncId || '').match(/CNC-(\d+)/i);
            if (!m) return;
            const n = Number(m[1]);
            if (Number.isFinite(n) && n > maxNo) maxNo = n;
        });
        let next = maxNo + 1;
        let id = `CNC-${String(next).padStart(6, '0')}`;
        while (cards.some(c => c.cncId === id) || CncLibraryModule.isGlobalCodeTaken(id)) {
            next += 1;
            id = `CNC-${String(next).padStart(6, '0')}`;
        }
        return id;
    },

    collectGlobalCodes: (exclude = null) => {
        const bag = new Set();
        const add = (value) => {
            const normalized = String(value || '').trim().toUpperCase();
            if (!normalized) return;
            bag.add(normalized);
        };
        const shouldSkip = (collection, row, field) => {
            if (!exclude || !row) return false;
            if (exclude.collection !== collection) return false;
            if (String(exclude.id || '') !== String(row.id || '')) return false;
            if (exclude.field && exclude.field !== field) return false;
            return true;
        };
        const readMany = (collection, list, fields) => {
            if (!Array.isArray(list)) return;
            list.forEach(row => {
                fields.forEach(field => {
                    if (shouldSkip(collection, row, field)) return;
                    add(row?.[field]);
                });
            });
        };

        readMany('products', DB.data?.data?.products, ['code']);
        readMany('cncCards', DB.data?.data?.cncCards, ['productCode', 'cncId']);
        readMany('sawCutOrders', DB.data?.data?.sawCutOrders, ['code']);
        readMany('extruderLibraryCards', DB.data?.data?.extruderLibraryCards, ['cardCode']);
        readMany('plexiPolishCards', DB.data?.data?.plexiPolishCards, ['cardCode']);
        readMany('pvdCards', DB.data?.data?.pvdCards, ['cardCode']);
        readMany('ibrahimPolishCards', DB.data?.data?.ibrahimPolishCards, ['cardCode']);
        readMany('eloksalCards', DB.data?.data?.eloksalCards, ['cardCode']);
        readMany('aluminumProfiles', DB.data?.data?.aluminumProfiles, ['code']);
        return bag;
    },

    isGlobalCodeTaken: (code, exclude = null) => {
        const normalized = String(code || '').trim().toUpperCase();
        if (!normalized) return false;
        return CncLibraryModule.collectGlobalCodes(exclude).has(normalized);
    },

    renumber: (ops) => [...(ops || [])]
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .map((op, i) => ({ ...op, order: i + 1 })),

    readAsDataUrl: (file) => new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(r.error || new Error('Dosya okunamadi.'));
        r.readAsDataURL(file);
    }),

    readAsText: (file) => new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(r.error || new Error('Dosya okunamadi.'));
        r.readAsText(file);
    }),

    downloadText: (text, fileName) => {
        const blob = new Blob([String(text || '')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'gcode.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },

    escape: (value) => {
        if (value === null || value === undefined) return '';
        return String(value).replace(/[&<>"']/g, (ch) => {
            if (ch === '&') return '&amp;';
            if (ch === '<') return '&lt;';
            if (ch === '>') return '&gt;';
            if (ch === '"') return '&quot;';
            return '&#39;';
        });
    }
};
