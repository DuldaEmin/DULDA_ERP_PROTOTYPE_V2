const PersonnelModule = {
    state: {
        search: '',
        filterUnitId: 'all',
        filterStatus: 'all'
    },

    permissionOps: ['view', 'create', 'edit', 'delete', 'approve'],

    permissionLabels: {
        view: 'Gorme',
        create: 'Ekleme',
        edit: 'Duzenleme',
        delete: 'Silme',
        approve: 'Onaylama'
    },

    moduleDefs: [
        { id: 'planlama', label: 'Planlama', icon: 'calendar' },
        { id: 'purchasing', label: 'Satin Alma', icon: 'shopping-cart' },
        { id: 'sales', label: 'Satis', icon: 'shopping-bag' },
        { id: 'stock', label: 'Depo & Stok', icon: 'package' },
        { id: 'units', label: 'Birimler & Atolyeler', icon: 'hammer' },
        { id: 'products', label: 'Urun ve Parca', icon: 'boxes' },
        { id: 'personnel', label: 'Personel', icon: 'users' },
        { id: 'settings', label: 'Ayarlar', icon: 'settings' }
    ],

    permissionUnitSeed: [
        { id: 'u1', name: 'CNC ATOLYESI' },
        { id: 'u2', name: 'EKSTRUDER ATOLYESI' },
        { id: 'u3', name: 'MONTAJ' },
        { id: 'u5', name: 'PLEKSI POLISAJ ATOLYESI' },
        { id: 'u7', name: 'TESTERE ATOLYESI' },
        { id: 'u_dtm', name: 'DEPO TRANSFER' }
    ],

    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),

    normalize: (value) => String(value || '').trim().toLocaleLowerCase('tr-TR'),

    slugify: (value) => String(value || '')
        .trim()
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, ''),

    getInternalUnits: () => (DB.data?.data?.units || [])
        .filter((row) => String(row?.type || '') === 'internal')
        .filter((row) => String(row?.id || '') !== 'u_dtm'),

    getPermissionUnits: () => {
        const merged = new Map();
        PersonnelModule.permissionUnitSeed.forEach((unit) => {
            merged.set(String(unit.id || ''), { ...unit, type: 'internal' });
        });
        (DB.data?.data?.units || [])
            .filter((row) => String(row?.type || '') === 'internal')
            .forEach((row) => {
                const unitId = String(row?.id || '').trim();
                if (!unitId) return;
                merged.set(unitId, {
                    id: unitId,
                    name: String(row?.name || merged.get(unitId)?.name || '-').trim(),
                    type: 'internal'
                });
            });
        return Array.from(merged.values());
    },

    getAssignedUnitIds: (person) => {
        if (Array.isArray(person?.assignedUnitIds) && person.assignedUnitIds.length > 0) {
            return person.assignedUnitIds.map((row) => String(row || '')).filter(Boolean);
        }
        if (person?.unitId) return [String(person.unitId)];
        return [];
    },

    getUnitNameMap: () => new Map(PersonnelModule.getInternalUnits().map((row) => [String(row.id || ''), row.name || '-'])),

    getAssignedUnitNames: (person) => {
        const unitMap = PersonnelModule.getUnitNameMap();
        const names = PersonnelModule.getAssignedUnitIds(person)
            .map((unitId) => String(unitMap.get(unitId) || '').trim())
            .filter(Boolean);
        return names.length > 0 ? names : ['-'];
    },

    getEmptyPermissionSet: () => PersonnelModule.permissionOps.reduce((acc, op) => {
        acc[op] = false;
        return acc;
    }, {}),

    getFullPermissionSet: () => PersonnelModule.permissionOps.reduce((acc, op) => {
        acc[op] = true;
        return acc;
    }, {}),

    normalizePermissionSet: (value) => PersonnelModule.permissionOps.reduce((acc, op) => {
        acc[op] = !!value?.[op];
        return acc;
    }, {}),

    buildDefaultModulePermissions: () => PersonnelModule.moduleDefs.reduce((acc, mod) => {
        acc[mod.id] = PersonnelModule.getEmptyPermissionSet();
        return acc;
    }, {}),

    buildDefaultUnitPermissions: () => PersonnelModule.getPermissionUnits().reduce((acc, unit) => {
        const unitId = String(unit?.id || '').trim();
        if (unitId) acc[unitId] = PersonnelModule.getEmptyPermissionSet();
        return acc;
    }, {}),

    buildPermissionsFromRole: (rolePreset) => {
        const role = String(rolePreset || 'operator');
        const permissions = PersonnelModule.buildDefaultModulePermissions();
        if (role === 'tam_yetkili') {
            PersonnelModule.moduleDefs.forEach((mod) => {
                permissions[mod.id] = PersonnelModule.getFullPermissionSet();
            });
        }
        return permissions;
    },

    buildUnitPermissionsFromRole: (rolePreset) => {
        const role = String(rolePreset || 'operator');
        const permissions = PersonnelModule.buildDefaultUnitPermissions();
        if (role === 'tam_yetkili') {
            Object.keys(permissions).forEach((unitId) => {
                permissions[unitId] = PersonnelModule.getFullPermissionSet();
            });
        }
        return permissions;
    },

    hasAnyPermission: (value) => PersonnelModule.permissionOps.some((op) => !!value?.[op]),

    normalizeModulePermissions: (value) => {
        const normalized = PersonnelModule.buildDefaultModulePermissions();
        PersonnelModule.moduleDefs.forEach((mod) => {
            normalized[mod.id] = PersonnelModule.normalizePermissionSet(value?.[mod.id]);
        });
        return normalized;
    },

    normalizeUnitPermissions: (value) => {
        const normalized = PersonnelModule.buildDefaultUnitPermissions();
        PersonnelModule.getPermissionUnits().forEach((unit) => {
            const unitId = String(unit?.id || '').trim();
            if (!unitId) return;
            normalized[unitId] = PersonnelModule.normalizePermissionSet(value?.[unitId]);
        });
        return normalized;
    },

    cloneUnitPermissionSet: (permissionSet) => {
        const normalized = PersonnelModule.normalizePermissionSet(permissionSet);
        const next = PersonnelModule.buildDefaultUnitPermissions();
        Object.keys(next).forEach((unitId) => {
            next[unitId] = { ...normalized };
        });
        return next;
    },

    aggregateUnitPermissions: (value) => {
        const aggregated = PersonnelModule.getEmptyPermissionSet();
        const unitPermissions = PersonnelModule.normalizeUnitPermissions(value);
        Object.values(unitPermissions).forEach((permissionSet) => {
            PersonnelModule.permissionOps.forEach((op) => {
                if (permissionSet?.[op]) aggregated[op] = true;
            });
        });
        return aggregated;
    },

    getUnitPermissionsForPerson: (person) => {
        if (person?.unitPermissions && typeof person.unitPermissions === 'object' && !Array.isArray(person.unitPermissions)) {
            return PersonnelModule.normalizeUnitPermissions(person.unitPermissions);
        }
        const legacyUnitPermissions = PersonnelModule.normalizePermissionSet(person?.modulePermissions?.units);
        if (PersonnelModule.hasAnyPermission(legacyUnitPermissions)) {
            return PersonnelModule.cloneUnitPermissionSet(legacyUnitPermissions);
        }
        if (String(person?.rolePreset || '') === 'tam_yetkili') {
            return PersonnelModule.buildUnitPermissionsFromRole('tam_yetkili');
        }
        return PersonnelModule.buildDefaultUnitPermissions();
    },

    getLegacyPermissions: (person) => {
        const legacy = person?.permissions || {};
        return {
            production: !!legacy.production,
            waste: !!legacy.waste,
            admin: !!legacy.admin
        };
    },

    getRoleLabel: (person) => String(person?.rolePreset || '') === 'tam_yetkili' ? 'Tam Yetkili' : 'Operator',

    syncLegacyPermissions: (person) => {
        const stockPerms = person?.modulePermissions?.stock || {};
        const unitPerms = person?.modulePermissions?.units || {};
        person.permissions = {
            production: !!(unitPerms.create || unitPerms.edit || unitPerms.approve),
            waste: !!stockPerms.approve,
            admin: String(person?.rolePreset || '') === 'tam_yetkili'
        };
    },

    makePersonCode: () => {
        const used = new Set((DB.data?.data?.personnel || []).map((row) => String(row?.personCode || '')));
        let seq = 1;
        while (true) {
            const candidate = `PER-${String(seq).padStart(6, '0')}`;
            if (!used.has(candidate)) return candidate;
            seq += 1;
        }
    },

    makeUsername: (fullName, currentPersonId = '') => {
        const base = PersonnelModule.slugify(fullName) || 'kullanici';
        const used = new Set((DB.data?.data?.personnel || [])
            .filter((row) => String(row?.id || '') !== String(currentPersonId || ''))
            .map((row) => String(row?.username || '').trim().toLocaleLowerCase('tr-TR'))
            .filter(Boolean));
        if (!used.has(base)) return base;
        let index = 2;
        while (used.has(`${base}${index}`)) index += 1;
        return `${base}${index}`;
    },

    ensureData: () => {
        if (!DB.data || typeof DB.data !== 'object') DB.data = {};
        if (!DB.data.data || typeof DB.data.data !== 'object') DB.data.data = {};
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.seedFlags || typeof DB.data.meta.seedFlags !== 'object') DB.data.meta.seedFlags = {};
        if (!Array.isArray(DB.data.data.personnel)) DB.data.data.personnel = [];
        if (!Array.isArray(DB.data.data.units)) DB.data.data.units = [];

        let changed = false;
        const now = new Date().toISOString();
        const rows = DB.data.data.personnel;

        rows.forEach((person) => {
            if (!person || typeof person !== 'object') return;
            if (!person.personCode) {
                person.personCode = PersonnelModule.makePersonCode();
                changed = true;
            }
            if (!person.fullName && person.name) {
                person.fullName = String(person.name || '').trim();
                changed = true;
            }
            if (!Array.isArray(person.assignedUnitIds) || person.assignedUnitIds.length === 0) {
                person.assignedUnitIds = person.unitId ? [String(person.unitId)] : [];
                changed = true;
            }
            if (!person.unitId && person.assignedUnitIds[0]) {
                person.unitId = String(person.assignedUnitIds[0] || '');
                changed = true;
            }
            if (!person.title) {
                person.title = String(person.rolePreset || '') === 'tam_yetkili' ? 'Bolum Yetkilisi' : 'Operator';
                changed = true;
            }
            if (!person.status) {
                person.status = person.isActive === false ? 'pasif' : 'aktif';
                changed = true;
            }
            if (typeof person.isActive === 'undefined') {
                person.isActive = String(person.status || 'aktif') !== 'pasif';
                changed = true;
            }
            if (!person.username) {
                person.username = PersonnelModule.makeUsername(person.fullName || person.personCode || 'personel', person.id);
                changed = true;
            }
            if (typeof person.isAccountActive === 'undefined') {
                person.isAccountActive = true;
                changed = true;
            }
            if (typeof person.isStockPersonnel === 'undefined') {
                person.isStockPersonnel = false;
                changed = true;
            }
            if (!person.rolePreset) {
                person.rolePreset = PersonnelModule.getLegacyPermissions(person).admin ? 'tam_yetkili' : 'operator';
                changed = true;
            }
            if (!person.modulePermissions || typeof person.modulePermissions !== 'object' || Array.isArray(person.modulePermissions)) {
                person.modulePermissions = PersonnelModule.buildPermissionsFromRole(person.rolePreset);
                changed = true;
            }
            const normalizedModulePermissions = PersonnelModule.normalizeModulePermissions(person.modulePermissions);
            if (JSON.stringify(normalizedModulePermissions) !== JSON.stringify(person.modulePermissions)) {
                person.modulePermissions = normalizedModulePermissions;
                changed = true;
            }
            const nextUnitPermissions = PersonnelModule.getUnitPermissionsForPerson(person);
            if (JSON.stringify(nextUnitPermissions) !== JSON.stringify(person.unitPermissions || {})) {
                person.unitPermissions = nextUnitPermissions;
                changed = true;
            }
            const aggregatedUnitPermissions = PersonnelModule.aggregateUnitPermissions(person.unitPermissions);
            if (JSON.stringify(person.modulePermissions.units) !== JSON.stringify(aggregatedUnitPermissions)) {
                person.modulePermissions.units = aggregatedUnitPermissions;
                changed = true;
            }
            if (!person.created_at) {
                person.created_at = now;
                changed = true;
            }
            PersonnelModule.syncLegacyPermissions(person);
        });

        if (!DB.data.meta.seedFlags.personnelModuleSeedV1) {
            const samples = [
                { fullName: 'SEDAT BEYHAN', assignedUnitIds: ['u2'], title: 'Bolum Yetkilisi', rolePreset: 'tam_yetkili', username: 'sedatbeyhan' },
                { fullName: 'SADIK YILMAZ', assignedUnitIds: ['u2'], title: 'Operator', rolePreset: 'operator', username: 'sadikyilmaz' },
                { fullName: 'ALIRIZA DEMIR', assignedUnitIds: ['u1'], title: 'Bolum Yetkilisi', rolePreset: 'tam_yetkili', username: 'alirizademir' },
                { fullName: 'MUHAMMET BILECI', assignedUnitIds: ['u1'], title: 'Operator', rolePreset: 'operator', username: 'muhammetbileci' }
            ];

            samples.forEach((sample) => {
                const exists = rows.some((person) => PersonnelModule.normalize(person?.fullName) === PersonnelModule.normalize(sample.fullName));
                if (exists) return;
                const next = {
                    id: (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') ? globalThis.crypto.randomUUID() : `per_${Date.now()}_${Math.random()}`,
                    personCode: PersonnelModule.makePersonCode(),
                    fullName: sample.fullName,
                    title: sample.title,
                    status: 'aktif',
                    isActive: true,
                    rolePreset: sample.rolePreset,
                    assignedUnitIds: sample.assignedUnitIds.slice(),
                    unitId: sample.assignedUnitIds[0],
                    username: sample.username,
                    password: '',
                    isAccountActive: true,
                    isStockPersonnel: false,
                    modulePermissions: PersonnelModule.buildPermissionsFromRole(sample.rolePreset),
                    unitPermissions: PersonnelModule.buildUnitPermissionsFromRole(sample.rolePreset),
                    created_at: now
                };
                next.modulePermissions.units = PersonnelModule.aggregateUnitPermissions(next.unitPermissions);
                PersonnelModule.syncLegacyPermissions(next);
                rows.push(next);
                changed = true;
            });

            DB.data.meta.seedFlags.personnelModuleSeedV1 = true;
            changed = true;
        }

        if (changed) DB.markDirty();
    },

    getRows: () => (DB.data?.data?.personnel || []).filter((row) => row?.isActive !== false),

    getFilteredRows: () => {
        const q = PersonnelModule.normalize(PersonnelModule.state.search);
        const filterUnitId = String(PersonnelModule.state.filterUnitId || 'all');
        const filterStatus = String(PersonnelModule.state.filterStatus || 'all');
        return PersonnelModule.getRows().filter((row) => {
            const assignedIds = PersonnelModule.getAssignedUnitIds(row);
            if (filterUnitId !== 'all' && !assignedIds.includes(filterUnitId)) return false;
            if (filterStatus !== 'all' && String(row?.status || 'aktif') !== filterStatus) return false;
            if (!q) return true;
            const haystack = [
                row?.fullName,
                row?.personCode,
                row?.username,
                row?.title,
                ...PersonnelModule.getAssignedUnitNames(row)
            ].map(PersonnelModule.normalize).join(' ');
            return haystack.includes(q);
        });
    },

    setFilter: (field, value) => {
        if (field === 'search') PersonnelModule.state.search = String(value || '');
        if (field === 'unit') PersonnelModule.state.filterUnitId = String(value || 'all');
        if (field === 'status') PersonnelModule.state.filterStatus = String(value || 'all');
        UI.renderCurrentPage();
    },

    render: (container) => {
        if (!container) return;
        PersonnelModule.ensureData();
        container.innerHTML = PersonnelModule.renderLayout();
        if (window.lucide) window.lucide.createIcons();
    },

    renderStats: () => {
        const rows = PersonnelModule.getRows();
        const activeCount = rows.filter((row) => String(row?.status || 'aktif') === 'aktif').length;
        const managerCount = rows.filter((row) => String(row?.rolePreset || '') === 'tam_yetkili').length;
        return `
            <div class="personnel-stats">
                <div class="personnel-stat"><div class="personnel-stat-label">Toplam personel</div><div class="personnel-stat-value">${rows.length}</div></div>
                <div class="personnel-stat"><div class="personnel-stat-label">Aktif</div><div class="personnel-stat-value">${activeCount}</div></div>
                <div class="personnel-stat"><div class="personnel-stat-label">Tam yetkili</div><div class="personnel-stat-value">${managerCount}</div></div>
                <div class="personnel-stat"><div class="personnel-stat-label">Atanan birim</div><div class="personnel-stat-value">${PersonnelModule.getInternalUnits().length}</div></div>
            </div>
        `;
    },

    renderRows: () => {
        const rows = PersonnelModule.getFilteredRows();
        if (rows.length === 0) {
            return `<tr><td colspan="6" class="personnel-empty">Kayitli personel bulunamadi.</td></tr>`;
        }
        return rows.map((person) => `
            <tr>
                <td>
                    <div class="personnel-name-cell">
                        <div class="personnel-avatar">${PersonnelModule.escapeHtml(String(person?.fullName || '?').trim().charAt(0) || '?')}</div>
                        <div>
                            <div class="personnel-name">${PersonnelModule.escapeHtml(person?.fullName || '-')}</div>
                            <div class="personnel-sub">${PersonnelModule.escapeHtml(person?.title || '-')}</div>
                        </div>
                    </div>
                </td>
                <td>${PersonnelModule.escapeHtml(person?.personCode || '-')}</td>
                <td>${PersonnelModule.escapeHtml(PersonnelModule.getAssignedUnitNames(person).join(', '))}</td>
                <td>${PersonnelModule.escapeHtml(person?.username || '-')}</td>
                <td><span class="personnel-role-badge${String(person?.rolePreset || '') === 'tam_yetkili' ? ' manager' : ''}">${PersonnelModule.escapeHtml(PersonnelModule.getRoleLabel(person))}</span></td>
                <td class="personnel-actions">
                    <button class="personnel-icon-btn" onclick="PersonnelModule.openPersonModal('${PersonnelModule.escapeHtml(person?.id || '')}', true)" title="goruntule"><i data-lucide="eye" width="16" height="16"></i></button>
                    <button class="personnel-icon-btn" onclick="PersonnelModule.openPersonModal('${PersonnelModule.escapeHtml(person?.id || '')}')" title="duzenle"><i data-lucide="pencil" width="16" height="16"></i></button>
                    <button class="personnel-icon-btn" onclick="PersonnelModule.openPermissionModal('${PersonnelModule.escapeHtml(person?.id || '')}')" title="yetki"><i data-lucide="shield-check" width="16" height="16"></i></button>
                    <button class="personnel-icon-btn danger" onclick="PersonnelModule.deletePersonnel('${PersonnelModule.escapeHtml(person?.id || '')}')" title="sil"><i data-lucide="trash-2" width="16" height="16"></i></button>
                </td>
            </tr>
        `).join('');
    },

    renderLayout: () => {
        return `
            <section class="personnel-shell">
                <div class="personnel-hero">
                    <div>
                        <h2 class="personnel-title">personel yonetimi</h2>
                        <div class="personnel-desc">Personel kartlarini olustur, birim/atolye atamalarini yap, kullanici hesaplarini belirle ve rol yetkilerini yonet.</div>
                    </div>
                    <button class="btn-primary personnel-create-btn" onclick="PersonnelModule.openPersonModal()"><i data-lucide="plus-circle" width="18" height="18"></i> Yeni Personel</button>
                </div>

                ${PersonnelModule.renderStats()}

                <div class="personnel-card">
                    <div class="personnel-filters">
                        <input class="personnel-input" value="${PersonnelModule.escapeHtml(PersonnelModule.state.search)}" oninput="PersonnelModule.setFilter('search', this.value)" placeholder="ad soyad / id kodu / kullanici adi ara">
                        <select class="personnel-select" onchange="PersonnelModule.setFilter('unit', this.value)">
                            <option value="all"${String(PersonnelModule.state.filterUnitId || 'all') === 'all' ? ' selected' : ''}>Tum birimler</option>
                            ${PersonnelModule.getInternalUnits().map((unit) => `<option value="${PersonnelModule.escapeHtml(unit.id || '')}"${String(PersonnelModule.state.filterUnitId || 'all') === String(unit.id || '') ? ' selected' : ''}>${PersonnelModule.escapeHtml(unit.name || '-')}</option>`).join('')}
                        </select>
                        <select class="personnel-select" onchange="PersonnelModule.setFilter('status', this.value)">
                            <option value="all"${String(PersonnelModule.state.filterStatus || 'all') === 'all' ? ' selected' : ''}>Tum durumlar</option>
                            <option value="aktif"${String(PersonnelModule.state.filterStatus || 'all') === 'aktif' ? ' selected' : ''}>Aktif</option>
                            <option value="pasif"${String(PersonnelModule.state.filterStatus || 'all') === 'pasif' ? ' selected' : ''}>Pasif</option>
                            <option value="izinli"${String(PersonnelModule.state.filterStatus || 'all') === 'izinli' ? ' selected' : ''}>Izinli</option>
                        </select>
                    </div>

                    <div class="personnel-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Adi soyadi</th>
                                    <th>ID kodu</th>
                                    <th>Birim / Atolye</th>
                                    <th>Kullanici adi</th>
                                    <th>Rol</th>
                                    <th style="text-align:right;">Islemler</th>
                                </tr>
                            </thead>
                            <tbody>${PersonnelModule.renderRows()}</tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    },

    renderUnitCheckboxes: (person) => {
        const selectedIds = new Set(PersonnelModule.getAssignedUnitIds(person));
        return PersonnelModule.getInternalUnits().map((unit) => `
            <label class="personnel-unit-chip">
                <input type="checkbox" class="personnel-unit-checkbox" value="${PersonnelModule.escapeHtml(unit.id || '')}" ${selectedIds.has(String(unit.id || '')) ? 'checked' : ''}>
                <span>${PersonnelModule.escapeHtml(unit.name || '-')}</span>
            </label>
        `).join('');
    },

    openPersonModal: (personId = '', readOnly = false) => {
        const person = personId ? (DB.data?.data?.personnel || []).find((row) => String(row?.id || '') === String(personId || '')) : null;
        const title = person ? (readOnly ? 'Personel Goruntule' : 'Personel Duzenle') : 'Yeni Personel';
        Modal.open(title, `
            <div class="personnel-modal-shell">
                <div class="personnel-modal-grid">
                    <div class="personnel-modal-card">
                        <div class="personnel-modal-title">Temel bilgiler</div>
                        <div class="personnel-form-grid">
                            <div>
                                <label class="personnel-label">Personel ID</label>
                                <input id="person_code" class="personnel-input" value="${PersonnelModule.escapeHtml(person?.personCode || 'Otomatik olusacak')}" disabled>
                            </div>
                            <div>
                                <label class="personnel-label">Durum</label>
                                <select id="person_status" class="personnel-select" ${readOnly ? 'disabled' : ''}>
                                    <option value="aktif"${String(person?.status || 'aktif') === 'aktif' ? ' selected' : ''}>Aktif</option>
                                    <option value="pasif"${String(person?.status || 'aktif') === 'pasif' ? ' selected' : ''}>Pasif</option>
                                    <option value="izinli"${String(person?.status || 'aktif') === 'izinli' ? ' selected' : ''}>Izinli</option>
                                </select>
                            </div>
                            <div class="personnel-form-span">
                                <label class="personnel-label">Ad soyad</label>
                                <input id="person_name" class="personnel-input" value="${PersonnelModule.escapeHtml(person?.fullName || '')}" placeholder="or: Sedat Beyhan" ${readOnly ? 'disabled' : ''}>
                            </div>
                            <div>
                                <label class="personnel-label">Gorev unvani</label>
                                <input id="person_title" class="personnel-input" value="${PersonnelModule.escapeHtml(person?.title || '')}" placeholder="or: Bolum Yetkilisi" ${readOnly ? 'disabled' : ''}>
                            </div>
                            <div>
                                <label class="personnel-label">Rol</label>
                                <select id="person_role" class="personnel-select" ${readOnly ? 'disabled' : ''}>
                                    <option value="tam_yetkili"${String(person?.rolePreset || 'operator') === 'tam_yetkili' ? ' selected' : ''}>Tam Yetkili</option>
                                    <option value="operator"${String(person?.rolePreset || 'operator') === 'operator' ? ' selected' : ''}>Operator</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="personnel-modal-card">
                        <div class="personnel-modal-title">Hesap bilgileri</div>
                        <div class="personnel-form-grid">
                            <div class="personnel-form-span">
                                <label class="personnel-label">Kullanici adi</label>
                                <input id="person_username" class="personnel-input" value="${PersonnelModule.escapeHtml(person?.username || '')}" placeholder="or: sedatbeyhan" ${readOnly ? 'disabled' : ''}>
                            </div>
                            <div class="personnel-form-span">
                                <label class="personnel-label">Sifre</label>
                                <input id="person_password" type="text" class="personnel-input" value="${PersonnelModule.escapeHtml(person?.password || '')}" placeholder="admin belirler" ${readOnly ? 'disabled' : ''}>
                            </div>
                            <div class="personnel-form-span personnel-checkbox-row">
                                <label class="personnel-switch">
                                    <input id="person_account_active" type="checkbox" ${person?.isAccountActive !== false ? 'checked' : ''} ${readOnly ? 'disabled' : ''}>
                                    <span>Hesap aktif</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="personnel-modal-card">
                    <div class="personnel-modal-title">Gorev / alan atamalari</div>
                    <div class="personnel-modal-note">Personeli birden fazla gorev alanina atayabilirsin. Sectigin atolyeler ilgili personel listesinde, depo & stok secimi ise depo personel ekraninda gorunur.</div>
                    <div class="personnel-unit-grid">
                        ${PersonnelModule.renderUnitCheckboxes(person)}
                        <label class="personnel-unit-chip">
                            <input type="checkbox" id="person_stock_staff" ${person?.isStockPersonnel ? 'checked' : ''} ${readOnly ? 'disabled' : ''}>
                            <span>depo & stok</span>
                        </label>
                    </div>
                </div>

                <div class="personnel-modal-footer">
                    <button class="btn-sm" onclick="Modal.close()">Kapat</button>
                    ${readOnly ? '' : `<button class="btn-primary" onclick="PersonnelModule.savePerson('${PersonnelModule.escapeHtml(person?.id || '')}')">Kaydet</button>`}
                </div>
            </div>
        `, { maxWidth: '1080px' });
    },

    savePerson: async (personId = '') => {
        const fullName = String(document.getElementById('person_name')?.value || '').trim().toUpperCase();
        const title = String(document.getElementById('person_title')?.value || '').trim();
        const status = String(document.getElementById('person_status')?.value || 'aktif').trim();
        const rolePreset = String(document.getElementById('person_role')?.value || 'operator').trim();
        const usernameInput = String(document.getElementById('person_username')?.value || '').trim();
        const password = String(document.getElementById('person_password')?.value || '').trim();
        const isAccountActive = !!document.getElementById('person_account_active')?.checked;
        const assignedUnitIds = Array.from(document.querySelectorAll('.personnel-unit-checkbox:checked')).map((el) => String(el.value || ''));
        const isStockPersonnel = !!document.getElementById('person_stock_staff')?.checked;

        if (!fullName) return alert('Ad soyad giriniz.');

        const rows = DB.data.data.personnel || [];
        const username = usernameInput || PersonnelModule.makeUsername(fullName, personId);
        const duplicateUsername = rows.some((row) => String(row?.id || '') !== String(personId || '') && PersonnelModule.normalize(row?.username) === PersonnelModule.normalize(username));
        if (duplicateUsername) return alert('Bu kullanici adi zaten kullaniliyor.');

        const primaryUnitId = assignedUnitIds[0] || '';

        if (personId) {
            const person = rows.find((row) => String(row?.id || '') === String(personId || ''));
            if (!person) return;
            person.fullName = fullName;
            person.title = title || (rolePreset === 'tam_yetkili' ? 'Bolum Yetkilisi' : 'Operator');
            person.status = status;
            person.isActive = status !== 'pasif';
            person.rolePreset = rolePreset;
            person.username = username;
            person.password = password;
            person.isAccountActive = isAccountActive;
            person.isStockPersonnel = isStockPersonnel;
            person.assignedUnitIds = assignedUnitIds;
            person.unitId = primaryUnitId;
            person.modulePermissions = PersonnelModule.normalizeModulePermissions(person.modulePermissions);
            person.unitPermissions = PersonnelModule.getUnitPermissionsForPerson(person);
            person.modulePermissions.units = PersonnelModule.aggregateUnitPermissions(person.unitPermissions);
            PersonnelModule.syncLegacyPermissions(person);
        } else {
            const next = {
                id: (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') ? globalThis.crypto.randomUUID() : `per_${Date.now()}_${Math.random()}`,
                personCode: PersonnelModule.makePersonCode(),
                fullName,
                title: title || (rolePreset === 'tam_yetkili' ? 'Bolum Yetkilisi' : 'Operator'),
                status,
                isActive: status !== 'pasif',
                rolePreset,
                username,
                password,
                isAccountActive,
                isStockPersonnel,
                assignedUnitIds,
                unitId: primaryUnitId,
                modulePermissions: PersonnelModule.buildDefaultModulePermissions(),
                unitPermissions: PersonnelModule.buildDefaultUnitPermissions(),
                created_at: new Date().toISOString()
            };
            next.modulePermissions.units = PersonnelModule.aggregateUnitPermissions(next.unitPermissions);
            PersonnelModule.syncLegacyPermissions(next);
            rows.push(next);
        }

        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    renderPermissionCards: (person) => {
        const permissions = PersonnelModule.normalizeModulePermissions(person?.modulePermissions);
        const unitPermissions = PersonnelModule.getUnitPermissionsForPerson(person);
        return PersonnelModule.moduleDefs.map((mod) => `
            <div class="personnel-perm-card">
                <div class="personnel-perm-card-head">
                    <div class="personnel-perm-card-title"><i data-lucide="${mod.icon}" width="16" height="16"></i> ${PersonnelModule.escapeHtml(mod.label)}</div>
                </div>
                ${mod.id === 'units'
                    ? `<div class="personnel-perm-unit-list">
                        ${PersonnelModule.getPermissionUnits().map((unit) => {
                            const unitId = String(unit?.id || '').trim();
                            const unitPerms = unitPermissions?.[unitId] || PersonnelModule.getEmptyPermissionSet();
                            return `
                                <div class="personnel-perm-unit-row">
                                    <div class="personnel-perm-unit-name">${PersonnelModule.escapeHtml(unit?.name || '-')}</div>
                                    <div class="personnel-perm-row">
                                        ${PersonnelModule.permissionOps.map((op) => `
                                            <label class="personnel-perm-check">
                                                <input id="perm_unit_${PersonnelModule.escapeHtml(unitId)}_${op}" type="checkbox" ${unitPerms?.[op] ? 'checked' : ''}>
                                                <span>${PersonnelModule.escapeHtml(PersonnelModule.permissionLabels[op] || op)}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>`
                    : `<div class="personnel-perm-row">
                        ${PersonnelModule.permissionOps.map((op) => `
                            <label class="personnel-perm-check">
                                <input id="perm_${mod.id}_${op}" type="checkbox" ${permissions?.[mod.id]?.[op] ? 'checked' : ''}>
                                <span>${PersonnelModule.escapeHtml(PersonnelModule.permissionLabels[op] || op)}</span>
                            </label>
                        `).join('')}
                    </div>`}
            </div>
        `).join('');
    },

    resetPermissionSelections: () => {
        document.querySelectorAll('.personnel-perm-list input[type="checkbox"]').forEach((input) => {
            input.checked = false;
        });
    },

    openPermissionModal: (personId) => {
        const person = (DB.data?.data?.personnel || []).find((row) => String(row?.id || '') === String(personId || ''));
        if (!person) return;
        Modal.open('', `
            <div class="personnel-perm-shell">
                <div class="personnel-perm-top">
                    <div class="personnel-perm-heading">Yonetim: ${PersonnelModule.escapeHtml(person.fullName || '-')}</div>
                    <button class="personnel-close-btn" onclick="Modal.close()">&times;</button>
                </div>

                <div class="personnel-perm-grid">
                    <div class="personnel-modal-card">
                        <div class="personnel-section-head">
                            <div class="personnel-modal-title">Yetki yonetimi</div>
                            <button class="btn-sm" type="button" onclick="PersonnelModule.resetPermissionSelections()">Sifirla</button>
                        </div>
                        <div class="personnel-perm-list">${PersonnelModule.renderPermissionCards(person)}</div>
                    </div>

                    <div class="personnel-modal-card">
                        <div class="personnel-modal-title">Hesap ayarlari</div>
                        <div class="personnel-form-grid">
                            <div class="personnel-form-span">
                                <label class="personnel-label">Kullanici adi</label>
                                <input id="perm_username" class="personnel-input" value="${PersonnelModule.escapeHtml(person?.username || '')}">
                            </div>
                            <div>
                                <label class="personnel-label">Rol</label>
                                <select id="perm_role" class="personnel-select">
                                    <option value="tam_yetkili"${String(person?.rolePreset || 'operator') === 'tam_yetkili' ? ' selected' : ''}>Tam Yetkili</option>
                                    <option value="operator"${String(person?.rolePreset || 'operator') === 'operator' ? ' selected' : ''}>Operator</option>
                                </select>
                            </div>
                            <div class="personnel-checkbox-row">
                                <label class="personnel-switch">
                                    <input id="perm_account_active" type="checkbox" ${person?.isAccountActive !== false ? 'checked' : ''}>
                                    <span>Hesap aktif</span>
                                </label>
                            </div>
                            <div class="personnel-form-span">
                                <label class="personnel-label">Yeni sifre</label>
                                <input id="perm_password" type="text" class="personnel-input" placeholder="bos birakilirsa degismez">
                            </div>
                            <div class="personnel-form-span">
                                <label class="personnel-label">Yeni sifre (tekrar)</label>
                                <input id="perm_password_repeat" type="text" class="personnel-input" placeholder="tekrar giriniz">
                            </div>
                        </div>

                        <button class="btn-primary personnel-save-wide" onclick="PersonnelModule.savePermissionModal('${PersonnelModule.escapeHtml(person?.id || '')}')">
                            <i data-lucide="key-round" width="16" height="16"></i> Yetki ve Hesabi Guncelle
                        </button>
                    </div>
                </div>

                <div class="personnel-modal-footer">
                    <button class="btn-sm" onclick="Modal.close()">Kapat</button>
                </div>
            </div>
        `, { maxWidth: '1180px', showHeader: false });
        if (window.lucide) window.lucide.createIcons();
    },

    savePermissionModal: async (personId) => {
        const person = (DB.data?.data?.personnel || []).find((row) => String(row?.id || '') === String(personId || ''));
        if (!person) return;

        const username = String(document.getElementById('perm_username')?.value || '').trim();
        const rolePreset = String(document.getElementById('perm_role')?.value || 'operator').trim();
        const password = String(document.getElementById('perm_password')?.value || '').trim();
        const repeat = String(document.getElementById('perm_password_repeat')?.value || '').trim();
        const isAccountActive = !!document.getElementById('perm_account_active')?.checked;

        if (!username) return alert('Kullanici adi zorunlu.');
        const duplicateUsername = (DB.data.data.personnel || []).some((row) => String(row?.id || '') !== String(personId || '') && PersonnelModule.normalize(row?.username) === PersonnelModule.normalize(username));
        if (duplicateUsername) return alert('Bu kullanici adi zaten kullaniliyor.');
        if ((password || repeat) && password !== repeat) return alert('Sifreler ayni degil.');

        person.username = username;
        person.rolePreset = rolePreset;
        person.isAccountActive = isAccountActive;
        person.modulePermissions = PersonnelModule.normalizeModulePermissions(person.modulePermissions);
        person.unitPermissions = PersonnelModule.buildDefaultUnitPermissions();

        PersonnelModule.moduleDefs.forEach((mod) => {
            if (mod.id === 'units') return;
            if (!person.modulePermissions[mod.id]) person.modulePermissions[mod.id] = PersonnelModule.getEmptyPermissionSet();
            PersonnelModule.permissionOps.forEach((op) => {
                person.modulePermissions[mod.id][op] = !!document.getElementById(`perm_${mod.id}_${op}`)?.checked;
            });
        });
        PersonnelModule.getPermissionUnits().forEach((unit) => {
            const unitId = String(unit?.id || '').trim();
            if (!unitId) return;
            if (!person.unitPermissions[unitId]) person.unitPermissions[unitId] = PersonnelModule.getEmptyPermissionSet();
            PersonnelModule.permissionOps.forEach((op) => {
                person.unitPermissions[unitId][op] = !!document.getElementById(`perm_unit_${unitId}_${op}`)?.checked;
            });
        });
        person.modulePermissions.units = PersonnelModule.aggregateUnitPermissions(person.unitPermissions);

        if (password) person.password = password;
        if (!person.title) person.title = rolePreset === 'tam_yetkili' ? 'Bolum Yetkilisi' : 'Operator';
        PersonnelModule.syncLegacyPermissions(person);

        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },

    deletePersonnel: async (personId) => {
        const person = (DB.data?.data?.personnel || []).find((row) => String(row?.id || '') === String(personId || ''));
        if (!person) return;
        if (!confirm('Bu personeli listeden kaldirmak istiyor musunuz?')) return;
        person.isActive = false;
        person.status = 'pasif';
        await DB.save();
        UI.renderCurrentPage();
    }
};
