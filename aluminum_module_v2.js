const AluminumModule = {
    state: {
        filters: { name: '', code: '', supplier: '', colorType: 'all', color: '' },
        activeProfileId: null,
        editingId: null,
        isFormVisible: false, // New State
        openDropdown: null, // For custom dropdowns
        lastSurfaceChoice: null,
        tempSuppliers: [],
        formDraft: null,
        formSnapshot: null
    },

    init: () => {
        // Ensure options exist
        if (!DB.data.meta) DB.data.meta = {};
        if (!DB.data.meta.options) DB.data.meta.options = {}; // Ensure main options object exists

        // Migrate old aluOptions if they exist, or init new ones
        if (!DB.data.meta.options.aluAnodized || DB.data.meta.options.aluAnodized.length === 0) {
            DB.data.meta.options.aluAnodized = ['Naturel Mat', 'Siyah Eloksal'];
        }
        if (!DB.data.meta.options.aluPainted || DB.data.meta.options.aluPainted.length === 0) {
            DB.data.meta.options.aluPainted = ['RAL 9016 (Beyaz)', 'RAL 7016 (Antrasit)'];
        }
        if (!DB.data.meta.options.aluLengths || DB.data.meta.options.aluLengths.length === 0) {
            DB.data.meta.options.aluLengths = [6000];
        }

        // Backward compatibility sync (optional, can be removed if fully migrated)
        DB.data.meta.aluOptions = {
            anodized: DB.data.meta.options.aluAnodized,
            painted: DB.data.meta.options.aluPainted,
            lengths: DB.data.meta.options.aluLengths
        };
        // Close dropdowns on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown') && !e.target.closest('.manager-btn') && !e.target.closest('.custom-select')) {
                if (AluminumModule.state.openDropdown) {
                    AluminumModule.state.openDropdown = null;
                    AluminumModule.applyDropdownState();
                }
            }
        });
    },

    setFormDraftValues: (patch) => {
        AluminumModule.state.formDraft = { ...(AluminumModule.state.formDraft || {}), ...patch };
    },

    captureFormSnapshot: () => {
        const nameEl = document.getElementById('af_name');
        if (!nameEl) return;

        AluminumModule.state.formSnapshot = {
            name: nameEl.value || '',
            weight: document.getElementById('af_weight')?.value || '',
            anodized: document.getElementById('af_anodized_val')?.value || '',
            painted: document.getElementById('af_painted_val')?.value || '',
            length: document.getElementById('af_length_val')?.value || '6000',
            dispAnodized: document.getElementById('disp_anodized')?.innerText || '',
            dispPainted: document.getElementById('disp_painted')?.innerText || '',
            dispLengths: document.getElementById('disp_lengths')?.innerText || '',
            focusedId: document.activeElement?.id || null
        };
    },

    restoreFormSnapshot: () => {
        const snap = AluminumModule.state.formSnapshot;
        if (!snap) return;

        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value;
        };
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };

        setValue('af_name', snap.name);
        setValue('af_weight', snap.weight);
        setValue('af_anodized_val', snap.anodized);
        setValue('af_painted_val', snap.painted);
        setValue('af_length_val', snap.length);
        setText('disp_anodized', snap.dispAnodized || 'Seçiniz...');
        setText('disp_painted', snap.dispPainted || 'Seçiniz...');
        setText('disp_lengths', snap.dispLengths || '6000');

        if (snap.focusedId) {
            const f = document.getElementById(snap.focusedId);
            if (f) f.focus();
        }
    },

    rerenderPreserveForm: () => {
        const hasOpenForm = !!document.getElementById('af_name');
        if (hasOpenForm) AluminumModule.captureFormSnapshot();
        UI.renderCurrentPage();
        if (hasOpenForm) {
            setTimeout(() => AluminumModule.restoreFormSnapshot(), 0);
        }
    },

    applyDropdownState: () => {
        const openName = AluminumModule.state.openDropdown;
        const menus = document.querySelectorAll('.dropdown-menu[data-drop-type]');
        menus.forEach((menu) => {
            menu.style.display = menu.dataset.dropType === openName ? 'block' : 'none';
        });

        if (openName === 'suppliers') {
            setTimeout(() => {
                const input = document.getElementById('sup_search_inp');
                if (input) input.focus();
            }, 10);
        }
    },

    getCurrentSuppliers: () => {
        if (AluminumModule.state.editingId) {
            const p = DB.data.data.aluminumProfiles.find(x => x.id === AluminumModule.state.editingId);
            return p?.suppliers || [];
        }
        return AluminumModule.state.tempSuppliers || [];
    },

    refreshSupplierCaption: () => {
        const label = document.getElementById('disp_suppliers');
        if (!label) return;

        const selected = AluminumModule.getCurrentSuppliers();
        label.innerText = selected.length > 0 ? selected.join(', ') : 'Tedarikci Sec...';
    },

    captureFormDraftFromDom: () => {
        const nameEl = document.getElementById('af_name');
        if (!nameEl) return;

        const editProfile = AluminumModule.state.editingId
            ? DB.data.data.aluminumProfiles.find(x => x.id === AluminumModule.state.editingId)
            : null;

        const suppliers = AluminumModule.state.editingId
            ? (editProfile?.suppliers || [])
            : (AluminumModule.state.tempSuppliers || []);

        AluminumModule.state.formDraft = {
            ...(AluminumModule.state.formDraft || {}),
            name: nameEl.value || '',
            weightPerMeter: document.getElementById('af_weight')?.value || '',
            anodizedColor: document.getElementById('af_anodized_val')?.value || '',
            paintColor: document.getElementById('af_painted_val')?.value || '',
            length: document.getElementById('af_length_val')?.value || '6000',
            suppliers: [...suppliers]
        };
    },

    render: (container) => {
        // Ensure Schema
        if (!DB.data.data.aluminumProfiles) DB.data.data.aluminumProfiles = [];
        if (!DB.data.meta || !DB.data.meta.aluOptions) AluminumModule.init();

        const profiles = AluminumModule.filterProfiles();

        // Calculate counts for badges if needed, or just list

        container.innerHTML = `
            <div style="font-family: 'Inter', sans-serif; max-width:1400px; margin:0 auto; padding-bottom:4rem">
                <!-- HEADER -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">Alüminyum profil <span style="font-weight:700">envanteri</span></h1>
                </div>

                <!-- SEARCH & ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                    
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1">
                        <!-- Custom Search Inputs styled as buttons/capsules -->
                        <div class="search-capsule">
                            <input id="src_name" placeholder="Ürün adı ara" oninput="AluminumModule.updateFilters()" value="${AluminumModule.state.filters.name || ''}">
                        </div>
                        <div class="search-capsule">
                            <input id="src_ano" placeholder="eloksal renkleri ara" oninput="AluminumModule.updateFilters()" value="${AluminumModule.state.filters.colorType === 'anodized' ? (AluminumModule.state.filters.color || '') : ''}">
                        </div>
                        <div class="search-capsule">
                            <input id="src_paint" placeholder="boya renkleri ara" oninput="AluminumModule.updateFilters()" value="${AluminumModule.state.filters.colorType === 'painted' ? (AluminumModule.state.filters.color || '') : ''}">
                        </div>
                        <div class="search-capsule">
                            <input id="src_sup" placeholder="tedarikçi ile ara" oninput="AluminumModule.updateFilters()" value="${AluminumModule.state.filters.supplier || ''}">
                        </div>
                        <div class="search-capsule">
                            <input id="src_code" placeholder="kod ile ara" oninput="AluminumModule.updateFilters()" value="${AluminumModule.state.filters.code || ''}">
                        </div>
                        
                        <button class="search-btn" onclick="AluminumModule.updateFilters()">ara</button>
                    </div>

                    <div style="flex-shrink:0">
                        ${(AluminumModule.state.editingId || AluminumModule.state.isFormVisible) ?
                `<button onclick="AluminumModule.toggleForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="AluminumModule.toggleForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <style>
                    .search-capsule { border:1px solid #94a3b8; border-radius:1rem; padding:0 1rem; background:white; display:flex; align-items:center; height:46px; transition:all 0.2s }
                    .search-capsule:focus-within { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1) }
                    .search-capsule input { border:none; outline:none; font-size:0.95rem; color:#334155; font-weight:600; text-align:center; background:transparent; width:130px }
                    .search-capsule input::placeholder { color:#94a3b8; font-weight:500 }
                    .search-btn { border:2px solid #1e293b; color:#1e293b; background:transparent; border-radius:1rem; padding:0 2rem; height:46px; font-weight:800; cursor:pointer; transition:all 0.2s; text-transform:uppercase; font-size:0.9rem }
                    .search-btn:hover { background:#1e293b; color:white }
                </style>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(AluminumModule.state.isFormVisible || AluminumModule.state.editingId) ? `
                    <div id="aluFormSection" style="margin-top:2rem; margin-bottom:3rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         ${AluminumModule.renderForm()}
                    </div>
                ` : ''}

                <!-- LIST TITLE -->
                <h3 style="font-size:1.2rem; color:#64748b; font-weight:500; margin-bottom:1.5rem">ürün envanter listesi</h3>

                <!-- LIST -->
                <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155">
                     ${profiles.length === 0 ? '<div style="padding:3rem; text-align:center; color:#cbd5e1; font-weight:500">Kayıtlı profil bulunamadı.</div>' : profiles.map(p => AluminumModule.renderRow(p)).join('')}
                </div>
            </div>
        `;

        // Restore focus if searching
        if (AluminumModule.state.focusId) {
            setTimeout(() => {
                const el = document.getElementById(AluminumModule.state.focusId);
                if (el) {
                    el.focus();
                    // Move cursor to end
                    const val = el.value;
                    el.value = '';
                    el.value = val;
                }
            }, 10);
        }

        if (window.lucide) window.lucide.createIcons();
    },

    renderRow: (p) => {
        return `
            <div style="display:flex; align-items:center; padding:1.5rem 0; border-bottom:1px solid #e2e8f0; gap:1.5rem; transition:background 0.2s; padding-left:1rem; padding-right:1rem" class="hover:bg-slate-50">
                <!-- Image -->
                <div style="flex-shrink:0; width:70px; height:70px; border:2px solid #e2e8f0; border-radius:1rem; display:flex; align-items:center; justify-content:center; overflow:hidden; padding:5px; background:white">
                     ${p.image ? `<img src="${p.image}" style="width:100%; height:100%; object-fit:contain" onclick="AluminumModule.previewImage('${p.image}')">` : '<i data-lucide="image" color="#cbd5e1"></i>'}
                </div>

                <!-- Info -->
                <div style="flex:1; font-weight:600; color:#334155; font-size:1.1rem; display:flex; align-items:center; flex-wrap:wrap; gap:0.5rem; line-height:1.6">
                    <span style="color:#1e293b">${p.name}</span> <span style="color:#cbd5e1">/</span>
                    ${p.anodizedColor ? `<span>${p.anodizedColor} eloksal</span>` : `<span>${p.paintColor || 'Hams'} boya</span>`} <span style="color:#cbd5e1">/</span>
                    <span>${p.length} mm</span> <span style="color:#cbd5e1">/</span>
                    <span>${p.weightPerMeter} gr</span> <span style="color:#cbd5e1">/</span>
                    <span style="color:#64748b; font-size:0.95rem">${(p.suppliers && p.suppliers.length > 0) ? p.suppliers.join(', ') : 'Tedarikçi Yok'}</span>
                </div>

                <!-- ID -->
                <div style="font-family:monospace; color:#94a3b8; font-size:0.9rem; margin-right:2rem">ID: ${p.code || p.id.substring(0, 8)}</div>

                <!-- Actions -->
                <div style="display:flex; align-items:center; gap:1.5rem">
                    <button onclick="AluminumModule.edit('${p.id}')" style="background:none; border:none; cursor:pointer; font-weight:700; color:#64748b; font-size:0.9rem; display:flex; align-items:center; gap:0.5rem; transition:color 0.2s" onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#64748b'">
                        düzenle/sil
                    </button>
                    
                    <!-- Toggle Switch -->
                    <div style="display:flex; gap:0.5rem; align-items:center">
                         <input type="checkbox" onchange="AluminumModule.toggleSelection('${p.id}')" ${p.selected ? 'checked' : ''} style="width:1.5rem; height:1.5rem; border:2px solid #94a3b8; border-radius:0.4rem; cursor:pointer">
                         <span style="color:#64748b; font-size:0.9rem">seç</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderForm: () => {
        const isEdit = !!AluminumModule.state.editingId;
        const p = isEdit ? DB.data.data.aluminumProfiles.find(x => x.id === AluminumModule.state.editingId) : {};
        if (isEdit && !p) { AluminumModule.clearForm(); return ''; } // Safety

        // Dropdown States
        const openDrop = AluminumModule.state.openDropdown;

        return `
            <div style="position:absolute; top:2rem; left:2rem">
                ${isEdit ?
                `<button class="btn-sm" onclick="AluminumModule.delete('${p.id}')" style="color:#ef4444; font-weight:700; background:#fee2e2; padding:0.5rem 1rem; border-radius:0.5rem; border:none; cursor:pointer">Bu Profili Sil</button>`
                : '<span style="color:#94a3b8; font-weight:700">Yeni Ekleme Modu</span>'}
            </div>
            
            <div style="position:absolute; top:2rem; right:2rem">
                 <button class="btn-sm" onclick="AluminumModule.clearForm()" style="color:#64748b; font-weight:700; background:transparent; border:none; cursor:pointer; font-size:1.5rem">×</button>
            </div>

            <div style="display:flex; gap:5rem; padding-top:2rem">
                <!-- Left Fields -->
                <div style="flex:1; display:flex; flex-direction:column; gap:1.5rem">
                    
                    ${AluminumModule.renderInput('Ürün adı', 'af_name', p.name || '')}

                    <!-- Anodized -->
                    <div style="position:relative">
                        <label class="lbl">eloksal renk <a onclick="AluminumModule.manage('anodized')" class="manage-link">[ + YÖNET (EKLE) ]</a></label>
                        <div class="custom-select" onclick="AluminumModule.toggleDrop('anodized'); event.stopPropagation()">
                            <span id="disp_anodized">${p.anodizedColor || 'Seçiniz...'}</span> <i data-lucide="chevron-down" width="16"></i>
                        </div>
                        ${AluminumModule.renderDropdown('anodized', DB.data.meta.options.aluAnodized, openDrop === 'anodized')}
                        <input type="hidden" id="af_anodized_val" value="${p.anodizedColor || ''}">
                    </div>

                    <!-- Painted -->
                    <div style="position:relative">
                        <label class="lbl">boya renk <a onclick="AluminumModule.manage('painted')" class="manage-link">[ + YÖNET (EKLE) ]</a></label>
                        <div class="custom-select" onclick="AluminumModule.toggleDrop('painted'); event.stopPropagation()">
                             <span id="disp_painted">${p.paintColor || 'Seçiniz...'}</span> <i data-lucide="chevron-down" width="16"></i>
                        </div>
                         ${AluminumModule.renderDropdown('painted', DB.data.meta.options.aluPainted, openDrop === 'painted')}
                         <input type="hidden" id="af_painted_val" value="${p.paintColor || ''}">
                    </div>

                    ${AluminumModule.renderInput('metre ağırlık', 'af_weight', p.weightPerMeter || '', 'number')}
                    
                    <!-- Length -->
                     <div style="position:relative">
                        <label class="lbl">uzunluk <a onclick="AluminumModule.manage('lengths')" class="manage-link">[ + YÖNET (EKLE) ]</a></label>
                        <div class="custom-select" onclick="AluminumModule.toggleDrop('lengths'); event.stopPropagation()">
                            <span id="disp_lengths">${p.length || '6000'}</span> <i data-lucide="chevron-down" width="16"></i>
                        </div>
                         ${AluminumModule.renderDropdown('lengths', DB.data.meta.options.aluLengths, openDrop === 'lengths')}
                         <input type="hidden" id="af_length_val" value="${p.length || '6000'}">
                    </div>


                    <!-- Multi Select Suppliers -->
                    <div style="position:relative" class="custom-dropdown">
                        <label class="lbl">tedarikçiler ekle</label>
                        <div class="custom-select" onclick="AluminumModule.toggleDrop('suppliers'); event.stopPropagation()">
                            <span id="disp_suppliers">${(p.suppliers && p.suppliers.length > 0) ? p.suppliers.join(', ') : (AluminumModule.state.tempSuppliers.length > 0 ? AluminumModule.state.tempSuppliers.join(', ') : 'Tedarikci Sec...')}</span> 
                            <i data-lucide="chevron-down" width="16"></i>
                        </div>
                        ${AluminumModule.renderSupplierDropdown(isEdit ? (p.suppliers || []) : AluminumModule.state.tempSuppliers, openDrop === 'suppliers')}
                    </div>

                    ${AluminumModule.renderInput('ID:', 'af_code', p.code || 'OTOMATİK', 'text', true)}

                    <div style="display:flex; gap:1rem; margin-top:1rem">
                        <button onclick="AluminumModule.save()" class="btn-primary" style="padding:1rem 3rem; border-radius:1rem; flex:1; font-size:1.1rem; font-weight:800; background:#10b981; border:none; color:white; cursor:pointer; box-shadow:0 10px 20px -5px rgba(16,185,129,0.3)">
                            ${isEdit ? 'DÜZENLEMEYİ KAYDET' : 'KAYDET'}
                        </button>
                    </div>

                </div>

                <!-- Right Image -->
                <div style="width:300px; display:flex; flex-direction:column; gap:1rem; margin-top:2.5rem">
                    <div id="dropZone" onclick="document.getElementById('af_file').click()" style="width:100%; aspect-ratio:1; border:3px solid #1e293b; border-radius:1.5rem; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; position:relative; overflow:hidden; background:#f8fafc; transition:all 0.2s">
                         ${(p.image || AluminumModule.tempImage) ? `<img src="${AluminumModule.tempImage || p.image}" style="width:100%; height:100%; object-fit:contain">` : `
                            <i data-lucide="camera" width="48" height="48" color="#1e293b"></i>
                            <span style="font-size:1.1rem; font-weight:700; color:#1e293b; margin-top:1rem">Resim ekle</span>
                         `}
                         <input type="file" id="af_file" style="display:none" accept="image/*" onchange="AluminumModule.handleFileSelect(this)">
                         ${(p.image || AluminumModule.tempImage) ? '<div style="position:absolute; bottom:0; width:100%; background:rgba(0,0,0,0.5); color:white; text-align:center; padding:0.5rem; font-size:0.8rem">Değiştirmek için tıkla</div>' : ''}
                    </div>
                </div>
            </div>

            <style>
                .lbl { font-size:1.1rem; font-weight:700; color:#334155; margin-bottom:0.8rem; display:flex; justify-content:space-between; align-items:center }
                .manage-link { font-size:0.75rem; color:#3b82f6; cursor:pointer; text-transform:uppercase; font-weight:800; letter-spacing:0.05em }
                .custom-select { width:100%; border:2px solid #334155; border-radius:1rem; padding:1rem; font-weight:700; color:#1e293b; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:white; min-height:56px }
                .custom-select:hover { border-color:#1e293b }
                .dropdown-menu { position:absolute; top:calc(100% + 0.5rem); left:0; width:100%; background:white; border:2px solid #e2e8f0; border-radius:1rem; z-index:50; box-shadow:0 10px 40px -10px rgba(0,0,0,0.2); overflow:hidden; animation:slideDown 0.2s }
                .drop-item { padding:1rem; border-bottom:1px solid #f1f5f9; cursor:pointer; font-weight:600; display:flex; justify-content:space-between; align-items:center; transition:background 0.1s; color:#334155 }
                .drop-item:hover { background:#f1f5f9; color:#1e293b }
                .form-inp { width:100%; border:2px solid #334155; border-radius:1rem; padding:1rem; font-weight:700; color:#1e293b; outline:none; font-family:'Inter' }
                .form-inp:focus { border-color:#3b82f6; box-shadow:0 0 0 4px rgba(59,130,246,0.1) }
                @keyframes slideDown { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
            </style>
        `;
    },

    renderInput: (lbl, id, val, type = 'text', disabled = false) => `
        <div>
            <label class="lbl">${lbl}</label>
            <input id="${id}" type="${type}" value="${val}" class="form-inp" ${disabled ? 'disabled style="background:#f1f5f9; border-color:#cbd5e1; color:#94a3b8"' : ''}>
        </div>
    `,

    renderDropdown: (type, options, isOpen) => `
        <div class="dropdown-menu custom-dropdown" data-drop-type="${type}" style="display:${isOpen ? 'block' : 'none'}">
            ${options.map(o => `
                <div class="drop-item" onclick="AluminumModule.selectOption('${type}', '${o}', event)">
                    ${o}
                </div>
            `).join('')}
        </div>
    `,

    selectOption: (type, val, evt) => {
        if (type === 'anodized') {
            document.getElementById('af_anodized_val').value = val;
            document.getElementById('disp_anodized').innerText = val;
            document.getElementById('af_painted_val').value = '';
            document.getElementById('disp_painted').innerText = 'Seciniz...';
            AluminumModule.state.lastSurfaceChoice = 'anodized';
        } else if (type === 'painted') {
            document.getElementById('af_painted_val').value = val;
            document.getElementById('disp_painted').innerText = val;
            document.getElementById('af_anodized_val').value = '';
            document.getElementById('disp_anodized').innerText = 'Seciniz...';
            AluminumModule.state.lastSurfaceChoice = 'painted';
        } else if (type === 'lengths') {
            document.getElementById('af_length_val').value = val;
            document.getElementById('disp_lengths').innerText = val;
        }
        AluminumModule.state.openDropdown = null;
        AluminumModule.applyDropdownState();
    },

    renderSupplierDropdown: (selectedSup, isOpen) => {
        // Mock suppliers if not present (PurchasingModule might modify this)
        if (!DB.data.data.suppliers) DB.data.data.suppliers = [
            { name: 'Akpa Alüminyum' }, { name: 'Saray Alüminyum' }, { name: 'Asaş Alüminyum' }, { name: 'Çelikerler Alüminyum' }
        ];
        const suppliers = DB.data.data.suppliers;

        return `
            <div class="dropdown-menu custom-dropdown" data-drop-type="suppliers" style="padding:0; display:${isOpen ? 'block' : 'none'}">
                <div style="padding:0.5rem; border-bottom:1px solid #f1f5f9">
                    <input id="sup_search_inp" placeholder="Tedarikçi ara..." style="width:100%; padding:0.8rem; border:1px solid #e2e8f0; border-radius:0.5rem; outline:none; font-weight:600" onclick="event.stopPropagation()" oninput="AluminumModule.filterSupList(this.value)">
                </div>
                <div id="sup_list_container" style="max-height:250px; overflow-y:auto">
                    ${suppliers.map(s => {
            const isSel = selectedSup.includes(s.name);
            return `
                        <div class="drop-item" onclick="event.stopPropagation(); AluminumModule.toggleSupplier('${s.name}')">
                            <span>${s.name}</span>
                            ${isSel ? '<i data-lucide="check" color="#10b981" width="20"></i>' : ''}
                        </div>`;
        }).join('')}
                </div>
                <!-- ADD NEW ON THE FLY -->
                <div class="drop-item" style="color:#3b82f6; font-size:0.9rem; justify-content:center; padding:1rem; border-top:1px solid #f1f5f9" onclick="alert('Yeni tedarikçi ekleme modülüne yönlendirilecek...')">
                    + Listede yok mu? Yeni Ekle
                </div>
            </div>
        `;
    },

    toggleSupplier: (name) => {
        const isEdit = !!AluminumModule.state.editingId;

        // Determine target array
        let current = [];
        if (isEdit) {
            const p = DB.data.data.aluminumProfiles.find(x => x.id === AluminumModule.state.editingId);
            if (p) {
                if (!p.suppliers) p.suppliers = [];
                current = p.suppliers;
            }
        } else {
            current = AluminumModule.state.tempSuppliers;
        }

        if (current.includes(name)) {
            // Remove
            if (isEdit) {
                const p = DB.data.data.aluminumProfiles.find(x => x.id === AluminumModule.state.editingId);
                p.suppliers = p.suppliers.filter(x => x !== name);
            } else {
                AluminumModule.state.tempSuppliers = AluminumModule.state.tempSuppliers.filter(x => x !== name);
            }
        } else {
            // Add
            if (isEdit) {
                const p = DB.data.data.aluminumProfiles.find(x => x.id === AluminumModule.state.editingId);
                p.suppliers.push(name);
            } else {
                AluminumModule.state.tempSuppliers.push(name);
            }
        }

        AluminumModule.refreshSupplierCaption();
        const searchVal = document.getElementById('sup_search_inp')?.value || '';
        AluminumModule.filterSupList(searchVal);
    },

    filterSupList: (val) => {
        const list = DB.data.data.suppliers || [];
        const filtered = list.filter(s => s.name.toLowerCase().includes(val.toLowerCase()));

        const container = document.getElementById('sup_list_container');
        if (container) {
            let current = AluminumModule.state.editingId ?
                DB.data.data.aluminumProfiles.find(x => x.id === AluminumModule.state.editingId).suppliers :
                (AluminumModule.state.tempSuppliers || []);
            if (!current) current = [];

            container.innerHTML = filtered.map(s => {
                const isSel = current.includes(s.name);
                return `
                    <div class="drop-item" onclick="event.stopPropagation(); AluminumModule.toggleSupplier('${s.name}')">
                        <span>${s.name}</span>
                        ${isSel ? '<i data-lucide="check" color="#10b981" width="20"></i>' : ''}
                    </div>`;
            }).join('');
            if (window.lucide) window.lucide.createIcons();
        }
    },

    toggleDrop: (name) => {
        if (AluminumModule.state.openDropdown === name) AluminumModule.state.openDropdown = null;
        else AluminumModule.state.openDropdown = name;
        AluminumModule.applyDropdownState();
    },

    toggleSelection: (id) => {
        const p = DB.data.data.aluminumProfiles.find(x => x.id === id);
        if (p) p.selected = !p.selected;
        UI.renderCurrentPage();
    },

    toggleForm: () => {
        if (AluminumModule.state.isFormVisible || AluminumModule.state.editingId) {
            AluminumModule.clearForm(); // Closes it
        } else {
            AluminumModule.state.isFormVisible = true;
            UI.renderCurrentPage();
            setTimeout(() => {
                const el = document.getElementById('aluFormSection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    },

    scrollToForm: () => {
        // Deprecated but kept for compatibility logic if needed
        AluminumModule.toggleForm();
    },

    updateFilters: () => {
        const name = document.getElementById('src_name').value;
        const code = document.getElementById('src_code').value;
        const sup = document.getElementById('src_sup').value;
        const ano = document.getElementById('src_ano').value;
        const paint = document.getElementById('src_paint').value;

        // Save focus
        AluminumModule.state.focusId = document.activeElement.id;

        AluminumModule.state.filters.name = name;
        AluminumModule.state.filters.code = code;
        AluminumModule.state.filters.supplier = sup;

        if (ano) {
            AluminumModule.state.filters.colorType = 'anodized';
            AluminumModule.state.filters.color = ano;
        } else if (paint) {
            AluminumModule.state.filters.colorType = 'painted';
            AluminumModule.state.filters.color = paint;
        } else {
            AluminumModule.state.filters.colorType = 'all';
            AluminumModule.state.filters.color = '';
        }

        UI.renderCurrentPage();
    },

    filterProfiles: () => {
        const { name, code, supplier, colorType, color } = AluminumModule.state.filters;
        return DB.data.data.aluminumProfiles.filter(p => {
            const matchName = !name || p.name.toLowerCase().includes(name.toLowerCase());
            const matchCode = !code || (p.code || p.id).toLowerCase().includes(code.toLowerCase());
            const matchSup = !supplier || (p.suppliers || []).some(s => s.toLowerCase().includes(supplier.toLowerCase()));

            let matchColor = true;
            if (color) {
                if (colorType === 'anodized') matchColor = p.anodizedColor && p.anodizedColor.toLowerCase().includes(color.toLowerCase());
                if (colorType === 'painted') matchColor = p.paintColor && p.paintColor.toLowerCase().includes(color.toLowerCase());
            }

            return matchName && matchCode && matchSup && matchColor;
        });
    },

    manage: (type) => {
        const mapping = { anodized: 'aluAnodized', painted: 'aluPainted', lengths: 'aluLengths' };
        // Use the shared Modal system from ProductLibraryModule
        if (ProductLibraryModule && ProductLibraryModule.openOptionLibrary) {
            ProductLibraryModule.openOptionLibrary(mapping[type]);
        } else {
            console.error("ProductLibraryModule.openOptionLibrary not found!");
        }
    },

    handleFileSelect: (input) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                AluminumModule.tempImage = e.target.result;
                AluminumModule.rerenderPreserveForm();
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    save: async () => {
        const name = document.getElementById('af_name').value;
        const weight = document.getElementById('af_weight').value;
        // Values from hidden inputs populated by select
        let ano = document.getElementById('af_anodized_val').value;
        let paint = document.getElementById('af_painted_val').value;
        const len = document.getElementById('af_length_val').value;

        if (ano && paint) {
            if (AluminumModule.state.lastSurfaceChoice === 'painted') ano = '';
            else paint = '';
        }

        // Suppliers
        const suppliers = AluminumModule.state.editingId ?
            DB.data.data.aluminumProfiles.find(x => x.id === AluminumModule.state.editingId).suppliers :
            (AluminumModule.state.tempSuppliers || []);

        if (!name) return alert('Ürün adı giriniz');

        // Auto Code Generation
        // PL-B-50-200-SEF logic adaptation
        // ALU-[3LETTER NAME]-[LEN]-[COLOR]
        const typeCode = "ALU";
        const nameCode = name.substring(0, 3).toUpperCase();
        const lenCode = len || '6000';
        const colCode = (ano || paint || 'HAM').substring(0, 3).toUpperCase();
        const code = `${typeCode}-${nameCode}-${lenCode}-${colCode}`;

        const data = {
            id: AluminumModule.state.editingId || crypto.randomUUID(),
            name,
            anodizedColor: ano,
            paintColor: paint,
            weightPerMeter: weight,
            length: len,
            suppliers: suppliers || [],
            code,
            image: AluminumModule.tempImage || (AluminumModule.state.editingId ? DB.data.data.aluminumProfiles.find(x => x.id === AluminumModule.state.editingId)?.image : null)
        };

        if (AluminumModule.state.editingId) {
            const idx = DB.data.data.aluminumProfiles.findIndex(x => x.id === AluminumModule.state.editingId);
            if (idx !== -1) DB.data.data.aluminumProfiles[idx] = data;
        } else {
            DB.data.data.aluminumProfiles.push(data);
        }

        AluminumModule.state.tempSuppliers = []; // Reset temp
        AluminumModule.tempImage = null;
        AluminumModule.state.editingId = null;
        AluminumModule.state.isFormVisible = false; // Close on save

        await DB.save();
        UI.renderCurrentPage();
    },

    edit: (id) => {
        AluminumModule.state.editingId = id;
        UI.renderCurrentPage();
        setTimeout(() => document.getElementById('aluFormSection').scrollIntoView({ behavior: 'smooth' }), 50);
    },

    delete: (id) => {
        if (confirm('Bu profili silmek istiyor musunuz?')) {
            DB.data.data.aluminumProfiles = DB.data.data.aluminumProfiles.filter(p => p.id !== id);
            DB.save();
            AluminumModule.clearForm();
        }
    },

    clearForm: () => {
        AluminumModule.state.editingId = null;
        AluminumModule.state.isFormVisible = false; // Close
        AluminumModule.tempImage = null;
        AluminumModule.state.tempSuppliers = [];
        AluminumModule.state.openDropdown = null;
        AluminumModule.state.lastSurfaceChoice = null;
        UI.renderCurrentPage();
    },

    previewImage: (src) => {
        const d = document.createElement('div');
        d.id = 'm';
        d.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px)';
        d.onclick = () => d.remove();
        d.innerHTML = `<img src="${src}" style="max-width:90%; max-height:90%; border-radius:1rem; box-shadow:0 0 50px rgba(0,0,0,0.5)">`;
        document.body.appendChild(d);
    }
};
