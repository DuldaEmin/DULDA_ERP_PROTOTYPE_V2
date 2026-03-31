const UnitModule = {
    state: {
        activeUnitId: null,
        view: 'list', // view: list | dashboard | machines | stock | personnel | cncLibrary | sawCut | plexiLibrary | pvdLibrary | eloksalLibrary | polishLibrary | extruderLibrary | montageLibrary | unitLibraryEmpty | depoTransfer | unitDepot | workOrderPlanning
        stockTab: 'ROD',
        selectedCncCardId: null,
        cncSearchName: '',
        cncSearchId: '',
        cncFormOpen: false,
        cncEditingId: null,
        cncDraftId: null,
        cncDraftOperations: [],
        cncDraftDrawing: null,
        sawSearchName: '',
        sawSearchCode: '',
        sawSearchLen: '',
        sawSelectedOrderId: null,
        sawProcessName: '',
        sawCutLen: '',
        sawChamfer: false,
        sawNote: '',
        sawFormOpen: false,
        sawEditingId: null,
        sawDraftCode: '',
        plexiSearchName: '',
        plexiSearchId: '',
        plexiSelectedId: null,
        plexiFormOpen: false,
        plexiEditingId: null,
        plexiProcessName: '',
        plexiUseFire: false,
        plexiUseBrush: false,
        plexiOvenMinutes: '',
        plexiNote: '',
        pvdSearchName: '',
        pvdSearchId: '',
        pvdSelectedId: null,
        pvdFormOpen: false,
        pvdEditingId: null,
        pvdProductName: '',
        pvdColorType: '',
        pvdColor: '',
        pvdColorCode: '',
        pvdNote: '',
        elxSearchName: '',
        elxSearchId: '',
        elxSelectedId: null,
        elxFormOpen: false,
        elxEditingId: null,
        elxProductName: '',
        elxProcessType: 'ELOKSAL',
        elxColorType: 'eloksal',
        elxColor: '',
        elxColorCode: '',
        elxNote: '',
        polishSearchName: '',
        polishSearchId: '',
        polishSelectedId: null,
        polishFormOpen: false,
        polishEditingId: null,
        polishProductName: '',
        polishSurface: '',
        polishNote: '',
        extruderSearchDia: '',
        extruderSearchLen: '',
        extruderSearchColor: '',
        extruderSearchKind: '',
        extruderSearchCode: '',
        extruderSelectedId: null,
        extruderFormOpen: false,
        extruderEditingId: null,
        extruderDraftType: 'ROD',
        extruderDraftName: '',
        extruderDraftDia: '',
        extruderDraftThick: '',
        extruderDraftLen: '',
        extruderDraftColorType: '',
        extruderDraftColor: '',
        extruderDraftColorCode: '',
        extruderDraftBubble: false,
        extruderDraftNote: '',
        libraryReturnContext: null,
        depoTaskSearchName: '',
        depoTaskSearchRoute: '',
        depoTaskSearchCode: '',
        depoTaskSearchTarget: '',
        depoTaskFormOpen: false,
        depoTaskEditingId: null,
        depoTaskSelectedId: null,
        depoTaskDraftCode: '',
        depoTaskDraftName: '',
        depoTaskDraftNote: '',
        workOrderTab: 'AKTIF',
        workOrderSearch: '',
        workOrderPlanningUnitId: '',
        workOrderTransferTarget: '',
        workOrderDispatchListTarget: '',
        workOrderDispatchRows: {},
        workOrderDispatchQtyByRow: {},
        workOrderDispatchDraft: null,
        workOrderStatsRange: 'WEEK',
        workOrderStatsGroup: 'UNIT',
        workOrderStatsProcess: '',
        workOrderFormOpen: false,
        workOrderDraftMontageId: '',
        workOrderDraftLotQty: '100',
        workOrderDraftDueDate: '',
        workOrderDraftPriority: 'NORMAL',
        workOrderDraftNote: '',
        freeVendorSearch: '',
        freeVendorFormOpen: false,
        freeVendorEditingId: null,
        freeVendorDraftName: '',
        freeVendorDraftPerson: '',
        freeVendorDraftPhone: '',
        freeVendorDraftEmail: '',
        freeVendorDraftAddress: '',
        freeVendorDraftCity: '',
        freeVendorDraftNotes: ''
    },

    render: (container) => {
        const { view, activeUnitId } = UnitModule.state;

        if (!DB.data.data.inventory) DB.data.data.inventory = [];
        if (!DB.data.data.cncCards) DB.data.data.cncCards = [];
        if (!DB.data.data.plexiPolishCards) DB.data.data.plexiPolishCards = [];
        if (!DB.data.data.pvdCards) DB.data.data.pvdCards = [];
        if (!DB.data.data.eloksalCards) DB.data.data.eloksalCards = [];
        if (!DB.data.data.ibrahimPolishCards) DB.data.data.ibrahimPolishCards = [];
        if (!DB.data.data.montageCards) DB.data.data.montageCards = [];
        if (!DB.data.data.processColorLists || typeof DB.data.data.processColorLists !== 'object') DB.data.data.processColorLists = {};
        if (!DB.data.data.polishSurfaceLists || typeof DB.data.data.polishSurfaceLists !== 'object') DB.data.data.polishSurfaceLists = {};
        if (!DB.data.data.extruderLibraryCards) DB.data.data.extruderLibraryCards = [];
        if (!DB.data.data.depoTransferTasks) DB.data.data.depoTransferTasks = [];
        if (!DB.data.data.depoTransferLogs) DB.data.data.depoTransferLogs = [];
        if (!DB.data.data.depoRoutes) DB.data.data.depoRoutes = [];
        if (!DB.data.data.freeExternalVendorJobs) DB.data.data.freeExternalVendorJobs = [];
        if (!DB.data.data.suppliers) DB.data.data.suppliers = [];
        if (!DB.data.data.workOrders) DB.data.data.workOrders = [];
        if (!DB.data.data.workOrderTransactions) DB.data.data.workOrderTransactions = [];
        if (!DB.data.data.partComponentCards) DB.data.data.partComponentCards = [];

        // Seed Data 
        if (!DB.data.data.units || DB.data.data.units.length === 0) {
            DB.data.data.units = [
                { id: 'u1', name: 'CNC ATOLYESI', type: 'internal' },
                { id: 'u2', name: 'EKSTRUDER ATOLYESI', type: 'internal' },
                { id: 'u3', name: 'MONTAJ', type: 'internal' },
                { id: 'u5', name: 'PLEKSI POLISAJ ATOLYESI', type: 'internal' },
                { id: 'u7', name: 'TESTERE ATOLYESI', type: 'internal' },
                { id: 'u_dtm', name: 'DEPO TRANSFER', type: 'internal' },
                { id: 'u9', name: 'HILAL PWD', type: 'external' },
                { id: 'u10', name: 'IBRAHIM POLISAJ', type: 'external' },
                { id: 'u11', name: 'TEKIN ELOKSAL', type: 'external' }
            ];
            if (DB.fileHandle) DB.save();
        }


        // System unit: keep Depo Transfer in internal units.
        const mainDepotUnit = (DB.data.data.units || []).find(u => u.id === 'u_dtm');
        if (!mainDepotUnit) {
            DB.data.data.units.push({ id: 'u_dtm', name: 'DEPO TRANSFER', type: 'internal' });
            DB.markDirty();
        } else if (String(mainDepotUnit.name || '').trim().toUpperCase() !== 'DEPO TRANSFER') {
            mainDepotUnit.name = 'DEPO TRANSFER';
            DB.markDirty();
        }
        // Legacy adlari yeni isimlendirmeye tasir.
        let depoNamingChanged = false;
        (Array.isArray(DB.data.data.depoTransferTasks) ? DB.data.data.depoTransferTasks : []).forEach((task) => {
            const rawName = String(task?.taskName || '');
            if (!rawName) return;
            let nextName = rawName;
            if (/ana depoya/gi.test(nextName)) nextName = nextName.replace(/ana depoya/gi, 'depo transfere');
            if (/ana depo/gi.test(nextName)) nextName = nextName.replace(/ana depo/gi, 'depo transfer');
            if (nextName !== rawName) {
                task.taskName = nextName;
                depoNamingChanged = true;
            }
        });
        (Array.isArray(DB.data.data.workOrders) ? DB.data.data.workOrders : []).forEach((order) => {
            (Array.isArray(order?.lines) ? order.lines : []).forEach((line) => {
                (Array.isArray(line?.routes) ? line.routes : []).forEach((route) => {
                    if (String(route?.stationId || '') !== 'u_dtm') return;
                    const stationName = String(route?.stationName || '');
                    if (!stationName || !/ana depo/gi.test(stationName)) return;
                    route.stationName = 'DEPO TRANSFER';
                    depoNamingChanged = true;
                });
            });
        });
        if (depoNamingChanged) DB.markDirty();
        // Punta atolyesi artik kullanilmiyor; eski kayitlardan da temizle.
        const puntaIds = (DB.data.data.units || [])
            .filter(u => String(u?.name || '').toUpperCase().includes('PUNTA AT'))
            .map(u => u.id);
        if (puntaIds.length > 0) {
            DB.data.data.units = (DB.data.data.units || []).filter(u => !puntaIds.includes(u.id));
            if (Array.isArray(DB.data.data.machines)) {
                DB.data.data.machines = DB.data.data.machines.filter(m => !puntaIds.includes(m.unitId));
            }
            if (UnitModule.state.activeUnitId && puntaIds.includes(UnitModule.state.activeUnitId)) {
                UnitModule.state.activeUnitId = null;
                UnitModule.state.view = 'list';
            }
            DB.markDirty();
        }

        if (!Array.isArray(DB.data.data.machines)) DB.data.data.machines = [];
        if (!DB.data.meta || typeof DB.data.meta !== 'object') DB.data.meta = {};
        if (!DB.data.meta.seedFlags || typeof DB.data.meta.seedFlags !== 'object') DB.data.meta.seedFlags = {};
        if (!DB.data.meta.seedFlags.machinesSeededV1) {
            if (DB.data.data.machines.length === 0) {
                DB.data.data.machines = [
                    { id: 'm1', unitId: 'u2', name: 'Ekstruder Hatti 1', status: 'ACTIVE' },
                    { id: 'm2', unitId: 'u2', name: 'Ekstruder Hatti 2', status: 'MAINTENANCE' },
                    { id: 'm3', unitId: 'u1', name: 'CNC Kesim 1', status: 'IDLE' }
                ];
            }
            DB.data.meta.seedFlags.machinesSeededV1 = true;
            DB.markDirty();
        }

        // Paketleme birimi kaldirildi; eski kayitlardan da temizle.
        const packageIds = (DB.data.data.units || [])
            .filter(u => String(u?.id || '') === 'u4' || String(u?.name || '').toUpperCase().includes('PAKETLEME'))
            .map(u => u.id);
        if (packageIds.length > 0) {
            DB.data.data.units = (DB.data.data.units || []).filter(u => !packageIds.includes(u.id));
            if (Array.isArray(DB.data.data.machines)) {
                DB.data.data.machines = DB.data.data.machines.filter(m => !packageIds.includes(m.unitId));
            }
            if (Array.isArray(DB.data.data.personnel)) {
                DB.data.data.personnel = DB.data.data.personnel.map((person) => {
                    if (!person || typeof person !== 'object') return person;
                    const assignedUnitIds = Array.isArray(person.assignedUnitIds)
                        ? person.assignedUnitIds.filter((unitId) => !packageIds.includes(unitId))
                        : [];
                    const unitPermissions = person.unitPermissions && typeof person.unitPermissions === 'object'
                        ? Object.fromEntries(Object.entries(person.unitPermissions).filter(([unitId]) => !packageIds.includes(unitId)))
                        : person.unitPermissions;
                    return {
                        ...person,
                        assignedUnitIds,
                        unitId: packageIds.includes(person.unitId) ? (assignedUnitIds[0] || '') : person.unitId,
                        unitPermissions
                    };
                });
            }
            if (UnitModule.state.activeUnitId && packageIds.includes(UnitModule.state.activeUnitId)) {
                UnitModule.state.activeUnitId = null;
                UnitModule.state.view = 'list';
            }
            DB.markDirty();
        }

        // AKPA Aluminyum birimi kaldirildi; eski kayitlardan da temizle.
        const akpaUnitIds = (DB.data.data.units || [])
            .filter((u) => String(u?.id || '') === 'u8' || String(u?.name || '').toUpperCase().includes('AKPA'))
            .map((u) => u.id);
        if (akpaUnitIds.length > 0) {
            DB.data.data.units = (DB.data.data.units || []).filter((u) => !akpaUnitIds.includes(u.id));
            if (Array.isArray(DB.data.data.machines)) {
                DB.data.data.machines = DB.data.data.machines.filter((m) => !akpaUnitIds.includes(m.unitId));
            }
            if (Array.isArray(DB.data.data.personnel)) {
                DB.data.data.personnel = DB.data.data.personnel.map((person) => {
                    if (!person || typeof person !== 'object') return person;
                    const assignedUnitIds = Array.isArray(person.assignedUnitIds)
                        ? person.assignedUnitIds.filter((unitId) => !akpaUnitIds.includes(unitId))
                        : [];
                    const unitPermissions = person.unitPermissions && typeof person.unitPermissions === 'object'
                        ? Object.fromEntries(Object.entries(person.unitPermissions).filter(([unitId]) => !akpaUnitIds.includes(unitId)))
                        : person.unitPermissions;
                    return {
                        ...person,
                        assignedUnitIds,
                        unitId: akpaUnitIds.includes(person.unitId) ? (assignedUnitIds[0] || '') : person.unitId,
                        unitPermissions
                    };
                });
            }
            if (UnitModule.state.activeUnitId && akpaUnitIds.includes(UnitModule.state.activeUnitId)) {
                UnitModule.state.activeUnitId = null;
                UnitModule.state.view = 'list';
            }
            DB.markDirty();
        }

        if (view === 'list') {
            UnitModule.renderList(container);
        } else if (view === 'dashboard') {
            UnitModule.renderUnitDashboard(container, activeUnitId);
        } else if (view === 'machines') {
            UnitModule.renderMachineList(container, activeUnitId);
        } else if (view === 'stock') {
            UnitModule.renderUnitStock(container, activeUnitId);
        } else if (view === 'personnel') {
            UnitModule.renderUnitPersonnel(container, activeUnitId);
        } else if (view === 'cncLibrary') {
            UnitModule.renderCncLibrary(container, activeUnitId);
        } else if (view === 'sawCut') {
            UnitModule.renderSawCut(container, activeUnitId);
        } else if (view === 'plexiLibrary') {
            UnitModule.renderPlexiLibrary(container, activeUnitId);
        } else if (view === 'pvdLibrary') {
            UnitModule.renderPvdLibrary(container, activeUnitId);
        } else if (view === 'eloksalLibrary') {
            UnitModule.renderEloksalLibrary(container, activeUnitId);
        } else if (view === 'polishLibrary') {
            UnitModule.renderPolishLibrary(container, activeUnitId);
        } else if (view === 'extruderLibrary') {
            UnitModule.renderExtruderLibrary(container, activeUnitId);
        } else if (view === 'montageLibrary') {
            MontageLibraryModule.render(container, activeUnitId);
        } else if (view === 'unitLibraryEmpty') {
            UnitModule.renderUnitLibraryPlaceholder(container, activeUnitId);
        } else if (view === 'depoTransfer') {
            UnitModule.renderDepoTransfer(container);
        } else if (view === 'unitDepot') {
            UnitModule.renderUnitDepotPlaceholder(container, activeUnitId);
        } else if (view === 'workOrderPlanning') {
            UnitModule.renderWorkOrderPlanningPlaceholder(container, activeUnitId);
        } else if (view === 'freeExternalVendors') {
            UnitModule.state.view = 'list';
            UnitModule.renderList(container);
        }

        UnitModule.renderComponentRoutePickerPanel(container);
    },

    openUnit: (id) => {
        if (id === 'u_dtm') {
            if (typeof Router !== 'undefined') Router.navigate('stock');
            if (typeof StockModule !== 'undefined' && StockModule && typeof StockModule.openOperationLibrary === 'function') {
                StockModule.openOperationLibrary();
            }
            return;
        }
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'dashboard';
        UI.renderCurrentPage();
    },
    openUnitDepot: (id) => {
        UnitModule.state.activeUnitId = id || null;
        UnitModule.state.view = 'unitDepot';
        UI.renderCurrentPage();
    },
    openWorkOrderPlanning: (id) => {
        try {
            UnitModule.state.activeUnitId = id || null;
            UnitModule.state.view = 'workOrderPlanning';
            UnitModule.state.workOrderFormOpen = false;
            UnitModule.state.workOrderTransferTarget = '';
            UnitModule.state.workOrderDispatchListTarget = '';
            UnitModule.state.workOrderDispatchRows = {};
            UnitModule.state.workOrderDispatchQtyByRow = {};
            UnitModule.state.workOrderDispatchDraft = null;
            const rows = UnitModule.getWorkOrderPlanningRowsForUnit(UnitModule.state.activeUnitId);
            const hasActive = rows.some((row) => Number(row?.metrics?.inProcessQty || 0) > 0 || Number(row?.metrics?.transferPendingQty || 0) > 0);
            const hasWaiting = rows.some(row => Number(row?.metrics?.availableQty || 0) > 0);
            const hasPool = rows.some((row) => {
                const inProcess = Number(row?.metrics?.inProcessQty || 0);
                const transferPending = Number(row?.metrics?.transferPendingQty || 0);
                const available = Number(row?.metrics?.availableQty || 0);
                const upcoming = Number(row?.upcomingQty || 0);
                return upcoming > 0 && inProcess <= 0 && transferPending <= 0 && available <= 0;
            });
            const hasArchive = rows.some(row => Number(row?.metrics?.doneQty || 0) > 0);
            if (hasActive) {
                UnitModule.state.workOrderTab = 'AKTIF';
            } else if (hasWaiting) {
                UnitModule.state.workOrderTab = 'BEKLEYEN';
            } else if (hasPool) {
                UnitModule.state.workOrderTab = 'HAVUZ';
            } else if (hasArchive) {
                UnitModule.state.workOrderTab = 'ARSIV';
            } else {
                UnitModule.state.workOrderTab = 'AKTIF';
            }
            if (!UnitModule.state.workOrderDraftLotQty) UnitModule.state.workOrderDraftLotQty = '100';
            if (!UnitModule.state.workOrderDraftPriority) UnitModule.state.workOrderDraftPriority = 'NORMAL';
            UI.renderCurrentPage();
        } catch (error) {
            console.error('Is emri planlama ekrani acilamadi:', error);
            alert('Is emri planlama ekrani acilamadi. Lutfen sayfayi yenileyip tekrar deneyin.');
            UnitModule.state.view = 'dashboard';
            UI.renderCurrentPage();
        }
    },
    handleLibraryBack: (unitId) => {
        const returnContext = UnitModule.state.libraryReturnContext;
        UnitModule.state.libraryReturnContext = null;
        if (returnContext?.view === 'workOrderPlanning' && String(returnContext.unitId || '') === String(unitId || '')) {
            UnitModule.openWorkOrderPlanning(unitId);
            return;
        }
        UnitModule.openUnit(unitId);
    },
    openDepoTransfer: () => {
        UnitModule.state.activeUnitId = 'u_dtm';
        UnitModule.state.view = 'depoTransfer';
        UnitModule.state.depoTaskSearchName = '';
        UnitModule.state.depoTaskSearchRoute = '';
        UnitModule.state.depoTaskSearchCode = '';
        UnitModule.state.depoTaskSearchTarget = '';
        UnitModule.state.depoTaskFormOpen = false;
        UnitModule.state.depoTaskEditingId = null;
        UnitModule.state.depoTaskSelectedId = null;
        UnitModule.state.depoTaskDraftCode = '';
        UnitModule.state.depoTaskDraftName = '';
        UnitModule.state.depoTaskDraftNote = '';
        UnitModule.applyPickerPreselectForStation('u_dtm');
        UI.renderCurrentPage();
    },
    openMachines: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'machines'; UI.renderCurrentPage(); },
    openStock: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'stock'; UnitModule.state.stockTab = 'ROD'; UI.renderCurrentPage(); },
    openPersonnel: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'personnel'; UI.renderCurrentPage(); },
    openCncLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'cncLibrary';
        UnitModule.state.selectedCncCardId = null;
        UnitModule.state.cncFormOpen = false;
        UnitModule.state.cncEditingId = null;
        UnitModule.state.cncDraftId = null;
        UnitModule.state.cncDraftOperations = [];
        UnitModule.state.cncDraftDrawing = null;
        if (typeof CncLibraryModule !== 'undefined') {
            CncLibraryModule.state.searchName = '';
            CncLibraryModule.state.searchId = '';
            CncLibraryModule.state.selectedId = null;
            CncLibraryModule.state.formOpen = false;
            CncLibraryModule.state.editingId = null;
            CncLibraryModule.state.draftId = null;
            CncLibraryModule.state.draftOperations = [];
            CncLibraryModule.state.draftDrawing = null;
        }
        UI.renderCurrentPage();
    },
    openSawCut: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'sawCut';
        if (!DB.data.data.sawCutMeta || typeof DB.data.data.sawCutMeta !== 'object') DB.data.data.sawCutMeta = {};
        if (!DB.data.data.sawCutMeta.v2ResetApplied) {
            DB.data.data.sawCutOrders = [];
            DB.data.data.sawCutMeta.v2ResetApplied = true;
            DB.markDirty();
            DB.save();
        }
        UnitModule.state.sawSearchName = '';
        UnitModule.state.sawSearchCode = '';
        UnitModule.state.sawSearchLen = '';
        UnitModule.state.sawSelectedOrderId = null;
        UnitModule.state.sawProcessName = '';
        UnitModule.state.sawCutLen = '';
        UnitModule.state.sawChamfer = false;
        UnitModule.state.sawNote = '';
        UnitModule.state.sawFormOpen = false;
        UnitModule.state.sawEditingId = null;
        UnitModule.state.sawDraftCode = '';
        UI.renderCurrentPage();
    },
    openPlexiLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'plexiLibrary';
        UnitModule.state.plexiSearchName = '';
        UnitModule.state.plexiSearchId = '';
        UnitModule.state.plexiSelectedId = null;
        UnitModule.state.plexiFormOpen = false;
        UnitModule.state.plexiEditingId = null;
        UnitModule.state.plexiProcessName = '';
        UnitModule.state.plexiUseFire = false;
        UnitModule.state.plexiUseBrush = false;
        UnitModule.state.plexiOvenMinutes = '';
        UnitModule.state.plexiNote = '';
        UI.renderCurrentPage();
    },
    openPvdLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'pvdLibrary';
        UnitModule.state.pvdSearchName = '';
        UnitModule.state.pvdSearchId = '';
        UnitModule.state.pvdSelectedId = null;
        UnitModule.state.pvdFormOpen = false;
        UnitModule.state.pvdEditingId = null;
        UnitModule.state.pvdProductName = '';
        UnitModule.state.pvdColorType = '';
        UnitModule.state.pvdColor = '';
        UnitModule.state.pvdColorCode = '';
        UnitModule.state.pvdNote = '';
        UI.renderCurrentPage();
    },
    openEloksalLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'eloksalLibrary';
        UnitModule.state.elxSearchName = '';
        UnitModule.state.elxSearchId = '';
        UnitModule.state.elxSelectedId = null;
        UnitModule.state.elxFormOpen = false;
        UnitModule.state.elxEditingId = null;
        UnitModule.state.elxProductName = '';
        UnitModule.state.elxProcessType = 'ELOKSAL';
        UnitModule.state.elxColorType = 'eloksal';
        UnitModule.state.elxColor = '';
        UnitModule.state.elxColorCode = '';
        UnitModule.state.elxNote = '';
        UI.renderCurrentPage();
    },
    openPolishLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'polishLibrary';
        UnitModule.state.polishSearchName = '';
        UnitModule.state.polishSearchId = '';
        UnitModule.state.polishSelectedId = null;
        UnitModule.state.polishFormOpen = false;
        UnitModule.state.polishEditingId = null;
        UnitModule.state.polishProductName = '';
        UnitModule.state.polishSurface = '';
        UnitModule.state.polishNote = '';
        UI.renderCurrentPage();
    },
    openExtruderLibrary: (id) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'extruderLibrary';
        UnitModule.state.extruderSearchDia = '';
        UnitModule.state.extruderSearchLen = '';
        UnitModule.state.extruderSearchColor = '';
        UnitModule.state.extruderSearchKind = '';
        UnitModule.state.extruderSearchCode = '';
        UnitModule.state.extruderSelectedId = null;
        UnitModule.state.extruderFormOpen = false;
        UnitModule.state.extruderEditingId = null;
        UnitModule.state.extruderDraftType = 'ROD';
        UnitModule.state.extruderDraftName = '';
        UnitModule.state.extruderDraftDia = '';
        UnitModule.state.extruderDraftThick = '';
        UnitModule.state.extruderDraftLen = '';
        UnitModule.state.extruderDraftColorType = '';
        UnitModule.state.extruderDraftColor = '';
        UnitModule.state.extruderDraftColorCode = '';
        UnitModule.state.extruderDraftBubble = false;
        UnitModule.state.extruderDraftNote = '';
        UI.renderCurrentPage();
    },
    openMontageLibrary: (id, preserveState = false) => {
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'montageLibrary';
        if (!preserveState && typeof MontageLibraryModule !== 'undefined' && MontageLibraryModule && typeof MontageLibraryModule.resetState === 'function') {
            MontageLibraryModule.resetState();
        }
        UI.renderCurrentPage();
    },
    openUnitLibrary: (id) => {
        if (id === 'u_dtm') {
            if (typeof Router !== 'undefined') Router.navigate('stock');
            if (typeof StockModule !== 'undefined' && StockModule && typeof StockModule.openOperationLibrary === 'function') {
                StockModule.openOperationLibrary();
            }
            if (UnitModule.applyPickerPreselectForStation('u_dtm')) UI.renderCurrentPage();
            return;
        }
        const unit = (DB.data.data.units || []).find(u => u.id === id);
        const unitName = String(unit?.name || '').toUpperCase();
        if (unitName.includes('CNC')) {
            UnitModule.openCncLibrary(id);
            if (UnitModule.applyPickerPreselectForStation(id)) UI.renderCurrentPage();
            return;
        }
        if (id === 'u2' || unitName.includes('EKSTR')) {
            UnitModule.openExtruderLibrary(id);
            if (UnitModule.applyPickerPreselectForStation(id)) UI.renderCurrentPage();
            return;
        }
        if (unitName.includes('TESTERE')) {
            UnitModule.openSawCut(id);
            if (UnitModule.applyPickerPreselectForStation(id)) UI.renderCurrentPage();
            return;
        }
        if (id === 'u9' || unitName.includes('PVD') || unitName.includes('PWD')) {
            UnitModule.openPvdLibrary(id);
            if (UnitModule.applyPickerPreselectForStation(id)) UI.renderCurrentPage();
            return;
        }
        if (id === 'u11' || unitName.includes('ELOKSAL')) {
            UnitModule.openEloksalLibrary(id);
            if (UnitModule.applyPickerPreselectForStation(id)) UI.renderCurrentPage();
            return;
        }
        if (id === 'u10' || unitName.includes('IBRAHIM POLISAJ')) {
            UnitModule.openPolishLibrary(id);
            if (UnitModule.applyPickerPreselectForStation(id)) UI.renderCurrentPage();
            return;
        }
        if (id === 'u5' || unitName.includes('PLEKS') || unitName.includes('POLISAJ')) {
            UnitModule.openPlexiLibrary(id);
            if (UnitModule.applyPickerPreselectForStation(id)) UI.renderCurrentPage();
            return;
        }
        if (id === 'u3' || unitName.includes('MONTAJ')) {
            UnitModule.openMontageLibrary(id);
            if (UnitModule.applyPickerPreselectForStation(id)) UI.renderCurrentPage();
            return;
        }
        UnitModule.state.activeUnitId = id;
        UnitModule.state.view = 'unitLibraryEmpty';
        UI.renderCurrentPage();
    },
    applyProcessSelectionForStation: (stationId, processId) => {
        const normalizedStationId = String(stationId || '').trim();
        const code = String(processId || '').trim().toUpperCase();
        if (!normalizedStationId || !code) return false;
        const unit = (DB.data?.data?.units || []).find(u => String(u?.id || '') === normalizedStationId);
        const unitName = String(unit?.name || '').toUpperCase();

        if (normalizedStationId === 'u_dtm') {
            const row = (DB.data?.data?.depoTransferTasks || []).find(x => String(x?.taskCode || '').trim().toUpperCase() === code);
            if (!row) return false;
            UnitModule.state.depoTaskSelectedId = row.id;
            if (typeof StockModule !== 'undefined' && StockModule?.state) {
                StockModule.state.operationSelectedId = row.id;
            }
            return true;
        }
        if (unitName.includes('CNC')) {
            if (typeof CncLibraryModule === 'undefined' || !CncLibraryModule?.state) return false;
            const row = (DB.data?.data?.cncCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cncId || '').trim().toUpperCase() === code);
            if (!row) return false;
            CncLibraryModule.state.selectedId = row.id;
            return true;
        }
        if (normalizedStationId === 'u2' || unitName.includes('EKSTR')) {
            const row = (DB.data?.data?.extruderLibraryCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return false;
            UnitModule.state.extruderSelectedId = row.id;
            return true;
        }
        if (unitName.includes('TESTERE')) {
            const row = (DB.data?.data?.sawCutOrders || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.code || '').trim().toUpperCase() === code);
            if (!row) return false;
            UnitModule.state.sawSelectedOrderId = row.id;
            return true;
        }
        if (normalizedStationId === 'u9' || unitName.includes('PVD') || unitName.includes('PWD')) {
            const row = (DB.data?.data?.pvdCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return false;
            UnitModule.state.pvdSelectedId = row.id;
            return true;
        }
        if (normalizedStationId === 'u11' || unitName.includes('ELOKSAL')) {
            const row = (DB.data?.data?.eloksalCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return false;
            UnitModule.state.elxSelectedId = row.id;
            return true;
        }
        if (normalizedStationId === 'u10' || unitName.includes('IBRAHIM POLISAJ')) {
            const row = (DB.data?.data?.ibrahimPolishCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return false;
            UnitModule.state.polishSelectedId = row.id;
            return true;
        }
        if (normalizedStationId === 'u5' || unitName.includes('PLEKS') || unitName.includes('POLISAJ')) {
            const row = (DB.data?.data?.plexiPolishCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return false;
            UnitModule.state.plexiSelectedId = row.id;
            return true;
        }
        if (normalizedStationId === 'u3' || unitName.includes('MONTAJ')) {
            if (typeof MontageLibraryModule === 'undefined' || !MontageLibraryModule?.state) return false;
            const row = (DB.data?.data?.montageCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || x?.productCode || '').trim().toUpperCase() === code);
            if (!row) return false;
            MontageLibraryModule.state.selectedId = row.id;
            return true;
        }
        return false;
    },
    openWorkOrderComponentPreview: (orderId, lineId, unitId = '') => {
        const order = (DB.data?.data?.workOrders || []).find(x => String(x?.id || '') === String(orderId || ''));
        const line = Array.isArray(order?.lines) ? order.lines.find(x => String(x?.id || '') === String(lineId || '')) : null;
        const componentCode = String(line?.componentCode || '').trim().toUpperCase();
        if (!componentCode) return alert('Parca kodu bulunamadi.');
        if (typeof ReadOnlyViewer !== 'undefined' && ReadOnlyViewer && typeof ReadOnlyViewer.openByCode === 'function') {
            const opened = ReadOnlyViewer.openByCode(componentCode, { silentNotFound: true });
            if (opened) return;
        }
        return alert(`Bu parca kodu icin goruntuleme karti bulunamadi: ${componentCode}`);
    },
    openWorkOrderProcessPreview: (stationId, processId, unitId = '') => {
        const normalizedStationId = String(stationId || '').trim();
        const code = String(processId || '').trim().toUpperCase();
        if (!normalizedStationId || !code) return alert('Islem kaydi bulunamadi.');
        if (typeof ReadOnlyViewer !== 'undefined' && ReadOnlyViewer && typeof ReadOnlyViewer.openByCode === 'function') {
            const opened = ReadOnlyViewer.openByCode(code, { silentNotFound: true });
            if (opened) return;
        }
        const unit = (DB.data?.data?.units || []).find(u => String(u?.id || '') === normalizedStationId);
        const unitName = String(unit?.name || '').toUpperCase();

        if (normalizedStationId === 'u_dtm') {
            const row = (DB.data?.data?.depoTransferTasks || []).find(x => String(x?.taskCode || '').trim().toUpperCase() === code);
            if (!row) return alert('Ilgili islem kutuphane kaydi bulunamadi.');
            if (typeof StockModule !== 'undefined' && StockModule && typeof StockModule.previewOperation === 'function') {
                StockModule.previewOperation(row.id);
                return;
            }
        }
        if (unitName.includes('CNC')) {
            const row = (DB.data?.data?.cncCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cncId || '').trim().toUpperCase() === code);
            if (!row) return alert('Ilgili islem kutuphane kaydi bulunamadi.');
            if (typeof CncLibraryModule !== 'undefined' && CncLibraryModule && typeof CncLibraryModule.viewCardOperations === 'function') {
                CncLibraryModule.viewCardOperations(row.id);
                return;
            }
        }
        if (normalizedStationId === 'u2' || unitName.includes('EKSTR')) {
            const row = (DB.data?.data?.extruderLibraryCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return alert('Ilgili islem kutuphane kaydi bulunamadi.');
            UnitModule.previewExtruderRow(row.id);
            return;
        }
        if (unitName.includes('TESTERE')) {
            const row = (DB.data?.data?.sawCutOrders || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.code || '').trim().toUpperCase() === code);
            if (!row) return alert('Ilgili islem kutuphane kaydi bulunamadi.');
            UnitModule.previewSawRow(row.id);
            return;
        }
        if (normalizedStationId === 'u9' || unitName.includes('PVD') || unitName.includes('PWD')) {
            const row = (DB.data?.data?.pvdCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return alert('Ilgili islem kutuphane kaydi bulunamadi.');
            UnitModule.previewPvdRow(row.id);
            return;
        }
        if (normalizedStationId === 'u11' || unitName.includes('ELOKSAL')) {
            const row = (DB.data?.data?.eloksalCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return alert('Ilgili islem kutuphane kaydi bulunamadi.');
            UnitModule.previewEloksalRow(row.id);
            return;
        }
        if (normalizedStationId === 'u10' || unitName.includes('IBRAHIM POLISAJ')) {
            const row = (DB.data?.data?.ibrahimPolishCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return alert('Ilgili islem kutuphane kaydi bulunamadi.');
            UnitModule.previewPolishRow(row.id);
            return;
        }
        if (normalizedStationId === 'u5' || unitName.includes('PLEKS') || unitName.includes('POLISAJ')) {
            const row = (DB.data?.data?.plexiPolishCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            if (!row) return alert('Ilgili islem kutuphane kaydi bulunamadi.');
            UnitModule.previewPlexiRow(row.id);
            return;
        }
        if (normalizedStationId === 'u3' || unitName.includes('MONTAJ')) {
            const row = (DB.data?.data?.montageCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || x?.productCode || '').trim().toUpperCase() === code);
            if (!row) return alert('Ilgili islem kutuphane kaydi bulunamadi.');
            if (typeof MontageLibraryModule !== 'undefined' && MontageLibraryModule && typeof MontageLibraryModule.previewRow === 'function') {
                MontageLibraryModule.previewRow(row.id);
                return;
            }
        }
        return alert(`Bu islem kodu icin goruntuleme karti bulunamadi: ${code}`);
    },
    getActiveComponentRoutePicker: () => {
        const moduleRef = typeof ProductLibraryModule !== 'undefined' ? ProductLibraryModule : null;
        const picker = moduleRef?.state?.componentRoutePicker;
        if (!picker || typeof picker !== 'object') return null;
        const routeId = String(picker.routeId || '').trim();
        const stationId = String(picker.stationId || '').trim();
        const routeSource = String(picker.routeSource || 'component').trim() || 'component';
        if (!routeId || !stationId) return null;
        return { routeId, stationId, routeSource };
    },
    getPickerExistingProcessCodeForStation: (stationId) => {
        const picker = UnitModule.getActiveComponentRoutePicker();
        if (!picker) return '';
        if (String(picker.stationId || '') !== String(stationId || '')) return '';
        const moduleRef = typeof ProductLibraryModule !== 'undefined' ? ProductLibraryModule : null;
        const routeSource = String(picker.routeSource || 'component');
        const routes = routeSource === 'assembly'
            ? (Array.isArray(moduleRef?.state?.assemblyDraftRoutes) ? moduleRef.state.assemblyDraftRoutes : [])
            : (Array.isArray(moduleRef?.state?.componentDraftRoutes) ? moduleRef.state.componentDraftRoutes : []);
        const row = routes.find(x => String(x?.id || '') === String(picker.routeId || ''));
        return String(row?.processId || '').trim().toUpperCase();
    },
    applyPickerPreselectForStation: (stationId) => {
        const code = UnitModule.getPickerExistingProcessCodeForStation(stationId);
        if (!code) return false;

        const normalizedStationId = String(stationId || '').trim();
        if (!normalizedStationId) return false;
        const unit = (DB.data?.data?.units || []).find(u => String(u?.id || '') === normalizedStationId);
        const unitName = String(unit?.name || '').toUpperCase();

        if (normalizedStationId === 'u_dtm') {
            const row = (DB.data?.data?.depoTransferTasks || []).find(x => String(x?.taskCode || '').trim().toUpperCase() === code);
            UnitModule.state.depoTaskSelectedId = row?.id || null;
            if (typeof StockModule !== 'undefined' && StockModule?.state) {
                StockModule.state.operationSelectedId = row?.id || null;
            }
            return true;
        }
        if (unitName.includes('CNC')) {
            if (typeof CncLibraryModule !== 'undefined' && CncLibraryModule?.state) {
                const row = (DB.data?.data?.cncCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cncId || '').trim().toUpperCase() === code);
                CncLibraryModule.state.selectedId = row?.id || null;
            }
            return true;
        }
        if (normalizedStationId === 'u2' || unitName.includes('EKSTR')) {
            const row = (DB.data?.data?.extruderLibraryCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            UnitModule.state.extruderSelectedId = row?.id || null;
            return true;
        }
        if (unitName.includes('TESTERE')) {
            const row = (DB.data?.data?.sawCutOrders || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.code || '').trim().toUpperCase() === code);
            UnitModule.state.sawSelectedOrderId = row?.id || null;
            return true;
        }
        if (normalizedStationId === 'u9' || unitName.includes('PVD') || unitName.includes('PWD')) {
            const row = (DB.data?.data?.pvdCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            UnitModule.state.pvdSelectedId = row?.id || null;
            return true;
        }
        if (normalizedStationId === 'u11' || unitName.includes('ELOKSAL')) {
            const row = (DB.data?.data?.eloksalCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            UnitModule.state.elxSelectedId = row?.id || null;
            return true;
        }
        if (normalizedStationId === 'u10' || unitName.includes('IBRAHIM POLISAJ')) {
            const row = (DB.data?.data?.ibrahimPolishCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            UnitModule.state.polishSelectedId = row?.id || null;
            return true;
        }
        if (normalizedStationId === 'u5' || unitName.includes('PLEKS') || unitName.includes('POLISAJ')) {
            const row = (DB.data?.data?.plexiPolishCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || '').trim().toUpperCase() === code);
            UnitModule.state.plexiSelectedId = row?.id || null;
            return true;
        }
        if (normalizedStationId === 'u3' || unitName.includes('MONTAJ')) {
            if (typeof MontageLibraryModule !== 'undefined' && MontageLibraryModule?.state) {
                const row = (DB.data?.data?.montageCards || []).find(x => String(x?.unitId || '') === normalizedStationId && String(x?.cardCode || x?.productCode || '').trim().toUpperCase() === code);
                MontageLibraryModule.state.selectedId = row?.id || null;
            }
            return true;
        }
        return false;
    },
    shouldShowComponentRoutePickerPanel: () => {
        const picker = UnitModule.getActiveComponentRoutePicker();
        return !!picker;
    },
    getRoutePickerSelectedRowStyle: (isSelected) => {
        if (!isSelected) return '';
        return UnitModule.shouldShowComponentRoutePickerPanel()
            ? 'background:#ecfdf5; box-shadow:inset 0 0 0 1px #86efac;'
            : 'background:#ffe4e6;';
    },
    getRoutePickerSelectButtonStyle: (isSelected) => {
        if (!isSelected) return '';
        return UnitModule.shouldShowComponentRoutePickerPanel()
            ? 'background:#16a34a; color:white; border-color:#16a34a; box-shadow:0 0 0 3px rgba(34,197,94,0.16);'
            : 'background:#0f172a; color:white; border-color:#0f172a;';
    },
    getRoutePickerAddButtonStyle: (canAdd) => {
        return canAdd
            ? 'background:#16a34a; border-color:#16a34a; color:white; box-shadow:0 0 0 3px rgba(34,197,94,0.16), 0 10px 22px rgba(22,163,74,0.22);'
            : 'background:#cbd5e1; border-color:#cbd5e1; color:#64748b; opacity:1; cursor:not-allowed; box-shadow:none;';
    },
    getSelectedProcessCodeForPicker: () => {
        const view = String(UnitModule.state.view || '');
        const unitId = String(UnitModule.state.activeUnitId || '');

        if (typeof Router !== 'undefined' && Router.currentPage === 'stock' && String(StockModule?.state?.workspaceView || '') === 'operation-library') {
            const selectedId = String(StockModule?.state?.operationSelectedId || UnitModule.state.depoTaskSelectedId || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.depoTransferTasks || []).find(x => String(x?.id || '') === selectedId);
            return String(row?.taskCode || '').trim().toUpperCase();
        }
        if (view === 'depoTransfer') {
            const selectedId = String(UnitModule.state.depoTaskSelectedId || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.depoTransferTasks || []).find(x => String(x?.id || '') === selectedId);
            return String(row?.taskCode || '').trim().toUpperCase();
        }
        if (view === 'cncLibrary') {
            const selectedId = String((typeof CncLibraryModule !== 'undefined' ? CncLibraryModule?.state?.selectedId : '') || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.cncCards || []).find(x => String(x?.id || '') === selectedId && String(x?.unitId || '') === unitId);
            return String(row?.cncId || '').trim().toUpperCase();
        }
        if (view === 'sawCut') {
            const selectedId = String(UnitModule.state.sawSelectedOrderId || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.sawCutOrders || []).find(x => String(x?.id || '') === selectedId && String(x?.unitId || '') === unitId);
            return String(row?.code || '').trim().toUpperCase();
        }
        if (view === 'extruderLibrary') {
            const selectedId = String(UnitModule.state.extruderSelectedId || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.extruderLibraryCards || []).find(x => String(x?.id || '') === selectedId && String(x?.unitId || '') === unitId);
            return String(row?.cardCode || '').trim().toUpperCase();
        }
        if (view === 'plexiLibrary') {
            const selectedId = String(UnitModule.state.plexiSelectedId || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.plexiPolishCards || []).find(x => String(x?.id || '') === selectedId && String(x?.unitId || '') === unitId);
            return String(row?.cardCode || '').trim().toUpperCase();
        }
        if (view === 'pvdLibrary') {
            const selectedId = String(UnitModule.state.pvdSelectedId || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.pvdCards || []).find(x => String(x?.id || '') === selectedId && String(x?.unitId || '') === unitId);
            return String(row?.cardCode || '').trim().toUpperCase();
        }
        if (view === 'polishLibrary') {
            const selectedId = String(UnitModule.state.polishSelectedId || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.ibrahimPolishCards || []).find(x => String(x?.id || '') === selectedId && String(x?.unitId || '') === unitId);
            return String(row?.cardCode || '').trim().toUpperCase();
        }
        if (view === 'eloksalLibrary') {
            const selectedId = String(UnitModule.state.elxSelectedId || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.eloksalCards || []).find(x => String(x?.id || '') === selectedId && String(x?.unitId || '') === unitId);
            return String(row?.cardCode || '').trim().toUpperCase();
        }
        if (view === 'montageLibrary') {
            const selectedId = String((typeof MontageLibraryModule !== 'undefined' ? MontageLibraryModule?.state?.selectedId : '') || '');
            if (!selectedId) return '';
            const row = (DB.data?.data?.montageCards || []).find(x => String(x?.id || '') === selectedId && String(x?.unitId || '') === unitId);
            return String(row?.cardCode || row?.productCode || '').trim().toUpperCase();
        }
        return '';
    },
    confirmComponentRouteProcessPick: () => {
        const picker = UnitModule.getActiveComponentRoutePicker();
        if (!picker) return;
        const isStockOperationLibrary = typeof Router !== 'undefined'
            && Router.currentPage === 'stock'
            && String(StockModule?.state?.workspaceView || '') === 'operation-library';
        const currentUnitId = String(isStockOperationLibrary ? 'u_dtm' : (UnitModule.state.view === 'depoTransfer' ? 'u_dtm' : (UnitModule.state.activeUnitId || '')));
        if (currentUnitId !== String(picker.stationId || '')) {
            alert('Yanlis birim kutuphanesindesiniz. Hedef birime geciniz.');
            return;
        }
        const code = String(UnitModule.getSelectedProcessCodeForPicker() || '').trim().toUpperCase();
        if (!code) return alert('Once listeden bir islem seciniz.');
        if (typeof ProductLibraryModule === 'undefined' || !ProductLibraryModule || typeof ProductLibraryModule.applyComponentRouteProcessFromPicker !== 'function') {
            return alert('Parca/Bilesen modulu bulunamadi.');
        }
        ProductLibraryModule.applyComponentRouteProcessFromPicker(code);
    },
    goToComponentRoutePickerTarget: () => {
        const picker = UnitModule.getActiveComponentRoutePicker();
        if (!picker) return;
        if (String(picker.stationId || '') === 'u_dtm') {
            if (typeof Router !== 'undefined') Router.navigate('stock');
            if (typeof StockModule !== 'undefined' && StockModule && typeof StockModule.openOperationLibrary === 'function') {
                StockModule.openOperationLibrary();
            }
            if (UnitModule.applyPickerPreselectForStation('u_dtm')) UI.renderCurrentPage();
            return;
        }
        UnitModule.openUnitLibrary(picker.stationId);
    },
    cancelComponentRouteProcessPick: () => {
        if (typeof ProductLibraryModule === 'undefined' || !ProductLibraryModule || typeof ProductLibraryModule.cancelComponentRouteProcessPicker !== 'function') {
            Router.navigate('products', { fromBack: true, preserveProductsState: true });
            return;
        }
        ProductLibraryModule.cancelComponentRouteProcessPicker();
    },
    renderComponentRoutePickerPanel: (container) => {
        if (!container || !UnitModule.shouldShowComponentRoutePickerPanel()) return;
        const picker = UnitModule.getActiveComponentRoutePicker();
        if (!picker) return;
        const selectedCode = String(UnitModule.getSelectedProcessCodeForPicker() || '').trim().toUpperCase();
        const units = Array.isArray(DB.data?.data?.units) ? DB.data.data.units : [];
        const isStockOperationLibrary = typeof Router !== 'undefined'
            && Router.currentPage === 'stock'
            && String(StockModule?.state?.workspaceView || '') === 'operation-library';
        const currentUnitId = String(isStockOperationLibrary ? 'u_dtm' : (UnitModule.state.view === 'depoTransfer' ? 'u_dtm' : (UnitModule.state.activeUnitId || '')));
        const activeUnitName = isStockOperationLibrary
            ? 'DEPO TRANSFER / ISLEM KUTUPHANESI'
            : (units.find(u => String(u?.id || '') === currentUnitId)?.name || '-');
        const targetUnitName = units.find(u => String(u?.id || '') === String(picker.stationId || ''))?.name || picker.stationId;
        const sameUnit = currentUnitId === String(picker.stationId || '');
        const canAdd = sameUnit && !!selectedCode;

        container.insertAdjacentHTML('afterbegin', `
            <div style="position:sticky; top:0.4rem; z-index:35; margin-bottom:0.85rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; border:1px solid #93c5fd; background:#eff6ff; border-radius:0.85rem; padding:0.65rem 0.8rem; box-shadow:0 8px 18px rgba(15,23,42,0.06);">
                    <div>
                        <div style="font-weight:800; color:#1e3a8a;">Rota icin islem secimi</div>
                        <div style="font-size:0.82rem; color:#334155;">Hedef birim: <strong>${UnitModule.escapeHtml(targetUnitName)}</strong> | Acik birim: <strong>${UnitModule.escapeHtml(activeUnitName)}</strong></div>
                        <div style="font-size:0.82rem; color:${sameUnit ? '#334155' : '#b45309'};">${sameUnit ? (selectedCode ? `Secili ID: <span style="font-family:monospace; font-weight:800;">${UnitModule.escapeHtml(selectedCode)}</span>` : 'Listeden bir satir secin, sonra Ekle butonuna basin.') : 'Su an hedef birimde degilsiniz. Hedef birime git butonunu kullanin.'}</div>
                    </div>
                    <div style="display:flex; gap:0.45rem; align-items:center;">
                        <button class="btn-sm" onclick="UnitModule.goToComponentRoutePickerTarget()">hedef birime git</button>
                        <button class="btn-sm" onclick="UnitModule.cancelComponentRouteProcessPick()">vazgec</button>
                        <button class="btn-primary" onclick="UnitModule.confirmComponentRouteProcessPick()" ${canAdd ? '' : 'disabled'} style="${UnitModule.getRoutePickerAddButtonStyle(canAdd)}">ekle</button>
                    </div>
                </div>
            </div>
        `);
    },
    setStockTab: (t) => { UnitModule.state.stockTab = t; UI.renderCurrentPage(); },


    renderList: (container) => {
        const units = DB.data.data.units;
        const internals = units.filter(u => u.type === 'internal');
        const externals = units.filter(u => u.type === 'external');
        const canManage = UnitModule.isSuperAdmin();
        const badgeStyles = {
            u1: { bg: '#dbeafe', fg: '#1d4ed8' },
            u2: { bg: '#dcfce7', fg: '#15803d' },
            u3: { bg: '#ede9fe', fg: '#6d28d9' },
            u5: { bg: '#fce7f3', fg: '#be185d' },
            u7: { bg: '#fef3c7', fg: '#b45309' },
            u_dtm: { bg: '#dbeafe', fg: '#1e40af' },
            u9: { bg: '#ffedd5', fg: '#ea580c' },
            u10: { bg: '#fed7aa', fg: '#9a3412' },
            u11: { bg: '#fde68a', fg: '#92400e' },
        };
        const getUnitInitials = (name) => {
            const raw = String(name || '');
            const words = raw
                .replace(/[^A-Za-z0-9\u00C7\u011E\u0130\u00D6\u015E\u00DC\u00E7\u011F\u0131\u00F6\u015F\u00FC\s]/g, ' ')
                .split(/\s+/)
                .filter(Boolean);
            const skip = new Set(['AT\u00D6LYES\u0130', 'ATOLYESI', 'A', '\u015E', 'AS']);
            const filtered = words.filter(w => !skip.has(w.toLocaleUpperCase('tr-TR')));
            const src = filtered.length > 0 ? filtered : words;
            if (src.length === 0) return '??';
            if (src.length === 1) {
                const w = src[0].toLocaleUpperCase('tr-TR');
                return (w[0] || '?') + (w[1] || w[0] || '?');
            }
            return (src[0][0] + src[1][0]).toLocaleUpperCase('tr-TR');
        };
        const renderCard = (u) => {
            const isDepoTransfer = u.id === 'u_dtm';
            const palette = badgeStyles[u.id] || (u.type === 'internal'
                ? { bg: '#eff6ff', fg: '#2563eb' }
                : { bg: '#fff7ed', fg: '#ea580c' });
            const initials = getUnitInitials(u.name);
            const cardAction = isDepoTransfer ? 'UnitModule.openDepoTransfer()' : `UnitModule.openUnit('${u.id}')`;
            return `
            <div class="app-card" style="padding:1.5rem; position:relative; cursor:pointer;" onclick="${cardAction}">
                ${canManage && !isDepoTransfer ? `
                <div style="position:absolute; top:0.75rem; right:0.75rem; display:flex; gap:0.35rem;">
                    <button class="btn-sm" title="Birim duzenle" style="padding:0.35rem 0.45rem; display:flex; align-items:center; justify-content:center; color:#94a3b8; opacity:0.8; background:#f8fafc; border-color:#dbe3ee;" onclick="event.stopPropagation(); UnitModule.openUnitEditModal('${u.id}')">
                        <i data-lucide="pencil" width="14" height="14"></i>
                    </button>
                </div>
                ` : ''}
                <div style="width:3.25rem; height:3.25rem; border-radius:0.95rem; margin:0 auto 1rem; background:${palette.bg}; color:${palette.fg}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.95rem; letter-spacing:0.04em; box-shadow:0 8px 16px -10px rgba(15,23,42,0.35); border:1px solid rgba(255,255,255,0.7)">${initials}</div>
                <div style="font-weight:700; color:#334155; font-size:0.9rem">${u.name}</div>
            </div>
        `;
        };
        container.innerHTML = `
            <div class="page-header"><h2 class="page-title">Birimler</h2></div>
            <h3 style="margin:1.5rem 0; color:#334155; padding-left:0.5rem">&#304;&ccedil; Birimler</h3>
            <div class="apps-grid" style="margin-bottom:3rem;">${internals.map(u => renderCard(u)).join('')}</div>
            <h3 style="margin:1.5rem 0; color:#334155; padding-left:0.5rem">D&#305;&#351; Birimler</h3>
            <div class="apps-grid">${externals.map(u => renderCard(u)).join('')}</div>
            ${UnitModule.renderFreeExternalVendorPanel()}
        `;
    },
    getNextFreeExternalVendorJobCode: () => {
        if (!Array.isArray(DB.data?.data?.freeExternalVendorJobs)) DB.data.data.freeExternalVendorJobs = [];
        const max = (DB.data.data.freeExternalVendorJobs || []).reduce((acc, row) => {
            const code = String(row?.jobCode || '').trim().toUpperCase();
            const m = code.match(/^SDT-(\d{6})$/);
            if (!m) return acc;
            return Math.max(acc, Number(m[1]));
        }, 0);
        let next = max + 1;
        let candidate = `SDT-${String(next).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            next += 1;
            candidate = `SDT-${String(next).padStart(6, '0')}`;
        }
        return candidate;
    },
    normalizeSupplierTag: (value) => String(value || '').trim().toLocaleUpperCase('tr-TR'),
    isFasonSupplier: (supplier) => {
        const tags = Array.isArray(supplier?.tags) ? supplier.tags : [];
        return tags.some(tag => {
            const normalized = UnitModule.normalizeSupplierTag(tag);
            return normalized === 'FASON' || normalized === 'SERBEST DIS TEDARIKCI' || normalized === 'DIS TEDARIKCI';
        });
    },
    getFasonSuppliers: () => {
        return (DB.data.data.suppliers || [])
            .filter(s => UnitModule.isFasonSupplier(s))
            .slice()
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'tr'));
    },
    scrollToFreeExternalVendorPanel: () => {
        setTimeout(() => {
            const panel = document.getElementById('free-external-vendors-panel');
            if (panel && typeof panel.scrollIntoView === 'function') {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 30);
    },
    openFreeExternalVendorSection: (openForm = false) => {
        UnitModule.state.activeUnitId = null;
        UnitModule.state.view = 'list';
        UnitModule.state.freeVendorFormOpen = !!openForm;
        if (!openForm) UnitModule.state.freeVendorEditingId = null;
        UI.renderCurrentPage();
        UnitModule.scrollToFreeExternalVendorPanel();
    },
    openFreeExternalVendorPage: () => {
        UnitModule.openFreeExternalVendorSection(false);
    },
    openNewSupplierFromUnit: () => {
        UnitModule.openFreeExternalVendorSection(true);
    },
    openFreeExternalVendorCreateForm: (supplierId = null) => {
        const row = supplierId ? (DB.data.data.suppliers || []).find(x => String(x?.id || '') === String(supplierId || '')) : null;
        UnitModule.state.freeVendorFormOpen = true;
        UnitModule.state.freeVendorEditingId = row?.id || null;
        UnitModule.state.freeVendorDraftName = String(row?.name || '');
        UnitModule.state.freeVendorDraftPerson = String(row?.contact?.person || '');
        UnitModule.state.freeVendorDraftPhone = String(row?.contact?.phone || '');
        UnitModule.state.freeVendorDraftEmail = String(row?.contact?.email || '');
        UnitModule.state.freeVendorDraftAddress = String(row?.contact?.address || '');
        UnitModule.state.freeVendorDraftCity = String(row?.contact?.city || '');
        UnitModule.state.freeVendorDraftNotes = String(row?.notes || '');
        UI.renderCurrentPage();
        UnitModule.scrollToFreeExternalVendorPanel();
    },
    resetFreeExternalVendorForm: () => {
        UnitModule.state.freeVendorFormOpen = false;
        UnitModule.state.freeVendorEditingId = null;
        UnitModule.state.freeVendorDraftName = '';
        UnitModule.state.freeVendorDraftPerson = '';
        UnitModule.state.freeVendorDraftPhone = '';
        UnitModule.state.freeVendorDraftEmail = '';
        UnitModule.state.freeVendorDraftAddress = '';
        UnitModule.state.freeVendorDraftCity = '';
        UnitModule.state.freeVendorDraftNotes = '';
        UI.renderCurrentPage();
        UnitModule.scrollToFreeExternalVendorPanel();
    },
    saveFreeExternalVendorSupplier: async () => {
        if (!Array.isArray(DB.data?.data?.suppliers)) DB.data.data.suppliers = [];
        const name = String(UnitModule.state.freeVendorDraftName || '').trim();
        const person = String(UnitModule.state.freeVendorDraftPerson || '').trim();
        const phone = String(UnitModule.state.freeVendorDraftPhone || '').trim();
        const email = String(UnitModule.state.freeVendorDraftEmail || '').trim();
        const address = String(UnitModule.state.freeVendorDraftAddress || '').trim();
        const city = String(UnitModule.state.freeVendorDraftCity || '').trim();
        const notes = String(UnitModule.state.freeVendorDraftNotes || '').trim();
        if (!name) return alert('Firma adi zorunlu.');
        const payload = {
            name,
            entityType: 'company',
            tags: ['Fason', 'Serbest Dis Tedarikci'],
            notes,
            contact: { person, phone, email, web: '', tax: '', address, city, country: 'Turkiye' }
        };
        if (UnitModule.state.freeVendorEditingId) {
            const idx = DB.data.data.suppliers.findIndex(s => String(s?.id || '') === String(UnitModule.state.freeVendorEditingId || ''));
            if (idx !== -1) {
                const old = DB.data.data.suppliers[idx] || {};
                const oldTags = Array.isArray(old.tags) ? old.tags : [];
                DB.data.data.suppliers[idx] = {
                    ...old,
                    ...payload,
                    tags: Array.from(new Set([...oldTags, ...payload.tags]))
                };
            }
        } else {
            DB.data.data.suppliers.push({ id: crypto.randomUUID(), ...payload });
        }
        await DB.save();
        UnitModule.resetFreeExternalVendorForm();
    },
    deleteFreeExternalVendorSupplier: async () => {
        if (!Array.isArray(DB.data?.data?.suppliers)) DB.data.data.suppliers = [];
        if (!Array.isArray(DB.data?.data?.freeExternalVendorJobs)) DB.data.data.freeExternalVendorJobs = [];
        const supplierId = String(UnitModule.state.freeVendorEditingId || '').trim();
        if (!supplierId) return;
        const supplier = (DB.data.data.suppliers || []).find(s => String(s?.id || '') === supplierId);
        if (!supplier) {
            UnitModule.resetFreeExternalVendorForm();
            return;
        }
        const relatedJobs = (DB.data.data.freeExternalVendorJobs || []).filter(job =>
            String(job?.supplierId || '') === supplierId
            || (!job?.supplierId && String(job?.supplierName || '') === String(supplier?.name || ''))
        );
        const hasJobs = relatedJobs.length > 0;
        const message = hasJobs
            ? `${supplier.name} silinsin mi?\n\nBu islem ${relatedJobs.length} gonderim kaydini da silecek.`
            : `${supplier.name} silinsin mi?`;
        if (!confirm(message)) return;
        DB.data.data.suppliers = (DB.data.data.suppliers || []).filter(s => String(s?.id || '') !== supplierId);
        if (hasJobs) {
            const jobIds = new Set(relatedJobs.map(job => String(job?.id || '')));
            DB.data.data.freeExternalVendorJobs = (DB.data.data.freeExternalVendorJobs || []).filter(job => !jobIds.has(String(job?.id || '')));
        }
        await DB.save();
        UnitModule.resetFreeExternalVendorForm();
    },
    renderFreeExternalVendorPanel: () => {
        const suppliers = UnitModule.getFasonSuppliers();
        const search = String(UnitModule.state.freeVendorSearch || '').trim().toLocaleLowerCase('tr-TR');
        const jobs = Array.isArray(DB.data.data.freeExternalVendorJobs) ? DB.data.data.freeExternalVendorJobs : [];
        const rows = suppliers.filter(s => {
            if (!search) return true;
            return String(s?.name || '').toLocaleLowerCase('tr-TR').includes(search)
                || String(s?.contact?.person || '').toLocaleLowerCase('tr-TR').includes(search)
                || String(s?.contact?.phone || '').toLocaleLowerCase('tr-TR').includes(search);
        });
        const getJobsForSupplier = (supplier) => jobs.filter(job =>
            String(job?.supplierId || '') === String(supplier?.id || '')
            || (!job?.supplierId && String(job?.supplierName || '') === String(supplier?.name || ''))
        );
        return `
            <div id="free-external-vendors-panel" style="margin-top:2.5rem; background:rgba(255,255,255,0.56); border:1px solid #fecaca; border-radius:1.75rem; padding:1.2rem;">
                <div style="background:white; border:1px solid #e2e8f0; border-radius:1.15rem; padding:1rem;">
                    <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; gap:0.9rem; flex-wrap:wrap;">
                        <div>
                            <h3 style="margin:0; font-size:1.15rem; color:#0f172a;">Serbest Dis Tedarikci / Fasoncular</h3>
                            <div style="font-size:0.84rem; color:#64748b; margin-top:0.2rem;">Kayitli fasonculari burada listele, yeni tedarikci ekle ve urun gonder.</div>
                        </div>
                        <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.7rem; padding:0.5rem 0.85rem; font-weight:700; color:#0f172a;">Fasoncu: ${suppliers.length}</div>
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.7rem; padding:0.5rem 0.85rem; font-weight:700; color:#0f172a;">Gonderim: ${jobs.length}</div>
                        </div>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem; margin-bottom:1rem; display:flex; justify-content:space-between; gap:0.7rem; align-items:center; flex-wrap:wrap;">
                        <input value="${UnitModule.escapeHtml(UnitModule.state.freeVendorSearch || '')}" oninput="UnitModule.state.freeVendorSearch=this.value; UI.renderCurrentPage();" placeholder="firma adi / yetkili / telefon ara" style="min-width:320px; flex:1; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.58rem 0.7rem; font-weight:600;">
                        <button class="btn-primary" onclick="UnitModule.openFreeExternalVendorCreateForm()" style="min-width:220px;">Yeni Tedarikci / Fason Ekle</button>
                    </div>
                    ${UnitModule.state.freeVendorFormOpen ? `
                        <div style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-bottom:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; margin-bottom:0.8rem;">
                                <strong>${UnitModule.state.freeVendorEditingId ? 'Fasoncu Duzenle' : 'Yeni Tedarikci / Fason Ekle'}</strong>
                                <div style="display:flex; gap:0.45rem;">
                                    ${UnitModule.state.freeVendorEditingId ? '<button class="btn-sm" onclick="UnitModule.deleteFreeExternalVendorSupplier()" style="border-color:#fecaca; color:#b91c1c; background:#fff1f2;">Sil</button>' : ''}
                                    <button class="btn-sm" onclick="UnitModule.resetFreeExternalVendorForm()">Vazgec</button>
                                    <button class="btn-primary" onclick="UnitModule.saveFreeExternalVendorSupplier()">Kaydet</button>
                                </div>
                            </div>
                            <div style="display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:0.65rem;">
                                <div style="grid-column:span 4;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Firma adi *</label><input value="${UnitModule.escapeHtml(UnitModule.state.freeVendorDraftName || '')}" oninput="UnitModule.state.freeVendorDraftName=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                                <div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Yetkili</label><input value="${UnitModule.escapeHtml(UnitModule.state.freeVendorDraftPerson || '')}" oninput="UnitModule.state.freeVendorDraftPerson=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                                <div style="grid-column:span 2;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Telefon</label><input value="${UnitModule.escapeHtml(UnitModule.state.freeVendorDraftPhone || '')}" oninput="UnitModule.state.freeVendorDraftPhone=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                                <div style="grid-column:span 3;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">E-posta</label><input value="${UnitModule.escapeHtml(UnitModule.state.freeVendorDraftEmail || '')}" oninput="UnitModule.state.freeVendorDraftEmail=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                                <div style="grid-column:span 8;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Adres</label><input value="${UnitModule.escapeHtml(UnitModule.state.freeVendorDraftAddress || '')}" oninput="UnitModule.state.freeVendorDraftAddress=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                                <div style="grid-column:span 4;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Sehir / ilce</label><input value="${UnitModule.escapeHtml(UnitModule.state.freeVendorDraftCity || '')}" oninput="UnitModule.state.freeVendorDraftCity=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;"></div>
                                <div style="grid-column:1/-1;"><label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Not</label><textarea rows="3" oninput="UnitModule.state.freeVendorDraftNotes=this.value" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.freeVendorDraftNotes || '')}</textarea></div>
                            </div>
                        </div>
                    ` : ''}
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem;">
                        <div class="card-table">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                        <th style="padding:0.6rem; text-align:left;">Firma adi</th>
                                        <th style="padding:0.6rem; text-align:left;">Iletisim</th>
                                        <th style="padding:0.6rem; text-align:left;">Gonderilen urunler</th>
                                        <th style="padding:0.6rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.length === 0 ? '<tr><td colspan="4" style="padding:1rem; text-align:center; color:#94a3b8;">Kayitli fasoncu yok.</td></tr>' : rows.map(supplier => {
            const vendorJobs = getJobsForSupplier(supplier);
            const lastJob = vendorJobs[0] || null;
            const summary = vendorJobs.length === 0
                ? 'Henuz urun gonderilmedi.'
                : `${vendorJobs.length} kayit var${lastJob ? ` - son: ${String(lastJob.productName || lastJob.productCode || '-')}` : ''}`;
            return `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:0.6rem;">
                                                <div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(supplier.name || '-')}</div>
                                                <div style="font-size:0.73rem; color:#64748b;">${UnitModule.escapeHtml(supplier.contact?.city || '')}</div>
                                            </td>
                                            <td style="padding:0.6rem; color:#475569;">
                                                <div>${UnitModule.escapeHtml(supplier.contact?.person || '-')}</div>
                                                <div style="font-size:0.73rem; color:#64748b;">${UnitModule.escapeHtml(supplier.contact?.phone || '-')}</div>
                                            </td>
                                            <td style="padding:0.6rem; color:#475569;">
                                                <div style="font-weight:600; color:#334155;">${UnitModule.escapeHtml(summary)}</div>
                                                <button class="btn-sm" onclick="UnitModule.openFreeExternalVendorJobsModal('${supplier.id}')" style="margin-top:0.35rem;">goruntule</button>
                                            </td>
                                            <td style="padding:0.6rem; text-align:right;">
                                                <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                                                    <button class="btn-sm" onclick="UnitModule.openFreeExternalVendorJobModal('${supplier.id}')" style="border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;">urun gonder</button>
                                                    <button class="btn-sm" onclick="UnitModule.openFreeExternalVendorCreateForm('${supplier.id}')">duzenle</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    openFreeExternalVendorJobModal: (supplierId = null) => {
        const supplier = supplierId ? UnitModule.getFasonSuppliers().find(x => String(x?.id || '') === String(supplierId || '')) : null;
        const supplierName = String(supplier?.name || '').trim();
        const contactText = [supplier?.contact?.person, supplier?.contact?.phone].filter(Boolean).join(' / ');
        const draftCode = UnitModule.getNextFreeExternalVendorJobCode();
        Modal.open('Urun Gonder', `
            <div style="display:flex; flex-direction:column; gap:0.8rem;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.7rem;">
                    <div>
                        <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Firma adi</label>
                        <input id="free_ext_supplier_name" value="${UnitModule.escapeHtml(supplierName)}" ${supplierName ? 'readonly' : ''} style="width:100%; height:40px; border:1px solid ${supplierName ? '#e2e8f0' : '#cbd5e1'}; border-radius:0.55rem; padding:0 0.65rem; background:${supplierName ? '#f8fafc' : 'white'};">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Is / fis kodu</label>
                        <input id="free_ext_job_code" value="${UnitModule.escapeHtml(draftCode)}" readonly style="width:100%; height:40px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace; font-weight:700;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Yetkili / telefon</label>
                        <input id="free_ext_contact" value="${UnitModule.escapeHtml(contactText)}" placeholder="opsiyonel" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Evrak no</label>
                        <input id="free_ext_doc_no" placeholder="fis no / irsaliye" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Urun kodu *</label>
                        <input id="free_ext_product_code" placeholder="PRC-000001" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-family:monospace;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Urun adi *</label>
                        <input id="free_ext_product_name" placeholder="urun adi" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Giden adet *</label>
                        <input id="free_ext_qty" type="number" min="1" step="1" placeholder="0" style="width:100%; height:40px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                    </div>
                </div>
                <div>
                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">Not</label>
                    <textarea id="free_ext_note" rows="3" placeholder="is aciklamasi, kaplama tipi, teslim notu" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.6rem; resize:vertical;"></textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button class="btn-sm" onclick="Modal.close()">Vazgec</button>
                    <button class="btn-primary" onclick="UnitModule.saveFreeExternalVendorJob('${String(supplierId || '')}')">Kaydet</button>
                </div>
            </div>
        `, { maxWidth: '760px' });
    },
    openFreeExternalVendorJobsModal: (supplierId) => {
        const supplier = UnitModule.getFasonSuppliers().find(x => String(x?.id || '') === String(supplierId || ''));
        const jobs = (DB.data.data.freeExternalVendorJobs || [])
            .filter(job => String(job?.supplierId || '') === String(supplierId || '') || (!job?.supplierId && String(job?.supplierName || '') === String(supplier?.name || '')))
            .slice()
            .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
        Modal.open(`Gonderilen Urunler - ${UnitModule.escapeHtml(supplier?.name || '')}`, `
            <div class="card-table" style="max-height:420px; overflow:auto;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                            <th style="padding:0.55rem; text-align:left;">Kod</th>
                            <th style="padding:0.55rem; text-align:left;">Urun</th>
                            <th style="padding:0.55rem; text-align:center;">Adet</th>
                            <th style="padding:0.55rem; text-align:left;">Tarih</th>
                            <th style="padding:0.55rem; text-align:left;">Not</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${jobs.length === 0 ? '<tr><td colspan="5" style="padding:1rem; text-align:center; color:#94a3b8;">Bu fasoncuya gonderilen kayit yok.</td></tr>' : jobs.map(job => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:0.55rem; font-family:monospace; font-weight:700; color:#1d4ed8;">${UnitModule.escapeHtml(job.jobCode || '-')}</td>
                                <td style="padding:0.55rem;"><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(job.productName || '-')}</div><div style="font-size:0.73rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(job.productCode || '-')}</div></td>
                                <td style="padding:0.55rem; text-align:center; font-weight:700; color:#334155;">${Number(job.qty || 0)}</td>
                                <td style="padding:0.55rem; color:#64748b;">${UnitModule.escapeHtml(String(job.created_at || '').slice(0, 10) || '-')}</td>
                                <td style="padding:0.55rem; color:#475569;">${UnitModule.escapeHtml(job.note || '-')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `, { maxWidth: '920px' });
    },
    saveFreeExternalVendorJob: async (supplierId = '') => {
        if (!Array.isArray(DB.data?.data?.freeExternalVendorJobs)) DB.data.data.freeExternalVendorJobs = [];
        const supplierRef = String(supplierId || '').trim();
        const supplierName = String(document.getElementById('free_ext_supplier_name')?.value || '').trim();
        const contact = String(document.getElementById('free_ext_contact')?.value || '').trim();
        const productCode = String(document.getElementById('free_ext_product_code')?.value || '').trim().toUpperCase();
        const productName = String(document.getElementById('free_ext_product_name')?.value || '').trim();
        const qty = Math.floor(Number(document.getElementById('free_ext_qty')?.value || 0));
        const docNo = String(document.getElementById('free_ext_doc_no')?.value || '').trim();
        const note = String(document.getElementById('free_ext_note')?.value || '').trim();
        const jobCode = String(document.getElementById('free_ext_job_code')?.value || UnitModule.getNextFreeExternalVendorJobCode()).trim().toUpperCase();
        if (!supplierName) return alert('Firma adi zorunlu.');
        if (!productCode) return alert('Urun kodu zorunlu.');
        if (!productName) return alert('Urun adi zorunlu.');
        if (!Number.isFinite(qty) || qty <= 0) return alert('Giden adet 1 veya daha buyuk olmali.');
        if (UnitModule.isGlobalCodeTaken(jobCode)) return alert('Bu is/fis kodu baska bir kayitta kullaniliyor.');
        const now = new Date().toISOString();
        DB.data.data.freeExternalVendorJobs.push({
            id: crypto.randomUUID(),
            jobCode,
            supplierId: supplierRef,
            supplierName,
            contact,
            productCode,
            productName,
            qty,
            docNo,
            note,
            status: 'ACIK',
            created_at: now,
            updated_at: now
        });
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },
    renderFreeExternalVendorPage: (container) => {
        UnitModule.state.view = 'list';
        UnitModule.renderList(container);
    },
    renderUnitDashboard: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        const isExternalUnit = unit?.type === 'external';
        const productLibraryCard = `
            <a href="#" onclick="UnitModule.openUnitLibrary('${unitId}')" class="app-card">
                <div class="icon-box" style="background:linear-gradient(135deg,#bfdbfe,#7dd3fc); color:#1d4ed8"><i data-lucide="library" width="40" height="40"></i></div>
                <div class="app-name">&#304;&#351;lem K&#252;t&#252;phanesi</div>
            </a>
        `;
        if (isExternalUnit) {
            container.innerHTML = `
                <div class="page-header">
                     <h2 class="page-title">${unit.name}</h2>
                </div>
                <div class="apps-grid">
                    <a href="#" onclick="UnitModule.openUnitDepot('${unitId}')" class="app-card">
                        <div class="icon-box g-emerald"><i data-lucide="warehouse" width="40" height="40"></i></div>
                        <div class="app-name">Birim Deposu</div>
                    </a>
                    <a href="javascript:void(0)" onclick="UnitModule.openWorkOrderPlanning('${unitId}')" class="app-card">
                        <div class="icon-box g-blue"><i data-lucide="clipboard-list" width="40" height="40"></i></div>
                        <div class="app-name">Is Emri Planlama</div>
                    </a>
                    ${productLibraryCard}
                </div>
            `;
            return;
        }
        container.innerHTML = `
            <div class="page-header">
                 <h2 class="page-title">${unit.name}</h2>
            </div>
            <div class="apps-grid">
                <a href="#" onclick="UnitModule.openMachines('${unitId}')" class="app-card">
                    <div class="icon-box g-orange"><i data-lucide="settings" width="40" height="40"></i></div>
                    <div class="app-name">Makine Parkuru</div>
                </a>
                <a href="#" class="app-card" onclick="UnitModule.openPersonnel('${unitId}')">
                    <div class="icon-box g-blue"><i data-lucide="users" width="40" height="40"></i></div>
                    <div class="app-name">Personel</div>
                </a>
                 <a href="#" onclick="UnitModule.openUnitDepot('${unitId}')" class="app-card">
                    <div class="icon-box g-emerald"><i data-lucide="warehouse" width="40" height="40"></i></div>
                    <div class="app-name">Birim Deposu</div>
                </a>
                <a href="javascript:void(0)" onclick="UnitModule.openWorkOrderPlanning('${unitId}')" class="app-card">
                    <div class="icon-box g-blue"><i data-lucide="clipboard-list" width="40" height="40"></i></div>
                    <div class="app-name">Is Emri Planlama</div>
                </a>
                ${productLibraryCard}
            </div>
        `;
    },
    isSupplierRouteStationId: (stationId) => String(stationId || '').trim().toLowerCase().startsWith('supplier:'),
    getRouteStationName: (stationId) => {
        const key = String(stationId || '').trim();
        if (!key) return '-';
        const unit = (DB.data?.data?.units || []).find(u => String(u?.id || '') === key);
        if (unit?.name) return String(unit.name);
        if (UnitModule.isSupplierRouteStationId(key)) {
            const supplierId = key.split(':').slice(1).join(':');
            const supplier = (DB.data?.data?.suppliers || []).find(s => String(s?.id || '') === supplierId);
            if (supplier?.name) return String(supplier.name);
        }
        return key;
    },
    getRouteProcessName: (stationId, processId) => {
        const normalizedStationId = String(stationId || '').trim();
        const code = String(processId || '').trim().toUpperCase();
        if (!code) return '';
        if (code === 'FASON') return 'Fason islemi';

        const units = Array.isArray(DB.data?.data?.units) ? DB.data.data.units : [];
        const unit = units.find((u) => String(u?.id || '') === normalizedStationId);
        const unitName = String(unit?.name || '').toUpperCase();

        const findByCode = (list, codeFields, nameFields, requireUnitMatch = true) => {
            if (!Array.isArray(list)) return '';
            const row = list.find((entry) => {
                if (!entry) return false;
                if (requireUnitMatch && String(entry?.unitId || '') !== normalizedStationId) return false;
                return codeFields.some((field) => String(entry?.[field] || '').trim().toUpperCase() === code);
            });
            if (!row) return '';
            const hit = nameFields
                .map((field) => String(row?.[field] || '').trim())
                .find(Boolean);
            return hit || '';
        };

        if (normalizedStationId === 'u_dtm') {
            return findByCode(DB.data?.data?.depoTransferTasks, ['taskCode'], ['taskName'], false);
        }
        if (unitName.includes('CNC')) {
            return findByCode(DB.data?.data?.cncCards, ['cncId'], ['productName', 'name']);
        }
        if (normalizedStationId === 'u2' || unitName.includes('EKSTR')) {
            return findByCode(DB.data?.data?.extruderLibraryCards, ['cardCode'], ['productName', 'name']);
        }
        if (unitName.includes('TESTERE')) {
            return findByCode(DB.data?.data?.sawCutOrders, ['code'], ['processName', 'name']);
        }
        if (normalizedStationId === 'u9' || unitName.includes('PVD') || unitName.includes('PWD')) {
            return findByCode(DB.data?.data?.pvdCards, ['cardCode'], ['productName', 'processName', 'name']);
        }
        if (normalizedStationId === 'u11' || unitName.includes('ELOKSAL')) {
            return findByCode(DB.data?.data?.eloksalCards, ['cardCode'], ['productName', 'processName', 'name']);
        }
        if (normalizedStationId === 'u10' || unitName.includes('IBRAHIM POLISAJ')) {
            return findByCode(DB.data?.data?.ibrahimPolishCards, ['cardCode'], ['productName', 'processName', 'name']);
        }
        if (normalizedStationId === 'u5' || unitName.includes('PLEKS') || unitName.includes('POLISAJ')) {
            return findByCode(DB.data?.data?.plexiPolishCards, ['cardCode'], ['processName', 'productName', 'name']);
        }
        if (normalizedStationId === 'u3' || unitName.includes('MONTAJ')) {
            return findByCode(DB.data?.data?.montageCards, ['cardCode', 'productCode'], ['productName', 'name']);
        }
        return '';
    },
    getNextRouteInfo: (line, stationId, routeRef = null, txns = [], order = null) => {
        const routes = Array.isArray(line?.routes) ? line.routes : [];
        const idx = UnitModule.resolveRouteIndexForUnit(line, stationId, txns, order || {}, routeRef);
        if (idx < 0 || idx >= routes.length - 1) return null;
        const next = routes[idx + 1];
        if (!next) return null;
        return {
            routeId: String(next?.id || '').trim(),
            routeSeq: idx + 2,
            stationId: String(next.stationId || ''),
            stationName: UnitModule.getRouteStationName(next.stationId || ''),
            processId: String(next.processId || '').trim().toUpperCase()
        };
    },
    getUnitWorkRows: (unitId) => {
        const rows = UnitModule.getWorkOrderPlanningRowsForUnit(unitId);
        return rows.map((row) => ({
            ...row,
            nextRoute: row?.metrics?.nextStationId
                ? (() => {
                    const routes = Array.isArray(row?.line?.routes) ? row.line.routes : [];
                    const nextIdx = Math.max(0, Number(row?.metrics?.nextRouteSeq || 0) - 1);
                    const next = routes[nextIdx] || null;
                    return {
                        routeId: String(row?.metrics?.nextRouteId || ''),
                        routeSeq: Number(row?.metrics?.nextRouteSeq || 0),
                        stationId: String(row?.metrics?.nextStationId || ''),
                        stationName: UnitModule.getRouteStationName(String(row?.metrics?.nextStationId || '')) || '-',
                        processId: String(next?.processId || '').trim().toUpperCase()
                    };
                })()
                : null
        }));
    },
    renderUnitDepotPlaceholder: (container, unitId) => {
        const unit = (DB.data?.data?.units || []).find(u => String(u.id) === String(unitId));
        if (!unit) {
            container.innerHTML = `<div style="text-align:center; padding:3rem; color:#64748b;">Birim bulunamadi.</div>`;
            return;
        }
        const search = String(UnitModule.state.workOrderSearch || '').trim().toLowerCase();
        const rows = UnitModule.getUnitWorkRows(unitId).filter(row => {
            if (!search) return true;
            const currentProcessName = UnitModule.getRouteProcessName(row?.metrics?.stationId, row?.metrics?.processId);
            const nextProcessName = UnitModule.getRouteProcessName(row?.nextRoute?.stationId, row?.nextRoute?.processId);
            const hay = [
                row.order?.workOrderCode,
                row.order?.productCode,
                row.order?.productName,
                row.line?.lineCode,
                row.line?.componentCode,
                row.line?.componentName,
                row.metrics?.processId,
                currentProcessName,
                row.nextRoute?.stationName,
                row.nextRoute?.processId,
                nextProcessName
            ].join(' ').toLowerCase();
            return hay.includes(search);
        });
        const waitingRows = rows.filter(row => Number(row.metrics?.availableQty || 0) > 0 || Number(row.metrics?.inProcessQty || 0) > 0);
        const nextRows = rows.filter(row => Number(row.metrics?.doneQty || 0) > 0);
        const waitingQty = rows.reduce((sum, row) => sum + Number(row.metrics?.availableQty || 0), 0);
        const inProcessQty = rows.reduce((sum, row) => sum + Number(row.metrics?.inProcessQty || 0), 0);
        const readyQty = rows.reduce((sum, row) => sum + Number(row.metrics?.doneQty || 0), 0);
        const renderRouteLabel = (row) => {
            const processName = UnitModule.getRouteProcessName(row?.metrics?.stationId, row?.metrics?.processId);
            return `
                <div style="font-size:0.82rem; color:#334155; font-weight:700;">${row.metrics.routeSeq}. ${UnitModule.escapeHtml(UnitModule.getRouteStationName(row.metrics.stationId || '') || '-')}</div>
                <div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(row.metrics.processId || '-')}</div>
                <div style="font-size:0.72rem; color:#64748b; margin-top:0.08rem;">${UnitModule.escapeHtml(processName || '-')}</div>
            `;
        };
        container.innerHTML = `
            <div style="max-width:1380px; margin:0 auto;">
                <div style="margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.8rem; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.45rem;">
                                <i data-lucide="warehouse" color="#059669"></i> ${UnitModule.escapeHtml(unit.name || '-')} - Birim Deposu
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b;">Bekleyen urunleri goruntule, isleme al ve tamamlananlari sonraki rotaya hazir tut.</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.45rem; flex-wrap:wrap;">
                        <button class="btn-sm" onclick="UnitModule.openWorkOrderPlanning('${unitId}')">is emri planlama</button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.7rem; margin-bottom:1rem;">
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Bekleyen adet</div><div style="font-size:1.15rem; font-weight:800; color:#0f172a;">${waitingQty}</div></div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Islemde adet</div><div style="font-size:1.15rem; font-weight:800; color:#b45309;">${inProcessQty}</div></div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.75rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Sonraki rotaya hazir</div><div style="font-size:1.15rem; font-weight:800; color:#047857;">${readyQty}</div></div>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.8rem; margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.7rem; flex-wrap:wrap;">
                    <div style="font-size:0.83rem; color:#64748b;">Bu ekranda urun once <strong>Bekleyen</strong>e duser, sonra <strong>Isleme Al</strong>, sonra <strong>Tamamla</strong> ile sonraki rotaya hazir olur.</div>
                    <input value="${UnitModule.escapeHtml(UnitModule.state.workOrderSearch || '')}" oninput="UnitModule.setWorkOrderSearch(this.value)" placeholder="is emri, urun, bilesen veya rota ara" style="min-width:280px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.52rem 0.65rem; font-weight:600;">
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.95rem; margin-bottom:1rem;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.7rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                        <div>
                            <div style="font-size:1rem; font-weight:800; color:#0f172a;">Bekleyen Urunler</div>
                            <div style="font-size:0.8rem; color:#64748b;">Onceki istasyondan gelen veya bu istasyonda islemde olan urunler.</div>
                        </div>
                    </div>
                    <div class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                    <th style="padding:0.55rem; text-align:left;">Is emri</th>
                                    <th style="padding:0.55rem; text-align:left;">Urun</th>
                                    <th style="padding:0.55rem; text-align:left;">Bilesen</th>
                                    <th style="padding:0.55rem; text-align:left;">Bu rota adimi</th>
                                    <th style="padding:0.55rem; text-align:center;">Bekleyen</th>
                                    <th style="padding:0.55rem; text-align:center;">Islemde</th>
                                    <th style="padding:0.55rem; text-align:right;">Islem</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${waitingRows.length === 0 ? `<tr><td colspan="7" style="padding:1rem; text-align:center; color:#94a3b8;">Bekleyen veya islemde kayit yok.</td></tr>` : waitingRows.map(row => {
            const canTake = Number(row.metrics?.availableQty || 0) > 0;
            const canComplete = Number(row.metrics?.inProcessQty || 0) > 0;
            return `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:0.55rem;"><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${UnitModule.escapeHtml(row.order?.workOrderCode || '-')}</div><div style="font-family:monospace; font-size:0.74rem; color:#64748b;">${UnitModule.escapeHtml(row.line?.lineCode || '-')}</div></td>
                                        <td style="padding:0.55rem;"><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.order?.productName || '-')}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(row.order?.productCode || '-')}</div></td>
                                        <td style="padding:0.55rem;"><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.line?.componentName || '-')}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(row.line?.componentCode || '-')}</div></td>
                                        <td style="padding:0.55rem;">${renderRouteLabel(row)}</td>
                                        <td style="padding:0.55rem; text-align:center; font-weight:800; color:#0f172a;">${Number(row.metrics?.availableQty || 0)}</td>
                                        <td style="padding:0.55rem; text-align:center; font-weight:800; color:#b45309;">${Number(row.metrics?.inProcessQty || 0)}</td>
                                        <td style="padding:0.55rem; text-align:right;">
                                            <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                                                <button class="btn-sm" onclick="UnitModule.takeWorkOrderQty('${row.order.id}','${row.line.id}','${row.metrics.stationId}','${Number(row.metrics?.routeSeq || 0)}')" ${canTake ? '' : 'disabled'} style="${canTake ? 'border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;' : 'opacity:0.45; cursor:not-allowed;'}">Isleme Al</button>
                                                <button class="btn-sm" onclick="UnitModule.completeWorkOrderQty('${row.order.id}','${row.line.id}','${row.metrics.stationId}', null, { routeSeq: ${Number(row.metrics?.routeSeq || 0)} })" ${canComplete ? '' : 'disabled'} style="${canComplete ? 'border-color:#bbf7d0; color:#047857; background:#ecfdf5;' : 'opacity:0.45; cursor:not-allowed;'}">Tamamla</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.95rem;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.7rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                        <div>
                            <div style="font-size:1rem; font-weight:800; color:#0f172a;">Sonraki Rotaya Verilecekler</div>
                            <div style="font-size:0.8rem; color:#64748b;">Bu istasyonda tamamlanan ve sonraki adima hazir olan urunler.</div>
                        </div>
                    </div>
                    <div class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                    <th style="padding:0.55rem; text-align:left;">Is emri</th>
                                    <th style="padding:0.55rem; text-align:left;">Urun</th>
                                    <th style="padding:0.55rem; text-align:left;">Bilesen</th>
                                    <th style="padding:0.55rem; text-align:center;">Hazir adet</th>
                                    <th style="padding:0.55rem; text-align:left;">Sonraki rota</th>
                                    <th style="padding:0.55rem; text-align:left;">Not</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${nextRows.length === 0 ? `<tr><td colspan="6" style="padding:1rem; text-align:center; color:#94a3b8;">Sonraki rotaya hazir kayit yok.</td></tr>` : nextRows.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:0.55rem;"><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${UnitModule.escapeHtml(row.order?.workOrderCode || '-')}</div><div style="font-family:monospace; font-size:0.74rem; color:#64748b;">${UnitModule.escapeHtml(row.line?.lineCode || '-')}</div></td>
                                        <td style="padding:0.55rem;"><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.order?.productName || '-')}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(row.order?.productCode || '-')}</div></td>
                                        <td style="padding:0.55rem;"><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.line?.componentName || '-')}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(row.line?.componentCode || '-')}</div></td>
                                        <td style="padding:0.55rem; text-align:center; font-weight:800; color:#047857;">${Number(row.metrics?.doneQty || 0)}</td>
                                        <td style="padding:0.55rem;"><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.nextRoute?.stationName || 'ROTA SONU')}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(row.nextRoute?.processId || (row.nextRoute ? '-' : 'son adim'))}</div><div style="font-size:0.72rem; color:#64748b; margin-top:0.08rem;">${UnitModule.escapeHtml(row.nextRoute ? (UnitModule.getRouteProcessName(row.nextRoute.stationId, row.nextRoute.processId) || '-') : 'sevk / depo asamasi')}</div></td>
                                        <td style="padding:0.55rem; color:#475569;">${row.nextRoute ? 'Bu adet sonraki istasyonda bekleyen olarak gorunur.' : 'Son adim tamamlandi; sevk veya depo transfer akisina hazir.'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },
    setWorkOrderTab: (tab) => {
        const normalized = String(tab || 'AKTIF').toUpperCase();
        const validTabs = ['AKTIF', 'BEKLEYEN', 'HAVUZ', 'ISTATISTIK', 'ARSIV', 'FASON'];
        UnitModule.state.workOrderTab = validTabs.includes(normalized) ? normalized : 'AKTIF';
        UI.renderCurrentPage();
    },
    setWorkOrderSearch: (value) => {
        UnitModule.state.workOrderSearch = String(value || '');
        UI.renderCurrentPage();
    },
    setWorkOrderTransferTarget: (value) => {
        UnitModule.state.workOrderTransferTarget = String(value || '').trim();
        UnitModule.state.workOrderDispatchRows = {};
        UnitModule.state.workOrderDispatchQtyByRow = {};
        UnitModule.state.workOrderDispatchDraft = null;
        UI.renderCurrentPage();
    },
    setWorkOrderDispatchListTarget: (value) => {
        UnitModule.state.workOrderDispatchListTarget = String(value || '').trim();
        UI.renderCurrentPage();
    },
    getWorkOrderDispatchStatusMeta: (statusRaw) => {
        const status = String(statusRaw || 'HAZIRLANDI').trim().toUpperCase();
        if (status === 'TESLIM_EDILDI') {
            return { label: 'Teslim edildi', style: 'background:#dbeafe; color:#1d4ed8; border:1px solid #bfdbfe;' };
        }
        if (status === 'DIS_BIRIMDE') {
            return { label: 'Dis birimde', style: 'background:#ede9fe; color:#5b21b6; border:1px solid #ddd6fe;' };
        }
        if (status === 'GERI_GELDI') {
            return { label: 'Geri geldi', style: 'background:#fef3c7; color:#92400e; border:1px solid #fde68a;' };
        }
        if (status === 'DEPOYA_ALINDI') {
            return { label: 'Depoya alindi', style: 'background:#dcfce7; color:#166534; border:1px solid #bbf7d0;' };
        }
        return { label: 'Hazirlandi', style: 'background:#f1f5f9; color:#334155; border:1px solid #e2e8f0;' };
    },
    setWorkOrderDispatchNoteStatus: async (noteId, nextStatusRaw) => {
        if (!Array.isArray(DB.data?.data?.workOrderDispatchNotes)) DB.data.data.workOrderDispatchNotes = [];
        const note = (DB.data.data.workOrderDispatchNotes || []).find((row) => String(row?.id || '') === String(noteId || ''));
        if (!note) return alert('Irsaliye kaydi bulunamadi.');
        const nextStatus = String(nextStatusRaw || '').trim().toUpperCase();
        const allowed = new Set(['HAZIRLANDI', 'TESLIM_EDILDI', 'DIS_BIRIMDE', 'GERI_GELDI', 'DEPOYA_ALINDI']);
        if (!allowed.has(nextStatus)) return alert('Gecersiz irsaliye durumu.');
        const currentStatus = String(note?.status || 'HAZIRLANDI').trim().toUpperCase();
        if (currentStatus === nextStatus) return;
        const transitions = {
            HAZIRLANDI: ['TESLIM_EDILDI'],
            TESLIM_EDILDI: ['DIS_BIRIMDE', 'GERI_GELDI'],
            DIS_BIRIMDE: ['GERI_GELDI'],
            GERI_GELDI: ['DEPOYA_ALINDI'],
            DEPOYA_ALINDI: []
        };
        const validNext = transitions[currentStatus] || [];
        if (!validNext.includes(nextStatus)) {
            return alert('Bu durum gecisi izinli degil. Sirayi takip edin.');
        }
        const now = new Date().toISOString();
        if (!Array.isArray(note.history)) note.history = [];
        if (note.history.length === 0) {
            note.history.push({
                at: String(note.created_at || now),
                status: 'HAZIRLANDI',
                user: String(note.created_by || 'Demo User')
            });
        }
        note.status = nextStatus;
        note.updated_at = now;
        note.updated_by = 'Demo User';
        note.history.push({ at: now, status: nextStatus, user: 'Demo User' });
        if (nextStatus === 'DEPOYA_ALINDI') {
            note.isArchived = true;
            note.archived_at = now;
            note.archived_by = 'Demo User';
        }
        await DB.save();
        UI.renderCurrentPage();
    },
    openWorkOrderDispatchNoteDetail: (noteId) => {
        const notes = Array.isArray(DB.data?.data?.workOrderDispatchNotes) ? DB.data.data.workOrderDispatchNotes : [];
        const note = notes.find((row) => String(row?.id || '') === String(noteId || ''));
        if (!note) return alert('Irsaliye kaydi bulunamadi.');
        const rows = Array.isArray(note?.rows) ? note.rows : [];
        const totalQty = rows.reduce((sum, row) => sum + Math.max(0, Number(row?.qty || 0)), 0);
        const statusMeta = UnitModule.getWorkOrderDispatchStatusMeta(note?.status);
        const history = Array.isArray(note?.history) ? note.history : [];
        Modal.open(`Irsaliye - ${UnitModule.escapeHtml(String(note?.docNo || '-'))}`, `
            <div style="display:flex; flex-direction:column; gap:0.7rem;">
                <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.48rem 0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Belge No</div><div style="font-family:monospace; font-weight:800; color:#1d4ed8;">${UnitModule.escapeHtml(String(note?.docNo || '-'))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.48rem 0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Hedef birim</div><div style="font-weight:700; color:#0f172a;">${UnitModule.escapeHtml(String(note?.targetUnitName || '-'))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.48rem 0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Toplam adet</div><div style="font-weight:800; color:#0f172a;">${Number(totalQty || 0)}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.48rem 0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Durum</div><span style="display:inline-block; margin-top:0.2rem; border-radius:999px; padding:0.12rem 0.5rem; font-size:0.72rem; font-weight:700; ${statusMeta.style}">${statusMeta.label}</span></div>
                </div>
                <div class="card-table">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.73rem; text-transform:uppercase;">
                                <th style="padding:0.5rem; text-align:left;">Is emri / satir</th>
                                <th style="padding:0.5rem; text-align:left;">Parca</th>
                                <th style="padding:0.5rem; text-align:left;">Yapilacak islem</th>
                                <th style="padding:0.5rem; text-align:center;">Adet</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length === 0 ? `<tr><td colspan="4" style="padding:0.8rem; text-align:center; color:#94a3b8;">Satir yok.</td></tr>` : rows.map((row) => {
                                const processMeta = UnitModule.getWorkOrderDispatchProcessMeta(row, note);
                                return `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:0.5rem;"><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${UnitModule.escapeHtml(String(row?.workOrderCode || '-'))}</div><div style="font-family:monospace; font-size:0.72rem; color:#64748b;">${UnitModule.escapeHtml(String(row?.lineCode || '-'))}</div></td>
                                    <td style="padding:0.5rem;"><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(String(row?.componentName || '-'))}</div><div style="font-size:0.72rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(String(row?.componentCode || '-'))}</div></td>
                                    <td style="padding:0.5rem;"><div style="font-size:0.7rem; color:#64748b; font-family:monospace; font-weight:700;">${UnitModule.escapeHtml(processMeta.code || '-')}</div><div style="font-size:0.82rem; color:#0f172a; font-weight:800; margin-top:0.1rem;">${UnitModule.escapeHtml(processMeta.name || '-')}</div></td>
                                    <td style="padding:0.5rem; text-align:center; font-weight:800; color:#0f172a;">${Math.max(0, Number(row?.qty || 0))}</td>
                                </tr>
                            `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#334155; margin-bottom:0.3rem;">Sevk notu</div>
                    <div style="font-size:0.82rem; color:#334155; line-height:1.55; white-space:pre-wrap; word-break:break-word;">${UnitModule.escapeHtml(String(note?.note || '-'))}</div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                    <div style="font-size:0.78rem; font-weight:700; color:#334155; margin-bottom:0.35rem;">Hareket gecmisi</div>
                    ${history.length === 0 ? `<div style="font-size:0.78rem; color:#94a3b8;">Gecmis kaydi yok.</div>` : history.map((h) => {
                        const meta = UnitModule.getWorkOrderDispatchStatusMeta(h?.status);
                        return `<div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; border-top:1px solid #f1f5f9; padding:0.35rem 0;"><span style="display:inline-block; border-radius:999px; padding:0.1rem 0.45rem; font-size:0.72rem; font-weight:700; ${meta.style}">${meta.label}</span><span style="font-size:0.76rem; color:#475569;">${UnitModule.escapeHtml(UnitModule.formatDateTimeShort(String(h?.at || '')))} - ${UnitModule.escapeHtml(String(h?.user || '-'))}</span></div>`;
                    }).join('')}
                </div>
                <div style="display:flex; justify-content:flex-end;">
                    <div style="display:inline-flex; gap:0.4rem; flex-wrap:wrap; justify-content:flex-end;">
                        <button class="btn-sm" onclick="UnitModule.openWorkOrderDispatchPdfPreview('${UnitModule.escapeHtml(String(note?.id || ''))}')" style="border-color:#1d4ed8; color:#1d4ed8; background:#eff6ff;">PDF goruntule</button>
                    </div>
                </div>
            </div>
        `);
    },
    getWorkOrderDispatchRowKey: (workOrderId, lineId, stationId, routeRef = null) => {
        const routeId = String(routeRef?.routeId || '').trim();
        const routeSeq = Math.max(0, Number(routeRef?.routeSeq || 0));
        const routeKey = routeId || (routeSeq > 0 ? `SEQ-${routeSeq}` : '');
        return `${String(workOrderId || '')}::${String(lineId || '')}::${String(stationId || '')}::${routeKey}`;
    },
    toggleWorkOrderDispatchRow: (rowKey, checked) => {
        const key = String(rowKey || '').trim();
        if (!key) return;
        const next = { ...(UnitModule.state.workOrderDispatchRows || {}) };
        next[key] = !!checked;
        UnitModule.state.workOrderDispatchRows = next;
        UI.renderCurrentPage();
    },
    setWorkOrderDispatchQty: (rowKey, value) => {
        const key = String(rowKey || '').trim();
        if (!key) return;
        const qty = Math.max(0, Math.floor(Number(value || 0)));
        const next = { ...(UnitModule.state.workOrderDispatchQtyByRow || {}) };
        next[key] = qty;
        UnitModule.state.workOrderDispatchQtyByRow = next;
        UI.renderCurrentPage();
    },
    setWorkOrderDispatchDraftNote: (value) => {
        if (!UnitModule.state.workOrderDispatchDraft || typeof UnitModule.state.workOrderDispatchDraft !== 'object') return;
        UnitModule.state.workOrderDispatchDraft.note = String(value || '');
    },
    getWorkOrderDispatchProcessMeta: (row, noteLike = null) => {
        const processCode = String(
            row?.targetProcessId
            || row?.processId
            || row?.sourceProcessId
            || ''
        ).trim().toUpperCase();
        const unitId = String(row?.targetUnitId || noteLike?.targetUnitId || '').trim();
        const processName = String(
            row?.targetProcessName
            || (processCode ? UnitModule.getRouteProcessName(unitId, processCode) : '')
            || ''
        ).trim();
        return { code: processCode, name: processName };
    },
    getNextWorkOrderDispatchDocNo: () => {
        if (!Array.isArray(DB.data?.data?.workOrderDispatchNotes)) DB.data.data.workOrderDispatchNotes = [];
        const max = (DB.data.data.workOrderDispatchNotes || []).reduce((acc, row) => {
            const code = String(row?.docNo || '').trim().toUpperCase();
            const match = code.match(/^DSI-(\d{6})$/);
            if (!match) return acc;
            return Math.max(acc, Number(match[1]));
        }, 0);
        return `DSI-${String(max + 1).padStart(6, '0')}`;
    },
    collectWorkOrderDispatchSelection: (stationId, targetId) => {
        const selectedKeys = Object.entries(UnitModule.state.workOrderDispatchRows || {})
            .filter(([, on]) => !!on)
            .map(([key]) => String(key || '').trim())
            .filter(Boolean);
        if (!selectedKeys.length) return { error: 'Irsaliye icin satir seciniz.' };
        const rows = UnitModule.getWorkOrderPlanningRowsForUnit(stationId);
        const rowMap = new Map(rows.map((row) => [
            UnitModule.getWorkOrderDispatchRowKey(row?.order?.id, row?.line?.id, row?.metrics?.stationId, row?.metrics),
            row
        ]));
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const selectedRows = [];
        for (const key of selectedKeys) {
            const row = rowMap.get(key);
            if (!row) continue;
            const nextStationId = String(row?.metrics?.nextStationId || '');
            if (nextStationId !== targetId) continue;
            const qty = Math.max(0, Math.floor(Number((UnitModule.state.workOrderDispatchQtyByRow || {})[key] || 0)));
            if (!qty) continue;
            const metrics = UnitModule.computeWorkLineUnitMetrics(row.order, row.line, stationId, txns, row?.metrics);
            const maxQty = Math.max(0, Math.floor(Number(metrics?.inProcessQty || 0)));
            if (!maxQty) continue;
            if (qty > maxQty) {
                return {
                    error: `Maksimum girilebilir miktar asildi: ${String(row?.order?.workOrderCode || '-')} / ${String(row?.line?.lineCode || '-')}. Maksimum ${maxQty}.`
                };
            }
            const routes = Array.isArray(row?.line?.routes) ? row.line.routes : [];
            const currentSeq = Math.max(0, Number(metrics?.routeSeq || row?.metrics?.routeSeq || 0));
            const nextSeq = Math.max(0, Number(metrics?.nextRouteSeq || row?.metrics?.nextRouteSeq || 0));
            let targetRoute = null;
            if (nextSeq > 0 && nextSeq <= routes.length) {
                const bySeq = routes[nextSeq - 1];
                if (String(bySeq?.stationId || '') === targetId) targetRoute = bySeq;
            }
            if (!targetRoute) {
                targetRoute = routes.find((route, idx) =>
                    String(route?.stationId || '') === targetId
                    && Number(idx + 1) >= Math.max(1, currentSeq + 1)
                ) || routes.find((route) => String(route?.stationId || '') === targetId) || null;
            }
            const targetProcessId = String(targetRoute?.processId || '').trim().toUpperCase();
            const targetProcessName = targetProcessId
                ? String(UnitModule.getRouteProcessName(targetId, targetProcessId) || '').trim()
                : '';
            selectedRows.push({
                rowKey: key,
                workOrderId: String(row?.order?.id || ''),
                workOrderCode: String(row?.order?.workOrderCode || ''),
                lineId: String(row?.line?.id || ''),
                lineCode: String(row?.line?.lineCode || ''),
                componentCode: String(row?.line?.componentCode || ''),
                componentName: String(row?.line?.componentName || ''),
                sourceStationId: stationId,
                sourceRouteId: String(metrics?.routeId || ''),
                sourceRouteSeq: Number(metrics?.routeSeq || 0),
                sourceProcessId: String(metrics?.processId || ''),
                targetUnitId: targetId,
                targetProcessId,
                targetProcessName,
                qty: Number(qty || 0)
            });
        }
        if (!selectedRows.length) return { error: 'Secili satirlarda sevk edilecek adet bulunamadi.' };
        return { rows: selectedRows };
    },
    buildWorkOrderDispatchPdfHtml: (noteLike) => {
        const rows = Array.isArray(noteLike?.rows) ? noteLike.rows : [];
        const totalQty = rows.reduce((sum, row) => sum + Math.max(0, Number(row?.qty || 0)), 0);
        const dispatchNote = String(noteLike?.note || '').trim();
        const createdLabel = UnitModule.formatDateTimeShort(String(noteLike?.created_at || '')) || '-';
        const printedLabel = UnitModule.formatDateTimeShort(new Date().toISOString());
        const sourceUnitName = UnitModule.getRouteStationName(String(noteLike?.stationId || '')) || String(noteLike?.stationId || '-');
        const targetUnitName = String(noteLike?.targetUnitName || '-');
        const docNo = String(noteLike?.docNo || '-');
        const createdBy = String(noteLike?.created_by || 'Demo User');
        const statusMeta = UnitModule.getWorkOrderDispatchStatusMeta(noteLike?.status);
        const history = Array.isArray(noteLike?.history) ? noteLike.history : [];
        const noteStatus = String(statusMeta?.label || '-');
        const baseOrigin = (typeof window !== 'undefined' && window?.location?.origin && window.location.origin !== 'null')
            ? String(window.location.origin)
            : '';
        const logoUrl = baseOrigin
            ? `${baseOrigin}/assets/logodulda.jpg`
            : 'assets/logodulda.jpg';
        return `
<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Teslim Belgesi ${UnitModule.escapeHtml(docNo)}</title>
    <style>
        :root {
            --ink:#0f172a;
            --muted:#64748b;
            --line:#cbd5e1;
            --bg:#f1f5f9;
            --card:#ffffff;
            --brand:#0b3a8f;
            --brand-soft:#dbeafe;
        }
        * { box-sizing:border-box; }
        body {
            margin:0;
            font-family: "Segoe UI", Tahoma, Arial, sans-serif;
            color:var(--ink);
            background:var(--bg);
        }
        .screen-tools {
            max-width:920px;
            margin:14px auto 0 auto;
            padding:0 8px;
            display:flex;
            justify-content:flex-end;
            gap:8px;
        }
        .tool-btn {
            border:1px solid #334155;
            background:#0f172a;
            color:#fff;
            border-radius:8px;
            height:34px;
            padding:0 12px;
            font-size:12px;
            font-weight:700;
            cursor:pointer;
        }
        .tool-btn.secondary {
            background:#fff;
            color:#0f172a;
            border-color:#94a3b8;
        }
        .sheet {
            width:210mm;
            min-height:297mm;
            margin:10px auto 22px auto;
            background:var(--card);
            border:1px solid #dbe3ef;
            box-shadow:0 18px 45px rgba(15,23,42,0.16);
            padding:12mm;
            position:relative;
        }
        .header {
            border:2px solid #1e293b;
            border-radius:12px;
            padding:10px 12px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:14px;
            margin-bottom:12px;
            background:linear-gradient(120deg, #ffffff 0%, #f8fbff 100%);
        }
        .brand-wrap {
            display:flex;
            align-items:center;
            gap:12px;
            min-width:0;
        }
        .brand-logo {
            width:150px;
            max-height:56px;
            object-fit:contain;
            display:block;
        }
        .title-wrap h1 {
            margin:0;
            font-size:20px;
            letter-spacing:0.02em;
            font-weight:900;
            color:#0b3a8f;
        }
        .title-wrap .subtitle {
            margin-top:4px;
            color:var(--muted);
            font-size:12px;
            font-weight:600;
        }
        .doc-no {
            border:1px solid #93c5fd;
            background:var(--brand-soft);
            color:#1d4ed8;
            border-radius:999px;
            padding:4px 10px;
            font-size:12px;
            font-weight:800;
            font-family:Consolas, monospace;
            white-space:nowrap;
        }
        .meta-grid {
            display:grid;
            grid-template-columns:repeat(4,minmax(0,1fr));
            gap:8px;
            margin-bottom:10px;
        }
        .meta-card {
            border:1px solid var(--line);
            border-radius:10px;
            padding:7px 9px;
            min-height:66px;
        }
        .meta-k {
            color:var(--muted);
            font-size:10px;
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:0.04em;
            margin-bottom:4px;
        }
        .meta-v {
            color:var(--ink);
            font-size:13px;
            font-weight:800;
            line-height:1.35;
            word-break:break-word;
        }
        .status-chip {
            display:inline-flex;
            border:1px solid #bfdbfe;
            border-radius:999px;
            padding:2px 8px;
            font-size:11px;
            font-weight:800;
            background:#eff6ff;
            color:#1d4ed8;
        }
        table {
            width:100%;
            border-collapse:collapse;
            margin-top:8px;
        }
        thead th {
            border:1px solid var(--line);
            background:#f8fafc;
            color:#334155;
            font-size:10px;
            letter-spacing:0.04em;
            text-transform:uppercase;
            padding:8px 7px;
            text-align:left;
        }
        tbody td {
            border:1px solid var(--line);
            font-size:12px;
            padding:7px;
            vertical-align:top;
        }
        .proc-code {
            font-size:10px;
            line-height:1.25;
            font-family:Consolas, monospace;
            color:#64748b;
            font-weight:700;
        }
        .proc-name {
            margin-top:2px;
            font-size:12px;
            line-height:1.35;
            color:#0f172a;
            font-weight:800;
        }
        .mono { font-family:Consolas, monospace; font-weight:800; color:#1d4ed8; }
        .right { text-align:right; }
        .center { text-align:center; }
        .sum-row td {
            background:#f8fafc;
            font-weight:900;
        }
        .timeline {
            margin-top:10px;
            border:1px solid var(--line);
            border-radius:10px;
            padding:8px 10px;
        }
        .dispatch-note-box {
            margin-top:10px;
            border:1px solid var(--line);
            border-radius:10px;
            padding:8px 10px;
            background:#f8fafc;
        }
        .dispatch-note-title {
            font-size:11px;
            font-weight:800;
            color:#334155;
            text-transform:uppercase;
            letter-spacing:0.04em;
            margin-bottom:4px;
        }
        .dispatch-note-text {
            font-size:12px;
            color:#0f172a;
            line-height:1.5;
            white-space:pre-wrap;
            word-break:break-word;
        }
        .timeline-title {
            font-size:11px;
            font-weight:800;
            color:#334155;
            margin-bottom:5px;
            text-transform:uppercase;
            letter-spacing:0.04em;
        }
        .timeline-row {
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
            padding:4px 0;
            border-top:1px dashed #e2e8f0;
            font-size:11px;
        }
        .timeline-row:first-of-type { border-top:none; }
        .footer-sign {
            margin-top:16px;
            display:grid;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:16px;
        }
        .sign-box {
            border:1px solid var(--line);
            border-radius:10px;
            min-height:78px;
            padding:8px;
            display:flex;
            flex-direction:column;
            justify-content:flex-end;
        }
        .sign-line {
            border-top:1px solid #94a3b8;
            padding-top:5px;
            text-align:center;
            font-size:10px;
            color:#64748b;
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:0.04em;
        }
        .note {
            margin-top:10px;
            font-size:10px;
            color:#64748b;
            display:flex;
            justify-content:space-between;
            gap:10px;
            flex-wrap:wrap;
        }
        @page { size: A4; margin: 10mm; }
        @media print {
            body { background:#fff; }
            .screen-tools { display:none !important; }
            .sheet {
                margin:0;
                border:none;
                box-shadow:none;
                width:auto;
                min-height:auto;
                padding:0;
            }
        }
    </style>
</head>
<body>
    <div class="screen-tools">
        <button class="tool-btn" onclick="window.print()">PDF indir / Yazdir</button>
        <button class="tool-btn secondary" onclick="window.close()">Kapat</button>
    </div>
    <section class="sheet">
        <div class="header">
            <div class="brand-wrap">
                <img class="brand-logo" src="${UnitModule.escapeHtml(logoUrl)}" alt="Dulda Logo" onerror="this.style.display='none';">
                <div class="title-wrap">
                    <h1>TESLIM BELGESI</h1>
                    <div class="subtitle">Fason sevk ve teslim takip dokumani</div>
                </div>
            </div>
            <div class="doc-no">${UnitModule.escapeHtml(docNo)}</div>
        </div>

        <div class="meta-grid">
            <div class="meta-card">
                <div class="meta-k">Kaynak Birim</div>
                <div class="meta-v">${UnitModule.escapeHtml(sourceUnitName)}</div>
            </div>
            <div class="meta-card">
                <div class="meta-k">Hedef Birim</div>
                <div class="meta-v">${UnitModule.escapeHtml(targetUnitName)}</div>
            </div>
            <div class="meta-card">
                <div class="meta-k">Belge Tarihi</div>
                <div class="meta-v">${UnitModule.escapeHtml(createdLabel)}</div>
            </div>
            <div class="meta-card">
                <div class="meta-k">Durum</div>
                <div class="meta-v"><span class="status-chip">${UnitModule.escapeHtml(noteStatus)}</span></div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width:40px;" class="center">Sira</th>
                    <th style="width:170px;">Is Emri / Satir</th>
                    <th>Parca Bilgisi</th>
                    <th style="width:220px;">Yapilacak Islem</th>
                    <th style="width:92px;" class="right">Adet</th>
                </tr>
            </thead>
            <tbody>
                ${rows.length === 0 ? `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Satir yok.</td></tr>` : rows.map((row, idx) => {
                    const processMeta = UnitModule.getWorkOrderDispatchProcessMeta(row, noteLike);
                    return `
                    <tr>
                        <td class="center">${idx + 1}</td>
                        <td><div class="mono">${UnitModule.escapeHtml(String(row?.workOrderCode || '-'))}</div><div>${UnitModule.escapeHtml(String(row?.lineCode || '-'))}</div></td>
                        <td><div style="font-weight:700;">${UnitModule.escapeHtml(String(row?.componentName || '-'))}</div><div style="font-family:Consolas, monospace; color:#475569;">${UnitModule.escapeHtml(String(row?.componentCode || '-'))}</div></td>
                        <td>
                            <div class="proc-code">${UnitModule.escapeHtml(processMeta.code || '-')}</div>
                            <div class="proc-name">${UnitModule.escapeHtml(processMeta.name || '-')}</div>
                        </td>
                        <td class="right"><strong>${Math.max(0, Number(row?.qty || 0))}</strong></td>
                    </tr>
                `;
                }).join('')}
                <tr class="sum-row">
                    <td colspan="4" class="right">TOPLAM SEVK ADEDI</td>
                    <td class="right">${Number(totalQty || 0)}</td>
                </tr>
            </tbody>
        </table>

        <div class="dispatch-note-box">
            <div class="dispatch-note-title">Sevk Notu</div>
            <div class="dispatch-note-text">${UnitModule.escapeHtml(dispatchNote || '-')}</div>
        </div>

        <div class="timeline">
            <div class="timeline-title">Durum Gecmisi</div>
            ${history.length === 0
                ? `<div style="font-size:11px; color:#94a3b8;">Gecmis kaydi yok.</div>`
                : history.map((h) => `
                    <div class="timeline-row">
                        <div><strong>${UnitModule.escapeHtml(UnitModule.getWorkOrderDispatchStatusMeta(h?.status).label)}</strong> - ${UnitModule.escapeHtml(String(h?.user || '-'))}</div>
                        <div>${UnitModule.escapeHtml(UnitModule.formatDateTimeShort(String(h?.at || '')))}</div>
                    </div>
                `).join('')
            }
        </div>

        <div class="footer-sign">
            <div class="sign-box"><div class="sign-line">Sevk Eden Imza</div></div>
            <div class="sign-box"><div class="sign-line">Teslim Alan Imza</div></div>
            <div class="sign-box"><div class="sign-line">Depo Kontrol Imza</div></div>
        </div>

        <div class="note">
            <span>Kayit sorumlusu: ${UnitModule.escapeHtml(createdBy)}</span>
            <span>PDF olusturma: ${UnitModule.escapeHtml(printedLabel)}</span>
        </div>
    </section>
</body>
</html>
        `;
    },
    openWorkOrderDispatchPdfWindowFromHtml: (html, title = 'Teslim Belgesi', autoPrint = false) => {
        const win = window.open('', '_blank');
        if (!win) return alert('Pop-up engellendi. Lutfen tarayici izinlerini kontrol edin.');
        win.document.open();
        win.document.write(String(html || ''));
        win.document.close();
        try { win.document.title = String(title || 'Teslim Belgesi'); } catch (_) { }
        try { win.focus(); } catch (_) { }
        if (autoPrint) {
            setTimeout(() => {
                try {
                    win.focus();
                    win.print();
                } catch (_) { }
            }, 280);
        }
        return win;
    },
    openWorkOrderDispatchPdfPreview: (noteId) => {
        const notes = Array.isArray(DB.data?.data?.workOrderDispatchNotes) ? DB.data.data.workOrderDispatchNotes : [];
        const note = notes.find((row) => String(row?.id || '') === String(noteId || ''));
        if (!note) return alert('Irsaliye kaydi bulunamadi.');
        const html = UnitModule.buildWorkOrderDispatchPdfHtml(note);
        const previewHtml = String(html || '').replace(/<div class="screen-tools">[\s\S]*?<\/div>/, '');
        const previewSrc = `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`;
        const fileBase = String(`teslim-belgesi-${String(note?.docNo || 'belge')}`).replace(/[^a-zA-Z0-9_-]+/g, '_');
        const encodedHtml = encodeURIComponent(String(html || ''));
        const encodedFileBase = encodeURIComponent(fileBase || 'teslim-belgesi');
        const pageHtml = `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>PDF Goruntule - ${UnitModule.escapeHtml(String(note?.docNo || '-'))}</title>
  <style>
    :root { --line:#cbd5e1; --ink:#0f172a; --muted:#64748b; --bg:#f1f5f9; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:"Segoe UI",Tahoma,Arial,sans-serif; background:var(--bg); color:var(--ink); }
    .topbar { position:sticky; top:0; z-index:20; background:rgba(248,250,252,0.98); border-bottom:1px solid var(--line); padding:0.62rem 0.8rem; display:flex; align-items:center; justify-content:space-between; gap:0.6rem; flex-wrap:wrap; }
    .title { font-size:1.02rem; font-weight:800; color:#0f172a; }
    .actions { display:inline-flex; align-items:center; gap:0.45rem; flex-wrap:wrap; }
    .btn { height:36px; border-radius:0.6rem; padding:0 0.85rem; border:1px solid var(--line); background:white; color:#334155; font-weight:700; cursor:pointer; }
    .btn.primary { background:#0f172a; border-color:#0f172a; color:#fff; }
    .btn.blue { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
    .frame-wrap { height:calc(100vh - 64px); padding:0.7rem; }
    iframe { width:100%; height:100%; border:1px solid var(--line); border-radius:0.85rem; background:#fff; }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="title">PDF Goruntule - ${UnitModule.escapeHtml(String(note?.docNo || '-'))}</div>
    <div class="actions">
      <button class="btn blue" type="button" onclick="downloadPdf()">Indir</button>
      <button class="btn primary" type="button" onclick="printPdf()">Yazdir</button>
      <button class="btn" type="button" onclick="window.close()">Kapat</button>
    </div>
  </div>
  <div class="frame-wrap">
    <iframe id="pdf_preview_frame" src="${previewSrc}" title="PDF onizleme"></iframe>
  </div>
  <script>
    async function downloadPdf() {
      try {
        const html = decodeURIComponent('${encodedHtml}');
        const fileName = decodeURIComponent('${encodedFileBase}');
        const res = await fetch('/api/dispatch-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: html, fileName: fileName })
        });
        if (!res.ok) throw new Error('PDF indirilemedi');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + '.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      } catch (e) {
        alert('PDF indirilemedi. Lutfen tekrar deneyin.');
      }
    }
    function printPdf() {
      const iframe = document.getElementById('pdf_preview_frame');
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          return;
        } catch (_) {}
      }
      window.print();
    }
  </script>
</body>
</html>`;
        const win = window.open('', '_blank');
        if (!win) return alert('Pop-up engellendi. Lutfen tarayici izinlerini kontrol edin.');
        win.document.open();
        win.document.write(pageHtml);
        win.document.close();
        try { win.focus(); } catch (_) { }
    },
    openWorkOrderDispatchSavedDocument: (noteId, autoPrint = false) => {
        const notes = Array.isArray(DB.data?.data?.workOrderDispatchNotes) ? DB.data.data.workOrderDispatchNotes : [];
        const note = notes.find((row) => String(row?.id || '') === String(noteId || ''));
        if (!note) return alert('Irsaliye kaydi bulunamadi.');
        const html = UnitModule.buildWorkOrderDispatchPdfHtml(note);
        return UnitModule.openWorkOrderDispatchPdfWindowFromHtml(html, `Teslim Belgesi ${String(note?.docNo || '-')}`, autoPrint);
    },
    downloadWorkOrderDispatchPdfHtml: async (html, fileNameBase = 'teslim-belgesi') => {
        try {
            const payload = {
                html: String(html || ''),
                fileName: String(fileNameBase || 'teslim-belgesi')
            };
            const res = await fetch('/api/dispatch-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const raw = await res.text().catch(() => '');
                throw new Error(raw || `HTTP ${res.status}`);
            }
            const blob = await res.blob();
            const safeName = String(fileNameBase || 'teslim-belgesi').replace(/[^a-zA-Z0-9_-]+/g, '_');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeName || 'teslim-belgesi'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            return true;
        } catch (error) {
            console.error('PDF indirme hatasi:', error);
            return false;
        }
    },
    printWorkOrderDispatchSavedDocument: (noteId) => {
        UnitModule.openWorkOrderDispatchSavedDocument(noteId, true);
    },
    downloadWorkOrderDispatchSavedDocument: async (noteId) => {
        const notes = Array.isArray(DB.data?.data?.workOrderDispatchNotes) ? DB.data.data.workOrderDispatchNotes : [];
        const note = notes.find((row) => String(row?.id || '') === String(noteId || ''));
        if (!note) return alert('Irsaliye kaydi bulunamadi.');
        const docNo = String(note?.docNo || 'teslim-belgesi');
        const ok = await UnitModule.downloadWorkOrderDispatchPdfHtml(
            UnitModule.buildWorkOrderDispatchPdfHtml(note),
            `teslim-belgesi-${docNo}`
        );
        if (!ok) {
            alert('PDF otomatik indirilemedi. Yazdir ile "PDF olarak kaydet" secenegini kullanabilirsiniz.');
        }
    },
    previewWorkOrderDispatchDraft: () => {
        const draft = UnitModule.state.workOrderDispatchDraft;
        if (!draft || !Array.isArray(draft.rows) || draft.rows.length === 0) return alert('Onizleme icin hazir irsaliye yok.');
        const totalQty = draft.rows.reduce((sum, row) => sum + Math.max(0, Number(row?.qty || 0)), 0);
        const dispatchNote = String(draft?.note || '');
        Modal.open(`PDF Onizleme - ${UnitModule.escapeHtml(String(draft.docNo || '-'))}`, `
            <div style="display:flex; flex-direction:column; gap:0.7rem;">
                <div style="background:#f8fafc; border:1px solid #dbeafe; border-radius:0.7rem; padding:0.6rem 0.7rem; font-size:0.82rem; color:#334155;">
                    Belge onizlemesi hazir. Onayla ve Kaydet dersen irsaliye kaydi olusur ve "fasona giden malzemeler" sayfasina eklenir.
                </div>
                <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.48rem 0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Belge No</div><div style="font-family:monospace; font-weight:800; color:#1d4ed8;">${UnitModule.escapeHtml(String(draft.docNo || '-'))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.48rem 0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Hedef birim</div><div style="font-weight:700; color:#0f172a;">${UnitModule.escapeHtml(String(draft.targetUnitName || '-'))}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.48rem 0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Satir</div><div style="font-weight:800; color:#0f172a;">${draft.rows.length}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.48rem 0.55rem;"><div style="font-size:0.72rem; color:#64748b;">Toplam adet</div><div style="font-weight:800; color:#0f172a;">${Number(totalQty || 0)}</div></div>
                </div>
                <div class="card-table">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                <th style="padding:0.55rem; text-align:left;">Is emri / satir</th>
                                <th style="padding:0.55rem; text-align:left;">Parca</th>
                                <th style="padding:0.55rem; text-align:left;">Yapilacak islem</th>
                                <th style="padding:0.55rem; text-align:center;">Adet</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${draft.rows.map((row) => {
                                const processMeta = UnitModule.getWorkOrderDispatchProcessMeta(row, draft);
                                return `
                                <tr style="border-bottom:1px solid #f1f5f9;">
                                    <td style="padding:0.5rem;"><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${UnitModule.escapeHtml(String(row?.workOrderCode || '-'))}</div><div style="font-family:monospace; font-size:0.72rem; color:#64748b;">${UnitModule.escapeHtml(String(row?.lineCode || '-'))}</div></td>
                                    <td style="padding:0.5rem;"><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(String(row?.componentName || '-'))}</div><div style="font-size:0.72rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(String(row?.componentCode || '-'))}</div></td>
                                    <td style="padding:0.5rem;"><div style="font-size:0.7rem; color:#64748b; font-family:monospace; font-weight:700;">${UnitModule.escapeHtml(processMeta.code || '-')}</div><div style="font-size:0.82rem; color:#0f172a; font-weight:800; margin-top:0.1rem;">${UnitModule.escapeHtml(processMeta.name || '-')}</div></td>
                                    <td style="padding:0.5rem; text-align:center; font-weight:800; color:#0f172a;">${Math.max(0, Number(row?.qty || 0))}</td>
                                </tr>
                            `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.6rem;">
                    <label style="display:block; font-size:0.78rem; font-weight:700; color:#334155; margin-bottom:0.35rem;">Sevk Notu</label>
                    <textarea rows="3" oninput="UnitModule.setWorkOrderDispatchDraftNote(this.value)" placeholder="Ornek: Cumaya getir, Persembe hazir olsun." style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem; resize:vertical;">${UnitModule.escapeHtml(dispatchNote)}</textarea>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.45rem; flex-wrap:wrap;">
                    <button class="btn-sm" onclick="UnitModule.state.workOrderDispatchDraft=null; Modal.close();">Vazgec</button>
                    <button class="btn-primary" onclick="UnitModule.confirmWorkOrderDispatchDraft()">Onayla ve Kaydet</button>
                </div>
            </div>
        `, { maxWidth: '1100px' });
    },
    confirmWorkOrderDispatchDraft: async () => {
        const draft = UnitModule.state.workOrderDispatchDraft;
        if (!draft || !Array.isArray(draft.rows) || draft.rows.length === 0) return alert('Kaydedilecek irsaliye taslagi bulunamadi.');
        const stationId = String(draft.stationId || '').trim();
        const targetId = String(draft.targetUnitId || '').trim();
        if (!stationId || !targetId) return alert('Irsaliye bilgileri eksik.');
        if (!Array.isArray(DB.data?.data?.workOrderTransactions)) DB.data.data.workOrderTransactions = [];
        if (!Array.isArray(DB.data?.data?.workOrderDispatchNotes)) DB.data.data.workOrderDispatchNotes = [];

        const revalidated = UnitModule.collectWorkOrderDispatchSelection(stationId, targetId);
        if (revalidated.error) return alert(revalidated.error);
        const draftRowMap = new Map((draft.rows || []).map((row) => [String(row?.rowKey || ''), Math.max(0, Number(row?.qty || 0))]));
        const finalRows = (revalidated.rows || [])
            .map((row) => ({ ...row, qty: Math.max(0, Number(draftRowMap.get(String(row?.rowKey || '')) || 0)) }))
            .filter((row) => Number(row?.qty || 0) > 0);
        if (!finalRows.length) return alert('Kayit icin gecerli satir bulunamadi.');

        const docNo = String(draft.docNo || UnitModule.getNextWorkOrderDispatchDocNo());
        const dispatchNote = String(draft.note || '').trim();
        const now = new Date().toISOString();
        const txns = DB.data.data.workOrderTransactions;
        finalRows.forEach((entry) => {
            txns.push({
                id: crypto.randomUUID(),
                workOrderId: String(entry.workOrderId || ''),
                lineId: String(entry.lineId || ''),
                stationId,
                routeId: String(entry.sourceRouteId || ''),
                routeSeq: Math.max(0, Number(entry.sourceRouteSeq || 0)),
                processId: String(entry.sourceProcessId || '').trim().toUpperCase(),
                type: 'COMPLETE',
                qty: Number(entry.qty || 0),
                note: `Sevk irsaliyesi olusturuldu / ${docNo}${dispatchNote ? ` / ${dispatchNote}` : ''}`,
                user: 'Demo User',
                created_at: now
            });
            const order = (DB.data?.data?.workOrders || []).find((row) => String(row?.id || '') === String(entry.workOrderId || ''));
            if (order) order.updated_at = now;
        });

        const notePayload = {
            id: crypto.randomUUID(),
            docNo,
            stationId,
            targetUnitId: targetId,
            targetUnitName: String(draft.targetUnitName || UnitModule.getRouteStationName(targetId) || targetId),
            status: 'HAZIRLANDI',
            isArchived: false,
            created_at: now,
            created_by: 'Demo User',
            note: dispatchNote,
            history: [{ at: now, status: 'HAZIRLANDI', user: 'Demo User' }],
            rows: finalRows.map((entry) => ({
                workOrderId: String(entry.workOrderId || ''),
                workOrderCode: String(entry.workOrderCode || ''),
                lineId: String(entry.lineId || ''),
                lineCode: String(entry.lineCode || ''),
                componentCode: String(entry.componentCode || ''),
                componentName: String(entry.componentName || ''),
                qty: Number(entry.qty || 0),
                sourceStationId: stationId,
                sourceRouteId: String(entry.sourceRouteId || ''),
                sourceRouteSeq: Math.max(0, Number(entry.sourceRouteSeq || 0)),
                sourceProcessId: String(entry.sourceProcessId || '').trim().toUpperCase(),
                targetProcessId: String(entry.targetProcessId || '').trim().toUpperCase(),
                targetProcessName: String(entry.targetProcessName || '').trim(),
                targetUnitId: targetId
            }))
        };
        notePayload.documentHtml = UnitModule.buildWorkOrderDispatchPdfHtml(notePayload);
        DB.data.data.workOrderDispatchNotes.push(notePayload);

        UnitModule.state.workOrderDispatchRows = {};
        UnitModule.state.workOrderDispatchQtyByRow = {};
        UnitModule.state.workOrderDispatchDraft = null;
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
        alert(`${docNo} kaydedildi ve fasona giden malzemeler listesine eklendi.`);
    },
    createWorkOrderDispatchNoteFromSelected: async () => {
        const stationId = String(UnitModule.state.workOrderPlanningUnitId || UnitModule.state.activeUnitId || '').trim();
        if (stationId !== 'u_dtm') return alert('Sevk irsaliyesi sadece Depo Transfer planlama ekraninda olusturulur.');
        const targetId = String(UnitModule.state.workOrderTransferTarget || '').trim();
        if (!targetId) return alert('Lutfen once dis birim seciniz.');
        const selected = UnitModule.collectWorkOrderDispatchSelection(stationId, targetId);
        if (selected.error) return alert(selected.error);
        const targetName = UnitModule.getRouteStationName(targetId) || targetId;
        UnitModule.state.workOrderDispatchDraft = {
            id: crypto.randomUUID(),
            docNo: UnitModule.getNextWorkOrderDispatchDocNo(),
            stationId,
            targetUnitId: targetId,
            targetUnitName: targetName,
            status: 'HAZIRLANDI',
            note: '',
            created_at: new Date().toISOString(),
            created_by: 'Demo User',
            rows: selected.rows
        };
        UnitModule.previewWorkOrderDispatchDraft();
    },
    setWorkOrderStatsFilter: (field, value) => {
        if (field === 'range') UnitModule.state.workOrderStatsRange = String(value || 'WEEK').toUpperCase();
        if (field === 'group') UnitModule.state.workOrderStatsGroup = String(value || 'UNIT').toUpperCase();
        if (field === 'process') UnitModule.state.workOrderStatsProcess = String(value || '').trim().toUpperCase();
        UI.renderCurrentPage();
    },
    openWorkOrderCreateForm: () => {
        const montageCards = Array.isArray(DB.data?.data?.montageCards) ? DB.data.data.montageCards : [];
        if (montageCards.length === 0) {
            alert('Montaj karti yok. Once Islem Kutuphanesi tarafinda montaj karti olusturun.');
            return;
        }
        UnitModule.state.workOrderFormOpen = true;
        if (!UnitModule.state.workOrderDraftMontageId && montageCards[0]?.id) {
            UnitModule.state.workOrderDraftMontageId = String(montageCards[0].id);
        }
        if (!UnitModule.state.workOrderDraftLotQty) UnitModule.state.workOrderDraftLotQty = '100';
        if (!UnitModule.state.workOrderDraftPriority) UnitModule.state.workOrderDraftPriority = 'NORMAL';
        if (!UnitModule.state.workOrderDraftDueDate) {
            const d = new Date();
            d.setDate(d.getDate() + 3);
            UnitModule.state.workOrderDraftDueDate = d.toISOString().slice(0, 10);
        }
        UI.renderCurrentPage();
    },
    closeWorkOrderCreateForm: () => {
        UnitModule.state.workOrderFormOpen = false;
        UnitModule.state.workOrderDraftMontageId = '';
        UnitModule.state.workOrderDraftLotQty = '100';
        UnitModule.state.workOrderDraftDueDate = '';
        UnitModule.state.workOrderDraftPriority = 'NORMAL';
        UnitModule.state.workOrderDraftNote = '';
        UI.renderCurrentPage();
    },
    getNextWorkOrderCode: () => {
        if (!Array.isArray(DB.data?.data?.workOrders)) DB.data.data.workOrders = [];
        const max = (DB.data.data.workOrders || []).reduce((acc, row) => {
            const code = String(row?.workOrderCode || '').trim().toUpperCase();
            const m = code.match(/^WO-(\d{6})$/);
            if (!m) return acc;
            return Math.max(acc, Number(m[1]));
        }, 0);
        let n = max + 1;
        let candidate = `WO-${String(n).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            n += 1;
            candidate = `WO-${String(n).padStart(6, '0')}`;
        }
        return candidate;
    },
    buildWorkOrderLinesFromMontage: (montageCard, lotQty, workOrderCode) => {
        const componentCards = Array.isArray(DB.data?.data?.partComponentCards) ? DB.data.data.partComponentCards : [];
        const counts = new Map();
        const rawIds = Array.isArray(montageCard?.componentIds) ? montageCard.componentIds : [];
        rawIds.forEach(raw => {
            const key = String(raw || '').trim().toUpperCase();
            if (!key) return;
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        if (counts.size === 0) {
            const fallback = String(montageCard?.productCode || montageCard?.cardCode || 'GENEL').trim().toUpperCase();
            counts.set(fallback || 'GENEL', 1);
        }
        const entries = Array.from(counts.entries());
        return entries.map(([componentCode, multiplier], idx) => {
            const comp = componentCards.find(x => String(x?.code || '').trim().toUpperCase() === componentCode);
            const routesRaw = Array.isArray(comp?.routes) ? comp.routes : [];
            let routes = routesRaw
                .map((r, rIdx) => {
                    const stationId = String(r?.stationId || '').trim();
                    if (!stationId) return null;
                    return {
                        id: crypto.randomUUID(),
                        seq: rIdx + 1,
                        stationId,
                        stationName: UnitModule.getRouteStationName(stationId),
                        processId: String(r?.processId || '').trim().toUpperCase()
                    };
                })
                .filter(Boolean);
            if (routes.length === 0) {
                const fallbackStation = String(montageCard?.unitId || UnitModule.state.activeUnitId || 'u3');
                routes = [{
                    id: crypto.randomUUID(),
                    seq: 1,
                    stationId: fallbackStation,
                    stationName: UnitModule.getRouteStationName(fallbackStation),
                    processId: ''
                }];
            }
            return {
                id: crypto.randomUUID(),
                lineCode: `${workOrderCode}-${String(idx + 1).padStart(2, '0')}`,
                componentCode,
                componentName: String(comp?.name || componentCode),
                multiplier: Number(multiplier || 1),
                targetQty: Number(lotQty || 0) * Number(multiplier || 1),
                routes,
                plans: {}
            };
        });
    },
    createWorkOrderFromMontageCard: (options = {}) => {
        if (!Array.isArray(DB.data?.data?.workOrders)) DB.data.data.workOrders = [];
        const montageId = String(options?.montageId || '').trim();
        const lotQty = Number(options?.lotQty || 0);
        const dueDate = String(options?.dueDate || '').trim();
        const priorityRaw = String(options?.priority || 'NORMAL').trim().toUpperCase();
        const priority = ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priorityRaw) ? priorityRaw : 'NORMAL';
        const note = String(options?.note || '').trim();
        const createdByUnitId = String(options?.createdByUnitId || '').trim();
        const sourceType = String(options?.sourceType || '').trim().toUpperCase();
        const sourceId = String(options?.sourceId || '').trim();
        const sourceCode = String(options?.sourceCode || '').trim().toUpperCase();
        const sourceItemKey = String(options?.sourceItemKey || '').trim();
        const sourceItemName = String(options?.sourceItemName || '').trim();
        const sourceItemCode = String(options?.sourceItemCode || '').trim().toUpperCase();
        const sourceItemQty = Number(options?.sourceItemQty || 0);
        if (!montageId) throw new Error('Lutfen montaj karti seciniz.');
        if (!Number.isFinite(lotQty) || lotQty <= 0) throw new Error('Lot miktari 0 dan buyuk olmali.');
        const montage = (DB.data.data.montageCards || []).find(x => String(x?.id || '') === montageId);
        if (!montage) throw new Error('Montaj karti bulunamadi.');
        const workOrderCode = UnitModule.getNextWorkOrderCode();
        const lines = UnitModule.buildWorkOrderLinesFromMontage(montage, lotQty, workOrderCode);
        const now = new Date().toISOString();
        const order = {
            id: crypto.randomUUID(),
            workOrderCode,
            montageCardId: String(montage.id || ''),
            montageCardCode: String(montage.cardCode || ''),
            productCode: String(montage.productCode || ''),
            productName: String(montage.productName || ''),
            lotQty: Number(lotQty),
            dueDate: dueDate || '',
            priority,
            note,
            status: 'OPEN',
            lines,
            createdByUnitId,
            sourceType,
            sourceId,
            sourceCode,
            sourceItemKey,
            sourceItemName,
            sourceItemCode,
            sourceItemQty: Number.isFinite(sourceItemQty) && sourceItemQty > 0 ? sourceItemQty : Number(lotQty),
            created_at: now,
            updated_at: now
        };
        DB.data.data.workOrders.push(order);
        return order;
    },
    createWorkOrderFromComponentCard: (options = {}) => {
        if (!Array.isArray(DB.data?.data?.workOrders)) DB.data.data.workOrders = [];
        const componentId = String(options?.componentId || '').trim();
        const componentLibraryRaw = String(options?.componentLibrary || 'PART').trim().toUpperCase();
        const componentLibrary = componentLibraryRaw === 'SEMI' ? 'SEMI' : 'PART';
        const lotQty = Number(options?.lotQty || 0);
        const dueDate = String(options?.dueDate || '').trim();
        const priorityRaw = String(options?.priority || 'NORMAL').trim().toUpperCase();
        const priority = ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priorityRaw) ? priorityRaw : 'NORMAL';
        const note = String(options?.note || '').trim();
        const createdByUnitId = String(options?.createdByUnitId || '').trim();
        const sourceType = String(options?.sourceType || '').trim().toUpperCase();
        const sourceId = String(options?.sourceId || '').trim();
        const sourceCode = String(options?.sourceCode || '').trim().toUpperCase();
        const sourceItemKey = String(options?.sourceItemKey || '').trim();
        const sourceItemName = String(options?.sourceItemName || '').trim();
        const sourceItemCode = String(options?.sourceItemCode || '').trim().toUpperCase();
        const sourceItemQty = Number(options?.sourceItemQty || 0);
        if (!componentId) throw new Error('Lutfen parca/bilesen seciniz.');
        if (!Number.isFinite(lotQty) || lotQty <= 0) throw new Error('Lot miktari 0 dan buyuk olmali.');
        const componentCards = componentLibrary === 'SEMI'
            ? (Array.isArray(DB.data?.data?.semiFinishedCards) ? DB.data.data.semiFinishedCards : [])
            : (Array.isArray(DB.data?.data?.partComponentCards) ? DB.data.data.partComponentCards : []);
        const comp = componentCards.find(x => String(x?.id || '') === componentId);
        if (!comp) throw new Error(componentLibrary === 'SEMI' ? 'Yari mamul karti bulunamadi.' : 'Parca/bilesen karti bulunamadi.');
        const routesRaw = Array.isArray(comp?.routes) ? comp.routes : [];
        const routes = routesRaw
            .map((r, idx) => {
                const stationId = String(r?.stationId || '').trim();
                if (!stationId) return null;
                return {
                    id: crypto.randomUUID(),
                    seq: idx + 1,
                    stationId,
                    stationName: UnitModule.getRouteStationName(stationId),
                    processId: String(r?.processId || '').trim().toUpperCase()
                };
            })
            .filter(Boolean);
        if (routes.length === 0) throw new Error('Secilen parca icin rota tanimli degil.');
        const workOrderCode = UnitModule.getNextWorkOrderCode();
        const now = new Date().toISOString();
        const order = {
            id: crypto.randomUUID(),
            workOrderCode,
            montageCardId: '',
            montageCardCode: '',
            productCode: String(comp.code || ''),
            productName: String(comp.name || comp.code || ''),
            lotQty: Number(lotQty),
            dueDate: dueDate || '',
            priority,
            note,
            status: 'OPEN',
            lines: [{
                id: crypto.randomUUID(),
                lineCode: `${workOrderCode}-01`,
                componentCode: String(comp.code || ''),
                componentName: String(comp.name || comp.code || ''),
                multiplier: 1,
                targetQty: Number(lotQty),
                routes,
                plans: {}
            }],
            createdByUnitId,
            sourceType,
            sourceId,
            sourceCode,
            sourceItemKey,
            sourceItemName,
            sourceItemCode,
            sourceItemQty: Number.isFinite(sourceItemQty) && sourceItemQty > 0 ? sourceItemQty : Number(lotQty),
            created_at: now,
            updated_at: now
        };
        DB.data.data.workOrders.push(order);
        return order;
    },
    createWorkOrder: async () => {
        try {
            UnitModule.createWorkOrderFromMontageCard({
                montageId: String(UnitModule.state.workOrderDraftMontageId || '').trim(),
                lotQty: Number(UnitModule.state.workOrderDraftLotQty || 0),
                dueDate: String(UnitModule.state.workOrderDraftDueDate || '').trim(),
                priority: String(UnitModule.state.workOrderDraftPriority || 'NORMAL').trim().toUpperCase(),
                note: String(UnitModule.state.workOrderDraftNote || '').trim(),
                createdByUnitId: String(UnitModule.state.activeUnitId || '')
            });
        } catch (error) {
            alert(error?.message || 'Is emri olusturulamadi.');
            return;
        }
        await DB.save();
        UnitModule.closeWorkOrderCreateForm();
    },
    isWorkTxnRouteMatch: (txn, routeFilter = null) => {
        const wantedRouteId = String(routeFilter?.routeId || '').trim();
        const wantedRouteSeq = Math.max(0, Number(routeFilter?.routeSeq || 0));
        const allowLegacyByStation = !!routeFilter?.allowLegacyByStation;
        if (!wantedRouteId && wantedRouteSeq <= 0) return true;
        const txnRouteId = String(txn?.routeId || '').trim();
        const txnRouteSeq = Math.max(0, Number(txn?.routeSeq || 0));
        if (txnRouteId) {
            if (wantedRouteId && txnRouteId !== wantedRouteId) return false;
            if (!wantedRouteId && wantedRouteSeq > 0 && txnRouteSeq > 0 && txnRouteSeq !== wantedRouteSeq) return false;
            return true;
        }
        if (txnRouteSeq > 0) {
            if (wantedRouteSeq > 0 && txnRouteSeq !== wantedRouteSeq) return false;
            if (wantedRouteSeq <= 0) return false;
            return true;
        }
        return allowLegacyByStation;
    },
    getWorkTxnQty: (txns, workOrderId, lineId, stationId, type, routeFilter = null) => {
        if (!Array.isArray(txns)) return 0;
        const keyOrder = String(workOrderId || '');
        const keyLine = String(lineId || '');
        const keyStation = String(stationId || '');
        const keyType = String(type || '').toUpperCase();
        return txns.reduce((sum, t) => {
            if (String(t?.workOrderId || '') !== keyOrder) return sum;
            if (String(t?.lineId || '') !== keyLine) return sum;
            if (String(t?.stationId || '') !== keyStation) return sum;
            if (String(t?.type || '').toUpperCase() !== keyType) return sum;
            if (!UnitModule.isWorkTxnRouteMatch(t, routeFilter)) return sum;
            return sum + Number(t?.qty || 0);
        }, 0);
    },
    getWorkTxnTime: (txns, workOrderId, lineId, stationId, type, mode = 'last', routeFilter = null) => {
        if (!Array.isArray(txns)) return '';
        const keyOrder = String(workOrderId || '');
        const keyLine = String(lineId || '');
        const keyStation = String(stationId || '');
        const keyType = String(type || '').toUpperCase();
        const hits = txns
            .filter((t) => String(t?.workOrderId || '') === keyOrder
                && String(t?.lineId || '') === keyLine
                && String(t?.stationId || '') === keyStation
                && String(t?.type || '').toUpperCase() === keyType
                && UnitModule.isWorkTxnRouteMatch(t, routeFilter)
                && String(t?.created_at || '').trim())
            .map((t) => ({ at: String(t.created_at || ''), ms: new Date(String(t.created_at || '')).getTime() }))
            .filter((row) => Number.isFinite(row.ms));
        if (hits.length === 0) return '';
        const pick = mode === 'first'
            ? hits.reduce((best, row) => (row.ms < best.ms ? row : best), hits[0])
            : hits.reduce((best, row) => (row.ms > best.ms ? row : best), hits[0]);
        return pick.at;
    },
    formatDateTimeShort: (value) => {
        const raw = String(value || '').trim();
        if (!raw) return '-';
        const d = new Date(raw);
        if (!Number.isFinite(d.getTime())) return raw;
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    },
    getRouteIndexesByUnit: (line, unitId) => {
        const routes = Array.isArray(line?.routes) ? line.routes : [];
        const target = String(unitId || '');
        const indexes = [];
        routes.forEach((route, idx) => {
            if (String(route?.stationId || '') === target) indexes.push(idx);
        });
        return indexes;
    },
    getRouteFilterForIndex: (line, routeIndex) => {
        const routes = Array.isArray(line?.routes) ? line.routes : [];
        if (!Number.isInteger(routeIndex) || routeIndex < 0 || routeIndex >= routes.length) return null;
        const route = routes[routeIndex];
        const stationId = String(route?.stationId || '');
        if (!stationId) return null;
        const sameStationIndexes = routes
            .map((r, idx) => ({ r, idx }))
            .filter((row) => String(row?.r?.stationId || '') === stationId)
            .map((row) => row.idx);
        const firstIndex = sameStationIndexes.length ? sameStationIndexes[0] : routeIndex;
        const allowLegacyByStation = sameStationIndexes.length <= 1 || firstIndex === routeIndex;
        return {
            routeId: String(route?.id || '').trim(),
            routeSeq: routeIndex + 1,
            allowLegacyByStation
        };
    },
    resolveRouteIndexForUnit: (line, unitId, txns, order, routeRef = null) => {
        const routes = Array.isArray(line?.routes) ? line.routes : [];
        if (routes.length === 0) return -1;
        const wantedStationId = String(unitId || '').trim();
        const wantedRouteId = String(routeRef?.routeId || '').trim();
        const wantedRouteSeq = Math.max(0, Number(routeRef?.routeSeq || 0));
        if (wantedRouteId) {
            const byId = routes.findIndex((route) =>
                String(route?.stationId || '') === wantedStationId
                && String(route?.id || '').trim() === wantedRouteId
            );
            if (byId >= 0) return byId;
        }
        if (wantedRouteSeq > 0) {
            const idx = wantedRouteSeq - 1;
            if (idx >= 0 && idx < routes.length && String(routes[idx]?.stationId || '') === wantedStationId) return idx;
        }
        const indexes = UnitModule.getRouteIndexesByUnit(line, wantedStationId);
        if (indexes.length === 0) return -1;
        if (indexes.length === 1) return indexes[0];
        // Repeated same station on route: pick the currently actionable step.
        const candidates = indexes
            .map((idx) => UnitModule.computeWorkLineRouteMetrics(order, line, idx, txns))
            .filter(Boolean);
        if (!candidates.length) return indexes[0];
        const withInProcess = candidates.find((m) => Number(m?.inProcessQty || 0) > 0);
        if (withInProcess) return Math.max(0, Number(withInProcess.routeSeq || 1) - 1);
        const withAvailable = candidates.find((m) => Number(m?.availableQty || 0) > 0);
        if (withAvailable) return Math.max(0, Number(withAvailable.routeSeq || 1) - 1);
        const withTransferPending = candidates.find((m) => Number(m?.transferPendingQty || 0) > 0);
        if (withTransferPending) return Math.max(0, Number(withTransferPending.routeSeq || 1) - 1);
        const doneCandidates = candidates.filter((m) => Number(m?.doneQty || 0) > 0);
        if (doneCandidates.length > 0) {
            const latestDone = doneCandidates[doneCandidates.length - 1];
            return Math.max(0, Number(latestDone.routeSeq || 1) - 1);
        }
        return indexes[0];
    },
    computeWorkLineRouteMetrics: (order, line, routeIndex, txns) => {
        const routes = Array.isArray(line?.routes) ? line.routes : [];
        if (!Number.isInteger(routeIndex) || routeIndex < 0 || routeIndex >= routes.length) return null;
        const route = routes[routeIndex];
        const prevRoute = routeIndex > 0 ? routes[routeIndex - 1] : null;
        const nextRoute = routeIndex < routes.length - 1 ? routes[routeIndex + 1] : null;
        const prevFilter = prevRoute ? UnitModule.getRouteFilterForIndex(line, routeIndex - 1) : null;
        const currentFilter = UnitModule.getRouteFilterForIndex(line, routeIndex);
        const nextFilter = nextRoute ? UnitModule.getRouteFilterForIndex(line, routeIndex + 1) : null;
        const prevTarget = routeIndex === 0
            ? Number(line?.targetQty || 0)
            : UnitModule.getWorkTxnQty(txns, order?.id, line?.id, prevRoute?.stationId, 'COMPLETE', prevFilter);
        const stepTarget = Math.max(0, Number(prevTarget || 0));
        const taken = UnitModule.getWorkTxnQty(txns, order?.id, line?.id, route.stationId, 'TAKE', currentFilter);
        const completed = UnitModule.getWorkTxnQty(txns, order?.id, line?.id, route.stationId, 'COMPLETE', currentFilter);
        const nextTaken = nextRoute
            ? UnitModule.getWorkTxnQty(txns, order?.id, line?.id, nextRoute.stationId, 'TAKE', nextFilter)
            : 0;
        const availableQty = Math.max(0, stepTarget - taken);
        const inProcessQty = Math.max(0, taken - completed);
        const doneQty = Math.max(0, completed);
        const transferPendingQty = nextRoute ? Math.max(0, doneQty - nextTaken) : 0;
        return {
            routeId: String(route?.id || '').trim(),
            routeSeq: routeIndex + 1,
            routeCount: routes.length,
            stationId: String(route.stationId || ''),
            stationName: String(route.stationName || route.stationId || '-'),
            processId: String(route.processId || ''),
            stepTarget,
            availableQty,
            inProcessQty,
            doneQty,
            isFinalStep: routeIndex === routes.length - 1,
            prevStationId: String(prevRoute?.stationId || ''),
            nextStationId: String(nextRoute?.stationId || ''),
            nextRouteId: String(nextRoute?.id || '').trim(),
            nextRouteSeq: nextRoute ? routeIndex + 2 : 0,
            nextTakenQty: nextTaken,
            transferPendingQty,
            isTransferPending: transferPendingQty > 0
        };
    },
    computeWorkLineUnitMetrics: (order, line, unitId, txns, routeRef = null) => {
        const idx = UnitModule.resolveRouteIndexForUnit(line, unitId, txns, order, routeRef);
        if (idx < 0) return null;
        return UnitModule.computeWorkLineRouteMetrics(order, line, idx, txns);
    },
    getWorkOrderComputedStatus: (order, txns) => {
        const lines = Array.isArray(order?.lines) ? order.lines : [];
        if (lines.length === 0) return 'OPEN';
        const allDone = lines.every(line => {
            const routes = Array.isArray(line?.routes) ? line.routes : [];
            const finalIdx = routes.length - 1;
            const finalStation = finalIdx >= 0 ? routes[finalIdx].stationId : '';
            if (!finalStation) return false;
            const finalFilter = finalIdx >= 0 ? UnitModule.getRouteFilterForIndex(line, finalIdx) : null;
            const done = UnitModule.getWorkTxnQty(txns, order?.id, line?.id, finalStation, 'COMPLETE', finalFilter);
            return done >= Number(line?.targetQty || 0);
        });
        if (allDone) return 'DONE';
        const hasTxn = (txns || []).some(t => String(t?.workOrderId || '') === String(order?.id || ''));
        if (hasTxn) return 'IN_PROGRESS';
        return 'OPEN';
    },
    getWorkOrderPriorityMeta: (priorityRaw) => {
        const normalized = String(priorityRaw || 'P3').trim().toUpperCase();
        const key = normalized === 'URGENT' ? 'P1'
            : normalized === 'HIGH' ? 'P2'
                : normalized === 'LOW' ? 'P3'
                    : normalized === 'NORMAL' ? 'P3'
                        : normalized;
        if (key === 'P1') {
            return {
                label: 'P1',
                rank: 0,
                style: 'background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;'
            };
        }
        if (key === 'P2') {
            return {
                label: 'P2',
                rank: 1,
                style: 'background:#ffedd5; color:#c2410c; border:1px solid #fed7aa;'
            };
        }
        return {
            label: 'P3',
            rank: 2,
            style: 'background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;'
        };
    },
    getWorkOrderPlanningRowsForUnit: (unitId) => {
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const orders = Array.isArray(DB.data?.data?.workOrders) ? DB.data.data.workOrders : [];
        const rows = [];
        orders.forEach(order => {
            const status = UnitModule.getWorkOrderComputedStatus(order, txns);
            const lines = Array.isArray(order?.lines) ? order.lines : [];
            lines.forEach(line => {
                const metrics = UnitModule.computeWorkLineUnitMetrics(order, line, unitId, txns);
                if (!metrics) return;
                const plan = (line.plans && typeof line.plans === 'object') ? line.plans[String(unitId)] : null;
                const takenQty = Math.max(0, Number(metrics?.inProcessQty || 0) + Number(metrics?.doneQty || 0));
                const targetQty = Math.max(0, Number(line?.targetQty || 0));
                const remainingQty = Math.max(0, targetQty - Number(metrics?.doneQty || 0));
                const upcomingQty = Math.max(0, targetQty - takenQty - Number(metrics?.availableQty || 0));
                rows.push({
                    order,
                    line,
                    status,
                    metrics,
                    plan: plan && typeof plan === 'object' ? plan : null,
                    takenQty,
                    targetQty,
                    remainingQty,
                    upcomingQty
                });
            });
        });
        return rows.sort((a, b) => {
            const pa = UnitModule.getWorkOrderPriorityMeta(a.order?.priority).rank;
            const pb = UnitModule.getWorkOrderPriorityMeta(b.order?.priority).rank;
            if (pa !== pb) return pa - pb;
            const da = String(a.order?.dueDate || '9999-12-31');
            const db = String(b.order?.dueDate || '9999-12-31');
            if (da !== db) return da.localeCompare(db);
            return String(a.order?.workOrderCode || '').localeCompare(String(b.order?.workOrderCode || ''));
        });
    },
    addWorkOrderTxn: async (workOrderId, lineId, stationId, type, qty, note = '', routeRef = null) => {
        if (!Array.isArray(DB.data?.data?.workOrderTransactions)) DB.data.data.workOrderTransactions = [];
        const cleanQty = Number(qty || 0);
        if (!Number.isFinite(cleanQty) || cleanQty <= 0) return;
        const routeId = String(routeRef?.routeId || '').trim();
        const routeSeq = Math.max(0, Number(routeRef?.routeSeq || 0));
        const processId = String(routeRef?.processId || '').trim().toUpperCase();
        DB.data.data.workOrderTransactions.push({
            id: crypto.randomUUID(),
            workOrderId: String(workOrderId || ''),
            lineId: String(lineId || ''),
            stationId: String(stationId || ''),
            routeId,
            routeSeq: routeSeq > 0 ? routeSeq : 0,
            processId,
            type: String(type || '').toUpperCase(),
            qty: cleanQty,
            note: String(note || ''),
            user: 'Demo User',
            created_at: new Date().toISOString()
        });
        const order = (DB.data.data.workOrders || []).find(x => String(x?.id || '') === String(workOrderId || ''));
        if (order) order.updated_at = new Date().toISOString();
        await DB.save();
        UI.renderCurrentPage();
    },
    takeWorkOrderQty: async (workOrderId, lineId, stationId, routeSeq = '') => {
        const order = (DB.data?.data?.workOrders || []).find(x => String(x?.id || '') === String(workOrderId || ''));
        if (!order) return;
        const line = (order.lines || []).find(x => String(x?.id || '') === String(lineId || ''));
        if (!line) return;
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const metrics = UnitModule.computeWorkLineUnitMetrics(order, line, stationId, txns, { routeSeq: Number(routeSeq || 0) });
        if (!metrics || metrics.availableQty <= 0) return alert('Alinabilir miktar yok.');
        const suggested = Math.max(1, Math.floor(metrics.availableQty));
        const raw = prompt(`Kac adet alinsin? (Varsayilan: ${suggested})`, String(suggested));
        if (raw === null) return;
        const qty = Number(raw);
        if (!Number.isFinite(qty) || qty <= 0) return alert('Gecerli bir miktar girin.');
        if (qty > metrics.availableQty) return alert(`Maksimum alinabilir miktar: ${metrics.availableQty}`);
        await UnitModule.addWorkOrderTxn(workOrderId, lineId, stationId, 'TAKE', qty, 'Istasyon devir aldi', {
            routeId: String(metrics?.routeId || ''),
            routeSeq: Number(metrics?.routeSeq || 0),
            processId: String(metrics?.processId || '')
        });
    },
    completeWorkOrderQty: async (workOrderId, lineId, stationId, presetQty = null, options = {}) => {
        const order = (DB.data?.data?.workOrders || []).find(x => String(x?.id || '') === String(workOrderId || ''));
        if (!order) return;
        const line = (order.lines || []).find(x => String(x?.id || '') === String(lineId || ''));
        if (!line) return;
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const metrics = UnitModule.computeWorkLineUnitMetrics(order, line, stationId, txns, { routeSeq: Number(options?.routeSeq || 0) });
        if (!metrics || metrics.inProcessQty <= 0) return alert('Islemde miktar yok.');
        const suggested = Math.max(1, Math.floor(metrics.inProcessQty || 0));
        const skipPrompt = !!(options && options.skipPrompt);
        let qty = Number(presetQty);
        if (!skipPrompt) {
            const raw = prompt('Tamamlanan adet kac?', String(suggested));
            if (raw === null) return;
            qty = Number(raw);
        }
        if (!Number.isFinite(qty) || qty <= 0) return alert('Gecerli bir miktar girin.');
        if (!Number.isInteger(qty)) return alert('Miktar tam sayi olmali.');
        if (qty > metrics.inProcessQty) return alert(`Maksimum girilebilir miktar: ${metrics.inProcessQty}`);
        await UnitModule.addWorkOrderTxn(workOrderId, lineId, stationId, 'COMPLETE', qty, 'Istasyon tamamlandi', {
            routeId: String(metrics?.routeId || ''),
            routeSeq: Number(metrics?.routeSeq || 0),
            processId: String(metrics?.processId || '')
        });
    },
    completeWorkOrderQtyFromInput: async (workOrderId, lineId, stationId, inputId, routeSeq = '') => {
        const input = document.getElementById(String(inputId || '').trim());
        if (!input) return alert('Adet giris kutusu bulunamadi.');
        const raw = String(input.value || '').trim();
        if (!raw) return alert('Lutfen tamamlanan adet giriniz.');
        const qty = Number(raw);
        await UnitModule.completeWorkOrderQty(workOrderId, lineId, stationId, qty, { skipPrompt: true, routeSeq: Number(routeSeq || 0) });
    },
    takeAllWorkOrderQty: async (workOrderId, lineId, stationId, routeSeq = '') => {
        const order = (DB.data?.data?.workOrders || []).find(x => String(x?.id || '') === String(workOrderId || ''));
        if (!order) return;
        const line = (order.lines || []).find(x => String(x?.id || '') === String(lineId || ''));
        if (!line) return;
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const metrics = UnitModule.computeWorkLineUnitMetrics(order, line, stationId, txns, { routeSeq: Number(routeSeq || 0) });
        const qty = Math.floor(Number(metrics?.availableQty || 0));
        if (!metrics || qty <= 0) return alert('Alinabilir miktar yok.');
        await UnitModule.addWorkOrderTxn(workOrderId, lineId, stationId, 'TAKE', qty, 'Istasyon tumunu teslim aldi', {
            routeId: String(metrics?.routeId || ''),
            routeSeq: Number(metrics?.routeSeq || 0),
            processId: String(metrics?.processId || '')
        });
    },
    openWorkOrderProcessPreviewForLine: (workOrderId, lineId, stationId, routeSeq = '') => {
        const order = (DB.data?.data?.workOrders || []).find(x => String(x?.id || '') === String(workOrderId || ''));
        if (!order) return;
        const line = Array.isArray(order?.lines) ? order.lines.find(x => String(x?.id || '') === String(lineId || '')) : null;
        if (!line) return;
        const routes = Array.isArray(line?.routes) ? line.routes : [];
        const metrics = UnitModule.computeWorkLineUnitMetrics(order, line, stationId, Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [], { routeSeq: Number(routeSeq || 0) });
        const route = routes.find((r, idx) =>
            String(r?.stationId || '') === String(stationId || '')
            && Number(idx + 1) === Number(metrics?.routeSeq || routeSeq || 0)
        ) || routes.find(r => String(r?.stationId || '') === String(stationId || ''));
        const processId = String(route?.processId || '').trim().toUpperCase();
        if (!processId) return alert('Islem kodu bulunamadi.');
        UnitModule.openWorkOrderProcessPreview(stationId, processId, stationId);
    },
    openWorkOrderExecutionDetail: (workOrderId, lineId, stationId, routeSeq = '') => {
        const order = (DB.data?.data?.workOrders || []).find(x => String(x?.id || '') === String(workOrderId || ''));
        if (!order) return;
        const line = Array.isArray(order?.lines) ? order.lines.find(x => String(x?.id || '') === String(lineId || '')) : null;
        if (!line) return;
        const routes = Array.isArray(line?.routes) ? line.routes : [];
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const metrics = UnitModule.computeWorkLineUnitMetrics(order, line, stationId, txns, { routeSeq: Number(routeSeq || 0) });
        if (!metrics) return;
        const routeIdx = Math.max(0, Number(metrics?.routeSeq || 1) - 1);
        const targetQty = Math.max(0, Number(line?.targetQty || 0));
        const remainingQty = Math.max(0, targetQty - Number(metrics?.doneQty || 0));
        const plan = (line.plans && typeof line.plans === 'object') ? (line.plans[String(stationId || '')] || null) : null;
        const processCode = String(metrics?.processId || '').trim().toUpperCase();
        const processName = UnitModule.getRouteProcessName(stationId, processCode);
        const priorityMeta = UnitModule.getWorkOrderPriorityMeta(order?.priority);
        const prevRoute = routeIdx > 0 ? routes[routeIdx - 1] : null;
        const nextRoute = routeIdx >= 0 && routeIdx < routes.length - 1 ? routes[routeIdx + 1] : null;
        const fromStationName = prevRoute
            ? String(UnitModule.getRouteStationName(prevRoute.stationId) || prevRoute.stationName || prevRoute.stationId || '-')
            : 'Baslangic (ilk istasyon)';
        const toStationName = nextRoute
            ? String(UnitModule.getRouteStationName(nextRoute.stationId) || nextRoute.stationName || nextRoute.stationId || '-')
            : 'Son adim (depo/sevk asamasi)';
        const transferPendingQty = Math.max(0, Number(metrics?.transferPendingQty || 0));
        const showTransferFollowup = !!nextRoute && transferPendingQty > 0 && Number(metrics?.inProcessQty || 0) <= 0;
        const routeFilter = UnitModule.getRouteFilterForIndex(line, routeIdx);
        const takeAt = UnitModule.getWorkTxnTime(txns, order?.id, line?.id, stationId, 'TAKE', 'first', routeFilter);
        const completeAt = UnitModule.getWorkTxnTime(txns, order?.id, line?.id, stationId, 'COMPLETE', 'last', routeFilter);
        const takeAtLabel = UnitModule.formatDateTimeShort(takeAt);
        const completeAtLabel = UnitModule.formatDateTimeShort(completeAt);
        Modal.open(`Is Emri Detay - ${UnitModule.escapeHtml(order?.workOrderCode || '-')}`, `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.55rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Parca/Bilesen</div>
                        <div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(line?.componentName || '-')}</div>
                        <div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(line?.componentCode || '-')}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Rota / Islem</div>
                        <div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(UnitModule.getRouteStationName(stationId) || '-')}</div>
                        <div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(processCode || '-')}</div>
                        <div style="font-size:0.72rem; color:#64748b; margin-top:0.08rem;">${UnitModule.escapeHtml(processName || '-')}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.6rem; padding:0.55rem;">
                        <div style="font-size:0.72rem; color:#64748b;">Termin / Oncelik</div>
                        <div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(order?.dueDate || '-')}</div>
                        <span style="display:inline-block; margin-top:0.25rem; border-radius:999px; padding:0.1rem 0.48rem; font-size:0.72rem; font-weight:700; ${priorityMeta.style}">${priorityMeta.label}</span>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.5rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                        <div style="font-size:0.7rem; color:#64748b;">Nereden geldi</div>
                        <div style="font-size:0.95rem; font-weight:800; color:#0f172a;">${UnitModule.escapeHtml(fromStationName)}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                        <div style="font-size:0.7rem; color:#64748b;">Nereye gidecek</div>
                        <div style="font-size:0.95rem; font-weight:800; color:#0f172a;">${UnitModule.escapeHtml(toStationName)}</div>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.5rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                        <div style="font-size:0.7rem; color:#64748b;">Teslim alindigi zaman</div>
                        <div style="font-size:0.95rem; font-weight:800; color:#0f172a;">${UnitModule.escapeHtml(takeAtLabel)}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                        <div style="font-size:0.7rem; color:#64748b;">Teslim edildigi zaman</div>
                        <div style="font-size:0.95rem; font-weight:800; color:#0f172a;">${UnitModule.escapeHtml(completeAtLabel)}</div>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:0.5rem;">
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.7rem; color:#64748b;">Planlanan</div><div style="font-size:1rem; font-weight:800; color:#0f172a;">${targetQty}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.7rem; color:#64748b;">Teslim alinan</div><div style="font-size:1rem; font-weight:800; color:#334155;">${Number(metrics?.inProcessQty || 0) + Number(metrics?.doneQty || 0)}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.7rem; color:#64748b;">Yapilan</div><div style="font-size:1rem; font-weight:800; color:#047857;">${Number(metrics?.doneQty || 0)}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.7rem; color:#64748b;">Kalan</div><div style="font-size:1rem; font-weight:800; color:#b45309;">${remainingQty}</div></div>
                    <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.7rem; color:#64748b;">Alinabilir</div><div style="font-size:1rem; font-weight:800; color:#1d4ed8;">${Number(metrics?.availableQty || 0)}</div></div>
                </div>
                ${showTransferFollowup ? `
                    <div style="border:1px solid #fecaca; background:#fef2f2; border-radius:0.55rem; padding:0.55rem; font-size:0.82rem; color:#991b1b; font-weight:700;">
                        Uyari: Sonraki birim henuz teslim almadi.
                    </div>
                ` : ''}
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.55rem; font-size:0.78rem; color:#475569;">
                    Plan: ${(() => {
                        const hasUnitPlan = !!(plan && (
                            String(plan.machine || '').trim()
                            || String(plan.personnel || '').trim()
                            || String(plan.targetDate || '').trim()
                        ));
                        if (hasUnitPlan) {
                            return `${UnitModule.escapeHtml(plan.machine || '-')} / ${UnitModule.escapeHtml(plan.personnel || '-')} ${plan.targetDate ? `(${UnitModule.escapeHtml(plan.targetDate)})` : ''}`;
                        }
                        const sourceCode = String(order?.sourceCode || '').trim().toUpperCase();
                        if (!/^PLN-\d{6}$/.test(sourceCode)) return '-';
                        return `<button class="btn-sm" onclick="UnitModule.openWorkOrderSourceDemand('${String(order?.id || '')}')" style="padding:0.1rem 0.45rem; min-height:24px; border:1px solid #93c5fd; background:#eff6ff; color:#1d4ed8; font-family:monospace; font-weight:800;">${UnitModule.escapeHtml(sourceCode)}</button>`;
                    })()}
                </div>
                <div style="display:flex; gap:0.45rem; flex-wrap:wrap; justify-content:flex-end;">
                    <button class="btn-sm" onclick="Modal.close(); setTimeout(() => UnitModule.openWorkOrderComponentPreview('${String(order?.id || '')}','${String(line?.id || '')}','${String(stationId || '')}'), 0);" style="border-color:#cbd5e1;">Parca kutuphanesi</button>
                    <button class="btn-sm" onclick="Modal.close(); setTimeout(() => UnitModule.openWorkOrderProcessPreviewForLine('${String(order?.id || '')}','${String(line?.id || '')}','${String(stationId || '')}','${Number(metrics?.routeSeq || 0)}'), 0);" style="border-color:#cbd5e1;">Islem kutuphanesi</button>
                </div>
            </div>
        `, { maxWidth: '1080px' });
    },
    openWorkOrderSourceDemand: (workOrderId) => {
        const order = (DB.data?.data?.workOrders || []).find((x) => String(x?.id || '') === String(workOrderId || ''));
        if (!order) return alert('Is emri bulunamadi.');
        if (typeof PlanningModule === 'undefined' || !PlanningModule) {
            return alert('Planlama modulu yuklenemedi.');
        }
        const sourceId = String(order?.sourceId || '').trim();
        const sourceCode = String(order?.sourceCode || '').trim().toUpperCase();
        if (!sourceId && !sourceCode) return alert('Bu is emrinde plan talep kodu yok.');
        const demands = typeof PlanningModule.getDemands === 'function' ? PlanningModule.getDemands() : [];
        const demand = (Array.isArray(demands) ? demands : []).find((row) => {
            const demandId = String(row?.id || '').trim();
            const demandCode = String(row?.demandCode || '').trim().toUpperCase();
            return (sourceId && demandId === sourceId) || (sourceCode && demandCode === sourceCode);
        });
        if (!demand) {
            return alert(`Talep kaydi bulunamadi: ${sourceCode || sourceId}`);
        }
        if (typeof PlanningModule.openReleasedDemandTrackingModal !== 'function') {
            return alert('Talep detay ekrani acilamadi.');
        }
        PlanningModule.openReleasedDemandTrackingModal(String(demand?.id || ''));
    },
    getWorkOrderPlanMachineOptions: (stationId) => {
        const unitId = String(stationId || '').trim();
        if (!unitId) return [];
        const rows = Array.isArray(DB.data?.data?.machines) ? DB.data.data.machines : [];
        return rows
            .filter((machine) => String(machine?.unitId || '') === unitId)
            .map((machine) => {
                const name = String(machine?.name || '').trim();
                const status = String(machine?.status || '').trim().toUpperCase();
                const statusLabel = status ? ` (${status})` : '';
                return {
                    value: name,
                    label: `${name}${statusLabel}`
                };
            })
            .filter((row) => row.value)
            .sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''), 'tr'));
    },
    getWorkOrderPlanPersonnelUnitIds: (person) => {
        if (!person || typeof person !== 'object') return [];
        if (Array.isArray(person.assignedUnitIds) && person.assignedUnitIds.length > 0) {
            return Array.from(new Set(
                person.assignedUnitIds
                    .map((id) => String(id || '').trim())
                    .filter(Boolean)
            ));
        }
        if (person.unitId) return [String(person.unitId || '').trim()].filter(Boolean);
        return [];
    },
    getWorkOrderPlanPersonnelOptions: (stationId) => {
        const unitId = String(stationId || '').trim();
        if (!unitId) return [];
        const rows = Array.isArray(DB.data?.data?.personnel) ? DB.data.data.personnel : [];
        const mapByName = new Map();
        rows.forEach((person) => {
            if (!person || typeof person !== 'object') return;
            const status = String(person?.status || 'aktif').trim().toLowerCase();
            if (person.isActive === false || status === 'pasif') return;
            const unitIds = UnitModule.getWorkOrderPlanPersonnelUnitIds(person);
            if (!unitIds.includes(unitId)) return;
            const name = String(person?.fullName || person?.name || '').trim();
            if (!name) return;
            const title = String(person?.title || '').trim();
            const label = title ? `${name} - ${title}` : name;
            if (!mapByName.has(name)) mapByName.set(name, { value: name, label });
        });
        return Array.from(mapByName.values()).sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''), 'tr'));
    },
    openWorkOrderPlanModal: (workOrderId, lineId, stationId) => {
        const order = (DB.data?.data?.workOrders || []).find(x => String(x?.id || '') === String(workOrderId || ''));
        if (!order) return;
        const line = (order.lines || []).find(x => String(x?.id || '') === String(lineId || ''));
        if (!line) return;
        const plan = (line.plans && typeof line.plans === 'object')
            ? (line.plans[String(stationId || '')] || {})
            : {};
        const machineOptions = UnitModule.getWorkOrderPlanMachineOptions(stationId);
        const personnelOptions = UnitModule.getWorkOrderPlanPersonnelOptions(stationId);
        const machineValues = new Set(machineOptions.map((row) => String(row.value || '').trim()));
        const personnelValues = new Set(personnelOptions.map((row) => String(row.value || '').trim()));
        const selectedMachine = machineValues.has(String(plan?.machine || '').trim()) ? String(plan.machine || '').trim() : '';
        const selectedPersonnel = personnelValues.has(String(plan?.personnel || '').trim()) ? String(plan.personnel || '').trim() : '';
        Modal.open('Planlama Satiri', `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <div style="font-weight:700; color:#334155; font-size:0.92rem;">${UnitModule.escapeHtml(order.workOrderCode || '-')} / ${UnitModule.escapeHtml(line.lineCode || '-')}</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.7rem;">
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.25rem;">Sira no</label>
                        <input id="wo_plan_queue_order" type="number" min="0" value="${Number(plan.queueOrder || 0)}" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.25rem;">Hedef tarih</label>
                        <input id="wo_plan_target_date" type="date" value="${UnitModule.escapeHtml(plan.targetDate || '')}" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem;">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.25rem;">Makine</label>
                        <select id="wo_plan_machine" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem;" ${machineOptions.length === 0 ? 'disabled' : ''}>
                            <option value="">Makine secin</option>
                            ${machineOptions.map((option) => `<option value="${UnitModule.escapeHtml(option.value || '')}" ${String(selectedMachine || '') === String(option.value || '') ? 'selected' : ''}>${UnitModule.escapeHtml(option.label || option.value || '')}</option>`).join('')}
                        </select>
                        ${machineOptions.length > 0
                            ? `<div style="margin-top:0.25rem; font-size:0.72rem; color:#64748b;">Bu birimden ${machineOptions.length} makine listelendi.</div>`
                            : `<div style="margin-top:0.25rem; font-size:0.72rem; color:#b45309; background:#fffbeb; border:1px solid #fde68a; border-radius:0.45rem; padding:0.32rem 0.45rem;">Bu birime tanimli makine yok.</div>`
                        }
                    </div>
                    <div>
                        <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.25rem;">Personel</label>
                        <select id="wo_plan_personnel" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem;" ${personnelOptions.length === 0 ? 'disabled' : ''}>
                            <option value="">Personel secin</option>
                            ${personnelOptions.map((option) => `<option value="${UnitModule.escapeHtml(option.value || '')}" ${String(selectedPersonnel || '') === String(option.value || '') ? 'selected' : ''}>${UnitModule.escapeHtml(option.label || option.value || '')}</option>`).join('')}
                        </select>
                        ${personnelOptions.length > 0
                            ? `<div style="margin-top:0.25rem; font-size:0.72rem; color:#64748b;">Bu birimden ${personnelOptions.length} personel listelendi.</div>`
                            : `<div style="margin-top:0.25rem; font-size:0.72rem; color:#b45309; background:#fffbeb; border:1px solid #fde68a; border-radius:0.45rem; padding:0.32rem 0.45rem;">Bu birime tanimli personel yok.</div>`
                        }
                    </div>
                </div>
                <div>
                    <label style="display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.25rem;">Not</label>
                    <textarea id="wo_plan_note" rows="3" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.55rem; resize:vertical;">${UnitModule.escapeHtml(plan.note || '')}</textarea>
                </div>
                <button class="btn-primary" style="width:100%;" onclick="UnitModule.saveWorkOrderPlan('${String(workOrderId || '')}','${String(lineId || '')}','${String(stationId || '')}')">Kaydet</button>
            </div>
        `);
    },
    saveWorkOrderPlan: async (workOrderId, lineId, stationId) => {
        const order = (DB.data?.data?.workOrders || []).find(x => String(x?.id || '') === String(workOrderId || ''));
        if (!order) return;
        const line = (order.lines || []).find(x => String(x?.id || '') === String(lineId || ''));
        if (!line) return;
        if (!line.plans || typeof line.plans !== 'object') line.plans = {};
        const queueOrder = Number(document.getElementById('wo_plan_queue_order')?.value || 0);
        const targetDate = String(document.getElementById('wo_plan_target_date')?.value || '').trim();
        const machine = String(document.getElementById('wo_plan_machine')?.value || '').trim();
        const personnel = String(document.getElementById('wo_plan_personnel')?.value || '').trim();
        const note = String(document.getElementById('wo_plan_note')?.value || '').trim();
        const machineSet = new Set(UnitModule.getWorkOrderPlanMachineOptions(stationId).map((row) => String(row.value || '').trim()));
        const personnelSet = new Set(UnitModule.getWorkOrderPlanPersonnelOptions(stationId).map((row) => String(row.value || '').trim()));
        if (machine && !machineSet.has(machine)) {
            return alert('Secilen makine bu birime tanimli guncel listede yok. Lutfen listeden seciniz.');
        }
        if (personnel && !personnelSet.has(personnel)) {
            return alert('Secilen personel bu birime tanimli guncel listede yok. Lutfen listeden seciniz.');
        }
        line.plans[String(stationId || '')] = {
            queueOrder: Number.isFinite(queueOrder) ? queueOrder : 0,
            targetDate,
            machine,
            personnel,
            note,
            updatedAt: new Date().toISOString()
        };
        order.updated_at = new Date().toISOString();
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },
    renderWorkOrderPlanningPlaceholder: (container, unitId) => {
        UnitModule.state.workOrderPlanningUnitId = String(unitId || '').trim();
        const unit = (DB.data?.data?.units || []).find(u => String(u.id) === String(unitId));
        if (!unit) {
            container.innerHTML = `<div style="text-align:center; padding:3rem; color:#64748b;">Birim bulunamadi.</div>`;
            return;
        }
        const isDepoTransferPlanning = String(unitId || '') === 'u_dtm';
        const allUnits = Array.isArray(DB.data?.data?.units) ? DB.data.data.units : [];
        const transferTargetOptions = isDepoTransferPlanning
            ? allUnits
                .filter((u) =>
                    String(u?.id || '')
                    && String(u?.id || '') !== String(unitId || '')
                    && String(u?.type || '').trim().toLowerCase() === 'external')
                .map((u) => ({ id: String(u?.id || ''), name: String(u?.name || '').trim() }))
                .filter((u) => u.id && u.name)
                .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'tr'))
            : [];
        let selectedTransferTargetId = isDepoTransferPlanning ? String(UnitModule.state.workOrderTransferTarget || '').trim() : '';
        if (selectedTransferTargetId && !transferTargetOptions.some((row) => String(row.id || '') === selectedTransferTargetId)) {
            selectedTransferTargetId = '';
            UnitModule.state.workOrderTransferTarget = '';
        }
        let selectedDispatchListTargetId = isDepoTransferPlanning ? String(UnitModule.state.workOrderDispatchListTarget || '').trim() : '';
        if (selectedDispatchListTargetId && !transferTargetOptions.some((row) => String(row.id || '') === selectedDispatchListTargetId)) {
            selectedDispatchListTargetId = '';
            UnitModule.state.workOrderDispatchListTarget = '';
        }
        const txns = Array.isArray(DB.data?.data?.workOrderTransactions) ? DB.data.data.workOrderTransactions : [];
        const orders = Array.isArray(DB.data?.data?.workOrders) ? DB.data.data.workOrders : [];
        let tab = String(UnitModule.state.workOrderTab || 'AKTIF').toUpperCase();
        if (!isDepoTransferPlanning && tab === 'FASON') {
            tab = 'AKTIF';
            UnitModule.state.workOrderTab = 'AKTIF';
        }
        const showTransferTargetSelector = isDepoTransferPlanning && tab === 'AKTIF';
        const effectiveTransferTargetId = showTransferTargetSelector ? selectedTransferTargetId : '';
        const search = String(UnitModule.state.workOrderSearch || '').trim().toLowerCase();
        const dispatchNotesForUnit = (Array.isArray(DB.data?.data?.workOrderDispatchNotes) ? DB.data.data.workOrderDispatchNotes : [])
            .filter((row) => String(row?.stationId || '') === String(unitId || ''));
        const dispatchOpenCount = dispatchNotesForUnit.filter((row) => !row?.isArchived).length;
        const dispatchArchiveCount = dispatchNotesForUnit.filter((row) => !!row?.isArchived).length;
        const rows = UnitModule.getWorkOrderPlanningRowsForUnit(unitId);

        const priorityRank = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
        const filtered = rows
            .filter(r => {
                if (effectiveTransferTargetId) {
                    if (String(r?.metrics?.nextStationId || '') !== effectiveTransferTargetId) return false;
                }
                if (!search) return true;
                const processName = UnitModule.getRouteProcessName(r?.metrics?.stationId, r?.metrics?.processId);
                const hay = [
                    r.order?.workOrderCode,
                    r.order?.productCode,
                    r.order?.productName,
                    r.order?.sourceCode,
                    r.order?.sourceItemCode,
                    r.order?.sourceItemName,
                    r.line?.lineCode,
                    r.line?.componentCode,
                    r.line?.componentName,
                    r.metrics?.processId,
                    processName
                ].join(' ').toLowerCase();
                return hay.includes(search);
            })
            .sort((a, b) => {
                const da = String(a.order?.dueDate || '9999-12-31');
                const db = String(b.order?.dueDate || '9999-12-31');
                if (da !== db) return da.localeCompare(db);
                const pa = priorityRank[String(a.order?.priority || 'NORMAL').toUpperCase()] ?? 9;
                const pb = priorityRank[String(b.order?.priority || 'NORMAL').toUpperCase()] ?? 9;
                if (pa !== pb) return pa - pb;
                return String(a.order?.workOrderCode || '').localeCompare(String(b.order?.workOrderCode || ''));
            });
        const isTransferPendingRow = (row) => Number(row?.metrics?.transferPendingQty || 0) > 0;
        const isActiveRow = (row) => Number(row?.metrics?.inProcessQty || 0) > 0 || isTransferPendingRow(row);
        const isPoolRow = (row) =>
            Number(row?.upcomingQty || 0) > 0
            && Number(row?.metrics?.availableQty || 0) <= 0
            && Number(row?.metrics?.inProcessQty || 0) <= 0
            && !isTransferPendingRow(row);
        const waitingRows = filtered.filter(r => Number(r?.metrics?.availableQty || 0) > 0);
        const activeRows = filtered.filter((r) => isActiveRow(r));
        const poolRows = filtered.filter((r) => isPoolRow(r));
        const archiveRows = filtered.filter(r => Number(r?.metrics?.doneQty || 0) > 0);
        const visible = filtered.filter(r => {
            if (tab === 'BEKLEYEN') return Number(r?.metrics?.availableQty || 0) > 0;
            if (tab === 'AKTIF') return isActiveRow(r);
            if (tab === 'HAVUZ') return isPoolRow(r);
            if (tab === 'ARSIV') return Number(r?.metrics?.doneQty || 0) > 0;
            return true;
        });
        const totalOrders = new Set(rows.map(r => String(r.order?.id || ''))).size;
        const waitingQty = rows.reduce((sum, r) => sum + Number(r.metrics?.availableQty || 0), 0);
        const inProcessQty = rows.reduce((sum, r) => sum + Number(r.metrics?.inProcessQty || 0), 0);
        const doneQty = rows.reduce((sum, r) => sum + Number(r.metrics?.doneQty || 0), 0);
        const dispatchSelectionStats = (() => {
            if (!isDepoTransferPlanning || tab !== 'AKTIF') return { rowCount: 0, totalQty: 0 };
            const selectedMap = UnitModule.state.workOrderDispatchRows || {};
            const qtyMap = UnitModule.state.workOrderDispatchQtyByRow || {};
            let rowCount = 0;
            let totalQty = 0;
            visible.forEach((row) => {
                const key = UnitModule.getWorkOrderDispatchRowKey(row?.order?.id, row?.line?.id, row?.metrics?.stationId, row?.metrics);
                if (!selectedMap[key]) return;
                rowCount += 1;
                const qty = Math.max(0, Math.floor(Number(qtyMap[key] || 0)));
                totalQty += qty;
            });
            return { rowCount, totalQty };
        })();
        const processOptions = Array.from(new Set(
            rows
                .map(r => String(r?.metrics?.processId || '').trim().toUpperCase())
                .filter(Boolean)
        )).sort((a, b) => a.localeCompare(b, 'tr'));
        const todayIso = new Date().toISOString().slice(0, 10);
        const getTodayDoneQty = (row) => {
            if (!row || !row.order || !row.line || !row.metrics) return 0;
            const routeFilter = UnitModule.getRouteFilterForIndex(row.line, Math.max(0, Number(row?.metrics?.routeSeq || 1) - 1));
            return txns.reduce((sum, txn) => {
                if (String(txn?.workOrderId || '') !== String(row.order?.id || '')) return sum;
                if (String(txn?.lineId || '') !== String(row.line?.id || '')) return sum;
                if (String(txn?.stationId || '') !== String(row.metrics?.stationId || '')) return sum;
                if (String(txn?.type || '').toUpperCase() !== 'COMPLETE') return sum;
                if (!UnitModule.isWorkTxnRouteMatch(txn, routeFilter)) return sum;
                const txnDay = String(txn?.created_at || '').slice(0, 10);
                if (txnDay !== todayIso) return sum;
                return sum + Number(txn?.qty || 0);
            }, 0);
        };
        const workOrderToolbarShellStyle = 'position:sticky; top:84px; z-index:24; background:rgba(255,255,255,0.98); border:1px solid #cfd8e3; border-radius:1rem; padding:0.82rem 0.9rem; margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; box-shadow:0 10px 22px rgba(15,23,42,0.08);';
        const workOrderToolbarTabsStyle = 'display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;';
        const workOrderToolbarSearchGroupStyle = 'display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-left:auto;';
        const workOrderToolbarSearchStyle = 'min-width:320px; height:44px; border:1.5px solid #cbd5e1; border-radius:0.75rem; padding:0.62rem 0.8rem; font-weight:700; background:#f8fafc; color:#0f172a;';
        const renderTabBtn = (id, label, count, options = {}) => {
            const active = tab === id;
            const highlight = !!options.highlight && Number(count || 0) > 0;
            const secondary = !!options.secondary;
            const style = active
                ? (secondary
                    ? 'background:#eef2ff; color:#1e3a8a; border-color:#c7d2fe;'
                    : 'background:#0f172a; color:#fff; border-color:#0f172a; box-shadow:0 8px 16px rgba(15,23,42,0.24);')
                : (secondary
                    ? 'background:#f8fafc; color:#64748b; border-color:#e2e8f0;'
                    : (highlight
                        ? 'background:#ecfdf5; color:#047857; border-color:#34d399;'
                        : 'background:white; color:#334155; border-color:#cbd5e1;'));
            const badgeStyle = active
                ? (secondary ? 'background:#dbeafe; color:#1e3a8a;' : 'background:rgba(255,255,255,0.2); color:#fff;')
                : (secondary ? 'background:#eef2f7; color:#64748b;' : (highlight ? 'background:#16a34a; color:#fff;' : 'background:#e2e8f0; color:#334155;'));
            const minHeight = secondary ? '40px' : '42px';
            const padding = secondary ? '0.5rem 0.72rem' : '0.56rem 0.9rem';
            const fontSize = secondary ? '0.78rem' : '0.83rem';
            return `
                <button onclick="UnitModule.setWorkOrderTab('${id}')" class="btn-sm" style="${style} display:inline-flex; gap:0.42rem; align-items:center; min-height:${minHeight}; padding:${padding}; border-width:1.5px; font-size:${fontSize}; font-weight:${secondary ? '700' : '800'};">
                    ${label}
                    <span style="display:inline-flex; align-items:center; justify-content:center; min-width:24px; height:24px; border-radius:999px; padding:0 0.45rem; font-size:0.72rem; font-weight:900; ${badgeStyle}">${Number(count || 0)}</span>
                </button>
            `;
        };
        const renderReportsMenu = (statsCount) => {
            const isReportsActive = tab === 'ISTATISTIK' || tab === 'ARSIV';
            const triggerStyle = isReportsActive
                ? 'background:#eff6ff; color:#1d4ed8; border:1.5px solid #93c5fd;'
                : 'background:#f8fafc; color:#475569; border:1.5px solid #e2e8f0;';
            return `
                <details style="position:relative;">
                    <summary class="btn-sm" style="${triggerStyle} list-style:none; display:inline-flex; align-items:center; gap:0.4rem; min-height:42px; padding:0.56rem 0.86rem; font-size:0.8rem; font-weight:700; cursor:pointer;">
                        Raporlar
                        <i data-lucide="chevron-down" width="14" height="14"></i>
                    </summary>
                    <div style="position:absolute; right:0; top:calc(100% + 0.35rem); min-width:230px; background:white; border:1px solid #e2e8f0; border-radius:0.7rem; box-shadow:0 14px 30px rgba(15,23,42,0.14); padding:0.35rem; z-index:36;">
                        <button type="button" onclick="UnitModule.setWorkOrderTab('ISTATISTIK')" style="width:100%; border:none; background:#f8fafc; color:#334155; border-radius:0.5rem; min-height:36px; padding:0.42rem 0.56rem; display:flex; align-items:center; justify-content:space-between; gap:0.5rem; font-weight:700; cursor:pointer;">
                            <span>Birim Istatistikleri</span>
                            <span style="display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px; border-radius:999px; padding:0 0.42rem; font-size:0.7rem; font-weight:900; background:#e2e8f0; color:#334155;">${Number(statsCount || 0)}</span>
                        </button>
                        <button type="button" onclick="UnitModule.setWorkOrderTab('ARSIV')" style="margin-top:0.3rem; width:100%; border:none; background:#f8fafc; color:#334155; border-radius:0.5rem; min-height:36px; padding:0.42rem 0.56rem; display:flex; align-items:center; justify-content:space-between; gap:0.5rem; font-weight:700; cursor:pointer;">
                            <span>Arsiv</span>
                            <span style="display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px; border-radius:999px; padding:0 0.42rem; font-size:0.7rem; font-weight:900; background:#e2e8f0; color:#334155;">${Number(archiveRows.length || 0)}</span>
                        </button>
                    </div>
                </details>
            `;
        };
        const renderWorkOrderToolbar = (statsCount = doneQty) => `
            <div style="${workOrderToolbarShellStyle}">
                <div style="${workOrderToolbarTabsStyle}">
                    ${renderTabBtn('AKTIF', 'Aktif Islemler', activeRows.length)}
                    ${renderTabBtn('BEKLEYEN', 'Bekleyen Isler', waitingRows.length, { highlight: true })}
                    ${isDepoTransferPlanning ? renderTabBtn('FASON', 'fasona giden malzemeler', dispatchOpenCount) : ''}
                    ${!isDepoTransferPlanning ? `<span style="width:1px; height:24px; background:#e2e8f0; margin:0 0.1rem 0 0.2rem;"></span>` : ''}
                    ${!isDepoTransferPlanning ? renderTabBtn('HAVUZ', 'Atolyeye Gelecek Isler', poolRows.length, { secondary: true }) : ''}
                </div>
                <div style="${workOrderToolbarSearchGroupStyle}">
                    ${isDepoTransferPlanning ? renderTabBtn('HAVUZ', 'Atolyeye Gelecek Isler', poolRows.length, { secondary: true }) : ''}
                    ${renderReportsMenu(statsCount)}
                    <input value="${UnitModule.escapeHtml(UnitModule.state.workOrderSearch || '')}" oninput="UnitModule.setWorkOrderSearch(this.value)" placeholder="is emri, urun, bilesen veya ID ara" style="${workOrderToolbarSearchStyle}">
                </div>
            </div>
        `;
        const getWorkOrderTabDescription = (tabKey) => {
            if (tabKey === 'AKTIF') return 'Bu sayfa, atolye tarafinda teslim alinmis islemleri ve tamamlanip bir sonraki istasyona devir bekleyen satirlari gosterir.';
            if (tabKey === 'BEKLEYEN') return 'Bu sayfa, atolyenin teslim alabilecegi isleri listeler.';
            if (tabKey === 'HAVUZ') return 'Bu sayfa, atolyeye gelecek isleri bilgilendirme amacli gosterir. Bu alanda planlama islemi kapatilidir.';
            if (tabKey === 'FASON') return 'Bu sayfa, depodan dis birimlere acilan sevk irsaliyelerini ve aldim/verdim akisini takip eder.';
            if (tabKey === 'ISTATISTIK') return 'Bu sayfa, birimin gunluk/haftalik/aylik uretim istatistiklerini gosterir.';
            if (tabKey === 'ARSIV') return 'Bu sayfa, tamamlanan veya kismi teslim edilen islerin gecmis kaydini gosterir.';
            return 'Bu sayfa, atolye is emirlerini ve durumlarini gosterir.';
        };

        if (tab === 'FASON' && isDepoTransferPlanning) {
            const dispatchFiltered = dispatchNotesForUnit
                .filter((row) => {
                    if (!selectedDispatchListTargetId) return true;
                    return String(row?.targetUnitId || '') === selectedDispatchListTargetId;
                })
                .filter((row) => {
                    if (!search) return true;
                    const statusMeta = UnitModule.getWorkOrderDispatchStatusMeta(row?.status);
                    const rowText = (Array.isArray(row?.rows) ? row.rows : []).map((r) => [
                        r?.workOrderCode,
                        r?.lineCode,
                        r?.componentCode,
                        r?.componentName
                    ].join(' ')).join(' ');
                    const hay = [
                        row?.docNo,
                        row?.targetUnitName,
                        statusMeta.label,
                        row?.note,
                        rowText
                    ].join(' ').toLowerCase();
                    return hay.includes(search);
                })
                .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
            const dispatchOpenRows = dispatchFiltered.filter((row) => !row?.isArchived);
            const dispatchArchiveRows = dispatchFiltered.filter((row) => !!row?.isArchived);
            const dispatchTotalQty = dispatchFiltered.reduce((sum, row) => {
                const qty = (Array.isArray(row?.rows) ? row.rows : []).reduce((s, item) => s + Math.max(0, Number(item?.qty || 0)), 0);
                return sum + qty;
            }, 0);
            const renderDispatchActionButtons = (row) => {
                if (row?.isArchived) return '';
                const status = String(row?.status || 'HAZIRLANDI').trim().toUpperCase();
                if (status === 'HAZIRLANDI') {
                    return `<button class="btn-sm" onclick="UnitModule.setWorkOrderDispatchNoteStatus('${row.id}','TESLIM_EDILDI')" style="border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;">Teslim edildi</button>`;
                }
                if (status === 'TESLIM_EDILDI') {
                    return `
                        <button class="btn-sm" onclick="UnitModule.setWorkOrderDispatchNoteStatus('${row.id}','DIS_BIRIMDE')" style="border-color:#ddd6fe; color:#5b21b6; background:#f5f3ff;">Dis birimde</button>
                        <button class="btn-sm" onclick="UnitModule.setWorkOrderDispatchNoteStatus('${row.id}','GERI_GELDI')" style="border-color:#fde68a; color:#92400e; background:#fffbeb;">Geri geldi</button>
                    `;
                }
                if (status === 'DIS_BIRIMDE') {
                    return `<button class="btn-sm" onclick="UnitModule.setWorkOrderDispatchNoteStatus('${row.id}','GERI_GELDI')" style="border-color:#fde68a; color:#92400e; background:#fffbeb;">Geri geldi</button>`;
                }
                if (status === 'GERI_GELDI') {
                    return `<button class="btn-sm" onclick="UnitModule.setWorkOrderDispatchNoteStatus('${row.id}','DEPOYA_ALINDI')" style="border-color:#bbf7d0; color:#166534; background:#ecfdf5;">Depoya alindi</button>`;
                }
                return '';
            };
            const renderDispatchTableRows = (items, archivedMode = false) => {
                if (!items.length) {
                    return `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit yok.</td></tr>`;
                }
                return items.map((row) => {
                    const noteRows = Array.isArray(row?.rows) ? row.rows : [];
                    const totalQty = noteRows.reduce((sum, item) => sum + Math.max(0, Number(item?.qty || 0)), 0);
                    const statusMeta = UnitModule.getWorkOrderDispatchStatusMeta(row?.status);
                    const lastAt = String(row?.updated_at || row?.created_at || '');
                    const actions = renderDispatchActionButtons(row);
                    return `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:0.55rem;">
                                <div style="font-family:monospace; font-weight:800; color:#1d4ed8;">${UnitModule.escapeHtml(String(row?.docNo || '-'))}</div>
                                <div style="font-size:0.72rem; color:#64748b;">${UnitModule.escapeHtml(UnitModule.formatDateTimeShort(String(row?.created_at || '')))}</div>
                            </td>
                            <td style="padding:0.55rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(String(row?.targetUnitName || '-'))}</td>
                            <td style="padding:0.55rem; text-align:center; font-weight:700; color:#0f172a;">${noteRows.length}</td>
                            <td style="padding:0.55rem; text-align:center; font-weight:800; color:#0f172a;">${Number(totalQty || 0)}</td>
                            <td style="padding:0.55rem;">
                                <span style="display:inline-block; border-radius:999px; padding:0.13rem 0.55rem; font-size:0.72rem; font-weight:700; ${statusMeta.style}">${statusMeta.label}</span>
                            </td>
                            <td style="padding:0.55rem; color:#475569;">${UnitModule.escapeHtml(UnitModule.formatDateTimeShort(lastAt))}</td>
                            <td style="padding:0.55rem;">
                                <div style="display:flex; flex-direction:column; gap:0.18rem;">
                                    ${noteRows.slice(0, 2).map((item) => `<div style="font-size:0.72rem; color:#64748b;">${UnitModule.escapeHtml(String(item?.workOrderCode || '-'))} / ${UnitModule.escapeHtml(String(item?.componentCode || '-'))}</div>`).join('')}
                                    ${noteRows.length > 2 ? `<div style="font-size:0.72rem; color:#94a3b8;">+${noteRows.length - 2} satir daha</div>` : ''}
                                </div>
                            </td>
                            <td style="padding:0.55rem; text-align:right;">
                                <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                                    <button class="btn-sm" onclick="UnitModule.openWorkOrderDispatchNoteDetail('${row.id}')">Goruntule</button>
                                    <button class="btn-sm" onclick="UnitModule.openWorkOrderDispatchPdfPreview('${row.id}')" style="border-color:#1d4ed8; color:#1d4ed8; background:#eff6ff;">PDF goruntule</button>
                                    ${archivedMode ? '' : actions}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            };
            container.innerHTML = `
                <div style="max-width:1380px; margin:0 auto;">
                    <div style="margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.8rem; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem; cursor:pointer;">
                                <i data-lucide="arrow-left" width="18"></i>
                            </button>
                            <div>
                                <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.45rem;">
                                    <i data-lucide="clipboard-list" color="#1d4ed8"></i> ${UnitModule.escapeHtml(unit.name || '-')} - Is Emri Planlama
                                </h2>
                                <div style="font-size:0.82rem; color:#64748b;">Fason sevk irsaliye takibi</div>
                            </div>
                        </div>
                    </div>
                    ${renderWorkOrderToolbar(doneQty)}
                    <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.7rem; margin-bottom:0.8rem;">
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem 0.85rem;"><div style="font-size:0.74rem; color:#64748b;">Toplam irsaliye</div><div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${dispatchFiltered.length}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem 0.85rem;"><div style="font-size:0.74rem; color:#64748b;">Acik irsaliye</div><div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${dispatchOpenRows.length}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem 0.85rem;"><div style="font-size:0.74rem; color:#64748b;">Arsiv</div><div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${dispatchArchiveRows.length}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem 0.85rem;"><div style="font-size:0.74rem; color:#64748b;">Toplam sevk adedi</div><div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${dispatchTotalQty}</div></div>
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:0.85rem; padding:0.65rem 0.75rem; margin-bottom:0.8rem; display:flex; align-items:center; gap:0.8rem; flex-wrap:wrap;">
                        <select onchange="UnitModule.setWorkOrderDispatchListTarget(this.value)" style="min-width:330px; height:40px; border:2px solid #111827; border-radius:0.8rem; padding:0 0.7rem; font-size:0.9rem; font-weight:700; background:white; color:#1f2937;">
                            <option value="">tum dis birimler</option>
                            ${transferTargetOptions.map((row) => `<option value="${UnitModule.escapeHtml(row.id)}" ${row.id === selectedDispatchListTargetId ? 'selected' : ''}>${UnitModule.escapeHtml(row.name)}</option>`).join('')}
                        </select>
                        <div style="font-size:1.05rem; color:#334155; font-weight:600;">olusturulan irsaliyeler listesi</div>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #dbeafe; color:#334155; border-radius:0.75rem; padding:0.65rem 0.8rem; margin-bottom:0.8rem; font-size:0.82rem;">
                        ${UnitModule.escapeHtml(getWorkOrderTabDescription('FASON'))}
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem; margin-bottom:0.8rem;">
                        <div style="font-size:0.92rem; font-weight:800; color:#0f172a; margin-bottom:0.6rem;">Acik irsaliyeler</div>
                        <div class="card-table">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                        <th style="padding:0.55rem; text-align:left;">Belge / tarih</th>
                                        <th style="padding:0.55rem; text-align:left;">Hedef birim</th>
                                        <th style="padding:0.55rem; text-align:center;">Satir</th>
                                        <th style="padding:0.55rem; text-align:center;">Adet</th>
                                        <th style="padding:0.55rem; text-align:left;">Durum</th>
                                        <th style="padding:0.55rem; text-align:left;">Son hareket</th>
                                        <th style="padding:0.55rem; text-align:left;">Ornek satir</th>
                                        <th style="padding:0.55rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${renderDispatchTableRows(dispatchOpenRows, false)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                        <div style="font-size:0.92rem; font-weight:800; color:#0f172a; margin-bottom:0.6rem;">Arsiv</div>
                        <div class="card-table">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                        <th style="padding:0.55rem; text-align:left;">Belge / tarih</th>
                                        <th style="padding:0.55rem; text-align:left;">Hedef birim</th>
                                        <th style="padding:0.55rem; text-align:center;">Satir</th>
                                        <th style="padding:0.55rem; text-align:center;">Adet</th>
                                        <th style="padding:0.55rem; text-align:left;">Durum</th>
                                        <th style="padding:0.55rem; text-align:left;">Son hareket</th>
                                        <th style="padding:0.55rem; text-align:left;">Ornek satir</th>
                                        <th style="padding:0.55rem; text-align:right;">Islem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${renderDispatchTableRows(dispatchArchiveRows, true)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (tab === 'ISTATISTIK') {
            const statsRange = String(UnitModule.state.workOrderStatsRange || 'WEEK').toUpperCase();
            const statsGroup = String(UnitModule.state.workOrderStatsGroup || 'UNIT').toUpperCase();
            const statsProcess = String(UnitModule.state.workOrderStatsProcess || '').trim().toUpperCase();
            const rangeStart = new Date();
            let rangeDays = 7;
            if (statsRange === 'DAY') {
                rangeDays = 1;
                rangeStart.setHours(0, 0, 0, 0);
            } else if (statsRange === 'WEEK') {
                rangeDays = 7;
                rangeStart.setDate(rangeStart.getDate() - 6);
                rangeStart.setHours(0, 0, 0, 0);
            } else {
                rangeDays = 30;
                rangeStart.setDate(rangeStart.getDate() - 29);
                rangeStart.setHours(0, 0, 0, 0);
            }
            const statsTxns = txns
                .filter(txn => String(txn?.stationId || '') === String(unitId || '') && String(txn?.type || '').toUpperCase() === 'COMPLETE')
                .map(txn => {
                    const order = orders.find(o => String(o?.id || '') === String(txn?.workOrderId || ''));
                    const line = Array.isArray(order?.lines) ? order.lines.find(x => String(x?.id || '') === String(txn?.lineId || '')) : null;
                    const route = Array.isArray(line?.routes) ? line.routes.find(r => String(r?.stationId || '') === String(unitId || '')) : null;
                    return { txn, order, line, processId: String(route?.processId || '').trim().toUpperCase() };
                })
                .filter(entry => {
                    if (!entry?.order || !entry?.line) return false;
                    const d = new Date(entry?.txn?.created_at || 0);
                    if (Number.isNaN(d.getTime()) || d < rangeStart) return false;
                    if (statsProcess && entry.processId !== statsProcess) return false;
                    return true;
                });
            const statsTotalQty = statsTxns.reduce((sum, entry) => sum + Number(entry?.txn?.qty || 0), 0);
            const statsLineKeys = new Set(statsTxns.map(entry => `${entry.txn?.workOrderId}::${entry.txn?.lineId}`));
            const statsDoneCount = statsLineKeys.size;
            const statsRows = (() => {
                if (statsGroup === 'PERSONNEL') {
                    const map = new Map();
                    statsTxns.forEach(entry => {
                        const key = String(entry?.txn?.user || 'Bilinmeyen').trim() || 'Bilinmeyen';
                        if (!map.has(key)) map.set(key, { label: key, totalQty: 0, lineKeys: new Set() });
                        const bucket = map.get(key);
                        bucket.totalQty += Number(entry?.txn?.qty || 0);
                        bucket.lineKeys.add(`${entry.txn?.workOrderId}::${entry.txn?.lineId}`);
                    });
                    return Array.from(map.values()).map(bucket => ({
                        label: bucket.label,
                        totalQty: bucket.totalQty,
                        doneCount: bucket.lineKeys.size,
                        avgDaily: rangeDays > 0 ? Number((bucket.totalQty / rangeDays).toFixed(1)) : bucket.totalQty
                    })).sort((a, b) => b.totalQty - a.totalQty);
                }
                return [{
                    label: UnitModule.getRouteStationName(unitId) || 'Atolye',
                    totalQty: statsTotalQty,
                    doneCount: statsDoneCount,
                    avgDaily: rangeDays > 0 ? Number((statsTotalQty / rangeDays).toFixed(1)) : statsTotalQty
                }];
            })();
            container.innerHTML = `
                <div style="max-width:1380px; margin:0 auto;">
                    <div style="margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.8rem; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem; cursor:pointer;">
                                <i data-lucide="arrow-left" width="18"></i>
                            </button>
                            <div>
                                <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.45rem;">
                                    <i data-lucide="clipboard-list" color="#1d4ed8"></i> ${UnitModule.escapeHtml(unit.name || '-')} - Is Emri Planlama
                                </h2>
                                <div style="font-size:0.82rem; color:#64748b;">Birim istatistikleri</div>
                            </div>
                        </div>
                    </div>
                    ${renderWorkOrderToolbar(doneQty)}
                    <div style="background:#f8fafc; border:1px solid #dbeafe; color:#334155; border-radius:0.75rem; padding:0.65rem 0.8rem; margin-bottom:0.8rem; font-size:0.82rem;">
                        ${UnitModule.escapeHtml(getWorkOrderTabDescription('ISTATISTIK'))}
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem; margin-bottom:0.85rem; display:flex; gap:0.6rem; flex-wrap:wrap; align-items:center;">
                        <select onchange="UnitModule.setWorkOrderStatsFilter('range', this.value)" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.5rem 0.6rem; font-weight:700;">
                            <option value="DAY" ${statsRange === 'DAY' ? 'selected' : ''}>Gunluk</option>
                            <option value="WEEK" ${statsRange === 'WEEK' ? 'selected' : ''}>Haftalik</option>
                            <option value="MONTH" ${statsRange === 'MONTH' ? 'selected' : ''}>Aylik</option>
                        </select>
                        <select onchange="UnitModule.setWorkOrderStatsFilter('group', this.value)" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.5rem 0.6rem; font-weight:700;">
                            <option value="UNIT" ${statsGroup === 'UNIT' ? 'selected' : ''}>Atolye bazli</option>
                            <option value="PERSONNEL" ${statsGroup === 'PERSONNEL' ? 'selected' : ''}>Personel bazli</option>
                        </select>
                        <select onchange="UnitModule.setWorkOrderStatsFilter('process', this.value)" style="min-width:220px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.5rem 0.6rem; font-weight:700;">
                            <option value="">Islem kutuphanesinden sec</option>
                            ${processOptions.map(code => `<option value="${UnitModule.escapeHtml(code)}" ${statsProcess === code ? 'selected' : ''}>${UnitModule.escapeHtml(code)}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.7rem; margin-bottom:1rem;">
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.72rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Toplam uretilen</div><div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${statsTotalQty}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.72rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Net adet</div><div style="font-size:1.1rem; font-weight:800; color:#047857;">${statsTotalQty}</div></div>
                        <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.72rem 0.9rem;"><div style="font-size:0.74rem; color:#64748b;">Tamamlanan is</div><div style="font-size:1.1rem; font-weight:800; color:#1d4ed8;">${statsDoneCount}</div></div>
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                        <div class="card-table">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead><tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;"><th style="padding:0.55rem; text-align:left;">${statsGroup === 'PERSONNEL' ? 'Personel' : 'Atolye'}</th><th style="padding:0.55rem; text-align:center;">Toplam adet</th><th style="padding:0.55rem; text-align:center;">Tamamlanan is</th><th style="padding:0.55rem; text-align:center;">Ort. gunluk</th></tr></thead>
                                <tbody>
                                    ${statsRows.length === 0 ? `<tr><td colspan="4" style="padding:1rem; text-align:center; color:#94a3b8;">Secilen filtre icin kayit yok.</td></tr>` : statsRows.map(row => `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:0.55rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.label)}</td><td style="padding:0.55rem; text-align:center; font-weight:700; color:#0f172a;">${Number(row.totalQty || 0)}</td><td style="padding:0.55rem; text-align:center; font-weight:700; color:#1d4ed8;">${Number(row.doneCount || 0)}</td><td style="padding:0.55rem; text-align:center; font-weight:700; color:#047857;">${Number(row.avgDaily || 0)}</td></tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (tab === 'ARSIV') {
            const getArchiveDate = (row) => {
                const entries = txns
                    .filter(txn => String(txn?.workOrderId || '') === String(row?.order?.id || '')
                        && String(txn?.lineId || '') === String(row?.line?.id || '')
                        && String(txn?.stationId || '') === String(row?.metrics?.stationId || '')
                        && String(txn?.type || '').toUpperCase() === 'COMPLETE')
                    .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
                return entries[0]?.created_at ? String(entries[0].created_at).slice(0, 10) : '-';
            };
            container.innerHTML = `
                <div style="max-width:1380px; margin:0 auto;">
                    <div style="margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.8rem; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem; cursor:pointer;">
                                <i data-lucide="arrow-left" width="18"></i>
                            </button>
                            <div>
                                <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.45rem;">
                                    <i data-lucide="clipboard-list" color="#1d4ed8"></i> ${UnitModule.escapeHtml(unit.name || '-')} - Is Emri Planlama
                                </h2>
                                <div style="font-size:0.82rem; color:#64748b;">Arsiv ekrani</div>
                            </div>
                        </div>
                    </div>
                    ${renderWorkOrderToolbar(doneQty)}
                    <div style="background:#f8fafc; border:1px solid #dbeafe; color:#334155; border-radius:0.75rem; padding:0.65rem 0.8rem; margin-bottom:0.8rem; font-size:0.82rem;">
                        ${UnitModule.escapeHtml(getWorkOrderTabDescription('ARSIV'))}
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                        <div class="card-table">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead><tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;"><th style="padding:0.55rem; text-align:left;">Is emri / satir</th><th style="padding:0.55rem; text-align:left;">Urun</th><th style="padding:0.55rem; text-align:left;">Bilesen</th><th style="padding:0.55rem; text-align:center;">Planlanan</th><th style="padding:0.55rem; text-align:center;">Tamamlanan</th><th style="padding:0.55rem; text-align:left;">Durum</th><th style="padding:0.55rem; text-align:left;">Son islem tarihi</th><th style="padding:0.55rem; text-align:right;">Islem</th></tr></thead>
                                <tbody>
                                    ${archiveRows.length === 0 ? `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">Arsivde kayit yok.</td></tr>` : archiveRows.map(row => {
                const done = Number(row?.metrics?.doneQty || 0);
                const target = Number(row?.targetQty || 0);
                const doneAll = done >= target && target > 0;
                const statusChip = doneAll
                    ? 'background:#ecfdf5; color:#047857; border:1px solid #bbf7d0;'
                    : 'background:#ffedd5; color:#c2410c; border:1px solid #fed7aa;';
                const statusText = doneAll ? 'Tamamlandi' : 'Kismi teslim';
                const isSingle = String(row?.order?.productCode || '').trim().toUpperCase() === String(row?.line?.componentCode || '').trim().toUpperCase()
                    && String(row?.order?.productName || '').trim().toLowerCase() === String(row?.line?.componentName || '').trim().toLowerCase();
                const productTitle = isSingle ? 'Parca Uretimi' : UnitModule.escapeHtml(row?.order?.productName || '-');
                const productCode = isSingle ? 'Tek parca is emri' : UnitModule.escapeHtml(row?.order?.productCode || '-');
                return `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:0.55rem;"><div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${UnitModule.escapeHtml(row?.order?.workOrderCode || '-')}</div><div style="font-family:monospace; font-size:0.74rem; color:#64748b;">${UnitModule.escapeHtml(row?.line?.lineCode || '-')}</div></td><td style="padding:0.55rem;"><div style="font-weight:700; color:#334155;">${productTitle}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${productCode}</div></td><td style="padding:0.55rem;"><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row?.line?.componentName || '-')}</div><div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${UnitModule.escapeHtml(row?.line?.componentCode || '-')}</div></td><td style="padding:0.55rem; text-align:center; font-weight:700; color:#334155;">${target}</td><td style="padding:0.55rem; text-align:center; font-weight:700; color:#047857;">${done}</td><td style="padding:0.55rem;"><span style="display:inline-block; border-radius:999px; padding:0.12rem 0.5rem; font-size:0.72rem; font-weight:700; ${statusChip}">${statusText}</span></td><td style="padding:0.55rem; color:#475569;">${UnitModule.escapeHtml(getArchiveDate(row))}</td><td style="padding:0.55rem; text-align:right;"><button class="btn-sm" onclick="UnitModule.openWorkOrderExecutionDetail('${row.order.id}','${row.line.id}','${row.metrics.stationId}','${Number(row.metrics?.routeSeq || 0)}')">Goruntule</button></td></tr>`;
            }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="max-width:1380px; margin:0 auto;">
                <div style="margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; gap:0.8rem; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.45rem;">
                                <i data-lucide="clipboard-list" color="#1d4ed8"></i> ${UnitModule.escapeHtml(unit.name || '-')} - Is Emri Planlama
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b;">Lot bazli takip, kismi teslim alma ve gunluk uretim girisi</div>
                        </div>
                    </div>
                </div>

                ${renderWorkOrderToolbar(doneQty)}

                <div style="display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.7rem; margin-bottom:1rem;">
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem 0.85rem;"><div style="font-size:0.74rem; color:#64748b;">Is emri</div><div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${totalOrders}</div></div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem 0.85rem;"><div style="font-size:0.74rem; color:#64748b;">Bekleyen adet</div><div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${waitingQty}</div></div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem 0.85rem;"><div style="font-size:0.74rem; color:#64748b;">Islemde adet</div><div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${inProcessQty}</div></div>
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:0.75rem; padding:0.7rem 0.85rem;"><div style="font-size:0.74rem; color:#64748b;">Bu istasyonda tamamlanan</div><div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${doneQty}</div></div>
                </div>

                ${showTransferTargetSelector ? `
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:0.85rem; padding:0.65rem 0.75rem; margin-bottom:0.8rem; display:flex; align-items:center; gap:0.8rem; flex-wrap:wrap;">
                        <select onchange="UnitModule.setWorkOrderTransferTarget(this.value)" style="min-width:330px; height:40px; border:2px solid #111827; border-radius:0.8rem; padding:0 0.7rem; font-size:0.9rem; font-weight:700; background:white; color:#1f2937;">
                            <option value="">tum dis birimler</option>
                            ${transferTargetOptions.map((row) => `<option value="${UnitModule.escapeHtml(row.id)}" ${row.id === selectedTransferTargetId ? 'selected' : ''}>${UnitModule.escapeHtml(row.name)}</option>`).join('')}
                        </select>
                        <div style="font-size:1.1rem; line-height:1; color:#64748b; font-weight:700;">${String.fromCharCode(8594)}</div>
                        <div style="font-size:1.05rem; color:#334155; font-weight:600;">sevkiyat icin liste olustur</div>
                    </div>
                ` : ''}

                <div style="background:#f8fafc; border:1px solid #dbeafe; color:#334155; border-radius:0.75rem; padding:0.65rem 0.8rem; margin-bottom:0.8rem; font-size:0.82rem;">
                    ${UnitModule.escapeHtml(getWorkOrderTabDescription(tab))}
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead><tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;"><th style="padding:0.55rem; text-align:left;">Is emri no / satir no</th><th style="padding:0.55rem; text-align:left;">Urun</th><th style="padding:0.55rem; text-align:left;">Bilesen</th><th style="padding:0.55rem; text-align:left;">Rota adimi</th><th style="padding:0.55rem; text-align:center;">Bekleyen</th><th style="padding:0.55rem; text-align:center;">Islemde</th><th style="padding:0.55rem; text-align:center;">Tamamlanan</th><th style="padding:0.55rem; text-align:right;">Islem</th></tr></thead>
                            <tbody>
                                ${visible.length === 0 ? `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">Bu sekme icin kayit yok.</td></tr>` : visible.map((r) => {
                                    const hasUnitPlan = !!(r.plan && (
                                        String(r.plan.machine || '').trim()
                                        || String(r.plan.personnel || '').trim()
                                        || String(r.plan.targetDate || '').trim()
                                    ));
                                    const sourceCode = String(r.order?.sourceCode || '').trim().toUpperCase();
                                    const hasSourcePlan = /^PLN-\d{6}$/.test(sourceCode);
                                    const sourcePlanBadge = hasSourcePlan
                                        ? `<button class="btn-sm" onclick="UnitModule.openWorkOrderSourceDemand('${String(r.order?.id || '')}')" style="padding:0.08rem 0.45rem; min-height:24px; border:1px solid #93c5fd; background:#eff6ff; color:#1d4ed8; font-family:monospace; font-weight:800;">${UnitModule.escapeHtml(sourceCode)}</button>`
                                        : '';
                                    const planDetailText = hasUnitPlan
                                        ? `${UnitModule.escapeHtml(r.plan.machine || '-')}/${UnitModule.escapeHtml(r.plan.personnel || '-')} ${r.plan.targetDate ? `(${UnitModule.escapeHtml(r.plan.targetDate)})` : ''}`
                                        : '-';
                                    const canTake = Number(r.metrics?.availableQty || 0) > 0;
                                    const canComplete = Number(r.metrics?.inProcessQty || 0) > 0;
                                    const isWaitingTab = tab === 'BEKLEYEN';
                                    const isActiveTab = tab === 'AKTIF';
                                    const showTakeAction = isWaitingTab;
                                    const showCompleteAction = isActiveTab;
                                    const showPlanAction = isActiveTab && String(unitId || '') !== 'u_dtm';
                                    const showDispatchSelection = isDepoTransferPlanning && isActiveTab && !!selectedTransferTargetId;
                                    const transferPendingQty = Number(r.metrics?.transferPendingQty || 0);
                                    const showTransferPendingBadge = isActiveTab && transferPendingQty > 0 && Number(r.metrics?.inProcessQty || 0) <= 0;
                                    const componentPreviewAction = `UnitModule.openWorkOrderComponentPreview('${r.order.id}','${r.line.id}','${unitId}')`;
                                    const processCode = String(r.metrics.processId || '').trim().toUpperCase();
                                    const processPreviewAction = `UnitModule.openWorkOrderProcessPreview('${r.metrics.stationId}','${processCode}','${unitId}')`;
                                    const linkButtonStyle = 'background:none; border:none; padding:0; margin:0; cursor:pointer; text-align:left;';
                                    const componentNameHtml = `<button type="button" onclick="${componentPreviewAction}" style="${linkButtonStyle} font-weight:700; color:#1d4ed8; text-decoration:underline;">${UnitModule.escapeHtml(r.line?.componentName || '-')}</button>`;
                                    const componentCodeHtml = `<button type="button" onclick="${componentPreviewAction}" style="${linkButtonStyle} font-size:0.74rem; color:#2563eb; font-family:monospace; text-decoration:underline;">${UnitModule.escapeHtml(r.line?.componentCode || '-')}</button>`;
                                    const isSingleComponentOrder = String(r.order?.productCode || '').trim().toUpperCase() === String(r.line?.componentCode || '').trim().toUpperCase()
                                        && String(r.order?.productName || '').trim().toLowerCase() === String(r.line?.componentName || '').trim().toLowerCase();
                                    const productTitle = isSingleComponentOrder ? 'Parca Uretimi' : UnitModule.escapeHtml(r.order?.productName || '-');
                                    const productCode = isSingleComponentOrder ? 'Tek parca is emri' : UnitModule.escapeHtml(r.order?.productCode || '-');
                                    const processName = UnitModule.getRouteProcessName(r.metrics.stationId, processCode);
                                    const processCodeHtml = processCode
                                        ? `<button type="button" onclick="${processPreviewAction}" style="${linkButtonStyle} font-size:0.74rem; color:#2563eb; font-family:monospace; text-decoration:underline;">${UnitModule.escapeHtml(processCode)}</button>`
                                        : `<span style="font-size:0.74rem; color:#64748b; font-family:monospace;">-</span>`;
                                    const routes = Array.isArray(r.line?.routes) ? r.line.routes : [];
                                    const routeIndex = Math.max(0, Number(r.metrics?.routeSeq || 1) - 1);
                                    const prevRoute = routeIndex > 0 ? routes[routeIndex - 1] : null;
                                    const nextRoute = routeIndex >= 0 && routeIndex < routes.length - 1 ? routes[routeIndex + 1] : null;
                                    const fromStationName = prevRoute
                                        ? String(UnitModule.getRouteStationName(prevRoute.stationId) || prevRoute.stationName || prevRoute.stationId || '-')
                                        : 'Baslangic';
                                    const toStationName = nextRoute
                                        ? String(UnitModule.getRouteStationName(nextRoute.stationId) || nextRoute.stationName || nextRoute.stationId || '-')
                                        : 'Son adim / sevk';
                                    const totalQtyForStep = Math.max(0, Number(r.metrics?.stepTarget || 0));
                                    const takenQtyForStep = Math.max(0, Number(r.metrics?.inProcessQty || 0) + Number(r.metrics?.doneQty || 0));
                                    const remainingQtyForStep = Math.max(0, totalQtyForStep - takenQtyForStep);
                                    const qtySummary = `${takenQtyForStep}/${totalQtyForStep}`;
                                    const completeInputId = `wo_complete_qty_${String(r.order?.id || '')}_${String(r.line?.id || '')}_${String(r.metrics?.stationId || '')}_${String(r.metrics?.routeSeq || 0)}`.replace(/[^a-zA-Z0-9_-]/g, '_');
                                    const dispatchRowKey = UnitModule.getWorkOrderDispatchRowKey(r.order?.id, r.line?.id, r.metrics?.stationId, r.metrics);
                                    const dispatchChecked = !!(UnitModule.state.workOrderDispatchRows || {})[dispatchRowKey];
                                    const dispatchQty = Math.max(0, Math.floor(Number((UnitModule.state.workOrderDispatchQtyByRow || {})[dispatchRowKey] || 0)));
                                    const completeInputDefault = showDispatchSelection ? dispatchQty : 0;
                                    const completeInputMax = Math.max(1, Math.floor(Number(r.metrics?.inProcessQty || 0)));
                                    const qtyStatusBlock = `
                                        <div style="margin-top:0.45rem; display:flex; flex-direction:column; align-items:flex-end; gap:0.38rem;">
                                            <div style="display:inline-flex; align-items:center; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end; font-size:0.69rem; color:#64748b;">
                                                <span style="display:inline-flex; align-items:center; gap:0.2rem; border:1px solid #e2e8f0; border-radius:0.42rem; padding:0.14rem 0.32rem; background:#f8fafc;">Toplam:<strong style="color:#0f172a;">${totalQtyForStep}</strong></span>
                                                <span style="display:inline-flex; align-items:center; gap:0.2rem; border:1px solid #e2e8f0; border-radius:0.42rem; padding:0.14rem 0.32rem; background:#f8fafc;">Alinan:<strong style="color:#1d4ed8;">${takenQtyForStep}</strong></span>
                                                <span style="display:inline-flex; align-items:center; gap:0.2rem; border:1px solid #e2e8f0; border-radius:0.42rem; padding:0.14rem 0.32rem; background:#f8fafc;">Kalan:<strong style="color:#b45309;">${remainingQtyForStep}</strong></span>
                                                <span style="display:inline-flex; align-items:center; justify-content:center; min-width:54px; height:24px; border:1px solid #d1d5db; border-radius:0.45rem; background:#f8fafc; color:#0f172a; font-weight:800;">${UnitModule.escapeHtml(qtySummary)}</span>
                                            </div>
                                        </div>
                                    `;
                                    const completeActionBlock = showCompleteAction ? `
                                        <div style="margin-top:0.2rem; display:flex; flex-direction:column; align-items:flex-end; gap:0.38rem;">
                                            ${qtyStatusBlock}
                                            ${canComplete ? `
                                                <div style="display:inline-flex; align-items:center; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                                                    <input id="${UnitModule.escapeHtml(completeInputId)}" type="number" min="1" max="${completeInputMax}" value="${completeInputDefault}" ${showDispatchSelection ? `onchange="UnitModule.setWorkOrderDispatchQty('${UnitModule.escapeHtml(dispatchRowKey)}', this.value)"` : ''} style="width:88px; height:32px; border:1px solid #cbd5e1; border-radius:0.45rem; padding:0 0.45rem; font-weight:700;">
                                                    ${showDispatchSelection ? `
                                                        <label style="display:inline-flex; align-items:center; gap:0.28rem; color:#334155; font-size:0.76rem; white-space:nowrap;">
                                                            <input type="checkbox" ${dispatchChecked ? 'checked' : ''} onchange="UnitModule.toggleWorkOrderDispatchRow('${UnitModule.escapeHtml(dispatchRowKey)}', this.checked)">
                                                            irsaliyeye ekle
                                                        </label>
                                                    ` : ''}
                                                    <button class="btn-sm" onclick="UnitModule.completeWorkOrderQtyFromInput('${r.order.id}','${r.line.id}','${r.metrics.stationId}','${completeInputId}','${Number(r.metrics?.routeSeq || 0)}')" style="border-color:#bbf7d0; color:#047857; background:#ecfdf5;">Tamamlanan Adedi Gir</button>
                                                </div>
                                            ` : ''}
                                            ${showTransferPendingBadge
                                                ? `<span style="display:inline-block; border-radius:999px; padding:0.16rem 0.58rem; font-size:0.72rem; font-weight:700; background:#ffedd5; color:#9a3412; border:1px solid #fed7aa;">Tamamlandi - Devir Bekliyor</span>`
                                                : ''
                                            }
                                        </div>
                                    ` : qtyStatusBlock;
                                    return `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:0.55rem;">
                                                <div style="font-size:0.7rem; color:#64748b; text-transform:uppercase; font-weight:700;">Is emri no</div>
                                                <div style="font-family:monospace; font-weight:700; color:#1d4ed8;">${UnitModule.escapeHtml(r.order?.workOrderCode || '-')}</div>
                                                <div style="margin-top:0.3rem; font-size:0.7rem; color:#64748b; text-transform:uppercase; font-weight:700;">Satir no</div>
                                                <div style="font-family:monospace; font-size:0.78rem; color:#334155;">${UnitModule.escapeHtml(r.line?.lineCode || '-')}</div>
                                                <div style="margin-top:0.35rem; font-size:0.7rem; color:#64748b; text-transform:uppercase; font-weight:700;">Plan</div>
                                                <div style="display:flex; flex-direction:column; gap:0.2rem; align-items:flex-start;">
                                                    ${hasSourcePlan ? sourcePlanBadge : `<span style="font-size:0.76rem; color:#64748b;">-</span>`}
                                                    ${hasUnitPlan ? `<div style="font-size:0.72rem; color:#475569;">${planDetailText}</div>` : ''}
                                                </div>
                                            </td>
                                            <td style="padding:0.55rem;">
                                                <div style="font-weight:700; color:#334155;">${productTitle}</div>
                                                <div style="font-size:0.74rem; color:#64748b; font-family:monospace;">${productCode}</div>
                                            </td>
                                            <td style="padding:0.55rem;">
                                                <div>${componentNameHtml}</div>
                                                <div>${componentCodeHtml}</div>
                                            </td>
                                            <td style="padding:0.55rem;">
                                                <div style="font-size:0.82rem; color:#334155; font-weight:700;">${r.metrics.routeSeq}. ${UnitModule.escapeHtml(UnitModule.getRouteStationName(r.metrics.stationId || '') || r.metrics.stationName || '-')}</div>
                                                <div>${processCodeHtml}</div>
                                                <div style="font-size:0.72rem; color:#64748b; margin-top:0.08rem;">${UnitModule.escapeHtml(processName || '-')}</div>
                                                <div style="margin-top:0.3rem; display:flex; flex-direction:column; gap:0.1rem;">
                                                    <div style="font-size:0.7rem; color:#64748b;">Nereden: <strong style="color:#334155;">${UnitModule.escapeHtml(fromStationName)}</strong></div>
                                                    <div style="font-size:0.7rem; color:#64748b;">Nereye: <strong style="color:#334155;">${UnitModule.escapeHtml(toStationName)}</strong></div>
                                                </div>
                                            </td>
                                            <td style="padding:0.55rem; text-align:center; font-weight:700; color:#334155;">${r.metrics.availableQty}</td>
                                            <td style="padding:0.55rem; text-align:center; font-weight:700; color:#b45309;">${r.metrics.inProcessQty}</td>
                                            <td style="padding:0.55rem; text-align:center; font-weight:700; color:#047857;">${r.metrics.doneQty}</td>
                                            <td style="padding:0.55rem; text-align:right;">
                                                <div style="display:inline-flex; gap:0.35rem; flex-wrap:wrap; justify-content:flex-end;">
                                                    <button class="btn-sm" onclick="UnitModule.openWorkOrderExecutionDetail('${r.order.id}','${r.line.id}','${r.metrics.stationId}','${Number(r.metrics?.routeSeq || 0)}')">Goruntule</button>
                                                    ${showPlanAction ? `<button class="btn-sm" onclick="UnitModule.openWorkOrderPlanModal('${r.order.id}','${r.line.id}','${r.metrics.stationId}')" style="border-color:#cbd5e1;">Planla</button>` : ''}
                                                    ${showTakeAction ? `<button class="btn-sm" onclick="UnitModule.takeWorkOrderQty('${r.order.id}','${r.line.id}','${r.metrics.stationId}','${Number(r.metrics?.routeSeq || 0)}')" ${canTake ? '' : 'disabled'} style="${canTake ? 'border-color:#bfdbfe; color:#1d4ed8; background:#eff6ff;' : 'opacity:0.45; cursor:not-allowed;'}">Teslim al</button>` : ''}
                                                </div>
                                                ${completeActionBlock}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${isDepoTransferPlanning && tab === 'AKTIF' ? `
                    <div style="margin-top:0.75rem; display:flex; align-items:center; justify-content:flex-end; gap:0.6rem; flex-wrap:wrap;">
                        <div style="font-size:0.78rem; color:#475569; font-weight:700;">
                            Secili satir: ${Number(dispatchSelectionStats?.rowCount || 0)} | Toplam sevk adedi: ${Number(dispatchSelectionStats?.totalQty || 0)}
                        </div>
                        <button class="btn-sm" onclick="UnitModule.createWorkOrderDispatchNoteFromSelected()" ${selectedTransferTargetId && Number(dispatchSelectionStats?.rowCount || 0) > 0 && Number(dispatchSelectionStats?.totalQty || 0) > 0 ? '' : 'disabled'} style="${selectedTransferTargetId && Number(dispatchSelectionStats?.rowCount || 0) > 0 && Number(dispatchSelectionStats?.totalQty || 0) > 0 ? 'background:#111827; color:#fff; border-color:#111827;' : 'opacity:0.45; cursor:not-allowed;'} min-width:190px; padding:0.62rem 0.85rem;">
                            sevk irsaliyesi olustur
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },
    renderDepoTransfer: (container) => {
        const units = (DB.data.data.units || []).slice();
        const unitMap = {};
        units.forEach(u => { unitMap[u.id] = u.name; });
        const tasks = (DB.data.data.depoTransferTasks || [])
            .slice()
            .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));

        const qName = String(UnitModule.state.depoTaskSearchName || '').trim().toLowerCase();
        const qCode = String(UnitModule.state.depoTaskSearchCode || '').trim().toLowerCase();
        const filteredTasks = tasks.filter(row => {
            const nameOk = !qName || String(row.taskName || '').toLowerCase().includes(qName);
            const codeOk = !qCode || String(row.taskCode || '').toLowerCase().includes(qCode);
            return nameOk && codeOk;
        });
        const canDeleteTask = UnitModule.isSuperAdmin();
        const activeTaskCode = UnitModule.state.depoTaskDraftCode || UnitModule.getNextDepoTaskCode();
        const isFormOpen = !!UnitModule.state.depoTaskFormOpen;
        const picker = UnitModule.getActiveComponentRoutePicker();
        const isDepoPickerMode = !!picker && String(picker.stationId || '') === 'u_dtm';

        container.innerHTML = `
            <div style="margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <button onclick="UnitModule.state.view='list'; UI.renderCurrentPage();" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.5rem; cursor:pointer;">
                        <i data-lucide="arrow-left" width="18" height="18"></i>
                    </button>
                    <div>
                        <h2 class="page-title" style="margin:0;">Depo Transfer Islem Kutuphanesi</h2>
                        <div style="font-size:0.85rem; color:#64748b;">Route icin secilecek depo transfer komutlarini burada tanimlayin.</div>
                    </div>
                </div>
                <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.7rem; padding:0.5rem 0.8rem; font-weight:700; color:#0f172a;">
                        Kayitli Islem: ${tasks.length}
                    </div>
                </div>
            </div>

            <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem; margin-bottom:1rem;">
                <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:0.65rem; align-items:center;">
                    <input id="depo_task_search_name" value="${UnitModule.escapeHtml(UnitModule.state.depoTaskSearchName || '')}" oninput="UnitModule.setDepoTaskFilter('name', this.value, 'depo_task_search_name')" placeholder="islem adi ile ara" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.52rem 0.65rem; font-weight:600;">
                    <input id="depo_task_search_code" value="${UnitModule.escapeHtml(UnitModule.state.depoTaskSearchCode || '')}" oninput="UnitModule.setDepoTaskFilter('code', this.value, 'depo_task_search_code')" placeholder="islem ID ile ara" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.52rem 0.65rem; font-weight:600;">
                    <button class="btn-primary" onclick="UnitModule.openDepoTaskForm()" style="min-width:170px;">Islem ekle +</button>
                </div>
            </div>

            <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem; margin-bottom:1rem;">
                <div class="card-table">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.74rem; text-transform:uppercase;">
                                <th style="padding:0.55rem; text-align:left;">Islem adi</th>
                                <th style="padding:0.55rem; text-align:left;">ID kod</th>
                                <th style="padding:0.55rem; text-align:left;">Not</th>
                                <th style="padding:0.55rem; text-align:right;">Goruntule</th>
                                <th style="padding:0.55rem; text-align:right;">Duzenle</th>
                                <th style="padding:0.55rem; text-align:right;">Sec</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredTasks.length === 0 ? `<tr><td colspan="6" style="padding:1rem; color:#94a3b8; text-align:center;">Kayitli islem yok.</td></tr>` : filteredTasks.map(t => `
                                <tr style="border-bottom:1px solid #f1f5f9; ${isDepoPickerMode ? UnitModule.getRoutePickerSelectedRowStyle(UnitModule.state.depoTaskSelectedId === t.id) : ''}">
                                    <td style="padding:0.55rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(t.taskName || '-')}</td>
                                    <td style="padding:0.55rem; font-family:monospace; color:#1d4ed8; font-weight:700;">${UnitModule.escapeHtml(t.taskCode || '-')}</td>
                                    <td style="padding:0.55rem; color:#475569;">${UnitModule.escapeHtml(t.note || '-')}</td>
                                    <td style="padding:0.55rem; text-align:right;"><button class="btn-sm" onclick="UnitModule.previewDepoTask('${t.id}')">Goruntule</button></td>
                                    <td style="padding:0.55rem; text-align:right;"><button class="btn-sm" onclick="UnitModule.startEditDepoTask('${t.id}')">Duzenle</button></td>
                                    <td style="padding:0.55rem; text-align:right;"><button class="btn-sm" onclick="UnitModule.selectDepoTask('${t.id}')" style="${UnitModule.getRoutePickerSelectButtonStyle(UnitModule.state.depoTaskSelectedId === t.id)}">Sec</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            ${isFormOpen ? `
                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem;">
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-bottom:0.8rem;">
                        ${UnitModule.state.depoTaskEditingId ? `<button class="btn-sm" onclick="UnitModule.deleteDepoTask('${UnitModule.state.depoTaskEditingId}')" ${canDeleteTask ? '' : 'disabled'} style="${canDeleteTask ? 'color:#b91c1c; border-color:#fecaca; background:#fef2f2;' : 'opacity:0.45; cursor:not-allowed;'}">sil</button>` : ''}
                        <button class="btn-sm" onclick="UnitModule.resetDepoTaskDraft()">vazgec</button>
                        <button class="btn-primary" onclick="UnitModule.saveDepoTask()">kaydet</button>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.7rem; margin-bottom:0.7rem;">
                        <input id="depo_task_name" value="${UnitModule.escapeHtml(UnitModule.state.depoTaskDraftName || '')}" oninput="UnitModule.state.depoTaskDraftName=this.value" placeholder="islem adi" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.55rem 0.65rem; font-weight:600;">
                        <input id="depo_task_code" value="${UnitModule.escapeHtml(activeTaskCode)}" readonly placeholder="ID kod" style="border:1px solid #e2e8f0; background:#f8fafc; border-radius:0.6rem; padding:0.55rem 0.65rem; font-weight:700; font-family:monospace;">
                    </div>
                    <textarea id="depo_task_note" oninput="UnitModule.state.depoTaskDraftNote=this.value" placeholder="islem notu" style="width:100%; min-height:86px; border:1px solid #cbd5e1; border-radius:0.7rem; padding:0.7rem; color:#334155;">${UnitModule.escapeHtml(UnitModule.state.depoTaskDraftNote || '')}</textarea>
                </div>
            ` : ''}
        `;
    },
    getNextDepoTaskCode: () => {
        if (!Array.isArray(DB.data.data.depoTransferTasks)) DB.data.data.depoTransferTasks = [];
        const max = (DB.data.data.depoTransferTasks || []).reduce((acc, row) => {
            const code = String(row?.taskCode || '').trim().toUpperCase();
            const m = code.match(/^DTR-(\d{6})$/);
            if (!m) return acc;
            return Math.max(acc, Number(m[1]));
        }, 0);
        let next = max + 1;
        let candidate = `DTR-${String(next).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            next += 1;
            candidate = `DTR-${String(next).padStart(6, '0')}`;
        }
        return candidate;
    },
    openDepoTaskForm: () => {
        UnitModule.state.depoTaskFormOpen = true;
        UnitModule.state.depoTaskEditingId = null;
        UnitModule.state.depoTaskDraftCode = UnitModule.getNextDepoTaskCode();
        UnitModule.state.depoTaskDraftName = '';
        UnitModule.state.depoTaskDraftNote = '';
        UI.renderCurrentPage();
    },
    setDepoTaskFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.depoTaskSearchName = value || '';
        if (field === 'code') UnitModule.state.depoTaskSearchCode = value || '';
        if (field === 'route') UnitModule.state.depoTaskSearchRoute = value || '';
        if (field === 'target') UnitModule.state.depoTaskSearchTarget = value || '';
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
    startEditDepoTask: (taskId) => {
        const row = (DB.data.data.depoTransferTasks || []).find(x => x.id === taskId);
        if (!row) return;
        UnitModule.state.depoTaskSelectedId = row.id;
        UnitModule.state.depoTaskFormOpen = true;
        UnitModule.state.depoTaskEditingId = row.id;
        UnitModule.state.depoTaskDraftCode = row.taskCode || UnitModule.getNextDepoTaskCode();
        UnitModule.state.depoTaskDraftName = row.taskName || '';
        UnitModule.state.depoTaskDraftNote = row.note || '';
        UI.renderCurrentPage();
    },
    resetDepoTaskDraft: () => {
        UnitModule.state.depoTaskFormOpen = false;
        UnitModule.state.depoTaskEditingId = null;
        UnitModule.state.depoTaskDraftCode = '';
        UnitModule.state.depoTaskDraftName = '';
        UnitModule.state.depoTaskDraftNote = '';
        UI.renderCurrentPage();
    },
    selectDepoTask: (taskId) => {
        UnitModule.state.depoTaskSelectedId = taskId;
        UI.renderCurrentPage();
    },
    previewDepoTask: (taskId) => {
        const row = (DB.data.data.depoTransferTasks || []).find(x => x.id === taskId);
        if (!row) return;
        Modal.open(`Islem Detay - ${UnitModule.escapeHtml(row.taskName || '-')}`, `
            <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Islem adi</div>
                    <div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.taskName || '-')}</div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">ID kod</div>
                    <div style="font-weight:700; color:#1d4ed8; font-family:monospace;">${UnitModule.escapeHtml(row.taskCode || '-')}</div>
                </div>
                <div style="grid-column:1/-1; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Not</div>
                    <div style="color:#334155; white-space:pre-wrap;">${UnitModule.escapeHtml(row.note || '-')}</div>
                </div>
            </div>
        `, { maxWidth: '720px' });
    },
    saveDepoTask: async () => {
        const taskName = String(UnitModule.state.depoTaskDraftName || '').trim();
        const note = String(UnitModule.state.depoTaskDraftNote || '').trim();
        const taskCode = String(UnitModule.state.depoTaskDraftCode || UnitModule.getNextDepoTaskCode()).trim().toUpperCase();

        if (!taskName) return alert('Is tanimi zorunlu.');

        const editId = UnitModule.state.depoTaskEditingId;
        const exclude = editId ? { collection: 'depoTransferTasks', id: editId, field: 'taskCode' } : null;
        if (UnitModule.isGlobalCodeTaken(taskCode, exclude)) {
            return alert('Bu is tanimi ID zaten kullaniliyor.');
        }

        if (!Array.isArray(DB.data.data.depoTransferTasks)) DB.data.data.depoTransferTasks = [];
        const now = new Date().toISOString();
        const all = DB.data.data.depoTransferTasks;
        if (editId) {
            const row = all.find(x => x.id === editId);
            if (!row) return;
            row.taskName = taskName;
            row.taskCode = taskCode;
            row.note = note;
            row.updated_at = now;
        } else {
            all.push({
                id: crypto.randomUUID(),
                taskName,
                taskCode,
                note,
                created_at: now,
                updated_at: now
            });
        }

        await DB.save();
        UnitModule.resetDepoTaskDraft();
    },
    deleteDepoTask: async (taskId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const row = (DB.data.data.depoTransferTasks || []).find(x => x.id === taskId);
        if (!row) return;
        if (!confirm(`"${row.taskName}" silinsin mi?`)) return;

        DB.data.data.depoTransferTasks = (DB.data.data.depoTransferTasks || []).filter(x => x.id !== taskId);
        if (UnitModule.state.depoTaskEditingId === taskId) UnitModule.resetDepoTaskDraft();
        if (UnitModule.state.depoTaskSelectedId === taskId) UnitModule.state.depoTaskSelectedId = null;
        await DB.save();
        UI.renderCurrentPage();
    },
    saveDepoRoute: async () => {
        const routeName = String(document.getElementById('route_name')?.value || '').trim();
        const productKey = String(document.getElementById('route_product')?.value || '').trim();
        const rawStationIds = [
            String(document.getElementById('route_step_1')?.value || '').trim(),
            String(document.getElementById('route_step_2')?.value || '').trim(),
            String(document.getElementById('route_step_3')?.value || '').trim(),
            String(document.getElementById('route_step_4')?.value || '').trim()
        ];
        const stationIds = rawStationIds.filter(Boolean);

        if (!routeName) return alert('Rota adi zorunlu.');
        if (!productKey) return alert('Urun kod/adi zorunlu.');
        if (stationIds.length < 2) return alert('Rota icin en az 2 adim seciniz.');

        const uniqueCount = new Set(stationIds).size;
        if (uniqueCount !== stationIds.length) return alert('Ayni istasyon rota icinde tekrar edemez.');

        const validUnitIds = new Set((DB.data.data.units || []).map(u => u.id));
        if (stationIds.some(id => !validUnitIds.has(id))) return alert('Rota disi bir istasyon secildi.');

        if (!Array.isArray(DB.data.data.depoRoutes)) DB.data.data.depoRoutes = [];
        DB.data.data.depoRoutes.push({
            id: crypto.randomUUID(),
            routeName,
            productKey,
            stationIds,
            created_at: new Date().toISOString()
        });

        await DB.save();
        UI.renderCurrentPage();
    },
    deleteDepoRoute: async (routeId) => {
        const row = (DB.data.data.depoRoutes || []).find(x => x.id === routeId);
        if (!row) return;
        if (!confirm(`"${row.routeName}" rotasi silinsin mi?`)) return;

        DB.data.data.depoRoutes = (DB.data.data.depoRoutes || []).filter(x => x.id !== routeId);
        await DB.save();
        UI.renderCurrentPage();
    },
    renderUnitPersonnel: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);

        // Ensure Personnel Data Exists
        if (!DB.data.data.personnel) DB.data.data.personnel = [];

        const getAssignedUnitIds = (person) => {
            if (Array.isArray(person?.assignedUnitIds) && person.assignedUnitIds.length > 0) return person.assignedUnitIds.map(id => String(id || ''));
            if (person?.unitId) return [String(person.unitId)];
            return [];
        };
        const getLegacyPermissions = (person) => {
            if (person?.permissions) return person.permissions;
            return {
                production: !!(person?.modulePermissions?.units?.create || person?.modulePermissions?.units?.edit || person?.modulePermissions?.units?.approve),
                waste: !!person?.modulePermissions?.stock?.approve,
                admin: String(person?.rolePreset || '') === 'tam_yetkili'
            };
        };
        const personnel = DB.data.data.personnel.filter(p => p.isActive !== false && getAssignedUnitIds(p).includes(String(unitId || '')));

        container.innerHTML = `
            <div style="margin-bottom:2rem; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:1rem">
                     <button onclick="UnitModule.openUnit('${unitId}')" style="background:white; padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; cursor:pointer"><i data-lucide="arrow-left" width="20"></i></button>
                     <div>
                        <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.5rem"><i data-lucide="users" color="#2563eb"></i> Personel Yonetimi</h2>
                        <div style="font-size:0.875rem; color:#64748b">${unit.name} - Calisan listesi</div>
                     </div>
                </div>
            </div>

            <div class="card-table">
                <table style="width:100%; text-align:left; border-collapse:collapse">
                    <thead>
                        <tr style="border-bottom:1px solid #f1f5f9; color:#94a3b8; font-size:0.75rem; text-transform:uppercase">
                            <th style="padding:1.5rem">Ad Soyad</th>
                            <th style="padding:1.5rem">Yetkiler</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${personnel.length === 0 ? '<tr><td colspan="2" style="padding:2rem; text-align:center; color:#94a3b8">Kayitli personel yok.</td></tr>' : personnel.map(p => `
                            <tr style="border-bottom:1px solid #f1f5f9" class="hover:bg-slate-50">
                                <td style="padding:1.5rem">
                                    <div style="display:flex; align-items:center; gap:0.75rem font-weight:600; color:#334155">
                                        <div style="width:2.5rem; height:2.5rem; background:#f1f5f9; border-radius:99px; display:flex; align-items:center; justify-content:center; color:#64748b; font-weight:700; margin-right:0.75rem">${String(p.fullName || '?').charAt(0)}</div>
                                        ${p.fullName}
                                    </div>
                                </td>
                                <td style="padding:1.5rem">
                                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap">
                                        ${getLegacyPermissions(p).admin ? '<span style="background:#faf5ff; color:#9333ea; padding:0.25rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:700; display:flex; gap:0.25rem; align-items:center"><i data-lucide="shield" width="12"></i> Admin</span>' : ''}
                                        ${getLegacyPermissions(p).production ? '<span style="background:#ecfdf5; color:#047857; padding:0.25rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:700; display:flex; gap:0.25rem; align-items:center"><i data-lucide="factory" width="12"></i> Uretim</span>' : ''}
                                        ${getLegacyPermissions(p).waste ? '<span style="background:#ffedd5; color:#c2410c; padding:0.25rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:700; display:flex; gap:0.25rem; align-items:center"><i data-lucide="alert-circle" width="12"></i> Fire</span>' : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    openPersonnelModal: (unitId, personId = null) => {
        const person = personId ? DB.data.data.personnel.find(p => p.id === personId) : null;
        const perms = person?.permissions || { production: true, waste: false, admin: false };

        Modal.open(person ? 'Personeli Duzenle' : 'Yeni Personel Ekle', `
            <div style="display:flex; flex-direction:column; gap:1rem">
                <div>
                    <label style="display:block; font-size:0.875rem; font-weight:700; color:#334155; margin-bottom:0.25rem">Ad Soyad</label>
                    <input id="p_name" type="text" value="${person?.fullName || ''}" class="form-input" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:0.5rem">
                </div>
                
                <h4 style="margin:0; font-size:0.875rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em">Yetkiler</h4>
                
                <label style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; border:1px solid #f1f5f9; border-radius:0.5rem; cursor:pointer" class="hover:bg-slate-50">
                    <div style="display:flex; gap:0.75rem; align-items:center">
                        <div style="background:#ecfdf5; color:#047857; padding:0.5rem; border-radius:0.25rem"><i data-lucide="factory" width="18"></i></div>
                        <div>
                            <div style="font-weight:600; font-size:0.9rem">Uretim Baslatabilir</div>
                            <div style="font-size:0.75rem; color:#94a3b8">Is emri yetkisi</div>
                        </div>
                    </div>
                    <input id="p_perm_prod" type="checkbox" ${perms.production ? 'checked' : ''} style="width:1.25rem; height:1.25rem">
                </label>

                <label style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; border:1px solid #f1f5f9; border-radius:0.5rem; cursor:pointer" class="hover:bg-slate-50">
                     <div style="display:flex; gap:0.75rem; align-items:center">
                        <div style="background:#ffedd5; color:#c2410c; padding:0.5rem; border-radius:0.25rem"><i data-lucide="alert-circle" width="18"></i></div>
                        <div>
                            <div style="font-weight:600; font-size:0.9rem">Fire Onayi Verebilir</div>
                            <div style="font-size:0.75rem; color:#94a3b8">Hatali uretim girisi</div>
                        </div>
                    </div>
                    <input id="p_perm_waste" type="checkbox" ${perms.waste ? 'checked' : ''} style="width:1.25rem; height:1.25rem">
                </label>

                <label style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; border:1px solid #f1f5f9; border-radius:0.5rem; cursor:pointer" class="hover:bg-slate-50">
                     <div style="display:flex; gap:0.75rem; align-items:center">
                        <div style="background:#faf5ff; color:#9333ea; padding:0.5rem; border-radius:0.25rem"><i data-lucide="shield" width="18"></i></div>
                        <div>
                            <div style="font-weight:600; font-size:0.9rem">Birim Admini</div>
                            <div style="font-size:0.75rem; color:#94a3b8">Tam yetki</div>
                        </div>
                    </div>
                    <input id="p_perm_admin" type="checkbox" ${perms.admin ? 'checked' : ''} style="width:1.25rem; height:1.25rem">
                </label>

                <button class="btn-primary" style="padding:1rem; margin-top:0.5rem" onclick="UnitModule.savePersonnel('${unitId}', '${personId || ''}')">Kaydet</button>
            </div>
        `);
    },

    savePersonnel: async (unitId, personId) => {
        const name = document.getElementById('p_name').value;
        const prod = document.getElementById('p_perm_prod').checked;
        const waste = document.getElementById('p_perm_waste').checked;
        const admin = document.getElementById('p_perm_admin').checked;

        if (!name) return alert("Isim giriniz.");

        if (!DB.data.data.personnel) DB.data.data.personnel = [];

        if (personId) {
            const p = DB.data.data.personnel.find(x => x.id === personId);
            if (p) {
                p.fullName = name;
                p.permissions = { production: prod, waste, admin };
            }
        } else {
            DB.data.data.personnel.push({
                id: crypto.randomUUID(),
                unitId,
                fullName: name,
                permissions: { production: prod, waste, admin },
                isActive: true
            });
        }

        await DB.save();
        Modal.close();
        UnitModule.renderUnitPersonnel(document.getElementById('main-content'), unitId);
    },

    deletePersonnel: async (id, unitId) => {
        if (!confirm("Bu personeli silmek (pasife almak) istediginize emin misiniz?")) return;
        const p = DB.data.data.personnel.find(x => x.id === id);
        if (p) p.isActive = false; // Soft delete
        await DB.save();
        UnitModule.renderUnitPersonnel(document.getElementById('main-content'), unitId);
    },

    renderUnitLibraryPlaceholder: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        container.innerHTML = `
            <div style="margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:1rem">
                    <button onclick="UnitModule.handleLibraryBack('${unitId}')" style="background:white; padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; cursor:pointer"><i data-lucide="arrow-left" width="20"></i></button>
                    <div>
                        <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.5rem"><i data-lucide="library" color="#1d4ed8"></i> &#220;r&#252;n K&#252;t&#252;phanesi</h2>
                        <div style="font-size:0.875rem; color:#64748b">${unit?.name || ''} - Bu birim icin modul henuz tanimlanmadi.</div>
                    </div>
                </div>
            </div>
            <div class="card-table" style="padding:2rem; text-align:center; color:#94a3b8">
                <div style="font-weight:700; color:#475569; margin-bottom:0.5rem">Bos Sayfa</div>
                <div style="font-size:0.9rem">Bu birimin urun ekleme modulu daha sonra eklenecek.</div>
            </div>
        `;
    },
    renderCncLibrary: (container, unitId) => {
        CncLibraryModule.render(container, unitId);
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
        readMany('cncCards', DB.data?.data?.cncCards, ['cncId']);
        readMany('sawCutOrders', DB.data?.data?.sawCutOrders, ['code']);
        readMany('extruderLibraryCards', DB.data?.data?.extruderLibraryCards, ['cardCode']);
        readMany('plexiPolishCards', DB.data?.data?.plexiPolishCards, ['cardCode']);
        readMany('pvdCards', DB.data?.data?.pvdCards, ['cardCode']);
        readMany('ibrahimPolishCards', DB.data?.data?.ibrahimPolishCards, ['cardCode']);
        readMany('eloksalCards', DB.data?.data?.eloksalCards, ['cardCode']);
        readMany('montageCards', DB.data?.data?.montageCards, ['cardCode', 'productCode']);
        readMany('workOrders', DB.data?.data?.workOrders, ['workOrderCode']);
        readMany('depoTransferTasks', DB.data?.data?.depoTransferTasks, ['taskCode']);
        readMany('freeExternalVendorJobs', DB.data?.data?.freeExternalVendorJobs, ['jobCode']);
        readMany('aluminumProfiles', DB.data?.data?.aluminumProfiles, ['code']);
        return bag;
    },

    isGlobalCodeTaken: (code, exclude = null) => {
        const normalized = String(code || '').trim().toUpperCase();
        if (!normalized) return false;
        return UnitModule.collectGlobalCodes(exclude).has(normalized);
    },

    getNextSawProcessCode: () => {
        if (!Array.isArray(DB.data.data.sawCutOrders)) DB.data.data.sawCutOrders = [];
        const max = DB.data.data.sawCutOrders.reduce((acc, row) => {
            const code = String(row?.code || '').trim().toUpperCase();
            const match = code.match(/^TST-(\d{6})$/);
            if (!match) return acc;
            return Math.max(acc, Number(match[1]));
        }, 0);
        let nextNum = max + 1;
        let candidate = `TST-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `TST-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },

    renderSawCut: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        const showForm = UnitModule.state.sawFormOpen || !!UnitModule.state.sawEditingId;

        const rows = (DB.data.data.sawCutOrders || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const nameQuery = String(UnitModule.state.sawSearchName || '').trim().toLowerCase();
        const codeQuery = String(UnitModule.state.sawSearchCode || '').trim().toLowerCase();
        const lenQuery = String(UnitModule.state.sawSearchLen || '').trim().toLowerCase();
        const filteredRows = rows.filter(r => {
            const processName = String(r.processName || '').toLowerCase();
            const code = String(r.code || '').toLowerCase();
            const len = String(r.lengthMm ?? r.cutLengthMm ?? '').toLowerCase();
            if (nameQuery && !processName.includes(nameQuery)) return false;
            if (codeQuery && !code.includes(codeQuery)) return false;
            if (lenQuery && !len.includes(lenQuery)) return false;
            return true;
        });

        const activeCode = UnitModule.state.sawDraftCode || UnitModule.getNextSawProcessCode();

        container.innerHTML = `
            <div style="margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:1rem">
                    <button onclick="UnitModule.handleLibraryBack('${unitId}')" style="background:white; padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; cursor:pointer"><i data-lucide="arrow-left" width="20"></i></button>
                    <div>
                        <h2 class="page-title" style="margin:0; display:flex; align-items:center; gap:0.5rem"><i data-lucide="scissors" color="#047857"></i> &#220;r&#252;n K&#252;t&#252;phanesi</h2>
                        <div style="font-size:0.875rem; color:#64748b">${unit?.name || 'TESTERE'} &#8226; Olcu kayitlari burada listelenir</div>
                    </div>
                </div>
                <button class="btn-primary" onclick="UnitModule.openSawForm()" style="height:42px; padding:0 1rem">${showForm ? 'vazgec' : 'urun ekle +'}</button>
            </div>

            <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.85rem; margin-bottom:0.85rem; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.65rem">
                <input id="saw_list_name" value="${UnitModule.state.sawSearchName || ''}" oninput="UnitModule.setSawListFilter('name', this.value, 'saw_list_name')" placeholder="islemin adi ile ara" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.6rem 0.75rem; font-weight:600; color:#334155">
                <input id="saw_list_len" value="${UnitModule.state.sawSearchLen || ''}" oninput="UnitModule.setSawListFilter('len', this.value, 'saw_list_len')" placeholder="olcu ile ara (mm)" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.6rem 0.75rem; font-weight:600; color:#334155">
                <input id="saw_list_code" value="${UnitModule.state.sawSearchCode || ''}" oninput="UnitModule.setSawListFilter('code', this.value, 'saw_list_code')" placeholder="islem ID ile ara" style="border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.6rem 0.75rem; font-weight:600; color:#334155">
            </div>

            ${showForm ? `
            <div id="saw_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-bottom:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem">
                    <div style="font-size:2rem; font-weight:700; color:#0f172a; line-height:1">yeni olcu olustur</div>
                    <div style="display:flex; gap:0.5rem">
                        ${UnitModule.state.sawEditingId ? `<button class="btn-sm btn-danger" onclick="UnitModule.deleteSawRow('${UnitModule.state.sawEditingId}')">sil</button>` : ''}
                        <button class="btn-sm" onclick="UnitModule.resetSawDraft(false)">vazgec</button>
                        <button class="btn-primary" onclick="UnitModule.saveSawCut('${unitId}')">kaydet</button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:0.8rem; align-items:end; margin-bottom:0.8rem">
                    <div>
                        <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">islemin adi</label>
                        <input value="${UnitModule.state.sawProcessName || ''}" oninput="UnitModule.state.sawProcessName=this.value" placeholder="islemin adi" style="width:100%; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.65rem 0.75rem; font-weight:600; color:#334155">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">olcu giriniz mm.</label>
                        <input type="number" min="1" step="0.01" value="${UnitModule.state.sawCutLen || ''}" oninput="UnitModule.state.sawCutLen=this.value" placeholder="olcu giriniz mm." style="width:100%; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.65rem 0.75rem; font-weight:600; color:#334155">
                    </div>
                    <div>
                        <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">pah kirma ekle +</label>
                        <div style="display:flex; gap:0.45rem">
                            <button class="btn-sm" onclick="UnitModule.setSawChamfer(true)" style="flex:1; padding:0.62rem 0.7rem; ${UnitModule.state.sawChamfer ? 'background:#0f172a; color:white; border-color:#0f172a' : ''}">VAR</button>
                            <button class="btn-sm" onclick="UnitModule.setSawChamfer(false)" style="flex:1; padding:0.62rem 0.7rem; ${!UnitModule.state.sawChamfer ? 'background:#e2e8f0; color:#0f172a; border-color:#cbd5e1' : ''}">YOK</button>
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">islem ID</label>
                        <input value="${activeCode}" readonly style="width:100%; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.65rem 0.75rem; font-family:monospace; font-weight:700; color:#334155; background:#f8fafc">
                    </div>
                </div>

                <div>
                    <label style="display:block; font-size:0.85rem; color:#64748b; margin-bottom:0.25rem">not ekle</label>
                    <textarea oninput="UnitModule.state.sawNote=this.value" placeholder="not ekle" style="width:100%; min-height:88px; border:1px solid #cbd5e1; border-radius:0.6rem; padding:0.7rem 0.8rem; color:#334155; font-weight:500">${UnitModule.state.sawNote || ''}</textarea>
                </div>
            </div>
            ` : ''}

            <div id="saw_list_block" class="card-table" style="margin-bottom:1rem">
                <table>
                    <thead>
                        <tr>
                            <th>ISLEM ADI</th>
                            <th style="text-align:center">OLCU (mm)</th>
                            <th style="text-align:center">PAH</th>
                            <th style="font-family:monospace">ID</th>
                            <th style="text-align:center">GORUNTULE</th>
                            <th style="text-align:center">DUZENLE</th>
                            <th style="text-align:center">SEC</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredRows.length === 0 ? `<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:#94a3b8">Kayit yok.</td></tr>` : filteredRows.map(r => `
                            <tr style="${UnitModule.getRoutePickerSelectedRowStyle(UnitModule.state.sawSelectedOrderId === r.id)}">
                                <td style="font-weight:700; color:#334155">${r.processName || '-'}</td>
                                <td style="text-align:center; font-weight:700; color:#0f766e">${r.lengthMm ?? r.cutLengthMm ?? '-'}</td>
                                <td style="text-align:center">
                                    <span style="display:inline-flex; padding:0.2rem 0.55rem; border-radius:999px; font-size:0.72rem; font-weight:700; border:1px solid ${r.hasChamfer ? '#16a34a' : '#cbd5e1'}; color:${r.hasChamfer ? '#166534' : '#475569'}; background:${r.hasChamfer ? '#dcfce7' : '#f8fafc'}">${r.hasChamfer ? 'VAR' : 'YOK'}</span>
                                </td>
                                <td style="font-family:monospace; color:#475569; font-weight:700">${r.code || '-'}</td>
                                <td style="text-align:center"><button class="btn-sm" onclick="UnitModule.previewSawRow('${r.id}')">goruntule</button></td>
                                <td style="text-align:center"><button class="btn-sm" onclick="UnitModule.editSawRow('${r.id}')">duzenle</button></td>
                                <td style="text-align:center"><button class="btn-sm" onclick="UnitModule.selectSawRow('${r.id}')" style="${UnitModule.getRoutePickerSelectButtonStyle(UnitModule.state.sawSelectedOrderId === r.id)}">sec</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    openSawForm: () => {
        if (UnitModule.state.sawFormOpen || UnitModule.state.sawEditingId) {
            UnitModule.resetSawDraft(false);
            return;
        }
        UnitModule.state.sawFormOpen = true;
        UnitModule.state.sawEditingId = null;
        UnitModule.state.sawDraftCode = UnitModule.getNextSawProcessCode();
        UI.renderCurrentPage();
    },

    setSawChamfer: (value) => {
        UnitModule.state.sawChamfer = !!value;
        UI.renderCurrentPage();
    },

    setSawListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.sawSearchName = value;
        if (field === 'code') UnitModule.state.sawSearchCode = value;
        if (field === 'len') UnitModule.state.sawSearchLen = value;
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

    selectSawRow: (id) => {
        UnitModule.state.sawSelectedOrderId = id;
        UI.renderCurrentPage();
    },

    previewSawRow: (id) => {
        const row = (DB.data.data.sawCutOrders || []).find(x => x.id === id);
        if (!row) return;
        Modal.open(`Islem Detay - ${UnitModule.escapeHtml(row.processName || '-')}`, `
            <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Islem adi</div>
                    <div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.processName || '-')}</div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">ID</div>
                    <div style="font-weight:700; color:#334155; font-family:monospace;">${UnitModule.escapeHtml(row.code || '-')}</div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Olcu (mm)</div>
                    <div style="font-weight:700; color:#334155;">${Number.isFinite(Number(row.lengthMm ?? row.cutLengthMm)) ? Number(row.lengthMm ?? row.cutLengthMm) : '-'}</div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Pah</div>
                    <div style="font-weight:700; color:#334155;">${row.hasChamfer ? 'VAR' : 'YOK'}</div>
                </div>
                <div style="grid-column:1/-1; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;">
                    <div style="font-size:0.72rem; color:#64748b;">Not</div>
                    <div style="color:#334155; white-space:pre-wrap;">${UnitModule.escapeHtml(row.note || '-')}</div>
                </div>
            </div>
        `, { maxWidth: '760px' });
    },

    editSawRow: (id) => {
        const row = (DB.data.data.sawCutOrders || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.sawFormOpen = true;
        UnitModule.state.sawEditingId = id;
        UnitModule.state.sawSelectedOrderId = id;
        UnitModule.state.sawProcessName = row.processName || '';
        UnitModule.state.sawCutLen = String(row.lengthMm ?? row.cutLengthMm ?? '');
        UnitModule.state.sawChamfer = !!row.hasChamfer;
        UnitModule.state.sawNote = row.note || '';
        UnitModule.state.sawDraftCode = row.code || UnitModule.getNextSawProcessCode();
        UI.renderCurrentPage();
    },

    deleteSawRow: async (id) => {
        if (!confirm('Kayit silinsin mi?')) return;
        DB.data.data.sawCutOrders = (DB.data.data.sawCutOrders || []).filter(x => x.id !== id);
        if (UnitModule.state.sawSelectedOrderId === id) UnitModule.state.sawSelectedOrderId = null;
        if (UnitModule.state.sawEditingId === id) UnitModule.resetSawDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },

    saveSawCut: async (unitId) => {
        const processName = String(UnitModule.state.sawProcessName || '').trim();
        const lenVal = Number(UnitModule.state.sawCutLen);
        const code = String(UnitModule.state.sawDraftCode || UnitModule.getNextSawProcessCode()).trim().toUpperCase();
        const note = String(UnitModule.state.sawNote || '').trim();

        if (!processName) return alert('Lutfen islemin adini giriniz.');
        if (!lenVal || lenVal <= 0) return alert('Lutfen olcu (mm) giriniz.');
        if (UnitModule.isGlobalCodeTaken(code, UnitModule.state.sawEditingId ? {
            collection: 'sawCutOrders',
            id: UnitModule.state.sawEditingId,
            field: 'code'
        } : null)) {
            return alert('Bu ID kodu zaten kullaniliyor. Tum kodlar benzersiz olmalidir.');
        }

        if (!Array.isArray(DB.data.data.sawCutOrders)) DB.data.data.sawCutOrders = [];
        const now = new Date().toISOString();

        if (UnitModule.state.sawEditingId) {
            const row = DB.data.data.sawCutOrders.find(x => x.id === UnitModule.state.sawEditingId);
            if (row) {
                row.processName = processName;
                row.lengthMm = lenVal;
                row.cutLengthMm = lenVal;
                row.hasChamfer = !!UnitModule.state.sawChamfer;
                row.note = note || '';
                row.code = code || UnitModule.getNextSawProcessCode();
                row.updated_at = now;
            }
            UnitModule.state.sawSelectedOrderId = UnitModule.state.sawEditingId;
        } else {
            const rowId = crypto.randomUUID();
            DB.data.data.sawCutOrders.push({
                id: rowId,
                unitId,
                processName,
                lengthMm: lenVal,
                cutLengthMm: lenVal,
                hasChamfer: !!UnitModule.state.sawChamfer,
                note: note || '',
                code,
                created_at: now
            });
            UnitModule.state.sawSelectedOrderId = rowId;
        }

        await DB.save();
        UnitModule.resetSawDraft(false);
    },

    resetSawDraft: (keepOpen = false) => {
        UnitModule.state.sawEditingId = null;
        UnitModule.state.sawProcessName = '';
        UnitModule.state.sawCutLen = '';
        UnitModule.state.sawChamfer = false;
        UnitModule.state.sawNote = '';
        UnitModule.state.sawDraftCode = keepOpen ? UnitModule.getNextSawProcessCode() : '';
        UnitModule.state.sawFormOpen = !!keepOpen;
        UI.renderCurrentPage();
    },
    renderExtruderLibrary: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.extruderLibraryCards)) DB.data.data.extruderLibraryCards = [];
        if (!DB.data.data.unitColors) DB.data.data.unitColors = {};
        if (!DB.data.data.unitColors[unitId]) DB.data.data.unitColors[unitId] = ['Seffaf', 'Beyaz', 'Siyah', 'Antrasit'];
        const colors = DB.data.data.unitColors[unitId] || [];
        const showForm = UnitModule.state.extruderFormOpen || !!UnitModule.state.extruderEditingId;

        const cards = (DB.data.data.extruderLibraryCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qDia = String(UnitModule.state.extruderSearchDia || '').trim();
        const qLen = String(UnitModule.state.extruderSearchLen || '').trim();
        const qColor = String(UnitModule.state.extruderSearchColor || '').trim().toLowerCase();
        const qKind = String(UnitModule.state.extruderSearchKind || '').trim().toUpperCase();
        const qCode = String(UnitModule.state.extruderSearchCode || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const diaOk = !qDia || String(row.diameterMm ?? '').trim() === qDia;
            const lenOk = !qLen || String(row.lengthMm ?? '').trim() === qLen;
            const colorOk = !qColor || String(row.color || '').toLowerCase().includes(qColor);
            const kindOk = !qKind || String(row.kind || '').toUpperCase() === qKind;
            const codeOk = !qCode
                || String(row.cardCode || '').toLowerCase().includes(qCode)
                || String(row.id || '').toLowerCase().includes(qCode);
            return diaOk && lenOk && colorOk && kindOk && codeOk;
        });

        const editing = UnitModule.state.extruderEditingId
            ? cards.find(x => x.id === UnitModule.state.extruderEditingId)
            : null;
        const draftCode = editing?.cardCode || UnitModule.generateExtruderCardCode();
        const draftType = String(UnitModule.state.extruderDraftType || 'ROD');
        const colorTypeOptions = UnitModule.getSharedColorTypeOptions();
        const activeColorType = UnitModule.normalizeSharedColorType(UnitModule.state.extruderDraftColorType);
        UnitModule.state.extruderDraftColorType = activeColorType;
        const availableColors = activeColorType
            ? UnitModule.getSharedColorItemsWithFallback(activeColorType, colors)
            : [];
        if (UnitModule.state.extruderDraftColor) {
            const exists = availableColors.some(row =>
                String(row.name || '').toLowerCase() === String(UnitModule.state.extruderDraftColor || '').toLowerCase()
            );
            if (!exists) {
                availableColors.unshift({
                    id: '',
                    name: String(UnitModule.state.extruderDraftColor || ''),
                    code: String(UnitModule.state.extruderDraftColorCode || '').trim().toUpperCase(),
                    type: activeColorType || ''
                });
            }
        }
        const typeLabel = (kind) => kind === 'PIPE' ? 'BORU' : (kind === 'PROFILE' ? 'OZEL PROFIL' : 'CUBUK');

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.handleLibraryBack('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Ekstruder Islem Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''}</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.toggleExtruderForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Islem ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="ext_search_dia" value="${UnitModule.escapeHtml(UnitModule.state.extruderSearchDia || '')}" oninput="UnitModule.setExtruderListFilter('dia', this.value, 'ext_search_dia')" placeholder="cap ile ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:190px; font-weight:600;">
                        <input id="ext_search_len" value="${UnitModule.escapeHtml(UnitModule.state.extruderSearchLen || '')}" oninput="UnitModule.setExtruderListFilter('len', this.value, 'ext_search_len')" placeholder="boy ile ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:190px; font-weight:600;">
                        <input id="ext_search_color" value="${UnitModule.escapeHtml(UnitModule.state.extruderSearchColor || '')}" oninput="UnitModule.setExtruderListFilter('color', this.value, 'ext_search_color')" placeholder="renk ile ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:190px; font-weight:600;">
                        <select id="ext_search_kind" onchange="UnitModule.setExtruderListFilter('kind', this.value, 'ext_search_kind')" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:190px; font-weight:600; background:white;">
                            <option value="">cinsi ile ara</option>
                            <option value="ROD" ${String(UnitModule.state.extruderSearchKind || '') === 'ROD' ? 'selected' : ''}>CUBUK</option>
                            <option value="PIPE" ${String(UnitModule.state.extruderSearchKind || '') === 'PIPE' ? 'selected' : ''}>BORU</option>
                            <option value="PROFILE" ${String(UnitModule.state.extruderSearchKind || '') === 'PROFILE' ? 'selected' : ''}>OZEL PROFIL</option>
                        </select>
                        <input id="ext_search_code" value="${UnitModule.escapeHtml(UnitModule.state.extruderSearchCode || '')}" oninput="UnitModule.setExtruderListFilter('code', this.value, 'ext_search_code')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="ext_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Tip</th>
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:center;">Cap</th>
                                    <th style="padding:0.65rem; text-align:center;">Kalinlik</th>
                                    <th style="padding:0.65rem; text-align:center;">Boy</th>
                                    <th style="padding:0.65rem; text-align:center;">Renk</th>
                                    <th style="padding:0.65rem; text-align:center;">Ozellik</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Goruntule</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="11" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.getRoutePickerSelectedRowStyle(UnitModule.state.extruderSelectedId === row.id)}">
                                        <td style="padding:0.65rem;"><span style="font-size:0.72rem; font-weight:700; color:#475569; background:#f8fafc; border:1px solid #e2e8f0; padding:0.25rem 0.55rem; border-radius:0.5rem">${typeLabel(row.kind)}</span></td>
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center;">${Number.isFinite(Number(row.diameterMm)) ? Number(row.diameterMm) : '-'}</td>
                                        <td style="padding:0.65rem; text-align:center;">${row.kind === 'PIPE' && Number.isFinite(Number(row.thicknessMm)) ? Number(row.thicknessMm) : '-'}</td>
                                        <td style="padding:0.65rem; text-align:center; font-weight:700; color:#0f766e;">${Number.isFinite(Number(row.lengthMm)) ? Number(row.lengthMm) : '-'}</td>
                                        <td style="padding:0.65rem; text-align:center;">${UnitModule.escapeHtml(row.color || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center;">${row.isBubble ? '<span style="border:1px solid #93c5fd; background:#dbeafe; color:#1d4ed8; border-radius:999px; padding:0.15rem 0.5rem; font-size:0.72rem; font-weight:700;">Kabarcikli</span>' : '-'}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.previewExtruderRow('${row.id}')" class="btn-sm">goruntule</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.editExtruderRow('${row.id}')" class="btn-sm">duzenle</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.selectExtruderRow('${row.id}')" class="btn-sm" style="${UnitModule.getRoutePickerSelectButtonStyle(UnitModule.state.extruderSelectedId === row.id)}">sec</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="ext_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Urun duzenle' : 'Yeni urun olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                ${editing ? `<button onclick="UnitModule.deleteExtruderRow('${UnitModule.state.extruderEditingId}')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">Sil</button>` : ''}
                                <button onclick="UnitModule.resetExtruderDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.saveExtruderRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                            <button onclick="UnitModule.setExtruderDraftType('ROD')" style="border:1px solid ${draftType === 'ROD' ? '#2563eb' : '#cbd5e1'}; background:${draftType === 'ROD' ? '#eff6ff' : 'white'}; color:${draftType === 'ROD' ? '#1d4ed8' : '#334155'}; border-radius:0.55rem; padding:0.4rem 0.8rem; font-weight:700; cursor:pointer;">CUBUK</button>
                            <button onclick="UnitModule.setExtruderDraftType('PIPE')" style="border:1px solid ${draftType === 'PIPE' ? '#2563eb' : '#cbd5e1'}; background:${draftType === 'PIPE' ? '#eff6ff' : 'white'}; color:${draftType === 'PIPE' ? '#1d4ed8' : '#334155'}; border-radius:0.55rem; padding:0.4rem 0.8rem; font-weight:700; cursor:pointer;">BORU</button>
                            <button onclick="UnitModule.setExtruderDraftType('PROFILE')" style="border:1px solid ${draftType === 'PROFILE' ? '#2563eb' : '#cbd5e1'}; background:${draftType === 'PROFILE' ? '#eff6ff' : 'white'}; color:${draftType === 'PROFILE' ? '#1d4ed8' : '#334155'}; border-radius:0.55rem; padding:0.4rem 0.8rem; font-weight:700; cursor:pointer;">OZEL PROFIL</button>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            ${draftType === 'PROFILE' ? `
                                <div style="grid-column:span 4;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">profil adi *</label>
                                    <input id="ext_name" value="${UnitModule.escapeHtml(UnitModule.state.extruderDraftName || '')}" oninput="UnitModule.state.extruderDraftName=this.value" placeholder="40x40 kare profil" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                </div>
                            ` : `
                                <div style="grid-column:span 2;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">cap (mm) *</label>
                                    <input id="ext_dia" type="number" min="0" value="${UnitModule.escapeHtml(String(UnitModule.state.extruderDraftDia || ''))}" oninput="UnitModule.state.extruderDraftDia=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                </div>
                            `}
                            ${draftType === 'PIPE' ? `
                                <div style="grid-column:span 2;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kalinlik (mm) *</label>
                                    <input id="ext_thick" type="number" min="0" value="${UnitModule.escapeHtml(String(UnitModule.state.extruderDraftThick || ''))}" oninput="UnitModule.state.extruderDraftThick=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                                </div>
                            ` : ''}
                            <div style="grid-column:span 2;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">boy (mm) *</label>
                                <input id="ext_len" type="number" min="0" value="${UnitModule.escapeHtml(String(UnitModule.state.extruderDraftLen || ''))}" oninput="UnitModule.state.extruderDraftLen=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 4; width:100%; max-width:440px; justify-self:start;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kategori / renk *</label>
                                <div style="height:38px; border:1px solid #cbd5e1; border-radius:0.75rem; overflow:hidden; display:grid; grid-template-columns:42% 58%;">
                                    <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                                        <select id="ext_color_type" onchange="UnitModule.setExtruderColorType(this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:#334155;">
                                            <option value="">kategori sec</option>
                                            ${colorTypeOptions.map(opt => `<option value="${opt.id}" ${activeColorType === opt.id ? 'selected' : ''}>${UnitModule.escapeHtml(opt.label)}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div style="background:${activeColorType ? 'white' : '#f8fafc'};">
                                        <select id="ext_color" ${activeColorType ? '' : 'disabled'} onchange="UnitModule.state.extruderDraftColor=this.value; UnitModule.state.extruderDraftColorCode=this.options[this.selectedIndex]?.dataset?.code || '';" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:${activeColorType ? '#111827' : '#94a3b8'};">
                                            <option value="">renk sec</option>
                                            ${availableColors.map(c => `<option data-code="${UnitModule.escapeHtml(c.code || '')}" value="${UnitModule.escapeHtml(c.name)}" ${String(UnitModule.state.extruderDraftColor || '') === String(c.name) ? 'selected' : ''}>${UnitModule.escapeHtml(c.name)}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style="grid-column:span 2;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="ext_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                        </div>

                        ${draftType === 'ROD' ? `
                            <div style="margin-top:0.7rem;">
                                <label style="display:inline-flex; align-items:center; gap:0.45rem; font-size:0.84rem; color:#334155; font-weight:700;">
                                    <input id="ext_bubble" type="checkbox" ${UnitModule.state.extruderDraftBubble ? 'checked' : ''} onchange="UnitModule.state.extruderDraftBubble=this.checked">
                                    kabarcikli
                                </label>
                            </div>
                        ` : ''}

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="ext_note" rows="3" oninput="UnitModule.state.extruderDraftNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.extruderDraftNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // UI rule: form always opens above list rows.
        if (showForm) {
            const formEl = document.getElementById('ext_form_block');
            const listEl = document.getElementById('ext_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setExtruderListFilter: (field, value, focusId) => {
        if (field === 'dia') UnitModule.state.extruderSearchDia = value || '';
        if (field === 'len') UnitModule.state.extruderSearchLen = value || '';
        if (field === 'color') UnitModule.state.extruderSearchColor = value || '';
        if (field === 'kind') UnitModule.state.extruderSearchKind = String(value || '').toUpperCase();
        if (field === 'code') UnitModule.state.extruderSearchCode = value || '';
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
    toggleExtruderForm: () => {
        if (UnitModule.state.extruderFormOpen || UnitModule.state.extruderEditingId) {
            UnitModule.resetExtruderDraft(false);
            return;
        }
        UnitModule.state.extruderFormOpen = true;
        UnitModule.state.extruderEditingId = null;
        UnitModule.state.extruderDraftType = 'ROD';
        UnitModule.state.extruderDraftName = '';
        UnitModule.state.extruderDraftDia = '';
        UnitModule.state.extruderDraftThick = '';
        UnitModule.state.extruderDraftLen = '';
        UnitModule.state.extruderDraftColorType = '';
        UnitModule.state.extruderDraftColor = '';
        UnitModule.state.extruderDraftColorCode = '';
        UnitModule.state.extruderDraftBubble = false;
        UnitModule.state.extruderDraftNote = '';
        UI.renderCurrentPage();
    },
    setExtruderDraftType: (kind) => {
        UnitModule.state.extruderDraftType = kind;
        if (kind !== 'ROD') UnitModule.state.extruderDraftBubble = false;
        if (kind !== 'PIPE') UnitModule.state.extruderDraftThick = '';
        UI.renderCurrentPage();
    },
    selectExtruderRow: (id) => {
        UnitModule.state.extruderSelectedId = id;
        UI.renderCurrentPage();
    },
    previewExtruderRow: (id) => {
        const row = (DB.data.data.extruderLibraryCards || []).find(x => x.id === id);
        if (!row) return;
        const typeLabel = (kind) => kind === 'PIPE' ? 'BORU' : (kind === 'PROFILE' ? 'OZEL PROFIL' : 'CUBUK');
        Modal.open(`Kart Detay - ${UnitModule.escapeHtml(row.productName || '-')}`, `
            <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Tip</div><div style="font-weight:700; color:#334155;">${typeLabel(row.kind)}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">ID</div><div style="font-weight:700; color:#334155; font-family:monospace;">${UnitModule.escapeHtml(row.cardCode || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Urun adi</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Renk</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.color || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Cap (mm)</div><div style="font-weight:700; color:#334155;">${Number.isFinite(Number(row.diameterMm)) ? Number(row.diameterMm) : '-'}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Kalinlik (mm)</div><div style="font-weight:700; color:#334155;">${Number.isFinite(Number(row.thicknessMm)) ? Number(row.thicknessMm) : '-'}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Boy (mm)</div><div style="font-weight:700; color:#334155;">${Number.isFinite(Number(row.lengthMm)) ? Number(row.lengthMm) : '-'}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Kabarcik</div><div style="font-weight:700; color:#334155;">${row.isBubble ? 'VAR' : 'YOK'}</div></div>
                <div style="grid-column:1/-1; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Not</div><div style="color:#334155; white-space:pre-wrap;">${UnitModule.escapeHtml(row.note || '-')}</div></div>
            </div>
        `, { maxWidth: '760px' });
    },
    editExtruderRow: (id) => {
        const row = (DB.data.data.extruderLibraryCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.extruderFormOpen = true;
        UnitModule.state.extruderEditingId = id;
        UnitModule.state.extruderSelectedId = id;
        UnitModule.state.extruderDraftType = row.kind || 'ROD';
        UnitModule.state.extruderDraftName = row.productName || '';
        UnitModule.state.extruderDraftDia = Number.isFinite(Number(row.diameterMm)) ? String(row.diameterMm) : '';
        UnitModule.state.extruderDraftThick = Number.isFinite(Number(row.thicknessMm)) ? String(row.thicknessMm) : '';
        UnitModule.state.extruderDraftLen = Number.isFinite(Number(row.lengthMm)) ? String(row.lengthMm) : '';
        UnitModule.state.extruderDraftColorType = UnitModule.resolveSharedColorTypeForRow(row, '');
        UnitModule.state.extruderDraftColor = row.color || '';
        UnitModule.state.extruderDraftColorCode = String(row.colorCode || '').trim().toUpperCase();
        UnitModule.state.extruderDraftBubble = !!row.isBubble;
        UnitModule.state.extruderDraftNote = row.note || '';
        UI.renderCurrentPage();
    },
    saveExtruderRow: async (unitId) => {
        const kind = String(UnitModule.state.extruderDraftType || 'ROD');
        const name = String(UnitModule.state.extruderDraftName || '').trim();
        const diaRaw = String(UnitModule.state.extruderDraftDia || '').trim();
        const thickRaw = String(UnitModule.state.extruderDraftThick || '').trim();
        const lenRaw = String(UnitModule.state.extruderDraftLen || '').trim();
        const colorType = UnitModule.normalizeSharedColorType(UnitModule.state.extruderDraftColorType || '');
        const color = String(UnitModule.state.extruderDraftColor || '').trim();
        const colorCode = String(UnitModule.state.extruderDraftColorCode || '').trim().toUpperCase();
        const isBubble = !!UnitModule.state.extruderDraftBubble;
        const note = String(UnitModule.state.extruderDraftNote || '').trim();

        const dia = diaRaw === '' ? null : Number(diaRaw);
        const thick = thickRaw === '' ? null : Number(thickRaw);
        const len = lenRaw === '' ? null : Number(lenRaw);

        if (!Number.isFinite(len) || Number(len) <= 0) {
            alert('Boy (mm) zorunlu ve 0dan buyuk olmali.');
            return;
        }
        if (!colorType) {
            alert('Renk kategorisi seciniz.');
            return;
        }
        if (!color) {
            alert('Renk seciniz.');
            return;
        }

        if (kind === 'PROFILE') {
            if (!name) {
                alert('Ozel profil adi zorunlu.');
                return;
            }
        } else if (kind === 'ROD') {
            if (!Number.isFinite(dia) || Number(dia) <= 0) {
                alert('Cubuk icin cap zorunlu.');
                return;
            }
        } else if (kind === 'PIPE') {
            if (!Number.isFinite(dia) || Number(dia) <= 0) {
                alert('Boru icin cap zorunlu.');
                return;
            }
            if (!Number.isFinite(thick) || Number(thick) <= 0) {
                alert('Boru icin kalinlik zorunlu.');
                return;
            }
        }

        const productName = kind === 'PROFILE'
            ? name
            : `${kind === 'PIPE' ? 'O' + dia + ' Boru' : 'O' + dia + ' Cubuk'}`;

        if (!Array.isArray(DB.data.data.extruderLibraryCards)) DB.data.data.extruderLibraryCards = [];
        const all = DB.data.data.extruderLibraryCards;
        const now = new Date().toISOString();

        if (UnitModule.state.extruderEditingId) {
            const row = all.find(x => x.id === UnitModule.state.extruderEditingId);
            if (!row) return;
            row.kind = kind;
            row.productName = productName;
            row.diameterMm = Number.isFinite(dia) ? Number(dia) : null;
            row.thicknessMm = kind === 'PIPE' && Number.isFinite(thick) ? Number(thick) : null;
            row.lengthMm = Number(len);
            row.colorType = colorType;
            row.color = color;
            row.colorCode = colorCode;
            row.isBubble = kind === 'ROD' ? isBubble : false;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.extruderSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                cardCode: UnitModule.generateExtruderCardCode(),
                kind,
                productName,
                diameterMm: Number.isFinite(dia) ? Number(dia) : null,
                thicknessMm: kind === 'PIPE' && Number.isFinite(thick) ? Number(thick) : null,
                lengthMm: Number(len),
                colorType,
                color,
                colorCode,
                isBubble: kind === 'ROD' ? isBubble : false,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.extruderSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetExtruderDraft(false);
    },
    deleteExtruderRow: async (id) => {
        const row = (DB.data.data.extruderLibraryCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.extruderLibraryCards = (DB.data.data.extruderLibraryCards || []).filter(x => x.id !== id);
        if (UnitModule.state.extruderSelectedId === id) UnitModule.state.extruderSelectedId = null;
        if (UnitModule.state.extruderEditingId === id) UnitModule.resetExtruderDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetExtruderDraft: (keepOpen = false) => {
        UnitModule.state.extruderFormOpen = !!keepOpen;
        UnitModule.state.extruderEditingId = null;
        UnitModule.state.extruderDraftType = 'ROD';
        UnitModule.state.extruderDraftName = '';
        UnitModule.state.extruderDraftDia = '';
        UnitModule.state.extruderDraftThick = '';
        UnitModule.state.extruderDraftLen = '';
        UnitModule.state.extruderDraftColorType = '';
        UnitModule.state.extruderDraftColor = '';
        UnitModule.state.extruderDraftColorCode = '';
        UnitModule.state.extruderDraftBubble = false;
        UnitModule.state.extruderDraftNote = '';
        UI.renderCurrentPage();
    },
    generateExtruderCardCode: () => {
        const all = DB.data.data.extruderLibraryCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(/^EKS-(\d{1,12})$/);
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `EKS-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `EKS-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    renderPlexiLibrary: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.plexiPolishCards)) DB.data.data.plexiPolishCards = [];
        const showForm = UnitModule.state.plexiFormOpen || !!UnitModule.state.plexiEditingId;
        const canDelete = UnitModule.canManageUnitCodes();

        const cards = (DB.data.data.plexiPolishCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qName = String(UnitModule.state.plexiSearchName || '').trim().toLowerCase();
        const qId = String(UnitModule.state.plexiSearchId || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const nameOk = !qName || String(row.processName || '').toLowerCase().includes(qName);
            const idOk = !qId
                || String(row.cardCode || '').toLowerCase().includes(qId)
                || String(row.id || '').toLowerCase().includes(qId);
            return nameOk && idOk;
        });

        const editing = UnitModule.state.plexiEditingId
            ? cards.find(x => x.id === UnitModule.state.plexiEditingId)
            : null;
        const draftCode = editing?.cardCode || UnitModule.generatePlexiCardCode();

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.handleLibraryBack('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Islem Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''} - Islem envanteri</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.togglePlexiForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Yeni islem ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="plexi_search_name" value="${UnitModule.escapeHtml(UnitModule.state.plexiSearchName || '')}" oninput="UnitModule.setPlexiListFilter('name', this.value, 'plexi_search_name')" placeholder="islem adi ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                        <input id="plexi_search_id" value="${UnitModule.escapeHtml(UnitModule.state.plexiSearchId || '')}" oninput="UnitModule.setPlexiListFilter('id', this.value, 'plexi_search_id')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="plexi_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Islem adi</th>
                                    <th style="padding:0.65rem; text-align:center;">Ates</th>
                                    <th style="padding:0.65rem; text-align:center;">Firca</th>
                                    <th style="padding:0.65rem; text-align:center;">Firin (dk)</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Goruntule</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.getRoutePickerSelectedRowStyle(UnitModule.state.plexiSelectedId === row.id)}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.processName || '-')}</td>
                                        <td style="padding:0.65rem; text-align:center;">
                                            <span style="display:inline-block; min-width:48px; border:1px solid ${row.firePolish ? '#22c55e' : '#cbd5e1'}; background:${row.firePolish ? '#dcfce7' : 'white'}; color:${row.firePolish ? '#166534' : '#64748b'}; border-radius:999px; padding:0.15rem 0.5rem; font-size:0.73rem; font-weight:700;">${row.firePolish ? 'Var' : '-'}</span>
                                        </td>
                                        <td style="padding:0.65rem; text-align:center;">
                                            <span style="display:inline-block; min-width:48px; border:1px solid ${row.brushPolish ? '#22c55e' : '#cbd5e1'}; background:${row.brushPolish ? '#dcfce7' : 'white'}; color:${row.brushPolish ? '#166534' : '#64748b'}; border-radius:999px; padding:0.15rem 0.5rem; font-size:0.73rem; font-weight:700;">${row.brushPolish ? 'Var' : '-'}</span>
                                        </td>
                                        <td style="padding:0.65rem; text-align:center; font-weight:700; color:#0f766e;">${Number.isFinite(Number(row.ovenMinutes)) ? Number(row.ovenMinutes) : '-'}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.previewPlexiRow('${row.id}')" class="btn-sm">goruntule</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.editPlexiRow('${row.id}')" class="btn-sm">duzenle</button>
                                        </td>
                                        <td style="padding:0.65rem; text-align:right;">
                                            <button onclick="UnitModule.selectPlexiRow('${row.id}')" class="btn-sm" style="${UnitModule.getRoutePickerSelectButtonStyle(UnitModule.state.plexiSelectedId === row.id)}">sec</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="plexi_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Islem duzenle' : 'Yeni islem olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                ${editing ? `<button onclick="UnitModule.deletePlexiRow('${UnitModule.state.plexiEditingId}')" class="btn-sm" ${canDelete ? '' : 'disabled'} style="${canDelete ? 'color:#b91c1c; border-color:#fecaca; background:#fef2f2;' : 'opacity:0.45; cursor:not-allowed;'}">Sil</button>` : ''}
                                <button onclick="UnitModule.resetPlexiDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.savePlexiRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 7;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">islem adi (opsiyonel)</label>
                                <input id="plexi_process_name" value="${UnitModule.escapeHtml(UnitModule.state.plexiProcessName || '')}" oninput="UnitModule.state.plexiProcessName=this.value" placeholder="atesle parlatma" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="plexi_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                            <div style="grid-column:span 2;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">firin (dk)</label>
                                <input id="plexi_oven_min" type="number" min="0" value="${UnitModule.escapeHtml(String(UnitModule.state.plexiOvenMinutes || ''))}" oninput="UnitModule.state.plexiOvenMinutes=this.value" placeholder="dk" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                            </div>
                        </div>

                        <div style="display:flex; gap:0.55rem; margin-top:0.75rem; flex-wrap:wrap;">
                            <button onclick="UnitModule.togglePlexiFlag('fire')" style="border:1px solid ${UnitModule.state.plexiUseFire ? '#22c55e' : '#cbd5e1'}; background:${UnitModule.state.plexiUseFire ? '#dcfce7' : 'white'}; color:${UnitModule.state.plexiUseFire ? '#166534' : '#334155'}; border-radius:0.55rem; padding:0.45rem 0.8rem; font-weight:700; cursor:pointer;">atesle polisaj ${UnitModule.state.plexiUseFire ? 'AKTIF' : '+'}</button>
                            <button onclick="UnitModule.togglePlexiFlag('brush')" style="border:1px solid ${UnitModule.state.plexiUseBrush ? '#22c55e' : '#cbd5e1'}; background:${UnitModule.state.plexiUseBrush ? '#dcfce7' : 'white'}; color:${UnitModule.state.plexiUseBrush ? '#166534' : '#334155'}; border-radius:0.55rem; padding:0.45rem 0.8rem; font-weight:700; cursor:pointer;">firca ile polisaj ${UnitModule.state.plexiUseBrush ? 'AKTIF' : '+'}</button>
                        </div>

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="plexi_note" rows="4" oninput="UnitModule.state.plexiNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.plexiNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // UI rule: form always opens above list rows.
        if (showForm) {
            const formEl = document.getElementById('plexi_form_block');
            const listEl = document.getElementById('plexi_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setPlexiListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.plexiSearchName = value || '';
        if (field === 'id') UnitModule.state.plexiSearchId = value || '';
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
    togglePlexiForm: () => {
        if (UnitModule.state.plexiFormOpen || UnitModule.state.plexiEditingId) {
            UnitModule.resetPlexiDraft(false);
            return;
        }
        UnitModule.state.plexiFormOpen = true;
        UnitModule.state.plexiEditingId = null;
        UnitModule.state.plexiProcessName = '';
        UnitModule.state.plexiUseFire = false;
        UnitModule.state.plexiUseBrush = false;
        UnitModule.state.plexiOvenMinutes = '';
        UnitModule.state.plexiNote = '';
        UI.renderCurrentPage();
    },
    togglePlexiFlag: (flag) => {
        if (flag === 'fire') UnitModule.state.plexiUseFire = !UnitModule.state.plexiUseFire;
        if (flag === 'brush') UnitModule.state.plexiUseBrush = !UnitModule.state.plexiUseBrush;
        UI.renderCurrentPage();
    },
    selectPlexiRow: (id) => {
        UnitModule.state.plexiSelectedId = id;
        UI.renderCurrentPage();
    },
    previewPlexiRow: (id) => {
        const row = (DB.data.data.plexiPolishCards || []).find(x => x.id === id);
        if (!row) return;
        Modal.open(`Kart Detay - ${UnitModule.escapeHtml(row.processName || '-')}`, `
            <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Islem adi</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.processName || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">ID</div><div style="font-weight:700; color:#334155; font-family:monospace;">${UnitModule.escapeHtml(row.cardCode || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Ates polisaj</div><div style="font-weight:700; color:#334155;">${row.firePolish ? 'VAR' : 'YOK'}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Firca polisaj</div><div style="font-weight:700; color:#334155;">${row.brushPolish ? 'VAR' : 'YOK'}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Firin (dk)</div><div style="font-weight:700; color:#334155;">${Number.isFinite(Number(row.ovenMinutes)) ? Number(row.ovenMinutes) : '-'}</div></div>
                <div style="grid-column:1/-1; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Not</div><div style="color:#334155; white-space:pre-wrap;">${UnitModule.escapeHtml(row.note || '-')}</div></div>
            </div>
        `, { maxWidth: '760px' });
    },
    editPlexiRow: (id) => {
        const row = (DB.data.data.plexiPolishCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.plexiFormOpen = true;
        UnitModule.state.plexiEditingId = id;
        UnitModule.state.plexiSelectedId = id;
        UnitModule.state.plexiProcessName = row.processName || '';
        UnitModule.state.plexiUseFire = !!row.firePolish;
        UnitModule.state.plexiUseBrush = !!row.brushPolish;
        UnitModule.state.plexiOvenMinutes = Number.isFinite(Number(row.ovenMinutes)) ? String(row.ovenMinutes) : '';
        UnitModule.state.plexiNote = row.note || '';
        UI.renderCurrentPage();
    },
    savePlexiRow: async (unitId) => {
        const processName = String(UnitModule.state.plexiProcessName || '').trim();
        const firePolish = !!UnitModule.state.plexiUseFire;
        const brushPolish = !!UnitModule.state.plexiUseBrush;
        const ovenRaw = String(UnitModule.state.plexiOvenMinutes || '').trim();
        const note = String(UnitModule.state.plexiNote || '').trim();

        let ovenMinutes = null;
        if (ovenRaw !== '') {
            ovenMinutes = Number(ovenRaw);
            if (!Number.isFinite(ovenMinutes) || ovenMinutes < 0) {
                alert('Firin suresi sayi olmali.');
                return;
            }
        }

        if (!processName && !firePolish && !brushPolish && ovenMinutes === null && !note) {
            alert('En az bir alan doldurun.');
            return;
        }

        if (!Array.isArray(DB.data.data.plexiPolishCards)) DB.data.data.plexiPolishCards = [];
        const all = DB.data.data.plexiPolishCards;
        const now = new Date().toISOString();

        if (UnitModule.state.plexiEditingId) {
            const row = all.find(x => x.id === UnitModule.state.plexiEditingId);
            if (!row) return;
            row.processName = processName || '';
            row.firePolish = firePolish;
            row.brushPolish = brushPolish;
            row.ovenMinutes = ovenMinutes;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.plexiSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                cardCode: UnitModule.generatePlexiCardCode(),
                processName: processName || '',
                firePolish,
                brushPolish,
                ovenMinutes,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.plexiSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetPlexiDraft(false);
    },
    deletePlexiRow: async (id) => {
        if (!UnitModule.canManageUnitCodes()) {
            alert('Silme yetkisi sadece birim admin veya super admin icindir.');
            return;
        }
        const row = (DB.data.data.plexiPolishCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.plexiPolishCards = (DB.data.data.plexiPolishCards || []).filter(x => x.id !== id);
        if (UnitModule.state.plexiSelectedId === id) UnitModule.state.plexiSelectedId = null;
        if (UnitModule.state.plexiEditingId === id) UnitModule.resetPlexiDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetPlexiDraft: (keepOpen = false) => {
        UnitModule.state.plexiFormOpen = !!keepOpen;
        UnitModule.state.plexiEditingId = null;
        UnitModule.state.plexiProcessName = '';
        UnitModule.state.plexiUseFire = false;
        UnitModule.state.plexiUseBrush = false;
        UnitModule.state.plexiOvenMinutes = '';
        UnitModule.state.plexiNote = '';
        UI.renderCurrentPage();
    },
    generatePlexiCardCode: () => {
        const all = DB.data.data.plexiPolishCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(/^PLSJ-(\d{1,12})$/);
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `PLSJ-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `PLSJ-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    getSharedColorTypeOptions: () => ([
        { id: 'eloksal', label: 'Eloksal Renkleri' },
        { id: 'pvd', label: 'Pvd krom kaplama' },
        { id: 'boya', label: 'Elektrostatik boya' },
        { id: 'pleksi', label: 'Pleksi renk' }
    ]),
    normalizeSharedColorType: (value) => {
        const text = String(value || '').trim().toLowerCase();
        if (!text) return '';
        if (text.includes('eloks') || text.includes('aloks')) return 'eloksal';
        if (text.includes('pvd')) return 'pvd';
        if (text.includes('boya') || text.includes('elektrostatik') || text.includes('statik')) return 'boya';
        if (text.includes('pleks')) return 'pleksi';
        return '';
    },
    getColorCodePrefixForType: (type) => {
        const normalized = UnitModule.normalizeSharedColorType(type);
        if (normalized === 'eloksal') return 'ELO';
        if (normalized === 'pvd') return 'PVD';
        if (normalized === 'boya') return 'BOY';
        if (normalized === 'pleksi') return 'PLX';
        return '';
    },
    inferColorTypeFromCode: (code) => {
        const raw = String(code || '').trim().toUpperCase();
        if (raw.startsWith('CLR-ELO-')) return 'eloksal';
        if (raw.startsWith('CLR-PVD-')) return 'pvd';
        if (raw.startsWith('CLR-BOY-')) return 'boya';
        if (raw.startsWith('CLR-PLX-')) return 'pleksi';
        return '';
    },
    getSharedColorLibraryItems: (type) => {
        const normalized = UnitModule.normalizeSharedColorType(type);
        const list = Array.isArray(DB.data?.data?.colorLibrary) ? DB.data.data.colorLibrary : [];
        if (!normalized) return [];
        const rows = list
            .filter(row => UnitModule.normalizeSharedColorType(row?.type) === normalized)
            .map(row => ({
                id: String(row?.id || ''),
                name: String(row?.name || '').trim(),
                code: String(row?.code || '').trim().toUpperCase(),
                type: normalized
            }))
            .filter(row => row.name);

        const uniq = new Map();
        rows.forEach(row => {
            const key = row.name.toLowerCase();
            if (!uniq.has(key)) uniq.set(key, row);
        });
        return Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    },
    getSharedColorItemsWithFallback: (type, fallbackNames = []) => {
        const normalized = UnitModule.normalizeSharedColorType(type);
        if (!normalized) return [];
        const primary = UnitModule.getSharedColorLibraryItems(normalized);
        if (primary.length > 0) return primary;
        return (fallbackNames || [])
            .map(name => ({ id: '', name: String(name || '').trim(), code: '', type: normalized }))
            .filter(item => item.name);
    },
    resolveSharedColorTypeForRow: (row, defaultType = '') => {
        const fromRow = UnitModule.normalizeSharedColorType(row?.colorType || '');
        if (fromRow) return fromRow;
        const fromCode = UnitModule.inferColorTypeFromCode(row?.colorCode || '');
        if (fromCode) return fromCode;

        const colorName = String(row?.color || '').trim().toLowerCase();
        if (!colorName) return UnitModule.normalizeSharedColorType(defaultType || '');
        const list = Array.isArray(DB.data?.data?.colorLibrary) ? DB.data.data.colorLibrary : [];
        const matches = list.filter(item => String(item?.name || '').trim().toLowerCase() === colorName);
        const types = Array.from(new Set(matches.map(item => UnitModule.normalizeSharedColorType(item?.type || '')).filter(Boolean)));
        if (types.length === 1) return types[0];
        return UnitModule.normalizeSharedColorType(defaultType || '');
    },
    resolvePvdColorTypeForRow: (row) => {
        return UnitModule.resolveSharedColorTypeForRow(row, 'pvd') || 'pvd';
    },
    resolveEloksalColorTypeForRow: (row) => {
        const defaultType = String(row?.processType || '') === 'STATIK_BOYA' ? 'boya' : 'eloksal';
        return UnitModule.resolveSharedColorTypeForRow(row, defaultType) || defaultType;
    },
    setPvdColorType: (type) => {
        UnitModule.state.pvdColorType = UnitModule.normalizeSharedColorType(type);
        UnitModule.state.pvdColor = '';
        UnitModule.state.pvdColorCode = '';
        UI.renderCurrentPage();
    },
    setExtruderColorType: (type) => {
        UnitModule.state.extruderDraftColorType = UnitModule.normalizeSharedColorType(type);
        UnitModule.state.extruderDraftColor = '';
        UnitModule.state.extruderDraftColorCode = '';
        UI.renderCurrentPage();
    },
    setEloksalColorCategory: (type) => {
        const normalized = UnitModule.normalizeSharedColorType(type);
        const processType = normalized === 'boya' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.setEloksalProcessType(processType);
    },
    refreshStockColorOptions: (selectedColor = '', selectedCode = '') => {
        const typeEl = document.getElementById('stk_color_type');
        const colorEl = document.getElementById('stk_col');
        const codeEl = document.getElementById('stk_col_code');
        if (!typeEl || !colorEl) return;

        const activeType = UnitModule.normalizeSharedColorType(typeEl.value || '');
        const unitId = UnitModule.state.activeUnitId;
        const fallback = Array.isArray(DB.data?.data?.unitColors?.[unitId]) ? DB.data.data.unitColors[unitId] : [];
        const items = activeType ? UnitModule.getSharedColorItemsWithFallback(activeType, fallback) : [];

        const wantsColor = String(selectedColor || '').trim();
        const wantsCode = String(selectedCode || '').trim().toUpperCase();
        if (wantsColor) {
            const exists = items.some(row => String(row.name || '').toLowerCase() === wantsColor.toLowerCase());
            if (!exists) {
                items.unshift({ id: '', name: wantsColor, code: wantsCode, type: activeType });
            }
        }

        const options = ['<option value="">renk sec</option>']
            .concat(items.map(row => {
                const name = UnitModule.escapeHtml(row.name || '');
                const code = UnitModule.escapeHtml(row.code || '');
                const selected = wantsColor && String(row.name || '') === wantsColor ? ' selected' : '';
                return `<option value="${name}" data-code="${code}"${selected}>${name}</option>`;
            }))
            .join('');

        colorEl.innerHTML = options;
        colorEl.disabled = !activeType;
        colorEl.style.color = activeType ? '#334155' : '#94a3b8';
        if (!activeType) colorEl.value = '';
        if (codeEl) {
            const opt = colorEl.options[colorEl.selectedIndex];
            codeEl.value = opt?.dataset?.code || '';
        }
    },
    setStockColorType: (type) => {
        const typeEl = document.getElementById('stk_color_type');
        if (typeEl) typeEl.value = UnitModule.normalizeSharedColorType(type);
        UnitModule.refreshStockColorOptions();
    },
    setStockColorValue: () => {
        const colorEl = document.getElementById('stk_col');
        const codeEl = document.getElementById('stk_col_code');
        if (!colorEl || !codeEl) return;
        const opt = colorEl.options[colorEl.selectedIndex];
        codeEl.value = opt?.dataset?.code || '';
    },
    renderPvdLibrary: (container, unitId) => {
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.pvdCards)) DB.data.data.pvdCards = [];
        if (!DB.data.data.unitColors) DB.data.data.unitColors = {};
        if (!Array.isArray(DB.data.data.unitColors[unitId])) {
            DB.data.data.unitColors[unitId] = ['Titanyum Gold', 'Rose Gold', 'Siyah', 'Gumus'];
        }

        const showForm = UnitModule.state.pvdFormOpen || !!UnitModule.state.pvdEditingId;
        const cards = (DB.data.data.pvdCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qName = String(UnitModule.state.pvdSearchName || '').trim().toLowerCase();
        const qId = String(UnitModule.state.pvdSearchId || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const nameOk = !qName || String(row.productName || '').toLowerCase().includes(qName);
            const idOk = !qId || String(row.cardCode || '').toLowerCase().includes(qId);
            return nameOk && idOk;
        });

        const editing = UnitModule.state.pvdEditingId
            ? cards.find(x => x.id === UnitModule.state.pvdEditingId)
            : null;
        const draftCode = editing?.cardCode || UnitModule.generatePvdCardCode();
        const typeOptions = UnitModule.getSharedColorTypeOptions();
        const activeType = UnitModule.normalizeSharedColorType(UnitModule.state.pvdColorType);
        UnitModule.state.pvdColorType = activeType;

        const availableColors = activeType
            ? UnitModule.getSharedColorItemsWithFallback(activeType, activeType === 'pvd' ? (DB.data.data.unitColors[unitId] || []) : [])
            : [];

        if (UnitModule.state.pvdColor) {
            const exists = availableColors.some(row =>
                String(row.name || '').toLowerCase() === String(UnitModule.state.pvdColor || '').toLowerCase()
            );
            if (!exists) {
                availableColors.unshift({
                    id: '',
                    name: String(UnitModule.state.pvdColor || ''),
                    code: String(UnitModule.state.pvdColorCode || '').trim().toUpperCase()
                });
            }
        }

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.handleLibraryBack('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Islem Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''} - Titanyum PVD renk envanteri</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.togglePvdForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Yeni urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="pvd_search_name" value="${UnitModule.escapeHtml(UnitModule.state.pvdSearchName || '')}" oninput="UnitModule.setPvdListFilter('name', this.value, 'pvd_search_name')" placeholder="urun adi ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                        <input id="pvd_search_id" value="${UnitModule.escapeHtml(UnitModule.state.pvdSearchId || '')}" oninput="UnitModule.setPvdListFilter('id', this.value, 'pvd_search_id')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="pvd_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:left;">Renk</th>
                                    <th style="padding:0.65rem; text-align:left;">Not</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Goruntule</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="7" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.getRoutePickerSelectedRowStyle(UnitModule.state.pvdSelectedId === row.id)}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</td>
                                        <td style="padding:0.65rem;">
                                            <span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.2rem 0.6rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.color || '-')}</span>
                                        </td>
                                        <td style="padding:0.65rem; color:#475569;">${UnitModule.escapeHtml(row.note || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.previewPvdRow('${row.id}')" class="btn-sm">goruntule</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.editPvdRow('${row.id}')" class="btn-sm">duzenle</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.selectPvdRow('${row.id}')" class="btn-sm" style="${UnitModule.getRoutePickerSelectButtonStyle(UnitModule.state.pvdSelectedId === row.id)}">sec</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="pvd_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Urun duzenle' : 'Yeni urun olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                ${editing ? `<button onclick="UnitModule.deletePvdRow('${UnitModule.state.pvdEditingId}')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">Sil</button>` : ''}
                                <button onclick="UnitModule.resetPvdDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.savePvdRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.55rem; align-items:end;">
                            <div style="grid-column:span 6;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun adi (opsiyonel)</label>
                                <input id="pvd_product_name" value="${UnitModule.escapeHtml(UnitModule.state.pvdProductName || '')}" oninput="UnitModule.state.pvdProductName=this.value" placeholder="ornek: 40x40 boru tutacak" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 4; width:100%; max-width:440px; justify-self:start;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kategori / renk *</label>
                                <div style="height:44px; border:1px solid #cbd5e1; border-radius:0.95rem; overflow:hidden; display:grid; grid-template-columns:42% 58%;">
                                    <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                                        <select id="pvd_color_type" onchange="UnitModule.setPvdColorType(this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:#334155;">
                                            <option value="">kategori sec</option>
                                            ${typeOptions.map(opt => `<option value="${opt.id}" ${activeType === opt.id ? 'selected' : ''}>${UnitModule.escapeHtml(opt.label)}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div style="background:${activeType ? 'white' : '#f8fafc'};">
                                        <select id="pvd_color" ${activeType ? '' : 'disabled'} onchange="UnitModule.state.pvdColor=this.value; UnitModule.state.pvdColorCode=this.options[this.selectedIndex]?.dataset?.code || '';" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:${activeType ? '#111827' : '#94a3b8'};">
                                            <option value="">renk sec</option>
                                            ${availableColors.map(c => `<option data-code="${UnitModule.escapeHtml(c.code || '')}" value="${UnitModule.escapeHtml(c.name)}" ${String(UnitModule.state.pvdColor || '') === String(c.name) ? 'selected' : ''}>${UnitModule.escapeHtml(c.name)}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style="grid-column:span 2;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="pvd_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                        </div>

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="pvd_note" rows="4" oninput="UnitModule.state.pvdNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.pvdNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (showForm) {
            const formEl = document.getElementById('pvd_form_block');
            const listEl = document.getElementById('pvd_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setPvdListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.pvdSearchName = value || '';
        if (field === 'id') UnitModule.state.pvdSearchId = value || '';
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
    togglePvdForm: () => {
        if (UnitModule.state.pvdFormOpen || UnitModule.state.pvdEditingId) {
            UnitModule.resetPvdDraft(false);
            return;
        }
        UnitModule.state.pvdFormOpen = true;
        UnitModule.state.pvdEditingId = null;
        UnitModule.state.pvdProductName = '';
        UnitModule.state.pvdColorType = '';
        UnitModule.state.pvdColor = '';
        UnitModule.state.pvdColorCode = '';
        UnitModule.state.pvdNote = '';
        UI.renderCurrentPage();
    },
    selectPvdRow: (id) => {
        UnitModule.state.pvdSelectedId = id;
        UI.renderCurrentPage();
    },
    previewPvdRow: (id) => {
        const row = (DB.data.data.pvdCards || []).find(x => x.id === id);
        if (!row) return;
        const colorType = UnitModule.resolvePvdColorTypeForRow(row);
        const colorTypeLabel = (UnitModule.getSharedColorTypeOptions().find(x => x.id === colorType)?.label) || '-';
        Modal.open(`Kart Detay - ${UnitModule.escapeHtml(row.productName || '-')}`, `
            <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Urun adi</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">ID</div><div style="font-weight:700; color:#334155; font-family:monospace;">${UnitModule.escapeHtml(row.cardCode || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Renk kategorisi</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(colorTypeLabel)}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Renk</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.color || '-')}</div></div>
                <div style="grid-column:1/-1; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Not</div><div style="color:#334155; white-space:pre-wrap;">${UnitModule.escapeHtml(row.note || '-')}</div></div>
            </div>
        `, { maxWidth: '720px' });
    },
    editPvdRow: (id) => {
        const row = (DB.data.data.pvdCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.pvdFormOpen = true;
        UnitModule.state.pvdEditingId = id;
        UnitModule.state.pvdSelectedId = id;
        UnitModule.state.pvdProductName = row.productName || '';
        UnitModule.state.pvdColorType = UnitModule.resolvePvdColorTypeForRow(row);
        UnitModule.state.pvdColor = row.color || '';
        UnitModule.state.pvdColorCode = String(row.colorCode || '').trim().toUpperCase();
        UnitModule.state.pvdNote = row.note || '';
        UI.renderCurrentPage();
    },
    savePvdRow: async (unitId) => {
        const productName = String(UnitModule.state.pvdProductName || '').trim();
        const colorType = UnitModule.normalizeSharedColorType(UnitModule.state.pvdColorType || '');
        const color = String(UnitModule.state.pvdColor || '').trim();
        const colorCode = String(UnitModule.state.pvdColorCode || '').trim().toUpperCase();
        const note = String(UnitModule.state.pvdNote || '').trim();

        if (!colorType) return alert('Renk kategorisi seciniz.');
        if (!color) return alert('Renk zorunlu.');

        if (!Array.isArray(DB.data.data.pvdCards)) DB.data.data.pvdCards = [];
        const all = DB.data.data.pvdCards;
        const now = new Date().toISOString();

        const hasSameColor = all.some(row =>
            row.unitId === unitId
            && UnitModule.normalizeSharedColorType(row.colorType || UnitModule.resolvePvdColorTypeForRow(row)) === colorType
            && String(row.color || '').toLowerCase() === color.toLowerCase()
            && row.id !== UnitModule.state.pvdEditingId
        );
        if (hasSameColor) {
            alert('Bu renk zaten tanimli. Ayni renkten ikinci kart acilamaz.');
            return;
        }

        if (UnitModule.state.pvdEditingId) {
            const row = all.find(x => x.id === UnitModule.state.pvdEditingId);
            if (!row) return;
            row.productName = productName;
            row.colorType = colorType;
            row.color = color;
            row.colorCode = colorCode;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.pvdSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                cardCode: UnitModule.generatePvdCardCode(),
                productName,
                colorType,
                color,
                colorCode,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.pvdSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetPvdDraft(false);
    },
    deletePvdRow: async (id) => {
        const row = (DB.data.data.pvdCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.pvdCards = (DB.data.data.pvdCards || []).filter(x => x.id !== id);
        if (UnitModule.state.pvdSelectedId === id) UnitModule.state.pvdSelectedId = null;
        if (UnitModule.state.pvdEditingId === id) UnitModule.resetPvdDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetPvdDraft: (keepOpen = false) => {
        UnitModule.state.pvdFormOpen = !!keepOpen;
        UnitModule.state.pvdEditingId = null;
        UnitModule.state.pvdProductName = '';
        UnitModule.state.pvdColorType = '';
        UnitModule.state.pvdColor = '';
        UnitModule.state.pvdColorCode = '';
        UnitModule.state.pvdNote = '';
        UI.renderCurrentPage();
    },
    generatePvdCardCode: () => {
        const all = DB.data.data.pvdCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(/^PVD-(\d{1,12})$/);
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `PVD-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `PVD-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    ensurePolishSurfaceList: (unitId) => {
        if (!DB.data.data.polishSurfaceLists || typeof DB.data.data.polishSurfaceLists !== 'object') {
            DB.data.data.polishSurfaceLists = {};
        }
        if (!Array.isArray(DB.data.data.polishSurfaceLists[unitId])) {
            DB.data.data.polishSurfaceLists[unitId] = ['Parlak', 'Mat', 'Satine'];
        }
        return DB.data.data.polishSurfaceLists[unitId];
    },
    renderPolishLibrary: (container, unitId) => {
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.ibrahimPolishCards)) DB.data.data.ibrahimPolishCards = [];
        const surfaces = UnitModule.ensurePolishSurfaceList(unitId);
        const showForm = UnitModule.state.polishFormOpen || !!UnitModule.state.polishEditingId;

        const cards = (DB.data.data.ibrahimPolishCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qName = String(UnitModule.state.polishSearchName || '').trim().toLowerCase();
        const qId = String(UnitModule.state.polishSearchId || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const nameOk = !qName || String(row.productName || '').toLowerCase().includes(qName);
            const idOk = !qId || String(row.cardCode || '').toLowerCase().includes(qId);
            return nameOk && idOk;
        });

        const editing = UnitModule.state.polishEditingId
            ? cards.find(x => x.id === UnitModule.state.polishEditingId)
            : null;
        const draftCode = editing?.cardCode || UnitModule.generatePolishCardCode();

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.handleLibraryBack('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Islem Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''} - Yuzey envanteri</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.togglePolishForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Yeni urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="polish_search_name" value="${UnitModule.escapeHtml(UnitModule.state.polishSearchName || '')}" oninput="UnitModule.setPolishListFilter('name', this.value, 'polish_search_name')" placeholder="urun adi ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                        <input id="polish_search_id" value="${UnitModule.escapeHtml(UnitModule.state.polishSearchId || '')}" oninput="UnitModule.setPolishListFilter('id', this.value, 'polish_search_id')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="polish_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:left;">Yuzey</th>
                                    <th style="padding:0.65rem; text-align:left;">Not</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Goruntule</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="7" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.getRoutePickerSelectedRowStyle(UnitModule.state.polishSelectedId === row.id)}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</td>
                                        <td style="padding:0.65rem;"><span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.2rem 0.6rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.surface || '-')}</span></td>
                                        <td style="padding:0.65rem; color:#475569;">${UnitModule.escapeHtml(row.note || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.previewPolishRow('${row.id}')" class="btn-sm">goruntule</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.editPolishRow('${row.id}')" class="btn-sm">duzenle</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.selectPolishRow('${row.id}')" class="btn-sm" style="${UnitModule.getRoutePickerSelectButtonStyle(UnitModule.state.polishSelectedId === row.id)}">sec</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="polish_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Urun duzenle' : 'Yeni urun olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                ${editing ? `<button onclick="UnitModule.deletePolishRow('${UnitModule.state.polishEditingId}')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">Sil</button>` : ''}
                                <button onclick="UnitModule.resetPolishDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.savePolishRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 5;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun adi (opsiyonel)</label>
                                <input id="polish_product_name" value="${UnitModule.escapeHtml(UnitModule.state.polishProductName || '')}" oninput="UnitModule.state.polishProductName=this.value" placeholder="ornek: dikme basligi" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 4;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem; display:flex; justify-content:space-between;">
                                    yuzey
                                    <button type="button" onclick="UnitModule.openPolishSurfaceModal('${unitId}')" style="color:#2563eb; font-size:0.68rem; font-weight:800; background:none; border:none; cursor:pointer;">+ YONET (EKLE-SIL)</button>
                                </label>
                                <select id="polish_surface" onchange="UnitModule.state.polishSurface=this.value" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem; font-weight:700;">
                                    <option value="">Yuzey seciniz</option>
                                    ${surfaces.map(s => `<option value="${UnitModule.escapeHtml(s)}" ${String(UnitModule.state.polishSurface || '') === String(s) ? 'selected' : ''}>${UnitModule.escapeHtml(s)}</option>`).join('')}
                                </select>
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="polish_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                        </div>

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="polish_note" rows="4" oninput="UnitModule.state.polishNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.polishNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (showForm) {
            const formEl = document.getElementById('polish_form_block');
            const listEl = document.getElementById('polish_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setPolishListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.polishSearchName = value || '';
        if (field === 'id') UnitModule.state.polishSearchId = value || '';
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
    togglePolishForm: () => {
        if (UnitModule.state.polishFormOpen || UnitModule.state.polishEditingId) {
            UnitModule.resetPolishDraft(false);
            return;
        }
        UnitModule.state.polishFormOpen = true;
        UnitModule.state.polishEditingId = null;
        UnitModule.state.polishProductName = '';
        UnitModule.state.polishSurface = '';
        UnitModule.state.polishNote = '';
        UI.renderCurrentPage();
    },
    selectPolishRow: (id) => {
        UnitModule.state.polishSelectedId = id;
        UI.renderCurrentPage();
    },
    previewPolishRow: (id) => {
        const row = (DB.data.data.ibrahimPolishCards || []).find(x => x.id === id);
        if (!row) return;
        Modal.open(`Kart Detay - ${UnitModule.escapeHtml(row.productName || '-')}`, `
            <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Urun adi</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">ID</div><div style="font-weight:700; color:#334155; font-family:monospace;">${UnitModule.escapeHtml(row.cardCode || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Yuzey</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.surface || '-')}</div></div>
                <div style="grid-column:1/-1; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Not</div><div style="color:#334155; white-space:pre-wrap;">${UnitModule.escapeHtml(row.note || '-')}</div></div>
            </div>
        `, { maxWidth: '720px' });
    },
    editPolishRow: (id) => {
        const row = (DB.data.data.ibrahimPolishCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.polishFormOpen = true;
        UnitModule.state.polishEditingId = id;
        UnitModule.state.polishSelectedId = id;
        UnitModule.state.polishProductName = row.productName || '';
        UnitModule.state.polishSurface = row.surface || '';
        UnitModule.state.polishNote = row.note || '';
        UI.renderCurrentPage();
    },
    savePolishRow: async (unitId) => {
        const productName = String(UnitModule.state.polishProductName || '').trim();
        const surface = String(UnitModule.state.polishSurface || '').trim();
        const note = String(UnitModule.state.polishNote || '').trim();
        if (!surface) return alert('Yuzey zorunlu.');

        if (!Array.isArray(DB.data.data.ibrahimPolishCards)) DB.data.data.ibrahimPolishCards = [];
        const all = DB.data.data.ibrahimPolishCards;
        const now = new Date().toISOString();

        if (UnitModule.state.polishEditingId) {
            const row = all.find(x => x.id === UnitModule.state.polishEditingId);
            if (!row) return;
            row.productName = productName;
            row.surface = surface;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.polishSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                cardCode: UnitModule.generatePolishCardCode(),
                productName,
                surface,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.polishSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetPolishDraft(false);
    },
    deletePolishRow: async (id) => {
        const row = (DB.data.data.ibrahimPolishCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.ibrahimPolishCards = (DB.data.data.ibrahimPolishCards || []).filter(x => x.id !== id);
        if (UnitModule.state.polishSelectedId === id) UnitModule.state.polishSelectedId = null;
        if (UnitModule.state.polishEditingId === id) UnitModule.resetPolishDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetPolishDraft: (keepOpen = false) => {
        UnitModule.state.polishFormOpen = !!keepOpen;
        UnitModule.state.polishEditingId = null;
        UnitModule.state.polishProductName = '';
        UnitModule.state.polishSurface = '';
        UnitModule.state.polishNote = '';
        UI.renderCurrentPage();
    },
    generatePolishCardCode: () => {
        const all = DB.data.data.ibrahimPolishCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(/^IPS-(\d{1,12})$/);
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `IPS-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `IPS-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    openPolishSurfaceModal: (unitId) => {
        const surfaces = UnitModule.ensurePolishSurfaceList(unitId);
        const old = document.getElementById('polishSurfaceModalOverlay');
        if (old) old.remove();

        const modalHtml = `
            <div id="polishSurfaceModalOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:420px; border-radius:1.25rem; padding:1.2rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="font-weight:800; color:#334155; margin:0;">Yuzey Listesi</h3>
                        <button onclick="document.getElementById('polishSurfaceModalOverlay').remove()" style="background:none; border:none; color:#94a3b8; cursor:pointer"><i data-lucide="x" width="20"></i></button>
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                        <input id="polishSurfaceInput" placeholder="Yeni yuzey..." style="flex:1; padding:0.7rem; border:1px solid #cbd5e1; border-radius:0.65rem; font-weight:700;">
                        <button onclick="UnitModule.addPolishSurface('${unitId}')" style="background:#2563eb; color:white; border:none; border-radius:0.65rem; padding:0 1rem; font-weight:800; cursor:pointer;">Ekle</button>
                    </div>
                    <div style="max-height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:0.45rem;">
                        ${surfaces.length === 0 ? '<div style="text-align:center; color:#94a3b8; padding:1rem;">Yuzey yok.</div>' : ''}
                        ${surfaces.map(s => {
                            const safe = String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                            return `<div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem 0.7rem;">
                                <span style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(s)}</span>
                                <button onclick="UnitModule.deletePolishSurface('${unitId}','${safe}')" style="background:none; border:none; color:#dc2626; cursor:pointer;">sil</button>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        const input = document.getElementById('polishSurfaceInput');
        if (input) input.focus();
    },
    addPolishSurface: async (unitId) => {
        const val = String(document.getElementById('polishSurfaceInput')?.value || '').trim();
        if (!val) return;
        const arr = UnitModule.ensurePolishSurfaceList(unitId);
        const exists = arr.some(x => String(x).toLowerCase() === val.toLowerCase());
        if (exists) return alert('Bu yuzey zaten var.');
        arr.push(val);
        await DB.save();
        UnitModule.openPolishSurfaceModal(unitId);
        if (UnitModule.state.activeUnitId === unitId) UI.renderCurrentPage();
    },
    deletePolishSurface: async (unitId, surface) => {
        if (!confirm(`${surface} silinsin mi?`)) return;
        const arr = UnitModule.ensurePolishSurfaceList(unitId);
        DB.data.data.polishSurfaceLists[unitId] = arr.filter(x => x !== surface);
        await DB.save();
        UnitModule.openPolishSurfaceModal(unitId);
        if (UnitModule.state.activeUnitId === unitId) UI.renderCurrentPage();
    },
    ensureProcessColorLists: (unitId) => {
        if (!DB.data.data.processColorLists || typeof DB.data.data.processColorLists !== 'object') {
            DB.data.data.processColorLists = {};
        }
        if (!DB.data.data.processColorLists[unitId] || typeof DB.data.data.processColorLists[unitId] !== 'object') {
            DB.data.data.processColorLists[unitId] = {};
        }
        const store = DB.data.data.processColorLists[unitId];
        if (!Array.isArray(store.ELOKSAL)) store.ELOKSAL = ['Sampanya', 'Inox', 'Siyah', 'Bronz'];
        if (!Array.isArray(store.STATIK_BOYA)) store.STATIK_BOYA = ['Mat Siyah', 'Antrasit', 'Beyaz', 'Krem'];
        return store;
    },
    renderEloksalLibrary: (container, unitId) => {
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!Array.isArray(DB.data.data.eloksalCards)) DB.data.data.eloksalCards = [];
        const processColors = UnitModule.ensureProcessColorLists(unitId);
        const showForm = UnitModule.state.elxFormOpen || !!UnitModule.state.elxEditingId;

        const cards = (DB.data.data.eloksalCards || [])
            .filter(x => x.unitId === unitId)
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

        const qName = String(UnitModule.state.elxSearchName || '').trim().toLowerCase();
        const qId = String(UnitModule.state.elxSearchId || '').trim().toLowerCase();
        const filtered = cards.filter(row => {
            const nameOk = !qName || String(row.productName || '').toLowerCase().includes(qName);
            const idOk = !qId || String(row.cardCode || '').toLowerCase().includes(qId);
            return nameOk && idOk;
        });

        const editing = UnitModule.state.elxEditingId
            ? cards.find(x => x.id === UnitModule.state.elxEditingId)
            : null;
        const typeOptions = UnitModule.getSharedColorTypeOptions()
            .filter(opt => opt.id === 'eloksal' || opt.id === 'boya');
        const activeColorType = UnitModule.normalizeSharedColorType(UnitModule.state.elxColorType || '')
            || (UnitModule.state.elxProcessType === 'STATIK_BOYA' ? 'boya' : 'eloksal');
        UnitModule.state.elxColorType = activeColorType;
        const processType = activeColorType === 'boya' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.state.elxProcessType = processType;
        const fallbackColors = activeColorType === 'boya'
            ? (processColors.STATIK_BOYA || [])
            : (processColors.ELOKSAL || []);
        const colorsForProcess = UnitModule.getSharedColorItemsWithFallback(activeColorType, fallbackColors);
        if (UnitModule.state.elxColor) {
            const exists = colorsForProcess.some(row =>
                String(row.name || '').toLowerCase() === String(UnitModule.state.elxColor || '').toLowerCase()
            );
            if (!exists) {
                colorsForProcess.unshift({
                    id: '',
                    name: String(UnitModule.state.elxColor || ''),
                    code: String(UnitModule.state.elxColorCode || '').trim().toUpperCase(),
                    type: activeColorType
                });
            }
        }
        const draftCode = editing?.cardCode || UnitModule.generateEloksalCardCode(processType);

        container.innerHTML = `
            <div style="max-width:1300px; margin:0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:0.7rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.2rem 0.1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <button onclick="UnitModule.handleLibraryBack('${unitId}')" style="background:white; border:1px solid #e2e8f0; border-radius:0.5rem; padding:0.45rem; cursor:pointer;">
                            <i data-lucide="arrow-left" width="18"></i>
                        </button>
                        <div>
                            <h2 class="page-title" style="margin:0; display:flex; gap:0.4rem; align-items:center;">
                                <i data-lucide="library" color="#1d4ed8"></i> Islem Kutuphanesi
                            </h2>
                            <div style="font-size:0.82rem; color:#64748b; font-weight:700;">${unit?.name || ''} - Eloksal / Statik Boya envanteri</div>
                        </div>
                    </div>
                    <button onclick="UnitModule.toggleEloksalForm()" class="btn-primary" style="padding:0.55rem 1.15rem; border-radius:0.75rem;">${showForm ? 'Vazgec' : 'Yeni urun ekle +'}</button>
                </div>

                <div style="background:white; border:1px solid #e2e8f0; border-radius:1rem; padding:0.9rem;">
                    <div style="display:flex; gap:0.6rem; margin-bottom:0.8rem; flex-wrap:wrap;">
                        <input id="elx_search_name" value="${UnitModule.escapeHtml(UnitModule.state.elxSearchName || '')}" oninput="UnitModule.setEloksalListFilter('name', this.value, 'elx_search_name')" placeholder="urun adi ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                        <input id="elx_search_id" value="${UnitModule.escapeHtml(UnitModule.state.elxSearchId || '')}" oninput="UnitModule.setEloksalListFilter('id', this.value, 'elx_search_id')" placeholder="ID ara" style="height:36px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.7rem; min-width:220px; font-weight:600;">
                    </div>
                    <div id="elx_list_block" class="card-table">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr style="border-bottom:1px solid #e2e8f0; color:#64748b; font-size:0.75rem; text-transform:uppercase;">
                                    <th style="padding:0.65rem; text-align:left;">Urun adi</th>
                                    <th style="padding:0.65rem; text-align:left;">Islem tipi</th>
                                    <th style="padding:0.65rem; text-align:left;">Renk</th>
                                    <th style="padding:0.65rem; text-align:left;">Not</th>
                                    <th style="padding:0.65rem; text-align:left;">ID</th>
                                    <th style="padding:0.65rem; text-align:right;">Goruntule</th>
                                    <th style="padding:0.65rem; text-align:right;">Duzenle</th>
                                    <th style="padding:0.65rem; text-align:right;">Sec</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0 ? `<tr><td colspan="8" style="padding:1rem; text-align:center; color:#94a3b8;">Kayit bulunamadi.</td></tr>` : filtered.map(row => `
                                    <tr style="border-bottom:1px solid #f1f5f9; ${UnitModule.getRoutePickerSelectedRowStyle(UnitModule.state.elxSelectedId === row.id)}">
                                        <td style="padding:0.65rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</td>
                                        <td style="padding:0.65rem;">
                                            <span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.2rem 0.6rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.processType || '-')}</span>
                                        </td>
                                        <td style="padding:0.65rem;">
                                            <span style="display:inline-block; border:1px solid #cbd5e1; border-radius:999px; padding:0.2rem 0.6rem; font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.color || '-')}</span>
                                        </td>
                                        <td style="padding:0.65rem; color:#475569;">${UnitModule.escapeHtml(row.note || '-')}</td>
                                        <td style="padding:0.65rem; font-family:monospace; color:#64748b;">${UnitModule.escapeHtml(row.cardCode || '-')}</td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.previewEloksalRow('${row.id}')" class="btn-sm">goruntule</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.editEloksalRow('${row.id}')" class="btn-sm">duzenle</button></td>
                                        <td style="padding:0.65rem; text-align:right;"><button onclick="UnitModule.selectEloksalRow('${row.id}')" class="btn-sm" style="${UnitModule.getRoutePickerSelectButtonStyle(UnitModule.state.elxSelectedId === row.id)}">sec</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${showForm ? `
                    <div id="elx_form_block" style="background:white; border:2px solid #111827; border-radius:1rem; padding:1rem; margin-top:1rem; box-shadow:0 8px 18px rgba(15,23,42,0.08);">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.7rem;">
                            <strong>${editing ? 'Urun duzenle' : 'Yeni urun olustur'}</strong>
                            <div style="display:flex; gap:0.4rem;">
                                ${editing ? `<button onclick="UnitModule.deleteEloksalRow('${UnitModule.state.elxEditingId}')" class="btn-sm" style="color:#b91c1c; border-color:#fecaca; background:#fef2f2;">Sil</button>` : ''}
                                <button onclick="UnitModule.resetEloksalDraft(false)" style="border:1px solid #cbd5e1; background:white; border-radius:0.4rem; padding:0.25rem 0.55rem; cursor:pointer;">Vazgec</button>
                                <button onclick="UnitModule.saveEloksalRow('${unitId}')" class="btn-primary" style="padding:0.3rem 0.6rem;">Kaydet</button>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(12, minmax(0,1fr)); gap:0.6rem;">
                            <div style="grid-column:span 4;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">urun adi (opsiyonel)</label>
                                <input id="elx_product_name" value="${UnitModule.escapeHtml(UnitModule.state.elxProductName || '')}" oninput="UnitModule.state.elxProductName=this.value" placeholder="ornek: dikme basligi" style="width:100%; height:38px; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0 0.65rem;">
                            </div>
                            <div style="grid-column:span 4; width:100%; max-width:440px; justify-self:start;">
                                <div style="margin-bottom:0.2rem;">
                                    <label style="display:block; font-size:0.74rem; color:#64748b;">kategori / renk *</label>
                                </div>
                                <div style="height:38px; border:1px solid #cbd5e1; border-radius:0.75rem; overflow:hidden; display:grid; grid-template-columns:42% 58%;">
                                    <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                                        <select id="elx_color_type" onchange="UnitModule.setEloksalColorCategory(this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:#334155;">
                                            <option value="">kategori sec</option>
                                            ${typeOptions.map(opt => `<option value="${opt.id}" ${activeColorType === opt.id ? 'selected' : ''}>${UnitModule.escapeHtml(opt.label)}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div style="background:${activeColorType ? 'white' : '#f8fafc'};">
                                        <select id="elx_color" ${activeColorType ? '' : 'disabled'} onchange="UnitModule.state.elxColor=this.value; UnitModule.state.elxColorCode=this.options[this.selectedIndex]?.dataset?.code || '';" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.55rem; font-weight:700; color:${activeColorType ? '#111827' : '#94a3b8'};">
                                            <option value="">renk sec</option>
                                            ${colorsForProcess.map(c => `<option value="${UnitModule.escapeHtml(c.name || '')}" data-code="${UnitModule.escapeHtml(c.code || '')}" ${String(UnitModule.state.elxColor || '') === String(c.name || '') ? 'selected' : ''}>${UnitModule.escapeHtml(c.name || '')}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style="grid-column:span 3;">
                                <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">kart ID</label>
                                <input id="elx_card_id" disabled value="${UnitModule.escapeHtml(draftCode)}" style="width:100%; height:38px; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0 0.65rem; background:#f8fafc; font-family:monospace;">
                            </div>
                        </div>

                        <div style="margin-top:0.7rem;">
                            <label style="display:block; font-size:0.74rem; color:#64748b; margin-bottom:0.2rem;">not (opsiyonel)</label>
                            <textarea id="elx_note" rows="4" oninput="UnitModule.state.elxNote=this.value" placeholder="not ekle" style="width:100%; border:1px solid #cbd5e1; border-radius:0.55rem; padding:0.5rem; resize:vertical;">${UnitModule.escapeHtml(UnitModule.state.elxNote || '')}</textarea>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (showForm) {
            const formEl = document.getElementById('elx_form_block');
            const listEl = document.getElementById('elx_list_block');
            if (formEl && listEl && listEl.parentElement) {
                listEl.parentElement.insertBefore(formEl, listEl);
            }
        }
    },
    setEloksalProcessType: (type, rerender = true) => {
        const nextType = type === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.state.elxProcessType = nextType;
        UnitModule.state.elxColorType = nextType === 'STATIK_BOYA' ? 'boya' : 'eloksal';
        const unitId = UnitModule.state.activeUnitId;
        const processColors = UnitModule.ensureProcessColorLists(unitId);
        const options = Array.isArray(processColors[nextType]) ? processColors[nextType] : [];
        const keepColor = options.includes(UnitModule.state.elxColor);
        if (!keepColor) {
            const shared = UnitModule.getSharedColorLibraryItems(UnitModule.state.elxColorType);
            const hasInShared = shared.some(row => String(row.name || '') === String(UnitModule.state.elxColor || ''));
            if (!hasInShared) {
                UnitModule.state.elxColor = '';
                UnitModule.state.elxColorCode = '';
            }
        }
        if (rerender) UI.renderCurrentPage();
    },
    setEloksalListFilter: (field, value, focusId) => {
        if (field === 'name') UnitModule.state.elxSearchName = value || '';
        if (field === 'id') UnitModule.state.elxSearchId = value || '';
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
    toggleEloksalForm: () => {
        if (UnitModule.state.elxFormOpen || UnitModule.state.elxEditingId) {
            UnitModule.resetEloksalDraft(false);
            return;
        }
        UnitModule.state.elxFormOpen = true;
        UnitModule.state.elxEditingId = null;
        UnitModule.state.elxProductName = '';
        UnitModule.state.elxProcessType = 'ELOKSAL';
        UnitModule.state.elxColorType = 'eloksal';
        UnitModule.state.elxColor = '';
        UnitModule.state.elxColorCode = '';
        UnitModule.state.elxNote = '';
        UI.renderCurrentPage();
    },
    selectEloksalRow: (id) => {
        UnitModule.state.elxSelectedId = id;
        UI.renderCurrentPage();
    },
    previewEloksalRow: (id) => {
        const row = (DB.data.data.eloksalCards || []).find(x => x.id === id);
        if (!row) return;
        const colorType = UnitModule.resolveEloksalColorTypeForRow(row);
        const colorTypeLabel = (UnitModule.getSharedColorTypeOptions().find(x => x.id === colorType)?.label) || '-';
        Modal.open(`Kart Detay - ${UnitModule.escapeHtml(row.productName || '-')}`, `
            <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.55rem;">
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Urun adi</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.productName || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">ID</div><div style="font-weight:700; color:#334155; font-family:monospace;">${UnitModule.escapeHtml(row.cardCode || '-')}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Renk kategorisi</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(colorTypeLabel)}</div></div>
                <div style="border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Renk</div><div style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(row.color || '-')}</div></div>
                <div style="grid-column:1/-1; border:1px solid #e2e8f0; border-radius:0.55rem; padding:0.45rem;"><div style="font-size:0.72rem; color:#64748b;">Not</div><div style="color:#334155; white-space:pre-wrap;">${UnitModule.escapeHtml(row.note || '-')}</div></div>
            </div>
        `, { maxWidth: '720px' });
    },
    editEloksalRow: (id) => {
        const row = (DB.data.data.eloksalCards || []).find(x => x.id === id);
        if (!row) return;
        UnitModule.state.elxFormOpen = true;
        UnitModule.state.elxEditingId = id;
        UnitModule.state.elxSelectedId = id;
        UnitModule.state.elxProductName = row.productName || '';
        UnitModule.state.elxProcessType = row.processType || 'ELOKSAL';
        UnitModule.state.elxColorType = UnitModule.resolveEloksalColorTypeForRow(row);
        UnitModule.state.elxColor = row.color || '';
        UnitModule.state.elxColorCode = String(row.colorCode || '').trim().toUpperCase();
        UnitModule.state.elxNote = row.note || '';
        UI.renderCurrentPage();
    },
    saveEloksalRow: async (unitId) => {
        const productName = String(UnitModule.state.elxProductName || '').trim();
        const colorType = UnitModule.normalizeSharedColorType(UnitModule.state.elxColorType || '');
        const processType = colorType === 'boya' ? 'STATIK_BOYA' : 'ELOKSAL';
        const color = String(UnitModule.state.elxColor || '').trim();
        const colorCode = String(UnitModule.state.elxColorCode || '').trim().toUpperCase();
        const note = String(UnitModule.state.elxNote || '').trim();

        if (!colorType) return alert('Renk kategorisi seciniz.');
        if (!color) return alert('Renk zorunlu.');

        if (!Array.isArray(DB.data.data.eloksalCards)) DB.data.data.eloksalCards = [];
        const all = DB.data.data.eloksalCards;
        const now = new Date().toISOString();

        const hasSameColor = all.some(row =>
            row.unitId === unitId
            && UnitModule.normalizeSharedColorType(row.colorType || UnitModule.resolveEloksalColorTypeForRow(row)) === colorType
            && String(row.color || '').toLowerCase() === color.toLowerCase()
            && row.id !== UnitModule.state.elxEditingId
        );
        if (hasSameColor) {
            alert('Bu kategoride ayni renk zaten tanimli.');
            return;
        }

        if (UnitModule.state.elxEditingId) {
            const row = all.find(x => x.id === UnitModule.state.elxEditingId);
            if (!row) return;
            const oldType = row.processType || 'ELOKSAL';
            row.processType = processType;
            row.cardCode = oldType === processType ? row.cardCode : UnitModule.generateEloksalCardCode(processType);
            row.productName = productName;
            row.colorType = colorType;
            row.color = color;
            row.colorCode = colorCode;
            row.note = note || '';
            row.updated_at = now;
            UnitModule.state.elxSelectedId = row.id;
        } else {
            const rowId = crypto.randomUUID();
            all.push({
                id: rowId,
                unitId,
                processType,
                cardCode: UnitModule.generateEloksalCardCode(processType),
                productName,
                colorType,
                color,
                colorCode,
                note: note || '',
                created_at: now,
                updated_at: now
            });
            UnitModule.state.elxSelectedId = rowId;
        }

        await DB.save();
        UnitModule.resetEloksalDraft(false);
    },
    deleteEloksalRow: async (id) => {
        const row = (DB.data.data.eloksalCards || []).find(x => x.id === id);
        if (!row) return;
        if (!confirm(`"${row.cardCode || 'Kayit'}" silinsin mi?`)) return;

        DB.data.data.eloksalCards = (DB.data.data.eloksalCards || []).filter(x => x.id !== id);
        if (UnitModule.state.elxSelectedId === id) UnitModule.state.elxSelectedId = null;
        if (UnitModule.state.elxEditingId === id) UnitModule.resetEloksalDraft(false);
        await DB.save();
        UI.renderCurrentPage();
    },
    resetEloksalDraft: (keepOpen = false) => {
        UnitModule.state.elxFormOpen = !!keepOpen;
        UnitModule.state.elxEditingId = null;
        UnitModule.state.elxProductName = '';
        UnitModule.state.elxProcessType = 'ELOKSAL';
        UnitModule.state.elxColorType = 'eloksal';
        UnitModule.state.elxColor = '';
        UnitModule.state.elxColorCode = '';
        UnitModule.state.elxNote = '';
        UI.renderCurrentPage();
    },
    generateEloksalCardCode: (processType) => {
        const type = processType === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        const prefix = type === 'STATIK_BOYA' ? 'STB' : 'ELX';
        const all = DB.data.data.eloksalCards || [];
        let maxNum = 0;
        all.forEach(row => {
            const code = String(row?.cardCode || '').toUpperCase();
            const match = code.match(new RegExp(`^${prefix}-(\\d{1,12})$`));
            if (!match) return;
            const n = Number(match[1]);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
        });
        let nextNum = maxNum + 1;
        let candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
        while (UnitModule.isGlobalCodeTaken(candidate)) {
            nextNum += 1;
            candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
        }
        return candidate;
    },
    openProcessColorModal: (unitId, processType) => {
        const type = processType === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.state.elxProcessType = type;
        UnitModule.state.elxColorType = type === 'STATIK_BOYA' ? 'boya' : 'eloksal';
        const lists = UnitModule.ensureProcessColorLists(unitId);
        const colors = lists[type] || [];

        const old = document.getElementById('processColorModalOverlay');
        if (old) old.remove();

        const modalHtml = `
            <div id="processColorModalOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:430px; border-radius:1.25rem; padding:1.2rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 style="font-weight:800; color:#334155; margin:0;">${type === 'ELOKSAL' ? 'Eloksal' : 'Statik Boya'} Renkleri</h3>
                        <button onclick="document.getElementById('processColorModalOverlay').remove()" style="background:none; border:none; color:#94a3b8; cursor:pointer"><i data-lucide="x" width="20"></i></button>
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                        <input id="processColorInput" placeholder="Yeni renk..." style="flex:1; padding:0.7rem; border:1px solid #cbd5e1; border-radius:0.65rem; font-weight:700;">
                        <button onclick="UnitModule.addProcessColor('${unitId}','${type}')" style="background:#2563eb; color:white; border:none; border-radius:0.65rem; padding:0 1rem; font-weight:800; cursor:pointer;">Ekle</button>
                    </div>
                    <div style="max-height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:0.45rem;">
                        ${colors.length === 0 ? '<div style="text-align:center; color:#94a3b8; padding:1rem;">Renk yok.</div>' : ''}
                        ${colors.map(c => {
                            const colorArg = String(c).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                            return `<div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #e2e8f0; border-radius:0.65rem; padding:0.55rem 0.7rem;">
                                <span style="font-weight:700; color:#334155;">${UnitModule.escapeHtml(c)}</span>
                                <button onclick="UnitModule.deleteProcessColor('${unitId}','${type}','${colorArg}')" style="background:none; border:none; color:#dc2626; cursor:pointer;">sil</button>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        const input = document.getElementById('processColorInput');
        if (input) input.focus();
    },
    addProcessColor: async (unitId, processType) => {
        const type = processType === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.state.elxProcessType = type;
        UnitModule.state.elxColorType = type === 'STATIK_BOYA' ? 'boya' : 'eloksal';
        const val = String(document.getElementById('processColorInput')?.value || '').trim();
        if (!val) return;
        const lists = UnitModule.ensureProcessColorLists(unitId);
        const arr = lists[type] || [];
        const exists = arr.some(c => String(c).toLowerCase() === val.toLowerCase());
        if (exists) return alert('Bu renk zaten var.');
        arr.push(val);
        lists[type] = arr;
        await DB.save();
        const activeUnitId = UnitModule.state.activeUnitId;
        UnitModule.openProcessColorModal(unitId, type);
        if (activeUnitId === unitId) UI.renderCurrentPage();
    },
    deleteProcessColor: async (unitId, processType, color) => {
        const type = processType === 'STATIK_BOYA' ? 'STATIK_BOYA' : 'ELOKSAL';
        UnitModule.state.elxProcessType = type;
        UnitModule.state.elxColorType = type === 'STATIK_BOYA' ? 'boya' : 'eloksal';
        if (!confirm(`${color} silinsin mi?`)) return;
        const lists = UnitModule.ensureProcessColorLists(unitId);
        lists[type] = (lists[type] || []).filter(c => c !== color);
        await DB.save();
        const activeUnitId = UnitModule.state.activeUnitId;
        UnitModule.openProcessColorModal(unitId, type);
        if (activeUnitId === unitId) UI.renderCurrentPage();
    },
    canManageUnitCodes: () => {
        const role = String(DB.data?.meta?.activeRole || 'super-admin').toLowerCase();
        if (role === 'super-admin') return true;
        if (role === 'birim-admin' || role === 'unit-admin') return true;
        if (role === 'birim_admin' || role === 'unit_admin') return true;
        return role.includes('admin') && (role.includes('birim') || role.includes('unit'));
    },
    escapeHtml: (value) => {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    renderMachineList: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);
        const machines = (DB.data.data.machines || []).filter(m => m.unitId === unitId);
        const canManage = UnitModule.isSuperAdmin();

        container.innerHTML = `
            <div class="page-header">
                 <h2 class="page-title">${unit.name} > Makineler</h2>
                 <button class="btn-primary" onclick="UnitModule.addMachineModal('${unitId}')" ${canManage ? '' : 'disabled'} style="${canManage ? '' : 'opacity:0.6; cursor:not-allowed;'}">+ Yeni Makine</button>
            </div>
            ${canManage ? '' : `<div style="font-size:0.85rem; color:#94a3b8; margin-bottom:0.8rem;">Makine ekleme / duzenleme sadece super admin icin acik.</div>`}

            <div class="apps-grid">
                ${machines.length === 0 ? '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#94a3b8">Kayitli makine yok.</div>' : ''}
                ${machines.map(m => `
                    <div class="app-card" style="align-items:flex-start; text-align:left; justify-content:flex-start; padding:1.5rem">
                        <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:1rem">
                            <h4 style="font-weight:700; font-size:1.1rem; margin:0">${m.name}</h4>
                            <span style="font-size:1.5rem">${m.status === 'ACTIVE' ? '<i data-lucide="check-circle" color="#22c55e"></i>' : m.status === 'MAINTENANCE' ? '<i data-lucide="x-circle" color="#ef4444"></i>' : '<i data-lucide="alert-circle" color="#eab308"></i>'}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#64748b; margin-bottom:1.5rem;">Durum: ${m.status}</div>
                        <div style="display:flex; gap:0.5rem; margin-top:auto; width:100%">
                             <button class="btn-sm" style="flex:1" onclick="UnitModule.setMachineStatus('${m.id}','ACTIVE')" ${canManage ? '' : 'disabled'}>Calisiyor</button>
                             <button class="btn-sm" style="flex:1" onclick="UnitModule.setMachineStatus('${m.id}','MAINTENANCE')" ${canManage ? '' : 'disabled'}>Ariza</button>
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:0.6rem; width:100%">
                             <button class="btn-sm" style="flex:1; display:flex; align-items:center; justify-content:center; gap:0.35rem" onclick="UnitModule.openMachineEditModal('${m.id}')" ${canManage ? '' : 'disabled'}>
                                <i data-lucide="pencil" width="14" height="14"></i> Duzenle
                             </button>
                             <button class="btn-sm" style="flex:1; color:#dc2626; display:flex; align-items:center; justify-content:center; gap:0.35rem" onclick="UnitModule.deleteMachine('${m.id}')" ${canManage ? '' : 'disabled'}>
                                <i data-lucide="trash-2" width="14" height="14"></i> Sil
                             </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // --- NEW: SPECIFIC STOCK IMPLEMENTATION ---
    renderUnitStock: (container, unitId) => {
        const unit = DB.data.data.units.find(u => u.id === unitId);

        // EXTRA SECURITY: Strictly restrict to Extruder
        if (!unit.name.includes('EKSTRUDER')) {
            container.innerHTML = `<div style="text-align:center; padding:4rem; color:#94a3b8"><h3>Bu birim icin stok yonetimi aktif degil.</h3></div>`;
            return;
        }

        const tab = UnitModule.state.stockTab;
        const inventory = (DB.data.data.inventory || []).filter(i => i.unitId === unitId && i.category === tab);

        // Ensure Colors Exist
        if (!DB.data.data.unitColors) DB.data.data.unitColors = {};
        if (!DB.data.data.unitColors[unitId]) DB.data.data.unitColors[unitId] = ['Seffaf', 'Beyaz', 'Siyah', 'Antrasit'];

        // Specific Header for Extruder
        const title = unit.name.includes('EKSTRUDER') ? 'EKSTRUDER STOK EKLEME PANELI' : `${unit.name} STOK PANELI`;

        container.innerHTML = `
            <div style="margin-bottom:2rem; padding-left:0.25rem">
                <h1 style="font-size:1.8rem; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:0.75rem">
                    <span style="color:#10b981"><i data-lucide="box" width="32" height="32"></i></span> ${title}
                </h1>
            </div>

            <!-- TABS -->
            <div style="display:flex; gap:0.5rem; margin-bottom:0; padding-left:0.25rem">
                <button onclick="UnitModule.setStockTab('ROD')" class="tab-btn ${tab === 'ROD' ? 'active' : ''}">CUBUK</button>
                <button onclick="UnitModule.setStockTab('PIPE')" class="tab-btn ${tab === 'PIPE' ? 'active' : ''}">BORU</button>
                <button onclick="UnitModule.setStockTab('PROFILE')" class="tab-btn ${tab === 'PROFILE' ? 'active' : ''}">OZEL PROFILLER</button>
            </div>
            <style>
                .tab-btn { padding: 0.75rem 2.5rem; border-radius: 1rem 1rem 0 0; font-weight:800; font-size:0.85rem; cursor:pointer; border:1px solid transparent; background:#e2e8f0; color:#94a3b8; letter-spacing:0.05em; }
                .tab-btn.active { background:white; color:#1e293b; border-color:#e2e8f0; border-bottom-color:white; box-shadow:0 -4px 6px -1px rgba(0,0,0,0.05); z-index:10; }
            </style>

            <!-- MAIN CARD -->
            <div style="background:white; border-radius:0 1.5rem 1.5rem 1.5rem; border:1px solid #e2e8f0; padding:1.5rem; box-shadow:0 1px 3px rgba(0,0,0,0.05); min-height:500px">
                
                <!-- INPUT ROW -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:1rem; padding:1.5rem; margin-bottom:2rem">
                    <div style="font-size:0.75rem; font-weight:800; color:#52525b; margin-bottom:1rem; letter-spacing:0.1em; display:flex; gap:0.5rem; align-items:center; text-transform:uppercase">
                        <i data-lucide="plus" width="16" height="16" color="#10b981"></i>
                        HIZLI STOK GIRISI (${tab === 'ROD' ? '<span style="color:#059669">CUBUK</span>' : tab === 'PIPE' ? '<span style="color:#059669">BORU</span>' : '<span style="color:#059669">PROFIL</span>'})
                    </div>
                    
                    <div style="display:grid; grid-template-columns: repeat(12, 1fr); gap:1rem; align-items:end">
                        ${tab === 'PROFILE' ? `
                            <div style="grid-column:span 2">
                                <label class="lbl">PROFIL ADI</label>
                                <input id="stk_name" class="inp" placeholder="40x40 Kare">
                            </div>
                        ` : `
                            <div style="grid-column:span 1">
                                <label class="lbl">CAP (mm)</label>
                                <input id="stk_dia" type="number" class="inp text-center" placeholder="50">
                            </div>
                        `}
                        
                        ${tab === 'PIPE' ? `
                             <div style="grid-column:span 1">
                                <label class="lbl">KALINLIK</label>
                                <input id="stk_thick" type="number" class="inp text-center" placeholder="2">
                            </div>
                        ` : ''}

                        <div style="grid-column:span 1">
                            <label class="lbl">BOY (mm)</label>
                            <input id="stk_len" type="number" class="inp" placeholder="2000">
                        </div>

                        <div style="grid-column:span 2; width:100%; max-width:440px;">
                            <div class="lbl" style="margin-bottom:0.3rem;">
                                <span>KATEGORI / RENK</span>
                            </div>
                            <div style="height:42px; border:1px solid #cbd5e1; border-radius:0.75rem; overflow:hidden; display:grid; grid-template-columns:42% 58%; background:white;">
                                <div style="background:#d9e9f8; border-right:1px solid #cbd5e1;">
                                    <select id="stk_color_type" onchange="UnitModule.setStockColorType(this.value)" style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.65rem; font-size:0.9rem; font-weight:700; color:#334155;">
                                        <option value="">kategori sec</option>
                                        ${UnitModule.getSharedColorTypeOptions().map(opt => `<option value="${opt.id}">${UnitModule.escapeHtml(opt.label)}</option>`).join('')}
                                    </select>
                                </div>
                                <div style="background:#f8fafc;">
                                    <select id="stk_col" onchange="UnitModule.setStockColorValue()" disabled style="width:100%; height:100%; border:none; outline:none; background:transparent; padding:0 0.65rem; font-size:0.9rem; font-weight:700; color:#94a3b8;">
                                        <option value="">renk sec</option>
                                    </select>
                                </div>
                            </div>
                            <input id="stk_col_code" type="hidden" value="">
                        </div>

                        ${tab === 'ROD' ? `
                            <div style="grid-column:span 1; display:flex; justify-content:center; padding-bottom:0.8rem">
                                <label style="display:flex; flex-direction:column; align-items:center; cursor:pointer">
                                    <input id="stk_bub" type="checkbox" style="width:1.25rem; height:1.25rem; accent-color:#10b981; cursor:pointer">
                                    <span style="font-size:0.6rem; font-weight:700; color:#64748b; margin-top:0.25rem">Kabarcikli</span>
                                </label>
                            </div>
                        ` : '<div style="grid-column:span 1"></div>'}

                        <div style="grid-column:span 1"></div>

                        <div style="grid-column:span 1">
                            <label class="lbl">ADET</label>
                            <input id="stk_qty" type="number" class="inp text-center" style="border-width:2px; color:#10b981; font-weight:bold" placeholder="0">
                        </div>

                        <div style="grid-column:span 1">
                            <label class="lbl">HEDEF</label>
                            <input id="stk_target" type="number" class="inp text-center" placeholder="100">
                        </div>

                        <div style="grid-column:span 2" style="position:relative">
                            <label class="lbl">ADRES / NOT</label>
                            <div style="position:relative">
                                <input id="stk_addr" class="inp" placeholder="Not Giriniz..." style="padding-right:2rem">
                                <i data-lucide="edit-2" width="14" height="14" style="position:absolute; right:10px; top:14px; color:#94a3b8"></i>
                            </div>
                        </div>


                        <div style="grid-column:span 2; display:flex; gap:0.5rem">
                            ${UnitModule.state.editingId ? `
                                <button onclick="UnitModule.saveStock('${unitId}')" class="btn-primary" style="flex:2; height:42px; background:#2563eb; box-shadow:0 4px 6px -1px rgba(37, 99, 235, 0.2); display:flex; align-items:center; justify-content:center; gap:0.5rem">
                                    <i data-lucide="save" width="18" height="18"></i> GUNCELLE
                                </button>
                                <button onclick="UnitModule.cancelEdit()" class="btn-primary" style="flex:1; height:42px; background:#94a3b8; box-shadow:0 4px 6px -1px rgba(148, 163, 184, 0.2); display:flex; align-items:center; justify-content:center; gap:0.5rem">
                                    <i data-lucide="rotate-ccw" width="18" height="18"></i> VAZGEC
                                </button>
                            ` : `
                                <button onclick="UnitModule.saveStock('${unitId}')" class="btn-primary" style="width:100%; height:42px; background:#059669; box-shadow:0 4px 6px -1px rgba(16, 185, 129, 0.2); display:flex; align-items:center; justify-content:center; gap:0.5rem">
                                    <i data-lucide="plus" width="18" height="18"></i> EKLE
                                </button>
                            `}
                        </div>
                    </div>
                </div>

                <style>
                    .lbl { display:block; font-size:0.65rem; font-weight:700; color:#64748b; margin-bottom:0.4rem; margin-left:0.25rem; }
                    .inp { width:100%; height:42px; padding:0 0.75rem; border:1px solid #cbd5e1; border-radius:0.75rem; font-size:0.9rem; font-weight:600; color:#334155; outline:none; transition:all 0.2s; }
                    .inp:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16, 185, 129, 0.1); }
                    .text-center { text-align:center; }
                </style>

                <!-- LIST TABLE -->
                <div class="card-table">
                    <table>
                        <thead style="background:#f8fafc">
                            <tr>
                                <th style="font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Urun Adi</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Cap (mm)</th>
                                ${tab === 'PIPE' ? '<th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Kalinlik</th>' : ''}
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Boy (mm)</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Renk</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Ozellik</th>
                                <th style="text-align:center; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Not / Adres</th>
                                <th style="text-align:right; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Miktar / Hedef</th>
                                <th style="text-align:right; font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase">Islem</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inventory.length === 0 ? `<tr><td colspan="10" style="text-align:center; padding:4rem; color:#94a3b8"><div style="display:flex; justify-content:center; margin-bottom:1rem"><div style="background:#f8fafc; padding:1.5rem; border-radius:50%"><i data-lucide="box" width="32" height="32" color="#cbd5e1"></i></div></div><div style="font-weight:700; margin-bottom:0.5rem">Stok kaydi bulunamadi</div><div style="font-size:0.85rem">Bu kategori icin henuz giris yapilmamis.</div></td></tr>` : ''}
                            ${inventory.map(i => {
            // Color Logic
            let rowClass = '';
            if (i.targetStock > 0) {
                const ratio = i.quantity / i.targetStock;
                if (ratio <= 0.25) rowClass = 'bg-red-100'; // Critical
                else if (ratio <= 0.50) rowClass = 'bg-orange-50'; // Warning
            }

            return `
                                <tr class="${rowClass}">
                                    <td>
                                        <div style="display:flex; align-items:center; gap:0.75rem">
                                            <div style="padding:0.5rem; background:white; border:1px solid #f1f5f9; border-radius:0.5rem; color:#94a3b8"><i data-lucide="package" width="16" height="16"></i></div>
                                            <div>
                                                <div style="font-weight:700; color:#334155">${i.name}</div>
                                                <div style="font-size:0.65rem; color:#94a3b8; font-family:monospace">ID: ...${i.id.slice(-4)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="text-align:center;"><span style="background:rgba(255,255,255,0.5); padding:0.25rem 0.5rem; border-radius:0.25rem; font-weight:700; color:#475569">${i.diameter || '-'}</span></td>
                                    ${tab === 'PIPE' ? `<td style="text-align:center; background:rgba(255,255,255,0.5)">${i.thickness || '-'}</td>` : ''}
                                    <td style="text-align:center;"><span style="background:rgba(255,255,255,0.5); padding:0.25rem 0.5rem; border-radius:0.25rem; font-weight:700; color:#475569">${i.length}</span></td>
                                    <td style="text-align:center"><span style="background:white; border:1px solid #e2e8f0; color:#64748b; padding:0.25rem 0.75rem; border-radius:0.5rem; font-size:0.75rem; font-weight:700">${i.color}</span></td>
                                    <td style="text-align:center">${i.isBubble ? '<span style="background:#eff6ff; color:#2563eb; border:1px solid #dbeafe; padding:0.25rem 0.75rem; border-radius:1rem; font-size:0.65rem; font-weight:800">KABARCIKLI</span>' : '<span style="background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; padding:0.25rem 0.75rem; border-radius:1rem; font-size:0.65rem; font-weight:700">KABARCIKSIZ</span>'}</td>
                                    <td style="text-align:center; font-size:0.8rem; color:#64748b">${i.address ? `<span style="background:#fffbeb; color:#d97706; border:1px solid #fcd34d; padding:0.15rem 0.5rem; border-radius:0.25rem; font-size:0.75rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem"><i data-lucide="map-pin" width="10" height="10"></i> ${i.address}</span>` : '-'}</td>
                                    <td style="text-align:right">
                                        <div style="font-weight:800; font-size:1.1rem; color:#1e293b">${i.quantity} <span style="font-size:0.7rem; color:#94a3b8; font-weight:500">Adet</span></div>
                                        <div style="font-size:0.7rem; color:#94a3b8; background:white; padding:0.1rem 0.4rem; border-radius:0.25rem; border:1px solid #f1f5f9; display:inline-block; margin-top:0.1rem; display:flex; align-items:center; gap:0.25rem; justify-content:flex-end">
                                            Hedef: ${i.targetStock}
                                            ${i.targetStock > 0 && (i.quantity / i.targetStock) <= 0.5 ? '<i data-lucide="alert-circle" width="12" height="12" color="#ef4444"></i>' : ''}
                                        </div>
                                    </td>
                                    <td style="text-align:right">
                                        <div style="display:flex; justify-content:flex-end; gap:0.5rem">
                                            ${UnitModule.state.editingId === i.id ? `
                                                <button style="padding:0.5rem; border-radius:0.5rem; border:1px solid #60a5fa; background:#eff6ff; color:#2563eb; cursor:pointer"><i data-lucide="loader-2" width="16" height="16"></i></button>
                                            ` : `
                                                <button onclick="UnitModule.editStock('${i.id}')" style="padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; background:white; color:#94a3b8; cursor:pointer; transition:all 0.2s" onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#94a3b8'"><i data-lucide="edit-2" width="16" height="16"></i></button>
                                                <button onclick="UnitModule.deleteStock('${i.id}')" style="padding:0.5rem; border-radius:0.5rem; border:1px solid #e2e8f0; background:white; color:#94a3b8; cursor:pointer; transition:all 0.2s" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'"><i data-lucide="trash-2" width="16" height="16"></i></button>
                                            `}
                                        </div>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    openColorModal: (unitId) => {
        if (!DB.data.data.unitColors) DB.data.data.unitColors = {};
        if (!Array.isArray(DB.data.data.unitColors[unitId])) {
            DB.data.data.unitColors[unitId] = ['Seffaf', 'Beyaz', 'Siyah', 'Antrasit'];
        }
        const colors = DB.data.data.unitColors[unitId] || [];
        const normalize = (txt) => String(txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
        const swatchColor = (name) => {
            const n = normalize(name);
            if (n.includes('seffaf') || n.includes('saydam') || n.includes('transparan')) return 'transparent';
            if (n.includes('siyah')) return '#000000';
            if (n.includes('beyaz')) return '#ffffff';
            if (n.includes('antrasit')) return '#374151';
            if (n.includes('sari')) return '#facc15';
            if (n.includes('kirmizi')) return '#ef4444';
            if (n.includes('mavi')) return '#2563eb';
            if (n.includes('yesil')) return '#22c55e';
            if (n.includes('gri')) return '#9ca3af';
            return '#cbd5e1';
        };

        const old = document.getElementById('colorModalOverlay');
        if (old) old.remove();

        const modalHtml = `
            <div id="colorModalOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center">
                <div style="background:white; width:400px; border-radius:1.5rem; padding:1.5rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); animation: zoomIn 0.2s">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                        <h3 style="font-weight:800; color:#334155; display:flex; align-items:center; gap:0.5rem">
                            <i data-lucide="palette" color="#a855f7" width="20"></i> Renk Kutuphanesi
                        </h3>
                        <button onclick="document.getElementById('colorModalOverlay').remove()" style="background:none; border:none; color:#94a3b8; cursor:pointer"><i data-lucide="x" width="20"></i></button>
                    </div>

                    <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem">
                        <input id="newColorInput" placeholder="Yeni renk ismi..." style="flex:1; padding:0.75rem; border:2px solid #e2e8f0; border-radius:0.75rem; font-weight:700; color:#475569; outline:none; font-size:0.9rem">
                        <button onclick="UnitModule.addColor('${unitId}')" style="background:#a855f7; color:white; border:none; padding:0 1.25rem; border-radius:0.75rem; font-weight:800; cursor:pointer; box-shadow:0 4px 6px -1px rgba(168, 85, 247, 0.3)">Ekle</button>
                    </div>

                    <div style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem">
                        ${colors.length === 0 ? '<div style="text-align:center; color:#cbd5e1; padding:1rem">Henuz renk eklenmemis.</div>' : ''}
                        ${colors.map(c => {
                            const colorArg = String(c).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                            return `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.75rem 1rem; border-radius:0.75rem; border:1px solid #f1f5f9">
                                    <div style="display:flex; align-items:center; gap:0.75rem">
                                        <div style="width:16px; height:16px; border-radius:50%; border:1px solid #cbd5e1; background:${swatchColor(c)}"></div>
                                        <span style="font-weight:700; color:#475569; font-size:0.9rem; text-transform:uppercase">${UnitModule.escapeHtml(c)}</span>
                                    </div>
                                    <button onclick="UnitModule.deleteColor('${unitId}','${colorArg}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; transition:color 0.2s" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'"><i data-lucide="trash-2" width="14"></i></button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (window.lucide) window.lucide.createIcons();
        const input = document.getElementById('newColorInput');
        if (input) input.focus();
    },

    addColor: async (unitId) => {
        const val = document.getElementById('newColorInput')?.value.trim() || '';
        if (!val) return;
        if (!Array.isArray(DB.data.data.unitColors?.[unitId])) DB.data.data.unitColors[unitId] = [];

        const exists = DB.data.data.unitColors[unitId].some(c => String(c).toLowerCase() === val.toLowerCase());
        if (exists) {
            alert('Bu renk zaten var.');
            return;
        }

        DB.data.data.unitColors[unitId].push(val);
        await DB.save();
        const overlay = document.getElementById('colorModalOverlay');
        if (overlay) overlay.remove();
        UI.renderCurrentPage();
        UnitModule.openColorModal(unitId);
    },

    deleteColor: async (unitId, color) => {
        if (!confirm(color + ' silinsin mi?')) return;
        DB.data.data.unitColors[unitId] = (DB.data.data.unitColors[unitId] || []).filter(c => c !== color);
        await DB.save();
        const overlay = document.getElementById('colorModalOverlay');
        if (overlay) overlay.remove();
        UI.renderCurrentPage();
        UnitModule.openColorModal(unitId);
    },
    openUnit: (id) => { if (id === 'u_dtm') return UnitModule.openDepoTransfer(); UnitModule.state.activeUnitId = id; UnitModule.state.view = 'dashboard'; UI.renderCurrentPage(); },
    openMachines: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'machines'; UI.renderCurrentPage(); },
    openStock: (id) => { if (id) UnitModule.state.activeUnitId = id; UnitModule.state.view = 'stock'; UnitModule.state.stockTab = 'ROD'; UI.renderCurrentPage(); },
    setStockTab: (t) => { UnitModule.state.stockTab = t; UI.renderCurrentPage(); },
    goBack: () => {
        if (UnitModule.state.view === 'list') Router.navigate('dashboard');
        else if (UnitModule.state.view === 'dashboard') UnitModule.state.view = 'list';
        else UnitModule.state.view = 'dashboard';
        UI.renderCurrentPage();
    },

    // --- STOCK EDITING LOGIC ---
    // Sets the UI to 'Edit Mode' for a specific item
    editStock: (id) => {
        const item = DB.data.data.inventory.find(i => i.id === id);
        if (!item) return;

        UnitModule.state.editingId = id;
        UnitModule.state.stockTab = item.category; // Switch to correct tab
        UI.renderCurrentPage(); // Re-render to show fields and update button state

        // We must delay slightly to ensure DOM is ready after re-render
        setTimeout(() => {
            if (document.getElementById('stk_dia')) document.getElementById('stk_dia').value = item.diameter || '';
            if (document.getElementById('stk_thick')) document.getElementById('stk_thick').value = item.thickness || '';
            if (document.getElementById('stk_len')) document.getElementById('stk_len').value = item.length || '';
            const colorType = UnitModule.resolveSharedColorTypeForRow(item, 'eloksal');
            if (document.getElementById('stk_color_type')) document.getElementById('stk_color_type').value = colorType;
            UnitModule.refreshStockColorOptions(item.color || '', item.colorCode || '');
            if (document.getElementById('stk_qty')) document.getElementById('stk_qty').value = item.quantity || '';
            if (document.getElementById('stk_target')) document.getElementById('stk_target').value = item.targetStock || '';
            if (document.getElementById('stk_addr')) document.getElementById('stk_addr').value = item.address || '';
            if (document.getElementById('stk_name')) document.getElementById('stk_name').value = item.name || '';
            if (document.getElementById('stk_bub')) document.getElementById('stk_bub').checked = item.isBubble || false;

            // Scroll to top to see the form
            document.querySelector('.page-title').scrollIntoView({ behavior: 'smooth' });
        }, 50);
    },

    cancelEdit: () => {
        UnitModule.state.editingId = null;
        UI.renderCurrentPage();
    },

    saveStock: async (uid) => {
        const tab = UnitModule.state.stockTab;
        const dia = document.getElementById('stk_dia')?.value;
        const thick = document.getElementById('stk_thick')?.value;
        const len = document.getElementById('stk_len')?.value;
        const colType = UnitModule.normalizeSharedColorType(document.getElementById('stk_color_type')?.value || '');
        const col = document.getElementById('stk_col')?.value;
        const colCode = String(document.getElementById('stk_col_code')?.value || '').trim().toUpperCase();
        const qty = document.getElementById('stk_qty')?.value;
        const target = document.getElementById('stk_target')?.value;
        const addr = document.getElementById('stk_addr')?.value;
        const nameInp = document.getElementById('stk_name')?.value;
        const isBub = document.getElementById('stk_bub')?.checked;

        if (!qty || !target) { alert('Adet ve Hedef zorunludur.'); return; }
        if (!colType) { alert('Renk kategorisi seciniz.'); return; }
        if (!col) { alert('Renk seciniz.'); return; }

        let name = '';
        if (tab === 'ROD') name = `O${dia} Cubuk`;
        else if (tab === 'PIPE') name = `O${dia} Boru`;
        else name = nameInp || 'Ozel Profil';

        if (UnitModule.state.editingId) {
            // UPDATE EXISTING
            const idx = DB.data.data.inventory.findIndex(i => i.id === UnitModule.state.editingId);
            if (idx !== -1) {
                DB.data.data.inventory[idx] = {
                    ...DB.data.data.inventory[idx],
                    name, diameter: dia, thickness: thick, length: len, colorType: colType, color: col, colorCode: colCode,
                    quantity: Number(qty), targetStock: Number(target), address: addr, isBubble: isBub,
                    updated_at: new Date().toISOString()
                };
            }
            UnitModule.state.editingId = null;
        } else {
            // CREATE NEW
            const item = {
                id: crypto.randomUUID(),
                unitId: uid,
                category: tab,
                name,
                diameter: dia,
                thickness: thick,
                length: len,
                colorType: colType,
                color: col,
                colorCode: colCode,
                quantity: Number(qty),
                targetStock: Number(target),
                address: addr,
                isBubble: isBub,
                created_at: new Date().toISOString()
            };
            if (!DB.data.data.inventory) DB.data.data.inventory = [];
            DB.data.data.inventory.push(item);
        }

        await DB.save();
        UI.renderCurrentPage();
    },

    deleteStock: async (id) => {
        if (confirm('Silmek istediginize emin misiniz?')) {
            DB.data.data.inventory = DB.data.data.inventory.filter(i => i.id !== id);
            await DB.save();
            UI.renderCurrentPage();
        }
    },

    setMachineStatus: async (mid, status) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const m = DB.data.data.machines.find(x => x.id === mid);
        if (m) { m.status = status; await DB.save(); UI.renderCurrentPage(); }
    },
    addMachineModal: (uid) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        Modal.open('Makine Ekle', `
            <input id="new_mac_name" class="form-input" placeholder="Makine Adi (Orn: Cnc-2)" style="width:100%; padding:0.8rem; border:1px solid #ccc; border-radius:0.5rem; margin-bottom:1rem">
            <button class="btn-primary" style="width:100%" onclick="UnitModule.saveMachine('${uid}')">Kaydet</button>
        `);
    },
    saveMachine: async (uid) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const name = document.getElementById('new_mac_name').value;
        if (name) {
            DB.data.data.machines.push({ id: crypto.randomUUID(), unitId: uid, name, status: 'ACTIVE' });
            await DB.save(); Modal.close(); UI.renderCurrentPage();
        }
    },
    openMachineEditModal: (machineId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const machine = (DB.data.data.machines || []).find(m => m.id === machineId);
        if (!machine) return;

        Modal.open('Makine Duzenle', `
            <div style="display:flex; flex-direction:column; gap:0.8rem">
                <input id="edit_mac_name" class="form-input" value="${machine.name}" placeholder="Makine Adi" style="width:100%; padding:0.8rem; border:1px solid #ccc; border-radius:0.5rem">
                <select id="edit_mac_status" style="width:100%; padding:0.8rem; border:1px solid #ccc; border-radius:0.5rem">
                    <option value="ACTIVE" ${machine.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
                    <option value="MAINTENANCE" ${machine.status === 'MAINTENANCE' ? 'selected' : ''}>MAINTENANCE</option>
                    <option value="IDLE" ${machine.status === 'IDLE' ? 'selected' : ''}>IDLE</option>
                </select>
                <button class="btn-primary" style="width:100%" onclick="UnitModule.saveMachineEdit('${machineId}')">Kaydet</button>
            </div>
        `);
    },
    saveMachineEdit: async (machineId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const machine = (DB.data.data.machines || []).find(m => m.id === machineId);
        if (!machine) return;

        const name = document.getElementById('edit_mac_name')?.value?.trim() || '';
        const status = document.getElementById('edit_mac_status')?.value || 'IDLE';
        if (!name) {
            alert('Makine adi zorunlu.');
            return;
        }

        machine.name = name;
        machine.status = status;
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },
    deleteMachine: async (machineId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        if (!confirm('Bu makine silinsin mi?')) return;

        DB.data.data.machines = (DB.data.data.machines || []).filter(m => m.id !== machineId);
        await DB.save();
        UI.renderCurrentPage();
    },
    openUnitEditModal: (unitId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!unit) return;

        Modal.open('Birimi Duzenle', `
            <div style="display:flex; flex-direction:column; gap:0.8rem">
                <input id="edit_unit_name" class="form-input" value="${unit.name}" placeholder="Birim adi" style="width:100%; padding:0.8rem; border:1px solid #ccc; border-radius:0.5rem">
                <button class="btn-primary" style="width:100%" onclick="UnitModule.saveUnit('${unitId}')">Kaydet</button>
            </div>
        `);
    },
    saveUnit: async (unitId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!unit) return;

        const name = document.getElementById('edit_unit_name')?.value?.trim() || '';
        if (!name) {
            alert('Birim adi zorunlu.');
            return;
        }

        unit.name = name.toUpperCase();
        await DB.save();
        Modal.close();
        UI.renderCurrentPage();
    },
    deleteUnit: async (unitId) => {
        if (!UnitModule.isSuperAdmin()) {
            alert('Bu islem sadece super admin icin acik.');
            return;
        }
        const unit = (DB.data.data.units || []).find(u => u.id === unitId);
        if (!unit) return;
        if (!confirm(`"${unit.name}" birimi silinsin mi?`)) return;

        DB.data.data.units = (DB.data.data.units || []).filter(u => u.id !== unitId);
        DB.data.data.machines = (DB.data.data.machines || []).filter(m => m.unitId !== unitId);
        DB.data.data.inventory = (DB.data.data.inventory || []).filter(i => i.unitId !== unitId);
        DB.data.data.personnel = (DB.data.data.personnel || []).filter(p => p.unitId !== unitId);
        DB.data.data.cncCards = (DB.data.data.cncCards || []).filter(c => c.unitId !== unitId);

        if (UnitModule.state.activeUnitId === unitId) {
            UnitModule.state.activeUnitId = null;
            UnitModule.state.view = 'list';
        }

        await DB.save();
        UI.renderCurrentPage();
    },
    isSuperAdmin: () => {
        const role = String(DB.data?.meta?.activeRole || 'super-admin').toLowerCase();
        return role === 'super-admin';
    }
};
