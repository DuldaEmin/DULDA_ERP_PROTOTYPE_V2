const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const Policy = require('../src/core/operational-code-high-water.js');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
}

function loadModule(relativePath, symbolName, extraContext = {}) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
    + `\n;globalThis.__ai001Exported = ${symbolName};`;
  const context = {
    console,
    globalThis: {},
    DB: { data: { meta: {}, data: {} }, save: async () => {} },
    UI: { renderCurrentPage: () => {} },
    Modal: {},
    Router: {},
    alert: () => {},
    confirm: () => true,
    crypto: { randomUUID: () => crypto.randomUUID() },
    window: {},
    document: { getElementById: () => null },
    ...extraContext
  };
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: relativePath });
  return context.__ai001Exported;
}

function identityPolicyShim() {
  return {
    getCodeHighWaterMark: (state, prefix) => Policy.getHighWaterMark(state, prefix),
    getNextMonotonicCode: (state, options = {}) => Policy.nextCode(
      state,
      options.prefix,
      Array.from(options.usedCodes || [])
    ),
    getNextGlobalCode: (state, options = {}) => Policy.nextCode(state, options.prefix),
    nextCodeFromUsed: (usedCodes, prefix) => Policy.nextCode({}, prefix, Array.from(usedCodes || [])),
    collectGlobalCodes: () => new Set(),
    normalizeCode: (value) => String(value ?? '').trim().toUpperCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-'),
    isSequentialCode: (value, prefix) => Policy.isValidCode(value, prefix)
  };
}

function emptyCoreState(marks = {}) {
  return {
    meta: {
      operationalCodeHighWaterMarks: { ...marks },
      operationalCodeHighWaterUntrustedFamilies: []
    },
    data: Object.fromEntries(Policy.SPECS.map((spec) => [spec.collection, []]))
  };
}

test('FAZ 1: canonical minimum-altı-hane biçimi ve kayıpsız decimal artış', () => {
  assert.equal(Policy.formatCode('WO', '1'), 'WO-000001');
  assert.equal(Policy.formatCode('WO', '999999'), 'WO-999999');
  assert.equal(Policy.formatCode('WO', '1000000'), 'WO-1000000');
  assert.equal(Policy.isValidCode('WO-000001', 'WO'), true);
  assert.equal(Policy.isValidCode('WO-1000000', 'WO'), true);
  assert.equal(Policy.isValidCode('WO-0000001', 'WO'), false);
  assert.equal(Policy.isValidCode('WO-000000', 'WO'), false);
  assert.equal(Policy.isValidCode('WO-+1000000', 'WO'), false);
  assert.equal(Policy.isValidCode('WO-1e6', 'WO'), false);

  const state = emptyCoreState({ WO: '9007199254740991' });
  assert.equal(Policy.nextCode(state, 'WO'), 'WO-9007199254740992');
  state.meta.operationalCodeHighWaterMarks.WO = '99999999999999999999';
  assert.equal(Policy.nextCode(state, 'WO'), 'WO-100000000000000000000');
});

test('FAZ 1: bütün çekirdek aileler 999998 → 999999 → 1000000 → 1000001 sınırını geçer', () => {
  for (const spec of Policy.SPECS) {
    let current = emptyCoreState({ [spec.prefix]: '999998' });
    const values = ['999999', '1000000', '1000001'];
    for (let index = 0; index < values.length; index += 1) {
      const sequence = values[index];
      const incoming = clone(current);
      incoming.data[spec.collection].push({
        id: `${spec.prefix.toLowerCase()}-${index}`,
        [spec.fields[0]]: Policy.formatCode(spec.prefix, sequence)
      });
      const result = Policy.diagnoseTransition(current, incoming);
      assert.equal(result.ok, true, `${spec.prefix}: ${JSON.stringify(result.issues)}`);
      assert.equal(result.marks[spec.prefix], sequence);
      Policy.applyPersistentMarks(incoming, result.marks, result.untrustedFamilies);
      assert.equal(incoming.meta.operationalCodeHighWaterMarks[spec.prefix], sequence);
      current = incoming;
    }
  }
});

