const ReadOnlyViewer = {
    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),

    escapeJsString: (value) => String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n'),

    normalizeCode: (value) => String(value || '').trim().toUpperCase(),

    getGlobalModule: (name) => {
        const key = String(name || '').trim();
        if (!key) return null;
        const mod = globalThis?.[key];
        return mod && (typeof mod === 'object' || typeof mod === 'function') ? mod : null;
    },

    getData: () => {
        const root = DB?.data?.data;
        return root && typeof root === 'object' ? root : {};
    },

    getUnitName: (unitId) => {
        const id = String(unitId || '').trim();
        if (!id) return '-';
        const units = Array.isArray(DB?.data?.data?.units) ? DB.data.data.units : [];
        const row = units.find((item) => String(item?.id || '') === id);
        return String(row?.name || id);
    },

    getRouteProcessName: (route) => {
        const productModule = ReadOnlyViewer.getGlobalModule('ProductLibraryModule');
        if (productModule && typeof productModule.getRouteProcessName === 'function') {
            return String(productModule.getRouteProcessName(route) || '');
        }
        return '';
    },

    openFile: (dataUrl) => {
        const url = String(dataUrl || '').trim();
        if (!url) return alert('Goruntulenecek dosya bulunamadi.');
        const win = window.open(url, '_blank');
        if (!win) alert('Tarayici popup engelliyor olabilir.');
    },

    downloadFile: (dataUrl, fileName = 'dosya') => {
        const url = String(dataUrl || '').trim();
        if (!url) return alert('Indirilecek dosya bulunamadi.');
        const a = document.createElement('a');
        a.href = url;
        a.download = String(fileName || 'dosya');
        document.body.appendChild(a);
        a.click();
        a.remove();
    },

    getPreviewHtml: (file) => {
        if (!file?.data) return '<div style="padding:0.9rem; color:#94a3b8;">Onizleme yok.</div>';
        const type = String(file.type || '').toLowerCase();
        const data = String(file.data || '');
        const isPdf = type.includes('pdf') || data.startsWith('data:application/pdf');
        const isImage = type.startsWith('image/') || data.startsWith('data:image/');
        if (isPdf) return `<iframe src="${data}" style="width:100%; min-height:340px; border:none; border-radius:0.6rem; background:white;"></iframe>`;
        if (isImage) return `<div style="display:flex; justify-content:center; align-items:center; min-height:340px; background:white; border-radius:0.6rem;"><img src="${data}" alt="${ReadOnlyViewer.escapeHtml(file.name || 'dosya')}" style="max-width:100%; max-height:340px; object-fit:contain;"></div>`;
        return '<div style="padding:0.9rem; color:#94a3b8;">Bu dosya tipi icin onizleme yok. Yeni sekmede acabilirsiniz.</div>';
    },

    renderFilesCard: (files) => {
        const safeFiles = Array.isArray(files) ? files.filter((f) => f && typeof f === 'object' && String(f.data || '').trim()) : [];
        if (safeFiles.length === 0) return '<div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.8rem; color:#94a3b8;">Dosya bulunamadi.</div>';
        const first = safeFiles[0];
        return `
            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; margin-bottom:0.5rem; flex-wrap:wrap;">
                    <div style="font-size:0.84rem; color:#64748b;">Dosyalar (${safeFiles.length})</div>
                    <div style="font-size:0.8rem; color:#334155; font-weight:700;">Onizleme: ${ReadOnlyViewer.escapeHtml(first.name || 'dosya')}</div>
                </div>
                <div style="display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.15fr); gap:0.7rem;">
                    <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:360px; overflow:auto;">
                        ${safeFiles.map((file) => `
                            <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.45rem 0.55rem; background:#f8fafc;">
                                <div style="font-size:0.82rem; color:#334155; margin-bottom:0.35rem;">${ReadOnlyViewer.escapeHtml(file.name || 'dosya')}</div>
                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                                    <button class="btn-sm" onclick="ReadOnlyViewer.openFile('${ReadOnlyViewer.escapeJsString(file.data || '')}')">yeni sekmede goruntule</button>
                                    <button class="btn-sm" onclick="ReadOnlyViewer.downloadFile('${ReadOnlyViewer.escapeJsString(file.data || '')}','${ReadOnlyViewer.escapeJsString(file.name || 'dosya')}')">indir</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.45rem; background:#f8fafc;">
                        ${ReadOnlyViewer.getPreviewHtml(first)}
                    </div>
                </div>
            </div>
        `;
    },

    renderRouteCard: (routes) => {
        const list = Array.isArray(routes) ? routes : [];
        if (list.length === 0) return '<div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.8rem; color:#94a3b8;">Rota bulunamadi.</div>';
        return `
            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                <div style="font-size:0.85rem; color:#64748b; margin-bottom:0.4rem;">Rota adimlari</div>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                            <th style="padding:0.42rem; text-align:left;">Sira</th>
                            <th style="padding:0.42rem; text-align:left;">Istasyon</th>
                            <th style="padding:0.42rem; text-align:left;">Islem ID</th>
                            <th style="padding:0.42rem; text-align:left;">Islem adi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map((route, idx) => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:0.42rem;">${idx + 1}</td>
                                <td style="padding:0.42rem;">${ReadOnlyViewer.escapeHtml(ReadOnlyViewer.getUnitName(route.stationId))}</td>
                                <td style="padding:0.42rem; font-family:monospace;">${ReadOnlyViewer.escapeHtml(route.processId || '-')}</td>
                                <td style="padding:0.42rem;">${ReadOnlyViewer.escapeHtml(ReadOnlyViewer.getRouteProcessName(route) || '-')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    openComponentModal: (row, libraryTitle = 'Parca / Bilesen') => {
        const files = Array.isArray(row?.attachments) ? row.attachments : [];
        const routes = Array.isArray(row?.routes) ? row.routes : [];
        const html = `
            <div style="display:grid; gap:0.7rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                    <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                        <div><div style="font-size:0.72rem; color:#64748b;">Kutuphane</div><div style="font-weight:700;">${ReadOnlyViewer.escapeHtml(libraryTitle)}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">ID kod</div><div style="font-weight:700; font-family:monospace; color:#1d4ed8;">${ReadOnlyViewer.escapeHtml(row?.code || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Urun adi</div><div style="font-weight:700;">${ReadOnlyViewer.escapeHtml(row?.name || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Kategori</div><div style="font-weight:700;">${ReadOnlyViewer.escapeHtml(row?.group || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Renk</div><div style="font-weight:700;">${ReadOnlyViewer.escapeHtml(row?.subGroup || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Master kod</div><div style="font-weight:700; font-family:monospace;">${ReadOnlyViewer.escapeHtml(row?.masterCode || '-')}</div></div>
                    </div>
                    <div style="margin-top:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Not</div><div style="color:#334155;">${ReadOnlyViewer.escapeHtml(row?.note || '-')}</div></div>
                </div>
                ${ReadOnlyViewer.renderRouteCard(routes)}
                ${ReadOnlyViewer.renderFilesCard(files)}
            </div>
        `;
        Modal.open(`ID Detay - ${ReadOnlyViewer.escapeHtml(row?.code || '-')}`, html, { maxWidth: '980px' });
    },

    openModelModal: (row) => {
        const files = [
            ...(Array.isArray(row?.productFiles) ? row.productFiles : []),
            ...(Array.isArray(row?.explodedFiles) ? row.explodedFiles : [])
        ];
        const html = `
            <div style="display:grid; gap:0.7rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                    <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                        <div><div style="font-size:0.72rem; color:#64748b;">Varyant ID</div><div style="font-weight:700; font-family:monospace; color:#1d4ed8;">${ReadOnlyViewer.escapeHtml(row?.variantCode || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Urun grubu</div><div style="font-weight:700;">${ReadOnlyViewer.escapeHtml(row?.productGroup || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Urun adi</div><div style="font-weight:700;">${ReadOnlyViewer.escapeHtml(row?.productName || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Montaj karti</div><div style="font-weight:700; font-family:monospace;">${ReadOnlyViewer.escapeHtml(row?.montageCard?.cardCode || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Aile kodu</div><div style="font-weight:700; font-family:monospace;">${ReadOnlyViewer.escapeHtml(row?.familyCode || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Montaj urun kodu</div><div style="font-weight:700; font-family:monospace;">${ReadOnlyViewer.escapeHtml(row?.montageCard?.productCode || '-')}</div></div>
                    </div>
                    <div style="margin-top:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Not</div><div style="color:#334155;">${ReadOnlyViewer.escapeHtml(row?.note || '-')}</div></div>
                </div>
                ${ReadOnlyViewer.renderFilesCard(files)}
            </div>
        `;
        Modal.open(`ID Detay - ${ReadOnlyViewer.escapeHtml(row?.variantCode || '-')}`, html, { maxWidth: '980px' });
    },

    openMasterModal: (row) => {
        const attachment = row?.attachment?.data ? [row.attachment] : [];
        const html = `
            <div style="display:grid; gap:0.7rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                    <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                        <div><div style="font-size:0.72rem; color:#64748b;">Master ID</div><div style="font-weight:700; font-family:monospace; color:#1d4ed8;">${ReadOnlyViewer.escapeHtml(row?.code || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Kategori</div><div style="font-weight:700;">${ReadOnlyViewer.escapeHtml(row?.category || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Urun adi</div><div style="font-weight:700;">${ReadOnlyViewer.escapeHtml(row?.name || '-')}</div></div>
                        <div><div style="font-size:0.72rem; color:#64748b;">Birim</div><div style="font-weight:700;">${ReadOnlyViewer.escapeHtml(row?.specs?.unit || '-')}</div></div>
                    </div>
                    <div style="margin-top:0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Not</div><div style="color:#334155;">${ReadOnlyViewer.escapeHtml(row?.specs?.note || row?.note || '-')}</div></div>
                </div>
                ${ReadOnlyViewer.renderFilesCard(attachment)}
            </div>
        `;
        Modal.open(`ID Detay - ${ReadOnlyViewer.escapeHtml(row?.code || '-')}`, html, { maxWidth: '920px' });
    },

    openByCode: (rawCode) => {
        const code = ReadOnlyViewer.normalizeCode(rawCode);
        if (!code) return alert('ID kod bos olamaz.');
        const d = ReadOnlyViewer.getData();
        const unitModule = ReadOnlyViewer.getGlobalModule('UnitModule');
        const cncModule = ReadOnlyViewer.getGlobalModule('CncLibraryModule');
        const montageModule = ReadOnlyViewer.getGlobalModule('MontageLibraryModule');

        const part = (Array.isArray(d.partComponentCards) ? d.partComponentCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.code) === code);
        if (part) return ReadOnlyViewer.openComponentModal(part, 'Parca & Bilesen');

        const semi = (Array.isArray(d.semiFinishedCards) ? d.semiFinishedCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.code) === code);
        if (semi) return ReadOnlyViewer.openComponentModal(semi, 'Yari Mamul Kutuphanesi');

        const variant = (Array.isArray(d.catalogProductVariants) ? d.catalogProductVariants : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.variantCode) === code);
        if (variant) return ReadOnlyViewer.openModelModal(variant);

        const master = (Array.isArray(d.products) ? d.products : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.code) === code && String(row?.type || '').toUpperCase() === 'MASTER');
        if (master) return ReadOnlyViewer.openMasterModal(master);

        const cnc = (Array.isArray(d.cncCards) ? d.cncCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cncId) === code);
        if (cnc && cncModule && typeof cncModule.viewCardOperations === 'function') return cncModule.viewCardOperations(cnc.id);

        const depoTask = (Array.isArray(d.depoTransferTasks) ? d.depoTransferTasks : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.taskCode) === code);
        if (depoTask && unitModule && typeof unitModule.previewDepoTask === 'function') return unitModule.previewDepoTask(depoTask.id);

        const saw = (Array.isArray(d.sawCutOrders) ? d.sawCutOrders : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.code) === code);
        if (saw && unitModule && typeof unitModule.previewSawRow === 'function') return unitModule.previewSawRow(saw.id);

        const ext = (Array.isArray(d.extruderLibraryCards) ? d.extruderLibraryCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (ext && unitModule && typeof unitModule.previewExtruderRow === 'function') return unitModule.previewExtruderRow(ext.id);

        const pvd = (Array.isArray(d.pvdCards) ? d.pvdCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (pvd && unitModule && typeof unitModule.previewPvdRow === 'function') return unitModule.previewPvdRow(pvd.id);

        const elx = (Array.isArray(d.eloksalCards) ? d.eloksalCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (elx && unitModule && typeof unitModule.previewEloksalRow === 'function') return unitModule.previewEloksalRow(elx.id);

        const ips = (Array.isArray(d.ibrahimPolishCards) ? d.ibrahimPolishCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (ips && unitModule && typeof unitModule.previewPolishRow === 'function') return unitModule.previewPolishRow(ips.id);

        const plx = (Array.isArray(d.plexiPolishCards) ? d.plexiPolishCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (plx && unitModule && typeof unitModule.previewPlexiRow === 'function') return unitModule.previewPlexiRow(plx.id);

        const montage = (Array.isArray(d.montageCards) ? d.montageCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code || ReadOnlyViewer.normalizeCode(row?.productCode) === code);
        if (montage && montageModule && typeof montageModule.previewRow === 'function') return montageModule.previewRow(montage.id);

        alert(`Bu ID kod icin goruntuleme kaydi bulunamadi: ${code}`);
        return null;
    }
};

window.ReadOnlyViewer = ReadOnlyViewer;
