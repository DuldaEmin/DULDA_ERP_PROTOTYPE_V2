const MontageLibraryModule = {
    state: {
        searchName: '',
        searchCode: '',
        searchId: '',
        formOpen: false,
        editingId: null,
        selectedId: null,
        draftCardCode: '',
        draftProductName: '',
        draftProductCode: '',
        draftTechDrawing: null,
        draftExplodedDrawing: null,
        draftComponentIds: [],
        draftComponentInput: '',
        draftNote: ''
    },

    resetState: () => {
        MontageLibraryModule.state.searchName = '';
        MontageLibraryModule.state.searchCode = '';
        MontageLibraryModule.state.searchId = '';
        MontageLibraryModule.state.formOpen = false;
        MontageLibraryModule.state.editingId = null;
        MontageLibraryModule.state.selectedId = null;
        MontageLibraryModule.state.draftCardCode = '';
        MontageLibraryModule.state.draftProductName = '';
        MontageLibraryModule.state.draftProductCode = '';
        MontageLibraryModule.state.draftTechDrawing = null;
        MontageLibraryModule.state.draftExplodedDrawing = null;
        MontageLibraryModule.state.draftComponentIds = [];
        MontageLibraryModule.state.draftComponentInput = '';
        MontageLibraryModule.state.draftNote = '';
    },

    ensureData: () => {
        if (!Array.isArray(DB.data?.data?.montageCards)) DB.data.data.montageCards = [];
    },

    getNextCardCode: () => {
        MontageLibraryModule.ensureData();
        const max = (DB.data.data.montageCards || []).reduce((acc, row) => {
            const code = String(row?.cardCode || '').trim().toUpperCase();
            const m = code.match(/^MON-(\d{6})$/);
            if (!m) return acc;
            return Math.max(acc, Number(m[1]));
        }, 0);
        let n = max + 1;
        let candidate = `MON-${String(n).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            n += 1;
            candidate = `MON-${String(n).padStart(6, '0')}`;
        }
        return candidate;
    },

    setSearch: (field, value, focusId) => {
        if (field === 'name') MontageLibraryModule.state.searchName = value || '';
        if (field === 'code') MontageLibraryModule.state.searchCode = value || '';
        if (field === 'id') MontageLibraryModule.state.searchId = value || '';
        UI.renderCurrentPage();
        if (!focusId) return;
        setTimeout(() => {
            const el = document.getElementById(focusId);
            if (!el) return;
            el.focus();
            const len = el.value.length;
            try { el.setSelectionRange(len, len); } catch (_) { }
        }, 0);
    },

    toggleForm: () => {
        if (MontageLibraryModule.state.formOpen || MontageLibraryModule.state.editingId) {
            MontageLibraryModule.resetDraft(false);
            return;
        }
        MontageLibraryModule.state.formOpen = true;
        MontageLibraryModule.state.editingId = null;
        MontageLibraryModule.state.draftCardCode = MontageLibraryModule.getNextCardCode();
        UI.renderCurrentPage();
    },

    resetDraft: (keepOpen = false) => {
        MontageLibraryModule.state.editingId = null;
        MontageLibraryModule.state.draftCardCode = keepOpen ? MontageLibraryModule.getNextCardCode() : '';
        MontageLibraryModule.state.draftProductName = '';
        MontageLibraryModule.state.draftProductCode = '';
        MontageLibraryModule.state.draftTechDrawing = null;
        MontageLibraryModule.state.draftExplodedDrawing = null;
        MontageLibraryModule.state.draftComponentIds = [];
        MontageLibraryModule.state.draftComponentInput = '';
        MontageLibraryModule.state.draftNote = '';
        MontageLibraryModule.state.formOpen = !!keepOpen;
        UI.renderCurrentPage();
    },

    selectRow: (rowId) => {
        MontageLibraryModule.state.selectedId = rowId;
        UI.renderCurrentPage();
    },

    startEdit: (rowId) => {
        MontageLibraryModule.ensureData();
        const row = (DB.data.data.montageCards || []).find(x => x.id === rowId);
        if (!row) return;
        MontageLibraryModule.state.formOpen = true;
        MontageLibraryModule.state.editingId = row.id;
        MontageLibraryModule.state.selectedId = row.id;
        MontageLibraryModule.state.draftCardCode = row.cardCode || MontageLibraryModule.getNextCardCode();
        MontageLibraryModule.state.draftProductName = row.productName || '';
        MontageLibraryModule.state.draftProductCode = row.productCode || '';
        MontageLibraryModule.state.draftTechDrawing = row.techDrawing ? { ...row.techDrawing } : null;
        MontageLibraryModule.state.draftExplodedDrawing = row.explodedDrawing ? { ...row.explodedDrawing } : null;
        MontageLibraryModule.state.draftComponentIds = Array.isArray(row.componentIds) ? [...row.componentIds] : [];
        MontageLibraryModule.state.draftComponentInput = '';
        MontageLibraryModule.state.draftNote = row.note || '';
        UI.renderCurrentPage();
    },

    addComponent: () => {
        const val = String(MontageLibraryModule.state.draftComponentInput || '').trim().toUpperCase();
        if (!val) return;
        MontageLibraryModule.state.draftComponentIds.push(val);
        MontageLibraryModule.state.draftComponentInput = '';
        UI.renderCurrentPage();
    },

    removeComponent: (idx) => {
        const i = Number(idx);
        if (!Number.isInteger(i) || i < 0) return;
        MontageLibraryModule.state.draftComponentIds.splice(i, 1);
        UI.renderCurrentPage();
    },

    readAsDataUrl: (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('file_read_failed'));
        reader.readAsDataURL(file);
    }),

    handleDraftFile: async (kind, inputEl) => {
        const file = inputEl?.files?.[0];
        if (!file) return;
        const filename = String(file.name || '').toLowerCase();
        const mime = String(file.type || '').toLowerCase();
        const isPdf = filename.endsWith('.pdf') || mime.includes('pdf');
        const isJpg = filename.endsWith('.jpg') || filename.endsWith('.jpeg') || mime.includes('jpeg') || mime.includes('jpg');
        if (!isPdf && !isJpg) {
            alert('Sadece PDF veya JPG dosyasi yuklenebilir.');
            inputEl.value = '';
            return;
        }
        const maxBytes = 25 * 1024 * 1024;
        if (Number(file.size || 0) > maxBytes) {
            alert('Dosya boyutu 25MB ustu olamaz.');
            inputEl.value = '';
            return;
        }

        const payload = {
            name: file.name,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            size: Number(file.size || 0),
            dataUrl: await MontageLibraryModule.readAsDataUrl(file),
            uploadedAt: new Date().toISOString()
        };
        if (kind === 'tech') MontageLibraryModule.state.draftTechDrawing = payload;
        else MontageLibraryModule.state.draftExplodedDrawing = payload;
        UI.renderCurrentPage();
    },

    clearDraftFile: (kind) => {
        if (kind === 'tech') MontageLibraryModule.state.draftTechDrawing = null;
        else MontageLibraryModule.state.draftExplodedDrawing = null;
        UI.renderCurrentPage();
    },

    previewDraftFile: (kind) => {
        const file = kind === 'tech'
            ? MontageLibraryModule.state.draftTechDrawing
            : MontageLibraryModule.state.draftExplodedDrawing;
        if (!file?.dataUrl) return;
        window.open(file.dataUrl, '_blank', 'noopener,noreferrer');
    },

    save: async (unitId) => {
        MontageLibraryModule.ensureData();
        const name = String(MontageLibraryModule.state.draftProductName || '').trim();
        const productCode = String(MontageLibraryModule.state.draftProductCode || '').trim().toUpperCase();
        const cardCode = String(MontageLibraryModule.state.draftCardCode || MontageLibraryModule.getNextCardCode()).trim().toUpperCase();
        const note = String(MontageLibraryModule.state.draftNote || '').trim();
        const componentIds = Array.isArray(MontageLibraryModule.state.draftComponentIds)
            ? MontageLibraryModule.state.draftComponentIds.map(x => String(x || '').trim().toUpperCase()).filter(Boolean)
            : [];

        if (!name) return alert('Urun ismi zorunlu.');
        if (!productCode) return alert('Urun kodu zorunlu.');

        const editId = MontageLibraryModule.state.editingId;
        const cardCodeExclude = editId ? { collection: 'montageCards', id: editId, field: 'cardCode' } : null;
        const productCodeExclude = editId ? { collection: 'montageCards', id: editId, field: 'productCode' } : null;
        if (UnitModule.isGlobalCodeTaken(cardCode, cardCodeExclude)) {
            return alert('Bu kart ID zaten kullaniliyor.');
        }
        if (UnitModule.isGlobalCodeTaken(productCode, productCodeExclude)) {
            return alert('Bu urun kodu zaten kullaniliyor.');
        }

        const now = new Date().toISOString();
        const list = DB.data.data.montageCards || [];
        const idx = editId ? list.findIndex(x => x.id === editId) : -1;

        if (idx >= 0) {
            list[idx] = {
                ...list[idx],
                productName: name,
                productCode,
                cardCode,
                componentIds,
                techDrawing: MontageLibraryModule.state.draftTechDrawing ? { ...MontageLibraryModule.state.draftTechDrawing } : null,
                explodedDrawing: MontageLibraryModule.state.draftExplodedDrawing ? { ...MontageLibraryModule.state.draftExplodedDrawing } : null,
                note,
                updated_at: now
            };
            MontageLibraryModule.state.selectedId = list[idx].id;
        } else {
            const rowId = crypto.randomUUID();
            list.push({
                id: rowId,
                unitId,
                productName: name,
                productCode,
                cardCode,
                componentIds,
                techDrawing: MontageLibraryModule.state.draftTechDrawing ? { ...MontageLibraryModule.state.draftTechDrawing } : null,
                explodedDrawing: MontageLibraryModule.state.draftExplodedDrawing ? { ...MontageLibraryModule.state.draftExplodedDrawing } : null,
                note,
                created_at: now,
                updated_at: now
            });
            MontageLibraryModule.state.selectedId = rowId;
        }

        DB.data.data.montageCards = list;
        await DB.save();
        MontageLibraryModule.resetDraft(false);
    },

    delete: async (rowId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        if (!confirm('Bu kart tamamen silinsin mi?')) return;
        DB.data.data.montageCards = (DB.data.data.montageCards || []).filter(x => x.id !== rowId);
        if (MontageLibraryModule.state.selectedId === rowId) MontageLibraryModule.state.selectedId = null;
        if (MontageLibraryModule.state.editingId === rowId) MontageLibraryModule.resetDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },

    openFile: (rowId, kind, isDownload = false) => {
        const row = (DB.data.data.montageCards || []).find(x => x.id === rowId);
        if (!row) return;
        const file = kind === 'tech' ? row.techDrawing : row.explodedDrawing;
        if (!file?.dataUrl) return;
        if (!isDownload) {
            window.open(file.dataUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        const a = document.createElement('a');
        a.href = file.dataUrl;
        a.download = file.name || (kind === 'tech' ? 'montaj-teknik-resim' : 'patlatilmis-teknik-resim');
        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    renderFilePreview: (rowId, kind, file) => {
        const title = kind === 'tech' ? 'Montaj teknik resim' : 'Patlatilmis teknik resim';
        if (!file?.dataUrl) {
            return `
                <div style="border:1px solid #e2e8f0; border-radius:0.7rem; padding:0.6rem;">
                    <div style="font-size:0.8rem; font-weight:700; color:#334155; margin-bottom:0.35rem;">${title}</div>
                    <div style="font-size:0.78rem; color:#94a3b8;">Dosya yok.</div>
                </div>
            `;
        }
        const isPdf = String(file.mimeType || '').toLowerCase().includes('pdf') || String(file.name || '').toLowerCase().endsWith('.pdf');
        return `
            <div style="border:1px solid #e2e8f0; border-radius:0.7rem; padding:0.6rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.35rem;">
                    <div style="font-size:0.8rem; font-weight:700; color:#334155;">${title}</div>
                    <div style="display:flex; gap:0.35rem;">
                        <button onclick="MontageLibraryModule.openFile('${rowId}', '${kind}', false)" class="btn-sm">yeni sekmede gor</button>
                        <button onclick="MontageLibraryModule.openFile('${rowId}', '${kind}', true)" class="btn-sm">indir</button>
                    </div>
                </div>
                <div style="font-size:0.76rem; color:#64748b; margin-bottom:0.4rem;">${UnitModule.escapeHtml(file.name || 'dosya')}</div>
                ${isPdf
                ? `<iframe src="${file.dataUrl}" title="${title}" style="width:100%; height:300px; border:1px solid #cbd5e1; border-radius:0.45rem;"></iframe>`
                : `<div style="text-align:center; border:1px solid #cbd5e1; border-radius:0.45rem; padding:0.4rem; background:#f8fafc;"><img src="${file.dataUrl}" alt="${title}" style="max-width:100%; max-height:300px; object-fit:contain;"></div>`
            }
            </div>
        `;
    },

    escapeJsString: (value) => {
        return String(value ?? '')
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");
    },

    resolveComponentRef: (rawId) => {
        const needle = String(rawId || '').trim().toUpperCase();
        if (!needle) return [];
        const d = DB.data?.data || {};
        const results = [];

        const normalize = (v) => String(v || '').trim().toUpperCase();
        const eqAny = (row, fields) => fields.some((k) => normalize(row?.[k]) === needle) || normalize(row?.id) === needle;

        const push = (source, title, row, pairs) => {
            results.push({
                source,
                title,
                id: String(row?.id || '-'),
                rows: pairs.map((x) => ({ label: x.label, value: x.value }))
            });
        };

        (d.products || []).forEach((row) => {
            if (!eqAny(row, ['code'])) return;
            push('products', 'Master urun', row, [
                { label: 'Urun adi', value: row?.name || '-' },
                { label: 'Urun kodu', value: row?.code || '-' },
                { label: 'Kategori', value: row?.categoryId || '-' },
                { label: 'Birim', value: row?.unit || '-' }
            ]);
        });

        (d.cncCards || []).forEach((row) => {
            if (!eqAny(row, ['cncId'])) return;
            push('cncCards', 'CNC karti', row, [
                { label: 'Urun adi', value: row?.productName || '-' },
                { label: 'Kart kodu', value: row?.cncId || '-' },
                { label: 'Bagli urun', value: row?.linkedProductRef || '-' },
                { label: 'Operasyon', value: Array.isArray(row?.operations) ? row.operations.length : 0 }
            ]);
        });

        (d.sawCutOrders || []).forEach((row) => {
            if (!eqAny(row, ['code'])) return;
            push('sawCutOrders', 'Testere islemi', row, [
                { label: 'Islem adi', value: row?.processName || '-' },
                { label: 'Islem kodu', value: row?.code || '-' },
                { label: 'Olcu (mm)', value: row?.lengthMm ?? row?.cutLengthMm ?? '-' },
                { label: 'Pah', value: row?.hasChamfer ? 'VAR' : 'YOK' }
            ]);
        });

        (d.extruderLibraryCards || []).forEach((row) => {
            if (!eqAny(row, ['cardCode'])) return;
            push('extruderLibraryCards', 'Ekstruder karti', row, [
                { label: 'Urun adi', value: row?.productName || '-' },
                { label: 'Kart kodu', value: row?.cardCode || '-' },
                { label: 'Tip', value: row?.kind || '-' },
                { label: 'Cap', value: row?.diameterMm ?? '-' },
                { label: 'Boy', value: row?.lengthMm ?? '-' },
                { label: 'Renk', value: row?.color || '-' }
            ]);
        });

        (d.plexiPolishCards || []).forEach((row) => {
            if (!eqAny(row, ['cardCode'])) return;
            push('plexiPolishCards', 'Pleksi polisaj karti', row, [
                { label: 'Urun', value: row?.productName || '-' },
                { label: 'Kart kodu', value: row?.cardCode || '-' },
                { label: 'Sure (dk)', value: row?.ovenMinutes ?? '-' }
            ]);
        });

        (d.pvdCards || []).forEach((row) => {
            if (!eqAny(row, ['cardCode'])) return;
            push('pvdCards', 'PVD karti', row, [
                { label: 'Urun', value: row?.productName || '-' },
                { label: 'Kart kodu', value: row?.cardCode || '-' },
                { label: 'Renk', value: row?.color || '-' }
            ]);
        });

        (d.eloksalCards || []).forEach((row) => {
            if (!eqAny(row, ['cardCode'])) return;
            push('eloksalCards', 'Eloksal karti', row, [
                { label: 'Urun', value: row?.productName || '-' },
                { label: 'Kart kodu', value: row?.cardCode || '-' },
                { label: 'Islem tipi', value: row?.processType || '-' },
                { label: 'Renk', value: row?.color || '-' }
            ]);
        });

        (d.ibrahimPolishCards || []).forEach((row) => {
            if (!eqAny(row, ['cardCode'])) return;
            push('ibrahimPolishCards', 'Ibrahim polisaj karti', row, [
                { label: 'Urun', value: row?.productName || '-' },
                { label: 'Kart kodu', value: row?.cardCode || '-' },
                { label: 'Yuzey', value: row?.surface || '-' }
            ]);
        });

        (d.montageCards || []).forEach((row) => {
            if (!eqAny(row, ['cardCode', 'productCode'])) return;
            push('montageCards', 'Montaj karti', row, [
                { label: 'Urun', value: row?.productName || '-' },
                { label: 'Urun kodu', value: row?.productCode || '-' },
                { label: 'Kart kodu', value: row?.cardCode || '-' },
                { label: 'Bilesen sayisi', value: Array.isArray(row?.componentIds) ? row.componentIds.length : 0 }
            ]);
        });

        return results;
    },

    previewComponentRef: (componentId) => {
        const idText = String(componentId || '').trim().toUpperCase();
        if (!idText) return;
        const matches = MontageLibraryModule.resolveComponentRef(idText);
        const body = matches.length === 0
            ? `<div style="font-size:0.88rem; color:#64748b; padding:0.6rem;">Bu ID icin kayit bulunamadi: <strong>${UnitModule.escapeHtml(idText)}</strong></div>`
            : matches.map((entry) => `
                <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem; margin-bottom:0.55rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.35rem;">
                        <div style="font-size:0.88rem; font-weight:700; color:#0f172a;">${UnitModule.escapeHtml(entry.title)}</div>
                        <div style="font-family:monospace; font-size:0.78rem; color:#1d4ed8;">id: ${UnitModule.escapeHtml(entry.id)}</div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:0.35rem;">
                        ${entry.rows.map((row) => `
                            <div style="border:1px solid #f1f5f9; border-radius:0.5rem; padding:0.35rem 0.45rem;">
                                <div style="font-size:0.7rem; color:#64748b;">${UnitModule.escapeHtml(row.label)}</div>
                                <div style="font-size:0.82rem; color:#334155; font-weight:700; word-break:break-word;">${UnitModule.escapeHtml(row.value)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

        Modal.open(`Bilesen ID detay - ${UnitModule.escapeHtml(idText)}`, `<div>${body}</div>`, { maxWidth: '760px' });
    },

    previewRow: (rowId) => {
        const row = (DB.data.data.montageCards || []).find(x => x.id === rowId);
        if (!row) return;
        const ids = Array.isArray(row.componentIds) ? row.componentIds : [];
        Modal.open(`Montaj karti - ${UnitModule.escapeHtml(row.productName || '')}`, `
            <div style="display:flex; flex-direction:column; gap:0.7rem;">
                <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.6rem;">
                    <div style="grid-column:span 5; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Urun</div>
                        <div style="font-weight:700; color:#0f172a;">${UnitModule.escapeHtml(row.productName || '-')}</div>
                    </div>
                    <div style="grid-column:span 3; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Urun kodu</div>
                        <div style="font-family:monospace; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productCode || '-')}</div>
                    </div>
                    <div style="grid-column:span 4; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Kart ID</div>
                        <div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${UnitModule.escapeHtml(row.cardCode || '-')}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#334155; margin-bottom:0.35rem;">Bilesen ID listesi</div>
                    ${ids.length === 0
                ? `<div style="font-size:0.78rem; color:#94a3b8;">Bilesen yok.</div>`
                : `<div style="display:flex; flex-wrap:wrap; gap:0.35rem;">${ids.map(idText => `<button onclick="MontageLibraryModule.previewComponentRef('${MontageLibraryModule.escapeJsString(idText)}')" style="display:inline-flex; font-family:monospace; border:1px solid #93c5fd; background:#eff6ff; border-radius:999px; padding:0.2rem 0.55rem; font-size:0.78rem; color:#1d4ed8; cursor:pointer;">${UnitModule.escapeHtml(idText)}</button>`).join('')}</div>`
            }
                </div>
                ${MontageLibraryModule.renderFilePreview(row.id, 'tech', row.techDrawing)}
                ${MontageLibraryModule.renderFilePreview(row.id, 'exploded', row.explodedDrawing)}
                <div style="border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.5rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#334155; margin-bottom:0.35rem;">Notlar</div>
                    <div style="font-size:0.82rem; color:#334155; white-space:pre-wrap; min-height:48px;">${UnitModule.escapeHtml(row.note || '-')}</div>
                </div>
            </div>
        `, { maxWidth: '920px' });
    },

    render: (container, unitId) => {
        MontageLibraryModule.ensureData();
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        const cards = (DB.data.data.montageCards || [])
            .filter(row => row.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));

        const qName = String(MontageLibraryModule.state.searchName || '').trim().toLowerCase();
        const qCode = String(MontageLibraryModule.state.searchCode || '').trim().toLowerCase();
        const qId = String(MontageLibraryModule.state.searchId || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const nameOk = !qName || String(row.productName || '').toLowerCase().includes(qName);
            const codeOk = !qCode || String(row.productCode || '').toLowerCase().includes(qCode);
            const idOk = !qId || String(row.cardCode || row.id || '').toLowerCase().includes(qId);
            return nameOk && codeOk && idOk;
        });

        const showForm = MontageLibraryModule.state.formOpen || !!MontageLibraryModule.state.editingId;
        const activeCode = MontageLibraryModule.state.draftCardCode || MontageLibraryModule.getNextCardCode();
        const canDelete = UnitModule.isSuperAdmin();

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                        <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.45rem;">
                                <i data-lucide="library" color="#1d4ed8"></i> Montaj urun kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${UnitModule.escapeHtml(unit?.name || 'MONTAJ')}</div>
                        </div>
                    </div>
                    <button onclick="MontageLibraryModule.toggleForm()" class="btn-primary" style="padding:0.55rem 1.2rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.65rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="montage_search_name" value="${UnitModule.escapeHtml(MontageLibraryModule.state.searchName || '')}" oninput="MontageLibraryModule.setSearch('name', this.value, 'montage_search_name')" placeholder="isim ile ara" style="height:38px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.75rem; min-width:220px; font-weight:600;">
                        <input id="montage_search_code" value="${UnitModule.escapeHtml(MontageLibraryModule.state.searchCode || '')}" oninput="MontageLibraryModule.setSearch('code', this.value, 'montage_search_code')" placeholder="kod ile ara" style="height:38px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.75rem; min-width:220px; font-weight:600;">
                        <input id="montage_search_id" value="${UnitModule.escapeHtml(MontageLibraryModule.state.searchId || '')}" oninput="MontageLibraryModule.setSearch('id', this.value, 'montage_search_id')" placeholder="ID ile ara" style="height:38px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0 0.75rem; min-width:220px; font-weight:600;">
                    </div>
                    <div class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:left;">Urun kodu</th>
                                    <th style="padding:0.65rem; text-align:left;">ID kodu</th>
                                    <th style="padding:0.65rem; text-align:center;">Goruntule</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                    <th style="padding:0.65rem; text-align:right;">Sil</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="7" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${MontageLibraryModule.state.selectedId === row.id ? 'background:#ffe4e6;' : ''}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#475569;">${UnitModule.escapeHtml(row.productCode || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#1d4ed8; font-weight:700;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center;"><button onclick="MontageLibraryModule.previewRow('${row.id}')" class="btn-sm" style="border-color:#93c5fd; background:#dbeafe; color:#1d4ed8;">goruntule</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="MontageLibraryModule.startEdit('${row.id}')" class="btn-sm">duzenle</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="MontageLibraryModule.selectRow('${row.id}')" class="btn-sm" style="${MontageLibraryModule.state.selectedId === row.id ? 'background:#0f172a; color:white; border-color:#0f172a;' : ''}">sec</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="MontageLibraryModule.delete('${row.id}')" class="btn-sm" ${canDelete ? '' : 'disabled'} style="${canDelete ? 'color:#b91c1c; border-color:#fecaca; background:#fef2f2;' : 'opacity:0.45; cursor:not-allowed;'}">sil</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${MontageLibraryModule.state.editingId ? 'Kart duzenle' : 'Yeni kart olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                <button onclick="MontageLibraryModule.resetDraft(false)" class="btn-sm">Vazgec</button>
                                <button onclick="MontageLibraryModule.save('${unitId}')" class="btn-primary" style="padding:0.32rem 0.65rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.65rem;">
                            <div style="grid-column:span 4;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun ismi *</label>
                                <input value="${UnitModule.escapeHtml(MontageLibraryModule.state.draftProductName || '')}" oninput="MontageLibraryModule.state.draftProductName=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun kodu *</label>
                                <input value="${UnitModule.escapeHtml(MontageLibraryModule.state.draftProductCode || '')}" oninput="MontageLibraryModule.state.draftProductCode=this.value.toUpperCase()" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-family:monospace;">
                            </div>
                            <div style="grid-column:span 2;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input disabled value="${UnitModule.escapeHtml(activeCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.65rem; margin-top:0.75rem;">
                            <div style="grid-column:span 6; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.65rem;">
                                <div style="font-size:0.8rem; color:#334155; font-weight:700; margin-bottom:0.35rem;">montaj teknik resim (pdf/jpg)</div>
                                <input type="file" accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg" onchange="MontageLibraryModule.handleDraftFile('tech', this)" style="display:block; width:100%; margin-bottom:0.4rem;">
                                ${MontageLibraryModule.state.draftTechDrawing
                ? `<div style="font-size:0.78rem; color:#475569; margin-bottom:0.35rem;">${UnitModule.escapeHtml(MontageLibraryModule.state.draftTechDrawing.name || 'dosya')}</div>
                                    <button onclick="MontageLibraryModule.previewDraftFile('tech')" class="btn-sm">goruntule</button>
                                    <button onclick="MontageLibraryModule.clearDraftFile('tech')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">kaldir</button>`
                : `<div style="font-size:0.78rem; color:#94a3b8;">dosya secilmedi.</div>`
            }
                            </div>
                            <div style="grid-column:span 6; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.65rem;">
                                <div style="font-size:0.8rem; color:#334155; font-weight:700; margin-bottom:0.35rem;">patlatilmis teknik resim (pdf/jpg)</div>
                                <input type="file" accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg" onchange="MontageLibraryModule.handleDraftFile('exploded', this)" style="display:block; width:100%; margin-bottom:0.4rem;">
                                ${MontageLibraryModule.state.draftExplodedDrawing
                ? `<div style="font-size:0.78rem; color:#475569; margin-bottom:0.35rem;">${UnitModule.escapeHtml(MontageLibraryModule.state.draftExplodedDrawing.name || 'dosya')}</div>
                                    <button onclick="MontageLibraryModule.previewDraftFile('exploded')" class="btn-sm">goruntule</button>
                                    <button onclick="MontageLibraryModule.clearDraftFile('exploded')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">kaldir</button>`
                : `<div style="font-size:0.78rem; color:#94a3b8;">dosya secilmedi.</div>`
            }
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.65rem; margin-top:0.75rem;">
                            <div style="grid-column:span 6; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.65rem;">
                                <div style="font-size:0.8rem; color:#334155; font-weight:700; margin-bottom:0.35rem;">bilesen ID listesi</div>
                                <div style="display:flex; gap:0.45rem; margin-bottom:0.45rem;">
                                    <input value="${UnitModule.escapeHtml(MontageLibraryModule.state.draftComponentInput || '')}" oninput="MontageLibraryModule.state.draftComponentInput=this.value.toUpperCase()" placeholder="bilesen ID" style="flex:1; height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.6rem; font-family:monospace;">
                                    <button onclick="MontageLibraryModule.addComponent()" class="btn-primary" style="padding:0 0.7rem;">bilesen ekle +</button>
                                </div>
                                <div style="min-height:90px; border:1px dashed #cbd5e1; border-radius:0.55rem; padding:0.45rem; background:#f8fafc;">
                                    ${MontageLibraryModule.state.draftComponentIds.length === 0
                ? `<div style="font-size:0.78rem; color:#94a3b8;">Henuz bilesen eklenmedi.</div>`
                : MontageLibraryModule.state.draftComponentIds.map((idText, idx) => `
                                            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; border:1px solid #e2e8f0; background:white; border-radius:0.45rem; padding:0.3rem 0.45rem; margin-bottom:0.35rem;">
                                                <span style="font-family:monospace; font-size:0.82rem; color:#334155;">${UnitModule.escapeHtml(idText)}</span>
                                                <button onclick="MontageLibraryModule.removeComponent(${idx})" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">sil</button>
                                            </div>
                                        `).join('')
            }
                                </div>
                            </div>
                            <div style="grid-column:span 6; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.65rem;">
                                <div style="font-size:0.8rem; color:#334155; font-weight:700; margin-bottom:0.35rem;">notlar</div>
                                <textarea oninput="MontageLibraryModule.state.draftNote=this.value" style="width:100%; min-height:130px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem; resize:vertical;">${UnitModule.escapeHtml(MontageLibraryModule.state.draftNote || '')}</textarea>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
};