test('FAZ 1: 7+ duplicate, reuse ve renumber girişimleri fail-closed engellenir', () => {
  const current = emptyCoreState({ TF: '1000000' });
  current.data.salesShipments.push({ id: 'tf-existing', shipmentNo: 'TF-1000000' });

  const duplicate = clone(current);
  duplicate.data.salesShipments.push({ id: 'tf-duplicate', shipmentNo: 'TF-1000000' });
  const duplicateResult = Policy.diagnoseTransition(current, duplicate);
  assert.equal(duplicateResult.ok, false);
  assert.ok(duplicateResult.issues.some((issue) => issue.reasonCode === 'OPERATIONAL_CODE_DUPLICATE'));

  const cleaned = clone(current);
  cleaned.data.salesShipments = [];
  const cleanupResult = Policy.diagnoseTransition(current, cleaned);
  assert.equal(cleanupResult.ok, true);
  Policy.applyPersistentMarks(cleaned, cleanupResult.marks);
  assert.equal(cleaned.meta.operationalCodeHighWaterMarks.TF, '1000000');

  const reused = clone(cleaned);
  reused.data.salesShipments.push({ id: 'tf-reused', shipmentNo: 'TF-1000000' });
  const reuseResult = Policy.diagnoseTransition(cleaned, reused);
  assert.equal(reuseResult.ok, false);
  assert.ok(reuseResult.issues.some((issue) => issue.reasonCode === 'OPERATIONAL_CODE_REUSE'
    && issue.highWater === '1000000'));

  const renumbered = clone(current);
  renumbered.data.salesShipments[0].shipmentNo = 'TF-1000001';
  const renumberResult = Policy.diagnoseTransition(current, renumbered);
  assert.equal(renumberResult.ok, false);
  assert.ok(renumberResult.issues.some((issue) => issue.reasonCode === 'OPERATIONAL_CODE_CHANGED'));
});

test('FAZ 1: cleanup helper 7+ high-water değerini kayıtlar silinse de korur', () => {
  const Cleanup = require('../src/core/prototype-sales-test-cohort-cleanup.js');
  const state = emptyCoreState({ TF: '999999' });
  state.data.salesShipments.push({ id: 'tf-boundary', shipmentNo: 'TF-1000000' });
  const marks = Cleanup.buildOperationalCodeHighWaterMarks(state);
  assert.equal(marks.TF, '1000000');

  const cleaned = clone(state);
  cleaned.data.salesShipments = [];
  cleaned.meta.operationalCodeHighWaterMarks = marks;
  assert.equal(Policy.nextCode(cleaned, 'TF'), 'TF-1000001');
});

test('FAZ 1: gerçek istemci generator hedefleri 999999 sonrasında 1000000 üretir', () => {
  const marks = Object.fromEntries(Policy.SPECS.map((spec) => [spec.prefix, '999999']));
  const DB = { data: emptyCoreState(marks), save: async () => {} };
  const IdentityPolicy = identityPolicyShim();
  const context = { DB, IdentityPolicy, OperationalCodeHighWater: Policy };
  const SalesModule = loadModule('src/modules/sales-module.js', 'SalesModule', context);
  const PlanningModule = loadModule('src/modules/planning-module.js', 'PlanningModule', context);
  const UnitModule = loadModule('src/modules/unit-module.js', 'UnitModule', context);
  const StockModule = loadModule('src/modules/stock-module.js', 'StockModule', context);

  assert.equal(SalesModule.generateSalesOrderNo(), 'SOR-1000000');
  assert.equal(PlanningModule.getNextDemandCode(), 'PLN-1000000');
  assert.equal(PlanningModule.getNextSanalTaksimAllocationInstructionCode(), 'STAI-1000000');
  assert.equal(UnitModule.getNextWorkOrderCode(), 'WO-1000000');
  assert.equal(StockModule.getNextMontageDispatchPlanNo(), 'MGP-1000000');
  assert.equal(StockModule.getNextMontageDispatchShipmentNo(), 'MGS-1000000');
  assert.equal(StockModule.getNextMontageCompletionTransferNo(), 'MCT-1000000');
  assert.equal(StockModule.getNextSalesShipmentPlanNo(), 'SVP-1000000');
  assert.equal(StockModule.getNextSalesShipmentNo(), 'TF-1000000');
  assert.equal(StockModule.getNextOutsourceDispatchNo(), 'FTS-1000000');
});

