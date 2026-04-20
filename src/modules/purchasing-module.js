const PurchasingModule = {
    state: {
        activeTab: 'orders',
        searchTerm: '',
        supplierContactRowsDraft: [],
        supplierContactModal: null,
        supplierTypePanelOpen: false,
        supplierTypeSearch: '',
        supplierTypeManageEditId: '',
        supplierImportPreview: null,
        supplierModalEditId: '',
        supplierTypeOutsideHandler: null
    }, // orders | requests | suppliers

    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),

    normalizeText: (value) => String(value || '').trim().toLocaleLowerCase('tr-TR'),

    normalizeAsciiUpper: (value) => {
        const raw = String(value || '').trim().toLocaleUpperCase('tr-TR');
        if (!raw) return '';
        const cleaned = (window.MojibakeFix && typeof window.MojibakeFix.normalize === 'function')
            ? window.MojibakeFix.normalize(raw)
            : raw;
        return cleaned
            .replace(/[ıİ]/g, 'I')
            .replace(/[şŞ]/g, 'S')
            .replace(/[ğĞ]/g, 'G')
            .replace(/[üÜ]/g, 'U')
            .replace(/[öÖ]/g, 'O')
            .replace(/[çÇ]/g, 'C')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    parseCommaList: (raw) => {
        return (raw || '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean)
            .filter((v, i, arr) => arr.findIndex(z => z.toLowerCase() === v.toLowerCase()) === i);
    },

    parsePercent: (value) => {
        const raw = String(value ?? '').trim().replace(',', '.');
        const num = Number.parseFloat(raw);
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Math.min(100, num));
    },

    parseDays: (value) => {
        const raw = String(value ?? '').trim().replace(',', '.');
        const num = Number.parseFloat(raw);
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Math.round(num));
    },

    parseMoney: (value) => {
        const raw = String(value ?? '').trim().replace(/\./g, '').replace(',', '.');
        const num = Number.parseFloat(raw);
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Number(num.toFixed(2)));
    },

    normalizeImportToken: (value) => {
        const raw = String(value || '').trim().toLocaleLowerCase('tr-TR');
        if (!raw) return '';
        const cleaned = (window.MojibakeFix && typeof window.MojibakeFix.normalize === 'function')
            ? window.MojibakeFix.normalize(raw)
            : raw;
        return cleaned
            .replace(/[ıİ]/g, 'i')
            .replace(/[şŞ]/g, 's')
            .replace(/[ğĞ]/g, 'g')
            .replace(/[üÜ]/g, 'u')
            .replace(/[öÖ]/g, 'o')
            .replace(/[çÇ]/g, 'c')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '');
    },

    normalizeExternalCodeKey: (value) => String(value || '')
        .trim()
        .toLocaleUpperCase('tr-TR')
        .replace(/\s+/g, ''),

    normalizeTaxKey: (value) => String(value || '')
        .trim()
        .toLocaleUpperCase('tr-TR')
        .replace(/\s+/g, ''),

    normalizePhoneKey: (value) => String(value || '').replace(/\D+/g, ''),

    defaultSupplierTypeSeeds: () => ([
        { code: '320.01.01', name: 'AKSESUAR SATICILARI' },
        { code: '320.01.02', name: 'ALUMINYUM SATICILARI' },
        { code: '320.01.03', name: 'ALUMINYUM-DEMIR-CELIK-PASLANMAZ' },
        { code: '320.01.04', name: 'AMBALAJ SATICILARI' },
        { code: '320.01.05', name: 'ARAC BAKIM' },
        { code: '320.01.06', name: 'BAKIM' },
        { code: '320.01.07', name: 'CAM SATICILARI' },
        { code: '320.01.08', name: 'CIVATA-SOMUN-SAPLAMA' },
        { code: '320.01.09', name: 'DIGER SATICILAR' },
        { code: '320.01.10', name: 'GAZ SATICILARI' },
        { code: '320.01.11', name: 'GONUL SATICILARI' },
        { code: '320.01.12', name: 'HIRDAVAT SATICILARI' },
        { code: '320.01.13', name: 'HIZMET SATICILARI' },
        { code: '320.01.14', name: 'KAPLAMA CARILERI' },
        { code: '320.01.15', name: 'MAKINA VE DEMIRBAS SATICILARI' },
        { code: '320.01.16', name: 'NAKLIYE-KARGO-LOJISTIK' },
        { code: '320.01.17', name: 'OTEL' },
        { code: '320.01.18', name: 'PALET-AHSAP-SANDIK SATICILARI' },
        { code: '320.01.19', name: 'SIGORTA' },
        { code: '320.01.20', name: 'TEKNOLOJI-YAZILIM-BILISIM' },
        { code: '320.01.21', name: 'TEKSTIL SATICILARI' },
        { code: '320.01.22', name: 'TEMIZLIK' },
        { code: '320.01.23', name: 'UC VE BILEME' },
        { code: '320.01.24', name: 'YAG' },
        { code: '320.01.25', name: 'YEMEK' }
    ]),

    buildSupplierTypeId: (code, name) => {
        const codeNorm = String(code || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
        const nameNorm = PurchasingModule.normalizeAsciiUpper(name).replace(/[^0-9A-Z]+/g, '');
        const base = codeNorm || nameNorm || crypto.randomUUID().replace(/-/g, '').toUpperCase();
        return `sup_type_${base}`;
    },

    normalizeSupplierTypeOption: (raw, index = 0) => {
        const src = (raw && typeof raw === 'object') ? raw : { name: String(raw || '').trim() };
        const code = String(src.code || '').trim();
        const name = String(src.name || src.label || src.value || '').trim();
        if (!name && !code) return null;
        return {
            id: String(src.id || PurchasingModule.buildSupplierTypeId(code, name || `TIP${index + 1}`)).trim(),
            code,
            name: name || code,
            aliases: Array.isArray(src.aliases)
                ? src.aliases.map((x) => String(x || '').trim()).filter(Boolean)
                : []
        };
    },

    ensureSupplierTypeOptions: () => {
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.options || typeof DB.data.meta.options !== 'object') DB.data.meta.options = {};
        if (!Array.isArray(DB.data.meta.options.supplierTypes)) DB.data.meta.options.supplierTypes = [];

        const seeds = PurchasingModule.defaultSupplierTypeSeeds();
        const rawList = (DB.data.meta.options.supplierTypes || []).slice();
        if (rawList.length === 0) rawList.push(...seeds);

        const map = new Map();
        rawList.forEach((item, index) => {
            const normalized = PurchasingModule.normalizeSupplierTypeOption(item, index);
            if (!normalized) return;
            const key = normalized.code
                ? `code:${PurchasingModule.normalizeAsciiUpper(normalized.code)}`
                : `name:${PurchasingModule.normalizeAsciiUpper(normalized.name)}`;
            if (!map.has(key)) map.set(key, normalized);
        });

        const next = Array.from(map.values()).sort((a, b) => {
            const ac = String(a.code || '').trim();
            const bc = String(b.code || '').trim();
            if (ac && bc) return ac.localeCompare(bc, 'tr');
            if (ac && !bc) return -1;
            if (!ac && bc) return 1;
            return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
        });

        DB.data.meta.options.supplierTypes = next;
        return next;
    },

    getSupplierTypeOptions: () => PurchasingModule.ensureSupplierTypeOptions(),

    getSupplierTypeLookup: () => {
        const options = PurchasingModule.getSupplierTypeOptions();
        const byId = new Map();
        const byCode = new Map();
        const byName = new Map();
        options.forEach((opt) => {
            byId.set(String(opt.id || '').trim(), opt);
            const codeKey = PurchasingModule.normalizeAsciiUpper(opt.code || '');
            if (codeKey) byCode.set(codeKey, opt);
            const nameKey = PurchasingModule.normalizeAsciiUpper(opt.name || '');
            if (nameKey) byName.set(nameKey, opt);
            (Array.isArray(opt.aliases) ? opt.aliases : []).forEach((alias) => {
                const aliasKey = PurchasingModule.normalizeAsciiUpper(alias || '');
                if (aliasKey && !byName.has(aliasKey)) byName.set(aliasKey, opt);
            });
        });
        return { byId, byCode, byName };
    },

    getSupplierTypeNameById: (typeId) => {
        const id = String(typeId || '').trim();
        if (!id) return '';
        const { byId } = PurchasingModule.getSupplierTypeLookup();
        return String(byId.get(id)?.name || '').trim();
    },

    getSupplierTypeLabel: (option) => {
        const code = String(option?.code || '').trim();
        const name = String(option?.name || '').trim();
        if (code && name) return `${code} - ${name}`;
        return name || code || '-';
    },

    normalizeSupplierTypeIds: (values = [], options = null) => {
        const source = Array.isArray(values) ? values : [values];
        const currentOptions = Array.isArray(options) ? options : PurchasingModule.getSupplierTypeOptions();
        const byId = new Map();
        const byCode = new Map();
        const byName = new Map();
        currentOptions.forEach((opt) => {
            const id = String(opt.id || '').trim();
            if (id) byId.set(id, id);
            const codeKey = PurchasingModule.normalizeAsciiUpper(opt.code || '');
            if (codeKey) byCode.set(codeKey, id);
            const nameKey = PurchasingModule.normalizeAsciiUpper(opt.name || '');
            if (nameKey) byName.set(nameKey, id);
        });

        const ids = [];
        source.forEach((raw) => {
            const text = String(raw || '').trim();
            if (!text) return;
            if (byId.has(text)) {
                ids.push(byId.get(text));
                return;
            }
            const codeKey = PurchasingModule.normalizeAsciiUpper(text);
            if (byCode.has(codeKey)) {
                ids.push(byCode.get(codeKey));
                return;
            }
            if (byName.has(codeKey)) {
                ids.push(byName.get(codeKey));
            }
        });
        return Array.from(new Set(ids));
    },

    extractCustomTags: (tags = [], options = null) => {
        const list = Array.isArray(tags) ? tags.map((x) => String(x || '').trim()).filter(Boolean) : [];
        const currentOptions = Array.isArray(options) ? options : PurchasingModule.getSupplierTypeOptions();
        const typeNameSet = new Set(currentOptions.map((opt) => PurchasingModule.normalizeAsciiUpper(opt.name || '')));
        return list.filter((tag) => !typeNameSet.has(PurchasingModule.normalizeAsciiUpper(tag)));
    },

    mergeTagsWithTypes: (baseTags = [], supplierTypeIds = [], options = null) => {
        const currentOptions = Array.isArray(options) ? options : PurchasingModule.getSupplierTypeOptions();
        const byId = new Map(currentOptions.map((opt) => [String(opt.id || '').trim(), opt]));
        const customTags = PurchasingModule.extractCustomTags(baseTags, currentOptions);
        const typeNames = supplierTypeIds
            .map((id) => String(byId.get(String(id || '').trim())?.name || '').trim())
            .filter(Boolean);
        return Array.from(new Set([...customTags, ...typeNames]));
    },

    parseSupplierTypeTokenEntry: (rawToken) => {
        const text = String(rawToken || '').trim();
        if (!text) return { text: '', code: '', name: '' };
        const codeMatch = text.match(/\d{3}\.\d{2}\.\d{2}/);
        const code = codeMatch ? String(codeMatch[0] || '').trim() : '';
        let name = text;
        if (code) {
            name = name.replace(code, '').replace(/^[-:|,.\s]+/, '').trim();
        }
        if (!name && !code) name = text;
        return { text, code, name: name || code };
    },

    resolveOrCreateSupplierTypeIds: (tokens = []) => {
        const list = Array.isArray(tokens) ? tokens : [];
        const result = [];
        list.forEach((token) => {
            const parsed = PurchasingModule.parseSupplierTypeTokenEntry(token);
            if (!parsed.text) return;
            const lookup = PurchasingModule.getSupplierTypeLookup();
            const codeKey = PurchasingModule.normalizeAsciiUpper(parsed.code || '');
            const nameKey = PurchasingModule.normalizeAsciiUpper(parsed.name || parsed.text || '');
            if (codeKey && lookup.byCode.has(codeKey)) {
                result.push(String(lookup.byCode.get(codeKey)?.id || '').trim());
                return;
            }
            if (nameKey && lookup.byName.has(nameKey)) {
                result.push(String(lookup.byName.get(nameKey)?.id || '').trim());
                return;
            }
            const created = PurchasingModule.upsertSupplierTypeOption({
                code: parsed.code,
                name: parsed.name || parsed.text
            });
            if (created?.id) result.push(String(created.id).trim());
        });
        return Array.from(new Set(result.filter(Boolean)));
    },

    upsertSupplierTypeOption: (draft = {}, editId = '') => {
        const name = String(draft?.name || '').trim();
        const code = String(draft?.code || '').trim();
        if (!name && !code) return null;

        const options = PurchasingModule.getSupplierTypeOptions();
        const byId = new Map(options.map((opt) => [String(opt.id || '').trim(), opt]));
        const byCode = new Map();
        const byName = new Map();
        options.forEach((opt) => {
            const codeKey = PurchasingModule.normalizeAsciiUpper(opt.code || '');
            const nameKey = PurchasingModule.normalizeAsciiUpper(opt.name || '');
            if (codeKey) byCode.set(codeKey, opt);
            if (nameKey) byName.set(nameKey, opt);
        });

        const targetId = String(editId || '').trim();
        const target = targetId ? byId.get(targetId) : null;

        const codeKey = PurchasingModule.normalizeAsciiUpper(code || '');
        const nameKey = PurchasingModule.normalizeAsciiUpper(name || '');
        if (codeKey && byCode.has(codeKey) && String(byCode.get(codeKey)?.id || '') !== targetId) {
            throw new Error('Bu kod zaten kayitli.');
        }
        if (nameKey && byName.has(nameKey) && String(byName.get(nameKey)?.id || '') !== targetId) {
            throw new Error('Bu tip adi zaten kayitli.');
        }

        if (target) {
            target.code = code;
            target.name = name || code || target.name;
            target.aliases = Array.isArray(target.aliases) ? target.aliases : [];
            return target;
        }

        const option = {
            id: PurchasingModule.buildSupplierTypeId(code, name || code),
            code,
            name: name || code,
            aliases: []
        };
        options.push(option);
        DB.data.meta.options.supplierTypes = options;
        return option;
    },

    normalizeSupplierContactRow: (row = {}, options = {}) => {
        const keepEmptyPhoneSlot = options.keepEmptyPhoneSlot === true;
        const phones = Array.isArray(row?.phones)
            ? row.phones
            : [row?.phone || row?.gsm || row?.tel || ''];
        const normalizedPhones = phones
            .map((item) => String(item || '').trim())
            .filter(Boolean);
        if (keepEmptyPhoneSlot && normalizedPhones.length === 0) normalizedPhones.push('');

        return {
            id: String(row?.id || crypto.randomUUID()).trim(),
            name: String(row?.name || '').trim(),
            position: String(row?.position || '').trim(),
            phones: normalizedPhones,
            email: String(row?.email || '').trim(),
            note: String(row?.note || '').trim()
        };
    },

    normalizeSupplierContactList: (rows = [], options = {}) => {
        const allowEmptyRow = options.allowEmptyRow === true;
        const keepEmptyPhoneSlot = options.keepEmptyPhoneSlot === true;
        const source = Array.isArray(rows) ? rows : [];
        const normalized = source
            .map((row) => PurchasingModule.normalizeSupplierContactRow(row, { keepEmptyPhoneSlot }))
            .filter((row) => {
                const hasPhone = Array.isArray(row.phones) && row.phones.some((phone) => String(phone || '').trim());
                return row.name || row.position || hasPhone || row.email || row.note;
            });
        if (allowEmptyRow && normalized.length === 0) {
            normalized.push(PurchasingModule.normalizeSupplierContactRow({}, { keepEmptyPhoneSlot: true }));
        }
        return normalized;
    },

    buildSupplierContactsFromSupplier: (supplier = {}) => {
        const source = supplier && typeof supplier === 'object' ? supplier : {};
        if (Array.isArray(source?.supplierContacts) && source.supplierContacts.length > 0) {
            return PurchasingModule.normalizeSupplierContactList(source.supplierContacts, { allowEmptyRow: false, keepEmptyPhoneSlot: false });
        }
        if (Array.isArray(source?.contacts) && source.contacts.length > 0) {
            return PurchasingModule.normalizeSupplierContactList(source.contacts, { allowEmptyRow: false, keepEmptyPhoneSlot: false });
        }
        return PurchasingModule.normalizeSupplierContactList([{
            id: crypto.randomUUID(),
            name: String(source?.contact?.person || source?.authorizedPerson || '').trim(),
            position: '',
            phones: [String(source?.contact?.phone || '').trim()],
            email: String(source?.contact?.email || '').trim(),
            note: ''
        }], { allowEmptyRow: false, keepEmptyPhoneSlot: false });
    },

    renderSupplierContactRowsHtml: (rows = []) => {
        const list = PurchasingModule.normalizeSupplierContactList(rows, { allowEmptyRow: false, keepEmptyPhoneSlot: false });
        if (!list.length) {
            return '<tr><td colspan="5" style="padding:0.8rem; text-align:center; color:#94a3b8;">Henuz yetkili kisi eklenmedi.</td></tr>';
        }
        return list.map((row, rowIndex) => {
            const firstPhone = Array.isArray(row?.phones) && row.phones.length
                ? String(row.phones[0] || '').trim()
                : '';
            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:0.55rem; font-weight:700; color:#334155;">${PurchasingModule.escapeHtml(String(row?.name || '-'))}</td>
                    <td style="padding:0.55rem;">${PurchasingModule.escapeHtml(String(row?.position || '-'))}</td>
                    <td style="padding:0.55rem;">${PurchasingModule.escapeHtml(firstPhone || '-')}</td>
                    <td style="padding:0.55rem;">${PurchasingModule.escapeHtml(String(row?.email || '-'))}</td>
                    <td style="padding:0.55rem; text-align:right;">
                        <div style="display:inline-flex; gap:0.35rem;">
                            <button type="button" class="btn-sm" style="height:30px;" onclick="PurchasingModule.openSupplierContactModal(${rowIndex})">duzenle</button>
                            <button type="button" class="btn-sm" style="height:30px; color:#dc2626; border-color:#fecaca; background:#fff1f2;" onclick="PurchasingModule.removeSupplierContactRow(${rowIndex})">sil</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    getSupplierContactRowsFromDom: () => {
        const rows = Array.isArray(PurchasingModule.state.supplierContactRowsDraft)
            ? PurchasingModule.state.supplierContactRowsDraft
            : [];
        return PurchasingModule.normalizeSupplierContactList(rows, { allowEmptyRow: false, keepEmptyPhoneSlot: false });
    },

    setSupplierContactRowsToDom: (rows = []) => {
        PurchasingModule.state.supplierContactRowsDraft = PurchasingModule.normalizeSupplierContactList(rows, {
            allowEmptyRow: false,
            keepEmptyPhoneSlot: false
        });
        const tbody = document.getElementById('new_sup_contacts_tbody');
        if (tbody) tbody.innerHTML = PurchasingModule.renderSupplierContactRowsHtml(PurchasingModule.state.supplierContactRowsDraft);
        PurchasingModule.refreshSupplierContactsTableState();
    },

    refreshSupplierContactsTableState: () => {
        const rows = PurchasingModule.getSupplierContactRowsFromDom();
        const hasContacts = rows.length > 0;
        const emptyEl = document.getElementById('new_sup_contacts_empty');
        const tableWrap = document.getElementById('new_sup_contacts_table_wrap');
        if (emptyEl) emptyEl.style.display = hasContacts ? 'none' : 'flex';
        if (tableWrap) tableWrap.style.display = hasContacts ? 'block' : 'none';
    },

    addSupplierContactRow: () => {
        PurchasingModule.openSupplierContactModal(-1);
    },

    removeSupplierContactRow: (rowIndex) => {
        const idx = Number(rowIndex);
        const rows = PurchasingModule.getSupplierContactRowsFromDom();
        if (!Number.isFinite(idx) || idx < 0 || idx >= rows.length) return;
        rows.splice(idx, 1);
        PurchasingModule.setSupplierContactRowsToDom(rows);
    },

    openSupplierContactModal: (rowIndex = -1) => {
        const idx = Number(rowIndex);
        const rows = PurchasingModule.getSupplierContactRowsFromDom();
        const editing = Number.isFinite(idx) && idx >= 0 && !!rows[idx];
        const row = editing ? rows[idx] : PurchasingModule.normalizeSupplierContactRow({}, { keepEmptyPhoneSlot: true });
        const firstPhone = Array.isArray(row?.phones) && row.phones.length ? String(row.phones[0] || '').trim() : '';

        PurchasingModule.state.supplierContactModal = { editIndex: editing ? idx : -1 };
        const html = `
            <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">Ad Soyad *</label>
                        <input id="sup_contact_modal_name" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(row?.name || ''))}">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">Gorev</label>
                        <input id="sup_contact_modal_position" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(row?.position || ''))}">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">Telefon</label>
                        <input id="sup_contact_modal_phone" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(firstPhone)}">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">E-posta</label>
                        <input id="sup_contact_modal_email" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(row?.email || ''))}">
                    </div>
                </div>
                <div>
                    <label style="display:block; font-size:0.72rem; color:#64748b; font-weight:700; margin-bottom:0.2rem;">Not</label>
                    <textarea id="sup_contact_modal_note" class="stock-textarea" style="min-height:72px;">${PurchasingModule.escapeHtml(String(row?.note || ''))}</textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-sm" onclick="PurchasingModule.closeSupplierContactModal()">vazgec</button>
                    <button class="btn-primary" onclick="PurchasingModule.saveSupplierContactModal()">${editing ? 'guncelle' : 'ekle'}</button>
                </div>
            </div>
        `;
        Modal.open(editing ? 'Yetkili Kisiyi Duzenle' : 'Yeni Yetkili Kisi', html, { maxWidth: '620px', closeExisting: false });
    },

    closeSupplierContactModal: () => {
        PurchasingModule.state.supplierContactModal = null;
        Modal.close();
    },

    saveSupplierContactModal: () => {
        const read = (id) => String(document.getElementById(id)?.value || '').trim();
        const row = PurchasingModule.normalizeSupplierContactRow({
            id: crypto.randomUUID(),
            name: read('sup_contact_modal_name'),
            position: read('sup_contact_modal_position'),
            phones: [read('sup_contact_modal_phone')],
            email: read('sup_contact_modal_email'),
            note: read('sup_contact_modal_note')
        }, { keepEmptyPhoneSlot: false });
        if (!row.name) return alert('Ad Soyad zorunlu.');
        const ctx = PurchasingModule.state.supplierContactModal || { editIndex: -1 };
        const idx = Number(ctx.editIndex);
        const rows = PurchasingModule.getSupplierContactRowsFromDom();
        if (Number.isFinite(idx) && idx >= 0 && rows[idx]) rows[idx] = row;
        else rows.push(row);
        PurchasingModule.setSupplierContactRowsToDom(rows);
        PurchasingModule.closeSupplierContactModal();
    },

    normalizeSupplierRecord: (raw, index) => {
        const src = (raw && typeof raw === 'object') ? raw : {};
        const options = PurchasingModule.getSupplierTypeOptions();
        const contactRaw = (src.contact && typeof src.contact === 'object') ? src.contact : {};
        const sourceTypes = Array.isArray(src.supplierTypes) && src.supplierTypes.length
            ? src.supplierTypes
            : (Array.isArray(src.supplierTypeIds) && src.supplierTypeIds.length
                ? src.supplierTypeIds
                : (Array.isArray(src.tags) ? src.tags : []));
        const supplierTypes = PurchasingModule.normalizeSupplierTypeIds(sourceTypes, options);
        const tags = PurchasingModule.mergeTagsWithTypes(src.tags || [], supplierTypes, options);
        const supplierTypeNames = supplierTypes.map((id) => {
            const hit = options.find((opt) => String(opt.id || '').trim() === String(id || '').trim());
            return String(hit?.name || '').trim();
        }).filter(Boolean);

        const supplierContacts = PurchasingModule.buildSupplierContactsFromSupplier(src);
        const firstContact = supplierContacts[0] || {};
        const firstPhone = Array.isArray(firstContact?.phones) && firstContact.phones.length
            ? String(firstContact.phones[0] || '').trim()
            : '';
        return {
            ...src,
            id: String(src.id || crypto.randomUUID()).trim(),
            name: (src.name || '').trim() || `Tedarikci ${index + 1}`,
            externalCode: String(src.externalCode || src.cariCode || '').trim(),
            entityType: src.entityType || 'company',
            supplierTypes,
            supplierTypeNames,
            tags,
            notes: typeof src.notes === 'string' ? src.notes : String(src.note || '').trim(),
            discountRate: PurchasingModule.parsePercent(src.discountRate || 0),
            paymentTermDays: PurchasingModule.parseDays(src.paymentTermDays || 0),
            riskLimit: PurchasingModule.parseMoney(src.riskLimit || 0),
            supplierContacts,
            contact: {
                person: String(contactRaw.person || src.authorizedPerson || firstContact?.name || '').trim(),
                phone: String(contactRaw.phone || firstPhone || '').trim(),
                email: String(contactRaw.email || firstContact?.email || '').trim(),
                web: String(contactRaw.web || '').trim(),
                tax: String(contactRaw.tax || src.taxNo || '').trim(),
                taxOffice: String(contactRaw.taxOffice || src.taxOffice || '').trim(),
                address: String(contactRaw.address || src.address || '').trim(),
                city: String(contactRaw.city || src.city || '').trim(),
                country: String(contactRaw.country || src.country || '').trim()
            }
        };
    },

    supplierMatchesRef: (supplier, ref) => {
        if (!ref) return false;

        if (typeof ref === 'object') {
            const refId = String(ref.id || '').trim();
            const refName = String(ref.name || '').trim();
            if (supplier.id && refId && refId === supplier.id) return true;
            if (refName && PurchasingModule.normalizeText(refName) === PurchasingModule.normalizeText(supplier.name)) return true;
            return false;
        }

        const refStr = String(ref).trim();
        if (!refStr) return false;
        if (supplier.id && refStr === supplier.id) return true;
        return PurchasingModule.normalizeText(refStr) === PurchasingModule.normalizeText(supplier.name);
    },

    getSupplierRefsFromProduct: (product) => {
        const refs = [];
        const pushRef = (val) => {
            if (val === undefined || val === null) return;
            if (Array.isArray(val)) {
                val.forEach(pushRef);
                return;
            }
            if (typeof val === 'string' && val.includes(',')) {
                PurchasingModule.parseCommaList(val).forEach(v => refs.push(v));
                return;
            }
            refs.push(val);
        };

        if (!product || typeof product !== 'object') return refs;
        pushRef(product.suppliers);
        pushRef(product.supplierIds);
        pushRef(product.supplierId);
        pushRef(product.supplierNames);
        pushRef(product.supplierName);
        return refs;
    },

    getLinkedProductsForSupplier: (supplier) => {
        const linked = [];

        const addProductName = (name) => {
            const label = String(name || '').trim();
            if (!label) return;
            linked.push(label);
        };

        (DB.data.data.aluminumProfiles || []).forEach(profile => {
            const refs = Array.isArray(profile?.suppliers) ? profile.suppliers : [];
            if (refs.some(ref => PurchasingModule.supplierMatchesRef(supplier, ref))) {
                addProductName(profile?.name || profile?.code || profile?.id || 'Adsiz urun');
            }
        });

        (DB.data.data.products || []).forEach(product => {
            const refs = PurchasingModule.getSupplierRefsFromProduct(product);
            if (refs.some(ref => PurchasingModule.supplierMatchesRef(supplier, ref))) {
                addProductName(product?.name || product?.productName || product?.code || product?.id || 'Adsiz urun');
            }
        });

        const uniqByKey = new Map();
        linked.forEach(item => {
            const key = PurchasingModule.normalizeText(item);
            if (key && !uniqByKey.has(key)) uniqByKey.set(key, item);
        });

        return Array.from(uniqByKey.values()).sort((a, b) => a.localeCompare(b, 'tr'));
    },

    ensureDataDefaults: () => {
        if (!DB.data.data.orders) DB.data.data.orders = [];
        if (!DB.data.data.requests) DB.data.data.requests = [];
        if (!DB.data.data.suppliers) DB.data.data.suppliers = [];

        PurchasingModule.ensureSupplierTypeOptions();

        let changed = false;
        if (!DB.data.meta || typeof DB.data.meta !== 'object') {
            DB.data.meta = {};
            changed = true;
        }
        if (!DB.data.meta.seedFlags || typeof DB.data.meta.seedFlags !== 'object') {
            DB.data.meta.seedFlags = {};
            changed = true;
        }
        if (!DB.data.meta.seedFlags.purchasingSuppliersSeedV1) {
            if (DB.data.data.suppliers.length === 0) {
                DB.data.data.suppliers = [
                    {
                        id: 'sup1',
                        name: 'AKPA ALUMINYUM',
                        externalCode: '320.01.A001',
                        entityType: 'company',
                        supplierTypes: [],
                        tags: ['Hammadde'],
                        notes: '',
                        supplierContacts: [{
                            id: crypto.randomUUID(),
                            name: 'Ahmet Yilmaz',
                            position: '',
                            phones: ['0532 111 22 33'],
                            email: '',
                            note: ''
                        }],
                        contact: {
                            person: 'Ahmet Yilmaz',
                            phone: '0532 111 22 33',
                            email: '',
                            web: '',
                            tax: '1234567890',
                            taxOffice: '',
                            address: 'OSB Mah.',
                            city: 'Istanbul',
                            country: 'Turkiye'
                        }
                    },
                    {
                        id: 'sup2',
                        name: 'TEKIN ELOKSAL',
                        externalCode: '320.01.A002',
                        entityType: 'company',
                        supplierTypes: [],
                        tags: ['Kaplama'],
                        notes: '',
                        supplierContacts: [{
                            id: crypto.randomUUID(),
                            name: 'Mehmet Demir',
                            position: '',
                            phones: ['0555 444 55 66'],
                            email: '',
                            note: ''
                        }],
                        contact: {
                            person: 'Mehmet Demir',
                            phone: '0555 444 55 66',
                            email: '',
                            web: '',
                            tax: '0987654321',
                            taxOffice: '',
                            address: 'Sanayi Sit.',
                            city: 'Istanbul',
                            country: 'Turkiye'
                        }
                    }
                ];
                changed = true;
            }
            DB.data.meta.seedFlags.purchasingSuppliersSeedV1 = true;
            changed = true;
        }

        DB.data.data.suppliers = (DB.data.data.suppliers || []).map((supplier, index) => {
            const normalized = PurchasingModule.normalizeSupplierRecord(supplier, index);
            if (
                !supplier ||
                !supplier.id ||
                !supplier.contact ||
                !Array.isArray(supplier.tags) ||
                typeof supplier.notes !== 'string' ||
                !supplier.entityType ||
                !Array.isArray(supplier.supplierTypes)
            ) {
                changed = true;
            }
            return normalized;
        });

        if (changed && typeof DB.markDirty === 'function') DB.markDirty();
    },

    renderSupplierTypePickerHtml: (selectedTypeIds = []) => {
        const normalized = PurchasingModule.normalizeSupplierTypeIds(selectedTypeIds);
        const value = normalized.join('|');
        return `
            <div id="new_sup_type_picker" style="position:relative;">
                <input id="new_sup_type_ids" type="hidden" value="${PurchasingModule.escapeHtml(value)}">
                <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    <button type="button" class="btn-sm" style="height:32px;" onclick="event.stopPropagation(); PurchasingModule.toggleSupplierTypePanel()">
                        tedarikci tipi sec
                    </button>
                    <button type="button" class="btn-sm" style="height:32px; color:#1d4ed8; border-color:#bfdbfe; background:#eff6ff;" onclick="event.stopPropagation(); PurchasingModule.openSupplierTypeManageModal()">
                        Ekle Duzenle +
                    </button>
                    <span id="new_sup_type_summary" style="font-size:0.78rem; color:#334155; font-weight:700;"></span>
                </div>
                <div id="new_sup_type_panel" style="display:none; position:absolute; top:calc(100% + 8px); left:0; right:0; z-index:45; border:1px solid #cbd5e1; border-radius:0.7rem; background:#fff; box-shadow:0 14px 26px rgba(15,23,42,0.16); padding:0.6rem;">
                    <input id="new_sup_type_search" class="stock-input stock-input-tall" style="margin-bottom:0.45rem;" placeholder="tip ara..." oninput="PurchasingModule.setSupplierTypeSearch(this.value)">
                    <div id="new_sup_type_list" style="max-height:220px; overflow:auto; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.35rem;"></div>
                </div>
            </div>
        `;
    },

    getSelectedSupplierTypeIdsFromDom: () => {
        const hidden = document.getElementById('new_sup_type_ids');
        const raw = String(hidden?.value || '').trim();
        if (!raw) return [];
        return PurchasingModule.normalizeSupplierTypeIds(raw.split('|').map((x) => String(x || '').trim()).filter(Boolean));
    },

    setSelectedSupplierTypeIdsToDom: (typeIds = []) => {
        const next = PurchasingModule.normalizeSupplierTypeIds(typeIds);
        const hidden = document.getElementById('new_sup_type_ids');
        if (hidden) hidden.value = next.join('|');
        PurchasingModule.refreshSupplierTypePickerUi();
    },

    renderSupplierTypeListHtml: (searchTerm = '', selectedIds = []) => {
        const selectedSet = new Set(PurchasingModule.normalizeSupplierTypeIds(selectedIds));
        const options = PurchasingModule.getSupplierTypeOptions();
        const q = PurchasingModule.normalizeAsciiUpper(searchTerm || '');
        const rows = options.filter((opt) => {
            if (!q) return true;
            const bag = [
                String(opt?.code || ''),
                String(opt?.name || ''),
                PurchasingModule.getSupplierTypeLabel(opt)
            ];
            return bag.some((item) => PurchasingModule.normalizeAsciiUpper(item).includes(q));
        });
        if (!rows.length) {
            return '<div style="padding:0.65rem; font-size:0.82rem; color:#94a3b8; text-align:center;">Eslesen tedarikci tipi yok.</div>';
        }
        return rows.map((opt) => {
            const id = String(opt.id || '').trim();
            const checked = selectedSet.has(id);
            return `
                <label style="display:flex; align-items:center; gap:0.5rem; padding:0.34rem 0.4rem; border-radius:0.45rem; cursor:pointer; ${checked ? 'background:#eff6ff;' : ''}">
                    <input type="checkbox" ${checked ? 'checked' : ''} onchange="PurchasingModule.toggleSupplierTypeSelection('${PurchasingModule.escapeHtml(id)}', this.checked)">
                    <span style="font-size:0.82rem; color:#334155; font-weight:700;">${PurchasingModule.escapeHtml(PurchasingModule.getSupplierTypeLabel(opt))}</span>
                </label>
            `;
        }).join('');
    },

    refreshSupplierTypePickerUi: () => {
        const selectedIds = PurchasingModule.getSelectedSupplierTypeIdsFromDom();
        const options = PurchasingModule.getSupplierTypeOptions();
        const selectedOptions = selectedIds
            .map((id) => options.find((opt) => String(opt.id || '').trim() === String(id || '').trim()))
            .filter(Boolean);
        const summaryEl = document.getElementById('new_sup_type_summary');
        if (summaryEl) {
            summaryEl.textContent = selectedOptions.length > 0
                ? selectedOptions.slice(0, 3).map((opt) => PurchasingModule.getSupplierTypeLabel(opt)).join(' | ')
                : 'Tip secilmedi';
        }

        const listEl = document.getElementById('new_sup_type_list');
        if (listEl) {
            listEl.innerHTML = PurchasingModule.renderSupplierTypeListHtml(
                PurchasingModule.state.supplierTypeSearch || '',
                selectedIds
            );
        }

        const panel = document.getElementById('new_sup_type_panel');
        if (panel) panel.style.display = PurchasingModule.state.supplierTypePanelOpen ? 'block' : 'none';

        const searchEl = document.getElementById('new_sup_type_search');
        if (searchEl && searchEl.value !== String(PurchasingModule.state.supplierTypeSearch || '')) {
            searchEl.value = String(PurchasingModule.state.supplierTypeSearch || '');
        }
    },

    setSupplierTypeSearch: (value) => {
        PurchasingModule.state.supplierTypeSearch = String(value ?? '');
        PurchasingModule.refreshSupplierTypePickerUi();
    },

    toggleSupplierTypePanel: (force = null) => {
        const next = typeof force === 'boolean' ? force : !PurchasingModule.state.supplierTypePanelOpen;
        PurchasingModule.state.supplierTypePanelOpen = !!next;
        PurchasingModule.refreshSupplierTypePickerUi();
    },

    closeSupplierTypePanel: () => {
        PurchasingModule.state.supplierTypePanelOpen = false;
        PurchasingModule.refreshSupplierTypePickerUi();
    },

    toggleSupplierTypeSelection: (typeId, checked) => {
        const id = String(typeId || '').trim();
        if (!id) return;
        const current = PurchasingModule.getSelectedSupplierTypeIdsFromDom();
        const set = new Set(current);
        if (checked) set.add(id);
        else set.delete(id);
        PurchasingModule.setSelectedSupplierTypeIdsToDom(Array.from(set));
    },

    bindSupplierTypeOutsideClick: () => {
        PurchasingModule.unbindSupplierTypeOutsideClick();
        const handler = (event) => {
            if (!PurchasingModule.state.supplierTypePanelOpen) return;
            const panelWrap = document.getElementById('new_sup_type_picker');
            if (!panelWrap) return;
            if (!panelWrap.contains(event.target)) {
                PurchasingModule.closeSupplierTypePanel();
            }
        };
        PurchasingModule.state.supplierTypeOutsideHandler = handler;
        document.addEventListener('mousedown', handler);
    },

    unbindSupplierTypeOutsideClick: () => {
        if (typeof PurchasingModule.state.supplierTypeOutsideHandler === 'function') {
            document.removeEventListener('mousedown', PurchasingModule.state.supplierTypeOutsideHandler);
        }
        PurchasingModule.state.supplierTypeOutsideHandler = null;
    },

    getSupplierTypeUsageCount: (typeId) => {
        const target = String(typeId || '').trim();
        if (!target) return 0;
        const rows = Array.isArray(DB.data?.data?.suppliers) ? DB.data.data.suppliers : [];
        return rows.filter((row) => Array.isArray(row?.supplierTypes) && row.supplierTypes.includes(target)).length;
    },

    renderSupplierTypeManageBodyHtml: () => {
        const options = PurchasingModule.getSupplierTypeOptions();
        const editingId = String(PurchasingModule.state.supplierTypeManageEditId || '').trim();
        const editing = editingId
            ? options.find((opt) => String(opt?.id || '').trim() === editingId)
            : null;
        return `
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
                <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.5rem; align-items:end;">
                    <div>
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem; font-weight:700;">Tip kodu</label>
                        <input id="sup_type_manage_code" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(editing?.code || ''))}" placeholder="or: 320.01.26">
                    </div>
                    <div style="grid-column:span 2;">
                        <label style="display:block; font-size:0.72rem; color:#64748b; margin-bottom:0.2rem; font-weight:700;">Tip adi</label>
                        <input id="sup_type_manage_name" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(editing?.name || ''))}" placeholder="or: KIMYASAL MALZEME">
                    </div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-sm" onclick="PurchasingModule.resetSupplierTypeManageForm()">temizle</button>
                    <button class="btn-primary" onclick="PurchasingModule.saveSupplierTypeFromManageModal()">${editing ? 'guncelle' : 'ekle'}</button>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.7rem; overflow:auto; max-height:46vh;">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8fafc; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                <th style="padding:0.55rem; text-align:left;">Kod</th>
                                <th style="padding:0.55rem; text-align:left;">Tip Adi</th>
                                <th style="padding:0.55rem; text-align:left;">Kullanim</th>
                                <th style="padding:0.55rem; text-align:right;">Islem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${options.length === 0
                ? '<tr><td colspan="4" style="padding:1rem; text-align:center; color:#94a3b8;">Kayitli tip yok.</td></tr>'
                : options.map((opt) => {
                    const id = String(opt.id || '').trim();
                    const usage = PurchasingModule.getSupplierTypeUsageCount(id);
                    return `
                                        <tr style="border-top:1px solid #f1f5f9;">
                                            <td style="padding:0.55rem; font-family:Consolas, monospace; color:#1d4ed8; font-weight:700;">${PurchasingModule.escapeHtml(String(opt.code || '-'))}</td>
                                            <td style="padding:0.55rem; color:#334155; font-weight:700;">${PurchasingModule.escapeHtml(String(opt.name || '-'))}</td>
                                            <td style="padding:0.55rem; color:#64748b;">${PurchasingModule.escapeHtml(String(usage))}</td>
                                            <td style="padding:0.55rem; text-align:right;">
                                                <div style="display:inline-flex; gap:0.35rem;">
                                                    <button class="btn-sm" style="height:30px;" onclick="PurchasingModule.startEditSupplierTypeOption('${PurchasingModule.escapeHtml(id)}')">duzenle</button>
                                                    <button class="btn-sm" style="height:30px; color:#b91c1c; border-color:#fecaca; background:#fef2f2;" onclick="PurchasingModule.deleteSupplierTypeFromManageModal('${PurchasingModule.escapeHtml(id)}')">sil</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    openSupplierTypeManageModal: () => {
        PurchasingModule.state.supplierTypeManageEditId = '';
        const html = `<div id="sup_type_manage_root">${PurchasingModule.renderSupplierTypeManageBodyHtml()}</div>`;
        Modal.open('Tedarikci Tipi Yonetimi', html, { maxWidth: '900px', closeExisting: false });
    },

    refreshSupplierTypeManageModal: () => {
        const root = document.getElementById('sup_type_manage_root');
        if (!root) return;
        root.innerHTML = PurchasingModule.renderSupplierTypeManageBodyHtml();
    },

    startEditSupplierTypeOption: (typeId) => {
        PurchasingModule.state.supplierTypeManageEditId = String(typeId || '').trim();
        PurchasingModule.refreshSupplierTypeManageModal();
    },

    resetSupplierTypeManageForm: () => {
        PurchasingModule.state.supplierTypeManageEditId = '';
        PurchasingModule.refreshSupplierTypeManageModal();
    },

    saveSupplierTypeFromManageModal: async () => {
        try {
            const code = String(document.getElementById('sup_type_manage_code')?.value || '').trim();
            const name = String(document.getElementById('sup_type_manage_name')?.value || '').trim();
            if (!code && !name) return alert('Tip kodu veya tip adi giriniz.');
            PurchasingModule.upsertSupplierTypeOption({ code, name }, PurchasingModule.state.supplierTypeManageEditId || '');

            DB.data.data.suppliers = (DB.data.data.suppliers || []).map((row, index) => PurchasingModule.normalizeSupplierRecord(row, index));
            await DB.save();
            PurchasingModule.state.supplierTypeManageEditId = '';
            PurchasingModule.refreshSupplierTypeManageModal();
            PurchasingModule.refreshSupplierTypePickerUi();
            UI.renderCurrentPage();
        } catch (error) {
            alert(error?.message || 'Tip kaydedilemedi.');
        }
    },

    deleteSupplierTypeFromManageModal: async (typeId) => {
        const targetId = String(typeId || '').trim();
        if (!targetId) return;
        const options = PurchasingModule.getSupplierTypeOptions();
        const idx = options.findIndex((opt) => String(opt.id || '').trim() === targetId);
        if (idx === -1) return;
        const usage = PurchasingModule.getSupplierTypeUsageCount(targetId);
        const label = PurchasingModule.getSupplierTypeLabel(options[idx]);
        const confirmMsg = usage > 0
            ? `${label} tipi ${usage} tedarikcide kullaniliyor. Silersen secimler kaldirilacak. Devam edilsin mi?`
            : `${label} tipi silinsin mi?`;
        if (!confirm(confirmMsg)) return;

        options.splice(idx, 1);
        DB.data.meta.options.supplierTypes = options;
        DB.data.data.suppliers = (DB.data.data.suppliers || []).map((row, index) => {
            const nextTypes = Array.isArray(row?.supplierTypes)
                ? row.supplierTypes.filter((id) => String(id || '').trim() !== targetId)
                : [];
            return PurchasingModule.normalizeSupplierRecord({ ...row, supplierTypes: nextTypes }, index);
        });
        await DB.save();
        PurchasingModule.state.supplierTypeManageEditId = '';
        PurchasingModule.refreshSupplierTypeManageModal();
        PurchasingModule.refreshSupplierTypePickerUi();
        UI.renderCurrentPage();
    },

    buildSupplierImportIdentity: (row = {}) => {
        const externalCodeKey = PurchasingModule.normalizeExternalCodeKey(row?.externalCode || '');
        const taxKey = PurchasingModule.normalizeTaxKey(row?.taxNo || '');
        const nameKey = PurchasingModule.normalizeAsciiUpper(row?.name || '');
        const phoneKey = PurchasingModule.normalizePhoneKey(row?.phone || '');
        const namePhoneKey = (nameKey && phoneKey) ? `${nameKey}|${phoneKey}` : '';
        return { externalCodeKey, taxKey, namePhoneKey };
    },

    getSupplierImportMatchKey: (row = {}) => {
        const identity = PurchasingModule.buildSupplierImportIdentity(row);
        if (identity.externalCodeKey) return `external:${identity.externalCodeKey}`;
        if (identity.taxKey) return `tax:${identity.taxKey}`;
        if (identity.namePhoneKey) return `namePhone:${identity.namePhoneKey}`;
        return '';
    },

    ensureXlsxLib: async () => {
        if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
        const scriptId = 'xlsx-lib-cdn';
        const existing = document.getElementById(scriptId);
        if (existing) {
            await new Promise((resolve, reject) => {
                if (window.XLSX) return resolve();
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error('XLSX kutuphanesi yuklenemedi.')), { once: true });
            });
            return window.XLSX;
        }
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('XLSX kutuphanesi yuklenemedi.'));
            document.head.appendChild(script);
        });
        if (!window.XLSX) throw new Error('XLSX kutuphanesi kullanilamiyor.');
        return window.XLSX;
    },

    findImportColumnIndex: (headerMap, names = []) => {
        for (let i = 0; i < names.length; i += 1) {
            const key = PurchasingModule.normalizeImportToken(names[i]);
            if (!key) continue;
            if (Object.prototype.hasOwnProperty.call(headerMap, key)) return headerMap[key];
        }
        return -1;
    },

    toImportRowValue: (row, idx) => String(Array.isArray(row) ? (row[idx] ?? '') : '').trim(),

    parseSupplierTypeTokensFromRow: (row = [], headerMap = {}) => {
        const idxType = PurchasingModule.findImportColumnIndex(headerMap, ['tedarikci tipi', 'tedarikci turu', 'tip', 'grup', 'kategori']);
        const idxTypeCode = PurchasingModule.findImportColumnIndex(headerMap, ['tedarikci tipi kodu', 'tip kodu', 'grup kodu']);
        const idxTypeName = PurchasingModule.findImportColumnIndex(headerMap, ['tedarikci tipi adi', 'tip adi', 'grup adi']);

        const bag = [];
        const pushBag = (value) => {
            String(value || '')
                .split(/[;,|]+/)
                .map((item) => String(item || '').trim())
                .filter(Boolean)
                .forEach((item) => bag.push(item));
        };

        pushBag(PurchasingModule.toImportRowValue(row, idxType));
        const code = PurchasingModule.toImportRowValue(row, idxTypeCode);
        const name = PurchasingModule.toImportRowValue(row, idxTypeName);
        if (code || name) {
            bag.push([code, name].filter(Boolean).join(' - ').trim());
        }

        return Array.from(new Set(bag));
    },

    parseSuppliersFromWorksheetRows: (sheetRows = []) => {
        if (!Array.isArray(sheetRows) || !sheetRows.length) {
            return { parsedRows: [], skippedRows: [], fileRowCount: 0 };
        }
        const headerRaw = Array.isArray(sheetRows[0]) ? sheetRows[0] : [];
        const headerMap = {};
        headerRaw.forEach((cell, index) => {
            const key = PurchasingModule.normalizeImportToken(cell);
            if (!key) return;
            if (!Object.prototype.hasOwnProperty.call(headerMap, key)) headerMap[key] = index;
        });

        const idxExternalCode = PurchasingModule.findImportColumnIndex(headerMap, ['cari kodu', 'cari kod', 'tedarikci kodu', 'tedarikci cari kodu']);
        const idxName = PurchasingModule.findImportColumnIndex(headerMap, ['tedarikci unvani', 'tedarikci adi', 'firma adi', 'cari unvani', 'unvan']);
        const idxPerson = PurchasingModule.findImportColumnIndex(headerMap, ['yetkili', 'yetkili kisi', 'yetkili ad']);
        const idxPhone = PurchasingModule.findImportColumnIndex(headerMap, ['telefon', 'gsm tel', 'sabit tel', 'tel no']);
        const idxEmail = PurchasingModule.findImportColumnIndex(headerMap, ['eposta', 'e posta', 'mail']);
        const idxWeb = PurchasingModule.findImportColumnIndex(headerMap, ['web', 'internet adresi', 'website']);
        const idxTaxNo = PurchasingModule.findImportColumnIndex(headerMap, ['vergi no', 'vkn', 'tc kimlik no', 'tc']);
        const idxTaxOffice = PurchasingModule.findImportColumnIndex(headerMap, ['vergi dairesi']);
        const idxAddress = PurchasingModule.findImportColumnIndex(headerMap, ['adres', 'acik adres']);
        const idxCity = PurchasingModule.findImportColumnIndex(headerMap, ['sehir', 'il']);
        const idxCountry = PurchasingModule.findImportColumnIndex(headerMap, ['ulke']);
        const idxNote = PurchasingModule.findImportColumnIndex(headerMap, ['not', 'ozel not', 'tedarikci notu']);
        const idxEntityType = PurchasingModule.findImportColumnIndex(headerMap, ['tedarikci tipi kayit', 'firma tipi', 'kayit tipi', 'sirket bireysel']);
        const idxDiscount = PurchasingModule.findImportColumnIndex(headerMap, ['genel iskonto', 'iskonto']);
        const idxPaymentTermDays = PurchasingModule.findImportColumnIndex(headerMap, ['odeme vadesi gun', 'vade gun', 'odeme vadesi']);
        const idxRiskLimit = PurchasingModule.findImportColumnIndex(headerMap, ['risk limiti']);

        const parsedRows = [];
        const skippedRows = [];

        for (let i = 1; i < sheetRows.length; i += 1) {
            const row = Array.isArray(sheetRows[i]) ? sheetRows[i] : [];
            const name = PurchasingModule.toImportRowValue(row, idxName);
            if (!name) {
                const isCompletelyEmpty = row.every((cell) => String(cell || '').trim() === '');
                if (isCompletelyEmpty) continue;
                skippedRows.push({ sheetRow: i + 1, reason: 'Firma adi bos oldugu icin atlandi.' });
                continue;
            }

            const person = PurchasingModule.toImportRowValue(row, idxPerson);
            const phone = PurchasingModule.toImportRowValue(row, idxPhone);
            const email = PurchasingModule.toImportRowValue(row, idxEmail);
            const supplierTypeTokens = PurchasingModule.parseSupplierTypeTokensFromRow(row, headerMap);
            const contacts = PurchasingModule.normalizeSupplierContactList([{
                id: crypto.randomUUID(),
                name: person,
                position: '',
                phones: [phone],
                email,
                note: ''
            }], { allowEmptyRow: false, keepEmptyPhoneSlot: false });

            parsedRows.push({
                sourceRow: i + 1,
                externalCode: PurchasingModule.toImportRowValue(row, idxExternalCode),
                name,
                entityType: PurchasingModule.normalizeText(PurchasingModule.toImportRowValue(row, idxEntityType)) === 'bireysel' ? 'person' : 'company',
                person,
                phone,
                email,
                web: PurchasingModule.toImportRowValue(row, idxWeb),
                taxNo: PurchasingModule.toImportRowValue(row, idxTaxNo),
                taxOffice: PurchasingModule.toImportRowValue(row, idxTaxOffice),
                address: PurchasingModule.toImportRowValue(row, idxAddress),
                city: PurchasingModule.toImportRowValue(row, idxCity),
                country: PurchasingModule.toImportRowValue(row, idxCountry),
                notes: PurchasingModule.toImportRowValue(row, idxNote),
                discountRate: PurchasingModule.toImportRowValue(row, idxDiscount),
                paymentTermDays: PurchasingModule.toImportRowValue(row, idxPaymentTermDays),
                riskLimit: PurchasingModule.toImportRowValue(row, idxRiskLimit),
                supplierTypeTokens,
                supplierContacts: contacts
            });
        }

        return { parsedRows, skippedRows, fileRowCount: Math.max(0, sheetRows.length - 1) };
    },

    buildSupplierImportPreview: (parsedRows = [], skippedRows = []) => {
        const existing = (Array.isArray(DB.data?.data?.suppliers) ? DB.data.data.suppliers : [])
            .map((row, index) => PurchasingModule.normalizeSupplierRecord(row, index));
        const existingByMatchKey = new Map();
        existing.forEach((row) => {
            const key = PurchasingModule.getSupplierImportMatchKey(row);
            if (!key) return;
            if (!existingByMatchKey.has(key)) {
                existingByMatchKey.set(key, String(row?.id || '').trim());
            }
        });

        const previewRows = [];
        const latestRowByMatchKey = new Map();

        parsedRows.forEach((row) => {
            const matchKey = PurchasingModule.getSupplierImportMatchKey(row);
            if (matchKey && latestRowByMatchKey.has(matchKey)) {
                const previousIndex = latestRowByMatchKey.get(matchKey);
                if (typeof previousIndex === 'number' && previousIndex >= 0 && previewRows[previousIndex]) {
                    const previous = previewRows[previousIndex];
                    previewRows[previousIndex] = {
                        ...previous,
                        status: 'duplicate',
                        reason: `Dosyada tekrarlandi. Son satir (${String(row?.sourceRow || '-')}) esas alindi.`,
                        warnings: [],
                        matchedSupplierId: '',
                        importable: false
                    };
                }
            }

            const warnings = [];
            const matchedSupplierId = matchKey ? String(existingByMatchKey.get(matchKey) || '').trim() : '';
            let status = 'ready';
            let reason = '';

            if (!String(row?.phone || '').trim()) warnings.push('Telefon eksik');
            if (!String(row?.taxNo || '').trim()) warnings.push('Vergi no eksik');
            if (!String(row?.externalCode || '').trim()) warnings.push('Cari kodu eksik');

            if (status !== 'duplicate' && matchedSupplierId) {
                status = 'update';
                reason = 'Mevcut tedarikci guncellenecek.';
            }

            if ((status === 'ready' || status === 'update') && warnings.length > 0) {
                if (status === 'ready') status = 'warning';
                reason = reason
                    ? `${reason} Uyari: ${warnings.join(', ')}.`
                    : warnings.join(', ');
            } else if ((status === 'ready' || status === 'warning') && !reason) {
                reason = 'Yeni tedarikci eklenecek.';
            }

            previewRows.push({
                ...row,
                status,
                reason,
                warnings,
                matchedSupplierId,
                importable: status === 'ready' || status === 'warning' || status === 'update'
            });
            if (matchKey) latestRowByMatchKey.set(matchKey, previewRows.length - 1);
        });

        const counters = {
            ready: previewRows.filter((row) => row.status === 'ready').length,
            update: previewRows.filter((row) => row.status === 'update').length,
            warning: previewRows.filter((row) => row.status === 'warning').length,
            duplicate: previewRows.filter((row) => row.status === 'duplicate').length,
            skipped: Array.isArray(skippedRows) ? skippedRows.length : 0
        };

        return { rows: previewRows, skippedRows, counters };
    },

    renderSupplierImportPreviewRowsHtml: (rows = []) => {
        if (!Array.isArray(rows) || !rows.length) {
            return '<tr><td colspan="8" style="padding:0.9rem; text-align:center; color:#94a3b8;">Aktarilacak uygun satir bulunamadi.</td></tr>';
        }
        return rows.map((row) => {
            const statusMeta = row.status === 'duplicate'
                ? { text: 'Mukerrer', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }
                : (row.status === 'update'
                    ? { text: 'Guncelle', bg: '#e0f2fe', color: '#075985', border: '#bae6fd' }
                    : (row.status === 'warning'
                        ? { text: 'Eksik Bilgi', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' }
                        : { text: 'Eklenecek', bg: '#dcfce7', color: '#166534', border: '#86efac' }));
            const typeText = Array.isArray(row?.supplierTypeTokens) && row.supplierTypeTokens.length
                ? row.supplierTypeTokens.join(', ')
                : '-';
            return `
                <tr style="border-bottom:1px solid #eef2f7;">
                    <td style="padding:0.5rem; font-family:Consolas,monospace; color:#475569;">${PurchasingModule.escapeHtml(String(row?.sourceRow || '-'))}</td>
                    <td style="padding:0.5rem;">
                        <span style="display:inline-flex; align-items:center; padding:0.18rem 0.52rem; border:1px solid ${PurchasingModule.escapeHtml(statusMeta.border)}; border-radius:999px; background:${PurchasingModule.escapeHtml(statusMeta.bg)}; color:${PurchasingModule.escapeHtml(statusMeta.color)}; font-size:0.72rem; font-weight:800;">${PurchasingModule.escapeHtml(statusMeta.text)}</span>
                    </td>
                    <td style="padding:0.5rem; font-family:Consolas,monospace;">${PurchasingModule.escapeHtml(String(row?.externalCode || '-'))}</td>
                    <td style="padding:0.5rem; font-weight:700; color:#334155;">${PurchasingModule.escapeHtml(String(row?.name || '-'))}</td>
                    <td style="padding:0.5rem;">${PurchasingModule.escapeHtml(String(row?.phone || '-'))}</td>
                    <td style="padding:0.5rem;">${PurchasingModule.escapeHtml(typeText)}</td>
                    <td style="padding:0.5rem;">${PurchasingModule.escapeHtml(String(row?.city || '-'))}</td>
                    <td style="padding:0.5rem; color:#64748b;">${PurchasingModule.escapeHtml(String(row?.reason || '-'))}</td>
                </tr>
            `;
        }).join('');
    },

    openSupplierExcelImportPicker: () => {
        const input = document.getElementById('purchasing_supplier_excel_import_input');
        if (!input) return alert('Dosya secme alani bulunamadi.');
        input.value = '';
        input.click();
    },

    handleSupplierExcelImportInput: async (input) => {
        try {
            const file = input?.files?.[0];
            if (!file) return;
            await PurchasingModule.ensureXlsxLib();
            const buffer = await file.arrayBuffer();
            const workbook = window.XLSX.read(buffer, { type: 'array', raw: false, cellText: true, cellDates: false });
            const firstSheetName = Array.isArray(workbook?.SheetNames) ? workbook.SheetNames[0] : '';
            if (!firstSheetName) return alert('Dosyada sayfa bulunamadi.');
            const sheet = workbook.Sheets[firstSheetName];
            const sheetRows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            const parsed = PurchasingModule.parseSuppliersFromWorksheetRows(sheetRows);
            const preview = PurchasingModule.buildSupplierImportPreview(parsed.parsedRows, parsed.skippedRows);
            PurchasingModule.state.supplierImportPreview = {
                fileName: String(file?.name || 'dosya'),
                fileRowCount: parsed.fileRowCount,
                rows: preview.rows,
                skippedRows: preview.skippedRows,
                counters: preview.counters
            };
            PurchasingModule.openSupplierImportPreviewModal();
        } catch (error) {
            console.error(error);
            alert(`Excel dosyasi okunamadi: ${error?.message || 'Bilinmeyen hata'}`);
        } finally {
            if (input) input.value = '';
        }
    },

    openSupplierImportPreviewModal: () => {
        const preview = PurchasingModule.state.supplierImportPreview;
        if (!preview || !Array.isArray(preview.rows)) return alert('Onizleme verisi bulunamadi.');
        const counters = preview.counters || { ready: 0, update: 0, warning: 0, duplicate: 0, skipped: 0 };
        const importableCount = preview.rows.filter((row) => row.importable).length;
        const skippedAndDuplicate = Number(counters.duplicate || 0) + Number(counters.skipped || 0);
        const skippedHtml = (preview.skippedRows || []).length
            ? `
                <div style="margin-top:0.55rem; border:1px solid #fcd34d; background:#fffbeb; color:#92400e; border-radius:0.6rem; padding:0.55rem; font-size:0.82rem;">
                    <strong>Atlanan satirlar:</strong>
                    ${(preview.skippedRows || []).slice(0, 8).map((item) => `Satir ${PurchasingModule.escapeHtml(String(item?.sheetRow || '-'))}: ${PurchasingModule.escapeHtml(String(item?.reason || '-'))}`).join(' | ')}
                    ${(preview.skippedRows || []).length > 8 ? ` | +${(preview.skippedRows || []).length - 8} satir daha` : ''}
                </div>
            `
            : '';

        const html = `
            <div style="display:flex; flex-direction:column; gap:0.65rem;">
                <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Dosya satiri</div><div style="font-weight:800; color:#0f172a;">${PurchasingModule.escapeHtml(String(preview.fileRowCount || 0))}</div></div>
                    <div style="border:1px solid #bbf7d0; background:#f0fdf4; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#166534;">Yeni eklenecek</div><div style="font-weight:800; color:#166534;">${PurchasingModule.escapeHtml(String(counters.ready || 0))}</div></div>
                    <div style="border:1px solid #bae6fd; background:#f0f9ff; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#075985;">Guncellenecek</div><div style="font-weight:800; color:#075985;">${PurchasingModule.escapeHtml(String(counters.update || 0))}</div></div>
                    <div style="border:1px solid #fecaca; background:#fef2f2; border-radius:0.6rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#991b1b;">Atlanan / Mukerrer</div><div style="font-weight:800; color:#991b1b;">${PurchasingModule.escapeHtml(String(skippedAndDuplicate))}</div></div>
                </div>
                <div style="font-size:0.8rem; color:#92400e;">Eksik bilgi ile islenecek: <strong>${PurchasingModule.escapeHtml(String(counters.warning || 0))}</strong></div>
                <div style="font-size:0.82rem; color:#64748b;">Dosya: <strong>${PurchasingModule.escapeHtml(String(preview.fileName || '-'))}</strong></div>
                <div style="max-height:52vh; overflow:auto; border:1px solid #e2e8f0; border-radius:0.7rem;">
                    <table style="width:100%; min-width:980px; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc; color:#64748b; font-size:0.72rem; text-transform:uppercase;">
                                <th style="padding:0.5rem; text-align:left;">Satir</th>
                                <th style="padding:0.5rem; text-align:left;">Durum</th>
                                <th style="padding:0.5rem; text-align:left;">Cari kodu</th>
                                <th style="padding:0.5rem; text-align:left;">Tedarikci</th>
                                <th style="padding:0.5rem; text-align:left;">Telefon</th>
                                <th style="padding:0.5rem; text-align:left;">Tip</th>
                                <th style="padding:0.5rem; text-align:left;">Sehir</th>
                                <th style="padding:0.5rem; text-align:left;">Aciklama</th>
                            </tr>
                        </thead>
                        <tbody>${PurchasingModule.renderSupplierImportPreviewRowsHtml(preview.rows)}</tbody>
                    </table>
                </div>
                ${skippedHtml}
                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-sm" onclick="Modal.close()">vazgec</button>
                    <button class="btn-primary" onclick="PurchasingModule.commitSupplierExcelImport()" ${importableCount > 0 ? '' : 'disabled'}>${importableCount} kaydi iceri al</button>
                </div>
            </div>
        `;
        Modal.open('Tedarikci Excel Iceri Aktarma Onizleme', html, { maxWidth: '1200px' });
    },

    commitSupplierExcelImport: async () => {
        PurchasingModule.ensureDataDefaults();
        const preview = PurchasingModule.state.supplierImportPreview;
        if (!preview || !Array.isArray(preview.rows)) return alert('Aktarma onizlemesi bulunamadi.');
        const importableRows = preview.rows.filter((row) => row.importable);
        if (!importableRows.length) return alert('Iceri alinacak kayit yok.');
        const supplierRows = Array.isArray(DB.data?.data?.suppliers) ? DB.data.data.suppliers : [];
        const supplierIndexById = new Map(
            supplierRows.map((row, index) => [String(row?.id || '').trim(), index])
        );
        const pickText = (incoming, current = '') => {
            const normalizedIncoming = String(incoming || '').trim();
            if (normalizedIncoming) return normalizedIncoming;
            return String(current || '').trim();
        };
        const pickNumber = (incoming, current, parser) => {
            const incomingText = String(incoming || '').trim();
            if (!incomingText) return parser(current || 0);
            return parser(incomingText);
        };

        const now = new Date().toISOString();
        let added = 0;
        let updated = 0;

        importableRows.forEach((item) => {
            const name = String(item?.name || '').trim();
            if (!name) return;

            const typeIds = PurchasingModule.resolveOrCreateSupplierTypeIds(item?.supplierTypeTokens || []);
            const matchedSupplierId = String(item?.matchedSupplierId || '').trim();
            const targetIndex = matchedSupplierId ? supplierIndexById.get(matchedSupplierId) : -1;

            const incomingContacts = PurchasingModule.normalizeSupplierContactList(
                Array.isArray(item?.supplierContacts) ? item.supplierContacts : [],
                { allowEmptyRow: false, keepEmptyPhoneSlot: false }
            );
            const firstContact = incomingContacts[0] || {};
            const firstPhone = Array.isArray(firstContact?.phones) && firstContact.phones.length
                ? String(firstContact.phones[0] || '').trim()
                : '';
            const firstEmail = String(firstContact?.email || '').trim();
            const firstName = String(firstContact?.name || '').trim();

            if (Number.isInteger(targetIndex) && targetIndex >= 0) {
                const prev = PurchasingModule.normalizeSupplierRecord(supplierRows[targetIndex] || {}, targetIndex);
                const nextTypeIds = typeIds.length > 0 ? typeIds : (Array.isArray(prev.supplierTypes) ? prev.supplierTypes : []);
                const payload = {
                    ...prev,
                    name,
                    externalCode: pickText(item?.externalCode, prev?.externalCode),
                    entityType: String(item?.entityType || prev?.entityType || 'company').trim() || 'company',
                    supplierTypes: nextTypeIds,
                    tags: PurchasingModule.mergeTagsWithTypes(prev?.tags || [], nextTypeIds),
                    notes: pickText(item?.notes, prev?.notes),
                    discountRate: pickNumber(item?.discountRate, prev?.discountRate, PurchasingModule.parsePercent),
                    paymentTermDays: pickNumber(item?.paymentTermDays, prev?.paymentTermDays, PurchasingModule.parseDays),
                    riskLimit: pickNumber(item?.riskLimit, prev?.riskLimit, PurchasingModule.parseMoney),
                    supplierContacts: incomingContacts.length
                        ? incomingContacts
                        : PurchasingModule.normalizeSupplierContactList(prev?.supplierContacts || [], { allowEmptyRow: false, keepEmptyPhoneSlot: false }),
                    contact: {
                        person: pickText(item?.person || firstName, prev?.contact?.person),
                        phone: pickText(item?.phone || firstPhone, prev?.contact?.phone),
                        email: pickText(item?.email || firstEmail, prev?.contact?.email),
                        web: pickText(item?.web, prev?.contact?.web),
                        tax: pickText(item?.taxNo, prev?.contact?.tax),
                        taxOffice: pickText(item?.taxOffice, prev?.contact?.taxOffice),
                        address: pickText(item?.address, prev?.contact?.address),
                        city: pickText(item?.city, prev?.contact?.city),
                        country: pickText(item?.country, prev?.contact?.country)
                    },
                    updated_at: now
                };
                supplierRows[targetIndex] = PurchasingModule.normalizeSupplierRecord(payload, targetIndex);
                updated += 1;
                return;
            }

            const payload = PurchasingModule.normalizeSupplierRecord({
                id: crypto.randomUUID(),
                name,
                externalCode: String(item?.externalCode || '').trim(),
                entityType: String(item?.entityType || 'company').trim() || 'company',
                supplierTypes: typeIds,
                tags: PurchasingModule.mergeTagsWithTypes([], typeIds),
                notes: String(item?.notes || '').trim(),
                discountRate: PurchasingModule.parsePercent(item?.discountRate || 0),
                paymentTermDays: PurchasingModule.parseDays(item?.paymentTermDays || 0),
                riskLimit: PurchasingModule.parseMoney(item?.riskLimit || 0),
                supplierContacts: incomingContacts,
                contact: {
                    person: String(item?.person || firstName || '').trim(),
                    phone: String(item?.phone || firstPhone || '').trim(),
                    email: String(item?.email || firstEmail || '').trim(),
                    web: String(item?.web || '').trim(),
                    tax: String(item?.taxNo || '').trim(),
                    taxOffice: String(item?.taxOffice || '').trim(),
                    address: String(item?.address || '').trim(),
                    city: String(item?.city || '').trim(),
                    country: String(item?.country || '').trim()
                },
                created_at: now,
                updated_at: now
            }, supplierRows.length);
            supplierRows.push(payload);
            added += 1;
        });

        DB.data.data.suppliers = supplierRows.map((row, index) => PurchasingModule.normalizeSupplierRecord(row, index));
        await DB.save();
        PurchasingModule.state.supplierImportPreview = null;
        Modal.close();
        UI.renderCurrentPage();
        alert(`Excel aktarimi tamamlandi. Yeni: ${added}, Guncellenen: ${updated}.`);
    },

    render: (container) => {
        PurchasingModule.ensureDataDefaults();

        const { activeTab, searchTerm } = PurchasingModule.state;
        const orders = DB.data.data.orders || [];
        const requests = DB.data.data.requests || [];
        const suppliers = (DB.data.data.suppliers || []).map((row, index) => PurchasingModule.normalizeSupplierRecord(row, index));
        const term = PurchasingModule.normalizeText(searchTerm);
        const linkedCache = new Map();
        const getLinkedProducts = (supplier) => {
            const key = supplier.id || `name:${PurchasingModule.normalizeText(supplier.name)}`;
            if (!linkedCache.has(key)) linkedCache.set(key, PurchasingModule.getLinkedProductsForSupplier(supplier));
            return linkedCache.get(key);
        };

        const filteredSuppliers = suppliers.filter((s) => {
            if (!term) return true;
            const linkedProducts = getLinkedProducts(s);
            const typeText = Array.isArray(s.supplierTypeNames) ? s.supplierTypeNames.join(' ') : '';
            return (
                PurchasingModule.normalizeText(s.name).includes(term) ||
                PurchasingModule.normalizeText(s.externalCode).includes(term) ||
                PurchasingModule.normalizeText(s.contact?.person).includes(term) ||
                PurchasingModule.normalizeText(s.contact?.phone).includes(term) ||
                PurchasingModule.normalizeText(s.contact?.tax).includes(term) ||
                PurchasingModule.normalizeText(typeText).includes(term) ||
                PurchasingModule.normalizeText(linkedProducts.join(' ')).includes(term)
            );
        });

        const renderTabBtn = (id, label, icon) => `
            <button onclick="PurchasingModule.setTab('${id}')"
                class="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === id ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white text-slate-500 hover:bg-slate-50'}">
                <i data-lucide="${icon}" width="20"></i> ${label}
            </button>
        `;

        const renderStat = (title, val, icon, color, bg) => `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-4 rounded-xl ${bg} ${color}">
                    <i data-lucide="${icon}" width="24"></i>
                </div>
                <div>
                    <p class="text-sm text-slate-400 font-medium">${title}</p>
                    <h3 class="text-2xl font-bold text-slate-700">${val}</h3>
                </div>
            </div>
        `;

        let contentHtml = '';

        if (activeTab === 'orders') {
            const pendingOrders = orders.filter(o => o.status === 'pending');
            contentHtml = `
                <div class="space-y-4">
                    <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                        <div class="text-blue-500"><i data-lucide="info" width="20"></i></div>
                        <p class="text-blue-700 text-sm"><b>Not:</b> Siparisler alanini sonra detaylandiracagiz.</p>
                    </div>
                    ${pendingOrders.length === 0
                    ? `<div class="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">Bekleyen siparis yok.</div>`
                    : pendingOrders.map(o => `
                            <div class="bg-white p-4 rounded-2xl border border-slate-100">
                                <b>${PurchasingModule.escapeHtml(String(o.supplierName || 'Tedarikci'))}</b> - ${PurchasingModule.escapeHtml(String(o.itemName || '-'))} (${PurchasingModule.escapeHtml(String(o.quantity || 0))} adet)
                            </div>
                        `).join('')}
                </div>
            `;
        } else if (activeTab === 'requests') {
            contentHtml = `
                <div class="space-y-4">
                    <div class="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
                        <div class="text-amber-500"><i data-lucide="alert-triangle" width="20"></i></div>
                        <p class="text-amber-700 text-sm"><b>Not:</b> Talep havuzu alanini sonra detaylandiracagiz.</p>
                    </div>
                    ${requests.length === 0
                    ? `<div class="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400">Bekleyen talep yok.</div>`
                    : requests.map(r => `
                            <div class="bg-white p-4 rounded-2xl border border-slate-100">
                                <b>${PurchasingModule.escapeHtml(String(r.productName || '-'))}</b> - ${PurchasingModule.escapeHtml(String(r.quantity || 0))} adet
                            </div>
                        `).join('')}
                </div>
            `;
        } else {
            contentHtml = `
                <div style="display:flex; flex-direction:column; gap:1rem">
                    <div style="display:flex; gap:0.75rem; align-items:center; background:white; border:1px solid #e2e8f0; border-radius:0.9rem; padding:0.9rem; flex-wrap:wrap;">
                        <div style="flex:1; position:relative; min-width:280px;">
                            <input
                                value="${PurchasingModule.escapeHtml(String(searchTerm || ''))}"
                                oninput="PurchasingModule.setSearch(this.value, this.selectionStart)"
                                placeholder="Firma, cari kod, tip, yetkili, telefon, urun ara..."
                                style="width:100%; padding:0.75rem 0.75rem 0.75rem 2.2rem; border:1px solid #e2e8f0; border-radius:0.7rem; outline:none; background:#f8fafc"
                            />
                            <i data-lucide="search" width="18" style="position:absolute; left:10px; top:12px; color:#94a3b8"></i>
                        </div>
                        <input id="purchasing_supplier_excel_import_input" type="file" accept=".xls,.xlsx" style="display:none;" onchange="PurchasingModule.handleSupplierExcelImportInput(this)">
                        <button class="btn-sm" onclick="PurchasingModule.openSupplierExcelImportPicker()" style="height:42px;">
                            excelden ice aktar
                        </button>
                        <button onclick="PurchasingModule.newSupplierModal()" style="border:none; background:#0f172a; color:white; padding:0.75rem 1rem; border-radius:0.7rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:0.4rem; height:42px;">
                            <i data-lucide="plus" width="18"></i> Yeni tedarikci
                        </button>
                    </div>

                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; overflow:hidden">
                        <table style="width:100%; min-width:1200px; border-collapse:collapse">
                            <thead>
                                <tr style="background:#f8fafc; color:#64748b; font-size:0.78rem; text-transform:uppercase">
                                    <th style="text-align:left; padding:0.9rem 1rem">Cari kodu</th>
                                    <th style="text-align:left; padding:0.9rem 1rem">Firma</th>
                                    <th style="text-align:left; padding:0.9rem 1rem">Tedarikci tipi</th>
                                    <th style="text-align:left; padding:0.9rem 1rem">Yetkili</th>
                                    <th style="text-align:left; padding:0.9rem 1rem">Telefon</th>
                                    <th style="text-align:left; padding:0.9rem 1rem">Bagli urun</th>
                                    <th style="text-align:right; padding:0.9rem 1rem">Islem</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredSuppliers.length === 0
                    ? `<tr><td colspan="7" style="padding:2rem; text-align:center; color:#94a3b8">Tedarikci kaydi yok.</td></tr>`
                    : filteredSuppliers.map(s => {
                        const linkedProducts = getLinkedProducts(s);
                        const linkedCount = linkedProducts.length;
                        const linkedPreview = linkedProducts.slice(0, 2).join(', ');
                        const typeText = Array.isArray(s.supplierTypeNames) && s.supplierTypeNames.length
                            ? s.supplierTypeNames.slice(0, 2).join(', ')
                            : '-';
                        return `
                                        <tr onclick="PurchasingModule.editSupplier('${PurchasingModule.escapeHtml(String(s.id || ''))}')" style="border-top:1px solid #f1f5f9; cursor:pointer">
                                            <td style="padding:0.9rem 1rem; font-family:Consolas,monospace; color:#1d4ed8; font-weight:700;">${PurchasingModule.escapeHtml(String(s.externalCode || '-'))}</td>
                                            <td style="padding:0.9rem 1rem">
                                                <div style="font-weight:700; color:#334155">${PurchasingModule.escapeHtml(String(s.name || '-'))}</div>
                                                <div style="font-size:0.75rem; color:#94a3b8">${PurchasingModule.escapeHtml(String(s.contact?.tax || ''))}</div>
                                            </td>
                                            <td style="padding:0.9rem 1rem; color:#475569;">${PurchasingModule.escapeHtml(typeText)}${Array.isArray(s.supplierTypeNames) && s.supplierTypeNames.length > 2 ? `<div style="font-size:0.72rem; color:#94a3b8;">+${PurchasingModule.escapeHtml(String(s.supplierTypeNames.length - 2))} daha</div>` : ''}</td>
                                            <td style="padding:0.9rem 1rem; color:#475569">${PurchasingModule.escapeHtml(String(s.contact?.person || '-'))}</td>
                                            <td style="padding:0.9rem 1rem; color:#64748b">${PurchasingModule.escapeHtml(String(s.contact?.phone || '-'))}</td>
                                            <td style="padding:0.9rem 1rem; color:#64748b">
                                                ${linkedCount > 0 ? `${linkedCount} urun` : '-'}
                                                ${linkedPreview ? `<div style="font-size:0.75rem; color:#94a3b8; margin-top:0.2rem">${PurchasingModule.escapeHtml(linkedPreview)}${linkedCount > 2 ? ', ...' : ''}</div>` : ''}
                                            </td>
                                            <td style="padding:0.9rem 1rem; text-align:right">
                                                <button onclick="event.stopPropagation(); PurchasingModule.deleteSupplier('${PurchasingModule.escapeHtml(String(s.id || ''))}')" style="border:none; background:none; color:#cbd5e1; cursor:pointer"><i data-lucide="trash-2" width="18"></i></button>
                                            </td>
                                        </tr>
                                    `;
                    }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="max-w-7xl mx-auto space-y-8 p-6 md:p-10 font-sans">
                <div class="flex flex-col gap-4">
                    <button onclick="location.reload()" class="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors w-fit">
                        <i data-lucide="arrow-left" width="20"></i>
                        <span>Ana Menuye Don</span>
                    </button>

                    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Satin Alma Yonetimi</h1>
                            <p class="text-slate-500 mt-1">Hammadde tedariki, siparis takibi ve ic talepler.</p>
                        </div>
                        <div class="flex gap-4">
                            ${renderStat('Bekleyen', orders.filter(o => o.status === 'pending').length, 'clock', 'text-orange-600', 'bg-orange-100')}
                            ${renderStat('Talepler', requests.length, 'alert-triangle', 'text-red-600', 'bg-red-100')}
                        </div>
                    </div>
                </div>

                <div class="flex gap-2 overflow-x-auto pb-2">
                    ${renderTabBtn('orders', 'Siparisler', 'truck')}
                    ${renderTabBtn('requests', 'Talep Havuzu', 'file-text')}
                    ${renderTabBtn('suppliers', 'Tedarikciler', 'users')}
                </div>

                <div class="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    ${contentHtml}
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    setTab: (tabId) => {
        PurchasingModule.state.activeTab = tabId;
        UI.renderCurrentPage();
    },

    setSearch: (value, caretPos = null) => {
        PurchasingModule.state.searchTerm = value;
        UI.renderCurrentPage();
        setTimeout(() => {
            const el = document.querySelector('input[placeholder*="ara"]');
            if (el) {
                el.focus();
                el.value = value;
                const pos = Number.isInteger(caretPos) ? caretPos : value.length;
                if (typeof el.setSelectionRange === 'function') {
                    el.setSelectionRange(pos, pos);
                }
            }
        }, 10);
    },

    newOrderModal: () => {
        alert('Siparis olusturma modali (hazirlaniyor...)');
    },

    newSupplierModal: () => PurchasingModule.openSupplierModal(null),

    editSupplier: (id) => PurchasingModule.openSupplierModal(id || null),

    renderSupplierModalFormHtml: (supplier = null, linkedProductsText = '') => {
        const src = supplier || {};
        const selectedTypeIds = Array.isArray(src?.supplierTypes) ? src.supplierTypes : [];
        const contacts = PurchasingModule.normalizeSupplierContactList(
            PurchasingModule.state.supplierContactRowsDraft,
            { allowEmptyRow: false, keepEmptyPhoneSlot: false }
        );
        const hasContacts = contacts.length > 0;
        return `
            <div style="display:flex; flex-direction:column; gap:0.95rem;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; padding-bottom:0.6rem; border-bottom:1px solid #e2e8f0;">
                    <div>
                        <h3 style="margin:0; font-size:1.2rem; color:#0f172a; font-weight:800">Tedarikci Karti</h3>
                        <p style="margin:0.35rem 0 0; color:#64748b; font-size:0.86rem">Kaydet ve sonra duzenleyebil.</p>
                    </div>
                    <button onclick="PurchasingModule.closeSupplierModal()" style="border:1.5px solid #cbd5e1; background:white; width:32px; height:32px; border-radius:0.6rem; font-size:1.25rem; color:#64748b; cursor:pointer; line-height:1;">&times;</button>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.9rem; background:#ffffff;">
                    <div style="display:flex; align-items:center; gap:0.55rem; font-size:0.95rem; font-weight:800; color:#1e293b; margin-bottom:0.8rem; padding-bottom:0.5rem; border-bottom:1px solid #e2e8f0;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:999px; background:#dbeafe; color:#1d4ed8; font-size:0.74rem; font-weight:800; border:1px solid #bfdbfe;">1</span>
                        <span>Tedarikci Kimlik Karti</span>
                    </div>
                    <div style="display:grid; grid-template-columns:minmax(0,1.55fr) minmax(0,1fr); gap:0.85rem;">
                        <div style="display:flex; flex-direction:column; gap:0.72rem;">
                            <div>
                                <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.22rem;">Tedarikci unvani <span style="color:#e11d48;">*</span></label>
                                <input id="new_sup_name" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.name || ''))}" placeholder="or: Akpa Aluminyum A.S.">
                            </div>
                            <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                                <div>
                                    <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.22rem;">Kayit tipi</label>
                                    <select id="new_sup_entity_type" class="stock-input stock-input-tall">
                                        <option value="company" ${String(src?.entityType || 'company') === 'company' ? 'selected' : ''}>Sirket</option>
                                        <option value="person" ${String(src?.entityType || 'company') === 'person' ? 'selected' : ''}>Bireysel</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.22rem;">Cari kodu</label>
                                    <input id="new_sup_external_code" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.externalCode || ''))}" placeholder="or: 320.01.A.002">
                                </div>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.22rem;">Tedarikci tipi</label>
                                ${PurchasingModule.renderSupplierTypePickerHtml(selectedTypeIds)}
                            </div>
                        </div>
                        <div style="border:1px solid #e2e8f0; border-radius:0.8rem; background:#f8fafc; padding:0.65rem;">
                            <div style="font-size:0.66rem; text-transform:uppercase; letter-spacing:0.04em; font-weight:800; color:#64748b; margin-bottom:0.45rem;">Cari ve vergi bilgileri</div>
                            <div style="display:flex; flex-direction:column; gap:0.5rem;">
                                <div>
                                    <label style="display:block; font-size:0.7rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Vergi dairesi</label>
                                    <input id="new_sup_tax_office" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.contact?.taxOffice || ''))}">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.7rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Vergi no</label>
                                    <input id="new_sup_tax" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.contact?.tax || ''))}">
                                </div>
                                <div>
                                    <label style="display:block; font-size:0.7rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Web</label>
                                    <input id="new_sup_web" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.contact?.web || ''))}" placeholder="https://firma.com">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.9rem; background:#ffffff;">
                    <div style="display:flex; align-items:center; gap:0.55rem; font-size:0.95rem; font-weight:800; color:#1e293b; margin-bottom:0.8rem; padding-bottom:0.5rem; border-bottom:1px solid #e2e8f0;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:999px; background:#e0e7ff; color:#4338ca; font-size:0.74rem; font-weight:800; border:1px solid #c7d2fe;">2</span>
                        <span>Yetkili Kisiler (Temas Noktalari)</span>
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-bottom:0.5rem;">
                        <button type="button" class="btn-sm" style="height:33px; color:#4338ca; border-color:#c7d2fe; background:#eef2ff; font-weight:700;" onclick="PurchasingModule.addSupplierContactRow()">yeni yetkili ekle</button>
                    </div>
                    <div id="new_sup_contacts_empty" style="display:${hasContacts ? 'none' : 'flex'}; align-items:center; justify-content:center; border:2px dashed #dbe5f0; border-radius:0.8rem; min-height:86px; color:#94a3b8; font-size:0.84rem; background:#f8fafc;">Henuz bir yetkili kisi eklenmedi.</div>
                    <div id="new_sup_contacts_table_wrap" style="display:${hasContacts ? 'block' : 'none'}; border:1px solid #e2e8f0; border-radius:0.8rem; overflow:auto;">
                        <table style="width:100%; min-width:760px; border-collapse:separate; border-spacing:0;">
                            <thead style="background:#f8fafc;">
                                <tr style="color:#64748b; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.03em;">
                                    <th style="padding:0.56rem 0.7rem; text-align:left; border-bottom:1px solid #e2e8f0;">Ad Soyad</th>
                                    <th style="padding:0.56rem 0.7rem; text-align:left; border-bottom:1px solid #e2e8f0;">Gorevi</th>
                                    <th style="padding:0.56rem 0.7rem; text-align:left; border-bottom:1px solid #e2e8f0;">Telefon</th>
                                    <th style="padding:0.56rem 0.7rem; text-align:left; border-bottom:1px solid #e2e8f0;">E-posta</th>
                                    <th style="padding:0.56rem 0.7rem; text-align:right; border-bottom:1px solid #e2e8f0; width:88px;">Islem</th>
                                </tr>
                            </thead>
                            <tbody id="new_sup_contacts_tbody">
                                ${PurchasingModule.renderSupplierContactRowsHtml(contacts)}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.9rem; background:#ffffff;">
                    <div style="display:flex; align-items:center; gap:0.55rem; font-size:0.95rem; font-weight:800; color:#1e293b; margin-bottom:0.8rem; padding-bottom:0.5rem; border-bottom:1px solid #e2e8f0;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:999px; background:#d1fae5; color:#047857; font-size:0.74rem; font-weight:800; border:1px solid #a7f3d0;">3</span>
                        <span>Adres ve Konum Bilgileri</span>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.65rem;">
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Sehir</label>
                            <input id="new_sup_city" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.contact?.city || ''))}" placeholder="or: Ankara">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Ulke</label>
                            <input id="new_sup_country" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.contact?.country || 'Turkiye'))}" placeholder="Turkiye">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Telefon (genel)</label>
                            <input id="new_sup_phone" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.contact?.phone || ''))}" placeholder="05xx xxx xx xx">
                        </div>
                        <div style="grid-column:span 3;">
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Acik adres</label>
                            <textarea id="new_sup_addr1" class="stock-textarea" style="min-height:72px;">${PurchasingModule.escapeHtml(String(src?.contact?.address || ''))}</textarea>
                        </div>
                    </div>
                </div>

                <div style="border:1px solid #e2e8f0; border-radius:0.95rem; padding:0.9rem; background:#ffffff;">
                    <div style="display:flex; align-items:center; gap:0.55rem; font-size:0.95rem; font-weight:800; color:#1e293b; margin-bottom:0.8rem; padding-bottom:0.5rem; border-bottom:1px solid #e2e8f0;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:999px; background:#f1f5f9; color:#334155; font-size:0.74rem; font-weight:800; border:1px solid #e2e8f0;">4</span>
                        <span>Finansal ve Ozel Notlar</span>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.65rem;">
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Genel iskonto (%)</label>
                            <input id="new_sup_discount" type="number" min="0" max="100" step="0.01" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.discountRate || 0))}">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Odeme vadesi (gun)</label>
                            <input id="new_sup_term_days" type="number" min="0" step="1" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.paymentTermDays || 0))}">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Risk limiti</label>
                            <input id="new_sup_risk_limit" type="number" min="0" step="0.01" class="stock-input stock-input-tall" value="${PurchasingModule.escapeHtml(String(src?.riskLimit || 0))}">
                        </div>
                        <div style="grid-column:span 3;">
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Bagli urunler (otomatik)</label>
                            <div style="border:1px solid #cbd5e1; border-radius:0.65rem; min-height:52px; padding:0.55rem; background:#f8fafc; color:#334155; font-size:0.83rem; line-height:1.45;">${PurchasingModule.escapeHtml(String(linkedProductsText || 'Urun kartinda bu tedarikci secildikce burada otomatik gorunur.'))}</div>
                        </div>
                        <div style="grid-column:span 3;">
                            <label style="display:block; font-size:0.72rem; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:0.2rem;">Not</label>
                            <textarea id="new_sup_notes" class="stock-textarea" style="min-height:72px;">${PurchasingModule.escapeHtml(String(src?.notes || ''))}</textarea>
                        </div>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.45rem;">
                    <button class="btn-sm" onclick="PurchasingModule.closeSupplierModal()">iptal</button>
                    <button id="new_sup_save_btn" class="btn-primary">kaydet</button>
                </div>
            </div>
        `;
    },

    openSupplierModal: (editId = null) => {
        const supplier = editId
            ? PurchasingModule.normalizeSupplierRecord((DB.data.data.suppliers || []).find(x => String(x?.id || '').trim() === String(editId || '').trim()) || {}, 0)
            : null;
        const linkedProducts = supplier ? PurchasingModule.getLinkedProductsForSupplier(supplier) : [];
        const linkedProductsText = linkedProducts.length > 0
            ? linkedProducts.join(', ')
            : 'Urun kartinda bu tedarikci secildikce burada otomatik gorunur.';

        PurchasingModule.state.supplierModalEditId = String(editId || '').trim();
        PurchasingModule.state.supplierTypePanelOpen = false;
        PurchasingModule.state.supplierTypeSearch = '';
        PurchasingModule.state.supplierContactModal = null;
        PurchasingModule.state.supplierContactRowsDraft = PurchasingModule.buildSupplierContactsFromSupplier(supplier || {});

        const modalContent = PurchasingModule.renderSupplierModalFormHtml(supplier, linkedProductsText);
        Modal.open('', modalContent, { maxWidth: '980px', showHeader: false });

        const saveBtn = document.getElementById('new_sup_save_btn');
        if (saveBtn) {
            saveBtn.textContent = supplier ? 'guncelle' : 'kaydet';
            saveBtn.onclick = () => PurchasingModule.saveSupplier(PurchasingModule.state.supplierModalEditId || '');
        }

        PurchasingModule.bindSupplierTypeOutsideClick();
        PurchasingModule.refreshSupplierTypePickerUi();
        PurchasingModule.refreshSupplierContactsTableState();
    },

    closeSupplierModal: () => {
        PurchasingModule.unbindSupplierTypeOutsideClick();
        PurchasingModule.state.supplierTypePanelOpen = false;
        PurchasingModule.state.supplierTypeSearch = '';
        PurchasingModule.state.supplierModalEditId = '';
        PurchasingModule.state.supplierContactRowsDraft = [];
        PurchasingModule.state.supplierContactModal = null;
        Modal.close();
    },

    readSupplierDraftFromDom: () => {
        const read = (id) => document.getElementById(id)?.value ?? '';
        const supplierContacts = PurchasingModule.normalizeSupplierContactList(
            PurchasingModule.getSupplierContactRowsFromDom(),
            { allowEmptyRow: false, keepEmptyPhoneSlot: false }
        );
        const firstContact = supplierContacts[0] || {};
        const firstPhone = Array.isArray(firstContact?.phones) && firstContact.phones.length
            ? String(firstContact.phones[0] || '').trim()
            : '';
        const firstEmail = String(firstContact?.email || '').trim();
        const firstName = String(firstContact?.name || '').trim();
        const supplierTypes = PurchasingModule.getSelectedSupplierTypeIdsFromDom();
        return {
            name: String(read('new_sup_name')).trim(),
            externalCode: String(read('new_sup_external_code')).trim(),
            entityType: String(read('new_sup_entity_type')).trim() || 'company',
            supplierTypes,
            notes: String(read('new_sup_notes')).trim(),
            discountRate: PurchasingModule.parsePercent(read('new_sup_discount')),
            paymentTermDays: PurchasingModule.parseDays(read('new_sup_term_days')),
            riskLimit: PurchasingModule.parseMoney(read('new_sup_risk_limit')),
            supplierContacts,
            contact: {
                person: firstName || String(read('new_sup_person')).trim(),
                phone: String(read('new_sup_phone')).trim() || firstPhone,
                email: firstEmail || String(read('new_sup_email')).trim(),
                web: String(read('new_sup_web')).trim(),
                tax: String(read('new_sup_tax')).trim(),
                taxOffice: String(read('new_sup_tax_office')).trim(),
                address: String(read('new_sup_addr1')).trim(),
                city: String(read('new_sup_city')).trim(),
                country: String(read('new_sup_country')).trim()
            }
        };
    },

    saveSupplier: async (editId = '') => {
        const draft = PurchasingModule.readSupplierDraftFromDom();
        if (!String(draft?.name || '').trim()) {
            alert('Lutfen firma adini giriniz.');
            return;
        }

        if (!DB.data.data.suppliers) DB.data.data.suppliers = [];
        const now = new Date().toISOString();

        if (editId) {
            const idx = DB.data.data.suppliers.findIndex(s => String(s?.id || '').trim() === String(editId || '').trim());
            if (idx !== -1) {
                const prev = PurchasingModule.normalizeSupplierRecord(DB.data.data.suppliers[idx], idx);
                const payload = {
                    ...prev,
                    ...draft,
                    tags: PurchasingModule.mergeTagsWithTypes(prev?.tags || [], draft.supplierTypes || []),
                    updated_at: now
                };
                DB.data.data.suppliers[idx] = PurchasingModule.normalizeSupplierRecord(payload, idx);
            }
        } else {
            const payload = {
                id: crypto.randomUUID(),
                ...draft,
                tags: PurchasingModule.mergeTagsWithTypes([], draft.supplierTypes || []),
                created_at: now,
                updated_at: now
            };
            DB.data.data.suppliers.push(PurchasingModule.normalizeSupplierRecord(payload, DB.data.data.suppliers.length));
        }

        await DB.save();
        PurchasingModule.closeSupplierModal();
        UI.renderCurrentPage();
    },

    unlinkSupplierReferences: (supplier = {}) => {
        const target = (supplier && typeof supplier === 'object') ? supplier : {};
        const targetId = String(target?.id || '').trim();
        const targetName = String(target?.name || '').trim();
        if (!targetId && !targetName) {
            return { productsTouched: 0, profilesTouched: 0, linksRemoved: 0 };
        }

        const matchesByName = (value) => {
            if (!targetName) return false;
            return PurchasingModule.normalizeText(value) === PurchasingModule.normalizeText(targetName);
        };
        const matchesById = (value) => {
            if (!targetId) return false;
            return String(value || '').trim() === targetId;
        };
        const isSupplierLinkMatch = (link) => {
            const linkId = String(link?.supplierId || link?.id || '').trim();
            const linkName = String(link?.supplierName || link?.name || '').trim();
            return matchesById(linkId) || matchesByName(linkName);
        };
        const removeFromArrayField = (container, key, matcher) => {
            if (!container || typeof container !== 'object' || !Array.isArray(container[key])) return 0;
            const before = container[key].length;
            container[key] = container[key].filter((item) => !matcher(item));
            return Math.max(0, before - container[key].length);
        };
        const clearScalarField = (container, key, matcher) => {
            if (!container || typeof container !== 'object') return 0;
            if (!Object.prototype.hasOwnProperty.call(container, key)) return 0;
            const current = container[key];
            if (current === undefined || current === null || current === '') return 0;
            if (matcher(current)) {
                container[key] = '';
                return 1;
            }
            return 0;
        };

        let productsTouched = 0;
        let profilesTouched = 0;
        let linksRemoved = 0;

        const products = Array.isArray(DB.data?.data?.products) ? DB.data.data.products : [];
        products.forEach((product) => {
            if (!product || typeof product !== 'object') return;
            let removedCount = 0;
            removedCount += removeFromArrayField(product, 'suppliers', (ref) => PurchasingModule.supplierMatchesRef(target, ref));
            removedCount += removeFromArrayField(product, 'supplierIds', (ref) => matchesById(ref) || matchesByName(ref));
            removedCount += removeFromArrayField(product, 'supplierNames', (ref) => matchesByName(ref) || matchesById(ref));
            removedCount += removeFromArrayField(product, 'supplierLinks', (link) => isSupplierLinkMatch(link));

            removedCount += clearScalarField(product, 'supplierId', (value) => matchesById(value) || matchesByName(value));
            removedCount += clearScalarField(product, 'supplierName', (value) => matchesByName(value) || matchesById(value));

            const specs = (product.specs && typeof product.specs === 'object') ? product.specs : null;
            removedCount += removeFromArrayField(specs, 'suppliers', (ref) => PurchasingModule.supplierMatchesRef(target, ref));
            removedCount += removeFromArrayField(specs, 'supplierIds', (ref) => matchesById(ref) || matchesByName(ref));
            removedCount += removeFromArrayField(specs, 'supplierNames', (ref) => matchesByName(ref) || matchesById(ref));
            removedCount += removeFromArrayField(specs, 'supplierLinks', (link) => isSupplierLinkMatch(link));
            removedCount += clearScalarField(specs, 'supplierId', (value) => matchesById(value) || matchesByName(value));
            removedCount += clearScalarField(specs, 'supplierName', (value) => matchesByName(value) || matchesById(value));

            if (removedCount > 0) {
                productsTouched += 1;
                linksRemoved += removedCount;
            }
        });

        const profiles = Array.isArray(DB.data?.data?.aluminumProfiles) ? DB.data.data.aluminumProfiles : [];
        profiles.forEach((profile) => {
            if (!profile || typeof profile !== 'object') return;
            const removedCount = removeFromArrayField(profile, 'suppliers', (ref) => PurchasingModule.supplierMatchesRef(target, ref));
            if (removedCount > 0) {
                profilesTouched += 1;
                linksRemoved += removedCount;
            }
        });

        return { productsTouched, profilesTouched, linksRemoved };
    },

    deleteSupplier: async (id) => {
        const targetId = String(id || '').trim();
        if (!targetId) return;
        const suppliers = Array.isArray(DB.data?.data?.suppliers) ? DB.data.data.suppliers : [];
        const supplier = suppliers.find((row) => String(row?.id || '').trim() === targetId) || null;
        const supplierLabel = String(supplier?.name || targetId).trim() || targetId;
        if (!confirm(`${supplierLabel} kaydi silinsin mi? Bagli urun referanslari da otomatik temizlenecek.`)) return;

        const cleanup = supplier ? PurchasingModule.unlinkSupplierReferences(supplier) : { productsTouched: 0, profilesTouched: 0, linksRemoved: 0 };
        DB.data.data.suppliers = suppliers.filter((row) => String(row?.id || '').trim() !== targetId);
        await DB.save();
        UI.renderCurrentPage();
        if (cleanup.linksRemoved > 0) {
            alert(`Tedarikci silindi. ${cleanup.linksRemoved} bag temizlendi (${cleanup.productsTouched} urun, ${cleanup.profilesTouched} profil).`);
        }
    }
};
