const ProductLibraryModule = {
    state: {
        activeCategory: null,
        extruderTab: 'ROD', // ROD | PIPE
        filters: { dia: '', len: '', thick: '', color: '', bubble: false },
        hardwareFilters: { shape: '', dia: '', len: '', mat: '' }, // New filters for Hardware
        boxSearchName: '',
        boxSearchSize: '',
        boxFormOpen: false,
        boxEditingId: null,
        boxSelectedId: null,
        boxDraftName: '',
        boxDraftWidth: '',
        boxDraftLength: '',
        boxDraftHeight: '',
        boxDraftPrint: 'YAZISIZ',
        boxDraftNote: '',
        editingProductId: null,
        isFormVisible: false // New State
    },

    render: (container) => {
        // Ensure Categories Exist
        // --- INITIALIZATION & CLEANUP ---
        // 1. Eğer hiç kategori yoksa standart 3'lüyü oluştur.
        if (!DB.data.data.productCategories || DB.data.data.productCategories.length === 0) {
            DB.data.data.productCategories = [
                { id: 'cat1', name: 'Alüminyum profil', icon: '🏗️' },
                { id: 'cat3', name: 'Hırdavat & Vida', icon: '🔩' },
                { id: 'cat_ext', name: 'Ekstrüder pleksi', icon: '🏭' },
                { id: 'cat_box', name: 'Koli', icon: '[ ]' }
            ];
        }

        // 2. "Şekil değiştiren" (shapeshifting) sorunu çözümü:
        // Eski 'Pleksi (Akrilik)' veya 'Ekstrüder' gibi tekil kalan kategorileri
        // tek bir 'Ekstrüder pleksi' çatısı altında birleştir ve kopyaları temizle.
        const cats = DB.data.data.productCategories;
        const hasLegacyPlexi = cats.some(c => c.name === 'Pleksi (Akrilik)');
        const hasLegacyExt = cats.some(c => c.name === 'Ekstrüder');

        if (hasLegacyPlexi || hasLegacyExt) {
            // Standart dışı olanları temizle, sadece bizim istediklerimiz ve kullanıcının yeni ekledikleri kalsın.
            // Ancak, kullanıcının özel eklediği kategorilere dokunmamalıyız.
            // Sadece bilinen ESKİ hatalı isimleri filtreliyoruz.
            DB.data.data.productCategories = DB.data.data.productCategories.filter(c =>
                c.name !== 'Pleksi (Akrilik)' &&
                c.name !== 'Ekstrüder'
            );

            // Eğer ana 'Ekstrüder pleksi' silindiyse veya yoksa geri ekle
            const mainExtExists = DB.data.data.productCategories.find(c => c.id === 'cat_ext');
            if (!mainExtExists) {
                DB.data.data.productCategories.push({ id: 'cat_ext', name: 'Ekstrüder pleksi', icon: '🏭' });
            }
        }

        // Ensure box category exists.
        const hasBox = (DB.data.data.productCategories || []).some(c =>
            c.id === 'cat_box' || String(c.name || '').toLowerCase().includes('koli')
        );
        if (!hasBox) {
            DB.data.data.productCategories.push({ id: 'cat_box', name: 'Koli', icon: '??' });
        }


        if (ProductLibraryModule.state.activeCategory) {
            ProductLibraryModule.renderCategoryDetail(container);
        } else {
            ProductLibraryModule.renderMain(container);
        }
    },

    renderMain: (container) => {
        const categories = DB.data.data.productCategories;

        container.innerHTML = `
            <div style="max-width:1000px; margin:0 auto">
                <!-- Action Header -->
                <div style="margin-bottom:2rem; display:flex; justify-content:center">
                    <button onclick="ProductLibraryModule.openCategoryModal()" class="btn-primary" style="display:flex; align-items:center; gap:0.5rem; padding:1rem 2rem; font-size:1.1rem; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)">
                        <i data-lucide="plus-circle" width="24"></i> Yeni Kategori Ekle
                    </button>
                </div>

                <!-- Categories Grid -->
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:1.5rem">
                    ${categories.map(c => `
                        <div class="group relative" style="position:relative">
                            <div onclick="ProductLibraryModule.openCategory('${c.id}')" style="background:white; border:1px solid #e2e8f0; border-radius:1.5rem; padding:2rem; display:flex; flex-direction:column; align-items:center; gap:1rem; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 25px -5px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)'">
                                <div style="font-size:3rem; line-height:1">${c.icon}</div>
                                <div style="font-weight:700; color:#334155; font-size:1.1rem; text-align:center">${c.name}</div>
                            </div>
                            <!-- Edit/Delete Actions -->
                            <div style="position:absolute; top:10px; right:10px; display:flex; gap:0.25rem; z-index:10;">
                                <button onclick="event.preventDefault(); event.stopPropagation(); ProductLibraryModule.openCategoryModal('${c.id}')" style="background:white; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0.4rem; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; box-shadow:0 2px 4px rgba(0,0,0,0.05)" onmouseover="this.style.color='#3b82f6'; this.style.borderColor='#3b82f6'" onmouseout="this.style.color='#64748b'; this.style.borderColor='#cbd5e1'">
                                    <i data-lucide="edit-2" width="16"></i>
                                </button>
                                <button onclick="event.preventDefault(); event.stopPropagation(); ProductLibraryModule.deleteCategory('${c.id}')" style="background:white; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0.4rem; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; box-shadow:0 2px 4px rgba(0,0,0,0.05)" onmouseover="this.style.color='#ef4444'; this.style.borderColor='#ef4444'" onmouseout="this.style.color='#64748b'; this.style.borderColor='#cbd5e1'">
                                    <i data-lucide="trash-2" width="16"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderList: (category) => {
        const products = (DB.data.data.products || []).filter(p => p.category === category.name || p.categoryId === category.id);
        if (products.length === 0) return '<div style="text-align:center; padding:2rem; color:#cbd5e1">Bu kategoride henüz ürün yok.</div>';
        return products.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border-bottom:1px solid #f1f5f9">
                <span style="font-weight:600; color:#334155">${p.name}</span>
                <span style="font-family:monospace; color:#94a3b8; font-size:0.9rem">${p.code || '---'}</span>
            </div>
        `).join('');
    },

    renderCategoryDetail: (container) => {
        const catId = ProductLibraryModule.state.activeCategory;
        const category = DB.data.data.productCategories.find(c => c.id === catId);

        if (!category) { ProductLibraryModule.state.activeCategory = null; UI.renderCurrentPage(); return; }

        // --- CUSTOM UI FOR EXTRUDER & PLEXI ---
        if (category.name.toLowerCase().includes('ekstrüder') || category.name.toLowerCase().includes('pleksi') || category.id === 'cat_ext') {
            ProductLibraryModule.renderExtruderPage(container);
            return;
        }

        // --- HARDWARE MODULE ROUTING ---
        if (category.name.toLowerCase().includes('hırdavat') || category.name.toLowerCase().includes('vida') || category.id === 'cat3') {
            ProductLibraryModule.renderHardwarePage(container);
            return;
        }

        // --- BOX MODULE ROUTING ---
        if (category.id === 'cat_box' || category.name.toLowerCase().includes('koli')) {
            ProductLibraryModule.renderBoxPage(container);
            return;
        }

        container.innerHTML = `
            <div style="max-width:1100px; margin:0 auto; font-family: 'Inter', sans-serif;">
                <!-- Header -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">${category.name.toLowerCase()} <span style="font-weight:700">envanter</span></h1>
                </div>

                <!-- ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- Search Capsules (Generic) -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         <div class="search-capsule">
                            <input type="text" placeholder="ürün ara..." style="width:200px">
                            <i data-lucide="search" width="16" style="color:#94a3b8"></i>
                         </div>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <!-- LIST (Empty State for now) -->
               <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155">
                     <div style="padding:4rem; text-align:center; color:#94a3b8">
                        Henüz ürün bulunamadı.
                     </div>
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="extFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni Ürün Ekle</h3>
                         <div style="text-align:center; color:#64748b">
                            Bu kategori için form yapısı henüz oluşturulmadı.
                         </div>
                    </div>
                ` : ''}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    openCategory: (id) => {
        // Find category to check its name
        const cat = DB.data.data.productCategories.find(c => c.id === id);

        // Redirect Aluminum to new module if name matches or ID matches
        if (id === 'cat1' || (cat && cat.name.toLowerCase().includes('alüminyum'))) {
            Router.navigate('aluminum-inventory');
            return;
        }

        ProductLibraryModule.state.activeCategory = id;
        ProductLibraryModule.state.isFormVisible = false;
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' };
        UI.renderCurrentPage();
    },

    openCategoryModal: (editId = null) => {
        const cat = editId ? DB.data.data.productCategories.find(c => c.id === editId) : null;
        window.selectedEmoji = cat ? cat.icon : '📦';

        Modal.open(editId ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle', `
            <div style="display:flex; flex-direction:column; gap:1.5rem">
                <div>
                    <label style="display:block; font-weight:700; color:#334155; margin-bottom:0.5rem">Kategori Adı</label>
                    <input id="new_cat_name" value="${cat ? cat.name : ''}" placeholder="Örn: Profil, Civata, Kutu..." style="width:100%; padding:0.8rem; border:1px solid #cbd5e1; border-radius:0.5rem; font-size:1rem">
                </div>
                <div>
                    <label style="display:block; font-weight:700; color:#334155; margin-bottom:0.5rem">Emoji Simgesi</label>
                    <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:0.5rem">
                        ${['📦', '🏗️', '🔩', '🔮', '⚙️', '🔌', '🧰', '🧵', '🪵', '📐', '🧪', '🛡️'].map(e => `
                            <button onclick="document.querySelectorAll('.emoji-btn').forEach(b => b.style.background='white'); this.style.background='#eff6ff'; window.selectedEmoji='${e}'" class="emoji-btn" style="font-size:1.5rem; padding:0.5rem; border:1px solid #e2e8f0; border-radius:0.5rem; background:${e === window.selectedEmoji ? '#eff6ff' : 'white'}; cursor:pointer; transition:all 0.1s">${e}</button>
                        `).join('')}
                    </div>
                </div>
                <button onclick="ProductLibraryModule.saveCategory('${editId || ''}')" class="btn-primary" style="padding:1rem">${editId ? 'Güncelle' : 'Oluştur'}</button>
            </div>
        `);
    },

    saveCategory: async (editId) => {
        const name = document.getElementById('new_cat_name').value;
        if (!name) return alert('Kategori adı giriniz.');

        if (editId && editId !== 'undefined' && editId !== 'null' && editId !== '') {
            const idx = DB.data.data.productCategories.findIndex(c => c.id === editId);
            if (idx !== -1) {
                DB.data.data.productCategories[idx] = { ...DB.data.data.productCategories[idx], name, icon: window.selectedEmoji };
            }
        } else {
            DB.data.data.productCategories.push({
                id: crypto.randomUUID(),
                name,
                icon: window.selectedEmoji || '📦'
            });
        }

        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    deleteCategory: async (id) => {
        if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
            DB.data.data.productCategories = DB.data.data.productCategories.filter(c => c.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    // --- EXTRUDER SPECIFIC LOGIC ---
    renderExtruderPage: (container) => {
        const { extruderTab, filters } = ProductLibraryModule.state;

        // Initial Defaults for Options - ROBUST MERGE
        if (!DB.data.meta.options) DB.data.meta.options = {};
        const defaults = {
            colors: ['Füme', 'Antrasit', 'Şeffaf', 'Beyaz'],
            diameters: [50, 60, 65, 70],
            thicknesses: [2, 3, 5],
            surfaces: ['Kabarcıksız', 'Kabarcıklı']
        };
        for (let k in defaults) {
            if (!DB.data.meta.options[k]) DB.data.meta.options[k] = defaults[k];
        }

        const opts = DB.data.meta.options;

        container.innerHTML = `
            <div style="max-width:1400px; margin:0 auto; font-family: 'Inter', sans-serif;">
                
                <!-- MAIN TITLE -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">ekstrüder <span style="font-weight:700">envanter</span></h1>
                </div>

                <!-- TABS & ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- TABS -->
                    <div style="display:flex; gap:1rem;">
                        <button onclick="ProductLibraryModule.setExtruderTab('ROD')" 
                            class="${extruderTab === 'ROD' ? 'active-tab' : 'inactive-tab'}">
                            çubuk
                        </button>
                        <button onclick="ProductLibraryModule.setExtruderTab('PIPE')" 
                            class="${extruderTab === 'PIPE' ? 'active-tab' : 'inactive-tab'}">
                            boru
                        </button>
                    </div>

                    <!-- SEARCH CAPSULES (Filters) -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         ${ProductLibraryModule.renderCapsule('çap ile ara', 'dia', opts.diameters)}
                         ${ProductLibraryModule.renderCapsule(extruderTab === 'ROD' ? 'yüzey ile ara' : 'kalınlık ile ara', extruderTab === 'ROD' ? 'surface' : 'thick', extruderTab === 'ROD' ? opts.surfaces : opts.thicknesses)}
                         ${ProductLibraryModule.renderCapsule('renk ile ara', 'color', opts.colors)}
                         
                         <!-- Length Capsule (Text Input) -->
                        <div class="search-capsule">
                            <input type="number" placeholder="boy ile ara" oninput="ProductLibraryModule.setFilter('len', this.value)" value="${filters.len || ''}">
                        </div>

                         <button class="search-btn" onclick="ProductLibraryModule.resetFilters()">temizle</button>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleExtruderForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <!-- STYLES -->
                <style>
                    .active-tab { padding:0.8rem 2rem; background:#1e293b; color:white; border-radius:1rem; font-weight:600; border:none; cursor:pointer; font-size:1rem; transition:all 0.2s; }
                    .inactive-tab { padding:0.8rem 2rem; background:white; color:#64748b; border:1px solid #e2e8f0; border-radius:1rem; font-weight:500; cursor:pointer; font-size:1rem; transition:all 0.2s; }
                    .inactive-tab:hover { border-color:#94a3b8; color:#334155; }

                    .search-capsule { border:1px solid #94a3b8; border-radius:1rem; padding:0 1rem; background:white; display:flex; align-items:center; height:46px; transition:all 0.2s }
                    .search-capsule:focus-within { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1) }
                    .search-capsule select, .search-capsule input { border:none; outline:none; font-size:0.95rem; color:#334155; font-weight:600; text-align:center; background:transparent; width:130px; appearance:none; cursor:pointer }
                    .search-capsule input { width:100px }
                    .search-btn { border:2px solid #1e293b; color:#1e293b; background:transparent; border-radius:1rem; padding:0 1.5rem; height:46px; font-weight:800; cursor:pointer; transition:all 0.2s; text-transform:uppercase; font-size:0.8rem }
                    .search-btn:hover { background:#1e293b; color:white }
                </style>

                <!-- LIST -->
                <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155" id="product_list_container">
                    ${ProductLibraryModule.renderProductList()}
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="extFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni Ekstrüder Ürünü Ekle</h3>
                         
                         <!-- Re-using existing check logic but presented better -->
                         <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-end">
                            ${ProductLibraryModule.renderInputGroup('çap / ebat', 'dia', opts.diameters, 'mm')}
                             <!-- Length Input for Form -->
                            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center;">
                                    <input type="number" placeholder="boy" oninput="ProductLibraryModule.setFilter('len', this.value)" value="${filters.len || ''}" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; text-align:center;">
                                    <span style="font-size:0.9rem; font-weight:600; color:#94a3b8; margin-left:0.25rem">mm</span>
                                </div>
                            </div>

                            ${extruderTab === 'ROD' ?
                    ProductLibraryModule.renderInputGroup('kabarcık', 'surface', opts.surfaces || ['Kabarcıksız', 'Kabarcıklı'], '') :
                    ProductLibraryModule.renderInputGroup('kalınlık', 'thick', opts.thicknesses, 'mm')
                }
                            
                            ${ProductLibraryModule.renderInputGroup('renk', 'color', opts.colors, '')}

                            <div style="margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem" id="duplicate_check_container">
                                ${ProductLibraryModule.renderDuplicateCheckButton()}
                            </div>
                         </div>
                    </div>
                ` : ''}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderCapsule: (placeholder, key, options) => {
        const val = ProductLibraryModule.state.filters[key];
        return `
            <div class="search-capsule" style="position:relative">
                <select onchange="ProductLibraryModule.setFilter('${key}', this.value)" style="width:100%; padding-right:1rem">
                    <option value="">${val ? val : placeholder}</option>
                    ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
                <i data-lucide="chevron-down" width="14" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
            </div>
        `;
    },

    toggleExtruderForm: () => {
        ProductLibraryModule.state.isFormVisible = !ProductLibraryModule.state.isFormVisible;
        // Clean filters when closing/opening to start fresh or keep context? 
        // Strategy: Keep filters as 'Form Data' since they are shared.
        UI.renderCurrentPage();
        if (ProductLibraryModule.state.isFormVisible) {
            setTimeout(() => {
                const el = document.getElementById('extFormSection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    },

    resetFilters: () => {
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' };
        UI.renderCurrentPage();
    },

    renderInputGroup: (label, key, options, unit) => {
        const val = ProductLibraryModule.state.filters[key];
        return `
            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                <button onclick="ProductLibraryModule.openOptionLibrary('${key}')" style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600">( + YÖNET ekle/sil )</button>
                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0.2rem 1rem; position:relative; height:56px; display:flex; align-items:center;">
                   <select onchange="ProductLibraryModule.setFilter('${key}', this.value)" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; appearance:none; cursor:pointer; text-align-last:center; padding-right:1rem">
                        <option value="">${label}</option>
                        ${options.map(o => `<option value="${o}" ${val == o ? 'selected' : ''}>${o}${unit ? ' ' + unit : ''}</option>`).join('')}
                   </select>
                   <i data-lucide="chevron-down" width="16" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
                </div>
            </div>
        `;
    },

    renderBubbleCheck: () => {
        // Deprecated //
        const val = ProductLibraryModule.state.filters.bubble;
        return `
             <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                <button style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600; opacity:0">.</button>
                <div onclick="ProductLibraryModule.toggleBubble()" style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center; justify-content:center; cursor:pointer; background:${val ? '#eff6ff' : 'transparent'}; border-color:${val ? '#3b82f6' : '#94a3b8'}">
                    <span style="font-size:1.1rem; font-weight:600; color:${val ? '#1d4ed8' : '#334155'}">kabarcık</span>
                    ${val ? '<i data-lucide="check" width="16" style="margin-left:0.5rem; color:#1d4ed8"></i>' : ''}
                </div>
            </div>
        `;
    },

    setExtruderTab: (t) => {
        ProductLibraryModule.state.extruderTab = t;
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' }; // Reset filters
        UI.renderCurrentPage();
    },

    setFilter: (key, val) => {
        ProductLibraryModule.state.filters[key] = val;

        // If updating 'len' (Length text input), DO NOT re-render the whole page.
        // Just update the dynamic parts (Button & List).
        if (key === 'len') {
            ProductLibraryModule.updateDynamicContent();
        } else {
            // For other dropdowns, full re-render is fine and safer to ensure all selects update
            UI.renderCurrentPage();
        }
    },

    updateDynamicContent: () => {
        const btnContainer = document.getElementById('duplicate_check_container');
        const listContainer = document.getElementById('product_list_container');

        if (btnContainer) btnContainer.innerHTML = ProductLibraryModule.renderDuplicateCheckButton();
        if (listContainer) listContainer.innerHTML = ProductLibraryModule.renderProductList();
    },

    renderDuplicateCheckButton: () => {
        const { extruderTab, filters } = ProductLibraryModule.state;
        const allProducts = DB.data.data.products || [];
        const exactMatchExp = allProducts.find(p =>
            p.category === 'Ekstrüder' &&
            p.type === extruderTab &&
            p.specs.diameter == filters.dia &&
            p.specs.length == filters.len &&
            p.specs.color === filters.color &&
            (extruderTab === 'ROD' ? (p.specs.surface === filters.surface) : (p.specs.thickness == filters.thick))
        );

        const isFilled = filters.dia && filters.len && filters.color && (extruderTab === 'PIPE' ? filters.thick : filters.surface);
        const isDuplicate = !!exactMatchExp;
        const btnDisabled = !isFilled || isDuplicate;
        const btnText = isDuplicate ? 'Zaten Mevcut!' : 'Ürün Ekle +';
        const btnStyle = isDuplicate ? 'background:#f1f5f9; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed' : (isFilled ? 'background:#10b981; color:white; border-color:#059669; cursor:pointer' : 'background:white; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed');

        return `
            ${isDuplicate ? '<div style="font-size:0.8rem; color:#ef4444; font-weight:700">⚠️ Bu kombinasyon zaten kayıtlı</div>' : ''}
            <button id="btnAddExtProduct" onclick="ProductLibraryModule.addExtruderProduct()" ${btnDisabled ? 'disabled' : ''} style="padding:1rem 3rem; border:2px solid; border-radius:1.5rem; font-size:1.1rem; font-weight:600; transition:all 0.2s; ${btnStyle}">
                ${btnText}
            </button>
        `;
    },

    renderProductList: () => {
        const { extruderTab, filters } = ProductLibraryModule.state;
        // Re-calculate filtered products locally
        const products = (DB.data.data.products || []).filter(p => p.category === 'Ekstrüder' && p.type === extruderTab);

        // SORTING: Diameter/Size (smart sort) -> Length (asc) -> Color (alpha)
        products.sort((a, b) => {
            // Use localeCompare with numeric:true to handle "20", "100", "40x40" correctly
            const valA = String(a.specs.diameter || '');
            const valB = String(b.specs.diameter || '');
            const diffDia = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
            if (diffDia !== 0) return diffDia;

            const diffLen = Number(a.specs.length) - Number(b.specs.length);
            if (diffLen !== 0) return diffLen;

            return (a.specs.color || '').localeCompare(b.specs.color || '', 'tr');
        });

        let filteredProducts = products;
        if (filters.dia) filteredProducts = filteredProducts.filter(p => p.specs.diameter == filters.dia);
        if (filters.len) filteredProducts = filteredProducts.filter(p => p.specs.length == filters.len);
        if (filters.color) filteredProducts = filteredProducts.filter(p => p.specs.color === filters.color);
        if (extruderTab === 'ROD' && filters.surface) filteredProducts = filteredProducts.filter(p => p.specs.surface === filters.surface);
        if (extruderTab === 'PIPE' && filters.thick) filteredProducts = filteredProducts.filter(p => p.specs.thickness == filters.thick);

        return `
            ${filteredProducts.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:3rem; font-size:1.2rem; font-weight:300">Bu kriterlerde ürün yok. Yeni ekleyebilirsiniz.</div>' : ''}
            
            ${filteredProducts.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:1.5rem 0; border-bottom:1px solid #64748b;">
                    <div style="font-size:1.2rem; color:#334155; font-weight:500">
                        ${ProductLibraryModule.formatProductTitle(p)}
                    </div>
                    <div style="display:flex; align-items:center; gap:3rem">
                        <div style="font-family:monospace; color:#64748b; font-size:1rem">ID; ${p.code || p.id.substring(0, 8)}</div>
                        <div style="display:flex; gap:0.5rem; align-items:center">
                            <button class="list-btn" onclick="ProductLibraryModule.editExtruderProduct('${p.id}')">düzenle</button>
                            <span style="color:#cbd5e1">/</span>
                            <button class="list-btn" onclick="ProductLibraryModule.deleteExtruderProduct('${p.id}')">sil</button>
                        </div>
                        <input type="checkbox" style="width:1.5rem; height:1.5rem; border:2px solid #94a3b8; border-radius:0.4rem; cursor:pointer">
                        <span style="color:#64748b; font-size:0.9rem">seç</span>
                    </div>
                </div>
            `).join('')}
         `;
    },

    toggleBubble: () => {
        // Deprecated //
    },

    formatProductTitle: (p) => {
        let text = `Çap ${p.specs.diameter} mm / boy ${p.specs.length} mm`;
        if (p.specs.thickness) text += ` / ${p.specs.thickness} mm`;
        if (p.specs.surface) text += ` / ${p.specs.surface}`;
        // Backward comp for bubble boolean if needed
        else if (p.specs.bubble) text += ` / kabarcıklı`;

        text += ` / ${p.specs.color} renk`;
        return text;
    },

    manageOption: (key) => {
        // Renaming/Routing to new Modal System
        ProductLibraryModule.openOptionLibrary(key);
    },

    openOptionLibrary: (key) => {
        const mapping = {
            dia: { t: 'Çap Kütüphanesi', i: 'circle-dashed', k: 'diameters' },
            thick: { t: 'Kalınlık Kütüphanesi', i: 'layers', k: 'thicknesses' },
            color: { t: 'Renk Kütüphanesi', i: 'palette', k: 'colors' },
            surface: { t: 'Yüzey Tipi Kütüphanesi', i: 'scan-line', k: 'surfaces' },
            // Hardware Mappings
            hardwareShapes: { t: 'Şekil Kütüphanesi', i: 'shapes', k: 'hardwareShapes' },
            hardwareDias: { t: 'Çap Kütüphanesi', i: 'circle-dashed', k: 'hardwareDias' },
            hardwareMaterials: { t: 'Malzeme Kütüphanesi', i: 'layers', k: 'hardwareMaterials' },
            hardwareLengths: { t: 'Boy Kütüphanesi', i: 'ruler', k: 'hardwareLengths' },
            // Aluminum Mappings
            aluAnodized: { t: 'Eloksal Renk Kütüphanesi', i: 'palette', k: 'aluAnodized' },
            aluPainted: { t: 'Boya Renk Kütüphanesi', i: 'palette', k: 'aluPainted' },
            aluLengths: { t: 'Profil Boyu Kütüphanesi', i: 'ruler', k: 'aluLengths' }
        };
        const conf = mapping[key];
        if (!conf) return;

        // Ensure array exists
        if (!DB.data.meta.options[conf.k]) DB.data.meta.options[conf.k] = [];
        const items = DB.data.meta.options[conf.k];

        const modalHtml = `
            <div id="libModal_${key}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:420px; border-radius:1.5rem; padding:1.5rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); animation: zoomIn 0.2s; font-family:'Inter',sans-serif">
                    
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                        <h3 style="font-weight:800; color:#334155; display:flex; align-items:center; gap:0.5rem; font-size:1.1rem">
                            <i data-lucide="${conf.i}" color="#8b5cf6" width="22"></i> ${conf.t}
                        </h3>
                        <button onclick="document.getElementById('libModal_${key}').remove(); UI.renderCurrentPage()" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:0.2rem"><i data-lucide="x" width="22"></i></button>
                    </div>

                    <!-- Add New -->
                    <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem">
                        <input id="newLibItemInput" placeholder="Yeni değer..." onkeydown="if(event.key==='Enter') ProductLibraryModule.addLibraryItem('${key}')" style="flex:1; padding:0.75rem 1rem; border:2px solid #e2e8f0; border-radius:0.75rem; font-weight:600; color:#475569; outline:none; font-size:0.95rem; transition:border-color 0.2s" onfocus="this.style.borderColor='#a78bfa'" onblur="this.style.borderColor='#e2e8f0'">
                        <button onclick="ProductLibraryModule.addLibraryItem('${key}')" style="background:#8b5cf6; color:white; border:none; padding:0 1.5rem; border-radius:0.75rem; font-weight:700; cursor:pointer; box-shadow:0 4px 6px -1px rgba(139, 92, 246, 0.4); transition:transform 0.1s" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">Ekle</button>
                    </div>

                    <!-- List -->
                    <div style="max-height:350px; overflow-y:auto; display:flex; flex-direction:column; gap:0.6rem; padding-right:0.5rem">
                        ${items.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:1.5rem; font-style:italic">Liste boş.</div>' : ''}
                        
                        ${items.map(item => `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.8rem 1rem; border-radius:0.75rem; border:1px solid #f1f5f9; group">
                                <div style="display:flex; align-items:center; gap:0.75rem">
                                    ${key === 'color' ? `<div style="width:18px; height:18px; border-radius:50%; border:1px solid #cbd5e1; background:${ProductLibraryModule.getColorCode(item)}"></div>` : '<i data-lucide="hash" width="14" style="color:#cbd5e1"></i>'}
                                    <span style="font-weight:700; color:#475569; font-size:0.95rem;">${item}</span>
                                </div>
                                <div style="display:flex; gap:0.25rem">
                                    <button title="Düzenle" onclick="ProductLibraryModule.editLibraryItem('${key}', '${item}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:0.3rem" onmouseover="this.style.color='#64748b'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="pencil" width="16"></i></button>
                                    <button title="Sil" onclick="ProductLibraryModule.deleteLibraryItem('${key}', '${item}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:0.3rem" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="trash-2" width="16"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top:1.5rem; text-align:center; font-size:0.75rem; color:#cbd5e1; font-weight:500">
                        Değişiklikler anında kaydedilir.
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        document.getElementById('newLibItemInput').focus();
    },

    getColorCode: (c) => {
        const map = { 'Siyah': '#000', 'Beyaz': '#fff', 'Şeffaf': 'transparent', 'Antrasit': '#374151', 'Füme': '#525252', 'Gri': '#9ca3af', 'Kırmızı': '#ef4444', 'Sarı': '#facc15', 'Mavi': '#3b82f6' };
        return map[c] || '#cbd5e1';
    },

    addLibraryItem: async (key) => {
        const inp = document.getElementById('newLibItemInput');
        let val = inp.value.trim();
        if (!val) return;

        // Mapping to get array key
        const mapping = {
            dia: 'diameters', thick: 'thicknesses', color: 'colors', surface: 'surfaces',
            hardwareShapes: 'hardwareShapes', hardwareDias: 'hardwareDias', hardwareLengths: 'hardwareLengths', hardwareMaterials: 'hardwareMaterials',
            aluAnodized: 'aluAnodized', aluPainted: 'aluPainted', aluLengths: 'aluLengths'
        };
        const metaKey = mapping[key];
        const current = DB.data.meta.options[metaKey];

        // Type conversion (Strict for Thickness only, Smart for Dia)
        if (key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') {
            if (isNaN(Number(val))) return alert('Lütfen sayısal bir değer giriniz.');
            val = Number(val);
        } else if (key === 'dia') {
            // Keep as number if it's a pure number, otherwise string (for 40x40)
            if (!isNaN(Number(val)) && val.trim() !== '') {
                val = Number(val);
            }
        }

        if (current.includes(val)) {
            alert('Bu değer zaten listede var.');
            return;
        }

        current.push(val);
        // Sort if number
        if (typeof val === 'number') current.sort((a, b) => a - b);

        await DB.save();

        // Refresh Modal
        document.getElementById(`libModal_${key}`).remove();
        ProductLibraryModule.openOptionLibrary(key);
    },

    deleteLibraryItem: async (key, itemVal) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;

        const mapping = {
            dia: 'diameters', thick: 'thicknesses', color: 'colors', surface: 'surfaces',
            hardwareShapes: 'hardwareShapes', hardwareDias: 'hardwareDias', hardwareLengths: 'hardwareLengths', hardwareMaterials: 'hardwareMaterials'
        };
        const metaKey = mapping[key];
        let current = DB.data.meta.options[metaKey];

        // Type check for filtering
        if (key === 'dia' || key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') itemVal = Number(itemVal);

        DB.data.meta.options[metaKey] = current.filter(x => x !== itemVal);
        await DB.save();

        // Refresh Modal
        document.getElementById(`libModal_${key}`).remove();
        ProductLibraryModule.openOptionLibrary(key);
    },

    editLibraryItem: async (key, oldVal) => {
        const mapping = {
            dia: 'diameters', thick: 'thicknesses', color: 'colors', surface: 'surfaces',
            hardwareShapes: 'hardwareShapes', hardwareDias: 'hardwareDias', hardwareLengths: 'hardwareLengths', hardwareMaterials: 'hardwareMaterials'
        };
        const metaKey = mapping[key];
        const current = DB.data.meta.options[metaKey];

        const newVal = prompt("Yeni değeri giriniz:", oldVal);
        if (!newVal || newVal == oldVal) return;

        let processedVal = newVal.trim();

        if (key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths') {
            if (isNaN(Number(processedVal))) return alert('Lütfen sayısal bir değer giriniz.');
            processedVal = Number(processedVal);
        } else if (key === 'dia') {
            // Smart type for dia
            if (!isNaN(Number(processedVal)) && processedVal.trim() !== '') {
                processedVal = Number(processedVal);
            }
        }

        // Update in place
        const idx = current.indexOf(key === 'dia' || key === 'thick' || key === 'hardwareDias' || key === 'hardwareLengths' ? Number(oldVal) : oldVal);
        if (idx !== -1) {
            current[idx] = processedVal;
            if (typeof processedVal === 'number') current.sort((a, b) => a - b);
            await DB.save();
            // Refresh Modal
            document.getElementById(`libModal_${key}`).remove();
            ProductLibraryModule.openOptionLibrary(key);
        }
    },

    // --- HARDWARE (CIVATA & HIRDAVAT) SPECIFIC LOGIC ---
    renderHardwarePage: (container) => {
        const { hardwareFilters } = ProductLibraryModule.state;

        // Initial Defaults
        if (!DB.data.meta.options) DB.data.meta.options = {};
        const defaults = {
            hardwareShapes: ['Havşa Baş', 'Anahtar Baş', 'İnbus', 'Havşa Baş İnbus', 'Gijon Saplama', 'Somun', 'Pul', 'Kelebek Somun', 'Akıllı Vida'],
            hardwareDias: ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20', '3.9', '4.2', '4.8'],
            hardwareMaterials: ['Siyah', 'Galvaniz', 'Paslanmaz', 'İnox', 'Pirinç']
        };
        for (let k in defaults) {
            if (!DB.data.meta.options[k]) DB.data.meta.options[k] = defaults[k];
        }
        const opts = DB.data.meta.options;

        // Filter Products
        if (!DB.data.data.products) DB.data.data.products = [];
        let products = DB.data.data.products.filter(p => p.category === 'Hardware');

        // Client-side Filtering
        let filteredProducts = products;
        if (hardwareFilters.shape) filteredProducts = filteredProducts.filter(p => p.specs.shape === hardwareFilters.shape);
        if (hardwareFilters.dia) filteredProducts = filteredProducts.filter(p => p.specs.diameter === hardwareFilters.dia);
        if (hardwareFilters.len) filteredProducts = filteredProducts.filter(p => p.specs.length == hardwareFilters.len);
        if (hardwareFilters.mat) filteredProducts = filteredProducts.filter(p => p.specs.material === hardwareFilters.mat);

        // Sorting
        filteredProducts.sort((a, b) => {
            const shapeA = a.specs.shape || '';
            const shapeB = b.specs.shape || '';
            if (shapeA !== shapeB) return shapeA.localeCompare(shapeB, 'tr');

            const diaA = String(a.specs.diameter || '');
            const diaB = String(b.specs.diameter || '');
            const diffDia = diaA.localeCompare(diaB, undefined, { numeric: true, sensitivity: 'base' });
            if (diffDia !== 0) return diffDia;

            return Number(a.specs.length || 0) - Number(b.specs.length || 0);
        });

        container.innerHTML = `
            <div style="max-width:1400px; margin:0 auto; font-family: 'Inter', sans-serif;">
                <!-- MAIN TITLE -->
                <div style="text-align:center; margin-bottom:3rem; position:relative">
                    <h1 style="font-size:2.5rem; color:#1e293b; letter-spacing:-0.03em; font-weight:300;">hırdavat & <span style="font-weight:700">bağlantı elemanları</span></h1>
                </div>

                <!-- ACTIONS ROW -->
                <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; margin-bottom:3rem; justify-content:space-between">
                     <!-- SEARCH CAPSULES -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; flex:1; justify-content:center">
                         ${ProductLibraryModule.renderHardwareCapsule('şekil ile ara', 'shape', opts.hardwareShapes)}
                         ${ProductLibraryModule.renderHardwareCapsule('çap ile ara', 'dia', opts.hardwareDias)}

                         <!-- Length Capsule -->
                        <div class="search-capsule">
                            <input type="number" placeholder="boy ile ara" oninput="ProductLibraryModule.setHardwareFilter('len', this.value)" value="${hardwareFilters.len || ''}">
                        </div>

                         ${ProductLibraryModule.renderHardwareCapsule('malzeme ile ara', 'mat', opts.hardwareMaterials)}

                         <button class="search-btn" onclick="ProductLibraryModule.resetHardwareFilters()">temizle</button>
                    </div>

                    <!-- ADD BUTTON -->
                    <div style="flex-shrink:0">
                        ${(ProductLibraryModule.state.isFormVisible) ?
                `<button onclick="ProductLibraryModule.toggleHardwareForm()" class="btn-primary" style="background:#ef4444; padding:0.8rem 2rem; border-radius:1rem">İptal</button>`
                :
                `<button onclick="ProductLibraryModule.toggleHardwareForm()" class="btn-primary" style="padding:0.8rem 2rem; border-radius:1rem; font-size:1rem; box-shadow:0 4px 10px rgba(0,0,0,0.05)">Ürün ekle +</button>`
            }
                    </div>
                </div>

                <!-- STYLES -->
                <style>
                    .search-capsule { border:1px solid #94a3b8; border-radius:1rem; padding:0 1rem; background:white; display:flex; align-items:center; height:46px; transition:all 0.2s }
                    .search-capsule:focus-within { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1) }
                    .search-capsule select, .search-capsule input { border:none; outline:none; font-size:0.95rem; color:#334155; font-weight:600; text-align:center; background:transparent; width:130px; appearance:none; cursor:pointer }
                    .search-capsule input { width:100px }
                    .search-btn { border:2px solid #1e293b; color:#1e293b; background:transparent; border-radius:1rem; padding:0 1.5rem; height:46px; font-weight:800; cursor:pointer; transition:all 0.2s; text-transform:uppercase; font-size:0.8rem }
                    .search-btn:hover { background:#1e293b; color:white }
                </style>

                <!-- LIST -->
                <div style="display:flex; flex-direction:column; gap:0; border-top:2px solid #334155" id="hw_list_container">
                    ${ProductLibraryModule.renderHardwareList(filteredProducts)}
                </div>

                <!-- ADD FORM (CONDITIONAL) -->
                ${(ProductLibraryModule.state.isFormVisible) ? `
                    <div id="hwFormSection" style="margin-top:4rem; background:white; border:2px solid #e2e8f0; border-radius:2rem; padding:3rem; position:relative; box-shadow:0 20px 40px -10px rgba(0,0,0,0.05); animation: slideDown 0.3s ease-out">
                         <h3 style="font-size:1.5rem; color:#334155; margin-bottom:2rem; font-weight:700">Yeni Hırdavat/Cıvata Ekle</h3>

                         <div style="display:flex; gap:2rem; flex-wrap:wrap; align-items:flex-end">
                            ${ProductLibraryModule.renderHardwareInputGroup('civata şekli', 'shape', opts.hardwareShapes, '')}
                            ${ProductLibraryModule.renderHardwareInputGroup('çap / ebat', 'dia', opts.hardwareDias, '')}

                             <!-- Length Input for Form -->
                            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0 1rem; height:56px; display:flex; align-items:center;">
                                    <input type="number" placeholder="boy" oninput="ProductLibraryModule.setHardwareFilter('len', this.value)" value="${hardwareFilters.len || ''}" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; text-align:center;">
                                    <span style="font-size:0.9rem; font-weight:600; color:#94a3b8; margin-left:0.25rem">mm</span>
                                </div>
                            </div>

                            ${ProductLibraryModule.renderHardwareInputGroup('malzeme cinsi', 'mat', opts.hardwareMaterials, '')}

                            <div style="margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem">
                                <button onclick="ProductLibraryModule.addHardwareProduct()" class="btn-primary" style="padding:1rem 3rem; border-radius:1.5rem; font-size:1.1rem; font-weight:600">
                                    ÜRÜNÜ EKLE +
                                </button>
                            </div>
                         </div>
                    </div>
                ` : ''}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    renderHardwareCapsule: (placeholder, key, options) => {
        const val = ProductLibraryModule.state.hardwareFilters[key];
        return `
            <div class="search-capsule" style="position:relative">
                <select onchange="ProductLibraryModule.setHardwareFilter('${key}', this.value)" style="width:100%; padding-right:1rem">
                    <option value="">${val ? val : placeholder}</option>
                    ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
                <i data-lucide="chevron-down" width="14" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
            </div>
        `;
    },

    renderHardwareInputGroup: (label, key, options, unit) => {
        const val = ProductLibraryModule.state.hardwareFilters[key];
        return `
            <div style="display:flex; flex-direction:column; gap:0.5rem; min-width:140px;">
                 <button onclick="ProductLibraryModule.openOptionLibrary('${key === 'shape' ? 'hardwareShapes' : (key === 'dia' ? 'hardwareDias' : 'hardwareMaterials')}')" style="font-size:0.65rem; color:#3b82f6; text-align:center; background:none; border:none; cursor:pointer; font-weight:600">( + YÖNET ekle/sil )</button>
                <div style="border:2px solid #94a3b8; border-radius:1.5rem; padding:0.2rem 1rem; position:relative; height:56px; display:flex; align-items:center;">
                   <select onchange="ProductLibraryModule.setHardwareFilter('${key}', this.value)" style="width:100%; border:none; background:transparent; font-size:1.1rem; color:#334155; font-weight:600; outline:none; appearance:none; cursor:pointer; text-align-last:center; padding-right:1rem">
                        <option value="">${label.toUpperCase()}</option>
                        ${options.map(o => `<option value="${o}" ${val == o ? 'selected' : ''}>${o}${unit ? ' ' + unit : ''}</option>`).join('')}
                   </select>
                   <i data-lucide="chevron-down" width="16" style="position:absolute; right:10px; pointer-events:none; color:#94a3b8"></i>
                </div>
            </div>
         `;
    },

    setHardwareFilter: (key, val) => {
        ProductLibraryModule.state.hardwareFilters[key] = val;
        UI.renderCurrentPage();
    },

    resetHardwareFilters: () => {
        ProductLibraryModule.state.hardwareFilters = { shape: '', dia: '', len: '', mat: '' };
        UI.renderCurrentPage();
    },

    toggleHardwareForm: () => {
        ProductLibraryModule.state.isFormVisible = !ProductLibraryModule.state.isFormVisible;
        UI.renderCurrentPage();
        if (ProductLibraryModule.state.isFormVisible) {
            setTimeout(() => {
                const el = document.getElementById('hwFormSection');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    },

    renderHardwareList: (products) => {
        if (products.length === 0) return '<div style="text-align:center; color:#cbd5e1; padding:3rem; font-size:1.2rem; font-weight:300">Bu kriterlerde ürün yok. Yeni ekleyebilirsiniz.</div>';

        return products.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:1.5rem 0; border-bottom:1px solid #64748b;">
                <div style="font-size:1.2rem; color:#334155; font-weight:500; display:flex; gap:1rem; align-items:baseline">
                    <span style="font-weight:700">${p.specs.shape}</span>
                    <span>${p.specs.diameter}${p.specs.length ? ' x ' + p.specs.length + ' mm' : ''}</span>
                    <span style="color:#64748b; font-size:1rem">/ ${p.specs.material}</span>
                </div>
                <div style="display:flex; align-items:center; gap:3rem">
                    <div style="font-family:monospace; color:#3b82f6; font-size:0.9rem; font-weight:600">ID: ${p.code || '---'}</div>
                    <div style="display:flex; gap:0.5rem; align-items:center">
                        <button class="list-btn" onclick="ProductLibraryModule.editHardwareProduct('${p.id}')">düzenle</button>
                        <span style="color:#cbd5e1">/</span>
                        <button class="list-btn" onclick="ProductLibraryModule.deleteHardwareProduct('${p.id}')">sil</button>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem; border-left:1px solid #e2e8f0; padding-left:1rem; margin-left:1rem">
                        <input type="checkbox" style="width:1.5rem; height:1.5rem; border:2px solid #94a3b8; border-radius:0.4rem; cursor:pointer">
                        <span style="color:#64748b; font-size:0.9rem">seç</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    addHardwareProduct: async () => {
        const { hardwareFilters } = ProductLibraryModule.state;
        // Validation
        if (!hardwareFilters.shape || !hardwareFilters.dia || !hardwareFilters.mat) {
            alert("Lütfen Şekil, Çap ve Malzeme seçiniz.");
            return;
        }

        // Auto Generate ID Logic
        // Map Shape
        const shapeMap = {
            'Havşa Baş': 'HB', 'Anahtar Baş': 'AB', 'İnbus': 'INB', 'Havşa Baş İnbus': 'HBI',
            'Gijon Saplama': 'GSP', 'Somun': 'SOM', 'Pul': 'PUL', 'Kelebek Somun': 'KLB', 'Akıllı Vida': 'AKL'
        };
        const matMap = { 'Siyah': 'SYH', 'Galvaniz': 'GLV', 'Paslanmaz': 'PSL', 'İnox': 'INOX', 'Pirinç': 'PRC' };

        const sCode = shapeMap[hardwareFilters.shape] || hardwareFilters.shape.substring(0, 3).toUpperCase();
        const mCode = matMap[hardwareFilters.mat] || hardwareFilters.mat.substring(0, 3).toUpperCase();
        const dia = hardwareFilters.dia.replace('.', ''); // Remove dots in dia
        const len = hardwareFilters.len || '00';
        const suffix = Math.floor(Math.random() * 1000).toString().padStart(4, '0');

        const code = `${sCode}-${dia}-${len}-${mCode}-${suffix}`;

        const newProduct = {
            id: crypto.randomUUID(),
            category: 'Hardware',
            type: 'Cıvata',
            name: `${hardwareFilters.shape} ${hardwareFilters.dia} ${hardwareFilters.len ? 'x ' + hardwareFilters.len : ''}`,
            code: code,
            specs: {
                shape: hardwareFilters.shape,
                diameter: hardwareFilters.dia,
                length: hardwareFilters.len,
                material: hardwareFilters.mat
            },
            created_at: new Date().toISOString()
        };

        if (!DB.data.data.products) DB.data.data.products = [];
        DB.data.data.products.push(newProduct);
        await DB.save();

        ProductLibraryModule.state.hardwareFilters = { shape: '', dia: '', len: '', mat: '' };
        ProductLibraryModule.state.isFormVisible = false;
        UI.renderCurrentPage();
    },

    deleteHardwareProduct: async (id) => {
        if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            DB.data.data.products = DB.data.data.products.filter(p => p.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    editHardwareProduct: (id) => {
        const p = DB.data.data.products.find(x => x.id === id);
        if (!p) return;

        ProductLibraryModule.state.hardwareFilters = {
            shape: p.specs.shape,
            dia: p.specs.diameter,
            len: p.specs.length || '',
            mat: p.specs.material
        };

        ProductLibraryModule.state.isFormVisible = true;
        UI.renderCurrentPage();
        setTimeout(() => {
            const el = document.getElementById('hwFormSection');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            alert("Ürün bilgileri forma yüklendi. Düzenleyip 'Ürün Ekle' diyerek yeni bir kayıt oluşturabilirsiniz.");
        }, 50);
    },

    addExtruderProduct: async () => {
        const { extruderTab, filters } = ProductLibraryModule.state;

        // Validate required fields based on Tab
        if (!filters.dia || !filters.len || !filters.color) {
            alert("Lütfen çap, boy ve renk seçiniz.");
            return;
        }
        if (extruderTab === 'PIPE' && !filters.thick) {
            alert("Lütfen kalınlık seçiniz.");
            return;
        }
        if (extruderTab === 'ROD' && !filters.surface) {
            alert("Lütfen yüzey tipi seçiniz.");
            return;
        }

        // Generate ID / Code
        const typeCode = extruderTab === 'ROD' ? 'CB' : 'BR'; // CB: Çubuk, BR: Boru
        const specCode = `${filters.dia}-${filters.len}-${filters.color.substring(0, 3).toUpperCase()}`;
        const uniqueSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const code = `${typeCode}-${specCode}-${uniqueSuffix}`;

        const newProduct = {
            id: crypto.randomUUID(),
            category: 'Ekstrüder',
            type: extruderTab,
            name: `${filters.dia}mm ${extruderTab === 'ROD' ? 'Çubuk' : 'Boru'}`,
            code: code,
            specs: {
                diameter: filters.dia,
                length: filters.len,
                color: filters.color,
                thickness: filters.thick || null,
                surface: filters.surface || null,
                // bubble: filters.surface === 'Kabarcıklı' // Keep backward compat logic if needed - REMOVED
            },
            created_at: new Date().toISOString()
        };

        if (!DB.data.data.products) DB.data.data.products = [];
        DB.data.data.products.push(newProduct);
        await DB.save();

        // Reset Inputs after successful add
        ProductLibraryModule.state.filters = { dia: '', len: '', thick: '', color: '', surface: '' };
        ProductLibraryModule.state.isFormVisible = false; // Close form
        UI.renderCurrentPage();
    },

    deleteExtruderProduct: async (id) => {
        if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            DB.data.data.products = DB.data.data.products.filter(p => p.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    editExtruderProduct: async (id) => {
        // Simplified Edit: Just delete and ask to re-add for now, or populate filters?
        // Populating filters is better
        const p = DB.data.data.products.find(x => x.id === id);
        if (!p) return;

        ProductLibraryModule.state.extruderTab = p.type;
        ProductLibraryModule.state.filters = {
            dia: p.specs.diameter,
            len: p.specs.length,
            color: p.specs.color,
            thick: p.specs.thickness || '',
            surface: p.specs.surface || (p.specs.bubble ? 'Kabarcıklı' : 'Kabarcıksız')
        };
        // We should probably delete the old one if they click "Update" but we only have "Add" button right now.
        // For Prototype, let's just populate the fields so they can add a NEW similar one or delete the old one.
        // Open Form
        ProductLibraryModule.state.isFormVisible = true;
        UI.renderCurrentPage();

        setTimeout(() => {
            const el = document.getElementById('extFormSection');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            alert("Ürün özellikleri forma aktarıldı. Düzenleyip 'Ürün Ekle' diyerek yeni bir kayıt oluşturabilirsiniz.");
        }, 100);
    }
};