test('FAZ 1: sunucu STAI/SVP/TF doğrulayıcıları 7+ kodu yalnız hane sayısı nedeniyle reddetmez', () => {
  const server = require('../serve.js');

  const staiIssues = server.validateSanalTaksimAllocationInstructions({
    data: { sanalTaksimAllocationInstructions: [{ instructionCode: 'STAI-1000000' }] }
  });
  assert.equal(staiIssues.some((issue) => /instructionCode STAI-000001/.test(issue)), false);

  const svpIssues = server.validateSalesShipmentPlans({
    data: { salesShipmentPlans: [{ planNo: 'SVP-1000000' }] }
  });
  assert.equal(svpIssues.some((issue) => /planNo geçersiz veya mükerrer/.test(issue)), false);

  const tfIssues = server.validateSalesShipments({
    data: { salesShipments: [{ shipmentNo: 'TF-1000000' }] }
  });
  assert.equal(tfIssues.some((issue) => /shipmentNo geçersiz veya mükerrer/.test(issue)), false);
});

test('FAZ 1: gerçek demo_state salt-okunur kalır ve mevcut kayıt kodları renumber edilmez', () => {
  const statePath = path.join(root, 'demo_state.json');
  const beforeText = fs.readFileSync(statePath, 'utf8');
  const state = JSON.parse(beforeText);
  const dataBefore = JSON.stringify(state.data);
  const cloneState = clone(state);
  const transition = Policy.diagnoseTransition(state, cloneState);
  assert.equal(transition.ok, true, JSON.stringify(transition.issues));
  Policy.applyPersistentMarks(cloneState, transition.marks, transition.untrustedFamilies);
  assert.equal(JSON.stringify(cloneState.data), dataBefore);
  assert.equal(fs.readFileSync(statePath, 'utf8'), beforeText);
  assert.equal(sha256(fs.readFileSync(statePath)), sha256(Buffer.from(beforeText)));
});

test('FAZ 2: DSI/SDT/DTR 999999 sınırı, duplicate ve cleanup devamlılığı', () => {
  for (const spec of Policy.ADDITIONAL_SPECS) {
    let current = emptyCoreState({ [spec.prefix]: '999998' });
    current.data[spec.collection] = [];
    for (const [index, sequence] of ['999999', '1000000', '1000001'].entries()) {
      const incoming = clone(current);
      incoming.data[spec.collection].push({
        id: `${spec.prefix.toLowerCase()}-${index}`,
        [spec.fields[0]]: Policy.formatCode(spec.prefix, sequence)
      });
      const result = Policy.diagnoseTransition(current, incoming);
      assert.equal(result.ok, true, `${spec.prefix}: ${JSON.stringify(result.issues)}`);
      assert.equal(result.marks[spec.prefix], sequence);
      Policy.applyPersistentMarks(incoming, result.marks, result.untrustedFamilies);
      current = incoming;
    }

    const duplicate = clone(current);
    duplicate.data[spec.collection].push({
      id: `${spec.prefix.toLowerCase()}-duplicate`,
      [spec.fields[0]]: Policy.formatCode(spec.prefix, '1000001')
    });
    assert.ok(Policy.diagnoseTransition(current, duplicate).issues
      .some((issue) => issue.reasonCode === 'OPERATIONAL_CODE_DUPLICATE'));

    const cleaned = clone(current);
    cleaned.data[spec.collection] = [];
    const cleanupResult = Policy.diagnoseTransition(current, cleaned);
    assert.equal(cleanupResult.ok, true);
    Policy.applyPersistentMarks(cleaned, cleanupResult.marks);
    assert.equal(Policy.nextCode(cleaned, spec.prefix), Policy.formatCode(spec.prefix, '1000002'));
  }
});

test('FAZ 2: yeni DTR ailesi canlı maksimumdan güvenli metadata baseline kurar', () => {
  const current = emptyCoreState();
  current.data.depoTransferTasks = [
    { id: 'dtr-1', taskCode: 'DTR-000001' },
    { id: 'dtr-4', taskCode: 'DTR-000004' }
  ];
  const incoming = clone(current);
  incoming.data.depoTransferTasks.push({ id: 'dtr-5', taskCode: 'DTR-000005' });
  const result = Policy.diagnoseTransition(current, incoming);
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.equal(result.marks.DTR, '5');
});

