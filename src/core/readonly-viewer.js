const ReadOnlyViewer = {
    fileRegistry: {},

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
        let targetUrl = url;
        if (url.startsWith('data:')) {
            try {
                const commaIndex = url.indexOf(',');
                const header = url.slice(0, commaIndex);
                const payload = url.slice(commaIndex + 1);
                const mimeMatch = header.match(/^data:([^;]+)(;base64)?/i);
                const mime = mimeMatch?.[1] || 'application/octet-stream';
                const binary = header.toLowerCase().includes(';base64')
                    ? atob(payload)
                    : decodeURIComponent(payload);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
                const blob = new Blob([bytes], { type: mime });
                targetUrl = URL.createObjectURL(blob);
            } catch (_) {
                targetUrl = url;
            }
        }
        const win = window.open(targetUrl, '_blank');
        if (!win) alert('Tarayici popup engelliyor olabilir.');
        if (targetUrl.startsWith('blob:')) {
            setTimeout(() => {
                try { URL.revokeObjectURL(targetUrl); } catch (_) { }
            }, 60_000);
        }
    },

    openFileByToken: (token) => {
        const key = String(token || '').trim();
        if (!key) return alert('Dosya anahtari bulunamadi.');
        const file = ReadOnlyViewer.fileRegistry?.[key];
        if (!file?.data) return alert('Goruntulenecek dosya bulunamadi.');
        ReadOnlyViewer.openFile(file.data);
    },

    downloadFileByToken: (token) => {
        const key = String(token || '').trim();
        if (!key) return alert('Dosya anahtari bulunamadi.');
        const file = ReadOnlyViewer.fileRegistry?.[key];
        if (!file?.data) return alert('Indirilecek dosya bulunamadi.');
        ReadOnlyViewer.downloadFile(file.data, file.name || 'dosya');
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
        ReadOnlyViewer.fileRegistry = {};
        const stamped = Date.now();
        const filesWithToken = safeFiles.map((file, idx) => {
            const token = `rvf_${stamped}_${idx}_${Math.random().toString(36).slice(2, 8)}`;
            ReadOnlyViewer.fileRegistry[token] = {
                data: String(file?.data || ''),
                name: String(file?.name || 'dosya')
            };
            return { ...file, token };
        });
        const first = filesWithToken[0];
        return `
            <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.6rem; margin-bottom:0.5rem; flex-wrap:wrap;">
                    <div style="font-size:0.84rem; color:#64748b;">Dosyalar (${filesWithToken.length})</div>
                    <div style="font-size:0.8rem; color:#334155; font-weight:700;">Onizleme: ${ReadOnlyViewer.escapeHtml(first.name || 'dosya')}</div>
                </div>
                <div style="display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.15fr); gap:0.7rem;">
                    <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:360px; overflow:auto;">
                        ${filesWithToken.map((file) => `
                            <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.45rem 0.55rem; background:#f8fafc;">
                                <div style="font-size:0.82rem; color:#334155; margin-bottom:0.35rem;">${ReadOnlyViewer.escapeHtml(file.name || 'dosya')}</div>
                                <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                                    <button class="btn-sm" onclick="ReadOnlyViewer.openFileByToken('${ReadOnlyViewer.escapeJsString(file.token || '')}')">yeni sekmede goruntule</button>
                                    <button class="btn-sm" onclick="ReadOnlyViewer.downloadFileByToken('${ReadOnlyViewer.escapeJsString(file.token || '')}')">indir</button>
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

    openComponentModal: (row, libraryTitle = 'Parca / Bilesen', options = {}) => {
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
        const modalOptions = (options?.modalOptions && typeof options.modalOptions === 'object') ? options.modalOptions : {};
        Modal.open(`ID Detay - ${ReadOnlyViewer.escapeHtml(row?.code || '-')}`, html, { maxWidth: '980px', ...modalOptions });
    },

    openModelModal: (row, options = {}) => {
        const files = [
            ...(Array.isArray(row?.productFiles) ? row.productFiles : []),
            ...(Array.isArray(row?.explodedFiles) ? row.explodedFiles : [])
        ];
        const linkedItems = (Array.isArray(row?.items) ? row.items : [])
            .map((item) => ({
                name: String(item?.name || '').trim(),
                code: String(item?.code || '').trim(),
                source: String(item?.source || '').trim().toUpperCase()
            }))
            .filter((item) => item.name || item.code);
        const components = linkedItems.filter((item) => item.source !== 'MASTER');
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
                <div style="border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem;">
                    <div style="font-size:0.84rem; color:#64748b; margin-bottom:0.45rem;">Bilesenler (${components.length})</div>
                    ${components.length
                ? `
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                        <th style="padding:0.42rem; text-align:left;">#</th>
                                        <th style="padding:0.42rem; text-align:left;">Bilesen adi</th>
                                        <th style="padding:0.42rem; text-align:left;">ID kod</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${components.map((item, idx) => `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:0.42rem;">${idx + 1}</td>
                                            <td style="padding:0.42rem; font-weight:700; color:#334155;">${ReadOnlyViewer.escapeHtml(item?.name || '-')}</td>
                                            <td style="padding:0.42rem; font-family:monospace; color:#1d4ed8;">${ReadOnlyViewer.escapeHtml(item?.code || '-')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `
                : `<div style="color:#94a3b8;">Bu modelde bagli bilesen kaydi bulunamadi.</div>`}
                </div>
                ${ReadOnlyViewer.renderFilesCard(files)}
            </div>
        `;
        const modalOptions = (options?.modalOptions && typeof options.modalOptions === 'object') ? options.modalOptions : {};
        Modal.open(`ID Detay - ${ReadOnlyViewer.escapeHtml(row?.variantCode || '-')}`, html, { maxWidth: '980px', ...modalOptions });
    },

    openMasterModal: (row, options = {}) => {
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
        const modalOptions = (options?.modalOptions && typeof options.modalOptions === 'object') ? options.modalOptions : {};
        Modal.open(`ID Detay - ${ReadOnlyViewer.escapeHtml(row?.code || '-')}`, html, { maxWidth: '920px', ...modalOptions });
    },

    openVariantCandidatesModal: (searchedCode, candidates, options = {}) => {
        const list = Array.isArray(candidates) ? candidates : [];
        if (!list.length) return false;
        const html = `
            <div style="display:grid; gap:0.55rem;">
                <div style="font-size:0.84rem; color:#64748b;">
                    <strong>${ReadOnlyViewer.escapeHtml(searchedCode)}</strong> kodu birden fazla urun varyantina bagli.
                    Lutfen acmak istediginiz varyanti secin.
                </div>
                <div style="display:grid; gap:0.45rem; max-height:58vh; overflow:auto;">
                    ${list.map((row) => `
                        <button class="btn-sm" style="display:flex; justify-content:space-between; align-items:center; gap:0.55rem; width:100%; text-align:left; padding:0.55rem 0.6rem;" onclick="ReadOnlyViewer.openByCode('${ReadOnlyViewer.escapeJsString(row?.variantCode || '')}', { modalOptions: { closeExisting: true } });">
                            <span style="display:flex; flex-direction:column; gap:0.08rem;">
                                <span style="font-weight:700; color:#0f172a;">${ReadOnlyViewer.escapeHtml(row?.productName || '-')}</span>
                                <span style="font-size:0.76rem; color:#64748b;">${ReadOnlyViewer.escapeHtml(row?.productGroup || '-')}</span>
                            </span>
                            <span style="font-family:monospace; color:#1d4ed8; font-weight:700;">${ReadOnlyViewer.escapeHtml(row?.variantCode || '-')}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        const modalOptions = (options?.modalOptions && typeof options.modalOptions === 'object') ? options.modalOptions : {};
        Modal.open(`ID Secimi - ${ReadOnlyViewer.escapeHtml(searchedCode)}`, html, { maxWidth: '820px', ...modalOptions });
        return true;
    },

    openByCode: (rawCode, options = {}) => {
        const code = ReadOnlyViewer.normalizeCode(rawCode);
        const silent = !!options?.silentNotFound;
        if (!code) {
            if (!silent) alert('ID kod bos olamaz.');
            return false;
        }
        const d = ReadOnlyViewer.getData();
        const unitModule = ReadOnlyViewer.getGlobalModule('UnitModule');
        const cncModule = ReadOnlyViewer.getGlobalModule('CncLibraryModule');
        const montageModule = ReadOnlyViewer.getGlobalModule('MontageLibraryModule');
        const productLibraryModule = ReadOnlyViewer.getGlobalModule('ProductLibraryModule');

        const part = (Array.isArray(d.partComponentCards) ? d.partComponentCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.code) === code);
        if (part) {
            ReadOnlyViewer.openComponentModal(part, 'Parca & Bilesen', options);
            return true;
        }

        const semi = (Array.isArray(d.semiFinishedCards) ? d.semiFinishedCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.code) === code);
        if (semi) {
            ReadOnlyViewer.openComponentModal(semi, 'Yari Mamul Kutuphanesi', options);
            return true;
        }

        const variants = (productLibraryModule && typeof productLibraryModule.getPlanningModelVariants === 'function')
            ? productLibraryModule.getPlanningModelVariants()
            : (Array.isArray(d.catalogProductVariants) ? d.catalogProductVariants : []);
        const variant = variants
            .find((row) => ReadOnlyViewer.normalizeCode(row?.variantCode) === code);
        if (variant) {
            ReadOnlyViewer.openModelModal(variant, options);
            return true;
        }

        const variantByMontageProductCode = variants
            .filter((row) => ReadOnlyViewer.normalizeCode(row?.montageCard?.productCode) === code);
        if (variantByMontageProductCode.length === 1) {
            ReadOnlyViewer.openModelModal(variantByMontageProductCode[0], options);
            return true;
        }
        if (variantByMontageProductCode.length > 1) {
            return ReadOnlyViewer.openVariantCandidatesModal(code, variantByMontageProductCode, options);
        }

        const master = (Array.isArray(d.products) ? d.products : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.code) === code && String(row?.type || '').toUpperCase() === 'MASTER');
        if (master) {
            ReadOnlyViewer.openMasterModal(master, options);
            return true;
        }

        const cnc = (Array.isArray(d.cncCards) ? d.cncCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cncId) === code);
        if (cnc && cncModule && typeof cncModule.viewCardOperations === 'function') {
            cncModule.viewCardOperations(cnc.id);
            return true;
        }

        const depoTask = (Array.isArray(d.depoTransferTasks) ? d.depoTransferTasks : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.taskCode) === code);
        if (depoTask && unitModule && typeof unitModule.previewDepoTask === 'function') {
            unitModule.previewDepoTask(depoTask.id);
            return true;
        }

        const saw = (Array.isArray(d.sawCutOrders) ? d.sawCutOrders : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.code) === code);
        if (saw && unitModule && typeof unitModule.previewSawRow === 'function') {
            unitModule.previewSawRow(saw.id);
            return true;
        }

        const ext = (Array.isArray(d.extruderLibraryCards) ? d.extruderLibraryCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (ext && unitModule && typeof unitModule.previewExtruderRow === 'function') {
            unitModule.previewExtruderRow(ext.id);
            return true;
        }

        const pvd = (Array.isArray(d.pvdCards) ? d.pvdCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (pvd && unitModule && typeof unitModule.previewPvdRow === 'function') {
            unitModule.previewPvdRow(pvd.id);
            return true;
        }

        const elx = (Array.isArray(d.eloksalCards) ? d.eloksalCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (elx && unitModule && typeof unitModule.previewEloksalRow === 'function') {
            unitModule.previewEloksalRow(elx.id);
            return true;
        }

        const ips = (Array.isArray(d.ibrahimPolishCards) ? d.ibrahimPolishCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (ips && unitModule && typeof unitModule.previewPolishRow === 'function') {
            unitModule.previewPolishRow(ips.id);
            return true;
        }

        const plx = (Array.isArray(d.plexiPolishCards) ? d.plexiPolishCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code);
        if (plx && unitModule && typeof unitModule.previewPlexiRow === 'function') {
            unitModule.previewPlexiRow(plx.id);
            return true;
        }

        const montage = (Array.isArray(d.montageCards) ? d.montageCards : [])
            .find((row) => ReadOnlyViewer.normalizeCode(row?.cardCode) === code || ReadOnlyViewer.normalizeCode(row?.productCode) === code);
        if (montage && montageModule && typeof montageModule.previewRow === 'function') {
            montageModule.previewRow(montage.id);
            return true;
        }

        if (!silent) alert(`Bu ID kod icin goruntuleme kaydi bulunamadi: ${code}`);
        return false;
    }
};

window.ReadOnlyViewer = ReadOnlyViewer;