test('FAZ 2: MK/EK yıl bazlı sayaçları bağımsız, kayıpsız ve cleanup sonrası monoton kalır', () => {
  for (const spec of Policy.YEAR_SPECS) {
    const collection = spec.collection;
    let current = emptyCoreState({ [Policy.yearMarkKey(spec.prefix, '2026')]: '999998' });
    current.data[collection] = [];
    for (const [index, sequence] of ['999999', '1000000', '1000001'].entries()) {
      const incoming = clone(current);
      incoming.data[collection].push({
        id: `${spec.prefix.toLowerCase()}-2026-${index}`,
        [spec.fields[0]]: Policy.formatYearCode(spec.prefix, '2026', sequence)
      });
      const result = Policy.diagnoseTransition(current, incoming);
      assert.equal(result.ok, true, `${spec.prefix}: ${JSON.stringify(result.issues)}`);
      assert.equal(result.marks[Policy.yearMarkKey(spec.prefix, '2026')], sequence);
      Policy.applyPersistentMarks(incoming, result.marks, result.untrustedFamilies);
      current = incoming;
    }

    assert.equal(Policy.nextYearCode(current, spec.prefix, '2026'), `${spec.prefix}-2026-1000002`);
    assert.equal(Policy.nextYearCode(current, spec.prefix, '2027'), `${spec.prefix}-2027-000001`);

    const cleaned = clone(current);
    cleaned.data[collection] = [];
    const cleanupResult = Policy.diagnoseTransition(current, cleaned);
    assert.equal(cleanupResult.ok, true);
    Policy.applyPersistentMarks(cleaned, cleanupResult.marks);
    assert.equal(Policy.nextYearCode(cleaned, spec.prefix, '2026'), `${spec.prefix}-2026-1000002`);
  }
});

test('FAZ 2: gerçek DSI/SDT/DTR/MK/EK generator hedefleri sınırdan sonra devam eder', () => {
  const marks = {
    DSI: '999999',
    SDT: '999999',
    DTR: '999999',
    'MK:2026': '999999',
    'EK:2026': '999999'
  };
  const DB = { data: emptyCoreState(marks), save: async () => {} };
  Object.assign(DB.data.data, {
    workOrderDispatchNotes: [],
    freeExternalVendorJobs: [],
    depoTransferTasks: [],
    stockGoodsReceipts: [],
    stockManualEntries: []
  });
  const IdentityPolicy = identityPolicyShim();
  const context = { DB, IdentityPolicy, OperationalCodeHighWater: Policy };
  const UnitModule = loadModule('src/modules/unit-module.js', 'UnitModule', context);
  const StockModule = loadModule('src/modules/stock-module.js', 'StockModule', context);
  const date = new Date('2026-06-15T12:00:00.000Z');

  assert.equal(UnitModule.getNextWorkOrderDispatchDocNo(), 'DSI-1000000');
  assert.equal(UnitModule.getNextFreeExternalVendorJobCode(), 'SDT-1000000');
  assert.equal(UnitModule.getNextDepoTaskCode(), 'DTR-1000000');
  assert.equal(StockModule.getNextOperationCode(), 'DTR-1000000');
  assert.equal(StockModule.generateGoodsReceiptDocNo(date), 'MK-2026-1000000');
  assert.equal(StockModule.generateInventoryRegistrationDocNo(date), 'EK-2026-1000000');
});

test('FAZ 2: DTR-1000000 canonical route/lineage anahtarını korur', () => {
  const CanonicalRouteLineageCore = require('../src/core/canonical-route-lineage-core.js');
  const sixDigit = CanonicalRouteLineageCore.normalizeStep({
    stationId: 'u_dtm', processId: 'DTR-000004', seq: 1
  }, 0);
  const sevenDigit = CanonicalRouteLineageCore.normalizeStep({
    stationId: 'u_dtm', processId: 'DTR-1000000', seq: 1
  }, 0);
  assert.equal(sixDigit.ok, true);
  assert.equal(sevenDigit.ok, true);
  assert.equal(sixDigit.token, 'DTR');
  assert.equal(sevenDigit.token, 'DTR');
});

test('FAZ 2: cleanup planlayıcısı 7+ EK belge referansını tanıyan sözleşmeyi taşır', () => {
  const source = fs.readFileSync(path.join(root, 'src/core/prototype-test-cohort-planner.js'), 'utf8');
  const pattern = source.match(/const manualDocNoFromStockRow = \(row\) => \{([\s\S]*?)\n    \};/)?.[1] || '';
  assert.match(pattern, /\[1-9\]\\d\{6,\}/);
});

test('FAZ 3: ana kart aileleri 999999 sınırından 7+ haneye monoton geçer', () => {
  for (const spec of Policy.MASTER_SPECS) {
    const makeRecord = (id, sequence, group = '') => ({
      id,
      [spec.fields[0]]: Policy.formatCode(spec.prefix, sequence),
      ...(spec.prefix === 'MUS' ? { customerRefId: Policy.formatCode('MREF', sequence) } : {}),
      ...(spec.prefix === 'MREF' ? { customerCode: Policy.formatCode('MUS', sequence) } : {}),
      ...(spec.allowSameGroupField ? { [spec.allowSameGroupField]: group } : {})
    });
    let current = emptyCoreState({ [spec.prefix]: '999998' });
    current.data[spec.collection] = [];
    for (const [index, sequence] of ['999999', '1000000', '1000001'].entries()) {
      const incoming = clone(current);
      incoming.data[spec.collection].push(makeRecord(
        `${spec.prefix.toLowerCase()}-${index}`,
        sequence,
        `family-${index}`
      ));
      const result = Policy.diagnoseTransition(current, incoming);
      assert.equal(result.ok, true, `${spec.prefix}: ${JSON.stringify(result.issues)}`);
      assert.equal(result.marks[spec.prefix], sequence);
      Policy.applyPersistentMarks(incoming, result.marks, result.untrustedFamilies);
      current = incoming;
    }

    const duplicate = clone(current);
    duplicate.data[spec.collection].push(makeRecord(
      `${spec.prefix.toLowerCase()}-duplicate`,
      '1000001',
      'different-family'
    ));
    const duplicateResult = Policy.diagnoseTransition(current, duplicate);
    assert.equal(duplicateResult.ok, false, `${spec.prefix}: duplicate kabul edildi`);
    assert.ok(duplicateResult.issues.some((issue) =>
      ['OPERATIONAL_CODE_DUPLICATE', 'OPERATIONAL_CODE_REUSE'].includes(issue.reasonCode)
    ), spec.prefix);

    const cleaned = clone(current);
    cleaned.data[spec.collection] = cleaned.data[spec.collection]
      .filter((row) => row[spec.fields[0]] !== Policy.formatCode(spec.prefix, '1000001'));
    const cleanupResult = Policy.diagnoseTransition(current, cleaned);
    assert.equal(cleanupResult.ok, true, `${spec.prefix}: ${JSON.stringify(cleanupResult.issues)}`);
    Policy.applyPersistentMarks(cleaned, cleanupResult.marks, cleanupResult.untrustedFamilies);
    assert.equal(Policy.nextCode(cleaned, spec.prefix), Policy.formatCode(spec.prefix, '1000002'));

    const reused = clone(cleaned);
    reused.data[spec.collection].push(makeRecord(
      `${spec.prefix.toLowerCase()}-reused`,
      '1000001',
      'reused-family'
    ));
    const reuseResult = Policy.diagnoseTransition(cleaned, reused);
    assert.equal(reuseResult.ok, false, `${spec.prefix}: silinen kod yeniden kullanıldı`);
    assert.ok(reuseResult.issues.some((issue) => issue.reasonCode === 'OPERATIONAL_CODE_REUSE'), spec.prefix);

    const renumbered = clone(current);
    renumbered.data[spec.collection][0][spec.fields[0]] = Policy.formatCode(spec.prefix, '1000002');
    const renumberResult = Policy.diagnoseTransition(current, renumbered);
    assert.equal(renumberResult.ok, false, `${spec.prefix}: mevcut kayıt renumber edildi`);
    assert.ok(renumberResult.issues.some((issue) => issue.reasonCode === 'OPERATIONAL_CODE_CHANGED'), spec.prefix);
  }
});

test('FAZ 3: paylaşımlı koleksiyonlardaki legacy kodlar korunur, otomatik kod renumber edilemez', () => {
  const current = emptyCoreState();
  Object.assign(current.data, {
    eloksalCards: [{ id: 'stb-legacy-peer', cardCode: 'STB-000001' }],
    salesProductVariants: [{ id: 'svr-legacy', variantCode: '0212-001' }],
    salesCatalogProducts: [{ id: 'sal-legacy', idCode: 'KOR-01' }],
    products: [{ id: 'product-legacy', code: 'AKS-01' }],
    stockDepotLocations: [{ id: 'loc-legacy', idCode: 'LOC-MONTAGE-RECEIPT' }]
  });
  const unchanged = Policy.diagnoseTransition(current, clone(current));
  assert.equal(unchanged.ok, true, JSON.stringify(unchanged.issues));

  const tracked = clone(current);
  tracked.meta.operationalCodeHighWaterMarks.LOC = '1000000';
  tracked.data.stockDepotLocations.push({ id: 'loc-tracked', idCode: 'LOC-1000000' });
  const renumbered = clone(tracked);
  renumbered.data.stockDepotLocations.find((row) => row.id === 'loc-tracked').idCode = 'LOC-MANUAL';
  const result = Policy.diagnoseTransition(tracked, renumbered);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.reasonCode === 'OPERATIONAL_CODE_CHANGED'));
});

test('FAZ 3: URM aile kodu aynı familyId varyantlarında paylaşılır, farklı ailede reddedilir', () => {
  const current = emptyCoreState({ URM: '1000000' });
  current.data.catalogProductVariants = [
    { id: 'variant-a1', familyId: 'family-a', familyCode: 'URM-1000000' }
  ];
  const sameFamily = clone(current);
  sameFamily.data.catalogProductVariants.push({
    id: 'variant-a2', familyId: 'family-a', familyCode: 'URM-1000000'
  });
  assert.equal(Policy.diagnoseTransition(current, sameFamily).ok, true);

  const differentFamily = clone(current);
  differentFamily.data.catalogProductVariants.push({
    id: 'variant-b1', familyId: 'family-b', familyCode: 'URM-1000000'
  });
  const result = Policy.diagnoseTransition(current, differentFamily);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) =>
    ['OPERATIONAL_CODE_DUPLICATE', 'OPERATIONAL_CODE_REUSE'].includes(issue.reasonCode)
  ));
});

test('FAZ 3: gerçek ana kart generator hedefleri 999999 sonrasında 1000000 üretir', () => {
  const marks = Object.fromEntries(Policy.MASTER_SPECS.map((spec) => [spec.prefix, '999999']));
  const DB = { data: emptyCoreState(marks), save: async () => {} };
  Policy.MASTER_SPECS.forEach((spec) => { DB.data.data[spec.collection] = []; });
  Object.assign(DB.data.data, {
    products: [], salesProductVariants: [], catalogProductVariants: [], customers: [], suppliers: [],
    salesCatalogProducts: [], salesAnchorageProducts: [], stockDepotLocations: [], personnel: [],
    montageCards: [], cncCards: [], sawCutOrders: [], extruderLibraryCards: [], plexiPolishCards: [],
    pvdCards: [], ibrahimPolishCards: [], eloksalCards: [], partComponentCards: [], semiFinishedCards: [],
    assemblyGroups: [], productCategories: [], units: []
  });
  const IdentityPolicy = identityPolicyShim();
  const context = { DB, IdentityPolicy, OperationalCodeHighWater: Policy };
  const CncLibraryModule = loadModule('src/modules/cnc-library-module.js', 'CncLibraryModule', context);
  const CncImportService = loadModule('src/modules/cnc-import-service.js', 'CncImportService', context);
  const UnitModule = loadModule('src/modules/unit-module.js', 'UnitModule', context);
  const MontageLibraryModule = loadModule('src/modules/montage-library-module.js', 'MontageLibraryModule', {
    ...context, UnitModule: { isGlobalCodeTaken: () => false }
  });
  const ProductLibraryModule = loadModule('src/modules/product-library-module.js', 'ProductLibraryModule', context);
  const SalesModule = loadModule('src/modules/sales-module.js', 'SalesModule', context);
  const PurchasingModule = loadModule('src/modules/purchasing-module.js', 'PurchasingModule', context);
  const StockModule = loadModule('src/modules/stock-module.js', 'StockModule', context);
  const PersonnelModule = loadModule('src/modules/personnel-module.js', 'PersonnelModule', context);

  assert.equal(CncLibraryModule.generateId(), 'CNC-1000000');
  assert.equal(CncImportService.getNextGlobalCode(new Set(), 'CNC', 6, DB.data), 'CNC-1000000');
  assert.equal(UnitModule.getNextSawProcessCode(), 'TST-1000000');
  assert.equal(UnitModule.generateExtruderCardCode(), 'EKS-1000000');
  assert.equal(UnitModule.generatePlexiCardCode(), 'PLSJ-1000000');
  assert.equal(UnitModule.generatePvdCardCode(), 'PVD-1000000');
  assert.equal(UnitModule.generatePolishCardCode(), 'IPS-1000000');
  assert.equal(UnitModule.generateEloksalCardCode('ELOKSAL'), 'ELX-1000000');
  assert.equal(UnitModule.generateEloksalCardCode('STATIK_BOYA'), 'STB-1000000');
  assert.equal(MontageLibraryModule.getNextCardCode(), 'MON-1000000');
  assert.equal(ProductLibraryModule.generateSalesVariantCode({}), 'SVR-1000000');
  assert.equal(ProductLibraryModule.generateComponentCode(null, 'PART'), 'PRC-1000000');
  assert.equal(ProductLibraryModule.generateComponentCode(null, 'SEMI'), 'YRM-1000000');
  assert.equal(ProductLibraryModule.generateAssemblyCode(), 'GRP-1000000');
  assert.equal(ProductLibraryModule.generateModelFamilyCode(), 'URM-1000000');
  assert.equal(SalesModule.generateCustomerCode(), 'MUS-1000000');
  assert.equal(SalesModule.generateCustomerRefId(), 'MREF-1000000');
  assert.equal(PurchasingModule.generateSupplierRefId(), 'TREF-1000000');
  assert.equal(SalesModule.generateCatalogPublicId(), 'SAL-1000000');
  assert.equal(SalesModule.generateAnchoragePublicId(), 'ANK-1000000');
  assert.equal(ProductLibraryModule.generateConsumableCode(), 'SRF-1000000');
  assert.equal(ProductLibraryModule.generateBoxCode(), 'KLI-1000000');
  assert.equal(StockModule.getNextLocationIdCode(), 'LOC-1000000');
  assert.equal(PersonnelModule.makePersonCode(), 'PER-1000000');
  assert.equal(SalesModule.generateCatalogRowId(), 'SCP-000001');
  assert.equal(SalesModule.generateAnchorageRowId(), 'SAP-000001');
  assert.equal(ProductLibraryModule.generateModelVariantCode('URM-1000000'), 'URM-1000000-V01');
});

test('FAZ 3: 7+ hane doğrulayıcıları ve no-renumber app-core sözleşmesi korunur', () => {
  const DB = { data: emptyCoreState(), save: async () => {} };
  Object.assign(DB.data.data, { customers: [], suppliers: [], partComponentCards: [], semiFinishedCards: [] });
  const context = { DB, IdentityPolicy: identityPolicyShim(), OperationalCodeHighWater: Policy };
  const SalesModule = loadModule('src/modules/sales-module.js', 'SalesModule', context);
  const PurchasingModule = loadModule('src/modules/purchasing-module.js', 'PurchasingModule', context);
  const ProductLibraryModule = loadModule('src/modules/product-library-module.js', 'ProductLibraryModule', context);
  assert.equal(SalesModule.isValidCustomerRefId('MREF-1000000'), true);
  assert.equal(PurchasingModule.isValidSupplierRefId('TREF-1000000'), true);
  assert.equal(ProductLibraryModule.getComponentCodeRegex('PART').test('PRC-1000000'), true);
  assert.equal(ProductLibraryModule.getComponentCodeRegex('SEMI').test('YRM-1000000'), true);

  const source = fs.readFileSync(path.join(root, 'src/core/app-core.js'), 'utf8');
  assert.doesNotMatch(source, /repair:\s*true/);
  assert.match(source, /\{ collection: 'workOrders', field: 'workOrderCode', prefix: 'WO'.*repair: false \}/);
  assert.match(source, /\{ collection: 'catalogProductVariants', field: 'familyCode', prefix: 'URM'.*repair: false \}/);
});
