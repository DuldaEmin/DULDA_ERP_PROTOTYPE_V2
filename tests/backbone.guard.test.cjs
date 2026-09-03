const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const nodeCrypto = require('node:crypto');

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function loadModule(relativePath, symbolName, extraContext = {}) {
  const absPath = path.join(__dirname, '..', relativePath);
  const source = fs.readFileSync(absPath, 'utf8') + `\n;globalThis.__exported = ${symbolName};`;
  const context = {
    console,
    globalThis: {},
    DB: { data: { data: {} }, save: async () => {} },
    UI: { renderCurrentPage: () => {} },
    Modal: {},
    Router: {},
    alert: () => {},
    confirm: () => true,
    crypto: { randomUUID: () => 'uuid-1' },
    window: {},
    document: { getElementById: () => null },
    ...extraContext
  };
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: relativePath });
  return { exported: context.__exported, context };
}

test('UnitModule.computeWorkLineRouteMetrics rota metriklerini dogru hesaplar', () => {
  const { exported: UnitModule } = loadModule('src/modules/unit-module.js', 'UnitModule');

  const order = { id: 'wo-1' };
  const line = {
    id: 'line-1',
    targetQty: 10,
    routes: [
      { id: 'r1', stationId: 'u_cut', stationName: 'CUT', processId: 'CUT-001' },
      { id: 'r2', stationId: 'u_pvd', stationName: 'PVD', processId: 'PVD-001' }
    ]
  };
  const txns = [
    { workOrderId: 'wo-1', lineId: 'line-1', stationId: 'u_cut', type: 'TAKE', qty: 8, routeId: 'r1', routeSeq: 1 },
    { workOrderId: 'wo-1', lineId: 'line-1', stationId: 'u_cut', type: 'COMPLETE', qty: 6, routeId: 'r1', routeSeq: 1 },
    { workOrderId: 'wo-1', lineId: 'line-1', stationId: 'u_pvd', type: 'TAKE', qty: 4, routeId: 'r2', routeSeq: 2 },
    { workOrderId: 'wo-1', lineId: 'line-1', stationId: 'u_pvd', type: 'COMPLETE', qty: 1, routeId: 'r2', routeSeq: 2 }
  ];

  const step1 = UnitModule.computeWorkLineRouteMetrics(order, line, 0, txns);
  assert.equal(step1.stepTarget, 10);
  assert.equal(step1.availableQty, 2);
  assert.equal(step1.inProcessQty, 2);
  assert.equal(step1.doneQty, 6);
  assert.equal(step1.transferPendingQty, 2);
  assert.equal(step1.depotPendingQty, 0);

  const step2 = UnitModule.computeWorkLineRouteMetrics(order, line, 1, txns);
  assert.equal(step2.stepTarget, 6);
  assert.equal(step2.availableQty, 2);
  assert.equal(step2.inProcessQty, 3);
  assert.equal(step2.doneQty, 1);
  assert.equal(step2.transferPendingQty, 0);
  assert.equal(step2.depotPendingQty, 1);
});

test('UnitModule route filter tekrar eden istasyonlarda adim ayrimini korur', () => {
  const { exported: UnitModule } = loadModule('src/modules/unit-module.js', 'UnitModule');

  const line = {
    id: 'line-repeated',
    routes: [
      { id: 'r1', stationId: 'u_repeat' },
      { id: 'r2', stationId: 'u_repeat' }
    ]
  };
  const txns = [
    { workOrderId: 'wo-2', lineId: 'line-repeated', stationId: 'u_repeat', type: 'TAKE', qty: 5, routeId: 'r1', routeSeq: 1 },
    { workOrderId: 'wo-2', lineId: 'line-repeated', stationId: 'u_repeat', type: 'TAKE', qty: 3, routeId: 'r2', routeSeq: 2 },
    { workOrderId: 'wo-2', lineId: 'line-repeated', stationId: 'u_repeat', type: 'TAKE', qty: 2 }
  ];

  const filter1 = UnitModule.getRouteFilterForIndex(line, 0);
  const filter2 = UnitModule.getRouteFilterForIndex(line, 1);

  const qty1 = UnitModule.getWorkTxnQty(txns, 'wo-2', 'line-repeated', 'u_repeat', 'TAKE', filter1);
  const qty2 = UnitModule.getWorkTxnQty(txns, 'wo-2', 'line-repeated', 'u_repeat', 'TAKE', filter2);

  assert.equal(qty1, 7);
  assert.equal(qty2, 3);
});

function buildSanalTaksimPhase1Snapshot() {
  return {
    partComponentCards: [
      { id: 'prc-card-1', code: 'PRC-000001', unit: 'ADET' }
    ],
    workOrders: [{
      id: 'wo-phase1',
      workOrderCode: 'WO-PHASE1',
      sourceId: 'demand-phase1',
      lines: [{
        id: 'line-phase1',
        componentCode: 'PRC-000001',
        targetQty: 100,
        routes: [
          { id: 'route-cut', seq: 1, stationId: 'u-cut', processId: 'CUT' },
          { id: 'route-polish', seq: 2, stationId: 'u-polish', processId: 'POLISH' }
        ]
      }]
    }],
    workOrderTransactions: [],
    stockDepotItems: [],
    montageDispatchShipments: [],
    montageCompletionTransfers: [],
    stock_movements: []
  };
}

function loadSanalTaksimResolver() {
  const CanonicalRouteLineageCore = require('../src/core/canonical-route-lineage-core.js');
  return loadModule('src/core/sanal-taksim-resolver.js', 'SanalTaksimResolver', {
    CanonicalRouteLineageCore
  }).exported;
}

function buildSourceAwarePoolRow({
  itemKey,
  prcId = 'prc-source-1',
  prcCode = 'PRC-SOURCE-1',
  itemQty,
  requiredQty,
  stockQty = 0,
  semiQty = 0,
  productionQty = 0
}) {
  return {
    key: `${itemKey}::PART:${prcId}`,
    itemKey,
    componentLibrary: 'PART',
    componentId: prcId,
    code: prcCode,
    unit: 'ADET',
    itemQty,
    requiredQty,
    useStockSelected: stockQty > 0,
    useStockQty: stockQty,
    useSemiSelected: semiQty > 0,
    useSemiQty: semiQty,
    useNetSelected: productionQty > 0,
    netQty: productionQty
  };
}

function buildSourceAwareProductionSnapshot() {
  const makeDemand = ({ suffix, qty, dueDate }) => ({
    id: `demand-${suffix}`,
    demandCode: `PLN-${suffix.toUpperCase()}`,
    sourceType: 'STOCK',
    status: 'RELEASED',
    released_at: '2026-07-01T08:00:00.000Z',
    dueDate,
    workOrderIds: [`wo-${suffix}`],
    workOrderCodes: [`WO-${suffix.toUpperCase()}`],
    items: [{ id: `item-${suffix}`, qty }],
    poolAnalysis: {
      stockAccountingMode: 'VIRTUAL_V1',
      rows: [buildSourceAwarePoolRow({
        itemKey: `item-${suffix}`,
        itemQty: qty,
        requiredQty: qty,
        productionQty: qty
      })]
    }
  });
  const makeWorkOrder = ({ suffix, qty }) => ({
    id: `wo-${suffix}`,
    workOrderCode: `WO-${suffix.toUpperCase()}`,
    sourceId: `demand-${suffix}`,
    sourceCode: `PLN-${suffix.toUpperCase()}`,
    sourceItemKey: `item-${suffix}`,
    lines: [{
      id: `wo-${suffix}-line`,
      componentId: 'prc-source-1',
      componentCode: 'PRC-SOURCE-1',
      unit: 'ADET',
      targetQty: qty,
      routes: [{
        id: `wo-${suffix}-route`,
        seq: 1,
        stationId: `unit-${suffix}`,
        processId: 'FINAL'
      }]
    }]
  });
  return {
    partComponentCards: [{ id: 'prc-source-1', code: 'PRC-SOURCE-1', unit: 'ADET' }],
    orders: [],
    planningDemands: [
      makeDemand({ suffix: 'a', qty: 10, dueDate: '2026-07-10' }),
      makeDemand({ suffix: 'b', qty: 5, dueDate: '2026-07-20' })
    ],
    workOrders: [
      makeWorkOrder({ suffix: 'a', qty: 10 }),
      makeWorkOrder({ suffix: 'b', qty: 5 })
    ],
    workOrderTransactions: [
      { id: 'txn-a-take', workOrderId: 'wo-a', lineId: 'wo-a-line', stationId: 'unit-a', routeId: 'wo-a-route', routeSeq: 1, processId: 'FINAL', type: 'TAKE', qty: 10 },
      { id: 'txn-a-complete', workOrderId: 'wo-a', lineId: 'wo-a-line', stationId: 'unit-a', routeId: 'wo-a-route', routeSeq: 1, processId: 'FINAL', type: 'COMPLETE', qty: 10 },
      { id: 'txn-a-store', workOrderId: 'wo-a', lineId: 'wo-a-line', stationId: 'unit-a', routeId: 'wo-a-route', routeSeq: 1, processId: 'FINAL', type: 'STORE', qty: 10 }
    ],
    stockDepotItems: [{
      id: 'stock-a',
      refId: 'prc-source-1',
      productCode: 'PRC-SOURCE-1',
      code: 'PRC-SOURCE-1',
      qty: 10,
      quantity: 10,
      amount: 10,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      sourceType: 'STOCK',
      demandId: 'demand-a',
      itemKey: 'item-a',
      depotId: 'main',
      nodeKey: 'managed:main',
      locationId: 'location-main'
    }],
    stock_movements: [{
      id: 'movement-store-a',
      movementType: 'STORE',
      type: 'STORE',
      workOrderId: 'wo-a',
      workOrderLineId: 'wo-a-line',
      refId: 'prc-source-1',
      productCode: 'PRC-SOURCE-1',
      code: 'PRC-SOURCE-1',
      qty: 10,
      quantity: 10,
      unit: 'ADET',
      sourceType: 'STOCK',
      demandId: 'demand-a',
      itemKey: 'item-a',
      depotId: 'main',
      locationId: 'location-main'
    }],
    salesShipments: [],
    montageDispatchPlans: [],
    montageDispatchShipments: [],
    montageCompletionTransfers: []
  };
}

function buildSourceAwareStockSnapshot() {
  const makeDemand = ({ suffix, dueDate }) => ({
    id: `stock-demand-${suffix}`,
    demandCode: `PLN-STOCK-${suffix.toUpperCase()}`,
    sourceType: 'STOCK',
    status: 'RELEASED',
    released_at: '2026-07-01T08:00:00.000Z',
    dueDate,
    items: [{ id: `stock-item-${suffix}`, qty: 5 }],
    poolAnalysis: {
      stockAccountingMode: 'VIRTUAL_V1',
      rows: [buildSourceAwarePoolRow({
        itemKey: `stock-item-${suffix}`,
        itemQty: 5,
        requiredQty: 5,
        stockQty: 5
      })]
    }
  });
  return {
    partComponentCards: [{ id: 'prc-source-1', code: 'PRC-SOURCE-1', unit: 'ADET' }],
    orders: [],
    planningDemands: [
      makeDemand({ suffix: 'a', dueDate: '2026-07-20' }),
      makeDemand({ suffix: 'b', dueDate: '2026-07-10' })
    ],
    workOrders: [],
    workOrderTransactions: [],
    stockDepotItems: [{
      id: 'free-stock-source-1',
      refId: 'prc-source-1',
      productCode: 'PRC-SOURCE-1',
      code: 'PRC-SOURCE-1',
      qty: 5,
      quantity: 5,
      amount: 5,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      allocationType: 'FREE',
      depotId: 'main',
      nodeKey: 'managed:main',
      locationId: 'location-main'
    }],
    stock_movements: [],
    salesShipments: [],
    montageDispatchPlans: [],
    montageDispatchShipments: [],
    montageCompletionTransfers: []
  };
}

function buildPhaseBExactMgpPlan({
  id = 'mgp-phase-b',
  demandId = 'stock-demand-b',
  itemKey = 'stock-item-b',
  qty = 3,
  start = 0,
  end = qty,
  physicalSegmentId = 'STOCK|free-stock-source-1'
} = {}) {
  return {
    id,
    planNo: `MGP-${id}`,
    status: 'DRAFT',
    items: [{
      sourceType: 'STOCK',
      demandId,
      itemKey,
      plannedQty: qty,
      productId: `product-${id}`,
      variantId: `variant-${id}`,
      variantCode: 'SVR-PHASE-B',
      montageCardId: 'montage-card-phase-b',
      montageCardCode: 'MON-PHASE-B',
      recipeParts: [{
        refId: 'prc-source-1',
        code: 'PRC-SOURCE-1',
        unit: 'ADET',
        qtyPerSet: 1
      }]
    }],
    parts: [{
      source: 'part',
      refId: 'prc-source-1',
      code: 'PRC-SOURCE-1',
      unit: 'ADET',
      requiredQty: qty
    }],
    exactReservations: [{
      planId: id,
      sourceType: 'STOCK',
      demandId,
      itemKey,
      prcId: 'prc-source-1',
      prcCode: 'PRC-SOURCE-1',
      unit: 'ADET',
      partSource: 'part',
      physicalSegmentId,
      stockRowId: physicalSegmentId.startsWith('STOCK|')
        ? physicalSegmentId.slice('STOCK|'.length)
        : '',
      sourceBucket: 'FROM_STOCK',
      segmentOffsetStart: start,
      segmentOffsetEnd: end,
      qty
    }]
  };
}

test('SanalTaksimResolver Faz B MGP DRAFT exact hold sonrasi yalniz kalan miktari paylasir', () => {
  const snapshot = buildSourceAwareStockSnapshot();
  snapshot.planningDemands.forEach((demand) => { demand.items[0].variantCode = 'SVR-PHASE-B'; });
  snapshot.montageDispatchPlans = [buildPhaseBExactMgpPlan()];
  const before = JSON.stringify(snapshot);
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const segment = result.segments.find((row) => row.segmentKey === 'STOCK|free-stock-source-1');
  const fixed = result.allocations.find((row) => row.fixedByExactHold === true);

  assert.equal(result.diagnostics.exactHoldLedger.valid, true);
  assert.equal(result.diagnostics.exactHoldLedger.holdCount, 1);
  assert.equal(segment.heldQty, 3);
  assert.equal(segment.sharedPoolQty, 2);
  assert.equal(segment.reallocatableQty, 2);
  assert.equal(fixed.qty, 3);
  assert.equal(fixed.targetDemandId, 'stock-demand-b');
  assert.equal(fixed.physicalAllocationState, 'RESERVED');
  assert.equal(result.allocations.reduce((sum, row) => sum + row.qty, 0), 5);
  assert.equal(result.diagnostics.invariants.exactHoldQtyWithinPhysical, true);
  assert.equal(result.diagnostics.invariants.exactHoldKeysConsumedOnce, true);
  assert.equal(JSON.stringify(snapshot), before);
});

test('SanalTaksimResolver Faz B tasan MGP hold kanitinda segmenti fail-closed tutar', () => {
  const snapshot = buildSourceAwareStockSnapshot();
  snapshot.planningDemands.forEach((demand) => { demand.items[0].variantCode = 'SVR-PHASE-B'; });
  snapshot.montageDispatchPlans = [buildPhaseBExactMgpPlan({ qty: 6, end: 6 })];
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const segment = result.segments.find((row) => row.segmentKey === 'STOCK|free-stock-source-1');

  assert.equal(result.diagnostics.exactHoldLedger.valid, false);
  assert.ok(result.diagnostics.exactHoldLedger.issues.some((row) =>
    ['EXACT_HOLD_SEGMENT_CONFLICT', 'EXACT_HOLD_QTY_EXCEEDS_SEGMENT'].includes(row.reasonCode)
  ));
  assert.equal(segment.allocationState, 'UNCERTAIN');
  assert.equal(segment.allocatableQty, 0);
  assert.equal(result.allocations.length, 0);
});

test('SanalTaksimResolver Faz B cakisan MGP araliklarini ortak havuzdan cikarir', () => {
  const snapshot = buildSourceAwareStockSnapshot();
  snapshot.planningDemands.forEach((demand) => { demand.items[0].variantCode = 'SVR-PHASE-B'; });
  snapshot.montageDispatchPlans = [
    buildPhaseBExactMgpPlan({ id: 'mgp-overlap-a', demandId: 'stock-demand-a', itemKey: 'stock-item-a', qty: 3, start: 0, end: 3 }),
    buildPhaseBExactMgpPlan({ id: 'mgp-overlap-b', qty: 2, start: 2, end: 4 })
  ];
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const segment = result.segments.find((row) => row.segmentKey === 'STOCK|free-stock-source-1');

  assert.equal(result.diagnostics.exactHoldLedger.valid, false);
  assert.ok(result.diagnostics.exactHoldLedger.issues.some((row) =>
    row.reasonCode === 'EXACT_HOLD_RANGE_OVERLAP'
  ));
  assert.equal(segment.allocationState, 'UNCERTAIN');
  assert.equal(segment.reallocatableQty, 0);
  assert.equal(result.allocations.length, 0);
});

test('SanalTaksimResolver Faz B SVP PLANNED exact miktari ayirir ve kalani paylasir', () => {
  const snapshot = buildSourceAwareStockSnapshot();
  snapshot.salesShipmentPlans = [{
    id: 'svp-phase-b',
    planNo: 'SVP-PHASE-B',
    status: 'PLANNED',
    sourceOrderId: 'sor-svp-phase-b',
    items: [{
      sourceLineId: 'sor-svp-phase-b-line',
      plannedQty: 2,
      stockAllocations: [{
        stockItemId: 'free-stock-source-1',
        allocatedQty: 2,
        sourceOrderId: 'sor-svp-phase-b',
        sourceLineId: 'sor-svp-phase-b-line'
      }]
    }]
  }];
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const segment = result.segments.find((row) => row.segmentKey === 'STOCK|free-stock-source-1');

  assert.equal(result.diagnostics.exactHoldLedger.valid, true);
  assert.equal(result.diagnostics.exactHoldLedger.holdCount, 1);
  assert.equal(segment.heldQty, 2);
  assert.equal(segment.sharedPoolQty, 3);
  assert.equal(result.allocations.reduce((sum, row) => sum + row.qty, 0), 3);
  assert.equal(result.allocations.some((row) => row.fixedByExactHold), false);
  assert.equal(result.diagnostics.invariants.segmentKeysConsumedOnce, true);
});

test('SanalTaksimResolver Faz B kanitsiz UNSCOPED ve Ana Depo disi stogu UNCERTAIN tutar', () => {
  const unscoped = buildSourceAwareStockSnapshot();
  delete unscoped.stockDepotItems[0].allocationType;
  let result = loadSanalTaksimResolver().resolve(unscoped);
  let segment = result.segments.find((row) => row.segmentKey === 'STOCK|free-stock-source-1');
  assert.equal(segment.allocationState, 'UNCERTAIN');
  assert.equal(segment.allocationStateReasonCode, 'UNSCOPED_STOCK_EVIDENCE_MISSING');
  assert.equal(segment.allocatableQty, 0);
  assert.equal(result.allocations.length, 0);

  const outsideMain = buildSourceAwareStockSnapshot();
  outsideMain.stockDepotItems[0].depotId = 'unit:u-outside';
  outsideMain.stockDepotItems[0].nodeKey = 'unit:u-outside';
  result = loadSanalTaksimResolver().resolve(outsideMain);
  segment = result.segments.find((row) => row.segmentKey === 'STOCK|free-stock-source-1');
  assert.equal(segment.allocationState, 'UNCERTAIN');
  assert.equal(segment.allocationStateReasonCode, 'STOCK_OUTSIDE_MAIN_DEPOT');
  assert.equal(segment.reallocatableQty, 0);
  assert.equal(result.allocations.length, 0);
});

test('SanalTaksimResolver Faz B doğal SOR örneğinde ticari çapraz tahsisi hesaplar', () => {
  const Resolver = loadSanalTaksimResolver();
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const snapshot = raw.data || raw;
  const result = Resolver.resolve(snapshot);
  const getReady = (orderNo) => {
    const order = snapshot.orders.find((row) => row.orderNo === orderNo);
    const demand = snapshot.planningDemands.find((row) => row.sourceOrderId === order.id);
    return result.readinessByDemandItem.find((row) => row.demandId === demand.id);
  };

  assert.equal(getReady('SOR-000007').finishedReadyQty, 10);
  assert.equal(getReady('SOR-000007').residualSetQty, 0);
  assert.equal(getReady('SOR-000008').finishedReadyQty, 5);
  assert.equal(getReady('SOR-000008').residualSetQty, 0);
  assert.equal(
    result.finishedReadyAllocations.some((row) =>
      row.targetDemandId === '9060f821-7e1f-44fb-8109-80e81121d289'
      && row.originOrderId !== row.targetOrderId
    ),
    true
  );
});

function buildMontagePhase2DemoHarness({ resolver = null } = {}) {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const data = JSON.parse(JSON.stringify(raw.data || raw));
  const alerts = [];
  let saveCount = 0;
  let renderCount = 0;
  const activeResolver = resolver || loadSanalTaksimResolver();
  const ProductLibraryModule = {
    getPlanningModelVariants: () => data.salesProductVariants
  };
  const { exported: StockModule, context } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: {
      data: { data },
      save: async () => {
        saveCount += 1;
        return { ok: true };
      }
    },
    UI: {
      renderCurrentPage: () => {
        renderCount += 1;
      }
    },
    ProductLibraryModule,
    SanalTaksimResolver: activeResolver,
    alert: (message) => alerts.push(String(message))
  });
  const getOrderContext = (orderNo) => {
    const order = data.orders.find((row) => row.orderNo === orderNo);
    const demand = data.planningDemands.find((row) => row.sourceOrderId === order?.id);
    return { order, demand };
  };
  const buildResult = (orderNo) => {
    const { order, demand } = getOrderContext(orderNo);
    const jobs = StockModule.buildMontageReadyJobCards();
    const planRows = StockModule.getMontageReadyPlanRows(jobs);
    const job = jobs.find((row) => row.demandId === demand?.id);
    const planRow = planRows.find((row) =>
      (Array.isArray(row?.jobs) ? row.jobs : []).some((rowJob) => rowJob.demandId === demand?.id)
    );
    const detailRow = StockModule.getMontageReadyDetailOrderRows(planRow)
      .find((row) => row.demandId === demand?.id);
    return { order, demand, jobs, planRows, job, planRow, detailRow };
  };
  return {
    StockModule,
    context,
    data,
    alerts,
    get saveCount() { return saveCount; },
    get renderCount() { return renderCount; },
    getOrderContext,
    buildResult
  };
}

test('Faz B doğal listede çapraz tahsisi salt okunur hesaplar, operasyonel hazırlığı kaynak bağlı tutar', () => {
  const harness = buildMontagePhase2DemoHarness();
  const before = JSON.stringify(harness.data);
  const sor7 = harness.buildResult('SOR-000007');
  const sor8 = harness.buildResult('SOR-000008');

  assert.equal(sor7.job.readySetQty, 0);
  assert.equal(sor7.job.missingSetQty, 0);
  assert.equal(sor7.job.resolverAvailability.trusted, true);
  assert.equal(sor7.job.resolverAvailability.readyQty, 0);
  assert.equal(sor8.job.readySetQty, 0);
  assert.equal(sor8.job.missingSetQty, 0);
  assert.equal(sor8.job.resolverAvailability.trusted, true);
  assert.equal(sor8.job.resolverAvailability.allocatable, false);
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
});

test('Faz B operasyonel montaj gönderimini kaynak bağlı ve fail-closed tutar', async () => {
  const harness = buildMontagePhase2DemoHarness();
  const before = JSON.stringify(harness.data);
  const sor7 = harness.buildResult('SOR-000007');
  const sor8 = harness.buildResult('SOR-000008');

  assert.equal(sor7.detailRow.readySetQty, 0);
  assert.equal(sor7.detailRow.sendableQty, 0);
  assert.equal(sor8.detailRow.readySetQty, 0);
  assert.equal(sor8.detailRow.sendableQty, 0);
  assert.equal(sor8.detailRow.sendableCalculable, false);

  const direct = harness.StockModule.getMontageLineDispatchAvailability(sor8.detailRow, {
    partCapacityQty: 99,
    resolverAvailability: sor8.detailRow.resolverAvailability,
    requireResolver: true
  });
  assert.equal(direct.ok, false);
  assert.equal(direct.sendableQty, 0);

  harness.StockModule.state.montageReadyDetailKey = sor8.planRow.key;
  assert.equal(harness.StockModule.openMontageReadyDetailSendMode(), false);
  assert.equal(harness.StockModule.state.montageReadyDetailSendMode, false);
  const detailHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(detailHtml, /Montaja Gönder<\/button>/);
  assert.match(detailHtml, /Montaja Gönder[\s\S]*?disabled|disabled[\s\S]*?Montaja Gönder/);

  harness.StockModule.state.montageReadyDetailSendSelected = { [sor8.detailRow.key]: true };
  harness.StockModule.state.montageReadyDetailSendQtyByRow = { [sor8.detailRow.key]: '1' };
  await harness.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(harness.saveCount, 0);
  assert.equal(JSON.stringify(harness.data), before);
  assert.ok(harness.alerts.some((message) =>
    message.includes('Resolver tarafından tahsis edilmiş')
    || message.includes('gönderilebilir montaj miktarı')
  ));
});

test('Faz 2 resolver belirsizliğinde hazır ve gönderilebilir sıfır kalır', () => {
  const baseResolver = loadSanalTaksimResolver();
  const resolver = {
    resolve: (snapshot) => {
      const result = baseResolver.resolve(snapshot);
      result.diagnostics.invariants.sourceIdentityExact = false;
      return result;
    }
  };
  const harness = buildMontagePhase2DemoHarness({ resolver });
  const sor7 = harness.buildResult('SOR-000007');
  assert.equal(sor7.job.calculable, false);
  assert.equal(sor7.job.readySetQty, null);
  assert.equal(sor7.detailRow.readySetQty, 0);
  assert.equal(sor7.detailRow.sendableQty, 0);
  assert.equal(sor7.detailRow.sendableCalculable, false);
  assert.equal(harness.saveCount, 0);
});

test('Faz 2 MGP DRAFT rezervini gönderilebilir miktardan yalnız bir kez düşer', () => {
  const harness = buildMontagePlanHarness();
  harness.context.DB.data.data.montageDispatchPlans = [{
    id: 'draft-once',
    status: 'DRAFT',
    items: [{
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'sor-id-1',
      sourceLineId: 'sor-line-1',
      demandId: 'pln-id-1',
      itemKey: 'pln-item-1',
      plannedQty: 2
    }],
    parts: []
  }];
  const availability = harness.StockModule.getMontageLineDispatchAvailability({
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-id-1',
    sourceLineId: 'sor-line-1',
    demandId: 'pln-id-1',
    itemKey: 'pln-item-1'
  }, {
    partCapacityQty: 10,
    resolverAvailability: { trusted: true, allocatable: true, readyQty: 10 },
    requireResolver: true
  });
  assert.equal(availability.draftPlanQty, 2);
  assert.equal(availability.remainingQty, 8);
  assert.equal(availability.sendableQty, 8);
});

test('SanalTaksimResolver Faz B REALLOCATABLE segmenti daha öncelikli farklı demand borcuna tahsis eder', () => {
  const snapshot = buildSourceAwareProductionSnapshot();
  snapshot.planningDemands[1].dueDate = '2026-07-05';
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const readyA = result.readinessByDemandItem.find((row) => row.demandId === 'demand-a');
  const readyB = result.readinessByDemandItem.find((row) => row.demandId === 'demand-b');
  const cross = result.allocations.find((row) =>
    row.targetDemandId === 'demand-b' && row.originDemandId === 'demand-a'
  );

  assert.equal(readyA.allocatableQty, 5);
  assert.equal(readyB.allocatableQty, 0);
  assert.ok(cross);
  assert.equal(cross.qty, 5);
  assert.equal(result.debts.find((row) => row.originDemandId === 'demand-b').allocatedQty, 5);
  assert.equal(cross.physicalAllocationState, 'REALLOCATABLE');
  assert.equal(cross.physicalOriginAudit.originDemandId, 'demand-a');
  assert.equal(cross.physicalOriginAudit.originItemKey, 'item-a');
});

test('SanalTaksimResolver Faz B fiziksel origin ile ticari hedef kimliğini ayrı tutar', () => {
  const snapshot = buildSourceAwareProductionSnapshot();
  snapshot.planningDemands[1].dueDate = '2026-07-05';
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const cross = result.allocations.find((row) => row.targetDemandId === 'demand-b');

  assert.ok(cross);
  assert.equal(cross.targetDemandId, 'demand-b');
  assert.equal(cross.targetItemKey, 'item-b');
  assert.equal(cross.originDemandId, 'demand-a');
  assert.equal(cross.physicalOriginItemKey, 'item-a');
  assert.equal(cross.demandId, 'demand-a');
  assert.equal(cross.originItemKey, 'item-a');
  assert.equal(result.diagnostics.invariants.reallocationPolicyRespected, true);
  assert.equal(result.diagnostics.invariants.originEvidencePreserved, true);
});

test('SanalTaksimResolver FROM_STOCK seçimini yalnız ilgili demand için ayırır ve veri yazmaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSourceAwareStockSnapshot();
  const before = JSON.stringify(snapshot);
  const result = Resolver.resolve(snapshot);
  const allocation = result.allocations.find((row) => row.sourceBucket === 'FROM_STOCK');

  assert.equal(allocation.targetDemandId, 'stock-demand-b');
  assert.equal(allocation.qty, 5);
  assert.equal(result.allocations.some((row) => row.targetDemandId === 'stock-demand-a'), false);
  assert.equal(result.allocations.reduce((sum, row) => sum + row.qty, 0), 5);
  assert.equal(snapshot.stock_movements.length, 0);
  assert.equal(snapshot.workOrderTransactions.length, 0);
  assert.equal(JSON.stringify(snapshot), before);
});

test('SanalTaksimResolver legacy stok ve yarı mamul hakkını kapatır, üretim borcunu korur', () => {
  const snapshot = buildSourceAwareProductionSnapshot();
  snapshot.planningDemands = [snapshot.planningDemands[0]];
  snapshot.workOrders = [snapshot.workOrders[0]];
  delete snapshot.planningDemands[0].poolAnalysis.stockAccountingMode;
  snapshot.planningDemands[0].items[0].qty = 5;
  snapshot.planningDemands[0].poolAnalysis.rows[0] = buildSourceAwarePoolRow({
    itemKey: 'item-a',
    itemQty: 5,
    requiredQty: 5,
    stockQty: 2,
    semiQty: 1,
    productionQty: 2
  });
  snapshot.workOrders[0].lines[0].targetQty = 2;
  snapshot.workOrderTransactions.forEach((row) => { row.qty = 2; });
  Object.assign(snapshot.stockDepotItems[0], { qty: 2, quantity: 2, amount: 2 });
  Object.assign(snapshot.stock_movements[0], { qty: 2, quantity: 2 });

  const result = loadSanalTaksimResolver().resolve(snapshot);
  const entitlements = result.sourceEntitlements.filter((row) => row.demandId === 'demand-a');
  const production = entitlements.find((row) => row.sourceBucket === 'FROM_PRODUCTION');

  assert.equal(entitlements.some((row) => row.sourceBucket === 'FROM_STOCK'), false);
  assert.equal(entitlements.some((row) => row.sourceBucket === 'FROM_SEMI'), false);
  assert.ok(production);
  assert.equal(production.plannedQty, 2);
  assert.equal(production.allocatedQty, 2);
  assert.equal(result.allocations.some((row) => row.sourceBucket === 'FROM_STOCK'), false);
  assert.equal(result.allocations.some((row) => row.sourceBucket === 'FROM_SEMI'), false);
});

test('SanalTaksimResolver gerçek kayıtta SOR-000009 hayalet stoku kapatır ve SOR-000011 hakkını korur', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const snapshot = raw.data || raw;
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const sor9 = snapshot.planningDemands.find((row) => row.sourceOrderNo === 'SOR-000009');
  const sor11 = snapshot.planningDemands.find((row) => row.sourceOrderNo === 'SOR-000011');
  const entitlementsFor = (demand, prcCode) => result.sourceEntitlements.filter((row) =>
    row.demandId === demand.id && row.prcCode === prcCode
  );

  assert.equal(entitlementsFor(sor9, 'PRC-000001').length, 0);
  assert.equal(result.debts.some((row) =>
    row.originDemandId === sor9.id && row.prcCode === 'PRC-000001'
  ), false);
  const sor9Prc21 = entitlementsFor(sor9, 'PRC-000021');
  assert.equal(sor9Prc21.length, 1);
  assert.equal(sor9Prc21[0].sourceBucket, 'FROM_PRODUCTION');
  assert.equal(sor9Prc21[0].plannedQty, 5);
  const sor9Prc21Debt = result.debts.find((row) =>
    row.originDemandId === sor9.id && row.prcCode === 'PRC-000021'
  );
  assert.ok(sor9Prc21Debt);
  assert.equal(sor9Prc21Debt.originalOpenDebtQty, 5);
  assert.equal(sor9Prc21Debt.finishedReadyCoveredPrcQty, 5);
  assert.equal(sor9Prc21Debt.openDebtQty, 0);
  assert.equal(result.productDebts.find((row) => row.originDemandId === sor9.id).finishedReadyQty, 5);

  for (const prcCode of ['PRC-000001', 'PRC-000021']) {
    const entitlement = entitlementsFor(sor11, prcCode);
    assert.equal(entitlement.length, 1);
    assert.equal(entitlement[0].sourceBucket, 'FROM_STOCK');
    assert.equal(entitlement[0].plannedQty, 1);
    assert.equal(entitlement[0].allocatedQty, 0);
  }
  const sor11Readiness = result.readinessByDemandItem.find((row) => row.demandId === sor11.id);
  assert.ok(sor11Readiness);
  assert.equal(sor11Readiness.allocatable, true);
  assert.equal(sor11Readiness.allocatableQty, 1);
});

test('SanalTaksimResolver karma kaynakta stok ve üretimi ayrı kovalardan birleştirir', () => {
  const snapshot = buildSourceAwareProductionSnapshot();
  snapshot.planningDemands = [snapshot.planningDemands[0]];
  snapshot.workOrders = [snapshot.workOrders[0]];
  snapshot.workOrders[0].lines[0].targetQty = 3;
  snapshot.planningDemands[0].items[0].qty = 5;
  snapshot.planningDemands[0].poolAnalysis.rows[0] = buildSourceAwarePoolRow({
    itemKey: 'item-a',
    itemQty: 5,
    requiredQty: 5,
    stockQty: 2,
    productionQty: 3
  });
  snapshot.workOrderTransactions.forEach((row) => { row.qty = 3; });
  Object.assign(snapshot.stockDepotItems[0], { qty: 3, quantity: 3, amount: 3 });
  Object.assign(snapshot.stock_movements[0], { qty: 3, quantity: 3 });
  snapshot.stockDepotItems.push({
    id: 'free-stock-mixed',
    refId: 'prc-source-1',
    productCode: 'PRC-SOURCE-1',
    code: 'PRC-SOURCE-1',
    qty: 2,
    quantity: 2,
    amount: 2,
    unit: 'ADET',
    stockClass: 'KULLANILABILIR',
    status: 'KULLANILABILIR',
    allocationType: 'FREE',
    depotId: 'main',
    nodeKey: 'managed:main',
    locationId: 'location-main'
  });

  const result = loadSanalTaksimResolver().resolve(snapshot);
  const ready = result.readinessByDemandItem.find((row) => row.demandId === 'demand-a');
  const byBucket = Object.fromEntries(['FROM_STOCK', 'FROM_PRODUCTION'].map((bucket) => [
    bucket,
    result.allocations
      .filter((row) => row.sourceBucket === bucket)
      .reduce((sum, row) => sum + row.qty, 0)
  ]));
  assert.deepEqual(byBucket, { FROM_STOCK: 2, FROM_PRODUCTION: 3 });
  assert.equal(ready.allocatableQty, 5);
  assert.equal(new Set(result.allocations.map((row) => row.physicalSegmentId)).size, 2);
});

test('SanalTaksimResolver aynı code ve unit için farklı prcId segmentini reddeder', () => {
  const snapshot = buildSourceAwareStockSnapshot();
  snapshot.planningDemands = [snapshot.planningDemands[0]];
  snapshot.partComponentCards.push({ id: 'prc-source-2', code: 'PRC-SOURCE-1', unit: 'ADET' });
  snapshot.stockDepotItems[0].refId = 'prc-source-2';

  const result = loadSanalTaksimResolver().resolve(snapshot);
  const debt = result.debts.find((row) => row.sourceBucket === 'FROM_STOCK');
  assert.equal(debt.prcId, 'prc-source-1');
  assert.equal(result.segments[0].prcId, 'prc-source-2');
  assert.equal(debt.allocatableQty, 0);
  assert.equal(debt.reasonCode, 'STOCK_EXACT_QTY_NOT_AVAILABLE');
  assert.equal(result.diagnostics.invariants.exactPrcAndUnitOnly, true);
});

test('SanalTaksimResolver birim uyuşmazlığında exact fiziksel tahsis yapmaz', () => {
  const snapshot = buildSourceAwareStockSnapshot();
  snapshot.planningDemands = [snapshot.planningDemands[0]];
  snapshot.stockDepotItems[0].unit = 'KG';

  const result = loadSanalTaksimResolver().resolve(snapshot);
  assert.equal(result.allocations.length, 0);
  assert.ok(result.uncertain.some((row) => row.reasonCode === 'STOCK_UNIT_MISMATCH'));
});

test('SanalTaksimResolver belirsiz STORE origin adayında fail-closed kalır', () => {
  const snapshot = buildSourceAwareProductionSnapshot();
  snapshot.planningDemands = [snapshot.planningDemands[0]];
  snapshot.workOrders = [snapshot.workOrders[0]];
  snapshot.stock_movements.push({
    ...snapshot.stock_movements[0],
    id: 'movement-store-a-duplicate'
  });

  const result = loadSanalTaksimResolver().resolve(snapshot);
  const debt = result.debts.find((row) => row.originDemandId === 'demand-a');
  const segment = result.segments.find((row) => row.stockRowId === 'stock-a');
  assert.equal(debt.allocatable, false);
  assert.equal(debt.allocatableQty, 0);
  assert.equal(segment.allocationState, 'UNCERTAIN');
  assert.equal(segment.allocatable, false);
  assert.equal(segment.allocatableQty, 0);
  assert.equal(segment.allocationStateReasonCode, 'PRODUCTION_STORE_ORIGIN_AMBIGUOUS');
  assert.equal(result.allocations.length, 0);
});

test('SanalTaksimResolver exact yarı mamul kanıtı yoksa FROM_SEMI için fail-closed kalır', () => {
  const snapshot = buildSourceAwareStockSnapshot();
  snapshot.planningDemands = [snapshot.planningDemands[0]];
  const row = snapshot.planningDemands[0].poolAnalysis.rows[0];
  Object.assign(row, {
    useStockSelected: false,
    useStockQty: 0,
    useSemiSelected: true,
    useSemiQty: 5
  });

  const result = loadSanalTaksimResolver().resolve(snapshot);
  const entitlement = result.sourceEntitlements.find((entry) => entry.sourceBucket === 'FROM_SEMI');
  assert.equal(entitlement.allocatable, false);
  assert.equal(entitlement.allocatableQty, 0);
  assert.ok(entitlement.reasonCodes.includes('SEMI_EXACT_PHYSICAL_EVIDENCE_MISSING'));
  assert.equal(result.allocations.length, 0);
});

test('SanalTaksimResolver kaynak sözleşmesi deterministik ve demo_state üzerinde salt okunurdur', () => {
  const Resolver = loadSanalTaksimResolver();
  const demoPath = path.join(__dirname, '..', 'demo_state.json');
  const beforeBuffer = fs.readFileSync(demoPath);
  const beforeHash = nodeCrypto.createHash('sha256').update(beforeBuffer).digest('hex');
  const raw = JSON.parse(beforeBuffer.toString('utf8'));
  const snapshot = raw.data || raw;
  const criticalBefore = JSON.stringify({
    stockDepotItems: snapshot.stockDepotItems,
    stock_movements: snapshot.stock_movements,
    workOrderTransactions: snapshot.workOrderTransactions,
    montageDispatchPlans: snapshot.montageDispatchPlans,
    montageDispatchShipments: snapshot.montageDispatchShipments
  });

  const first = Resolver.resolve(snapshot);
  const second = Resolver.resolve(snapshot);
  const afterHash = nodeCrypto.createHash('sha256').update(fs.readFileSync(demoPath)).digest('hex');
  const criticalAfter = JSON.stringify({
    stockDepotItems: snapshot.stockDepotItems,
    stock_movements: snapshot.stock_movements,
    workOrderTransactions: snapshot.workOrderTransactions,
    montageDispatchPlans: snapshot.montageDispatchPlans,
    montageDispatchShipments: snapshot.montageDispatchShipments
  });

  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(beforeHash, afterHash);
  assert.equal(criticalBefore, criticalAfter);
  assert.ok(Object.values(first.diagnostics.invariants).every(Boolean));
  assert.equal(first.diagnostics.persistence.dbSaveCalls, 0);
  assert.equal(first.diagnostics.persistence.stockMovementWrites, 0);
  assert.equal(first.diagnostics.persistence.transactionWrites, 0);
});

test('SanalTaksimResolver Faz 1 temel 100-100-60 current-stage senaryosunu mukerrersiz cozer', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase1Snapshot();
  snapshot.workOrderTransactions = [
    { id: 'txn-take-1', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-cut', routeId: 'route-cut', routeSeq: 1, processId: 'CUT', type: 'TAKE', qty: 100 },
    { id: 'txn-complete-1', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-cut', routeId: 'route-cut', routeSeq: 1, processId: 'CUT', type: 'COMPLETE', qty: 100 },
    { id: 'txn-take-2', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-polish', routeId: 'route-polish', routeSeq: 2, processId: 'POLISH', type: 'TAKE', qty: 60 }
  ];
  const before = JSON.stringify(snapshot);

  const first = Resolver.resolve(snapshot);
  const second = Resolver.resolve(snapshot);
  const total = first.totalsByPrc.find((row) => row.prcCode === 'PRC-000001');
  const inProcess = first.segments.find((row) => row.stage === 'IN_PROCESS');
  const transferPending = first.segments.find((row) => row.stage === 'TRANSFER_PENDING');

  assert.equal(inProcess.qty, 60);
  assert.equal(transferPending.qty, 40);
  assert.equal(total.physicalQty, 100);
  assert.equal(total.unstartedExecutionQty, 0);
  assert.equal(total.operationalAvailableQty, 40);
  assert.equal(first.uncertain.length, 0);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(JSON.stringify(snapshot), before);
  assert.equal(first.diagnostics.dbSaveCalls, 0);
  assert.equal(first.diagnostics.writes, 0);
});

test('SanalTaksimResolver gercek snapshotta mevcut rota metrikleriyle shadow comparison yapar', () => {
  const Resolver = loadSanalTaksimResolver();
  const { exported: UnitModule } = loadModule('src/modules/unit-module.js', 'UnitModule');
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const snapshot = raw.data || raw;
  const before = JSON.stringify(snapshot);
  const result = Resolver.resolve(snapshot);
  const txns = Array.isArray(snapshot.workOrderTransactions) ? snapshot.workOrderTransactions : [];

  for (const order of (Array.isArray(snapshot.workOrders) ? snapshot.workOrders : [])) {
    for (const line of (Array.isArray(order.lines) ? order.lines : [])) {
      const execution = result.executions.find((row) => row.workOrderId === order.id && row.lineId === line.id);
      assert.ok(execution);
      assert.equal(execution.status, 'RESOLVED');
      const metrics = line.routes.map((route, index) => UnitModule.computeWorkLineRouteMetrics(order, line, index, txns));
      const expectedPhysical = metrics.reduce((sum, row) =>
        sum + row.inProcessQty + row.transferPendingQty + row.depotPendingQty, 0);
      const expectedOperational = metrics.slice(1).reduce((sum, row) => sum + row.availableQty, 0);
      const actualPhysical = result.segments
        .filter((row) => row.sourceKind === 'WORK_ORDER'
          && row.originWorkOrderId === order.id
          && row.originWorkOrderLineId === line.id)
        .reduce((sum, row) => sum + row.physicalQty, 0);

      assert.equal(actualPhysical, expectedPhysical);
      assert.equal(execution.unstartedExecutionQty, metrics[0].availableQty);
      assert.equal(execution.operationalAvailableQty, expectedOperational);
    }
  }
  assert.equal(result.executions.length, 50);
  assert.equal(result.executions.filter((row) => row.status === 'UNCERTAIN').length, 0);
  assert.equal(JSON.stringify(snapshot), before);
});

test('SanalTaksimResolver ilk rota baslamamis yurutmesini fiziksel ve operasyonel miktardan ayirir', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase1Snapshot();
  snapshot.workOrderTransactions = [
    { id: 'txn-first-partial', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-cut', routeId: 'route-cut', routeSeq: 1, type: 'TAKE', qty: 60 }
  ];

  const result = Resolver.resolve(snapshot);
  const total = result.totalsByPrc.find((row) => row.prcCode === 'PRC-000001');

  assert.equal(total.physicalQty, 60);
  assert.equal(total.unstartedExecutionQty, 40);
  assert.equal(total.operationalAvailableQty, 0);
  assert.equal(result.segments.filter((row) => row.stage === 'IN_PROCESS').length, 1);
});

test('SanalTaksimResolver STORE kaydini stokla birlikte ikinci fiziksel segment yapmaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase1Snapshot();
  snapshot.workOrders[0].lines[0].routes = [
    { id: 'route-final', seq: 1, stationId: 'u-final', processId: 'FINAL' }
  ];
  snapshot.workOrderTransactions = [
    { id: 'txn-store-take', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-final', routeId: 'route-final', routeSeq: 1, type: 'TAKE', qty: 100 },
    { id: 'txn-store-complete', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-final', routeId: 'route-final', routeSeq: 1, type: 'COMPLETE', qty: 100 },
    { id: 'txn-store', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-final', routeId: 'route-final', routeSeq: 1, type: 'STORE', qty: 40 }
  ];
  snapshot.stockDepotItems = [{
    id: 'stock-prc-1',
    productCode: 'PRC-000001',
    code: 'PRC-000001',
    qty: 40,
    quantity: 40,
    amount: 40,
    unit: 'ADET',
    stockClass: 'KULLANILABILIR',
    depotId: 'main',
    locationId: 'loc-a'
  }];

  const withStock = Resolver.resolve(snapshot);
  const totalWithStock = withStock.totalsByPrc.find((row) => row.prcCode === 'PRC-000001');
  assert.equal(withStock.segments.find((row) => row.stage === 'DEPOT_PENDING').qty, 60);
  assert.equal(withStock.segments.find((row) => row.stage === 'DEPOT_STOCK').qty, 40);
  assert.equal(withStock.segments.some((row) => row.stage === 'STORE'), false);
  assert.equal(totalWithStock.physicalQty, 100);

  snapshot.stockDepotItems = [];
  const withoutStock = Resolver.resolve(snapshot);
  const totalWithoutStock = withoutStock.totalsByPrc.find((row) => row.prcCode === 'PRC-000001');
  assert.equal(totalWithoutStock.physicalQty, 60);
  assert.equal(withoutStock.segments.some((row) => row.stage === 'DEPOT_STOCK'), false);
});

test('SanalTaksimResolver tekrarlanan istasyonda legacy ve celiskili route kaydini fail-closed tutar', () => {
  const Resolver = loadSanalTaksimResolver();
  const repeated = buildSanalTaksimPhase1Snapshot();
  repeated.workOrders[0].lines[0].routes = [
    { id: 'route-repeat-1', seq: 1, stationId: 'u-repeat', processId: 'P1' },
    { id: 'route-repeat-2', seq: 2, stationId: 'u-repeat', processId: 'P2' }
  ];
  repeated.workOrderTransactions = [
    { id: 'txn-legacy-ambiguous', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-repeat', type: 'TAKE', qty: 10 }
  ];

  const ambiguous = Resolver.resolve(repeated);
  assert.equal(ambiguous.segments.length, 0);
  assert.equal(ambiguous.executions[0].status, 'UNCERTAIN');
  assert.equal(ambiguous.uncertain[0].reasonCode, 'TXN_STATION_REPEATED_AMBIGUOUS');
  assert.equal(ambiguous.uncertain[0].allocatableQty, 0);

  repeated.workOrderTransactions = [
    { id: 'txn-route-conflict', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-repeat', routeId: 'route-repeat-1', routeSeq: 2, type: 'TAKE', qty: 10 }
  ];
  const conflict = Resolver.resolve(repeated);
  assert.equal(conflict.segments.length, 0);
  assert.equal(conflict.uncertain[0].reasonCode, 'TXN_ROUTE_ID_SEQ_CONFLICT');
});

test('SanalTaksimResolver miktar invariant ihlallerini fiziksel segmente donusturmez', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase1Snapshot();
  snapshot.workOrderTransactions = [
    { id: 'txn-invalid-take', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-cut', routeId: 'route-cut', routeSeq: 1, type: 'TAKE', qty: 5 },
    { id: 'txn-invalid-complete', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-cut', routeId: 'route-cut', routeSeq: 1, type: 'COMPLETE', qty: 6 }
  ];
  let result = Resolver.resolve(snapshot);
  assert.equal(result.segments.length, 0);
  assert.equal(result.executions[0].status, 'UNCERTAIN');
  assert.equal(result.uncertain[0].reasonCode, 'COMPLETE_EXCEEDS_TAKE');

  snapshot.workOrders[0].lines[0].routes = [
    { id: 'route-final', seq: 1, stationId: 'u-final', processId: 'FINAL' }
  ];
  snapshot.workOrderTransactions = [
    { id: 'txn-final-take', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-final', routeId: 'route-final', routeSeq: 1, type: 'TAKE', qty: 5 },
    { id: 'txn-final-complete', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-final', routeId: 'route-final', routeSeq: 1, type: 'COMPLETE', qty: 5 },
    { id: 'txn-final-store', workOrderId: 'wo-phase1', lineId: 'line-phase1', stationId: 'u-final', routeId: 'route-final', routeSeq: 1, type: 'STORE', qty: 6 }
  ];
  result = Resolver.resolve(snapshot);
  assert.equal(result.segments.length, 0);
  assert.equal(result.uncertain[0].reasonCode, 'STORE_EXCEEDS_FINAL_COMPLETE');
});

test('SanalTaksimResolver IN_TRANSIT MGS parcasini kanit hareketiyle sayar ve RECEIVED stokla cift saymaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase1Snapshot();
  snapshot.workOrders = [];
  snapshot.workOrderTransactions = [];
  snapshot.stock_movements = [{
    id: 'movement-mgs-1',
    movementType: 'MONTAGE_DISPATCH_OUT',
    shipmentId: 'mgs-1',
    productCode: 'PRC-000001',
    code: 'PRC-000001',
    qty: 12,
    quantity: 12,
    unit: 'ADET'
  }];
  snapshot.montageDispatchShipments = [{
    id: 'mgs-1',
    shipmentNo: 'MGS-000001',
    status: 'IN_TRANSIT',
    items: [{
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'order-1',
      sourceLineId: 'order-line-1',
      demandId: 'demand-1',
      itemKey: 'item-1',
      shippedQty: 3
    }],
    parts: [{
      refId: 'prc-card-1',
      code: 'PRC-000001',
      unit: 'ADET',
      shippedQty: 12,
      allocations: [{ stockMovementId: 'movement-mgs-1', qty: 12 }]
    }]
  }];

  const inTransit = Resolver.resolve(snapshot);
  assert.equal(inTransit.segments.length, 1);
  assert.equal(inTransit.segments[0].stage, 'MONTAGE_IN_TRANSIT');
  assert.equal(inTransit.totalsByPrc[0].physicalQty, 12);

  snapshot.montageDispatchShipments[0].status = 'RECEIVED';
  snapshot.stockDepotItems = [{
    id: 'received-prc-1',
    refId: 'prc-card-1',
    productCode: 'PRC-000001',
    code: 'PRC-000001',
    qty: 12,
    quantity: 12,
    amount: 12,
    unit: 'ADET',
    stockClass: 'MONTAGE_RECEIVED',
    unitId: 'u3',
    locationId: 'montage-receipt'
  }];
  const received = Resolver.resolve(snapshot);
  assert.equal(received.segments.length, 1);
  assert.equal(received.segments[0].stage, 'MONTAGE_RECEIVED');
  assert.equal(received.totalsByPrc[0].physicalQty, 12);
});

test('SanalTaksimResolver celiskili stok miktari ve biriminde fail-closed kalir', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase1Snapshot();
  snapshot.workOrders = [];
  snapshot.stockDepotItems = [{
    id: 'stock-alias-conflict',
    productCode: 'PRC-000001',
    qty: 4,
    quantity: 5,
    amount: 4,
    unit: 'ADET',
    stockClass: 'KULLANILABILIR',
    depotId: 'main',
    locationId: 'loc-a'
  }];

  let result = Resolver.resolve(snapshot);
  assert.equal(result.segments.length, 0);
  assert.equal(result.uncertain[0].reasonCode, 'STOCK_QTY_ALIAS_CONFLICT');
  assert.equal(result.uncertain[0].allocatableQty, 0);

  Object.assign(snapshot.stockDepotItems[0], { qty: 4, quantity: 4, amount: 4, unit: 'KG' });
  result = Resolver.resolve(snapshot);
  assert.equal(result.segments.length, 0);
  assert.equal(result.uncertain[0].reasonCode, 'STOCK_UNIT_MISMATCH');
});

test('SanalTaksimResolver kesin olmayan PRC ve stok miktarini tahmin etmez ve veri yazmaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase1Snapshot();
  snapshot.partComponentCards.push({ id: 'prc-card-duplicate', code: 'PRC-000001', unit: 'ADET' });
  snapshot.stockDepotItems = [{
    id: 'stock-conflict',
    productCode: 'PRC-000001',
    qty: 4,
    quantity: 5,
    amount: 4,
    unit: 'ADET',
    depotId: 'main',
    locationId: 'loc-a'
  }];
  const result = Resolver.resolve(snapshot);
  const resolverSource = fs.readFileSync(path.join(__dirname, '..', 'src/core/sanal-taksim-resolver.js'), 'utf8');

  assert.equal(result.segments.length, 0);
  assert.ok(result.uncertain.some((row) => row.reasonCode === 'PRC_CODE_DUPLICATE'));
  assert.doesNotMatch(resolverSource, /\bDB\.(?:save|data)\b/);
});

function buildSanalTaksimPhase5ALifecycleSnapshot(stage = 'DRAFT') {
  const item = {
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-phase5a',
    sourceOrderNo: 'SOR-PHASE5A',
    sourceLineId: 'sor-line-phase5a',
    demandId: 'pln-phase5a',
    demandCode: 'PLN-PHASE5A',
    itemKey: 'item-phase5a',
    productId: 'sal-phase5a',
    variantId: 'svr-id-phase5a',
    variantCode: 'SVR-PHASE5A',
    productName: 'Faz 5A Ürünü',
    montageCardId: 'mon-phase5a',
    montageCardCode: 'MON-PHASE5A',
    recipeParts: [{
      refId: 'prc-card-1',
      code: 'PRC-000001',
      name: 'Faz 5A Parçası',
      unit: 'ADET',
      qtyPerSet: 1
    }]
  };
  const plan = {
    id: 'mgp-phase5a',
    planNo: 'MGP-PHASE5A',
    status: stage === 'DRAFT' ? 'DRAFT' : 'DISPATCHED_TO_MONTAGE',
    items: [{ ...item, plannedQty: 12 }],
    parts: [{
      source: 'component',
      refId: 'prc-card-1',
      code: 'PRC-000001',
      name: 'Faz 5A Parçası',
      unit: 'ADET',
      qtyPerSet: 1,
      requiredQty: 12
    }]
  };
  const snapshot = {
    partComponentCards: [{ id: 'prc-card-1', code: 'PRC-000001', unit: 'ADET' }],
    orders: [{
      id: item.sourceOrderId,
      orderNo: item.sourceOrderNo,
      status: 'Onaylandi',
      deliveryDate: '2026-08-10',
      lines: [{
        id: item.sourceLineId,
        productId: item.productId,
        variationId: item.variantId,
        variantCode: item.variantCode,
        qty: 12
      }]
    }],
    planningDemands: [{
      id: item.demandId,
      demandCode: item.demandCode,
      sourceType: item.sourceType,
      sourceOrderId: item.sourceOrderId,
      sourceLineId: item.sourceLineId,
      productId: item.productId,
      variantCode: item.variantCode,
      status: 'RELEASED',
      releasedQty: 12,
      released_at: '2026-07-24T08:00:00.000Z',
      workOrderId: 'wo-phase5a',
      workOrderIds: ['wo-phase5a'],
      items: [{
        id: item.itemKey,
        productId: item.productId,
        variantCode: item.variantCode,
        productCode: item.variantCode,
        qty: 12
      }]
    }],
    workOrders: [{
      id: 'wo-phase5a',
      workOrderCode: 'WO-PHASE5A',
      sourceId: item.demandId,
      sourceItemKey: item.itemKey,
      lines: [{
        id: 'wo-line-phase5a',
        componentId: 'prc-card-1',
        componentCode: 'PRC-000001',
        unit: 'ADET',
        targetQty: 12,
        routes: [{
          id: 'route-phase5a',
          seq: 1,
          stationId: 'unit-phase5a',
          processId: 'PROCESS-PHASE5A'
        }]
      }]
    }],
    workOrderTransactions: [],
    stockDepotItems: stage === 'DRAFT' ? [{
      id: 'stock-free-phase5a',
      refId: 'prc-card-1',
      productCode: 'PRC-000001',
      code: 'PRC-000001',
      qty: 12,
      quantity: 12,
      amount: 12,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      depotId: 'main',
      locationId: 'free-location'
    }] : [],
    montageDispatchPlans: [plan],
    montageDispatchShipments: [],
    montageCompletionTransfers: [],
    stock_movements: []
  };
  if (stage === 'DRAFT') return snapshot;

  const shipment = {
    id: 'mgs-phase5a',
    shipmentNo: 'MGS-PHASE5A',
    planId: plan.id,
    planNo: plan.planNo,
    idempotencyKey: `MONTAGE_PLAN_DISPATCH|${plan.id}`,
    status: stage === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'RECEIVED',
    targetUnitId: 'u3',
    receiptKey: stage === 'IN_TRANSIT' ? '' : 'MONTAGE_RECEIPT|mgs-phase5a',
    items: [{ ...item, shippedQty: 12 }],
    parts: [{
      source: 'component',
      refId: 'prc-card-1',
      code: 'PRC-000001',
      name: 'Faz 5A Parçası',
      unit: 'ADET',
      shippedQty: 12,
      allocations: [{
        stockDepotItemId: 'source-stock-phase5a',
        sourceDepotId: 'main',
        sourceLocationId: 'source-location',
        qty: 12,
        unit: 'ADET',
        stockMovementId: 'movement-dispatch-phase5a'
      }]
    }]
  };
  snapshot.montageDispatchShipments = [shipment];
  snapshot.stock_movements.push({
    id: 'movement-dispatch-phase5a',
    movementType: 'MONTAGE_DISPATCH_OUT',
    shipmentId: shipment.id,
    productCode: 'PRC-000001',
    code: 'PRC-000001',
    qty: 12,
    quantity: 12,
    unit: 'ADET'
  });
  if (stage === 'IN_TRANSIT') return snapshot;

  const receiptStock = {
    id: 'receipt-stock-phase5a',
    sourceShipmentId: shipment.id,
    shipmentId: shipment.id,
    sourcePlanId: plan.id,
    planId: plan.id,
    targetUnitId: 'u3',
    unitId: 'u3',
    locationId: 'montage-receipt',
    refId: 'prc-card-1',
    productId: 'prc-card-1',
    code: 'PRC-000001',
    productCode: 'PRC-000001',
    qty: 12,
    quantity: 12,
    amount: 12,
    unit: 'ADET',
    stockClass: 'MONTAGE_RECEIVED',
    status: 'MONTAGE_RECEIVED_AWAITING_START',
    receiptKey: shipment.receiptKey,
    receiptLineKey: `${shipment.receiptKey}|0|prc-card-1|PRC-000001`
  };
  snapshot.stockDepotItems = [receiptStock];
  snapshot.stock_movements.push({
    id: 'movement-receipt-phase5a',
    movementType: 'MONTAGE_DISPATCH_RECEIPT',
    receiptKey: shipment.receiptKey,
    receiptLineKey: receiptStock.receiptLineKey,
    shipmentId: shipment.id,
    planId: plan.id,
    refId: 'prc-card-1',
    productCode: 'PRC-000001',
    code: 'PRC-000001',
    qty: 12,
    quantity: 12,
    unit: 'ADET'
  });
  if (stage === 'RECEIVED') return snapshot;

  const transfer = {
    id: 'mct-phase5a',
    transferNo: 'MCT-PHASE5A',
    idempotencyKey: `MONTAGE_COMPLETION|${shipment.id}|SALES_ORDER|sor-phase5a|sor-line-phase5a|0|12`,
    status: stage === 'PENDING' ? 'PENDING_DEPOT_RECEIPT' : 'POSTED',
    lineKey: 'SALES_ORDER|sor-phase5a|sor-line-phase5a',
    sourceShipmentId: shipment.id,
    sourceShipmentNo: shipment.shipmentNo,
    sourceShipmentItemIndex: 0,
    sourcePlanId: plan.id,
    sourcePlanNo: plan.planNo,
    ...item,
    qty: 12,
    quantity: 12,
    unit: 'ADET'
  };
  snapshot.montageCompletionTransfers = [transfer];
  if (stage === 'PENDING') return snapshot;

  Object.assign(receiptStock, { qty: 0, quantity: 0, amount: 0 });
  Object.assign(transfer, {
    componentAllocations: [{
      refId: 'prc-card-1',
      code: 'PRC-000001',
      name: 'Faz 5A Parçası',
      unit: 'ADET',
      qtyPerSet: 1,
      stockDepotItemId: receiptStock.id,
      sourceLocationId: receiptStock.locationId,
      qty: 12,
      stockMovementId: 'movement-consume-phase5a'
    }],
    componentMovementIds: ['movement-consume-phase5a'],
    finishedProductStockItemId: 'finished-stock-phase5a',
    finishedProductMovementId: 'movement-finished-phase5a',
    targetDepotId: 'depot_profil',
    targetLocationId: 'finished-location'
  });
  snapshot.stockDepotItems.push({
    id: transfer.finishedProductStockItemId,
    completionTransferId: transfer.id,
    transferId: transfer.id,
    sourceShipmentId: shipment.id,
    sourcePlanId: plan.id,
    sourceType: item.sourceType,
    sourceOrderId: item.sourceOrderId,
    sourceLineId: item.sourceLineId,
    demandId: item.demandId,
    itemKey: item.itemKey,
    productId: item.productId,
    variantId: item.variantId,
    variationId: item.variantId,
    variantCode: item.variantCode,
    code: item.variantCode,
    productCode: item.variantCode,
    cardType: 'SVR',
    stockClass: 'KULLANILABILIR',
    status: 'KULLANILABILIR',
    depotId: 'depot_profil',
    locationId: 'finished-location',
    qty: 12,
    quantity: 12,
    amount: 12,
    unit: 'ADET'
  });
  snapshot.stock_movements.push({
    id: 'movement-consume-phase5a',
    movementType: 'MONTAGE_COMPONENT_CONSUMPTION',
    completionTransferId: transfer.id,
    transferId: transfer.id,
    stockDepotItemId: receiptStock.id,
    refId: 'prc-card-1',
    productCode: 'PRC-000001',
    code: 'PRC-000001',
    qty: 12,
    quantity: 12,
    unit: 'ADET'
  }, {
    id: transfer.finishedProductMovementId,
    movementType: 'MONTAGE_FINISHED_PRODUCT_IN',
    completionTransferId: transfer.id,
    transferId: transfer.id,
    stockDepotItemId: transfer.finishedProductStockItemId,
    productId: item.productId,
    variantId: item.variantId,
    variantCode: item.variantCode,
    productCode: item.variantCode,
    targetDepotId: 'depot_profil',
    targetLocationId: 'finished-location',
    qty: 12,
    quantity: 12,
    unit: 'ADET'
  });
  return snapshot;
}

test('SanalTaksimResolver Faz 5A tam montage lifecycle zincirini tek current-stage temsiline indirger', () => {
  const Resolver = loadSanalTaksimResolver();
  const stages = ['DRAFT', 'IN_TRANSIT', 'RECEIVED', 'PENDING', 'POSTED'];
  const results = new Map();

  stages.forEach((stage) => {
    const snapshot = buildSanalTaksimPhase5ALifecycleSnapshot(stage);
    const before = JSON.stringify(snapshot);
    const first = Resolver.resolve(snapshot);
    const second = Resolver.resolve(snapshot);
    assert.equal(JSON.stringify(snapshot), before);
    assert.equal(JSON.stringify(first), JSON.stringify(second));
    assert.equal(first.lifecycle.contractActive, true);
    assert.equal(first.uncertain.length, 0);
    assert.equal(first.segments.reduce((sum, row) => sum + Number(row.physicalQty || 0), 0), 12);
    assert.equal(first.diagnostics.dbSaveCalls, 0);
    assert.equal(first.diagnostics.writes, 0);
    results.set(stage, first);
  });

  const draft = results.get('DRAFT');
  assert.equal(draft.lifecycle.reservations.length, 1);
  assert.equal(draft.lifecycle.reservations[0].physicalQty, 0);
  assert.equal(draft.lifecycle.reservations[0].reservedQty, 12);
  assert.equal(draft.lifecycle.reservations[0].targetDebtKey.includes('sor-phase5a'), true);

  const transit = results.get('IN_TRANSIT');
  assert.equal(transit.segments.length, 1);
  assert.equal(transit.segments[0].stage, 'MONTAGE_IN_TRANSIT');
  assert.equal(transit.segments[0].allocatableToOthers, false);
  assert.equal(transit.segments[0].sourceOrderId, 'sor-phase5a');
  assert.equal(transit.segments[0].sourceLineId, 'sor-line-phase5a');
  assert.equal(transit.segments[0].targetDebtKey.includes('sor-phase5a'), true);

  const received = results.get('RECEIVED');
  assert.equal(received.segments.length, 1);
  assert.equal(received.segments[0].stage, 'MONTAGE_RECEIVED');
  assert.equal(received.segments[0].sourceKind, 'MGS_RECEIPT_JOIN');
  assert.equal(received.segments.some((row) => row.segmentKey === 'STOCK|receipt-stock-phase5a'), false);

  const pending = results.get('PENDING');
  assert.equal(pending.segments.length, 1);
  assert.equal(pending.segments[0].itemType, 'SVR');
  assert.equal(pending.segments[0].stage, 'MONTAGE_PENDING_DEPOT_RECEIPT');
  assert.equal(pending.segments.some((row) => row.itemType === 'PRC'), false);
  assert.equal(pending.segments[0].supersedesSegmentKeys.length, 1);

  const posted = results.get('POSTED');
  assert.equal(posted.segments.length, 1);
  assert.equal(posted.segments[0].itemType, 'SVR');
  assert.equal(posted.segments[0].stage, 'MONTAGE_FINISHED_STOCK');
  assert.equal(posted.segments[0].sourceKind, 'CURRENT_SVR_STOCK_ROW');
  assert.equal(posted.segments.some((row) => row.itemType === 'PRC'), false);
  assert.equal(posted.lifecycle.evidence.some((row) =>
    row.kind === 'MCT_POSTED_PROOF' && row.physical === false
  ), true);
});

test('SanalTaksimResolver Faz 5A celiskili MGS MGP kimligini tahmin etmeden UNCERTAIN tutar', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase5ALifecycleSnapshot('IN_TRANSIT');
  snapshot.montageDispatchShipments[0].items[0].sourceOrderId = 'sor-conflict';
  const before = JSON.stringify(snapshot);

  const result = Resolver.resolve(snapshot);

  assert.equal(JSON.stringify(snapshot), before);
  assert.equal(result.segments.length, 0);
  assert.equal(result.uncertain.length, 1);
  assert.equal(result.uncertain[0].reasonCode, 'MGS_MGP_ITEM_CONFLICT');
  assert.equal(result.uncertain[0].allocatable, false);
  assert.equal(result.uncertain[0].allocatableQty, 0);
  assert.equal(result.allocations.length, 0);
});

test('PlanningModule Faz 5B runtime snapshot lifecycle asamalarini salt okunur ve mukerrersiz gosterir', () => {
  const Resolver = loadSanalTaksimResolver();
  const stageExpectations = {
    DRAFT: 'Montaj planında geçici rezerve',
    IN_TRANSIT: 'Montaja sevk edildi / Yolda — SOR’a kilitli',
    RECEIVED: 'Montajda — SOR’a kilitli',
    PENDING: 'Montaj tamamlandı — depoya teslim bekliyor',
    POSTED: 'Sevkiyat Deposunda'
  };

  Object.entries(stageExpectations).forEach(([stage, expectedLabel]) => {
    const snapshot = buildSanalTaksimPhase5ALifecycleSnapshot(stage);
    let saveCalls = 0;
    const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
      DB: { data: { data: snapshot }, save: () => { saveCalls += 1; } },
      SanalTaksimResolver: Resolver,
      UnitModule: { getRouteStationName: (stationId) => String(stationId || '') }
    });
    const demand = snapshot.planningDemands[0];
    const before = JSON.stringify(snapshot);
    const runtimeSnapshot = PlanningModule.buildSanalTaksimSnapshot();
    const model = PlanningModule.getReleasedSalesSanalTaksimModel(demand);
    const html = PlanningModule.renderReleasedSalesSanalTaksimHtml(demand);

    assert.equal(runtimeSnapshot.montageDispatchPlans, snapshot.montageDispatchPlans);
    assert.equal(runtimeSnapshot.montageDispatchShipments, snapshot.montageDispatchShipments);
    assert.equal(runtimeSnapshot.montageCompletionTransfers, snapshot.montageCompletionTransfers);
    assert.equal(runtimeSnapshot.stockDepotItems, snapshot.stockDepotItems);
    assert.equal(runtimeSnapshot.stock_movements, snapshot.stock_movements);
    assert.equal(model.ok, true);
    assert.equal(model.lifecycle.contractActive, true);
    assert.match(html, new RegExp(expectedLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    if (stage === 'DRAFT') {
      assert.equal(model.lifecycle.reservations.length, 1);
      assert.equal(model.lifecycle.reservations[0].physicalQty, 0);
      assert.match(html, /Fiziksel miktar değil/);
      assert.equal(model.lifecycle.currentStages.length, 0);
    } else if (stage === 'IN_TRANSIT' || stage === 'RECEIVED') {
      assert.equal(model.rows[0].allocatedQty, 12);
      assert.equal(model.rows[0].lifecycleLocked, true);
      assert.equal(model.lifecycle.currentStages.length, 1);
      assert.equal(model.lifecycle.currentStages[0].renderSeparately, false);
      assert.match(html, /data-sanal-taksim-exact-sor-lock="true"/);
      assert.doesNotMatch(html, /data-sanal-taksim-lifecycle-current=/);
    } else {
      assert.equal(model.lifecycle.currentStages.length, 1);
      assert.equal(model.lifecycle.currentStages[0].itemType, 'SVR');
      assert.equal(model.lifecycle.currentStages[0].renderSeparately, true);
      assert.equal((html.match(/data-sanal-taksim-lifecycle-current=/g) || []).length, 1);
      assert.equal(model.lifecycle.currentStages.some((row) => row.itemType === 'PRC'), false);
    }
    assert.equal(model.lifecycle.uncertain.length, 0);
    assert.equal(saveCalls, 0);
    assert.equal(JSON.stringify(snapshot), before);
  });
});

test('PlanningModule Faz 5B manuel oncelik degisse de IN_TRANSIT kilidini exact SORda tutar', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase5ALifecycleSnapshot('IN_TRANSIT');
  const orderA = snapshot.orders[0];
  orderA.productionQueue = {
    manualOrder: 2,
    updatedAt: '2026-07-24T08:00:00.000Z',
    updatedBy: 'phase5b-test'
  };
  const orderB = JSON.parse(JSON.stringify(orderA));
  Object.assign(orderB, {
    id: 'sor-phase5b-priority',
    orderNo: 'SOR-PHASE5B-PRIORITY',
    productionQueue: {
      manualOrder: 1,
      updatedAt: '2026-07-24T08:01:00.000Z',
      updatedBy: 'phase5b-test'
    }
  });
  orderB.lines[0].id = 'sor-line-phase5b-priority';
  const demandB = JSON.parse(JSON.stringify(snapshot.planningDemands[0]));
  Object.assign(demandB, {
    id: 'pln-phase5b-priority',
    demandCode: 'PLN-PHASE5B-PRIORITY',
    sourceOrderId: orderB.id,
    sourceOrderNo: orderB.orderNo,
    sourceLineId: orderB.lines[0].id,
    workOrderId: 'wo-phase5b-priority',
    workOrderIds: ['wo-phase5b-priority']
  });
  demandB.items[0].id = 'item-phase5b-priority';
  const workOrderB = JSON.parse(JSON.stringify(snapshot.workOrders[0]));
  Object.assign(workOrderB, {
    id: 'wo-phase5b-priority',
    workOrderCode: 'WO-PHASE5B-PRIORITY',
    sourceId: demandB.id,
    sourceItemKey: demandB.items[0].id
  });
  workOrderB.lines[0].id = 'wo-line-phase5b-priority';
  snapshot.orders.push(orderB);
  snapshot.planningDemands.push(demandB);
  snapshot.workOrders.push(workOrderB);
  const before = JSON.stringify(snapshot);

  const resolved = Resolver.resolve(snapshot);
  const debtByKey = new Map(resolved.debts.map((debt) => [debt.debtKey, debt]));
  const transitAllocations = resolved.allocations.filter((row) => row.stage === 'MONTAGE_IN_TRANSIT');
  assert.equal(transitAllocations.length, 1);
  assert.equal(debtByKey.get(transitAllocations[0].targetDebtKey).originOrderId, orderA.id);
  assert.equal(resolved.allocations.some((row) =>
    debtByKey.get(row.targetDebtKey)?.originOrderId === orderB.id
  ), false);

  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot }, save: () => { throw new Error('salt okunur akış kayıt yapmamalı'); } },
    SanalTaksimResolver: Resolver
  });
  const modelA = PlanningModule.getReleasedSalesSanalTaksimModel(snapshot.planningDemands[0]);
  const modelB = PlanningModule.getReleasedSalesSanalTaksimModel(demandB);
  assert.equal(modelA.rows[0].allocatedQty, 12);
  assert.equal(modelA.rows[0].lifecycleLocked, true);
  assert.equal(modelB.rows[0].allocatedQty, 0);
  assert.equal(modelB.rows[0].lifecycleLocked, false);
  assert.equal(JSON.stringify(snapshot), before);
});

test('PlanningModule Faz 5B legacy lifecycle celiskisini ortak havuza almadan UNCERTAIN gosterir', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase5ALifecycleSnapshot('IN_TRANSIT');
  snapshot.montageDispatchShipments[0].items[0].sourceLineId = 'legacy-conflict-line';
  const before = JSON.stringify(snapshot);
  let saveCalls = 0;
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot }, save: () => { saveCalls += 1; } },
    SanalTaksimResolver: Resolver
  });

  const model = PlanningModule.getReleasedSalesSanalTaksimModel(snapshot.planningDemands[0]);
  const html = PlanningModule.renderReleasedSalesSanalTaksimHtml(snapshot.planningDemands[0]);

  assert.equal(model.ok, true);
  assert.equal(model.lifecycle.currentStages.length, 0);
  assert.equal(model.lifecycle.uncertain.length, 1);
  assert.equal(model.lifecycle.uncertain[0].reasonCode, 'MGS_MGP_ITEM_CONFLICT');
  assert.equal(model.lifecycle.uncertain[0].allocatable, false);
  assert.equal(model.lifecycle.uncertain[0].allocatableQty, 0);
  assert.match(html, /Belirsiz \/ tahsis edilemeyen miktar/);
  assert.match(html, /Miktar doğrulanamadı/);
  assert.match(html, /MGS_MGP_ITEM_CONFLICT/);
  assert.doesNotMatch(html, /Montaja sevk edildi \/ Yolda/);
  assert.equal(saveCalls, 0);
  assert.equal(JSON.stringify(snapshot), before);
});

function buildSanalTaksimPhase2Snapshot() {
  return {
    partComponentCards: [
      { id: 'prc-a', code: 'PRC-A', unit: 'ADET' },
      { id: 'prc-b', code: 'PRC-B', unit: 'ADET' }
    ],
    orders: [{
      id: 'sor-sales',
      orderNo: 'SOR-SALES',
      status: 'Onaylandi',
      deliveryDate: '2026-08-10',
      lines: [{
        id: 'sor-sales-line',
        productId: 'sal-a',
        variationId: 'svr-a-id',
        variantCode: 'SVR-A',
        qty: 40,
        unit: 'ADET'
      }]
    }],
    planningDemands: [
      {
        id: 'pln-sales',
        demandCode: 'PLN-SALES',
        sourceType: 'SALES_ORDER',
        sourceOrderId: 'sor-sales',
        sourceOrderNo: 'SOR-SALES',
        sourceLineId: 'sor-sales-line',
        status: 'RELEASED',
        released_at: '2026-08-02T09:00:00.000Z',
        dueDate: '2026-08-10',
        workOrderIds: ['wo-sales'],
        workOrderCodes: ['WO-SALES'],
        items: [{ id: 'pln-sales-item', qty: 40, variantCode: 'SVR-A' }]
      },
      {
        id: 'pln-stock',
        demandCode: 'PLN-STOCK',
        sourceType: 'STOCK',
        status: 'RELEASED',
        released_at: '2026-08-01T09:00:00.000Z',
        dueDate: '2026-08-01',
        workOrderIds: ['wo-stock'],
        workOrderCodes: ['WO-STOCK'],
        items: [{ id: 'pln-stock-item', qty: 100 }]
      }
    ],
    workOrders: [
      {
        id: 'wo-stock',
        workOrderCode: 'WO-STOCK',
        sourceId: 'pln-stock',
        sourceCode: 'PLN-STOCK',
        sourceItemKey: 'pln-stock-item',
        lines: [{
          id: 'wo-stock-line',
          componentCode: 'PRC-A',
          componentId: 'prc-a',
          targetQty: 100,
          unit: 'ADET',
          routes: [
            { id: 'stock-cnc', seq: 1, stationId: 'u-cnc', processId: 'CNC' },
            { id: 'stock-polish', seq: 2, stationId: 'u-polish', processId: 'POLISH' }
          ]
        }]
      },
      {
        id: 'wo-sales',
        workOrderCode: 'WO-SALES',
        sourceId: 'pln-sales',
        sourceCode: 'PLN-SALES',
        sourceItemKey: 'pln-sales-item',
        lines: [{
          id: 'wo-sales-line',
          componentCode: 'PRC-A',
          componentId: 'prc-a',
          targetQty: 40,
          unit: 'ADET',
          routes: [
            { id: 'sales-cnc', seq: 1, stationId: 'u-cnc', processId: 'CNC' },
            { id: 'sales-polish', seq: 2, stationId: 'u-polish', processId: 'POLISH' }
          ]
        }]
      }
    ],
    workOrderTransactions: [
      { id: 'stock-take-cnc', workOrderId: 'wo-stock', lineId: 'wo-stock-line', stationId: 'u-cnc', routeId: 'stock-cnc', routeSeq: 1, processId: 'CNC', type: 'TAKE', qty: 100 },
      { id: 'stock-complete-cnc', workOrderId: 'wo-stock', lineId: 'wo-stock-line', stationId: 'u-cnc', routeId: 'stock-cnc', routeSeq: 1, processId: 'CNC', type: 'COMPLETE', qty: 40 },
      { id: 'stock-take-polish', workOrderId: 'wo-stock', lineId: 'wo-stock-line', stationId: 'u-polish', routeId: 'stock-polish', routeSeq: 2, processId: 'POLISH', type: 'TAKE', qty: 40 }
    ],
    stockDepotItems: [],
    salesShipments: [],
    salesShipmentPlans: [],
    montageDispatchPlans: [],
    montageDispatchShipments: [],
    montageCompletionTransfers: [],
    stock_movements: []
  };
}

function addPhase2SalesDebt(snapshot, {
  suffix,
  targetQty = 10,
  deliveryDate = '2026-08-10',
  releasedAt = '2026-08-03T09:00:00.000Z',
  prcCode = 'PRC-A',
  prcId = 'prc-a'
}) {
  const orderId = `sor-${suffix}`;
  const orderNo = `SOR-${suffix.toUpperCase()}`;
  const orderLineId = `${orderId}-line`;
  const demandId = `pln-${suffix}`;
  const demandCode = `PLN-${suffix.toUpperCase()}`;
  const itemKey = `${demandId}-item`;
  const workOrderId = `wo-${suffix}`;
  const workOrderCode = `WO-${suffix.toUpperCase()}`;
  snapshot.orders.push({
    id: orderId,
    orderNo,
    status: 'Onaylandi',
    deliveryDate,
    lines: [{
      id: orderLineId,
      productId: `sal-${suffix}`,
      variationId: `svr-${suffix}-id`,
      variantCode: `SVR-${suffix.toUpperCase()}`,
      qty: targetQty,
      unit: 'ADET'
    }]
  });
  snapshot.planningDemands.push({
    id: demandId,
    demandCode,
    sourceType: 'SALES_ORDER',
    sourceOrderId: orderId,
    sourceOrderNo: orderNo,
    sourceLineId: orderLineId,
    status: 'RELEASED',
    released_at: releasedAt,
    dueDate: deliveryDate,
    workOrderIds: [workOrderId],
    workOrderCodes: [workOrderCode],
    items: [{ id: itemKey, qty: targetQty, variantCode: `SVR-${suffix.toUpperCase()}` }]
  });
  snapshot.workOrders.push({
    id: workOrderId,
    workOrderCode,
    sourceId: demandId,
    sourceCode: demandCode,
    sourceItemKey: itemKey,
    lines: [{
      id: `${workOrderId}-line`,
      componentCode: prcCode,
      componentId: prcId,
      targetQty,
      unit: 'ADET',
      routes: [{ id: `${workOrderId}-route`, seq: 1, stationId: `u-${suffix}`, processId: 'CNC' }]
    }]
  });
  return { orderId, orderLineId, demandId, workOrderId };
}

test('SanalTaksimResolver Faz 2 capraz tahsiste ileri SALES segmentini once, STOCK kalani sonra kullanir', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  const beforeWorkOrders = JSON.stringify(snapshot.workOrders);
  const beforeTransactions = JSON.stringify(snapshot.workOrderTransactions);
  const result = Resolver.resolve(snapshot);
  const salesDebt = result.debts.find((row) => row.debtType === 'SALES');
  const stockDebt = result.debts.find((row) => row.debtType === 'STOCK');
  const salesAllocation = result.allocations.find((row) => row.targetDebtKey === salesDebt.debtKey);
  const stockAllocation = result.allocations.find((row) => row.targetDebtKey === stockDebt.debtKey);
  const stockUncovered = result.uncoveredDebts.find((row) => row.debtKey === stockDebt.debtKey);
  const salesExecution = result.remainingExecutionCommitments
    .find((row) => row.workOrderId === 'wo-sales');

  assert.match(salesAllocation.physicalSegmentId, /wo-stock.*IN_PROCESS.*2/);
  assert.equal(salesAllocation.qty, 40);
  assert.match(stockAllocation.physicalSegmentId, /wo-stock.*IN_PROCESS.*1/);
  assert.equal(stockAllocation.qty, 60);
  assert.equal(stockUncovered.qty, 40);
  assert.equal(salesExecution.unstartedExecutionQty, 40);
  assert.equal(JSON.stringify(snapshot.workOrders), beforeWorkOrders);
  assert.equal(JSON.stringify(snapshot.workOrderTransactions), beforeTransactions);
});

test('SanalTaksimResolver Faz 2 uygun SALES borclarini STOCK borcundan once siralar', () => {
  const result = loadSanalTaksimResolver().resolve(buildSanalTaksimPhase2Snapshot());
  const orderedTypes = result.diagnostics.allocationOrder.map((key) =>
    result.debts.find((debt) => debt.debtKey === key).debtType
  );
  assert.deepEqual(Array.from(orderedTypes), ['SALES', 'STOCK']);
  assert.equal(result.allocations[0].targetDebtKey, result.debts.find((row) => row.debtType === 'SALES').debtKey);
});

test('SanalTaksimResolver Faz 2 ayni terminde productionReadyAt degeri eski SORu once siralar', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  const added = addPhase2SalesDebt(snapshot, {
    suffix: 'early',
    releasedAt: '2026-08-01T08:00:00.000Z',
    deliveryDate: '2026-08-10'
  });
  const result = Resolver.resolve(snapshot);
  const salesDebts = result.diagnostics.allocationOrder
    .map((key) => result.debts.find((debt) => debt.debtKey === key))
    .filter((debt) => debt.debtType === 'SALES');
  assert.equal(salesDebts[0].originOrderId, added.orderId);
  assert.equal(salesDebts[0].productionReadyAt, '2026-08-01T08:00:00.000Z');
});

test('SanalTaksimResolver Faz 2 kismi release SORu tahsis kuyruguna almaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  snapshot.orders[0].lines.push({
    id: 'sor-sales-line-unreleased',
    productId: 'sal-b',
    variationId: 'svr-b-id',
    variantCode: 'SVR-B',
    qty: 5
  });
  const result = Resolver.resolve(snapshot);
  const debt = result.debts.find((row) => row.debtType === 'SALES');
  assert.equal(debt.allocationEligible, true);
  assert.equal(debt.reasonCodes.includes('SOR_PARTIAL_RELEASE'), false);
  assert.equal(result.allocations.some((row) => row.targetDebtKey === debt.debtKey), true);
});

test('SanalTaksimResolver Faz 2 eksik ve mukerrer PLN baglantisini fail-closed tutar', () => {
  const Resolver = loadSanalTaksimResolver();
  const missing = buildSanalTaksimPhase2Snapshot();
  missing.planningDemands = missing.planningDemands.filter((row) => row.id !== 'pln-sales');
  let result = Resolver.resolve(missing);
  let debt = result.debts.find((row) => row.originWorkOrderId === 'wo-sales');
  assert.equal(debt.allocationEligible, false);
  assert.ok(debt.reasonCodes.includes('WO_PLN_LINK_MISSING'));

  const duplicate = buildSanalTaksimPhase2Snapshot();
  duplicate.planningDemands.push(JSON.parse(JSON.stringify(duplicate.planningDemands[0])));
  result = Resolver.resolve(duplicate);
  debt = result.debts.find((row) => row.originWorkOrderId === 'wo-sales');
  assert.equal(debt.allocationEligible, false);
  assert.ok(debt.reasonCodes.some((reason) =>
    ['WO_PLN_LINK_DUPLICATE', 'PLN_ID_DUPLICATE', 'SOR_PLN_LINK_DUPLICATE'].includes(reason)
  ));
});

test('SanalTaksimResolver Faz 2 gercek kismi TF sevkiyatini yalniz SALES acik borcundan dusurur', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  snapshot.salesShipments = [{
    id: 'tf-partial',
    shipmentNo: 'TF-PARTIAL',
    shipmentPlanId: 'svp-partial',
    status: 'DISPATCHED',
    sourceOrderId: 'sor-sales',
    sourceOrderNo: 'SOR-SALES',
    idempotencyKey: 'SALES_SHIPMENT_DISPATCH|partial',
    snapshot: {
      sourceOrderId: 'sor-sales',
      sourceOrderNo: 'SOR-SALES',
      items: [{
        sourceOrderId: 'sor-sales',
        sourceLineId: 'sor-sales-line',
        productId: 'sal-a',
        variantId: 'svr-a-id',
        svrCode: 'SVR-A',
        unit: 'ADET',
        dispatchQty: 15,
        stockAllocations: [{
          stockItemId: 'finished-stock-partial',
          allocatedQty: 15,
          stockMovementId: 'sales-out-partial'
        }]
      }]
    }
  }];
  snapshot.stock_movements.push({
    id: 'sales-out-partial',
    movementType: 'SALES_SHIPMENT_OUT',
    shipmentId: 'tf-partial',
    shipmentPlanId: 'svp-partial',
    stockDepotItemId: 'finished-stock-partial',
    sourceOrderId: 'sor-sales',
    sourceLineId: 'sor-sales-line',
    productId: 'sal-a',
    variantId: 'svr-a-id',
    variantCode: 'SVR-A',
    qty: 15,
    unit: 'ADET'
  });
  let result = Resolver.resolve(snapshot);
  let salesDebt = result.debts.find((row) => row.debtType === 'SALES');
  const stockDebt = result.debts.find((row) => row.debtType === 'STOCK');
  assert.equal(salesDebt.dispatchedQty, 15);
  assert.equal(salesDebt.openDebtQty, 25);
  assert.equal(stockDebt.dispatchedQty, 0);
  assert.equal(stockDebt.openDebtQty, 100);

  snapshot.stock_movements.find((row) => row.id === 'sales-out-partial').shipmentPlanId = 'svp-conflict';
  result = Resolver.resolve(snapshot);
  salesDebt = result.debts.find((row) => row.debtType === 'SALES');
  assert.equal(salesDebt.dispatchedQty, null);
  assert.equal(salesDebt.openDebtQty, null);
  assert.equal(salesDebt.allocationEligible, false);
  assert.ok(salesDebt.reasonCodes.includes('PRODUCT_DEBT_FAIL_CLOSED'));
  assert.ok(result.productDebts.find((row) => row.originOrderId === 'sor-sales')
    .reasonCodes.includes('PRODUCT_DISPATCH_MOVEMENT_CONFLICT'));
});

test('SanalTaksimResolver Faz 2 gercek snapshotta kesin ticari zinciri ve donmus MCT recetesini cozer', () => {
  const Resolver = loadSanalTaksimResolver();
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const snapshot = raw.data || raw;
  const before = JSON.stringify(snapshot);
  const result = Resolver.resolve(snapshot);
  assert.equal(result.debts.length, 49);
  assert.equal(result.debts.filter((row) => row.debtType === 'SALES').length, 48);
  assert.equal(result.debts.filter((row) => row.debtType === 'STOCK').length, 1);
  assert.equal(result.debts.filter((row) => row.allocationEligible).length, 49);
  assert.equal(result.diagnostics.failClosedDebts.length, 0);
  assert.ok(Object.values(result.diagnostics.invariants).every(Boolean));
  assert.equal(JSON.stringify(snapshot), before);
});

test('SanalTaksimResolver Faz 2 SVP MGP MGS ve MCT kayitlarini SALES borcundan dusurmez', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  snapshot.salesShipmentPlans = [{ id: 'svp-1', status: 'READY', plannedQty: 40 }];
  snapshot.montageDispatchPlans = [{ id: 'mgp-1', status: 'DRAFT', plannedQty: 40 }];
  snapshot.montageDispatchShipments = [{ id: 'mgs-ignored', status: 'RECEIVED', shippedQty: 40 }];
  snapshot.montageCompletionTransfers = [{
    id: 'mct-ignored',
    status: 'POSTED',
    sourceOrderId: 'sor-sales',
    sourceLineId: 'sor-sales-line',
    qty: 40
  }];
  const result = Resolver.resolve(snapshot);
  const debt = result.debts.find((row) => row.debtType === 'SALES');
  assert.equal(debt.dispatchedQty, 0);
  assert.equal(debt.openDebtQty, 40);
});

test('SanalTaksimResolver Faz 2 tek fiziksel segmentin farkli miktar araliklarini sirali SALES borclarina dagitir', () => {
  const Resolver = loadSanalTaksimResolver();
  const cases = [
    { physicalQty: 100, firstDebtQty: 30, secondDebtQty: 70, expected: [30, 70], expectedUncovered: 0, expectedRemainder: 0 },
    { physicalQty: 100, firstDebtQty: 30, secondDebtQty: 40, expected: [30, 40], expectedUncovered: 0, expectedRemainder: 30 },
    { physicalQty: 50, firstDebtQty: 30, secondDebtQty: 40, expected: [30, 20], expectedUncovered: 20, expectedRemainder: 0 }
  ];

  cases.forEach((scenario, index) => {
    const snapshot = buildSanalTaksimPhase2Snapshot();
    snapshot.planningDemands = snapshot.planningDemands.filter((row) => row.id !== 'pln-stock');
    snapshot.workOrders = snapshot.workOrders.filter((row) => row.id !== 'wo-stock');
    snapshot.workOrderTransactions = [];
    snapshot.orders[0].lines[0].qty = scenario.firstDebtQty;
    snapshot.planningDemands[0].items[0].qty = scenario.firstDebtQty;
    snapshot.workOrders[0].lines[0].targetQty = scenario.firstDebtQty;
    addPhase2SalesDebt(snapshot, {
      suffix: `split-${index + 1}`,
      targetQty: scenario.secondDebtQty,
      deliveryDate: '2026-08-11',
      releasedAt: '2026-08-03T09:00:00.000Z'
    });
    snapshot.stockDepotItems = [{
      id: `split-stock-${index + 1}`,
      refId: 'prc-a',
      productCode: 'PRC-A',
      code: 'PRC-A',
      qty: scenario.physicalQty,
      quantity: scenario.physicalQty,
      amount: scenario.physicalQty,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      allocationType: 'FREE',
      depotId: 'main',
      nodeKey: 'managed:main',
      locationId: `split-location-${index + 1}`
    }];

    const result = Resolver.resolve(snapshot);
    const salesDebts = result.diagnostics.allocationOrder
      .map((key) => result.debts.find((debt) => debt.debtKey === key))
      .filter((debt) => debt.debtType === 'SALES');
    assert.equal(salesDebts.length, 2);
    const allocatedByDebt = salesDebts.map((debt) => result.allocations
      .filter((allocation) => allocation.targetDebtKey === debt.debtKey)
      .reduce((sum, allocation) => sum + allocation.qty, 0));
    assert.deepEqual(Array.from(allocatedByDebt), scenario.expected);

    const segmentIds = new Set(result.allocations.map((allocation) => allocation.physicalSegmentId));
    assert.equal(segmentIds.size, 1);
    const totalAllocated = result.allocations.reduce((sum, allocation) => sum + allocation.qty, 0);
    assert.equal(totalAllocated, scenario.physicalQty - scenario.expectedRemainder);
    const secondUncovered = result.uncoveredDebts
      .find((row) => row.debtKey === salesDebts[1].debtKey);
    assert.equal(Number(secondUncovered?.qty || 0), scenario.expectedUncovered);
    assert.equal(result.diagnostics.invariants.segmentAllocationWithinQty, true);
    assert.equal(result.diagnostics.invariants.debtAllocationWithinOpenDebt, true);
    assert.equal(result.diagnostics.invariants.segmentKeysConsumedOnce, true);
  });
});

test('SanalTaksimResolver Faz 2 segment tahsis toplamini fiziksel miktarla sinirlar', () => {
  const result = loadSanalTaksimResolver().resolve(buildSanalTaksimPhase2Snapshot());
  for (const segment of result.segments) {
    const allocated = result.allocations
      .filter((row) => row.physicalSegmentId === segment.segmentKey)
      .reduce((sum, row) => sum + row.qty, 0);
    assert.ok(allocated <= segment.qty);
  }
  assert.equal(result.diagnostics.invariants.segmentAllocationWithinQty, true);
});

test('SanalTaksimResolver Faz 2 borc tahsis toplamini acik borcla sinirlar', () => {
  const result = loadSanalTaksimResolver().resolve(buildSanalTaksimPhase2Snapshot());
  for (const debt of result.debts) {
    const allocated = result.allocations
      .filter((row) => row.targetDebtKey === debt.debtKey)
      .reduce((sum, row) => sum + row.qty, 0);
    if (debt.openDebtQty !== null) assert.ok(allocated <= debt.openDebtQty);
  }
  assert.equal(result.diagnostics.invariants.debtAllocationWithinOpenDebt, true);
});

test('SanalTaksimResolver Faz 2 kesin PRC veya birim uyusmazliginda tahsis yapmaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const prcMismatch = buildSanalTaksimPhase2Snapshot();
  prcMismatch.workOrders[0].lines[0].componentCode = 'PRC-B';
  prcMismatch.workOrders[0].lines[0].componentId = 'prc-b';
  let result = Resolver.resolve(prcMismatch);
  const salesDebt = result.debts.find((row) => row.debtType === 'SALES');
  assert.equal(result.allocations.some((row) => row.targetDebtKey === salesDebt.debtKey), false);

  const unitMismatch = buildSanalTaksimPhase2Snapshot();
  unitMismatch.workOrders[1].lines[0].unit = 'KG';
  result = Resolver.resolve(unitMismatch);
  const mismatchedDebt = result.debts.find((row) => row.originWorkOrderId === 'wo-sales');
  assert.equal(mismatchedDebt.allocationEligible, false);
  assert.ok(mismatchedDebt.reasonCodes.includes('DEBT_UNIT_MISMATCH'));
});

test('SanalTaksimResolver Faz 2 ayni snapshot icin ayni sonucu uretir', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  assert.equal(JSON.stringify(Resolver.resolve(snapshot)), JSON.stringify(Resolver.resolve(snapshot)));
});

test('SanalTaksimResolver Faz 2 girdilerini mutasyona ugratmaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  const before = JSON.stringify(snapshot);
  Resolver.resolve(snapshot);
  assert.equal(JSON.stringify(snapshot), before);
});

test('SanalTaksimResolver Faz 2 DB save stok hareketi veya transaction yazmaz', () => {
  let saveCalls = 0;
  const { exported: Resolver } = loadModule(
    'src/core/sanal-taksim-resolver.js',
    'SanalTaksimResolver',
    { DB: { data: { data: {} }, save: () => { saveCalls += 1; } } }
  );
  const result = Resolver.resolve(buildSanalTaksimPhase2Snapshot());
  const source = fs.readFileSync(path.join(__dirname, '..', 'src/core/sanal-taksim-resolver.js'), 'utf8');
  assert.equal(saveCalls, 0);
  assert.equal(result.diagnostics.persistence.dbSaveCalls, 0);
  assert.equal(result.diagnostics.persistence.stockMovementWrites, 0);
  assert.equal(result.diagnostics.persistence.transactionWrites, 0);
  assert.doesNotMatch(source, /DB\.save\s*\(/);
});

test('SanalTaksimResolver Faz 2 kilitli ve rezerve segmentleri saf girdi olarak tahsis disinda tutar', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  const initial = Resolver.resolve(snapshot);
  snapshot.virtualAllocationConstraints = {
    reservedSegmentKeys: [initial.segments[0].segmentKey],
    lockedSegmentKeys: [initial.segments[1].segmentKey]
  };
  const result = Resolver.resolve(snapshot);
  assert.equal(result.allocations.length, 0);
  assert.equal(result.diagnostics.excludedReservedSegmentKeys.length, 1);
  assert.equal(result.diagnostics.excludedLockedSegmentKeys.length, 1);
});

test('SanalTaksimResolver Faz 3 browserda app-core sonrasinda ve planning oncesinde klasik script olarak yuklenir', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const appCoreIndex = indexHtml.indexOf('src/core/app-core.js');
  const resolverIndex = indexHtml.indexOf('src/core/sanal-taksim-resolver.js');
  const planningIndex = indexHtml.indexOf('src/modules/planning-module.js');
  assert.ok(appCoreIndex >= 0);
  assert.ok(resolverIndex > appCoreIndex);
  assert.ok(planningIndex > resolverIndex);
  assert.doesNotMatch(indexHtml, /type=["']module["'][^>]*sanal-taksim-resolver/i);
  const planningSource = fs.readFileSync(path.join(__dirname, '..', 'src/modules/planning-module.js'), 'utf8');
  assert.match(planningSource, /typeof SanalTaksimResolver !== "undefined"/);
  assert.doesNotMatch(planningSource, /window\.SanalTaksimResolver/);
});

test('SanalTaksimResolver Faz 3 capraz tahsisi Siparis Akisinda musteri acigi ile WO yurutmesini ayirarak gosterir', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  let saveCalls = 0;
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot }, save: () => { saveCalls += 1; } },
    SanalTaksimResolver: Resolver,
    UnitModule: {
      getRouteStationName: (stationId) => ({
        'u-cnc': 'CNC',
        'u-polish': 'Polisaj'
      }[String(stationId)] || String(stationId || ''))
    }
  });
  const demand = snapshot.planningDemands.find((row) => row.id === 'pln-sales');
  const before = JSON.stringify(snapshot);
  const model = PlanningModule.getReleasedSalesSanalTaksimModel(demand);
  assert.equal(model.ok, true);
  assert.equal(model.rows.length, 1);
  assert.equal(model.rows[0].prcCode, 'PRC-A');
  assert.equal(model.rows[0].allocatedQty, 40);
  assert.equal(model.rows[0].uncoveredQty, 0);
  assert.equal(model.rows[0].unstartedExecutionQty, 40);
  assert.deepEqual(Array.from(model.rows[0].stages, (row) => [row.label, row.qty]), [['Polisaj', 40]]);
  assert.equal(model.resolverDiagnostics.writes, 0);
  assert.equal(model.resolverDiagnostics.dbSaveCalls, 0);

  const html = PlanningModule.renderReleasedSalesSanalTaksimHtml(demand);
  assert.match(html, /data-sanal-taksim-panel="true"/);
  assert.match(html, /Sanal Tahsis Edilen Fiziksel Miktar[\s\S]*40 ADET/);
  assert.match(html, /Fiziksel Karşılık Bekleyen Borç[\s\S]*0 ADET/);
  assert.match(html, /Güncel Fiziksel Aşama \/ İstasyon[\s\S]*Polisaj: 40 ADET/);
  assert.match(html, /Kaynak WO’da Henüz Başlamamış Yürütme[\s\S]*40 ADET/);
  assert.match(html, /Teknik yürütme bilgisidir; müşteri açığı değildir\./);
  assert.equal(saveCalls, 0);
  assert.equal(JSON.stringify(snapshot), before);
});

test('SanalTaksimResolver Faz 3 resolver hatasini fail-closed panelde tutar ve mevcut Siparis Akisi icerigini korur', () => {
  const snapshot = buildSanalTaksimPhase2Snapshot();
  let saveCalls = 0;
  const { exported: PlanningModule, context } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot }, save: () => { saveCalls += 1; } },
    SanalTaksimResolver: { resolve: () => { throw new Error('resolver failure'); } }
  });
  const demand = snapshot.planningDemands.find((row) => row.id === 'pln-sales');
  PlanningModule.getDemands = () => snapshot.planningDemands;
  PlanningModule.getReleasedDemandItemGroups = () => [{
    itemKey: 'pln-sales-item',
    itemCode: 'SVR-A',
    itemQty: 40
  }];
  PlanningModule.getReleasedDemandStatusMeta = () => ({ label: 'Üretimde', style: '' });
  PlanningModule.getReleasedDemandSourceMeta = () => ({ label: 'Satış Siparişi', style: '' });
  PlanningModule.getDemandItems = (row) => row.items;
  PlanningModule.getDemandQtyForDisplay = (row) => row.qty || row.items[0].qty;
  PlanningModule.getLinkedWorkOrdersForDemand = () => [snapshot.workOrders.find((row) => row.id === 'wo-sales')];
  PlanningModule.buildReleasedDemandTrackingContentHtml = () =>
    '<div data-existing-production-content="true"><button data-existing-action="true">Mevcut Aksiyon</button></div>';
  PlanningModule.state.planningDetailScope = 'released-production-status';
  PlanningModule.state.planningDetailGroupKey = demand.id;
  PlanningModule.state.releasedProductionStatusTab = 'production';
  const before = JSON.stringify(context.DB.data.data);

  let html = PlanningModule.renderGroupDetailWorkspace();
  assert.match(html, /data-sanal-taksim-state="uncertain"/);
  assert.match(html, /Sanal Taksim — Tahsis Edilemez/);
  assert.match(html, /Sanal tahsis hesabı tamamlanamadı/);
  assert.match(html, /data-existing-production-content="true"/);
  assert.match(html, /data-existing-action="true">Mevcut Aksiyon/);

  PlanningModule.state.releasedProductionStatusTab = 'montage';
  PlanningModule.renderReleasedSalesMontageFlowHtml = () => '<div data-existing-montage-content="true"></div>';
  html = PlanningModule.renderGroupDetailWorkspace();
  assert.doesNotMatch(html, /data-sanal-taksim-panel/);
  assert.match(html, /data-existing-montage-content="true"/);
  assert.equal(saveCalls, 0);
  assert.equal(JSON.stringify(context.DB.data.data), before);
});

test('SanalTaksimResolver Faz 3 termin degisikliginde yeniden hesaplar ve global sirayi fallback etiketiyle gostermez', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  addPhase2SalesDebt(snapshot, {
    suffix: 'earlier-due',
    targetQty: 10,
    deliveryDate: '2026-08-05',
    releasedAt: '2026-08-03T09:00:00.000Z'
  });
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot }, save: () => { throw new Error('save must not run'); } },
    SanalTaksimResolver: Resolver,
    UnitModule: { getRouteStationName: (stationId) => String(stationId || '') }
  });
  const demand = snapshot.planningDemands.find((row) => row.id === 'pln-sales');
  const order = snapshot.orders.find((row) => row.id === 'sor-sales');
  const beforeWorkOrders = JSON.stringify(snapshot.workOrders);
  const beforeTransactions = JSON.stringify(snapshot.workOrderTransactions);

  let model = PlanningModule.getReleasedSalesSanalTaksimModel(demand);
  let html = PlanningModule.renderReleasedSalesSanalTaksimHtml(demand);
  assert.equal(model.rows[0].allocationOrderPosition, 2);
  assert.doesNotMatch(html, /Fallback sıra:/);
  assert.doesNotMatch(html, /data-sanal-taksim-manual-order-input/);
  order.deliveryDate = '2026-08-01';
  demand.dueDate = '2026-08-01';
  model = PlanningModule.getReleasedSalesSanalTaksimModel(demand);
  html = PlanningModule.renderReleasedSalesSanalTaksimHtml(demand);
  assert.equal(model.rows[0].allocationOrderPosition, 1);
  assert.doesNotMatch(html, /Fallback sıra:/);
  assert.equal(JSON.stringify(snapshot.workOrders), beforeWorkOrders);
  assert.equal(JSON.stringify(snapshot.workOrderTransactions), beforeTransactions);
});

test('SanalTaksimResolver Faz 3 belirsiz borcu sifir tahsis gibi gostermeden kisa gerekce verir', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  snapshot.planningDemands = snapshot.planningDemands.filter((row) => row.id !== 'pln-sales');
  const demand = {
    id: 'pln-sales',
    demandCode: 'PLN-SALES',
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-sales',
    sourceOrderNo: 'SOR-SALES',
    sourceLineId: 'sor-sales-line',
    items: [{ id: 'pln-sales-item', variantCode: 'SVR-A', qty: 40 }],
    workOrderIds: ['wo-sales']
  };
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot } },
    SanalTaksimResolver: Resolver
  });
  const model = PlanningModule.getReleasedSalesSanalTaksimModel(demand);
  assert.equal(model.ok, false);
  assert.equal(model.reasonCode, 'COMMERCIAL_DEBT_NOT_FOUND');
  assert.equal(model.rows.length, 0);
  const html = PlanningModule.renderReleasedSalesSanalTaksimHtml(demand);
  assert.match(html, /data-sanal-taksim-state="uncertain"/);
  assert.doesNotMatch(html, /data-sanal-taksim-allocated="true"/);
});

function buildSanalTaksimPhase4Snapshot() {
  const snapshot = buildSanalTaksimPhase2Snapshot();
  const added = addPhase2SalesDebt(snapshot, {
    suffix: 'manual-peer',
    targetQty: 40,
    deliveryDate: '2026-08-05',
    releasedAt: '2026-08-01T08:00:00.000Z'
  });
  snapshot.workOrderTransactions.find((row) => row.id === 'stock-take-cnc').qty = 40;
  return { snapshot, added };
}

function addPhase4SecondPrcLine(snapshot) {
  const workOrder = snapshot.workOrders.find((row) => row.id === 'wo-sales');
  workOrder.lines.push({
    id: 'wo-sales-line-prc-b',
    componentCode: 'PRC-B',
    componentId: 'prc-b',
    targetQty: 20,
    unit: 'ADET',
    routes: [{ id: 'sales-prc-b-route', seq: 1, stationId: 'u-prc-b', processId: 'CNC' }]
  });
}

function addPhase4UnreleasedSalesLine(snapshot) {
  const order = snapshot.orders.find((row) => row.id === 'sor-sales');
  order.lines.push({
    id: 'sor-sales-line-b',
    productId: 'sal-b',
    variationId: 'svr-b-id',
    variantCode: 'SVR-B',
    qty: 20,
    unit: 'ADET'
  });
  snapshot.planningDemands.push({
    id: 'pln-sales-b',
    demandCode: 'PLN-SALES-B',
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-sales',
    sourceOrderNo: 'SOR-SALES',
    sourceLineId: 'sor-sales-line-b',
    status: 'OPEN',
    released_at: '',
    dueDate: '2026-08-10',
    workOrderIds: ['wo-sales-b'],
    workOrderCodes: ['WO-SALES-B'],
    items: [{ id: 'pln-sales-b-item', qty: 20, variantCode: 'SVR-B' }]
  });
  snapshot.workOrders.push({
    id: 'wo-sales-b',
    workOrderCode: 'WO-SALES-B',
    sourceId: 'pln-sales-b',
    sourceCode: 'PLN-SALES-B',
    sourceItemKey: 'pln-sales-b-item',
    lines: [{
      id: 'wo-sales-b-line',
      componentCode: 'PRC-B',
      componentId: 'prc-b',
      targetQty: 20,
      unit: 'ADET',
      routes: [{ id: 'wo-sales-b-route', seq: 1, stationId: 'u-prc-b', processId: 'CNC' }]
    }]
  });
  return {
    demand: snapshot.planningDemands.find((row) => row.id === 'pln-sales-b'),
    workOrder: snapshot.workOrders.find((row) => row.id === 'wo-sales-b')
  };
}

function getPhase4AllocatedSalesOrderId(result) {
  const allocation = result.allocations.find((row) => {
    const debt = result.debts.find((item) => item.debtKey === row.targetDebtKey);
    return debt?.debtType === 'SALES';
  });
  const debt = result.debts.find((row) => row.debtKey === allocation?.targetDebtKey);
  return String(debt?.originOrderId || '');
}

test('SanalTaksimResolver Paket 3B legacy manualOrder varken termin ve dogal sirayi korur', () => {
  const Resolver = loadSanalTaksimResolver();
  const { snapshot, added } = buildSanalTaksimPhase4Snapshot();
  const before = JSON.stringify(snapshot);
  const baseline = Resolver.resolve(snapshot);
  assert.equal(getPhase4AllocatedSalesOrderId(baseline), added.orderId);
  const baselineOrder = baseline.diagnostics.evaluatedDebtOrder.slice();

  snapshot.orders.find((row) => row.id === 'sor-sales').productionQueue = {
    manualOrder: 1,
    updatedAt: '2026-07-24T10:00:00.000Z',
    updatedBy: 'Planlama Kullanıcısı'
  };
  snapshot.orders.find((row) => row.id === added.orderId).productionQueue = {
    manualOrder: 2,
    updatedAt: '2026-07-24T10:01:00.000Z',
    updatedBy: 'Planlama Kullanıcısı'
  };
  let result = Resolver.resolve(snapshot);
  assert.equal(getPhase4AllocatedSalesOrderId(result), added.orderId);
  assert.deepEqual(result.diagnostics.evaluatedDebtOrder, baselineOrder);
  const baseDebt = result.debts.find((row) => row.originOrderId === 'sor-sales');
  assert.equal(baseDebt.manualOrder, 1);
  assert.equal(baseDebt.manualOrderUpdatedBy, 'Planlama Kullanıcısı');

  snapshot.orders.find((row) => row.id === 'sor-sales').deliveryDate = '2026-12-31';
  snapshot.planningDemands.find((row) => row.id === 'pln-sales').dueDate = '2026-12-31';
  result = Resolver.resolve(snapshot);
  assert.equal(getPhase4AllocatedSalesOrderId(result), added.orderId);
  assert.notEqual(JSON.stringify(snapshot), before);
});

test('SanalTaksimResolver Paket 3B legacy manualOrder verisini yazmadan etkisiz birakir', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  const added = addPhase4UnreleasedSalesLine(snapshot);
  const order = snapshot.orders.find((row) => row.id === 'sor-sales');
  order.productionQueue = {
    manualOrder: 1,
    updatedAt: '2026-07-24T10:00:00.000Z',
    updatedBy: 'Planlama Kullanıcısı'
  };

  let beforeResolve = JSON.stringify(snapshot);
  let result = Resolver.resolve(snapshot);
  assert.equal(JSON.stringify(snapshot), beforeResolve);
  let orderDebts = result.debts.filter((row) => row.originOrderId === 'sor-sales');
  assert.equal(orderDebts.length, 2);
  assert.equal(orderDebts.every((row) => row.manualOrder === 1), true);
  assert.equal(orderDebts.find((row) => row.originDemandId === 'pln-sales').allocationEligible, true);
  assert.equal(orderDebts.find((row) => row.originDemandId === 'pln-sales-b').allocationEligible, false);
  assert.equal(result.allocations.some((allocation) =>
    allocation.targetDebtKey === orderDebts.find((row) => row.originDemandId === 'pln-sales').debtKey
  ), true);

  added.demand.status = 'RELEASED';
  added.demand.released_at = '2026-08-04T09:00:00.000Z';
  beforeResolve = JSON.stringify(snapshot);
  result = Resolver.resolve(snapshot);
  assert.equal(JSON.stringify(snapshot), beforeResolve);
  orderDebts = result.debts.filter((row) => row.originOrderId === 'sor-sales');
  assert.equal(orderDebts.every((row) => row.manualOrder === 1), true);
  assert.equal(orderDebts.every((row) => row.allocationEligible === true), true);
  assert.equal(JSON.stringify(order.productionQueue), JSON.stringify({
    manualOrder: 1,
    updatedAt: '2026-07-24T10:00:00.000Z',
    updatedBy: 'Planlama Kullanıcısı'
  }));
  assert.equal(order.lines.some((line) => Object.prototype.hasOwnProperty.call(line, 'manualOrder')), false);
  assert.equal(snapshot.planningDemands.some((demand) => Object.prototype.hasOwnProperty.call(demand, 'manualOrder')), false);
  assert.equal(snapshot.workOrders.some((workOrder) =>
    Object.prototype.hasOwnProperty.call(workOrder, 'manualOrder')
    || workOrder.lines.some((line) => Object.prototype.hasOwnProperty.call(line, 'manualOrder'))
  ), false);
});

test('PlanningModule Paket 3B Siparis Akisindan manuel SOR onceligi UIini tamamen kaldirir', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSanalTaksimPhase2Snapshot();
  addPhase4SecondPrcLine(snapshot);
  snapshot.orders.find((row) => row.id === 'sor-sales').productionQueue = {
    manualOrder: 1,
    updatedAt: '2026-07-24T10:00:00.000Z',
    updatedBy: 'Planlama Kullanıcısı'
  };
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot }, save: () => { throw new Error('save must not run'); } },
    SanalTaksimResolver: Resolver,
    UnitModule: { getRouteStationName: (stationId) => String(stationId || '') }
  });
  const demand = snapshot.planningDemands.find((row) => row.id === 'pln-sales');
  PlanningModule.getDemands = () => snapshot.planningDemands;
  PlanningModule.getReleasedDemandItemGroups = () => [{
    itemKey: 'pln-sales-item',
    itemCode: 'SVR-A',
    itemQty: 40,
    lines: []
  }];
  PlanningModule.getReleasedDemandStatusMeta = () => ({ label: 'Üretimde', style: '' });
  PlanningModule.getReleasedDemandSourceMeta = () => ({ label: 'Satış Siparişi', style: '' });
  PlanningModule.getDemandItems = (row) => row.items;
  PlanningModule.getDemandQtyForDisplay = (row) => row.items[0].qty;
  PlanningModule.getLinkedWorkOrdersForDemand = () =>
    snapshot.workOrders.filter((row) => row.id === 'wo-sales');
  PlanningModule.buildReleasedDemandTrackingContentHtml = () =>
    '<div data-existing-production-content="true"></div>';
  PlanningModule.state.planningDetailScope = 'released-production-status';
  PlanningModule.state.planningDetailGroupKey = demand.id;
  PlanningModule.state.planningDetailItemKey = '';
  PlanningModule.state.planningDetailItemCode = '';
  PlanningModule.state.releasedProductionStatusTab = 'production';

  assert.equal(typeof PlanningModule.saveSalesProductionQueueManualOrderFromInput, 'undefined');
  assert.equal(typeof PlanningModule.clearSalesProductionQueueManualOrder, 'undefined');
  const html = PlanningModule.renderGroupDetailWorkspace();
  assert.doesNotMatch(html, /data-sanal-taksim-production-queue="true"/);
  assert.doesNotMatch(html, /data-sanal-taksim-manual-order-input="true"/);
  assert.doesNotMatch(html, /data-sanal-taksim-manual-order-save="true"/);
  assert.doesNotMatch(html, /data-sanal-taksim-manual-order-clear="true"/);
  assert.doesNotMatch(html, /Manuel SOR Önceliği|Pozitif tam sayı|Sırayı Kaydet|SOR manuel önceliği/);
  assert.match(html, /data-sanal-taksim-detail="true"/);
  assert.equal((html.match(/data-sanal-taksim-prc="/g) || []).length, 2);
  assert.equal((html.match(/data-sanal-taksim-sor-priority="true"/g) || []).length, 0);
  const prcCards = html.match(/<article data-sanal-taksim-prc=[\s\S]*?<\/article>/g) || [];
  assert.equal(prcCards.length, 2);
  assert.doesNotMatch(html, /Fallback sıra:/);
});

test('SanalTaksimResolver Paket 3B gecersiz veya mukerrer legacy manualOrder nedeniyle fail-closed olmaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const invalid = buildSanalTaksimPhase4Snapshot();
  invalid.snapshot.orders[0].productionQueue = {
    manualOrder: 1,
    updatedAt: '',
    updatedBy: ''
  };
  let result = Resolver.resolve(invalid.snapshot);
  let debt = result.debts.find((row) => row.originOrderId === 'sor-sales');
  assert.equal(debt.allocationEligible, true);
  assert.equal(debt.reasonCodes.includes('SOR_MANUAL_AUDIT_INVALID'), false);

  const duplicate = buildSanalTaksimPhase4Snapshot();
  duplicate.snapshot.orders.forEach((order) => {
    order.productionQueue = {
      manualOrder: 1,
      updatedAt: '2026-07-24T10:00:00.000Z',
      updatedBy: 'Planlama Kullanıcısı'
    };
  });
  result = Resolver.resolve(duplicate.snapshot);
  const duplicateDebts = result.debts.filter((row) => row.debtType === 'SALES');
  assert.equal(duplicateDebts.every((row) => row.allocationEligible === true), true);
  assert.equal(duplicateDebts.every((row) => !row.reasonCodes.includes('SOR_MANUAL_ORDER_DUPLICATE')), true);
  assert.equal(getPhase4AllocatedSalesOrderId(result), duplicate.added.orderId);
});

test('PlanningModule Faz 4 tek amacli kayitla yalniz hedef SOR productionQueue metadatasini yazar', async () => {
  const Resolver = loadSanalTaksimResolver();
  const { snapshot } = buildSanalTaksimPhase4Snapshot();
  let saveCalls = 0;
  let renderCalls = 0;
  const alerts = [];
  const db = {
    data: {
      meta: { activeUserName: 'Demo Planlamacı' },
      data: snapshot
    },
    save: async () => {
      saveCalls += 1;
      return { ok: true };
    }
  };
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: db,
    SanalTaksimResolver: Resolver,
    UI: { renderCurrentPage: () => { renderCalls += 1; } },
    alert: (message) => alerts.push(String(message))
  });
  const targetOrder = snapshot.orders.find((row) => row.id === 'sor-sales');
  const beforeSnapshot = JSON.stringify(snapshot);
  const beforeTargetWithoutQueue = JSON.stringify(targetOrder);
  const beforeOtherOrders = JSON.stringify(snapshot.orders.filter((row) => row.id !== 'sor-sales'));
  const beforeWorkOrders = JSON.stringify(snapshot.workOrders);
  const beforeTransactions = JSON.stringify(snapshot.workOrderTransactions);
  const beforeStock = JSON.stringify(snapshot.stockDepotItems);
  const beforeMovements = JSON.stringify(snapshot.stock_movements);

  const saved = await PlanningModule.saveSalesProductionQueueManualOrder('sor-sales', '1', {
    now: '2026-07-24T11:12:13.000Z'
  });
  assert.equal(saved.ok, true);
  assert.equal(saveCalls, 1);
  assert.equal(renderCalls, 1);
  assert.equal(alerts.length, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(targetOrder.productionQueue)),
    {
      manualOrder: 1,
      updatedAt: '2026-07-24T11:12:13.000Z',
      updatedBy: 'Demo Planlamacı'
    }
  );
  const targetAfterWithoutQueue = { ...targetOrder };
  delete targetAfterWithoutQueue.productionQueue;
  assert.equal(JSON.stringify(targetAfterWithoutQueue), beforeTargetWithoutQueue);
  const snapshotWithoutQueue = JSON.parse(JSON.stringify(snapshot));
  delete snapshotWithoutQueue.orders.find((row) => row.id === 'sor-sales').productionQueue;
  assert.equal(JSON.stringify(snapshotWithoutQueue), beforeSnapshot);
  assert.equal(JSON.stringify(snapshot.orders.filter((row) => row.id !== 'sor-sales')), beforeOtherOrders);
  assert.equal(JSON.stringify(snapshot.workOrders), beforeWorkOrders);
  assert.equal(JSON.stringify(snapshot.workOrderTransactions), beforeTransactions);
  assert.equal(JSON.stringify(snapshot.stockDepotItems), beforeStock);
  assert.equal(JSON.stringify(snapshot.stock_movements), beforeMovements);
  assert.equal(Object.prototype.hasOwnProperty.call(targetOrder, 'allocation'), false);

  const refreshed = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: db,
    SanalTaksimResolver: Resolver
  }).exported;
  const demand = snapshot.planningDemands.find((row) => row.id === 'pln-sales');
  const model = refreshed.getReleasedSalesSanalTaksimModel(demand);
  assert.equal(model.productionQueue.mode, 'MANUAL');
  assert.equal(model.productionQueue.manualOrder, 1);
  assert.equal(getPhase4AllocatedSalesOrderId(Resolver.resolve(snapshot)), 'sor-manual-peer');
});

test('PlanningModule Faz 4 mukerrer manuel sirayi veri yazmadan reddeder', async () => {
  const Resolver = loadSanalTaksimResolver();
  const { snapshot, added } = buildSanalTaksimPhase4Snapshot();
  snapshot.orders.find((row) => row.id === added.orderId).productionQueue = {
    manualOrder: 1,
    updatedAt: '2026-07-24T10:00:00.000Z',
    updatedBy: 'Planlama Kullanıcısı'
  };
  let saveCalls = 0;
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: {
      data: { meta: { activeUserName: 'Demo Planlamacı' }, data: snapshot },
      save: async () => { saveCalls += 1; }
    },
    SanalTaksimResolver: Resolver
  });
  const before = JSON.stringify(snapshot);
  const result = await PlanningModule.saveSalesProductionQueueManualOrder('sor-sales', 1, {
    suppressAlert: true
  });
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'SOR_MANUAL_ORDER_DUPLICATE');
  assert.equal(saveCalls, 0);
  assert.equal(JSON.stringify(snapshot), before);
});

test('PlanningModule Faz 4 yalniz kesin ve acik SALES kuyrugunda pozitif tam sayi kabul eder', async () => {
  const Resolver = loadSanalTaksimResolver();
  const { snapshot } = buildSanalTaksimPhase4Snapshot();
  let saveCalls = 0;
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: {
      data: { meta: { activeUserName: 'Demo Planlamacı' }, data: snapshot },
      save: async () => { saveCalls += 1; }
    },
    SanalTaksimResolver: Resolver
  });
  const before = JSON.stringify(snapshot);
  let result = await PlanningModule.saveSalesProductionQueueManualOrder('sor-sales', 1.5, {
    suppressAlert: true
  });
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'SOR_MANUAL_ORDER_INVALID');

  snapshot.planningDemands = snapshot.planningDemands.filter((row) => row.id !== 'pln-sales');
  const beforeIneligibleSave = JSON.stringify(snapshot);
  result = await PlanningModule.saveSalesProductionQueueManualOrder('sor-sales', 1, {
    suppressAlert: true
  });
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'SOR_MANUAL_QUEUE_NOT_ELIGIBLE');
  assert.equal(saveCalls, 0);
  assert.equal(Object.prototype.hasOwnProperty.call(snapshot.orders[0], 'productionQueue'), false);
  assert.equal(JSON.stringify(snapshot), beforeIneligibleSave);
  assert.notEqual(beforeIneligibleSave, before);
});

test('PlanningModule Faz 4 DB save hatasinda productionQueue metadatasini geri alir', async () => {
  const Resolver = loadSanalTaksimResolver();
  const { snapshot } = buildSanalTaksimPhase4Snapshot();
  const targetOrder = snapshot.orders.find((row) => row.id === 'sor-sales');
  targetOrder.productionQueue = {
    manualOrder: 3,
    updatedAt: '2026-07-23T10:00:00.000Z',
    updatedBy: 'Önceki Kullanıcı',
    futureField: 'koru'
  };
  const before = JSON.stringify(snapshot);
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: {
      data: { meta: { activeUserName: 'Demo Planlamacı' }, data: snapshot },
      save: async () => { throw new Error('save failed'); }
    },
    SanalTaksimResolver: Resolver
  });
  const result = await PlanningModule.saveSalesProductionQueueManualOrder('sor-sales', 1, {
    suppressAlert: true
  });
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'SOR_MANUAL_QUEUE_SAVE_FAILED');
  assert.equal(JSON.stringify(snapshot), before);
  assert.equal(PlanningModule.state.productionQueueSavePendingOrderId, '');
});

test('PlanningModule Paket 3B legacy manualOrder verisini korurken editor ve rozeti gostermez', async () => {
  const Resolver = loadSanalTaksimResolver();
  const { snapshot, added } = buildSanalTaksimPhase4Snapshot();
  const targetOrder = snapshot.orders.find((row) => row.id === 'sor-sales');
  targetOrder.productionQueue = {
    manualOrder: 1,
    updatedAt: '2026-07-24T10:00:00.000Z',
    updatedBy: 'Planlama Kullanıcısı'
  };
  let saveCalls = 0;
  const db = {
    data: { meta: { activeUserName: 'Demo Planlamacı' }, data: snapshot },
    save: async () => { saveCalls += 1; return { ok: true }; }
  };
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: db,
    SanalTaksimResolver: Resolver
  });
  const demand = snapshot.planningDemands.find((row) => row.id === 'pln-sales');
  const headerHtml = PlanningModule.renderSalesProductionQueueHeaderHtml(demand);
  const panelHtml = PlanningModule.renderReleasedSalesSanalTaksimHtml(demand);
  assert.equal(headerHtml, '');
  assert.doesNotMatch(panelHtml, /data-sanal-taksim-production-queue/);
  assert.doesNotMatch(panelHtml, /data-sanal-taksim-manual-order-input/);
  assert.doesNotMatch(panelHtml, /data-sanal-taksim-manual-order-save/);
  assert.doesNotMatch(panelHtml, /data-sanal-taksim-sor-priority|SOR manuel önceliği/);
  assert.doesNotMatch(panelHtml, /Fallback sıra:/);
  assert.equal(saveCalls, 0);
  assert.equal(targetOrder.productionQueue.manualOrder, 1);
  assert.equal(getPhase4AllocatedSalesOrderId(Resolver.resolve(snapshot)), added.orderId);
});

test('SalesModule Faz 4 mevcut SOR revizyonunda productionQueue metadatasini koruyan merge davranisini surdurur', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src/modules/sales-module.js'), 'utf8');
  const start = source.indexOf('saveSalesOrderDraft: async () =>');
  const end = source.indexOf('hasPendingProformaBankDraft:', start);
  assert.ok(start >= 0);
  assert.ok(end > start);
  const block = source.slice(start, end);
  assert.match(block, /store\[idx\]\s*=\s*\{\s*\.\.\.prev,\s*\.\.\.basePayload,/);
  assert.doesNotMatch(block, /delete\s+[^;\n]*productionQueue/);
  assert.doesNotMatch(block, /productionQueue\s*:/);
});

function buildOutsourcePlanningUiHarness() {
  const alerts = [];
  let renderCount = 0;
  const { exported: UnitModule, context } = loadModule('src/modules/unit-module.js', 'UnitModule', {
    DB: {
      data: {
        data: {
          units: [{ id: 'u_dtm', name: 'Depo Transfer', type: 'internal' }],
          workOrders: [],
          workOrderTransactions: [],
          workOrderDispatchNotes: [],
          suppliers: []
        }
      }
    },
    UI: {
      renderCurrentPage: () => {
        renderCount += 1;
      }
    },
    alert: (message) => alerts.push(String(message))
  });
  return {
    UnitModule,
    context,
    alerts,
    get renderCount() {
      return renderCount;
    }
  };
}

test('Fason ic birimden gelenler baglaminda Aktif Islemler pasif ve guvenli sekme BEKLEYEN olur', () => {
  const harness = buildOutsourcePlanningUiHarness();
  const { UnitModule } = harness;
  const container = { innerHTML: '' };

  UnitModule.state.workOrderPlanningBackTarget = 'stock:outsource-external-unit';
  UnitModule.state.workOrderTab = 'AKTIF';
  UnitModule.renderWorkOrderPlanningPlaceholder(container, 'u_dtm');

  assert.equal(UnitModule.state.workOrderTab, 'BEKLEYEN');
  assert.match(container.innerHTML, /disabled aria-disabled="true" title="Fason sevk hazırlığında kullanılamaz"/);
  assert.doesNotMatch(container.innerHTML, /onclick="UnitModule\.setWorkOrderTab\('AKTIF'\)"/);

  UnitModule.state.workOrderPlanningBackTarget = '';
  UnitModule.state.workOrderTab = 'AKTIF';
  UnitModule.renderWorkOrderPlanningPlaceholder(container, 'u_dtm');

  assert.equal(UnitModule.state.workOrderTab, 'AKTIF');
  assert.match(container.innerHTML, /onclick="UnitModule\.setWorkOrderTab\('AKTIF'\)"/);
});

test('Fason ic birimden gelenler baglaminda programatik AKTIF secimi engellenir', () => {
  const harness = buildOutsourcePlanningUiHarness();
  const { UnitModule, alerts } = harness;

  UnitModule.state.workOrderPlanningBackTarget = 'stock:outsource-external-unit';
  UnitModule.state.workOrderTab = 'BEKLEYEN';
  UnitModule.setWorkOrderTab('AKTIF');

  assert.equal(UnitModule.state.workOrderTab, 'BEKLEYEN');
  assert.equal(alerts.at(-1), 'Fason sevk işlemleri Fason Dış Birim İşlem ekranından yürütülmelidir.');

  UnitModule.state.workOrderPlanningBackTarget = '';
  UnitModule.setWorkOrderTab('AKTIF');
  assert.equal(UnitModule.state.workOrderTab, 'AKTIF');
});

test('Tamamlanan adet girisi yalniz fason ic birimden gelenler baglaminda engellenir', async () => {
  const calls = [];
  const alerts = [];
  const { exported: UnitModule } = loadModule('src/modules/unit-module.js', 'UnitModule', {
    DB: {
      data: {
        data: {
          workOrders: [{ id: 'wo-guard', lines: [{ id: 'line-guard' }] }],
          workOrderTransactions: []
        }
      }
    },
    alert: (message) => alerts.push(String(message)),
    document: {
      getElementById: () => ({ value: '2' })
    }
  });
  UnitModule.computeWorkLineUnitMetrics = () => ({
    inProcessQty: 5,
    routeId: 'route-guard',
    routeSeq: 1,
    processId: 'process-guard'
  });
  UnitModule.addWorkOrderTxn = async (...args) => calls.push(args);

  UnitModule.state.workOrderPlanningBackTarget = 'stock:outsource-external-unit';
  await UnitModule.completeWorkOrderQtyFromInput('wo-guard', 'line-guard', 'u_dtm', 'qty-input', 1);
  assert.equal(calls.length, 0);
  assert.equal(alerts.at(-1), 'Fason sevk işlemleri Fason Dış Birim İşlem ekranından yürütülmelidir.');

  UnitModule.state.workOrderPlanningBackTarget = '';
  await UnitModule.completeWorkOrderQtyFromInput('wo-guard', 'line-guard', 'u_dtm', 'qty-input', 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][3], 'COMPLETE');
  assert.equal(calls[0][4], 2);
});

test('Fason kisayolundan geri cikilip normal Depo Transfer acilinca context temizlenir', () => {
  const { exported: UnitModule, context: unitContext } = loadModule('src/modules/unit-module.js', 'UnitModule');
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', { UnitModule });
  unitContext.StockModule = StockModule;

  StockModule.openOutsourceInternalReceiptsShortcut();
  assert.equal(UnitModule.state.workOrderPlanningBackTarget, 'stock:outsource-external-unit');

  UnitModule.handleWorkOrderPlanningBack('u_dtm');
  assert.equal(UnitModule.state.workOrderPlanningBackTarget, '');
  assert.equal(StockModule.state.workspaceView, 'outsource-external-unit');

  StockModule.openWorkspace('work-order-planning');
  assert.equal(UnitModule.state.workOrderPlanningBackTarget, '');
  assert.equal(StockModule.state.workspaceView, 'work-order-planning');
});

function buildTransferHarness({ statusKey = 'available', saveMode = 'success' } = {}) {
  const alerts = [];
  let saveCount = 0;
  let renderCount = 0;
  let historyCount = 0;
  let idCounter = 0;

  const dom = {};
  const stockDepotItems = [
    {
      id: 'src-1',
      productId: 'p-1',
      productCode: 'ABC-1',
      code: 'ABC-1',
      productName: 'Parca A',
      name: 'Parca A',
      qty: 10,
      quantity: 10,
      amount: 10,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'order-1',
      sourceLineId: 'line-1',
      demandId: 'demand-1',
      itemKey: 'item-1',
      depotId: 'depot_a',
      locationId: 'loc_a',
      locationCode: 'A-01'
    },
    {
      id: 'tgt-1',
      productId: 'p-1',
      productCode: 'ABC-1',
      code: 'ABC-1',
      productName: 'Parca A',
      name: 'Parca A',
      qty: 3,
      quantity: 3,
      amount: 3,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'order-1',
      sourceLineId: 'line-1',
      demandId: 'demand-1',
      itemKey: 'item-1',
      depotId: 'depot_b',
      locationId: 'loc_b',
      locationCode: 'B-09'
    }
  ];
  const stockDepotLocations = [
    { id: 'loc_a', depotId: 'depot_a', locationCode: 'A-01', code: 'A-01' },
    { id: 'loc_b', depotId: 'depot_b', locationCode: 'B-09', code: 'B-09' }
  ];

  const { exported: StockModule, context } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: {
      data: {
        data: {
          stockDepotItems,
          stockDepotLocations,
          stock_movements: []
        }
      },
      save: async () => {
        saveCount += 1;
        if (saveMode === 'throw') throw new Error('transfer save exception');
        if (saveMode === 'failure') return { ok: false, error: { message: 'transfer save failure' } };
        return { ok: true };
      }
    },
    UI: {
      renderCurrentPage: () => {
        renderCount += 1;
      }
    },
    alert: (message) => {
      alerts.push(String(message));
    },
    document: {
      getElementById: (id) => dom[id] || null
    },
    crypto: {
      randomUUID: () => {
        idCounter += 1;
        return `uuid-${idCounter}`;
      }
    }
  });

  StockModule.getStockRowQty = (row) => Math.max(0, Number(row?.qty || row?.quantity || row?.amount || 0));
  StockModule.setStockRowQty = (row, qty) => {
    const safe = Math.max(0, Number(qty || 0));
    row.qty = safe;
    row.quantity = safe;
    row.amount = safe;
  };
  StockModule.getInventoryRowStatusMeta = () => ({ key: statusKey });
  StockModule.resolveScopeIdFromStockRow = (row) => String(row?.depotId || '');
  StockModule.findLocationByIdCodeOrCode = (rawCode) => {
    const wanted = String(rawCode || '').trim().toUpperCase();
    return context.DB.data.data.stockDepotLocations.find((loc) =>
      String(loc?.locationCode || loc?.code || '').trim().toUpperCase() === wanted
    ) || null;
  };
  StockModule.getLocationCode = (location) => String(location?.locationCode || location?.code || '');
  StockModule.resolveNodeKeyFromScopeId = (scopeId) => `managed:${scopeId}`;
  StockModule.normalize = (value) => String(value || '').trim().toUpperCase();
  StockModule.normalizeStockClass = (value) => {
    const raw = String(value || 'KULLANILABILIR').trim().toUpperCase();
    return raw === 'WIP' ? 'WIP' : 'KULLANILABILIR';
  };
  StockModule.getScopeNameById = (scopeId) => `SCOPE:${scopeId}`;
  StockModule.openInventoryRowHistory = () => {
    historyCount += 1;
  };

  return {
    StockModule,
    context,
    dom,
    alerts,
    get saveCount() {
      return saveCount;
    },
    get renderCount() {
      return renderCount;
    },
    get historyCount() {
      return historyCount;
    }
  };
}

test('StockModule.submitInventoryTransferFromModal transfer hareketini dogru yazar', async () => {
  const harness = buildTransferHarness();
  const { StockModule, context, dom, alerts } = harness;

  dom['stock-transfer-qty'] = { value: '4' };
  dom['stock-transfer-mode'] = { value: 'select' };
  dom['stock-transfer-target-scope'] = { value: 'depot_b' };
  dom['stock-transfer-target-location'] = { value: 'loc_b' };

  await StockModule.submitInventoryTransferFromModal('src-1', 'ABC-1');

  const source = context.DB.data.data.stockDepotItems.find((row) => row.id === 'src-1');
  const target = context.DB.data.data.stockDepotItems.find((row) => row.id === 'tgt-1');
  const movement = context.DB.data.data.stock_movements[0];

  assert.equal(source.qty, 6);
  assert.equal(target.qty, 7);
  assert.equal(context.DB.data.data.stock_movements.length, 1);
  assert.equal(movement.type, 'TRANSFER');
  assert.equal(movement.movementType, 'TRANSFER');
  assert.equal(movement.sourceDepotId, 'depot_a');
  assert.equal(movement.targetDepotId, 'depot_b');
  assert.equal(movement.qty, 4);
  assert.equal(movement.sourceType, 'SALES_ORDER');
  assert.equal(movement.sourceOrderId, 'order-1');
  assert.equal(movement.sourceLineId, 'line-1');
  assert.equal(movement.demandId, 'demand-1');
  assert.equal(movement.itemKey, 'item-1');
  assert.ok(alerts.includes('Transfer tamamlandi.'));
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.renderCount, 1);
  assert.equal(harness.historyCount, 1);
});

test('StockModule.submitInventoryTransferFromModal ayni lokasyona transferi engeller', async () => {
  const harness = buildTransferHarness();
  const { StockModule, context, dom, alerts } = harness;

  dom['stock-transfer-qty'] = { value: '2' };
  dom['stock-transfer-mode'] = { value: 'select' };
  dom['stock-transfer-target-scope'] = { value: 'depot_a' };
  dom['stock-transfer-target-location'] = { value: 'loc_a' };

  await StockModule.submitInventoryTransferFromModal('src-1', 'ABC-1');

  const source = context.DB.data.data.stockDepotItems.find((row) => row.id === 'src-1');
  assert.equal(source.qty, 10);
  assert.equal(context.DB.data.data.stock_movements.length, 0);
  assert.ok(alerts.includes('Kaynak ve hedef ayni lokasyon olamaz.'));
  assert.equal(harness.saveCount, 0);
  assert.equal(harness.renderCount, 0);
  assert.equal(harness.historyCount, 0);
});

test('StockModule.submitInventoryTransferFromModal sadece kullanilabilir stokta calisir', async () => {
  const harness = buildTransferHarness({ statusKey: 'wip' });
  const { StockModule, context, dom, alerts } = harness;

  dom['stock-transfer-qty'] = { value: '2' };
  dom['stock-transfer-mode'] = { value: 'select' };
  dom['stock-transfer-target-scope'] = { value: 'depot_b' };
  dom['stock-transfer-target-location'] = { value: 'loc_b' };

  await StockModule.submitInventoryTransferFromModal('src-1', 'ABC-1');

  const source = context.DB.data.data.stockDepotItems.find((row) => row.id === 'src-1');
  assert.equal(source.qty, 10);
  assert.equal(context.DB.data.data.stock_movements.length, 0);
  assert.ok(alerts.includes('Bu adimda sadece kullanilabilir stok transferine izin verilir.'));
  assert.equal(harness.saveCount, 0);
});

test('StockModule depo transferinde farkli kaynakla birlestirmez ve kaynak alanlarini korur', async () => {
  const harness = buildTransferHarness();
  const { StockModule, context, dom } = harness;
  const existingTarget = context.DB.data.data.stockDepotItems.find((row) => row.id === 'tgt-1');
  existingTarget.sourceOrderId = 'order-2';
  existingTarget.sourceLineId = 'line-2';
  existingTarget.demandId = 'demand-2';
  existingTarget.itemKey = 'item-2';

  dom['stock-transfer-qty'] = { value: '4' };
  dom['stock-transfer-mode'] = { value: 'select' };
  dom['stock-transfer-target-scope'] = { value: 'depot_b' };
  dom['stock-transfer-target-location'] = { value: 'loc_b' };

  await StockModule.submitInventoryTransferFromModal('src-1', 'ABC-1');

  const targetRows = context.DB.data.data.stockDepotItems.filter((row) => row.depotId === 'depot_b' && row.locationId === 'loc_b');
  const transferred = targetRows.find((row) => row.id !== 'tgt-1');
  assert.equal(targetRows.length, 2);
  assert.equal(existingTarget.qty, 3);
  assert.ok(transferred);
  assert.equal(transferred.qty, 4);
  assert.equal(transferred.sourceType, 'SALES_ORDER');
  assert.equal(transferred.sourceOrderId, 'order-1');
  assert.equal(transferred.sourceLineId, 'line-1');
  assert.equal(transferred.demandId, 'demand-1');
  assert.equal(transferred.itemKey, 'item-1');
});

function clearTransferCanonicalFields(row) {
  delete row.sourceType;
  delete row.sourceOrderId;
  delete row.sourceLineId;
  delete row.demandId;
  delete row.itemKey;
}

function prepareTransferDom(dom, qty = '2') {
  dom['stock-transfer-qty'] = { value: String(qty) };
  dom['stock-transfer-mode'] = { value: 'select' };
  dom['stock-transfer-target-scope'] = { value: 'depot_b' };
  dom['stock-transfer-target-location'] = { value: 'loc_b' };
}

test('StockModule tam STOCK kaynagini transferde korur', async () => {
  const harness = buildTransferHarness();
  const { StockModule, context, dom } = harness;
  const source = context.DB.data.data.stockDepotItems.find((row) => row.id === 'src-1');
  const target = context.DB.data.data.stockDepotItems.find((row) => row.id === 'tgt-1');
  [source, target].forEach((row) => {
    row.sourceType = 'STOCK';
    delete row.sourceOrderId;
    delete row.sourceLineId;
    row.demandId = 'stock-demand-1';
    row.itemKey = 'stock-item-1';
  });
  prepareTransferDom(dom);

  await StockModule.submitInventoryTransferFromModal('src-1', 'ABC-1');

  assert.equal(target.qty, 5);
  const movement = context.DB.data.data.stock_movements[0];
  assert.equal(movement.sourceType, 'STOCK');
  assert.equal(movement.demandId, 'stock-demand-1');
  assert.equal(movement.itemKey, 'stock-item-1');
});

for (const entryType of ['GOODS_RECEIPT', 'MANUAL_ENTRY']) {
  test(`StockModule ${entryType} kaynaksiz stok transferini acar ve canonical hedefle birlestirmez`, async () => {
    const harness = buildTransferHarness();
    const { StockModule, context, dom } = harness;
    const source = context.DB.data.data.stockDepotItems.find((row) => row.id === 'src-1');
    const canonicalTarget = context.DB.data.data.stockDepotItems.find((row) => row.id === 'tgt-1');
    clearTransferCanonicalFields(source);
    source.note = entryType === 'GOODS_RECEIPT' ? 'Mal kabul / GR-1' : 'Envantere elle kayit / INV-1';
    prepareTransferDom(dom);

    await StockModule.submitInventoryTransferFromModal('src-1', 'ABC-1');

    const targetRows = context.DB.data.data.stockDepotItems.filter((row) => row.depotId === 'depot_b' && row.locationId === 'loc_b');
    const transferred = targetRows.find((row) => row.id !== 'tgt-1');
    assert.equal(targetRows.length, 2);
    assert.equal(canonicalTarget.qty, 3);
    assert.ok(transferred);
    assert.equal(transferred.qty, 2);
    assert.equal(transferred.sourceType, undefined);
    assert.equal(transferred.sourceOrderId, undefined);
    assert.equal(transferred.demandId, undefined);
  });
}

test('StockModule tarihsel UNSCOPED stogu yalniz UNSCOPED hedefle birlestirir', async () => {
  const harness = buildTransferHarness();
  const { StockModule, context, dom } = harness;
  const source = context.DB.data.data.stockDepotItems.find((row) => row.id === 'src-1');
  const target = context.DB.data.data.stockDepotItems.find((row) => row.id === 'tgt-1');
  clearTransferCanonicalFields(source);
  clearTransferCanonicalFields(target);
  prepareTransferDom(dom);

  await StockModule.submitInventoryTransferFromModal('src-1', 'ABC-1');

  assert.equal(context.DB.data.data.stockDepotItems.length, 2);
  assert.equal(source.qty, 8);
  assert.equal(target.qty, 5);
});

test('StockModule eksik SALES_ORDER veya STOCK kaynak kimligini fail-closed engeller', async () => {
  for (const partialType of ['SALES_ORDER', 'STOCK']) {
    const harness = buildTransferHarness();
    const { StockModule, context, dom, alerts } = harness;
    const source = context.DB.data.data.stockDepotItems.find((row) => row.id === 'src-1');
    if (partialType === 'SALES_ORDER') {
      delete source.sourceLineId;
    } else {
      source.sourceType = 'STOCK';
      delete source.sourceOrderId;
      delete source.sourceLineId;
      delete source.itemKey;
    }
    const before = JSON.stringify(context.DB.data.data);
    prepareTransferDom(dom);

    await StockModule.submitInventoryTransferFromModal('src-1', 'ABC-1');

    assert.equal(JSON.stringify(context.DB.data.data), before);
    assert.ok(alerts.some((message) => message.includes('eksik veya çelişkili')));
    assert.equal(harness.saveCount, 0);
  }
});

test('StockModule depo transferi DB.save exception ve ok:false sonucunda rollback yapar', async () => {
  for (const saveMode of ['throw', 'failure']) {
    const harness = buildTransferHarness({ saveMode });
    const { StockModule, context, dom } = harness;
    const before = JSON.stringify(context.DB.data.data);
    prepareTransferDom(dom);

    await StockModule.submitInventoryTransferFromModal('src-1', 'ABC-1');

    assert.equal(JSON.stringify(context.DB.data.data), before);
    assert.equal(harness.saveCount, 1);
    assert.equal(harness.renderCount, 0);
    assert.equal(harness.historyCount, 0);
  }
});

function buildProductionStoreHarness({ workOrders = [], planningDemands = [], saveMode = 'success' } = {}) {
  const alerts = [];
  let saveCount = 0;
  let renderCount = 0;
  let idCounter = 0;
  const data = {
    workOrders,
    planningDemands,
    workOrderTransactions: [],
    stockDepotItems: [],
    stock_movements: [],
    stockDepotLocations: [{ id: 'loc-main-a1', depotId: 'main', code: 'R01-A1', locationCode: 'R01-A1' }],
    stockDepots: [{ id: 'main', name: 'ANA DEPO' }],
    units: [],
    externalProcessSupplierLinks: []
  };
  const DB = {
    data: { data },
    save: async () => {
      saveCount += 1;
      if (saveMode === 'throw') throw new Error('disk exception');
      if (saveMode === 'failure') return { ok: false, error: { message: 'disk failure' } };
      return { ok: true };
    }
  };
  const stockHarness = loadModule('src/modules/stock-module.js', 'StockModule', { DB });
  const { exported: StockModule } = stockHarness;
  const { exported: UnitModule, context } = loadModule('src/modules/unit-module.js', 'UnitModule', {
    DB,
    StockModule,
    UI: { renderCurrentPage: () => { renderCount += 1; } },
    alert: (message) => { alerts.push(String(message)); },
    crypto: { randomUUID: () => `store-uuid-${++idCounter}` }
  });
  stockHarness.context.UnitModule = UnitModule;
  UnitModule.computeWorkLineUnitMetrics = () => ({
    isFinalStep: true,
    inProcessQty: 20,
    depotPendingQty: 0,
    routeId: 'route-final',
    routeSeq: 1,
    processId: 'PROCESS-FINAL'
  });
  return {
    UnitModule,
    StockModule,
    context,
    data,
    alerts,
    get saveCount() { return saveCount; },
    get renderCount() { return renderCount; }
  };
}

function buildStoreWorkOrder({ id, sourceId, itemKey, code = 'PRC-000001' }) {
  return {
    id,
    workOrderCode: `WO-${id}`,
    sourceId,
    sourceItemKey: itemKey,
    lines: [{
      id: `line-${id}`,
      componentCode: code,
      componentName: 'Test Parçası',
      unit: 'ADET'
    }]
  };
}

async function storeHarnessWorkOrder(harness, order, qty = 1) {
  return harness.UnitModule.storeWorkOrderQty(order.id, order.lines[0].id, 'u-final', qty, {
    skipPrompt: true,
    routeSeq: 1,
    targetScopeId: 'main',
    targetLocationId: 'loc-main-a1',
    targetLocationCode: 'R01-A1'
  });
}

test('Uretim STORE ayni PRC ve lokasyondaki farkli SOR satirlarini ayri tutar', async () => {
  const first = buildStoreWorkOrder({ id: 'wo-sales-1', sourceId: 'demand-sales-1', itemKey: 'item-sales-1' });
  const second = buildStoreWorkOrder({ id: 'wo-sales-2', sourceId: 'demand-sales-2', itemKey: 'item-sales-2' });
  const harness = buildProductionStoreHarness({
    workOrders: [first, second],
    planningDemands: [
      { id: 'demand-sales-1', sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'order-line-1', workOrderIds: [first.id], items: [{ id: 'item-sales-1' }] },
      { id: 'demand-sales-2', sourceType: 'SALES_ORDER', sourceOrderId: 'order-2', sourceLineId: 'order-line-2', workOrderIds: [second.id], items: [{ id: 'item-sales-2' }] }
    ]
  });

  assert.equal(await storeHarnessWorkOrder(harness, first), true);
  assert.equal(await storeHarnessWorkOrder(harness, second), true);

  assert.equal(harness.data.stockDepotItems.length, 2);
  assert.deepEqual(harness.data.stockDepotItems.map((row) => row.sourceOrderId).sort(), ['order-1', 'order-2']);
  assert.equal(harness.data.stock_movements.length, 2);
  assert.equal(harness.data.stock_movements[0].demandId, 'demand-sales-1');
  assert.equal(harness.data.stock_movements[1].itemKey, 'item-sales-2');
});

test('Uretim STORE ayni kanonik kaynakla ikinci giriste dogru satiri artirir', async () => {
  const order = buildStoreWorkOrder({ id: 'wo-sales-same', sourceId: 'demand-sales-same', itemKey: 'item-sales-same' });
  const harness = buildProductionStoreHarness({
    workOrders: [order],
    planningDemands: [{
      id: 'demand-sales-same', sourceType: 'SALES_ORDER', sourceOrderId: 'order-same', sourceLineId: 'line-same',
      workOrderIds: [order.id], items: [{ id: 'item-sales-same' }]
    }]
  });

  await storeHarnessWorkOrder(harness, order, 2);
  await storeHarnessWorkOrder(harness, order, 3);

  assert.equal(harness.data.stockDepotItems.length, 1);
  assert.equal(harness.data.stockDepotItems[0].qty, 5);
  assert.equal(harness.data.stock_movements.length, 2);
});

test('Uretim STORE SALES_ORDER ve STOCK kaynaklarini ayri satirlarda tutar', async () => {
  const salesOrder = buildStoreWorkOrder({ id: 'wo-sales-mixed', sourceId: 'demand-sales-mixed', itemKey: 'item-sales-mixed' });
  const stockOrder = buildStoreWorkOrder({ id: 'wo-stock-mixed', sourceId: 'demand-stock-mixed', itemKey: 'item-stock-mixed' });
  const harness = buildProductionStoreHarness({
    workOrders: [salesOrder, stockOrder],
    planningDemands: [
      { id: 'demand-sales-mixed', sourceType: 'SALES_ORDER', sourceOrderId: 'order-mixed', sourceLineId: 'line-mixed', workOrderIds: [salesOrder.id], items: [{ id: 'item-sales-mixed' }] },
      { id: 'demand-stock-mixed', sourceType: 'STOCK', workOrderIds: [stockOrder.id], items: [{ id: 'item-stock-mixed' }] }
    ]
  });

  await storeHarnessWorkOrder(harness, salesOrder);
  await storeHarnessWorkOrder(harness, stockOrder);

  assert.equal(harness.data.stockDepotItems.length, 2);
  assert.deepEqual(harness.data.stockDepotItems.map((row) => row.sourceType).sort(), ['SALES_ORDER', 'STOCK']);
});

test('Uretim STORE eksik veya celiskili kaynakta fail-closed kalir', async () => {
  const order = buildStoreWorkOrder({ id: 'wo-invalid-source', sourceId: 'demand-invalid', itemKey: 'missing-item' });
  const harness = buildProductionStoreHarness({
    workOrders: [order],
    planningDemands: [{ id: 'demand-invalid', sourceType: 'SALES_ORDER', sourceOrderId: 'order-invalid', sourceLineId: 'line-invalid', workOrderIds: [order.id], items: [{ id: 'other-item' }] }]
  });
  const before = JSON.stringify(harness.data);

  assert.equal(await storeHarnessWorkOrder(harness, order), false);
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => message.includes('talep satırı bağlantısı')));
});

test('Uretim STORE DB.save exception ve ok:false sonucunda tam rollback yapar', async () => {
  for (const saveMode of ['throw', 'failure']) {
    const order = buildStoreWorkOrder({ id: `wo-rollback-${saveMode}`, sourceId: `demand-rollback-${saveMode}`, itemKey: `item-rollback-${saveMode}` });
    const harness = buildProductionStoreHarness({
      saveMode,
      workOrders: [order],
      planningDemands: [{
        id: `demand-rollback-${saveMode}`, sourceType: 'SALES_ORDER', sourceOrderId: 'order-rollback', sourceLineId: 'line-rollback',
        workOrderIds: [order.id], items: [{ id: `item-rollback-${saveMode}` }]
      }]
    });
    const before = JSON.stringify(harness.data);

    assert.equal(await storeHarnessWorkOrder(harness, order), false);
    assert.equal(JSON.stringify(harness.data), before);
    assert.equal(harness.saveCount, 1);
    assert.equal(harness.renderCount, 0);
  }
});

function buildPhase1LegacyCleanupHarness({ sourceType = 'STOCK', saveMode = 'success' } = {}) {
  const alerts = [];
  const confirms = [];
  let saveCount = 0;
  let renderCount = 0;
  const demand = {
    id: 'demand-phase1-cleanup',
    demandCode: 'PLN-PHASE1-CLEANUP',
    sourceType,
    status: 'RELEASED',
    workOrderIds: ['wo-phase1-cleanup'],
    items: [{ id: 'item-phase1-cleanup' }],
    poolAnalysis: { stockAccountingMode: 'VIRTUAL_V1', rows: [] },
    ...(sourceType === 'SALES_ORDER' ? {
      sourceOrderId: 'order-phase1-cleanup',
      sourceOrderNo: 'SOR-PHASE1-CLEANUP',
      sourceLineId: 'sales-line-phase1-cleanup'
    } : {})
  };
  const workOrder = {
    id: 'wo-phase1-cleanup',
    workOrderCode: 'WO-PHASE1-CLEANUP',
    sourceId: demand.id,
    sourceCode: demand.demandCode,
    sourceItemKey: 'item-phase1-cleanup',
    lines: [{
      id: 'wo-line-phase1-cleanup',
      componentCode: 'PRC-PHASE1-OUT',
      componentName: 'Faz 1 Ürün',
      unit: 'ADET'
    }]
  };
  const canonicalSource = {
    sourceType,
    demandId: demand.id,
    itemKey: 'item-phase1-cleanup',
    ...(sourceType === 'SALES_ORDER' ? {
      sourceOrderId: demand.sourceOrderId,
      sourceLineId: demand.sourceLineId
    } : {})
  };
  const data = {
    orders: sourceType === 'SALES_ORDER' ? [{
      id: demand.sourceOrderId,
      orderNo: demand.sourceOrderNo,
      lines: [{ id: demand.sourceLineId }]
    }] : [],
    planningDemands: [demand],
    workOrders: [workOrder],
    workOrderTransactions: [
      { id: 'txn-phase1-take', workOrderId: workOrder.id, lineId: workOrder.lines[0].id, type: 'TAKE', qty: 4 },
      { id: 'txn-phase1-complete', workOrderId: workOrder.id, lineId: workOrder.lines[0].id, type: 'COMPLETE', qty: 4 },
      { id: 'txn-phase1-store', workOrderId: workOrder.id, lineId: workOrder.lines[0].id, type: 'STORE', qty: 4 }
    ],
    stockDepotLocations: [
      { id: 'loc-phase1-raw', depotId: 'main', locationCode: 'RAW-A1' },
      { id: 'loc-phase1-out', depotId: 'main', locationCode: 'OUT-A1' }
    ],
    stockDepotItems: [
      {
        id: 'stock-phase1-raw', productCode: 'RAW-PHASE1', code: 'RAW-PHASE1',
        depotId: 'main', locationId: 'loc-phase1-raw', locationCode: 'RAW-A1', unit: 'KG',
        qty: 2, quantity: 2, amount: 2
      },
      {
        id: 'stock-phase1-output', productCode: 'PRC-PHASE1-OUT', code: 'PRC-PHASE1-OUT',
        depotId: 'main', locationId: 'loc-phase1-out', locationCode: 'OUT-A1', unit: 'ADET',
        qty: 4, quantity: 4, amount: 4, ...canonicalSource
      },
      {
        id: 'stock-phase1-foreign', productCode: 'PRC-PHASE1-OUT', code: 'PRC-PHASE1-OUT',
        depotId: 'main', locationId: 'loc-phase1-out', locationCode: 'OUT-A1', unit: 'ADET',
        qty: 9, quantity: 9, amount: 9,
        sourceType: 'STOCK', demandId: 'foreign-demand', itemKey: 'foreign-item'
      }
    ],
    stock_movements: [
      {
        id: 'movement-phase1-issue', movementType: 'WORK_ORDER_ISSUE', type: 'WORK_ORDER_ISSUE',
        workOrderId: workOrder.id, workOrderCode: workOrder.workOrderCode,
        productCode: 'RAW-PHASE1', code: 'RAW-PHASE1', sourceQty: 8, sourceUnit: 'KG',
        sourceDepotId: 'main', sourceLocationId: 'loc-phase1-raw', sourceLocationCode: 'RAW-A1',
        sourceStockItemId: 'stock-phase1-raw'
      },
      {
        id: 'movement-phase1-store', movementType: 'STORE', type: 'STORE',
        workOrderId: workOrder.id, workOrderCode: workOrder.workOrderCode,
        productCode: 'PRC-PHASE1-OUT', code: 'PRC-PHASE1-OUT', qty: 4, quantity: 4, unit: 'ADET',
        depotId: 'main', locationId: 'loc-phase1-out', locationCode: 'OUT-A1',
        stockDepotItemId: 'stock-phase1-output', outputStockItemId: 'stock-phase1-output',
        ...canonicalSource
      }
    ],
    montageJobDispatches: [{ id: 'legacy-phase1', demandId: demand.id, workOrderId: workOrder.id }],
    workOrderExternalSupplierAssignments: [],
    outsourceDispatchDrafts: [],
    workOrderDispatchNotes: [],
    montageDispatchPlans: [],
    montageDispatchShipments: [],
    sanalTaksimAllocationInstructions: [],
    montageCompletionTransfers: [],
    salesShipmentPlans: [],
    salesShipments: []
  };
  const DB = {
    data: { data },
    cloneState: (state) => JSON.parse(JSON.stringify(state)),
    createCriticalDropApproval: () => ({ token: 'phase1-cleanup' }),
    save: async () => {
      saveCount += 1;
      if (saveMode === 'throw') throw new Error('phase1 disk exception');
      if (saveMode === 'failure') return { ok: false, code: 'phase1_save_failure', error: new Error('phase1 disk failure') };
      return { ok: true };
    }
  };
  const { exported: PlanningModule, context } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB,
    UI: { renderCurrentPage: () => { renderCount += 1; } },
    Modal: { close: () => {} },
    alert: (message) => { alerts.push(String(message)); },
    confirm: (message) => { confirms.push(String(message)); return true; }
  });
  return {
    DB, data, demand, workOrder, PlanningModule, context, alerts, confirms,
    get saveCount() { return saveCount; },
    get renderCount() { return renderCount; }
  };
}

test('FAZ 1 LEGACY CLEANUP STOCK reset exact stok ve kayit durumunu baslangica dondurur', async () => {
  const harness = buildPhase1LegacyCleanupHarness();
  await harness.PlanningModule.cleanupStockDemandForDemo(harness.demand.id);

  assert.equal(harness.data.planningDemands.length, 0);
  assert.equal(harness.data.workOrders.length, 0);
  assert.equal(harness.data.workOrderTransactions.length, 0);
  assert.equal(harness.data.stock_movements.length, 0);
  assert.equal(harness.data.montageJobDispatches.length, 0);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'stock-phase1-raw').qty, 10);
  assert.equal(harness.data.stockDepotItems.some((row) => row.id === 'stock-phase1-output'), false);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'stock-phase1-foreign').qty, 9);
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.renderCount, 1);
});

test('FAZ 1 LEGACY CLEANUP STORE ambiguous canonical kaynakta hic mutation yapmadan fail-closed kalir', async () => {
  const harness = buildPhase1LegacyCleanupHarness();
  const movement = harness.data.stock_movements.find((row) => row.id === 'movement-phase1-store');
  delete movement.stockDepotItemId;
  delete movement.outputStockItemId;
  harness.data.stockDepotItems.push({
    ...JSON.parse(JSON.stringify(harness.data.stockDepotItems.find((row) => row.id === 'stock-phase1-output'))),
    id: 'stock-phase1-output-duplicate'
  });
  const before = JSON.stringify(harness.data);

  await harness.PlanningModule.cleanupStockDemandForDemo(harness.demand.id);

  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
  assert.equal(harness.confirms.length, 0);
  assert.ok(harness.alerts.some((message) => message.includes('birden fazla aday')));
});

test('FAZ 1 LEGACY CLEANUP WORK_ORDER_ISSUE sourceStockItemId olmadan tekil metadata ile exact geri alinir', async () => {
  const harness = buildPhase1LegacyCleanupHarness();
  delete harness.data.stock_movements.find((row) => row.id === 'movement-phase1-issue').sourceStockItemId;

  await harness.PlanningModule.cleanupStockDemandForDemo(harness.demand.id);

  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'stock-phase1-raw').qty, 10);
  assert.equal(harness.saveCount, 1);
});

test('FAZ 1 LEGACY CLEANUP WORK_ORDER_ISSUE metadata adayi birden fazlaysa fail-closed kalir', async () => {
  const harness = buildPhase1LegacyCleanupHarness();
  delete harness.data.stock_movements.find((row) => row.id === 'movement-phase1-issue').sourceStockItemId;
  harness.data.stockDepotItems.push({
    ...JSON.parse(JSON.stringify(harness.data.stockDepotItems.find((row) => row.id === 'stock-phase1-raw'))),
    id: 'stock-phase1-raw-duplicate'
  });
  const before = JSON.stringify(harness.data);

  await harness.PlanningModule.cleanupStockDemandForDemo(harness.demand.id);

  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => message.includes('birden fazla aday')));
});

test('FAZ 1 LEGACY CLEANUP SALES_ORDER ayni motorla legacy zinciri temizler ve modern koleksiyonlari degistirmez', async () => {
  const harness = buildPhase1LegacyCleanupHarness({ sourceType: 'SALES_ORDER' });
  const modernBefore = JSON.stringify({
    montageDispatchPlans: harness.data.montageDispatchPlans,
    montageDispatchShipments: harness.data.montageDispatchShipments,
    sanalTaksimAllocationInstructions: harness.data.sanalTaksimAllocationInstructions,
    montageCompletionTransfers: harness.data.montageCompletionTransfers,
    salesShipmentPlans: harness.data.salesShipmentPlans,
    salesShipments: harness.data.salesShipments
  });
  const { exported: SalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', {
    DB: harness.DB,
    PlanningModule: harness.PlanningModule,
    UI: { renderCurrentPage: () => {} },
    Modal: { close: () => {} },
    alert: (message) => { harness.alerts.push(String(message)); },
    confirm: () => true
  });

  await SalesModule.deleteSalesOrder('order-phase1-cleanup');

  assert.equal(harness.data.orders.length, 0);
  assert.equal(harness.data.planningDemands.length, 0);
  assert.equal(harness.data.workOrders.length, 0);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'stock-phase1-raw').qty, 10);
  assert.equal(harness.data.stockDepotItems.some((row) => row.id === 'stock-phase1-output'), false);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'stock-phase1-foreign').qty, 9);
  assert.equal(JSON.stringify({
    montageDispatchPlans: harness.data.montageDispatchPlans,
    montageDispatchShipments: harness.data.montageDispatchShipments,
    sanalTaksimAllocationInstructions: harness.data.sanalTaksimAllocationInstructions,
    montageCompletionTransfers: harness.data.montageCompletionTransfers,
    salesShipmentPlans: harness.data.salesShipmentPlans,
    salesShipments: harness.data.salesShipments
  }), modernBefore);
  assert.equal(harness.saveCount, 1);
});

test('FAZ 1 LEGACY CLEANUP save exception ve ok:false sonucunda tum memory state rollback yapar', async () => {
  for (const saveMode of ['throw', 'failure']) {
    const harness = buildPhase1LegacyCleanupHarness({ saveMode });
    const before = JSON.stringify(harness.data);

    await harness.PlanningModule.cleanupStockDemandForDemo(harness.demand.id);

    assert.equal(JSON.stringify(harness.data), before);
    assert.equal(harness.saveCount, 1);
    assert.equal(harness.renderCount, 0);
    assert.ok(harness.alerts.some((message) => message.includes('bellek geri yüklendi')));
  }
});

test('FAZ 1 LEGACY CLEANUP SALES_ORDER save failure siparis ve legacy zinciri birlikte rollback yapar', async () => {
  const harness = buildPhase1LegacyCleanupHarness({ sourceType: 'SALES_ORDER', saveMode: 'failure' });
  const { exported: SalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', {
    DB: harness.DB,
    PlanningModule: harness.PlanningModule,
    UI: { renderCurrentPage: () => {} },
    Modal: { close: () => {} },
    alert: (message) => { harness.alerts.push(String(message)); },
    confirm: () => true
  });
  SalesModule.ensureData();
  const before = JSON.stringify(harness.data);

  await SalesModule.deleteSalesOrder('order-phase1-cleanup');

  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 1);
  assert.ok(harness.alerts.some((message) => message.includes('bellek geri yüklendi')));
});

function buildPhase2ModernMontageCleanupHarness({ mctStatus = '', foreignFinishedUse = false, saveMode = 'success' } = {}) {
  const harness = buildPhase1LegacyCleanupHarness({ sourceType: 'SALES_ORDER', saveMode });
  const { data, demand } = harness;
  const identity = {
    sourceType: 'SALES_ORDER', sourceOrderId: demand.sourceOrderId, sourceLineId: demand.sourceLineId,
    demandId: demand.id, itemKey: 'item-phase1-cleanup'
  };
  const ids = {
    planId: 'mgp-phase2-cleanup', shipmentId: 'mgs-phase2-cleanup', instructionId: 'stai-phase2-cleanup',
    sourceStockId: 'stock-phase2-source', outMovementId: 'movement-phase2-out',
    receiptStockId: 'stock-phase2-receipt', receiptMovementId: 'movement-phase2-receipt',
    transferId: 'mct-phase2-cleanup', componentMovementId: 'movement-phase2-consumption',
    finishedStockId: 'stock-phase2-finished', finishedMovementId: 'movement-phase2-finished'
  };
  const reservationKey = 'reservation-phase2-cleanup';
  const receiptKey = 'receipt-phase2-cleanup';
  const receiptLineKey = `${receiptKey}|0|prc-phase2|PRC-PHASE2`;

  data.stockDepotLocations.push(
    { id: 'loc-phase2-source', depotId: 'main', locationCode: 'P2-SOURCE' },
    { id: 'loc-phase2-receipt', depotId: 'unit:u3', locationCode: 'P2-RECEIPT' },
    { id: 'loc-phase2-finished', depotId: 'depot_profil', locationCode: 'R01-A1' }
  );
  data.stockDepotItems.push({
    id: ids.sourceStockId, refId: 'prc-phase2', productCode: 'PRC-PHASE2', code: 'PRC-PHASE2',
    depotId: 'main', locationId: 'loc-phase2-source', unit: 'ADET', qty: 8, quantity: 8, amount: 8
  });
  data.montageDispatchPlans.push({
    id: ids.planId, planNo: 'MGP-PHASE2-CLEANUP', status: 'DISPATCHED_TO_MONTAGE',
    items: [{ ...identity, plannedQty: 1 }],
    exactReservations: [{
      ...identity, reservationKey, planId: ids.planId, instructionId: ids.instructionId,
      instructionSliceKey: 'slice-phase2-cleanup', stockRowId: ids.sourceStockId, qty: 5
    }]
  });
  data.sanalTaksimAllocationInstructions.push({
    id: ids.instructionId, status: 'COMPLETED',
    slices: [{
      sliceKey: 'slice-phase2-cleanup', planId: ids.planId, reservationKey,
      stockRowId: ids.sourceStockId, qty: 5
    }]
  });
  data.montageDispatchShipments.push({
    id: ids.shipmentId, shipmentNo: 'MGS-PHASE2-CLEANUP', planId: ids.planId,
    planNo: 'MGP-PHASE2-CLEANUP', status: 'RECEIVED', receiptKey,
    items: [{ ...identity, shippedQty: 1 }],
    parts: [{
      refId: 'prc-phase2', code: 'PRC-PHASE2', unit: 'ADET', shippedQty: 5,
      allocations: [{
        stockRowId: ids.sourceStockId, stockDepotItemId: ids.sourceStockId,
        stockMovementId: ids.outMovementId, sourceDepotId: 'main',
        sourceLocationId: 'loc-phase2-source', qty: 5,
        exactReservationKeys: [reservationKey],
        segmentRanges: [{ reservationKey, planId: ids.planId, stockRowId: ids.sourceStockId, qty: 5 }]
      }]
    }]
  });
  data.stock_movements.push({
    id: ids.outMovementId, movementType: 'MONTAGE_DISPATCH_OUT', shipmentId: ids.shipmentId,
    planId: ids.planId, stockDepotItemId: ids.sourceStockId, sourceDepotId: 'main',
    sourceLocationId: 'loc-phase2-source', refId: 'prc-phase2', code: 'PRC-PHASE2', qty: 5
  });
  const posted = mctStatus === 'POSTED';
  data.stockDepotItems.push({
    id: ids.receiptStockId, sourceShipmentId: ids.shipmentId, shipmentId: ids.shipmentId,
    sourcePlanId: ids.planId, planId: ids.planId, depotId: 'unit:u3', locationId: 'loc-phase2-receipt',
    refId: 'prc-phase2', code: 'PRC-PHASE2', productCode: 'PRC-PHASE2', receiptKey, receiptLineKey,
    stockClass: 'MONTAGE_RECEIVED', qty: posted ? 0 : 5, quantity: posted ? 0 : 5, amount: posted ? 0 : 5
  });
  data.stock_movements.push({
    id: ids.receiptMovementId, movementType: 'MONTAGE_DISPATCH_RECEIPT', shipmentId: ids.shipmentId,
    planId: ids.planId, receiptKey, receiptLineKey, sourceMovementIds: [ids.outMovementId],
    refId: 'prc-phase2', code: 'PRC-PHASE2', qty: 5
  });

  if (mctStatus) {
    const transfer = {
      id: ids.transferId, transferNo: 'MCT-PHASE2-CLEANUP',
      status: posted ? 'POSTED' : 'PENDING_DEPOT_RECEIPT', sourceShipmentId: ids.shipmentId,
      sourcePlanId: ids.planId, ...identity, qty: 1, quantity: 1
    };
    if (posted) {
      Object.assign(transfer, {
        componentMovementIds: [ids.componentMovementId],
        componentAllocations: [{ stockDepotItemId: ids.receiptStockId, stockMovementId: ids.componentMovementId, qty: 5 }],
        finishedProductStockItemId: ids.finishedStockId,
        finishedProductMovementId: ids.finishedMovementId
      });
      data.stockDepotItems.push({
        id: ids.finishedStockId, completionTransferId: ids.transferId, transferId: ids.transferId,
        sourceShipmentId: ids.shipmentId, ...identity, depotId: 'depot_profil',
        locationId: 'loc-phase2-finished', variantCode: 'SVR-PHASE2', qty: 1, quantity: 1, amount: 1
      });
      data.stock_movements.push(
        {
          id: ids.componentMovementId, movementType: 'MONTAGE_COMPONENT_CONSUMPTION',
          completionTransferId: ids.transferId, transferId: ids.transferId,
          sourceShipmentId: ids.shipmentId, stockDepotItemId: ids.receiptStockId, qty: 5
        },
        {
          id: ids.finishedMovementId, movementType: 'MONTAGE_FINISHED_PRODUCT_IN',
          completionTransferId: ids.transferId, transferId: ids.transferId,
          sourceShipmentId: ids.shipmentId, stockDepotItemId: ids.finishedStockId, qty: 1
        }
      );
      const surplusSource = data.stockDepotItems.find((row) => row.id === 'stock-phase1-output');
      Object.assign(surplusSource, { qty: 3, quantity: 3, amount: 3 });
      data.stockDepotItems.push({
        id: 'stock-phase2-surplus-target', depotId: 'main', locationId: 'loc-phase1-out',
        productCode: 'PRC-PHASE1-OUT', code: 'PRC-PHASE1-OUT', qty: 1, quantity: 1, amount: 1
      });
      data.stock_movements.push({
        id: 'movement-phase2-surplus', movementType: 'SALES_COMPONENT_SURPLUS_RELEASE',
        sourceStockDepotItemId: 'stock-phase1-output', targetStockDepotItemId: 'stock-phase2-surplus-target',
        stockDepotItemId: 'stock-phase2-surplus-target', triggerMontageCompletionTransferId: ids.transferId,
        triggerMontageCompletionTransferIds: [ids.transferId], ...identity, qty: 1
      });
    }
    data.montageCompletionTransfers.push(transfer);
  }
  if (foreignFinishedUse === true || foreignFinishedUse === 'SVP') {
    data.salesShipmentPlans.push({
      id: 'svp-foreign-phase2', sourceOrderId: 'foreign-order',
      allocations: [{ stockDepotItemId: ids.finishedStockId }]
    });
  } else if (foreignFinishedUse === 'SHIPMENT') {
    data.salesShipments.push({
      id: 'sales-shipment-foreign-phase2', sourceOrderId: 'foreign-order',
      allocations: [{ stockDepotItemId: ids.finishedStockId }]
    });
  } else if (foreignFinishedUse === 'CONSUMER') {
    data.stock_movements.push({
      id: 'movement-foreign-consumer-phase2', movementType: 'FOREIGN_COMPONENT_USE',
      stockDepotItemId: ids.finishedStockId, qty: 1
    });
  }

  const { exported: SalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', {
    DB: harness.DB, PlanningModule: harness.PlanningModule,
    UI: { renderCurrentPage: () => {} }, Modal: { close: () => {} },
    alert: (message) => { harness.alerts.push(String(message)); }, confirm: () => true
  });
  harness.SalesModule = SalesModule;
  harness.ids = ids;
  return harness;
}

function buildPrototypeDetachDemoHarness() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const data = JSON.parse(JSON.stringify(raw.data || raw));
  const DB = { data: { data }, save: async () => ({ ok: true }) };
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB,
    SanalTaksimResolver: loadSanalTaksimResolver()
  });
  const build = (orderNo) => {
    const order = data.orders.find((row) => row.orderNo === orderNo);
    assert.ok(order, `${orderNo} demo state içinde bulunamadı.`);
    return PlanningModule.buildSalesOrderPrototypeDetachPlan(order.id);
  };
  return { DB, data, PlanningModule, build };
}

function getDetachClassification(plan, collection, id) {
  return Object.values(plan.classifications).flat()
    .find((row) => row.collection === collection && row.id === id)?.classification || '';
}

test('PROTOTYPE DETACH PREFLIGHT SOR-000014 shared MGS MCT ve rebind kanitini korur', () => {
  const harness = buildPrototypeDetachDemoHarness();
  const before = JSON.stringify(harness.data);
  const plan = harness.build('SOR-000014');
  const shipment = harness.data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007');
  const transfer = harness.data.montageCompletionTransfers.find((row) => row.transferNo === 'MCT-000011');

  assert.equal(plan.ok, true, plan.uncertainties.map((row) => row.message).join(' | '));
  assert.equal(getDetachClassification(plan, 'montageDispatchShipments', shipment.id), 'RETAIN_SHARED');
  assert.equal(getDetachClassification(plan, 'montageCompletionTransfers', transfer.id), 'RETAIN_SHARED');
  assert.equal(plan.classifications.DELETE_EXCLUSIVE.some((row) =>
    row.id === shipment.id || row.id === transfer.id), false);
  assert.equal(plan.classifications['HIDE/TOMBSTONE_IDENTITY'].filter((row) =>
    row.collection === 'workOrders').length, plan.target.workOrderIds.length);
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(plan.readOnly, true);
  assert.equal(plan.writes, 0);
});

test('PROTOTYPE DETACH PREFLIGHT SOR-000012 WO ve physical kanitini SOR-000013 exact hold icin silmez', () => {
  const harness = buildPrototypeDetachDemoHarness();
  const plan = harness.build('SOR-000012');
  const targetPlan = harness.data.montageDispatchPlans.find((row) => row.planNo === 'MGP-000021');
  const sourceOrder = harness.data.orders.find((row) => row.orderNo === 'SOR-000012');
  const reboundRanges = (targetPlan?.rebindAudit?.exactReservations || [])
    .filter((row) => row.sourceOrderId === sourceOrder.id);

  assert.ok(reboundRanges.length > 0);
  assert.equal(getDetachClassification(plan, 'montageDispatchPlans', targetPlan.id), 'RETAIN_SHARED');
  plan.target.workOrderIds.forEach((workOrderId) => {
    assert.equal(getDetachClassification(plan, 'workOrders', workOrderId), 'HIDE/TOMBSTONE_IDENTITY');
  });
  reboundRanges.forEach((range) => {
    assert.notEqual(getDetachClassification(plan, 'stockDepotItems', range.stockRowId), 'DELETE_EXCLUSIVE');
    assert.ok(plan.retainedRanges.some((row) => row.rangeKey ===
      `${range.physicalSegmentId}|${Number(range.segmentOffsetStart).toFixed(6)}|${Number(range.segmentOffsetEnd).toFixed(6)}`));
  });
});

test('PROTOTYPE DETACH PREFLIGHT restore movement ve physical range etkilerini tekillestirir', () => {
  const harness = buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED' });
  const reservation = harness.data.montageDispatchPlans[0].exactReservations[0];
  Object.assign(reservation, {
    physicalSegmentId: `STOCK|${harness.ids.sourceStockId}`,
    segmentOffsetStart: 0,
    segmentOffsetEnd: 5
  });
  const shipmentRange = harness.data.montageDispatchShipments[0].parts[0].allocations[0].segmentRanges[0];
  Object.assign(shipmentRange, {
    physicalSegmentId: `STOCK|${harness.ids.sourceStockId}`,
    segmentOffsetStart: 0,
    segmentOffsetEnd: 5
  });

  const plan = harness.PlanningModule.buildSalesOrderPrototypeDetachPlan(harness.demand.sourceOrderId);
  const effectKeys = plan.restoreEffects.map((row) => row.effectKey);
  const movementIds = plan.restoreEffects.flatMap((row) => row.movementIds);
  const rangeKeys = plan.releasedRanges.map((row) => row.rangeKey);

  assert.equal(plan.ok, true, plan.uncertainties.map((row) => row.message).join(' | '));
  assert.equal(new Set(effectKeys).size, effectKeys.length);
  assert.equal(new Set(movementIds).size, movementIds.length);
  assert.equal(new Set(rangeKeys).size, rangeKeys.length);
  assert.equal(rangeKeys.filter((key) => key ===
    `STOCK|${harness.ids.sourceStockId}|0.000000|5.000000`).length, 1);
});

test('PROTOTYPE DETACH PREFLIGHT eksik physical range kanitinda UNCERTAIN fail closed kalir', () => {
  const harness = buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED' });
  const reservation = harness.data.montageDispatchPlans[0].exactReservations[0];
  Object.assign(reservation, {
    physicalSegmentId: `STOCK|${harness.ids.sourceStockId}`,
    segmentOffsetStart: 0
  });
  const before = JSON.stringify(harness.data);

  const plan = harness.PlanningModule.buildSalesOrderPrototypeDetachPlan(harness.demand.sourceOrderId);

  assert.equal(plan.ok, false);
  assert.equal(plan.failClosed, true);
  assert.ok(plan.uncertainties.some((row) => row.reasonCode === 'PHYSICAL_RANGE_INVALID'));
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(plan.writes, 0);
});

test('PROTOTYPE DETACH PREFLIGHT bozuk operational rebind consumer kanitinda UNCERTAIN kalir', () => {
  const harness = buildPrototypeDetachDemoHarness();
  const shipment = harness.data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007');
  assert.ok(shipment?.operationalRebindEvents?.length > 0);
  delete shipment.operationalRebindEvents[0].toTarget.sourceOrderId;
  const before = JSON.stringify(harness.data);

  const plan = harness.build('SOR-000014');

  assert.equal(plan.ok, false);
  assert.equal(plan.failClosed, true);
  assert.ok(plan.uncertainties.some((row) => row.reasonCode === 'OPERATIONAL_REBIND_INVALID'));
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(plan.writes, 0);
});

test('PROTOTYPE DETACH PREFLIGHT exclusive normal siparisi DELETE_EXCLUSIVE sinifinda tutar', () => {
  const harness = buildPhase1LegacyCleanupHarness({ sourceType: 'SALES_ORDER' });
  const before = JSON.stringify(harness.data);

  const plan = harness.PlanningModule.buildSalesOrderPrototypeDetachPlan(harness.demand.sourceOrderId);

  assert.equal(plan.ok, true, plan.uncertainties.map((row) => row.message).join(' | '));
  assert.equal(getDetachClassification(plan, 'orders', harness.demand.sourceOrderId), 'DELETE_EXCLUSIVE');
  assert.equal(getDetachClassification(plan, 'planningDemands', harness.demand.id), 'DELETE_EXCLUSIVE');
  assert.equal(getDetachClassification(plan, 'workOrders', harness.workOrder.id), 'DELETE_EXCLUSIVE');
  assert.equal(plan.classifications.RETAIN_SHARED.length, 0);
  assert.equal(plan.classifications['HIDE/TOMBSTONE_IDENTITY'].length, 0);
  assert.equal(JSON.stringify(harness.data), before);
});

function buildPrototypeResetApplyDemoHarness({ saveMode = 'success', onConfirm = null } = {}) {
  const harness = buildPrototypeDetachDemoHarness();
  const alerts = [];
  const confirms = [];
  let saveCount = 0;
  let renderCount = 0;
  let approval = null;
  let savedState = null;
  harness.DB.cloneState = (value) => JSON.parse(JSON.stringify(value));
  harness.DB.createCriticalDropApproval = (type, beforeState, afterState, meta) => {
    approval = { type, issues: [], meta: { ...meta } };
    return approval;
  };
  harness.DB.save = async () => {
    saveCount += 1;
    if (saveMode === 'throw') throw new Error('prototype reset disk exception');
    if (saveMode === 'failure') return { ok: false, code: 'prototype_reset_save_failure' };
    savedState = JSON.parse(JSON.stringify(harness.DB.data));
    return { ok: true };
  };
  const { exported: SalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', {
    DB: harness.DB,
    PlanningModule: harness.PlanningModule,
    UI: { renderCurrentPage: () => { renderCount += 1; } },
    Modal: { close: () => {} },
    alert: (message) => alerts.push(String(message)),
    confirm: (message) => {
      confirms.push(String(message));
      if (typeof onConfirm === 'function') onConfirm(harness);
      return true;
    }
  });
  return {
    ...harness,
    SalesModule,
    alerts,
    confirms,
    get saveCount() { return saveCount; },
    get renderCount() { return renderCount; },
    get approval() { return approval; },
    get savedState() { return savedState; }
  };
}

test('PROTOTYPE RESET APPLY shared SOR-000014 kimligini gizler ve MGS MCT movement stogu korur', async () => {
  const harness = buildPrototypeResetApplyDemoHarness();
  const order = harness.data.orders.find((row) => row.orderNo === 'SOR-000014');
  const demand = harness.data.planningDemands.find((row) => row.sourceOrderId === order.id);
  const shipment = harness.data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007');
  const transfer = harness.data.montageCompletionTransfers.find((row) => row.transferNo === 'MCT-000011');
  const physicalCollections = [
    'workOrderTransactions', 'stock_movements', 'stockDepotItems',
    'montageDispatchPlans', 'montageDispatchShipments', 'montageCompletionTransfers',
    'sanalTaksimAllocationInstructions', 'salesShipmentPlans', 'salesShipments'
  ];
  const physicalBefore = Object.fromEntries(physicalCollections.map((key) => [key, JSON.stringify(harness.data[key])]));
  const shipmentBefore = JSON.stringify(shipment);
  const transferBefore = JSON.stringify(transfer);
  const beforeState = JSON.parse(JSON.stringify(harness.DB.data));

  await harness.SalesModule.deleteSalesOrder(order.id);

  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.equal(harness.confirms.length, 1);
  assert.equal(String(order?.prototypeResetTombstone?.type), 'PROTOTYPE_TEST_RESET_RETAINED_EVIDENCE');
  assert.equal(demand.status, 'PROTOTYPE_RESET_TOMBSTONE');
  assert.ok(harness.data.workOrders.filter((row) => demand.workOrderIds.includes(row.id))
    .every((row) => row.prototypeResetTombstone?.orderId === order.id));
  assert.equal(harness.SalesModule.getSalesOrderHistoryRows().some((row) => row.id === order.id), false);
  assert.equal(JSON.stringify(shipment), shipmentBefore);
  assert.equal(JSON.stringify(transfer), transferBefore);
  physicalCollections.forEach((key) => assert.equal(JSON.stringify(harness.data[key]), physicalBefore[key], key));
  assert.equal(harness.approval?.meta?.prototypeResetVersion, 4);
  assert.equal(harness.approval?.meta?.prototypeResetMode, 'RETAINED_EVIDENCE_DETACH');
  const reloadDb = { data: JSON.parse(JSON.stringify(harness.savedState)) };
  const { exported: ReloadedSalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', {
    DB: reloadDb,
    PlanningModule: harness.PlanningModule
  });
  assert.equal(ReloadedSalesModule.getSalesOrderHistoryRows().some((row) => row.id === order.id), false);
  const server = require('../serve.js');
  assert.equal(server.isVerifiedSalesOrderPrototypeReset(beforeState, harness.DB.data, harness.approval), true);
});

test('PROTOTYPE RESET APPLY SOR-000012 detach SOR-000013 exact hold ve rebind range kanitini korur', async () => {
  const harness = buildPrototypeResetApplyDemoHarness();
  const sourceOrder = harness.data.orders.find((row) => row.orderNo === 'SOR-000012');
  const foreignOrder = harness.data.orders.find((row) => row.orderNo === 'SOR-000013');
  const targetPlan = harness.data.montageDispatchPlans.find((row) => row.planNo === 'MGP-000021');
  const targetPlanBefore = JSON.stringify(targetPlan);
  const rangeStockIds = new Set((targetPlan?.rebindAudit?.exactReservations || [])
    .filter((row) => row.sourceOrderId === sourceOrder.id)
    .map((row) => row.stockRowId));
  const stockBefore = new Map(harness.data.stockDepotItems
    .filter((row) => rangeStockIds.has(row.id)).map((row) => [row.id, JSON.stringify(row)]));

  await harness.SalesModule.deleteSalesOrder(sourceOrder.id);

  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.equal(JSON.stringify(targetPlan), targetPlanBefore);
  stockBefore.forEach((value, id) => {
    assert.equal(JSON.stringify(harness.data.stockDepotItems.find((row) => row.id === id)), value);
  });
  assert.equal(foreignOrder.prototypeResetTombstone, undefined);
  const resolved = loadSanalTaksimResolver().resolve(harness.data);
  assert.equal(resolved?.diagnostics?.exactHoldLedger?.valid, true);
  assert.equal(resolved?.diagnostics?.invariants?.exactHoldKeysConsumedOnce, true);
});

test('PROTOTYPE RESET APPLY shared physical koleksiyonlarda double restore ve hayalet stok uretmez', async () => {
  const harness = buildPrototypeResetApplyDemoHarness();
  const order = harness.data.orders.find((row) => row.orderNo === 'SOR-000014');
  const stockBefore = JSON.stringify(harness.data.stockDepotItems);
  const movementsBefore = JSON.stringify(harness.data.stock_movements);
  const freeBefore = harness.data.stockDepotItems.filter((row) =>
    String(row?.stockClass || '').toUpperCase().includes('FREE')).length;

  await harness.SalesModule.deleteSalesOrder(order.id);

  assert.equal(JSON.stringify(harness.data.stockDepotItems), stockBefore);
  assert.equal(JSON.stringify(harness.data.stock_movements), movementsBefore);
  assert.equal(harness.data.stockDepotItems.filter((row) =>
    String(row?.stockClass || '').toUpperCase().includes('FREE')).length, freeBefore);
});

test('PROTOTYPE RESET APPLY UNCERTAIN rebind kanitinda onay save ve mutation yapmaz', async () => {
  const harness = buildPrototypeResetApplyDemoHarness();
  const shipment = harness.data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007');
  delete shipment.operationalRebindEvents[0].toTarget.sourceOrderId;
  const order = harness.data.orders.find((row) => row.orderNo === 'SOR-000014');
  const before = JSON.stringify(harness.DB.data);

  await harness.SalesModule.deleteSalesOrder(order.id);

  assert.equal(JSON.stringify(harness.DB.data), before);
  assert.equal(harness.confirms.length, 0);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => message.includes('Sipariş silinemedi')));
});

test('PROTOTYPE RESET APPLY save hatasinda shared tombstonelari ve tum statei geri alir', async () => {
  const harness = buildPrototypeResetApplyDemoHarness({ saveMode: 'failure' });
  const order = harness.data.orders.find((row) => row.orderNo === 'SOR-000014');
  const before = JSON.stringify(harness.DB.data);

  await harness.SalesModule.deleteSalesOrder(order.id);

  assert.equal(harness.saveCount, 1);
  assert.equal(JSON.stringify(harness.DB.data), before);
  assert.ok(harness.alerts.some((message) => message.includes('bellek geri yüklendi')));
});

test('PROTOTYPE RESET APPLY onay sonrasi degisen plani stale kabul eder ve mutation yapmaz', async () => {
  const harness = buildPrototypeResetApplyDemoHarness({
    onConfirm: ({ data }) => {
      const shipment = data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007');
      shipment.status = 'CANCELLED';
    }
  });
  const order = harness.data.orders.find((row) => row.orderNo === 'SOR-000014');

  await harness.SalesModule.deleteSalesOrder(order.id);

  assert.equal(harness.confirms.length, 1);
  assert.equal(harness.saveCount, 0);
  assert.equal(order.prototypeResetTombstone, undefined);
  assert.equal(harness.data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007')
    .status, 'CANCELLED');
  assert.ok(harness.alerts.some((message) => message.includes('onaydan sonra değişti')));
});

test('PROTOTYPE RESET APPLY server v4 fiziksel veya retained kayit degisikligini reddeder', async () => {
  const harness = buildPrototypeResetApplyDemoHarness();
  const order = harness.data.orders.find((row) => row.orderNo === 'SOR-000014');
  const before = JSON.parse(JSON.stringify(harness.DB.data));
  await harness.SalesModule.deleteSalesOrder(order.id);
  const server = require('../serve.js');

  assert.equal(server.isVerifiedSalesOrderPrototypeReset(before, harness.DB.data, harness.approval), true);
  const stockTamper = JSON.parse(JSON.stringify(harness.DB.data));
  stockTamper.data.stockDepotItems[0].qty = Number(stockTamper.data.stockDepotItems[0].qty || 0) + 1;
  assert.equal(server.isVerifiedSalesOrderPrototypeReset(before, stockTamper, harness.approval), false);
  const retainedTamper = JSON.parse(JSON.stringify(harness.DB.data));
  retainedTamper.data.montageDispatchShipments = retainedTamper.data.montageDispatchShipments
    .filter((row) => row.shipmentNo !== 'MGS-000007');
  assert.equal(server.isVerifiedSalesOrderPrototypeReset(before, retainedTamper, harness.approval), false);
});

test('PROTOTYPE RESET APPLY exclusive siparisi mevcut tam cleanup ile tek onayda siler', async () => {
  const harness = buildPhase1LegacyCleanupHarness({ sourceType: 'SALES_ORDER' });
  const orderId = harness.demand.sourceOrderId;

  const { exported: SalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', {
    DB: harness.DB,
    PlanningModule: harness.PlanningModule,
    UI: { renderCurrentPage: () => {} },
    Modal: { close: () => {} },
    alert: (message) => harness.alerts.push(String(message)),
    confirm: (message) => { harness.confirms.push(String(message)); return true; }
  });
  await SalesModule.deleteSalesOrder(orderId);

  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.equal(harness.confirms.length, 1);
  assert.equal(harness.data.orders.some((row) => row.id === orderId), false);
  assert.equal(harness.data.planningDemands.length, 0);
  assert.equal(harness.data.workOrders.length, 0);
  assert.equal(harness.data.workOrderTransactions.length, 0);
});

function buildOrderScopedPhase2CleanupHarness({ partialReservationMetadata = false, crossOrderTransfer = false } = {}) {
  const harness = buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED' });
  const { data, demand, ids } = harness;
  const secondDemand = {
    id: 'demand-phase2-second', demandCode: 'PLN-PHASE2-SECOND', sourceType: 'SALES_ORDER',
    sourceOrderId: demand.sourceOrderId, sourceOrderNo: demand.sourceOrderNo,
    sourceLineId: 'sales-line-phase2-second', status: 'RELEASED', workOrderIds: [],
    items: [{ id: 'item-phase2-second' }], poolAnalysis: { stockAccountingMode: 'VIRTUAL_V1', rows: [] }
  };
  const secondIdentity = {
    sourceType: 'SALES_ORDER', sourceOrderId: demand.sourceOrderId,
    sourceLineId: secondDemand.sourceLineId, demandId: secondDemand.id, itemKey: 'item-phase2-second'
  };
  const secondIds = {
    sourceStockId: 'stock-phase2-source-second', outMovementId: 'movement-phase2-out-second',
    receiptStockId: 'stock-phase2-receipt-second', receiptMovementId: 'movement-phase2-receipt-second',
    transferId: 'mct-phase2-second', componentMovementId: 'movement-phase2-consumption-second',
    finishedStockId: 'stock-phase2-finished-second', finishedMovementId: 'movement-phase2-finished-second'
  };
  const plan = data.montageDispatchPlans[0];
  const shipment = data.montageDispatchShipments[0];
  const firstAllocation = shipment.parts[0].allocations[0];
  delete plan.exactReservations;
  delete firstAllocation.exactReservationKeys;
  delete firstAllocation.segmentRanges;
  data.sanalTaksimAllocationInstructions = [];
  if (partialReservationMetadata) firstAllocation.exactReservationKeys = [];

  data.planningDemands.push(secondDemand);
  data.orders[0].lines.push({ id: secondDemand.sourceLineId });
  plan.items.push({ ...secondIdentity, plannedQty: 1 });
  shipment.items.push({ ...secondIdentity, shippedQty: 1 });
  shipment.parts.push({
    refId: 'prc-phase2-second', code: 'PRC-PHASE2-SECOND', unit: 'ADET', shippedQty: 3,
    allocations: [{
      stockRowId: secondIds.sourceStockId, stockDepotItemId: secondIds.sourceStockId,
      stockMovementId: secondIds.outMovementId, sourceDepotId: 'main',
      sourceLocationId: 'loc-phase2-source', qty: 3
    }]
  });
  const receiptKey = shipment.receiptKey;
  const receiptLineKey = `${receiptKey}|1|prc-phase2-second|PRC-PHASE2-SECOND`;
  data.stockDepotItems.push(
    {
      id: secondIds.sourceStockId, refId: 'prc-phase2-second', productCode: 'PRC-PHASE2-SECOND',
      code: 'PRC-PHASE2-SECOND', depotId: 'main', locationId: 'loc-phase2-source',
      unit: 'ADET', qty: 7, quantity: 7, amount: 7
    },
    {
      id: secondIds.receiptStockId, sourceShipmentId: ids.shipmentId, shipmentId: ids.shipmentId,
      sourcePlanId: ids.planId, planId: ids.planId, depotId: 'unit:u3', locationId: 'loc-phase2-receipt',
      refId: 'prc-phase2-second', code: 'PRC-PHASE2-SECOND', productCode: 'PRC-PHASE2-SECOND',
      receiptKey, receiptLineKey, stockClass: 'MONTAGE_RECEIVED', qty: 0, quantity: 0, amount: 0
    },
    {
      id: secondIds.finishedStockId, completionTransferId: secondIds.transferId, transferId: secondIds.transferId,
      sourceShipmentId: ids.shipmentId, ...secondIdentity, depotId: 'depot_profil',
      locationId: 'loc-phase2-finished', variantCode: 'SVR-PHASE2-SECOND', qty: 1, quantity: 1, amount: 1
    }
  );
  data.stock_movements.push(
    {
      id: secondIds.outMovementId, movementType: 'MONTAGE_DISPATCH_OUT', shipmentId: ids.shipmentId,
      planId: ids.planId, stockDepotItemId: secondIds.sourceStockId, sourceDepotId: 'main',
      sourceLocationId: 'loc-phase2-source', refId: 'prc-phase2-second', code: 'PRC-PHASE2-SECOND', qty: 3
    },
    {
      id: secondIds.receiptMovementId, movementType: 'MONTAGE_DISPATCH_RECEIPT', shipmentId: ids.shipmentId,
      planId: ids.planId, receiptKey, receiptLineKey, sourceMovementIds: [secondIds.outMovementId],
      refId: 'prc-phase2-second', code: 'PRC-PHASE2-SECOND', qty: 3
    },
    {
      id: secondIds.componentMovementId, movementType: 'MONTAGE_COMPONENT_CONSUMPTION',
      completionTransferId: secondIds.transferId, transferId: secondIds.transferId,
      sourceShipmentId: ids.shipmentId, stockDepotItemId: secondIds.receiptStockId, qty: 3
    },
    {
      id: secondIds.finishedMovementId, movementType: 'MONTAGE_FINISHED_PRODUCT_IN',
      completionTransferId: secondIds.transferId, transferId: secondIds.transferId,
      sourceShipmentId: ids.shipmentId, stockDepotItemId: secondIds.finishedStockId, qty: 1
    }
  );
  data.montageCompletionTransfers.push({
    id: secondIds.transferId, transferNo: 'MCT-PHASE2-SECOND', status: 'POSTED',
    sourceShipmentId: ids.shipmentId, sourcePlanId: ids.planId, ...secondIdentity,
    qty: 1, quantity: 1, componentMovementIds: [secondIds.componentMovementId],
    componentAllocations: [{
      stockDepotItemId: secondIds.receiptStockId,
      stockMovementId: secondIds.componentMovementId,
      qty: 3
    }],
    finishedProductStockItemId: secondIds.finishedStockId,
    finishedProductMovementId: secondIds.finishedMovementId
  });
  if (crossOrderTransfer) {
    data.montageCompletionTransfers.find((row) => row.id === secondIds.transferId).sourceOrderId = 'foreign-order';
  }
  harness.secondDemand = secondDemand;
  harness.secondIds = secondIds;
  return harness;
}

test('FAZ 2 ORDER-SCOPED CLEANUP ortak MGP MGS ve iki POSTED MCTyi tek planla bir kez geri alir', async () => {
  const harness = buildOrderScopedPhase2CleanupHarness();
  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.equal(harness.data.planningDemands.length, 0);
  assert.equal(harness.data.montageDispatchPlans.length, 0);
  assert.equal(harness.data.montageDispatchShipments.length, 0);
  assert.equal(harness.data.montageCompletionTransfers.length, 0);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === harness.ids.sourceStockId)?.qty, 13);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === harness.secondIds.sourceStockId)?.qty, 10);
  assert.equal(harness.data.stockDepotItems.some((row) => [
    harness.ids.receiptStockId, harness.ids.finishedStockId,
    harness.secondIds.receiptStockId, harness.secondIds.finishedStockId
  ].includes(row.id)), false);
  assert.equal(harness.data.stock_movements.some((row) => row.movementType?.startsWith('MONTAGE_')), false);
});

test('FAZ 2 ORDER-SCOPED CLEANUP kismi reservation metadata mutation baslamadan bloklanir', async () => {
  const harness = buildOrderScopedPhase2CleanupHarness({ partialReservationMetadata: true });
  harness.SalesModule.ensureData();
  const before = JSON.stringify(harness.data);
  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => /reservation metadata|exactReservations lineage/.test(message)));
});

test('FAZ 2 ORDER-SCOPED CLEANUP cross-order MCT lineage celiskisini fail-closed tutar', async () => {
  const harness = buildOrderScopedPhase2CleanupHarness({ crossOrderTransfer: true });
  harness.SalesModule.ensureData();
  const before = JSON.stringify(harness.data);
  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => message.includes('MCT exact kimliği/lineage')));
});

test('FAZ 2 MODERN MONTAJ CLEANUP MGS RECEIVED MCT yokken receipt kalkar ve exact kaynak stok geri gelir', async () => {
  const harness = buildPhase2ModernMontageCleanupHarness();
  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(harness.data.stockDepotItems.find((row) => row.id === harness.ids.sourceStockId)?.qty, 13);
  assert.equal(harness.data.stockDepotItems.some((row) => row.id === harness.ids.receiptStockId), false);
  assert.equal(harness.data.stock_movements.some((row) => [harness.ids.outMovementId, harness.ids.receiptMovementId].includes(row.id)), false);
  assert.equal(harness.data.montageDispatchPlans.length, 0);
  assert.equal(harness.data.montageDispatchShipments.length, 0);
  assert.equal(harness.data.sanalTaksimAllocationInstructions.length, 0);
  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
});

test('FAZ 2 MODERN MONTAJ CLEANUP MCT PENDING fiziksel POSTED etkisi olmadan kaldırılır', async () => {
  const harness = buildPhase2ModernMontageCleanupHarness({ mctStatus: 'PENDING' });
  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(harness.data.montageCompletionTransfers.length, 0);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === harness.ids.sourceStockId)?.qty, 13);
  assert.equal(harness.data.stock_movements.length, 0);
  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
});

test('FAZ 2 MODERN MONTAJ CLEANUP MCT POSTED downstream etkileri exact geri alır ve double-count bırakmaz', async () => {
  const harness = buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED' });
  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(harness.data.stockDepotItems.some((row) => row.id === harness.ids.finishedStockId), false, harness.alerts.join(' | '));
  assert.equal(harness.data.stockDepotItems.some((row) => row.id === harness.ids.receiptStockId), false);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === harness.ids.sourceStockId)?.qty, 13);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'stock-phase2-surplus-target')?.qty || 0, 0);
  assert.equal(harness.data.montageCompletionTransfers.length, 0);
  assert.equal(harness.data.montageDispatchShipments.length, 0);
  assert.equal(harness.data.montageDispatchPlans.length, 0);
  assert.equal(harness.data.sanalTaksimAllocationInstructions.length, 0);
  assert.equal(harness.data.stock_movements.length, 0);
  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
});

test('FAZ 2 MODERN MONTAJ CLEANUP MGP DRAFT ve MGS IN_TRANSIT fiziksel etki uydurmadan temizlenir', async () => {
  for (const stage of ['DRAFT', 'IN_TRANSIT']) {
    const harness = buildPhase2ModernMontageCleanupHarness();
    const plan = harness.data.montageDispatchPlans[0];
    const shipment = harness.data.montageDispatchShipments[0];
    const source = harness.data.stockDepotItems.find((row) => row.id === harness.ids.sourceStockId);
    Object.assign(source, { qty: 13, quantity: 13, amount: 13 });
    harness.data.stockDepotItems = harness.data.stockDepotItems.filter((row) => row.id !== harness.ids.receiptStockId);
    harness.data.stock_movements = harness.data.stock_movements.filter((row) =>
      ![harness.ids.outMovementId, harness.ids.receiptMovementId].includes(row.id));
    if (stage === 'DRAFT') {
      plan.status = 'DRAFT';
      harness.data.montageDispatchShipments = [];
      delete plan.exactReservations[0].instructionId;
      delete plan.exactReservations[0].instructionSliceKey;
      harness.data.sanalTaksimAllocationInstructions = [];
    } else {
      shipment.status = 'IN_TRANSIT';
      delete shipment.receiptKey;
      delete shipment.parts[0].allocations[0].stockMovementId;
    }

    await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);
    assert.equal(harness.data.stockDepotItems.find((row) => row.id === harness.ids.sourceStockId)?.qty, 13, stage);
    assert.equal(harness.data.montageDispatchPlans.length, 0, stage);
    assert.equal(harness.data.montageDispatchShipments.length, 0, stage);
    assert.equal(harness.saveCount, 1, `${stage}: ${harness.alerts.join(' | ')}`);
  }
});

test('FAZ 2 MODERN MONTAJ CLEANUP finished stok yabancı SVP shipment veya consumer kullanımında mutation başlamadan bloklanır', async () => {
  for (const foreignFinishedUse of ['SVP', 'SHIPMENT', 'CONSUMER']) {
    const harness = buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED', foreignFinishedUse });
    harness.SalesModule.ensureData();
    const before = JSON.stringify(harness.data);
    await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

    assert.equal(JSON.stringify(harness.data), before, foreignFinishedUse);
    assert.equal(harness.saveCount, 0, foreignFinishedUse);
    assert.equal(harness.confirms.length, 0, foreignFinishedUse);
    assert.ok(harness.alerts.some((message) => /SVP Faz 3|Gerçek shipment Faz 3|yabancı movement referansı/.test(message)), foreignFinishedUse);
  }
});

test('FAZ 2 MODERN MONTAJ CLEANUP save hatasında modern ve legacy zinciri atomik geri yükler', async () => {
  const harness = buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED', saveMode: 'failure' });
  harness.SalesModule.ensureData();
  const before = JSON.stringify(harness.data);
  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 1);
  assert.ok(harness.alerts.some((message) => message.includes('bellek geri yüklendi')));
});

function installPhase3ShipmentCleanupFixture(harness, { status = 'PLANNED', foreignConsumer = false } = {}) {
  const { data, demand } = harness;
  const dispatched = status === 'DISPATCHED';
  const stockItemId = dispatched ? harness.ids.finishedStockId : 'stock-phase3-planned';
  const planId = 'svp-phase3-cleanup';
  const shipmentId = 'sales-shipment-phase3-cleanup';
  const movementId = 'movement-phase3-sales-out';
  const productId = 'product-phase3';
  const variantId = 'variant-phase3';
  const salCode = 'SAL-PHASE3';
  const svrCode = 'SVR-PHASE3';
  const depotId = 'depot_profil';
  const locationId = 'loc-phase2-finished';
  Object.assign(data.orders[0].lines[0], {
    productId, variationId: variantId, variantCode: svrCode,
    idCode: salCode, productCode: salCode, qty: 1, quantity: 1, amount: 1
  });
  if (!dispatched) {
    data.stockDepotItems.push({
      id: stockItemId, sourceType: 'SALES_ORDER', sourceOrderId: demand.sourceOrderId,
      sourceLineId: demand.sourceLineId, productId, variantId, variantCode: svrCode,
      productCode: svrCode, code: svrCode, depotId, locationId, unit: 'ADET',
      stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', qty: 4, quantity: 4, amount: 4
    });
  } else {
    const finished = data.stockDepotItems.find((row) => row.id === stockItemId);
    Object.assign(finished, {
      productId, variantId, variationId: variantId, variantCode: svrCode,
      productCode: svrCode, code: svrCode, unit: 'ADET', stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR', qty: 0, quantity: 0, amount: 0
    });
    const transfer = data.montageCompletionTransfers.find((row) => row.id === harness.ids.transferId);
    Object.assign(transfer, { productId, variantId, variationId: variantId, variantCode: svrCode });
    const input = data.stock_movements.find((row) => row.id === harness.ids.finishedMovementId);
    Object.assign(input, {
      sourceType: 'SALES_ORDER', sourceOrderId: demand.sourceOrderId,
      sourceLineId: demand.sourceLineId, productId, variantId, variantCode: svrCode, unit: 'ADET',
      targetDepotId: depotId, targetLocationId: locationId
    });
  }
  const allocation = {
    stockItemId, allocatedQty: 1, depotId, locationId,
    sourceOrderId: demand.sourceOrderId, sourceLineId: demand.sourceLineId
  };
  const item = {
    sourceLineId: demand.sourceLineId,
    lineKey: `SALES_ORDER|${demand.sourceOrderId}|${demand.sourceLineId}`,
    productId, productCode: salCode, salCode, variantId, variantCode: svrCode,
    svrCode, productName: 'Phase 3 Urun', orderQty: 1, plannedQty: 1,
    unit: 'ADET', stockAllocations: [allocation]
  };
  const plan = {
    id: planId, planNo: 'SVP-000003', status,
    sourceOrderId: demand.sourceOrderId, sourceOrderNo: demand.sourceOrderNo,
    idempotencyKey: 'svp-phase3-idempotency', createdAt: '2026-08-25T09:00:00.000Z',
    updatedAt: '2026-08-25T09:00:00.000Z',
    items: [item]
  };
  if (dispatched) {
    Object.assign(plan, {
      shipmentId, shipmentNo: 'TF-000003', dispatchedAt: '2026-08-25T10:00:00.000Z',
      updatedAt: '2026-08-25T10:00:00.000Z'
    });
    const snapshotAllocation = { ...allocation, stockMovementId: movementId };
    const snapshotItem = {
      ...item, dispatchQty: 1, packageCount: 1, weightKg: 2,
      stockAllocations: [snapshotAllocation]
    };
    data.stock_movements.push({
      id: movementId, movementType: 'SALES_SHIPMENT_OUT', type: 'SALES_SHIPMENT_OUT',
      shipmentId, shipmentNo: plan.shipmentNo, shipmentPlanId: planId, shipmentPlanNo: plan.planNo,
      sourceType: 'SALES_ORDER', sourceOrderId: demand.sourceOrderId, sourceOrderNo: demand.sourceOrderNo,
      sourceLineId: demand.sourceLineId, stockItemId, stockDepotItemId: stockItemId,
      depotId, sourceDepotId: depotId, locationId, sourceLocationId: locationId,
      productId, productCode: salCode, salCode, variantId, variantCode: svrCode, svrCode,
      qty: 1, quantity: 1, unit: 'ADET'
    });
    data.salesShipments.push({
      id: shipmentId, shipmentNo: plan.shipmentNo, shipmentPlanId: planId,
      shipmentPlanNo: plan.planNo, sourceOrderId: demand.sourceOrderId,
      sourceOrderNo: demand.sourceOrderNo, status: 'DISPATCHED',
      dispatchedAt: plan.dispatchedAt, createdAt: plan.dispatchedAt,
      idempotencyKey: `SALES_SHIPMENT_DISPATCH|${planId}`,
      snapshot: {
        shipmentNo: plan.shipmentNo, shipmentPlanNo: plan.planNo,
        sourceOrderId: demand.sourceOrderId, sourceOrderNo: demand.sourceOrderNo,
        dispatchedAt: plan.dispatchedAt, customerName: 'Phase 3 Musteri',
        deliveryAddress: 'Phase 3 Adres', totalDispatchedQty: 1,
        totalPackageCount: 1, totalWeightKg: 2,
        items: [snapshotItem]
      }
    });
  }
  data.salesShipmentPlans.push(plan);
  if (foreignConsumer) {
    data.salesShipmentPlans.push({
      id: 'svp-phase3-foreign', sourceOrderId: 'order-foreign',
      items: [{ stockAllocations: [{ stockItemId }] }]
    });
  }
  harness.phase3 = { stockItemId, planId, shipmentId, movementId };
  return harness;
}

function buildLegacyStoreCompatibilityHarness({ foreignConsumer = false } = {}) {
  const harness = buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED' });
  const { data, demand, ids } = harness;
  const plan = data.montageDispatchPlans[0];
  const shipment = data.montageDispatchShipments[0];
  const transfer = data.montageCompletionTransfers[0];
  const firstWorkOrder = data.workOrders[0];
  const firstLine = firstWorkOrder.lines[0];
  const firstStoreTxn = data.workOrderTransactions.find((row) => row.type === 'STORE');
  Object.assign(firstLine, { componentCode: 'PRC-PHASE2', unit: 'ADET' });
  firstStoreTxn.qty = 5;
  const firstSource = data.stockDepotItems.find((row) => row.id === ids.sourceStockId);
  Object.assign(firstSource, { qty: 0, quantity: 0, amount: 0 });
  delete plan.exactReservations;
  delete shipment.parts[0].allocations[0].exactReservationKeys;
  delete shipment.parts[0].allocations[0].segmentRanges;
  data.sanalTaksimAllocationInstructions = [];
  data.stock_movements = data.stock_movements.filter((row) =>
    !['movement-phase1-store', 'movement-phase2-surplus'].includes(row.id));
  data.stockDepotItems = data.stockDepotItems.filter((row) =>
    !['stock-phase1-output', 'stock-phase2-surplus-target'].includes(row.id));

  const sourceStockIds = [ids.sourceStockId];
  for (let index = 2; index <= 7; index += 1) {
    const suffix = String(index).padStart(2, '0');
    const code = `PRC-STORE-${suffix}`;
    const storeQty = index === 7 ? 10 : 5;
    const workOrderId = `wo-store-${suffix}`;
    const lineId = `wo-store-line-${suffix}`;
    const sourceStockId = `stock-store-source-${suffix}`;
    const outMovementId = `movement-store-out-${suffix}`;
    const receiptStockId = `stock-store-receipt-${suffix}`;
    const receiptMovementId = `movement-store-receipt-${suffix}`;
    const componentMovementId = `movement-store-consumption-${suffix}`;
    const receiptLineKey = `${shipment.receiptKey}|${index - 1}|ref-store-${suffix}|${code}`;
    demand.workOrderIds.push(workOrderId);
    data.workOrders.push({
      id: workOrderId, workOrderCode: `WO-STORE-${suffix}`, sourceId: demand.id,
      sourceCode: demand.demandCode, sourceItemKey: demand.items[0].id,
      lines: [{ id: lineId, componentCode: code, unit: 'ADET' }]
    });
    data.workOrderTransactions.push({
      id: `txn-store-${suffix}`, workOrderId, lineId, type: 'STORE', qty: storeQty
    });
    data.stockDepotItems.push(
      {
        id: sourceStockId, refId: `ref-store-${suffix}`, productCode: code, code,
        depotId: 'main', locationId: 'loc-phase2-source', unit: 'ADET', qty: 0, quantity: 0, amount: 0
      },
      {
        id: receiptStockId, sourceShipmentId: ids.shipmentId, shipmentId: ids.shipmentId,
        sourcePlanId: ids.planId, planId: ids.planId, depotId: 'unit:u3', locationId: 'loc-phase2-receipt',
        refId: `ref-store-${suffix}`, code, productCode: code, receiptKey: shipment.receiptKey,
        receiptLineKey, stockClass: 'MONTAGE_RECEIVED', qty: 0, quantity: 0, amount: 0
      }
    );
    shipment.parts.push({
      refId: `ref-store-${suffix}`, code, unit: 'ADET', shippedQty: storeQty,
      allocations: [{
        stockRowId: sourceStockId, stockDepotItemId: sourceStockId,
        stockMovementId: outMovementId, sourceDepotId: 'main',
        sourceLocationId: 'loc-phase2-source', qty: storeQty
      }]
    });
    data.stock_movements.push(
      {
        id: outMovementId, movementType: 'MONTAGE_DISPATCH_OUT', shipmentId: ids.shipmentId,
        planId: ids.planId, stockDepotItemId: sourceStockId, sourceDepotId: 'main',
        sourceLocationId: 'loc-phase2-source', refId: `ref-store-${suffix}`, code, qty: storeQty
      },
      {
        id: receiptMovementId, movementType: 'MONTAGE_DISPATCH_RECEIPT', shipmentId: ids.shipmentId,
        planId: ids.planId, receiptKey: shipment.receiptKey, receiptLineKey,
        sourceMovementIds: [outMovementId], refId: `ref-store-${suffix}`, code, qty: storeQty
      },
      {
        id: componentMovementId, movementType: 'MONTAGE_COMPONENT_CONSUMPTION',
        completionTransferId: ids.transferId, transferId: ids.transferId,
        sourceShipmentId: ids.shipmentId, stockDepotItemId: receiptStockId, qty: storeQty
      }
    );
    transfer.componentMovementIds.push(componentMovementId);
    transfer.componentAllocations.push({
      stockDepotItemId: receiptStockId, stockMovementId: componentMovementId, qty: storeQty
    });
    sourceStockIds.push(sourceStockId);
  }
  installPhase3ShipmentCleanupFixture(harness, { status: 'DISPATCHED' });
  if (foreignConsumer) {
    data.stock_movements.push({
      id: 'movement-foreign-store-consumer', movementType: 'FOREIGN_STOCK_USE',
      stockDepotItemId: ids.sourceStockId, qty: 1
    });
  }
  harness.legacyStoreSourceStockIds = sourceStockIds;
  return harness;
}

test('FAZ 2 LEGACY STORE COMPATIBILITY 40/0 exact yedi WO ve sourceReturns kanitiyla tam cleanup yapar', async () => {
  const harness = buildLegacyStoreCompatibilityHarness();
  const storeTxns = harness.data.workOrderTransactions.filter((row) => row.type === 'STORE');
  const storeMovements = harness.data.stock_movements.filter((row) => row.movementType === 'STORE');
  assert.equal(storeTxns.reduce((sum, row) => sum + row.qty, 0), 40);
  assert.equal(storeMovements.length, 0);
  assert.equal(harness.data.workOrders.length, 7);

  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.equal(harness.data.orders.length, 0);
  assert.equal(harness.data.planningDemands.length, 0);
  assert.equal(harness.data.workOrders.length, 0);
  assert.equal(harness.data.workOrderTransactions.length, 0);
  assert.equal(harness.data.salesShipmentPlans.length, 0);
  assert.equal(harness.data.salesShipments.length, 0);
  assert.equal(harness.data.montageDispatchPlans.length, 0);
  assert.equal(harness.data.montageDispatchShipments.length, 0);
  assert.equal(harness.data.montageCompletionTransfers.length, 0);
  assert.equal(harness.data.stockDepotItems.some((row) =>
    harness.legacyStoreSourceStockIds.includes(row.id)), false);
});

test('FAZ 2 LEGACY STORE COMPATIBILITY foreign canonical zero stok satirini global olarak silmez', async () => {
  const harness = buildLegacyStoreCompatibilityHarness();
  const targetPlan = harness.data.salesShipmentPlans[0];
  const targetItem = targetPlan.items[0];
  const targetAllocation = targetItem.stockAllocations[0];
  const foreignOrderId = 'order-foreign-zero-stock';
  const foreignOrderNo = 'SOR-FOREIGN-ZERO';
  const foreignLineId = 'line-foreign-zero-stock';
  const foreignStockId = 'stock-foreign-canonical-zero';
  const foreignTransferId = 'mct-foreign-canonical-zero';
  const foreignMovementId = 'movement-foreign-finished-in';
  const foreignPlanId = 'svp-foreign-canonical-zero';

  harness.data.orders.push({
    id: foreignOrderId,
    orderNo: foreignOrderNo,
    lines: [{
      id: foreignLineId,
      productId: targetItem.productId,
      variationId: targetItem.variantId,
      variantCode: targetItem.variantCode,
      idCode: targetItem.salCode,
      productCode: targetItem.salCode,
      qty: targetItem.orderQty,
      quantity: targetItem.orderQty,
      amount: targetItem.orderQty
    }]
  });

  harness.data.stockDepotItems.push({
    id: foreignStockId,
    sourceType: 'SALES_ORDER',
    sourceOrderId: foreignOrderId,
    sourceLineId: foreignLineId,
    productId: targetItem.productId,
    variantId: targetItem.variantId,
    variationId: targetItem.variantId,
    variantCode: targetItem.variantCode,
    productCode: targetItem.variantCode,
    code: targetItem.variantCode,
    depotId: targetAllocation.depotId,
    locationId: targetAllocation.locationId,
    unit: 'ADET',
    stockClass: 'KULLANILABILIR',
    status: 'KULLANILABILIR',
    qty: 0,
    quantity: 0,
    amount: 0
  });
  harness.data.montageCompletionTransfers.push({
    id: foreignTransferId,
    status: 'POSTED',
    sourceOrderId: foreignOrderId,
    sourceLineId: foreignLineId,
    productId: targetItem.productId,
    variantId: targetItem.variantId,
    variationId: targetItem.variantId,
    variantCode: targetItem.variantCode,
    finishedProductStockItemId: foreignStockId,
    finishedProductMovementId: foreignMovementId
  });
  harness.data.stock_movements.push({
    id: foreignMovementId,
    movementType: 'MONTAGE_FINISHED_PRODUCT_IN',
    sourceType: 'SALES_ORDER',
    sourceOrderId: foreignOrderId,
    sourceLineId: foreignLineId,
    productId: targetItem.productId,
    variantId: targetItem.variantId,
    variantCode: targetItem.variantCode,
    stockDepotItemId: foreignStockId,
    targetDepotId: targetAllocation.depotId,
    targetLocationId: targetAllocation.locationId,
    qty: 1,
    unit: 'ADET'
  });
  harness.data.salesShipmentPlans.push({
    ...JSON.parse(JSON.stringify(targetPlan)),
    id: foreignPlanId,
    planNo: 'SVP-999999',
    sourceOrderId: foreignOrderId,
    sourceOrderNo: foreignOrderNo,
    idempotencyKey: 'svp-foreign-canonical-zero-idempotency',
    shipmentId: 'shipment-foreign-canonical-zero',
    shipmentNo: 'TF-999999',
    items: [{
      ...JSON.parse(JSON.stringify(targetItem)),
      sourceLineId: foreignLineId,
      lineKey: `SALES_ORDER|${foreignOrderId}|${foreignLineId}`,
      stockAllocations: [{
        ...JSON.parse(JSON.stringify(targetAllocation)),
        stockItemId: foreignStockId,
        sourceOrderId: foreignOrderId,
        sourceLineId: foreignLineId
      }]
    }]
  });

  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.equal(harness.data.stockDepotItems.some((row) => row.id === foreignStockId), true);
  assert.equal(harness.data.salesShipmentPlans.some((row) => row.id === foreignPlanId), true);
  assert.equal(harness.data.stockDepotItems.some((row) =>
    harness.legacyStoreSourceStockIds.includes(row.id)), false);
  const server = require('../serve.js');
  assert.deepEqual(server.validateSalesShipmentPlans({ data: harness.data }), []);
});

test('FAZ 2 LEGACY STORE COMPATIBILITY yabanci stock consumer varsa mutation baslamadan bloklanir', async () => {
  const harness = buildLegacyStoreCompatibilityHarness({ foreignConsumer: true });
  harness.SalesModule.ensureData();
  const before = JSON.stringify(harness.data);
  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => message.includes('yabancı hareket/consumer')));
});

test('FAZ 2 LEGACY STORE COMPATIBILITY ambiguous exact target stock rowda fail-closed kalir', async () => {
  const harness = buildPhase1LegacyCleanupHarness({ sourceType: 'SALES_ORDER' });
  harness.data.stock_movements = harness.data.stock_movements.filter((row) => row.movementType !== 'STORE');
  const target = harness.data.stockDepotItems.find((row) => row.id === 'stock-phase1-output');
  harness.data.stockDepotItems.push({ ...target, id: 'stock-phase1-output-duplicate' });
  const before = JSON.stringify(harness.data);
  const result = harness.PlanningModule.cleanupSalesOrderCascadeForDemo(harness.demand.sourceOrderId);

  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => /birden fazla aday|exact stok satırı doğrulanamadı/.test(message)));
});

test('FAZ 3 SHIPMENT CLEANUP SVP PLANNED kaydini kaldirir ve fiziksel stogu degistirmez', async () => {
  const harness = installPhase3ShipmentCleanupFixture(buildPhase1LegacyCleanupHarness({
    sourceType: 'SALES_ORDER'
  }));
  const beforeQty = harness.data.stockDepotItems.find((row) => row.id === harness.phase3.stockItemId).qty;
  const { exported: SalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', {
    DB: harness.DB, PlanningModule: harness.PlanningModule,
    UI: { renderCurrentPage: () => {} }, Modal: { close: () => {} },
    alert: (message) => { harness.alerts.push(String(message)); }, confirm: () => true
  });

  await SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(harness.data.salesShipmentPlans.length, 0, harness.alerts.join(' | '));
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === harness.phase3.stockItemId)?.qty, beforeQty);
  assert.equal(harness.data.orders.length, 0);
  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
});

test('FAZ 3 SHIPMENT CLEANUP DISPATCHED OUT hareketini geri alir ve Faz 2 Faz 1 zincirini tamamlar', async () => {
  const harness = installPhase3ShipmentCleanupFixture(
    buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED' }),
    { status: 'DISPATCHED' }
  );

  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(harness.data.salesShipmentPlans.length, 0, harness.alerts.join(' | '));
  assert.equal(harness.data.salesShipments.length, 0);
  assert.equal(harness.data.stock_movements.some((row) => row.id === harness.phase3.movementId), false);
  assert.equal(harness.data.stockDepotItems.some((row) => row.id === harness.phase3.stockItemId), false);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === harness.ids.sourceStockId)?.qty, 13);
  assert.equal(harness.data.montageCompletionTransfers.length, 0);
  assert.equal(harness.data.montageDispatchShipments.length, 0);
  assert.equal(harness.data.montageDispatchPlans.length, 0);
  assert.equal(harness.data.planningDemands.length, 0);
  assert.equal(harness.data.orders.length, 0);
  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
});

test('FAZ 3 SHIPMENT CLEANUP yabanci stok consumer varsa mutation baslamadan fail-closed kalir', async () => {
  const harness = installPhase3ShipmentCleanupFixture(
    buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED' }),
    { status: 'DISPATCHED', foreignConsumer: true }
  );
  harness.SalesModule.ensureData();
  const before = JSON.stringify(harness.data);

  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);

  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
  assert.equal(harness.confirms.length, 0);
  assert.ok(harness.alerts.some((message) => message.includes('yabanci SVP reservation')
    || message.includes('yabancı SVP reservation')));
});

test('FAZ 3 SHIPMENT CLEANUP disinda normal shipment immutability degismeden bloklar', () => {
  const { validateSalesShipmentImmutability } = require('../serve.js');
  const currentState = { data: { salesShipments: [{
    id: 'shipment-immutable', shipmentNo: 'TF-IMMUTABLE', status: 'DISPATCHED', snapshot: { items: [] }
  }] } };
  const incomingState = { data: { salesShipments: [] } };

  const issues = validateSalesShipmentImmutability(currentState, incomingState);

  assert.ok(issues.some((message) => message.includes('silinemez')));
});

test('FAZ 3 SHIPMENT CLEANUP sunucu yalniz exact prototype reset kanitini kabul eder', async () => {
  const harness = installPhase3ShipmentCleanupFixture(
    buildPhase2ModernMontageCleanupHarness({ mctStatus: 'POSTED' }),
    { status: 'DISPATCHED' }
  );
  const before = JSON.parse(JSON.stringify(harness.DB.data));
  await harness.SalesModule.deleteSalesOrder(harness.demand.sourceOrderId);
  const after = JSON.parse(JSON.stringify(harness.DB.data));
  const {
    validateSalesShipmentPlans,
    validateSalesShipments,
    isVerifiedSalesOrderPrototypeReset
  } = require('../serve.js');
  const approval = {
    type: 'sales_order_demo_cleanup',
    meta: {
      prototypeResetVersion: 3,
      orderId: harness.demand.sourceOrderId,
      orderNo: harness.demand.sourceOrderNo
    }
  };

  assert.deepEqual(validateSalesShipmentPlans(before), []);
  assert.deepEqual(validateSalesShipments(before), []);
  assert.equal(isVerifiedSalesOrderPrototypeReset(before, after, approval), true);
  assert.equal(isVerifiedSalesOrderPrototypeReset(before, after, {
    ...approval, meta: { ...approval.meta, prototypeResetVersion: 2 }
  }), false);
  const beforeWithForeignConsumer = JSON.parse(JSON.stringify(before));
  const afterWithForeignConsumer = JSON.parse(JSON.stringify(after));
  const foreignMovement = {
    id: 'movement-phase3-server-foreign', movementType: 'FOREIGN_USE',
    stockDepotItemId: harness.phase3.stockItemId, qty: 1
  };
  beforeWithForeignConsumer.data.stock_movements.push(foreignMovement);
  afterWithForeignConsumer.data.stock_movements.push(JSON.parse(JSON.stringify(foreignMovement)));
  assert.equal(isVerifiedSalesOrderPrototypeReset(
    beforeWithForeignConsumer, afterWithForeignConsumer, approval
  ), false);
});

function buildMontagePlanHarness({
  failSave = false,
  saveReturnsFailure = false,
  saveResult = null,
  plans = [],
  confirmResult = true,
  deferSave = false,
  montageLineCompletionState = null,
  useRealMontagePreflight = false,
  dataOverride = null
} = {}) {
  const alerts = [];
  const confirmMessages = [];
  let renderCount = 0;
  let saveCount = 0;
  let modalHtml = '';
  let modalTitle = '';
  let modalOptions = {};
  let printedModel = null;
  let openedPlanProductArgs = [];
  let openedPlanPartArgs = [];
  let openedHistoryShipmentId = '';
  let montageLineCompletionCallCount = 0;
  let idCounter = 0;
  let releaseDeferredSave = null;
  const saveOptions = [];
  const modalStack = [];
  const data = dataOverride && typeof dataOverride === 'object' ? dataOverride : {
    montageDispatchPlans: plans,
    montageDispatchShipments: [],
    sanalTaksimAllocationInstructions: [],
    montageCompletionTransfers: [],
    salesShipmentPlans: [],
    salesShipments: [],
    montageJobDispatches: [],
    montageCards: [{ id: 'montage-card-1', cardCode: 'MON-000001', productCode: 'SAL-000001', productName: 'Montaj Urunu' }],
    orders: [{
      id: 'sor-id-1',
      orderNo: 'SOR-000001',
      lines: [{
        id: 'sor-line-1', productId: 'product-1', variationId: 'variant-1', variantCode: 'SVR-000001', qty: 10
      }]
    }],
    planningDemands: [{
      id: 'pln-id-1', sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-1', sourceLineId: 'sor-line-1',
      items: [{ id: 'pln-item-1', itemType: 'MODEL', variantCode: 'SVR-000001', qty: 10 }]
    }],
    stock_movements: [],
    stockDepotLocations: [],
    partComponentCards: [{ id: 'part-ref-a', code: 'PRC-A', consumptionUnit: 'MM' }],
    stockDepotItems: [
      {
        id: 'stock-prc-a',
        refId: 'part-ref-a',
        productCode: 'PRC-A',
        code: 'PRC-A',
        quantity: 100,
        qty: 100,
        stockClass: 'KULLANILABILIR',
        status: 'KULLANILABILIR',
        allocationType: 'FREE',
        depotId: 'main',
        nodeKey: 'managed:main',
        locationId: 'loc-main-a',
        unit: 'ADET',
        created_at: '2026-01-01T00:00:00.000Z'
      }
    ]
  };
  const Modal = {
    open: (title, html, options = {}) => {
      if (options.closeExisting !== false) modalStack.length = 0;
      modalTitle = String(title || '');
      modalHtml = String(html || '');
      modalOptions = { ...options };
      modalStack.push({ title: modalTitle, html: modalHtml });
    },
    close: () => { modalStack.pop(); }
  };
  const UnitModule = {
    buildMontageIncomingShipmentPrintModel: (shipment) => ({
      mode: 'SHIPMENT',
      title: 'Montaj Sevk / Teslim Kontrol Listesi',
      referenceNo: String(shipment?.shipmentNo || '-'),
      metadata: [
        { label: 'Sevk No', value: shipment?.shipmentNo || '-' },
        { label: 'Kaynak Plan No', value: shipment?.planNo || '-' }
      ],
      items: (Array.isArray(shipment?.items) ? shipment.items : []).map((item) => ({
        productName: item?.productName || '-', variantCode: item?.variantCode || '-', shippedQty: item?.shippedQty || 0
      })),
      parts: (Array.isArray(shipment?.parts) ? shipment.parts : []).map((part) => ({
        name: part?.name || '-', code: part?.code || '-', qty: part?.shippedQty || 0, unit: part?.unit || '-'
      }))
    }),
    printMontageReadOnlyChecklist: (model) => { printedModel = model; },
    openMontageIncomingShipmentProductCard: (...args) => {
      openedPlanProductArgs = args;
      Modal.open(`Ürün Kartı - ${args[2]}`, '<div>Salt okunur ürün kartı</div>', { closeExisting: false });
    },
    openMontageIncomingShipmentPartCard: (...args) => {
      openedPlanPartArgs = args;
      Modal.open(`ID Detay - ${args[2]}`, '<div>Salt okunur parça kartı</div>', { closeExisting: false });
    },
    openMontageIncomingShipmentParts: (shipmentId) => { openedHistoryShipmentId = String(shipmentId || ''); },
    getMontageJobLineCompletionState: (...args) => {
      montageLineCompletionCallCount += 1;
      if (typeof montageLineCompletionState === 'function') return montageLineCompletionState(...args);
      return montageLineCompletionState || {
        ok: true,
        completed: false,
        code: 'MONTAGE_COMPLETION_OPEN',
        message: 'Montaj satırı henüz tamamlanmadı.'
      };
    }
  };
  const db = {
    data: { meta: { activeUserName: 'Montaj Plan Test' }, data },
    save: async (options = {}) => {
      saveCount += 1;
      saveOptions.push(options);
      if (deferSave) {
        const deferredResult = await new Promise((resolve) => { releaseDeferredSave = resolve; });
        return deferredResult;
      }
      if (failSave) throw new Error('save failed');
      if (saveReturnsFailure) return { ok: false, error: new Error('save returned failure') };
      if (saveResult) return saveResult;
      return { ok: true };
    }
  };
  const activeResolver = useRealMontagePreflight ? loadSanalTaksimResolver() : undefined;
  const PlanningModule = useRealMontagePreflight
    ? loadModule('src/modules/planning-module.js', 'PlanningModule', {
        DB: db,
        SanalTaksimResolver: activeResolver,
        crypto: nodeCrypto
      }).exported
    : undefined;
  const { exported: StockModule, context } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: db,
    UI: {
      renderCurrentPage: () => {
        renderCount += 1;
      }
    },
    Modal,
    UnitModule,
    PlanningModule,
    SanalTaksimResolver: activeResolver,
    alert: (message) => alerts.push(String(message)),
    confirm: (message) => {
      confirmMessages.push(String(message || ''));
      return confirmResult;
    },
    crypto: useRealMontagePreflight ? nodeCrypto : {
      randomUUID: () => {
        idCounter += 1;
        return `montage-plan-${idCounter}`;
      }
    }
  });
  StockModule.getMainDepot = () => ({ id: 'main' });
  StockModule.getCustomDepots = () => [];
  StockModule.getStockRowQty = (row) => Math.max(0, Number(row?.quantity ?? row?.qty ?? 0));
  StockModule.normalizeStockClass = (value) => String(value || '').trim().toUpperCase();
  StockModule.normalize = (value) => String(value || '').trim().toLocaleLowerCase('tr-TR');
  if (!useRealMontagePreflight) {
    StockModule.runMontageExactAllocationPreflight = ({
      items = [],
      qtyField,
      planId = '',
      validatePlanId = ''
    } = {}) => {
      const reservationPlanId = String(validatePlanId || planId || '').trim() || 'PREFLIGHT_ONLY';
      const offsetBySegment = new Map();
      const exactReservations = [];
      const validationPlan = validatePlanId
        ? data.montageDispatchPlans.find((row) => String(row?.id || '') === String(validatePlanId))
        : null;
      if (validationPlan) {
        for (const raw of (Array.isArray(validationPlan.exactReservations) ? validationPlan.exactReservations : [])) {
          const normalized = StockModule.normalizeMontageExactReservation(raw, reservationPlanId);
          if (normalized.ok) exactReservations.push(normalized.reservation);
        }
      } else {
        for (const item of items) {
          for (const part of (Array.isArray(item?.recipeParts) ? item.recipeParts : [])) {
            const qty = Number(item?.[qtyField] || 0) * Number(part?.qtyPerSet || 0);
            if (!(qty > 0)) continue;
            const code = String(part?.code || '').trim().toUpperCase();
            const unit = String(part?.unit || '').trim().toUpperCase();
            const stockRow = data.stockDepotItems.find((row) =>
              String(row?.productCode || row?.code || '').trim().toUpperCase() === code
              && String(row?.unit || '').trim().toUpperCase() === unit
            );
            if (!stockRow) continue;
            const physicalSegmentId = `STOCK|${stockRow.id}`;
            const start = Number(offsetBySegment.get(physicalSegmentId) || 0);
            const end = Number((start + qty).toFixed(6));
            offsetBySegment.set(physicalSegmentId, end);
            const normalized = StockModule.normalizeMontageExactReservation({
              planId: reservationPlanId,
              sourceType: item?.sourceType,
              sourceOrderId: item?.sourceOrderId,
              sourceLineId: item?.sourceLineId,
              demandId: item?.demandId,
              itemKey: item?.itemKey,
              prcId: part?.refId,
              prcCode: part?.code,
              unit: part?.unit,
              partSource: part?.source,
              physicalSegmentId,
              sourceBucket: 'FROM_STOCK',
              segmentOffsetStart: start,
              segmentOffsetEnd: end,
              qty
            }, reservationPlanId);
            if (normalized.ok) exactReservations.push(normalized.reservation);
          }
        }
      }
      const exactSegments = Array.from(new Set(exactReservations.map((row) => row.physicalSegmentId)))
        .map((segmentKey) => {
          const stockRowId = String(segmentKey).startsWith('STOCK|')
            ? String(segmentKey).slice('STOCK|'.length)
            : '';
          const row = data.stockDepotItems.find((candidate) => String(candidate?.id || '') === stockRowId);
          const reservation = exactReservations.find((candidate) => candidate.physicalSegmentId === segmentKey);
          if (!row || !reservation) return null;
          return {
            segmentKey,
            stockRowId,
            prcId: reservation.prcId,
            prcCode: reservation.prcCode,
            unit: reservation.unit,
            stage: 'DEPOT_STOCK',
            sourceKind: 'CURRENT_STOCK_ROW',
            allocatable: true,
            allocatableQty: Number(row.quantity ?? row.qty ?? 0),
            productionOriginVerified: row.productionOriginVerified === true,
            originDemandId: String(row.demandId || ''),
            originItemKey: String(row.itemKey || ''),
            physicalOrigin: {
              verified: row.productionOriginVerified === true,
              demandId: String(row.demandId || ''),
              itemKey: String(row.itemKey || '')
            }
          };
        })
        .filter(Boolean);
      return { ok: true, reasonCode: '', message: '', exactReservations, exactSegments };
    };
  }
  return {
    StockModule,
    context,
    alerts,
    confirmMessages,
    get saveCount() { return saveCount; },
    get renderCount() { return renderCount; },
    get modalHtml() { return modalHtml; },
    get modalTitle() { return modalTitle; },
    get modalOptions() { return modalOptions; },
    get printedModel() { return printedModel; },
    get openedPlanProductArgs() { return openedPlanProductArgs; },
    get openedPlanPartArgs() { return openedPlanPartArgs; },
    get openedHistoryShipmentId() { return openedHistoryShipmentId; },
    get montageLineCompletionCallCount() { return montageLineCompletionCallCount; },
    saveOptions,
    releaseSave: (result = { ok: true }) => {
      if (releaseDeferredSave) releaseDeferredSave(result);
    },
    modalStack,
    Modal
  };
}

function buildMontageCompletionHarness(options = {}) {
  const harness = buildMontagePlanHarness(options);
  const data = harness.context.DB.data.data;
  const recipeParts = [
    { refId: 'part-a', code: 'PRC-A', name: 'Parça A', unit: 'ADET', qtyPerSet: 2 },
    { refId: 'part-b', code: 'PRC-B', name: 'Parça B', unit: 'ADET', qtyPerSet: 1 },
    { refId: 'part-c', code: 'PRC-C', name: 'Parça C', unit: 'ADET', qtyPerSet: 1 },
    { refId: 'part-d', code: 'PRC-D', name: 'Parça D', unit: 'ADET', qtyPerSet: 1 },
    { refId: 'part-e', code: 'PRC-E', name: 'Parça E', unit: 'ADET', qtyPerSet: 1 },
    { refId: 'part-f', code: 'PRC-F', name: 'Parça F', unit: 'ADET', qtyPerSet: 1 },
    { refId: 'part-g', code: 'PRC-G', name: 'Parça G', unit: 'ADET', qtyPerSet: 1 }
  ];
  const line = {
    key: 'row-svr-2',
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-id-1',
    sourceOrderNo: 'SOR-000001',
    sourceLineId: 'sor-line-1',
    demandId: 'pln-id-1',
    itemKey: 'pln-item-1',
    productId: 'product-1',
    variationId: 'variant-1',
    svrCode: 'SVR-000002',
    productName: 'Bombeli 2008 Aluminyum Dikme',
    diameter: '40',
    accessoryColor: 'eloksal / P5 parlak eloksal',
    tubeColor: 'eloksal / P5 parlak eloksal',
    plexiColor: 'pleksi / şeffaf',
    bubble: 'yok',
    lowerTubeLength: 'standart'
  };
  const trustedItem = {
    sourceType: line.sourceType,
    sourceOrderId: line.sourceOrderId,
    sourceOrderNo: line.sourceOrderNo,
    sourceLineId: line.sourceLineId,
    demandId: line.demandId,
    demandCode: 'PLN-000002',
    itemKey: line.itemKey,
    productId: line.productId,
    variantId: line.variationId,
    variantCode: line.svrCode,
    productName: line.productName,
    montageCardId: 'montage-card-1',
    montageCardCode: 'MON-000001',
    recipeParts,
    shippedQty: 1
  };
  const legacyLine = {
    sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-1', sourceLineId: 'sor-line-legacy',
    demandId: 'pln-id-legacy', itemKey: 'pln-item-legacy', productId: 'product-1',
    variationId: 'variant-legacy', svrCode: 'SVR-000001', productName: 'Eski Snapshot Ürünü'
  };
  data.montageCompletionTransfers = [];
  data.montageDispatchShipments = [
    {
      id: 'shipment-old', shipmentNo: 'MGS-000001', planId: 'plan-old', planNo: 'MGP-000005',
      status: 'RECEIVED', targetUnitId: 'u3', receivedAt: '2026-07-13T10:00:00.000Z',
      items: [
        { ...trustedItem, montageCardId: '', montageCardCode: '', recipeParts: [], shippedQty: 5 },
        { ...legacyLine, variantId: legacyLine.variationId, variantCode: legacyLine.svrCode, montageCardId: '', montageCardCode: '', recipeParts: [], shippedQty: 7 }
      ]
    },
    {
      id: 'shipment-safe', shipmentNo: 'MGS-000002', planId: 'plan-safe', planNo: 'MGP-000007',
      status: 'RECEIVED', targetUnitId: 'u3', receivedAt: '2026-07-14T10:00:00.000Z', items: [trustedItem]
    }
  ];
  data.stockDepotLocations = [{ id: 'shipping-r01-a1', depotId: 'depot_profil', rafCode: 'R01', cellCode: 'A1' }];
  data.stock_movements = [];
  data.stockDepotItems = recipeParts.map((part, index) => ({
    id: `safe-stock-${index + 1}`,
    sourceShipmentId: 'shipment-safe',
    shipmentId: 'shipment-safe',
    shipmentNo: 'MGS-000002',
    depotId: 'unit:u3',
    nodeKey: 'unit:u3',
    unitId: 'u3',
    locationId: 'montage-receipt-location',
    refId: part.refId,
    productId: part.refId,
    code: part.code,
    productCode: part.code,
    productName: part.name,
    unit: part.unit,
    quantity: part.qtyPerSet,
    qty: part.qtyPerSet,
    amount: part.qtyPerSet,
    stockClass: 'MONTAGE_RECEIVED',
    status: 'MONTAGE_RECEIVED_AWAITING_START',
    created_at: `2026-07-14T10:0${index}:00.000Z`
  }));
  return Object.assign(harness, { data, line, legacyLine, trustedItem, recipeParts });
}

function buildCompletedSalesSurplusHarness(options = {}) {
  const montageLineCompletionState = options.montageLineCompletionState || {
    ok: true,
    completed: true,
    code: 'MONTAGE_COMPLETED',
    message: 'Montaj tamamlandı ve Sevkiyat Deposuna teslim edildi.'
  };
  const harness = buildMontageCompletionHarness({ ...options, montageLineCompletionState });
  const { data, line, trustedItem, recipeParts } = harness;
  recipeParts.find((part) => part.code === 'PRC-A').qtyPerSet = 1;
  data.partComponentCards = recipeParts.map((part) => ({
    id: part.refId,
    code: part.code,
    name: part.name,
    unit: part.unit
  }));
  data.externalProcessSupplierLinks = [];
  const orderLine = data.orders[0].lines[0];
  Object.assign(orderLine, {
    idCode: 'SAL-000001',
    productCode: 'SAL-000001',
    variantCode: 'SVR-000002',
    qty: 10
  });
  line.salCode = 'SAL-000001';
  trustedItem.shippedQty = 10;
  const safeShipment = data.montageDispatchShipments.find((shipment) => shipment.id === 'shipment-safe');
  safeShipment.items = [trustedItem];
  data.montageDispatchShipments = [safeShipment];
  data.montageDispatchPlans = [{
    id: 'plan-safe',
    planNo: 'MGP-000007',
    status: 'DISPATCHED_TO_MONTAGE',
    items: [{ ...trustedItem, orderQty: 10, plannedQty: 10 }],
    parts: recipeParts.map((part) => ({
      ...part,
      source: 'component',
      requiredQty: part.qtyPerSet * 10
    }))
  }];
  data.workOrders = recipeParts.map((part, index) => {
    const requiredQty = part.qtyPerSet * 10;
    const netQty = requiredQty + (part.code === 'PRC-A' ? 4 : 0);
    return {
      id: `wo-surplus-${index + 1}`,
      workOrderCode: `WO-SURPLUS-${index + 1}`,
      sourceId: 'pln-id-1',
      sourceItemKey: 'pln-item-1',
      productCode: part.code,
      lotQty: netQty,
      lines: [{ id: `wo-surplus-line-${index + 1}`, componentCode: part.code, targetQty: netQty }]
    };
  });
  const surplusDemand = data.planningDemands.find((demand) => demand.id === 'pln-id-1');
  surplusDemand.workOrderIds = data.workOrders.map((order) => order.id);
  surplusDemand.poolAnalysis = {
    rows: recipeParts.map((part) => ({
      itemKey: 'pln-item-1',
      componentId: part.refId,
      code: part.code,
      requiredQty: part.qtyPerSet * 10,
      netQty: part.qtyPerSet * 10 + (part.code === 'PRC-A' ? 4 : 0)
    }))
  };
  data.stockDepotLocations = [
    { id: 'shipping-r01-a1', depotId: 'depot_profil', rafCode: 'R01', cellCode: 'A1' },
    { id: 'loc-main-a', depotId: 'main', locationCode: 'A-01' }
  ];
  data.stockDepotItems = recipeParts.map((part, index) => ({
    id: `safe-stock-${index + 1}`,
    sourceShipmentId: 'shipment-safe',
    shipmentId: 'shipment-safe',
    shipmentNo: 'MGS-000002',
    depotId: 'unit:u3',
    nodeKey: 'unit:u3',
    unitId: 'u3',
    locationId: 'montage-receipt-location',
    refId: part.refId,
    productId: part.refId,
    code: part.code,
    productCode: part.code,
    productName: part.name,
    unit: part.unit,
    quantity: part.qtyPerSet * 10,
    qty: part.qtyPerSet * 10,
    amount: part.qtyPerSet * 10,
    stockClass: 'MONTAGE_RECEIVED',
    status: 'MONTAGE_RECEIVED_AWAITING_START',
    created_at: `2026-07-14T10:0${index}:00.000Z`
  }));
  data.stockDepotItems.push(
    {
      id: 'sales-surplus-prc-a',
      productCode: 'PRC-A',
      code: 'PRC-A',
      productName: 'Parça A',
      name: 'Parça A',
      quantity: 4,
      qty: 4,
      amount: 4,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'sor-id-1',
      sourceLineId: 'sor-line-1',
      demandId: 'pln-id-1',
      itemKey: 'pln-item-1',
      depotId: 'main',
      nodeKey: 'managed:main',
      locationId: 'loc-main-a',
      locationCode: 'A-01',
      created_at: '2026-07-14T09:00:00.000Z'
    },
    {
      id: 'unrelated-sales-stock',
      productCode: 'PRC-A',
      code: 'PRC-A',
      productName: 'Başka Sipariş Parçası',
      quantity: 9,
      qty: 9,
      amount: 9,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'other-order',
      sourceLineId: 'other-line',
      demandId: 'other-demand',
      itemKey: 'other-item',
      depotId: 'main',
      nodeKey: 'managed:main',
      locationId: 'loc-main-a',
      locationCode: 'A-01',
      created_at: '2026-07-14T09:01:00.000Z'
    }
  );
  const phase6ResolverState = {
    lockedPhysicalQty: Number(options.phase6LockedPhysicalQty ?? 10),
    uncertainPrcCode: String(options.phase6UncertainPrcCode || ''),
    uncertainEntries: Array.isArray(options.phase6UncertainEntries)
      ? options.phase6UncertainEntries.map((entry) => ({ ...entry }))
      : [],
    lockedSourceRowId: String(options.phase6LockedSourceRowId || ''),
    reservations: Array.isArray(options.phase6Reservations) ? options.phase6Reservations : [],
    extraDebts: Array.isArray(options.phase6ExtraDebts) ? options.phase6ExtraDebts : [],
    salesDispatchedQty: Number(options.phase6SalesDispatchedQty || 0),
    throwError: false,
    breakInvariant: false
  };
  harness.context.SanalTaksimResolver = {
    resolve: () => {
      if (phase6ResolverState.throwError) throw new Error('phase6 resolver failure');
      const componentByCode = new Map(recipeParts.map((part) => [part.code, part]));
      const segments = [];
      data.stockDepotItems.forEach((row) => {
        if (String(row?.sourceShipmentId || '').trim()) return;
        const code = String(row?.productCode || row?.code || '').toUpperCase();
        const component = componentByCode.get(code);
        const qty = Number(row?.qty ?? row?.quantity ?? 0);
        if (!component || !Number.isFinite(qty) || qty <= 0) return;
        const rowId = String(row?.id || '');
        const locked = phase6ResolverState.lockedSourceRowId === rowId;
        segments.push({
          segmentKey: `STOCK|${rowId}`,
          itemType: 'PRC',
          prcId: component.refId,
          prcCode: component.code,
          unit: component.unit,
          stage: locked ? 'MONTAGE_RECEIVED' : 'DEPOT_STOCK',
          physicalQty: qty,
          qty,
          allocatable: true,
          allocatableQty: qty,
          allocatableToOthers: locked ? false : true,
          sourceKind: locked ? 'MGS_RECEIPT_JOIN' : 'CURRENT_STOCK_ROW',
          stockRowId: rowId,
          stockSlices: locked ? [{ stockRowId: rowId, qty }] : []
        });
      });
      if (phase6ResolverState.lockedPhysicalQty > 0) {
        segments.push({
          segmentKey: 'LIFECYCLE|PHASE6|PRC-A',
          itemType: 'PRC',
          prcId: 'part-a',
          prcCode: 'PRC-A',
          unit: 'ADET',
          stage: 'MONTAGE_IN_TRANSIT',
          physicalQty: phase6ResolverState.lockedPhysicalQty,
          qty: phase6ResolverState.lockedPhysicalQty,
          allocatable: true,
          allocatableQty: phase6ResolverState.lockedPhysicalQty,
          allocatableToOthers: false,
          sourceKind: 'MGS_LOCKED_SHIPMENT'
        });
      }
      const debts = data.workOrders.map((workOrder) => {
        const lineRow = workOrder.lines[0];
        const component = componentByCode.get(String(lineRow?.componentCode || '').toUpperCase());
        const demand = data.planningDemands.find((row) => row.id === workOrder.sourceId);
        const debtType = String(demand?.sourceType || '').toUpperCase() === 'STOCK' ? 'STOCK' : 'SALES';
        const dispatchedQty = debtType === 'SALES' && demand?.id === 'pln-id-1'
          ? phase6ResolverState.salesDispatchedQty
          : 0;
        return {
          debtKey: `DEBT|${debtType}|${workOrder.id}`,
          debtType,
          prcId: component?.refId || '',
          prcCode: component?.code || String(lineRow?.componentCode || '').toUpperCase(),
          unit: component?.unit || 'ADET',
          targetQty: Number(lineRow?.targetQty || 0),
          dispatchedQty: debtType === 'SALES' ? dispatchedQty : 0,
          openDebtQty: Math.max(0, Number(lineRow?.targetQty || 0) - dispatchedQty),
          allocationEligible: true,
          reasonCodes: [],
          originWorkOrderId: workOrder.id,
          originDemandId: workOrder.sourceId
        };
      }).concat(phase6ResolverState.extraDebts);
      return {
        segments,
        debts,
        allocations: [],
        uncoveredDebts: [],
        uncertain: phase6ResolverState.uncertainEntries.length
          ? phase6ResolverState.uncertainEntries.map((entry) => ({ ...entry }))
          : (phase6ResolverState.uncertainPrcCode ? [{
            kind: 'STOCK_ROW',
            reasonCode: 'STOCK_QTY_ALIAS_CONFLICT',
            prcCode: phase6ResolverState.uncertainPrcCode,
            unit: 'ADET'
          }] : []),
        lifecycle: { reservations: phase6ResolverState.reservations, evidence: [] },
        diagnostics: {
          invariants: {
            segmentAllocationWithinQty: !phase6ResolverState.breakInvariant,
            debtAllocationWithinOpenDebt: true,
            segmentKeysConsumedOnce: true,
            exactPrcAndUnitOnly: true,
            originEvidencePreserved: true
          }
        }
      };
    }
  };
  harness.phase6ResolverState = phase6ResolverState;
  return harness;
}

function attachFinalStoreUnitToSurplusHarness(harness) {
  let idCounter = 0;
  const alerts = [];
  const { exported: UnitModule } = loadModule('src/modules/unit-module.js', 'UnitModule', {
    DB: harness.context.DB,
    StockModule: harness.StockModule,
    UI: { renderCurrentPage: () => {} },
    Modal: { open: () => {}, close: () => {} },
    alert: (message) => alerts.push(String(message)),
    crypto: { randomUUID: () => `late-store-${++idCounter}` }
  });
  UnitModule.computeWorkLineUnitMetrics = () => ({
    isFinalStep: true,
    inProcessQty: 20,
    depotPendingQty: 0,
    routeId: 'route-final',
    routeSeq: 1,
    processId: 'PROCESS-FINAL'
  });
  const workOrder = harness.data.workOrders.find((order) => order.productCode === 'PRC-A');
  workOrder.lines[0].componentName = 'Parça A';
  workOrder.lines[0].unit = 'ADET';
  return { UnitModule, workOrder, alerts };
}

function setCompletedSalesSurplusSourceQty(harness, qty) {
  const row = harness.data.stockDepotItems.find((item) => item.id === 'sales-surplus-prc-a');
  row.quantity = qty;
  row.qty = qty;
  row.amount = qty;
  return row;
}

function getCompletedSalesSurplusFreeQty(harness) {
  return harness.data.stockDepotItems
    .filter((row) => String(row?.allocationType || '').toUpperCase() === 'FREE'
      && String(row?.productCode || row?.code || '').toUpperCase() === 'PRC-A'
      && String(row?.depotId || '') === 'main'
      && String(row?.locationId || '') === 'loc-main-a')
    .reduce((sum, row) => sum + Number(row?.qty || row?.quantity || 0), 0);
}

function configurePhase6SalesSurplus(harness, { requiredQty = 10, netQty = 14, sourceQty = 4, unrelatedQty = 0 } = {}) {
  const demand = harness.data.planningDemands.find((row) => row.id === 'pln-id-1');
  const poolRow = demand.poolAnalysis.rows.find((row) => row.code === 'PRC-A');
  const workOrder = harness.data.workOrders.find((row) => row.productCode === 'PRC-A');
  poolRow.requiredQty = requiredQty;
  poolRow.netQty = netQty;
  workOrder.lotQty = netQty;
  workOrder.lines[0].targetQty = netQty;
  setCompletedSalesSurplusSourceQty(harness, sourceQty);
  const unrelated = harness.data.stockDepotItems.find((row) => row.id === 'unrelated-sales-stock');
  unrelated.quantity = unrelatedQty;
  unrelated.qty = unrelatedQty;
  unrelated.amount = unrelatedQty;
}

function buildSor000001MontageCleanupHarness(options = {}) {
  const orderId = '67416f07-3f74-4c90-bdd4-7dad459d5f42';
  const lineIds = [
    'e0a4834e-38d0-4065-8f03-58ffcdca5b34',
    '9306dc9f-97d0-42ac-95a1-94711fc8a743'
  ];
  const planSpecs = [
    ['9270a8d9-3f24-457f-a406-220eb06d0883', 'MGP-000001', 'CANCELLED'],
    ['aaedbca4-353a-4f60-8e62-21df7a970b50', 'MGP-000002', 'CANCELLED'],
    ['2bd904d6-619d-4674-9b8c-24dbe074083c', 'MGP-000003', 'CANCELLED'],
    ['0003e917-c47e-4b45-bb04-4d32bba6cc29', 'MGP-000004', 'CANCELLED'],
    ['10827448-f15e-41ab-bf5a-ebee25199411', 'MGP-000005', 'DISPATCHED_TO_MONTAGE'],
    ['374aeab6-90f0-49a2-8e4d-3567822fc29b', 'MGP-000007', 'DISPATCHED_TO_MONTAGE']
  ];
  const shipmentSpecs = [
    {
      id: '6110848d-6d45-4e77-af4c-17505150f43f', no: 'MGS-000001',
      planId: planSpecs[4][0], planNo: planSpecs[4][1], quantities: [5, 5, 5, 10, 5, 5, 5, 7, 7, 7, 14, 7, 7, 7]
    },
    {
      id: '7d448a6e-27db-4acd-9546-3d1bcf5fce4a', no: 'MGS-000002',
      planId: planSpecs[5][0], planNo: planSpecs[5][1], quantities: [1, 1, 1, 2, 1, 1, 1]
    }
  ];
  const transferId = '4cb91265-dab8-452e-87fc-b1d7dc42748a';
  const finishedStockId = '18591fb3-66e8-4023-9bf3-486d791cc1f9';
  const finishedMovementId = '4307b5c3-b8e8-4f9a-aeb1-2e2f8c503f10';
  const mainLocationId = '7549be14-6e2a-4814-86d0-6e458e52eef0';
  const upperLocationId = '9e12eaf0-3269-4a5d-8218-d25f13aa48ad';
  const stockDepotItems = Array.from({ length: 15 }, (_, index) => ({
    id: `cleanup-source-${index}`,
    depotId: 'main',
    locationId: index === 14 ? upperLocationId : mainLocationId,
    refId: `cleanup-part-${Math.min(index, 13)}`,
    productCode: `PRC-CLEAN-${Math.min(index, 13)}`,
    code: `PRC-CLEAN-${Math.min(index, 13)}`,
    quantity: 20,
    qty: 20,
    amount: 20
  }));
  const stockMovements = [];
  const receiptRowsByShipment = new Map();

  const shipments = shipmentSpecs.map((shipmentSpec, shipmentIndex) => {
    const parts = shipmentSpec.quantities.map((quantity, partIndex) => {
      const refId = `cleanup-part-${partIndex}`;
      const code = `PRC-CLEAN-${partIndex}`;
      const allocationParts = shipmentIndex === 0 && partIndex === 0
        ? [{ sourceIndex: 0, qty: quantity - 1 }, { sourceIndex: 14, qty: 1 }]
        : [{ sourceIndex: partIndex, qty: quantity }];
      const allocations = allocationParts.map((allocation, allocationIndex) => {
        const sourceRow = stockDepotItems[allocation.sourceIndex];
        const movementId = `cleanup-out-${shipmentIndex}-${partIndex}-${allocationIndex}`;
        stockMovements.push({
          id: movementId,
          movementType: 'MONTAGE_DISPATCH_OUT',
          shipmentId: shipmentSpec.id,
          stockDepotItemId: sourceRow.id,
          sourceDepotId: sourceRow.depotId,
          sourceLocationId: sourceRow.locationId,
          refId,
          code,
          qty: allocation.qty
        });
        return {
          stockDepotItemId: sourceRow.id,
          stockMovementId: movementId,
          sourceDepotId: sourceRow.depotId,
          sourceLocationId: sourceRow.locationId,
          qty: allocation.qty
        };
      });
      const receiptStockId = `cleanup-receipt-${shipmentIndex}-${partIndex}`;
      const receiptMovementId = `cleanup-receipt-movement-${shipmentIndex}-${partIndex}`;
      const receiptRow = {
        id: receiptStockId,
        sourceShipmentId: shipmentSpec.id,
        shipmentId: shipmentSpec.id,
        shipmentNo: shipmentSpec.no,
        depotId: 'unit:u3',
        locationId: 'montage-location',
        refId,
        code,
        productCode: code,
        receiptKey: `receipt-${shipmentIndex}`,
        receiptLineKey: `receipt-${shipmentIndex}-${partIndex}`,
        stockClass: 'MONTAGE_RECEIVED',
        quantity: shipmentIndex === 0 ? quantity : 0,
        qty: shipmentIndex === 0 ? quantity : 0,
        amount: shipmentIndex === 0 ? quantity : 0
      };
      stockDepotItems.push(receiptRow);
      if (!receiptRowsByShipment.has(shipmentSpec.id)) receiptRowsByShipment.set(shipmentSpec.id, []);
      receiptRowsByShipment.get(shipmentSpec.id).push(receiptRow);
      stockMovements.push({
        id: receiptMovementId,
        movementType: 'MONTAGE_DISPATCH_RECEIPT',
        shipmentId: shipmentSpec.id,
        stockDepotItemId: receiptStockId,
        refId,
        code,
        qty: quantity
      });
      return { refId, code, shippedQty: quantity, allocations };
    });
    return {
      id: shipmentSpec.id,
      shipmentNo: shipmentSpec.no,
      planId: shipmentSpec.planId,
      planNo: shipmentSpec.planNo,
      status: 'RECEIVED',
      items: [{ sourceOrderId: orderId, sourceLineId: lineIds[shipmentIndex] }],
      parts
    };
  });

  const componentMovementIds = [];
  const componentAllocations = [];
  receiptRowsByShipment.get(shipmentSpecs[1].id).forEach((row, index) => {
    const movementId = `cleanup-consumption-${index}`;
    const qty = shipmentSpecs[1].quantities[index];
    componentMovementIds.push(movementId);
    componentAllocations.push({ stockDepotItemId: row.id, stockMovementId: movementId, qty });
    stockMovements.push({
      id: movementId,
      movementType: 'MONTAGE_COMPONENT_CONSUMPTION',
      completionTransferId: transferId,
      stockDepotItemId: row.id,
      qty
    });
  });
  stockDepotItems.push({
    id: finishedStockId,
    sourceShipmentId: shipmentSpecs[1].id,
    completionTransferId: transferId,
    depotId: 'depot_profil',
    locationId: 'shipping-r01-a1',
    rafCode: 'R01',
    cellCode: 'A1',
    variantCode: 'SVR-000002',
    quantity: 1,
    qty: 1,
    amount: 1
  });
  stockMovements.push({
    id: finishedMovementId,
    movementType: 'MONTAGE_FINISHED_PRODUCT_IN',
    completionTransferId: transferId,
    stockDepotItemId: finishedStockId,
    qty: 1
  });
  stockDepotItems.push({ id: 'unrelated-stock', depotId: 'main', locationId: mainLocationId, quantity: 9, qty: 9, amount: 9 });
  stockMovements.push({ id: 'unrelated-movement', movementType: 'IN', stockDepotItemId: 'unrelated-stock', qty: 9 });

  const data = {
    orders: [{
      id: orderId,
      orderNo: 'SOR-000001',
      lines: lineIds.map((id) => ({ id }))
    }],
    planningDemands: [{ id: 'protected-demand' }],
    workOrders: [{ id: 'protected-work-order' }],
    workOrderTransactions: [{ id: 'protected-work-transaction' }],
    montageDispatchPlans: [
      ...planSpecs.map(([id, planNo, status], index) => ({
        id,
        planNo,
        status,
        items: [{ sourceOrderId: orderId, sourceLineId: lineIds[index % lineIds.length] }]
      })),
      { id: 'unrelated-plan', planNo: 'MGP-000006', status: 'DRAFT', items: [{ sourceOrderId: 'other-order', sourceLineId: 'other-line' }] }
    ],
    montageDispatchShipments: [
      ...shipments,
      { id: 'unrelated-shipment', shipmentNo: 'MGS-OTHER', status: 'IN_TRANSIT', items: [{ sourceOrderId: 'other-order', sourceLineId: 'other-line' }], parts: [] }
    ],
    montageCompletionTransfers: [
      {
        id: transferId,
        transferNo: 'MCT-000001',
        status: 'POSTED',
        sourceOrderId: orderId,
        sourceShipmentNo: 'MGS-000002',
        qty: 1,
        componentMovementIds,
        componentAllocations,
        finishedProductStockItemId: finishedStockId,
        finishedProductMovementId: finishedMovementId
      },
      { id: 'unrelated-transfer', transferNo: 'MCT-OTHER', status: 'PENDING_DEPOT_RECEIPT', sourceOrderId: 'other-order' }
    ],
    stockDepotLocations: [
      { id: mainLocationId, depotId: 'main' },
      { id: upperLocationId, depotId: 'main' },
      { id: 'shipping-r01-a1', depotId: 'depot_profil', rafCode: 'R01', cellCode: 'A1' }
    ],
    stockDepotItems,
    stock_movements: stockMovements
  };
  let saveCount = 0;
  let approvalArgs = null;
  const DB = {
    data: { data },
    createCriticalDropApproval: (...args) => {
      approvalArgs = args;
      return { type: args[0], issues: [{ collection: 'fixture' }] };
    },
    save: async () => {
      saveCount += 1;
      if (options.failSave) throw new Error('cleanup save failed');
      if (options.saveReturnsFailure) return { ok: false, message: 'cleanup save returned failure' };
      return { ok: true, written: true, revision: 2 };
    }
  };
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', { DB });
  return {
    StockModule,
    DB,
    data,
    orderId,
    lineIds,
    planSpecs,
    shipmentSpecs,
    transferId,
    finishedStockId,
    finishedMovementId,
    mainLocationId,
    upperLocationId,
    get saveCount() { return saveCount; },
    get approvalArgs() { return approvalArgs; }
  };
}

function configureMontagePlanSave(StockModule, { plannedQty, sendableQty = 10, orderQty = 10 } = {}) {
  const job = {
    key: 'job-1',
    montageCardId: 'montage-card-1',
    montageCardCode: 'MON-000001',
    partRows: [{
      key: 'recipe-1',
      recipeItemId: 'recipe-1',
      source: 'part',
      refId: 'part-ref-a',
      code: 'PRC-A',
      name: 'Ortak Parca',
      qtyPerSet: 2
    }]
  };
  StockModule.state.montageReadyDetailKey = 'detail-1';
  StockModule.state.montageReadyDetailSendSelected = { 'line-1': true };
  StockModule.state.montageReadyDetailSendQtyByRow = { 'line-1': String(plannedQty) };
  StockModule.buildMontageReadyJobCards = () => [job];
  StockModule.getMontageReadyPlanRows = () => [{ key: 'detail-1', jobs: [job] }];
  const line = {
    key: 'line-1',
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-id-1',
    sourceOrderNo: 'SOR-000001',
    sourceLineId: 'sor-line-1',
    demandId: 'pln-id-1',
    demandCode: 'PLN-000001',
    itemKey: 'pln-item-1',
    productId: 'product-1',
    variationId: 'variant-1',
    svrCode: 'SVR-001',
    productName: 'Urun A',
    qty: String(orderQty),
    readySetQty: sendableQty,
    resolverAvailability: {
      trusted: true,
      allocatable: sendableQty > 0,
      readyQty: sendableQty,
      reasonCode: sendableQty > 0 ? '' : 'RESOLVER_NOT_ALLOCATABLE',
      message: ''
    },
    sendableQty,
    sendableCalculable: true,
    montageJobKey: 'job-1'
  };
  StockModule.getMontageReadyDetailOrderRows = () => [line];
  return { job, line };
}

function configureMontagePhase5CExactData(harness, { stockQty = 20, workInProcessQty = 0 } = {}) {
  const data = harness.context.DB.data.data;
  data.partComponentCards = [{ id: 'part-ref-a', code: 'PRC-A', unit: 'ADET' }];
  Object.assign(data.orders[0], {
    status: 'Onaylandi',
    deliveryDate: '2026-08-10'
  });
  Object.assign(data.orders[0].lines[0], {
    productId: 'product-1',
    variationId: 'variant-1',
    variantCode: 'SVR-001',
    qty: 10
  });
  Object.assign(data.planningDemands[0], {
    demandCode: 'PLN-000001',
    sourceOrderNo: 'SOR-000001',
    productId: 'product-1',
    variantCode: 'SVR-001',
    status: 'RELEASED',
    releasedQty: 10,
    released_at: '2026-07-24T08:00:00.000Z',
    workOrderId: 'wo-phase5c',
    workOrderIds: ['wo-phase5c'],
    poolAnalysis: {
      stockAccountingMode: 'VIRTUAL_V1',
      rows: [{
        itemKey: 'pln-item-1',
        componentId: 'part-ref-a',
        code: 'PRC-A',
        unit: 'ADET',
        requiredQty: 20,
        useStockSelected: true,
        useSemiSelected: false,
        useNetSelected: false,
        useStockQty: 20,
        useSemiQty: 0,
        netQty: 0
      }]
    }
  });
  Object.assign(data.planningDemands[0].items[0], {
    productId: 'product-1',
    variantId: 'variant-1',
    variantCode: 'SVR-001',
    productCode: 'SVR-001',
    qty: 10
  });
  data.workOrders = [{
    id: 'wo-phase5c',
    workOrderCode: 'WO-PHASE5C',
    sourceId: 'pln-id-1',
    sourceItemKey: 'pln-item-1',
    lines: [{
      id: 'wo-line-phase5c',
      componentId: 'part-ref-a',
      componentCode: 'PRC-A',
      unit: 'ADET',
      targetQty: 20,
      routes: [{
        id: 'route-phase5c',
        seq: 1,
        stationId: 'unit-phase5c',
        processId: 'PROCESS-PHASE5C'
      }]
    }]
  }];
  data.workOrderTransactions = workInProcessQty > 0 ? [{
    id: 'txn-phase5c-take',
    workOrderId: 'wo-phase5c',
    lineId: 'wo-line-phase5c',
    type: 'TAKE',
    qty: workInProcessQty,
    routeId: 'route-phase5c',
    routeSeq: 1,
    stationId: 'unit-phase5c',
    processId: 'PROCESS-PHASE5C',
    created_at: '2026-07-24T09:00:00.000Z'
  }] : [];
  const stock = data.stockDepotItems[0];
  Object.assign(stock, {
    refId: 'part-ref-a',
    productCode: 'PRC-A',
    code: 'PRC-A',
    qty: stockQty,
    quantity: stockQty,
    unit: 'ADET',
    stockClass: 'KULLANILABILIR',
    status: 'KULLANILABILIR',
    allocationType: 'FREE',
    depotId: 'main',
    nodeKey: 'managed:main',
    locationId: 'loc-main-a'
  });
  data.montageDispatchPlans.forEach((plan) => {
    (Array.isArray(plan?.items) ? plan.items : []).forEach((item) => {
      if (item.sourceOrderId === 'sor-id-1' && item.sourceLineId === 'sor-line-1') {
        item.variantCode = 'SVR-001';
      }
    });
    (Array.isArray(plan?.parts) ? plan.parts : []).forEach((part) => {
      if (part.code === 'PRC-A') part.unit = 'ADET';
    });
  });
  data.salesShipments = [];
  return data;
}

function createMontageDispatchPlan({ id = 'dispatch-plan-1', planNo = 'MGP-000001', status = 'DRAFT', plannedQty = 6, requiredQty = 12 } = {}) {
  return {
    id,
    planNo,
    status,
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
    cancelledAt: '',
    items: [{
      sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-1', sourceOrderNo: 'SOR-000001', sourceLineId: 'sor-line-1',
      demandId: 'pln-id-1', demandCode: 'PLN-000001', itemKey: 'pln-item-1', productId: 'product-1', variantId: 'variant-1',
      variantCode: 'SVR-000001', productName: 'Urun A', orderQty: 10, plannedQty,
      montageCardId: 'montage-card-1', montageCardCode: 'MON-000001',
      recipeParts: [{ refId: 'part-ref-a', code: 'PRC-A', name: 'Ortak Parca', unit: 'ADET', qtyPerSet: 2 }]
    }],
    parts: [{ source: 'part', refId: 'part-ref-a', code: 'PRC-A', name: 'Ortak Parca', unit: 'ADET', requiredQty }],
    exactReservations: [{
      reservationKey: `MGP_EXACT|${id}|pln-id-1|pln-item-1|part-ref-a|PRC-A|ADET|STOCK|stock-prc-a|FROM_STOCK|0|${requiredQty}`,
      planId: id,
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'sor-id-1',
      sourceLineId: 'sor-line-1',
      demandId: 'pln-id-1',
      itemKey: 'pln-item-1',
      prcId: 'part-ref-a',
      prcCode: 'PRC-A',
      unit: 'ADET',
      partSource: 'part',
      physicalSegmentId: 'STOCK|stock-prc-a',
      sourceBucket: 'FROM_STOCK',
      segmentOffsetStart: 0,
      segmentOffsetEnd: requiredQty,
      qty: requiredQty
    }]
  };
}

function buildMontageReceiptHarness(options = {}) {
  const plan = createMontageDispatchPlan({ id: 'receipt-plan-1', planNo: 'MGP-000001', status: 'DISPATCHED_TO_MONTAGE' });
  const harness = buildMontagePlanHarness({ ...options, plans: [plan] });
  harness.context.DB.data.data.montageDispatchShipments.push({
    id: 'receipt-shipment-1', shipmentNo: 'MGS-000001', planId: plan.id, planNo: plan.planNo,
    status: 'IN_TRANSIT', targetUnitId: 'u3', receivedAt: '', dispatchedAt: '2026-07-13T10:00:00.000Z',
    items: [
      { sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-1', demandId: 'demand-1', itemKey: 'item-1', productName: 'Ürün A', variantCode: 'SVR-000001', shippedQty: 5 },
      { sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-2', demandId: 'demand-2', itemKey: 'item-2', productName: 'Ürün A', variantCode: 'SVR-000002', shippedQty: 7 }
    ],
    parts: [
      { source: 'part', refId: 'part-ref-a', code: 'PRC-A', name: 'Parça A', unit: 'ADET', shippedQty: 86, allocations: [{ stockMovementId: 'dispatch-out-a' }] },
      { source: 'part', refId: 'part-ref-b', code: 'PRC-B', name: 'Parça B', unit: 'ADET', shippedQty: 10, allocations: [{ stockMovementId: 'dispatch-out-b' }] }
    ]
  });
  harness.plan = plan;
  return harness;
}

function buildMontageJobsReadonlyHarness() {
  let renderCount = 0;
  let productionStatusDemandId = '';
  let productCardArgs = [];
  let montagePreviewId = '';
  let modalHtml = '';
  let openedPartRef = null;
  let receivedShipmentId = '';
  let printHtml = '';
  let printCount = 0;
  const alerts = [];
  const modalStack = [];
  const data = {
    units: [{ id: 'u3', name: 'Montaj' }],
    montageCards: [{ id: 'montage-1', cardCode: 'MON-000001', productCode: 'SAL-000001', productName: 'Satış Ürünü' }],
    partComponentCards: [{ id: 'ref-sales-good', code: 'PRC-000001', name: 'Sevk Parçası', routes: [], files: [] }],
    salesCatalogProducts: [{ id: 'product-1', productCode: 'SAL-000001', name: 'Aynı Ürün' }],
    salesProductVariants: [
      { id: 'variation-1', sourceCatalogProductId: 'product-1', variantCode: 'SVR-000001' },
      { id: 'variation-2', sourceCatalogProductId: 'product-1', variantCode: 'SVR-000002' }
    ],
    workOrders: [
      { id: 'wo-sales', workOrderCode: 'WO-SALES' },
      { id: 'wo-stock', workOrderCode: 'WO-STOCK' },
      { id: 'wo-stock-empty', workOrderCode: 'WO-STOCK-EMPTY' }
    ],
    planningDemands: [
      { id: 'sales-good', sourceType: 'SALES_ORDER', status: 'RELEASED', released_at: '2026-07-01T10:00:00.000Z', workOrderIds: ['wo-sales'], sourceOrderId: 'order-1', sourceOrderNo: 'SOR-000001', sourceLineId: 'line-1', demandCode: 'PLN-000001', dueDate: '2026-07-20' },
      { id: 'sales-no-wo', sourceType: 'SALES_ORDER', status: 'RELEASED', released_at: '2026-07-01T10:00:00.000Z', workOrderIds: [], sourceOrderNo: 'SOR-NO-WO', demandCode: 'PLN-NO-WO' },
      { id: 'sales-draft', sourceType: 'SALES_ORDER', status: 'DRAFT', released_at: '', workOrderIds: ['wo-sales'], sourceOrderNo: 'SOR-DRAFT', demandCode: 'PLN-DRAFT' },
      { id: 'stock-good', sourceType: 'STOCK', status: 'RELEASED', released_at: '2026-07-02T10:00:00.000Z', workOrderCodes: ['WO-STOCK'], demandCode: 'PLN-000002' },
      { id: 'stock-empty', sourceType: 'STOCK', status: 'RELEASED', released_at: '2026-07-02T10:00:00.000Z', workOrderCodes: ['WO-STOCK-EMPTY'], demandCode: 'PLN-000003' },
      { id: 'stock-no-wo', sourceType: 'STOCK', status: 'RELEASED', released_at: '2026-07-02T10:00:00.000Z', workOrderCodes: [], demandCode: 'PLN-STOCK-NO-WO' }
    ],
    orders: [{
      id: 'order-1', orderNo: 'SOR-000001', customerId: 'customer-1', customerName: 'Örnek Müşteri',
      approvalDate: '2026-07-01', deliveryDate: '2026-07-20', deliveryAddress: 'Montaj Sevkiyat Adresi',
      deliveryNote: 'Etiket ve paketleme notu', manualNote: 'Operasyon sipariş notu',
      unitPrice: 'GIZLI_BIRIM_FIYAT', discount: 'GIZLI_ISKONTO', paymentMethod: 'GIZLI_ODEME',
      cost: 'GIZLI_MALIYET', profit: 'GIZLI_KAR', currentBalance: 'GIZLI_CARI_BAKIYE'
    }],
    customers: [{ id: 'customer-1', name: 'Örnek Müşteri', address: 'Müşteri Adresi' }],
    montageDispatchPlans: [{
      id: 'plan-draft', status: 'DRAFT', items: [
        { sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-1', demandId: 'sales-good', itemKey: 'item-sales-good', plannedQty: 5 },
        { sourceType: 'STOCK', demandId: 'stock-good', itemKey: 'item-stock-good', plannedQty: 10 }
      ]
    }],
    montageDispatchShipments: [{
      id: 'shipment-1', shipmentNo: 'MGS-000001', planId: 'plan-dispatched', planNo: 'MGP-000001', status: 'IN_TRANSIT', targetUnitId: 'u3',
      customerName: 'Örnek Müşteri',
      dispatchedAt: '2026-07-13T10:00:00.000Z',
      items: [
        { sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceOrderNo: 'SOR-000001', sourceLineId: 'line-1', demandId: 'sales-good', demandCode: 'PLN-000001', itemKey: 'item-sales-good', productId: 'product-1', variantId: 'variation-1', productName: 'Aynı Ürün', variantCode: 'SVR-000001', shippedQty: 5 },
        { sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceOrderNo: 'SOR-000001', sourceLineId: 'line-2', demandId: 'sales-good-2', demandCode: 'PLN-000002', itemKey: 'item-sales-good-2', productId: 'product-1', variantId: 'variation-2', productName: 'Aynı Ürün', variantCode: 'SVR-000002', shippedQty: 7 }
      ],
      parts: [{ source: 'part', refId: 'ref-sales-good', code: 'PRC-000001', name: 'Sevk Parçası', unit: 'ADET', shippedQty: 30, allocations: [] }]
    }],
    montageJobDispatches: [{ id: 'legacy-1', sentQty: 99, productName: 'LEGACY_SECRET' }],
    stockDepotItems: [], stock_movements: [], workOrderTransactions: []
  };
  const demandById = new Map(data.planningDemands.map((row) => [row.id, row]));
  const strictSalesCalls = [];
  const jobs = data.planningDemands.map((demand) => ({
    key: `job-${demand.id}`,
    demandId: demand.id,
    itemKey: `item-${demand.id}`,
    sourceTypeKey: demand.sourceType,
    requestedQty: demand.id === 'sales-good' ? 20 : 10,
    productName: demand.id === 'sales-good' ? 'Satış Ürünü' : (demand.id === 'stock-good' ? 'Stok Ürünü' : (demand.id === 'stock-empty' ? 'Plansız Ürün' : `Ürün ${demand.id}`)),
    variantCode: demand.id === 'sales-good' ? 'SVR-000001' : (demand.id === 'stock-empty' ? 'SVR-000003' : 'SVR-000002'),
    montageCardId: demand.id === 'sales-good' ? 'montage-1' : '',
    montageCardCode: demand.id === 'sales-good' ? 'MON-000001' : '',
    partRows: [{ source: 'part', refId: `ref-${demand.id}`, code: demand.id === 'sales-good' ? 'PRC-000001' : 'PRC-000002', name: 'Parça', requiredQty: 20 }]
  }));
  const StockModule = {
    isSalesDemandReleasedForMontageReady: (demand) => {
      strictSalesCalls.push(demand.id);
      const linked = Array.isArray(demand.workOrderIds) ? demand.workOrderIds : [];
      return demand.status === 'RELEASED' && !!demand.released_at && linked.some((id) => data.workOrders.some((row) => row.id === id));
    },
    buildMontageReadyJobCards: () => jobs,
    getMontageReadyPlanRows: (filteredJobs) => filteredJobs.map((job) => {
      const demand = demandById.get(job.demandId);
      const isSales = demand.sourceType === 'SALES_ORDER';
      const shipmentStatus = String(data.montageDispatchShipments[0]?.status || '').trim().toUpperCase();
      const isSalesJob = job.demandId === 'sales-good';
      const partSummary = { parts: [{ name: 'Merkezi Parça', code: job.partRows[0].code, requiredQty: 20, physicalQty: 50, activeReservedCurrentJobQty: job.demandId === 'sales-good' ? 15 : 0 }] };
      return {
        key: `row-${job.demandId}`, jobs: [job], sourceTypeKey: demand.sourceType,
        sourceTypeLabel: isSales ? 'Satış Siparişi' : 'Stok İçin Üretim',
        sorCodeText: isSales ? demand.sourceOrderNo : '-', plnCodeText: demand.demandCode,
        productSummary: '1 çeşit ürün', dueDaysText: isSales ? '7 gün' : '-', dueDate: demand.dueDate,
        requiredQty: job.demandId === 'sales-good' ? 280 : 20,
        physicalReadyQty: job.demandId === 'sales-good' ? 265 : 20,
        activePlanReservedQty: 0,
        inTransitCoverageQty: isSalesJob && shipmentStatus === 'IN_TRANSIT' ? 15 : 0,
        receivedCoverageQty: isSalesJob && shipmentStatus === 'RECEIVED' ? 15 : 0,
        hasInTransitShipment: isSalesJob && shipmentStatus === 'IN_TRANSIT',
        hasReceivedShipment: isSalesJob && shipmentStatus === 'RECEIVED',
        freeReadyQty: job.demandId === 'sales-good' ? 265 : 20,
        realMissingQty: job.demandId === 'sales-good' ? 15 : 0,
        displayRealMissingQty: 0,
        searchText: `${demand.sourceOrderNo || ''} ${demand.demandCode} ${job.productName} ${job.variantCode}`,
        partSummary
      };
    }),
    getMontageReadyDetailOrderRows: (planRow) => {
      const job = planRow.jobs[0];
      return [{
        key: `line-${job.demandId}`,
        productName: job.productName, svrCode: job.variantCode, qty: job.requestedQty,
        activePlanReservedQty: job.demandId === 'sales-good' ? 15 : 0,
        sourceType: demandById.get(job.demandId)?.sourceType,
        sourceOrderId: demandById.get(job.demandId)?.sourceOrderId,
        sourceLineId: demandById.get(job.demandId)?.sourceLineId,
        demandId: job.demandId, itemKey: job.itemKey, montageJobKey: job.key, diameter: '40', accessoryColor: 'Parlak',
        tubeColor: 'Parlak', plexiColor: 'Şeffaf', bubble: 'Kabarcıksız', lowerTubeLength: '150 MM',
        cardType: 'SVR', cardCode: job.variantCode, cardId: 'card-1', productId: 'product-1', variationId: 'variation-1'
      }];
    },
    getMontageShipmentReceivedQtyForLine: (item) => {
      const sourceType = String(item?.sourceType || '').trim().toUpperCase();
      const lineKey = sourceType === 'SALES_ORDER'
        ? `${sourceType}|${String(item?.sourceOrderId || '').trim()}|${String(item?.sourceLineId || '').trim()}`
        : (sourceType === 'STOCK'
          ? `${sourceType}|${String(item?.demandId || '').trim()}|${String(item?.itemKey || '').trim()}`
          : '');
      if (!lineKey || lineKey.endsWith('|')) return 0;
      const getKey = (row) => {
        const type = String(row?.sourceType || '').trim().toUpperCase();
        if (type === 'SALES_ORDER') return `${type}|${String(row?.sourceOrderId || '').trim()}|${String(row?.sourceLineId || '').trim()}`;
        if (type === 'STOCK') return `${type}|${String(row?.demandId || '').trim()}|${String(row?.itemKey || '').trim()}`;
        return '';
      };
      return data.montageDispatchShipments
        .filter((shipment) => String(shipment?.status || '').trim().toUpperCase() === 'RECEIVED')
        .flatMap((shipment) => Array.isArray(shipment?.items) ? shipment.items : [])
        .filter((shipmentItem) => getKey(shipmentItem) === lineKey)
        .reduce((sum, shipmentItem) => sum + Math.max(0, Number(shipmentItem?.shippedQty || 0)), 0);
    },
    getMontageCompletionTransferredQtyForLine: () => 0,
    getMontageReadyForShipmentQtyForLine: () => 0,
    getMontageCompletionAvailabilityForLine: () => ({
      ok: false,
      availableQty: 0,
      message: 'Bu satırdaki eski sevk miktarları güvenli ürün reçetesi snapshot’ı taşımıyor.'
    }),
    isMontageCompletionTransferLocked: () => false,
    postMontageCompletionToDepot: async () => false,
    getMontageReadyPartSummary: (planRow) => planRow.partSummary,
    openMontageReadyProductCard: (...args) => {
      productCardArgs = args;
      Modal.open(`Ürün Kartı - ${args[0]}`, '<div>Salt okunur ürün kartı</div>', { closeExisting: false });
    },
    receiveMontageDispatchShipment: (shipmentId) => { receivedShipmentId = String(shipmentId || ''); }
  };
  const Modal = {
    open: (title, html, options = {}) => {
      if (options.closeExisting !== false) modalStack.length = 0;
      modalHtml = String(html || '');
      modalStack.push({ title: String(title || ''), html: modalHtml });
    },
    close: () => { modalStack.pop(); }
  };
  const ReadOnlyViewer = {
    openCardByRef: (ref) => {
      openedPartRef = { ...ref };
      Modal.open(`ID Detay - ${ref.code}`, '<div>Parça kartı</div>', { closeExisting: false });
      return { ok: true, type: 'COMPONENT' };
    }
  };
  const printWindow = {
    document: {
      open: () => {},
      write: (html) => { printHtml = String(html || ''); },
      close: () => {}
    },
    focus: () => {},
    print: () => { printCount += 1; }
  };
  const { exported: UnitModule, context } = loadModule('src/modules/unit-module.js', 'UnitModule', {
    DB: { data: { data } },
    StockModule,
    PlanningModule: { openReleasedDemandTrackingModal: (demandId) => { productionStatusDemandId = String(demandId || ''); } },
    MontageLibraryModule: { previewRow: (rowId) => { montagePreviewId = String(rowId || ''); } },
    ReadOnlyViewer,
    Modal,
    UI: { renderCurrentPage: () => { renderCount += 1; } },
    alert: (message) => alerts.push(String(message || '')),
    window: { open: () => printWindow },
    setTimeout: (fn) => fn()
  });
  return {
    UnitModule,
    StockModule,
    context,
    data,
    strictSalesCalls,
    get productionStatusDemandId() { return productionStatusDemandId; },
    get productCardArgs() { return productCardArgs; },
    get montagePreviewId() { return montagePreviewId; },
    get openedPartRef() { return openedPartRef; },
    get receivedShipmentId() { return receivedShipmentId; },
    get printHtml() { return printHtml; },
    get printCount() { return printCount; },
    alerts,
    modalStack,
    Modal,
    get modalHtml() { return modalHtml; },
    get renderCount() { return renderCount; }
  };
}

test('Montaj Isleri yalniz RELEASED ve gercek WO bulunan SALES_ORDER/STOCK islerini listeler', () => {
  const harness = buildMontageJobsReadonlyHarness();
  const before = JSON.stringify(harness.data);
  const rows = harness.UnitModule.getMontageJobsReadonlyRows();
  assert.deepEqual(Array.from(rows, (row) => row.key).sort(), ['row-sales-good', 'row-stock-empty', 'row-stock-good']);
  assert.ok(harness.strictSalesCalls.includes('sales-good'));
  assert.ok(harness.strictSalesCalls.includes('sales-no-wo'));
  assert.ok(harness.strictSalesCalls.includes('sales-draft'));
  assert.equal(rows.find((row) => row.key === 'row-sales-good').montageStatus, 'Montaja Sevk Edildi / Teslim Alınmayı Bekliyor');
  assert.equal(rows.find((row) => row.key === 'row-sales-good').montageStatusKey, 'IN_TRANSIT');
  assert.equal(rows.find((row) => row.key === 'row-stock-good').montageStatus, 'Gönderim Planlandı');
  assert.equal(rows.find((row) => row.key === 'row-stock-good').montageStatusKey, 'DRAFT');
  assert.equal(rows.find((row) => row.key === 'row-stock-empty').montageStatus, '');
  assert.equal(rows.find((row) => row.key === 'row-stock-empty').montageStatusKey, '');

  const container = { innerHTML: '' };
  harness.UnitModule.state.workOrderSearch = '';
  harness.UnitModule.renderMontageJobsReadonly(container, 'u3');
  assert.match(container.innerHTML, /SOR-000001/);
  assert.match(container.innerHTML, /PLN-000002/);
  assert.match(container.innerHTML, /PLN-000003/);
  assert.match(container.innerHTML, /background:#ecfdf5; border:1px solid #86efac; color:#166534;/);
  assert.match(container.innerHTML, /Gönderim Planlandı/);
  assert.doesNotMatch(container.innerHTML, /Malzeme Bekliyor/);
  const blankStatusRow = Array.from(container.innerHTML.matchAll(/<tr style="border-bottom:1px solid #f1f5f9;">([\s\S]*?)<\/tr>/g))
    .map((match) => match[0])
    .find((rowHtml) => rowHtml.includes('PLN-000003'));
  assert.ok(blankStatusRow);
  assert.match(blankStatusRow, /<td style="padding:0.7rem;"><\/td>/);
  assert.doesNotMatch(container.innerHTML, /SOR-NO-WO|SOR-DRAFT|PLN-STOCK-NO-WO|LEGACY_SECRET/);
  assert.doesNotMatch(container.innerHTML, /takeMontageDispatch|addMontageDispatchCompletion|Tamamlandı Gir/);

  harness.UnitModule.state.workOrderSearch = 'stok ürünü';
  harness.UnitModule.renderMontageJobsReadonly(container, 'u3');
  assert.match(container.innerHTML, /PLN-000002/);
  assert.doesNotMatch(container.innerHTML, /SOR-000001/);
  assert.equal(JSON.stringify(harness.data), before);
});

test('Montaj Isleri ana listesi RECEIVED sevki DRAFT plandan once gosterir', () => {
  const harness = buildMontageJobsReadonlyHarness();
  harness.data.montageDispatchShipments[0].status = 'RECEIVED';
  harness.data.montageDispatchShipments[0].receivedAt = '2026-07-13T11:00:00.000Z';
  const row = harness.UnitModule.getMontageJobsReadonlyRows().find((item) => item.key === 'row-sales-good');
  assert.equal(row.montageStatusKey, 'RECEIVED');
  assert.equal(row.montageStatus, 'Teslim Alındı');
  assert.match(row.montageStatusStyle, /background:#f1f5f9/);
  assert.doesNotMatch(row.montageStatusStyle, /#ecfdf5|#86efac|#166534/);
  assert.equal(row.inTransitCoverageQty, 0);
  assert.equal(row.receivedCoverageQty, 15);
  const container = { innerHTML: '' };
  harness.UnitModule.renderMontageJobsReadonlyDetail(container, { id: 'u3', name: 'Montaj' }, row);
  assert.match(container.innerHTML, /Montajda teslim alınan parça[\s\S]*15/);
  assert.match(container.innerHTML, /Genel durum[\s\S]*Teslim Alındı/);
  assert.match(container.innerHTML, /Teslim Alındı<\/span>/);
  assert.match(container.innerHTML, /<button[^>]*disabled[^>]*>Teslim Alındı<\/button>/);
  assert.doesNotMatch(container.innerHTML, /receiveMontageIncomingShipment\('shipment-1'\)/);
  assert.match(container.innerHTML, /data-montage-work-counter="received" data-value="5"[\s\S]*Montaja gelen/);
  assert.match(container.innerHTML, /data-montage-work-counter="in-montage" data-value="5"[\s\S]*Montajda/);
  assert.match(container.innerHTML, /data-montage-work-counter="depot-given" data-value="0"[\s\S]*Depoya verilen/);
});

test('Montaj Is Detayi urun sayaclari yalniz RECEIVED ve guvenilir satir anahtarini kullanir', () => {
  const harness = buildMontageJobsReadonlyHarness();
  harness.data.montageDispatchShipments = [
    {
      id: 'received-sor-1', status: 'RECEIVED', targetUnitId: 'u3', items: [
        { sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-svr-2', productId: 'product-1', variantId: 'variation-2', variantCode: 'SVR-000002', shippedQty: 5 },
        { sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-svr-1', productId: 'product-1', variantId: 'variation-1', variantCode: 'SVR-000001', shippedQty: 7 }
      ]
    },
    {
      id: 'in-transit-same-line', status: 'IN_TRANSIT', targetUnitId: 'u3', items: [
        { sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-svr-2', variantCode: 'SVR-000002', shippedQty: 30 }
      ]
    },
    {
      id: 'received-other-order', status: 'RECEIVED', targetUnitId: 'u3', items: [
        { sourceType: 'SALES_ORDER', sourceOrderId: 'order-other', sourceLineId: 'line-other', variantCode: 'SVR-000002', shippedQty: 99 }
      ]
    },
    {
      id: 'received-stock', status: 'RECEIVED', targetUnitId: 'u3', items: [
        { sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-1', variantCode: 'SVR-STOCK', shippedQty: 4 },
        { sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-2', variantCode: 'SVR-STOCK', shippedQty: 40 }
      ]
    }
  ];
  const baseRows = [
    { key: 'row-svr-2', sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-svr-2', demandId: 'demand-svr-2', itemKey: 'item-svr-2', productId: 'product-1', variationId: 'variation-2', productName: 'Ürün 2', svrCode: 'SVR-000002', qty: 15 },
    { key: 'row-svr-1', sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-svr-1', demandId: 'demand-svr-1', itemKey: 'item-svr-1', productId: 'product-1', variationId: 'variation-1', productName: 'Ürün 1', svrCode: 'SVR-000001', qty: 20 },
    { key: 'row-empty', sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-empty', demandId: 'demand-empty', itemKey: 'item-empty', productName: 'Sevksiz Ürün', svrCode: 'SVR-000002', qty: 3 }
  ];
  const productRows = baseRows.map((row) => ({
    ...row,
    montageReceivedQty: harness.UnitModule.getMontageReceivedQtyForProductRow(row)
  }));
  const stockQty = harness.UnitModule.getMontageReceivedQtyForProductRow({
    sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-1'
  });
  assert.deepEqual(Array.from(productRows, (row) => row.montageReceivedQty), [5, 7, 0]);
  assert.equal(stockQty, 4);

  const before = JSON.stringify(harness.data);
  const container = { innerHTML: '' };
  harness.UnitModule.renderMontageJobsReadonlyDetail(container, { id: 'u3', name: 'Montaj' }, {
    key: 'sor-000001-detail', productRows, incomingShipments: []
  });
  const getRowHtml = (key) => container.innerHTML.match(new RegExp(`<tr data-montage-work-row="${key}"[\\s\\S]*?<\\/tr>`))?.[0] || '';
  const svr2Html = getRowHtml('row-svr-2');
  const svr1Html = getRowHtml('row-svr-1');
  const emptyHtml = getRowHtml('row-empty');
  assert.match(svr2Html, /data-montage-work-counter="received" data-value="5"[\s\S]*data-montage-work-counter="in-montage" data-value="5"[\s\S]*data-montage-work-counter="depot-given" data-value="0"/);
  assert.match(svr1Html, /data-montage-work-counter="received" data-value="7"[\s\S]*data-montage-work-counter="in-montage" data-value="7"[\s\S]*data-montage-work-counter="depot-given" data-value="0"/);
  assert.match(emptyHtml, /data-montage-work-counter="received" data-value="0"[\s\S]*data-montage-work-counter="in-montage" data-value="0"[\s\S]*data-montage-work-counter="depot-given" data-value="0"/);
  assert.match(container.innerHTML, /Tamamlanan adet/);
  assert.match(container.innerHTML, /<input[^>]*data-montage-completion-qty[^>]*disabled/);
  assert.match(container.innerHTML, /<button[^>]*disabled[^>]*>Depoya Ver<\/button>/);
  assert.match(container.innerHTML, /Depoya verilebilir güvenilir miktar yok/);
  assert.equal(JSON.stringify(harness.data), before);
});

test('Montaj Is Detayi yalniz guvenilir snapshot kapasitesinde Depoya Ver girisini acar', () => {
  const harness = buildMontageJobsReadonlyHarness();
  harness.StockModule.getMontageCompletionAvailabilityForLine = (item) => (
    String(item?.sourceLineId || '') === 'line-1'
      ? { ok: true, availableQty: 1, message: '' }
      : { ok: false, availableQty: 0, message: 'Güvenilir reçete snapshot’ı yok.' }
  );
  const detailRow = harness.UnitModule.getMontageJobsReadonlyRows().find((row) => row.key === 'row-sales-good');
  const container = { innerHTML: '' };
  harness.UnitModule.renderMontageJobsReadonlyDetail(container, { id: 'u3', name: 'Montaj' }, detailRow);
  const productHtml = container.innerHTML.match(/<tr data-montage-work-row="line-sales-good"[\s\S]*?<\/tr>/)?.[0] || '';
  assert.match(productHtml, /data-montage-completion-qty[^>]*max="1"/);
  assert.doesNotMatch(productHtml, /data-montage-completion-qty[^>]*disabled/);
  assert.match(productHtml, /postMontageCompletionForProductRow\('line-sales-good'\)/);
  assert.match(productHtml, />Depoya Ver<\/button>/);
  assert.match(productHtml, /En fazla 1 adet/);
});

test('Montaj Isleri detayi operasyon bilgisini read-only gosterir ve koleksiyonlari degistirmez', () => {
  const harness = buildMontageJobsReadonlyHarness();
  const before = JSON.stringify(harness.data);
  const container = { innerHTML: '' };
  harness.UnitModule.state.workOrderSearch = '';
  harness.UnitModule.state.montageJobsDetailKey = '';
  harness.UnitModule.renderMontageJobsReadonly(container, 'u3');

  harness.UnitModule.openMontageJobReadonlyDetail('row-sales-good');
  assert.equal(harness.UnitModule.state.montageJobsDetailKey, 'row-sales-good');
  assert.equal(harness.renderCount, 1);
  harness.UnitModule.renderMontageJobsReadonly(container, 'u3');
  const html = container.innerHTML;
  assert.match(html, /Örnek Müşteri/);
  assert.match(html, /2026-07-20/);
  assert.match(html, /Montaj Sevkiyat Adresi/);
  assert.match(html, /Etiket ve paketleme notu/);
  assert.match(html, /Operasyon sipariş notu/);
  const leftSummaryStart = html.indexOf('data-montage-job-detail-summary-card="order-delivery"');
  const rightSummaryStart = html.indexOf('data-montage-job-detail-summary-card="work-plan"');
  const orderLinesStart = html.indexOf('Sipariş Satırları');
  const leftSummaryHtml = html.slice(leftSummaryStart, rightSummaryStart);
  const rightSummaryHtml = html.slice(rightSummaryStart, orderLinesStart);
  assert.equal((html.match(/data-montage-job-detail-summary-card=/g) || []).length, 2);
  assert.match(html, /data-montage-job-detail-summary-grid="true"[^>]*display:flex[^>]*flex-wrap:wrap/);
  assert.match(html, /Sipariş ve Teslimat Bilgileri/);
  assert.doesNotMatch(html, /Müşteri \/ Sipariş Bilgileri|>Teslimat Bilgileri</);
  assert.match(html, /İş Planı Bilgileri/);
  assert.match(leftSummaryHtml, /Örnek Müşteri/);
  assert.match(leftSummaryHtml, /Sevkiyat veya teslimat adresi[\s\S]*Montaj Sevkiyat Adresi/);
  assert.match(leftSummaryHtml, /Sipariş \/ teslim tarihi[\s\S]*2026-07-01/);
  assert.match(leftSummaryHtml, /Planlanan tarih[\s\S]*2026-07-20/);
  assert.match(leftSummaryHtml, /Sevkiyata kalan gün[\s\S]*7 gün/);
  assert.match(leftSummaryHtml, /SOR kodu[\s\S]*SOR-000001/);
  assert.match(leftSummaryHtml, /PLN kodu[\s\S]*PLN-000001/);
  assert.match(leftSummaryHtml, /Teslimat \/ sevkiyat notu[\s\S]*Etiket ve paketleme notu/);
  assert.match(leftSummaryHtml, /Paketleme \/ sevkiyat notu[\s\S]*Operasyon sipariş notu/);
  assert.match(leftSummaryHtml, /Ürün çeşidi:[\s\S]*1 çeşit ürün/);
  assert.match(leftSummaryHtml, /Toplam ürün adedi:<\/span> <strong>20<\/strong>/);
  assert.match(leftSummaryHtml, /overflow-wrap:anywhere/);
  assert.doesNotMatch(leftSummaryHtml, /Genel toplam parça|Kullanılan hazır parça|Aktif planlanan parça|Sevkiyata ayrılan parça|Gerçek eksik parça/);
  assert.match(rightSummaryHtml, /Kaynak tipi[\s\S]*Genel toplam parça[\s\S]*Kullanılan hazır parça[\s\S]*Aktif planlanan parça[\s\S]*Sevkiyata ayrılan parça[\s\S]*Montajda teslim alınan parça[\s\S]*Beklenen \/ eksik parça[\s\S]*Gerçek eksik parça[\s\S]*Genel durum/);
  assert.match(rightSummaryHtml, /Genel toplam parça[\s\S]*?>280<\/div>[\s\S]*Kullanılan hazır parça[\s\S]*?>265<\/div>[\s\S]*Aktif planlanan parça[\s\S]*?>0<\/div>[\s\S]*Sevkiyata ayrılan parça[\s\S]*?>15<\/div>[\s\S]*Montajda teslim alınan parça[\s\S]*?>0<\/div>[\s\S]*Beklenen \/ eksik parça[\s\S]*?>15<\/div>[\s\S]*Gerçek eksik parça[\s\S]*?>0<\/div>/);
  assert.match(html, /Montaja Sevk Edildi \/ Teslim Alınmayı Bekliyor/);
  assert.match(html, /Sipariş Satırları/);
  assert.match(html, /data-montage-order-lines-table="balanced"[^>]*min-width:2030px[^>]*table-layout:fixed/);
  assert.match(html, /<colgroup>[\s\S]*width:320px[\s\S]*width:68px[\s\S]*width:220px[\s\S]*width:220px[\s\S]*width:160px[\s\S]*width:90px[\s\S]*width:160px[\s\S]*width:70px[\s\S]*data-montage-order-lines-status[^>]*width:470px[\s\S]*width:250px/);
  assert.match(html, /data-montage-order-lines-status/);
  assert.match(html, /data-montage-order-product-name[^>]*-webkit-line-clamp:2[^>]*overflow-wrap:anywhere/);
  assert.match(html, /data-montage-status-inline[^>]*display:flex[^>]*flex-wrap:wrap[\s\S]*data-montage-completion-controls[\s\S]*Tamamlanan adet[\s\S]*Depoya Ver[\s\S]*Montaja gelen[\s\S]*Montajda[\s\S]*Depoya verilen/);
  assert.doesNotMatch(html, /data-montage-order-lines-table="balanced"[^>]*grid-template-columns|data-montage-order-lines-table="balanced"[^>]*justify-content:space-between/);
  assert.match(html, /Aksesuar rengi|AKSESUAR RENGİ/i);
  assert.match(html, /Alt boru uzunluğu/i);
  assert.match(html, /Sipariş Akışını Görüntüle/);
  assert.doesNotMatch(html, /Üretim Durumunu Görüntüle/);
  assert.match(html, /Ürün Kartı/);
  assert.match(html, />Montaj Kartı<\/button>/);
  const productNameIndex = html.indexOf('Satış Ürünü');
  const montageCardButtonIndex = html.indexOf('>Montaj Kartı</button>', productNameIndex);
  const productCellEndIndex = html.indexOf('</td>', productNameIndex);
  assert.ok(productNameIndex >= 0 && montageCardButtonIndex > productNameIndex && montageCardButtonIndex < productCellEndIndex);
  assert.match(html, /MONTAJA GELEN SEVKİYATLAR/);
  assert.match(html, /MGS-000001/);
  assert.match(html, /Sevkte \/ Teslim Alınmayı Bekliyor/);
  assert.match(html, /Parça Listesi/);
  assert.match(html, /receiveMontageIncomingShipment\('shipment-1'\)/);
  assert.match(html, />Teslim Al<\/button>/);
  assert.doesNotMatch(html, /Parça Durumu|Merkezi Parça|PRC-000001/);
  assert.doesNotMatch(html, /GIZLI_BIRIM_FIYAT|GIZLI_ISKONTO|GIZLI_ODEME|GIZLI_MALIYET|GIZLI_KAR|GIZLI_CARI_BAKIYE/);
  assert.doesNotMatch(html.toLocaleLowerCase('tr-TR'), /birim fiyat|iskonto|ödeme şekli|maliyet|kâr|cari bakiye/);
  assert.doesNotMatch(html, /takeMontageDispatch|addMontageDispatchCompletion|Planlamayı Kaydet|Montaja Gönderim Planları|Montaja Gönder|Montajdan Teslim Al|Montajı Tamamla|Depoya Gönder|Vazgeç|type="checkbox"/);

  harness.UnitModule.openMontageJobReadonlyProductionStatus('sales-good');
  assert.equal(harness.productionStatusDemandId, 'sales-good');
  harness.UnitModule.receiveMontageIncomingShipment('shipment-1');
  assert.equal(harness.receivedShipmentId, 'shipment-1');
  harness.UnitModule.openMontageJobReadonlyProductCard('SVR-000001', 'card-1', 'SVR', 'product-1', 'variation-1');
  assert.deepEqual(Array.from(harness.productCardArgs), ['SVR-000001', 'card-1', 'SVR', 'product-1', 'variation-1']);
  harness.UnitModule.openMontageJobReadonlyMontageCard('montage-1', 'MON-000001');
  assert.equal(harness.montagePreviewId, 'montage-1');
  harness.UnitModule.openMontageIncomingShipmentParts('shipment-1');
  assert.match(harness.modalHtml, /Aynı Ürün/);
  assert.match(harness.modalHtml, /SVR-000001/);
  assert.match(harness.modalHtml, /openMontageIncomingShipmentProductCard\('product-1','variation-1','SVR-000001'\)/);
  assert.match(harness.modalHtml, /openMontageIncomingShipmentProductCard\('product-1','variation-2','SVR-000002'\)/);
  assert.match(harness.modalHtml, /Sevk Parçası/);
  assert.match(harness.modalHtml, /PRC-000001/);
  assert.match(harness.modalHtml, /ADET/);
  assert.match(harness.modalHtml, /printMontageIncomingShipmentParts\('shipment-1'\)/);
  assert.match(harness.modalHtml, />Yazdır<\/button>/);
  assert.equal(harness.modalStack.length, 1);

  harness.UnitModule.openMontageIncomingShipmentProductCard('product-1', 'variation-2', 'SVR-000002');
  assert.deepEqual(Array.from(harness.productCardArgs), ['SVR-000002', 'variation-2', 'SVR', 'product-1', 'variation-2']);
  assert.equal(harness.modalStack.length, 2);
  assert.match(harness.modalStack[1].title, /Ürün Kartı - SVR-000002/);
  harness.Modal.close();
  assert.equal(harness.modalStack.length, 1);
  assert.match(harness.modalStack[0].title, /Parça Listesi - MGS-000001/);

  harness.UnitModule.openMontageIncomingShipmentProductCard('product-1', 'variation-1', 'SVR-000001');
  assert.deepEqual(Array.from(harness.productCardArgs), ['SVR-000001', 'variation-1', 'SVR', 'product-1', 'variation-1']);
  harness.Modal.close();

  harness.UnitModule.openMontageIncomingShipmentProductCard('', '', 'SVR-000002');
  assert.deepEqual(Array.from(harness.productCardArgs), ['SVR-000002', 'variation-2', 'SVR', 'product-1', 'variation-2']);
  harness.Modal.close();

  harness.UnitModule.printMontageIncomingShipmentParts('shipment-1');
  assert.equal(harness.printCount, 1);
  assert.match(harness.printHtml, /Montaj Sevk \/ Teslim Kontrol Listesi/);
  assert.match(harness.printHtml, /MGS-000001/);
  assert.match(harness.printHtml, /MGP-000001/);
  assert.match(harness.printHtml, /SOR-000001/);
  assert.match(harness.printHtml, /PLN-000001, PLN-000002/);
  assert.match(harness.printHtml, /Örnek Müşteri/);
  assert.match(harness.printHtml, /Aynı Ürün[\s\S]*SVR-000001[\s\S]*?>5<\/td>/);
  assert.match(harness.printHtml, /Aynı Ürün[\s\S]*SVR-000002[\s\S]*?>7<\/td>/);
  assert.match(harness.printHtml, /Sevk Parçası[\s\S]*PRC-000001[\s\S]*?>30<\/td>[\s\S]*ADET/);
  assert.equal((harness.printHtml.match(/class="check-box"/g) || []).length, 3);
  assert.match(harness.printHtml, /class="note-line"/);
  assert.doesNotMatch(harness.printHtml, /GIZLI_BIRIM_FIYAT|GIZLI_ISKONTO|GIZLI_ODEME|GIZLI_MALIYET|GIZLI_KAR|GIZLI_CARI_BAKIYE/);

  harness.UnitModule.openMontageIncomingShipmentPartCard('ref-sales-good', '', 'PRC-000001');
  assert.deepEqual(harness.openedPartRef, { type: 'COMPONENT', id: 'ref-sales-good', code: 'PRC-000001' });
  assert.equal(harness.modalStack.length, 2);
  assert.match(harness.modalStack[1].title, /ID Detay - PRC-000001/);
  harness.Modal.close();
  assert.equal(harness.modalStack.length, 1);
  assert.match(harness.modalStack[0].title, /Parça Listesi - MGS-000001/);

  harness.UnitModule.backToMontageJobsReadonlyList();
  assert.equal(harness.UnitModule.state.montageJobsDetailKey, '');
  assert.equal(harness.renderCount, 2);
  assert.equal(JSON.stringify(harness.data), before);
});

test('Montaj sevk parca kodu eksik veya celiskili karti acmaz', () => {
  const harness = buildMontageJobsReadonlyHarness();
  harness.data.partComponentCards.push({ id: 'duplicate-part', code: 'PRC-000001', name: 'Başka Parça' });
  harness.UnitModule.openMontageIncomingShipmentPartCard('', '', 'PRC-000001');
  assert.equal(harness.openedPartRef, null);
  assert.ok(harness.alerts.includes('Parça kartı güvenilir şekilde bulunamadı.'));

  const missingHarness = buildMontageJobsReadonlyHarness();
  missingHarness.UnitModule.openMontageIncomingShipmentPartCard('', '', 'PRC-999999');
  assert.equal(missingHarness.openedPartRef, null);
  assert.ok(missingHarness.alerts.includes('Parça kartı güvenilir şekilde bulunamadı.'));
});

test('Montaj sevk SVR kodu eksik veya celiskili urun kartini acmaz', () => {
  const pairHarness = buildMontageJobsReadonlyHarness();
  pairHarness.data.salesCatalogProducts.push({ id: 'product-2', productCode: 'SAL-000002', name: 'Aynı Ürün' });
  pairHarness.data.salesProductVariants.push({ id: 'variation-1', sourceCatalogProductId: 'product-2', variantCode: 'SVR-000099' });
  pairHarness.UnitModule.openMontageIncomingShipmentProductCard('product-1', 'variation-1', 'SVR-000001');
  assert.deepEqual(Array.from(pairHarness.productCardArgs), ['SVR-000001', 'variation-1', 'SVR', 'product-1', 'variation-1']);

  const conflictHarness = buildMontageJobsReadonlyHarness();
  conflictHarness.data.salesProductVariants.push({ id: 'variation-duplicate', sourceCatalogProductId: 'product-1', variantCode: 'SVR-000001' });
  conflictHarness.UnitModule.openMontageIncomingShipmentProductCard('', '', 'SVR-000001');
  assert.deepEqual(Array.from(conflictHarness.productCardArgs), []);
  assert.ok(conflictHarness.alerts.includes('Ürün kartı güvenilir şekilde bulunamadı.'));

  const mismatchHarness = buildMontageJobsReadonlyHarness();
  mismatchHarness.UnitModule.openMontageIncomingShipmentProductCard('wrong-product', 'variation-1', 'SVR-000001');
  assert.deepEqual(Array.from(mismatchHarness.productCardArgs), []);
  assert.ok(mismatchHarness.alerts.includes('Ürün kartı güvenilir şekilde bulunamadı.'));

  const missingHarness = buildMontageJobsReadonlyHarness();
  missingHarness.UnitModule.openMontageIncomingShipmentProductCard('', '', 'SVR-999999');
  assert.deepEqual(Array.from(missingHarness.productCardArgs), []);
  assert.ok(missingHarness.alerts.includes('Ürün kartı güvenilir şekilde bulunamadı.'));
});

test('Montaj Isleri detayi kart baglantisi yoksa tahmin yapmaz', () => {
  const harness = buildMontageJobsReadonlyHarness();
  const row = harness.UnitModule.getMontageJobsReadonlyRows().find((item) => item.key === 'row-stock-good');
  const container = { innerHTML: '' };
  harness.UnitModule.renderMontageJobsReadonlyDetail(container, { id: 'u3', name: 'Montaj' }, row);
  assert.match(container.innerHTML, /Montaj kartı tanımlı değil/);
  assert.equal(harness.montagePreviewId, '');
  harness.data.montageCards.push({ id: 'montage-2', cardCode: 'MON-000001', productName: 'Başka Ürün' });
  assert.equal(harness.UnitModule.resolveMontageJobReadonlyCard('', 'MON-000001').status, 'conflict');
});

test('Montaj stok uygunlugu canonical origin sahibinden bagimsiz ortak havuzu ve guvenilir serbest stogu kullanir', () => {
  const harness = buildMontagePlanHarness();
  const { StockModule, context } = harness;
  const allocation = {
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-id-1',
    sourceLineId: 'sor-line-1'
  };
  const base = {
    productCode: 'PRC-SCOPE', code: 'PRC-SCOPE', quantity: 1, qty: 1,
    stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', depotId: 'main', nodeKey: 'managed:main',
    locationId: 'loc-scope', unit: 'ADET'
  };
  context.DB.data.data.stockDepotItems = [
    { ...base, id: 'same-order-line', quantity: 2, qty: 2, sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-1', sourceLineId: 'sor-line-1', demandId: 'pln-id-1', itemKey: 'pln-item-1' },
    { ...base, id: 'other-order', quantity: 100, qty: 100, sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-2', sourceLineId: 'sor-line-1', demandId: 'pln-id-2', itemKey: 'pln-item-2' },
    { ...base, id: 'other-line', quantity: 100, qty: 100, sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-1', sourceLineId: 'sor-line-2', demandId: 'pln-id-3', itemKey: 'pln-item-3' },
    { ...base, id: 'free', quantity: 3, qty: 3, allocationType: 'FREE' },
    { ...base, id: 'serbest', quantity: 4, qty: 4, stockSource: 'SERBEST' },
    { ...base, id: 'stock', quantity: 5, qty: 5, sourceType: 'STOCK', demandId: 'pln-stock', itemKey: 'pln-stock-item' },
    { ...base, id: 'plan-stock', quantity: 6, qty: 6, sourceKind: 'PLAN_STOCK_SALES' },
    { ...base, id: 'partial-sales-origin', quantity: 100, qty: 100, sourceType: 'SALES_ORDER', sourceOrderId: 'sor-partial' },
    { ...base, id: 'partial-stock-origin', quantity: 100, qty: 100, sourceType: 'STOCK' },
    { ...base, id: 'ambiguous', quantity: 100, qty: 100 },
    { ...base, id: 'reserved', quantity: 100, qty: 100, allocationType: 'FREE', status: 'REZERVE' },
    { ...base, id: 'wip', quantity: 100, qty: 100, allocationType: 'FREE', stockClass: 'WIP' }
  ];

  const readyQty = StockModule.getMontageReadyStockCodeTotals(allocation).get('PRC-SCOPE');
  const dispatchRows = StockModule.getMontageDispatchEligibleStockRows('PRC-SCOPE', allocation);

  assert.equal(readyQty, 220);
  assert.deepEqual(Array.from(dispatchRows, (row) => row.id).sort(), [
    'free', 'other-line', 'other-order', 'plan-stock', 'same-order-line', 'serbest', 'stock'
  ]);
  assert.equal(dispatchRows.reduce((sum, row) => sum + row.qty, 0), readyQty);
});

test('Montaj Faz 5 FROM_STOCK yabanci SALES ve STOCK demand originini reddeder, auditi korur', async () => {
  for (const originType of ['SALES_ORDER', 'STOCK']) {
    const harness = buildMontagePlanHarness({ useRealMontagePreflight: true });
    configureMontagePhase5CExactData(harness, { stockQty: 20 });
    configureMontagePlanSave(harness.StockModule, { plannedQty: 4, sendableQty: 10, orderQty: 10 });
    const stock = harness.context.DB.data.data.stockDepotItems[0];
    delete stock.allocationType;
    if (originType === 'SALES_ORDER') {
      Object.assign(stock, {
        sourceType: 'SALES_ORDER',
        sourceOrderId: 'origin-sor-a',
        sourceLineId: 'origin-line-a',
        demandId: 'origin-pln-a',
        itemKey: 'origin-item-a'
      });
    } else {
      Object.assign(stock, {
        sourceType: 'STOCK',
        demandId: 'origin-stock-pln',
        itemKey: 'origin-stock-item'
      });
      delete stock.sourceOrderId;
      delete stock.sourceLineId;
    }
    const auditBefore = JSON.stringify({
      sourceType: stock.sourceType,
      sourceOrderId: stock.sourceOrderId,
      sourceLineId: stock.sourceLineId,
      demandId: stock.demandId,
      itemKey: stock.itemKey
    });
    const stockBefore = JSON.stringify(harness.context.DB.data.data.stockDepotItems);
    const movementsBefore = JSON.stringify(harness.context.DB.data.data.stock_movements);

    await harness.StockModule.validateMontageReadyDetailSendPlan();

    const expectedPlanCount = 0;
    assert.equal(harness.context.DB.data.data.montageDispatchPlans.length, expectedPlanCount);
    if (expectedPlanCount) {
      assert.equal(harness.context.DB.data.data.montageDispatchPlans[0].status, 'DRAFT');
    }
    assert.equal(harness.saveCount, expectedPlanCount);
    assert.equal(JSON.stringify(harness.context.DB.data.data.stockDepotItems), stockBefore);
    assert.equal(JSON.stringify(harness.context.DB.data.data.stock_movements), movementsBefore);
    assert.equal(JSON.stringify({
      sourceType: stock.sourceType,
      sourceOrderId: stock.sourceOrderId,
      sourceLineId: stock.sourceLineId,
      demandId: stock.demandId,
      itemKey: stock.itemKey
    }), auditBefore);
  }
});

test('Montaj Faz 1 ambiguous stokla UI kapasitesini sifirlar plan ve sevki engeller', async () => {
  const planHarness = buildMontagePlanHarness();
  delete planHarness.context.DB.data.data.stockDepotItems[0].allocationType;
  const allocation = {
    sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-4', sourceLineId: 'sor-line-4'
  };
  assert.equal(planHarness.StockModule.getMontageReadyStockCodeTotals(allocation).get('PRC-A') || 0, 0);

  configureMontagePlanSave(planHarness.StockModule, { plannedQty: 1, sendableQty: 15, orderQty: 50 });
  await planHarness.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(planHarness.context.DB.data.data.montageDispatchPlans.length, 0);
  assert.equal(planHarness.saveCount, 0);

  const draft = createMontageDispatchPlan({ plannedQty: 1, requiredQty: 2 });
  draft.items[0].sourceOrderId = 'sor-id-4';
  draft.items[0].sourceLineId = 'sor-line-4';
  const dispatchHarness = buildMontagePlanHarness({ plans: [draft] });
  delete dispatchHarness.context.DB.data.data.stockDepotItems[0].allocationType;
  await dispatchHarness.StockModule.dispatchMontagePlanToMontage(draft.id);
  assert.equal(dispatchHarness.context.DB.data.data.montageDispatchShipments.length, 0);
  assert.equal(dispatchHarness.saveCount, 0);
});

test('Montaj Faz 5C ayni SOR satirindaki kismi MGPyi korur ve DRAFT asamasinda fiziksel hareket yazmaz', async () => {
  const existing = createMontageDispatchPlan({
    id: 'phase5c-existing',
    planNo: 'MGP-000010',
    plannedQty: 2,
    requiredQty: 4
  });
  const harness = buildMontagePlanHarness({
    plans: [existing],
    useRealMontagePreflight: true
  });
  configureMontagePhase5CExactData(harness, { stockQty: 20 });
  configureMontagePlanSave(harness.StockModule, { plannedQty: 4, sendableQty: 10, orderQty: 10 });
  const stockBefore = JSON.stringify(harness.context.DB.data.data.stockDepotItems);
  const movementsBefore = JSON.stringify(harness.context.DB.data.data.stock_movements);

  await harness.StockModule.validateMontageReadyDetailSendPlan();

  assert.equal(harness.context.DB.data.data.montageDispatchPlans.length, 2, harness.alerts.join(' | '));
  assert.equal(harness.saveCount, 1);
  assert.equal(JSON.stringify(harness.context.DB.data.data.stockDepotItems), stockBefore);
  assert.equal(JSON.stringify(harness.context.DB.data.data.stock_movements), movementsBefore);
});

test('Montaj Faz 5C MGS preflight kendi DRAFT rezervini exact sevk kilidine cevirir ve fiziksel hareket yazmaz', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 6, requiredQty: 12 });
  const harness = buildMontagePlanHarness({
    plans: [plan],
    useRealMontagePreflight: true
  });
  configureMontagePhase5CExactData(harness, { stockQty: 20 });

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  assert.equal(plan.status, 'DISPATCHED_TO_MONTAGE');
  assert.equal(harness.context.DB.data.data.montageDispatchShipments.length, 1);
  assert.equal(harness.context.DB.data.data.stockDepotItems[0].qty, 20);
  assert.equal(harness.context.DB.data.data.stock_movements.length, 0);
  assert.equal(
    harness.context.DB.data.data.montageDispatchShipments[0].stockTransferMode,
    'POST_ON_RECEIPT_V1'
  );
  assert.equal(harness.saveCount, 1);

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);
  assert.equal(harness.context.DB.data.data.montageDispatchShipments.length, 1);
  assert.equal(harness.context.DB.data.data.stock_movements.length, 0);
  assert.equal(harness.saveCount, 1);
});

test('Montaj Faz 5C exact miktar cakismasini engeller ama kalan miktara uyan kismi MGPye izin verir', () => {
  const existing = createMontageDispatchPlan({
    id: 'phase5c-reserved',
    planNo: 'MGP-000020',
    plannedQty: 7,
    requiredQty: 14
  });
  const harness = buildMontagePlanHarness({
    plans: [existing],
    useRealMontagePreflight: true
  });
  configureMontagePhase5CExactData(harness, { stockQty: 20 });
  const baseItem = {
    ...existing.items[0],
    plannedQty: 3
  };
  const before = JSON.stringify(harness.context.DB.data.data);

  const allowed = harness.StockModule.runMontageExactAllocationPreflight({
    items: [baseItem],
    qtyField: 'plannedQty'
  });
  const blocked = harness.StockModule.runMontageExactAllocationPreflight({
    items: [{ ...baseItem, plannedQty: 4 }],
    qtyField: 'plannedQty'
  });

  assert.equal(allowed.ok, true);
  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /exact uygun PRC stok\/WIP miktarı yetersiz/);
  assert.equal(JSON.stringify(harness.context.DB.data.data), before);
});

test('Faz 4 MGP DRAFT exact segment araligini bir kez rezerve eder, yenileme ve iptal deterministiktir', async () => {
  const harness = buildMontagePlanHarness({ useRealMontagePreflight: true });
  configureMontagePhase5CExactData(harness, { stockQty: 20 });
  configureMontagePlanSave(harness.StockModule, { plannedQty: 5, sendableQty: 10, orderQty: 10 });
  const data = harness.context.DB.data.data;
  const physicalBefore = JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchShipments: data.montageDispatchShipments
  });

  await harness.StockModule.validateMontageReadyDetailSendPlan();

  assert.equal(data.montageDispatchPlans.length, 1, harness.alerts.join(' | '));
  const plan = data.montageDispatchPlans[0];
  assert.equal(plan.status, 'DRAFT');
  assert.equal(plan.exactReservations.length, 1);
  assert.deepEqual({
    planId: plan.exactReservations[0].planId,
    demandId: plan.exactReservations[0].demandId,
    itemKey: plan.exactReservations[0].itemKey,
    prcId: plan.exactReservations[0].prcId,
    prcCode: plan.exactReservations[0].prcCode,
    unit: plan.exactReservations[0].unit,
    physicalSegmentId: plan.exactReservations[0].physicalSegmentId,
    sourceBucket: plan.exactReservations[0].sourceBucket,
    start: plan.exactReservations[0].segmentOffsetStart,
    end: plan.exactReservations[0].segmentOffsetEnd,
    qty: plan.exactReservations[0].qty
  }, {
    planId: plan.id,
    demandId: 'pln-id-1',
    itemKey: 'pln-item-1',
    prcId: 'part-ref-a',
    prcCode: 'PRC-A',
    unit: 'ADET',
    physicalSegmentId: 'STOCK|stock-prc-a',
    sourceBucket: 'FROM_STOCK',
    start: 0,
    end: 10,
    qty: 10
  });
  assert.equal(JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchShipments: data.montageDispatchShipments
  }), physicalBefore);

  const firstSnapshot = harness.StockModule.getMontagePlanReservationSnapshot();
  const secondSnapshot = harness.StockModule.getMontagePlanReservationSnapshot();
  assert.equal(firstSnapshot.lineQtyByKey.get('SALES_ORDER|sor-id-1|sor-line-1'), 5);
  assert.equal(firstSnapshot.partQtyByKey.get('part|ref:part-ref-a'), 10);
  assert.equal(JSON.stringify(firstSnapshot.exactReservations), JSON.stringify(secondSnapshot.exactReservations));
  const availability = harness.StockModule.getMontageLineDispatchAvailability(plan.items[0], {
    partCapacityQty: 5,
    resolverAvailability: { trusted: true, allocatable: true, readyQty: 10 },
    requireResolver: true
  });
  assert.equal(availability.draftPlanQty, 5);
  assert.equal(availability.sendableQty, 5);

  const secondFive = harness.StockModule.runMontageExactAllocationPreflight({
    items: [{ ...plan.items[0], plannedQty: 5 }],
    qtyField: 'plannedQty',
    planId: 'phase4-second-five'
  });
  const repeatedSecondFive = harness.StockModule.runMontageExactAllocationPreflight({
    items: [{ ...plan.items[0], plannedQty: 5 }],
    qtyField: 'plannedQty',
    planId: 'phase4-second-five'
  });
  const secondSix = harness.StockModule.runMontageExactAllocationPreflight({
    items: [{ ...plan.items[0], plannedQty: 6 }],
    qtyField: 'plannedQty',
    planId: 'phase4-second-six'
  });
  assert.equal(secondFive.ok, true);
  assert.deepEqual(Array.from(secondFive.exactReservations, (row) => [
    row.physicalSegmentId, row.segmentOffsetStart, row.segmentOffsetEnd, row.qty
  ]), [['STOCK|stock-prc-a', 10, 20, 10]]);
  assert.equal(JSON.stringify(secondFive.exactReservations), JSON.stringify(repeatedSecondFive.exactReservations));
  assert.equal(secondSix.ok, false);
  assert.equal(secondSix.reasonCode, 'MGP_EXACT_SEGMENT_CAPACITY_INSUFFICIENT');
  assert.equal(data.montageDispatchPlans.length, 1);

  const selfCheck = harness.StockModule.runMontageExactAllocationPreflight({
    items: plan.items,
    qtyField: 'plannedQty',
    excludePlanId: plan.id,
    planId: plan.id
  });
  assert.equal(selfCheck.ok, true);
  assert.deepEqual(Array.from(selfCheck.exactReservations, (row) => [
    row.segmentOffsetStart, row.segmentOffsetEnd
  ]), [[0, 10]]);

  await harness.StockModule.cancelMontageDispatchPlan(plan.id);
  assert.equal(plan.status, 'CANCELLED');
  const releasedSnapshot = harness.StockModule.getMontagePlanReservationSnapshot();
  assert.equal(releasedSnapshot.lineQtyByKey.size, 0);
  assert.equal(releasedSnapshot.partQtyByKey.size, 0);
  assert.equal(releasedSnapshot.exactReservations.length, 0);
  const releasedAvailability = harness.StockModule.getMontageLineDispatchAvailability(plan.items[0], {
    partCapacityQty: 10,
    resolverAvailability: { trusted: true, allocatable: true, readyQty: 10 },
    requireResolver: true
  });
  assert.equal(releasedAvailability.sendableQty, 10);
  const saveCountAfterCancel = harness.saveCount;
  await harness.StockModule.cancelMontageDispatchPlan(plan.id);
  assert.equal(harness.saveCount, saveCountAfterCancel);
  assert.equal(JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchShipments: data.montageDispatchShipments
  }), physicalBefore);
});

test('Faz 4 ikinci MGP yalnız kalan exact segment aralığını rezerve eder', async () => {
  const harness = buildMontagePlanHarness({ useRealMontagePreflight: true });
  configureMontagePhase5CExactData(harness, { stockQty: 20 });
  configureMontagePlanSave(harness.StockModule, { plannedQty: 5, sendableQty: 10, orderQty: 10 });
  const data = harness.context.DB.data.data;
  const physicalBefore = JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchShipments: data.montageDispatchShipments
  });

  await harness.StockModule.validateMontageReadyDetailSendPlan();
  configureMontagePlanSave(harness.StockModule, { plannedQty: 5, sendableQty: 5, orderQty: 10 });
  await harness.StockModule.validateMontageReadyDetailSendPlan();

  assert.equal(data.montageDispatchPlans.length, 2, harness.alerts.join(' | '));
  const intervals = data.montageDispatchPlans
    .flatMap((plan) => plan.exactReservations)
    .map((row) => [row.planId, row.physicalSegmentId, row.segmentOffsetStart, row.segmentOffsetEnd, row.qty])
    .sort((left, right) => left[2] - right[2]);
  assert.deepEqual(intervals, [
    ['montage-plan-1', 'STOCK|stock-prc-a', 0, 10, 10],
    ['montage-plan-2', 'STOCK|stock-prc-a', 10, 20, 10]
  ]);
  const snapshot = harness.StockModule.getMontagePlanReservationSnapshot();
  assert.equal(snapshot.lineQtyByKey.get('SALES_ORDER|sor-id-1|sor-line-1'), 10);
  assert.equal(snapshot.partQtyByKey.get('part|ref:part-ref-a'), 20);
  assert.equal(JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchShipments: data.montageDispatchShipments
  }), physicalBefore);
});

test('Faz 4 ilgili legacy DRAFTi fail-closed tutar, ilgisiz ve CANCELLED kaydi engellemez', () => {
  const relevantLegacy = createMontageDispatchPlan({
    id: 'phase4-legacy-relevant',
    planNo: 'MGP-000030',
    plannedQty: 2,
    requiredQty: 4
  });
  delete relevantLegacy.exactReservations;
  const relevantHarness = buildMontagePlanHarness({
    plans: [relevantLegacy],
    useRealMontagePreflight: true
  });
  configureMontagePhase5CExactData(relevantHarness, { stockQty: 20 });
  const requestedItem = { ...relevantLegacy.items[0], plannedQty: 1 };
  const relevantResult = relevantHarness.StockModule.runMontageExactAllocationPreflight({
    items: [requestedItem],
    qtyField: 'plannedQty',
    planId: 'phase4-new'
  });
  assert.equal(relevantResult.ok, false);
  assert.equal(relevantResult.reasonCode, 'MGP_EXACT_SEGMENT_MISSING');

  const unrelatedLegacy = JSON.parse(JSON.stringify(relevantLegacy));
  unrelatedLegacy.id = 'phase4-legacy-unrelated';
  unrelatedLegacy.planNo = 'MGP-000031';
  unrelatedLegacy.items[0].demandId = 'other-demand';
  unrelatedLegacy.items[0].itemKey = 'other-item';
  unrelatedLegacy.items[0].sourceOrderId = 'other-order';
  unrelatedLegacy.items[0].sourceLineId = 'other-line';
  const unrelatedHarness = buildMontagePlanHarness({
    plans: [unrelatedLegacy],
    useRealMontagePreflight: true
  });
  configureMontagePhase5CExactData(unrelatedHarness, { stockQty: 20 });
  const unrelatedResult = unrelatedHarness.StockModule.runMontageExactAllocationPreflight({
    items: [requestedItem],
    qtyField: 'plannedQty',
    planId: 'phase4-new'
  });
  assert.equal(unrelatedResult.ok, true);

  unrelatedLegacy.status = 'CANCELLED';
  unrelatedLegacy.items[0].demandId = 'pln-id-1';
  unrelatedLegacy.items[0].itemKey = 'pln-item-1';
  unrelatedLegacy.items[0].sourceOrderId = 'sor-id-1';
  unrelatedLegacy.items[0].sourceLineId = 'sor-line-1';
  const cancelledResult = unrelatedHarness.StockModule.runMontageExactAllocationPreflight({
    items: [requestedItem],
    qtyField: 'plannedQty',
    planId: 'phase4-new'
  });
  assert.equal(cancelledResult.ok, true);
});

test('Faz 4 FROM_STOCK kaynağını WO olmadan exact resolver segmentine bağlar', () => {
  const harness = buildMontagePlanHarness({ useRealMontagePreflight: true });
  const data = harness.context.DB.data.data;
  const snapshot = buildSourceAwareStockSnapshot();
  Object.assign(data, snapshot);
  data.montageCards = [];
  data.montageDispatchPlans = [];
  const before = JSON.stringify(data);
  const result = harness.StockModule.runMontageExactAllocationPreflight({
    items: [{
      sourceType: 'STOCK',
      sourceOrderId: '',
      sourceLineId: '',
      demandId: 'stock-demand-b',
      itemKey: 'stock-item-b',
      plannedQty: 5,
      recipeParts: [{
        source: 'part',
        refId: 'prc-source-1',
        code: 'PRC-SOURCE-1',
        unit: 'ADET',
        qtyPerSet: 1
      }]
    }],
    qtyField: 'plannedQty',
    planId: 'phase4-from-stock'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.exactReservations, (row) => ({
    planId: row.planId,
    demandId: row.demandId,
    itemKey: row.itemKey,
    sourceBucket: row.sourceBucket,
    physicalSegmentId: row.physicalSegmentId,
    qty: row.qty
  })), [{
    planId: 'phase4-from-stock',
    demandId: 'stock-demand-b',
    itemKey: 'stock-item-b',
    sourceBucket: 'FROM_STOCK',
    physicalSegmentId: 'STOCK|free-stock-source-1',
    qty: 5
  }]);
  assert.equal(JSON.stringify(data), before);
});

test('Faz 4 kayıtlı segment uyuşmazlığını, çakışan aralığı ve başka demand kullanımını reddeder', () => {
  const stale = createMontageDispatchPlan({
    id: 'phase4-stale',
    planNo: 'MGP-000040',
    plannedQty: 2,
    requiredQty: 4
  });
  stale.exactReservations[0].physicalSegmentId = 'STOCK|missing-row';
  const staleHarness = buildMontagePlanHarness({
    plans: [stale],
    useRealMontagePreflight: true
  });
  configureMontagePhase5CExactData(staleHarness, { stockQty: 20 });
  const requestedItem = { ...stale.items[0], plannedQty: 1 };
  const staleResult = staleHarness.StockModule.runMontageExactAllocationPreflight({
    items: [requestedItem],
    qtyField: 'plannedQty',
    planId: 'phase4-new'
  });
  assert.equal(staleResult.ok, false);
  assert.equal(staleResult.reasonCode, 'MGP_EXACT_SEGMENT_MISSING');

  const first = createMontageDispatchPlan({
    id: 'phase4-overlap-a',
    planNo: 'MGP-000041',
    plannedQty: 2,
    requiredQty: 4
  });
  const second = createMontageDispatchPlan({
    id: 'phase4-overlap-b',
    planNo: 'MGP-000042',
    plannedQty: 2,
    requiredQty: 4
  });
  const overlapHarness = buildMontagePlanHarness({
    plans: [first, second],
    useRealMontagePreflight: true
  });
  configureMontagePhase5CExactData(overlapHarness, { stockQty: 20 });
  const overlapResult = overlapHarness.StockModule.runMontageExactAllocationPreflight({
    items: [{ ...first.items[0], plannedQty: 1 }],
    qtyField: 'plannedQty',
    planId: 'phase4-new'
  });
  assert.equal(overlapResult.ok, false);
  assert.equal(overlapResult.reasonCode, 'MGP_EXACT_SEGMENT_MISSING');

  const otherDemandPlan = createMontageDispatchPlan({
    id: 'phase4-other-demand',
    planNo: 'MGP-000043',
    plannedQty: 2,
    requiredQty: 4
  });
  Object.assign(otherDemandPlan.items[0], {
    sourceOrderId: 'sor-id-2',
    sourceOrderNo: 'SOR-000002',
    sourceLineId: 'sor-line-2',
    demandId: 'pln-id-2',
    demandCode: 'PLN-000002',
    itemKey: 'pln-item-2'
  });
  Object.assign(otherDemandPlan.exactReservations[0], {
    planId: otherDemandPlan.id,
    sourceOrderId: 'sor-id-2',
    sourceLineId: 'sor-line-2',
    demandId: 'pln-id-2',
    itemKey: 'pln-item-2'
  });
  const otherHarness = buildMontagePlanHarness({
    plans: [otherDemandPlan],
    useRealMontagePreflight: true
  });
  configureMontagePhase5CExactData(otherHarness, { stockQty: 20 });
  const otherData = otherHarness.context.DB.data.data;
  otherData.orders.push({
    id: 'sor-id-2',
    orderNo: 'SOR-000002',
    status: 'Onaylandi',
    deliveryDate: '2026-08-20',
    lines: [{
      id: 'sor-line-2',
      productId: 'product-1',
      variationId: 'variant-1',
      variantCode: 'SVR-001',
      qty: 10
    }]
  });
  otherData.planningDemands.push({
    id: 'pln-id-2',
    demandCode: 'PLN-000002',
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-id-2',
    sourceOrderNo: 'SOR-000002',
    sourceLineId: 'sor-line-2',
    status: 'RELEASED',
    releasedQty: 10,
    released_at: '2026-07-25T08:00:00.000Z',
    workOrderId: 'wo-phase4-other',
    workOrderIds: ['wo-phase4-other'],
    items: [{
      id: 'pln-item-2',
      itemType: 'MODEL',
      productId: 'product-1',
      variantId: 'variant-1',
      variantCode: 'SVR-001',
      productCode: 'SVR-001',
      qty: 10
    }]
  });
  otherData.workOrders.push({
    id: 'wo-phase4-other',
    workOrderCode: 'WO-PHASE4-OTHER',
    sourceId: 'pln-id-2',
    sourceItemKey: 'pln-item-2',
    lines: [{
      id: 'wo-line-phase4-other',
      componentId: 'part-ref-a',
      componentCode: 'PRC-A',
      unit: 'ADET',
      targetQty: 20,
      routes: [{
        id: 'route-phase4-other',
        seq: 1,
        stationId: 'unit-phase5c',
        processId: 'PROCESS-PHASE5C'
      }]
    }]
  });
  const crossDemandResult = otherHarness.StockModule.runMontageExactAllocationPreflight({
    items: [{ ...requestedItem, plannedQty: 1 }],
    qtyField: 'plannedQty',
    planId: 'phase4-new'
  });
  assert.equal(crossDemandResult.ok, false);
  assert.equal(crossDemandResult.reasonCode, 'MGP_EXACT_SEGMENT_MISSING');
});

async function buildMontageRangeAwarePreflightHarness({
  capacity = 10,
  occupiedStart = 0,
  occupiedEnd = 5,
  currentStart = 5,
  currentEnd = 8
} = {}) {
  const planning = loadD2APlanningHarness();
  const stockRow = planning.snapshot.stockDepotItems.find((row) => row.id === 'stock-a');
  Object.assign(stockRow, { qty: capacity, quantity: capacity, amount: capacity });
  const occupiedBundle = buildD2B2AAtomicBundle(planning, planning.sor8, {
    planId: 'mgp-range-occupied',
    planNo: 'MGP-RANGE-OCCUPIED',
    instructionId: '81818181-8181-4181-8181-818181818181',
    instructionCode: 'STAI-000081',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-range-occupied|PRC-SOURCE-1',
    sliceKey: 'mgp-range-occupied-slice',
    qty: occupiedEnd - occupiedStart,
    start: occupiedStart
  });
  const occupiedCreated = await planning.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(
    occupiedBundle
  );
  assert.equal(occupiedCreated.ok, true, JSON.stringify(occupiedCreated));
  const currentBundle = buildD2B2AAtomicBundle(planning, planning.sor7, {
    planId: 'mgp-range-current',
    planNo: 'MGP-RANGE-CURRENT',
    instructionId: '82828282-8282-4282-8282-828282828282',
    instructionCode: 'STAI-000082',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-range-current|PRC-SOURCE-1',
    sliceKey: 'mgp-range-current-slice',
    qty: 3,
    start: 5
  });
  const currentCreated = await planning.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(
    currentBundle
  );
  assert.equal(currentCreated.ok, true, JSON.stringify(currentCreated));
  const occupiedPlan = planning.snapshot.montageDispatchPlans
    .find((row) => row.id === occupiedBundle.plan.id);
  const currentPlan = planning.snapshot.montageDispatchPlans
    .find((row) => row.id === currentBundle.plan.id);
  occupiedPlan.exactReservations[0].sourceBucket = 'FROM_STOCK';
  currentPlan.exactReservations[0].sourceBucket = 'FROM_STOCK';
  const currentInstruction = planning.snapshot.sanalTaksimAllocationInstructions
    .find((row) => row.id === currentBundle.instructionRequests[0].id);
  const currentQty = currentEnd - currentStart;
  if (currentStart !== 5 || currentEnd !== 8) {
    const reservation = currentPlan.exactReservations[0];
    reservation.segmentOffsetStart = currentStart;
    reservation.segmentOffsetEnd = currentEnd;
    reservation.qty = currentQty;
    reservation.reservationKey = `MGP_EXACT|${currentPlan.id}|${currentStart}|${currentEnd}`;
    currentPlan.items[0].plannedQty = currentQty;
    currentPlan.parts[0].requiredQty = currentQty;
    currentInstruction.qty = currentQty;
    Object.assign(currentInstruction.slices[0], {
      reservationKey: reservation.reservationKey,
      segmentOffsetStart: currentStart,
      segmentOffsetEnd: currentEnd,
      qty: currentQty
    });
  }
  planning.snapshot.montageDispatchShipments = [];
  const harness = buildMontagePlanHarness({
    useRealMontagePreflight: true,
    dataOverride: planning.snapshot
  });
  return { ...harness, planning, occupiedPlan, currentPlan, currentInstruction };
}

test('MGP dispatch exact preflight farkli target disjoint araliklarini kabul eder', async () => {
  const harness = await buildMontageRangeAwarePreflightHarness();
  const resolved = loadSanalTaksimResolver().resolve(harness.context.DB.data.data);
  assert.equal(resolved.diagnostics.exactHoldLedger.valid, true);
  assert.equal(resolved.diagnostics.exactHoldLedger.issues.length, 0);

  const result = harness.StockModule.runMontageExactAllocationPreflight({
    items: harness.currentPlan.items,
    qtyField: 'plannedQty',
    validatePlanId: harness.currentPlan.id
  });

  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(Array.from(result.exactReservations, (row) => [
    row.segmentOffsetStart, row.segmentOffsetEnd, row.qty
  ]), [[5, 8, 3]]);
});

test('MGP dispatch exact preflight farkli target gercek interval overlapini reddeder', async () => {
  const harness = await buildMontageRangeAwarePreflightHarness({ currentStart: 4, currentEnd: 8 });
  const result = harness.StockModule.runMontageExactAllocationPreflight({
    items: harness.currentPlan.items,
    qtyField: 'plannedQty',
    validatePlanId: harness.currentPlan.id
  });

  assert.equal(result.ok, false);
  assert.ok(result.reasonCode);
});

test('MGP dispatch exact preflight segment kapasitesini asan rezervi reddeder', async () => {
  const harness = await buildMontageRangeAwarePreflightHarness({ currentStart: 8, currentEnd: 11 });
  const result = harness.StockModule.runMontageExactAllocationPreflight({
    items: harness.currentPlan.items,
    qtyField: 'plannedQty',
    validatePlanId: harness.currentPlan.id
  });

  assert.equal(result.ok, false);
  assert.ok(result.reasonCode);
});

test('MGP dispatch exact preflight mevcut planin kendi target uyusmazligini reddeder', async () => {
  const harness = await buildMontageRangeAwarePreflightHarness();
  const occupiedTarget = harness.occupiedPlan.exactReservations[0];
  Object.assign(harness.currentPlan.exactReservations[0], {
    sourceOrderId: occupiedTarget.sourceOrderId,
    sourceLineId: occupiedTarget.sourceLineId,
    demandId: occupiedTarget.demandId,
    itemKey: occupiedTarget.itemKey
  });
  Object.assign(harness.currentInstruction.target, {
    sourceOrderId: occupiedTarget.sourceOrderId,
    sourceLineId: occupiedTarget.sourceLineId,
    demandId: occupiedTarget.demandId,
    itemKey: occupiedTarget.itemKey
  });
  const result = harness.StockModule.runMontageExactAllocationPreflight({
    items: harness.currentPlan.items,
    qtyField: 'plannedQty',
    validatePlanId: harness.currentPlan.id
  });

  assert.equal(result.ok, false);
  assert.ok(result.reasonCode);
});

test('MGP dispatch exact preflight bozuk exact range proofunu reddeder', async () => {
  const harness = await buildMontageRangeAwarePreflightHarness();
  harness.currentPlan.exactReservations[0].qty = 2;
  const result = harness.StockModule.runMontageExactAllocationPreflight({
    items: harness.currentPlan.items,
    qtyField: 'plannedQty',
    validatePlanId: harness.currentPlan.id
  });

  assert.equal(result.ok, false);
  assert.ok(result.reasonCode);
});

test('Faz 4 resolver invariant hatasında MGP ve fiziksel etki oluşturmadan fail-closed kalır', async () => {
  const harness = buildMontagePlanHarness({ useRealMontagePreflight: true });
  configureMontagePhase5CExactData(harness, { stockQty: 20 });
  const configured = configureMontagePlanSave(harness.StockModule, {
    plannedQty: 5,
    sendableQty: 10,
    orderQty: 10
  });
  const resolver = harness.context.SanalTaksimResolver;
  const resolve = resolver.resolve;
  resolver.resolve = (snapshot) => {
    const result = resolve(snapshot);
    return {
      ...result,
      diagnostics: {
        ...result.diagnostics,
        invariants: {
          ...result.diagnostics.invariants,
          segmentKeysConsumedOnce: false
        }
      }
    };
  };
  const data = harness.context.DB.data.data;
  const before = JSON.stringify(data);
  const direct = harness.StockModule.runMontageExactAllocationPreflight({
    items: [{
      ...configured.line,
      productId: 'product-1',
      variantId: 'variant-1',
      plannedQty: 5,
      recipeParts: [{
        source: 'part',
        refId: 'part-ref-a',
        code: 'PRC-A',
        name: 'Ortak Parca',
        unit: 'ADET',
        qtyPerSet: 2
      }]
    }],
    qtyField: 'plannedQty',
    planId: 'phase4-invariant'
  });
  assert.equal(direct.ok, false);
  assert.equal(direct.reasonCode, 'MGP_RESOLVER_INVARIANT_FAILED');

  await harness.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(data.montageDispatchPlans.length, 0);
  assert.equal(harness.saveCount, 0);
  assert.equal(JSON.stringify(data), before);
});

test('Montaj Faz 5C Ana Depo disindaki miktari ve UNCERTAIN kanitini exact kaynak wildcardi yapmaz', async () => {
  for (const mode of ['CUSTOM_DEPOT']) {
    const harness = buildMontagePlanHarness({ useRealMontagePreflight: true });
    configureMontagePhase5CExactData(harness, {
      stockQty: 20,
      workInProcessQty: 0
    });
    configureMontagePlanSave(harness.StockModule, { plannedQty: 4, sendableQty: 10, orderQty: 10 });
    harness.StockModule.validateMontageDispatchPlanPartCapacity = () => ({ ok: true });
    if (mode === 'CUSTOM_DEPOT') {
      Object.assign(harness.context.DB.data.data.stockDepotItems[0], {
        depotId: 'custom-depot',
        nodeKey: 'managed:custom-depot',
        locationId: 'custom-location'
      });
    }
    const before = JSON.stringify(harness.context.DB.data.data);

    await harness.StockModule.validateMontageReadyDetailSendPlan();

    assert.equal(JSON.stringify(harness.context.DB.data.data), before);
    assert.equal(harness.saveCount, 0);
    assert.ok(harness.alerts.some((message) =>
      /exact Ana Depo stoğu yetersiz|exact resolver fiziksel segmenti|Belirsiz lifecycle/.test(message)
    ));
  }

  const injectUncertain = (harness, entry) => {
    const resolver = harness.context.SanalTaksimResolver;
    const resolve = resolver.resolve;
    resolver.resolve = (snapshot) => {
      const result = resolve(snapshot);
      return {
        ...result,
        uncertain: [...(Array.isArray(result.uncertain) ? result.uncertain : []), entry]
      };
    };
  };
  const buildUncertainHarness = (entry) => {
    const harness = buildMontagePlanHarness({ useRealMontagePreflight: true });
    configureMontagePhase5CExactData(harness, { stockQty: 20 });
    configureMontagePlanSave(harness.StockModule, { plannedQty: 4, sendableQty: 10, orderQty: 10 });
    harness.StockModule.validateMontageDispatchPlanPartCapacity = () => ({ ok: true });
    injectUncertain(harness, {
      kind: 'MGS_SHIPMENT',
      reasonCode: 'MGS_MGP_MISSING',
      allocatable: false,
      allocatableQty: 0,
      ...entry
    });
    return harness;
  };

  const identityless = buildUncertainHarness({
    id: 'legacy-unrelated-shipment',
    prcCode: '',
    unit: '',
    evidenceIds: ['legacy-unrelated-shipment', 'legacy-unrelated-plan']
  });
  const identitylessStockBefore = JSON.stringify(identityless.context.DB.data.data.stockDepotItems);
  const identitylessMovementsBefore = JSON.stringify(identityless.context.DB.data.data.stock_movements);
  await identityless.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(identityless.context.DB.data.data.montageDispatchPlans.length, 1);
  assert.equal(identityless.saveCount, 1);
  assert.equal(JSON.stringify(identityless.context.DB.data.data.stockDepotItems), identitylessStockBefore);
  assert.equal(JSON.stringify(identityless.context.DB.data.data.stock_movements), identitylessMovementsBefore);

  const sameExactWithoutEvidence = buildUncertainHarness({
    kind: 'MGS_PART',
    id: 'same-prc-unrelated-part',
    prcCode: 'PRC-A',
    unit: 'ADET',
    evidenceIds: ['same-prc-unrelated-shipment']
  });
  await sameExactWithoutEvidence.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(sameExactWithoutEvidence.context.DB.data.data.montageDispatchPlans.length, 1);
  assert.equal(sameExactWithoutEvidence.saveCount, 1);

  const linkedPhysical = buildUncertainHarness({
    kind: 'MGS_PART',
    id: 'linked-physical-uncertain',
    prcCode: '',
    unit: '',
    evidenceIds: ['stock-prc-a']
  });
  const linkedBefore = JSON.stringify(linkedPhysical.context.DB.data.data);
  await linkedPhysical.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(JSON.stringify(linkedPhysical.context.DB.data.data), linkedBefore);
  assert.equal(linkedPhysical.saveCount, 0);
  assert.ok(linkedPhysical.alerts.some((message) => /Belirsiz lifecycle/.test(message)));
});

test('Montaj plani tam ve kismi miktari urun/parca snapshot ile kaydeder', async () => {
  const full = buildMontagePlanHarness();
  configureMontagePlanSave(full.StockModule, { plannedQty: 10 });
  await full.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(full.context.DB.data.data.montageDispatchPlans.length, 1);
  assert.equal(full.context.DB.data.data.montageDispatchPlans[0].planNo, 'MGP-000001');
  assert.equal(full.context.DB.data.data.montageDispatchPlans[0].status, 'DRAFT');
  assert.equal(full.context.DB.data.data.montageDispatchPlans[0].items[0].plannedQty, 10);
  assert.equal(full.context.DB.data.data.montageDispatchPlans[0].items[0].montageCardId, 'montage-card-1');
  assert.equal(full.context.DB.data.data.montageDispatchPlans[0].items[0].montageCardCode, 'MON-000001');
  assert.deepEqual(Array.from(full.context.DB.data.data.montageDispatchPlans[0].items[0].recipeParts, (part) => ({
    refId: part.refId, code: part.code, name: part.name, unit: part.unit, qtyPerSet: part.qtyPerSet
  })), [{ refId: 'part-ref-a', code: 'PRC-A', name: 'Ortak Parca', unit: 'ADET', qtyPerSet: 2 }]);
  assert.equal(full.context.DB.data.data.montageDispatchPlans[0].parts[0].requiredQty, 20);
  assert.equal(full.context.DB.data.data.montageDispatchPlans[0].parts[0].unit, 'ADET');

  const partial = buildMontagePlanHarness();
  configureMontagePlanSave(partial.StockModule, { plannedQty: 4 });
  await partial.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(partial.context.DB.data.data.montageDispatchPlans[0].items[0].plannedQty, 4);
  assert.equal(partial.context.DB.data.data.montageDispatchPlans[0].items[0].recipeParts[0].qtyPerSet, 2);
  assert.equal(partial.context.DB.data.data.montageDispatchPlans[0].parts[0].requiredQty, 8);
});

test('Montaj MGP miktari kayitta canli inputtaki 2 degerini stale 3 stateine tercih eder', async () => {
  const harness = buildMontagePlanHarness();
  const configured = configureMontagePlanSave(harness.StockModule, { plannedQty: 3 });
  configured.line.sourceType = 'STOCK';
  configured.line.sourceOrderId = '';
  configured.line.sourceOrderNo = '';
  configured.line.sourceLineId = '';
  harness.context.document.getElementById = (id) =>
    id === `montage_send_qty_${harness.StockModule.escapeSafeId(configured.line.key)}`
      ? { value: '2' }
      : null;

  const saved = await harness.StockModule.validateMontageReadyDetailSendPlan();

  assert.equal(saved, true, harness.alerts.join(' | '));
  const plan = harness.context.DB.data.data.montageDispatchPlans[0];
  assert.equal(plan.items[0].plannedQty, 2);
  assert.equal(plan.parts[0].requiredQty, 4);
});

test('Montaj plani iki farkli SVR recetesini item snapshotlarinda ayri tutar', async () => {
  const harness = buildMontagePlanHarness();
  const configured = configureMontagePlanSave(harness.StockModule, { plannedQty: 5, sendableQty: 10, orderQty: 10 });
  const data = harness.context.DB.data.data;
  data.orders[0].lines.push({
    id: 'sor-line-2', productId: 'product-1', variationId: 'variant-2', variantCode: 'SVR-000002', qty: 10
  });
  data.partComponentCards.push({ id: 'part-ref-b', code: 'PRC-B', consumptionUnit: 'ADET' });
  data.stockDepotItems.push({
    id: 'stock-prc-b', productCode: 'PRC-B', code: 'PRC-B', quantity: 100, qty: 100,
    stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', allocationType: 'FREE', depotId: 'main', nodeKey: 'managed:main',
    locationId: 'loc-main-b', unit: 'ADET', created_at: '2026-01-02T00:00:00.000Z'
  });
  const jobB = {
    key: 'job-2', montageCardId: 'montage-card-1', montageCardCode: 'MON-000001',
    partRows: [{ key: 'recipe-2', refId: 'part-ref-b', code: 'PRC-B', name: 'Ikinci Parca', qtyPerSet: 3 }]
  };
  const lineB = {
    key: 'line-2', sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-1', sourceOrderNo: 'SOR-000001',
    sourceLineId: 'sor-line-2', demandId: 'pln-id-2', demandCode: 'PLN-000002', itemKey: 'pln-item-2',
    productId: 'product-1', variationId: 'variant-2', svrCode: 'SVR-000002', productName: 'Urun B', qty: '10',
    readySetQty: 10,
    resolverAvailability: { trusted: true, allocatable: true, readyQty: 10, reasonCode: '', message: '' },
    sendableQty: 10, sendableCalculable: true, montageJobKey: 'job-2'
  };
  harness.StockModule.state.montageReadyDetailSendSelected = { 'line-1': true, 'line-2': true };
  harness.StockModule.state.montageReadyDetailSendQtyByRow = { 'line-1': '5', 'line-2': '4' };
  harness.StockModule.buildMontageReadyJobCards = () => [configured.job, jobB];
  harness.StockModule.getMontageReadyPlanRows = () => [{ key: 'detail-1', jobs: [configured.job, jobB] }];
  harness.StockModule.getMontageReadyDetailOrderRows = () => [configured.line, lineB];

  await harness.StockModule.validateMontageReadyDetailSendPlan();

  const plan = data.montageDispatchPlans[0];
  assert.equal(plan.items.length, 2);
  assert.deepEqual(Array.from(plan.items, (item) => [item.variantCode, item.recipeParts[0].code, item.recipeParts[0].qtyPerSet]), [
    ['SVR-001', 'PRC-A', 2],
    ['SVR-000002', 'PRC-B', 3]
  ]);
  assert.deepEqual(Array.from(plan.parts, (part) => [part.code, part.requiredQty]), [['PRC-A', 10], ['PRC-B', 12]]);
});

test('Montaj plani guvenilir kart recete ve urun kimligi olmadan kaydedilmez', async () => {
  for (const scenario of [
    {
      expected: 'Montaj Kartı',
      mutate: ({ job }) => { job.montageCardId = ''; job.montageCardCode = ''; }
    },
    {
      expected: 'reçete',
      mutate: ({ job }) => { job.partRows = []; }
    },
    {
      expected: 'qtyPerSet',
      mutate: ({ job }) => { job.partRows[0].qtyPerSet = 0; }
    },
    {
      expected: 'ürün veya varyasyon',
      mutate: ({ line }) => { line.variationId = ''; }
    }
  ]) {
    const harness = buildMontagePlanHarness();
    const configured = configureMontagePlanSave(harness.StockModule, { plannedQty: 4 });
    scenario.mutate(configured);
    await harness.StockModule.validateMontageReadyDetailSendPlan();
    assert.equal(harness.context.DB.data.data.montageDispatchPlans.length, 0);
    assert.equal(harness.saveCount, 0);
    assert.ok(harness.alerts.some((message) => message.includes(scenario.expected)));
  }
});

test('Shipment item plan anindaki recete snapshotini degistirmeden tasir', async () => {
  const harness = buildMontagePlanHarness();
  const configured = configureMontagePlanSave(harness.StockModule, { plannedQty: 4 });
  await harness.StockModule.validateMontageReadyDetailSendPlan();
  const plan = harness.context.DB.data.data.montageDispatchPlans[0];
  const savedSnapshot = JSON.parse(JSON.stringify(plan.items[0].recipeParts));

  configured.job.partRows[0].qtyPerSet = 99;
  configured.job.partRows[0].code = 'PRC-DEGISTI';
  harness.context.DB.data.data.montageCards[0].cardCode = 'MON-DEGISTI';
  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  const shipment = harness.context.DB.data.data.montageDispatchShipments[0];
  assert.equal(JSON.stringify(shipment.items[0].recipeParts), JSON.stringify(savedSnapshot));
  assert.equal(JSON.stringify(shipment.items[0].recipeParts), JSON.stringify(plan.items[0].recipeParts));
  assert.equal(shipment.items[0].montageCardId, plan.items[0].montageCardId);
  assert.equal(shipment.items[0].montageCardCode, 'MON-000001');
});

test('Snapshot tasimayan eski DRAFT montaj plani sevke kapatilir', async () => {
  const legacyPlan = createMontageDispatchPlan({ id: 'legacy-draft-plan' });
  delete legacyPlan.items[0].montageCardId;
  delete legacyPlan.items[0].montageCardCode;
  delete legacyPlan.items[0].recipeParts;
  const harness = buildMontagePlanHarness({ plans: [legacyPlan] });
  const before = JSON.stringify(harness.context.DB.data.data);

  await harness.StockModule.dispatchMontagePlanToMontage(legacyPlan.id);

  assert.equal(JSON.stringify(harness.context.DB.data.data), before);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => message.includes('iptal edip yeniden oluşturun')));
});

test('Yeni montaj plani guvenilir fiziksel stok birimi yoksa kaydedilmez', async () => {
  const harness = buildMontagePlanHarness();
  harness.context.DB.data.data.stockDepotItems[0].unit = '';
  configureMontagePlanSave(harness.StockModule, { plannedQty: 4 });
  await harness.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(harness.context.DB.data.data.montageDispatchPlans.length, 0);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => message.includes('güvenilir parça birimi')));
});

test('DRAFT montaj plani FIFOya donmeden yalnız MGP exact stok satirini tek IN_TRANSIT sevke donusturur', async () => {
  const plan = createMontageDispatchPlan();
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const firstRow = harness.context.DB.data.data.stockDepotItems[0];
  firstRow.quantity = 20;
  firstRow.qty = 20;
  harness.context.DB.data.data.stockDepotItems.push({
    id: 'stock-prc-a-new', refId: 'part-ref-a', productCode: 'PRC-A', code: 'PRC-A', quantity: 20, qty: 20,
    stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', allocationType: 'FREE', depotId: 'main', nodeKey: 'managed:main',
    locationId: 'loc-main-b', unit: 'ADET', created_at: '2026-02-01T00:00:00.000Z'
  });
  Object.assign(plan.exactReservations[0], {
    physicalSegmentId: 'STOCK|stock-prc-a-new',
    reservationKey: `MGP_EXACT|${plan.id}|pln-id-1|pln-item-1|part-ref-a|PRC-A|ADET|STOCK|stock-prc-a-new|FROM_STOCK|0|12`
  });

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  const shipment = harness.context.DB.data.data.montageDispatchShipments[0];
  assert.equal(plan.status, 'DISPATCHED_TO_MONTAGE');
  assert.equal(shipment.status, 'IN_TRANSIT');
  assert.equal(shipment.shipmentNo, 'MGS-000001');
  assert.equal(shipment.idempotencyKey, `MONTAGE_PLAN_DISPATCH|${plan.id}`);
  assert.equal(shipment.items[0].shippedQty, 6);
  assert.equal(shipment.items[0].montageCardId, plan.items[0].montageCardId);
  assert.equal(shipment.items[0].montageCardCode, plan.items[0].montageCardCode);
  assert.equal(JSON.stringify(shipment.items[0].recipeParts), JSON.stringify(plan.items[0].recipeParts));
  assert.equal(shipment.parts[0].shippedQty, 12);
  assert.deepEqual(Array.from(shipment.parts[0].allocations, (row) => [row.stockDepotItemId, row.qty]), [['stock-prc-a-new', 12]]);
  assert.equal(harness.context.DB.data.data.stockDepotItems[0].qty, 20);
  assert.equal(harness.context.DB.data.data.stockDepotItems[1].qty, 20);
  assert.equal(harness.context.DB.data.data.stock_movements.length, 0);
  assert.equal(shipment.stockTransferMode, 'POST_ON_RECEIPT_V1');
  assert.equal(shipment.parts[0].allocations[0].stockMovementId, undefined);
  assert.equal(
    JSON.stringify(shipment.parts[0].allocations[0].segmentRanges.map((row) => [row.segmentOffsetStart, row.segmentOffsetEnd, row.qty])),
    JSON.stringify([[0, 12, 12]])
  );
  assert.equal(harness.StockModule.getMontageShipmentDispatchedQtyForLine(plan.items[0]), 6);
  assert.equal(harness.StockModule.getMontagePlanReservationSnapshot().partQtyByKey.get('part|ref:part-ref-a') || 0, 0);
  assert.ok(harness.context.DB.data.data.stockDepotItems.every((row) => row.depotId === 'main'));
  assert.equal(harness.context.DB.data.data.montageJobDispatches.length, 0);
  assert.equal(harness.context.DB.data.data.workOrderTransactions, undefined);

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);
  assert.equal(harness.context.DB.data.data.montageDispatchShipments.length, 1);
  assert.equal(harness.saveCount, 1);
});

test('Yeni mod MGS exact hold fiziksel stogu resolverda bir kez sayar ve ayni borca sabitler', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 6, requiredQty: 12 });
  const harness = buildMontagePlanHarness({
    plans: [plan],
    useRealMontagePreflight: true
  });
  configureMontagePhase5CExactData(harness, { stockQty: 20 });

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  const resolved = loadSanalTaksimResolver().resolve(
    harness.StockModule.buildMontageExactPreflightSnapshot()
  );
  const stockSegments = resolved.segments.filter((row) =>
    row.segmentKey === 'STOCK|stock-prc-a'
  );
  const heldAllocations = resolved.allocations.filter((row) =>
    row.fixedByExactHold === true
  );
  assert.equal(stockSegments.length, 1);
  assert.equal(stockSegments[0].physicalQty, 20);
  assert.equal(resolved.totalsByPrc.find((row) => row.prcCode === 'PRC-A').physicalQty, 20);
  assert.equal(heldAllocations.reduce((sum, row) => sum + row.qty, 0), 12);
  assert.equal(resolved.lifecycle.evidence.filter((row) => row.kind === 'MGS_IN_TRANSIT_EXACT_HOLD').length, 1);
  assert.ok(resolved.lifecycle.evidence.every((row) =>
    row.kind !== 'MGS_IN_TRANSIT_EXACT_HOLD' || row.physical === false
  ));
  assert.equal(resolved.diagnostics.invariants.segmentAllocationWithinQty, true);
  assert.equal(resolved.diagnostics.invariants.segmentKeysConsumedOnce, true);

  const remainingPreflight = harness.StockModule.runMontageExactAllocationPreflight({
    items: [{ ...plan.items[0], plannedQty: 4 }],
    qtyField: 'plannedQty',
    planId: 'next-plan'
  });
  assert.equal(remainingPreflight.ok, true);
  assert.equal(
    JSON.stringify(remainingPreflight.exactReservations.map((row) => [
      row.segmentOffsetStart,
      row.segmentOffsetEnd,
      row.qty
    ])),
    JSON.stringify([[12, 20, 8]])
  );

  const data = harness.context.DB.data.data;
  const secondOrder = JSON.parse(JSON.stringify(data.orders[0]));
  secondOrder.id = 'sor-id-2';
  secondOrder.orderNo = 'SOR-000002';
  secondOrder.deliveryDate = '2026-08-01';
  secondOrder.lines[0].id = 'sor-line-2';
  const secondDemand = JSON.parse(JSON.stringify(data.planningDemands[0]));
  secondDemand.id = 'pln-id-2';
  secondDemand.demandCode = 'PLN-000002';
  secondDemand.sourceOrderId = secondOrder.id;
  secondDemand.sourceOrderNo = secondOrder.orderNo;
  secondDemand.sourceLineId = secondOrder.lines[0].id;
  secondDemand.workOrderId = '';
  secondDemand.workOrderIds = [];
  secondDemand.items[0].id = 'pln-item-2';
  secondDemand.poolAnalysis.rows[0].itemKey = 'pln-item-2';
  data.orders.push(secondOrder);
  data.planningDemands.push(secondDemand);

  const crossSorResolved = loadSanalTaksimResolver().resolve(
    harness.StockModule.buildMontageExactPreflightSnapshot()
  );
  const secondSorQty = crossSorResolved.allocations
    .filter((row) => row.demandId === 'pln-id-2')
    .reduce((sum, row) => sum + row.qty, 0);
  assert.ok(secondSorQty <= 8);
  assert.equal(
    crossSorResolved.allocations
      .filter((row) => row.fixedByExactHold === true && row.demandId === 'pln-id-1')
      .reduce((sum, row) => sum + row.qty, 0),
    12
  );
});

test('FAZ 3 aktif SALES-A snapshotinda 2 takim exact PRC WIP MGP ve ACTIVE STAI olusturur', async () => {
  const server = require('../serve.js');
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const data = JSON.parse(JSON.stringify(raw.data || raw));
  const order = data.orders.find((row) => row.orderNo === 'SOR-000019');
  const demand = data.planningDemands.find((row) => row.sourceOrderId === order?.id);
  const demandItem = demand?.items?.[0];
  const variant = data.salesProductVariants.find((row) => row.variantCode === 'SVR-000002');
  assert.ok(order && demand && demandItem && variant);
  const recipeParts = variant.items.map((item) => {
    const card = data.partComponentCards.find((row) => row.id === item.refId && row.code === item.code);
    assert.ok(card, item.code);
    return {
      source: 'component',
      refId: card.id,
      code: card.code,
      name: card.name,
      unit: String(card.unit || card.stockUnit || 'ADET').trim().toUpperCase(),
      qtyPerSet: Number(item.qty)
    };
  });
  const harness = buildMontagePlanHarness({ dataOverride: data, useRealMontagePreflight: true });
  const result = harness.StockModule.runMontageExactAllocationPreflight({
    items: [{
      sourceType: 'SALES_ORDER',
      sourceOrderId: order.id,
      sourceLineId: order.lines[0].id,
      demandId: demand.id,
      itemKey: demandItem.id,
      plannedQty: 2,
      recipeParts
    }],
    qtyField: 'plannedQty',
    planId: 'faz3-wip-preflight'
  });
  assert.equal(result.ok, true, `${result.reasonCode}: ${result.message}`);
  assert.equal(result.exactReservations.reduce((sum, row) => sum + Number(row.qty || 0), 0), 16);
  assert.equal(new Set(result.exactSegments.map((segment) => segment.prcCode)).size, 7);
  assert.ok(result.exactSegments.every((segment) =>
    segment.sourceKind === 'WORK_ORDER'
    && segment.productionOriginVerified === true
    && segment.physicalOrigin?.verified === true
  ));
  const prc18Qty = result.exactReservations
    .filter((row) => row.prcCode === 'PRC-000018')
    .reduce((sum, row) => sum + Number(row.qty || 0), 0);
  assert.equal(prc18Qty, 2);

  harness.context.DB.data.meta = { activeUserName: 'FAZ 3 WIP Test' };
  const PlanningModule = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: harness.context.DB,
    SanalTaksimResolver: loadSanalTaksimResolver(),
    crypto: nodeCrypto
  }).exported;
  const plan = {
    id: 'faz3-wip-preflight',
    planNo: 'MGP-FAZ3-WIP',
    status: 'DRAFT',
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
    cancelledAt: '',
    items: [{
      sourceType: 'SALES_ORDER',
      sourceOrderId: order.id,
      sourceOrderNo: order.orderNo,
      sourceLineId: order.lines[0].id,
      demandId: demand.id,
      demandCode: demand.demandCode,
      itemKey: demandItem.id,
      productId: order.lines[0].productId,
      variantId: order.lines[0].variationId,
      variantCode: order.lines[0].variantCode,
      montageCardId: data.montageCards.find((row) => row.cardCode === variant.montageCard.cardCode).id,
      montageCardCode: variant.montageCard.cardCode,
      plannedQty: 2,
      recipeParts
    }],
    parts: recipeParts.map((part) => ({ ...part, requiredQty: part.qtyPerSet * 2 })),
    exactReservations: result.exactReservations
  };
  const instructionBundle = harness.StockModule.buildMontagePlanBoundInstructionRequests(plan);
  assert.equal(instructionBundle.ok, true);
  const physicalBefore = JSON.stringify({
    workOrderTransactions: data.workOrderTransactions,
    stockDepotItems: data.stockDepotItems,
    stockMovements: data.stock_movements
  });
  const beforeCreate = { data: JSON.parse(JSON.stringify(data)) };
  const created = await PlanningModule.createSanalTaksimPlanBoundMontageAllocation({
    plan,
    instructionRequests: instructionBundle.requests
  });
  assert.equal(created.ok, true, JSON.stringify(created));
  assert.equal(data.montageDispatchPlans.length, 1);
  assert.equal(data.sanalTaksimAllocationInstructions.length, 7);
  assert.ok(data.sanalTaksimAllocationInstructions.every((instruction) =>
    instruction.status === 'ACTIVE'
    && instruction.slices.every((slice) => !slice.stockRowId && slice.physicalSegmentId.startsWith('WORK|'))
  ));
  assert.equal(JSON.stringify({
    workOrderTransactions: data.workOrderTransactions,
    stockDepotItems: data.stockDepotItems,
    stockMovements: data.stock_movements
  }), physicalBefore);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructions({ data }), []);
  assert.deepEqual(server.validateSanalTaksimPlanBoundMontageLinks({ data }), []);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(beforeCreate, { data }), []);
  const tamperedOrigin = { data: JSON.parse(JSON.stringify(data)) };
  tamperedOrigin.data.sanalTaksimAllocationInstructions[0]
    .slices[0].physicalOriginAudit.originDemandId = 'tampered-demand';
  assert.ok(server.validateSanalTaksimAllocationInstructions(tamperedOrigin).length > 0);
  const overlappingWip = { data: JSON.parse(JSON.stringify(data)) };
  const duplicateInstruction = JSON.parse(JSON.stringify(
    overlappingWip.data.sanalTaksimAllocationInstructions[0]
  ));
  Object.assign(duplicateInstruction, {
    id: '99999999-9999-4999-8999-999999999999',
    instructionCode: 'STAI-999999',
    idempotencyKey: 'faz3-wip-overlap'
  });
  duplicateInstruction.slices[0].sliceKey = 'faz3-wip-overlap-slice';
  overlappingWip.data.sanalTaksimAllocationInstructions.push(duplicateInstruction);
  assert.ok(server.validateSanalTaksimAllocationInstructions(overlappingWip)
    .some((issue) => /kesişemez/.test(issue)));
  const legacyWipConflict = { data: JSON.parse(JSON.stringify(data)) };
  const conflictingReservation = JSON.parse(JSON.stringify(
    legacyWipConflict.data.montageDispatchPlans[0].exactReservations[0]
  ));
  legacyWipConflict.data.montageDispatchPlans.push({
    id: 'legacy-wip-conflict',
    planNo: 'MGP-LEGACY-WIP-CONFLICT',
    status: 'DRAFT',
    exactReservations: [conflictingReservation]
  });
  assert.ok(server.validateSanalTaksimOperationalHoldConflicts(legacyWipConflict)
    .some((issue) => /stok\/WIP dilimi/.test(issue)));
  const held = loadSanalTaksimResolver().resolve(data);
  assert.equal(held.diagnostics.exactHoldLedger.valid, true);
  assert.equal(held.diagnostics.exactHoldLedger.activeInstructionCount, 7);
  assert.equal(held.allocations
    .filter((row) => row.fixedByExactHold === true)
    .reduce((sum, row) => sum + Number(row.qty || 0), 0), 16);

  harness.StockModule.canAccessMontageDispatchPlanFromCurrentDetail = () => true;
  harness.StockModule.openMontageDispatchPlans = () => {};
  const beforeCancel = { data: JSON.parse(JSON.stringify(data)) };
  assert.deepEqual(server.validateSanalTaksimActiveStockRowProtection(beforeCancel, beforeCancel), []);
  await harness.StockModule.cancelMontageDispatchPlan(plan.id);
  assert.equal(data.montageDispatchPlans[0].status, 'CANCELLED');
  assert.ok(data.sanalTaksimAllocationInstructions.every((instruction) => instruction.status === 'CANCELLED'));
  assert.deepEqual(server.validateSanalTaksimAllocationInstructions({ data }), []);
  assert.deepEqual(server.validateSanalTaksimPlanBoundMontageLinks({ data }), []);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(beforeCancel, { data }), []);
  assert.deepEqual(server.validateSanalTaksimActiveStockRowProtection(beforeCancel, { data }), []);
  const physicalMutationDuringCancel = { data: JSON.parse(JSON.stringify(data)) };
  physicalMutationDuringCancel.data.workOrderTransactions.push({ id: 'forbidden-wip-cancel-side-write' });
  assert.ok(server.validateSanalTaksimAllocationInstructionTransitions(
    beforeCancel,
    physicalMutationDuringCancel
  ).length > 0);
  const released = loadSanalTaksimResolver().resolve(data);
  assert.equal(released.diagnostics.exactHoldLedger.activeInstructionCount, 0);
  assert.equal(released.diagnostics.exactHoldLedger.holdCount, 0);

  const retryPreflight = harness.StockModule.runMontageExactAllocationPreflight({
    items: plan.items,
    qtyField: 'plannedQty',
    planId: 'faz3-wip-retry'
  });
  assert.equal(retryPreflight.ok, true, JSON.stringify(retryPreflight));
  const activePlan = {
    ...JSON.parse(JSON.stringify(plan)),
    id: 'faz3-wip-retry',
    planNo: 'MGP-FAZ3-WIP-RETRY',
    exactReservations: retryPreflight.exactReservations
  };
  const retryInstructions = harness.StockModule.buildMontagePlanBoundInstructionRequests(activePlan);
  assert.equal(retryInstructions.ok, true);
  const beforeRetryCreate = { data: JSON.parse(JSON.stringify(data)) };
  const retryCreated = await PlanningModule.createSanalTaksimPlanBoundMontageAllocation({
    plan: activePlan,
    instructionRequests: retryInstructions.requests
  });
  assert.equal(retryCreated.ok, true, JSON.stringify(retryCreated));
  assert.deepEqual(server.validateSanalTaksimAllocationInstructions({ data }), []);
  assert.deepEqual(server.validateSanalTaksimPlanBoundMontageLinks({ data }), []);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(beforeRetryCreate, { data }), []);

  const beforeDispatch = { data: JSON.parse(JSON.stringify(data)) };
  await harness.StockModule.dispatchMontagePlanToMontage(activePlan.id);
  const shipment = data.montageDispatchShipments.find((row) => row.planId === activePlan.id);
  assert.ok(shipment);
  assert.equal(shipment.status, 'IN_TRANSIT');
  const shipmentAllocations = shipment.parts.flatMap((part) => part.allocations || []);
  assert.equal(shipmentAllocations.reduce((sum, row) => sum + Number(row.qty || 0), 0), 16);
  assert.ok(shipmentAllocations.every((allocation) =>
    allocation.sourceKind === 'WORK_ORDER'
    && !allocation.stockRowId
    && allocation.physicalSegmentId.startsWith('WORK|')
    && allocation.sourceWorkOrderId
    && allocation.sourceWorkOrderLineId
  ));
  assert.equal(data.stock_movements.filter((row) => row.type === 'MONTAGE_DISPATCH_OUT').length, 0);
  assert.ok(data.sanalTaksimAllocationInstructions
    .filter((instruction) => instruction.slices.some((slice) => slice.planId === activePlan.id))
    .every((instruction) => instruction.status === 'COMPLETED'));
  assert.deepEqual(server.validateSanalTaksimAllocationInstructions({ data }), []);
  assert.deepEqual(server.validateSanalTaksimPlanBoundMontageLinks({ data }), []);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(beforeDispatch, { data }), []);

  const inTransitResolved = loadSanalTaksimResolver().resolve(data);
  const workQtyBeforeReceipt = inTransitResolved.segments
    .filter((segment) => segment.sourceKind === 'WORK_ORDER')
    .reduce((sum, segment) => sum + Number(segment.physicalQty || 0), 0);
  const beforeFailedReceipt = JSON.stringify(data);
  const originalSave = harness.context.DB.save;
  harness.context.DB.save = async () => ({ ok: false, error: new Error('faz3-wip-receipt-save-failed') });
  await harness.StockModule.receiveMontageDispatchShipment(shipment.id);
  assert.equal(JSON.stringify(data), beforeFailedReceipt);
  harness.context.DB.save = originalSave;
  await harness.StockModule.receiveMontageDispatchShipment(shipment.id);
  const receivedShipment = data.montageDispatchShipments.find((row) => row.id === shipment.id);
  assert.equal(receivedShipment.status, 'RECEIVED');
  const dispatchOut = data.stock_movements.filter((row) =>
    row.type === 'MONTAGE_DISPATCH_OUT' && row.shipmentId === shipment.id
  );
  assert.equal(dispatchOut.reduce((sum, row) => sum + Number(row.qty || 0), 0), 16);
  assert.ok(dispatchOut.every((row) =>
    row.sourceKind === 'WORK_ORDER'
    && row.physicalSegmentId.startsWith('WORK|')
    && row.sourceWorkOrderId
    && row.sourceWorkOrderLineId
  ));
  const receivedResolved = loadSanalTaksimResolver().resolve(data);
  const workQtyAfterReceipt = receivedResolved.segments
    .filter((segment) => segment.sourceKind === 'WORK_ORDER')
    .reduce((sum, segment) => sum + Number(segment.physicalQty || 0), 0);
  const montageReceivedQty = receivedResolved.segments
    .filter((segment) => segment.stage === 'MONTAGE_RECEIVED')
    .reduce((sum, segment) => sum + Number(segment.physicalQty || 0), 0);
  assert.equal(workQtyBeforeReceipt - workQtyAfterReceipt, 16);
  assert.equal(montageReceivedQty, 16);
  assert.equal(receivedResolved.diagnostics.invariants.segmentKeysConsumedOnce, true);
  assert.equal(receivedResolved.diagnostics.invariants.exactHoldKeysConsumedOnce, true);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructions({ data }), []);
  assert.deepEqual(server.validateSanalTaksimPlanBoundMontageLinks({ data }), []);
});

test('Yeni mod MGS teslim almada exact kaynagi tek kez dusurur, Montaj girisini ve iki movementi atomik yazar', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 6, requiredQty: 12 });
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const data = harness.context.DB.data.data;
  const source = data.stockDepotItems[0];
  const sourceBefore = source.qty;

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);
  const shipment = data.montageDispatchShipments[0];
  assert.equal(source.qty, sourceBefore);
  assert.equal(data.stock_movements.length, 0);

  await harness.StockModule.receiveMontageDispatchShipment(shipment.id);

  assert.equal(source.qty, sourceBefore - 12);
  assert.equal(shipment.status, 'RECEIVED');
  const outMovements = data.stock_movements.filter((row) => row.type === 'MONTAGE_DISPATCH_OUT');
  const receiptMovements = data.stock_movements.filter((row) => row.type === 'MONTAGE_DISPATCH_RECEIPT');
  const receiptStocks = data.stockDepotItems.filter((row) => row.sourceShipmentId === shipment.id);
  assert.equal(outMovements.length, 1);
  assert.equal(receiptMovements.length, 1);
  assert.equal(receiptStocks.length, 1);
  assert.equal(outMovements[0].qty, 12);
  assert.equal(receiptMovements[0].qty, 12);
  assert.equal(receiptStocks[0].qty, 12);
  assert.equal(JSON.stringify(receiptMovements[0].sourceMovementIds), JSON.stringify([outMovements[0].id]));
  assert.equal(
    data.stockDepotItems.reduce((sum, row) => sum + Number(row.qty || 0), 0),
    sourceBefore
  );
  assert.equal(harness.saveCount, 2);

  const afterFirstReceipt = JSON.stringify(data);
  await harness.StockModule.receiveMontageDispatchShipment(shipment.id);
  assert.equal(JSON.stringify(data), afterFirstReceipt);
  assert.equal(harness.saveCount, 2);
});

test('Yeni mod MGS teslim preflighti exact kaynak yetersizse hicbir teslim etkisi yazmaz', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 6, requiredQty: 12 });
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const data = harness.context.DB.data.data;
  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);
  const shipment = data.montageDispatchShipments[0];
  data.stockDepotItems[0].qty = 11;
  data.stockDepotItems[0].quantity = 11;
  const before = JSON.stringify(data);

  await harness.StockModule.receiveMontageDispatchShipment(shipment.id);

  assert.equal(JSON.stringify(data), before);
  assert.equal(harness.saveCount, 1);
  assert.ok(harness.alerts.some((message) => /yetersiz|uyuşmuyor/i.test(message)));
});

test('Yeni mod MGS teslim DB.save hatasinda kaynak, hedef, movement ve shipmenti tam geri alir', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 6, requiredQty: 12 });
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const data = harness.context.DB.data.data;
  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);
  const shipment = data.montageDispatchShipments[0];
  const before = JSON.stringify(data);
  harness.context.DB.save = async () => ({ ok: false, error: new Error('receipt save failed') });

  await harness.StockModule.receiveMontageDispatchShipment(shipment.id);

  assert.equal(JSON.stringify(data), before);
  assert.ok(harness.alerts.some((message) => /teslim alınamadı/i.test(message)));
});

test('Montaj IN_TRANSIT sevki atomik teslim alinir ve unit u3 stokunda izlenir', async () => {
  const denied = buildMontageReceiptHarness({ confirmResult: false });
  const deniedBefore = JSON.stringify(denied.context.DB.data.data);
  await denied.StockModule.receiveMontageDispatchShipment('receipt-shipment-1');
  assert.equal(JSON.stringify(denied.context.DB.data.data), deniedBefore);
  assert.equal(denied.saveCount, 0);

  const harness = buildMontageReceiptHarness();
  await harness.StockModule.receiveMontageDispatchShipment('receipt-shipment-1');
  const shipment = harness.context.DB.data.data.montageDispatchShipments[0];
  const receiptKey = 'MONTAGE_SHIPMENT_RECEIPT|receipt-shipment-1';
  assert.equal(shipment.status, 'RECEIVED');
  assert.ok(shipment.receivedAt);
  assert.equal(shipment.receiptKey, receiptKey);
  assert.equal(shipment.targetLocationId, 'stock-location-unit-u3-montage-receipt');
  assert.equal(harness.plan.status, 'DISPATCHED_TO_MONTAGE');
  assert.equal(harness.context.DB.data.data.stockDepotLocations.length, 1);
  assert.deepEqual(
    Object.fromEntries(['id', 'idCode', 'depotId', 'name', 'purpose'].map((key) => [key, harness.context.DB.data.data.stockDepotLocations[0][key]])),
    {
      id: 'stock-location-unit-u3-montage-receipt', idCode: 'LOC-MONTAGE-RECEIPT', depotId: 'unit:u3',
      name: 'Montaj Giriş / Teslim Alınanlar', purpose: 'MONTAGE_DISPATCH_RECEIPT'
    }
  );
  const receiptStocks = harness.context.DB.data.data.stockDepotItems.filter((row) => row.receiptKey === receiptKey);
  assert.equal(receiptStocks.length, 2);
  assert.deepEqual(Array.from(receiptStocks, (row) => [row.code, row.qty, row.unit]), [['PRC-A', 86, 'ADET'], ['PRC-B', 10, 'ADET']]);
  assert.ok(receiptStocks.every((row) => row.nodeKey === 'unit:u3'
    && row.depotId === 'unit:u3'
    && row.targetUnitId === 'u3'
    && row.locationId === shipment.targetLocationId
    && row.stockClass === 'MONTAGE_RECEIVED'
    && row.status === 'MONTAGE_RECEIVED_AWAITING_START'));
  const receiptMovements = harness.context.DB.data.data.stock_movements.filter((row) => row.type === 'MONTAGE_DISPATCH_RECEIPT');
  assert.equal(receiptMovements.length, 2);
  assert.deepEqual(Array.from(receiptMovements, (row) => [row.code, row.qty, row.sourceMovementIds[0]]), [['PRC-A', 86, 'dispatch-out-a'], ['PRC-B', 10, 'dispatch-out-b']]);
  assert.ok(receiptMovements.every((row) => row.receiptKey === receiptKey && row.targetUnitId === 'u3' && row.targetLocationId === shipment.targetLocationId));
  const readyTotals = harness.StockModule.getMontageReadyStockCodeTotals(harness.plan.items);
  assert.equal(readyTotals.get('PRC-A'), 100);
  assert.equal(readyTotals.has('PRC-B'), false);
  assert.equal(harness.context.DB.data.data.workOrderTransactions, undefined);

  const stockCount = harness.context.DB.data.data.stockDepotItems.length;
  const movementCount = harness.context.DB.data.data.stock_movements.length;
  await harness.StockModule.receiveMontageDispatchShipment('receipt-shipment-1');
  assert.equal(harness.context.DB.data.data.stockDepotItems.length, stockCount);
  assert.equal(harness.context.DB.data.data.stock_movements.length, movementCount);
  assert.equal(harness.saveCount, 1);
});

test('Montaj sevk teslim alma cift tik ve DB.save hatasinda mukerrer veya kalinti birakmaz', async () => {
  const concurrent = buildMontageReceiptHarness({ deferSave: true });
  const first = concurrent.StockModule.receiveMontageDispatchShipment('receipt-shipment-1');
  const second = concurrent.StockModule.receiveMontageDispatchShipment('receipt-shipment-1');
  await second;
  assert.equal(concurrent.saveCount, 1);
  assert.equal(concurrent.context.DB.data.data.stockDepotItems.filter((row) => row.receiptKey).length, 2);
  assert.equal(concurrent.context.DB.data.data.stock_movements.filter((row) => row.type === 'MONTAGE_DISPATCH_RECEIPT').length, 2);
  concurrent.releaseSave({ ok: true });
  await first;
  assert.equal(concurrent.context.DB.data.data.montageDispatchShipments[0].status, 'RECEIVED');

  for (const failureOptions of [{ failSave: true }, { saveReturnsFailure: true }]) {
    const failed = buildMontageReceiptHarness(failureOptions);
    const before = JSON.stringify(failed.context.DB.data.data);
    await failed.StockModule.receiveMontageDispatchShipment('receipt-shipment-1');
    assert.equal(JSON.stringify(failed.context.DB.data.data), before);
    assert.equal(failed.saveCount, 1);
    assert.ok(failed.alerts.some((message) => message.includes('teslim alınamadı')));
    assert.doesNotMatch(failed.alerts.join(' '), /Montaj birimine teslim alındı/);
  }
});

test('Montaj Depoya Ver yalniz PENDING MCT olusturur, Depo Teslim Al stok ve sevkiyata hazir kaydini atomik tamamlar', async () => {
  const harness = buildMontageCompletionHarness();
  const { StockModule, data, line, legacyLine } = harness;
  assert.equal(StockModule.getMontageShipmentReceivedQtyForLine(line), 6);
  assert.equal(StockModule.getMontageCompletionAvailabilityForLine(line).availableQty, 1);
  const legacyAvailability = StockModule.getMontageCompletionAvailabilityForLine(legacyLine);
  assert.equal(legacyAvailability.ok, false);
  assert.match(legacyAvailability.message, /eski sevk miktarları güvenli ürün reçetesi snapshot’ı taşımıyor/);

  const stockBeforePending = JSON.stringify(data.stockDepotItems);
  const movementsBeforePending = JSON.stringify(data.stock_movements);
  const pendingSaved = await StockModule.postMontageCompletionToDepot(line, 1);
  assert.equal(pendingSaved, true);
  assert.equal(harness.saveCount, 1);
  assert.equal(data.montageCompletionTransfers.length, 1);
  const transfer = data.montageCompletionTransfers[0];
  assert.equal(transfer.transferNo, 'MCT-000001');
  assert.equal(transfer.status, 'PENDING_DEPOT_RECEIPT');
  assert.equal(transfer.sourceShipmentNo, 'MGS-000002');
  assert.equal(transfer.sourceOrderId, 'sor-id-1');
  assert.equal(transfer.sourceLineId, 'sor-line-1');
  assert.equal(transfer.productId, 'product-1');
  assert.equal(transfer.variantId, 'variant-1');
  assert.equal(transfer.montageCardCode, 'MON-000001');
  assert.equal(transfer.recipeParts.length, 7);
  assert.equal(JSON.stringify(data.stockDepotItems), stockBeforePending);
  assert.equal(JSON.stringify(data.stock_movements), movementsBeforePending);
  assert.equal(StockModule.getMontageCompletionTransferredQtyForLine(line), 0);
  assert.equal(StockModule.getPendingMontageCompletionQtyForLine(line), 1);
  assert.equal(StockModule.getMontageShipmentReceivedQtyForLine(line) - StockModule.getMontageCompletionTransferredQtyForLine(line), 6);
  assert.equal(StockModule.getMontageReadyForShipmentQtyForLine(line), 0);
  assert.equal(StockModule.getMontageReadyForShipmentRows().length, 0);
  StockModule.getMontageReadyDetailOrderRows = () => [line];
  StockModule.buildMontageReadyJobCards = () => [];
  StockModule.getMontageReadyPlanRows = () => [{ key: 'pending-plan' }];
  StockModule.openPendingMontageCompletionTransfers('pending-plan');
  assert.equal(harness.modalTitle, 'Montajdan Teslim Al');
  assert.match(harness.modalHtml, /MCT No[\s\S]*Ürün \/ Varyant Bilgisi[\s\S]*Adet[\s\S]*Montajın verdiği tarih[\s\S]*İşlemler/);
  assert.match(harness.modalHtml, /MCT-000001[\s\S]*Bombeli 2008 Aluminyum Dikme[\s\S]*SVR-000002[\s\S]*SOR-000001 \/ PLN-000002[\s\S]*Ø40[\s\S]*Aksesuar: eloksal \/ P5 parlak eloksal/);
  assert.match(harness.modalHtml, /openMontageReadyProductCard\('SVR-000002','variant-1','SVR','product-1','variant-1'\)[^>]*>Ürün Kartı<\/button>[\s\S]*Parça Listesi[\s\S]*Teslim Al/);

  const received = await StockModule.receiveMontageCompletionTransferToDepot(transfer.id);
  assert.equal(received, true);
  assert.equal(harness.saveCount, 2);
  assert.equal(transfer.status, 'POSTED');
  assert.equal(transfer.componentAllocations.length, 7);
  assert.equal(transfer.componentAllocations.reduce((sum, row) => sum + row.qty, 0), 8);
  const consumptionMovements = data.stock_movements.filter((row) => row.movementType === 'MONTAGE_COMPONENT_CONSUMPTION');
  assert.equal(consumptionMovements.length, 7);
  assert.equal(consumptionMovements.reduce((sum, row) => sum + row.qty, 0), 8);
  assert.ok(data.stockDepotItems.filter((row) => String(row.id).startsWith('safe-stock-')).every((row) => row.qty === 0));
  const finishedRow = data.stockDepotItems.find((row) => row.id === transfer.finishedProductStockItemId);
  assert.ok(finishedRow);
  assert.equal(finishedRow.depotId, 'depot_profil');
  assert.equal(finishedRow.locationId, 'shipping-r01-a1');
  assert.equal(finishedRow.productType, 'URUN MODELI');
  assert.equal(finishedRow.cardType, 'SVR');
  assert.equal(finishedRow.qty, 1);
  assert.equal(data.stock_movements.find((row) => row.id === transfer.finishedProductMovementId)?.movementType, 'MONTAGE_FINISHED_PRODUCT_IN');
  assert.equal(StockModule.getMontageCompletionTransferredQtyForLine(line), 1);
  assert.equal(StockModule.getMontageShipmentReceivedQtyForLine(line) - StockModule.getMontageCompletionTransferredQtyForLine(line), 5);
  assert.equal(StockModule.getMontageReadyForShipmentQtyForLine(line), 1);
  assert.equal(StockModule.getMontageReadyForShipmentRows().length, 1);

  const secondReceived = await StockModule.receiveMontageCompletionTransferToDepot(transfer.id);
  assert.equal(secondReceived, false);
  assert.equal(harness.saveCount, 2);
  assert.equal(data.montageCompletionTransfers.length, 1);
});

test('Montaj iki asamali akisi miktar ve snapshot hatalarini engeller, her iki DB.save hatasinda rollback yapar', async () => {
  const overQtyHarness = buildMontageCompletionHarness();
  const overQtySaved = await overQtyHarness.StockModule.postMontageCompletionToDepot(overQtyHarness.line, 2);
  assert.equal(overQtySaved, false);
  assert.equal(overQtyHarness.saveCount, 0);
  assert.equal(overQtyHarness.data.montageCompletionTransfers.length, 0);

  const missingPartHarness = buildMontageCompletionHarness();
  missingPartHarness.data.stockDepotItems = missingPartHarness.data.stockDepotItems.filter((row) => row.refId !== 'part-g');
  assert.equal(await missingPartHarness.StockModule.postMontageCompletionToDepot(missingPartHarness.line, 1), true);
  const pendingTransfer = missingPartHarness.data.montageCompletionTransfers[0];
  const missingSaved = await missingPartHarness.StockModule.receiveMontageCompletionTransferToDepot(pendingTransfer.id);
  assert.equal(missingSaved, false);
  assert.equal(missingPartHarness.saveCount, 1);
  assert.equal(pendingTransfer.status, 'PENDING_DEPOT_RECEIPT');
  assert.equal(missingPartHarness.data.stock_movements.length, 0);

  for (const options of [{ failSave: true }, { saveReturnsFailure: true }]) {
    const harness = buildMontageCompletionHarness(options);
    const before = {
      montageCompletionTransfers: JSON.stringify(harness.data.montageCompletionTransfers),
      stockDepotItems: JSON.stringify(harness.data.stockDepotItems),
      stock_movements: JSON.stringify(harness.data.stock_movements)
    };
    const saved = await harness.StockModule.postMontageCompletionToDepot(harness.line, 1);
    assert.equal(saved, false);
    assert.equal(JSON.stringify(harness.data.montageCompletionTransfers), before.montageCompletionTransfers);
    assert.equal(JSON.stringify(harness.data.stockDepotItems), before.stockDepotItems);
    assert.equal(JSON.stringify(harness.data.stock_movements), before.stock_movements);
  }

  for (const mode of ['exception', 'ok-false']) {
    const harness = buildMontageCompletionHarness();
    assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 1), true);
    const transfer = harness.data.montageCompletionTransfers[0];
    const before = JSON.stringify({
      montageCompletionTransfers: harness.data.montageCompletionTransfers,
      stockDepotItems: harness.data.stockDepotItems,
      stock_movements: harness.data.stock_movements
    });
    harness.context.DB.save = async () => {
      if (mode === 'exception') throw new Error('receive save failed');
      return { ok: false, error: new Error('receive save returned failure') };
    };
    assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), false);
    assert.equal(JSON.stringify({
      montageCompletionTransfers: harness.context.DB.data.data.montageCompletionTransfers,
      stockDepotItems: harness.context.DB.data.data.stockDepotItems,
      stock_movements: harness.context.DB.data.data.stock_movements
    }), before);
  }
});

test('Montaj Depoya Ver kismi islemi ve eszamanli cift tik korumasini uygular', async () => {
  const partial = buildMontageCompletionHarness();
  partial.data.montageDispatchShipments[1].items[0].shippedQty = 2;
  partial.data.stockDepotItems.forEach((row) => {
    row.qty *= 2;
    row.quantity *= 2;
    row.amount *= 2;
  });
  assert.equal(await partial.StockModule.postMontageCompletionToDepot(partial.line, 1), true);
  assert.equal(partial.StockModule.getMontageCompletionAvailabilityForLine(partial.line).availableQty, 1);
  assert.equal(await partial.StockModule.postMontageCompletionToDepot(partial.line, 1), true);
  assert.deepEqual(Array.from(partial.data.montageCompletionTransfers, (row) => row.transferNo), ['MCT-000001', 'MCT-000002']);
  assert.equal(partial.StockModule.getMontageCompletionTransferredQtyForLine(partial.line), 0);
  assert.equal(partial.StockModule.getPendingMontageCompletionQtyForLine(partial.line), 2);
  assert.equal(partial.StockModule.getMontageShipmentReceivedQtyForLine(partial.line) - partial.StockModule.getMontageCompletionTransferredQtyForLine(partial.line), 7);
  assert.equal(await partial.StockModule.receiveMontageCompletionTransferToDepot(partial.data.montageCompletionTransfers[0].id), true);
  assert.equal(partial.StockModule.getMontageCompletionTransferredQtyForLine(partial.line), 1);
  assert.equal(partial.StockModule.getPendingMontageCompletionQtyForLine(partial.line), 1);
  assert.equal(await partial.StockModule.receiveMontageCompletionTransferToDepot(partial.data.montageCompletionTransfers[1].id), true);
  assert.equal(partial.StockModule.getMontageCompletionTransferredQtyForLine(partial.line), 2);
  assert.equal(partial.StockModule.getPendingMontageCompletionQtyForLine(partial.line), 0);

  const concurrent = buildMontageCompletionHarness({ deferSave: true });
  const first = concurrent.StockModule.postMontageCompletionToDepot(concurrent.line, 1);
  const second = await concurrent.StockModule.postMontageCompletionToDepot(concurrent.line, 1);
  assert.equal(second, false);
  assert.equal(concurrent.saveCount, 1);
  assert.equal(concurrent.data.montageCompletionTransfers.length, 1);
  concurrent.releaseSave({ ok: true });
  assert.equal(await first, true);
  assert.equal(concurrent.data.montageCompletionTransfers.length, 1);
});

test('Faz 6 rezervi borçtan ikinci kez düşmez: fiziksel 20, SALES borcu 10 ve MGP rezervi 10 iken FREE 10 olur', async () => {
  const harness = buildCompletedSalesSurplusHarness({
    phase6LockedPhysicalQty: 10,
    phase6Reservations: [{
      planId: 'mgp-phase6-unbound',
      prcId: 'part-a',
      prcCode: 'PRC-A',
      unit: 'ADET',
      qty: 10,
      reservedQty: 10
    }]
  });
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 20, sourceQty: 10, unrelatedQty: 0 });
  const capResult = harness.StockModule.buildSalesComponentGlobalSurplusCaps([
    harness.recipeParts.find((part) => part.code === 'PRC-A')
  ]);
  const cap = capResult.caps.get('part-a|PRC-A|ADET');
  assert.equal(capResult.ok, true);
  assert.equal(cap.verifiedPhysicalQty, 20);
  assert.equal(cap.openSalesDebtQty, 10);
  assert.equal(cap.openStockDebtQty, 0);
  assert.equal(cap.globalSurplusQty, 10);
  assert.equal(cap.remainingNewReleaseQty, 10);

  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(
    harness.data.montageCompletionTransfers[0].id
  ), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 10);
  assert.equal(harness.data.stock_movements
    .filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE').length, 1);
});

test('Faz 6 global cap gerçek Sanal Taksim resolver çıktısında exact fiziksel 20 eksi SALES borcu 10 hesaplar', () => {
  const data = {
    partComponentCards: [{ id: 'phase6-prc-a', code: 'PRC-A', unit: 'ADET' }],
    orders: [{
      id: 'phase6-order',
      orderNo: 'SOR-PHASE6',
      status: 'Onaylandi',
      deliveryDate: '2026-08-10',
      lines: [{
        id: 'phase6-order-line',
        productId: 'phase6-product',
        variationId: 'phase6-variant',
        variantCode: 'SVR-PHASE6',
        qty: 10,
        unit: 'ADET'
      }]
    }],
    planningDemands: [{
      id: 'phase6-demand',
      demandCode: 'PLN-PHASE6',
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'phase6-order',
      sourceOrderNo: 'SOR-PHASE6',
      sourceLineId: 'phase6-order-line',
      status: 'RELEASED',
      released_at: '2026-08-01T08:00:00.000Z',
      workOrderIds: ['phase6-work-order'],
      items: [{ id: 'phase6-item', qty: 10, variantCode: 'SVR-PHASE6' }]
    }],
    workOrders: [{
      id: 'phase6-work-order',
      workOrderCode: 'WO-PHASE6',
      sourceId: 'phase6-demand',
      sourceItemKey: 'phase6-item',
      lines: [{
        id: 'phase6-work-line',
        componentId: 'phase6-prc-a',
        componentCode: 'PRC-A',
        targetQty: 10,
        unit: 'ADET',
        routes: [{ id: 'phase6-route', seq: 1, stationId: 'phase6-unit', processId: 'CNC' }]
      }]
    }],
    workOrderTransactions: [],
    stockDepotItems: [{
      id: 'phase6-source-row',
      refId: 'phase6-prc-a',
      productCode: 'PRC-A',
      code: 'PRC-A',
      quantity: 20,
      qty: 20,
      amount: 20,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'phase6-order',
      sourceLineId: 'phase6-order-line',
      demandId: 'phase6-demand',
      itemKey: 'phase6-item',
      depotId: 'main',
      locationId: 'phase6-location'
    }],
    stock_movements: [],
    salesShipments: [],
    montageDispatchPlans: [],
    montageDispatchShipments: [],
    montageCompletionTransfers: []
  };
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: { data: { data } },
    SanalTaksimResolver: loadSanalTaksimResolver()
  });
  const result = StockModule.buildSalesComponentGlobalSurplusCaps([
    { refId: 'phase6-prc-a', code: 'PRC-A', unit: 'ADET' }
  ]);
  const cap = result.caps.get('phase6-prc-a|PRC-A|ADET');
  assert.equal(result.ok, true);
  assert.equal(cap.verifiedPhysicalQty, 20);
  assert.equal(cap.openSalesDebtQty, 10);
  assert.equal(cap.globalSurplusQty, 10);
  assert.equal(cap.existingFreeQty, 0);
  assert.equal(cap.remainingNewReleaseQty, 10);
});

test('Faz 6 gerçek fazla yoksa fiziksel 10 ve açık SALES borcu 10 için stok veya release movement yazmaz', async () => {
  const harness = buildCompletedSalesSurplusHarness({
    phase6LockedPhysicalQty: 10,
    phase6Reservations: [{
      planId: 'mgp-phase6-covered',
      prcId: 'part-a',
      prcCode: 'PRC-A',
      unit: 'ADET',
      qty: 10,
      reservedQty: 10
    }]
  });
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 14, sourceQty: 0, unrelatedQty: 0 });
  const sourceBefore = JSON.stringify(harness.data.stockDepotItems.find((row) => row.id === 'sales-surplus-prc-a'));
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(
    harness.data.montageCompletionTransfers[0].id
  ), true);
  assert.equal(JSON.stringify(harness.data.stockDepotItems.find((row) => row.id === 'sales-surplus-prc-a')), sourceBefore);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 0);
  assert.equal(harness.data.stock_movements
    .filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE').length, 0);
});

test('Faz 6 global surplus 20 olsa da mevcut MCT olayının tekil fiziksel kaynağından en fazla 5 FREE yapar', async () => {
  const harness = buildCompletedSalesSurplusHarness({ phase6LockedPhysicalQty: 10 });
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 30, sourceQty: 5, unrelatedQty: 15 });
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(
    harness.data.montageCompletionTransfers[0].id
  ), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 5);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'unrelated-sales-stock').qty, 15);
  assert.deepEqual(harness.data.stock_movements
    .filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE')
    .map((row) => row.qty), [5]);
});

test('Faz 6 SALES borcu kapalı olsa da aynı exact PRC açık STOCK borcu gerçek fazlayı sıfırlar', async () => {
  const harness = buildCompletedSalesSurplusHarness({
    phase6LockedPhysicalQty: 0,
    phase6SalesDispatchedQty: 10
  });
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 14, sourceQty: 4, unrelatedQty: 0 });
  harness.data.planningDemands.push({
    id: 'pln-stock-phase6',
    sourceType: 'STOCK',
    workOrderIds: ['wo-stock-phase6'],
    items: [{ id: 'pln-stock-item-phase6' }]
  });
  harness.data.workOrders.push({
    id: 'wo-stock-phase6',
    sourceId: 'pln-stock-phase6',
    sourceItemKey: 'pln-stock-item-phase6',
    productCode: 'PRC-A',
    lines: [{ id: 'wo-stock-line-phase6', componentCode: 'PRC-A', targetQty: 4 }]
  });
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(
    harness.data.montageCompletionTransfers[0].id
  ), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 0);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'sales-surplus-prc-a').qty, 4);
  assert.equal(harness.data.stock_movements
    .filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE').length, 0);
});

test('Faz 6 global fazla olsa da kilitli mevcut kaynağı FREE yapmaz ve başka kaynağa geçmez', async () => {
  const harness = buildCompletedSalesSurplusHarness({
    phase6LockedPhysicalQty: 10,
    phase6LockedSourceRowId: 'sales-surplus-prc-a'
  });
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 14, sourceQty: 4, unrelatedQty: 9 });
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transferId = harness.data.montageCompletionTransfers[0].id;
  const before = JSON.stringify(harness.data);
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transferId), false);
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'unrelated-sales-stock').qty, 9);

  const reservedHarness = buildCompletedSalesSurplusHarness({
    phase6LockedPhysicalQty: 10,
    phase6Reservations: [{
      planId: 'mgp-bound-source',
      prcId: 'part-a',
      prcCode: 'PRC-A',
      unit: 'ADET',
      qty: 4,
      reservedQty: 4
    }]
  });
  configurePhase6SalesSurplus(reservedHarness, { requiredQty: 10, netQty: 14, sourceQty: 4, unrelatedQty: 0 });
  reservedHarness.data.stockDepotItems.find((row) => row.id === 'sales-surplus-prc-a').sourcePlanId = 'mgp-bound-source';
  assert.equal(await reservedHarness.StockModule.postMontageCompletionToDepot(reservedHarness.line, 10), true);
  const reservedTransferId = reservedHarness.data.montageCompletionTransfers[0].id;
  const reservedBefore = JSON.stringify(reservedHarness.data);
  assert.equal(await reservedHarness.StockModule.receiveMontageCompletionTransferToDepot(reservedTransferId), false);
  assert.equal(JSON.stringify(reservedHarness.data), reservedBefore);
});

test('Faz 6 UNCERTAIN exact PRC miktarını global hesaba veya FREE kaynağına almaz', async () => {
  const harness = buildCompletedSalesSurplusHarness({
    phase6LockedPhysicalQty: 10,
    phase6UncertainPrcCode: 'PRC-A'
  });
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 14, sourceQty: 4, unrelatedQty: 0 });
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transferId = harness.data.montageCompletionTransfers[0].id;
  const before = JSON.stringify(harness.data);
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transferId), false);
  assert.equal(JSON.stringify(harness.data), before);
  assert.ok(harness.alerts.some((message) => message.includes('Belirsiz fiziksel/lifecycle')));
});

test('Faz 6 ilgisiz kimliksiz UNCERTAIN MGS diagnostic kalır ve aday FREE işlemini engellemez', async () => {
  const harness = buildCompletedSalesSurplusHarness({
    phase6LockedPhysicalQty: 10,
    phase6UncertainEntries: [{
      kind: 'MGS_SHIPMENT',
      id: 'legacy-unrelated-shipment',
      reasonCode: 'MGP_LIFECYCLE_DEMAND_NOT_FOUND',
      prcCode: '',
      unit: '',
      evidenceIds: ['legacy-unrelated-shipment', 'legacy-unrelated-plan'],
      allocatable: false,
      allocatableQty: 0
    }]
  });
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 14, sourceQty: 4, unrelatedQty: 0 });

  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transfer = harness.data.montageCompletionTransfers[0];
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 4);
  assert.equal(harness.data.stock_movements
    .filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE').length, 1);
  assert.equal(harness.phase6ResolverState.uncertainEntries.length, 1);
});

test('Faz 6 adayın lifecycle zincirine bağlı kimliksiz UNCERTAIN MGS FREE işlemini fail-closed engeller', async () => {
  const harness = buildCompletedSalesSurplusHarness({
    phase6LockedPhysicalQty: 10,
    phase6UncertainEntries: [{
      kind: 'MGS_SHIPMENT',
      id: 'uncertain-related-shipment',
      reasonCode: 'MGS_MCT_LIFECYCLE_CONFLICT',
      prcCode: '',
      unit: '',
      evidenceIds: ['uncertain-related-shipment', 'shipment-safe'],
      allocatable: false,
      allocatableQty: 0
    }]
  });
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 14, sourceQty: 4, unrelatedQty: 0 });

  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transferId = harness.data.montageCompletionTransfers[0].id;
  const before = JSON.stringify(harness.data);
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transferId), false);
  assert.equal(JSON.stringify(harness.data), before);
  assert.ok(harness.alerts.some((message) => message.includes('Belirsiz fiziksel/lifecycle')));
});

test('Faz 6 final STORE fiziksel WO kanıtına bağlı kimliksiz UNCERTAIN kaydı fail-closed engeller', async () => {
  const harness = buildCompletedSalesSurplusHarness({
    phase6LockedPhysicalQty: 10,
    phase6UncertainEntries: [{
      kind: 'WORK_TRANSACTION',
      id: 'legacy-uncertain-work-transaction',
      reasonCode: 'TXN_ROUTE_AMBIGUOUS',
      prcCode: '',
      unit: '',
      evidenceIds: ['wo-surplus-1'],
      allocatable: false,
      allocatableQty: 0
    }]
  });
  setCompletedSalesSurplusSourceQty(harness, 0);
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transfer = harness.data.montageCompletionTransfers[0];
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  const { UnitModule, workOrder, alerts } = attachFinalStoreUnitToSurplusHarness(harness);
  const before = JSON.stringify(harness.data);

  assert.equal(await UnitModule.storeWorkOrderQty(workOrder.id, workOrder.lines[0].id, 'u-final', 4, {
    skipPrompt: true, routeSeq: 1, targetScopeId: 'main', targetLocationId: 'loc-main-a', targetLocationCode: 'A-01'
  }), false);
  assert.equal(JSON.stringify(harness.data), before);
  assert.ok(alerts.some((message) => message.includes('Belirsiz fiziksel/lifecycle')));
});

test('Faz 6 origin entitlement sıfırken global exact surplus ve olay kaynağı bir birim FREE üretir', async () => {
  const harness = buildCompletedSalesSurplusHarness({ phase6LockedPhysicalQty: 10 });
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 10, sourceQty: 1, unrelatedQty: 0 });
  const poolRow = harness.data.planningDemands[0].poolAnalysis.rows.find((row) => row.code === 'PRC-A');
  assert.equal(poolRow.netQty - poolRow.requiredQty, 0);

  const capResult = harness.StockModule.buildSalesComponentGlobalSurplusCaps([
    harness.recipeParts.find((part) => part.code === 'PRC-A')
  ]);
  const cap = capResult.caps.get('part-a|PRC-A|ADET');
  assert.equal(capResult.ok, true);
  assert.equal(cap.globalSurplusQty, 1);
  assert.equal(cap.remainingNewReleaseQty, 1);

  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transfer = harness.data.montageCompletionTransfers[0];
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 1);
  assert.deepEqual(harness.data.stock_movements
    .filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE')
    .map((row) => row.qty), [1]);
});

test('Faz 6 resolver hatası veya invariant ihlalinde hiçbir FREE etkisi yazmaz', async () => {
  for (const mode of ['throwError', 'breakInvariant']) {
    const harness = buildCompletedSalesSurplusHarness({ phase6LockedPhysicalQty: 10 });
    configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 14, sourceQty: 4, unrelatedQty: 0 });
    harness.phase6ResolverState[mode] = true;
    assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
    const transferId = harness.data.montageCompletionTransfers[0].id;
    const before = JSON.stringify(harness.data);
    assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transferId), false);
    assert.equal(JSON.stringify(harness.data), before);
  }
});

test('Faz 6 aynı fiziksel kaynak aralığını tekrarlı çağrıda yeniden FREE yapmaz', async () => {
  const harness = buildCompletedSalesSurplusHarness();
  const { StockModule, data, line } = harness;
  assert.equal(await StockModule.postMontageCompletionToDepot(line, 10), true);
  const transfer = data.montageCompletionTransfers[0];
  assert.equal(await StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  assert.equal(harness.montageLineCompletionCallCount, 1);

  const sourceRow = data.stockDepotItems.find((row) => row.id === 'sales-surplus-prc-a');
  assert.equal(sourceRow.qty, 0);
  assert.equal(sourceRow.quantity, 0);
  assert.equal(sourceRow.amount, 0);
  const freeRows = data.stockDepotItems.filter((row) => row.allocationType === 'FREE'
    && row.productCode === 'PRC-A'
    && row.depotId === 'main'
    && row.locationId === 'loc-main-a');
  assert.equal(freeRows.length, 1);
  assert.equal(freeRows[0].qty, 4);
  assert.equal(String(freeRows[0].sourceOrderId || ''), '');
  assert.equal(String(freeRows[0].sourceLineId || ''), '');
  assert.equal(String(freeRows[0].demandId || ''), '');
  assert.equal(String(freeRows[0].itemKey || ''), '');

  const movements = data.stock_movements.filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE');
  assert.equal(movements.length, 1);
  assert.equal(movements[0].qty, 4);
  assert.equal(movements[0].sourceStockDepotItemId, 'sales-surplus-prc-a');
  assert.equal(movements[0].targetStockDepotItemId, freeRows[0].id);
  assert.equal(movements[0].sourceOrderId, 'sor-id-1');
  assert.equal(movements[0].sourceLineId, 'sor-line-1');
  assert.equal(movements[0].demandId, 'pln-id-1');
  assert.equal(movements[0].itemKey, 'pln-item-1');
  assert.equal(movements[0].lineKey, 'SALES_ORDER|sor-id-1|sor-line-1');
  assert.equal(movements[0].triggerMontageCompletionTransferId, transfer.id);
  assert.match(movements[0].idempotencyKey, /^SALES_COMPONENT_SURPLUS_RELEASE\|SALES_ORDER\|sor-id-1\|sor-line-1\|pln-id-1\|pln-item-1\|PRC-A\|ADET\|sales-surplus-prc-a\|0\|4$/);
  assert.equal(data.stockDepotItems.find((row) => row.id === 'unrelated-sales-stock').qty, 9);
  assert.equal(data.workOrderTransactions, undefined);

  const stableSnapshot = JSON.stringify({ stockDepotItems: data.stockDepotItems, stock_movements: data.stock_movements });
  const repeatedRelease = StockModule.releaseSalesComponentSurplusForPostedTransfer(transfer);
  assert.equal(repeatedRelease.ok, true);
  assert.equal(repeatedRelease.releasedQty, 0);
  assert.equal(JSON.stringify({ stockDepotItems: data.stockDepotItems, stock_movements: data.stock_movements }), stableSnapshot);
  assert.equal(await StockModule.receiveMontageCompletionTransferToDepot(transfer.id), false);
  assert.equal(JSON.stringify({ stockDepotItems: data.stockDepotItems, stock_movements: data.stock_movements }), stableSnapshot);
});

test('POSTED MCT stoktan karşılanan ihtiyaç üzerindeki net üretim fazlasını toplam planlanan miktardan hesaplar', async () => {
  const harness = buildCompletedSalesSurplusHarness();
  const { StockModule, data, line } = harness;
  const demand = data.planningDemands.find((row) => row.id === 'pln-id-1');
  const poolRow = demand.poolAnalysis.rows.find((row) => row.code === 'PRC-A');
  const workOrder = data.workOrders.find((row) => row.productCode === 'PRC-A');
  Object.assign(poolRow, {
    requiredQty: 10,
    useStockQty: 10,
    useSemiQty: 0,
    netQty: 5
  });
  workOrder.lotQty = 5;
  workOrder.lines[0].targetQty = 5;
  setCompletedSalesSurplusSourceQty(harness, 5);

  assert.equal(await StockModule.postMontageCompletionToDepot(line, 10), true);
  const transfer = data.montageCompletionTransfers[0];
  assert.equal(await StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 5);
  const releases = data.stock_movements.filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE');
  assert.equal(releases.length, 1);
  assert.equal(releases[0].qty, 5);

  const stableSnapshot = JSON.stringify({ stockDepotItems: data.stockDepotItems, stock_movements: data.stock_movements });
  const repeatedRelease = StockModule.releaseSalesComponentSurplusForPostedTransfer(transfer);
  assert.equal(repeatedRelease.ok, true);
  assert.equal(repeatedRelease.releasedQty, 0);
  assert.equal(JSON.stringify({ stockDepotItems: data.stockDepotItems, stock_movements: data.stock_movements }), stableSnapshot);
});

test('Fazla bileşen mevcut aynı konumlu FREE stok satırında tekilleştirilir', async () => {
  const harness = buildCompletedSalesSurplusHarness();
  configurePhase6SalesSurplus(harness, { requiredQty: 10, netQty: 14, sourceQty: 4, unrelatedQty: 0 });
  harness.data.stockDepotItems.push({
    id: 'existing-free-prc-a',
    productCode: 'PRC-A', code: 'PRC-A', productName: 'Parça A', name: 'Parça A',
    quantity: 3, qty: 3, amount: 3, unit: 'ADET',
    stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', allocationType: 'FREE',
    depotId: 'main', nodeKey: 'managed:main', locationId: 'loc-main-a', locationCode: 'A-01'
  });
  const capResult = harness.StockModule.buildSalesComponentGlobalSurplusCaps([
    harness.recipeParts.find((part) => part.code === 'PRC-A')
  ]);
  const cap = capResult.caps.get('part-a|PRC-A|ADET');
  assert.equal(cap.verifiedPhysicalQty, 17);
  assert.equal(cap.globalSurplusQty, 7);
  assert.equal(cap.existingFreeQty, 3);
  assert.equal(cap.remainingNewReleaseQty, 4);
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transfer = harness.data.montageCompletionTransfers[0];
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  const freeRows = harness.data.stockDepotItems.filter((row) => row.allocationType === 'FREE'
    && row.productCode === 'PRC-A'
    && row.depotId === 'main'
    && row.locationId === 'loc-main-a');
  assert.equal(freeRows.length, 1);
  assert.equal(freeRows[0].id, 'existing-free-prc-a');
  assert.equal(freeRows[0].qty, 7);
});

test('Kısmi, IN_TRANSIT veya PENDING montaj satırında fazla bileşen serbest bırakılmaz', async () => {
  for (const code of ['MONTAGE_COMPLETION_OPEN', 'SHIPMENT_IN_TRANSIT', 'DEPOT_RECEIPT_PENDING']) {
    const harness = buildCompletedSalesSurplusHarness({
      montageLineCompletionState: {
        ok: true,
        completed: false,
        code,
        message: `${code} nedeniyle montaj satırı açık.`
      }
    });
    assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
    const transfer = harness.data.montageCompletionTransfers[0];
    assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
    assert.equal(transfer.status, 'POSTED');
    assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'sales-surplus-prc-a').qty, 4);
    assert.equal(harness.data.stock_movements.some((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE'), false);
  }
});

test('Aynı MGP içindeki ortak bileşenli çoklu satış satırı serbest bırakmayı fail-closed engeller', async () => {
  const harness = buildCompletedSalesSurplusHarness();
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transferId = harness.data.montageCompletionTransfers[0].id;
  harness.data.montageDispatchPlans[0].items.push({
    ...harness.trustedItem,
    sourceOrderId: 'other-order',
    sourceLineId: 'other-line',
    demandId: 'other-demand',
    itemKey: 'other-item',
    productId: 'other-product',
    variantId: 'other-variant',
    variantCode: 'SVR-OTHER',
    orderQty: 1,
    plannedQty: 1
  });
  const before = JSON.stringify({
    montageCompletionTransfers: harness.data.montageCompletionTransfers,
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements
  });
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transferId), false);
  assert.equal(JSON.stringify({
    montageCompletionTransfers: harness.data.montageCompletionTransfers,
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements
  }), before);
  assert.ok(harness.alerts.some((message) => message.includes('birden fazla satış satırı')));
});

test('Faz 6 DB.save hatası MCT, kaynak, FREE stok ve movement etkisini tamamen geri alır', async () => {
  const harness = buildCompletedSalesSurplusHarness();
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transferId = harness.data.montageCompletionTransfers[0].id;
  const before = JSON.stringify({
    montageCompletionTransfers: harness.data.montageCompletionTransfers,
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements
  });
  harness.context.DB.save = async () => { throw new Error('surplus release save failed'); };
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transferId), false);
  assert.equal(JSON.stringify({
    montageCompletionTransfers: harness.data.montageCompletionTransfers,
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements
  }), before);
});

test('POSTED MCT anında CNCde olan 4 fazla final Ana Depo STORE ile bir kez FREE olur', async () => {
  const harness = buildCompletedSalesSurplusHarness();
  setCompletedSalesSurplusSourceQty(harness, 0);
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transfer = harness.data.montageCompletionTransfers[0];
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 0);
  assert.equal(harness.data.stock_movements.filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE').length, 0);

  const { UnitModule, workOrder } = attachFinalStoreUnitToSurplusHarness(harness);
  assert.equal(await UnitModule.storeWorkOrderQty(workOrder.id, workOrder.lines[0].id, 'u-final', 4, {
    skipPrompt: true, routeSeq: 1, targetScopeId: 'main', targetLocationId: 'loc-main-a', targetLocationCode: 'A-01'
  }), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 4);
  const source = harness.data.stockDepotItems.find((row) => row.id === 'sales-surplus-prc-a');
  assert.equal(source.qty, 0);
  assert.equal(source.sourceOrderId, 'sor-id-1');
  assert.equal(source.sourceLineId, 'sor-line-1');
  assert.equal(source.demandId, 'pln-id-1');
  assert.equal(source.itemKey, 'pln-item-1');
  const releases = harness.data.stock_movements.filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE');
  assert.equal(releases.length, 1);
  assert.equal(releases[0].triggerType, 'FINAL_STORE');
  assert.ok(releases[0].triggerStoreMovementId);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'unrelated-sales-stock').qty, 9);

  const stable = JSON.stringify({
    workOrderTransactions: harness.data.workOrderTransactions,
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements
  });
  UnitModule.computeWorkLineUnitMetrics = () => ({
    isFinalStep: true,
    inProcessQty: 0,
    depotPendingQty: 0
  });
  assert.equal(await UnitModule.storeWorkOrderQty(workOrder.id, workOrder.lines[0].id, 'u-final', 4, {
    skipPrompt: true, routeSeq: 1, targetScopeId: 'main', targetLocationId: 'loc-main-a', targetLocationCode: 'A-01'
  }), false);
  assert.equal(JSON.stringify({
    workOrderTransactions: harness.data.workOrderTransactions,
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements
  }), stable);
});

test('Faz 6 MCT ve final STORE aynı fiziksel kaynağı kümülatif sınırın üzerinde iki kez FREE yapmaz', async () => {
  const harness = buildCompletedSalesSurplusHarness();
  setCompletedSalesSurplusSourceQty(harness, 2);
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transfer = harness.data.montageCompletionTransfers[0];
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 2);

  const { UnitModule, workOrder } = attachFinalStoreUnitToSurplusHarness(harness);
  assert.equal(await UnitModule.storeWorkOrderQty(workOrder.id, workOrder.lines[0].id, 'u-final', 2, {
    skipPrompt: true, routeSeq: 1, targetScopeId: 'main', targetLocationId: 'loc-main-a', targetLocationCode: 'A-01'
  }), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 4);
  const releases = harness.data.stock_movements.filter((row) => row.movementType === 'SALES_COMPONENT_SURPLUS_RELEASE');
  assert.deepEqual(releases.map((row) => row.qty), [2, 2]);
  assert.equal(new Set(releases.map((row) => row.idempotencyKey)).size, 2);
  assert.match(releases[1].idempotencyKey, /\|2\|4$/);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'unrelated-sales-stock').qty, 9);
});

test('Montaj tamamlanmamışsa geç STORE satış bağlı kalır ve FREE oluşmaz', async () => {
  const harness = buildCompletedSalesSurplusHarness({
    montageLineCompletionState: { ok: true, completed: false, code: 'MONTAGE_COMPLETION_OPEN', message: 'Montaj açık.' }
  });
  setCompletedSalesSurplusSourceQty(harness, 0);
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transfer = harness.data.montageCompletionTransfers[0];
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  const { UnitModule, workOrder } = attachFinalStoreUnitToSurplusHarness(harness);
  assert.equal(await UnitModule.storeWorkOrderQty(workOrder.id, workOrder.lines[0].id, 'u-final', 4, {
    skipPrompt: true, routeSeq: 1, targetScopeId: 'main', targetLocationId: 'loc-main-a', targetLocationCode: 'A-01'
  }), true);
  assert.equal(getCompletedSalesSurplusFreeQty(harness), 0);
  const source = harness.data.stockDepotItems.find((row) => row.id === 'sales-surplus-prc-a');
  assert.equal(source.qty, 4);
  assert.equal(source.sourceType, 'SALES_ORDER');
});

test('Geç STORE tekil pool eşleşmesi yoksa tüm STORE etkisini fail-closed geri alır', async () => {
  const harness = buildCompletedSalesSurplusHarness();
  setCompletedSalesSurplusSourceQty(harness, 0);
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transfer = harness.data.montageCompletionTransfers[0];
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  const demand = harness.data.planningDemands.find((row) => row.id === 'pln-id-1');
  demand.poolAnalysis.rows.push({ ...demand.poolAnalysis.rows.find((row) => row.code === 'PRC-A') });
  const { UnitModule, workOrder } = attachFinalStoreUnitToSurplusHarness(harness);
  const before = JSON.stringify(harness.data);
  assert.equal(await UnitModule.storeWorkOrderQty(workOrder.id, workOrder.lines[0].id, 'u-final', 4, {
    skipPrompt: true, routeSeq: 1, targetScopeId: 'main', targetLocationId: 'loc-main-a', targetLocationCode: 'A-01'
  }), false);
  assert.equal(JSON.stringify(harness.data), before);
});

test('Geç surplus STORE DB.save başarısızlığında transaction, kaynak, FREE ve movement tam rollback olur', async () => {
  const harness = buildCompletedSalesSurplusHarness();
  setCompletedSalesSurplusSourceQty(harness, 0);
  assert.equal(await harness.StockModule.postMontageCompletionToDepot(harness.line, 10), true);
  const transfer = harness.data.montageCompletionTransfers[0];
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  const { UnitModule, workOrder } = attachFinalStoreUnitToSurplusHarness(harness);
  const before = JSON.stringify(harness.data);
  harness.context.DB.save = async () => ({ ok: false, error: new Error('late store save failed') });
  assert.equal(await UnitModule.storeWorkOrderQty(workOrder.id, workOrder.lines[0].id, 'u-final', 4, {
    skipPrompt: true, routeSeq: 1, targetScopeId: 'main', targetLocationId: 'loc-main-a', targetLocationCode: 'A-01'
  }), false);
  assert.equal(JSON.stringify(harness.data), before);
});

test('Montaj sevk numarasi mevcut MGS numaralariyla cakismadan sirali uretilir', () => {
  const harness = buildMontagePlanHarness();
  harness.context.DB.data.data.montageDispatchShipments.push(
    { id: 's1', shipmentNo: 'MGS-000001', planId: 'p1', status: 'IN_TRANSIT' },
    { id: 's3', shipmentNo: 'MGS-000003', planId: 'p3', status: 'IN_TRANSIT' }
  );
  assert.equal(harness.StockModule.getNextMontageDispatchShipmentNo(), 'MGS-000004');
});

test('Montaj sevki diger DRAFT rezervasyonunu korur ve yetersiz stokta hic yazmaz', async () => {
  const plan = createMontageDispatchPlan();
  const otherPlan = createMontageDispatchPlan({ id: 'other-plan', planNo: 'MGP-000002', requiredQty: 95 });
  otherPlan.items[0].sourceLineId = 'other-line';
  const harness = buildMontagePlanHarness({ plans: [plan, otherPlan], useRealMontagePreflight: true });
  configureMontagePhase5CExactData(harness, { stockQty: 100 });
  const before = JSON.stringify(harness.context.DB.data.data);

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  assert.equal(JSON.stringify(harness.context.DB.data.data), before);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => /exact|rezerv|segment/i.test(message)));
});

test('Montaj sevki eksik veya celiskili birimde ve CANCELLED planda engellenir', async () => {
  const missingPlan = createMontageDispatchPlan({ id: 'missing-unit-plan' });
  const missingHarness = buildMontagePlanHarness({ plans: [missingPlan] });
  missingHarness.context.DB.data.data.stockDepotItems[0].unit = '';
  await missingHarness.StockModule.dispatchMontagePlanToMontage(missingPlan.id);
  assert.equal(missingHarness.context.DB.data.data.montageDispatchShipments.length, 0);
  assert.ok(missingHarness.alerts.some((message) => /exact|uygun|birim/i.test(message)));

  const plan = createMontageDispatchPlan();
  const harness = buildMontagePlanHarness({ plans: [plan] });
  harness.context.DB.data.data.stockDepotItems.push({
    id: 'stock-prc-a-mt', refId: 'part-ref-a', productCode: 'PRC-A', code: 'PRC-A', quantity: 50, qty: 50,
    stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', allocationType: 'FREE', depotId: 'main', nodeKey: 'managed:main',
    locationId: 'loc-main-c', unit: 'MT', created_at: '2026-02-01T00:00:00.000Z'
  });
  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);
  assert.equal(harness.context.DB.data.data.montageDispatchShipments.length, 1);
  assert.equal(harness.context.DB.data.data.stockDepotItems[1].qty, 50);

  const cancelledPlan = createMontageDispatchPlan({ id: 'cancelled-dispatch-plan', status: 'CANCELLED' });
  const cancelledHarness = buildMontagePlanHarness({ plans: [cancelledPlan] });
  await cancelledHarness.StockModule.dispatchMontagePlanToMontage(cancelledPlan.id);
  assert.equal(cancelledHarness.saveCount, 0);
  assert.ok(cancelledHarness.alerts.some((message) => /taslak/i.test(message)));
});

test('Montaj sevki DB.save exception veya basarisiz sonucunda tum veriyi geri alir', async () => {
  for (const options of [{ saveReturnsFailure: true }, { failSave: true }]) {
    const plan = createMontageDispatchPlan();
    const harness = buildMontagePlanHarness({ plans: [plan], ...options });
    const before = JSON.stringify(harness.context.DB.data.data);

    await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

    assert.equal(JSON.stringify(harness.context.DB.data.data), before);
    assert.equal(harness.saveCount, 1);
    assert.ok(harness.alerts.some((message) => message.includes('Montaj sevki oluşturulamadı')));
  }
});

test('Montaj sevki islem kilidinde mukerrer cagrinin yazmasini engeller', async () => {
  const plan = createMontageDispatchPlan();
  const harness = buildMontagePlanHarness({ plans: [plan] });
  harness.StockModule.state.montageDispatchingPlanIds = { [plan.id]: true };
  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);
  assert.equal(harness.saveCount, 0);
  assert.equal(harness.context.DB.data.data.montageDispatchShipments.length, 0);
});

test('Faz 5 ayni exact stok satirindaki kismi araliklari fiziksel etki olmadan tek MGS allocationda toplulastirir', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 5, requiredQty: 5 });
  plan.items[0].recipeParts[0].qtyPerSet = 1;
  plan.exactReservations = [
    {
      ...plan.exactReservations[0],
      reservationKey: `MGP_EXACT|${plan.id}|pln-id-1|pln-item-1|part-ref-a|PRC-A|ADET|STOCK|stock-prc-a|FROM_STOCK|0|2`,
      segmentOffsetStart: 0,
      segmentOffsetEnd: 2,
      qty: 2
    },
    {
      ...plan.exactReservations[0],
      reservationKey: `MGP_EXACT|${plan.id}|pln-id-1|pln-item-1|part-ref-a|PRC-A|ADET|STOCK|stock-prc-a|FROM_STOCK|2|5`,
      segmentOffsetStart: 2,
      segmentOffsetEnd: 5,
      qty: 3
    }
  ];
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const data = harness.context.DB.data.data;
  data.stockDepotItems[0].quantity = 10;
  data.stockDepotItems[0].qty = 10;

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  const shipment = data.montageDispatchShipments[0];
  assert.equal(data.stockDepotItems[0].qty, 10);
  assert.equal(data.stock_movements.length, 0);
  assert.equal(shipment.parts[0].allocations.length, 1);
  assert.equal(shipment.parts[0].allocations[0].qty, 5);
  assert.equal(shipment.parts[0].allocations[0].exactReservationKeys.length, 2);
  assert.equal(
    JSON.stringify(shipment.parts[0].allocations[0].segmentRanges.map((row) => [row.segmentOffsetStart, row.segmentOffsetEnd, row.qty])),
    JSON.stringify([[0, 2, 2], [2, 5, 3]])
  );
  assert.equal(plan.exactReservations.reduce((sum, row) => sum + row.qty, 0), 5);
});

test('Faz 5 cift tikta devam eden tek DB.save boyunca stok movement ve MGSyi tek yazar', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 2, requiredQty: 4 });
  const harness = buildMontagePlanHarness({ plans: [plan], deferSave: true });
  const first = harness.StockModule.dispatchMontagePlanToMontage(plan.id);
  const second = harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  await second;
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.context.DB.data.data.stockDepotItems[0].qty, 100);
  assert.equal(harness.context.DB.data.data.stock_movements.length, 0);
  assert.equal(harness.context.DB.data.data.montageDispatchShipments.length, 1);

  harness.releaseSave({ ok: true });
  await first;
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.context.DB.data.data.stockDepotItems[0].qty, 100);
  assert.equal(harness.context.DB.data.data.stock_movements.length, 0);
});

test('Faz 5 resolver segment drifti ve yetersiz exact stokta FIFOya gecmeden atomik durur', async () => {
  for (const scenario of ['missing-segment', 'insufficient-qty', 'prc-id-drift']) {
    const plan = createMontageDispatchPlan({ plannedQty: 2, requiredQty: 4 });
    const harness = buildMontagePlanHarness({ plans: [plan] });
    const data = harness.context.DB.data.data;
    if (scenario === 'missing-segment') {
      plan.exactReservations[0].physicalSegmentId = 'STOCK|missing-exact-row';
    } else if (scenario === 'insufficient-qty') {
      data.stockDepotItems[0].quantity = 3;
      data.stockDepotItems[0].qty = 3;
    } else {
      data.stockDepotItems[0].refId = 'different-prc-id';
    }
    data.stockDepotItems.push({
      id: `fallback-${scenario}`,
      refId: 'part-ref-a',
      productCode: 'PRC-A',
      code: 'PRC-A',
      quantity: 100,
      qty: 100,
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      allocationType: 'FREE',
      depotId: 'main',
      nodeKey: 'managed:main',
      locationId: `loc-${scenario}`,
      unit: 'ADET'
    });
    const before = JSON.stringify(data);

    await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

    assert.equal(JSON.stringify(data), before);
    assert.equal(harness.saveCount, 0);
    assert.ok(harness.alerts.some((message) => /exact|segment|yetersiz|PRC/i.test(message)));
  }
});

test('Faz 5 coklu parcada tek eksik exact satir tum fiziksel yazimi engeller', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 2, requiredQty: 4 });
  plan.items[0].recipeParts.push({
    refId: 'part-ref-b', code: 'PRC-B', name: 'Ikinci Parca', unit: 'ADET', qtyPerSet: 1
  });
  plan.parts.push({
    source: 'part', refId: 'part-ref-b', code: 'PRC-B', name: 'Ikinci Parca', unit: 'ADET', requiredQty: 2
  });
  plan.exactReservations.push({
    ...plan.exactReservations[0],
    reservationKey: `MGP_EXACT|${plan.id}|pln-id-1|pln-item-1|part-ref-b|PRC-B|ADET|STOCK|stock-prc-b|FROM_STOCK|0|2`,
    prcId: 'part-ref-b',
    prcCode: 'PRC-B',
    physicalSegmentId: 'STOCK|stock-prc-b',
    segmentOffsetStart: 0,
    segmentOffsetEnd: 2,
    qty: 2
  });
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const data = harness.context.DB.data.data;
  data.partComponentCards.push({ id: 'part-ref-b', code: 'PRC-B', unit: 'ADET' });
  data.stockDepotItems.push({
    id: 'stock-prc-b',
    refId: 'part-ref-b',
    productCode: 'PRC-B',
    code: 'PRC-B',
    quantity: 1,
    qty: 1,
    stockClass: 'KULLANILABILIR',
    status: 'KULLANILABILIR',
    allocationType: 'FREE',
    depotId: 'main',
    nodeKey: 'managed:main',
    locationId: 'loc-main-b',
    unit: 'ADET'
  });
  const before = JSON.stringify(data);

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  assert.equal(JSON.stringify(data), before);
  assert.equal(harness.saveCount, 0);
  assert.equal(data.stock_movements.length, 0);
  assert.equal(plan.status, 'DRAFT');
});

test('Faz 5 FROM_PRODUCTION yalniz ayni demand item exact satirini sevkte kilitler', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 2, requiredQty: 4 });
  plan.exactReservations[0].sourceBucket = 'FROM_PRODUCTION';
  plan.exactReservations[0].reservationKey =
    `MGP_EXACT|${plan.id}|pln-id-1|pln-item-1|part-ref-a|PRC-A|ADET|STOCK|own-production|FROM_PRODUCTION|0|4`;
  plan.exactReservations[0].physicalSegmentId = 'STOCK|own-production';
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const data = harness.context.DB.data.data;
  data.stockDepotItems = [
    {
      id: 'foreign-production',
      refId: 'part-ref-a',
      productCode: 'PRC-A',
      code: 'PRC-A',
      quantity: 20,
      qty: 20,
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'foreign-order',
      sourceLineId: 'foreign-line',
      demandId: 'foreign-demand',
      itemKey: 'foreign-item',
      productionOriginVerified: true,
      depotId: 'main',
      nodeKey: 'managed:main',
      locationId: 'loc-foreign',
      unit: 'ADET'
    },
    {
      id: 'own-production',
      refId: 'part-ref-a',
      productCode: 'PRC-A',
      code: 'PRC-A',
      quantity: 10,
      qty: 10,
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'sor-id-1',
      sourceLineId: 'sor-line-1',
      demandId: 'pln-id-1',
      itemKey: 'pln-item-1',
      productionOriginVerified: true,
      depotId: 'main',
      nodeKey: 'managed:main',
      locationId: 'loc-own',
      unit: 'ADET'
    }
  ];

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  assert.equal(data.stockDepotItems[0].qty, 20);
  assert.equal(data.stockDepotItems[1].qty, 10);
  assert.equal(data.stock_movements.length, 0);
  assert.equal(data.montageDispatchShipments[0].parts[0].allocations[0].stockDepotItemId, 'own-production');
  assert.equal(data.montageDispatchShipments[0].parts[0].allocations[0].sourceBucket, 'FROM_PRODUCTION');
});

test('Faz 5 legacy FROM_SEMI ve desteklenmeyen bucket MGPlerini fail-closed reddeder', async () => {
  for (const scenario of ['legacy', 'semi', 'unsupported']) {
    const plan = createMontageDispatchPlan({ plannedQty: 2, requiredQty: 4 });
    if (scenario === 'legacy') delete plan.exactReservations;
    if (scenario === 'semi') plan.exactReservations[0].sourceBucket = 'FROM_SEMI';
    if (scenario === 'unsupported') plan.exactReservations[0].sourceBucket = 'LEGACY_SHARED';
    const harness = buildMontagePlanHarness({ plans: [plan] });
    const before = JSON.stringify(harness.context.DB.data.data);

    await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

    assert.equal(JSON.stringify(harness.context.DB.data.data), before);
    assert.equal(harness.saveCount, 0);
    assert.ok(harness.alerts.some((message) => /exact|legacy|SEMI|desteklenmiyor/i.test(message)));
  }
});

test('Faz 5 basarili MGS sevkte stok rezervini allocationla mutabik tutar ve movementi teslim almaya birakir', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 3, requiredQty: 6 });
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const data = harness.context.DB.data.data;
  const beforeQty = data.stockDepotItems[0].qty;

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  const stockDrop = beforeQty - data.stockDepotItems[0].qty;
  const reservationQty = plan.exactReservations.reduce((sum, row) => sum + Number(row.qty || 0), 0);
  const movementQty = data.stock_movements.reduce((sum, row) => sum + Number(row.qty || 0), 0);
  const allocationQty = data.montageDispatchShipments[0].parts
    .flatMap((part) => part.allocations)
    .reduce((sum, row) => sum + Number(row.qty || 0), 0);
  assert.deepEqual([stockDrop, reservationQty, movementQty, allocationQty], [0, 6, 0, 6]);
});

test('Montaj plani aktif urun ve ortak parca rezervasyonunu merkezi hesaplar', () => {
  const existingPlan = {
    id: 'plan-existing',
    planNo: 'MGP-000001',
    status: 'DRAFT',
    items: [{
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'sor-id-1',
      sourceLineId: 'sor-line-1',
      demandId: 'pln-id-1',
      itemKey: 'pln-item-1',
      plannedQty: 6
    }],
    parts: [{ source: 'part', refId: 'part-ref-a', code: 'PRC-A', requiredQty: 12 }]
  };
  const harness = buildMontagePlanHarness({ plans: [existingPlan] });
  harness.context.DB.data.data.stockDepotItems[0].quantity = 20;
  harness.context.DB.data.data.stockDepotItems[0].qty = 20;
  const snapshot = harness.StockModule.getMontagePlanReservationSnapshot();
  assert.equal(harness.StockModule.getMontagePlanLineReservedQty(existingPlan.items[0], snapshot), 6);
  assert.equal(harness.StockModule.getMontagePlanPartAvailableQty(existingPlan.parts[0], null, snapshot, existingPlan.items), 8);
  const result = harness.StockModule.validateMontageDispatchPlanPartCapacity([
    { source: 'part', refId: 'part-ref-a', code: 'PRC-A', name: 'Ortak Parca', requiredQty: 9 }
  ], snapshot, existingPlan.items);
  assert.equal(result.ok, false);
});

test('Montaj plani kayit aninda yeniden hesaplanan urun kapasitesini asamaz', async () => {
  const existingPlan = {
    id: 'plan-existing',
    planNo: 'MGP-000001',
    status: 'DRAFT',
    items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-1', sourceLineId: 'sor-line-1', plannedQty: 6 }],
    parts: [{ source: 'part', refId: 'part-ref-a', code: 'PRC-A', requiredQty: 12 }]
  };
  const harness = buildMontagePlanHarness({ plans: [existingPlan] });
  configureMontagePlanSave(harness.StockModule, { plannedQty: 5, sendableQty: 4 });
  await harness.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(harness.context.DB.data.data.montageDispatchPlans.length, 1);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => message.includes('En fazla: 4')));
});

test('SOR-000001 RECEIVED sevk ve guvenilir satir anahtarlariyla 10 ve 13 gonderilebilir hesaplar', () => {
  const harness = buildMontagePlanHarness();
  const data = harness.context.DB.data.data;
  data.orders = [
    {
      id: 'order-sor-1', orderNo: 'SOR-000001', lines: [
        { id: 'line-svr-2', variantCode: 'SVR-000002', qty: 15 },
        { id: 'line-svr-1', variantCode: 'SVR-000001', qty: 20 }
      ]
    },
    { id: 'order-other', orderNo: 'SOR-OTHER', lines: [{ id: 'line-other', variantCode: 'SVR-000002', qty: 50 }] }
  ];
  data.planningDemands = [
    {
      id: 'demand-svr-2', sourceType: 'SALES_ORDER', sourceOrderId: 'order-sor-1', sourceOrderNo: 'SOR-000001',
      sourceLineId: 'line-svr-2', items: [{ id: 'item-svr-2', itemType: 'MODEL', variantCode: 'SVR-000002', qty: 15 }]
    },
    {
      id: 'demand-svr-1', sourceType: 'SALES_ORDER', sourceOrderId: 'order-sor-1', sourceOrderNo: 'SOR-000001',
      sourceLineId: 'line-svr-1', items: [{ id: 'item-svr-1', itemType: 'MODEL', variantCode: 'SVR-000001', qty: 20 }]
    }
  ];
  data.montageDispatchShipments = [
    {
      id: 'shipment-received', shipmentNo: 'MGS-000001', status: 'RECEIVED', items: [
        { sourceType: 'SALES_ORDER', sourceOrderId: 'order-sor-1', sourceLineId: 'line-svr-2', variantCode: 'SVR-000002', shippedQty: 5 },
        { sourceType: 'SALES_ORDER', sourceOrderId: 'order-sor-1', sourceLineId: 'line-svr-1', variantCode: 'SVR-000001', shippedQty: 7 }
      ]
    },
    {
      id: 'shipment-other-order', status: 'IN_TRANSIT',
      items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-other', sourceLineId: 'line-other', variantCode: 'SVR-000002', shippedQty: 40 }]
    },
    {
      id: 'shipment-other-order-received', status: 'RECEIVED',
      items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-other', sourceLineId: 'line-other', variantCode: 'SVR-000002', shippedQty: 30 }]
    }
  ];
  data.montageDispatchPlans = [
    {
      id: 'plan-other-draft', status: 'DRAFT',
      items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-other', sourceLineId: 'line-other', variantCode: 'SVR-000002', plannedQty: 4 }]
    },
    {
      id: 'plan-cancelled', status: 'CANCELLED',
      items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-sor-1', sourceLineId: 'line-svr-2', plannedQty: 99 }]
    },
    {
      id: 'plan-dispatched', status: 'DISPATCHED_TO_MONTAGE',
      items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-sor-1', sourceLineId: 'line-svr-1', plannedQty: 99 }]
    }
  ];
  data.montageJobDispatches = [
    { id: 'legacy-svr-2', dispatchKey: 'demand-svr-2::SALES_ORDER::SVR-000002', sentQty: 99 }
  ];

  const rows = harness.StockModule.getMontageReadyDetailOrderRows({
    jobs: [
      { key: 'job-svr-2', demandId: 'demand-svr-2', itemKey: 'item-svr-2', variantCode: 'SVR-000002', calculable: true, readySetQty: 14 },
      { key: 'job-svr-1', demandId: 'demand-svr-1', itemKey: 'item-svr-1', variantCode: 'SVR-000001', calculable: true, readySetQty: 18 }
    ]
  });
  const svr2 = rows.find((row) => row.svrCode === 'SVR-000002');
  const svr1 = rows.find((row) => row.svrCode === 'SVR-000001');
  assert.equal(svr2.alreadySentQty, 5);
  assert.equal(svr2.activePlanReservedQty, 0);
  assert.equal(svr2.sendableQty, 10);
  assert.equal(svr2.montageReceivedQty, 5);
  assert.equal(svr2.shipmentReadyQty, 0);
  assert.equal(svr1.alreadySentQty, 7);
  assert.equal(svr1.activePlanReservedQty, 0);
  assert.equal(svr1.sendableQty, 13);
  assert.equal(svr1.montageReceivedQty, 7);
  assert.equal(svr1.shipmentReadyQty, 0);
});

test('Montaj plani kaydinda RECEIVED ve IN_TRANSIT ust sinirlari yeniden dogrulanir', async () => {
  for (const scenario of [
    { orderQty: 15, shippedQty: 5, status: 'RECEIVED', readyQty: 14, plannedQty: 11, max: 10 },
    { orderQty: 20, shippedQty: 7, status: 'IN_TRANSIT', readyQty: 18, plannedQty: 14, max: 13 }
  ]) {
    const harness = buildMontagePlanHarness();
    harness.context.DB.data.data.orders[0].lines[0].qty = scenario.orderQty;
    harness.context.DB.data.data.montageDispatchShipments.push({
      id: `shipment-${scenario.status}`, status: scenario.status,
      items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-1', sourceLineId: 'sor-line-1', shippedQty: scenario.shippedQty }]
    });
    configureMontagePlanSave(harness.StockModule, {
      plannedQty: scenario.plannedQty,
      sendableQty: scenario.readyQty,
      orderQty: scenario.orderQty
    });

    await harness.StockModule.validateMontageReadyDetailSendPlan();

    assert.equal(harness.context.DB.data.data.montageDispatchPlans.length, 0);
    assert.equal(harness.saveCount, 0);
    assert.ok(harness.alerts.some((message) => message.includes(`En fazla: ${scenario.max}`)));
  }
});

test('Elle hazirlanan yuksek DRAFT plan gercek sevkten hemen once engellenir', async () => {
  const plan = createMontageDispatchPlan({ plannedQty: 11, requiredQty: 22 });
  const harness = buildMontagePlanHarness({ plans: [plan] });
  harness.context.DB.data.data.orders[0].lines[0].qty = 15;
  harness.context.DB.data.data.montageDispatchShipments.push({
    id: 'shipment-old', planId: 'plan-old', status: 'RECEIVED',
    items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'sor-id-1', sourceLineId: 'sor-line-1', shippedQty: 5 }]
  });

  await harness.StockModule.dispatchMontagePlanToMontage(plan.id);

  assert.equal(plan.status, 'DRAFT');
  assert.equal(harness.context.DB.data.data.montageDispatchShipments.length, 1);
  assert.equal(harness.saveCount, 0);
  assert.ok(harness.alerts.some((message) => message.includes('En fazla: 10')));
});

test('STOCK miktari demandId itemKey ile hesaplanir ve SVR fallback kullanilmaz', () => {
  const harness = buildMontagePlanHarness();
  const data = harness.context.DB.data.data;
  data.planningDemands = [{
    id: 'stock-demand', sourceType: 'STOCK', items: [
      { id: 'stock-item-1', itemType: 'MODEL', variantCode: 'SVR-STOCK', qty: 12 },
      { id: 'stock-item-2', itemType: 'MODEL', variantCode: 'SVR-STOCK', qty: 30 }
    ]
  }];
  data.montageDispatchShipments = [
    { id: 'stock-in-transit', status: 'IN_TRANSIT', items: [{ sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-1', shippedQty: 3 }] },
    { id: 'stock-other-received', status: 'RECEIVED', items: [{ sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-2', variantCode: 'SVR-STOCK', shippedQty: 20 }] }
  ];
  data.montageDispatchPlans = [
    { id: 'stock-draft', status: 'DRAFT', items: [{ sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-1', plannedQty: 2 }] },
    { id: 'stock-cancelled', status: 'CANCELLED', items: [{ sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-1', plannedQty: 8 }] },
    { id: 'stock-dispatched', status: 'DISPATCHED_TO_MONTAGE', items: [{ sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-1', plannedQty: 8 }] }
  ];

  const availability = harness.StockModule.getMontageLineDispatchAvailability(
    { sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-1' },
    { partCapacityQty: 10 }
  );
  assert.equal(availability.ok, true);
  assert.equal(availability.shipmentQty, 3);
  assert.equal(availability.draftPlanQty, 2);
  assert.equal(availability.remainingQty, 7);
  assert.equal(availability.sendableQty, 7);
  assert.equal(harness.StockModule.getMontageShipmentReceivedQtyForLine(
    { sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-1' }
  ), 0);
  assert.equal(harness.StockModule.getMontageShipmentReceivedQtyForLine(
    { sourceType: 'STOCK', demandId: 'stock-demand', itemKey: 'stock-item-2' }
  ), 20);

  const unreliable = harness.StockModule.getMontageLineDispatchAvailability(
    { sourceType: 'STOCK', demandId: 'stock-demand', itemKey: '' },
    { partCapacityQty: 99 }
  );
  assert.equal(unreliable.ok, false);
  assert.equal(unreliable.sendableQty, 0);

  const rows = harness.StockModule.getMontageReadyDetailOrderRows({
    jobs: [{
      key: 'wrong-job', demandId: 'stock-demand', itemKey: 'missing-item', variantCode: 'SVR-STOCK',
      calculable: true, readySetQty: 99
    }]
  });
  assert.ok(rows.every((row) => row.sendableQty === 0 && row.sendableCalculable === false));
});

test('Montaj plani ortak kimlikli parcalari birlestirir, farkli kimlikli ayni adlari ayirir', () => {
  const harness = buildMontagePlanHarness();
  const jobs = vm.runInContext(`new Map([
    ['job-1', { partRows: [{ key: 'r1', source: 'part', refId: 'ref-a', code: 'PRC-A', name: 'Ayni Ad', qtyPerSet: 2 }] }],
    ['job-2', { partRows: [{ key: 'r2', source: 'part', refId: 'ref-a', code: 'PRC-A', name: 'Ayni Ad', qtyPerSet: 2 }] }],
    ['job-3', { partRows: [{ key: 'r3', source: 'part', refId: 'ref-b', code: 'PRC-B', name: 'Ayni Ad', qtyPerSet: 1 }] }]
  ])`, harness.context);
  const parts = harness.StockModule.buildMontageDispatchPlanParts([
    { montageJobKey: 'job-1', plannedQty: 3 },
    { montageJobKey: 'job-2', plannedQty: 2 },
    { montageJobKey: 'job-3', plannedQty: 4 }
  ], jobs);
  assert.equal(parts.length, 2);
  assert.equal(parts.find((part) => part.refId === 'ref-a').requiredQty, 10);
  assert.equal(parts.find((part) => part.refId === 'ref-b').requiredQty, 4);
  assert.equal(harness.StockModule.getMontagePlanPartReservationKey({ source: 'component', code: 'prc-c' }), 'component|code:PRC-C');
});

test('Montaj plan parca agregasyonu resolver birimini korur ve unit celiskisinde fail closed kalir', () => {
  const harness = buildMontagePlanHarness();
  const data = harness.context.DB.data.data;
  const jobs = vm.runInContext(`new Map([
    ['job-1', { partRows: [{ key: 'r1', source: 'part', refId: 'part-ref-a', code: 'PRC-A', name: 'Parca A', unit: 'adet', qtyPerSet: 2 }] }]
  ])`, harness.context);
  const selectedItems = [{
    montageJobKey: 'job-1', plannedQty: 3, sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-id-1', sourceLineId: 'sor-line-1'
  }];

  data.stockDepotItems = [];
  const wipBackedParts = harness.StockModule.buildMontageDispatchPlanParts(selectedItems, jobs);
  assert.equal(wipBackedParts.length, 1);
  assert.equal(wipBackedParts[0].requiredQty, 6);
  assert.equal(wipBackedParts[0].unit, 'ADET');

  data.stockDepotItems = [{
    id: 'stock-prc-a-conflict', refId: 'part-ref-a', productCode: 'PRC-A', code: 'PRC-A',
    quantity: 10, qty: 10, stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR',
    allocationType: 'FREE', depotId: 'main', nodeKey: 'managed:main', locationId: 'loc-main-a',
    unit: 'KG', created_at: '2026-01-01T00:00:00.000Z'
  }];
  const conflictingParts = harness.StockModule.buildMontageDispatchPlanParts(selectedItems, jobs);
  assert.equal(conflictingParts.length, 1);
  assert.equal(conflictingParts[0].unit, '');
});

test('Montaj plan sevk ve tamamlama koleksiyonlari varsayilan veri ve iki tarafli kritik korumada tanimlidir', () => {
  const appCore = fs.readFileSync(path.join(__dirname, '..', 'src/core/app-core.js'), 'utf8');
  const server = fs.readFileSync(path.join(__dirname, '..', 'serve.js'), 'utf8');
  assert.match(appCore, /montageDispatchPlans:\s*\[\]/);
  assert.match(appCore, /montageDispatchShipments:\s*\[\]/);
  assert.match(appCore, /montageCompletionTransfers:\s*\[\]/);
  assert.match(appCore, /salesShipmentPlans:\s*\[\]/);
  assert.match(appCore, /salesShipments:\s*\[\]/);
  assert.match(appCore, /CRITICAL_STATE_COLLECTIONS[\s\S]*["']montageDispatchPlans["']/);
  assert.match(appCore, /CRITICAL_STATE_COLLECTIONS[\s\S]*["']montageDispatchShipments["']/);
  assert.match(appCore, /CRITICAL_STATE_COLLECTIONS[\s\S]*["']montageCompletionTransfers["']/);
  assert.match(appCore, /CRITICAL_STATE_COLLECTIONS[\s\S]*["']salesShipmentPlans["']/);
  assert.match(appCore, /CRITICAL_STATE_COLLECTIONS[\s\S]*["']salesShipments["']/);
  assert.match(server, /criticalStateCollections[\s\S]*["']montageDispatchPlans["']/);
  assert.match(server, /criticalStateCollections[\s\S]*["']montageDispatchShipments["']/);
  assert.match(server, /criticalStateCollections[\s\S]*["']montageCompletionTransfers["']/);
  assert.match(server, /criticalStateCollections[\s\S]*["']salesShipmentPlans["']/);
  assert.match(server, /criticalStateCollections[\s\S]*["']salesShipments["']/);
  assert.match(appCore, /sor000001_montage_demo_cleanup[\s\S]*["']montageCompletionTransfers["'][\s\S]*["']stock_movements["'][\s\S]*["']stockDepotItems["']/);
  assert.match(server, /sor000001_montage_demo_cleanup[\s\S]*["']montageCompletionTransfers["'][\s\S]*["']stock_movements["'][\s\S]*["']stockDepotItems["']/);
});

test('Montaj plani iptal edilince rezervasyonu birakir ve gecmisi korur', async () => {
  const plan = {
    id: 'plan-cancel',
    planNo: 'MGP-000001',
    status: 'DRAFT',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    cancelledAt: '',
    items: [{ sourceType: 'STOCK', demandId: 'pln-1', itemKey: 'item-1', plannedQty: 5 }],
    parts: [{ source: 'part', refId: 'ref-a', code: 'PRC-A', requiredQty: 10 }]
  };
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const physicalQtyBefore = harness.context.DB.data.data.stockDepotItems[0].quantity;
  assert.equal(harness.StockModule.getMontagePlanPartAvailableQty(plan.parts[0], null, null, plan.items), 90);
  await harness.StockModule.cancelMontageDispatchPlan('plan-cancel');
  assert.equal(plan.status, 'CANCELLED');
  assert.ok(plan.cancelledAt);
  assert.equal(harness.context.DB.data.data.montageDispatchPlans.length, 1);
  const snapshot = harness.StockModule.getMontagePlanReservationSnapshot();
  assert.equal(snapshot.lineQtyByKey.size, 0);
  assert.equal(snapshot.partQtyByKey.size, 0);
  assert.equal(harness.StockModule.getMontagePlanPartAvailableQty(plan.parts[0], null, null, plan.items), 100);
  assert.equal(harness.context.DB.data.data.stockDepotItems[0].quantity, physicalQtyBefore);
  assert.doesNotMatch(harness.modalHtml, /MGP-000001/);
  harness.StockModule.openMontageDispatchPlans('archive');
  assert.doesNotMatch(harness.modalHtml, /MGP-000001|İptal Edilenler \/ Arşiv/);
  await harness.StockModule.cancelMontageDispatchPlan('plan-cancel');
  assert.equal(harness.saveCount, 1);
});

test('Montaj planlari modalinda yalniz aktif ve sevk edilen sekmeleri kalir', () => {
  const draft = { id: 'draft-1', planNo: 'MGP-000010', status: 'DRAFT', items: [], parts: [], createdAt: '2026-01-02' };
  const dispatched = { id: 'dispatched-1', planNo: 'MGP-000011', status: 'DISPATCHED_TO_MONTAGE', items: [], parts: [], createdAt: '2026-01-03' };
  const cancelled = { id: 'cancelled-1', planNo: 'MGP-000009', status: 'CANCELLED', items: [], parts: [], createdAt: '2026-01-01' };
  const harness = buildMontagePlanHarness({ plans: [draft, dispatched, cancelled] });
  harness.context.DB.data.data.montageDispatchShipments.push({ id: 'shipment-11', shipmentNo: 'MGS-000011', planId: 'dispatched-1', status: 'IN_TRANSIT' });

  harness.StockModule.openMontageDispatchPlans();
  assert.match(harness.modalHtml, /Aktif Planlar/);
  assert.match(harness.modalHtml, /MGP-000010/);
  assert.doesNotMatch(harness.modalHtml, /MGP-000009/);
  assert.match(harness.modalHtml, /Montaja Sevk Et/);
  assert.match(harness.modalHtml, /İptal Et/);

  harness.StockModule.openMontageDispatchPlans('dispatched');
  assert.match(harness.modalHtml, /Sevk Edilenler/);
  assert.match(harness.modalHtml, /MGP-000011/);
  assert.match(harness.modalHtml, /MGS-000011/);
  assert.doesNotMatch(harness.modalHtml, /MGP-000010|MGP-000009/);
  assert.doesNotMatch(harness.modalHtml, /Montaja Sevk Et|İptal Et/);

  harness.StockModule.openMontageDispatchPlans('archive');
  assert.match(harness.modalHtml, /Aktif Planlar/);
  assert.match(harness.modalHtml, /MGP-000010/);
  assert.doesNotMatch(harness.modalHtml, /İptal Edilenler \/ Arşiv|MGP-000009/);
  harness.StockModule.openMontageDispatchPlanDetail('cancelled-1');
  assert.match(harness.modalHtml, /MGP-000009/);
});

test('Montaj plan goruntule DRAFT ve sevk snapshotlarini guvenli yazdirir ve kartlari acar', () => {
  const draft = {
    id: 'draft-print', planNo: 'MGP-000020', status: 'DRAFT', createdAt: '2026-07-13T09:00:00.000Z',
    customerName: 'Snapshot Müşteri',
    items: [
      { sourceType: 'SALES_ORDER', sourceOrderNo: 'SOR-000001', demandCode: 'PLN-000002', productId: 'product-1', variantId: 'variation-2', variantCode: 'SVR-000002', productName: 'Aynı Ürün', orderQty: 10, plannedQty: 5 },
      { sourceType: 'SALES_ORDER', sourceOrderNo: 'SOR-000001', demandCode: 'PLN-000003', productId: 'product-1', variantId: 'variation-1', variantCode: 'SVR-000001', productName: 'Aynı Ürün', orderQty: 12, plannedQty: 7 }
    ],
    parts: [{ source: 'component', refId: 'part-ref-18', code: 'PRC-000018', name: 'Snapshot Parça', requiredQty: 30, unit: 'ADET' }]
  };
  const harness = buildMontagePlanHarness({ plans: [draft] });
  const before = JSON.stringify(harness.context.DB.data.data);

  harness.StockModule.openMontageDispatchPlanDetail('draft-print');
  assert.match(harness.modalHtml, />Yazdır<\/button>/);
  assert.match(harness.modalHtml, /openMontageDispatchPlanProductCard\('product-1','variation-2','SVR-000002'\)/);
  assert.match(harness.modalHtml, /openMontageDispatchPlanProductCard\('product-1','variation-1','SVR-000001'\)/);
  assert.match(harness.modalHtml, /openMontageDispatchPlanPartCard\('part-ref-18','','PRC-000018'\)/);
  assert.equal(harness.modalStack.length, 1);

  harness.StockModule.printMontageDispatchPlan('draft-print');
  assert.equal(harness.printedModel.mode, 'PREPARATION');
  assert.equal(harness.printedModel.title, 'Montaj Hazırlık Listesi');
  assert.deepEqual(Array.from(harness.printedModel.items, (item) => item.variantCode), ['SVR-000002', 'SVR-000001']);
  assert.equal(harness.printedModel.parts[0].code, 'PRC-000018');
  const printUnit = buildMontageJobsReadonlyHarness().UnitModule;
  const draftHtml = printUnit.buildMontageReadOnlyChecklistPrintHtml(harness.printedModel);
  assert.match(draftHtml, /Montaj Hazırlık Listesi/);
  assert.match(draftHtml, /MGP-000020/);
  assert.match(draftHtml, /Satış Siparişi/);
  assert.match(draftHtml, /SOR-000001/);
  assert.match(draftHtml, /PLN-000002, PLN-000003/);
  assert.match(draftHtml, /Snapshot Müşteri/);
  assert.match(draftHtml, /Sipariş \/ üretim adedi/);
  assert.match(draftHtml, /Planlanan adet/);
  assert.match(draftHtml, /Gereken adet/);
  assert.match(draftHtml, /Hazırlık notu/);
  assert.equal((draftHtml.match(/class="check-box"/g) || []).length, 3);

  harness.StockModule.openMontageDispatchPlanProductCard('product-1', 'variation-2', 'SVR-000002');
  assert.deepEqual(Array.from(harness.openedPlanProductArgs), ['product-1', 'variation-2', 'SVR-000002']);
  assert.equal(harness.modalStack.length, 2);
  harness.Modal.close();
  assert.equal(harness.modalStack.length, 1);
  assert.match(harness.modalStack[0].title, /Planı Görüntüle - MGP-000020/);

  harness.StockModule.openMontageDispatchPlanProductCard('product-1', 'variation-1', 'SVR-000001');
  assert.deepEqual(Array.from(harness.openedPlanProductArgs), ['product-1', 'variation-1', 'SVR-000001']);
  harness.Modal.close();
  harness.StockModule.openMontageDispatchPlanPartCard('part-ref-18', '', 'PRC-000018');
  assert.deepEqual(Array.from(harness.openedPlanPartArgs), ['part-ref-18', '', 'PRC-000018']);
  assert.equal(harness.modalStack.length, 2);
  harness.Modal.close();
  assert.equal(harness.modalStack.length, 1);
  assert.equal(JSON.stringify(harness.context.DB.data.data), before);

  const dispatched = {
    id: 'dispatched-print', planNo: 'MGP-000021', status: 'DISPATCHED_TO_MONTAGE', createdAt: '2026-07-13T09:00:00.000Z',
    items: [{ productName: 'PLAN_GUNCEL_DEGER', variantCode: 'SVR-PLAN', plannedQty: 999 }],
    parts: [{ name: 'PLAN_GUNCEL_PARCA', code: 'PRC-PLAN', requiredQty: 999 }]
  };
  const dispatchedHarness = buildMontagePlanHarness({ plans: [dispatched] });
  dispatchedHarness.context.DB.data.data.montageDispatchShipments.push({
    id: 'shipment-21', shipmentNo: 'MGS-000021', planId: 'dispatched-print', planNo: 'MGP-000021', status: 'IN_TRANSIT', dispatchedAt: '2026-07-13T10:00:00.000Z',
    items: [{ productId: 'product-1', variantId: 'variation-2', productName: 'SHIPMENT_SNAPSHOT_URUN', variantCode: 'SVR-000002', shippedQty: 5 }],
    parts: [{ refId: 'part-ref-18', name: 'SHIPMENT_SNAPSHOT_PARCA', code: 'PRC-000018', shippedQty: 30, unit: 'ADET' }]
  });
  const dispatchedBefore = JSON.stringify(dispatchedHarness.context.DB.data.data);
  dispatchedHarness.StockModule.openMontageDispatchPlanDetail('dispatched-print');
  assert.match(dispatchedHarness.modalHtml, />Yazdır<\/button>/);
  dispatchedHarness.StockModule.printMontageDispatchPlan('dispatched-print');
  assert.equal(dispatchedHarness.printedModel.mode, 'SHIPMENT');
  assert.equal(dispatchedHarness.printedModel.title, 'Montaj Sevk / Teslim Kontrol Listesi');
  assert.equal(dispatchedHarness.printedModel.referenceNo, 'MGS-000021');
  assert.equal(dispatchedHarness.printedModel.items[0].productName, 'SHIPMENT_SNAPSHOT_URUN');
  assert.equal(dispatchedHarness.printedModel.parts[0].name, 'SHIPMENT_SNAPSHOT_PARCA');
  const dispatchedHtml = printUnit.buildMontageReadOnlyChecklistPrintHtml(dispatchedHarness.printedModel);
  assert.match(dispatchedHtml, /Montaj Sevk \/ Teslim Kontrol Listesi/);
  assert.match(dispatchedHtml, /MGS-000021/);
  assert.match(dispatchedHtml, /SHIPMENT_SNAPSHOT_URUN/);
  assert.match(dispatchedHtml, /SHIPMENT_SNAPSHOT_PARCA/);
  assert.doesNotMatch(dispatchedHtml, /PLAN_GUNCEL_DEGER|PLAN_GUNCEL_PARCA|999/);
  assert.equal((dispatchedHtml.match(/class="check-box"/g) || []).length, 2);
  assert.equal(JSON.stringify(dispatchedHarness.context.DB.data.data), dispatchedBefore);
});

test('Montaj is plani detayi ust bilgileri iki kartta kompakt ve salt okunur gosterir', () => {
  const harness = buildMontagePlanHarness();
  const data = harness.context.DB.data.data;
  data.orders = [{
    id: 'order-accent',
    orderNo: 'SOR-000001',
    customerName: 'ACCENT ALUMINIUM CONSTRUCTIONS & HANDRAIL',
    approvalDate: '2026-07-08',
    deliveryDate: '2026-07-16',
    deliveryAddress: 'ACCENT ALUMINIUM CONSTRUCTIONS & HANDRAIL\nPOSLANNIKOV PER., 3 BLD, 2 105005 MOSCOW',
    deliveryNote: '-',
    manualNote: 'deneme 123 16 deneme',
    lines: [
      { id: 'line-accent-1', qty: 15, variantCode: 'SVR-000002' },
      { id: 'line-accent-2', qty: 20, variantCode: 'SVR-000001' }
    ]
  }];
  data.planningDemands = [
    {
      id: 'demand-accent-1', demandCode: 'PLN-000002', sourceType: 'SALES_ORDER', sourceOrderId: 'order-accent',
      sourceOrderNo: 'SOR-000001', sourceLineId: 'line-accent-1', items: [{ id: 'item-accent-1', qty: 15 }]
    },
    {
      id: 'demand-accent-2', demandCode: 'PLN-000003', sourceType: 'SALES_ORDER', sourceOrderId: 'order-accent',
      sourceOrderNo: 'SOR-000001', sourceLineId: 'line-accent-2', items: [{ id: 'item-accent-2', qty: 20 }]
    }
  ];
  const jobs = [
    { key: 'job-accent-1', demandId: 'demand-accent-1', itemKey: 'item-accent-1' },
    { key: 'job-accent-2', demandId: 'demand-accent-2', itemKey: 'item-accent-2' }
  ];
  const detailRow = {
    key: 'detail-accent', jobs, sourceTypeLabel: 'Satış Siparişi', sorCodeText: 'SOR-000001',
    plnCodeText: 'PLN-000002 +1', productSummary: '2 çeşit ürün', requiredQty: 280,
    physicalReadyQty: 265, activePlanReservedQty: 12, inTransitCoverageQty: 15,
    receivedCoverageQty: 0, freeReadyQty: 253, displayRealMissingQty: 0, realMissingQty: 0,
    hasInTransitShipment: true, hasReceivedShipment: false
  };
  const orderRows = [
    {
      key: 'row-accent-1', sourceType: 'SALES_ORDER', sourceOrderId: 'order-accent', sourceLineId: 'line-accent-1', demandId: 'demand-accent-1', itemKey: 'item-accent-1', productName: 'Ürün A',
      productId: 'product-accent', variationId: 'variant-accent-2', svrCode: 'SVR-000002', salCode: 'SAL-000001', qty: '15', cardType: 'SVR', cardCode: 'SVR-000002',
      sendableQty: 10, montageReceivedQty: 5, shipmentReadyQty: 0, sendableCalculable: true, readySetQty: 14
    },
    {
      key: 'row-accent-2', sourceType: 'SALES_ORDER', sourceOrderId: 'order-accent', sourceLineId: 'line-accent-2', demandId: 'demand-accent-2', itemKey: 'item-accent-2', productName: 'Ürün B',
      productId: 'product-accent', variationId: 'variant-accent-1', svrCode: 'SVR-000001', salCode: 'SAL-000001', qty: '20', cardType: 'SVR', cardCode: 'SVR-000001',
      sendableQty: 13, montageReceivedQty: 7, shipmentReadyQty: 0, sendableCalculable: true, readySetQty: 18
    },
    {
      key: 'row-stock-1', sourceType: 'STOCK', demandId: 'demand-stock-1', itemKey: 'item-stock-1', productName: 'Stok Ürünü',
      svrCode: 'SVR-STOCK-1', salCode: 'SAL-STOCK-1', qty: '0', cardType: 'SVR', cardCode: 'SVR-STOCK-1',
      sendableQty: 4, montageReceivedQty: 2, shipmentReadyQty: 0, sendableCalculable: true, readySetQty: 4
    }
  ];
  const NativeDate = Date;
  harness.context.Date = class FixedDate extends NativeDate {
    constructor(...args) {
      super(...(args.length ? args : ['2026-07-14T12:00:00.000Z']));
    }
    static now() { return new NativeDate('2026-07-14T12:00:00.000Z').getTime(); }
  };
  harness.StockModule.buildMontageReadyJobCards = () => jobs;
  harness.StockModule.getMontageReadyPlanRows = () => [detailRow];
  harness.StockModule.getMontageReadyDetailOrderRows = () => orderRows;
  harness.StockModule.state.montageReadyDetailKey = detailRow.key;
  const accentLineKey = harness.StockModule.getMontagePlanLineAllocationKey(orderRows[0]);
  data.montageDispatchPlans.push(
    {
      id: 'history-plan-accent', planNo: 'MGP-000030', status: 'CANCELLED', cancelledAt: '2026-07-12T09:00:00.000Z', parts: [],
      items: [{ ...orderRows[0], variantCode: orderRows[0].svrCode, plannedQty: 2 }]
    },
    {
      id: 'history-plan-other', planNo: 'MGP-999999', status: 'CANCELLED', cancelledAt: '2026-07-12T10:00:00.000Z', parts: [],
      items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'other-order', sourceLineId: 'other-line', productName: 'Başka Sipariş', variantCode: 'SVR-000002', plannedQty: 99 }]
    }
  );
  data.montageDispatchShipments.push(
    {
      id: 'history-shipment-accent', shipmentNo: 'MGS-000030', status: 'RECEIVED', targetUnitId: 'u3', dispatchedAt: '2026-07-13T09:00:00.000Z',
      items: [{ ...orderRows[1], variantCode: orderRows[1].svrCode, shippedQty: 3 }], parts: []
    },
    {
      id: 'history-shipment-multi', shipmentNo: 'MGS-000031', status: 'IN_TRANSIT', targetUnitId: 'u3', dispatchedAt: '2026-07-13T09:30:00.000Z',
      items: [
        { ...orderRows[0], variantId: orderRows[0].variationId, variantCode: orderRows[0].svrCode, shippedQty: 1 },
        { ...orderRows[1], variantId: orderRows[1].variationId, variantCode: orderRows[1].svrCode, shippedQty: 1 }
      ],
      parts: []
    },
    {
      id: 'history-shipment-other', shipmentNo: 'MGS-999999', status: 'RECEIVED', targetUnitId: 'u3', dispatchedAt: '2026-07-13T10:00:00.000Z',
      items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'other-order', sourceLineId: 'other-line', productName: 'Başka Sipariş', variantCode: 'SVR-000001', shippedQty: 99 }], parts: []
    }
  );
  data.montageCompletionTransfers.push(
    {
      id: 'history-transfer-accent', transferNo: 'MCT-000030', status: 'POSTED', postedAt: '2026-07-14T09:00:00.000Z',
      sourceType: 'SALES_ORDER', sourceOrderId: 'order-accent', sourceLineId: 'line-accent-1', lineKey: accentLineKey,
      productId: 'product-accent', variantId: 'variant-accent-2', productName: 'Ürün A', variantCode: 'SVR-000002', qty: 1,
      recipeParts: [{ refId: 'part-a', code: 'PRC-A', name: 'Parça A', unit: 'ADET', qtyPerSet: 1 }]
    },
    {
      id: 'history-transfer-other', transferNo: 'MCT-999999', status: 'POSTED', postedAt: '2026-07-14T10:00:00.000Z',
      sourceType: 'SALES_ORDER', sourceOrderId: 'other-order', sourceLineId: 'other-line', lineKey: 'SALES_ORDER|other-order|other-line',
      productName: 'Başka Sipariş', variantCode: 'SVR-000002', qty: 99, recipeParts: []
    }
  );
  const before = JSON.stringify(data);

  const html = harness.StockModule.renderMontageReadyJobDetailLayout();
  const leftStart = html.indexOf('data-montage-detail-summary-card="order-delivery"');
  const rightStart = html.indexOf('data-montage-detail-summary-card="production"');
  const leftCardHtml = html.slice(leftStart, rightStart);

  assert.equal((html.match(/data-montage-detail-summary-card=/g) || []).length, 2);
  assert.match(html, /Sipariş ve Teslimat Bilgileri/);
  assert.doesNotMatch(html, /Müşteri \/ Sipariş Bilgileri|>Teslimat Bilgileri</);
  assert.match(leftCardHtml, /ACCENT ALUMINIUM CONSTRUCTIONS &amp; HANDRAIL/);
  assert.match(leftCardHtml, /POSLANNIKOV PER\., 3 BLD, 2 105005 MOSCOW/);
  assert.match(leftCardHtml, /2026-07-08/);
  assert.match(leftCardHtml, /2026-07-16/);
  assert.match(leftCardHtml, />2 gün</);
  assert.match(leftCardHtml, /SOR-000001/);
  assert.match(leftCardHtml, /PLN-000002 \+1/);
  assert.match(leftCardHtml, /deneme 123 16 deneme/);
  assert.match(leftCardHtml, /Ürün çeşidi:[\s\S]*2 çeşit ürün/);
  assert.match(leftCardHtml, /Toplam ürün adedi:<\/span> <strong>35<\/strong>/);
  assert.doesNotMatch(leftCardHtml, /15\s*\+\s*20|parça ürün|Gerekli toplam parça|Fiziksel hazır parça|Aktif planlara ayrılan|Sevkteki parça|Gerçek eksik parça/);
  assert.match(html.slice(rightStart), /Kaynak tipi[\s\S]*Gerekli toplam parça[\s\S]*Fiziksel hazır parça[\s\S]*Aktif planlara ayrılan[\s\S]*Sevkteki parça[\s\S]*Montajda teslim alınan parça[\s\S]*Serbest \/ planlanabilir parça[\s\S]*Gerçek eksik parça[\s\S]*Genel durum/);
  assert.match(html, /Sipariş Satırları/);
  assert.match(html, /Montaja Gönder/);
  assert.match(html, /Montaja Gönderim Planları/);
  assert.match(html, /Montajdan Teslim Al/);
  assert.match(html, /openPendingMontageCompletionTransfers/);
  const actionFooterHtml = html.match(/<div data-montage-detail-action-footer="true"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)?.[0] || '';
  const montageActionsHtml = html.match(/<div data-montage-action-shell="true"[\s\S]*?<\/div>/)?.[0] || '';
  const shipmentActionsHtml = html.match(/<div data-shipment-action-shell="true"[\s\S]*?<\/div>/)?.[0] || '';
  assert.match(actionFooterHtml, /Montaja Gönder[\s\S]*data-shipment-action-shell="true"/);
  assert.doesNotMatch(montageActionsHtml, /Planlamayı Kaydet/);
  assert.match(shipmentActionsHtml, /justify-content:flex-end;[\s\S]*flex-wrap:wrap/);
  assert.match(shipmentActionsHtml, /<button type="button" data-shipment-action="planning"[\s\S]*>Sevkiyat Planlama<\/button>/);
  assert.match(shipmentActionsHtml, /<button type="button" data-shipment-action="operations"[\s\S]*>Sevkiyat İşlemleri<\/button>/);
  assert.match(shipmentActionsHtml, /data-shipment-action="planning"[^>]*onclick="StockModule\.openSalesShipmentPlanningMode\(\)"/);
  const shipmentOperationsButtonHtml = shipmentActionsHtml.match(/<button type="button" data-shipment-action="operations"[\s\S]*?<\/button>/)?.[0] || '';
  assert.match(shipmentOperationsButtonHtml, /onclick="StockModule\.openSalesShipmentDeliveryReceiptDraft\('[^']+'\)"/);
  assert.doesNotMatch(shipmentOperationsButtonHtml, /href=|formaction=|<form/);
  assert.match(shipmentActionsHtml, /background:#eff6ff; color:#1d4ed8/);
  assert.match(shipmentActionsHtml, /border-color:#334155; background:#ffffff; color:#0f172a/);
  assert.doesNotMatch(shipmentActionsHtml, /flex:1 1|min-height:54px|box-shadow/);
  assert.equal(harness.StockModule.getProductionFlowButtonLabel('SALES_ORDER'), 'Sipariş Akışını Görüntüle');
  assert.equal(harness.StockModule.getProductionFlowButtonLabel('STOCK'), 'Üretim Akışını Görüntüle');
  assert.equal(harness.StockModule.getProductionFlowButtonLabel('STOCK_PRODUCTION'), 'Üretim Akışını Görüntüle');
  assert.match(html, /Ürün Kartı/);
  assert.doesNotMatch(html, /data-montage-movement-history-panel|data-montage-history-filters|data-montage-history-table|Montaj Hareket Geçmişi/);
  assert.doesNotMatch(html, /MGP-000030|MGS-000030|MGS-000031|MCT-000030/);

  let openedHistoryProductArgs = [];
  harness.StockModule.openMontageReadyProductCard = (...args) => { openedHistoryProductArgs = args; };
  harness.StockModule.openMontageMovementHistoryProductCard('MCT', 'history-transfer-accent');
  assert.deepEqual(Array.from(openedHistoryProductArgs), ['SVR-000002', 'variant-accent-2', 'SVR', 'product-accent', 'variant-accent-2']);
  harness.StockModule.openMontageMovementHistoryProductCard('MGP', 'history-plan-accent');
  assert.deepEqual(Array.from(openedHistoryProductArgs), ['SVR-000002', 'variant-accent-2', 'SVR', 'product-accent', 'variant-accent-2']);
  harness.StockModule.openMontageMovementHistoryProductCard('MGS', 'history-shipment-accent');
  assert.deepEqual(Array.from(openedHistoryProductArgs), ['SVR-000001', 'variant-accent-1', 'SVR', 'product-accent', 'variant-accent-1']);
  openedHistoryProductArgs = [];
  harness.StockModule.openMontageMovementHistoryProductCard('MGS', 'history-shipment-multi');
  assert.deepEqual(openedHistoryProductArgs, []);
  assert.equal(harness.modalTitle, 'SVR Ürün Kartı Seçimi');
  assert.match(harness.modalHtml, /Ürün A[\s\S]*SVR-000002[\s\S]*Ürün B[\s\S]*SVR-000001/);
  assert.match(harness.modalHtml, /openMontageReadyProductCard\('SVR-000002','variant-accent-2','SVR','product-accent','variant-accent-2'\)/);
  assert.match(harness.modalHtml, /openMontageReadyProductCard\('SVR-000001','variant-accent-1','SVR','product-accent','variant-accent-1'\)/);

  harness.StockModule.openMontageMovementHistoryRecord('MGP', 'history-plan-accent');
  assert.match(harness.modalHtml, /MGP-000030/);
  harness.StockModule.openMontageMovementHistoryRecord('MGS', 'history-shipment-accent');
  assert.equal(harness.openedHistoryShipmentId, 'history-shipment-accent');
  harness.StockModule.openMontageMovementHistoryRecord('MCT', 'history-transfer-accent');
  assert.match(harness.modalTitle, /Parça Listesi - MCT-000030/);
  harness.StockModule.state.montageMovementHistoryExpanded = false;
  harness.StockModule.state.montageMovementHistoryFilter = 'all';
  const svr2RowHtml = html.match(/<tr data-montage-order-row="row-accent-1"[\s\S]*?<\/tr>/)?.[0] || '';
  const svr1RowHtml = html.match(/<tr data-montage-order-row="row-accent-2"[\s\S]*?<\/tr>/)?.[0] || '';
  const stockRowHtml = html.match(/<tr data-montage-order-row="row-stock-1"[\s\S]*?<\/tr>/)?.[0] || '';
  assert.match(svr2RowHtml, /Sipariş Akışını Görüntüle/);
  assert.match(stockRowHtml, /Üretim Akışını Görüntüle/);
  assert.doesNotMatch(stockRowHtml, /Sipariş Akışını Görüntüle/);
  assert.equal(harness.StockModule.getMontageStatusVisibleStartIndex([0, 0, 5, 0]), 2);
  assert.equal(harness.StockModule.getMontageStatusVisibleStartIndex([0, 3, 2, 5]), 1);
  assert.equal(harness.StockModule.getMontageStatusVisibleStartIndex([5, 0, 0, 0]), 0);
  assert.equal(harness.StockModule.getMontageStatusVisibleStartIndex([0, 0, 0, 5]), 3);
  assert.equal(harness.StockModule.getMontageStatusVisibleStartIndex([0, 0, 0, 0]), 0);
  assert.equal((svr2RowHtml.match(/data-montage-status-counter=/g) || []).length, 4);
  assert.match(svr2RowHtml, /data-montage-status-counter="montage-ready" data-value="10"[\s\S]*Montaja hazır/);
  assert.match(svr2RowHtml, /data-montage-status-counter="in-montage" data-value="5"[\s\S]*Montajda/);
  assert.match(svr2RowHtml, /data-montage-status-counter="shipment-ready" data-value="0"[\s\S]*Sevkiyata hazır/);
  assert.match(svr2RowHtml, /data-montage-status-counter="customer-shipped" data-value="0"[\s\S]*Sevk edilen/);
  assert.doesNotMatch(svr2RowHtml, /Müşteri sevkiyat paneli tamamlandığında otomatik güncellenecek\./);
  assert.match(svr1RowHtml, /data-montage-status-counter="montage-ready" data-value="13"[\s\S]*Montaja hazır/);
  assert.match(svr1RowHtml, /data-montage-status-counter="in-montage" data-value="7"[\s\S]*Montajda/);
  assert.match(svr1RowHtml, /data-montage-status-counter="shipment-ready" data-value="0"[\s\S]*Sevkiyata hazır/);
  assert.match(svr1RowHtml, /data-montage-status-counter="customer-shipped" data-value="0"[\s\S]*Sevk edilen/);
  assert.equal((stockRowHtml.match(/data-montage-status-counter=/g) || []).length, 4);
  assert.match(stockRowHtml, /data-montage-status-counter="customer-shipped" data-value="—"[\s\S]*Sevk edilen/);
  orderRows[0].sendableQty = 0;
  orderRows[0].montageReceivedQty = 0;
  orderRows[0].shipmentReadyQty = 5;
  const shipmentReadyHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  const shipmentReadyRowHtml = shipmentReadyHtml.match(/<tr data-montage-order-row="row-accent-1"[\s\S]*?<\/tr>/)?.[0] || '';
  assert.equal((shipmentReadyRowHtml.match(/data-montage-status-counter=/g) || []).length, 2);
  assert.doesNotMatch(shipmentReadyRowHtml, /data-montage-status-counter="montage-ready"|data-montage-status-counter="in-montage"/);
  assert.match(shipmentReadyRowHtml, /data-montage-status-counter="shipment-ready" data-value="5"[\s\S]*Sevkiyata hazır/);
  assert.match(shipmentReadyRowHtml, /data-montage-status-counter="customer-shipped" data-value="0"[\s\S]*Sevk edilen/);
  orderRows[0].sendableQty = 5;
  orderRows[0].montageReceivedQty = 0;
  orderRows[0].shipmentReadyQty = 0;
  const montageReadyHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  const montageReadyRowHtml = montageReadyHtml.match(/<tr data-montage-order-row="row-accent-1"[\s\S]*?<\/tr>/)?.[0] || '';
  assert.equal((montageReadyRowHtml.match(/data-montage-status-counter=/g) || []).length, 4);
  assert.match(montageReadyRowHtml, /data-montage-status-counter="montage-ready" data-value="5"[\s\S]*Montaja hazır/);
  orderRows[0].sendableQty = 10;
  orderRows[0].montageReceivedQty = 5;
  orderRows[0].shipmentReadyQty = 0;
  assert.doesNotMatch(html, /Üretimdeki adet|Depoya teslim bekleyen|Montaj tamamlandı \/ Depoya verilecek|Tahmini üretim miktarı/);
  harness.StockModule.state.montageReadyDetailSendMode = true;
  const sendModeHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(sendModeHtml, /Hazır \/ gönderilebilir/);
  assert.match(sendModeHtml, /Gönderilecek adet/);
  assert.match(sendModeHtml, /data-montage-status-counter="montage-ready" data-value="10"/);
  assert.match(sendModeHtml, /data-montage-status-counter="customer-shipped" data-value="0"/);
  assert.match(sendModeHtml, /min-width:1750px/);
  const sendModeMontageActionsHtml = sendModeHtml.match(/<div data-montage-action-shell="true"[\s\S]*?<\/div>/)?.[0] || '';
  const sendModeShipmentActionsHtml = sendModeHtml.match(/<div data-shipment-action-shell="true"[\s\S]*?<\/div>/)?.[0] || '';
  assert.match(sendModeMontageActionsHtml, /Montaja Gönder[\s\S]*Montaja Gönderim Planları[\s\S]*Montajdan Teslim Al[\s\S]*Planlamayı Kaydet/);
  assert.match(sendModeMontageActionsHtml, /onclick="StockModule\.validateMontageReadyDetailSendPlan\(\)"/);
  assert.doesNotMatch(sendModeShipmentActionsHtml, /Planlamayı Kaydet|validateMontageReadyDetailSendPlan/);
  assert.match(sendModeShipmentActionsHtml, /Sevkiyat Planlama[\s\S]*Sevkiyat İşlemleri/);
  assert.equal(JSON.stringify(data), before);

  data.montageCompletionTransfers.push({
    id: 'pending-ui-mct', transferNo: 'MCT-000009', status: 'PENDING_DEPOT_RECEIPT',
    sourceType: 'SALES_ORDER', sourceOrderId: 'order-accent', sourceLineId: 'line-accent-1',
    lineKey: harness.StockModule.getMontagePlanLineAllocationKey(orderRows[0]), qty: 1
  });
  harness.StockModule.state.montageReadyDetailSendMode = false;
  const pendingHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(pendingHtml, /openPendingMontageCompletionTransfers\('detail-accent'\)[^>]*border-color:#22c55e[^>]*>Montajdan Teslim Al \(1\)<\/button>/);
});

test('Montaja Gonder secim modu aktif taslak plan uyarisini kesin satir kimligiyle gosterir', () => {
  const harness = buildMontagePlanHarness();
  const data = harness.context.DB.data.data;
  const jobs = [
    { key: 'job-sor-6-active', demandId: 'demand-sor-6-active', itemKey: 'item-sor-6-active' },
    { key: 'job-sor-6-free', demandId: 'demand-sor-6-free', itemKey: 'item-sor-6-free' }
  ];
  const detailRow = {
    key: 'detail-sor-000006', jobs, sourceTypeLabel: 'Satış Siparişi', sorCodeText: 'SOR-000006',
    plnCodeText: 'PLN-000008 +1', productSummary: '2 çeşit ürün', requiredQty: 16,
    physicalReadyQty: 16, activePlanReservedQty: 5, inTransitCoverageQty: 0,
    receivedCoverageQty: 0, freeReadyQty: 11, displayRealMissingQty: 0, realMissingQty: 0,
    hasInTransitShipment: false, hasReceivedShipment: false
  };
  const activeRow = {
    key: 'row-sor-6-active', sourceType: 'SALES_ORDER', sourceOrderId: 'order-sor-6', sourceOrderNo: 'SOR-000006',
    sourceLineId: 'line-sor-6-active', demandId: 'demand-sor-6-active', itemKey: 'item-sor-6-active',
    productName: 'Bombeli 2008 Aluminyum Dikme', productId: 'product-sor-6', variationId: 'variant-sor-6',
    svrCode: 'SVR-000002', salCode: 'SAL-000001', qty: '5', cardType: 'SVR', cardCode: 'SVR-000002',
    sendableQty: 0, readySetQty: 5, alreadySentQty: 0, montageReceivedQty: 0, shipmentReadyQty: 0,
    sendableCalculable: true, sendableReason: ''
  };
  const freeRow = {
    ...activeRow,
    key: 'row-sor-6-free', sourceLineId: 'line-sor-6-free', demandId: 'demand-sor-6-free',
    itemKey: 'item-sor-6-free', svrCode: 'SVR-000001', cardCode: 'SVR-000001', qty: '6', sendableQty: 6, readySetQty: 6
  };
  data.orders = [{
    id: 'order-sor-6', orderNo: 'SOR-000006', lines: [
      { id: activeRow.sourceLineId, qty: 5 },
      { id: freeRow.sourceLineId, qty: 6 }
    ]
  }];
  data.planningDemands = [
    { id: activeRow.demandId, sourceType: 'SALES_ORDER', sourceOrderId: activeRow.sourceOrderId, sourceOrderNo: 'SOR-000006', sourceLineId: activeRow.sourceLineId, items: [{ id: activeRow.itemKey, qty: 5 }] },
    { id: freeRow.demandId, sourceType: 'SALES_ORDER', sourceOrderId: freeRow.sourceOrderId, sourceOrderNo: 'SOR-000006', sourceLineId: freeRow.sourceLineId, items: [{ id: freeRow.itemKey, qty: 6 }] }
  ];
  data.montageDispatchPlans = [
    { id: 'plan-active-9', planNo: 'MGP-000009', status: 'DRAFT', items: [{ ...activeRow, plannedQty: 5 }], parts: [] },
    { id: 'plan-dispatched-8', planNo: 'MGP-000008', status: 'DISPATCHED_TO_MONTAGE', items: [{ ...activeRow, plannedQty: 5 }], parts: [] },
    { id: 'plan-cancelled-10', planNo: 'MGP-000010', status: 'CANCELLED', items: [{ ...activeRow, plannedQty: 5 }], parts: [] },
    { id: 'plan-other-line', planNo: 'MGP-999999', status: 'DRAFT', items: [{ ...activeRow, sourceLineId: 'other-line', plannedQty: 5 }], parts: [] }
  ];
  harness.StockModule.buildMontageReadyJobCards = () => jobs;
  harness.StockModule.getMontageReadyPlanRows = () => [detailRow];
  harness.StockModule.getMontageReadyDetailOrderRows = () => [activeRow, freeRow];
  harness.StockModule.state.montageReadyDetailKey = detailRow.key;
  harness.StockModule.state.montageReadyDetailSendMode = true;
  const before = JSON.stringify(data);

  const html = harness.StockModule.renderMontageReadyJobDetailLayout();
  const activeRowHtml = html.match(/<tr data-montage-order-row="row-sor-6-active"[\s\S]*?<\/tr>/)?.[0] || '';
  const freeRowHtml = html.match(/<tr data-montage-order-row="row-sor-6-free"[\s\S]*?<\/tr>/)?.[0] || '';

  assert.match(activeRowHtml, /Bu ürün için aktif montaj gönderim planı bulunmaktadır:[\s\S]*MGP-000009/);
  assert.match(activeRowHtml, /Planı sevk etmek veya iptal etmek için Montaja Gönderim Planları bölümünü açın\./);
  assert.match(activeRowHtml, /data-active-montage-plan-open="true"[^>]*onclick="StockModule\.openMontageDispatchPlans\('active'\)"[^>]*>Planları Aç<\/button>/);
  assert.match(activeRowHtml, /<input type="checkbox"[^>]*disabled/);
  assert.match(activeRowHtml, /<input type="number"[^>]*disabled/);
  assert.doesNotMatch(activeRowHtml, /MGP-000008|MGP-000010|MGP-999999/);
  assert.doesNotMatch(freeRowHtml, /data-active-montage-plan-warning|Planları Aç|MGP-/);
  assert.equal(JSON.stringify(data), before);

  harness.StockModule.openMontageDispatchPlans('active');
  assert.equal(harness.modalTitle, 'Montaja Gönderim Planları');
  assert.match(harness.modalHtml, /MGP-000009/);
  assert.match(harness.modalHtml, /MGP-999999/);
  assert.doesNotMatch(harness.modalHtml, /MGP-000008|MGP-000010/);
  assert.equal(JSON.stringify(data), before);
});

test('Sevkiyat Planlama Faz 1 canonical bitmis urunle salt okunur secim modu acar', () => {
  const harness = buildMontagePlanHarness();
  const data = harness.context.DB.data.data;
  const orderId = 'order-sor-000005';
  const lineId = 'line-sor-000005-1';
  const otherLineId = 'line-sor-000005-2';
  const productId = 'product-sal-000001';
  const variantId = 'variant-svr-000001';
  const lineKey = `SALES_ORDER|${orderId}|${lineId}`;
  data.orders = [{
    id: orderId,
    orderNo: 'SOR-000005',
    lines: [
      { id: lineId, productId, variationId: variantId, variantCode: 'SVR-000001', productCode: 'SAL-000001', idCode: 'SAL-000001', qty: 5 },
      { id: otherLineId, productId, variationId: variantId, variantCode: 'SVR-000001', productCode: 'SAL-000001', idCode: 'SAL-000001', qty: 4 }
    ]
  }];
  data.planningDemands = [{
    id: 'demand-sor-000005', demandCode: 'PLN-000007', sourceType: 'SALES_ORDER',
    sourceOrderId: orderId, sourceOrderNo: 'SOR-000005', sourceLineId: lineId,
    items: [{ id: 'item-sor-000005', itemType: 'MODEL', variantCode: 'SVR-000001', qty: 5 }]
  }];
  data.montageCompletionTransfers = [{
    id: 'mct-sor-000005', transferNo: 'MCT-000005', status: 'POSTED', lineKey,
    sourceType: 'SALES_ORDER', sourceOrderId: orderId, sourceOrderNo: 'SOR-000005', sourceLineId: lineId,
    productId, variantId, variationId: variantId, variantCode: 'SVR-000001', qty: 5, quantity: 5,
    finishedProductStockItemId: 'stock-finished-sor-000005', finishedProductMovementId: 'movement-finished-sor-000005'
  }];
  data.stockDepotItems = [{
    id: 'stock-finished-sor-000005', completionTransferId: 'mct-sor-000005', transferId: 'mct-sor-000005',
    sourceType: 'SALES_ORDER', sourceOrderId: orderId, sourceLineId: lineId,
    productId, variantId, variationId: variantId, variantCode: 'SVR-000001', productCode: 'SVR-000001', code: 'SVR-000001',
    depotId: 'depot_profil', targetDepotId: 'depot_profil', nodeKey: 'managed:depot_profil',
    locationId: 'location-r01-a1', targetLocationId: 'location-r01-a1', rafCode: 'R01', cellCode: 'A1',
    stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', unit: 'ADET', qty: 5, quantity: 5, amount: 5
  }, {
    id: 'stock-unscoped-same-svr', sourceType: 'UNSCOPED', productId, variantId, variantCode: 'SVR-000001',
    depotId: 'depot_profil', locationId: 'location-r01-a1', stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', unit: 'ADET',
    qty: 99, quantity: 99, amount: 99
  }];
  data.stock_movements = [{
    id: 'movement-finished-sor-000005', movementType: 'MONTAGE_FINISHED_PRODUCT_IN', type: 'MONTAGE_FINISHED_PRODUCT_IN',
    completionTransferId: 'mct-sor-000005', transferId: 'mct-sor-000005', stockDepotItemId: 'stock-finished-sor-000005',
    sourceType: 'SALES_ORDER', sourceOrderId: orderId, sourceLineId: lineId,
    productId, variantId, variantCode: 'SVR-000001', productCode: 'SVR-000001',
    targetDepotId: 'depot_profil', targetLocationId: 'location-r01-a1', qty: 5, quantity: 5, unit: 'ADET'
  }];
  const row = {
    key: 'row-sor-000005', sourceType: 'SALES_ORDER', sourceOrderId: orderId, sourceOrderNo: 'SOR-000005', sourceLineId: lineId,
    demandId: 'demand-sor-000005', itemKey: 'item-sor-000005', productId, variationId: variantId,
    productName: 'Bombeli 2008 Aluminyum Dikme', svrCode: 'SVR-000001', salCode: 'SAL-000001', qty: '5',
    cardType: 'SVR', cardCode: 'SVR-000001', sendableQty: 0, montageReceivedQty: 5, shipmentReadyQty: 5,
    sendableCalculable: true, readySetQty: 0
  };
  const otherLine = { ...row, key: 'row-sor-000005-2', sourceLineId: otherLineId, itemKey: 'item-sor-000005-2', qty: '4' };
  const job = { key: 'job-sor-000005', demandId: 'demand-sor-000005', itemKey: 'item-sor-000005' };
  const detailRow = {
    key: 'detail-sor-000005', jobs: [job], sourceTypeLabel: 'Satış Siparişi', sorCodeText: 'SOR-000005',
    plnCodeText: 'PLN-000007', productSummary: '1 çeşit ürün', requiredQty: 40, physicalReadyQty: 0,
    activePlanReservedQty: 0, inTransitCoverageQty: 0, receivedCoverageQty: 40, freeReadyQty: 0,
    displayRealMissingQty: 0, realMissingQty: 0, hasInTransitShipment: false, hasReceivedShipment: true
  };
  harness.StockModule.buildMontageReadyJobCards = () => [job];
  harness.StockModule.getMontageReadyPlanRows = () => [detailRow];
  harness.StockModule.getMontageReadyDetailOrderRows = () => [row];
  harness.StockModule.state.montageReadyDetailKey = detailRow.key;

  const canonical = harness.StockModule.getSalesShipmentPlanningAvailability(row);
  assert.equal(canonical.ok, true);
  assert.equal(canonical.orderQty, 5);
  assert.equal(canonical.readyQty, 5);
  assert.equal(canonical.planableQty, 5);
  assert.equal(canonical.stockRows.length, 1);
  const otherAvailability = harness.StockModule.getSalesShipmentPlanningAvailability(otherLine);
  assert.equal(otherAvailability.ok, true);
  assert.equal(otherAvailability.readyQty, 0);
  assert.equal(otherAvailability.planableQty, 0);

  const before = JSON.stringify(data);
  harness.StockModule.openSalesShipmentPlanningMode();
  assert.equal(harness.StockModule.state.salesShipmentPlanningMode, true);
  assert.equal(harness.StockModule.state.montageReadyDetailSendMode, false);
  const planningHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(planningHtml, /data-shipment-planning-table="true"[\s\S]*Sipariş adedi[\s\S]*Sevkiyata hazır[\s\S]*Planlanabilir[\s\S]*Planlanacak adet/);
  assert.match(planningHtml, /data-shipment-planning-ready="row-sor-000005" data-value="5"/);
  assert.match(planningHtml, /data-shipment-planning-planable="row-sor-000005" data-value="5"/);
  const selectionCheckbox = planningHtml.match(/<input type="checkbox" data-shipment-planning-select="row-sor-000005"[^>]*>/)?.[0] || '';
  assert.ok(selectionCheckbox);
  assert.doesNotMatch(selectionCheckbox, /disabled/);
  assert.match(planningHtml, /data-shipment-planning-qty="row-sor-000005"[^>]*max="5"[^>]*disabled/);
  assert.match(planningHtml, /data-shipment-planning-cancel="true"[\s\S]*Vazgeç/);
  assert.match(planningHtml, /data-shipment-planning-save="true"[\s\S]*Planlamayı Kaydet/);

  harness.StockModule.setSalesShipmentPlanningSelected(row.key, true, 5);
  assert.equal(harness.StockModule.state.salesShipmentPlanningSelectedRows[row.key], true);
  assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[row.key], '5');
  const selectedHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(selectedHtml, /data-shipment-planning-select="row-sor-000005"[^>]*checked/);
  assert.match(selectedHtml, /data-shipment-planning-qty="row-sor-000005"[^>]*value="5"/);
  harness.StockModule.setSalesShipmentPlanningQty(row.key, '3', 5);
  assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[row.key], '3');
  harness.StockModule.setSalesShipmentPlanningQty(row.key, '6', 5);
  assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[row.key], '5');
  harness.StockModule.setSalesShipmentPlanningQty(row.key, '2.5', 5);
  assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[row.key], '');
  harness.StockModule.setSalesShipmentPlanningQty(row.key, '-1', 5);
  assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[row.key], '');
  harness.StockModule.setSalesShipmentPlanningQty(row.key, '', 5);
  assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[row.key], '');
  harness.StockModule.setSalesShipmentPlanningQty(row.key, 'gecersiz', 5);
  assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[row.key], '');
  harness.StockModule.setSalesShipmentPlanningSelected(row.key, false, 5);
  assert.equal(harness.StockModule.state.salesShipmentPlanningSelectedRows[row.key], undefined);
  assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[row.key], undefined);

  assert.equal(harness.saveCount, 0);
  assert.equal(data.salesShipmentPlans.length, 0);
  assert.equal(JSON.stringify(data), before);
  harness.StockModule.cancelSalesShipmentPlanningMode();
  assert.equal(harness.StockModule.state.salesShipmentPlanningMode, false);
  assert.equal(Object.keys(harness.StockModule.state.salesShipmentPlanningSelectedRows).length, 0);
  assert.equal(Object.keys(harness.StockModule.state.salesShipmentPlanningQtyByRow).length, 0);
  const normalHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(normalHtml, /data-shipment-planning-table="false"/);
  assert.doesNotMatch(normalHtml, /Sevkiyat planlama seçim modu|data-shipment-planning-cancel|data-shipment-planning-save/);
  assert.equal(JSON.stringify(data), before);
});

function buildSalesShipmentPlanPhase2Harness(options = {}) {
  const harness = buildMontagePlanHarness(options);
  const data = harness.context.DB.data.data;
  const orderId = 'order-sor-000005';
  const lineId = 'line-sor-000005-1';
  const productId = 'product-sal-000001';
  const variantId = 'variant-svr-000001';
  const lineKey = `SALES_ORDER|${orderId}|${lineId}`;
  data.salesShipmentPlans = [];
  data.workOrderTransactions = [];
  data.orders = [{
    id: orderId,
    orderNo: 'SOR-000005',
    customerName: 'YUNUS KÜÇÜK - MATCH MİMARLIK',
    deliveryAddress: 'YUNUS KÜÇÜK - MATCH MİMARLIK\nYukarı Dudullu, 3. Cd. sanayi sitesi no:112, 34775 Dudullu/Ümraniye/İstanbul',
    lines: [{
      id: lineId,
      productId,
      variationId: variantId,
      variantCode: 'SVR-000001',
      productCode: 'SAL-000001',
      idCode: 'SAL-000001',
      productName: 'Bombeli 2008 Aluminyum Dikme',
      selectedDiameter: '40',
      accessoryColor: 'eloksal / P3 Sarı Eloksal',
      tubeColor: 'eloksal / P3 Sarı Eloksal',
      plexiColor: 'pleksi / şeffaf',
      bubble: 'var',
      lowerTubeLength: 'standart',
      qty: 5
    }]
  }];
  data.montageCompletionTransfers = [{
    id: 'mct-sor-000005', transferNo: 'MCT-000005', status: 'POSTED', lineKey,
    sourceType: 'SALES_ORDER', sourceOrderId: orderId, sourceOrderNo: 'SOR-000005', sourceLineId: lineId,
    productId, variantId, variationId: variantId, variantCode: 'SVR-000001', qty: 5, quantity: 5,
    finishedProductStockItemId: 'stock-finished-sor-000005', finishedProductMovementId: 'movement-finished-sor-000005'
  }];
  data.stockDepotItems = [{
    id: 'stock-finished-sor-000005', completionTransferId: 'mct-sor-000005', transferId: 'mct-sor-000005',
    sourceType: 'SALES_ORDER', sourceOrderId: orderId, sourceLineId: lineId,
    productId, variantId, variationId: variantId, variantCode: 'SVR-000001', productCode: 'SVR-000001', code: 'SVR-000001',
    depotId: 'depot_profil', targetDepotId: 'depot_profil', nodeKey: 'managed:depot_profil',
    locationId: 'location-r01-a1', targetLocationId: 'location-r01-a1', rafCode: 'R01', cellCode: 'A1',
    stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', unit: 'ADET', qty: 5, quantity: 5, amount: 5
  }];
  data.stock_movements = [{
    id: 'movement-finished-sor-000005', movementType: 'MONTAGE_FINISHED_PRODUCT_IN', type: 'MONTAGE_FINISHED_PRODUCT_IN',
    completionTransferId: 'mct-sor-000005', transferId: 'mct-sor-000005', stockDepotItemId: 'stock-finished-sor-000005',
    sourceType: 'SALES_ORDER', sourceOrderId: orderId, sourceLineId: lineId,
    productId, variantId, variantCode: 'SVR-000001', productCode: 'SVR-000001',
    targetDepotId: 'depot_profil', targetLocationId: 'location-r01-a1', qty: 5, quantity: 5, unit: 'ADET'
  }];
  const row = {
    key: 'row-sor-000005', sourceType: 'SALES_ORDER', sourceOrderId: orderId, sourceOrderNo: 'SOR-000005', sourceLineId: lineId,
    demandId: 'demand-sor-000005', itemKey: 'item-sor-000005', productId, variationId: variantId,
    productName: 'Bombeli 2008 Aluminyum Dikme', svrCode: 'SVR-000001', salCode: 'SAL-000001', qty: '5',
    cardType: 'SVR', cardCode: 'SVR-000001', sendableQty: 0, montageReceivedQty: 5, shipmentReadyQty: 5,
    sendableCalculable: true, readySetQty: 0
  };
  const job = { key: 'job-sor-000005', demandId: 'demand-sor-000005', itemKey: 'item-sor-000005' };
  const detailRow = {
    key: 'detail-sor-000005', jobs: [job], sourceTypeLabel: 'Satış Siparişi', sorCodeText: 'SOR-000005',
    plnCodeText: 'PLN-000007', productSummary: '1 çeşit ürün', requiredQty: 40, physicalReadyQty: 0,
    activePlanReservedQty: 0, inTransitCoverageQty: 0, receivedCoverageQty: 40, freeReadyQty: 0,
    displayRealMissingQty: 0, realMissingQty: 0, hasInTransitShipment: false, hasReceivedShipment: true
  };
  harness.StockModule.buildMontageReadyJobCards = () => [job];
  harness.StockModule.getMontageReadyPlanRows = () => [detailRow];
  harness.StockModule.getMontageReadyDetailOrderRows = () => {
    const canonical = harness.StockModule.getCanonicalSalesShipmentReadyStock(row);
    const dispatched = harness.StockModule.getDispatchedSalesShipmentQtyForLine(row);
    return [{
      ...row,
      shipmentReadyQty: canonical.ok ? canonical.readyQty : 0,
      customerShippedQty: dispatched.ok ? dispatched.dispatchedQty : 0
    }];
  };
  harness.StockModule.state.montageReadyDetailKey = detailRow.key;
  return {
    ...harness,
    data,
    row,
    detailRow,
    get saveCount() { return harness.saveCount; },
    get renderCount() { return harness.renderCount; },
    get modalHtml() { return harness.modalHtml; },
    get modalTitle() { return harness.modalTitle; },
    get modalOptions() { return harness.modalOptions; }
  };
}

function snapshotSalesShipmentUnaffectedCollections(data) {
  return JSON.stringify({
    salesShipments: data.salesShipments,
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchPlans: data.montageDispatchPlans,
    montageDispatchShipments: data.montageDispatchShipments,
    montageCompletionTransfers: data.montageCompletionTransfers
  });
}

function installSalesShipmentDeliveryDraftPlan(harness, deliveryDraft) {
  const plan = {
    id: 'sales-shipment-plan-1',
    planNo: 'SVP-000001',
    status: 'PLANNED',
    statusLabel: 'Planlandı',
    sourceOrderId: 'order-sor-000005',
    sourceOrderNo: 'SOR-000005',
    idempotencyKey: 'SALES_SHIPMENT_PLAN|order-sor-000005|draft-1',
    createdAt: '2026-07-17T13:32:10.435Z',
    updatedAt: '2026-07-17T13:32:10.435Z',
    items: [{
      sourceLineId: 'line-sor-000005-1',
      lineKey: 'SALES_ORDER|order-sor-000005|line-sor-000005-1',
      productId: 'product-sal-000001',
      productCode: 'SAL-000001',
      variantId: 'variant-svr-000001',
      variantCode: 'SVR-000001',
      salCode: 'SAL-000001',
      svrCode: 'SVR-000001',
      productName: 'Bombeli 2008 Aluminyum Dikme',
      unit: 'ADET',
      orderQty: 5,
      plannedQty: 3,
      stockAllocations: [{
        stockItemId: 'stock-finished-sor-000005', allocatedQty: 3, depotId: 'depot_profil', locationId: 'location-r01-a1',
        sourceOrderId: 'order-sor-000005', sourceLineId: 'line-sor-000005-1'
      }]
    }]
  };
  if (deliveryDraft !== undefined) plan.deliveryDraft = deliveryDraft;
  harness.data.salesShipmentPlans = [plan];
  return plan;
}

function installCompletedSalesShipment(harness) {
  const shipment = {
    id: 'sales-shipment-1',
    shipmentNo: 'TF-000001',
    status: 'DISPATCHED',
    shipmentPlanId: 'sales-shipment-plan-1',
    shipmentPlanNo: 'SVP-000001',
    sourceOrderId: 'order-sor-000005',
    sourceOrderNo: 'SOR-000005',
    dispatchedAt: '2026-07-17T16:22:51.593Z',
    createdAt: '2026-07-17T16:22:51.593Z',
    snapshot: {
      shipmentNo: 'TF-000001',
      shipmentPlanNo: 'SVP-000001',
      sourceOrderId: 'order-sor-000005',
      sourceOrderNo: 'SOR-000005',
      planCreatedAt: '2026-07-17T13:32:10.435Z',
      dispatchedAt: '2026-07-17T16:22:51.593Z',
      customerName: 'YUNUS KÜÇÜK - MATCH MİMARLIK',
      deliveryAddress: 'Yukarı Dudullu, Ümraniye/İstanbul',
      shipmentNote: '',
      vehiclePlate: '',
      phone: '',
      deliveredBy: '',
      receivedBy: '',
      receivedByRole: '',
      totalDispatchedQty: 3,
      totalPackageCount: 2,
      totalWeightKg: 45.5,
      items: [{
        sourceLineId: 'line-sor-000005-1',
        productId: 'product-sal-000001',
        variantId: 'variant-svr-000001',
        productName: 'Bombeli 2008 Aluminyum Dikme',
        salCode: 'SAL-000001',
        svrCode: 'SVR-000001',
        diameter: '40',
        accessoryColor: 'eloksal / P3 Sarı Eloksal',
        tubeColor: 'eloksal / P3 Sarı Eloksal',
        plexiColor: 'pleksi / şeffaf',
        bubble: 'var',
        lowerTubeLength: 'standart',
        dispatchQty: 3,
        packageCount: 2,
        weightKg: 45.5,
        stockAllocations: []
      }]
    }
  };
  harness.data.salesShipmentPlans = [];
  harness.data.salesShipments = [shipment];
  return shipment;
}

test('Siparis Akisi Faz 4 tamamlanmis sevkiyati exact salesShipments snapshotindan salt okunur gosterir', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness();
  const shipment = installCompletedSalesShipment(harness);
  harness.data.salesShipments.push(
    { ...shipment, id: 'other-order-id', shipmentNo: 'TF-000099', sourceOrderId: 'other-order', snapshot: { ...shipment.snapshot, shipmentNo: 'TF-000099', sourceOrderId: 'other-order' } },
    { ...shipment, id: 'other-order-no', shipmentNo: 'TF-000098', sourceOrderNo: 'SOR-000006', snapshot: { ...shipment.snapshot, shipmentNo: 'TF-000098', sourceOrderNo: 'SOR-000006' } },
    { ...shipment, id: 'mismatched-snapshot', shipmentNo: 'TF-000097', snapshot: { ...shipment.snapshot, shipmentNo: 'TF-000097', sourceOrderNo: 'SOR-000006' } }
  );
  const before = JSON.stringify(harness.data);

  const matches = harness.StockModule.getCompletedSalesShipmentsForOrder('order-sor-000005', 'SOR-000005');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, shipment.id);
  const html = harness.StockModule.renderCompletedSalesShipmentsForOrderHtml('order-sor-000005', 'SOR-000005');
  assert.equal((html.match(/data-sales-shipment-archive-row=/g) || []).length, 1);
  assert.match(html, /TF-000001[\s\S]*SVP-000001[\s\S]*Sevk Edildi/);
  assert.match(html, /Toplam sevk edilen[\s\S]*Toplam koli[\s\S]*Toplam ağırlık/);
  assert.match(html, />3<[\s\S]*>2<[\s\S]*>45,5 kg</);
  assert.match(html, /Araç plakası[\s\S]*Teslim alan/);
  assert.match(html, /Görüntüle[\s\S]*PDF İndir[\s\S]*Yazdır/);
  assert.doesNotMatch(html, /TF-000099|TF-000098|TF-000097/);
  assert.equal(harness.StockModule.renderCompletedSalesShipmentsForOrderHtml('order-sor-000005', 'SOR-000005'), html);
  assert.match(harness.StockModule.renderCompletedSalesShipmentsForOrderHtml('order-sor-000006', 'SOR-000006'), /Bu sipariş için henüz tamamlanmış sevkiyat bulunmuyor\./);

  harness.StockModule.openCompletedSalesShipmentDeliveryReceipt(shipment.id);
  assert.equal(harness.modalTitle, 'TESLİM FİŞİ');
  assert.match(harness.modalHtml, /SVP-000001[\s\S]*TF-000001[\s\S]*Sevk Edildi/);
  assert.match(harness.modalHtml, /readonly aria-readonly="true"/);
  assert.match(harness.modalHtml, /downloadCompletedSalesShipmentDeliveryReceiptPdf\('sales-shipment-1'\)/);
  assert.match(harness.modalHtml, /printCompletedSalesShipmentDeliveryReceipt\('sales-shipment-1'\)/);
  assert.doesNotMatch(harness.modalHtml, /data-sales-shipment-receipt-save|data-sales-shipment-receipt-dispatch/);

  let pdfHtml = '';
  let pdfName = '';
  harness.StockModule.downloadOutsourceDispatchPdfHtml = async (content, name) => {
    pdfHtml = content;
    pdfName = name;
    return true;
  };
  assert.equal(await harness.StockModule.downloadCompletedSalesShipmentDeliveryReceiptPdf(shipment.id), true);
  assert.equal(pdfName, 'teslim-fisi-TF-000001');
  assert.match(pdfHtml, /TESLİM FİŞİ[\s\S]*SEVK EDİLDİ[\s\S]*TF-000001/);

  let printHtml = '';
  let printCount = 0;
  harness.context.setTimeout = (fn) => fn();
  harness.StockModule.openSalesShipmentDeliveryReceiptDraftPrintWindow = (content) => {
    printHtml = content;
    return { focus: () => {}, print: () => { printCount += 1; } };
  };
  harness.StockModule.printCompletedSalesShipmentDeliveryReceipt(shipment.id);
  assert.equal(printCount, 1);
  assert.equal(printHtml, pdfHtml);
  assert.equal(harness.saveCount, 0);
  assert.equal(JSON.stringify(harness.data), before);
});

function installSalesShipmentDeliveryDraftDom(harness, values = {}) {
  const planId = 'sales-shipment-plan-1';
  const lineId = 'line-sor-000005-1';
  const elements = {};
  const setValue = (field, value, sourceLineId = '') => {
    const id = harness.StockModule.getSalesShipmentDeliveryDraftFieldId(planId, field, sourceLineId);
    elements[id] = { value: String(value ?? ''), textContent: '' };
  };
  setValue('shipmentNote', values.shipmentNote ?? 'Kapalı kasa araç ile teslim edilecek.');
  setValue('vehiclePlate', values.vehiclePlate ?? '34 ABC 123');
  setValue('phone', values.phone ?? '0555 111 22 33');
  setValue('deliveredBy', values.deliveredBy ?? 'Ayşe Yılmaz');
  setValue('receivedBy', values.receivedBy ?? 'Mehmet Kaya');
  setValue('receivedByRole', values.receivedByRole ?? 'Şoför');
  setValue('packageCount', values.packageCount ?? '2', lineId);
  setValue('weightKg', values.weightKg ?? '12.5', lineId);
  setValue('totalPackageCount', '0');
  setValue('totalWeightKg', '0');
  elements[harness.StockModule.getSalesShipmentDeliveryDraftFieldId(planId, 'dispatchAction')] = {
    disabled: false,
    textContent: 'Sevk Et'
  };
  harness.context.document.getElementById = (id) => elements[id] || null;
  return elements;
}

test('Sevkiyat Islemleri Faz 2 aktif SVP icin Teslim Fisi taslak modalini acar', () => {
  const harness = buildSalesShipmentPlanPhase2Harness();
  installSalesShipmentDeliveryDraftPlan(harness);
  harness.data.stockDepotItems.push({
    id: 'unscoped-svr-000001', sourceType: 'UNSCOPED', productId: 'product-sal-000001', variantId: 'variant-svr-000001',
    variantCode: 'SVR-000001', depotId: 'depot_profil', locationId: 'location-r01-a1', qty: 99, quantity: 99, amount: 99
  });
  const before = JSON.stringify(harness.data);
  const modelResult = harness.StockModule.buildSalesShipmentDeliveryReceiptDraftModel('order-sor-000005');
  assert.equal(modelResult.ok, true);
  assert.equal(modelResult.model.planNo, 'SVP-000001');
  assert.equal(modelResult.model.sourceOrderNo, 'SOR-000005');
  assert.equal(modelResult.model.items.length, 1);
  assert.equal(modelResult.model.items[0].dispatchQty, 3);

  harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
  assert.equal(harness.modalTitle, 'TESLİM FİŞİ – TASLAK');
  assert.equal(harness.modalOptions.maxWidth, 'min(1880px, 98vw)');
  assert.match(harness.modalHtml, /data-sales-shipment-receipt-draft="true"/);
  assert.match(harness.modalHtml, /SVP-000001[\s\S]*SOR-000005[\s\S]*Planlandı/);
  assert.match(harness.modalHtml, /YUNUS KÜÇÜK - MATCH MİMARLIK/);
  assert.match(harness.modalHtml, /Yukarı Dudullu, 3\. Cd\. sanayi sitesi no:112/);
  assert.match(harness.modalHtml, /Henüz sevk edilmedi/);
  assert.match(harness.modalHtml, /Bombeli 2008 Aluminyum Dikme[\s\S]*SAL-000001[\s\S]*SVR-000001/);
  assert.match(harness.modalHtml, /40[\s\S]*eloksal \/ P3 Sarı Eloksal[\s\S]*pleksi \/ şeffaf[\s\S]*var[\s\S]*standart/);
  assert.match(harness.modalHtml, /data-sales-shipment-dispatch-qty="line-sor-000005-1" data-value="3"/);
  assert.match(harness.modalHtml, /Koli adedi[\s\S]*Ağırlık \(kg\)/);
  assert.match(harness.modalHtml, /Sevkiyat Notu[\s\S]*Araç Plakası[\s\S]*Telefon Numarası/);
  assert.match(harness.modalHtml, /Teslim Eden Ad Soyad[\s\S]*Teslim Alan \/ Şoför Ad Soyad[\s\S]*Teslim Alan Görevi/);
  assert.match(harness.modalHtml, /Teslim Eden[\s\S]*Teslim Alan[\s\S]*İmza/);
  assert.match(harness.modalHtml, /PDF İndir[\s\S]*Yazdır[\s\S]*Kapat/);
  assert.match(harness.modalHtml, /data-sales-shipment-receipt-table-wrap="true"[^>]*overflow-x:auto/);
  assert.match(harness.modalHtml, /data-sales-shipment-receipt-table="true"[^>]*min-width:1400px/);
  assert.match(harness.modalHtml, /class="btn-primary" data-sales-shipment-receipt-save="true"[^>]*background:#0f172a;[^>]*color:#ffffff;[^>]*>Değişiklikleri Kaydet<\/button>/);
  assert.match(harness.modalHtml, /data-sales-shipment-receipt-dispatch="true"[^>]*>Sevk Et<\/button>/);
  assert.match(harness.modalHtml, /data-sales-shipment-receipt-close="true"[\s\S]*>Kapat<\/button>/);
  assert.doesNotMatch(harness.modalHtml, /TC kimlik|Fiziksel hazır|Plan dışında hazır|Kalan miktar/i);
  harness.Modal.close();
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.saveCount, 0);
});

function configureSingleUnitSalesShipmentPlan(harness, plan) {
  plan.planNo = 'SVP-000003';
  plan.items[0].orderQty = 1;
  plan.items[0].plannedQty = 1;
  plan.items[0].stockAllocations[0].allocatedQty = 1;
  harness.data.orders[0].lines[0].qty = 1;
  Object.assign(harness.data.stockDepotItems[0], { qty: 1, quantity: 1, amount: 1 });
  harness.row.qty = '1';
}

test('Sevkiyat planlamasi iptali PLANNED plani silmeden kapatir ve 1 adedi yeniden planlanabilir yapar', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness();
  const plan = installSalesShipmentDeliveryDraftPlan(harness, {
    shipmentNote: 'Korunacak taslak', vehiclePlate: '34 ABC 123', phone: '', deliveredBy: '', receivedBy: '', receivedByRole: '',
    items: [{ sourceLineId: 'line-sor-000005-1', packageCount: 1, weightKg: 5 }], updatedAt: '2026-07-20T09:45:00.000Z'
  });
  configureSingleUnitSalesShipmentPlan(harness, plan);
  const allocationsBefore = JSON.stringify(plan.items[0].stockAllocations);
  const deliveryDraftBefore = JSON.stringify(plan.deliveryDraft);
  const protectedBefore = JSON.stringify({
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements,
    salesShipments: harness.data.salesShipments,
    workOrderTransactions: harness.data.workOrderTransactions,
    montageCompletionTransfers: harness.data.montageCompletionTransfers
  });
  const availabilityBefore = harness.StockModule.getSalesShipmentPlanningAvailability(harness.row);
  assert.equal(availabilityBefore.planableQty, 0);
  assert.equal(harness.StockModule.getActiveSalesShipmentReservationForLine(availabilityBefore).reservedQty, 1);

  harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
  assert.match(harness.modalHtml, /data-sales-shipment-plan-cancel="true"[\s\S]*Planlamayı İptal Et/);
  assert.match(harness.modalHtml, /border:1px solid #dc2626/);
  assert.match(harness.modalHtml, /data-sales-shipment-receipt-save="true"[\s\S]*data-sales-shipment-receipt-dispatch="true"/);

  assert.equal(await harness.StockModule.cancelSalesShipmentPlan(plan.id, 'order-sor-000005'), true);
  assert.equal(harness.confirmMessages.length, 1);
  assert.match(harness.confirmMessages[0], /Plan: SVP-000003[\s\S]*Sipariş: SOR-000005[\s\S]*İptal edilecek toplam: 1 adet/);
  assert.match(harness.confirmMessages[0], /Fiziksel stok değişmeyecektir\.[\s\S]*Plan silinmeyecek/);
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.renderCount, 1);
  assert.equal(harness.data.salesShipmentPlans.length, 1);
  assert.equal(plan.status, 'CANCELLED');
  assert.equal(plan.statusLabel, 'İptal Edildi');
  assert.match(plan.cancelledAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(plan.updatedAt, plan.cancelledAt);
  assert.equal(plan.shipmentId, undefined);
  assert.equal(plan.shipmentNo, undefined);
  assert.equal(plan.dispatchedAt, undefined);
  assert.equal(JSON.stringify(plan.items[0].stockAllocations), allocationsBefore);
  assert.equal(JSON.stringify(plan.deliveryDraft), deliveryDraftBefore);
  assert.equal(JSON.stringify({
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements,
    salesShipments: harness.data.salesShipments,
    workOrderTransactions: harness.data.workOrderTransactions,
    montageCompletionTransfers: harness.data.montageCompletionTransfers
  }), protectedBefore);
  assert.equal(harness.StockModule.getActiveSalesShipmentPlanForOrder('order-sor-000005'), null);
  const availabilityAfter = harness.StockModule.getSalesShipmentPlanningAvailability(harness.row);
  assert.equal(availabilityAfter.planableQty, 1);
  assert.equal(harness.StockModule.getActiveSalesShipmentReservationForLine(availabilityAfter).reservedQty, 0);

  assert.equal(harness.modalTitle, 'TESLİM FİŞİ – İPTAL EDİLDİ');
  assert.match(harness.modalHtml, /Plan durumu[\s\S]*İptal Edildi/);
  assert.match(harness.modalHtml, /readonly aria-readonly="true"/);
  assert.match(harness.modalHtml, /PDF İndir[\s\S]*Yazdır/);
  assert.doesNotMatch(harness.modalHtml, /data-sales-shipment-plan-cancel|data-sales-shipment-receipt-save|data-sales-shipment-receipt-dispatch/);
  const refreshedModel = harness.StockModule.buildSalesShipmentDeliveryReceiptDraftModel('order-sor-000005');
  assert.equal(refreshedModel.ok, true);
  assert.equal(refreshedModel.model.planStatus, 'CANCELLED');
  assert.equal(refreshedModel.model.isCancelled, true);

  await harness.StockModule.dispatchSalesShipmentPlan('order-sor-000005');
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.data.salesShipments.length, 0);
  assert.equal(harness.data.stock_movements.filter((row) => row.movementType === 'SALES_SHIPMENT_OUT').length, 0);
  assert.match(harness.alerts.at(-1), /Yalnız PLANNED/);
  const { validateSalesShipmentPlans } = require('../serve.js');
  assert.deepEqual(validateSalesShipmentPlans({ data: harness.data }), []);
});

test('Sevkiyat planlamasi iptal onayi verilmezse hicbir veri degismez', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness({ confirmResult: false });
  const plan = installSalesShipmentDeliveryDraftPlan(harness);
  configureSingleUnitSalesShipmentPlan(harness, plan);
  const before = JSON.stringify(harness.data);
  assert.equal(await harness.StockModule.cancelSalesShipmentPlan(plan.id, 'order-sor-000005'), false);
  assert.equal(harness.confirmMessages.length, 1);
  assert.equal(harness.saveCount, 0);
  assert.equal(harness.renderCount, 0);
  assert.equal(JSON.stringify(harness.data), before);
});

test('Sevkiyat planlamasi iptali DB.save hatasinda plan koleksiyonunu eksiksiz geri alir', async () => {
  for (const options of [{ failSave: true }, { saveReturnsFailure: true }]) {
    const harness = buildSalesShipmentPlanPhase2Harness(options);
    const plan = installSalesShipmentDeliveryDraftPlan(harness, {
      shipmentNote: 'Korunacak taslak', vehiclePlate: '', phone: '', deliveredBy: '', receivedBy: '', receivedByRole: '',
      items: [{ sourceLineId: 'line-sor-000005-1', packageCount: 1, weightKg: 5 }], updatedAt: '2026-07-20T09:45:00.000Z'
    });
    configureSingleUnitSalesShipmentPlan(harness, plan);
    const beforePlans = JSON.stringify(harness.data.salesShipmentPlans);
    const protectedBefore = snapshotSalesShipmentUnaffectedCollections(harness.data);
    assert.equal(await harness.StockModule.cancelSalesShipmentPlan(plan.id, 'order-sor-000005'), false);
    assert.equal(harness.saveCount, 1);
    assert.equal(harness.renderCount, 0);
    assert.equal(JSON.stringify(harness.data.salesShipmentPlans), beforePlans);
    assert.equal(harness.data.salesShipmentPlans[0].status, 'PLANNED');
    assert.equal(harness.data.salesShipmentPlans[0].cancelledAt, undefined);
    assert.equal(snapshotSalesShipmentUnaffectedCollections(harness.data), protectedBefore);
    assert.match(harness.alerts.at(-1), /Sevkiyat planlaması iptal edilemedi/);
  }
});

test('Sevkiyat Islemleri Faz 2 deliveryDraft alanlarini kaydeder ve modal yeniden acilinca geri yukler', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness();
  const plan = installSalesShipmentDeliveryDraftPlan(harness);
  const unaffectedBefore = snapshotSalesShipmentUnaffectedCollections(harness.data);
  const protectedPlanBefore = JSON.stringify({ ...plan, deliveryDraft: undefined });
  harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
  const elements = installSalesShipmentDeliveryDraftDom(harness);

  harness.StockModule.updateSalesShipmentDeliveryDraftTotals('order-sor-000005');
  assert.equal(elements[harness.StockModule.getSalesShipmentDeliveryDraftFieldId(plan.id, 'totalPackageCount')].textContent, '2');
  assert.equal(elements[harness.StockModule.getSalesShipmentDeliveryDraftFieldId(plan.id, 'totalWeightKg')].textContent, '12.5');
  await harness.StockModule.saveSalesShipmentDeliveryDraft('order-sor-000005');

  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.deepEqual(JSON.parse(JSON.stringify(plan.deliveryDraft.items)), [{
    sourceLineId: 'line-sor-000005-1', packageCount: 2, weightKg: 12.5
  }]);
  assert.equal(plan.deliveryDraft.shipmentNote, 'Kapalı kasa araç ile teslim edilecek.');
  assert.equal(plan.deliveryDraft.vehiclePlate, '34 ABC 123');
  assert.equal(plan.deliveryDraft.phone, '0555 111 22 33');
  assert.equal(plan.deliveryDraft.deliveredBy, 'Ayşe Yılmaz');
  assert.equal(plan.deliveryDraft.receivedBy, 'Mehmet Kaya');
  assert.equal(plan.deliveryDraft.receivedByRole, 'Şoför');
  assert.match(plan.deliveryDraft.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(JSON.stringify({ ...plan, deliveryDraft: undefined }), protectedPlanBefore);
  assert.equal(snapshotSalesShipmentUnaffectedCollections(harness.data), unaffectedBefore);
  assert.ok(harness.alerts.includes('Teslim fişi taslak bilgileri kaydedildi.'));

  harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
  assert.match(harness.modalHtml, /data-sales-shipment-package-count="line-sor-000005-1"[^>]*[\s\S]*?value="2"/);
  assert.match(harness.modalHtml, /data-sales-shipment-weight-kg="line-sor-000005-1"[^>]*[\s\S]*?value="12\.5"/);
  assert.match(harness.modalHtml, /value="34 ABC 123"/);
  assert.match(harness.modalHtml, /Kapalı kasa araç ile teslim edilecek\./);
  assert.match(harness.modalHtml, /Ayşe Yılmaz[\s\S]*Mehmet Kaya[\s\S]*Şoför/);
});

test('Sevkiyat Islemleri Faz 2 DB.save hatasinda yalniz deliveryDraft snapshotini geri alir', async () => {
  for (const options of [{ failSave: true }, { saveReturnsFailure: true }]) {
    const harness = buildSalesShipmentPlanPhase2Harness(options);
    const previousDraft = {
      shipmentNote: 'Önceki not', vehiclePlate: '06 OLD 06', phone: '', deliveredBy: '', receivedBy: '', receivedByRole: '',
      items: [{ sourceLineId: 'line-sor-000005-1', packageCount: 1, weightKg: 4 }],
      updatedAt: '2026-07-17T12:00:00.000Z'
    };
    const plan = installSalesShipmentDeliveryDraftPlan(harness, previousDraft);
    const beforeData = JSON.stringify(harness.data);
    harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
    installSalesShipmentDeliveryDraftDom(harness, { shipmentNote: 'Kaydedilmemeli', packageCount: 9, weightKg: 99 });
    await harness.StockModule.saveSalesShipmentDeliveryDraft('order-sor-000005');

    assert.equal(harness.saveCount, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(plan.deliveryDraft)), previousDraft);
    assert.equal(JSON.stringify(harness.data), beforeData);
    assert.equal(harness.modalStack.length, 1);
    assert.match(harness.alerts.at(-1), /Teslim fişi taslak bilgileri kaydedilemedi/);
  }
});

test('Sevkiyat Islemleri Faz 2 PDF ve yazdirma ayni taslak belgeyi veri yazmadan uretir', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness();
  installSalesShipmentDeliveryDraftPlan(harness, {
    shipmentNote: 'Sevkiyat test notu', vehiclePlate: '34 PDF 34', phone: '0555 000 00 00',
    deliveredBy: 'Teslim Eden Kişi', receivedBy: 'Teslim Alan Kişi', receivedByRole: 'Şoför',
    items: [{ sourceLineId: 'line-sor-000005-1', packageCount: 2, weightKg: 12.5 }],
    updatedAt: '2026-07-17T14:00:00.000Z'
  });
  const before = JSON.stringify(harness.data);
  let pdfHtml = '';
  let pdfName = '';
  harness.StockModule.downloadOutsourceDispatchPdfHtml = async (html, name) => {
    pdfHtml = html;
    pdfName = name;
    return true;
  };
  assert.equal(await harness.StockModule.downloadSalesShipmentDeliveryReceiptDraftPdf('order-sor-000005'), true);
  assert.match(pdfName, /teslim-fisi-taslak-SVP-000001/);
  assert.match(pdfHtml, /TESLİM FİŞİ[\s\S]*TASLAK — Bu belge irsaliye değildir\./);
  assert.match(pdfHtml, /SVP-000001[\s\S]*SOR-000005[\s\S]*Henüz sevk edilmedi/);
  assert.match(pdfHtml, /YUNUS KÜÇÜK - MATCH MİMARLIK[\s\S]*Yukarı Dudullu/);
  assert.match(pdfHtml, /Bombeli 2008 Aluminyum Dikme[\s\S]*SAL-000001 · SVR-000001/);
  assert.match(pdfHtml, /eloksal \/ P3 Sarı Eloksal[\s\S]*pleksi \/ şeffaf[\s\S]*standart/);
  assert.match(pdfHtml, />3<[\s\S]*>2<[\s\S]*>12\.5</);
  assert.match(pdfHtml, /Sevkiyat test notu[\s\S]*34 PDF 34[\s\S]*0555 000 00 00/);
  assert.match(pdfHtml, /Teslim Eden Kişi[\s\S]*Teslim Alan Kişi[\s\S]*Şoför[\s\S]*Teslim Alan İmza/);
  assert.doesNotMatch(pdfHtml, /TC kimlik|Planlamayı İptal Et|>Sevk Et</i);

  let printCount = 0;
  let printHtml = '';
  harness.context.setTimeout = (fn) => fn();
  harness.StockModule.openSalesShipmentDeliveryReceiptDraftPrintWindow = (html) => {
    printHtml = html;
    return { focus: () => {}, print: () => { printCount += 1; } };
  };
  harness.StockModule.printSalesShipmentDeliveryReceiptDraft('order-sor-000005');
  assert.equal(printCount, 1);
  assert.equal(printHtml, pdfHtml);
  assert.equal(harness.saveCount, 0);
  assert.equal(JSON.stringify(harness.data), before);
});

test('Gercek Sevk Et Faz 3 exact allocation stok dusumu, shipment snapshot ve DISPATCHED plan olusturur', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness();
  const plan = installSalesShipmentDeliveryDraftPlan(harness, {
    shipmentNote: 'Kaydedilmiş eski not', vehiclePlate: '', phone: '', deliveredBy: '', receivedBy: '', receivedByRole: '',
    items: [{ sourceLineId: 'line-sor-000005-1', packageCount: 1, weightKg: 4 }],
    updatedAt: '2026-07-17T12:00:00.000Z'
  });
  const originalAllocation = JSON.stringify(plan.items[0].stockAllocations);
  const unrelatedBefore = JSON.stringify({
    workOrderTransactions: harness.data.workOrderTransactions,
    montageDispatchPlans: harness.data.montageDispatchPlans,
    montageDispatchShipments: harness.data.montageDispatchShipments,
    montageCompletionTransfers: harness.data.montageCompletionTransfers
  });
  harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
  installSalesShipmentDeliveryDraftDom(harness, {
    shipmentNote: 'Sevk anındaki güncel not', vehiclePlate: '34 SEVK 03', phone: '0555 333 22 11',
    deliveredBy: 'Dulda Depo', receivedBy: 'Ahmet Şoför', receivedByRole: 'Şoför', packageCount: 2, weightKg: 12.5
  });
  await harness.StockModule.dispatchSalesShipmentPlan('order-sor-000005');

  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.equal(harness.confirmMessages.length, 1);
  assert.match(harness.confirmMessages[0], /Plan: SVP-000001[\s\S]*Sipariş: SOR-000005[\s\S]*Sevk edilecek toplam: 3 adet/);
  assert.match(harness.confirmMessages[0], /fiziksel olarak düşürecektir[\s\S]*tekrar sevk edilemez/);
  assert.equal(harness.data.salesShipments.length, 1);
  const shipment = harness.data.salesShipments[0];
  assert.equal(shipment.shipmentNo, 'TF-000001');
  assert.equal(shipment.status, 'DISPATCHED');
  assert.equal(shipment.shipmentPlanId, plan.id);
  assert.equal(shipment.shipmentPlanNo, 'SVP-000001');
  assert.equal(shipment.sourceOrderNo, 'SOR-000005');
  assert.equal(shipment.idempotencyKey, `SALES_SHIPMENT_DISPATCH|${plan.id}`);
  assert.equal(shipment.snapshot.shipmentNote, 'Sevk anındaki güncel not');
  assert.equal(shipment.snapshot.vehiclePlate, '34 SEVK 03');
  assert.equal(shipment.snapshot.items[0].dispatchQty, 3);
  assert.equal(shipment.snapshot.items[0].packageCount, 2);
  assert.equal(shipment.snapshot.items[0].weightKg, 12.5);
  assert.equal(shipment.snapshot.items[0].stockAllocations[0].stockItemId, 'stock-finished-sor-000005');
  assert.equal(shipment.snapshot.items[0].stockAllocations[0].allocatedQty, 3);
  assert.equal(harness.data.stockDepotItems.find((row) => row.id === 'stock-finished-sor-000005').qty, 2);
  const outMovements = harness.data.stock_movements.filter((row) => row.movementType === 'SALES_SHIPMENT_OUT');
  assert.equal(outMovements.length, 1);
  assert.equal(outMovements.reduce((sum, row) => sum + row.qty, 0), 3);
  assert.ok(outMovements.every((row) => row.qty > 0 && row.shipmentId === shipment.id && row.shipmentPlanId === plan.id));
  assert.equal(plan.status, 'DISPATCHED');
  assert.equal(plan.statusLabel, 'Sevk Edildi');
  assert.equal(plan.shipmentId, shipment.id);
  assert.equal(plan.shipmentNo, 'TF-000001');
  assert.equal(plan.dispatchedAt, shipment.dispatchedAt);
  assert.equal(harness.StockModule.getActiveSalesShipmentPlanForOrder('order-sor-000005'), null);
  const dispatchedLine = harness.StockModule.getDispatchedSalesShipmentQtyForLine(harness.row);
  assert.equal(dispatchedLine.ok, true);
  assert.equal(dispatchedLine.dispatchedQty, 3);
  harness.data.salesShipments.push({
    id: 'unrelated-shipment', status: 'DISPATCHED', sourceOrderId: 'order-sor-000005',
    snapshot: {
      sourceOrderId: 'order-sor-000005',
      items: [{ ...shipment.snapshot.items[0], sourceLineId: 'another-sales-line', dispatchQty: 99 }]
    }
  });
  assert.equal(harness.StockModule.getDispatchedSalesShipmentQtyForLine(harness.row).dispatchedQty, 3);
  harness.data.salesShipments.pop();
  const postDispatchHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  const postDispatchRowHtml = postDispatchHtml.match(/<tr data-montage-order-row="row-sor-000005"[\s\S]*?<\/tr>/)?.[0] || '';
  assert.match(postDispatchRowHtml, /data-montage-status-counter="shipment-ready" data-value="2"[\s\S]*Sevkiyata hazır/);
  assert.match(postDispatchRowHtml, /data-montage-status-counter="customer-shipped" data-value="3"[\s\S]*Sevk edilen/);
  assert.ok(harness.renderCount > 0);
  harness.StockModule.openSalesShipmentPlanningMode();
  assert.equal(harness.StockModule.state.salesShipmentPlanningMode, true);
  const remainingAvailability = harness.StockModule.getSalesShipmentPlanningAvailability(harness.row);
  assert.equal(remainingAvailability.readyQty, 2);
  assert.equal(remainingAvailability.planableQty, 2);
  harness.StockModule.cancelSalesShipmentPlanningMode();
  assert.equal(JSON.stringify(plan.items[0].stockAllocations), originalAllocation);
  assert.equal(JSON.stringify({
    workOrderTransactions: harness.data.workOrderTransactions,
    montageDispatchPlans: harness.data.montageDispatchPlans,
    montageDispatchShipments: harness.data.montageDispatchShipments,
    montageCompletionTransfers: harness.data.montageCompletionTransfers
  }), unrelatedBefore);

  assert.equal(harness.modalTitle, 'TESLİM FİŞİ');
  assert.match(harness.modalHtml, /TF-000001[\s\S]*Sevk Edildi/);
  assert.match(harness.modalHtml, /readonly aria-readonly="true"/);
  assert.doesNotMatch(harness.modalHtml, /TESLİM FİŞİ – TASLAK|data-sales-shipment-receipt-save|data-sales-shipment-receipt-dispatch/);
  const liveOrder = harness.data.orders.find((row) => row.id === 'order-sor-000005');
  liveOrder.customerName = 'SONRADAN DEĞİŞEN MÜŞTERİ';
  liveOrder.lines[0].productName = 'SONRADAN DEĞİŞEN ÜRÜN';
  const immutableModel = harness.StockModule.buildSalesShipmentDeliveryReceiptDraftModel('order-sor-000005');
  assert.equal(immutableModel.ok, true);
  assert.equal(immutableModel.model.customerName, 'YUNUS KÜÇÜK - MATCH MİMARLIK');
  assert.equal(immutableModel.model.items[0].productName, 'Bombeli 2008 Aluminyum Dikme');
  const realPrintHtml = harness.StockModule.buildSalesShipmentDeliveryReceiptDraftPrintHtml(immutableModel.model);
  assert.match(realPrintHtml, /TESLİM FİŞİ[\s\S]*SEVK EDİLDİ[\s\S]*TF-000001/);
  assert.doesNotMatch(realPrintHtml, /TASLAK|SONRADAN DEĞİŞEN/);

  const { validateSalesShipmentPlans, validateSalesShipments, validateSalesShipmentImmutability } = require('../serve.js');
  assert.deepEqual(validateSalesShipmentPlans({ data: harness.data }), []);
  assert.deepEqual(validateSalesShipments({ data: harness.data }), []);
  const duplicateShipmentState = JSON.parse(JSON.stringify({ data: harness.data }));
  duplicateShipmentState.data.salesShipments.push({
    ...duplicateShipmentState.data.salesShipments[0], id: 'duplicate-shipment', shipmentNo: 'TF-000002'
  });
  assert.ok(validateSalesShipments(duplicateShipmentState).some((issue) => /aynı sevkiyat planı|idempotencyKey/.test(issue)));
  const orphanPlanState = JSON.parse(JSON.stringify({ data: harness.data }));
  orphanPlanState.data.salesShipments = [];
  assert.ok(validateSalesShipments(orphanPlanState).some((issue) => /DISPATCHED plan tek bir gerçek sevkiyat|snapshot bağlantısı olmayan/.test(issue)));
  const changedState = JSON.parse(JSON.stringify({ data: harness.data }));
  changedState.data.salesShipments[0].snapshot.shipmentNote = 'Değiştirilemez';
  assert.equal(validateSalesShipmentImmutability({ data: harness.data }, changedState).length, 1);

  const stockBeforeSecondTry = harness.data.stockDepotItems[0].qty;
  const movementCountBeforeSecondTry = harness.data.stock_movements.length;
  await harness.StockModule.dispatchSalesShipmentPlan('order-sor-000005');
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.data.salesShipments.length, 1);
  assert.equal(harness.data.stockDepotItems[0].qty, stockBeforeSecondTry);
  assert.equal(harness.data.stock_movements.length, movementCountBeforeSecondTry);
  assert.match(harness.alerts.at(-1), /Yalnız PLANNED|daha önce sevk/);
});

test('Gercek Sevk Et Faz 3 DB.save hatasinda tum koleksiyonlari ve deliveryDraft verisini geri alir', async () => {
  for (const options of [{ failSave: true }, { saveReturnsFailure: true }]) {
    const harness = buildSalesShipmentPlanPhase2Harness(options);
    installSalesShipmentDeliveryDraftPlan(harness, {
      shipmentNote: 'Korunacak taslak', vehiclePlate: '06 OLD 06', phone: '', deliveredBy: '', receivedBy: '', receivedByRole: '',
      items: [{ sourceLineId: 'line-sor-000005-1', packageCount: 1, weightKg: 4 }], updatedAt: '2026-07-17T12:00:00.000Z'
    });
    const before = JSON.stringify(harness.data);
    harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
    const elements = installSalesShipmentDeliveryDraftDom(harness, { shipmentNote: 'Kaydedilmemeli', packageCount: 2, weightKg: 10 });
    await harness.StockModule.dispatchSalesShipmentPlan('order-sor-000005');

    assert.equal(harness.saveCount, 1);
    assert.equal(JSON.stringify(harness.data), before);
    assert.equal(harness.data.stockDepotItems[0].qty, 5);
    assert.equal(harness.data.salesShipments.length, 0);
    assert.equal(harness.data.stock_movements.filter((row) => row.movementType === 'SALES_SHIPMENT_OUT').length, 0);
    assert.equal(harness.data.salesShipmentPlans[0].status, 'PLANNED');
    assert.equal(harness.data.salesShipmentPlans[0].deliveryDraft.shipmentNote, 'Korunacak taslak');
    assert.match(harness.alerts.at(-1), /Sevkiyat tamamlanamadı/);
    const button = elements[harness.StockModule.getSalesShipmentDeliveryDraftFieldId('sales-shipment-plan-1', 'dispatchAction')];
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, 'Sevk Et');
  }
});

test('Gercek Sevk Et Faz 3 kullanici onaylamazsa hicbir veri yazmaz', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness({ confirmResult: false });
  installSalesShipmentDeliveryDraftPlan(harness);
  const before = JSON.stringify(harness.data);
  harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
  installSalesShipmentDeliveryDraftDom(harness);
  await harness.StockModule.dispatchSalesShipmentPlan('order-sor-000005');
  assert.equal(harness.confirmMessages.length, 1);
  assert.equal(harness.saveCount, 0);
  assert.equal(JSON.stringify(harness.data), before);
});

test('Gercek Sevk Et Faz 3 TF numarasini mevcut en buyuk gecerli numaradan devam ettirir', () => {
  const harness = buildSalesShipmentPlanPhase2Harness();
  harness.data.salesShipments = [
    { shipmentNo: 'TF-000004' },
    { shipmentNo: 'TF-000002' },
    { shipmentNo: 'TF-ABC' },
    { shipmentNo: 'ESKI-99' }
  ];
  assert.equal(harness.StockModule.getNextSalesShipmentNo(), 'TF-000005');
});

test('Gercek Sevk Et Faz 3 bozuk veya yetersiz allocation verisinde yazmadan durur', async () => {
  for (const mode of ['missing', 'insufficient']) {
    const harness = buildSalesShipmentPlanPhase2Harness();
    const plan = installSalesShipmentDeliveryDraftPlan(harness);
    if (mode === 'missing') plan.items[0].stockAllocations[0].stockItemId = 'missing-stock';
    else Object.assign(harness.data.stockDepotItems[0], { qty: 2, quantity: 2, amount: 2 });
    const before = JSON.stringify(harness.data);
    harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
    installSalesShipmentDeliveryDraftDom(harness);
    await harness.StockModule.dispatchSalesShipmentPlan('order-sor-000005');
    assert.equal(harness.saveCount, 0);
    assert.equal(harness.confirmMessages.length, 0);
    assert.equal(JSON.stringify(harness.data), before);
    assert.match(harness.alerts.at(-1), /canonical stok|allocation/i);
  }
});

test('Gercek Sevk Et Faz 3 cift tikta tek shipment ve tek stok dusumu yapar', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness({ deferSave: true });
  installSalesShipmentDeliveryDraftPlan(harness);
  harness.StockModule.openSalesShipmentDeliveryReceiptDraft('order-sor-000005');
  installSalesShipmentDeliveryDraftDom(harness);
  const first = harness.StockModule.dispatchSalesShipmentPlan('order-sor-000005');
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.data.salesShipments.length, 1);
  assert.equal(harness.data.stockDepotItems[0].qty, 2);
  const second = harness.StockModule.dispatchSalesShipmentPlan('order-sor-000005');
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.data.salesShipments.length, 1);
  harness.releaseSave({ ok: true });
  await Promise.all([first, second]);
  assert.equal(harness.data.salesShipments.length, 1);
  assert.equal(harness.data.stockDepotItems[0].qty, 2);
  assert.equal(harness.data.stock_movements.filter((row) => row.movementType === 'SALES_SHIPMENT_OUT').reduce((sum, row) => sum + row.qty, 0), 3);
});

test('Sevkiyat Planlama Faz 2 kismi SVP kaydeder ve yalniz allocation rezervasyonu olusturur', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness();
  const before = snapshotSalesShipmentUnaffectedCollections(harness.data);
  harness.StockModule.openSalesShipmentPlanningMode();
  harness.StockModule.setSalesShipmentPlanningSelected(harness.row.key, true, 5);
  harness.StockModule.setSalesShipmentPlanningQty(harness.row.key, '3', 5);
  await harness.StockModule.saveSalesShipmentPlan();

  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.equal(harness.data.salesShipmentPlans.length, 1);
  const plan = harness.data.salesShipmentPlans[0];
  assert.equal(plan.planNo, 'SVP-000001');
  assert.equal(plan.status, 'PLANNED');
  assert.equal(plan.statusLabel, 'Planlandı');
  assert.equal(plan.sourceOrderId, 'order-sor-000005');
  assert.match(plan.idempotencyKey, /^SALES_SHIPMENT_PLAN\|order-sor-000005\|/);
  assert.equal(plan.items.length, 1);
  assert.equal(plan.items[0].sourceLineId, 'line-sor-000005-1');
  assert.equal(plan.items[0].lineKey, 'SALES_ORDER|order-sor-000005|line-sor-000005-1');
  assert.equal(plan.items[0].salCode, 'SAL-000001');
  assert.equal(plan.items[0].svrCode, 'SVR-000001');
  assert.equal(plan.items[0].plannedQty, 3);
  assert.equal(plan.items[0].stockAllocations.reduce((sum, item) => sum + item.allocatedQty, 0), 3);
  assert.deepEqual(JSON.parse(JSON.stringify(plan.items[0].stockAllocations[0])), {
    stockItemId: 'stock-finished-sor-000005', allocatedQty: 3, depotId: 'depot_profil',
    locationId: 'location-r01-a1', sourceOrderId: 'order-sor-000005', sourceLineId: 'line-sor-000005-1'
  });
  assert.equal(harness.data.stockDepotItems[0].qty, 5);
  assert.equal(harness.StockModule.getSalesShipmentPlanningAvailability(harness.row).planableQty, 2);
  assert.equal(snapshotSalesShipmentUnaffectedCollections(harness.data), before);
  assert.equal(harness.StockModule.state.salesShipmentPlanningMode, false);
  assert.ok(harness.alerts.includes('SVP-000001 sevkiyat planı kaydedildi.'));

  harness.StockModule.openSalesShipmentPlanningMode();
  assert.equal(harness.StockModule.state.salesShipmentPlanningMode, false);
  assert.equal(harness.data.salesShipmentPlans.length, 1);
  assert.ok(harness.alerts.includes('Bu sipariş için aktif sevkiyat planı bulunmaktadır. Mevcut planı Sevkiyat İşlemleri bölümünden yönetebilirsiniz.'));
});

test('Sevkiyat Planlama Faz 2 cift tikta siparis kilidi ve idempotency ile tek SVP olusturur', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness({ deferSave: true });
  harness.StockModule.openSalesShipmentPlanningMode();
  harness.StockModule.setSalesShipmentPlanningSelected(harness.row.key, true, 5);
  harness.StockModule.setSalesShipmentPlanningQty(harness.row.key, '3', 5);
  const firstSave = harness.StockModule.saveSalesShipmentPlan();
  assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
  assert.equal(harness.data.salesShipmentPlans.length, 1);
  assert.equal(harness.StockModule.state.salesShipmentPlanningSavingByOrder['order-sor-000005'], true);
  const savingHtml = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(savingHtml, /data-shipment-planning-save="true"[^>]*disabled/);
  assert.match(savingHtml, /data-shipment-planning-cancel="true"[^>]*disabled/);
  const secondSave = harness.StockModule.saveSalesShipmentPlan();
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.data.salesShipmentPlans.length, 1);
  harness.releaseSave({ ok: true });
  await Promise.all([firstSave, secondSave]);
  assert.equal(harness.data.salesShipmentPlans.length, 1);
  assert.equal(new Set(harness.data.salesShipmentPlans.map((plan) => plan.idempotencyKey)).size, 1);
});

test('Sevkiyat Planlama Faz 2 DB.save hatasinda yalniz plan koleksiyonunu geri alir ve secimi korur', async () => {
  for (const options of [{ failSave: true }, { saveReturnsFailure: true }]) {
    const harness = buildSalesShipmentPlanPhase2Harness(options);
    const before = snapshotSalesShipmentUnaffectedCollections(harness.data);
    harness.StockModule.openSalesShipmentPlanningMode();
    harness.StockModule.setSalesShipmentPlanningSelected(harness.row.key, true, 5);
    harness.StockModule.setSalesShipmentPlanningQty(harness.row.key, '3', 5);
    const draftToken = harness.StockModule.state.salesShipmentPlanningDraftToken;
    await harness.StockModule.saveSalesShipmentPlan();
    assert.equal(harness.saveCount, 1, harness.alerts.join(' | '));
    assert.equal(harness.data.salesShipmentPlans.length, 0);
    assert.equal(snapshotSalesShipmentUnaffectedCollections(harness.data), before);
    assert.equal(harness.StockModule.state.salesShipmentPlanningMode, true);
    assert.equal(harness.StockModule.state.salesShipmentPlanningSelectedRows[harness.row.key], true);
    assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[harness.row.key], '3');
    assert.equal(harness.StockModule.state.salesShipmentPlanningDraftToken, draftToken);
    assert.equal(harness.StockModule.getNextSalesShipmentPlanNo(), 'SVP-000001');
    assert.match(harness.alerts.at(-1), /Sevkiyat planı kaydedilemedi/);
  }
});

test('Sevkiyat Planlama Faz 2 kayit aninda azalan canonical stoga gore eski miktari reddeder', async () => {
  const harness = buildSalesShipmentPlanPhase2Harness();
  harness.StockModule.openSalesShipmentPlanningMode();
  harness.StockModule.setSalesShipmentPlanningSelected(harness.row.key, true, 5);
  harness.StockModule.setSalesShipmentPlanningQty(harness.row.key, '3', 5);
  Object.assign(harness.data.stockDepotItems[0], { qty: 2, quantity: 2, amount: 2 });
  await harness.StockModule.saveSalesShipmentPlan();
  assert.equal(harness.saveCount, 0);
  assert.equal(harness.data.salesShipmentPlans.length, 0);
  assert.equal(harness.StockModule.state.salesShipmentPlanningMode, true);
  assert.equal(harness.StockModule.state.salesShipmentPlanningQtyByRow[harness.row.key], '3');
  assert.match(harness.alerts.at(-1), /Güncel planlanabilir: 2/);
});

test('Sunucu salesShipmentPlans yapisini ve tek aktif plan kuralini dogrular', () => {
  const { analyzeCriticalCollectionDrops, validateSalesShipmentPlans } = require('../serve.js');
  const validPlan = {
    id: 'svp-id-1', planNo: 'SVP-000001', status: 'PLANNED', sourceOrderId: 'order-1', sourceOrderNo: 'SOR-000001',
    idempotencyKey: 'SALES_SHIPMENT_PLAN|order-1|token-1', createdAt: '2026-07-17T00:00:00.000Z', updatedAt: '2026-07-17T00:00:00.000Z',
    deliveryDraft: {
      shipmentNote: 'Taslak not', vehiclePlate: '34 ABC 123', phone: '0555 111 22 33', deliveredBy: 'Teslim Eden',
      receivedBy: 'Teslim Alan', receivedByRole: 'Şoför', updatedAt: '2026-07-17T01:00:00.000Z',
      items: [{ sourceLineId: 'line-1', packageCount: 2, weightKg: 12.5 }]
    },
    items: [{
      sourceLineId: 'line-1', lineKey: 'SALES_ORDER|order-1|line-1', productId: 'product-1', productCode: 'SAL-000001',
      variantId: 'variant-1', variantCode: 'SVR-000001', salCode: 'SAL-000001', svrCode: 'SVR-000001', productName: 'Ürün',
      unit: 'ADET', orderQty: 5, plannedQty: 3,
      stockAllocations: [{ stockItemId: 'stock-1', allocatedQty: 3, depotId: 'depot_profil', locationId: 'R01-A1', sourceOrderId: 'order-1', sourceLineId: 'line-1' }]
    }]
  };
  const serverData = {
    salesShipmentPlans: [validPlan],
    orders: [{ id: 'order-1', orderNo: 'SOR-000001', lines: [{ id: 'line-1', productId: 'product-1', variationId: 'variant-1', idCode: 'SAL-000001', productCode: 'SAL-000001', variantCode: 'SVR-000001', qty: 5 }] }],
    stockDepotItems: [{
      id: 'stock-1', sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-1', productId: 'product-1',
      variantId: 'variant-1', variantCode: 'SVR-000001', depotId: 'depot_profil', locationId: 'R01-A1',
      stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', unit: 'ADET', qty: 5, quantity: 5, amount: 5
    }],
    montageCompletionTransfers: [{
      id: 'mct-1', status: 'POSTED', sourceOrderId: 'order-1', sourceLineId: 'line-1', productId: 'product-1',
      variantId: 'variant-1', variantCode: 'SVR-000001', finishedProductStockItemId: 'stock-1', finishedProductMovementId: 'movement-1'
    }],
    stock_movements: [{
      id: 'movement-1', sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-1', productId: 'product-1',
      variantId: 'variant-1', variantCode: 'SVR-000001', stockDepotItemId: 'stock-1', targetDepotId: 'depot_profil', targetLocationId: 'R01-A1'
    }]
  };
  assert.deepEqual(validateSalesShipmentPlans({ data: serverData }), []);
  const cancelled = JSON.parse(JSON.stringify(validPlan));
  cancelled.id = 'svp-id-cancelled';
  cancelled.planNo = 'SVP-000003';
  cancelled.idempotencyKey = 'SALES_SHIPMENT_PLAN|order-1|token-cancelled';
  cancelled.status = 'CANCELLED';
  cancelled.statusLabel = 'İptal Edildi';
  cancelled.cancelledAt = '2026-07-18T00:00:00.000Z';
  cancelled.updatedAt = cancelled.cancelledAt;
  const cancelledServerData = JSON.parse(JSON.stringify(serverData));
  cancelledServerData.salesShipmentPlans = [validPlan, cancelled];
  assert.deepEqual(validateSalesShipmentPlans({ data: cancelledServerData }), []);

  const missingCancelledAt = JSON.parse(JSON.stringify(cancelledServerData));
  delete missingCancelledAt.salesShipmentPlans[1].cancelledAt;
  assert.ok(validateSalesShipmentPlans({ data: missingCancelledAt }).some((issue) => /cancelledAt zamanı zorunludur/.test(issue)));
  const cancelledWithShipment = JSON.parse(JSON.stringify(cancelledServerData));
  Object.assign(cancelledWithShipment.salesShipmentPlans[1], {
    dispatchedAt: '2026-07-18T00:00:00.000Z', shipmentId: 'shipment-forbidden', shipmentNo: 'TF-000003'
  });
  assert.ok(validateSalesShipmentPlans({ data: cancelledWithShipment }).some((issue) => /CANCELLED plan sevk tarihi veya teslim fişi bağlantısı içeremez/.test(issue)));
  const dispatchedWithCancellation = JSON.parse(JSON.stringify(cancelled));
  Object.assign(dispatchedWithCancellation, {
    status: 'DISPATCHED', dispatchedAt: '2026-07-18T00:00:00.000Z', shipmentId: 'shipment-3', shipmentNo: 'TF-000003'
  });
  const dispatchedCollisionData = JSON.parse(JSON.stringify(serverData));
  dispatchedCollisionData.salesShipmentPlans = [dispatchedWithCancellation];
  assert.ok(validateSalesShipmentPlans({ data: dispatchedCollisionData }).some((issue) => /DISPATCHED plan cancelledAt içeremez/.test(issue)));
  const duplicate = JSON.parse(JSON.stringify(validPlan));
  duplicate.id = 'svp-id-2';
  duplicate.planNo = 'SVP-000002';
  duplicate.idempotencyKey = 'SALES_SHIPMENT_PLAN|order-1|token-2';
  duplicate.items[0].stockAllocations[0].stockItemId = 'stock-2';
  const duplicateServerData = JSON.parse(JSON.stringify(serverData));
  duplicateServerData.salesShipmentPlans = [validPlan, duplicate];
  duplicateServerData.stockDepotItems.push({ ...duplicateServerData.stockDepotItems[0], id: 'stock-2' });
  duplicateServerData.montageCompletionTransfers.push({ ...duplicateServerData.montageCompletionTransfers[0], id: 'mct-2', finishedProductStockItemId: 'stock-2', finishedProductMovementId: 'movement-2' });
  duplicateServerData.stock_movements.push({ ...duplicateServerData.stock_movements[0], id: 'movement-2', stockDepotItemId: 'stock-2' });
  const issues = validateSalesShipmentPlans({ data: duplicateServerData });
  assert.ok(issues.some((issue) => /birden fazla aktif sevkiyat planı/.test(issue)));
  const dropIssues = analyzeCriticalCollectionDrops(
    { data: { salesShipmentPlans: [validPlan] } },
    { data: { salesShipmentPlans: [] } }
  );
  assert.equal(dropIssues.length, 1);
  assert.equal(dropIssues[0].collection, 'salesShipmentPlans');
  assert.equal(dropIssues[0].reason, 'collection_cleared');
});

test('Montaj is plani ozeti fiziksel, ayrilmis, serbest ve gercek eksigi ayirir', () => {
  const plan = {
    id: 'plan-summary',
    planNo: 'MGP-000011',
    status: 'DRAFT',
    items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-1', plannedQty: 11 }],
    parts: [{ source: 'part', refId: 'ref-a', code: 'PRC-A', requiredQty: 120 }]
  };
  const harness = buildMontagePlanHarness({ plans: [plan] });
  const demand = { id: 'demand-1', sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceOrderNo: 'SOR-1', sourceLineId: 'line-1', demandCode: 'PLN-1' };
  const jobs = [{
    key: 'job-1',
    demandId: 'demand-1',
    itemKey: 'item-1',
    sourceTypeKey: 'SALES_ORDER',
    sourceMeta: { key: 'SALES_ORDER', label: 'Satış Siparişi' },
    productName: 'Ürün A',
    variantCode: 'SVR-1',
    calculable: true,
    partRows: [{ source: 'part', refId: 'ref-a', code: 'PRC-A', name: 'Parça A', requiredQty: 280, readyQty: 160 }]
  }];
  harness.context.DB.data.data.stockDepotItems[0].quantity = 280;
  harness.context.DB.data.data.stockDepotItems[0].qty = 280;
  harness.StockModule.getMontageReadyDemands = () => [demand];
  harness.StockModule.getMontageReadyDemandMap = () => new Map([['demand-1', demand]]);
  harness.StockModule.buildMontageReadyJobCards = () => jobs;
  harness.StockModule.getMontageReadyDetailOrderRows = () => [];

  let row = harness.StockModule.getMontageReadyPlanRows(jobs)[0];
  assert.equal(row.requiredQty, 280);
  assert.equal(row.physicalReadyQty, 280);
  assert.equal(row.activePlanReservedQty, 120);
  assert.equal(row.freeReadyQty, 160);
  assert.equal(row.realMissingQty, 0);
  harness.StockModule.state.montageReadyDetailKey = row.key;
  let html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(html, /Fiziksel hazır parça/);
  assert.match(html, /Aktif planlara ayrılan/);
  assert.match(html, /Serbest \/ planlanabilir parça/);
  assert.match(html, /Gerçek eksik parça/);
  assert.match(html, /Montaja Hazır/);
  assert.doesNotMatch(html, /Eksik Parça Var/);

  harness.context.DB.data.data.stockDepotItems[0].quantity = 200;
  harness.context.DB.data.data.stockDepotItems[0].qty = 200;
  row = harness.StockModule.getMontageReadyPlanRows(jobs)[0];
  assert.equal(row.realMissingQty, 80);
  assert.equal(row.activePlanReservedQty, 120);
  harness.StockModule.state.montageReadyDetailKey = row.key;
  html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(html, /Eksik Parça Var/);
});

function buildMontageReadyExactMgsReadModelFixture({ specs, targetSetQty = 5, mgsSetQty = 3, freeByCode = {} }) {
  const harness = buildMontagePlanHarness();
  const demand = {
    id: 'demand-target', sourceType: 'SALES_ORDER', sourceOrderId: 'order-target',
    sourceOrderNo: 'SOR-TARGET', sourceLineId: 'line-target', demandCode: 'PLN-TARGET'
  };
  const itemKey = 'item-target';
  const shipmentId = 'shipment-exact-in-transit';
  const shipment = {
    id: shipmentId,
    shipmentNo: 'MGS-EXACT',
    status: 'IN_TRANSIT',
    targetUnitId: 'u3',
    items: [{
      sourceType: 'SALES_ORDER', sourceOrderId: demand.sourceOrderId, sourceLineId: demand.sourceLineId,
      demandId: demand.id, itemKey, shippedQty: mgsSetQty
    }],
    parts: []
  };
  const components = [];
  const allocations = [];
  const recipes = [];
  specs.forEach((spec, index) => {
    const prcId = `prc-${index + 1}`;
    const physicalSegmentId = `STOCK|stock-${index + 1}`;
    const reservationKey = `MGP_EXACT|plan-source|${index + 1}|1`;
    const shippedQty = spec.qtyPerSet * mgsSetQty;
    const freeQty = Math.max(0, Number(freeByCode[spec.code] || 0));
    const range = {
      reservationKey,
      physicalSegmentId,
      prcId,
      prcCode: spec.code,
      unit: 'ADET',
      segmentOffsetStart: 0,
      segmentOffsetEnd: shippedQty,
      qty: shippedQty
    };
    shipment.parts.push({
      refId: prcId,
      code: spec.code,
      unit: 'ADET',
      shippedQty,
      allocations: [{ physicalSegmentId, segmentRanges: [range] }]
    });
    allocations.push({
      fixedByExactHold: true,
      holdKind: 'MGS_EXACT',
      shipmentId,
      reservationKey,
      physicalSegmentId,
      instructionSegmentOffsetStart: 0,
      instructionSegmentOffsetEnd: shippedQty,
      targetDemandId: demand.id,
      targetItemKey: itemKey,
      prcId,
      prcCode: spec.code,
      unit: 'ADET',
      qty: shippedQty,
      allocatedQty: shippedQty
    });
    if (freeQty > 0) {
      allocations.push({
        fixedByExactHold: false,
        holdKind: '',
        physicalSegmentId: `STOCK|free-${index + 1}`,
        targetDemandId: demand.id,
        targetItemKey: itemKey,
        prcId,
        prcCode: spec.code,
        unit: 'ADET',
        qty: freeQty,
        allocatedQty: freeQty
      });
    }
    components.push({
      demandId: demand.id,
      originItemKey: itemKey,
      prcId,
      prcCode: spec.code,
      unit: 'ADET',
      allocatedQty: shippedQty + freeQty,
      allocatableQty: (shippedQty + freeQty) / spec.qtyPerSet,
      allocatable: true,
      sourceBuckets: ['FROM_PRODUCTION']
    });
    recipes.push({ refId: prcId, code: spec.code, unit: 'ADET', qtyPerSet: spec.qtyPerSet });
  });
  harness.context.DB.data.data.partComponentCards = recipes.map((recipe) => ({
    id: recipe.refId, code: recipe.code, unit: recipe.unit
  }));
  harness.context.DB.data.data.montageDispatchShipments = [shipment];
  harness.StockModule.getMontageReadyDemandMap = () => new Map([[demand.id, demand]]);
  const readiness = {
    demandId: demand.id,
    originItemKey: itemKey,
    allocatableQty: Math.min(...components.map((component, index) =>
      component.allocatedQty / specs[index].qtyPerSet
    )),
    allocatable: true,
    components
  };
  const resolverContext = {
    ok: true,
    snapshot: {
      partComponentCards: harness.context.DB.data.data.partComponentCards,
      montageDispatchShipments: [shipment]
    },
    resolved: { allocations },
    readinessByDemandItemKey: new Map([[`${demand.id}|${itemKey}`, readiness]]),
    duplicateDemandItemKeys: new Set()
  };
  const resolvedParts = recipes.map((recipe) =>
    harness.StockModule.resolveMontageReadyResolverPartAllocation(
      resolverContext,
      demand.id,
      itemKey,
      recipe
    )
  );
  const partRows = specs.map((spec, index) => ({
    source: 'component',
    refId: recipes[index].refId,
    code: spec.code,
    unit: 'ADET',
    requiredQty: spec.qtyPerSet * targetSetQty,
    resolverTrusted: resolvedParts[index].trusted,
    resolverPhysicalQty: resolvedParts[index].physicalQty
  }));
  const planRow = {
    jobs: [{
      demandId: demand.id,
      itemKey,
      sourceTypeKey: 'SALES_ORDER',
      resolverAvailability: { trusted: true },
      partRows
    }]
  };
  return {
    harness,
    demand,
    itemKey,
    shipment,
    recipes,
    resolverContext,
    resolvedParts,
    summary: harness.StockModule.getMontageReadyPartSummary(planRow)
  };
}

test('Montaj read-modeli IN_TRANSIT MGS exact 24 parcayi yalniz sevkte kovasinda sayar', () => {
  const fixture = buildMontageReadyExactMgsReadModelFixture({
    specs: [
      { code: 'PRC-01', qtyPerSet: 1 },
      { code: 'PRC-02', qtyPerSet: 1 },
      { code: 'PRC-03', qtyPerSet: 1 },
      { code: 'PRC-04', qtyPerSet: 2 },
      { code: 'PRC-05', qtyPerSet: 1 },
      { code: 'PRC-06', qtyPerSet: 1 },
      { code: 'PRC-07', qtyPerSet: 1 }
    ]
  });

  assert.ok(fixture.resolvedParts.every((part) => part.trusted === true));
  assert.equal(fixture.resolvedParts.reduce((sum, part) => sum + part.inTransitExactQty, 0), 24);
  assert.equal(fixture.summary.requiredTotal, 40);
  assert.equal(fixture.summary.physicalReadyTotal, 0);
  assert.equal(fixture.summary.inTransitCoverageTotal, 24);
  assert.equal(fixture.summary.displayRealMissingTotal, 16);
});

test('Montaj read-modeli MGS disindaki ayni PRC serbest fiziksel miktari korur ve exact belirsizlikte kapanir', () => {
  const fixture = buildMontageReadyExactMgsReadModelFixture({
    specs: [{ code: 'PRC-01', qtyPerSet: 1 }],
    targetSetQty: 10,
    mgsSetQty: 3,
    freeByCode: { 'PRC-01': 2 }
  });

  assert.equal(fixture.resolvedParts[0].trusted, true);
  assert.equal(fixture.resolvedParts[0].resolverAllocatedQty, 5);
  assert.equal(fixture.resolvedParts[0].inTransitExactQty, 3);
  assert.equal(fixture.resolvedParts[0].physicalQty, 2);
  assert.equal(fixture.summary.physicalReadyTotal, 2);
  assert.equal(fixture.summary.inTransitCoverageTotal, 3);
  assert.equal(fixture.summary.displayRealMissingTotal, 5);

  const ranges = fixture.shipment.parts[0].allocations[0].segmentRanges;
  ranges.push({ ...ranges[0] });
  const ambiguous = fixture.harness.StockModule.resolveMontageReadyResolverPartAllocation(
    fixture.resolverContext,
    fixture.demand.id,
    fixture.itemKey,
    fixture.recipes[0]
  );
  assert.equal(ambiguous.trusted, false);
  assert.equal(ambiguous.reasonCode, 'MGS_EXACT_RANGE_NOT_UNIQUE');
});

test('Montaj ozeti IN_TRANSIT parcalari ihtiyac acigi kadar sayar', () => {
  const harness = buildMontagePlanHarness();
  harness.context.DB.data.data.stockDepotItems[0].quantity = 265;
  harness.context.DB.data.data.stockDepotItems[0].qty = 265;
  harness.context.DB.data.data.stockDepotItems.push({
    id: 'stock-prc-b', productCode: 'PRC-B', code: 'PRC-B', quantity: 0, qty: 0,
    stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', allocationType: 'FREE', depotId: 'main'
  });
  const demand = {
    id: 'demand-1', sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceOrderNo: 'SOR-000001',
    sourceLineId: 'line-1', demandCode: 'PLN-000001'
  };
  const jobs = [{
    key: 'job-1', demandId: 'demand-1', itemKey: 'item-1', sourceTypeKey: 'SALES_ORDER',
    sourceMeta: { key: 'SALES_ORDER', label: 'Satış Siparişi' }, productName: 'Ürün A', variantCode: 'SVR-1', calculable: true,
    partRows: [
      { source: 'part', refId: 'ref-a', code: 'PRC-A', name: 'Parça A', requiredQty: 270 },
      { source: 'part', refId: 'ref-b', code: 'PRC-B', name: 'Parça B', requiredQty: 10 }
    ]
  }];
  const relatedShipment = {
    id: 'shipment-related', shipmentNo: 'MGS-000001', status: 'IN_TRANSIT', targetUnitId: 'u3',
    items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-1', demandId: 'demand-1', itemKey: 'item-1' }],
    parts: [
      { source: 'part', refId: 'ref-a', code: 'PRC-A', shippedQty: 86 },
      { source: 'part', refId: 'ref-b', code: 'PRC-B', shippedQty: 10 }
    ]
  };
  const unrelatedShipment = {
    id: 'shipment-other-order', status: 'IN_TRANSIT', targetUnitId: 'u3',
    items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-2', sourceLineId: 'line-2' }],
    parts: [{ source: 'part', refId: 'ref-b', code: 'PRC-B', shippedQty: 100 }]
  };
  harness.context.DB.data.data.montageDispatchShipments = [relatedShipment, unrelatedShipment];
  harness.StockModule.getMontageReadyDemands = () => [demand];
  harness.StockModule.getMontageReadyDemandMap = () => new Map([['demand-1', demand]]);
  harness.StockModule.buildMontageReadyJobCards = () => jobs;
  harness.StockModule.getMontageReadyDetailOrderRows = () => [];

  assert.equal(relatedShipment.parts.reduce((sum, part) => sum + part.shippedQty, 0), 96);
  let row = harness.StockModule.getMontageReadyPlanRows(jobs)[0];
  assert.equal(row.requiredQty, 280);
  assert.equal(row.physicalReadyQty, 265);
  assert.equal(row.activePlanReservedQty, 0);
  assert.equal(row.inTransitCoverageQty, 15);
  assert.equal(row.freeReadyQty, 265);
  assert.equal(row.realMissingQty, 15);
  assert.equal(row.displayRealMissingQty, 0);
  assert.equal(row.hasInTransitShipment, true);
  harness.StockModule.state.montageReadyDetailKey = row.key;
  const beforeRender = JSON.stringify(harness.context.DB.data.data);
  let html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(html, /Sevkteki parça/);
  assert.match(html, /Montaja Sevk Edildi \/ Teslim Alınmayı Bekliyor/);
  assert.equal(JSON.stringify(harness.context.DB.data.data), beforeRender);
  let listHtml = harness.StockModule.renderMontageReadyJobsLayout();
  assert.match(listHtml, /Hazır parça[\s\S]*Sevkteki parça[\s\S]*Eksik parça/);
  assert.match(listHtml, /SOR-000001[\s\S]*PLN-000001[\s\S]*>280<\/td>[\s\S]*>265<\/td>[\s\S]*>15<\/td>[\s\S]*>0<\/td>/);
  assert.doesNotMatch(listHtml, />96<\/td>|>100<\/td>/);
  assert.equal(JSON.stringify(harness.context.DB.data.data), beforeRender);

  relatedShipment.parts[1].shippedQty = 4;
  row = harness.StockModule.getMontageReadyPlanRows(jobs)[0];
  assert.equal(row.inTransitCoverageQty, 9);
  assert.equal(row.displayRealMissingQty, 6);
  assert.equal(row.partSummary.parts.find((part) => part.code === 'PRC-A').inTransitCoverageQty, 5);
  assert.equal(row.partSummary.parts.find((part) => part.code === 'PRC-B').displayRealMissingQty, 6);
  harness.StockModule.state.montageReadyDetailKey = row.key;
  html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(html, /Montaja Sevk Edildi \/ Teslim Alınmayı Bekliyor/);

  relatedShipment.parts[1].shippedQty = 10;
  relatedShipment.status = 'RECEIVED';
  row = harness.StockModule.getMontageReadyPlanRows(jobs)[0];
  assert.equal(row.inTransitCoverageQty, 0);
  assert.equal(row.receivedCoverageQty, 15);
  assert.equal(row.displayRealMissingQty, 0);
  assert.equal(row.hasInTransitShipment, false);
  assert.equal(row.hasReceivedShipment, true);
  assert.equal(row.partSummary.parts.find((part) => part.code === 'PRC-A').receivedCoverageQty, 5);
  assert.equal(row.partSummary.parts.find((part) => part.code === 'PRC-B').receivedCoverageQty, 10);
  const beforeNoTransitRender = JSON.stringify(harness.context.DB.data.data);
  listHtml = harness.StockModule.renderMontageReadyJobsLayout();
  assert.match(listHtml, /SOR-000001[\s\S]*PLN-000001[\s\S]*>280<\/td>[\s\S]*>265<\/td>[\s\S]*>0<\/td>[\s\S]*>0<\/td>/);
  harness.StockModule.state.montageReadyDetailKey = row.key;
  html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(html, /Montajda teslim alınan parça[\s\S]*15/);
  assert.match(html, /Genel durum[\s\S]*Teslim Alındı/);
  assert.equal(JSON.stringify(harness.context.DB.data.data), beforeNoTransitRender);
});

test('Montaj parca ozeti fazlayi baska parcadaki fiziksel eksige saymaz', () => {
  const harness = buildMontagePlanHarness();
  harness.context.DB.data.data.stockDepotItems[0].quantity = 50;
  harness.context.DB.data.data.stockDepotItems[0].qty = 50;
  harness.context.DB.data.data.stockDepotItems.push({
    id: 'stock-prc-b', productCode: 'PRC-B', code: 'PRC-B', quantity: 500, qty: 500,
    stockClass: 'KULLANILABILIR', status: 'KULLANILABILIR', allocationType: 'FREE', depotId: 'main'
  });
  const demand = { id: 'demand-1', sourceType: 'STOCK' };
  harness.StockModule.getMontageReadyDemandMap = () => new Map([['demand-1', demand]]);
  const summary = harness.StockModule.getMontageReadyPartSummary({
    jobs: [{
      demandId: 'demand-1', itemKey: 'item-1', sourceTypeKey: 'STOCK',
      partRows: [
        { source: 'part', refId: 'ref-a', code: 'PRC-A', requiredQty: 100 },
        { source: 'part', refId: 'ref-b', code: 'PRC-B', requiredQty: 100 }
      ]
    }]
  });
  assert.equal(summary.requiredTotal, 200);
  assert.equal(summary.physicalReadyTotal, 150);
  assert.equal(summary.realMissingTotal, 50);
  assert.equal(summary.inTransitCoverageTotal, 0);
  assert.equal(summary.displayRealMissingTotal, 50);
});

test('Montaj parca ozeti diger is rezervini serbestten duser ve iptal edileni yok sayar', () => {
  const currentPlan = {
    id: 'plan-current', status: 'DRAFT',
    items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-1' }],
    parts: [{ source: 'part', refId: 'ref-a', code: 'PRC-A', requiredQty: 120 }]
  };
  const otherPlan = {
    id: 'plan-other', status: 'DRAFT',
    items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-2', sourceLineId: 'line-2' }],
    parts: [{ source: 'part', refId: 'ref-a', code: 'PRC-A', requiredQty: 30 }]
  };
  const cancelledPlan = {
    id: 'plan-cancelled', status: 'CANCELLED',
    items: [{ sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-1' }],
    parts: [{ source: 'part', refId: 'ref-a', code: 'PRC-A', requiredQty: 500 }]
  };
  const harness = buildMontagePlanHarness({ plans: [currentPlan, otherPlan, cancelledPlan] });
  harness.context.DB.data.data.stockDepotItems[0].quantity = 280;
  harness.context.DB.data.data.stockDepotItems[0].qty = 280;
  const demand = { id: 'demand-1', sourceType: 'SALES_ORDER', sourceOrderId: 'order-1', sourceLineId: 'line-1' };
  harness.StockModule.getMontageReadyDemandMap = () => new Map([['demand-1', demand]]);
  const planRow = {
    jobs: [{
      demandId: 'demand-1', itemKey: 'item-1', sourceTypeKey: 'SALES_ORDER',
      partRows: [{ source: 'part', refId: 'ref-a', code: 'PRC-A', requiredQty: 280 }]
    }]
  };

  let summary = harness.StockModule.getMontageReadyPartSummary(planRow);
  assert.equal(summary.parts[0].activeReservedAllQty, 150);
  assert.equal(summary.activeReservedCurrentJobTotal, 120);
  assert.equal(summary.freePlannableTotal, 130);
  assert.equal(summary.physicalReadyTotal, 280);
  assert.equal(summary.realMissingTotal, 0);

  currentPlan.status = 'CANCELLED';
  summary = harness.StockModule.getMontageReadyPartSummary(planRow);
  assert.equal(summary.parts[0].activeReservedAllQty, 30);
  assert.equal(summary.activeReservedCurrentJobTotal, 0);
  assert.equal(summary.freePlannableTotal, 250);
  assert.equal(summary.physicalReadyTotal, 280);
  assert.equal(summary.realMissingTotal, 0);
});

test('Montaj plani DB.save hatasinda yeni kaydi ve iptali geri alir', async () => {
  for (const options of [{ failSave: true }, { saveReturnsFailure: true }]) {
    const createHarness = buildMontagePlanHarness(options);
    configureMontagePlanSave(createHarness.StockModule, { plannedQty: 3 });
    await createHarness.StockModule.validateMontageReadyDetailSendPlan();
    assert.equal(createHarness.context.DB.data.data.montageDispatchPlans.length, 0);
    assert.ok(createHarness.alerts.some((message) => message.includes('kaydedilemedi')));
  }

  const plan = {
    id: 'plan-rollback',
    planNo: 'MGP-000002',
    status: 'DRAFT',
    updatedAt: 'old',
    cancelledAt: '',
    items: [],
    parts: []
  };
  const cancelHarness = buildMontagePlanHarness({ failSave: true, plans: [plan] });
  await cancelHarness.StockModule.cancelMontageDispatchPlan('plan-rollback');
  assert.equal(plan.status, 'DRAFT');
  assert.equal(plan.updatedAt, 'old');
  assert.equal(plan.cancelledAt, '');
});

test('Montaja Sevk Et yeni plan sevk fonksiyonuna baglidir ve eski montageJobDispatches ayri kalir', () => {
  const harness = buildMontagePlanHarness();
  harness.context.DB.data.data.montageDispatchPlans.push({
    id: 'plan-ui', planNo: 'MGP-000001', status: 'DRAFT', items: [], parts: [], createdAt: '2026-01-01'
  });
  harness.StockModule.openMontageDispatchPlans();
  assert.match(harness.modalHtml, /Montaja Sevk Et/);
  assert.match(harness.modalHtml, /dispatchMontagePlanToMontage/);
  assert.doesNotMatch(harness.modalHtml, /sendMontageReadyJob/);
  harness.context.DB.data.data.montageJobDispatches.push({ dispatchKey: 'd1::SALES_ORDER::SVR-1', sentQty: 7 });
  assert.equal(harness.StockModule.getMontageDispatchedQtyForJob({ demandId: 'd1', sourceTypeKey: 'SALES_ORDER', variantCode: 'SVR-1' }), 7);
});

test('SOR-000001 tek seferlik montage cleanup yalniz dogrulanmis zinciri atomik temizler', async () => {
  const harness = buildSor000001MontageCleanupHarness();
  const data = harness.DB.data.data;
  const protectedState = JSON.stringify({
    orders: data.orders,
    planningDemands: data.planningDemands,
    workOrders: data.workOrders,
    workOrderTransactions: data.workOrderTransactions
  });
  const unrelatedState = JSON.stringify({
    plan: data.montageDispatchPlans.find((row) => row.id === 'unrelated-plan'),
    shipment: data.montageDispatchShipments.find((row) => row.id === 'unrelated-shipment'),
    transfer: data.montageCompletionTransfers.find((row) => row.id === 'unrelated-transfer'),
    stock: data.stockDepotItems.find((row) => row.id === 'unrelated-stock'),
    movement: data.stock_movements.find((row) => row.id === 'unrelated-movement')
  });
  const sourceQtyBefore = new Map(data.stockDepotItems
    .filter((row) => String(row.id).startsWith('cleanup-source-'))
    .map((row) => [row.id, Number(row.quantity)]));

  const rejected = await harness.StockModule.cleanupSor000001MontageDemoChainOnce('yanlis-anahtar');
  assert.equal(rejected.ok, false);
  assert.equal(harness.saveCount, 0);

  const result = await harness.StockModule.cleanupSor000001MontageDemoChainOnce('RESET_SOR-000001_MONTAGE_CHAIN_V1');
  assert.equal(result.ok, true, result.message);
  assert.equal(result.summary.restoredQty, 104);
  assert.equal(result.summary.removedStockRows, 22);
  assert.equal(result.summary.removedMovements, 51);
  assert.equal(harness.saveCount, 1);
  assert.equal(harness.approvalArgs[0], 'sor000001_montage_demo_cleanup');
  assert.equal(harness.approvalArgs[3].orderNo, 'SOR-000001');

  const targetPlanIds = new Set(harness.planSpecs.map((row) => row[0]));
  const targetShipmentIds = new Set(harness.shipmentSpecs.map((row) => row.id));
  assert.equal(data.montageDispatchPlans.some((row) => targetPlanIds.has(row.id)), false);
  assert.equal(data.montageDispatchShipments.some((row) => targetShipmentIds.has(row.id)), false);
  assert.equal(data.montageCompletionTransfers.some((row) => row.id === harness.transferId), false);
  assert.equal(data.stockDepotItems.some((row) => String(row.id).startsWith('cleanup-receipt-') || row.id === harness.finishedStockId), false);
  assert.equal(data.stock_movements.some((row) => String(row.id).startsWith('cleanup-') || row.id === harness.finishedMovementId), false);
  const restoredQty = data.stockDepotItems
    .filter((row) => sourceQtyBefore.has(row.id))
    .reduce((sum, row) => sum + Number(row.quantity) - sourceQtyBefore.get(row.id), 0);
  assert.equal(restoredQty, 104);
  assert.equal(JSON.stringify({
    orders: data.orders,
    planningDemands: data.planningDemands,
    workOrders: data.workOrders,
    workOrderTransactions: data.workOrderTransactions
  }), protectedState);
  assert.equal(JSON.stringify({
    plan: data.montageDispatchPlans.find((row) => row.id === 'unrelated-plan'),
    shipment: data.montageDispatchShipments.find((row) => row.id === 'unrelated-shipment'),
    transfer: data.montageCompletionTransfers.find((row) => row.id === 'unrelated-transfer'),
    stock: data.stockDepotItems.find((row) => row.id === 'unrelated-stock'),
    movement: data.stock_movements.find((row) => row.id === 'unrelated-movement')
  }), unrelatedState);

  const secondCall = await harness.StockModule.cleanupSor000001MontageDemoChainOnce('RESET_SOR-000001_MONTAGE_CHAIN_V1');
  assert.equal(secondCall.ok, false);
  assert.equal(secondCall.alreadyCompleted, true);
  assert.equal(harness.saveCount, 1);
});

test('SOR-000001 montage cleanup fingerprint sapmasinda durur ve DB.save hatasinda tam rollback yapar', async () => {
  const mismatchCases = [
    (data) => data.montageDispatchShipments[0].parts[0].allocations.pop(),
    (data, harness) => {
      data.stockDepotLocations = data.stockDepotLocations.filter((row) => row.id !== harness.upperLocationId);
    },
    (data) => {
      data.stock_movements = data.stock_movements.filter((row) => row.id !== 'cleanup-out-0-0-0');
    },
    (data) => {
      data.montageDispatchPlans[0].status = 'DRAFT';
    }
  ];
  for (const mutate of mismatchCases) {
    const harness = buildSor000001MontageCleanupHarness();
    mutate(harness.DB.data.data, harness);
    const before = JSON.stringify(harness.DB.data.data);
    const result = await harness.StockModule.cleanupSor000001MontageDemoChainOnce('RESET_SOR-000001_MONTAGE_CHAIN_V1');
    assert.equal(result.ok, false);
    assert.equal(harness.saveCount, 0);
    assert.equal(JSON.stringify(harness.DB.data.data), before);
  }

  for (const options of [{ failSave: true }, { saveReturnsFailure: true }]) {
    const harness = buildSor000001MontageCleanupHarness(options);
    const beforeCollections = JSON.stringify({
      montageDispatchPlans: harness.DB.data.data.montageDispatchPlans,
      montageDispatchShipments: harness.DB.data.data.montageDispatchShipments,
      montageCompletionTransfers: harness.DB.data.data.montageCompletionTransfers,
      stockDepotItems: harness.DB.data.data.stockDepotItems,
      stock_movements: harness.DB.data.data.stock_movements
    });
    const result = await harness.StockModule.cleanupSor000001MontageDemoChainOnce('RESET_SOR-000001_MONTAGE_CHAIN_V1');
    assert.equal(result.ok, false);
    assert.equal(harness.saveCount, 1, result.message);
    assert.equal(JSON.stringify({
      montageDispatchPlans: harness.DB.data.data.montageDispatchPlans,
      montageDispatchShipments: harness.DB.data.data.montageDispatchShipments,
      montageCompletionTransfers: harness.DB.data.data.montageCompletionTransfers,
      stockDepotItems: harness.DB.data.data.stockDepotItems,
      stock_movements: harness.DB.data.data.stock_movements
    }), beforeCollections);
  }
});

test('Siparis akisi sekmeleri mevcut uretim ve montaj icerigini korurken sevkiyat arsivini exact siparise baglar', () => {
  let renderCount = 0;
  let sanalTaksimRenderCount = 0;
  let shipmentRenderArgs = [];
  const StockModule = {
    renderCompletedSalesShipmentsForOrderHtml: (...args) => {
      shipmentRenderArgs = args;
      return '<div data-existing-shipment-content="true">TF-000001</div>';
    }
  };
  const { exported: PlanningModule, context } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    UI: { renderCurrentPage: () => { renderCount += 1; } },
    Router: { currentPage: 'stok', history: [] },
    StockModule
  });
  const demand = {
    id: 'demand-flow-1', demandCode: 'PLN-000007', sourceType: 'SALES_ORDER',
    sourceOrderId: 'order-sor-000005', sourceOrderNo: 'SOR-000005', sourceCustomerRefId: 'customer-1', dueDate: '2026-07-20', qty: 5,
    items: [{ id: 'item-flow-1', itemKey: 'item-flow-1', variantCode: 'SVR-000001', qty: 5 }]
  };
  context.DB.data.data.planningDemands = [demand];
  PlanningModule.getDemands = () => context.DB.data.data.planningDemands;
  PlanningModule.getReleasedDemandItemGroups = () => [{ itemKey: 'item-flow-1', itemCode: 'SVR-000001', itemQty: 5 }];
  PlanningModule.getReleasedDemandStatusMeta = () => ({ label: 'Depoya alındı' });
  PlanningModule.getReleasedDemandSourceMeta = () => ({ label: 'Satış Siparişi' });
  PlanningModule.getDemandItems = (row) => row.items;
  PlanningModule.getDemandQtyForDisplay = (row) => row.qty;
  PlanningModule.getLinkedWorkOrdersForDemand = () => [{ id: 'wo-flow-1' }];
  PlanningModule.renderSalesProductionQueueHeaderHtml = () => { throw new Error('Manuel sıra renderer çağrılmamalı'); };
  PlanningModule.renderReleasedSalesSanalTaksimHtml = () => {
    sanalTaksimRenderCount += 1;
    return '<section data-existing-sanal-taksim="true">MEVCUT TEKNİK SANAL TAKSİM İÇERİĞİ</section>';
  };
  PlanningModule.buildReleasedDemandTrackingContentHtml = () => '<div data-existing-production-content="true">MEVCUT ÜRETİM İÇERİĞİ</div>';
  PlanningModule.renderReleasedSalesMontageFlowHtml = () => '<div data-existing-montage-content="true">MEVCUT MONTAJ İÇERİĞİ</div>';
  const before = JSON.stringify(context.DB.data.data);

  PlanningModule.state.releasedProductionStatusTab = 'shipments';
  PlanningModule.openReleasedDemandProductionStatusPage(demand.id);
  assert.equal(PlanningModule.state.releasedProductionStatusTab, 'production');
  assert.equal(renderCount, 1);
  let html = PlanningModule.renderGroupDetailWorkspace();
  assert.match(html, /data-order-flow-tabs="true"/);
  assert.match(html, /Parça &amp; Üretim Akışı[\s\S]*Montaj &amp; Hazırlık[\s\S]*Sevkiyatlar/);
  assert.match(html, /aria-pressed="true"[^>]*[\s\S]*Parça &amp; Üretim Akışı/);
  assert.match(html, /Bu bölüm, siparişe ait parça ve bileşenlerin iş emrinden üretim sonu depoya alınmasına kadar olan hareketlerini gösterir\./);
  assert.match(html, /border-left:4px solid #dc2626; background:#ffffff; color:#1f2937;/);
  assert.doesNotMatch(html, /data-existing-production-queue="true"/);
  assert.doesNotMatch(html, /data-sanal-taksim-manual-order-save="true"|Sırayı Kaydet/);
  const detailsTag = html.match(/<details[^>]*data-sanal-taksim-detail="true"[^>]*>/)?.[0] || '';
  assert.ok(detailsTag);
  assert.doesNotMatch(detailsTag, /\sopen(?:\s|=|>)/);
  assert.match(html, /<summary[^>]*data-sanal-taksim-detail-toggle="true"[^>]*>Sanal Taksim Detayı<\/summary>/);
  assert.match(html, /data-sanal-taksim-detail-content="true"[^>]*>[\s\S]*data-existing-sanal-taksim="true"/);
  assert.match(html, /data-existing-production-content="true"/);
  assert.ok(html.indexOf('data-sanal-taksim-detail="true"') < html.indexOf('data-existing-production-content="true"'));
  assert.equal(sanalTaksimRenderCount, 1);

  PlanningModule.setReleasedProductionStatusTab('montage');
  html = PlanningModule.renderGroupDetailWorkspace();
  assert.match(html, /Montaj &amp; Hazırlık/);
  assert.match(html, /data-existing-montage-content="true"/);
  assert.doesNotMatch(html, /data-existing-production-content|Bu sayfa oluşturulacaktır\.|Bu bölüm, siparişe ait/);

  PlanningModule.setReleasedProductionStatusTab('shipments');
  html = PlanningModule.renderGroupDetailWorkspace();
  assert.match(html, /Sevkiyatlar/);
  assert.match(html, /data-existing-shipment-content="true">TF-000001/);
  assert.deepEqual(Array.from(shipmentRenderArgs), ['order-sor-000005', 'SOR-000005']);
  assert.doesNotMatch(html, /data-existing-production-content/);
  assert.equal(sanalTaksimRenderCount, 1);

  PlanningModule.setReleasedProductionStatusTab('production');
  html = PlanningModule.renderGroupDetailWorkspace();
  assert.match(html, /data-existing-production-content="true"/);
  assert.match(html, /data-sanal-taksim-detail="true"/);
  assert.equal(sanalTaksimRenderCount, 2);
  assert.doesNotMatch(html, /Bu sayfa oluşturulacaktır\./);
  assert.equal(JSON.stringify(context.DB.data.data), before);
});

test('Siparis akisi geri islemi geldigi SOR detayina, SOR detayi geri islemi ana listeye doner', () => {
  let renderCount = 0;
  const { exported: PlanningModule, context } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    UI: { renderCurrentPage: () => { renderCount += 1; } }
  });
  context.DB.data.data.orders = [{
    id: 'order-sor-000007',
    orderNo: 'SOR-000007',
    productionQueue: { manualOrder: 1, updatedAt: '2026-07-24T08:00:00.000Z', updatedBy: 'test-user' }
  }];
  context.DB.data.data.planningDemands = [{
    id: 'demand-sor-000007',
    sourceOrderId: 'order-sor-000007',
    sourceOrderNo: 'SOR-000007',
    status: 'RELEASED'
  }];
  context.DB.data.data.workOrders = [{ id: 'wo-sor-000007', demandId: 'demand-sor-000007', targetQty: 10 }];
  context.DB.data.data.transactions = [{ id: 'txn-existing' }];
  context.DB.data.data.stockDepotItems = [{ id: 'stock-existing', qty: 10 }];
  const before = JSON.stringify(context.DB.data.data);

  PlanningModule.openGroupDetailWorkspace('released-orders', 'sales:order-sor-000007', 'released-orders');
  PlanningModule.openReleasedDemandProductionStatusPage('demand-sor-000007');
  assert.equal(PlanningModule.state.planningDetailScope, 'released-production-status');
  assert.equal(PlanningModule.state.planningDetailGroupKey, 'demand-sor-000007');
  assert.equal(PlanningModule.state.releasedProductionStatusReturnContext.scope, 'released-orders');
  assert.equal(PlanningModule.state.releasedProductionStatusReturnContext.groupKey, 'sales:order-sor-000007');

  PlanningModule.backFromGroupDetailWorkspace();
  assert.equal(PlanningModule.state.workspaceView, 'group-detail');
  assert.equal(PlanningModule.state.planningDetailScope, 'released-orders');
  assert.equal(PlanningModule.state.planningDetailGroupKey, 'sales:order-sor-000007');
  assert.equal(PlanningModule.state.planningDetailBackView, 'released-orders');
  assert.equal(PlanningModule.state.releasedProductionStatusReturnContext, null);

  PlanningModule.backFromGroupDetailWorkspace();
  assert.equal(PlanningModule.state.workspaceView, 'released-orders');
  assert.equal(PlanningModule.state.planningDetailScope, '');
  assert.equal(PlanningModule.state.planningDetailGroupKey, '');
  assert.equal(PlanningModule.state.releasedProductionStatusReturnContext, null);
  assert.equal(JSON.stringify(context.DB.data.data), before);
  assert.equal(renderCount, 4);
});

test('Siparis akisi SOR donus baglamini siparisler arasinda tasimaz ve dogrudan giriste guvenli fallback kullanir', () => {
  const { exported: PlanningModule, context } = loadModule('src/modules/planning-module.js', 'PlanningModule');
  context.DB.data.data.orders = [
    { id: 'order-sor-000007', orderNo: 'SOR-000007' },
    { id: 'order-sor-000008', orderNo: 'SOR-000008' }
  ];
  context.DB.data.data.planningDemands = [
    { id: 'demand-sor-000007', sourceOrderId: 'order-sor-000007', status: 'RELEASED' },
    { id: 'demand-sor-000008', sourceOrderId: 'order-sor-000008', status: 'RELEASED' }
  ];
  const before = JSON.stringify(context.DB.data.data);

  PlanningModule.openGroupDetailWorkspace('released-orders', 'sales:order-sor-000007', 'released-orders');
  PlanningModule.openReleasedDemandProductionStatusPage('demand-sor-000007');
  assert.equal(PlanningModule.state.releasedProductionStatusReturnContext.groupKey, 'sales:order-sor-000007');
  PlanningModule.backFromGroupDetailWorkspace();
  PlanningModule.backFromGroupDetailWorkspace();

  PlanningModule.openGroupDetailWorkspace('released-orders', 'sales:order-sor-000007', 'released-orders');
  PlanningModule.openReleasedDemandProductionStatusPage('demand-sor-000008');
  assert.equal(PlanningModule.state.releasedProductionStatusReturnContext, null);
  PlanningModule.backFromGroupDetailWorkspace();
  assert.equal(PlanningModule.state.workspaceView, 'released-orders');

  PlanningModule.openGroupDetailWorkspace('released-orders', 'sales:order-sor-000008', 'released-orders');
  PlanningModule.openReleasedDemandProductionStatusPage('demand-sor-000008');
  assert.equal(PlanningModule.state.releasedProductionStatusReturnContext.groupKey, 'sales:order-sor-000008');
  assert.equal(PlanningModule.state.releasedProductionStatusReturnContext.demandId, 'demand-sor-000008');
  PlanningModule.backFromGroupDetailWorkspace();
  assert.equal(PlanningModule.state.planningDetailGroupKey, 'sales:order-sor-000008');
  assert.notEqual(PlanningModule.state.planningDetailGroupKey, 'sales:order-sor-000007');

  PlanningModule.openWorkspace('released-orders');
  PlanningModule.openReleasedDemandProductionStatusPage('demand-direct');
  assert.equal(PlanningModule.state.releasedProductionStatusReturnContext, null);
  assert.doesNotThrow(() => PlanningModule.backFromGroupDetailWorkspace());
  assert.equal(PlanningModule.state.workspaceView, 'released-orders');
  assert.equal(JSON.stringify(context.DB.data.data), before);
});

function buildReleasedOrdersRealNavigationHarness() {
  const { exported: PlanningModule, context } = loadModule('src/modules/planning-module.js', 'PlanningModule');
  const orders = [
    {
      id: 'order-real-sor-000007',
      orderNo: 'SOR-000007',
      productionQueue: { manualOrder: 1, updatedAt: '2026-07-24T08:00:00.000Z', updatedBy: 'test-user' }
    },
    {
      id: 'order-real-sor-000008',
      orderNo: 'SOR-000008',
      productionQueue: { manualOrder: 2, updatedAt: '2026-07-24T08:01:00.000Z', updatedBy: 'test-user' }
    }
  ];
  const demands = orders.map((order, index) => ({
    id: `demand-real-sor-00000${index + 7}`,
    demandCode: `PLN-REAL-00000${index + 7}`,
    sourceType: 'SALES_ORDER',
    sourceOrderId: order.id,
    sourceOrderNo: order.orderNo,
    sourceCustomerRefId: `MREF-REAL-${index + 7}`,
    sourceLineId: `line-real-${index + 7}`,
    status: 'RELEASED',
    dueDate: `2026-07-${25 + index}`,
    released_at: `2026-07-24T08:0${index}:00.000Z`,
    qty: 10,
    items: [{
      id: `item-real-${index + 7}`,
      itemKey: `item-real-${index + 7}`,
      itemType: 'MODEL',
      productName: `Gercek Urun SOR-00000${index + 7}`,
      variantCode: `SVR-REAL-${index + 7}`,
      qty: 10
    }]
  }));
  const workOrders = demands.map((demand, index) => ({
    id: `wo-real-${index + 7}`,
    workOrderCode: `WO-REAL-${index + 7}`,
    sourceId: demand.id,
    demandId: demand.id,
    targetQty: 10
  }));
  const groupsByDemandId = new Map(demands.map((demand, index) => [demand.id, [{
    itemKey: demand.items[0].itemKey,
    itemCode: demand.items[0].variantCode,
    itemQty: 10,
    activeStations: [`Atolye-${index + 7}`]
  }]]));
  const entries = demands.map((demand) => ({
    demand,
    groups: groupsByDemandId.get(demand.id),
    statusMeta: { label: 'Uretimde', style: '', done: false, archived: false },
    sourceMeta: { type: 'SALES_ORDER', label: 'Satis Siparisi' }
  }));

  context.DB.data.data = {
    orders,
    planningDemands: demands,
    workOrders,
    workOrderTransactions: [],
    transactions: [{ id: 'txn-real-existing' }],
    stockDepotItems: [{ id: 'stock-real-existing', qty: 10 }],
    stock_movements: [],
    montageDispatchPlans: [],
    montageDispatchShipments: [],
    montageCompletionTransfers: []
  };
  PlanningModule.getDemands = () => demands;
  PlanningModule.getDemandItems = (row) => row.items;
  PlanningModule.getDemandQtyForDisplay = (row) => row.qty;
  PlanningModule.getDemandDisplayName = (row) => row.items[0].productName;
  PlanningModule.getDemandDisplayCode = (row) => row.items[0].variantCode;
  PlanningModule.getReleasedDemandItemGroups = (row) => groupsByDemandId.get(row.id) || [];
  PlanningModule.getLinkedWorkOrdersForDemand = (row) =>
    workOrders.filter((workOrder) => workOrder.demandId === row.id);
  PlanningModule.getReleasedWorkspaceData = () => ({
    visibleRows: entries,
    activeRows: entries,
    archiveRows: [],
    completionView: 'ACTIVE',
    sourceFilter: 'ALL',
    searchQuery: ''
  });
  PlanningModule.getReleasedDemandStatusMeta = () => ({ label: 'Uretimde', style: '', done: false, archived: false });
  PlanningModule.getReleasedDemandSourceMeta = () => ({ type: 'SALES_ORDER', label: 'Satis Siparisi' });
  PlanningModule.getReleasedRawMaterialSummaryFromGroups = () => ({});
  PlanningModule.getReleasedDemandUserStatusMeta = () => ({ label: 'Uretimde', style: '' });
  PlanningModule.getReleasedDemandRawMaterialUserMeta = () => ({ visible: false, label: '', style: '' });
  PlanningModule.resolvePlanningSalesVariationSummary = (demand) => ({
    productName: demand.items[0].productName,
    variationDisplayId: demand.items[0].variantCode,
    accessoryColor: 'Siyah',
    tubeColor: 'Siyah',
    plexiColor: 'Seffaf',
    bubble: 'yok',
    lowerTubeLength: '100 cm',
    canOpen: false
  });
  PlanningModule.renderSalesProductionQueueHeaderHtml = () => '<div data-real-production-queue-header="true"></div>';
  PlanningModule.renderReleasedSalesSanalTaksimHtml = () => '<div data-real-sanal-taksim="true"></div>';
  PlanningModule.buildReleasedDemandTrackingContentHtml = (demand) =>
    `<div data-real-product-row="${demand.sourceOrderNo}">${demand.items[0].productName}</div>`;

  return { PlanningModule, context, orders, demands };
}

function runRenderedReleasedOrderNavigation(harness, orderNo) {
  const { PlanningModule, context, orders, demands } = harness;
  const order = orders.find((row) => row.orderNo === orderNo);
  const demand = demands.find((row) => row.sourceOrderId === order.id);
  const before = JSON.stringify(context.DB.data.data);

  PlanningModule.openWorkspace('released-orders');
  const listHtml = PlanningModule.renderReleasedOrdersWorkspace();
  const escapedOrderId = order.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const detailMatch = listHtml.match(new RegExp(
    `onclick="(PlanningModule\\.openGroupDetailWorkspace\\('released-orders','sales:${escapedOrderId}','released-orders'\\))"`
  ));
  assert.ok(detailMatch, `${orderNo} gercek Detay Ac handleri render edilmedi.`);
  vm.runInContext(detailMatch[1], context);

  let detailHtml = PlanningModule.renderGroupDetailWorkspace();
  assert.match(detailHtml, new RegExp(orderNo));
  assert.match(detailHtml, new RegExp(demand.items[0].productName));
  const flowMatch = detailHtml.match(
    /onclick="(PlanningModule\.openReleasedDemandProductionStatusPage\('[^']+'\))">Sipariş Akışını Görüntüle<\/button>/
  );
  assert.ok(flowMatch, `${orderNo} gercek Siparis Akisini Goruntule handleri render edilmedi.`);
  assert.match(flowMatch[1], new RegExp(demand.id));
  vm.runInContext(flowMatch[1], context);

  const flowHtml = PlanningModule.renderGroupDetailWorkspace();
  assert.match(flowHtml, /planlama \/ sipariş akışı/);
  const backMatch = flowHtml.match(
    /<button class="btn-sm" data-released-production-status-back="true" onclick="([^"]+)">Geri<\/button>/
  );
  assert.ok(backMatch, `${orderNo} Siparis Akisi gercek Geri handleri render edilmedi.`);
  assert.equal(backMatch[1], 'PlanningModule.backFromGroupDetailWorkspace()');
  vm.runInContext(backMatch[1], context);

  assert.equal(PlanningModule.state.workspaceView, 'group-detail');
  assert.equal(PlanningModule.state.planningDetailScope, 'released-orders');
  assert.equal(PlanningModule.state.planningDetailGroupKey, `sales:${order.id}`);
  detailHtml = PlanningModule.renderGroupDetailWorkspace();
  assert.match(detailHtml, /planlama \/ is emrine donusenler - detay/);
  assert.match(detailHtml, new RegExp(orderNo));
  assert.match(detailHtml, new RegExp(demand.items[0].productName));
  assert.doesNotMatch(detailHtml, /Ana satir/);

  const detailBackMatch = detailHtml.match(
    /<button class="btn-sm"[^>]*onclick="(PlanningModule\.backFromGroupDetailWorkspace\(\))">Geri<\/button>/
  );
  assert.ok(detailBackMatch, `${orderNo} SOR detay Geri handleri render edilmedi.`);
  vm.runInContext(detailBackMatch[1], context);
  assert.equal(PlanningModule.state.workspaceView, 'released-orders');
  assert.match(PlanningModule.renderReleasedOrdersWorkspace(), /planlama \/ is emrine donusenler/);
  assert.equal(JSON.stringify(context.DB.data.data), before);
}

test('Gercek render zinciri SOR-000007 Siparis Akisi Geri handleriyle ayni SOR detayina doner', () => {
  runRenderedReleasedOrderNavigation(buildReleasedOrdersRealNavigationHarness(), 'SOR-000007');
});

test('Gercek render zinciri SOR-000008 Siparis Akisi Geri handleriyle ayni SOR detayina doner', () => {
  runRenderedReleasedOrderNavigation(buildReleasedOrdersRealNavigationHarness(), 'SOR-000008');
});

test('Siparis akisi montaj sekmesi SOR-000005 fiziksel asamalarini ve olay zincirini salt okunur gosterir', () => {
  const StockModule = {
    isMontageCompletionTransferReadyForShipment: () => true,
    getMontageDispatchPlanStatusLabel: () => 'Montaja Sevk Edildi',
    formatDateTimeLabel: (value) => String(value || ''),
    openMontageMovementHistoryRecord: () => {}
  };
  const { exported: PlanningModule, context } = loadModule('src/modules/planning-module.js', 'PlanningModule', { StockModule });
  const order = {
    id: 'order-5', orderNo: 'SOR-000005', lines: [{
      id: 'line-5', productId: 'product-5', variationId: 'variant-5', productName: 'Bombeli 2008 Aluminyum Dikme',
      variantCode: 'SVR-000001', productCode: 'SAL-000001', idCode: 'SAL-000001', qty: 5
    }]
  };
  const demand = {
    id: 'demand-5', demandCode: 'PLN-000007', sourceType: 'SALES_ORDER', sourceOrderId: order.id,
    sourceOrderNo: order.orderNo, sourceLineId: 'line-5', qty: 5
  };
  const lineRef = {
    sourceType: 'SALES_ORDER', sourceOrderId: order.id, sourceOrderNo: order.orderNo,
    sourceLineId: 'line-5', demandId: demand.id
  };
  context.DB.data.data.orders = [order];
  context.DB.data.data.planningDemands = [demand];
  context.DB.data.data.montageDispatchPlans = [{
    id: 'plan-8', planNo: 'MGP-000008', status: 'DISPATCHED_TO_MONTAGE', createdAt: '2026-07-16T12:52:05.364Z',
    items: [{ ...lineRef, plannedQty: 5 }], parts: [{ requiredQty: 40 }]
  }];
  context.DB.data.data.montageDispatchShipments = [{
    id: 'shipment-2', shipmentNo: 'MGS-000002', status: 'RECEIVED', targetUnitId: 'u3',
    dispatchedAt: '2026-07-16T13:01:57.460Z', receivedAt: '2026-07-16T13:03:16.742Z',
    items: [{ ...lineRef, shippedQty: 5 }], parts: [{ shippedQty: 40 }]
  }];
  context.DB.data.data.montageCompletionTransfers = [{
    id: 'transfer-5', transferNo: 'MCT-000005', status: 'POSTED', ...lineRef, qty: 5,
    recipeParts: [{ qtyPerSet: 8 }], pendingDepotReceiptAt: '2026-07-16T13:13:40.198Z',
    postedAt: '2026-07-16T13:15:15.177Z'
  }];
  PlanningModule.getDemands = () => context.DB.data.data.planningDemands;
  PlanningModule.getReleasedSalesMontageReadyRows = () => [{
    sourceOrderId: order.id, sourceLineId: 'line-5', readySetQty: 0, sendableCalculable: true,
    activePlanReservedQty: 0
  }];
  const before = JSON.stringify(context.DB.data.data);

  const model = PlanningModule.getReleasedSalesMontageFlowModel(demand);
  assert.equal(model.ok, true);
  assert.equal(model.orderQty, 5);
  assert.equal(model.summary.readyQty, 0);
  assert.equal(model.summary.transitQty, 0);
  assert.equal(model.summary.montageQty, 0);
  assert.equal(model.summary.shipmentReadyQty, 5);
  assert.equal(model.summaryPhysicalTotal, 5);
  assert.equal(model.balanced, true);
  assert.equal(model.rows.length, 1);
  assert.equal(model.rows[0].svrCode, 'SVR-000001');
  assert.equal(model.rows[0].salCode, 'SAL-000001');
  assert.deepEqual(Array.from(model.history, (row) => row.actionLabel), [
    'Montaj gönderim planı oluşturuldu',
    'Montaja sevk edildi',
    'Montaj teslim aldı',
    'Montaj tamamlandı',
    'Sevkiyat deposuna alındı'
  ]);
  assert.deepEqual(Array.from(model.history, (row) => row.recordNo), [
    'MGP-000008', 'MGS-000002', 'MGS-000002', 'MCT-000005', 'MCT-000005'
  ]);
  assert.deepEqual(Array.from(model.history, (row) => row.productQty), [5, 5, 5, 5, 5]);
  assert.deepEqual(Array.from(model.history, (row) => row.partQty), [40, 40, 40, 40, null]);

  const html = PlanningModule.renderReleasedSalesMontageFlowHtml(demand);
  assert.match(html, /data-sales-montage-flow="true"/);
  assert.match(html, /Bu bölüm, üretilen parçaların montaja hazırlanması, montaja sevk edilmesi, montajda teslim alınması ve tamamlanan ürünlerin sevkiyat deposuna alınmasına kadar olan süreci gösterir\./);
  assert.match(html, /Anlık Durum Özeti[\s\S]*Sipariş adedi[\s\S]*Montaja hazır[\s\S]*Montaja sevkte[\s\S]*Montajda[\s\S]*Sevkiyata hazır/);
  assert.match(html, /Bombeli 2008 Aluminyum Dikme[\s\S]*SVR-000001[\s\S]*SAL-000001/);
  assert.match(html, /MGP-000008[\s\S]*MGS-000002[\s\S]*MCT-000005/);
  assert.match(html, /openMontageMovementHistoryRecord\('MGP','plan-8'\)[^>]*>Görüntüle</);
  assert.match(html, /openMontageMovementHistoryRecord\('MGS','shipment-2'\)[^>]*>Parça Listesi</);
  assert.doesNotMatch(html, /Planlamayı Kaydet|Montaja Sevk Et|Teslim Al|Depoya Al/);
  assert.equal(JSON.stringify(context.DB.data.data), before);
});

test('Siparis akisi montaj modeli SAL ve SVR satirlarini birlestirmez, belirsiz hazir miktari uydurmaz', () => {
  const StockModule = { isMontageCompletionTransferReadyForShipment: () => true };
  const { exported: PlanningModule, context } = loadModule('src/modules/planning-module.js', 'PlanningModule', { StockModule });
  const order = {
    id: 'order-multi', orderNo: 'SOR-MULTI', lines: [
      { id: 'line-a', productName: 'Ürün A', variantCode: 'SVR-A', productCode: 'SAL-A', qty: 2 },
      { id: 'line-b', productName: 'Ürün B', variantCode: 'SVR-B', productCode: 'SAL-B', qty: 3 }
    ]
  };
  const demandA = { id: 'demand-a', sourceType: 'SALES_ORDER', sourceOrderId: order.id, sourceOrderNo: order.orderNo, sourceLineId: 'line-a' };
  const demandB = { id: 'demand-b', sourceType: 'SALES_ORDER', sourceOrderId: order.id, sourceOrderNo: order.orderNo, sourceLineId: 'line-b' };
  context.DB.data.data.orders = [order];
  context.DB.data.data.planningDemands = [demandA, demandB];
  context.DB.data.data.montageDispatchPlans = [];
  context.DB.data.data.montageDispatchShipments = [];
  context.DB.data.data.montageCompletionTransfers = [];
  PlanningModule.getDemands = () => context.DB.data.data.planningDemands;
  PlanningModule.getReleasedSalesMontageReadyRows = () => [{
    sourceOrderId: order.id, sourceLineId: 'line-a', readySetQty: 1, activePlanReservedQty: 1, sendableCalculable: true
  }];

  const model = PlanningModule.getReleasedSalesMontageFlowModel(demandA);
  assert.equal(model.rows.length, 2);
  assert.deepEqual(Array.from(model.rows, (row) => `${row.salCode}|${row.svrCode}`), ['SAL-A|SVR-A', 'SAL-B|SVR-B']);
  assert.equal(model.rows[0].readyQty, 2);
  assert.equal(model.rows[1].readyQty, null);
  assert.equal(model.summary.readyQty, null);
  const html = PlanningModule.renderReleasedSalesMontageFlowHtml(demandA);
  assert.match(html, /Ürün A[\s\S]*SVR-A[\s\S]*SAL-A[\s\S]*Ürün B[\s\S]*SVR-B[\s\S]*SAL-B/);
  assert.match(html, /Hesaplanamadı/);
});

test('Siparis akisi uretim sekmesi STORE kabulunu ana depo metniyle gosterir ve devam eden istasyonu korur', () => {
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule');
  const demand = {
    id: 'demand-flow-status-1', demandCode: 'PLN-000007', sourceType: 'SALES_ORDER',
    sourceOrderNo: 'SOR-000005', qty: 5
  };
  const storedGroup = {
    itemKey: 'item-flow-status-1', itemCode: 'SVR-000001', itemName: 'Ürün A', itemQty: 5, itemType: 'MODEL',
    totalRemainingQty: 0, totalStorageRemainingQty: 0, isFinished: true, isStored: true,
    activeStationLoads: [], activeStations: [],
    lines: [{
      workOrderCode: 'WO-000050', componentCode: 'PRC-000017', componentName: 'Parça A',
      targetQty: 5, doneQty: 5, storedQty: 5, remainingQty: 0, storageRemainingQty: 0,
      isFinished: true, isStored: true, currentStationName: 'Montajı bekliyor', depotLocationText: 'ANA DEPO',
      steps: [], stationLoads: [], rawMaterialStatus: { key: 'NONE' }
    }]
  };
  PlanningModule.getReleasedDemandItemGroups = () => [storedGroup];
  PlanningModule.getReleasedDemandStatusMeta = () => ({ label: 'Depoya alındı', style: '' });
  PlanningModule.getReleasedDemandSourceMeta = () => ({ label: 'Satış Siparişi', style: '' });
  PlanningModule.getReleasedDemandWorkOrderText = () => 'WO-000050';
  PlanningModule.getDemandDisplayName = () => 'Ürün A';
  PlanningModule.getDemandQtyForDisplay = () => 5;

  let html = PlanningModule.buildReleasedDemandTrackingContentHtml(demand, { variant: 'inline' });
  assert.match(html, /WO-000050[\s\S]*Mevcut Durum[\s\S]*Ana depoya alındı/);
  assert.match(html, /Mevcut: Ana depoya alındı/);
  assert.doesNotMatch(html, /Montajı bekliyor|Montaj bekliyor/);

  const activeGroup = {
    ...storedGroup,
    totalRemainingQty: 3,
    totalStorageRemainingQty: 5,
    isFinished: false,
    isStored: false,
    lines: [{
      ...storedGroup.lines[0],
      doneQty: 2,
      storedQty: 0,
      remainingQty: 3,
      storageRemainingQty: 5,
      isFinished: false,
      isStored: false,
      currentStationName: 'Kesim Atölyesi',
      depotLocationText: '',
      stationLoads: [{ stationId: 'u_kesim', stationName: 'Kesim Atölyesi', qty: 3 }]
    }]
  };
  PlanningModule.getReleasedDemandItemGroups = () => [activeGroup];
  html = PlanningModule.buildReleasedDemandTrackingContentHtml(demand, { variant: 'inline' });
  assert.match(html, /Mevcut: Kesim Atölyesi/);
  assert.doesNotMatch(html, /Mevcut: Ana depoya alındı/);
});

function buildDemoSalesOrderCompletionHarness() {
  const demoState = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const data = JSON.parse(JSON.stringify(demoState.data));
  const DB = { data: { data }, save: async () => ({ ok: true }) };
  const stockHarness = loadModule('src/modules/stock-module.js', 'StockModule', { DB });
  const { exported: StockModule } = stockHarness;
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', { DB, StockModule });
  stockHarness.context.PlanningModule = PlanningModule;
  const { exported: SalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', { DB, PlanningModule });
  const { exported: UnitModule, context: unitContext } = loadModule('src/modules/unit-module.js', 'UnitModule', {
    DB,
    StockModule,
    PlanningModule,
    UI: { renderCurrentPage: () => {} },
    Modal: { open: () => {}, close: () => {} },
    MontageLibraryModule: { previewRow: () => {} },
    ReadOnlyViewer: { openCardByRef: () => ({ ok: true }) },
    alert: () => {},
    window: { open: () => null },
    setTimeout: (fn) => fn()
  });
  stockHarness.context.UnitModule = UnitModule;
  return { data, StockModule, PlanningModule, SalesModule, UnitModule, stockContext: stockHarness.context, unitContext };
}

test('SOR-000006 ortak salt okunur kapanis hesabiyla satis ve planlama arsivine gecer, SOR-000005 aktif kalir', () => {
  const harness = buildDemoSalesOrderCompletionHarness();
  const { data, PlanningModule, SalesModule } = harness;
  const before = JSON.stringify(data);
  const sor6 = data.orders.find((order) => order.orderNo === 'SOR-000006');
  const sor5 = data.orders.find((order) => order.orderNo === 'SOR-000005');

  const sor6State = PlanningModule.getSalesOrderCompletionState(sor6);
  assert.equal(sor6State.ok, true);
  assert.equal(sor6State.completed, true);
  assert.deepEqual(Array.from(sor6State.lineStates, (line) => `${line.dispatchedQty}/${line.orderQty}`), ['5/5', '6/6']);
  assert.equal(sor6State.blockers.length, 0);
  assert.equal(sor6State.errors.length, 0);

  const sor5State = PlanningModule.getSalesOrderCompletionState(sor5);
  assert.equal(sor5State.ok, true);
  assert.equal(sor5State.completed, false);
  assert.deepEqual(Array.from(sor5State.lineStates, (line) => `${line.dispatchedQty}/${line.orderQty}`), ['4/5']);
  assert.ok(sor5State.blockers.some((blocker) => blocker.code === 'SHIPMENT_INCOMPLETE'));

  SalesModule.state.salesOrderHistoryFilters = { query: '', status: 'ALL', period: 'ALL' };
  SalesModule.state.salesWorkspaceTab = 'ORDERS';
  const activeSalesRows = SalesModule.getSalesWorkspaceRows();
  assert.equal(activeSalesRows.some((row) => row.orderNo === 'SOR-000006'), false);
  assert.equal(activeSalesRows.some((row) => row.orderNo === 'SOR-000005'), true);

  SalesModule.state.salesWorkspaceTab = 'ARCHIVE';
  const archiveSalesRows = SalesModule.getSalesWorkspaceRows();
  const archivedSor6 = archiveSalesRows.find((row) => row.orderNo === 'SOR-000006');
  assert.equal(archivedSor6?.status, 'Tamamlandı / Sevk Edildi');
  assert.equal(archivedSor6?.statusGroup, 'ARCHIVED');
  assert.equal(archiveSalesRows.some((row) => row.orderNo === 'SOR-000005'), false);
  assert.match(SalesModule.renderSalesWorkspaceOrderRowsHtml([archivedSor6]), /Tamamlandı \/ Sevk Edildi/);

  PlanningModule.state.releasedSourceFilter = 'SALES_ORDER';
  PlanningModule.state.releasedSearchQuery = '';
  PlanningModule.state.releasedCompletionView = 'ACTIVE';
  let workspace = PlanningModule.getReleasedWorkspaceData();
  let grouped = PlanningModule.getReleasedGroupedRows(workspace.visibleRows);
  assert.equal(grouped.some((group) => group.reference === 'SOR-000006'), false);
  assert.equal(grouped.find((group) => group.reference === 'SOR-000005')?.inProgressCount, 1);

  PlanningModule.state.releasedCompletionView = 'ARCHIVE';
  workspace = PlanningModule.getReleasedWorkspaceData();
  grouped = PlanningModule.getReleasedGroupedRows(workspace.visibleRows);
  const archivedPlanningSor6 = grouped.find((group) => group.reference === 'SOR-000006');
  assert.equal(archivedPlanningSor6?.inProgressCount, 0);
  assert.equal(archivedPlanningSor6?.doneCount, 2);
  assert.equal(grouped.some((group) => group.reference === 'SOR-000005'), false);

  PlanningModule.state.planningDetailScope = 'released-orders';
  PlanningModule.state.planningDetailGroupKey = archivedPlanningSor6.key;
  let detailHtml = PlanningModule.renderGroupDetailWorkspace();
  assert.equal(detailHtml.split('Tamamlandı / Sevk Edildi').length - 1, 2);
  assert.doesNotMatch(detailHtml, /data-released-raw-material-badge="true"|Hammadde alındı|Hammadde Gerekli/);

  PlanningModule.state.releasedCompletionView = 'ACTIVE';
  workspace = PlanningModule.getReleasedWorkspaceData();
  grouped = PlanningModule.getReleasedGroupedRows(workspace.visibleRows);
  const activePlanningSor5 = grouped.find((group) => group.reference === 'SOR-000005');
  const activeSor5Entry = activePlanningSor5.entries[0];
  const activeRawMaterialKeys = activeSor5Entry.groups
    .flatMap((itemGroup) => itemGroup.lines || [])
    .map((line) => String(line?.rawMaterialStatus?.key || '').toUpperCase());
  assert.ok(activeRawMaterialKeys.length > 0);
  assert.ok(activeRawMaterialKeys.every((key) => ['WAITING', 'ISSUED', 'NONE'].includes(key)));
  const activeUserStatus = PlanningModule.getReleasedDemandUserStatusMeta(
    activeSor5Entry.demand,
    activeSor5Entry.groups,
    PlanningModule.getReleasedRawMaterialSummaryFromGroups(activeSor5Entry.groups),
    activeSor5Entry.statusMeta
  );
  PlanningModule.state.planningDetailGroupKey = activePlanningSor5.key;
  detailHtml = PlanningModule.renderGroupDetailWorkspace();
  assert.ok(detailHtml.includes(activeUserStatus.label));
  assert.doesNotMatch(detailHtml, /data-released-raw-material-badge="true"|Hammadde alındı/);

  const originalGetReleasedDemandItemGroups = PlanningModule.getReleasedDemandItemGroups;
  PlanningModule.getReleasedDemandItemGroups = (demand) => originalGetReleasedDemandItemGroups(demand).map((itemGroup) => ({
    ...itemGroup,
    lines: (itemGroup.lines || []).map((line) => ({ ...line, rawMaterialStatus: { key: 'REQUIRED' } }))
  }));
  detailHtml = PlanningModule.renderGroupDetailWorkspace();
  assert.match(detailHtml, /data-released-raw-material-badge="true"[^>]*>Hammadde Gerekli</);
  assert.doesNotMatch(detailHtml, /Hammadde alındı|Hammadde kısmi hazır|Hammadde uygun değil|Hammadde bekliyor|Hammadde etütte/);
  PlanningModule.getReleasedDemandItemGroups = originalGetReleasedDemandItemGroups;

  const sor6Demand = data.planningDemands.find((demand) => demand.id === sor6State.lineStates[0].demandId);
  const trackingHtml = PlanningModule.buildReleasedDemandTrackingContentHtml(sor6Demand, { variant: 'inline' });
  assert.match(trackingHtml, /Tamamland/);
  assert.doesNotMatch(trackingHtml, /Depoda montaj bekliyor/i);

  assert.equal(sor6.status, 'Onaylandi');
  assert.ok(data.workOrders
    .filter((workOrder) => sor6State.lineStates.some((line) => line.demandId === workOrder.sourceId))
    .every((workOrder) => workOrder.status === 'OPEN'));
  assert.equal(JSON.stringify(data), before);
});

test('Tam sevk edilmiş siparişte doğrulanmış fazla WIP kapanışı engellemez ve atölye satırında kalır', () => {
  const harness = buildDemoSalesOrderCompletionHarness();
  const { data, PlanningModule, UnitModule } = harness;
  const order = data.orders.find((row) => row.orderNo === 'SOR-000006');
  const baseline = PlanningModule.getSalesOrderCompletionState(order);
  assert.equal(baseline.completed, true);
  const demand = data.planningDemands.find((row) => row.id === baseline.lineStates[0].demandId);
  const surplusWorkOrder = data.workOrders.find((row) => String(row?.sourceId || '') === String(demand.id || '')
    && Array.isArray(row?.lines) && row.lines.some((line) => Array.isArray(line?.routes) && line.routes.length));
  assert.ok(surplusWorkOrder);
  const surplusLine = surplusWorkOrder.lines[0];
  const requiredQty = Number(surplusLine.targetQty);
  const poolRows = demand.poolAnalysis.rows;
  const poolRow = poolRows.find((row) => String(row?.itemKey || '') === String(surplusWorkOrder.sourceItemKey || '')
    && String(row?.code || '').toUpperCase() === String(surplusLine.componentCode || '').toUpperCase());
  assert.ok(poolRow);
  poolRow.requiredQty = requiredQty;
  poolRow.netQty = requiredQty + 4;
  surplusWorkOrder.lotQty = requiredQty + 4;
  surplusLine.targetQty = requiredQty + 4;

  const state = PlanningModule.getSalesOrderCompletionState(order);
  assert.equal(state.ok, true);
  assert.equal(state.completed, true);
  assert.ok(state.lineStates.every((line) => line.dispatchedQty === line.orderQty));
  assert.ok(state.lineStates.some((line) => Number(line.verifiedSurplusOpenQty || 0) === 4));
  assert.notEqual(UnitModule.getWorkOrderComputedStatus(surplusWorkOrder, data.workOrderTransactions), 'DONE');
  const visibleAtWorkshop = (surplusWorkOrder.lines || []).some((line) => (line.routes || []).some((route) =>
    UnitModule.getWorkOrderPlanningRowsForUnit(route.stationId)
      .some((row) => String(row?.order?.id || '') === String(surplusWorkOrder.id || ''))
  ));
  assert.equal(visibleAtWorkshop, true);
  assert.equal(String(surplusWorkOrder.status || '').toUpperCase(), 'OPEN');
});

test('Ortak siparis kapanis hesabi aktif plan, montaj, operasyon ve kimlik celiskisinde fail-closed kalir', () => {
  const harness = buildDemoSalesOrderCompletionHarness();
  const { data, PlanningModule } = harness;
  const sor6 = data.orders.find((order) => order.orderNo === 'SOR-000006');
  const baseline = PlanningModule.getSalesOrderCompletionState(sor6);
  assert.equal(baseline.completed, true);

  data.salesShipmentPlans.push({ id: 'active-svp-test', planNo: 'SVP-TEST', status: 'PLANNED', sourceOrderId: sor6.id, items: [] });
  let state = PlanningModule.getSalesOrderCompletionState(sor6);
  assert.equal(state.completed, false);
  assert.ok(state.blockers.some((blocker) => blocker.code === 'SALES_SHIPMENT_PLAN_ACTIVE'));
  data.salesShipmentPlans.pop();

  const montagePlan = data.montageDispatchPlans.find((plan) => plan.planNo === 'MGP-000012');
  const montageStatus = montagePlan.status;
  montagePlan.status = 'DRAFT';
  state = PlanningModule.getSalesOrderCompletionState(sor6);
  assert.equal(state.completed, false);
  assert.ok(state.blockers.some((blocker) => blocker.code === 'MONTAGE_PLAN_ACTIVE'));
  montagePlan.status = montageStatus;

  const transfer = data.montageCompletionTransfers.find((row) => row.transferNo === 'MCT-000008');
  const transferStatus = transfer.status;
  transfer.status = 'PENDING_DEPOT_RECEIPT';
  state = PlanningModule.getSalesOrderCompletionState(sor6);
  assert.equal(state.completed, false);
  assert.ok(state.blockers.some((blocker) => blocker.code === 'MONTAGE_TRANSFER_PENDING'));
  transfer.status = transferStatus;

  const montageShipment = data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000004');
  const shippedQty = montageShipment.items[0].shippedQty;
  montageShipment.items[0].shippedQty = shippedQty - 1;
  state = PlanningModule.getSalesOrderCompletionState(sor6);
  assert.equal(state.completed, false);
  assert.ok(state.errors.some((error) => error.code === 'MONTAGE_SHIPMENT_QUANTITY_CONFLICT'));
  montageShipment.items[0].shippedQty = shippedQty;

  const sourceType = montagePlan.items[0].sourceType;
  montagePlan.items[0].sourceType = 'STOCK';
  state = PlanningModule.getSalesOrderCompletionState(sor6);
  assert.equal(state.completed, false);
  assert.ok(state.errors.some((error) => error.code === 'MONTAGE_SOURCE_TYPE_CONFLICT'));
  montagePlan.items[0].sourceType = sourceType;

  const demand = data.planningDemands.find((row) => row.sourceOrderNo === 'SOR-000006');
  const linkedWorkOrderId = demand.workOrderIds[0];
  const removedStoreTransactions = data.workOrderTransactions.filter((txn) => txn.workOrderId === linkedWorkOrderId && String(txn.type).toUpperCase() === 'STORE');
  data.workOrderTransactions = data.workOrderTransactions.filter((txn) => !removedStoreTransactions.includes(txn));
  state = PlanningModule.getSalesOrderCompletionState(sor6);
  assert.equal(state.completed, false);
  assert.ok(state.blockers.some((blocker) => blocker.code === 'PRODUCTION_OPERATION_OPEN'));
  data.workOrderTransactions.push(...removedStoreTransactions);

  const shipmentItem = data.salesShipments.find((shipment) => shipment.shipmentNo === 'TF-000005').snapshot.items[0];
  const sourceLineId = shipmentItem.sourceLineId;
  shipmentItem.sourceLineId = 'conflicting-line-id';
  state = PlanningModule.getSalesOrderCompletionState(sor6);
  assert.equal(state.completed, false);
  assert.ok(state.blockers.some((blocker) => blocker.code === 'SHIPMENT_INCOMPLETE'));
  shipmentItem.sourceLineId = sourceLineId;
  assert.equal(PlanningModule.getSalesOrderCompletionState(sor6).completed, true);
});

test('Montaj ve Sevkiyat Isleri ortak kapanis hesabiyla aktif ve arsiv ayrimini salt okunur yapar', () => {
  const harness = buildDemoSalesOrderCompletionHarness();
  const { data, StockModule, PlanningModule, stockContext } = harness;
  const before = JSON.stringify(data);

  const rows = StockModule.getMontageReadyPlanRows(StockModule.buildMontageReadyJobCards());
  const sor6Row = rows.find((row) => row.sorCodeText === 'SOR-000006');
  const sor5Row = rows.find((row) => row.sorCodeText === 'SOR-000005');
  assert.equal(sor6Row?.isArchived, true);
  assert.equal(sor5Row?.isArchived, false);
  assert.ok(rows.filter((row) => row.sourceTypeKey === 'STOCK').every((row) => row.isArchived === false));

  StockModule.state.montageShipmentTab = 'give';
  let html = StockModule.renderMontageReadyJobsLayout();
  assert.doesNotMatch(html, /SOR-000006/);
  assert.match(html, /SOR-000005/);
  assert.match(html, /data-montage-completion-tab="archive"/);

  StockModule.state.montageShipmentTab = 'archive';
  html = StockModule.renderMontageReadyJobsLayout();
  assert.match(html, /SOR-000006/);
  assert.doesNotMatch(html, /SOR-000005/);
  assert.match(html, /Tamamland/);

  StockModule.state.montageReadyDetailKey = sor6Row.key;
  StockModule.state.montageReadyDetailSendMode = true;
  StockModule.state.salesShipmentPlanningMode = true;
  const archivedDetailHtml = StockModule.renderMontageReadyJobDetailLayout();
  assert.match(archivedDetailHtml, /Tamamland/);
  assert.match(archivedDetailHtml, /Sipari[^<]*Ak[^<]*G[^<]*r[^<]*nt[^<]*le/);
  assert.doesNotMatch(archivedDetailHtml, /data-montage-detail-action-footer|data-montage-action-shell|data-shipment-action-shell|data-shipment-planning-save/);
  assert.doesNotMatch(archivedDetailHtml, />Montaja G[^<]*nder<|>Planlamay[^<]*Kaydet<|>Montajdan Teslim Al|>Sevkiyat Planlama|>Sevkiyat [^<]*lemleri/);

  StockModule.state.montageReadyDetailKey = sor5Row.key;
  StockModule.state.montageReadyDetailSendMode = false;
  StockModule.state.salesShipmentPlanningMode = false;
  const activeDetailHtml = StockModule.renderMontageReadyJobDetailLayout();
  assert.match(activeDetailHtml, /data-montage-action-shell="true"/);
  assert.match(activeDetailHtml, /data-shipment-action-shell="true"/);
  assert.match(activeDetailHtml, />Montaja G[^<]*nder</);
  assert.match(activeDetailHtml, />Sevkiyat Planlama/);

  stockContext.PlanningModule = undefined;
  let failClosedRows = StockModule.getMontageReadyPlanRows(StockModule.buildMontageReadyJobCards());
  assert.equal(failClosedRows.find((row) => row.sorCodeText === 'SOR-000006')?.isArchived, false);
  stockContext.PlanningModule = PlanningModule;

  const sor6Demands = data.planningDemands.filter((demand) => demand.sourceOrderNo === 'SOR-000006');
  const sourceOrderIds = sor6Demands.map((demand) => demand.sourceOrderId);
  sor6Demands.forEach((demand) => { demand.sourceOrderId = ''; });
  failClosedRows = StockModule.getMontageReadyPlanRows(StockModule.buildMontageReadyJobCards());
  assert.equal(failClosedRows.find((row) => row.sorCodeText === 'SOR-000006')?.isArchived, false);
  sor6Demands.forEach((demand, index) => { demand.sourceOrderId = sourceOrderIds[index]; });
  assert.equal(JSON.stringify(data), before);
});

test('Montaj Birimi SOR-000005 ve SOR-000006 kayitlarini musteri sevkiyatindan bagimsiz arsivler', () => {
  const harness = buildDemoSalesOrderCompletionHarness();
  const { data, UnitModule } = harness;
  const before = JSON.stringify(data);
  const rows = UnitModule.getMontageJobsReadonlyRows();
  const sor5Row = rows.find((row) => row.sorCodeText === 'SOR-000005');
  const sor6Row = rows.find((row) => row.sorCodeText === 'SOR-000006');
  assert.equal(rows.filter((row) => !row.isMontageArchived).length, 0);
  assert.equal(rows.filter((row) => row.isMontageArchived).length, 2);
  assert.equal(sor5Row?.montageCompletionState?.ok, true);
  assert.equal(sor5Row?.montageCompletionState?.completed, true);
  assert.equal(sor6Row?.montageCompletionState?.ok, true);
  assert.equal(sor6Row?.montageCompletionState?.completed, true);

  const container = { innerHTML: '' };
  UnitModule.state.montageJobsTab = 'active';
  UnitModule.state.montageJobsDetailKey = '';
  UnitModule.renderMontageJobsReadonly(container, 'u3');
  assert.match(container.innerHTML, /Aktif İşler \(0\)/);
  assert.match(container.innerHTML, /Montaj Arşivi \(2\)/);
  assert.doesNotMatch(container.innerHTML, /SOR-000005|SOR-000006/);

  UnitModule.state.montageJobsTab = 'archive';
  UnitModule.renderMontageJobsReadonly(container, 'u3');
  assert.match(container.innerHTML, /SOR-000005/);
  assert.match(container.innerHTML, /SOR-000006/);
  assert.match(container.innerHTML, /Montaj Tamamlandı \/ Sevkiyat Deposuna Teslim Edildi/);

  UnitModule.state.montageJobsDetailKey = sor6Row.key;
  UnitModule.renderMontageJobsReadonly(container, 'u3');
  assert.match(container.innerHTML, /data-montage-archive-detail="true"/);
  assert.match(container.innerHTML, /Montaj Tamamlandı \/ Sevkiyat Deposuna Teslim Edildi/);
  assert.match(container.innerHTML, /Parça Listesi/);
  assert.match(container.innerHTML, /Montaj Kartı/);
  assert.match(container.innerHTML, /Ürün Kartı/);
  assert.match(container.innerHTML, /Sipariş Akışını Görüntüle/);
  assert.match(container.innerHTML, /data-montage-archive-history="true"/);
  assert.match(container.innerHTML, /MGS-000003|MGS-000004/);
  assert.match(container.innerHTML, /MCT-000006|MCT-000007|MCT-000008/);
  assert.doesNotMatch(container.innerHTML, /receiveMontageIncomingShipment|postMontageCompletionForProductRow|data-montage-completion-controls|data-montage-completion-qty/);
  assert.doesNotMatch(container.innerHTML, />Teslim Al<|>Depoya Ver</);
  assert.equal(JSON.stringify(data), before);
});

test('Montaj Birimi acik veya celiskili modern zinciri fail-closed aktif listede tutar', () => {
  const harness = buildDemoSalesOrderCompletionHarness();
  const { data, UnitModule } = harness;
  const sor5 = data.orders.find((order) => order.orderNo === 'SOR-000005');
  const transfer = data.montageCompletionTransfers.find((row) => row.sourceOrderId === sor5.id);
  const shipment = data.montageDispatchShipments.find((row) => (row.items || []).some((item) => item.sourceOrderId === sor5.id));
  const plan = data.montageDispatchPlans.find((row) => (row.items || []).some((item) => item.sourceOrderId === sor5.id)
    && String(row.status).toUpperCase() !== 'CANCELLED');
  const getSor5Row = () => UnitModule.getMontageJobsReadonlyRows().find((row) => row.sorCodeText === 'SOR-000005');

  const originalTransferStatus = transfer.status;
  transfer.status = 'PENDING_DEPOT_RECEIPT';
  let row = getSor5Row();
  assert.equal(row.isMontageArchived, false);
  assert.equal(row.montageCompletionState.ok, true);
  assert.equal(row.montageCompletionState.completed, false);
  assert.ok(row.montageCompletionState.lineStates.some((line) => line.state.blockers.some((blocker) => blocker.code === 'DEPOT_RECEIPT_PENDING')));
  transfer.status = originalTransferStatus;

  const originalShipmentStatus = shipment.status;
  shipment.status = 'IN_TRANSIT';
  row = getSor5Row();
  assert.equal(row.isMontageArchived, false);
  assert.equal(row.montageCompletionState.completed, false);
  assert.ok(row.montageCompletionState.lineStates.some((line) => line.state.blockers.some((blocker) => blocker.code === 'SHIPMENT_IN_TRANSIT')));
  shipment.status = originalShipmentStatus;

  const transferIndex = data.montageCompletionTransfers.indexOf(transfer);
  data.montageCompletionTransfers.splice(transferIndex, 1);
  row = getSor5Row();
  assert.equal(row.isMontageArchived, false);
  assert.equal(row.montageCompletionState.completed, false);
  assert.ok(row.montageCompletionState.lineStates.some((line) => line.state.blockers.some((blocker) => blocker.code === 'MONTAGE_COMPLETION_OPEN')));
  data.montageCompletionTransfers.splice(transferIndex, 0, transfer);

  const originalVariantId = plan.items[0].variantId;
  plan.items[0].variantId = 'conflicting-variant-id';
  row = getSor5Row();
  assert.equal(row.isMontageArchived, false);
  assert.equal(row.montageCompletionState.ok, false);
  assert.ok(row.montageCompletionState.lineStates.some((line) => line.state.errors.some((error) => error.code === 'PLAN_ITEM_CONFLICT')));
  plan.items[0].variantId = originalVariantId;
  assert.equal(getSor5Row().isMontageArchived, true);

  const exactLegacyRow = {
    id: 'legacy-open-sor-5',
    dispatchKey: `${plan.items[0].demandId}::SALES_ORDER::${plan.items[0].variantCode}`,
    demandId: plan.items[0].demandId,
    sourceTypeKey: 'SALES_ORDER',
    variantCode: plan.items[0].variantCode,
    sentQty: 1,
    status: 'RECEIVED_IN_MONTAGE'
  };
  data.montageJobDispatches.push(exactLegacyRow);
  row = getSor5Row();
  assert.equal(row.isMontageArchived, false);
  assert.ok(row.montageCompletionState.lineStates.some((line) => line.state.blockers.some((blocker) => blocker.code === 'LEGACY_MONTAGE_OPERATION_OPEN')));
  data.montageJobDispatches.pop();
  data.montageJobDispatches.push({ ...exactLegacyRow, id: 'legacy-unrelated', demandId: 'other-demand', dispatchKey: `other-demand::SALES_ORDER::${plan.items[0].variantCode}` });
  assert.equal(getSor5Row().isMontageArchived, true);
});

test('Siparisten Gelen Talepler kesin PLN baglantisiyla aktif ve arsiv ayrimini salt okunur yapar', () => {
  const harness = buildDemoSalesOrderCompletionHarness();
  const { data, PlanningModule } = harness;
  const before = JSON.stringify(data);
  const rows = PlanningModule.getSalesDemandRows();
  const groups = PlanningModule.getSalesDemandGroupRows(rows);
  const activeGroups = groups.filter((group) => !group.isArchived);
  const archiveGroups = groups.filter((group) => group.isArchived);
  const sor5 = archiveGroups.find((group) => group.safeRef === 'SOR-000005');
  const sor6 = archiveGroups.find((group) => group.safeRef === 'SOR-000006');

  assert.equal(activeGroups.length, 0);
  assert.equal(archiveGroups.length, 3);
  assert.ok(archiveGroups.some((group) => group.safeRef === 'SOR-000007'));
  assert.deepEqual(Array.from(sor5.rows, (row) => row.planningDemandCode), ['PLN-000007']);
  assert.deepEqual(Array.from(sor6.rows, (row) => row.planningDemandCode).sort(), ['PLN-000008', 'PLN-000009']);
  assert.ok(sor5.rows.every((row) => row.planningTransferState.ok && row.planningTransferState.completed));
  assert.ok(sor6.rows.every((row) => row.planningTransferState.ok && row.planningTransferState.completed));

  const menuHtml = PlanningModule.renderMenuLayout();
  assert.match(menuHtml, /0 açık sipariş/);

  PlanningModule.state.salesDemandArchiveMode = false;
  let listHtml = PlanningModule.renderSalesDemandWorkspace();
  assert.match(listHtml, /Aktif Talepler \(0\)/);
  assert.match(listHtml, /Planlamaya Aktarılanlar \/ Arşiv \(3\)/);
  assert.doesNotMatch(listHtml, /SOR-000005|SOR-000006|SOR-000007/);

  PlanningModule.state.salesDemandArchiveMode = true;
  listHtml = PlanningModule.renderSalesDemandWorkspace();
  assert.match(listHtml, /SOR-000005/);
  assert.match(listHtml, /SOR-000006/);
  assert.match(listHtml, /SOR-000007/);

  PlanningModule.state.planningDetailScope = 'sales-demand';
  PlanningModule.state.planningDetailGroupKey = sor5.key;
  let detailHtml = PlanningModule.renderGroupDetailWorkspace();
  assert.match(detailHtml, /PLN-000007/);
  assert.doesNotMatch(detailHtml, /openSalesOrderBlockPlanningConfirm|sendSalesOrderLineToPlanningPool|Siparişi Planlamaya Gönder|Planlama Havuzuna Gönder/);

  PlanningModule.state.planningDetailGroupKey = sor6.key;
  detailHtml = PlanningModule.renderGroupDetailWorkspace();
  assert.match(detailHtml, /PLN-000008/);
  assert.match(detailHtml, /PLN-000009/);
  assert.doesNotMatch(detailHtml, /openSalesOrderBlockPlanningConfirm|sendSalesOrderLineToPlanningPool|Siparişi Planlamaya Gönder|Planlama Havuzuna Gönder/);
  assert.equal(JSON.stringify(data), before);
});

test('Siparisten Gelen Talepler iptal azaltma not sayfasini veri degistirmeden acar ve geri doner', () => {
  const harness = buildDemoSalesOrderCompletionHarness();
  const { data, PlanningModule } = harness;
  const before = JSON.stringify(data);
  const salesDemandHtml = PlanningModule.renderSalesDemandWorkspace();

  assert.match(salesDemandHtml, /İptal \/ Azaltma Yönetimi/);
  assert.match(salesDemandHtml, /openWorkspace\('cancel-reduction-management'\)/);

  PlanningModule.state.salesDemandArchiveMode = true;
  PlanningModule.openWorkspace('cancel-reduction-management');
  assert.equal(PlanningModule.state.workspaceView, 'cancel-reduction-management');
  assert.equal(PlanningModule.state.salesDemandArchiveMode, true);

  const container = { innerHTML: '' };
  PlanningModule.render(container);
  assert.match(container.innerHTML, /NOT – İptal \/ Azaltma Yönetimi/);
  assert.match(container.innerHTML, /Ortak PRC Üretim Havuzu ve sanal tahsis sistemi tamamlandıktan sonra geliştirilecektir/);
  assert.match(container.innerHTML, /İptal edilen, miktarı azaltılan veya ertelenen siparişlerin takibi/);
  assert.match(container.innerHTML, /Başlamamış ve üretimdeki miktarların ayrı değerlendirilmesi/);
  assert.match(container.innerHTML, /Üretimdeki PRC’ler için devam etme, yarı mamul depoya alma veya ortak havuza bırakma kararı/);
  assert.match(container.innerHTML, /SOR, WO ve transaction geçmişinin korunması/);
  assert.match(container.innerHTML, /Boşa çıkan sağlam miktarların ortak havuza dönmesi/);
  assert.match(container.innerHTML, /Sanal tahsislerin yeniden hesaplanması/);
  assert.match(container.innerHTML, /Bu ekran şu anda yalnız hatırlatma amaçlıdır\. Veri işlemi yapmaz\./);
  assert.match(container.innerHTML, /openWorkspace\('sales-demand'\)[^>]*>Geri<\/button>/);
  assert.doesNotMatch(container.innerHTML, /<input|<select|<textarea|DB\.save/);

  PlanningModule.openWorkspace('sales-demand');
  assert.equal(PlanningModule.state.workspaceView, 'sales-demand');
  assert.equal(PlanningModule.state.salesDemandArchiveMode, true);
  assert.equal(JSON.stringify(data), before);
});

test('Siparisten Gelen Talepler kismi aktarimi aktifte tutar ve kalan satir aksiyonunu korur', () => {
  const harness = buildDemoSalesOrderCompletionHarness();
  const { data, PlanningModule } = harness;
  const removedIndex = data.planningDemands.findIndex((demand) => demand.demandCode === 'PLN-000009');
  data.planningDemands.splice(removedIndex, 1);

  const groups = PlanningModule.getSalesDemandGroupRows(PlanningModule.getSalesDemandRows());
  const sor6 = groups.find((group) => group.safeRef === 'SOR-000006');
  assert.equal(sor6.isArchived, false);
  assert.equal(sor6.sentCount, 1);
  assert.equal(sor6.pendingCount, 1);
  const pendingRow = sor6.rows.find((row) => !row.alreadySent);
  assert.equal(pendingRow.planningTransferState.ok, true);
  assert.equal(pendingRow.canSend, true);

  PlanningModule.state.salesDemandArchiveMode = false;
  assert.match(PlanningModule.renderSalesDemandWorkspace(), /SOR-000006/);
  PlanningModule.state.salesDemandArchiveMode = true;
  assert.doesNotMatch(PlanningModule.renderSalesDemandWorkspace(), /SOR-000006/);

  PlanningModule.state.planningDetailScope = 'sales-demand';
  PlanningModule.state.planningDetailGroupKey = sor6.key;
  const detailHtml = PlanningModule.renderGroupDetailWorkspace();
  assert.match(detailHtml, /PLN-000008/);
  assert.match(detailHtml, new RegExp(`sendSalesOrderLineToPlanningPool\\('${pendingRow.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\'\\)`));
});

test('Siparisten Gelen Talepler mukerrer, iptal ve celiskili PLN baglantilarinda fail-closed kalir', () => {
  {
    const { data, PlanningModule } = buildDemoSalesOrderCompletionHarness();
    const original = data.planningDemands.find((demand) => demand.demandCode === 'PLN-000007');
    data.planningDemands.push({ ...original, id: 'duplicate-active-demand', demandCode: 'PLN-DUPLICATE' });
    const sor5 = PlanningModule.getSalesDemandGroupRows(PlanningModule.getSalesDemandRows())
      .find((group) => group.safeRef === 'SOR-000005');
    assert.equal(sor5.isArchived, false);
    assert.equal(sor5.ok, false);
    assert.equal(sor5.rows[0].planningTransferState.reason, 'DUPLICATE_ACTIVE_DEMAND');
    assert.equal(sor5.rows[0].canSend, false);
    assert.equal(PlanningModule.findDemandBySalesRow(sor5.rows[0]), null);
  }

  {
    const { data, PlanningModule } = buildDemoSalesOrderCompletionHarness();
    data.planningDemands.find((demand) => demand.demandCode === 'PLN-000007').status = 'CANCELLED';
    const sor5 = PlanningModule.getSalesDemandGroupRows(PlanningModule.getSalesDemandRows())
      .find((group) => group.safeRef === 'SOR-000005');
    assert.equal(sor5.isArchived, false);
    assert.equal(sor5.rows[0].planningTransferState.reason, 'CANCELLED_ONLY');
    assert.equal(sor5.rows[0].canSend, true);
    assert.equal(PlanningModule.findDemandBySalesRow(sor5.rows[0]), null);
  }

  {
    const { data, PlanningModule } = buildDemoSalesOrderCompletionHarness();
    data.planningDemands.find((demand) => demand.demandCode === 'PLN-000007').variantId = 'salesvar_conflicting-variant';
    const sor5 = PlanningModule.getSalesDemandGroupRows(PlanningModule.getSalesDemandRows())
      .find((group) => group.safeRef === 'SOR-000005');
    assert.equal(sor5.isArchived, false);
    assert.equal(sor5.ok, false);
    assert.equal(sor5.rows[0].planningTransferState.reason, 'DEMAND_IDENTITY_CONFLICT');
    assert.equal(sor5.rows[0].canSend, false);
    assert.equal(PlanningModule.findDemandBySalesRow(sor5.rows[0]), null);
  }
});

function buildPlanningPoolDistributionHarness({ requiredQty = 25, stockAvailableQty = 5, semiAvailableQty = 7 } = {}) {
  const alerts = [];
  const workOrderCalls = [];
  let saveCount = 0;
  let renderCount = 0;
  const demand = {
    id: 'distribution-demand-1',
    demandCode: 'PLN-DISTRIBUTION-1',
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'order-distribution-1',
    sourceLineId: 'line-distribution-1',
    status: 'OPEN',
    poolAnalysis: {
      planned_at: '2026-07-01T08:00:00.000Z',
      draft: true
    },
    qty: requiredQty,
    items: [{
      id: 'distribution-item-1',
      itemType: 'COMPONENT',
      componentId: 'distribution-component-1',
      componentCode: 'PRC-DISTRIBUTION-1',
      productName: 'Dağılım Parçası',
      qty: requiredQty
    }]
  };
  const baseRow = {
    key: 'distribution-row-1',
    itemKey: 'distribution-item-1',
    itemName: 'Dağılım Parçası',
    itemCode: 'PRC-DISTRIBUTION-1',
    itemQty: requiredQty,
    itemType: 'COMPONENT',
    code: 'PRC-DISTRIBUTION-1',
    name: 'Dağılım Parçası',
    sourceType: 'component',
    componentLibrary: 'PART',
    componentId: 'distribution-component-1',
    requiredQty,
    stockAvailableQty,
    semiAvailableQty,
    useEnabled: true,
    approved: false,
    useStockQty: 0,
    useSemiQty: 0,
    minNetQty: 0,
    netQty: 0
  };
  const data = {
    planningDemands: [demand],
    catalogProductVariants: [],
    partComponentCards: [{ id: 'distribution-component-1', code: 'PRC-DISTRIBUTION-1', unit: 'ADET' }],
    semiFinishedCards: [],
    montageCards: [],
    workOrders: [],
    workOrderTransactions: [],
    stockDepotItems: [],
    stock_movements: []
  };
  const UnitModule = {
    createWorkOrderFromComponentCard: (payload) => {
      workOrderCalls.push({ ...payload });
      return {
        id: `distribution-wo-${workOrderCalls.length}`,
        workOrderCode: `WO-DISTRIBUTION-${workOrderCalls.length}`,
        lotQty: payload.lotQty
      };
    }
  };
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: {
      data: { data },
      save: async () => {
        saveCount += 1;
        return { ok: true };
      }
    },
    UI: {
      renderCurrentPage: () => {
        renderCount += 1;
      }
    },
    UnitModule,
    alert: (message) => alerts.push(String(message))
  });

  PlanningModule.getPlanningPoolRows = () => {
    const savedRows = demand?.poolAnalysis?.draft === true && Array.isArray(demand?.poolAnalysis?.rows)
      ? demand.poolAnalysis.rows
      : null;
    return (savedRows || [baseRow]).map((row) => ({
      ...baseRow,
      ...row,
      stockAvailableQty: baseRow.stockAvailableQty,
      semiAvailableQty: baseRow.semiAvailableQty
    }));
  };
  PlanningModule.validatePoolRowsDepotConsumption = () => new Map();
  PlanningModule.consumePoolRowsFromDepot = () => {
    throw new Error('Bu testte stok tüketimi çağrılmamalıdır.');
  };

  return {
    PlanningModule,
    data,
    demand,
    baseRow,
    alerts,
    workOrderCalls,
    getSaveCount: () => saveCount,
    getRenderCount: () => renderCount
  };
}

test('Planlama Havuzu Bitmiş Ürün seçimini gereken ve güvenli stokla otomatik sınırlar', () => {
  const fullHarness = buildPlanningPoolDistributionHarness({ requiredQty: 10, stockAvailableQty: 30, semiAvailableQty: 0 });
  fullHarness.PlanningModule.setPlanningPoolDistributionQuickChoice(
    fullHarness.demand.id,
    fullHarness.baseRow.key,
    'useStockQty',
    true
  );
  let row = fullHarness.PlanningModule.getPlanningPoolDistributionRows(fullHarness.demand.id)[0];
  assert.equal(row.useStockQty, 10);
  assert.equal(row.useStockSelected, true);
  let html = fullHarness.PlanningModule.renderPlanningPoolDemandPlannerInline(fullHarness.demand);
  assert.match(html, /data-planning-auto-qty="stock"/);
  assert.doesNotMatch(html, /setPlanningPoolDistributionRowQty\([^\n]*useStockQty/);

  const partialHarness = buildPlanningPoolDistributionHarness({ requiredQty: 10, stockAvailableQty: 6, semiAvailableQty: 0 });
  partialHarness.PlanningModule.setPlanningPoolDistributionQuickChoice(
    partialHarness.demand.id,
    partialHarness.baseRow.key,
    'useStockQty',
    true
  );
  row = partialHarness.PlanningModule.getPlanningPoolDistributionRows(partialHarness.demand.id)[0];
  assert.equal(row.useStockQty, 6);
  assert.equal(partialHarness.PlanningModule.getPlanningPoolRowDistributionStatus(row).difference, 4);
  html = partialHarness.PlanningModule.renderPlanningPoolDemandPlannerInline(partialHarness.demand);
  assert.match(html, /Eksik 4/);
});

test('Planlama Havuzu otomatik kaynak önceliğini Bitmiş Ürün sonra Yarı Mamul olarak uygular', () => {
  const partialHarness = buildPlanningPoolDistributionHarness();
  partialHarness.PlanningModule.setPlanningPoolDistributionQuickChoice(
    partialHarness.demand.id,
    partialHarness.baseRow.key,
    'useStockQty',
    true
  );
  partialHarness.PlanningModule.setPlanningPoolDistributionQuickChoice(
    partialHarness.demand.id,
    partialHarness.baseRow.key,
    'useSemiQty',
    true
  );
  let row = partialHarness.PlanningModule.getPlanningPoolDistributionRows(partialHarness.demand.id)[0];
  assert.deepEqual(
    { stock: row.useStockQty, semi: row.useSemiQty },
    { stock: 5, semi: 7 }
  );

  const fullHarness = buildPlanningPoolDistributionHarness({ stockAvailableQty: 30, semiAvailableQty: 7 });
  fullHarness.PlanningModule.setPlanningPoolDistributionQuickChoice(
    fullHarness.demand.id,
    fullHarness.baseRow.key,
    'useStockQty',
    true
  );
  fullHarness.PlanningModule.setPlanningPoolDistributionQuickChoice(
    fullHarness.demand.id,
    fullHarness.baseRow.key,
    'useSemiQty',
    true
  );
  row = fullHarness.PlanningModule.getPlanningPoolDistributionRows(fullHarness.demand.id)[0];
  assert.deepEqual(
    { stock: row.useStockQty, semi: row.useSemiQty, semiSelected: row.useSemiSelected },
    { stock: 25, semi: 0, semiSelected: true }
  );
});

test('Planlama Havuzu Sıfırdan Üretim checkboxı minimumu doldurur, fazlayı kabul eder ve minimum altını reddeder', () => {
  const harness = buildPlanningPoolDistributionHarness({ requiredQty: 25, stockAvailableQty: 5, semiAvailableQty: 0 });
  const { PlanningModule, demand, baseRow } = harness;
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useStockQty', true);
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'netQty', true);
  let row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  assert.deepEqual(
    { stock: row.useStockQty, netSelected: row.useNetSelected, net: row.netQty },
    { stock: 5, netSelected: true, net: 20 }
  );
  let html = PlanningModule.renderPlanningPoolDemandPlannerInline(demand);
  assert.equal((html.match(/type="checkbox"/g) || []).length, 3);
  assert.match(html, /setPlanningPoolDistributionQuickChoice\([^\n]*netQty/);

  PlanningModule.setPlanningPoolDistributionRowQty(demand.id, baseRow.key, 'netQty', 19);
  row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  assert.equal(row.netQty, 20);
  assert.ok(harness.alerts.some((message) => message.includes('20 adetten az olamaz')));

  PlanningModule.setPlanningPoolDistributionRowQty(demand.id, baseRow.key, 'netQty', 25);
  assert.equal(PlanningModule.getPlanningPoolDistributionRows(demand.id)[0].netQty, 25);
  PlanningModule.setPlanningPoolDistributionRowQty(demand.id, baseRow.key, 'netQty', 30);
  assert.equal(PlanningModule.getPlanningPoolDistributionRows(demand.id)[0].netQty, 30);

  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'netQty', false);
  row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  assert.equal(row.netQty, 0);
  assert.equal(row.useNetSelected, false);
  assert.equal(PlanningModule.getPlanningPoolRowDistributionStatus(row).key, 'MISSING');
  html = PlanningModule.renderPlanningPoolDemandPlannerInline(demand);
  assert.match(html, /Eksik 20/);
});

test('Planlama Havuzu sıfır stok kaynaklarını pasifleştirir ve seçime kapatır', () => {
  const harness = buildPlanningPoolDistributionHarness({ requiredQty: 25, stockAvailableQty: 0, semiAvailableQty: 0 });
  const { PlanningModule, demand, baseRow } = harness;
  const html = PlanningModule.renderPlanningPoolDemandPlannerInline(demand);
  assert.match(html, /type="checkbox"[^>]*disabled[^>]*useStockQty/);
  assert.match(html, /type="checkbox"[^>]*disabled[^>]*useSemiQty/);

  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useStockQty', true);
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useSemiQty', true);
  const row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  assert.equal(row.useStockSelected, false);
  assert.equal(row.useSemiSelected, false);
  assert.equal(row.useStockQty, 0);
  assert.equal(row.useSemiQty, 0);
});

test('Planlama Havuzu kaynak değişiminde minimum neti günceller ve manuel fazla neti korur', () => {
  const harness = buildPlanningPoolDistributionHarness({ requiredQty: 25, stockAvailableQty: 10, semiAvailableQty: 7 });
  const { PlanningModule, demand, baseRow } = harness;
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useStockQty', true);
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useSemiQty', true);
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'netQty', true);
  let row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  assert.equal(row.netQty, 8);
  PlanningModule.setPlanningPoolDistributionRowQty(demand.id, baseRow.key, 'netQty', 17);

  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useSemiQty', false);
  row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  const allocation = PlanningModule.getPlanningPoolDistributionAllocation(row);
  assert.deepEqual(
    { stock: row.useStockQty, semi: row.useSemiQty, minimumNet: allocation.minimumNetQty, net: row.netQty },
    { stock: 10, semi: 0, minimumNet: 15, net: 17 }
  );
});

test('Planlama Havuzu checkbox kaldırmayı ve stok değişiminde otomatik yeniden hesabı korur', () => {
  const harness = buildPlanningPoolDistributionHarness();
  const { PlanningModule, demand, baseRow } = harness;
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useStockQty', true);
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useSemiQty', true);
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useStockQty', false);
  let row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  assert.deepEqual(
    { stock: row.useStockQty, semi: row.useSemiQty, stockSelected: row.useStockSelected, semiSelected: row.useSemiSelected },
    { stock: 0, semi: 7, stockSelected: false, semiSelected: true }
  );

  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useStockQty', true);
  baseRow.stockAvailableQty = 30;
  row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  assert.deepEqual(
    { stock: row.useStockQty, semi: row.useSemiQty },
    { stock: 25, semi: 0 }
  );
  PlanningModule.setPlanningPoolDistributionRowQty(demand.id, baseRow.key, 'useStockQty', 999);
  row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  assert.equal(row.useStockQty, 25);
});

test('Planlama Havuzu eksik toplamı engeller, fazla üretimi açar ve WO için yalnız netQty kullanır', async () => {
  {
    const harness = buildPlanningPoolDistributionHarness({ requiredQty: 10, stockAvailableQty: 6, semiAvailableQty: 0 });
    const { PlanningModule, demand, baseRow } = harness;
    PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useStockQty', true);
    await PlanningModule.savePlanningPoolDraft(demand.id, true);
    const result = await PlanningModule.releaseDemandFromPool(demand.id, { silent: true, skipRender: true });
    assert.equal(result.ok, false);
    assert.match(result.message, /Eksik dağılım/);
    assert.equal(harness.workOrderCalls.length, 0);
  }

  {
    const harness = buildPlanningPoolDistributionHarness({ requiredQty: 10, stockAvailableQty: 10, semiAvailableQty: 0 });
    const { PlanningModule, demand, baseRow } = harness;
    PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useStockQty', true);
    PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'netQty', true);
    PlanningModule.setPlanningPoolDistributionRowQty(demand.id, baseRow.key, 'netQty', 5);
    let row = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
    assert.equal(PlanningModule.getPlanningPoolRowDistributionStatus(row).key, 'OVER');
    assert.match(PlanningModule.renderPlanningPoolDemandPlannerInline(demand), /Fazla Üretim \+5/);
    await PlanningModule.savePlanningPoolDraft(demand.id, true);
    const result = await PlanningModule.releaseDemandFromPool(demand.id, { silent: true, skipRender: true });
    assert.equal(result.ok, true);
    assert.equal(harness.workOrderCalls.length, 1);
    assert.equal(harness.workOrderCalls[0].lotQty, 5);
  }
});

test('Planlama Havuzu 5 + 7 + 17 fazla üretim planını kaydedip yeniden açar ve yalnız 17 WO üretir', async () => {
  const harness = buildPlanningPoolDistributionHarness();
  const { PlanningModule, data, demand, baseRow } = harness;
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useStockQty', true);
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'useSemiQty', true);
  PlanningModule.setPlanningPoolDistributionQuickChoice(demand.id, baseRow.key, 'netQty', true);
  assert.equal(PlanningModule.getPlanningPoolDistributionRows(demand.id)[0].netQty, 13);
  PlanningModule.setPlanningPoolDistributionRowQty(demand.id, baseRow.key, 'netQty', 17);
  const operationalBefore = JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    workOrders: data.workOrders
  });

  await PlanningModule.savePlanningPoolDraft(demand.id, true);

  assert.equal(harness.getSaveCount(), 1);
  assert.equal(JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    workOrders: data.workOrders
  }), operationalBefore);
  const reopened = PlanningModule.getPlanningPoolDistributionRows(demand.id)[0];
  assert.deepEqual(
    {
      stockSelected: reopened.useStockSelected,
      semiSelected: reopened.useSemiSelected,
      netSelected: reopened.useNetSelected,
      stock: reopened.useStockQty,
      semi: reopened.useSemiQty,
      net: reopened.netQty
    },
    { stockSelected: true, semiSelected: true, netSelected: true, stock: 5, semi: 7, net: 17 }
  );
  assert.equal(PlanningModule.getPlanningPoolRowDistributionStatus(reopened).difference, 4);
  const result = await PlanningModule.releaseDemandFromPool(demand.id, { silent: true, skipRender: true });
  assert.equal(result.ok, true);
  assert.equal(harness.workOrderCalls.length, 1);
  assert.equal(harness.workOrderCalls[0].lotQty, 17);
});

test('Satış kapanış hesabı stokla karşılanan ihtiyaç üzerindeki net fazla WIP miktarını doğrular', () => {
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule');
  const demand = {
    id: 'surplus-distribution-demand',
    items: [{ id: 'surplus-distribution-item' }],
    workOrderIds: ['surplus-distribution-wo'],
    poolAnalysis: {
      rows: [{
        itemKey: 'surplus-distribution-item',
        componentId: 'surplus-distribution-component',
        code: 'PRC-SURPLUS-DISTRIBUTION',
        requiredQty: 10,
        useStockQty: 10,
        useSemiQty: 0,
        netQty: 5
      }]
    }
  };
  const workOrder = {
    id: 'surplus-distribution-wo',
    sourceId: demand.id,
    sourceItemKey: 'surplus-distribution-item',
    productCode: 'PRC-SURPLUS-DISTRIBUTION',
    lotQty: 5
  };
  const line = { componentCode: 'PRC-SURPLUS-DISTRIBUTION', targetQty: 5 };
  const result = PlanningModule.resolveVerifiedSalesSurplusOpenOperation(
    demand,
    workOrder,
    line,
    { finalStoredQty: 0 }
  );
  assert.equal(result.verified, true);
  assert.equal(result.surplusQty, 5);
  assert.equal(result.openQty, 5);
});

test('Planlama Havuzu mevcut tek kaynaklı dağılımları korur', () => {
  const netHarness = buildPlanningPoolDistributionHarness();
  netHarness.PlanningModule.setPlanningPoolDistributionQuickChoice(
    netHarness.demand.id,
    netHarness.baseRow.key,
    'netQty',
    true
  );
  netHarness.PlanningModule.setPlanningPoolDistributionRowQty(
    netHarness.demand.id,
    netHarness.baseRow.key,
    'netQty',
    25
  );
  let row = netHarness.PlanningModule.getPlanningPoolDistributionRows(netHarness.demand.id)[0];
  assert.deepEqual(
    { stock: row.useStockQty, semi: row.useSemiQty, net: row.netQty },
    { stock: 0, semi: 0, net: 25 }
  );

  const stockHarness = buildPlanningPoolDistributionHarness({ stockAvailableQty: 25, semiAvailableQty: 0 });
  stockHarness.PlanningModule.setPlanningPoolDistributionQuickChoice(
    stockHarness.demand.id,
    stockHarness.baseRow.key,
    'useStockQty',
    true
  );
  row = stockHarness.PlanningModule.getPlanningPoolDistributionRows(stockHarness.demand.id)[0];
  assert.deepEqual(
    { stock: row.useStockQty, semi: row.useSemiQty, net: row.netQty },
    { stock: 25, semi: 0, net: 0 }
  );
});

function buildPhase3VirtualPlanningHarness({ stockQty = 5 } = {}) {
  let saveCount = 0;
  const alerts = [];
  const workOrderCalls = [];
  const draftRowsByDemand = {};
  const data = {
    planningDemands: [],
    partComponentCards: [{
      id: 'phase3-prc-1',
      code: 'PRC-PHASE3-1',
      name: 'Faz 3 Parçası',
      unit: 'ADET'
    }],
    stockDepotItems: [{
      id: 'phase3-stock-row-1',
      refId: 'phase3-prc-1',
      productId: 'phase3-prc-1',
      productCode: 'PRC-PHASE3-1',
      code: 'PRC-PHASE3-1',
      productName: 'Faz 3 Parçası',
      quantity: stockQty,
      qty: stockQty,
      unit: 'ADET',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      allocationType: 'FREE',
      depotId: 'main',
      nodeKey: 'managed:main',
      locationId: 'phase3-main-location',
      created_at: '2026-07-01T08:00:00.000Z'
    }],
    stockDepotLocations: [{ id: 'phase3-main-location', depotId: 'main' }],
    workOrders: [],
    workOrderTransactions: [],
    stock_movements: [],
    orders: [],
    salesShipments: [],
    montageDispatchPlans: [],
    montageDispatchShipments: [],
    montageCompletionTransfers: [],
    catalogProductVariants: [],
    semiFinishedCards: [],
    montageCards: []
  };
  const UnitModule = {
    createWorkOrderFromComponentCard: (payload) => {
      workOrderCalls.push({ ...payload });
      const order = {
        id: `phase3-wo-${workOrderCalls.length}`,
        workOrderCode: `WO-PHASE3-${workOrderCalls.length}`,
        lotQty: payload.lotQty,
        sourceId: payload.sourceId,
        sourceItemKey: payload.sourceItemKey,
        lines: []
      };
      data.workOrders.push(order);
      return order;
    }
  };
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: {
      data: { data },
      save: async () => {
        saveCount += 1;
        return { ok: true };
      }
    },
    UI: { renderCurrentPage: () => {} },
    UnitModule,
    SanalTaksimResolver: loadSanalTaksimResolver(),
    alert: (message) => alerts.push(String(message)),
    confirm: () => true
  });
  const createDemand = ({ id, qty = 5, sourceType = 'SALES_ORDER', legacy = false } = {}) => {
    const demand = {
      id,
      demandCode: `PLN-${String(id || '').toUpperCase()}`,
      sourceType,
      status: 'OPEN',
      qty,
      dueDate: '2026-08-01',
      sourceOrderId: `${id}-order`,
      sourceLineId: `${id}-line`,
      items: [{
        id: `${id}-item`,
        itemType: 'COMPONENT',
        componentId: 'phase3-prc-1',
        componentCode: 'PRC-PHASE3-1',
        productName: 'Faz 3 Parçası',
        qty
      }],
      ...(legacy ? {
        poolAnalysis: {
          planned_at: '2026-06-01T08:00:00.000Z',
          draft: true,
          distributionMode: true,
          rows: []
        }
      } : {})
    };
    data.planningDemands.push(demand);
    return demand;
  };
  const createRow = (demand, {
    requiredQty = demand.qty,
    stock = 0,
    semi = 0,
    net = 0
  } = {}) => ({
    key: `${demand.id}-row`,
    itemKey: `${demand.id}-item`,
    itemName: 'Faz 3 Parçası',
    itemCode: 'PRC-PHASE3-1',
    itemQty: demand.qty,
    itemType: 'COMPONENT',
    code: 'PRC-PHASE3-1',
    name: 'Faz 3 Parçası',
    sourceType: 'component',
    componentLibrary: 'PART',
    componentId: 'phase3-prc-1',
    unit: 'ADET',
    requiredQty,
    stockAvailableQty: stockQty,
    semiAvailableQty: 0,
    physicalStockQty: stockQty,
    reliableFreeStockQty: stockQty,
    demandSourceType: demand.sourceType,
    safePlanningStockOnly: demand.sourceType === 'SALES_ORDER',
    useEnabled: true,
    approved: true,
    distributionMode: true,
    useStockSelected: stock > 0,
    useSemiSelected: semi > 0,
    useNetSelected: net > 0,
    useStockQty: stock,
    useSemiQty: semi,
    netQty: net,
    minNetQty: net
  });
  const setDraftRows = (demand, rows) => {
    draftRowsByDemand[demand.id] = rows.map((row) => ({ ...row }));
    if (demand?.poolAnalysis && Array.isArray(demand.poolAnalysis.rows)) {
      demand.poolAnalysis.rows = rows.map((row) => ({ ...row }));
    }
  };
  PlanningModule.getPlanningPoolRows = (demandId) => {
    const demand = data.planningDemands.find((row) => row.id === demandId);
    const savedRows = Array.isArray(demand?.poolAnalysis?.rows) && demand.poolAnalysis.rows.length
      ? demand.poolAnalysis.rows
      : draftRowsByDemand[demandId] || [];
    return savedRows.map((row) => ({ ...row }));
  };
  const getPlanningPoolDistributionRowsReal = PlanningModule.getPlanningPoolDistributionRows;
  PlanningModule.getPlanningPoolDistributionRows = (demandId) =>
    PlanningModule.getPlanningPoolRows(demandId);

  return {
    PlanningModule,
    data,
    alerts,
    workOrderCalls,
    createDemand,
    createRow,
    setDraftRows,
    getPlanningPoolDistributionRowsReal,
    getSaveCount: () => saveCount,
    getPhysicalQty: () => data.stockDepotItems.reduce((sum, row) =>
      sum + Number(row?.quantity ?? row?.qty ?? 0), 0)
  };
}

test('Faz 3 yeni FROM_STOCK planını VIRTUAL_V1 kaydeder ve fiziksel koleksiyonları değiştirmez', async () => {
  const harness = buildPhase3VirtualPlanningHarness({ stockQty: 5 });
  const demand = harness.createDemand({ id: 'phase3-new-stock', qty: 5 });
  harness.setDraftRows(demand, [harness.createRow(demand, { stock: 5 })]);
  const before = JSON.stringify({
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements,
    workOrderTransactions: harness.data.workOrderTransactions,
    montageDispatchPlans: harness.data.montageDispatchPlans,
    montageDispatchShipments: harness.data.montageDispatchShipments
  });

  await harness.PlanningModule.savePlanningPoolDraft(demand.id, true);

  assert.equal(demand.poolAnalysis.stockAccountingMode, 'VIRTUAL_V1');
  assert.equal(demand.poolAnalysis.rows[0].useStockQty, 5);
  assert.equal(demand.poolAnalysis.rows[0].unit, 'ADET');
  assert.equal(harness.getSaveCount(), 1);
  const ownAvailabilityAfterReload = harness.PlanningModule.getPlanningPoolDistributionVirtualAvailability(
    demand.id,
    harness.PlanningModule.getPlanningPoolRows(demand.id)[0],
    { currentRows: harness.PlanningModule.getPlanningPoolRows(demand.id) }
  );
  assert.equal(ownAvailabilityAfterReload.stockAvailableQty, 5);
  assert.equal(JSON.stringify({
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements,
    workOrderTransactions: harness.data.workOrderTransactions,
    montageDispatchPlans: harness.data.montageDispatchPlans,
    montageDispatchShipments: harness.data.montageDispatchShipments
  }), before);
});

test('Faz 3 planlama satırı başka VIRTUAL_V1 rezervinden sonra yalnız exact kalan miktarı gösterir', async () => {
  const harness = buildPhase3VirtualPlanningHarness({ stockQty: 10 });
  const first = harness.createDemand({ id: 'phase3-ui-first', qty: 5 });
  const second = harness.createDemand({ id: 'phase3-ui-second', qty: 10 });
  harness.setDraftRows(first, [harness.createRow(first, { stock: 5 })]);
  harness.setDraftRows(second, [harness.createRow(second, { stock: 5, net: 5 })]);
  await harness.PlanningModule.savePlanningPoolDraft(first.id, true);
  harness.PlanningModule.state.planningPoolDistributionDraftByDemand = {};
  harness.PlanningModule.state.planningPoolDistributionDraftByDemand[second.id] = {
    [`${second.id}-row`]: {
      useStockSelected: true,
      useSemiSelected: false,
      useNetSelected: true,
      useStockQty: 5,
      useSemiQty: 0,
      netQty: 5
    }
  };

  const original = harness.PlanningModule.getPlanningPoolDistributionRows;
  harness.PlanningModule.getPlanningPoolDistributionRows =
    harness.getPlanningPoolDistributionRowsReal;
  const row = harness.PlanningModule.getPlanningPoolDistributionRows(second.id)[0];
  harness.PlanningModule.getPlanningPoolDistributionRows = original;

  assert.equal(row.stockAvailableQty, 5);
  assert.equal(row.useStockQty, 5);
  assert.equal(row.netQty, 5);
});

test('Faz 3 ikinci SOR aynı exact fiziksel miktarı sanal olarak tekrar kullanamaz', async () => {
  const harness = buildPhase3VirtualPlanningHarness({ stockQty: 5 });
  const first = harness.createDemand({ id: 'phase3-first', qty: 5 });
  const second = harness.createDemand({ id: 'phase3-second', qty: 5 });
  harness.setDraftRows(first, [harness.createRow(first, { stock: 5 })]);
  harness.setDraftRows(second, [harness.createRow(second, { stock: 5 })]);
  await harness.PlanningModule.savePlanningPoolDraft(first.id, true);
  const saveCountAfterFirst = harness.getSaveCount();

  const secondAvailability = harness.PlanningModule.getPlanningPoolDistributionVirtualAvailability(
    second.id,
    harness.createRow(second, { stock: 5 }),
    { currentRows: harness.PlanningModule.getPlanningPoolRows(second.id) }
  );
  assert.equal(secondAvailability.stockAvailableQty, 0);

  await harness.PlanningModule.savePlanningPoolDraft(second.id, true);
  assert.equal(harness.getSaveCount(), saveCountAfterFirst);
  assert.equal(harness.PlanningModule.getPlanningPoolStockAccountingMode(second), '');
  assert.ok(harness.alerts.some((message) => message.includes('exact sanal stok kullanılamıyor')));
  assert.equal(harness.getPhysicalQty(), 5);
});

test('Faz 3 karma kaynakta yalnız netQty kadar WO üretir ve fiziksel stok düşürmez', async () => {
  const harness = buildPhase3VirtualPlanningHarness({ stockQty: 4 });
  const demand = harness.createDemand({ id: 'phase3-mixed', qty: 10 });
  harness.setDraftRows(demand, [harness.createRow(demand, { stock: 4, net: 6 })]);
  const physicalBefore = harness.getPhysicalQty();

  await harness.PlanningModule.savePlanningPoolDraft(demand.id, true);
  const result = await harness.PlanningModule.releaseDemandFromPool(
    demand.id,
    { silent: true, skipRender: true }
  );

  assert.equal(result.ok, true);
  assert.equal(harness.workOrderCalls.length, 1);
  assert.equal(harness.workOrderCalls[0].lotQty, 6);
  assert.equal(demand.poolAnalysis.stockAccountingMode, 'VIRTUAL_V1');
  assert.equal(harness.getPhysicalQty(), physicalBefore);
  assert.equal(harness.data.stock_movements.length, 0);
  assert.equal(harness.data.workOrderTransactions.length, 0);
});

test('Faz 3 exact FROM_SEMI kanıtı yoksa yeni planı fail-closed reddeder', async () => {
  const harness = buildPhase3VirtualPlanningHarness({ stockQty: 4 });
  const demand = harness.createDemand({ id: 'phase3-semi', qty: 10 });
  const row = harness.createRow(demand, { stock: 4, semi: 1, net: 5 });
  row.semiAvailableQty = 1;
  harness.setDraftRows(demand, [row]);

  await harness.PlanningModule.savePlanningPoolDraft(demand.id, true);

  assert.equal(harness.getSaveCount(), 0);
  assert.equal(harness.PlanningModule.getPlanningPoolStockAccountingMode(demand), '');
  assert.ok(harness.alerts.some((message) => message.includes('exact yarı mamul fiziksel kanıtı bulunamadı')));
  assert.equal(harness.getPhysicalQty(), 4);
});

test('Faz 3 saf stok SALES_ORDER talebini WO olmadan montage-only RELEASED yapar', async () => {
  const harness = buildPhase3VirtualPlanningHarness({ stockQty: 5 });
  const demand = harness.createDemand({ id: 'phase3-pure-stock', qty: 5 });
  harness.setDraftRows(demand, [harness.createRow(demand, { stock: 5 })]);
  await harness.PlanningModule.savePlanningPoolDraft(demand.id, true);
  const physicalBefore = harness.getPhysicalQty();

  const first = await harness.PlanningModule.releaseDemandFromPool(
    demand.id,
    { silent: true, skipRender: true }
  );
  const second = await harness.PlanningModule.releaseDemandFromPool(
    demand.id,
    { silent: true, skipRender: true }
  );

  assert.equal(first.ok, true);
  assert.equal(first.montageOnly, true);
  assert.equal(second.ok, false);
  assert.equal(demand.status, 'RELEASED');
  assert.equal(demand.releaseMode, 'MONTAGE_ONLY_NET0');
  assert.equal(demand.montageOnly, true);
  assert.equal(demand.poolAnalysis.stockAccountingMode, 'VIRTUAL_V1');
  assert.equal(harness.workOrderCalls.length, 0);
  assert.equal(harness.data.workOrders.length, 0);
  assert.equal(harness.getPhysicalQty(), physicalBefore);
});

test('Faz 3 VIRTUAL_V1 iptali fiziksel stok eklemez ve kapasiteyi bir kez serbest bırakır', async () => {
  const harness = buildPhase3VirtualPlanningHarness({ stockQty: 5 });
  const first = harness.createDemand({ id: 'phase3-cancel-first', qty: 5 });
  const second = harness.createDemand({ id: 'phase3-cancel-second', qty: 5 });
  harness.setDraftRows(first, [harness.createRow(first, { stock: 5 })]);
  harness.setDraftRows(second, [harness.createRow(second, { stock: 5 })]);
  await harness.PlanningModule.savePlanningPoolDraft(first.id, true);
  const physicalBefore = harness.getPhysicalQty();
  harness.PlanningModule.rollbackDemandPoolConsumption(first);
  assert.equal(harness.getPhysicalQty(), physicalBefore);

  first.status = 'CANCELLED';
  const afterCancel = harness.PlanningModule.getPlanningPoolDistributionVirtualAvailability(
    second.id,
    harness.createRow(second, { stock: 5 }),
    { currentRows: harness.PlanningModule.getPlanningPoolRows(second.id) }
  );
  const afterSecondCheck = harness.PlanningModule.getPlanningPoolDistributionVirtualAvailability(
    second.id,
    harness.createRow(second, { stock: 5 }),
    { currentRows: harness.PlanningModule.getPlanningPoolRows(second.id) }
  );
  assert.equal(afterCancel.stockAvailableQty, 5);
  assert.equal(afterSecondCheck.stockAvailableQty, 5);
  assert.equal(harness.getPhysicalQty(), physicalBefore);
});

test('Faz 3 legacy planı işaretlemez ve mevcut fiziksel consume rollback davranışını korur', async () => {
  const harness = buildPhase3VirtualPlanningHarness({ stockQty: 5 });
  const demand = harness.createDemand({ id: 'phase3-legacy', qty: 5, legacy: true });
  const legacyRow = harness.createRow(demand, { stock: 2, net: 3 });
  harness.setDraftRows(demand, [legacyRow]);
  const physicalBefore = harness.getPhysicalQty();

  const result = await harness.PlanningModule.releaseDemandFromPool(
    demand.id,
    { silent: true, skipRender: true }
  );

  assert.equal(result.ok, true);
  assert.equal(harness.PlanningModule.getPlanningPoolStockAccountingMode(demand), '');
  assert.equal(harness.workOrderCalls[0].lotQty, 3);
  assert.equal(harness.getPhysicalQty(), physicalBefore - 2);
  harness.PlanningModule.rollbackDemandPoolConsumption(demand);
  assert.equal(harness.getPhysicalQty(), physicalBefore);
});

test('Faz 3 stock predicate yalnız güvenilir VIRTUAL_V1 montage-only SALES_ORDER kaydını WO olmadan kabul eder', () => {
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: { data: { data: { workOrders: [] } } }
  });
  const valid = {
    sourceType: 'SALES_ORDER',
    status: 'RELEASED',
    released_at: '2026-07-28T08:00:00.000Z',
    montageOnly: true,
    releaseMode: 'MONTAGE_ONLY_NET0',
    workOrderIds: [],
    workOrderCodes: [],
    poolAnalysis: {
      stockAccountingMode: 'VIRTUAL_V1',
      rows: [{
        itemKey: 'phase3-item',
        componentId: 'phase3-prc',
        code: 'PRC-PHASE3',
        unit: 'ADET',
        requiredQty: 5,
        useStockQty: 5,
        useSemiQty: 0,
        netQty: 0
      }]
    }
  };
  const legacy = JSON.parse(JSON.stringify(valid));
  delete legacy.poolAnalysis.stockAccountingMode;
  const invalidSemi = JSON.parse(JSON.stringify(valid));
  invalidSemi.poolAnalysis.rows[0].useStockQty = 4;
  invalidSemi.poolAnalysis.rows[0].useSemiQty = 1;

  assert.equal(StockModule.isSalesDemandReleasedForMontageReady(valid), true);
  assert.equal(StockModule.isSalesDemandReleasedForMontageReady(legacy), false);
  assert.equal(StockModule.isSalesDemandReleasedForMontageReady(invalidSemi), false);
});

test('Ara duzeltme mevcut FAZ5-TEST-01 manuel stoklarini exact kanitla FREE_STOCK sayar', () => {
  const demoPath = path.join(__dirname, '..', 'demo_state.json');
  const beforeBuffer = fs.readFileSync(demoPath);
  const beforeHash = nodeCrypto.createHash('sha256').update(beforeBuffer).digest('hex');
  const raw = JSON.parse(beforeBuffer.toString('utf8'));
  const data = JSON.parse(JSON.stringify(raw.data || raw));
  const criticalBefore = JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchPlans: data.montageDispatchPlans,
    montageDispatchShipments: data.montageDispatchShipments
  });
  const DB = { data: { data }, save: async () => { throw new Error('Planlama salt okunur kalmali.'); } };
  const { exported: ProductLibraryModule } = loadModule(
    'src/modules/product-library-module.js',
    'ProductLibraryModule',
    { DB }
  );
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB,
    ProductLibraryModule,
    SanalTaksimResolver: loadSanalTaksimResolver()
  });
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB,
    ProductLibraryModule,
    SanalTaksimResolver: loadSanalTaksimResolver()
  });
  const locationId = 'd145ab0c-201a-452f-a558-d313d5c4f830';
  const expected = new Map([
    ['PRC-000017', 1],
    ['PRC-000001', 1],
    ['PRC-000024', 1],
    ['PRC-000014', 2],
    ['PRC-000021', 1],
    ['PRC-000005', 1],
    ['PRC-000007', 1]
  ]);
  const manualRows = data.stockDepotItems.filter((row) =>
    String(row?.locationId || '') === locationId
    && expected.has(String(row?.productCode || '').toUpperCase())
  );

  assert.equal(manualRows.length, 7);
  manualRows.forEach((row) => {
    const code = String(row.productCode || '').toUpperCase();
    assert.equal(Number(row.qty), expected.get(code));
    assert.equal(PlanningModule.getDepotRowExactManualFreeStockEvidence(row).ok, true);
    assert.equal(PlanningModule.getDepotRowPlanningSourceKind(row), 'FREE_STOCK');
    assert.equal(StockModule.getMontageStockExactManualFreeStockEvidence(row).ok, true);
    assert.equal(StockModule.getMontageStockPlanningSourceKind(row), 'FREE_STOCK');
  });
  assert.equal(
    PlanningModule.getDepotQuantityBreakdownByCode('PRC-000007', {
      demandSourceType: 'SALES_ORDER'
    }).reliableFreeQty,
    11
  );

  const demand = data.planningDemands.find((row) => row?.sourceOrderNo === 'SOR-000011');
  assert.ok(demand);
  const poolRows = PlanningModule.getPlanningPoolRows(demand.id);
  const stockByCode = new Map(poolRows.map((row) => [
    String(row?.code || '').toUpperCase(),
    Number(row?.stockAvailableQty || 0)
  ]));
  assert.equal(poolRows.length, 7);
  expected.forEach((qty, code) => {
    assert.equal(stockByCode.get(code), code === 'PRC-000007' ? 11 : qty);
  });

  const criticalAfter = JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchPlans: data.montageDispatchPlans,
    montageDispatchShipments: data.montageDispatchShipments
  });
  const afterHash = nodeCrypto.createHash('sha256').update(fs.readFileSync(demoPath)).digest('hex');
  assert.equal(criticalAfter, criticalBefore);
  assert.equal(afterHash, beforeHash);
});

test('Faz 5 manuel FREE_STOCK SOR-000011 MGP exact rezervlerini oluşturur ve DRAFT fiziksel veriyi değiştirmez', async () => {
  const demoPath = path.join(__dirname, '..', 'demo_state.json');
  const beforeHash = nodeCrypto.createHash('sha256').update(fs.readFileSync(demoPath)).digest('hex');
  const harness = buildMontagePhase2DemoHarness();
  const sor11 = harness.buildResult('SOR-000011');
  assert.ok(sor11.demand);
  assert.ok(sor11.planRow);
  assert.ok(sor11.detailRow);
  assert.equal(sor11.detailRow.resolverAvailability.allocatable, true);
  assert.equal(sor11.detailRow.resolverAvailability.readyQty, 1);

  const data = harness.data;
  const physicalBefore = JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchShipments: data.montageDispatchShipments,
    montageCompletionTransfers: data.montageCompletionTransfers,
    stockAllocations: data.stockAllocations
  });
  const planCountBefore = data.montageDispatchPlans.length;
  harness.StockModule.state.montageReadyDetailKey = sor11.planRow.key;
  harness.StockModule.state.montageReadyDetailSendSelected = { [sor11.detailRow.key]: true };
  harness.StockModule.state.montageReadyDetailSendQtyByRow = { [sor11.detailRow.key]: '1' };

  await harness.StockModule.validateMontageReadyDetailSendPlan();

  assert.equal(data.montageDispatchPlans.length, planCountBefore + 1);
  assert.equal(harness.saveCount, 1);
  const plan = data.montageDispatchPlans[data.montageDispatchPlans.length - 1];
  assert.equal(plan.status, 'DRAFT');
  assert.equal(plan.items.length, 1);
  assert.equal(plan.items[0].demandId, sor11.demand.id);
  assert.equal(plan.exactReservations.length, 7);
  assert.equal(plan.exactReservations.reduce((sum, row) => sum + Number(row.qty || 0), 0), 8);

  const expected = new Map([
    ['PRC-000017', { qty: 1, stockRowId: '011498d5-fa69-4e17-a991-3c666bf06fb6' }],
    ['PRC-000001', { qty: 1, stockRowId: 'b609b65b-c569-47fa-bfdf-fff11211f94a' }],
    ['PRC-000024', { qty: 1, stockRowId: '32a4207e-3ad4-4ae7-ad23-f2609a11a37b' }],
    ['PRC-000014', { qty: 2, stockRowId: 'd0f4c86f-2acb-49ad-91fb-59918dd641d0' }],
    ['PRC-000021', { qty: 1, stockRowId: '9aabedf2-f39b-41b6-9e5e-4175d9b5494f' }],
    ['PRC-000005', { qty: 1, stockRowId: '61202bce-9995-45ba-9f3b-f0ad4dcffebd' }],
    ['PRC-000007', { qty: 1, stockRowId: '49bf60b2-21cd-4b34-839c-621ed00c0342' }]
  ]);
  plan.exactReservations.forEach((reservation) => {
    const exact = expected.get(reservation.prcCode);
    assert.ok(exact);
    assert.equal(reservation.qty, exact.qty);
    assert.equal(reservation.stockRowId, exact.stockRowId);
    assert.equal(reservation.physicalSegmentId, `STOCK|${exact.stockRowId}`);
    assert.equal(reservation.sourceBucket, 'FROM_STOCK');
    assert.equal(reservation.demandId, sor11.demand.id);
    assert.equal(reservation.itemKey, plan.items[0].itemKey);
    assert.equal(reservation.planId, plan.id);
  });

  const exactRows = new Set(Array.from(expected.values(), (row) => row.stockRowId));
  const eligibleRows = new Set(expected.keys().flatMap((prcCode) =>
    harness.StockModule.getMontageDispatchEligibleStockRows(prcCode, plan.items[0])
      .map((row) => String(row?.id || ''))
  ));
  exactRows.forEach((stockRowId) => assert.equal(eligibleRows.has(stockRowId), true));
  const lockSnapshot = harness.StockModule.buildMontageExactPreflightSnapshot();
  const lockRequirements = harness.StockModule.buildMontagePreflightRequirements(
    plan.items,
    'plannedQty',
    lockSnapshot
  );
  assert.equal(lockRequirements.ok, true);
  const lockedUnscoped = new Set(
    harness.StockModule.getMontagePreflightLockedUnscopedSegmentKeys(
      lockRequirements.requirements,
      lockSnapshot
    )
  );
  assert.equal(lockedUnscoped.has('STOCK|7af58ada-9d46-4b81-83f8-162d67dee986'), true);
  assert.equal(lockedUnscoped.has('STOCK|0eb7a612-ecf2-4304-926c-eab932c0169d'), true);
  exactRows.forEach((stockRowId) => assert.equal(lockedUnscoped.has(`STOCK|${stockRowId}`), false));

  const blockedWithoutExclusion = harness.StockModule.runMontageExactAllocationPreflight({
    items: plan.items,
    qtyField: 'plannedQty',
    planId: 'duplicate-plan'
  });
  assert.equal(blockedWithoutExclusion.ok, false);
  const selfExcluded = harness.StockModule.runMontageExactAllocationPreflight({
    items: plan.items,
    qtyField: 'plannedQty',
    excludePlanId: plan.id,
    planId: 'replacement-plan'
  });
  assert.equal(selfExcluded.ok, true);
  assert.deepEqual(
    Array.from(selfExcluded.exactReservations, (row) => [row.prcCode, row.physicalSegmentId, row.qty]),
    Array.from(plan.exactReservations, (row) => [row.prcCode, row.physicalSegmentId, row.qty])
  );

  const resolverResult = loadSanalTaksimResolver().resolve(data);
  const sor9 = data.planningDemands.find((row) => row?.sourceOrderNo === 'SOR-000009');
  assert.ok(sor9);
  assert.equal(resolverResult.sourceEntitlements.some((row) =>
    row.demandId === sor9.id && row.prcCode === 'PRC-000001'
  ), false);
  const sor9Prc21 = resolverResult.sourceEntitlements.find((row) =>
    row.demandId === sor9.id && row.prcCode === 'PRC-000021'
  );
  assert.ok(sor9Prc21);
  assert.equal(sor9Prc21.sourceBucket, 'FROM_PRODUCTION');
  assert.equal(sor9Prc21.plannedQty, 5);

  const reservationBeforeRefresh = JSON.stringify(plan.exactReservations);
  harness.buildResult('SOR-000011');
  assert.equal(JSON.stringify(plan.exactReservations), reservationBeforeRefresh);
  assert.equal(JSON.stringify({
    stockDepotItems: data.stockDepotItems,
    stock_movements: data.stock_movements,
    workOrderTransactions: data.workOrderTransactions,
    montageDispatchShipments: data.montageDispatchShipments,
    montageCompletionTransfers: data.montageCompletionTransfers,
    stockAllocations: data.stockAllocations
  }), physicalBefore);
  const afterHash = nodeCrypto.createHash('sha256').update(fs.readFileSync(demoPath)).digest('hex');
  assert.equal(afterHash, beforeHash);
});

test('Ara duzeltme coklu manuel kanitta fail-closed UNKNOWN kalir', () => {
  const entry = {
    id: 'manual-entry-1',
    docNo: 'EK-TEST-000001',
    status: 'ISLENDI',
    productRefId: 'prc-manual-1',
    productId: 'prc-manual-1',
    productCode: 'PRC-MANUAL-1',
    unit: 'ADET',
    qty: 1,
    depotId: 'main',
    locationId: 'location-manual-1'
  };
  const row = {
    id: 'stock-manual-1',
    productId: 'prc-manual-1',
    productCode: 'PRC-MANUAL-1',
    code: 'PRC-MANUAL-1',
    unit: 'ADET',
    qty: 1,
    quantity: 1,
    depotId: 'main',
    nodeKey: 'managed:main',
    locationId: 'location-manual-1',
    stockClass: 'KULLANILABILIR',
    status: 'KULLANILABILIR',
    note: 'Envantere elle kayit / EK-TEST-000001'
  };
  const data = {
    partComponentCards: [{ id: 'prc-manual-1', code: 'PRC-MANUAL-1' }],
    stockDepotItems: [row],
    stockManualEntries: [entry, { ...entry, id: 'manual-entry-2' }],
    inventory: []
  };
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data }, save: async () => {} }
  });
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: { data: { data }, save: async () => {} }
  });

  const evidence = PlanningModule.getDepotRowExactManualFreeStockEvidence(row);
  assert.equal(evidence.ok, false);
  assert.equal(evidence.reasonCode, 'MANUAL_STOCK_EVIDENCE_AMBIGUOUS');
  assert.equal(PlanningModule.getDepotRowPlanningSourceKind(row), 'UNKNOWN');
  const montageEvidence = StockModule.getMontageStockExactManualFreeStockEvidence(row);
  assert.equal(montageEvidence.ok, false);
  assert.equal(montageEvidence.reasonCode, 'MANUAL_STOCK_EVIDENCE_AMBIGUOUS');
  assert.equal(StockModule.getMontageStockPlanningSourceKind(row), 'UNKNOWN');
  data.stockManualEntries = [];
  assert.equal(
    StockModule.getMontageStockExactManualFreeStockEvidence(row).reasonCode,
    'MANUAL_STOCK_EVIDENCE_NOT_FOUND'
  );
  assert.equal(StockModule.getMontageStockPlanningSourceKind(row), 'UNKNOWN');
  assert.equal(
    PlanningModule.getDepotQuantityBreakdownByCode('PRC-MANUAL-1', {
      demandSourceType: 'SALES_ORDER'
    }).usableQty,
    0
  );
});

test('Ara duzeltme yeni manuel stok satirina FREE ve exact refId yazar', () => {
  const data = {
    stockDepotItems: [],
    stock_movements: [],
    stockManualEntries: [],
    stockDepotLocations: [{
      id: 'location-new-manual',
      depotId: 'main',
      code: 'MANUAL-01'
    }]
  };
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: { data: { data }, save: async () => {} }
  });
  StockModule.getGoodsReceiptLocationOptions = () => [{
    id: 'location-new-manual',
    code: 'MANUAL-01'
  }];
  StockModule.getScopeNameById = () => 'ANA DEPO';
  StockModule.resolveNodeKeyFromScopeId = () => 'managed:main';
  StockModule.resolveScopeIdFromStockRow = (row) => String(row?.depotId || '');
  const record = StockModule.buildInventoryRegistrationRecordFromDraft({
    id: 'manual-record-new',
    docNo: 'EK-TEST-000010',
    entryDate: '2026-07-28T08:00:00.000Z',
    sourceKind: 'component',
    productRefId: 'prc-new-manual',
    productId: 'prc-new-manual',
    productCode: 'PRC-NEW-MANUAL',
    productName: 'Yeni Manuel Parca',
    productType: 'COMPONENT',
    unit: 'ADET',
    qty: 1,
    depotId: 'main',
    locationId: 'location-new-manual'
  });
  StockModule.applyInventoryRegistrationToStock(record);

  assert.equal(record.allocationType, 'FREE');
  assert.equal(record.refId, 'prc-new-manual');
  assert.equal(data.stockDepotItems.length, 1);
  assert.equal(data.stockDepotItems[0].allocationType, 'FREE');
  assert.equal(data.stockDepotItems[0].refId, 'prc-new-manual');
  assert.equal(data.stockDepotItems[0].productId, 'prc-new-manual');
  assert.equal(data.stockDepotItems[0].productCode, 'PRC-NEW-MANUAL');
  assert.equal(data.stockDepotItems[0].unit, 'ADET');
});

test('Ara duzeltme manuel FREE stogu farkli prcId unit veya SOR kaynagiyla birlestirmez', () => {
  const data = {
    stockDepotItems: [{
      id: 'different-prc',
      refId: 'prc-other',
      productId: 'prc-other',
      productCode: 'PRC-EXACT',
      code: 'PRC-EXACT',
      unit: 'ADET',
      qty: 4,
      quantity: 4,
      allocationType: 'FREE',
      depotId: 'main',
      locationId: 'location-exact',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR'
    }, {
      id: 'different-unit',
      refId: 'prc-exact',
      productId: 'prc-exact',
      productCode: 'PRC-EXACT',
      code: 'PRC-EXACT',
      unit: 'KG',
      qty: 5,
      quantity: 5,
      allocationType: 'FREE',
      depotId: 'main',
      locationId: 'location-exact',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR'
    }, {
      id: 'sales-owned',
      refId: 'prc-exact',
      productId: 'prc-exact',
      productCode: 'PRC-EXACT',
      code: 'PRC-EXACT',
      unit: 'ADET',
      qty: 6,
      quantity: 6,
      allocationType: 'FREE',
      sourceType: 'SALES_ORDER',
      sourceOrderId: 'order-owned',
      sourceLineId: 'line-owned',
      depotId: 'main',
      locationId: 'location-exact',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR'
    }],
    stock_movements: []
  };
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: { data: { data }, save: async () => {} }
  });
  StockModule.resolveScopeIdFromStockRow = (row) => String(row?.depotId || '');
  StockModule.resolveNodeKeyFromScopeId = () => 'managed:main';
  StockModule.getScopeNameById = () => 'ANA DEPO';
  const record = {
    id: 'manual-exact-record',
    docNo: 'EK-TEST-000020',
    refId: 'prc-exact',
    productRefId: 'prc-exact',
    productId: 'prc-exact',
    productCode: 'PRC-EXACT',
    productName: 'Exact Manuel Parca',
    productType: 'COMPONENT',
    allocationType: 'FREE',
    unit: 'ADET',
    qty: 1,
    depotId: 'main',
    locationId: 'location-exact',
    locationCode: 'EXACT-01'
  };

  StockModule.applyInventoryRegistrationToStock(record);
  assert.equal(data.stockDepotItems.length, 4);
  assert.equal(data.stockDepotItems.find((row) => row.id === 'different-prc').qty, 4);
  assert.equal(data.stockDepotItems.find((row) => row.id === 'different-unit').qty, 5);
  assert.equal(data.stockDepotItems.find((row) => row.id === 'sales-owned').qty, 6);
  const manualFree = data.stockDepotItems.find((row) => row.id === 'uuid-1');
  assert.ok(manualFree);
  assert.equal(manualFree.qty, 1);

  StockModule.applyInventoryRegistrationToStock(record);
  assert.equal(data.stockDepotItems.length, 4);
  assert.equal(manualFree.qty, 2);
});

function buildSalesDeliveryDateReallocationHarness(options = {}) {
  const Resolver = loadSanalTaksimResolver();
  const orders = [];
  const planningDemands = [];
  for (let index = 0; index < 5; index += 1) {
    const suffix = index + 1;
    const day = String(10 + index).padStart(2, '0');
    const orderId = `sor-date-${suffix}`;
    const lineId = `sor-date-line-${suffix}`;
    const demandId = `pln-date-${suffix}`;
    const itemId = `pln-date-item-${suffix}`;
    const deliveryDate = `2026-08-${day}`;
    orders.push({
      id: orderId,
      orderNo: `SOR-DATE-${suffix}`,
      orderType: 'PROFORMA',
      orderDate: '2026-07-01',
      customerId: 'customer-date',
      customerName: 'Termin Test Müşterisi',
      status: 'Onaylandı',
      currency: 'TL',
      exchangeRate: 0,
      preparedBy: 'Termin Testi',
      globalDiscountRate: 0,
      vatRate: 20,
      deliveryLeadDays: 0,
      deliveryDate,
      deliveryAddress: 'Test adresi',
      paymentMethod: 'Nakit',
      deliveryMethod: 'Nakit',
      note: '',
      manualNote: '',
      revisionNo: 1,
      revisionHistory: [{ version: 'v1', editor: 'Termin Testi', at: '2026-07-01T08:00:00.000Z' }],
      created_at: '2026-07-01T08:00:00.000Z',
      updated_at: '2026-07-01T08:00:00.000Z',
      lines: [{
        id: lineId,
        productId: 'sales-product-date',
        variationId: 'sales-variation-date',
        variantCode: 'SVR-DATE',
        productName: 'Termin Test Ürünü',
        productCode: 'SAL-DATE',
        unit: 'adet',
        quantityUnit: 'adet',
        qty: 1,
        unitPrice: 100
      }]
    });
    planningDemands.push({
      id: demandId,
      demandCode: `PLN-DATE-${suffix}`,
      sourceType: 'SALES_ORDER',
      sourceOrderId: orderId,
      sourceOrderNo: `SOR-DATE-${suffix}`,
      sourceLineId: lineId,
      status: 'RELEASED',
      released_at: `2026-07-${String(10 + index).padStart(2, '0')}T08:00:00.000Z`,
      dueDate: deliveryDate,
      updated_at: '2026-07-01T08:00:00.000Z',
      items: [{ id: itemId, qty: 1, variantCode: 'SVR-DATE' }],
      poolAnalysis: {
        stockAccountingMode: 'VIRTUAL_V1',
        rows: [buildSourceAwarePoolRow({
          itemKey: itemId,
          prcId: 'prc-date',
          prcCode: 'PRC-DATE',
          itemQty: 1,
          requiredQty: 1,
          stockQty: 1
        })]
      }
    });
  }
  const data = {
    customers: [{
      id: 'customer-date',
      name: 'Termin Test Müşterisi',
      externalCode: 'M-TERMİN',
      address: 'Test adresi',
      preferredCurrency: 'TL',
      defaultPaymentMethod: 'Nakit'
    }],
    personnel: [],
    salesCatalogProducts: [],
    salesAnchorageProducts: [],
    salesSettings: { priceLists: [], paymentMethods: ['Nakit'] },
    partComponentCards: [{ id: 'prc-date', code: 'PRC-DATE', unit: 'ADET' }],
    orders,
    planningDemands,
    workOrders: [],
    workOrderTransactions: [],
    stockDepotItems: [],
    stock_movements: [],
    montageDispatchPlans: [],
    montageDispatchShipments: [],
    montageCompletionTransfers: [],
    salesShipmentPlans: [],
    salesShipments: []
  };
  const alerts = [];
  const modal = { title: '', html: '', options: null, openCount: 0, closeCount: 0 };
  let saveCount = 0;
  let renderCount = 0;
  let saveDeferredResolve = null;
  const DB = {
    data: { meta: { activeUserName: 'Termin Testi' }, data },
    save: async () => {
      saveCount += 1;
      if (options.deferSave) return await new Promise((resolve) => { saveDeferredResolve = resolve; });
      if (options.saveThrows) throw new Error('test_save_exception');
      if (options.saveOkFalse) return { ok: false, code: 'test_save_rejected' };
      return { ok: true };
    }
  };
  const Modal = {
    open: (title, html, modalOptions) => {
      modal.title = String(title || '');
      modal.html = String(html || '');
      modal.options = modalOptions || null;
      modal.openCount += 1;
    },
    close: () => { modal.closeCount += 1; }
  };
  const { exported: SalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', {
    DB,
    SanalTaksimResolver: Resolver,
    Modal,
    UI: { renderCurrentPage: () => { renderCount += 1; } },
    alert: (message) => alerts.push(String(message))
  });
  SalesModule.ensureData();
  SalesModule.buildSalesOrderLinePayloads = (lines) => JSON.parse(JSON.stringify(lines));
  SalesModule.composeSalesOrderNoteWithAnchorageOverrides = (draft) => String(draft?.manualNote || draft?.note || '');
  const targetIndex = Number.isInteger(options.targetIndex) ? options.targetIndex : 4;
  const targetOrder = data.orders[targetIndex];
  SalesModule.state.salesOrderDraft = {
    ...JSON.parse(JSON.stringify(targetOrder)),
    editingOrderId: targetOrder.id,
    deliveryDate: String(options.nextDeliveryDate || '2026-08-20')
  };
  SalesModule.state.salesOrderEditorModalOpen = true;
  return {
    SalesModule,
    Resolver,
    data,
    alerts,
    modal,
    targetOrderId: targetOrder.id,
    targetDemandId: planningDemands[targetIndex].id,
    getSaveCount: () => saveCount,
    getRenderCount: () => renderCount,
    resolveDeferredSave: (value = { ok: true }) => saveDeferredResolve?.(value)
  };
}

test('Faz A.1 RELEASED olmayan ve ayni tarihli SOR kaydinda uyari veya PLN yazimi yapmaz', async () => {
  {
    const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-20' });
    const demand = harness.data.planningDemands.find((row) => row.id === harness.targetDemandId);
    demand.status = 'OPEN';
    delete demand.released_at;
    const dueBefore = demand.dueDate;
    await harness.SalesModule.saveSalesOrderDraft();
    assert.equal(harness.modal.openCount, 0);
    assert.equal(harness.getSaveCount(), 1);
    assert.equal(demand.dueDate, dueBefore);
  }
  {
    const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-14' });
    const demand = harness.data.planningDemands.find((row) => row.id === harness.targetDemandId);
    const before = JSON.stringify(demand);
    harness.SalesModule.state.salesOrderDraft.note = 'Tarih dışı revizyon';
    harness.SalesModule.state.salesOrderDraft.manualNote = 'Tarih dışı revizyon';
    await harness.SalesModule.saveSalesOrderDraft();
    assert.equal(harness.modal.openCount, 0);
    assert.equal(harness.getSaveCount(), 1);
    assert.equal(JSON.stringify(demand), before);
  }
});

test('Faz A.1 sira degismeyen termin revizyonunu tek save ile SOR ve exact RELEASED PLN uzerinde uygular', async () => {
  const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-20' });
  const physicalBefore = JSON.stringify({
    workOrders: harness.data.workOrders,
    workOrderTransactions: harness.data.workOrderTransactions,
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements,
    montageDispatchPlans: harness.data.montageDispatchPlans,
    montageDispatchShipments: harness.data.montageDispatchShipments,
    montageCompletionTransfers: harness.data.montageCompletionTransfers
  });
  await harness.SalesModule.saveSalesOrderDraft();
  const savedOrder = harness.data.orders.find((row) => row.id === harness.targetOrderId);
  const savedDemand = harness.data.planningDemands.find((row) => row.id === harness.targetDemandId);
  assert.equal(harness.modal.openCount, 0);
  assert.equal(harness.getSaveCount(), 1);
  assert.equal(savedOrder.deliveryDate, '2026-08-20');
  assert.equal(savedDemand.dueDate, '2026-08-20');
  assert.equal(savedOrder.revisionNo, 2);
  assert.equal(savedOrder.revisionHistory.length, 2);
  const result = harness.Resolver.resolve(harness.data);
  const targetDebts = result.debts.filter((row) => row.originOrderId === harness.targetOrderId);
  assert.equal(targetDebts.some((row) => row.reasonCodes.includes('SOR_DUE_DATE_CONFLICT')), false);
  assert.equal(JSON.stringify({
    workOrders: harness.data.workOrders,
    workOrderTransactions: harness.data.workOrderTransactions,
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements,
    montageDispatchPlans: harness.data.montageDispatchPlans,
    montageDispatchShipments: harness.data.montageDispatchShipments,
    montageCompletionTransfers: harness.data.montageCompletionTransfers
  }), physicalBefore);
});

test('Faz A.1 besinci siradan birinciye geciste uyari acar; vazgec sifir mutasyon ve sifir save birakir', async () => {
  const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-01' });
  const before = JSON.stringify(harness.data);
  await harness.SalesModule.saveSalesOrderDraft();
  assert.equal(harness.modal.openCount, 1);
  assert.equal(harness.modal.title, 'Sipariş Önceliği Değişecek');
  assert.match(harness.modal.html, /Teslim tarihindeki bu değişiklik, siparişin üretim önceliğini değiştirecektir\./);
  assert.match(harness.modal.html, /Kaydet ve Yeniden Hesapla/);
  assert.equal(harness.getSaveCount(), 0);
  assert.equal(JSON.stringify(harness.data), before);
  harness.SalesModule.cancelSalesOrderDeliveryDatePriorityConfirm();
  assert.equal(harness.getSaveCount(), 0);
  assert.equal(JSON.stringify(harness.data), before);
});

test('Faz A.1 onay aninda preflighti yeniler ve exact SOR-PLN terminlerini tek save ile kaydeder', async () => {
  const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-01' });
  await harness.SalesModule.saveSalesOrderDraft();
  assert.equal(harness.getSaveCount(), 0);
  await harness.SalesModule.confirmSalesOrderDeliveryDatePriorityChange();
  const order = harness.data.orders.find((row) => row.id === harness.targetOrderId);
  const demand = harness.data.planningDemands.find((row) => row.id === harness.targetDemandId);
  assert.equal(harness.getSaveCount(), 1);
  assert.equal(order.deliveryDate, '2026-08-01');
  assert.equal(demand.dueDate, '2026-08-01');
  assert.equal(order.revisionNo, 2);
  assert.equal(harness.Resolver.resolve(harness.data).debts
    .filter((row) => row.originOrderId === harness.targetOrderId)
    .some((row) => row.reasonCodes.includes('SOR_DUE_DATE_CONFLICT')), false);
});

test('Faz A.1 legacy manualOrderi korur ancak termin sirasini ve duplicate kararini etkilemez; bozuk audit fail-closed kalir', async () => {
  {
    const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-01' });
    harness.data.orders[4].productionQueue = { manualOrder: 1, updatedAt: '2026-07-24T08:00:00.000Z', updatedBy: 'Termin Testi' };
    await harness.SalesModule.saveSalesOrderDraft();
    assert.equal(harness.modal.openCount, 1);
    assert.equal(harness.getSaveCount(), 0);
    await harness.SalesModule.confirmSalesOrderDeliveryDatePriorityChange();
    const saved = harness.data.orders.find((row) => row.id === harness.targetOrderId);
    assert.equal(harness.getSaveCount(), 1);
    assert.equal(saved.productionQueue.manualOrder, 1);
  }
  {
    const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-20' });
    harness.data.orders[4].productionQueue = { manualOrder: 1, updatedAt: '', updatedBy: '' };
    const before = JSON.stringify(harness.data);
    await harness.SalesModule.saveSalesOrderDraft();
    assert.equal(harness.getSaveCount(), 0);
    assert.equal(JSON.stringify(harness.data), before);
    assert.match(harness.alerts.at(-1), /SOR_MANUAL_AUDIT_INVALID/);
  }
  {
    const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-20' });
    [harness.data.orders[3], harness.data.orders[4]].forEach((order) => {
      order.productionQueue = { manualOrder: 1, updatedAt: '2026-07-24T08:00:00.000Z', updatedBy: 'Termin Testi' };
    });
    const before = JSON.stringify(harness.data);
    await harness.SalesModule.saveSalesOrderDraft();
    assert.equal(harness.getSaveCount(), 1);
    assert.notEqual(JSON.stringify(harness.data), before);
    assert.equal(harness.data.orders[3].productionQueue.manualOrder, 1);
    assert.equal(harness.data.orders[4].productionQueue.manualOrder, 1);
    assert.equal(harness.alerts.some((message) => /SOR_MANUAL_ORDER_DUPLICATE/.test(message)), false);
  }
});

test('Faz A.1 eksik mukerrer orphan ve legacy PLN zincirlerini veri yazmadan reddeder', async () => {
  const mutateCases = [
    (harness) => {
      const order = harness.data.orders.find((row) => row.id === harness.targetOrderId);
      order.lines.push({ ...JSON.parse(JSON.stringify(order.lines[0])), id: 'sor-date-line-missing-pln' });
      harness.SalesModule.state.salesOrderDraft.lines.push({
        ...JSON.parse(JSON.stringify(harness.SalesModule.state.salesOrderDraft.lines[0])),
        id: 'sor-date-line-missing-pln'
      });
    },
    (harness) => {
      const demand = harness.data.planningDemands.find((row) => row.id === harness.targetDemandId);
      harness.data.planningDemands.push({ ...JSON.parse(JSON.stringify(demand)), id: 'pln-date-duplicate' });
    },
    (harness) => {
      const demand = harness.data.planningDemands.find((row) => row.id === harness.targetDemandId);
      harness.data.planningDemands.push({ ...JSON.parse(JSON.stringify(demand)), id: 'pln-date-orphan', sourceLineId: 'missing-line' });
    },
    (harness) => { harness.data.planningDemands.find((row) => row.id === harness.targetDemandId).sourceOrderId = ''; }
  ];
  for (const mutate of mutateCases) {
    const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-20' });
    mutate(harness);
    const before = JSON.stringify(harness.data);
    await harness.SalesModule.saveSalesOrderDraft();
    assert.equal(harness.getSaveCount(), 0);
    assert.equal(JSON.stringify(harness.data), before);
  }
});

test('Faz A.1 DB.save exception ve ok:false sonucunda tam SOR-PLN rollback yapar', async () => {
  for (const option of [{ saveThrows: true }, { saveOkFalse: true }]) {
    const harness = buildSalesDeliveryDateReallocationHarness({ ...option, targetIndex: 4, nextDeliveryDate: '2026-08-20' });
    const before = JSON.stringify(harness.data);
    await harness.SalesModule.saveSalesOrderDraft();
    assert.equal(harness.getSaveCount(), 1);
    assert.equal(JSON.stringify(harness.data), before);
    assert.match(harness.alerts.at(-1), /geri alındı/);
  }
});

test('Faz A.1 siparis bazli kilit cift tiklamada tek revizyon ve tek save uretir', async () => {
  const harness = buildSalesDeliveryDateReallocationHarness({ deferSave: true, targetIndex: 4, nextDeliveryDate: '2026-08-20' });
  const first = harness.SalesModule.saveSalesOrderDraft();
  const second = harness.SalesModule.saveSalesOrderDraft();
  await second;
  assert.equal(harness.getSaveCount(), 1);
  harness.resolveDeferredSave({ ok: true });
  await first;
  const order = harness.data.orders.find((row) => row.id === harness.targetOrderId);
  assert.equal(order.revisionNo, 2);
  assert.equal(order.revisionHistory.length, 2);
  assert.equal(harness.getSaveCount(), 1);
});

test('Faz A.1 ticari borcu kapanmis SOR icin uyari gostermez ama exact termin senkronunu korur', async () => {
  const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-01' });
  const order = harness.data.orders.find((row) => row.id === harness.targetOrderId);
  const line = order.lines[0];
  const demand = harness.data.planningDemands.find((row) => row.id === harness.targetDemandId);
  const poolRow = demand.poolAnalysis.rows[0];
  poolRow.useStockSelected = false;
  poolRow.useStockQty = 0;
  poolRow.useNetSelected = true;
  poolRow.netQty = 1;
  demand.workOrderIds = ['wo-date-closed'];
  demand.workOrderCodes = ['WO-DATE-CLOSED'];
  harness.data.workOrders.push({
    id: 'wo-date-closed',
    workOrderCode: 'WO-DATE-CLOSED',
    sourceId: demand.id,
    sourceCode: demand.demandCode,
    sourceItemKey: demand.items[0].id,
    lines: [{
      id: 'wo-date-closed-line',
      componentId: 'prc-date',
      componentCode: 'PRC-DATE',
      unit: 'ADET',
      targetQty: 1,
      routes: [{ id: 'route-date-closed', seq: 1, stationId: 'unit-date-closed', processId: 'FINAL' }]
    }]
  });
  harness.data.salesShipments.push({
    id: 'shipment-date-closed',
    idempotencyKey: 'shipment-date-closed-key',
    status: 'DISPATCHED',
    sourceOrderId: order.id,
    sourceOrderNo: order.orderNo,
    items: [{
      sourceOrderId: order.id,
      sourceLineId: line.id,
      productId: line.productId,
      variationId: line.variationId,
      variantCode: line.variantCode,
      dispatchQty: 1,
      shippedQty: 1,
      recipeParts: [{ refId: 'prc-date', code: 'PRC-DATE', unit: 'ADET', qtyPerSet: 1 }]
    }]
  });
  await harness.SalesModule.saveSalesOrderDraft();
  assert.equal(harness.modal.openCount, 0);
  assert.equal(harness.getSaveCount(), 1);
  assert.equal(harness.data.orders.find((row) => row.id === harness.targetOrderId).deliveryDate, '2026-08-01');
  assert.equal(harness.data.planningDemands.find((row) => row.id === harness.targetDemandId).dueDate, '2026-08-01');
});

test('Faz A.1 onay ile kayit arasindaki zincir degisikliginde eski preflighta guvenmez', async () => {
  const harness = buildSalesDeliveryDateReallocationHarness({ targetIndex: 4, nextDeliveryDate: '2026-08-01' });
  await harness.SalesModule.saveSalesOrderDraft();
  assert.equal(harness.modal.openCount, 1);
  const demand = harness.data.planningDemands.find((row) => row.id === harness.targetDemandId);
  harness.data.planningDemands.push({ ...JSON.parse(JSON.stringify(demand)), id: 'pln-date-stale-duplicate' });
  const beforeConfirm = JSON.stringify(harness.data);
  await harness.SalesModule.confirmSalesOrderDeliveryDatePriorityChange();
  assert.equal(harness.getSaveCount(), 0);
  assert.equal(JSON.stringify(harness.data), beforeConfirm);
  assert.match(harness.alerts.at(-1), /eksik veya mükerrer|güvenilir değil/);
});

function buildD2AAllocationSnapshot() {
  const snapshot = buildSourceAwareProductionSnapshot();
  snapshot.planningDemands = snapshot.planningDemands.filter((row) => row.id === 'demand-a');
  snapshot.workOrders = snapshot.workOrders.filter((row) => row.id === 'wo-a');
  const originDemand = snapshot.planningDemands[0];
  originDemand.items[0].qty = 20;
  Object.assign(originDemand.poolAnalysis.rows[0], { itemQty: 20, requiredQty: 20, netQty: 20 });
  snapshot.workOrders[0].lines[0].targetQty = 20;
  snapshot.workOrderTransactions.forEach((row) => { row.qty = 20; });
  Object.assign(snapshot.stockDepotItems[0], { qty: 20, quantity: 20, amount: 20 });
  Object.assign(snapshot.stock_movements[0], { qty: 20, quantity: 20 });
  const sor8 = addPhase2SalesDebt(snapshot, {
    suffix: '000008', targetQty: 10, deliveryDate: '2026-08-05', releasedAt: '2026-08-02T08:00:00.000Z',
    prcCode: 'PRC-SOURCE-1', prcId: 'prc-source-1'
  });
  const sor7 = addPhase2SalesDebt(snapshot, {
    suffix: '000007', targetQty: 20, deliveryDate: '2026-08-10', releasedAt: '2026-08-03T08:00:00.000Z',
    prcCode: 'PRC-SOURCE-1', prcId: 'prc-source-1'
  });
  snapshot.salesShipmentPlans = [];
  snapshot.sanalTaksimAllocationInstructions = [];
  return {
    snapshot,
    sor8: { ...sor8, itemKey: snapshot.planningDemands.find((row) => row.id === sor8.demandId).items[0].id },
    sor7: { ...sor7, itemKey: snapshot.planningDemands.find((row) => row.id === sor7.demandId).items[0].id }
  };
}

function buildD2ARequest(snapshot, target, overrides = {}) {
  const resolved = loadSanalTaksimResolver().resolve(snapshot);
  const segment = resolved.segments.find((row) => row.stockRowId === 'stock-a');
  assert.ok(segment, 'D2A fixture CURRENT_STOCK_ROW segment uretmelidir');
  const qty = Number(overrides.qty ?? 5);
  const start = Number(overrides.segmentOffsetStart ?? 0);
  return {
    id: overrides.id || '11111111-1111-4111-8111-111111111111',
    instructionCode: overrides.instructionCode || 'STAI-000001',
    idempotencyKey: overrides.idempotencyKey || 'd2a-key-1',
    prcId: overrides.prcId || 'prc-source-1',
    prcCode: overrides.prcCode || 'PRC-SOURCE-1',
    unit: overrides.unit || 'ADET',
    qty,
    target: {
      sourceOrderId: target.orderId,
      sourceLineId: target.orderLineId,
      demandId: target.demandId,
      itemKey: target.itemKey
    },
    slices: [{
      sliceKey: overrides.sliceKey || 'd2a-slice-1',
      stockRowId: overrides.stockRowId || 'stock-a',
      physicalSegmentId: overrides.physicalSegmentId || 'STOCK|stock-a',
      segmentCapacityQtyAtCreate: overrides.segmentCapacityQtyAtCreate ?? Number(segment.physicalQty ?? segment.qty),
      segmentOffsetStart: start,
      segmentOffsetEnd: Number(overrides.segmentOffsetEnd ?? (start + qty)),
      qty
    }],
    reason: overrides.reason || 'SOR-000008 icin exact tahsis',
    createdAt: overrides.createdAt || '2026-07-31T09:00:00.000Z',
    createdBy: overrides.createdBy || 'D2A Test'
  };
}

function buildD2B1ASelectionTarget(target, overrides = {}) {
  return {
    sourceOrderId: overrides.sourceOrderId || target.orderId,
    sourceLineId: overrides.sourceLineId || target.orderLineId,
    demandId: overrides.demandId || target.demandId,
    itemKey: overrides.itemKey || target.itemKey,
    prcId: overrides.prcId || 'prc-source-1',
    prcCode: overrides.prcCode || 'PRC-SOURCE-1',
    unit: overrides.unit || 'ADET'
  };
}

function buildD2B1AMontagePlan(snapshot, target, {
  id = 'mgp-d2b1a',
  status = 'DRAFT',
  qty = 5,
  start = 0
} = {}) {
  const order = snapshot.orders.find((row) => row.id === target.orderId);
  const line = order.lines.find((row) => row.id === target.orderLineId);
  const demand = snapshot.planningDemands.find((row) => row.id === target.demandId);
  const item = demand.items.find((row) => row.id === target.itemKey);
  const planItem = {
    sourceType: 'SALES_ORDER',
    sourceOrderId: target.orderId,
    sourceOrderNo: order.orderNo,
    sourceLineId: target.orderLineId,
    demandId: target.demandId,
    demandCode: demand.demandCode,
    itemKey: target.itemKey,
    productId: line.productId,
    variantId: line.variationId,
    variantCode: line.variantCode || item.variantCode,
    montageCardId: 'mon-d2b1a',
    montageCardCode: 'MON-D2B1A',
    plannedQty: qty,
    recipeParts: [{
      refId: 'prc-source-1', code: 'PRC-SOURCE-1', unit: 'ADET', qtyPerSet: 1
    }]
  };
  return {
    id,
    planNo: `MGP-${id.toUpperCase()}`,
    status,
    items: [planItem],
    parts: [{
      source: 'component', refId: 'prc-source-1', code: 'PRC-SOURCE-1',
      unit: 'ADET', qtyPerSet: 1, requiredQty: qty
    }],
    exactReservations: [{
      reservationKey: `MGP_EXACT|${id}|${start}|${start + qty}`,
      planId: id,
      sourceType: 'SALES_ORDER',
      sourceOrderId: target.orderId,
      sourceLineId: target.orderLineId,
      demandId: target.demandId,
      itemKey: target.itemKey,
      prcId: 'prc-source-1',
      prcCode: 'PRC-SOURCE-1',
      unit: 'ADET',
      partSource: 'component',
      physicalSegmentId: 'STOCK|stock-a',
      stockRowId: 'stock-a',
      sourceBucket: 'FROM_PRODUCTION',
      segmentOffsetStart: start,
      segmentOffsetEnd: start + qty,
      qty
    }]
  };
}

function buildD2B1AMontageShipment(snapshot, target, {
  qty = 4,
  start = 8
} = {}) {
  const plan = buildD2B1AMontagePlan(snapshot, target, {
    id: 'mgp-d2b1a-mgs', status: 'DISPATCHED_TO_MONTAGE', qty, start
  });
  const planItem = plan.items[0];
  const shipment = {
    id: 'mgs-d2b1a',
    shipmentNo: 'MGS-D2B1A',
    planId: plan.id,
    planNo: plan.planNo,
    idempotencyKey: `MONTAGE_PLAN_DISPATCH|${plan.id}`,
    status: 'IN_TRANSIT',
    stockTransferMode: 'POST_ON_RECEIPT_V1',
    targetUnitId: 'u3',
    items: [{ ...planItem, plannedQty: undefined, shippedQty: qty }],
    parts: [{
      source: 'component', refId: 'prc-source-1', code: 'PRC-SOURCE-1',
      unit: 'ADET', shippedQty: qty,
      allocations: [{
        idempotencyKey: 'mgs-d2b1a-allocation',
        movementIdempotencyKey: 'mgs-d2b1a-movement',
        stockRowId: 'stock-a',
        stockDepotItemId: 'stock-a',
        physicalSegmentId: 'STOCK|stock-a',
        sourceBucket: 'FROM_PRODUCTION',
        sourceDepotId: 'main',
        sourceLocationId: snapshot.stockDepotItems.find((row) => row.id === 'stock-a').locationId,
        prcId: 'prc-source-1',
        prcCode: 'PRC-SOURCE-1',
        unit: 'ADET',
        qty,
        segmentRanges: [{
          ...plan.exactReservations[0],
          reservationKey: 'mgs-d2b1a-range'
        }]
      }]
    }]
  };
  return { plan, shipment };
}

function buildD2C1BInTransitMgs(snapshot, target, {
  qty = 4,
  start = 0,
  suffix = '1'
} = {}) {
  const lifecycle = buildD2B1AMontageShipment(snapshot, target, { qty, start });
  const planId = `mgp-d2c1b-${suffix}`;
  const planNo = `MGP-D2C1B-${String(suffix).toUpperCase()}`;
  const shipmentId = `mgs-d2c1b-${suffix}`;
  const shipmentNo = `MGS-D2C1B-${String(suffix).toUpperCase()}`;
  lifecycle.plan.id = planId;
  lifecycle.plan.planNo = planNo;
  lifecycle.plan.shipmentId = shipmentId;
  lifecycle.plan.shipmentNo = shipmentNo;
  lifecycle.plan.exactReservations.forEach((reservation, index) => {
    reservation.planId = planId;
    reservation.reservationKey = `MGP_EXACT|${planId}|${start}|${start + qty}|${index}`;
  });
  Object.assign(lifecycle.shipment, {
    id: shipmentId,
    shipmentNo,
    planId,
    planNo,
    idempotencyKey: `MONTAGE_PLAN_DISPATCH|${planId}`
  });
  lifecycle.shipment.parts.forEach((part, partIndex) => {
    (Array.isArray(part?.allocations) ? part.allocations : []).forEach((allocation, allocationIndex) => {
      allocation.idempotencyKey = `mgs-d2c1b-${suffix}-allocation-${partIndex}-${allocationIndex}`;
      allocation.movementIdempotencyKey = `mgs-d2c1b-${suffix}-movement-${partIndex}-${allocationIndex}`;
      (Array.isArray(allocation?.segmentRanges) ? allocation.segmentRanges : []).forEach((range, rangeIndex) => {
        range.planId = planId;
        range.reservationKey = `MGS_EXACT|${shipmentId}|${start}|${start + qty}|${partIndex}|${allocationIndex}|${rangeIndex}`;
      });
    });
  });
  return lifecycle;
}

function alignD2C1BTargetProduct(snapshot, sourceTarget, destinationTarget) {
  const sourceOrder = snapshot.orders.find((row) => row.id === sourceTarget.orderId);
  const sourceLine = sourceOrder.lines.find((row) => row.id === sourceTarget.orderLineId);
  const destinationOrder = snapshot.orders.find((row) => row.id === destinationTarget.orderId);
  const destinationLine = destinationOrder.lines.find((row) => row.id === destinationTarget.orderLineId);
  Object.assign(destinationLine, {
    productId: sourceLine.productId,
    variationId: sourceLine.variationId,
    variantCode: sourceLine.variantCode
  });
  const destinationDemand = snapshot.planningDemands.find((row) => row.id === destinationTarget.demandId);
  const destinationItem = destinationDemand.items.find((row) => row.id === destinationTarget.itemKey);
  destinationItem.variantCode = sourceLine.variantCode;
}

function buildD2C1BEvent(candidate, suffix = '1') {
  return {
    contractVersion: 1,
    eventId: `81818181-8181-4181-8181-${String(suffix).padStart(12, '0')}`,
    type: 'OPERATIONAL_REBIND',
    rebindKey: candidate.rebindKey,
    fromTarget: { ...candidate.fromTarget },
    toTarget: { ...candidate.toTarget },
    setQty: candidate.setQty,
    unit: candidate.unit,
    productFingerprint: candidate.productFingerprint,
    recipeFingerprint: candidate.recipeFingerprint,
    exactRangeFingerprint: candidate.exactRangeFingerprint,
    at: '2026-08-05T10:00:00.000Z',
    by: 'D2C.1B-1 Test',
    reason: 'D2C.1B-1 IN_TRANSIT MGS operational target rebind'
  };
}

function loadD2APlanningHarness({ save } = {}) {
  const Resolver = loadSanalTaksimResolver();
  const fixture = buildD2AAllocationSnapshot();
  let saveCalls = 0;
  const saveOptions = [];
  const db = {
    data: { meta: { activeUserName: 'D2A Test' }, data: fixture.snapshot },
    save: async (options) => {
      saveCalls += 1;
      saveOptions.push(options);
      return save ? save(options, saveCalls) : { ok: true };
    }
  };
  const PlanningModule = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: db,
    SanalTaksimResolver: Resolver,
    crypto: { randomUUID: () => '99999999-9999-4999-8999-999999999999' }
  }).exported;
  return { Resolver, PlanningModule, db, ...fixture, getSaveCalls: () => saveCalls, saveOptions };
}

function getD2AOrderAllocationQty(result, orderId) {
  const debtKeys = new Set(result.debts
    .filter((row) => row.debtType === 'SALES' && row.originOrderId === orderId)
    .map((row) => row.debtKey));
  return result.allocations
    .filter((row) => debtKeys.has(row.targetDebtKey))
    .reduce((sum, row) => sum + Number(row.qty || 0), 0);
}

function buildD2B2AAtomicBundle(harness, target = harness.sor7, overrides = {}) {
  const qty = Number(overrides.qty ?? 5);
  const start = Number(overrides.start ?? 0);
  const planId = overrides.planId || 'mgp-d2b2a';
  const plan = buildD2B1AMontagePlan(harness.snapshot, target, { id: planId, qty, start });
  plan.planNo = overrides.planNo || 'MGP-D2B2A';
  plan.createdAt = '2026-07-31T12:00:00.000Z';
  plan.updatedAt = plan.createdAt;
  const request = buildD2ARequest(harness.snapshot, target, {
    id: overrides.instructionId || '55555555-5555-4555-8555-555555555555',
    instructionCode: overrides.instructionCode || 'STAI-000001',
    idempotencyKey: overrides.idempotencyKey || `PLAN_BOUND_MGP|${planId}|PRC-SOURCE-1`,
    sliceKey: overrides.sliceKey || 'd2b2a-slice-1',
    qty,
    segmentOffsetStart: start,
    segmentOffsetEnd: start + qty,
    reason: overrides.reason || 'D2B.2A plan-bound MGP exact tahsisi'
  });
  return { plan, instructionRequests: [request] };
}

function extendD2B2AMultiPrcSnapshot(harness) {
  const snapshot = harness.snapshot;
  snapshot.partComponentCards.push({ id: 'prc-source-2', code: 'PRC-SOURCE-2', unit: 'ADET' });
  const originDemand = snapshot.planningDemands.find((row) => row.id === 'demand-a');
  originDemand.poolAnalysis.rows.push(buildSourceAwarePoolRow({
    itemKey: 'item-a', prcId: 'prc-source-2', prcCode: 'PRC-SOURCE-2',
    itemQty: 20, requiredQty: 20, productionQty: 20
  }));
  const originWorkOrder = snapshot.workOrders.find((row) => row.id === 'wo-a');
  originWorkOrder.lines.push({
    id: 'wo-a-line-2', componentId: 'prc-source-2', componentCode: 'PRC-SOURCE-2',
    unit: 'ADET', targetQty: 20,
    routes: [{ id: 'wo-a-route-2', seq: 1, stationId: 'unit-a', processId: 'FINAL' }]
  });
  ['TAKE', 'COMPLETE', 'STORE'].forEach((type) => {
    snapshot.workOrderTransactions.push({
      id: `txn-a-${type.toLowerCase()}-2`, workOrderId: 'wo-a', lineId: 'wo-a-line-2',
      stationId: 'unit-a', routeId: 'wo-a-route-2', routeSeq: 1, processId: 'FINAL', type, qty: 20
    });
  });
  snapshot.stockDepotItems.push({
    ...JSON.parse(JSON.stringify(snapshot.stockDepotItems[0])),
    id: 'stock-b', refId: 'prc-source-2', productCode: 'PRC-SOURCE-2', code: 'PRC-SOURCE-2'
  });
  snapshot.stock_movements.push({
    ...JSON.parse(JSON.stringify(snapshot.stock_movements[0])),
    id: 'movement-store-b', workOrderLineId: 'wo-a-line-2',
    refId: 'prc-source-2', productCode: 'PRC-SOURCE-2', code: 'PRC-SOURCE-2'
  });
  [harness.sor8, harness.sor7].forEach((target) => {
    const workOrder = snapshot.workOrders.find((row) => row.id === target.workOrderId);
    workOrder.lines.push({
      id: `${target.workOrderId}-line-2`, componentCode: 'PRC-SOURCE-2', componentId: 'prc-source-2',
      targetQty: target === harness.sor7 ? 20 : 10, unit: 'ADET',
      routes: [{ id: `${target.workOrderId}-route-2`, seq: 1, stationId: `u-${target.workOrderId}`, processId: 'CNC' }]
    });
  });
}

function buildD2B2BMultiPrcBundle(harness) {
  extendD2B2AMultiPrcSnapshot(harness);
  const bundle = buildD2B2AAtomicBundle(harness, harness.sor7, {
    qty: 5,
    planId: 'mgp-d2b2b-multi',
    planNo: 'MGP-D2B2B-MULTI'
  });
  bundle.plan.items[0].recipeParts.push({
    refId: 'prc-source-2', code: 'PRC-SOURCE-2', unit: 'ADET', qtyPerSet: 1
  });
  bundle.plan.parts.push({
    source: 'component', refId: 'prc-source-2', code: 'PRC-SOURCE-2',
    unit: 'ADET', qtyPerSet: 1, requiredQty: 5
  });
  bundle.plan.exactReservations.push({
    reservationKey: 'MGP_EXACT|mgp-d2b2b-multi|PRC-SOURCE-2|0|5',
    planId: bundle.plan.id,
    sourceType: 'SALES_ORDER',
    sourceOrderId: harness.sor7.orderId,
    sourceLineId: harness.sor7.orderLineId,
    demandId: harness.sor7.demandId,
    itemKey: harness.sor7.itemKey,
    prcId: 'prc-source-2', prcCode: 'PRC-SOURCE-2', unit: 'ADET', partSource: 'component',
    physicalSegmentId: 'STOCK|stock-b', stockRowId: 'stock-b', sourceBucket: 'FROM_PRODUCTION',
    segmentOffsetStart: 0, segmentOffsetEnd: 5, qty: 5
  });
  bundle.instructionRequests.push(buildD2ARequest(harness.snapshot, harness.sor7, {
    id: '88888888-8888-4888-8888-888888888888',
    instructionCode: 'STAI-000002',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2b2b-multi|PRC-SOURCE-2',
    prcId: 'prc-source-2', prcCode: 'PRC-SOURCE-2',
    stockRowId: 'stock-b', physicalSegmentId: 'STOCK|stock-b', segmentCapacityQtyAtCreate: 20,
    sliceKey: 'd2b2b-slice-2', qty: 5, segmentOffsetStart: 0, segmentOffsetEnd: 5,
    reason: 'D2B.2B ikinci exact PRC tahsisi'
  }));
  return bundle;
}

async function buildD2B2BLifecycleHarness({
  multiPrc = false,
  stockHarnessOptions = {}
} = {}) {
  const planning = loadD2APlanningHarness();
  const bundle = multiPrc
    ? buildD2B2BMultiPrcBundle(planning)
    : buildD2B2AAtomicBundle(planning, planning.sor7, {
      planId: 'mgp-d2b2b',
      planNo: 'MGP-D2B2B'
    });
  const created = await planning.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(bundle);
  assert.equal(created.ok, true, JSON.stringify(created));
  const stock = buildMontagePlanHarness({
    dataOverride: planning.snapshot,
    useRealMontagePreflight: true,
    ...stockHarnessOptions
  });
  return { ...planning, bundle, created, stock };
}

test('D2B.2A MGP ve ACTIVE instruction tek strict save ile atomik ve tek-hold olusur', async () => {
  const harness = loadD2APlanningHarness();
  const server = require('../serve.js');
  const beforeState = { data: JSON.parse(JSON.stringify(harness.snapshot)) };
  const stockBefore = JSON.stringify(harness.snapshot.stockDepotItems);
  const result = await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(
    buildD2B2AAtomicBundle(harness)
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(harness.getSaveCalls(), 1);
  assert.equal(harness.saveOptions[0]?.conflictStrategy, 'fail');
  assert.equal(harness.snapshot.montageDispatchPlans.length, 1);
  assert.equal(harness.snapshot.sanalTaksimAllocationInstructions.length, 1);
  const plan = harness.snapshot.montageDispatchPlans[0];
  const instruction = harness.snapshot.sanalTaksimAllocationInstructions[0];
  const reservation = plan.exactReservations[0];
  const slice = instruction.slices[0];
  assert.equal(reservation.instructionId, instruction.id);
  assert.equal(reservation.instructionSliceKey, slice.sliceKey);
  assert.equal(slice.planId, plan.id);
  assert.equal(slice.reservationKey, reservation.reservationKey);
  assert.equal(server.validateSanalTaksimPlanBoundMontageLinks({ data: harness.snapshot }).length, 0);
  assert.equal(server.validateSanalTaksimOperationalHoldConflicts({ data: harness.snapshot }).length, 0);
  assert.equal(server.validateSanalTaksimAllocationInstructionTransitions(
    beforeState,
    { data: harness.snapshot }
  ).length, 0);
  const resolved = harness.Resolver.resolve(harness.snapshot);
  assert.equal(resolved.diagnostics.exactHoldLedger.valid, true, JSON.stringify(resolved.diagnostics.exactHoldLedger));
  assert.equal(resolved.diagnostics.exactHoldLedger.holdCount, 1);
  assert.equal(resolved.diagnostics.exactHoldLedger.activeInstructionCount, 1);
  assert.equal(resolved.allocations.filter((row) => row.physicalSegmentId === 'STOCK|stock-a')
    .reduce((sum, row) => sum + Number(row.qty || 0), 0), 20);
  assert.equal(JSON.stringify(harness.snapshot.stockDepotItems), stockBefore);
});

test('D2B.2A save hatasi ve revision conflict iki koleksiyonu birlikte rollback yapar', async () => {
  const cases = [
    {
      save: () => ({ ok: false, code: 'disk_save_failed', error: new Error('disk') }),
      reasonCode: 'PLAN_BOUND_SAVE_FAILED'
    },
    {
      save: () => ({ ok: false, code: 'save_conflict', conflict: true, currentRevision: 42 }),
      reasonCode: 'PLAN_BOUND_REVISION_CONFLICT'
    },
    {
      save: () => { throw new Error('exception'); },
      reasonCode: 'PLAN_BOUND_SAVE_FAILED'
    }
  ];
  for (const entry of cases) {
    const harness = loadD2APlanningHarness({ save: entry.save });
    const beforePlans = JSON.stringify(harness.snapshot.montageDispatchPlans);
    const beforeInstructions = JSON.stringify(harness.snapshot.sanalTaksimAllocationInstructions);
    const beforeStock = JSON.stringify(harness.snapshot.stockDepotItems);
    const result = await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(
      buildD2B2AAtomicBundle(harness)
    );
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, entry.reasonCode);
    assert.equal(harness.getSaveCalls(), 1);
    assert.equal(JSON.stringify(harness.snapshot.montageDispatchPlans), beforePlans);
    assert.equal(JSON.stringify(harness.snapshot.sanalTaksimAllocationInstructions), beforeInstructions);
    assert.equal(JSON.stringify(harness.snapshot.stockDepotItems), beforeStock);
  }
});

test('D2B.2A server yalniz birebir bagi kabul eder ve ikinci exact cifti fail-closed reddeder', async () => {
  const harness = loadD2APlanningHarness();
  const server = require('../serve.js');
  const result = await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(
    buildD2B2AAtomicBundle(harness)
  );
  assert.equal(result.ok, true);
  const validState = { data: harness.snapshot };
  const mutators = [
    (state) => { state.data.montageDispatchPlans[0].exactReservations[0].qty = 4; },
    (state) => { state.data.montageDispatchPlans[0].exactReservations[0].segmentOffsetEnd = 4; },
    (state) => { state.data.montageDispatchPlans[0].exactReservations[0].instructionSliceKey = 'other'; },
    (state) => { state.data.sanalTaksimAllocationInstructions[0].slices[0].reservationKey = 'other'; }
  ];
  mutators.forEach((mutate) => {
    const invalid = JSON.parse(JSON.stringify(validState));
    mutate(invalid);
    assert.ok(server.validateSanalTaksimPlanBoundMontageLinks(invalid).length > 0);
  });

  const duplicate = JSON.parse(JSON.stringify(validState));
  const plan2 = JSON.parse(JSON.stringify(duplicate.data.montageDispatchPlans[0]));
  const instruction2 = JSON.parse(JSON.stringify(duplicate.data.sanalTaksimAllocationInstructions[0]));
  Object.assign(plan2, { id: 'mgp-d2b2a-2', planNo: 'MGP-D2B2A-2' });
  Object.assign(instruction2, {
    id: '66666666-6666-4666-8666-666666666666',
    instructionCode: 'STAI-000002',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2b2a-2|PRC-SOURCE-1'
  });
  Object.assign(plan2.exactReservations[0], {
    planId: plan2.id,
    reservationKey: 'MGP_EXACT|mgp-d2b2a-2|0|5',
    instructionId: instruction2.id,
    instructionSliceKey: 'd2b2a-slice-2'
  });
  Object.assign(instruction2.slices[0], {
    sliceKey: 'd2b2a-slice-2',
    planId: plan2.id,
    reservationKey: plan2.exactReservations[0].reservationKey
  });
  duplicate.data.montageDispatchPlans.push(plan2);
  duplicate.data.sanalTaksimAllocationInstructions.push(instruction2);
  assert.equal(server.validateSanalTaksimPlanBoundMontageLinks(duplicate).length, 0);
  assert.ok(server.validateSanalTaksimAllocationInstructions(duplicate).some((issue) => /kesişemez/.test(issue)));
  assert.ok(server.validateSanalTaksimOperationalHoldConflicts(duplicate).length > 0);
});

test('D2B.2A cok PRCli MGP her PRCyi deterministik ve ayri instruction bagiyla dogrular', async () => {
  const harness = loadD2APlanningHarness();
  extendD2B2AMultiPrcSnapshot(harness);
  const bundle = buildD2B2AAtomicBundle(harness, harness.sor7, { qty: 5, planId: 'mgp-d2b2a-multi' });
  bundle.plan.planNo = 'MGP-D2B2A-MULTI';
  bundle.plan.items[0].recipeParts.push({
    refId: 'prc-source-2', code: 'PRC-SOURCE-2', unit: 'ADET', qtyPerSet: 1
  });
  bundle.plan.parts.push({
    source: 'component', refId: 'prc-source-2', code: 'PRC-SOURCE-2',
    unit: 'ADET', qtyPerSet: 1, requiredQty: 5
  });
  bundle.plan.exactReservations.push({
    reservationKey: 'MGP_EXACT|mgp-d2b2a-multi|PRC-SOURCE-2|0|5',
    planId: bundle.plan.id,
    sourceType: 'SALES_ORDER',
    sourceOrderId: harness.sor7.orderId,
    sourceLineId: harness.sor7.orderLineId,
    demandId: harness.sor7.demandId,
    itemKey: harness.sor7.itemKey,
    prcId: 'prc-source-2', prcCode: 'PRC-SOURCE-2', unit: 'ADET', partSource: 'component',
    physicalSegmentId: 'STOCK|stock-b', stockRowId: 'stock-b', sourceBucket: 'FROM_PRODUCTION',
    segmentOffsetStart: 0, segmentOffsetEnd: 5, qty: 5
  });
  bundle.instructionRequests.push(buildD2ARequest(harness.snapshot, harness.sor7, {
    id: '77777777-7777-4777-8777-777777777777',
    instructionCode: 'STAI-000002',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2b2a-multi|PRC-SOURCE-2',
    prcId: 'prc-source-2', prcCode: 'PRC-SOURCE-2',
    stockRowId: 'stock-b', physicalSegmentId: 'STOCK|stock-b', segmentCapacityQtyAtCreate: 20,
    sliceKey: 'd2b2a-slice-2', qty: 5, segmentOffsetStart: 0, segmentOffsetEnd: 5,
    reason: 'D2B.2A ikinci exact PRC tahsisi'
  }));
  bundle.instructionRequests.reverse();

  const result = await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(bundle);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(harness.getSaveCalls(), 1);
  assert.equal(result.instructions.length, 2);
  assert.equal(JSON.stringify(result.instructions.map((row) => row.prcCode)), JSON.stringify([
    'PRC-SOURCE-1', 'PRC-SOURCE-2'
  ]));
  assert.equal(new Set(result.plan.exactReservations.map((row) => row.instructionId)).size, 2);
  assert.equal(require('../serve.js').validateSanalTaksimPlanBoundMontageLinks({ data: harness.snapshot }).length, 0);
  assert.equal(result.resolved.diagnostics.exactHoldLedger.holdCount, 2);
  assert.equal(result.resolved.diagnostics.exactHoldLedger.valid, true);
});

test('D2B.2B bound MGP iptali instructioni auditli kapatir ve exact dilimi serbest birakir', async () => {
  const harness = await buildD2B2BLifecycleHarness();
  const server = require('../serve.js');
  const beforeState = { data: JSON.parse(JSON.stringify(harness.snapshot)) };
  const plan = harness.snapshot.montageDispatchPlans[0];
  const instruction = harness.snapshot.sanalTaksimAllocationInstructions[0];

  await harness.stock.StockModule.cancelMontageDispatchPlan(plan.id);

  assert.equal(plan.status, 'CANCELLED');
  assert.equal(instruction.status, 'CANCELLED');
  assert.equal(instruction.events.length, 1);
  assert.equal(instruction.events[0].type, 'CANCELLED');
  assert.equal(harness.stock.saveCount, 1);
  assert.equal(harness.stock.saveOptions[0]?.conflictStrategy, 'fail');
  const afterState = { data: harness.snapshot };
  assert.equal(server.validateSanalTaksimAllocationInstructions(afterState).length, 0);
  assert.equal(server.validateSanalTaksimPlanBoundMontageLinks(afterState).length, 0);
  assert.equal(server.validateSanalTaksimAllocationInstructionTransitions(beforeState, afterState).length, 0);
  const selection = harness.Resolver.resolveExactSourceSelection(
    harness.snapshot,
    buildD2B1ASelectionTarget(harness.sor7)
  );
  assert.equal(selection.ok, true, JSON.stringify(selection));
  assert.equal(selection.totalSelectableQty, 20);
  assert.equal(selection.slices.some((slice) =>
    slice.segmentOffsetStart === 0 && slice.segmentOffsetEnd === 20
  ), true);
});

test('D2B.2B bound MGP iptal save hatasi ve conflictte plan ile instructioni birlikte rollback yapar', async () => {
  const cases = [
    { failSave: true },
    { saveReturnsFailure: true },
    { saveResult: { ok: false, code: 'save_conflict', conflict: true, currentRevision: 77 } }
  ];
  for (const stockHarnessOptions of cases) {
    const harness = await buildD2B2BLifecycleHarness({ stockHarnessOptions });
    const beforePlans = JSON.stringify(harness.snapshot.montageDispatchPlans);
    const beforeInstructions = JSON.stringify(harness.snapshot.sanalTaksimAllocationInstructions);
    const planId = harness.snapshot.montageDispatchPlans[0].id;

    await harness.stock.StockModule.cancelMontageDispatchPlan(planId);

    assert.equal(harness.stock.saveCount, 1);
    assert.equal(harness.stock.saveOptions[0]?.conflictStrategy, 'fail');
    assert.equal(JSON.stringify(harness.snapshot.montageDispatchPlans), beforePlans);
    assert.equal(JSON.stringify(harness.snapshot.sanalTaksimAllocationInstructions), beforeInstructions);
  }
});

test('D2B.2B bound MGP sevki instruction holdunu tek MGS IN_TRANSIT holduna atomik devreder', async () => {
  const harness = await buildD2B2BLifecycleHarness();
  const server = require('../serve.js');
  const beforeState = { data: JSON.parse(JSON.stringify(harness.snapshot)) };
  const stockBefore = JSON.stringify(harness.snapshot.stockDepotItems);
  const movementsBefore = JSON.stringify(harness.snapshot.stock_movements);
  const plan = harness.snapshot.montageDispatchPlans[0];
  const instruction = harness.snapshot.sanalTaksimAllocationInstructions[0];

  await harness.stock.StockModule.dispatchMontagePlanToMontage(plan.id);

  assert.equal(plan.status, 'DISPATCHED_TO_MONTAGE', JSON.stringify(harness.stock.alerts));
  assert.equal(instruction.status, 'COMPLETED');
  assert.equal(instruction.events.length, 1);
  assert.equal(instruction.events[0].type, 'COMPLETED');
  assert.equal(harness.snapshot.montageDispatchShipments.length, 1, JSON.stringify(harness.stock.alerts));
  const shipment = harness.snapshot.montageDispatchShipments[0];
  assert.equal(shipment.status, 'IN_TRANSIT');
  assert.equal(shipment.stockTransferMode, 'POST_ON_RECEIPT_V1');
  assert.equal(harness.stock.saveCount, 1, JSON.stringify(harness.stock.alerts));
  assert.equal(harness.stock.saveOptions[0]?.conflictStrategy, 'fail');
  assert.equal(JSON.stringify(harness.snapshot.stockDepotItems), stockBefore);
  assert.equal(JSON.stringify(harness.snapshot.stock_movements), movementsBefore);
  assert.equal(
    shipment.parts[0].allocations[0].segmentRanges[0].reservationKey,
    plan.exactReservations[0].reservationKey
  );
  const afterState = { data: harness.snapshot };
  assert.equal(server.validateSanalTaksimAllocationInstructions(afterState).length, 0);
  assert.equal(server.validateSanalTaksimPlanBoundMontageLinks(afterState).length, 0);
  assert.equal(server.validateSanalTaksimOperationalHoldConflicts(afterState).length, 0);
  assert.equal(server.validateSanalTaksimAllocationInstructionTransitions(beforeState, afterState).length, 0);
  const resolved = harness.Resolver.resolve(harness.snapshot);
  const holds = resolved.allocations.filter((row) => row.fixedByExactHold === true);
  assert.equal(resolved.diagnostics.exactHoldLedger.valid, true, JSON.stringify(resolved.diagnostics.exactHoldLedger));
  assert.equal(holds.length, 1);
  assert.equal(holds[0].holdKind, 'MGS_EXACT');
  assert.equal(holds[0].shipmentId, shipment.id);
  assert.equal(resolved.diagnostics.exactHoldLedger.activeInstructionCount, 0);
  assert.equal(resolved.totalsByPrc.find((row) => row.prcCode === 'PRC-SOURCE-1').physicalQty, 20);
});

test('D2B.2B bound sevk conflictinde MGP MGS instruction stok ve hareket birlikte rollback olur', async () => {
  const harness = await buildD2B2BLifecycleHarness({
    stockHarnessOptions: {
      saveResult: { ok: false, code: 'save_conflict', conflict: true, currentRevision: 88 }
    }
  });
  const before = JSON.stringify({
    plans: harness.snapshot.montageDispatchPlans,
    shipments: harness.snapshot.montageDispatchShipments,
    instructions: harness.snapshot.sanalTaksimAllocationInstructions,
    stock: harness.snapshot.stockDepotItems,
    movements: harness.snapshot.stock_movements
  });
  const planId = harness.snapshot.montageDispatchPlans[0].id;

  await harness.stock.StockModule.dispatchMontagePlanToMontage(planId);

  assert.equal(harness.stock.saveCount, 1);
  assert.equal(harness.stock.saveOptions[0]?.conflictStrategy, 'fail');
  assert.equal(JSON.stringify({
    plans: harness.snapshot.montageDispatchPlans,
    shipments: harness.snapshot.montageDispatchShipments,
    instructions: harness.snapshot.sanalTaksimAllocationInstructions,
    stock: harness.snapshot.stockDepotItems,
    movements: harness.snapshot.stock_movements
  }), before);
});

test('D2B.2B uyusmayan veya cok PRCli kismi bag fail-closed kalir, tum dogru baglar birlikte kapanir', async () => {
  const mismatch = await buildD2B2BLifecycleHarness();
  mismatch.snapshot.montageDispatchPlans[0].exactReservations[0].instructionSliceKey = 'missing-slice';
  const mismatchBefore = JSON.stringify(mismatch.snapshot);
  await mismatch.stock.StockModule.cancelMontageDispatchPlan(mismatch.snapshot.montageDispatchPlans[0].id);
  assert.equal(mismatch.stock.saveCount, 0);
  assert.equal(JSON.stringify(mismatch.snapshot), mismatchBefore);

  const invalidMulti = await buildD2B2BLifecycleHarness({ multiPrc: true });
  invalidMulti.snapshot.sanalTaksimAllocationInstructions[1].slices[0].reservationKey = 'wrong-reservation';
  const invalidBefore = JSON.stringify(invalidMulti.snapshot);
  await invalidMulti.stock.StockModule.dispatchMontagePlanToMontage(
    invalidMulti.snapshot.montageDispatchPlans[0].id
  );
  assert.equal(invalidMulti.stock.saveCount, 0);
  assert.equal(JSON.stringify(invalidMulti.snapshot), invalidBefore);

  const validMulti = await buildD2B2BLifecycleHarness({ multiPrc: true });
  await validMulti.stock.StockModule.cancelMontageDispatchPlan(validMulti.snapshot.montageDispatchPlans[0].id);
  assert.equal(validMulti.stock.saveCount, 1);
  assert.equal(validMulti.snapshot.montageDispatchPlans[0].status, 'CANCELLED');
  assert.equal(validMulti.snapshot.sanalTaksimAllocationInstructions.length, 2);
  assert.ok(validMulti.snapshot.sanalTaksimAllocationInstructions.every((row) =>
    row.status === 'CANCELLED' && row.events.length === 1 && row.events[0].type === 'CANCELLED'
  ));

  const dispatchedMulti = await buildD2B2BLifecycleHarness({ multiPrc: true });
  await dispatchedMulti.stock.StockModule.dispatchMontagePlanToMontage(
    dispatchedMulti.snapshot.montageDispatchPlans[0].id
  );
  assert.equal(dispatchedMulti.stock.saveCount, 1, JSON.stringify(dispatchedMulti.stock.alerts));
  assert.equal(dispatchedMulti.snapshot.montageDispatchPlans[0].status, 'DISPATCHED_TO_MONTAGE');
  assert.equal(dispatchedMulti.snapshot.montageDispatchShipments.length, 1);
  assert.ok(dispatchedMulti.snapshot.sanalTaksimAllocationInstructions.every((row) =>
    row.status === 'COMPLETED' && row.events.length === 1 && row.events[0].type === 'COMPLETED'
  ));
});

test('D2B.2B bagimsiz D2A instructioni degistirmez ve keyfi COMPLETED gecisini server reddeder', async () => {
  const harness = await buildD2B2BLifecycleHarness();
  const independentPreview = harness.PlanningModule.previewSanalTaksimAllocationInstruction(
    buildD2ARequest(harness.snapshot, harness.sor8, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      instructionCode: 'STAI-000010',
      idempotencyKey: 'D2B2B-INDEPENDENT-D2A',
      sliceKey: 'd2b2b-independent-slice',
      qty: 5,
      segmentOffsetStart: 5,
      segmentOffsetEnd: 10,
      reason: 'Bağımsız D2A instruction'
    })
  );
  assert.equal(independentPreview.ok, true, JSON.stringify(independentPreview));
  harness.snapshot.sanalTaksimAllocationInstructions.push(independentPreview.instruction);
  const independentBefore = JSON.stringify(independentPreview.instruction);

  await harness.stock.StockModule.dispatchMontagePlanToMontage(harness.snapshot.montageDispatchPlans[0].id);

  const independentAfter = harness.snapshot.sanalTaksimAllocationInstructions.find((row) =>
    row.id === independentPreview.instruction.id
  );
  assert.equal(JSON.stringify(independentAfter), independentBefore);
  const server = require('../serve.js');
  const current = { data: JSON.parse(JSON.stringify(harness.snapshot)) };
  const arbitraryComplete = JSON.parse(JSON.stringify(current));
  arbitraryComplete.data.sanalTaksimAllocationInstructions.find((row) =>
    row.id === independentPreview.instruction.id
  ).status = 'COMPLETED';
  arbitraryComplete.data.sanalTaksimAllocationInstructions.find((row) =>
    row.id === independentPreview.instruction.id
  ).events.push({
    eventId: 'arbitrary-complete', type: 'COMPLETED',
    at: '2026-07-31T15:00:00.000Z', by: 'Test', reason: 'Keyfi tamamlama'
  });
  assert.ok(server.validateSanalTaksimAllocationInstructionTransitions(current, arbitraryComplete).length > 0);
});

test('D2B.1A bos exact stok satirini deterministik ve D2A preview ile uyumlu dondurur', () => {
  const harness = loadD2APlanningHarness();
  const target = buildD2B1ASelectionTarget(harness.sor7);
  const before = JSON.stringify(harness.snapshot);
  const first = harness.Resolver.resolveExactSourceSelection(harness.snapshot, target);
  const second = harness.Resolver.resolveExactSourceSelection(harness.snapshot, target);
  assert.equal(first.ok, true, JSON.stringify(first));
  assert.equal(first.readOnly, true);
  assert.equal(first.writes, 0);
  assert.equal(first.targetOpenQty, 20);
  assert.equal(first.totalSelectableQty, 20);
  assert.equal(JSON.stringify(first.slices.map((row) => [
    row.physicalSegmentId, row.stockRowId, row.segmentOffsetStart, row.segmentOffsetEnd, row.qty
  ])), JSON.stringify([['STOCK|stock-a', 'stock-a', 0, 20, 20]]));
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(JSON.stringify(harness.snapshot), before);
  const slice = first.slices[0];
  const request = buildD2ARequest(harness.snapshot, harness.sor7, { qty: slice.qty });
  request.slices = [slice];
  const preview = harness.PlanningModule.previewSanalTaksimAllocationInstruction(request);
  assert.equal(preview.ok, true, JSON.stringify(preview));
  assert.equal(preview.allocations.reduce(
    (sum, row) => sum + Number(row.allocatedByInstructionQty || 0), 0
  ), 20);
  assert.equal(JSON.stringify(harness.snapshot), before);
});

test('D2B.1A ACTIVE exact talimati ve ortadaki araligi secilebilir dilimlerden cikarir', () => {
  const leading = loadD2APlanningHarness();
  const leadingPreview = leading.PlanningModule.previewSanalTaksimAllocationInstruction(
    buildD2ARequest(leading.snapshot, leading.sor8, { qty: 5 })
  );
  assert.equal(leadingPreview.ok, true);
  leading.snapshot.sanalTaksimAllocationInstructions = [leadingPreview.instruction];
  let model = leading.Resolver.resolveExactSourceSelection(
    leading.snapshot,
    buildD2B1ASelectionTarget(leading.sor7)
  );
  assert.equal(model.ok, true);
  assert.equal(model.totalSelectableQty, 15);
  assert.equal(JSON.stringify(model.slices.map((row) => [row.segmentOffsetStart, row.segmentOffsetEnd, row.qty])), JSON.stringify([
    [5, 20, 15]
  ]));

  const middle = loadD2APlanningHarness();
  const middlePreview = middle.PlanningModule.previewSanalTaksimAllocationInstruction(
    buildD2ARequest(middle.snapshot, middle.sor8, {
      qty: 5, segmentOffsetStart: 5, segmentOffsetEnd: 10
    })
  );
  assert.equal(middlePreview.ok, true);
  middle.snapshot.sanalTaksimAllocationInstructions = [middlePreview.instruction];
  model = middle.Resolver.resolveExactSourceSelection(
    middle.snapshot,
    buildD2B1ASelectionTarget(middle.sor7)
  );
  assert.equal(model.ok, true);
  assert.equal(model.totalSelectableQty, 15);
  assert.equal(JSON.stringify(model.slices.map((row) => [row.segmentOffsetStart, row.segmentOffsetEnd, row.qty])), JSON.stringify([
    [0, 5, 5], [10, 20, 10]
  ]));
  const resolved = middle.Resolver.resolve(middle.snapshot);
  const segment = resolved.segments.find((row) => row.stockRowId === 'stock-a');
  assert.equal(model.totalSelectableQty + Number(segment.heldQty || 0) <= segment.physicalQty, true);
  assert.equal(model.totalSelectableQty + Number(segment.heldQty || 0), 20);
});

test('D2B.1A MGP ve MGS exact hold araliklarini merkezi ledger uzerinden cikarir', () => {
  const mgp = buildD2AAllocationSnapshot();
  mgp.snapshot.montageDispatchPlans = [buildD2B1AMontagePlan(mgp.snapshot, mgp.sor8, {
    qty: 4, start: 2
  })];
  let resolved = loadSanalTaksimResolver().resolve(mgp.snapshot);
  assert.equal(resolved.diagnostics.exactHoldLedger.issues.length, 0, JSON.stringify(resolved.uncertain));
  let model = loadSanalTaksimResolver().resolveExactSourceSelection(
    mgp.snapshot,
    buildD2B1ASelectionTarget(mgp.sor7)
  );
  assert.equal(model.ok, true, JSON.stringify(model));
  assert.equal(JSON.stringify(model.slices.map((row) => [row.segmentOffsetStart, row.segmentOffsetEnd])), JSON.stringify([
    [0, 2], [6, 20]
  ]));

  const mgs = buildD2AAllocationSnapshot();
  const lifecycle = buildD2B1AMontageShipment(mgs.snapshot, mgs.sor8, { qty: 4, start: 8 });
  mgs.snapshot.montageDispatchPlans = [lifecycle.plan];
  mgs.snapshot.montageDispatchShipments = [lifecycle.shipment];
  resolved = loadSanalTaksimResolver().resolve(mgs.snapshot);
  assert.equal(resolved.diagnostics.exactHoldLedger.issues.length, 0, JSON.stringify(resolved.uncertain));
  model = loadSanalTaksimResolver().resolveExactSourceSelection(
    mgs.snapshot,
    buildD2B1ASelectionTarget(mgs.sor7)
  );
  assert.equal(model.ok, true, JSON.stringify(model));
  assert.equal(JSON.stringify(model.slices.map((row) => [row.segmentOffsetStart, row.segmentOffsetEnd])), JSON.stringify([
    [0, 8], [12, 20]
  ]));
});

test('D2B.1A SVP quantity-only hold icin offset tahmin etmeden segmenti fail-closed kapatir', () => {
  const fixture = buildD2AAllocationSnapshot();
  fixture.snapshot.salesShipmentPlans = [{
    id: 'svp-d2b1a',
    planNo: 'SVP-D2B1A',
    status: 'PLANNED',
    sourceOrderId: fixture.sor8.orderId,
    items: [{
      sourceLineId: fixture.sor8.orderLineId,
      plannedQty: 5,
      stockAllocations: [{
        stockItemId: 'stock-a',
        sourceOrderId: fixture.sor8.orderId,
        sourceLineId: fixture.sor8.orderLineId,
        allocatedQty: 5
      }]
    }]
  }];
  const before = JSON.stringify(fixture.snapshot);
  const Resolver = loadSanalTaksimResolver();
  const model = Resolver.resolveExactSourceSelection(
    fixture.snapshot,
    buildD2B1ASelectionTarget(fixture.sor7)
  );
  const resolved = Resolver.resolve(fixture.snapshot);
  const segment = resolved.segments.find((row) => row.stockRowId === 'stock-a');
  assert.equal(model.ok, true);
  assert.equal(model.totalSelectableQty, 0);
  assert.equal(JSON.stringify(model.slices), '[]');
  assert.equal(segment.heldQty, 5);
  assert.equal(segment.sharedPoolQty, 15);
  assert.equal(JSON.stringify(fixture.snapshot), before);
});

test('D2B.1A exact uyusmazlik ve eksik veya mukerrer hedef kimliginde fail-closed kalir', () => {
  const cases = [
    { target: (fixture) => buildD2B1ASelectionTarget(fixture.sor7, { unit: 'KG' }) },
    { target: (fixture) => buildD2B1ASelectionTarget(fixture.sor7, { prcCode: 'PRC-YANLIS' }) },
    { target: (fixture) => buildD2B1ASelectionTarget(fixture.sor7, { itemKey: 'missing-item' }) },
    {
      mutate: (snapshot, fixture) => {
        const demand = snapshot.planningDemands.find((row) => row.id === fixture.sor7.demandId);
        demand.items.push({ ...demand.items[0] });
      },
      target: (fixture) => buildD2B1ASelectionTarget(fixture.sor7)
    },
    {
      mutate: (snapshot, fixture) => {
        const demand = snapshot.planningDemands.find((row) => row.id === fixture.sor7.demandId);
        snapshot.planningDemands.push({ ...JSON.parse(JSON.stringify(demand)) });
      },
      target: (fixture) => buildD2B1ASelectionTarget(fixture.sor7)
    }
  ];
  cases.forEach((entry) => {
    const fixture = buildD2AAllocationSnapshot();
    if (entry.mutate) entry.mutate(fixture.snapshot, fixture);
    const before = JSON.stringify(fixture.snapshot);
    const result = loadSanalTaksimResolver().resolveExactSourceSelection(
      fixture.snapshot,
      entry.target(fixture)
    );
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.equal(result.reasonCode === 'INSTRUCTION_REQUEST_INVALID'
      || result.reasonCode === 'INSTRUCTION_TARGET_DEBT_INVALID', true);
    assert.equal(JSON.stringify(result.slices), '[]');
    assert.equal(JSON.stringify(fixture.snapshot), before);
  });
});

test('D2B.1A belirsiz fiziksel satir kimliginden tahmini dilim uretmez', () => {
  const fixture = buildD2AAllocationSnapshot();
  fixture.snapshot.stockDepotItems.push(JSON.parse(JSON.stringify(fixture.snapshot.stockDepotItems[0])));
  const before = JSON.stringify(fixture.snapshot);
  const result = loadSanalTaksimResolver().resolveExactSourceSelection(
    fixture.snapshot,
    buildD2B1ASelectionTarget(fixture.sor7)
  );
  assert.equal(result.ok, true);
  assert.equal(result.totalSelectableQty, 0);
  assert.equal(JSON.stringify(result.slices), '[]');
  assert.equal(JSON.stringify(fixture.snapshot), before);
});

function buildD2B3UiHarness({ save, targetKey = 'sor7' } = {}) {
  const planning = loadD2APlanningHarness({ save });
  const data = planning.snapshot;
  const target = targetKey === 'sor8' ? planning.sor8 : planning.sor7;
  const order = data.orders.find((row) => row.id === target.orderId);
  const orderLine = order.lines.find((row) => row.id === target.orderLineId);
  const demand = data.planningDemands.find((row) => row.id === target.demandId);
  const demandItem = demand.items.find((row) => row.id === target.itemKey);
  data.montageCards = [{ id: 'mon-d2b3', cardCode: 'MON-D2B3' }];
  const job = {
    key: 'job-d2b3',
    demandId: target.demandId,
    itemKey: target.itemKey,
    montageCardId: 'mon-d2b3',
    montageCardCode: 'MON-D2B3',
    partRows: [{
      key: 'recipe-d2b3', recipeItemId: 'recipe-d2b3', source: 'component',
      refId: 'prc-source-1', code: 'PRC-SOURCE-1', name: 'D2B.3 Parçası',
      unit: 'ADET', qtyPerSet: 1
    }]
  };
  const line = {
    key: 'line-d2b3',
    sourceType: 'SALES_ORDER',
    sourceOrderId: target.orderId,
    sourceOrderNo: order.orderNo,
    sourceLineId: target.orderLineId,
    demandId: target.demandId,
    demandCode: demand.demandCode,
    itemKey: target.itemKey,
    productId: orderLine.productId,
    variationId: orderLine.variationId,
    svrCode: orderLine.variantCode || demandItem.variantCode,
    salCode: 'SAL-000001',
    productName: 'D2B.3 Ürünü',
    qty: String(orderLine.qty),
    readySetQty: 0,
    sendableQty: 0,
    sendableCalculable: true,
    montageJobKey: job.key,
    resolverAvailability: { trusted: true, allocatable: false, readyQty: 0 }
  };
  const planRow = {
    key: 'detail-d2b3',
    jobs: [job],
    isArchived: false,
    sourceTypeKey: 'SALES_ORDER',
    sourceTypeLabel: 'Satış Siparişi',
    sorCodeText: order.orderNo,
    plnCodeText: demand.demandCode,
    productSummary: 'D2B.3 Ürünü',
    requiredQty: 20,
    physicalReadyQty: 0,
    activePlanReservedQty: 0,
    freeReadyQty: 0,
    realMissingQty: 20,
    displayRealMissingQty: 20
  };
  const alerts = [];
  const modals = [];
  let modalCloseCount = 0;
  let renderCount = 0;
  const Router = { currentPage: 'stock' };
  const { exported: StockModule, context } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: planning.db,
    PlanningModule: planning.PlanningModule,
    SanalTaksimResolver: planning.Resolver,
    Router,
    Modal: {
      open: (title, html, options) => modals.push({ title, html, options }),
      close: () => { modalCloseCount += 1; }
    },
    UI: { renderCurrentPage: () => { renderCount += 1; } },
    crypto: nodeCrypto,
    confirm: () => true,
    alert: (message) => alerts.push(String(message))
  });
  StockModule.buildMontageReadyJobCards = () => [job];
  StockModule.getMontageReadyPlanRows = () => [planRow];
  StockModule.getMontageReadyDetailOrderRows = () => [line];
  StockModule.state.workspaceView = 'montage-ready-job-detail';
  StockModule.state.montageReadyDetailKey = planRow.key;
  return {
    ...planning,
    StockModule,
    PlanningModule: planning.PlanningModule,
    context,
    Router,
    data,
    target,
    order,
    demand,
    job,
    line,
    planRow,
    alerts,
    modals,
    get modalCloseCount() { return modalCloseCount; },
    get renderCount() { return renderCount; }
  };
}

function selectD2B3PlanQty(harness, qty) {
  harness.StockModule.state.montageReadyDetailSendSelected = { [harness.line.key]: true };
  harness.StockModule.state.montageReadyDetailSendQtyByRow = { [harness.line.key]: String(qty) };
}

async function submitD2B3PriorityPlan(harness) {
  const initialResult = await harness.StockModule.validateMontageReadyDetailSendPlan();
  if (initialResult !== true && harness.StockModule.state.sanalTaksimPriorityConfirmation) {
    return harness.StockModule.confirmSanalTaksimPriorityConfirmation();
  }
  return initialResult;
}

test('D2B.3 butonu yalniz aktif tekil SALES ve acik borcta gorunur, acilista veri yazmaz', () => {
  const harness = buildD2B3UiHarness();
  const before = JSON.stringify(harness.data);
  let html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(html, /data-sanal-taksim-priority-button="true"/);
  assert.match(html, /Bu Siparişi Öne Al/);
  assert.doesNotMatch(html, /segmentOffset|physicalSegmentId|STOCK\|stock-a/);

  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  const session = harness.StockModule.state.sanalTaksimPrioritySession;
  assert.equal(session.sourceOrderId, harness.target.orderId);
  assert.equal(session.detailKey, harness.planRow.key);
  assert.equal(session.channel, 'MONTAGE');
  assert.equal(session.saving, false);
  assert.equal(harness.StockModule.state.montageReadyDetailSendMode, true);
  assert.equal(harness.getSaveCalls(), 0);
  assert.equal(JSON.stringify(harness.data), before);
  html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(html, /data-sanal-taksim-priority-active="true"/);
  assert.match(html, /Gönderilebilir: 20 takım/);
  assert.match(html, /D2B\.3 Ürünü/);
  assert.match(html, /Montaja 20 takım gönderebilirsiniz\./);
  assert.doesNotMatch(html, /Kullanılabilir Ana Depo miktarı|PRC-SOURCE-1|20 ADET/);
  assert.doesNotMatch(html, /segmentOffset|physicalSegmentId|STOCK\|stock-a/);

  harness.StockModule.cancelMontageReadyDetailSendMode();
  assert.equal(harness.StockModule.state.sanalTaksimPrioritySession, null);
  assert.equal(harness.StockModule.state.montageReadyDetailSendMode, false);
  assert.equal(JSON.stringify(harness.data), before);
});

test('D2B.3 arsiv, pasif veya acik SALES borcu olmayan sipariste buton ve handleri kapatir', async () => {
  const archived = buildD2B3UiHarness();
  archived.planRow.isArchived = true;
  assert.doesNotMatch(archived.StockModule.renderMontageReadyJobDetailLayout(), /data-sanal-taksim-priority-button/);
  assert.equal(archived.StockModule.startSanalTaksimPrioritySession(), false);
  assert.equal(archived.StockModule.state.sanalTaksimPrioritySession, null);
  assert.match(archived.alerts.at(-1), /Arşivlenmiş/);
  selectD2B3PlanQty(archived, 1);
  assert.equal(await archived.StockModule.validateMontageReadyDetailSendPlan(), false);
  assert.equal(archived.data.montageDispatchPlans.length, 0);
  assert.equal(archived.data.sanalTaksimAllocationInstructions.length, 0);
  assert.match(archived.alerts.at(-1), /Arşivlenmiş sipariş/);

  const inactive = buildD2B3UiHarness();
  inactive.order.status = 'Bekliyor';
  assert.doesNotMatch(inactive.StockModule.renderMontageReadyJobDetailLayout(), /data-sanal-taksim-priority-button/);
  assert.equal(inactive.StockModule.startSanalTaksimPrioritySession(), false);
  assert.match(inactive.alerts.at(-1), /aktif ve onaylı/);

  const closed = buildD2B3UiHarness();
  const realResolver = closed.Resolver;
  closed.context.SanalTaksimResolver = {
    ...realResolver,
    resolve: (snapshot, options) => {
      const result = realResolver.resolve(snapshot, options);
      result.debts = result.debts.map((debt) =>
        debt.originOrderId === closed.target.orderId
          ? { ...debt, openDebtQty: 0, allocationEligible: false }
          : debt
      );
      return result;
    }
  };
  assert.doesNotMatch(closed.StockModule.renderMontageReadyJobDetailLayout(), /data-sanal-taksim-priority-button/);
  assert.equal(closed.StockModule.startSanalTaksimPrioritySession(), false);
  assert.match(closed.alerts.at(-1), /açık ve tahsise uygun SALES borcu/);
});

test('D2B.3 basarida tek MGP ve bagli ACTIVE instruction atomik olusur, fiziksel veriler degismez', async () => {
  const harness = buildD2B3UiHarness();
  const beforeResolved = harness.Resolver.resolve(harness.data);
  const beforeTargetAllocation = getD2AOrderAllocationQty(beforeResolved, harness.sor7.orderId);
  const beforeSourceAllocation = getD2AOrderAllocationQty(beforeResolved, harness.sor8.orderId);
  const protectedBefore = {
    stockDepotItems: JSON.stringify(harness.data.stockDepotItems),
    orders: JSON.stringify(harness.data.orders),
    planningDemands: JSON.stringify(harness.data.planningDemands),
    workOrders: JSON.stringify(harness.data.workOrders),
    workOrderTransactions: JSON.stringify(harness.data.workOrderTransactions),
    stockMovements: JSON.stringify(harness.data.stock_movements)
  };
  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  selectD2B3PlanQty(harness, 15);
  const saved = await harness.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(saved, true, harness.alerts.join(' | '));
  assert.equal(harness.getSaveCalls(), 1);
  assert.equal(JSON.stringify(harness.saveOptions), JSON.stringify([{ conflictStrategy: 'fail' }]));
  assert.equal(harness.data.montageDispatchPlans.length, 1);
  assert.equal(harness.data.sanalTaksimAllocationInstructions.length, 1);
  const plan = harness.data.montageDispatchPlans[0];
  const instruction = harness.data.sanalTaksimAllocationInstructions[0];
  assert.equal(plan.status, 'DRAFT');
  assert.equal(instruction.status, 'ACTIVE');
  assert.equal(plan.exactReservations.length, 1);
  assert.equal(plan.exactReservations[0].instructionId, instruction.id);
  assert.equal(plan.exactReservations[0].instructionSliceKey, instruction.slices[0].sliceKey);
  assert.equal(instruction.slices[0].planId, plan.id);
  assert.equal(instruction.slices[0].reservationKey, plan.exactReservations[0].reservationKey);
  assert.equal(harness.StockModule.state.sanalTaksimPrioritySession, null);
  assert.equal(harness.StockModule.state.montageReadyDetailSendMode, false);
  assert.match(harness.alerts.at(-1), /planı ve bağlı tahsis talimatı kaydedildi/);
  const afterResolved = harness.Resolver.resolve(harness.data);
  assert.ok(getD2AOrderAllocationQty(afterResolved, harness.sor7.orderId) > beforeTargetAllocation);
  assert.ok(getD2AOrderAllocationQty(afterResolved, harness.sor8.orderId) < beforeSourceAllocation);
  assert.equal(JSON.stringify(harness.data.stockDepotItems), protectedBefore.stockDepotItems);
  assert.equal(JSON.stringify(harness.data.orders), protectedBefore.orders);
  assert.equal(JSON.stringify(harness.data.planningDemands), protectedBefore.planningDemands);
  assert.equal(JSON.stringify(harness.data.workOrders), protectedBefore.workOrders);
  assert.equal(JSON.stringify(harness.data.workOrderTransactions), protectedBefore.workOrderTransactions);
  assert.equal(JSON.stringify(harness.data.stock_movements), protectedBefore.stockMovements);
});

test('D2B.3 ok:false exception ve conflictte rollback yapar, modu acik ve basari mesajini kapali tutar', async () => {
  const cases = [
    { name: 'ok-false', save: async () => ({ ok: false, message: 'D2B.3 kayıt reddi' }) },
    { name: 'exception', save: async () => { throw new Error('D2B.3 kayıt exception'); } },
    { name: 'conflict', save: async () => ({ ok: false, conflict: true, code: 'save_conflict' }) }
  ];
  for (const entry of cases) {
    const harness = buildD2B3UiHarness({ save: entry.save });
    const beforePlans = JSON.stringify(harness.data.montageDispatchPlans);
    const beforeInstructions = JSON.stringify(harness.data.sanalTaksimAllocationInstructions);
    assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true, entry.name);
    selectD2B3PlanQty(harness, 5);
    const saved = await harness.StockModule.validateMontageReadyDetailSendPlan();
    assert.equal(saved, false, entry.name);
    assert.ok(harness.StockModule.state.sanalTaksimPrioritySession, entry.name);
    assert.equal(harness.StockModule.state.sanalTaksimPrioritySession.saving, false, entry.name);
    assert.equal(harness.StockModule.state.montageReadyDetailSendMode, true, entry.name);
    assert.equal(JSON.stringify(harness.data.montageDispatchPlans), beforePlans, entry.name);
    assert.equal(JSON.stringify(harness.data.sanalTaksimAllocationInstructions), beforeInstructions, entry.name);
    assert.equal(harness.alerts.some((message) => /planı ve bağlı tahsis talimatı kaydedildi/.test(message)), false, entry.name);
  }
});

test('D2B.3 saving kilidi cift tikta mukerrer kaydi engeller ve tum cikislarda runtime modu temizler', async () => {
  let releaseSave;
  const saveGate = new Promise((resolve) => { releaseSave = resolve; });
  const harness = buildD2B3UiHarness({ save: async () => saveGate });
  harness.StockModule.startSanalTaksimPrioritySession();
  selectD2B3PlanQty(harness, 5);
  const first = harness.StockModule.validateMontageReadyDetailSendPlan();
  const second = await harness.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(second, false);
  assert.equal(harness.StockModule.state.sanalTaksimPrioritySession.saving, true);
  releaseSave({ ok: true });
  assert.equal(await first, true);
  assert.equal(harness.getSaveCalls(), 1);
  assert.equal(harness.data.montageDispatchPlans.length, 1);
  assert.equal(harness.data.sanalTaksimAllocationInstructions.length, 1);

  const exits = buildD2B3UiHarness();
  exits.StockModule.startSanalTaksimPrioritySession();
  exits.StockModule.cancelMontageReadyDetailSendMode();
  assert.equal(exits.StockModule.state.sanalTaksimPrioritySession, null);
  exits.StockModule.state.workspaceView = 'montage-ready-job-detail';
  exits.StockModule.state.montageReadyDetailKey = exits.planRow.key;
  exits.StockModule.startSanalTaksimPrioritySession();
  exits.StockModule.backToMontageReadyJobs();
  assert.equal(exits.StockModule.state.sanalTaksimPrioritySession, null);
  exits.StockModule.state.workspaceView = 'montage-ready-job-detail';
  exits.StockModule.state.montageReadyDetailKey = exits.planRow.key;
  exits.StockModule.startSanalTaksimPrioritySession();
  exits.StockModule.openSalesShipmentPlanningMode();
  assert.equal(exits.StockModule.state.sanalTaksimPrioritySession, null);
  exits.StockModule.resetSalesShipmentPlanningDraft();
  exits.StockModule.state.workspaceView = 'montage-ready-job-detail';
  exits.StockModule.state.montageReadyDetailKey = exits.planRow.key;
  exits.StockModule.startSanalTaksimPrioritySession();
  exits.StockModule.openWorkspace('inventory');
  assert.equal(exits.StockModule.state.sanalTaksimPrioritySession, null);

  const appCoreSource = fs.readFileSync(path.join(__dirname, '..', 'src/core/app-core.js'), 'utf8');
  assert.match(appCoreSource, /currentPage === 'stock' && targetPage !== 'stock'[\s\S]*clearSanalTaksimPrioritySession/);
  assert.match(appCoreSource, /Router\.currentPage === 'stock'[\s\S]*clearSanalTaksimPrioritySession[\s\S]*workspaceView = 'menu'/);
});

test('Montaj gonderim planlari siparis ve ilgili PLN lineage ile filtrelenir, yabanci islemler fail-closed kalir', async () => {
  const owner = buildD2B3UiHarness({ targetKey: 'sor7' });
  const ownerOrderLine = owner.order.lines.find((line) => line.id === owner.sor7.orderLineId);
  Object.assign(ownerOrderLine, {
    productName: 'UI Plan Product', productCode: 'SAL-UI-001', variantCode: 'SVR-UI-001',
    selectedDiameter: '40', accessoryColor: 'P3 TEST', tubeColor: 'P3 TEST',
    plexiColor: 'SEFFAF TEST', bubble: 'VAR', lowerTubeLength: 'STANDART'
  });
  const plan19 = buildD2B1AMontagePlan(owner.data, owner.sor7, {
    id: 'mgp-000019', status: 'DRAFT', qty: 3, start: 0
  });
  plan19.planNo = 'MGP-000019';
  plan19.createdAt = '2026-08-03T10:00:00.000Z';
  const foreignActive = buildD2B1AMontagePlan(owner.data, owner.sor8, {
    id: 'mgp-foreign-active', status: 'DRAFT', qty: 2, start: 3
  });
  foreignActive.planNo = 'MGP-FOREIGN-ACTIVE';
  foreignActive.createdAt = '2026-08-03T09:00:00.000Z';
  const ownerPast = buildD2B1AMontagePlan(owner.data, owner.sor7, {
    id: 'mgp-owner-past', status: 'DISPATCHED_TO_MONTAGE', qty: 1, start: 5
  });
  ownerPast.planNo = 'MGP-OWNER-PAST';
  ownerPast.createdAt = '2026-08-02T10:00:00.000Z';
  const foreignPast = buildD2B1AMontagePlan(owner.data, owner.sor8, {
    id: 'mgp-foreign-past', status: 'DISPATCHED_TO_MONTAGE', qty: 1, start: 6
  });
  foreignPast.planNo = 'MGP-FOREIGN-PAST';
  foreignPast.createdAt = '2026-08-02T09:00:00.000Z';
  const mismatchedPln = buildD2B1AMontagePlan(owner.data, owner.sor8, {
    id: 'mgp-wrong-pln', status: 'DRAFT', qty: 1, start: 7
  });
  mismatchedPln.planNo = 'MGP-WRONG-PLN';
  mismatchedPln.items[0].sourceOrderId = owner.sor7.orderId;
  mismatchedPln.items[0].sourceOrderNo = owner.order.orderNo;
  owner.data.montageDispatchPlans.push(plan19, foreignActive, ownerPast, foreignPast, mismatchedPln);
  const ownerPastShipment = {
    id: 'mgs-owner-past', shipmentNo: 'MGS-OWNER-PAST', planId: ownerPast.id,
    planNo: ownerPast.planNo, status: 'IN_TRANSIT', items: JSON.parse(JSON.stringify(ownerPast.items))
  };
  owner.data.montageDispatchShipments.push(ownerPastShipment);

  const ownerModals = [];
  owner.context.Modal.open = (title, html) => ownerModals.push({ title, html });
  const ownerDetailHtml = owner.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(ownerDetailHtml, /data-montage-dispatch-plans-button="true"[^>]*data-has-owned-plans="true"[^>]*data-has-active-plans="true"[^>]*data-has-dispatched-history="true"[^>]*openMontageDispatchPlans\('active'\)/);
  owner.StockModule.openMontageDispatchPlans('active');
  assert.match(ownerModals.at(-1).html, /MGP-000019/);
  assert.match(ownerModals.at(-1).html, /data-montage-dispatch-plan-list="true"/);
  assert.match(ownerModals.at(-1).html, /data-montage-dispatch-plan-row="mgp-000019"/);
  assert.doesNotMatch(ownerModals.at(-1).html, /<table|<thead|<tbody/);
  assert.match(ownerModals.at(-1).html, /UI Plan Product[\s\S]*SVR-UI-001[\s\S]*SAL-UI-001/);
  assert.match(ownerModals.at(-1).html, /data-montage-plan-field="diameter" title="40"/);
  assert.match(ownerModals.at(-1).html, /data-montage-plan-field="accessory-color" title="P3 TEST"/);
  assert.match(ownerModals.at(-1).html, /data-montage-plan-field="tube-color" title="P3 TEST"/);
  assert.match(ownerModals.at(-1).html, /data-montage-plan-field="plexi-color" title="SEFFAF TEST"/);
  assert.match(ownerModals.at(-1).html, /data-montage-plan-field="bubble" title="VAR"/);
  assert.match(ownerModals.at(-1).html, /data-montage-plan-field="lower-tube-length" title="STANDART"/);
  assert.match(ownerModals.at(-1).html, /openMontageDispatchPlanDetail\('mgp-000019'\)/);
  assert.match(ownerModals.at(-1).html, /dispatchMontagePlanToMontage\('mgp-000019'\)/);
  assert.match(ownerModals.at(-1).html, /cancelMontageDispatchPlan\('mgp-000019'\)/);
  assert.doesNotMatch(ownerModals.at(-1).html, /MGP-FOREIGN-ACTIVE|MGP-WRONG-PLN/);
  owner.StockModule.openMontageDispatchPlans('dispatched');
  assert.match(ownerModals.at(-1).html, /MGP-OWNER-PAST/);
  assert.doesNotMatch(ownerModals.at(-1).html, /MGP-FOREIGN-PAST/);

  const foreignView = buildD2B3UiHarness({ targetKey: 'sor8' });
  foreignView.data.montageDispatchPlans.push(
    JSON.parse(JSON.stringify(plan19)),
    JSON.parse(JSON.stringify(ownerPast)),
    JSON.parse(JSON.stringify(mismatchedPln))
  );
  const foreignModals = [];
  let confirmCalls = 0;
  foreignView.context.Modal.open = (title, html) => foreignModals.push({ title, html });
  foreignView.context.confirm = () => { confirmCalls += 1; return true; };
  const foreignDetailHtml = foreignView.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(foreignDetailHtml, /data-montage-dispatch-plans-button="true"[^>]*data-has-owned-plans="false"[^>]*disabled/);
  foreignView.StockModule.openMontageDispatchPlans('active');
  assert.doesNotMatch(foreignModals.at(-1).html, /MGP-000019|MGP-WRONG-PLN/);
  foreignView.StockModule.openMontageDispatchPlans('dispatched');
  assert.doesNotMatch(foreignModals.at(-1).html, /MGP-OWNER-PAST/);

  const beforeDirectAttempts = JSON.stringify(foreignView.data);
  const modalCountBeforeDirectAttempts = foreignModals.length;
  foreignView.StockModule.openMontageDispatchPlanDetail(plan19.id);
  await foreignView.StockModule.cancelMontageDispatchPlan(plan19.id);
  await foreignView.StockModule.dispatchMontagePlanToMontage(plan19.id);
  assert.equal(foreignModals.length, modalCountBeforeDirectAttempts);
  assert.equal(confirmCalls, 0);
  assert.equal(JSON.stringify(foreignView.data), beforeDirectAttempts);
  assert.equal(foreignView.alerts.filter((message) => /sipari.+ detay.+na ait de.+ildir/.test(message)).length, 3);

  const pastOnly = buildD2B3UiHarness({ targetKey: 'sor7' });
  pastOnly.data.montageDispatchPlans.push(JSON.parse(JSON.stringify(ownerPast)));
  pastOnly.data.montageDispatchShipments.push(JSON.parse(JSON.stringify(ownerPastShipment)));
  assert.match(
    pastOnly.StockModule.renderMontageReadyJobDetailLayout(),
    /data-montage-dispatch-plans-button="true"[^>]*data-has-owned-plans="true"[^>]*data-has-active-plans="false"[^>]*data-has-dispatched-history="true"[^>]*openMontageDispatchPlans\('dispatched'\)/
  );

  const draftOnly = buildD2B3UiHarness({ targetKey: 'sor7' });
  draftOnly.data.montageDispatchPlans.push(JSON.parse(JSON.stringify(plan19)));
  assert.match(
    draftOnly.StockModule.renderMontageReadyJobDetailLayout(),
    /data-montage-dispatch-plans-button="true"[^>]*data-has-owned-plans="true"[^>]*data-has-active-plans="true"[^>]*data-has-dispatched-history="false"[^>]*openMontageDispatchPlans\('active'\)/
  );

  const noPlanOrHistory = buildD2B3UiHarness({ targetKey: 'sor7' });
  assert.match(
    noPlanOrHistory.StockModule.renderMontageReadyJobDetailLayout(),
    /data-montage-dispatch-plans-button="true"[^>]*data-has-owned-plans="false"[^>]*data-has-active-plans="false"[^>]*data-has-dispatched-history="false"[^>]*disabled/
  );

  const dispatchedWithoutShipment = buildD2B3UiHarness({ targetKey: 'sor7' });
  dispatchedWithoutShipment.data.montageDispatchPlans.push(JSON.parse(JSON.stringify(ownerPast)));
  assert.match(
    dispatchedWithoutShipment.StockModule.renderMontageReadyJobDetailLayout(),
    /data-montage-dispatch-plans-button="true"[^>]*data-has-owned-plans="false"[^>]*data-has-active-plans="false"[^>]*data-has-dispatched-history="false"[^>]*disabled/
  );

  const cancelledOnly = buildD2B3UiHarness({ targetKey: 'sor7' });
  const cancelledPlan = JSON.parse(JSON.stringify(plan19));
  cancelledPlan.status = 'CANCELLED';
  cancelledOnly.data.montageDispatchPlans.push(cancelledPlan);
  assert.match(
    cancelledOnly.StockModule.renderMontageReadyJobDetailLayout(),
    /data-montage-dispatch-plans-button="true"[^>]*data-has-owned-plans="false"[^>]*disabled/
  );
});

async function buildD2C1AUiHarness({ save } = {}) {
  const harness = buildD2B3UiHarness({ save });
  const stockRow = harness.data.stockDepotItems.find((row) => row.id === 'stock-a');
  Object.assign(stockRow, { qty: 10, quantity: 10, amount: 10 });
  const sourceBundle = buildD2B2AAtomicBundle(harness, harness.sor8, {
    qty: 10,
    planId: 'mgp-d2c1a-source',
    planNo: 'MGP-D2C1A-SOURCE',
    instructionId: '71717171-7171-4171-8171-717171717171',
    instructionCode: 'STAI-000071',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2c1a-source|PRC-SOURCE-1',
    sliceKey: 'd2c1a-source-slice'
  });
  const sourceCreated = await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(sourceBundle);
  assert.equal(sourceCreated.ok, true, JSON.stringify(sourceCreated));
  return { ...harness, sourceBundle, sourceCreated };
}

async function buildD2C1APartialUiHarness({ save } = {}) {
  const harness = buildD2B3UiHarness({ save, targetKey: 'sor8' });
  alignD2C1BTargetProduct(harness.data, harness.sor7, harness.sor8);
  const targetLine = harness.data.orders.find((row) => row.id === harness.sor8.orderId)
    .lines.find((row) => row.id === harness.sor8.orderLineId);
  Object.assign(harness.line, {
    productId: targetLine.productId,
    variationId: targetLine.variationId,
    svrCode: targetLine.variantCode
  });
  const sourceBundle = buildD2B2AAtomicBundle(harness, harness.sor7, {
    qty: 15,
    planId: 'mgp-d2c1a-partial-source-15',
    planNo: 'MGP-D2C1A-PARTIAL-SOURCE-15',
    instructionId: '61616161-6161-4161-8161-616161616161',
    instructionCode: 'STAI-000061',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2c1a-partial-source-15|PRC-SOURCE-1',
    sliceKey: 'd2c1a-partial-source-15-slice'
  });
  const sourceCreated = await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(sourceBundle);
  assert.equal(sourceCreated.ok, true, JSON.stringify(sourceCreated));
  return { ...harness, sourceBundle, sourceCreated };
}

function buildD2C1AReadRequest(harness, overrides = {}) {
  return {
    sourceOrderId: harness.target.orderId,
    sourceLineId: harness.target.orderLineId,
    demandId: harness.target.demandId,
    itemKey: harness.target.itemKey,
    requirements: [{
      prcId: 'prc-source-1',
      prcCode: 'PRC-SOURCE-1',
      unit: overrides.unit || 'ADET',
      qtyPerSet: 1
    }]
  };
}

test('D2C.1A 15ten 2ye tam kaynak iptali ve kismi hedef tahsisi tek strict save ile atomiktir', async () => {
  const harness = await buildD2C1APartialUiHarness();
  const request = buildD2C1AReadRequest(harness);
  const oldSelection = harness.Resolver.resolveDraftPlanBoundRebindSelection(harness.data, request);
  assert.equal(oldSelection.ok, true);
  assert.equal(oldSelection.packages.length, 0);
  const beforeRead = JSON.stringify(harness.data);
  const partialSelection = harness.PlanningModule.resolveSanalTaksimDraftWholePlanPartialCandidates(
    harness.PlanningModule.buildSanalTaksimSnapshot(),
    { ...request, requestedTargetQty: 2 }
  );
  assert.equal(partialSelection.ok, true, JSON.stringify(partialSelection));
  assert.equal(partialSelection.candidates.length, 1);
  assert.deepEqual({
    sourcePlanQty: partialSelection.candidates[0].sourcePlanQty,
    requestedTargetQty: partialSelection.candidates[0].requestedTargetQty,
    cancelWholeSourcePlan: partialSelection.candidates[0].cancelWholeSourcePlan,
    reservationQty: partialSelection.candidates[0].reservations.reduce((sum, row) => sum + Number(row.qty), 0)
  }, { sourcePlanQty: 15, requestedTargetQty: 2, cancelWholeSourcePlan: true, reservationQty: 15 });
  assert.equal(JSON.stringify(harness.data), beforeRead);

  const physicalBefore = JSON.stringify({
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements,
    workOrderTransactions: harness.data.workOrderTransactions
  });
  const beforeState = { data: JSON.parse(JSON.stringify(harness.data)) };
  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  selectD2B3PlanQty(harness, 2);
  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  assert.match(harness.modals.at(-1).html,
    /Bu malzeme SOR-000007 kodlu sipariş için 15 takımlık montaj planına ayrılmıştır\./);
  assert.match(harness.modals.at(-1).html, /mevcut montaj planının tamamı iptal edilecektir/);
  assert.match(harness.modals.at(-1).html, /Kalan miktar için yeniden montaj planı oluşturmanız gerekir/);
  assert.match(harness.modals.at(-1).html, />Devam Et</);
  assert.match(harness.modals.at(-1).html, />Vazgeç</);
  assert.equal(await harness.StockModule.confirmSanalTaksimPriorityConfirmation(), true, harness.alerts.join(' | '));

  const sourcePlan = harness.data.montageDispatchPlans.find((row) => row.id === harness.sourceBundle.plan.id);
  const targetPlans = harness.data.montageDispatchPlans.filter((row) => row.rebindAudit?.role === 'TARGET');
  const sourceInstruction = harness.data.sanalTaksimAllocationInstructions
    .find((row) => row.id === harness.sourceBundle.instructionRequests[0].id);
  const targetInstructions = harness.data.sanalTaksimAllocationInstructions
    .filter((row) => row.rebindAudit?.role === 'TARGET');
  assert.equal(sourcePlan.status, 'CANCELLED');
  assert.equal(sourcePlan.items[0].plannedQty, 15);
  assert.equal(sourceInstruction.status, 'CANCELLED');
  assert.equal(targetPlans.length, 1);
  assert.equal(targetPlans[0].items[0].plannedQty, 2);
  assert.equal(targetPlans[0].exactReservations.reduce((sum, row) => sum + Number(row.qty), 0), 2);
  assert.equal(targetPlans[0].exactReservations[0].segmentOffsetStart, 0);
  assert.equal(targetPlans[0].exactReservations[0].segmentOffsetEnd, 2);
  assert.equal(targetPlans[0].rebindAudit.contractVersion, 2);
  assert.equal(targetPlans[0].rebindAudit.sourcePlanQty, 15);
  assert.equal(targetPlans[0].rebindAudit.requestedTargetQty, 2);
  assert.equal(targetPlans[0].rebindAudit.releasedSetQty, 13);
  assert.equal(targetInstructions.length, 1);
  assert.equal(targetInstructions[0].status, 'ACTIVE');
  assert.equal(harness.data.montageDispatchPlans.some((row) =>
    row.status === 'DRAFT' && row.items?.[0]?.sourceOrderId === harness.sor7.orderId
      && Number(row.items?.[0]?.plannedQty) === 13), false);
  assert.equal(harness.getSaveCalls(), 2);
  assert.equal(harness.saveOptions[1]?.conflictStrategy, 'fail');
  assert.equal(JSON.stringify({
    stockDepotItems: harness.data.stockDepotItems,
    stock_movements: harness.data.stock_movements,
    workOrderTransactions: harness.data.workOrderTransactions
  }), physicalBefore);
  const resolved = harness.Resolver.resolve(harness.data);
  const fixed = resolved.allocations.filter((row) => row.fixedByExactHold === true);
  assert.equal(fixed.some((row) => row.instructionId === sourceInstruction.id), false);
  assert.equal(fixed.filter((row) => targetInstructions.some((instruction) => instruction.id === row.instructionId))
    .reduce((sum, row) => sum + Number(row.qty), 0), 2);
  assert.equal(harness.alerts.at(-1),
    'Sipariş öne alındı. 2 takım bu sipariş için ayrıldı. SOR-000007 için oluşturulmuş 15 takımlık montaj planı iptal edildi.');
  const server = require('../serve.js');
  assert.equal(server.isSanalTaksimDraftPlanBoundAtomicRebind(beforeState, { data: harness.data }), true);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(
    beforeState, { data: harness.data }
  ), []);
});

test('D2C.1A 15ten 2ye onaydan vazgec kaynak ve hedef verisini degistirmez', async () => {
  const harness = await buildD2C1APartialUiHarness();
  const before = JSON.stringify(harness.data);
  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  selectD2B3PlanQty(harness, 2);
  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  assert.ok(harness.StockModule.state.sanalTaksimPriorityConfirmation);
  assert.equal(harness.StockModule.cancelSanalTaksimPriorityConfirmation(), false);
  assert.equal(harness.StockModule.state.sanalTaksimPriorityConfirmation, null);
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.getSaveCalls(), 1);
});

test('D2C.1A 15ten 2ye hedef kurulum hatasi kaynak iptalini ve yeni hedefi geri alir', async () => {
  const harness = await buildD2C1APartialUiHarness();
  const before = JSON.stringify(harness.data);
  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  selectD2B3PlanQty(harness, 2);
  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  const originalBuild = harness.StockModule.buildSanalTaksimPriorityPlanBoundBundle;
  harness.StockModule.buildSanalTaksimPriorityPlanBoundBundle = (args) => {
    const result = originalBuild(args);
    if (result?.ok) result.bundle.instructionRequests[0].slices[0].segmentOffsetEnd += 1;
    return result;
  };
  assert.equal(await harness.StockModule.confirmSanalTaksimPriorityConfirmation(), false);
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.getSaveCalls(), 1);
  assert.equal(harness.data.montageDispatchPlans[0].status, 'DRAFT');
  assert.equal(harness.data.sanalTaksimAllocationInstructions[0].status, 'ACTIVE');
});

test('D2C.1A 15ten 2ye save hatasi ve conflictte iki koleksiyonu birlikte geri alir', async () => {
  for (const entry of [
    { name: 'ok-false', result: { ok: false, code: 'partial_rebind_rejected' } },
    { name: 'exception', error: new Error('partial_rebind_exception') },
    { name: 'conflict', result: { ok: false, conflict: true, code: 'save_conflict' } }
  ]) {
    const harness = await buildD2C1APartialUiHarness({
      save: async (_options, call) => {
        if (call === 1) return { ok: true };
        if (entry.error) throw entry.error;
        return entry.result;
      }
    });
    const before = JSON.stringify(harness.data);
    harness.StockModule.startSanalTaksimPrioritySession();
    selectD2B3PlanQty(harness, 2);
    assert.equal(await submitD2B3PriorityPlan(harness), false, entry.name);
    assert.equal(harness.getSaveCalls(), 2, entry.name);
    assert.equal(JSON.stringify(harness.data), before, entry.name);
    assert.equal(harness.data.montageDispatchPlans[0].status, 'DRAFT', entry.name);
    assert.equal(harness.data.sanalTaksimAllocationInstructions[0].status, 'ACTIVE', entry.name);
  }
});

test('D2C.1A 15ten 2ye birden fazla kaynak planda fail-closed ve mutasyonsuz kalir', async () => {
  const harness = buildD2B3UiHarness({ targetKey: 'sor8' });
  alignD2C1BTargetProduct(harness.data, harness.sor7, harness.sor8);
  const targetLine = harness.data.orders.find((row) => row.id === harness.sor8.orderId)
    .lines.find((row) => row.id === harness.sor8.orderLineId);
  Object.assign(harness.line, {
    productId: targetLine.productId,
    variationId: targetLine.variationId,
    svrCode: targetLine.variantCode
  });
  const first = buildD2B2AAtomicBundle(harness, harness.sor7, {
    qty: 8, start: 0, planId: 'mgp-partial-ambiguous-1', planNo: 'MGP-PARTIAL-AMBIGUOUS-1',
    instructionId: '62626262-6262-4262-8262-626262626261', instructionCode: 'STAI-000062',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-partial-ambiguous-1|PRC-SOURCE-1', sliceKey: 'partial-ambiguous-slice-1'
  });
  const second = buildD2B2AAtomicBundle(harness, harness.sor7, {
    qty: 7, start: 8, planId: 'mgp-partial-ambiguous-2', planNo: 'MGP-PARTIAL-AMBIGUOUS-2',
    instructionId: '62626262-6262-4262-8262-626262626262', instructionCode: 'STAI-000063',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-partial-ambiguous-2|PRC-SOURCE-1', sliceKey: 'partial-ambiguous-slice-2'
  });
  assert.equal((await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(first)).ok, true);
  assert.equal((await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(second)).ok, true);
  const before = JSON.stringify(harness.data);
  harness.StockModule.startSanalTaksimPrioritySession();
  selectD2B3PlanQty(harness, 2);
  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  assert.equal(harness.StockModule.state.sanalTaksimPriorityConfirmation, null);
  assert.equal(JSON.stringify(harness.data), before);
  assert.equal(harness.getSaveCalls(), 2);
  assert.equal(harness.alerts.at(-1),
    'Bu sipariş için güvenli şekilde kullanılabilecek tek bir kaynak belirlenemedi. İşlem yapılmadı.');
});

test('D2C.1A 15ten 2ye eksik cakisan veya belirsiz exact kanitta aday uretmez', async () => {
  const mutations = [
    (harness) => { harness.data.sanalTaksimAllocationInstructions[0].slices = []; },
    (harness) => {
      harness.data.montageDispatchPlans[0].exactReservations.push({
        ...JSON.parse(JSON.stringify(harness.data.montageDispatchPlans[0].exactReservations[0])),
        reservationKey: 'duplicate-overlap-reservation'
      });
    },
    (harness) => {
      harness.data.stockDepotItems.push({
        ...JSON.parse(JSON.stringify(harness.data.stockDepotItems[0]))
      });
    },
    (harness) => { harness.data.montageDispatchPlans[0].items[0].variantCode = 'SVR-MISMATCH'; }
  ];
  for (const mutate of mutations) {
    const harness = await buildD2C1APartialUiHarness();
    mutate(harness);
    const before = JSON.stringify(harness.data);
    const selection = harness.PlanningModule.resolveSanalTaksimDraftWholePlanPartialCandidates(
      harness.PlanningModule.buildSanalTaksimSnapshot(),
      { ...buildD2C1AReadRequest(harness), requestedTargetQty: 2 }
    );
    assert.equal(selection.ok === false || selection.candidates.length === 0, true, JSON.stringify(selection));
    assert.equal(JSON.stringify(harness.data), before);
    assert.equal(harness.getSaveCalls(), 1);
  }
});

test('D2C.1A mevcut 15ten 15e tam paket sozlesmesini degistirmeden korur', async () => {
  const harness = loadD2APlanningHarness();
  harness.snapshot.orders.find((row) => row.id === harness.sor8.orderId)
    .lines.find((row) => row.id === harness.sor8.orderLineId).qty = 15;
  harness.snapshot.planningDemands.find((row) => row.id === harness.sor8.demandId)
    .items.find((row) => row.id === harness.sor8.itemKey).qty = 15;
  harness.snapshot.workOrders.find((row) => row.id === harness.sor8.workOrderId)
    .lines.forEach((row) => { row.targetQty = 15; });
  const sourceBundle = buildD2B2AAtomicBundle(harness, harness.sor8, {
    qty: 15, planId: 'mgp-d2c1a-full-15-source', planNo: 'MGP-D2C1A-FULL-15-SOURCE',
    instructionId: '63636363-6363-4363-8363-636363636361', instructionCode: 'STAI-000064',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2c1a-full-15-source|PRC-SOURCE-1', sliceKey: 'full-15-source-slice'
  });
  assert.equal((await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(sourceBundle)).ok, true);
  const targetBundle = buildD2B2AAtomicBundle(harness, harness.sor7, {
    qty: 15, planId: 'mgp-d2c1a-full-15-target', planNo: 'MGP-D2C1A-FULL-15-TARGET',
    instructionId: '63636363-6363-4363-8363-636363636362', instructionCode: 'STAI-000065',
    idempotencyKey: 'D2C1A_REBIND_FULL_15_TARGET', sliceKey: 'full-15-target-slice'
  });
  targetBundle.sourceRebind = {
    sourcePlanId: sourceBundle.plan.id,
    rebindKey: `D2C1A_REBIND|${sourceBundle.plan.id}|${targetBundle.plan.id}|full-15-test`,
    reason: 'Mevcut tam paket 15ten 15e regresyon testi'
  };
  const result = await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(targetBundle);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.sourcePlan.status, 'CANCELLED');
  assert.equal(result.plan.items[0].plannedQty, 15);
  assert.equal(result.rebindAudit.contractVersion, 1);
  assert.match(result.rebindAudit.rebindKey, /^D2C1A_REBIND\|/);
});

test('D2C.1B-1 birden fazla exact TAM IN_TRANSIT MGS adayini salt okunur aday listesinde tutar', () => {
  const fixture = buildD2AAllocationSnapshot();
  alignD2C1BTargetProduct(fixture.snapshot, fixture.sor8, fixture.sor7);
  const first = buildD2C1BInTransitMgs(fixture.snapshot, fixture.sor8, { qty: 4, start: 0, suffix: '1' });
  const second = buildD2C1BInTransitMgs(fixture.snapshot, fixture.sor8, { qty: 4, start: 4, suffix: '2' });
  fixture.snapshot.montageDispatchPlans = [first.plan, second.plan];
  fixture.snapshot.montageDispatchShipments = [first.shipment, second.shipment];
  const before = JSON.stringify(fixture.snapshot);
  const Resolver = loadSanalTaksimResolver();
  const selection = Resolver.resolveInTransitMgsOperationalRebindSelection(fixture.snapshot, {
    sourceOrderId: fixture.sor7.orderId,
    sourceLineId: fixture.sor7.orderLineId,
    demandId: fixture.sor7.demandId,
    itemKey: fixture.sor7.itemKey
  });
  assert.equal(selection.ok, true, JSON.stringify(selection));
  assert.deepEqual(Array.from(selection.candidates.map((row) => row.shipmentId)), [first.shipment.id, second.shipment.id]);
  assert.equal(selection.candidates.every((row) => row.setQty === 4 && row.readOnly === true), true);
  assert.equal(JSON.stringify(fixture.snapshot), before);

  first.plan.items[0].plannedQty = 3;
  const partial = Resolver.resolveInTransitMgsOperationalRebindSelection(fixture.snapshot, {
    sourceOrderId: fixture.sor7.orderId,
    sourceLineId: fixture.sor7.orderLineId,
    demandId: fixture.sor7.demandId,
    itemKey: fixture.sor7.itemKey
  });
  assert.equal((Array.isArray(partial.candidates) ? partial.candidates : [])
    .some((row) => row.shipmentId === first.shipment.id), false);
});

test('D2C.1B-1 server tek append-only eventi kabul eder, is govdesi ve RECEIVED gecisini fail-closed korur', () => {
  const fixture = buildD2AAllocationSnapshot();
  alignD2C1BTargetProduct(fixture.snapshot, fixture.sor8, fixture.sor7);
  const lifecycle = buildD2C1BInTransitMgs(fixture.snapshot, fixture.sor8, { qty: 4, start: 0, suffix: 'server' });
  fixture.snapshot.montageDispatchPlans = [lifecycle.plan];
  fixture.snapshot.montageDispatchShipments = [lifecycle.shipment];
  const Resolver = loadSanalTaksimResolver();
  const target = {
    sourceOrderId: fixture.sor7.orderId,
    sourceLineId: fixture.sor7.orderLineId,
    demandId: fixture.sor7.demandId,
    itemKey: fixture.sor7.itemKey
  };
  const selection = Resolver.resolveInTransitMgsOperationalRebindSelection(fixture.snapshot, target);
  assert.equal(selection.candidates.length, 1, JSON.stringify(selection));
  const current = { meta: { revision: 7 }, data: JSON.parse(JSON.stringify(fixture.snapshot)) };
  const incoming = JSON.parse(JSON.stringify(current));
  incoming.meta.revision = 8;
  incoming.meta.updated_at = '2026-08-05T10:00:01.000Z';
  incoming.data.montageDispatchShipments[0].operationalRebindEvents = [buildD2C1BEvent(selection.candidates[0], '3')];
  incoming.data.montageDispatchShipments[0].updatedAt = '2026-08-05T10:00:01.000Z';
  incoming.data.montageDispatchShipments[0].revision = 2;
  const server = require('../serve.js');
  assert.equal(server.isSanalTaksimInTransitMgsOperationalRebind(current, incoming), true);
  assert.deepEqual(server.validateSanalTaksimInTransitMgsOperationalRebindTransitions(current, incoming), []);

  const bodyMutation = JSON.parse(JSON.stringify(incoming));
  bodyMutation.data.montageDispatchShipments[0].items[0].shippedQty = 3;
  assert.ok(server.validateSanalTaksimInTransitMgsOperationalRebindTransitions(current, bodyMutation).length > 0);
  const secondEvent = JSON.parse(JSON.stringify(incoming));
  secondEvent.data.montageDispatchShipments[0].operationalRebindEvents.push({
    ...secondEvent.data.montageDispatchShipments[0].operationalRebindEvents[0],
    eventId: '81818181-8181-4181-8181-000000000004'
  });
  assert.ok(server.validateSanalTaksimInTransitMgsOperationalRebindTransitions(current, secondEvent).length > 0);
  const receipt = JSON.parse(JSON.stringify(incoming));
  receipt.data.montageDispatchShipments[0].status = 'RECEIVED';
  receipt.data.montageDispatchShipments[0].receivedAt = '2026-08-05T11:00:00.000Z';
  assert.ok(server.validateSanalTaksimInTransitMgsOperationalRebindTransitions(incoming, receipt).length > 0);
  const stockMutation = JSON.parse(JSON.stringify(incoming));
  stockMutation.data.stockDepotItems[0].qty = 19;
  assert.equal(server.isSanalTaksimInTransitMgsOperationalRebind(current, stockMutation), false);
});

function buildD2C1BPrioritySaveHarness() {
  const harness = buildD2B3UiHarness();
  alignD2C1BTargetProduct(harness.data, harness.sor8, harness.sor7);
  const sourceOrder = harness.data.orders.find((row) => row.id === harness.sor8.orderId);
  const sourceLine = sourceOrder.lines.find((row) => row.id === harness.sor8.orderLineId);
  Object.assign(harness.line, {
    productId: sourceLine.productId,
    variationId: sourceLine.variationId,
    svrCode: sourceLine.variantCode
  });
  const lifecycle = buildD2C1BInTransitMgs(harness.data, harness.sor8, {
    qty: 4,
    start: 0,
    suffix: 'priority-save'
  });
  harness.data.montageDispatchPlans.push(lifecycle.plan);
  harness.data.montageDispatchShipments.push(lifecycle.shipment);
  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  const availability = harness.StockModule.buildSanalTaksimPriorityLineAvailability(
    harness.line,
    harness.job,
    harness.PlanningModule.buildSanalTaksimSnapshot()
  );
  const candidate = availability.inTransitMgsRebindCandidates.find((row) =>
    row.shipmentId === lifecycle.shipment.id
  );
  assert.ok(candidate, JSON.stringify(availability));
  selectD2B3PlanQty(harness, 4);
  return { harness, lifecycle, availability, candidate };
}

function buildD2C1BPriorityAvailabilityHarness({ directSetQty = 0, mgsSetQtys = [] } = {}) {
  const harness = buildD2B3UiHarness();
  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  harness.context.SanalTaksimResolver = {
    ...harness.Resolver,
    resolveExactSourceSelection: () => ({
      ok: true,
      totalSelectableQty: directSetQty,
      targetOpenQty: 20,
      slices: []
    }),
    resolveDraftPlanBoundRebindSelection: () => ({ ok: true, packages: [] }),
    resolveInTransitMgsOperationalRebindSelection: () => ({
      ok: true,
      candidates: mgsSetQtys.map((setQty, index) => ({
        shipmentId: `mgs-ui-availability-${index + 1}`,
        rebindKey: `mgs-ui-availability-key-${index + 1}`,
        setQty
      }))
    })
  };
  harness.PlanningModule.resolveSanalTaksimDraftWholePlanPartialCandidates = () => ({
    ok: true,
    candidates: []
  });
  const availability = harness.StockModule.buildSanalTaksimPriorityLineAvailability(
    harness.line,
    harness.job,
    harness.PlanningModule.buildSanalTaksimSnapshot()
  );
  return { harness, availability };
}

test('D2C.1B-1 UI ayni miktardaki iki MGS adayini kapasiteye katmaz ve direct 2yi gosterir', () => {
  const { availability } = buildD2C1BPriorityAvailabilityHarness({
    directSetQty: 2,
    mgsSetQtys: [3, 3]
  });
  assert.equal(availability.directSendableQty, 2);
  assert.equal(availability.inTransitMgsRebindCandidates.length, 2);
  assert.equal(availability.inTransitMgsRebindSetQty, 0);
  assert.equal(availability.sendableQty, 2);
});

test('D2C.1B-1 UI tek MGS adayini kapasiteye katar', () => {
  const { availability } = buildD2C1BPriorityAvailabilityHarness({
    directSetQty: 2,
    mgsSetQtys: [3]
  });
  assert.equal(availability.inTransitMgsRebindCandidates.length, 1);
  assert.equal(availability.inTransitMgsRebindSetQty, 3);
  assert.equal(availability.sendableQty, 3);
});

test('D2C.1B-1 UI daha yuksek tekil diger kaynak kapasitesini korur', () => {
  const { availability } = buildD2C1BPriorityAvailabilityHarness({
    directSetQty: 5,
    mgsSetQtys: [3]
  });
  assert.equal(availability.directSendableQty, 5);
  assert.equal(availability.inTransitMgsRebindSetQty, 3);
  assert.equal(availability.sendableQty, 5);
});

test('D2C.1B-1 UI guvenli kaynak yoksa satiri kullanilabilir gostermez', () => {
  const { harness, availability } = buildD2C1BPriorityAvailabilityHarness();
  assert.equal(availability.sendableQty, 0);
  assert.equal(availability.inTransitMgsRebindSetQty, 0);
  const html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.match(html, /nderilebilir: 0 tak/);
  assert.match(html, /<input type="checkbox"[^>]*disabled[^>]*setMontageReadyDetailSendSelected/);
});

test('D2C.1B-1 tekil MGS adayi teknik secim olmadan onaydan sonra rebind handlerina gider', async () => {
  const { harness, lifecycle } = buildD2C1BPrioritySaveHarness();
  assert.equal(harness.line.resolverAvailability.allocatable, false);
  assert.equal(harness.line.resolverAvailability.readyQty, 0);
  assert.deepEqual({ ...harness.StockModule.state.sanalTaksimPriorityMgsSelectionByRow }, {});
  const originalAvailability = harness.StockModule.getMontageLineDispatchAvailability;
  let normalReadinessCalls = 0;
  harness.StockModule.getMontageLineDispatchAvailability = (item, options) => {
    if (options?.requireResolver === true) normalReadinessCalls += 1;
    return originalAvailability(item, options);
  };
  let rebindArgs = null;
  harness.StockModule.rebindInTransitMontageShipmentOperationalTarget = async (args) => {
    rebindArgs = args;
    return { ok: true };
  };

  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  assert.equal(rebindArgs, null);
  assert.match(harness.modals.at(-1).html,
    /Bu siparişi öne almak için montaja sevk edilmiş 4 takım bu siparişe aktarılacak\./);
  assert.match(harness.modals.at(-1).html, /Fiziksel sevkiyat devam edecek, yalnız hangi sipariş için kullanılacağı değişecek\./);
  assert.match(harness.modals.at(-1).html, />Devam Et</);
  assert.match(harness.modals.at(-1).html, />Vazgeç</);
  assert.equal(await harness.StockModule.confirmSanalTaksimPriorityConfirmation(), true);
  assert.equal(normalReadinessCalls, 0);
  assert.equal(rebindArgs.shipmentId, lifecycle.shipment.id);
  assert.deepEqual({ ...rebindArgs.target }, {
    sourceOrderId: harness.sor7.orderId,
    sourceLineId: harness.sor7.orderLineId,
    demandId: harness.sor7.demandId,
    itemKey: harness.sor7.itemKey
  });
  assert.equal(harness.alerts.some((message) =>
    message.includes('Resolver tarafından tahsis edilmiş montaja hazır miktar bulunmuyor.')
  ), false);
});

test('D2C.1B-1 onay beklerken kayip veya uyusmayan priority session fail-closed kalir', async () => {
  for (const mode of ['missing', 'mismatch']) {
    const { harness } = buildD2C1BPrioritySaveHarness();
    assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false, mode);
    if (mode === 'missing') harness.StockModule.state.sanalTaksimPrioritySession = null;
    else harness.StockModule.state.sanalTaksimPrioritySession.sessionKey += '|MISMATCH';
    let rebindCalls = 0;
    harness.StockModule.rebindInTransitMontageShipmentOperationalTarget = async () => {
      rebindCalls += 1;
      return { ok: true };
    };

    assert.equal(await harness.StockModule.confirmSanalTaksimPriorityConfirmation(), false, mode);
    assert.equal(rebindCalls, 0, mode);
    assert.equal(harness.alerts.at(-1),
      'Bu sipariş için güvenli şekilde kullanılabilecek tek bir kaynak belirlenemedi. İşlem yapılmadı.', mode);
  }
});

test('D2C.1B-1 ayni miktarda iki MGS adayi varsa otomatik secim yapmaz', async () => {
  const { harness } = buildD2C1BPrioritySaveHarness();
  const duplicate = buildD2C1BInTransitMgs(harness.data, harness.sor8, {
    qty: 4,
    start: 4,
    suffix: 'priority-ambiguous'
  });
  harness.data.montageDispatchPlans.push(duplicate.plan);
  harness.data.montageDispatchShipments.push(duplicate.shipment);
  let rebindCalls = 0;
  harness.StockModule.rebindInTransitMontageShipmentOperationalTarget = async () => {
    rebindCalls += 1;
    return { ok: true };
  };

  const availability = harness.StockModule.buildSanalTaksimPriorityLineAvailability(
    harness.line,
    harness.job,
    harness.PlanningModule.buildSanalTaksimSnapshot()
  );
  assert.equal(availability.inTransitMgsRebindCandidates.filter((row) => row.setQty === 4).length, 2);
  assert.equal(availability.inTransitMgsRebindSetQty, 0);

  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  assert.equal(rebindCalls, 0);
  assert.equal(harness.StockModule.state.sanalTaksimPriorityConfirmation, null);
  assert.equal(harness.alerts.at(-1),
    'Bu sipariş için güvenli şekilde kullanılabilecek tek bir kaynak belirlenemedi. İşlem yapılmadı.');
});

test('D2C.1B-1 onaydan once gecersizlesen candidate save aninda fail-closed reddedilir', async () => {
  const { harness, lifecycle } = buildD2C1BPrioritySaveHarness();
  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  lifecycle.shipment.status = 'RECEIVED';
  let rebindCalls = 0;
  harness.StockModule.rebindInTransitMontageShipmentOperationalTarget = async () => {
    rebindCalls += 1;
    return { ok: true };
  };

  assert.equal(await harness.StockModule.confirmSanalTaksimPriorityConfirmation(), false);
  assert.equal(rebindCalls, 0);
  assert.equal(harness.alerts.at(-1),
    'Bu sipariş için güvenli şekilde kullanılabilecek tek bir kaynak belirlenemedi. İşlem yapılmadı.');
});

test('D2C.1B-1 MGS candidate miktari direct-ready kapasiteye eklenmez', () => {
  const { availability } = buildD2C1BPrioritySaveHarness();
  assert.ok(availability.directSendableQty > 0);
  assert.ok(availability.inTransitMgsRebindSetQty > 0);
  assert.equal(availability.sendableQty, Math.max(
    availability.directSendableQty,
    availability.draftRebindSetQty,
    availability.inTransitMgsRebindSetQty
  ));
  assert.notEqual(
    availability.sendableQty,
    availability.directSendableQty + availability.inTransitMgsRebindSetQty
  );
});

test('D2C.1B-1 UI teknik MGS secimi gostermeden tek adayi event ile rebind eder ve fiziksel gecmisi degistirmez', async () => {
  const harness = buildD2B3UiHarness();
  alignD2C1BTargetProduct(harness.data, harness.sor8, harness.sor7);
  const sourceOrder = harness.data.orders.find((row) => row.id === harness.sor8.orderId);
  const sourceLine = sourceOrder.lines.find((row) => row.id === harness.sor8.orderLineId);
  Object.assign(harness.line, {
    productId: sourceLine.productId,
    variationId: sourceLine.variationId,
    svrCode: sourceLine.variantCode
  });
  const lifecycle = buildD2C1BInTransitMgs(harness.data, harness.sor8, { qty: 4, start: 0, suffix: 'ui' });
  harness.data.montageDispatchPlans.push(lifecycle.plan);
  harness.data.montageDispatchShipments.push(lifecycle.shipment);
  const protectedBefore = {
    stock: JSON.stringify(harness.data.stockDepotItems),
    movements: JSON.stringify(harness.data.stock_movements),
    transactions: JSON.stringify(harness.data.workOrderTransactions),
    transfers: JSON.stringify(harness.data.montageCompletionTransfers),
    instructions: JSON.stringify(harness.data.sanalTaksimAllocationInstructions),
    plan: JSON.stringify(lifecycle.plan),
    items: JSON.stringify(lifecycle.shipment.items),
    parts: JSON.stringify(lifecycle.shipment.parts)
  };
  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  const availability = harness.StockModule.buildSanalTaksimPriorityLineAvailability(
    harness.line,
    harness.job,
    harness.PlanningModule.buildSanalTaksimSnapshot()
  );
  assert.equal(availability.inTransitMgsRebindCandidates.length, 1, JSON.stringify(availability));
  assert.equal(availability.inTransitMgsRebindCandidates[0].shipmentId, lifecycle.shipment.id);
  const html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.doesNotMatch(html, new RegExp(lifecycle.shipment.id));
  assert.doesNotMatch(html, /IN_TRANSIT TAM MGS adayı|MGS kullanma|Montaja Gönderim Planları|Planları Aç|exact PRC/);
  selectD2B3PlanQty(harness, 4);
  assert.equal(await submitD2B3PriorityPlan(harness), true, harness.alerts.join(' | '));
  assert.equal(harness.getSaveCalls(), 1);
  assert.equal(JSON.stringify(harness.saveOptions), JSON.stringify([{ conflictStrategy: 'fail' }]));
  assert.equal(harness.data.montageDispatchPlans.length, 1);
  assert.equal(harness.data.sanalTaksimAllocationInstructions.length, 0);
  assert.equal(lifecycle.shipment.operationalRebindEvents.length, 1);
  assert.equal(JSON.stringify(lifecycle.shipment.items), protectedBefore.items);
  assert.equal(JSON.stringify(lifecycle.shipment.parts), protectedBefore.parts);
  assert.equal(JSON.stringify(lifecycle.plan), protectedBefore.plan);
  assert.equal(JSON.stringify(harness.data.stockDepotItems), protectedBefore.stock);
  assert.equal(JSON.stringify(harness.data.stock_movements), protectedBefore.movements);
  assert.equal(JSON.stringify(harness.data.workOrderTransactions), protectedBefore.transactions);
  assert.equal(JSON.stringify(harness.data.montageCompletionTransfers), protectedBefore.transfers);
  assert.equal(JSON.stringify(harness.data.sanalTaksimAllocationInstructions), protectedBefore.instructions);
  const effective = harness.Resolver.resolveMontageShipmentOperationalTarget(lifecycle.shipment);
  assert.equal(effective.ok, true);
  assert.equal(effective.target.sourceOrderId, harness.sor7.orderId);
  const receipt = harness.StockModule.validateMontageDispatchShipmentReceipt(lifecycle.shipment.id);
  assert.equal(receipt.ok, true, JSON.stringify(receipt));
  assert.deepEqual({ ...receipt.receiptOwnership.target }, {
    sourceOrderId: harness.sor7.orderId,
    sourceLineId: harness.sor7.orderLineId,
    demandId: harness.sor7.demandId,
    itemKey: harness.sor7.itemKey
  });
  assert.equal(harness.alerts.at(-1),
    'Sipariş öne alındı. Montaja sevk edilmiş 4 takım artık bu sipariş için kullanılacak.');
});

test('D2C.1B-1 plan-bound COMPLETED STAI MGS rebind save tarihsel bagi korur ve exact guardlari gevsetmez', async () => {
  const harness = await buildD2B2BLifecycleHarness();
  alignD2C1BTargetProduct(harness.snapshot, harness.sor7, harness.sor8);
  harness.stock.context.PlanningModule = harness.PlanningModule;
  const plan = harness.snapshot.montageDispatchPlans[0];
  const instruction = harness.snapshot.sanalTaksimAllocationInstructions[0];

  await harness.stock.StockModule.dispatchMontagePlanToMontage(plan.id);

  const shipment = harness.snapshot.montageDispatchShipments[0];
  const target = {
    sourceOrderId: harness.sor8.orderId,
    sourceLineId: harness.sor8.orderLineId,
    demandId: harness.sor8.demandId,
    itemKey: harness.sor8.itemKey
  };
  const selection = harness.Resolver.resolveInTransitMgsOperationalRebindSelection(
    harness.snapshot,
    target
  );
  assert.equal(selection.ok, true, JSON.stringify(selection));
  assert.equal(selection.candidates.length, 1, JSON.stringify(selection));
  assert.equal(selection.candidates[0].shipmentId, shipment.id);
  const beforeRebind = {
    plan: JSON.stringify(plan),
    instruction: JSON.stringify(instruction),
    items: JSON.stringify(shipment.items),
    parts: JSON.stringify(shipment.parts),
    stock: JSON.stringify(harness.snapshot.stockDepotItems),
    movements: JSON.stringify(harness.snapshot.stock_movements),
    transactions: JSON.stringify(harness.snapshot.workOrderTransactions),
    transfers: JSON.stringify(harness.snapshot.montageCompletionTransfers)
  };

  const result = await harness.stock.StockModule.rebindInTransitMontageShipmentOperationalTarget({
    shipmentId: shipment.id,
    target,
    expectedRebindKey: selection.candidates[0].rebindKey
  });

  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.idempotent, false);
  assert.equal(harness.stock.saveCount, 2);
  assert.equal(shipment.operationalRebindEvents.length, 1);
  assert.equal(JSON.stringify(plan), beforeRebind.plan);
  assert.equal(JSON.stringify(instruction), beforeRebind.instruction);
  assert.equal(JSON.stringify(shipment.items), beforeRebind.items);
  assert.equal(JSON.stringify(shipment.parts), beforeRebind.parts);
  assert.equal(JSON.stringify(harness.snapshot.stockDepotItems), beforeRebind.stock);
  assert.equal(JSON.stringify(harness.snapshot.stock_movements), beforeRebind.movements);
  assert.equal(JSON.stringify(harness.snapshot.workOrderTransactions), beforeRebind.transactions);
  assert.equal(JSON.stringify(harness.snapshot.montageCompletionTransfers), beforeRebind.transfers);
  const effective = harness.Resolver.resolveMontageShipmentOperationalTarget(shipment);
  assert.equal(effective.ok, true, JSON.stringify(effective));
  assert.equal(effective.rebound, true);
  assert.deepEqual({ ...effective.target }, target);
  assert.deepEqual({ ...effective.fromTarget }, {
    sourceOrderId: harness.sor7.orderId,
    sourceLineId: harness.sor7.orderLineId,
    demandId: harness.sor7.demandId,
    itemKey: harness.sor7.itemKey
  });
  const resolved = harness.Resolver.resolve(harness.snapshot);
  assert.equal(resolved.diagnostics.exactHoldLedger.valid, true,
    JSON.stringify(resolved.diagnostics.exactHoldLedger));
  assert.equal(resolved.diagnostics.exactHoldLedger.issues.some((issue) =>
    issue.reasonCode === 'USER_INSTRUCTION_PLAN_BINDING_INVALID'
  ), false);
  const reboundHold = resolved.allocations.find((row) =>
    row.fixedByExactHold === true && row.shipmentId === shipment.id
  );
  assert.ok(reboundHold);
  assert.equal(reboundHold.targetOrderId, target.sourceOrderId);
  assert.equal(reboundHold.targetDemandId, target.demandId);

  const assertGuardRejects = (mutate) => {
    const corrupted = JSON.parse(JSON.stringify(harness.snapshot));
    mutate(corrupted);
    const corruptedResult = harness.Resolver.resolve(corrupted);
    const corruptedHoldAccepted = corruptedResult.allocations.some((row) =>
      row.fixedByExactHold === true && row.shipmentId === shipment.id
    );
    assert.equal(
      corruptedResult.diagnostics.exactHoldLedger.valid === false || corruptedHoldAccepted === false,
      true
    );
  };
  const getRange = (snapshot) => snapshot.montageDispatchShipments[0]
    .parts[0].allocations[0].segmentRanges[0];
  assertGuardRejects((snapshot) => { getRange(snapshot).physicalSegmentId += '|BROKEN'; });
  assertGuardRejects((snapshot) => { getRange(snapshot).segmentOffsetEnd -= 1; });
  assertGuardRejects((snapshot) => { getRange(snapshot).qty -= 1; });
  assertGuardRejects((snapshot) => { getRange(snapshot).prcId = 'prc-broken'; });
  assertGuardRejects((snapshot) => { getRange(snapshot).unit = 'KG'; });
  assertGuardRejects((snapshot) => {
    snapshot.sanalTaksimAllocationInstructions[0].status = 'ACTIVE';
  });
  assertGuardRejects((snapshot) => {
    snapshot.montageDispatchShipments[0].operationalRebindEvents[0].rebindKey += '|BROKEN';
  });
});

async function buildD2C1B2ReboundReceiptHarness() {
  const harness = await buildD2B2BLifecycleHarness();
  alignD2C1BTargetProduct(harness.snapshot, harness.sor7, harness.sor8);
  harness.stock.context.PlanningModule = harness.PlanningModule;
  const plan = harness.snapshot.montageDispatchPlans[0];
  await harness.stock.StockModule.dispatchMontagePlanToMontage(plan.id);
  const shipment = harness.snapshot.montageDispatchShipments[0];
  const target = {
    sourceOrderId: harness.sor8.orderId,
    sourceLineId: harness.sor8.orderLineId,
    demandId: harness.sor8.demandId,
    itemKey: harness.sor8.itemKey
  };
  const selection = harness.Resolver.resolveInTransitMgsOperationalRebindSelection(
    harness.snapshot,
    target
  );
  assert.equal(selection.ok, true, JSON.stringify(selection));
  assert.equal(selection.candidates.length, 1, JSON.stringify(selection));
  const rebound = await harness.stock.StockModule.rebindInTransitMontageShipmentOperationalTarget({
    shipmentId: shipment.id,
    target,
    expectedRebindKey: selection.candidates[0].rebindKey
  });
  assert.equal(rebound.ok, true, JSON.stringify(rebound));
  return { ...harness, plan, shipment, target };
}

test('D2C.1B-2 rebound IN_TRANSIT MGS current target ownership ile atomik receive edilir', async () => {
  const harness = await buildD2C1B2ReboundReceiptHarness();
  const { shipment, target } = harness;
  const server = require('../serve.js');
  const historicalItem = JSON.stringify(shipment.items);
  const historicalRanges = JSON.stringify(shipment.parts.map((part) =>
    part.allocations.map((allocation) => ({
      physicalSegmentId: allocation.physicalSegmentId,
      exactReservationKeys: allocation.exactReservationKeys,
      segmentRanges: allocation.segmentRanges
    }))
  ));
  const originalTarget = {
    sourceOrderId: shipment.items[0].sourceOrderId,
    sourceLineId: shipment.items[0].sourceLineId,
    demandId: shipment.items[0].demandId,
    itemKey: shipment.items[0].itemKey
  };
  const currentState = { data: JSON.parse(JSON.stringify(harness.snapshot)) };
  const preflight = harness.stock.StockModule.validateMontageDispatchShipmentReceipt(shipment.id);
  assert.equal(preflight.ok, true, JSON.stringify(preflight));
  assert.deepEqual({ ...preflight.receiptOwnership.target }, target);

  await harness.stock.StockModule.receiveMontageDispatchShipment(shipment.id);

  assert.equal(shipment.status, 'RECEIVED');
  assert.ok(shipment.receivedAt);
  assert.equal(shipment.operationalRebindEvents.length, 1);
  assert.deepEqual({ ...shipment.receiptOwnership.target }, target);
  assert.equal(shipment.receiptOwnership.lockedAt, shipment.receivedAt);
  assert.equal(JSON.stringify(shipment.items), historicalItem);
  assert.equal(JSON.stringify(shipment.parts.map((part) =>
    part.allocations.map((allocation) => ({
      physicalSegmentId: allocation.physicalSegmentId,
      exactReservationKeys: allocation.exactReservationKeys,
      segmentRanges: allocation.segmentRanges
    }))
  )), historicalRanges);
  const receiptStocks = harness.snapshot.stockDepotItems.filter((row) =>
    row.receiptKey === shipment.receiptKey
  );
  const receiptMovements = harness.snapshot.stock_movements.filter((row) =>
    row.type === 'MONTAGE_DISPATCH_RECEIPT' && row.shipmentId === shipment.id
  );
  const outMovements = harness.snapshot.stock_movements.filter((row) =>
    row.type === 'MONTAGE_DISPATCH_OUT' && row.shipmentId === shipment.id
  );
  assert.equal(receiptStocks.length, shipment.parts.length);
  assert.equal(receiptMovements.length, shipment.parts.length);
  assert.equal(outMovements.length, shipment.parts.flatMap((part) => part.allocations).length);
  assert.ok(receiptStocks.every((row) => row.sourceOrderId === target.sourceOrderId
    && row.sourceLineId === target.sourceLineId
    && row.demandId === target.demandId
    && row.itemKey === target.itemKey
    && JSON.stringify(row.receiptOwnership) === JSON.stringify(shipment.receiptOwnership)));
  assert.ok(receiptMovements.every((row) => row.sourceOrderId === target.sourceOrderId
    && row.demandId === target.demandId
    && JSON.stringify(row.receiptOwnership) === JSON.stringify(shipment.receiptOwnership)));
  assert.ok(outMovements.every((row) => row.demandId === originalTarget.demandId
    && row.itemKey === originalTarget.itemKey));
  assert.equal(server.isSanalTaksimReboundMgsAtomicReceipt(
    currentState,
    { data: harness.snapshot }
  ), true);
  assert.deepEqual(server.validateSanalTaksimInTransitMgsOperationalRebindTransitions(
    currentState,
    { data: harness.snapshot }
  ), []);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructions({ data: harness.snapshot }), []);
  assert.deepEqual(server.validateSanalTaksimPlanBoundMontageLinks({ data: harness.snapshot }), []);
  assert.deepEqual(server.validateSanalTaksimOperationalHoldConflicts({ data: harness.snapshot }), []);
  assert.deepEqual(server.validateSanalTaksimActiveStockRowProtection(
    currentState,
    { data: harness.snapshot }
  ), []);

  const refreshed = JSON.parse(JSON.stringify(shipment));
  assert.deepEqual(refreshed.receiptOwnership.target, target);
  const receivedQty = harness.stock.StockModule.getMontageShipmentReceivedQtyForLine({
    sourceType: 'SALES_ORDER',
    sourceOrderId: target.sourceOrderId,
    sourceLineId: target.sourceLineId,
    demandId: target.demandId,
    itemKey: target.itemKey
  });
  assert.equal(receivedQty, shipment.items[0].shippedQty);
  const afterReceiveSelection = harness.Resolver.resolveInTransitMgsOperationalRebindSelection(
    harness.snapshot,
    originalTarget
  );
  assert.equal((afterReceiveSelection.candidates || []).some((row) => row.shipmentId === shipment.id), false);
});

function attachRealMontageCompletionUnitModule(harness) {
  const { exported: UnitModule } = loadModule('src/modules/unit-module.js', 'UnitModule', {
    DB: harness.context.DB,
    StockModule: harness.StockModule,
    UI: { renderCurrentPage: () => {} },
    Modal: { open: () => {}, close: () => {} },
    alert: () => {}
  });
  harness.context.UnitModule = UnitModule;
  return UnitModule;
}

function getMontageReadyDetailLines(harness) {
  return harness.StockModule.getMontageReadyPlanRows(
    harness.StockModule.buildMontageReadyJobCards()
  ).flatMap((planRow) => harness.StockModule.getMontageReadyDetailOrderRows(planRow));
}

test('SOR-000012 rebound receipt kaniti Montaj completion ve MCT POSTED zincirini guvenli acar', async () => {
  const demoPath = path.join(__dirname, '..', 'demo_state.json');
  const beforeHash = nodeCrypto.createHash('sha256').update(fs.readFileSync(demoPath)).digest('hex');
  const current = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
  const data = JSON.parse(JSON.stringify(current.data));
  const harness = buildMontagePlanHarness({
    dataOverride: data,
    useRealMontagePreflight: true
  });
  const UnitModule = attachRealMontageCompletionUnitModule(harness);
  const shipment = data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007');
  assert.ok(shipment);
  assert.equal(shipment.planNo, 'MGP-000023');
  assert.equal(shipment.items[0].sourceOrderNo, 'SOR-000014');
  const historicalItems = JSON.stringify(shipment.items);
  const trustedItems = harness.StockModule.getTrustedMontageCompletionShipmentItems(shipment);
  assert.equal(trustedItems.length, 1);
  assert.equal(trustedItems[0].sourceOrderId, '41db885f-31ce-477e-9417-06232dbf6ac3');
  assert.equal(trustedItems[0].demandId, '44728820-3855-43b7-9acc-b94dd4a3e17b');
  const detailRows = getMontageReadyDetailLines(harness);
  const line = detailRows.find((row) => row.sourceOrderId === '41db885f-31ce-477e-9417-06232dbf6ac3');
  assert.ok(line);
  for (const [orderNo, expectedQty] of [['SOR-000011', 1], ['SOR-000015', 3]]) {
    const orderId = data.orders.find((row) => row.orderNo === orderNo)?.id;
    const comparisonLine = detailRows.find((row) => row.sourceOrderId === orderId);
    assert.ok(comparisonLine, orderNo);
    const comparisonAvailability = harness.StockModule.getMontageCompletionAvailabilityForLine(comparisonLine);
    assert.equal(comparisonAvailability.ok, true, `${orderNo}: ${JSON.stringify(comparisonAvailability)}`);
    assert.equal(comparisonAvailability.availableQty, expectedQty, orderNo);
  }

  const availability = harness.StockModule.getMontageCompletionAvailabilityForLine(line);
  assert.equal(availability.ok, true, JSON.stringify(availability));
  assert.equal(availability.availableQty, 2);
  assert.equal(availability.sourceShipment.shipmentNo, 'MGS-000007');
  const historicalAvailability = harness.StockModule.getMontageCompletionAvailabilityForLine(shipment.items[0]);
  assert.equal(historicalAvailability.ok, false);
  assert.equal(historicalAvailability.availableQty, 0);
  const completionState = UnitModule.getMontageJobLineCompletionState(line, [line]);
  assert.equal(completionState.ok, true, JSON.stringify(completionState));
  assert.equal(completionState.completed, false);
  assert.equal(completionState.errors.length, 0);

  const transfer = data.montageCompletionTransfers.find((row) =>
    row.transferNo === 'MCT-000011'
    && row.sourceShipmentId === shipment.id
    && row.status === 'PENDING_DEPOT_RECEIPT'
  );
  assert.ok(transfer);
  assert.equal(transfer.sourceOrderId, line.sourceOrderId);
  assert.equal(transfer.sourceLineId, line.sourceLineId);
  assert.equal(transfer.demandId, line.demandId);
  assert.equal(transfer.itemKey, line.itemKey);
  assert.equal(harness.StockModule.buildMontageCompletionDepotReceiptExecution(transfer.id).ok, true);
  const historicalTransferCount = data.montageCompletionTransfers.filter((row) =>
    row.sourceOrderNo === 'SOR-000014'
  ).length;
  const historicalFinishedMovementCount = data.stock_movements.filter((row) =>
    row.sourceOrderId === shipment.items[0].sourceOrderId
    && String(row.movementType || row.type || '').toUpperCase() === 'MONTAGE_FINISHED_PRODUCT_IN'
  ).length;
  assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), true);
  assert.equal(transfer.status, 'POSTED');
  assert.ok(transfer.finishedProductStockItemId);
  assert.ok(transfer.finishedProductMovementId);
  const finishedMovements = data.stock_movements.filter((row) =>
    String(row.completionTransferId || row.transferId || '') === transfer.id
    && String(row.movementType || row.type || '').toUpperCase() === 'MONTAGE_FINISHED_PRODUCT_IN'
  );
  assert.equal(finishedMovements.length, 1);
  assert.equal(Number(finishedMovements[0].qty || finishedMovements[0].quantity || 0), 1);
  const finishedStock = data.stockDepotItems.find((row) => row.id === transfer.finishedProductStockItemId);
  assert.ok(finishedStock);
  assert.equal(Number(finishedStock.qty || finishedStock.quantity || 0), 1);
  assert.equal(harness.StockModule.getMontageShipmentReceivedQtyForLine(line), 3);
  assert.equal(harness.StockModule.getMontageCompletionTransferredQtyForLine(line), 1);
  assert.equal(harness.StockModule.getMontageReadyForShipmentQtyForLine(line), 1);
  assert.equal(harness.StockModule.getMontageCompletionAvailabilityForLine(line).availableQty, 2);
  assert.equal(harness.StockModule.getMontageReadyForShipmentQtyForLine(shipment.items[0]), 0);
  assert.equal(data.montageCompletionTransfers.filter((row) => row.sourceOrderNo === 'SOR-000014').length,
    historicalTransferCount);
  assert.equal(data.stock_movements.filter((row) =>
    row.sourceOrderId === shipment.items[0].sourceOrderId
    && String(row.movementType || row.type || '').toUpperCase() === 'MONTAGE_FINISHED_PRODUCT_IN'
  ).length, historicalFinishedMovementCount);
  assert.equal(JSON.stringify(shipment.items), historicalItems);
  assert.equal(
    nodeCrypto.createHash('sha256').update(fs.readFileSync(demoPath)).digest('hex'),
    beforeHash
  );
});

test('SOR-000012 Montaj completion rebind ve receipt kaniti bozuldugunda fail-closed kalir', async () => {
  const current = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const cleanData = JSON.parse(JSON.stringify(current.data));
  const cleanHarness = buildMontagePlanHarness({ dataOverride: cleanData, useRealMontagePreflight: true });
  const cleanShipment = cleanData.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007');
  const line = JSON.parse(JSON.stringify(
    cleanHarness.StockModule.getTrustedMontageCompletionShipmentItems(cleanShipment)[0]
  ));
  assert.ok(line);

  const cases = [
    (data, shipment) => { delete shipment.receiptOwnership; },
    (data, shipment) => { shipment.receiptOwnership.target.demandId = 'broken-demand'; },
    (data, shipment) => { shipment.operationalRebindEvents.push({ ...shipment.operationalRebindEvents[0] }); },
    (data, shipment) => { shipment.operationalRebindEvents[0].productFingerprint += '|BROKEN'; },
    (data, shipment) => { shipment.operationalRebindEvents[0].recipeFingerprint += '|BROKEN'; },
    (data, shipment) => { shipment.operationalRebindEvents[0].exactRangeFingerprint += '|BROKEN'; },
    (data, shipment) => {
      data.stockDepotItems.find((row) => row.receiptKey === shipment.receiptKey)
        .receiptOwnership.target.sourceOrderId = 'broken-order';
    },
    (data, shipment) => {
      const movement = data.stock_movements.find((row) =>
        row.receiptKey === shipment.receiptKey && row.type === 'MONTAGE_DISPATCH_RECEIPT'
      );
      movement.qty -= 1;
      movement.quantity -= 1;
    },
    (data, shipment) => {
      const index = data.stockDepotItems.findIndex((row) => row.receiptKey === shipment.receiptKey);
      data.stockDepotItems.splice(index, 1);
    },
    (data, shipment) => {
      const index = data.stock_movements.findIndex((row) =>
        row.receiptKey === shipment.receiptKey && row.type === 'MONTAGE_DISPATCH_RECEIPT'
      );
      data.stock_movements.splice(index, 1);
    },
    (data, shipment) => { shipment.items[0].recipeParts = []; }
  ];
  for (const mutate of cases) {
    const data = JSON.parse(JSON.stringify(current.data));
    const shipment = data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007');
    mutate(data, shipment);
    const harness = buildMontagePlanHarness({ dataOverride: data, useRealMontagePreflight: true });
    assert.deepEqual(Array.from(harness.StockModule.getTrustedMontageCompletionShipmentItems(shipment)), []);
    const availability = harness.StockModule.getMontageCompletionAvailabilityForLine(line);
    assert.equal(availability.ok, false);
    assert.equal(availability.availableQty, 0);
    const transfer = data.montageCompletionTransfers.find((row) => row.transferNo === 'MCT-000011');
    const beforeReceive = JSON.stringify(data);
    assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), false);
    assert.equal(JSON.stringify(data), beforeReceive);
  }
});

test('SOR-000012 RECEIVED rebind ham MGP-MGS bagi bozuldugunda completion ve POSTED fail-closed kalir', async () => {
  const current = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const cases = [
    (data, shipment) => { shipment.planId = 'broken-plan-id'; },
    (data, shipment) => { shipment.planNo = 'MGP-BROKEN'; },
    (data, shipment) => {
      data.montageDispatchPlans.find((row) => row.id === shipment.planId).items[0].plannedQty += 1;
    }
  ];
  for (const mutate of cases) {
    const data = JSON.parse(JSON.stringify(current.data));
    const harness = buildMontagePlanHarness({ dataOverride: data, useRealMontagePreflight: true });
    const shipment = data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000007');
    const transfer = data.montageCompletionTransfers.find((row) => row.transferNo === 'MCT-000011');
    const line = getMontageReadyDetailLines(harness).find((row) =>
      row.sourceOrderId === transfer.sourceOrderId && row.sourceLineId === transfer.sourceLineId
    );
    assert.ok(line);
    mutate(data, shipment);
    const UnitModule = attachRealMontageCompletionUnitModule(harness);
    const completionState = UnitModule.getMontageJobLineCompletionState(line, [line]);
    assert.equal(completionState.ok, false);
    assert.ok(completionState.errors.some((row) => row.code === 'SHIPMENT_ITEM_CONFLICT'));
    const beforeReceive = JSON.stringify(data);
    assert.equal(await harness.StockModule.receiveMontageCompletionTransferToDepot(transfer.id), false);
    assert.equal(JSON.stringify(data), beforeReceive);
  }
});

test('MCT-000005 non-rebind completion-state davranisi degismez', () => {
  const current = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const data = JSON.parse(JSON.stringify(current.data));
  const harness = buildMontagePlanHarness({ dataOverride: data, useRealMontagePreflight: true });
  const UnitModule = attachRealMontageCompletionUnitModule(harness);
  const transfer = data.montageCompletionTransfers.find((row) => row.transferNo === 'MCT-000005');
  const line = getMontageReadyDetailLines(harness).find((row) =>
    row.sourceOrderId === transfer.sourceOrderId && row.sourceLineId === transfer.sourceLineId
  );
  assert.ok(line);
  const before = JSON.stringify(data);
  const completionState = UnitModule.getMontageJobLineCompletionState(line, [line]);
  assert.equal(completionState.ok, true, JSON.stringify(completionState));
  assert.equal(completionState.errors.length, 0);
  assert.equal(JSON.stringify(data), before);
});

test('D2C.1B-2 replay ve save hatasi mukerrer veya yarim ownership etkisi birakmaz', async () => {
  const replay = await buildD2C1B2ReboundReceiptHarness();
  await replay.stock.StockModule.receiveMontageDispatchShipment(replay.shipment.id);
  const afterFirst = JSON.stringify(replay.snapshot);
  const saveCountAfterFirst = replay.stock.saveCount;
  await replay.stock.StockModule.receiveMontageDispatchShipment(replay.shipment.id);
  assert.equal(JSON.stringify(replay.snapshot), afterFirst);
  assert.equal(replay.stock.saveCount, saveCountAfterFirst);

  const failed = await buildD2C1B2ReboundReceiptHarness();
  const beforeFailure = JSON.stringify(failed.snapshot);
  failed.stock.context.DB.save = async () => ({ ok: false, error: new Error('rebound receipt save failed') });
  await failed.stock.StockModule.receiveMontageDispatchShipment(failed.shipment.id);
  assert.equal(JSON.stringify(failed.snapshot), beforeFailure);
  assert.equal(failed.snapshot.stockDepotItems.some((row) => row.receiptOwnership), false);
  assert.equal(failed.snapshot.stock_movements.some((row) => row.receiptOwnership), false);
});

test('D2C.1B-2 invalid current target ve ACTIVE STAI conflictte mutasyonsuz fail-closed kalir', async () => {
  const invalidTarget = await buildD2C1B2ReboundReceiptHarness();
  invalidTarget.shipment.operationalRebindEvents[0].toTarget.demandId = 'missing-demand';
  const invalidBefore = JSON.stringify(invalidTarget.snapshot);
  const invalidPreflight = invalidTarget.stock.StockModule.validateMontageDispatchShipmentReceipt(
    invalidTarget.shipment.id
  );
  assert.equal(invalidPreflight.ok, false);
  await invalidTarget.stock.StockModule.receiveMontageDispatchShipment(invalidTarget.shipment.id);
  assert.equal(JSON.stringify(invalidTarget.snapshot), invalidBefore);

  const activeConflict = await buildD2C1B2ReboundReceiptHarness();
  const instruction = activeConflict.snapshot.sanalTaksimAllocationInstructions[0];
  instruction.status = 'ACTIVE';
  instruction.events = [];
  const conflictBefore = JSON.stringify(activeConflict.snapshot);
  const conflictPreflight = activeConflict.stock.StockModule.validateMontageDispatchShipmentReceipt(
    activeConflict.shipment.id
  );
  assert.equal(conflictPreflight.ok, false);
  assert.equal(conflictPreflight.reasonCode, 'MGS_RECEIPT_ACTIVE_STAI_CONFLICT');
  await activeConflict.stock.StockModule.receiveMontageDispatchShipment(activeConflict.shipment.id);
  assert.equal(JSON.stringify(activeConflict.snapshot), conflictBefore);
});

test('D2C.1B-2 server receipt ownership target veya atomik paketi bozulursa reddeder', async () => {
  const harness = await buildD2C1B2ReboundReceiptHarness();
  const currentState = { data: JSON.parse(JSON.stringify(harness.snapshot)) };
  await harness.stock.StockModule.receiveMontageDispatchShipment(harness.shipment.id);
  const server = require('../serve.js');
  const valid = { data: JSON.parse(JSON.stringify(harness.snapshot)) };
  assert.equal(server.isSanalTaksimReboundMgsAtomicReceipt(currentState, valid), true);

  const wrongOwnership = JSON.parse(JSON.stringify(valid));
  wrongOwnership.data.montageDispatchShipments[0].receiptOwnership.target.demandId = 'other-demand';
  assert.equal(server.isSanalTaksimReboundMgsAtomicReceipt(currentState, wrongOwnership), false);
  assert.ok(server.validateSanalTaksimInTransitMgsOperationalRebindTransitions(
    currentState,
    wrongOwnership
  ).length > 0);

  const missingMovement = JSON.parse(JSON.stringify(valid));
  missingMovement.data.stock_movements.pop();
  assert.equal(server.isSanalTaksimReboundMgsAtomicReceipt(currentState, missingMovement), false);
});

test('D2C.1A instruction bagi olmayan DRAFT MGPyi rebind kaynagi secmez', async () => {
  const addUnboundDraftPlan = (harness, id) => {
    const plan = buildD2B1AMontagePlan(harness.data, harness.sor8, {
      id, status: 'DRAFT', qty: 5, start: 0
    });
    plan.planNo = `MGP-${id.toUpperCase()}`;
    assert.equal(plan.exactReservations.length, 1);
    assert.equal(plan.exactReservations.some((row) => row.instructionId || row.instructionSliceKey), false);
    harness.data.montageDispatchPlans.push(plan);
    return plan;
  };
  const observePlanningCalls = (harness) => {
    const calls = [];
    const original = harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation;
    harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation = async (bundle, options) => {
      calls.push(JSON.parse(JSON.stringify(bundle)));
      return original(bundle, options);
    };
    return calls;
  };

  const direct = buildD2B3UiHarness();
  const directSourcePlan = addUnboundDraftPlan(direct, 'unbound-direct-source');
  const directReadModel = direct.Resolver.resolveDraftPlanBoundRebindSelection(
    direct.data,
    buildD2C1AReadRequest(direct)
  );
  assert.equal(directReadModel.ok, true, JSON.stringify(directReadModel));
  assert.equal(directReadModel.packages.length, 0);
  const directPlanningCalls = observePlanningCalls(direct);
  const physicalBefore = JSON.stringify(direct.data.stockDepotItems);
  assert.equal(direct.StockModule.startSanalTaksimPrioritySession(), true);
  selectD2B3PlanQty(direct, 5);
  assert.equal(await direct.StockModule.validateMontageReadyDetailSendPlan(), true, direct.alerts.join(' | '));
  assert.equal(directPlanningCalls.length, 1);
  assert.equal(directPlanningCalls[0].sourceRebind, undefined);
  assert.equal(direct.getSaveCalls(), 1);
  assert.equal(directSourcePlan.status, 'DRAFT');
  assert.equal(directSourcePlan.rebindAudit, undefined);
  assert.equal(direct.data.montageDispatchPlans.length, 2);
  assert.equal(direct.data.montageDispatchPlans.filter((row) => row.rebindAudit).length, 0);
  assert.equal(JSON.stringify(direct.data.stockDepotItems), physicalBefore);

  const blocked = buildD2B3UiHarness();
  const blockedStock = blocked.data.stockDepotItems.find((row) => row.id === 'stock-a');
  Object.assign(blockedStock, { qty: 5, quantity: 5, amount: 5 });
  const blockedSourcePlan = addUnboundDraftPlan(blocked, 'unbound-blocked-source');
  const blockedReadModel = blocked.Resolver.resolveDraftPlanBoundRebindSelection(
    blocked.data,
    buildD2C1AReadRequest(blocked)
  );
  assert.equal(blockedReadModel.ok, true, JSON.stringify(blockedReadModel));
  assert.equal(blockedReadModel.packages.length, 0);
  const blockedPlanningCalls = observePlanningCalls(blocked);
  const blockedPersistentBefore = JSON.stringify(blocked.data);
  assert.equal(blocked.StockModule.startSanalTaksimPrioritySession(), true);
  const blockedAvailability = blocked.StockModule.buildSanalTaksimPriorityLineAvailability(
    blocked.line,
    blocked.job,
    blocked.PlanningModule.buildSanalTaksimSnapshot()
  );
  assert.equal(blockedAvailability.directSendableQty, 0);
  assert.equal(blockedAvailability.draftRebindPackages.length, 0);
  assert.equal(blockedAvailability.sendableQty, 0);
  selectD2B3PlanQty(blocked, 5);
  assert.notEqual(await blocked.StockModule.validateMontageReadyDetailSendPlan(), true);
  assert.equal(blockedPlanningCalls.length, 0);
  assert.equal(blocked.getSaveCalls(), 0);
  assert.equal(blockedSourcePlan.status, 'DRAFT');
  assert.equal(JSON.stringify(blocked.data), blockedPersistentBefore);
});

test('D2C.1A guvenilir DRAFT paketi UI akisi ile atomik tasir, tek hold sayar ve hedef iptalinde dilimi acar', async () => {
  const harness = await buildD2C1AUiHarness();
  const server = require('../serve.js');
  const beforeState = { data: JSON.parse(JSON.stringify(harness.data)) };
  const beforeResolved = harness.Resolver.resolve(harness.data);
  const protectedBefore = {
    stockDepotItems: JSON.stringify(harness.data.stockDepotItems),
    stockMovements: JSON.stringify(harness.data.stock_movements),
    workOrderTransactions: JSON.stringify(harness.data.workOrderTransactions),
    orders: JSON.stringify(harness.data.orders),
    planningDemands: JSON.stringify(harness.data.planningDemands),
    workOrders: JSON.stringify(harness.data.workOrders),
    salesShipments: JSON.stringify(harness.data.salesShipments || [])
  };
  const readModel = harness.Resolver.resolveDraftPlanBoundRebindSelection(
    harness.data,
    buildD2C1AReadRequest(harness)
  );
  assert.equal(readModel.ok, true, JSON.stringify(readModel));
  assert.equal(readModel.readOnly, true);
  assert.equal(readModel.writes, 0);
  assert.equal(readModel.packages.length, 1);
  assert.equal(readModel.packages[0].sourcePlanId, harness.sourceBundle.plan.id);
  assert.equal(readModel.packages[0].setQty, 10);

  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  const html = harness.StockModule.renderMontageReadyJobDetailLayout();
  assert.doesNotMatch(html, /DRAFT montaj rezervi|MGP|STAI|MGS|PRC|Resolver|Planları Aç|Montaja Gönderim Planları/);
  assert.doesNotMatch(html, /segmentOffset|physicalSegmentId|instructionSliceKey|STOCK\|stock-a/);
  selectD2B3PlanQty(harness, 10);
  const persistentBeforeConfirmation = JSON.stringify(harness.data);
  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  assert.equal(JSON.stringify(harness.data), persistentBeforeConfirmation);
  assert.match(harness.modals.at(-1).html,
    /Bu siparişi öne almak için başka bir sipariş için planlanmış 10 takım kullanılacak\./);
  assert.match(harness.modals.at(-1).html,
    /Devam ederseniz mevcut plan iptal edilerek bu sipariş için yeniden planlanacak\./);
  assert.match(harness.modals.at(-1).html, />Devam Et</);
  assert.match(harness.modals.at(-1).html, />Vazgeç</);
  assert.equal(harness.StockModule.cancelSanalTaksimPriorityConfirmation(), false);
  assert.equal(JSON.stringify(harness.data), persistentBeforeConfirmation);
  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  assert.equal(await harness.StockModule.confirmSanalTaksimPriorityConfirmation(), true,
    harness.alerts.join(' | '));
  assert.equal(harness.getSaveCalls(), 2);
  assert.equal(JSON.stringify(harness.saveOptions), JSON.stringify([
    { conflictStrategy: 'fail' },
    { conflictStrategy: 'fail' }
  ]));
  assert.equal(harness.StockModule.state.sanalTaksimPrioritySession, null);
  assert.equal(harness.StockModule.state.montageReadyDetailSendMode, false);

  const sourcePlan = harness.data.montageDispatchPlans.find((row) => row.id === harness.sourceBundle.plan.id);
  const targetPlan = harness.data.montageDispatchPlans.find((row) => row.rebindAudit?.role === 'TARGET');
  const sourceInstruction = harness.data.sanalTaksimAllocationInstructions
    .find((row) => row.id === harness.sourceBundle.instructionRequests[0].id);
  const targetInstructions = harness.data.sanalTaksimAllocationInstructions
    .filter((row) => row.rebindAudit?.role === 'TARGET');
  assert.equal(sourcePlan.status, 'CANCELLED');
  assert.equal(sourcePlan.rebindAudit.role, 'SOURCE');
  assert.equal(sourceInstruction.status, 'CANCELLED');
  assert.equal(sourceInstruction.events.at(-1).type, 'CANCELLED');
  assert.equal(targetPlan.status, 'DRAFT');
  assert.equal(targetInstructions.length, 1);
  assert.equal(targetInstructions[0].status, 'ACTIVE');
  assert.equal(sourcePlan.rebindAudit.rebindKey, targetPlan.rebindAudit.rebindKey);
  assert.equal(sourceInstruction.events.at(-1).rebindKey, targetPlan.rebindAudit.rebindKey);
  assert.equal(targetInstructions[0].rebindAudit.rebindKey, targetPlan.rebindAudit.rebindKey);
  assert.match(targetPlan.rebindAudit.rebindKey, /^D2C1A_REBIND\|mgp-d2c1a-source\|/);
  assert.equal(server.isSanalTaksimDraftPlanBoundAtomicRebind(beforeState, { data: harness.data }), true);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(beforeState, { data: harness.data }), []);

  const afterResolved = harness.Resolver.resolve(harness.data);
  assert.equal(afterResolved.diagnostics.exactHoldLedger.valid, true);
  assert.equal(afterResolved.diagnostics.exactHoldLedger.holdCount, 1);
  assert.equal(afterResolved.diagnostics.exactHoldLedger.activeInstructionCount, 1);
  assert.equal(afterResolved.allocations.filter((row) => row.physicalSegmentId === 'STOCK|stock-a')
    .reduce((sum, row) => sum + Number(row.qty || 0), 0), 10);
  assert.equal(getD2AOrderAllocationQty(beforeResolved, harness.sor8.orderId), 10);
  assert.equal(getD2AOrderAllocationQty(afterResolved, harness.sor8.orderId), 0);
  assert.equal(getD2AOrderAllocationQty(beforeResolved, harness.sor7.orderId), 0);
  assert.equal(getD2AOrderAllocationQty(afterResolved, harness.sor7.orderId), 10);
  Object.entries(protectedBefore).forEach(([key, value]) => {
    const current = key === 'stockMovements' ? harness.data.stock_movements
      : key === 'workOrderTransactions' ? harness.data.workOrderTransactions
        : harness.data[key];
    assert.equal(JSON.stringify(current), value, key);
  });

  const beforeCancelSaveCalls = harness.getSaveCalls();
  const beforeCancelState = { data: JSON.parse(JSON.stringify(harness.data)) };
  await harness.StockModule.cancelMontageDispatchPlan(targetPlan.id);
  assert.equal(harness.getSaveCalls(), beforeCancelSaveCalls + 1);
  assert.equal(targetPlan.status, 'CANCELLED');
  assert.equal(targetInstructions[0].status, 'CANCELLED');
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(
    beforeCancelState,
    { data: harness.data }
  ), []);
  const freeAfterCancel = harness.Resolver.resolveExactSourceSelection(
    harness.data,
    buildD2B1ASelectionTarget(harness.sor7)
  );
  assert.equal(freeAfterCancel.ok, true, JSON.stringify(freeAfterCancel));
  assert.equal(freeAfterCancel.totalSelectableQty, 10);
});

test('D2C.1A acilis mojibake gorunum duzeltmesi MGS stateini save payloadinda degistirmez', async () => {
  const badPartName = `Dekorlu Dikme ${'\u00c5\u0178'}effaf`;
  const shipment = {
    id: 'mgs-mojibake-regression',
    shipmentNo: 'MGS-MOJIBAKE-REGRESSION',
    status: 'CANCELLED',
    items: [{ recipeSnapshot: [{ partName: badPartName }] }]
  };
  const diskState = {
    schema_version: 1,
    meta: {
      created_at: '2026-08-04T08:00:00.000Z',
      revision: 1,
      activeRole: 'super-admin',
      activeUserName: 'D2C.1A Test'
    },
    data: { montageDispatchShipments: [JSON.parse(JSON.stringify(shipment))] }
  };
  const shipmentBeforeLoad = JSON.stringify(diskState.data.montageDispatchShipments);
  const { exported: appCore } = loadModule(
    'src/core/app-core.js',
    '({ DB, MojibakeFix })',
    {
      fetch: async () => ({
        ok: true,
        json: async () => ({ ok: true, state: diskState })
      }),
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      TextDecoder,
      Uint8Array,
      setTimeout,
      clearTimeout
    }
  );
  await appCore.DB.loadState();
  assert.equal(
    JSON.stringify(appCore.DB.data.data.montageDispatchShipments),
    shipmentBeforeLoad
  );

  const displayShipment = JSON.parse(JSON.stringify(
    appCore.DB.data.data.montageDispatchShipments[0]
  ));
  assert.equal(appCore.MojibakeFix.sanitizeObjectStrings(displayShipment), true);
  assert.equal(displayShipment.items[0].recipeSnapshot[0].partName, 'Dekorlu Dikme \u015feffaf');
  assert.equal(
    JSON.stringify(appCore.DB.data.data.montageDispatchShipments),
    shipmentBeforeLoad
  );

  let harness;
  let outboundState = null;
  harness = await buildD2C1AUiHarness({
    save: async (_options, call) => {
      if (call === 2) outboundState = { data: JSON.parse(JSON.stringify(harness.data)) };
      return { ok: true };
    }
  });
  harness.data.montageDispatchShipments.push(JSON.parse(JSON.stringify(
    appCore.DB.data.data.montageDispatchShipments[0]
  )));
  const currentState = { data: JSON.parse(JSON.stringify(harness.data)) };
  const shipmentsBeforeRebind = JSON.stringify(harness.data.montageDispatchShipments);

  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  selectD2B3PlanQty(harness, 10);
  assert.equal(
    await submitD2B3PriorityPlan(harness),
    true,
    harness.alerts.join(' | ')
  );
  assert.ok(outboundState);
  assert.equal(
    JSON.stringify(outboundState.data.montageDispatchShipments),
    shipmentsBeforeRebind
  );

  const server = require('../serve.js');
  assert.equal(server.isSanalTaksimDraftPlanBoundAtomicRebind(currentState, outboundState), true);
  assert.deepEqual(
    server.validateSanalTaksimAllocationInstructionTransitions(currentState, outboundState),
    []
  );
});

test('D2C.1A tekil 3 urunluk DRAFT paketi normal kapasite 5 olsa da rebind yoluna onceliklendirir', async () => {
  const harness = buildD2B3UiHarness();
  const stockRow = harness.data.stockDepotItems.find((row) => row.id === 'stock-a');
  Object.assign(stockRow, { qty: 8, quantity: 8, amount: 8 });
  const sourceBundle = buildD2B2AAtomicBundle(harness, harness.sor8, {
    qty: 3,
    planId: 'mgp-d2c1a-direct-priority-source',
    planNo: 'MGP-D2C1A-DIRECT-PRIORITY-SOURCE',
    instructionId: '77777777-7777-4777-8777-777777777771',
    instructionCode: 'STAI-000077',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2c1a-direct-priority-source|PRC-SOURCE-1',
    sliceKey: 'd2c1a-direct-priority-source-slice'
  });
  const sourceCreated = await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(sourceBundle);
  assert.equal(sourceCreated.ok, true, JSON.stringify(sourceCreated));
  const physicalBefore = JSON.stringify({
    stockDepotItems: harness.data.stockDepotItems,
    stockMovements: harness.data.stock_movements,
    workOrderTransactions: harness.data.workOrderTransactions
  });

  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  const availability = harness.StockModule.buildSanalTaksimPriorityLineAvailability(
    harness.line,
    harness.job,
    harness.PlanningModule.buildSanalTaksimSnapshot()
  );
  assert.equal(availability.ok, true, JSON.stringify(availability));
  assert.equal(availability.directSendableQty, 5);
  assert.equal(availability.draftRebindSetQty, 3);
  assert.equal(availability.draftRebindPackages.length, 1);
  assert.equal(availability.draftRebindPackages[0].sourcePlanId, sourceBundle.plan.id);

  selectD2B3PlanQty(harness, 3);
  assert.equal(await submitD2B3PriorityPlan(harness), true, harness.alerts.join(' | '));
  assert.equal(harness.data.montageDispatchPlans.length, 2);
  const sourcePlan = harness.data.montageDispatchPlans.find((row) => row.id === sourceBundle.plan.id);
  const targetPlans = harness.data.montageDispatchPlans.filter((row) => row.rebindAudit?.role === 'TARGET');
  assert.equal(sourcePlan.status, 'CANCELLED');
  assert.equal(sourcePlan.rebindAudit.role, 'SOURCE');
  assert.equal(targetPlans.length, 1);
  assert.equal(targetPlans[0].status, 'DRAFT');
  assert.equal(harness.data.montageDispatchPlans.filter((row) =>
    row.items?.[0]?.sourceOrderId === harness.target.orderId && !row.rebindAudit).length, 0);
  assert.equal(JSON.stringify({
    stockDepotItems: harness.data.stockDepotItems,
    stockMovements: harness.data.stock_movements,
    workOrderTransactions: harness.data.workOrderTransactions
  }), physicalBefore);
});

test('D2C.1A ayni miktarda iki DRAFT paket varken normal kapasite bulunsa da fail-closed kalir', async () => {
  const harness = buildD2B3UiHarness();
  const stockRow = harness.data.stockDepotItems.find((row) => row.id === 'stock-a');
  Object.assign(stockRow, { qty: 11, quantity: 11, amount: 11 });
  const firstBundle = buildD2B2AAtomicBundle(harness, harness.sor8, {
    qty: 3,
    start: 0,
    planId: 'mgp-d2c1a-ambiguous-source-1',
    planNo: 'MGP-D2C1A-AMBIGUOUS-SOURCE-1',
    instructionId: '77777777-7777-4777-8777-777777777772',
    instructionCode: 'STAI-000078',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2c1a-ambiguous-source-1|PRC-SOURCE-1',
    sliceKey: 'd2c1a-ambiguous-source-slice-1'
  });
  const secondBundle = buildD2B2AAtomicBundle(harness, harness.sor8, {
    qty: 3,
    start: 3,
    planId: 'mgp-d2c1a-ambiguous-source-2',
    planNo: 'MGP-D2C1A-AMBIGUOUS-SOURCE-2',
    instructionId: '77777777-7777-4777-8777-777777777773',
    instructionCode: 'STAI-000079',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2c1a-ambiguous-source-2|PRC-SOURCE-1',
    sliceKey: 'd2c1a-ambiguous-source-slice-2'
  });
  assert.equal((await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(firstBundle)).ok, true);
  assert.equal((await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(secondBundle)).ok, true);
  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  const availability = harness.StockModule.buildSanalTaksimPriorityLineAvailability(
    harness.line,
    harness.job,
    harness.PlanningModule.buildSanalTaksimSnapshot()
  );
  assert.equal(availability.directSendableQty, 5);
  assert.equal(availability.draftRebindPackages.filter((row) => row.setQty === 3).length, 2);
  const beforePlans = JSON.stringify(harness.data.montageDispatchPlans);
  const beforeInstructions = JSON.stringify(harness.data.sanalTaksimAllocationInstructions);
  selectD2B3PlanQty(harness, 3);
  assert.notEqual(await harness.StockModule.validateMontageReadyDetailSendPlan(), true);
  assert.equal(harness.getSaveCalls(), 2);
  assert.equal(JSON.stringify(harness.data.montageDispatchPlans), beforePlans);
  assert.equal(JSON.stringify(harness.data.sanalTaksimAllocationInstructions), beforeInstructions);
  assert.equal(harness.alerts.at(-1),
    'Bu sipariş için güvenli şekilde kullanılabilecek tek bir kaynak belirlenemedi. İşlem yapılmadı.');
});

test('D2C.1A ok-false exception ve conflictte kaynak ve hedef koleksiyonlarini tam rollback yapar', async () => {
  const cases = [
    { name: 'ok-false', result: { ok: false, code: 'rebind_rejected' } },
    { name: 'exception', error: new Error('rebind_exception') },
    { name: 'conflict', result: { ok: false, conflict: true, code: 'save_conflict' } }
  ];
  for (const entry of cases) {
    const harness = await buildD2C1AUiHarness({
      save: async (_options, call) => {
        if (call === 1) return { ok: true };
        if (entry.error) throw entry.error;
        return entry.result;
      }
    });
    const plansBefore = JSON.stringify(harness.data.montageDispatchPlans);
    const instructionsBefore = JSON.stringify(harness.data.sanalTaksimAllocationInstructions);
    harness.StockModule.startSanalTaksimPrioritySession();
    selectD2B3PlanQty(harness, 10);
    assert.equal(await submitD2B3PriorityPlan(harness), false, entry.name);
    assert.equal(harness.getSaveCalls(), 2, entry.name);
    assert.equal(JSON.stringify(harness.data.montageDispatchPlans), plansBefore, entry.name);
    assert.equal(JSON.stringify(harness.data.sanalTaksimAllocationInstructions), instructionsBefore, entry.name);
    assert.equal(harness.data.montageDispatchPlans[0].status, 'DRAFT', entry.name);
    assert.equal(harness.data.sanalTaksimAllocationInstructions[0].status, 'ACTIVE', entry.name);
    assert.ok(harness.StockModule.state.sanalTaksimPrioritySession, entry.name);
    assert.equal(harness.StockModule.state.sanalTaksimPrioritySession.saving, false, entry.name);
    assert.equal(harness.alerts.some((message) => /planı ve bağlı tahsis talimatı kaydedildi/.test(message)), false, entry.name);
  }
});

test('D2C.1A saving kilidi cift tikta tek cancel-and-replace ve tek strict save uretir', async () => {
  let releaseSave;
  const gate = new Promise((resolve) => { releaseSave = resolve; });
  const harness = await buildD2C1AUiHarness({
    save: async (_options, call) => call === 1 ? { ok: true } : gate
  });
  harness.StockModule.startSanalTaksimPrioritySession();
  selectD2B3PlanQty(harness, 10);
  assert.equal(await harness.StockModule.validateMontageReadyDetailSendPlan(), false);
  const first = harness.StockModule.confirmSanalTaksimPriorityConfirmation();
  const second = await harness.StockModule.validateMontageReadyDetailSendPlan();
  assert.equal(second, false);
  assert.equal(harness.StockModule.state.sanalTaksimPrioritySession.saving, true);
  releaseSave({ ok: true });
  assert.equal(await first, true);
  assert.equal(harness.getSaveCalls(), 2);
  assert.equal(harness.data.montageDispatchPlans.length, 2);
  assert.equal(harness.data.sanalTaksimAllocationInstructions.length, 2);
  assert.equal(harness.data.montageDispatchPlans.filter((row) => row.rebindAudit?.role === 'TARGET').length, 1);
});

test('D2C.1A bagimsiz D2A instructioni degistirmez ve sunucu atomik paketi kabul eder', async () => {
  const harness = buildD2B3UiHarness();
  const sourceBundle = buildD2B2AAtomicBundle(harness, harness.sor8, {
    qty: 10,
    planId: 'mgp-d2c1a-independent-source',
    planNo: 'MGP-D2C1A-INDEPENDENT-SOURCE',
    instructionId: '73737373-7373-4373-8373-737373737373',
    instructionCode: 'STAI-000073',
    idempotencyKey: 'PLAN_BOUND_MGP|mgp-d2c1a-independent-source|PRC-SOURCE-1',
    sliceKey: 'd2c1a-independent-source-slice'
  });
  assert.equal((await harness.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(sourceBundle)).ok, true);
  const independentRequest = buildD2ARequest(harness.data, harness.sor7, {
    id: '74747474-7474-4474-8474-747474747474',
    instructionCode: 'STAI-000074',
    idempotencyKey: 'd2c1a-independent-d2a',
    sliceKey: 'd2c1a-independent-d2a-slice',
    qty: 5,
    segmentOffsetStart: 10,
    segmentOffsetEnd: 15,
    reason: 'D2C.1A bağımsız D2A koruma testi'
  });
  assert.equal((await harness.PlanningModule.createSanalTaksimAllocationInstruction(independentRequest)).ok, true);
  const independentBefore = JSON.stringify(harness.data.sanalTaksimAllocationInstructions
    .find((row) => row.id === independentRequest.id));
  const beforeState = { data: JSON.parse(JSON.stringify(harness.data)) };
  assert.equal(harness.StockModule.startSanalTaksimPrioritySession(), true);
  selectD2B3PlanQty(harness, 10);
  assert.equal(await submitD2B3PriorityPlan(harness), true, harness.alerts.join(' | '));
  assert.equal(JSON.stringify(harness.data.sanalTaksimAllocationInstructions
    .find((row) => row.id === independentRequest.id)), independentBefore);
  assert.equal(harness.data.sanalTaksimAllocationInstructions
    .find((row) => row.id === independentRequest.id).status, 'ACTIVE');
  const server = require('../serve.js');
  assert.equal(server.isSanalTaksimDraftPlanBoundAtomicRebind(beforeState, { data: harness.data }), true);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(beforeState, { data: harness.data }), []);
});

test('D2C.1A read-model MGS MCT ve exact birim uyusmazligini fail-closed dislar', async () => {
  const harness = await buildD2C1AUiHarness();
  const request = buildD2C1AReadRequest(harness);
  const sourcePlanId = harness.sourceBundle.plan.id;
  assert.equal(harness.Resolver.resolveDraftPlanBoundRebindSelection(harness.data, request).packages.length, 1);

  harness.data.montageDispatchShipments.push({
    id: 'mgs-d2c1a-locked', planId: sourcePlanId, status: 'IN_TRANSIT'
  });
  assert.equal(harness.Resolver.resolveDraftPlanBoundRebindSelection(harness.data, request).packages.length, 0);
  harness.data.montageDispatchShipments = [];
  harness.data.montageCompletionTransfers.push({
    id: 'mct-d2c1a-locked', sourcePlanId, status: 'PENDING'
  });
  assert.equal(harness.Resolver.resolveDraftPlanBoundRebindSelection(harness.data, request).packages.length, 0);
  harness.data.montageCompletionTransfers = [];
  const mismatch = harness.Resolver.resolveDraftPlanBoundRebindSelection(
    harness.data,
    buildD2C1AReadRequest(harness, { unit: 'KG' })
  );
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.packages.length, 0);
});

test('D2C.1A tam cok-PRC rezerv paketini birlikte tasir ve iki exact hold ile sinirlar', async () => {
  const planning = loadD2APlanningHarness();
  const sourceBundle = buildD2B2BMultiPrcBundle(planning);
  assert.equal((await planning.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(sourceBundle)).ok, true);
  const beforeState = { data: JSON.parse(JSON.stringify(planning.snapshot)) };
  const physicalBefore = JSON.stringify({
    stockDepotItems: planning.snapshot.stockDepotItems,
    stockMovements: planning.snapshot.stock_movements,
    workOrderTransactions: planning.snapshot.workOrderTransactions
  });
  const targetBundle = buildD2B2AAtomicBundle(planning, planning.sor8, {
    qty: 5,
    planId: 'mgp-d2c1a-multi-target',
    planNo: 'MGP-D2C1A-MULTI-TARGET',
    instructionId: '75757575-7575-4575-8575-757575757575',
    instructionCode: 'STAI-000075',
    idempotencyKey: 'D2C1A_REBIND_MULTI_TARGET_PRC1',
    sliceKey: 'd2c1a-multi-target-prc1'
  });
  targetBundle.plan.items[0].recipeParts.push({
    refId: 'prc-source-2', code: 'PRC-SOURCE-2', unit: 'ADET', qtyPerSet: 1
  });
  targetBundle.plan.parts.push({
    source: 'component', refId: 'prc-source-2', code: 'PRC-SOURCE-2',
    unit: 'ADET', qtyPerSet: 1, requiredQty: 5
  });
  targetBundle.plan.exactReservations.push({
    reservationKey: 'MGP_EXACT|mgp-d2c1a-multi-target|PRC-SOURCE-2|0|5',
    planId: targetBundle.plan.id,
    sourceType: 'SALES_ORDER',
    sourceOrderId: planning.sor8.orderId,
    sourceLineId: planning.sor8.orderLineId,
    demandId: planning.sor8.demandId,
    itemKey: planning.sor8.itemKey,
    prcId: 'prc-source-2', prcCode: 'PRC-SOURCE-2', unit: 'ADET', partSource: 'component',
    physicalSegmentId: 'STOCK|stock-b', stockRowId: 'stock-b', sourceBucket: 'FROM_PRODUCTION',
    segmentOffsetStart: 0, segmentOffsetEnd: 5, qty: 5
  });
  targetBundle.instructionRequests.push(buildD2ARequest(planning.snapshot, planning.sor8, {
    id: '76767676-7676-4676-8676-767676767676',
    instructionCode: 'STAI-000076',
    idempotencyKey: 'D2C1A_REBIND_MULTI_TARGET_PRC2',
    prcId: 'prc-source-2', prcCode: 'PRC-SOURCE-2',
    stockRowId: 'stock-b', physicalSegmentId: 'STOCK|stock-b', segmentCapacityQtyAtCreate: 20,
    sliceKey: 'd2c1a-multi-target-prc2', qty: 5, segmentOffsetStart: 0, segmentOffsetEnd: 5,
    reason: 'D2C.1A tam çok PRC hedef tahsisi'
  }));
  targetBundle.sourceRebind = {
    sourcePlanId: sourceBundle.plan.id,
    rebindKey: `D2C1A_REBIND|${sourceBundle.plan.id}|${targetBundle.plan.id}|multi-test`,
    reason: 'Tam çok PRC paketi atomik yeniden bağlama testi'
  };
  const rebound = await planning.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(targetBundle);
  assert.equal(rebound.ok, true, JSON.stringify(rebound));
  assert.equal(rebound.sourcePlan.status, 'CANCELLED');
  assert.equal(rebound.sourceInstructions.length, 2);
  assert.equal(rebound.sourceInstructions.every((row) => row.status === 'CANCELLED'), true);
  assert.equal(rebound.instructions.length, 2);
  assert.equal(rebound.instructions.every((row) => row.status === 'ACTIVE'), true);
  const resolved = planning.Resolver.resolve(planning.snapshot);
  assert.equal(resolved.diagnostics.exactHoldLedger.valid, true);
  assert.equal(resolved.diagnostics.exactHoldLedger.holdCount, 2);
  assert.equal(JSON.stringify({
    stockDepotItems: planning.snapshot.stockDepotItems,
    stockMovements: planning.snapshot.stock_movements,
    workOrderTransactions: planning.snapshot.workOrderTransactions
  }), physicalBefore);
  const server = require('../serve.js');
  assert.equal(server.isSanalTaksimDraftPlanBoundAtomicRebind(beforeState, { data: planning.snapshot }), true);
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(
    beforeState,
    { data: planning.snapshot }
  ), []);
});

test('D2C.1A kismi cok-PRC paket tasimasini ve sunucuda bozuk cancel-and-replace paketini reddeder', async () => {
  const planning = loadD2APlanningHarness();
  const sourceBundle = buildD2B2BMultiPrcBundle(planning);
  const sourceCreated = await planning.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(sourceBundle);
  assert.equal(sourceCreated.ok, true, JSON.stringify(sourceCreated));
  const targetBundle = buildD2B2AAtomicBundle(planning, planning.sor8, {
    qty: 5,
    planId: 'mgp-d2c1a-partial-target',
    planNo: 'MGP-D2C1A-PARTIAL-TARGET',
    instructionId: '72727272-7272-4272-8272-727272727272',
    instructionCode: 'STAI-000072',
    idempotencyKey: 'D2C1A_REBIND_PARTIAL_TARGET',
    sliceKey: 'd2c1a-partial-target-slice'
  });
  targetBundle.sourceRebind = {
    sourcePlanId: sourceBundle.plan.id,
    rebindKey: `D2C1A_REBIND|${sourceBundle.plan.id}|${targetBundle.plan.id}|partial-test`,
    reason: 'Kısmi çok PRC testi'
  };
  const partial = await planning.PlanningModule.createSanalTaksimPlanBoundMontageAllocation(targetBundle);
  assert.equal(partial.ok, false);
  assert.equal(partial.reasonCode, 'DRAFT_REBIND_SOURCE_PACKAGE_STALE');
  assert.equal(planning.getSaveCalls(), 1);
  assert.equal(planning.snapshot.montageDispatchPlans.length, 1);

  const valid = await buildD2C1AUiHarness();
  const beforeState = { data: JSON.parse(JSON.stringify(valid.data)) };
  valid.StockModule.startSanalTaksimPrioritySession();
  selectD2B3PlanQty(valid, 10);
  assert.equal(await submitD2B3PriorityPlan(valid), true);
  const server = require('../serve.js');
  const afterState = { data: JSON.parse(JSON.stringify(valid.data)) };
  assert.equal(server.isSanalTaksimDraftPlanBoundAtomicRebind(beforeState, afterState), true);
  const mutators = [
    (state) => { state.data.montageDispatchPlans.find((row) => row.rebindAudit?.role === 'SOURCE').status = 'DRAFT'; },
    (state) => { state.data.sanalTaksimAllocationInstructions.find((row) => row.status === 'CANCELLED').status = 'ACTIVE'; },
    (state) => { state.data.montageDispatchPlans.find((row) => row.rebindAudit?.role === 'TARGET').exactReservations[0].qty -= 1; },
    (state) => { state.data.sanalTaksimAllocationInstructions.find((row) => row.rebindAudit?.role === 'TARGET').slices[0].segmentOffsetEnd -= 1; }
  ];
  mutators.forEach((mutate) => {
    const invalid = JSON.parse(JSON.stringify(afterState));
    mutate(invalid);
    assert.equal(server.isSanalTaksimDraftPlanBoundAtomicRebind(beforeState, invalid), false);
    assert.ok(server.validateSanalTaksimAllocationInstructionTransitions(beforeState, invalid).length > 0);
  });
});

test('D2A ACTIVE exact talimat 5 adedi once hedef SORa verir ve fiziksel 20 adedi cift saymaz', () => {
  const harness = loadD2APlanningHarness();
  const before = JSON.stringify(harness.snapshot);
  const automatic = harness.Resolver.resolve(harness.snapshot);
  assert.equal(getD2AOrderAllocationQty(automatic, harness.sor8.orderId), 10);
  assert.equal(getD2AOrderAllocationQty(automatic, harness.sor7.orderId), 10);
  const request = buildD2ARequest(harness.snapshot, harness.sor8);
  const preview = harness.PlanningModule.previewSanalTaksimAllocationInstruction(request);
  assert.equal(preview.ok, true, JSON.stringify({
    preview,
    segment: automatic.segments.find((row) => row.stockRowId === 'stock-a')
  }));
  assert.equal(preview.allocations.reduce((sum, row) => sum + Number(row.allocatedByInstructionQty || 0), 0), 5);
  const result = preview.resolved;
  assert.equal(getD2AOrderAllocationQty(result, harness.sor8.orderId), 10);
  assert.equal(getD2AOrderAllocationQty(result, harness.sor7.orderId), 10);
  assert.equal(result.allocations.filter((row) => row.physicalSegmentId === 'STOCK|stock-a')
    .reduce((sum, row) => sum + Number(row.qty || 0), 0), 20);
  const instructed = result.allocations.find((row) => row.instructionId === request.id);
  assert.equal(instructed.instructionCode, 'STAI-000001');
  assert.equal(instructed.instructionSliceKey, 'd2a-slice-1');
  assert.equal(instructed.targetOrderId, harness.sor8.orderId);
  assert.equal(instructed.stockRowId, 'stock-a');
  assert.equal(instructed.physicalOriginAudit.originDemandId, 'demand-a');
  assert.equal(JSON.stringify(harness.snapshot), before);
  assert.equal(JSON.stringify(harness.Resolver.resolve({
    ...harness.snapshot,
    sanalTaksimAllocationInstructions: [preview.instruction]
  })), JSON.stringify(result));
});

test('D2A create idempotenttir, tek strict save yapar ve farkli payloadi reddeder', async () => {
  let releaseSave;
  const saveGate = new Promise((resolve) => { releaseSave = resolve; });
  const harness = loadD2APlanningHarness({ save: async () => saveGate });
  const request = buildD2ARequest(harness.snapshot, harness.sor8);
  const firstPromise = harness.PlanningModule.createSanalTaksimAllocationInstruction(request);
  const concurrent = await harness.PlanningModule.createSanalTaksimAllocationInstruction(request);
  assert.equal(concurrent.ok, false);
  assert.equal(concurrent.reasonCode, 'INSTRUCTION_SAVE_PENDING');
  releaseSave({ ok: true });
  const first = await firstPromise;
  assert.equal(first.ok, true);
  assert.equal(harness.getSaveCalls(), 1);
  assert.equal(JSON.stringify(harness.saveOptions), JSON.stringify([{ conflictStrategy: 'fail' }]));
  const duplicate = await harness.PlanningModule.createSanalTaksimAllocationInstruction(request);
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.idempotent, true);
  assert.equal(harness.getSaveCalls(), 1);
  const conflict = await harness.PlanningModule.createSanalTaksimAllocationInstruction({ ...request, qty: 4 });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.reasonCode, 'INSTRUCTION_IDEMPOTENCY_CONFLICT');
  assert.equal(harness.snapshot.sanalTaksimAllocationInstructions.length, 1);
});

test('D2A create ok false, exception ve revision conflict sonucunda tam rollback yapar ve retry yapmaz', async () => {
  const cases = [
    { result: { ok: false, code: 'save_failed' }, reasonCode: 'INSTRUCTION_SAVE_FAILED' },
    { error: new Error('save exception'), reasonCode: 'INSTRUCTION_SAVE_FAILED' },
    { result: { ok: false, code: 'save_conflict', conflict: true }, reasonCode: 'INSTRUCTION_REVISION_CONFLICT' }
  ];
  for (const entry of cases) {
    const harness = loadD2APlanningHarness({
      save: async () => {
        if (entry.error) throw entry.error;
        return entry.result;
      }
    });
    const before = JSON.stringify(harness.snapshot);
    const result = await harness.PlanningModule.createSanalTaksimAllocationInstruction(
      buildD2ARequest(harness.snapshot, harness.sor8)
    );
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, entry.reasonCode);
    assert.equal(harness.getSaveCalls(), 1);
    assert.equal(JSON.stringify(harness.snapshot), before);
    assert.equal(harness.PlanningModule.state.sanalTaksimAllocationInstructionPendingKey, '');
  }
});

test('D2A cancel append-only olay ekler, tek strict save yapar ve ortak 10/10 dagilimini geri getirir', async () => {
  const harness = loadD2APlanningHarness();
  const created = await harness.PlanningModule.createSanalTaksimAllocationInstruction(
    buildD2ARequest(harness.snapshot, harness.sor8)
  );
  assert.equal(created.ok, true);
  const protectedCollections = ['orders', 'planningDemands', 'workOrders', 'workOrderTransactions',
    'stockDepotItems', 'stock_movements', 'montageDispatchPlans', 'montageDispatchShipments',
    'montageCompletionTransfers', 'salesShipmentPlans'];
  const beforeProtected = Object.fromEntries(protectedCollections.map((key) => [key, JSON.stringify(harness.snapshot[key] || [])]));
  const cancelled = await harness.PlanningModule.cancelSanalTaksimAllocationInstruction(
    created.instruction.id,
    'Kullanici iptali',
    { now: '2026-07-31T10:00:00.000Z', eventId: '22222222-2222-4222-8222-222222222222' }
  );
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.instruction.status, 'CANCELLED');
  assert.deepEqual(JSON.parse(JSON.stringify(cancelled.instruction.events)), [{
    eventId: '22222222-2222-4222-8222-222222222222',
    type: 'CANCELLED', at: '2026-07-31T10:00:00.000Z', by: 'D2A Test', reason: 'Kullanici iptali'
  }]);
  const second = await harness.PlanningModule.cancelSanalTaksimAllocationInstruction(
    created.instruction.id,
    'Ikinci tiklama'
  );
  assert.equal(second.idempotent, true);
  assert.equal(harness.getSaveCalls(), 2);
  const resolved = harness.Resolver.resolve(harness.snapshot);
  assert.equal(getD2AOrderAllocationQty(resolved, harness.sor8.orderId), 10);
  assert.equal(getD2AOrderAllocationQty(resolved, harness.sor7.orderId), 10);
  protectedCollections.forEach((key) => assert.equal(JSON.stringify(harness.snapshot[key] || []), beforeProtected[key]));
});

test('D2A cancel ok false, exception ve revision conflict sonucunda tam rollback yapar ve retry yapmaz', async () => {
  const cases = [
    { result: { ok: false, code: 'save_failed' }, reasonCode: 'INSTRUCTION_CANCEL_SAVE_FAILED' },
    { error: new Error('cancel exception'), reasonCode: 'INSTRUCTION_CANCEL_SAVE_FAILED' },
    { result: { ok: false, code: 'save_conflict', conflict: true }, reasonCode: 'INSTRUCTION_REVISION_CONFLICT' }
  ];
  for (const entry of cases) {
    const harness = loadD2APlanningHarness({
      save: async (_options, calls) => {
        if (calls === 1) return { ok: true };
        if (entry.error) throw entry.error;
        return entry.result;
      }
    });
    const created = await harness.PlanningModule.createSanalTaksimAllocationInstruction(
      buildD2ARequest(harness.snapshot, harness.sor8)
    );
    assert.equal(created.ok, true);
    const beforeCancel = JSON.stringify(harness.snapshot);
    const result = await harness.PlanningModule.cancelSanalTaksimAllocationInstruction(
      created.instruction.id,
      'Rollback testi',
      { now: '2026-07-31T10:00:00.000Z', eventId: '22222222-2222-4222-8222-222222222222' }
    );
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, entry.reasonCode);
    assert.equal(harness.getSaveCalls(), 2);
    assert.equal(JSON.stringify(harness.snapshot), beforeCancel);
    assert.equal(harness.PlanningModule.state.sanalTaksimAllocationInstructionPendingKey, '');
  }
});

test('D2A.1 resolver gecersiz ACTIVE talimati dogrudan instruction ve slice kimligiyle fail-closed tutar', () => {
  const harness = loadD2APlanningHarness();
  const preview = harness.PlanningModule.previewSanalTaksimAllocationInstruction(
    buildD2ARequest(harness.snapshot, harness.sor8)
  );
  assert.equal(preview.ok, true);
  const cases = [
    (snapshot) => { snapshot.stockDepotItems[0].qty = 19; snapshot.stockDepotItems[0].quantity = 19; snapshot.stockDepotItems[0].amount = 19; },
    (snapshot) => { snapshot.stockDepotItems = []; },
    (snapshot) => { snapshot.stockDepotItems[0].demandId = 'changed-origin'; },
    (snapshot) => { snapshot.stockDepotItems[0].id = 'stock-a-replacement'; },
    (snapshot) => {
      const overlapping = JSON.parse(JSON.stringify(snapshot.sanalTaksimAllocationInstructions[0]));
      overlapping.id = '77777777-7777-4777-8777-777777777777';
      overlapping.instructionCode = 'STAI-000007';
      overlapping.idempotencyKey = 'd2a-overlap-key';
      overlapping.slices[0].sliceKey = 'd2a-overlap-slice';
      overlapping.slices[0].segmentOffsetStart = 4;
      overlapping.slices[0].segmentOffsetEnd = 9;
      snapshot.sanalTaksimAllocationInstructions.push(overlapping);
    }
  ];
  cases.forEach((mutate) => {
    const snapshot = JSON.parse(JSON.stringify(harness.snapshot));
    snapshot.sanalTaksimAllocationInstructions = [JSON.parse(JSON.stringify(preview.instruction))];
    mutate(snapshot);
    const result = harness.Resolver.resolve(snapshot);
    const segment = result.segments.find((row) => row.stockRowId === 'stock-a')
      || result.segments.find((row) => row.stockRowId === 'stock-a-replacement');
    if (segment) assert.equal(segment.allocatableQty, 0);
    assert.equal(result.allocations.some((row) => row.instructionId === preview.instruction.id), false);
    const issue = result.diagnostics.exactHoldLedger.issues
      .find((row) => row.instructionId === preview.instruction.id);
    assert.ok(issue);
    assert.equal(issue.instructionSliceKey, preview.instruction.slices[0].sliceKey);
  });
});

test('D2A.1 hedef borc 5ten 3e azalinca exact 2 miktari acik diagnostics ile karantinada tutar', () => {
  const harness = loadD2APlanningHarness();
  const preview = harness.PlanningModule.previewSanalTaksimAllocationInstruction(
    buildD2ARequest(harness.snapshot, harness.sor8, { qty: 5 })
  );
  assert.equal(preview.ok, true);
  const snapshot = JSON.parse(JSON.stringify(harness.snapshot));
  snapshot.sanalTaksimAllocationInstructions = [preview.instruction];
  const beforeNormalResolve = JSON.stringify(snapshot);
  const normalResult = harness.Resolver.resolve(snapshot);
  assert.equal(JSON.stringify(snapshot), beforeNormalResolve);
  assert.equal(normalResult.allocations
    .filter((row) => row.instructionId === preview.instruction.id)
    .reduce((sum, row) => sum + Number(row.allocatedByInstructionQty || 0), 0), 5);
  assert.equal(normalResult.diagnostics.exactHoldLedger.instructionDiagnostics
    .some((row) => row.instructionId === preview.instruction.id), false);

  snapshot.orders.find((row) => row.id === harness.sor8.orderId).lines[0].qty = 3;
  snapshot.planningDemands.find((row) => row.id === harness.sor8.demandId).items[0].qty = 3;
  snapshot.workOrders.find((row) => row.id === harness.sor8.workOrderId).lines[0].targetQty = 3;
  const beforeReducedResolve = JSON.stringify(snapshot);
  const result = harness.Resolver.resolve(snapshot);
  assert.equal(JSON.stringify(snapshot), beforeReducedResolve);
  const instructedQty = result.allocations
    .filter((row) => row.instructionId === preview.instruction.id)
    .reduce((sum, row) => sum + Number(row.allocatedByInstructionQty || 0), 0);
  assert.equal(instructedQty, 3);
  const allocatedPhysicalQty = result.allocations
    .filter((row) => row.physicalSegmentId === 'STOCK|stock-a')
    .reduce((sum, row) => sum + Number(row.qty || 0), 0);
  assert.equal(allocatedPhysicalQty, 18);
  assert.equal(getD2AOrderAllocationQty(result, harness.sor8.orderId), 3);
  assert.equal(getD2AOrderAllocationQty(result, harness.sor7.orderId), 15);
  assert.equal(result.allocations.some((allocation) => {
    const debt = result.debts.find((row) => row.debtKey === allocation.targetDebtKey);
    return debt?.debtType === 'STOCK';
  }), false);
  const segment = result.segments.find((row) => row.stockRowId === 'stock-a');
  assert.equal(segment.heldQty, 5);
  assert.equal(segment.sharedPoolQty, 15);
  assert.equal(segment.remainingAllocatableQty, 0);
  const diagnostic = result.diagnostics.exactHoldLedger.instructionDiagnostics
    .find((row) => row.instructionId === preview.instruction.id);
  assert.deepEqual(JSON.parse(JSON.stringify(diagnostic)), {
    instructionId: preview.instruction.id,
    instructionCode: preview.instruction.instructionCode,
    instructionSliceKey: preview.instruction.slices[0].sliceKey,
    physicalSegmentId: 'STOCK|stock-a',
    stockRowId: 'stock-a',
    reasonCode: 'INSTRUCTION_QTY_EXCEEDS_TARGET_OPEN_QTY',
    quarantinedQty: 2,
    instructionQty: 5,
    allocatedByInstructionQty: 3,
    targetOpenQty: 3,
    targetDemandId: harness.sor8.demandId,
    targetItemKey: harness.sor8.itemKey
  });
  assert.equal(allocatedPhysicalQty + diagnostic.quarantinedQty, 20);
  assert.ok(result.diagnostics.unresolvedExactHoldKeys.some((key) => String(key).includes(preview.instruction.id)));
});

test('D2A.1 hedef borc kaybolunca fail-closed diagnostics dogrudan instruction kimligini tasir', () => {
  const harness = loadD2APlanningHarness();
  const preview = harness.PlanningModule.previewSanalTaksimAllocationInstruction(
    buildD2ARequest(harness.snapshot, harness.sor8, { qty: 5 })
  );
  assert.equal(preview.ok, true);
  const snapshot = JSON.parse(JSON.stringify(harness.snapshot));
  snapshot.sanalTaksimAllocationInstructions = [preview.instruction];
  snapshot.planningDemands = snapshot.planningDemands
    .filter((row) => row.id !== harness.sor8.demandId);
  const before = JSON.stringify(snapshot);
  const result = harness.Resolver.resolve(snapshot);
  assert.equal(JSON.stringify(snapshot), before);
  assert.equal(result.allocations.some((row) => row.instructionId === preview.instruction.id), false);
  const segment = result.segments.find((row) => row.stockRowId === 'stock-a');
  assert.equal(segment.allocationStateReasonCode, 'INSTRUCTION_FAIL_CLOSED');
  assert.equal(segment.allocatableQty, 0);
  const diagnostic = result.diagnostics.exactHoldLedger.instructionDiagnostics
    .find((row) => row.instructionId === preview.instruction.id);
  assert.equal(diagnostic.instructionSliceKey, preview.instruction.slices[0].sliceKey);
  assert.equal(diagnostic.reasonCode, 'INSTRUCTION_TARGET_DEBT_UNRESOLVED');
  assert.equal(diagnostic.quarantinedQty, 5);
  assert.equal(diagnostic.allocatedByInstructionQty, 0);
  assert.equal(diagnostic.targetOpenQty, null);
});

test('D2A resolver fiziksel kapsam ve operasyon hold cakismalarini reddeder', () => {
  const cases = [
    (snapshot) => { snapshot.stockDepotItems[0].depotId = 'side'; snapshot.stockDepotItems[0].nodeKey = 'managed:side'; },
    (snapshot) => { snapshot.stockDepotItems[0].sourceType = 'UNSCOPED'; },
    (snapshot) => { snapshot.stockDepotItems[0].status = 'LOCKED'; snapshot.stockDepotItems[0].stockClass = 'LOCKED'; },
    (snapshot) => { snapshot.stockDepotItems[0].status = 'UNCERTAIN'; snapshot.stockDepotItems[0].stockClass = 'UNCERTAIN'; },
    (snapshot) => { snapshot.stockDepotItems[0].status = 'CONSUMED'; snapshot.stockDepotItems[0].stockClass = 'CONSUMED'; },
    (snapshot) => { snapshot.stockDepotItems[0].status = 'SHIPPED'; snapshot.stockDepotItems[0].stockClass = 'SHIPPED'; },
    (snapshot) => { snapshot.stockDepotItems[0].allocationType = 'RESERVED'; },
    (snapshot) => { snapshot.stockDepotItems[0].refId = 'wrong-prc'; },
    (snapshot) => { snapshot.stockDepotItems[0].unit = 'KG'; }
  ];
  cases.forEach((mutate) => {
    const harness = loadD2APlanningHarness();
    const request = buildD2ARequest(harness.snapshot, harness.sor8);
    mutate(harness.snapshot);
    const result = harness.PlanningModule.previewSanalTaksimAllocationInstruction(request);
    assert.equal(result.ok, false);
  });

  [
    { stockRowId: 'stock-a', qty: 2, segmentOffsetStart: 4, segmentOffsetEnd: 6 },
    { stockRowId: 'stock-a', qty: 2 }
  ].forEach((hold) => {
    const harness = loadD2APlanningHarness();
    const request = buildD2ARequest(harness.snapshot, harness.sor8);
    harness.snapshot.montageDispatchPlans = [{ id: 'mgp-d2a', status: 'DRAFT', exactReservations: [hold] }];
    const result = harness.PlanningModule.previewSanalTaksimAllocationInstruction(request);
    assert.equal(result.ok, false);
    assert.equal(result.reasonCode, 'INSTRUCTION_EXACT_HOLD_CONFLICT');
  });

  const workSnapshot = buildSanalTaksimPhase2Snapshot();
  const workResolver = loadSanalTaksimResolver();
  const workResult = workResolver.resolve(workSnapshot);
  const workSegment = workResult.segments.find((row) => row.sourceKind === 'WORK_ORDER');
  const workDebt = workResult.debts.find((row) => row.debtType === 'SALES');
  const workPlanning = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { meta: { activeUserName: 'D2A Test' }, data: workSnapshot } },
    SanalTaksimResolver: workResolver
  }).exported;
  const workPreview = workPlanning.previewSanalTaksimAllocationInstruction({
    id: '55555555-5555-4555-8555-555555555555', instructionCode: 'STAI-000005',
    idempotencyKey: 'd2a-work', prcId: workDebt.prcId, prcCode: workDebt.prcCode,
    unit: workDebt.unit, qty: 5, reason: 'WORK kapsam testi',
    createdAt: '2026-07-31T09:00:00.000Z', createdBy: 'D2A Test',
    target: {
      sourceOrderId: workDebt.originOrderId, sourceLineId: workDebt.originOrderLineId,
      demandId: workDebt.originDemandId, itemKey: workDebt.originItemKey
    },
    slices: [{
      sliceKey: 'd2a-work-slice', stockRowId: 'not-a-stock-row',
      physicalSegmentId: workSegment.segmentKey,
      segmentCapacityQtyAtCreate: workSegment.physicalQty,
      segmentOffsetStart: 0, segmentOffsetEnd: 5, qty: 5
    }]
  });
  assert.equal(workPreview.ok, false);
  assert.equal(workPreview.reasonCode, 'INSTRUCTION_SLICE_INVALID');
});

test('D2A MGS MCT ve SVP operasyon benimsemesini create ve cancel oncesinde durdurur', async () => {
  const operationalCases = [
    (snapshot) => { snapshot.montageDispatchShipments = [{ status: 'DISPATCHED', allocations: [{ stockRowId: 'stock-a', qty: 1 }] }]; },
    (snapshot) => { snapshot.montageCompletionTransfers = [{ status: 'COMPLETED', componentAllocations: [{ stockRowId: 'stock-a', qty: 1 }] }]; },
    (snapshot) => { snapshot.salesShipmentPlans = [{ status: 'PLANNED', items: [{ stockAllocations: [{ stockItemId: 'stock-a', allocatedQty: 1 }] }] }]; }
  ];
  operationalCases.forEach((adopt) => {
    const harness = loadD2APlanningHarness();
    const request = buildD2ARequest(harness.snapshot, harness.sor8);
    adopt(harness.snapshot);
    const preview = harness.PlanningModule.previewSanalTaksimAllocationInstruction(request);
    assert.equal(preview.ok, false);
    assert.equal(preview.reasonCode, 'INSTRUCTION_EXACT_HOLD_CONFLICT');
  });

  const targetHoldHarness = loadD2APlanningHarness();
  const targetHoldRequest = buildD2ARequest(targetHoldHarness.snapshot, targetHoldHarness.sor8);
  targetHoldHarness.snapshot.salesShipmentPlans = [{
    id: 'svp-target-hold',
    status: 'PLANNED',
    sourceOrderId: targetHoldHarness.sor8.orderId,
    items: [{
      sourceLineId: targetHoldHarness.sor8.orderLineId,
      stockAllocations: [{
        stockItemId: 'different-stock-row',
        prcId: 'prc-source-1',
        prcCode: 'PRC-SOURCE-1',
        unit: 'ADET',
        allocatedQty: 8
      }]
    }]
  }];
  const targetHoldPreview = targetHoldHarness.PlanningModule
    .previewSanalTaksimAllocationInstruction(targetHoldRequest);
  assert.equal(targetHoldPreview.ok, false);
  assert.equal(targetHoldPreview.reasonCode, 'INSTRUCTION_TARGET_HOLD_EXCEEDS_DEBT');

  const harness = loadD2APlanningHarness();
  const created = await harness.PlanningModule.createSanalTaksimAllocationInstruction(
    buildD2ARequest(harness.snapshot, harness.sor8)
  );
  harness.snapshot.salesShipmentPlans = [{
    status: 'PLANNED', items: [{ stockAllocations: [{ stockItemId: 'stock-a', allocatedQty: 1 }] }]
  }];
  const before = JSON.stringify(harness.snapshot);
  const cancelled = await harness.PlanningModule.cancelSanalTaksimAllocationInstruction(
    created.instruction.id,
    'Operasyon benimsemesi'
  );
  assert.equal(cancelled.ok, false);
  assert.equal(cancelled.reasonCode, 'INSTRUCTION_OPERATIONALLY_ADOPTED');
  assert.equal(harness.getSaveCalls(), 1);
  assert.equal(JSON.stringify(harness.snapshot), before);
});

test('D2A operasyon hold exact PRC ve birim bazinda izole edilir', () => {
  const target = {
    sourceOrderId: 'sor-operational-hold',
    sourceLineId: 'sor-line-operational-hold',
    demandId: 'pln-operational-hold',
    itemKey: 'pln-item-operational-hold'
  };
  const exactA = { prcId: 'prc-a', prcCode: 'PRC-A', unit: 'ADET' };
  const exactB = { prcId: 'prc-b', prcCode: 'PRC-B', unit: 'ADET' };
  const buildHarness = ({ status, holdA = 3, ambiguousA = false }) => {
    const snapshot = {
      partComponentCards: [],
      workOrders: [],
      workOrderTransactions: [],
      stockDepotItems: [],
      stock_movements: [],
      orders: [],
      planningDemands: [],
      salesShipments: [],
      salesShipmentPlans: [],
      montageDispatchPlans: [],
      montageCompletionTransfers: [],
      sanalTaksimAllocationInstructions: [],
      montageDispatchShipments: [{
        id: `mgs-operational-hold-${status.toLowerCase()}`,
        status,
        parts: [{
          allocations: [{
            ...target,
            ...(ambiguousA ? {} : exactA),
            stockRowId: 'hold-stock-a',
            qty: holdA
          }, {
            ...target,
            ...exactB,
            stockRowId: 'hold-stock-b',
            qty: 6
          }]
        }]
      }]
    };
    const makeSegment = (stockRowId, exact) => ({
      segmentKey: `STOCK|${stockRowId}`,
      stockRowId,
      sourceKind: 'CURRENT_STOCK_ROW',
      stage: 'DEPOT_STOCK',
      mainDepot: true,
      allocationState: 'REALLOCATABLE',
      reallocatable: true,
      physicalQty: 20,
      originSourceType: 'SALES_ORDER',
      originOrderId: 'source-order',
      originOrderLineId: 'source-line',
      originDemandId: 'source-demand',
      originItemKey: 'source-item',
      originWorkOrderId: '',
      originWorkOrderLineId: '',
      evidenceIds: [`evidence-${stockRowId}`],
      ...exact
    });
    const debts = [{
      debtType: 'SALES',
      allocationEligible: true,
      openDebtQty: 5,
      originOrderId: target.sourceOrderId,
      originOrderLineId: target.sourceLineId,
      originDemandId: target.demandId,
      originItemKey: target.itemKey,
      ...exactA
    }, {
      debtType: 'SALES',
      allocationEligible: true,
      openDebtQty: 10,
      originOrderId: target.sourceOrderId,
      originOrderLineId: target.sourceLineId,
      originDemandId: target.demandId,
      originItemKey: target.itemKey,
      ...exactB
    }];
    const Resolver = {
      resolveMontageShipmentOperationalTarget: () => ({ ok: true, rebound: false, target: null }),
      resolve: (source) => ({
        debts,
        segments: [makeSegment('stock-a', exactA), makeSegment('stock-b', exactB)],
        allocations: (Array.isArray(source?.sanalTaksimAllocationInstructions)
          ? source.sanalTaksimAllocationInstructions : []).map((instruction) => ({
          instructionId: instruction.id,
          allocatedByInstructionQty: instruction.qty
        })),
        diagnostics: { exactHoldLedger: { issues: [] }, unresolvedExactHoldKeys: [] }
      })
    };
    const PlanningModule = loadModule('src/modules/planning-module.js', 'PlanningModule', {
      DB: { data: { meta: { activeUserName: 'Hold Test' }, data: snapshot } },
      SanalTaksimResolver: Resolver,
      crypto: { randomUUID: () => '77777777-7777-4777-8777-777777777777' }
    }).exported;
    const request = (exact, qty, stockRowId, suffix) => ({
      id: `77777777-7777-4777-8777-${String(suffix).padStart(12, '0')}`,
      instructionCode: `STAI-${String(suffix).padStart(6, '0')}`,
      idempotencyKey: `operational-hold-${suffix}`,
      reason: 'Exact PRC operasyon hold regresyonu',
      createdAt: '2026-08-24T10:00:00.000Z',
      createdBy: 'Hold Test',
      target,
      ...exact,
      qty,
      slices: [{
        sliceKey: `operational-hold-slice-${suffix}`,
        stockRowId,
        physicalSegmentId: `STOCK|${stockRowId}`,
        segmentCapacityQtyAtCreate: 20,
        segmentOffsetStart: 0,
        segmentOffsetEnd: qty,
        qty
      }]
    });
    return { PlanningModule, snapshot, request };
  };

  ['RECEIVED', 'IN_TRANSIT'].forEach((status, index) => {
    const harness = buildHarness({ status });
    assert.equal(harness.PlanningModule.getSanalTaksimOperationalTargetHoldQty(
      target, harness.snapshot, exactA
    ), 3);
    assert.equal(harness.PlanningModule.getSanalTaksimOperationalTargetHoldQty(
      target, harness.snapshot, exactB
    ), 6);
    const prcA = harness.PlanningModule.previewSanalTaksimAllocationInstruction(
      harness.request(exactA, 2, 'stock-a', index * 2 + 1)
    );
    const prcB = harness.PlanningModule.previewSanalTaksimAllocationInstruction(
      harness.request(exactB, 4, 'stock-b', index * 2 + 2)
    );
    assert.equal(prcA.ok, true);
    assert.equal(prcB.ok, true);
  });

  const exceeded = buildHarness({ status: 'RECEIVED', holdA: 4 });
  const exceededPreview = exceeded.PlanningModule.previewSanalTaksimAllocationInstruction(
    exceeded.request(exactA, 2, 'stock-a', 5)
  );
  assert.equal(exceededPreview.ok, false);
  assert.equal(exceededPreview.reasonCode, 'INSTRUCTION_TARGET_HOLD_EXCEEDS_DEBT');
  assert.equal(exceededPreview.operationalTargetHoldQty, 4);
  assert.equal(exceededPreview.openDebtQty, 5);

  const ambiguous = buildHarness({ status: 'RECEIVED', ambiguousA: true });
  assert.equal(ambiguous.PlanningModule.getSanalTaksimOperationalTargetHoldQty(
    target, ambiguous.snapshot, exactA
  ), null);
  const ambiguousPreview = ambiguous.PlanningModule.previewSanalTaksimAllocationInstruction(
    ambiguous.request(exactA, 2, 'stock-a', 6)
  );
  assert.equal(ambiguousPreview.ok, false);
  assert.equal(ambiguousPreview.reasonCode, 'INSTRUCTION_TARGET_HOLD_UNRESOLVED');
});

test('D2A server schema duplicate overlap fiziksel kapsam ve operasyon holdlarini reddeder', () => {
  const server = require('../serve.js');
  const harness = loadD2APlanningHarness();
  const preview = harness.PlanningModule.previewSanalTaksimAllocationInstruction(
    buildD2ARequest(harness.snapshot, harness.sor8)
  );
  assert.equal(preview.ok, true);
  const state = { data: { ...harness.snapshot, sanalTaksimAllocationInstructions: [preview.instruction] } };
  assert.deepEqual(server.validateSanalTaksimAllocationInstructions(state), []);

  ['id', 'instructionCode', 'idempotencyKey'].forEach((field) => {
    const incoming = JSON.parse(JSON.stringify(state));
    const duplicate = JSON.parse(JSON.stringify(preview.instruction));
    Object.assign(duplicate, {
      id: '33333333-3333-4333-8333-333333333333',
      instructionCode: 'STAI-000002',
      idempotencyKey: 'd2a-key-2'
    });
    Object.assign(duplicate.slices[0], {
      sliceKey: 'd2a-slice-2', segmentOffsetStart: 5, segmentOffsetEnd: 10
    });
    duplicate[field] = preview.instruction[field];
    incoming.data.sanalTaksimAllocationInstructions.push(duplicate);
    assert.ok(server.validateSanalTaksimAllocationInstructions(incoming)
      .some((issue) => issue.includes(`${field} mükerrerdir`)));
  });

  const overlap = JSON.parse(JSON.stringify(state));
  const second = JSON.parse(JSON.stringify(preview.instruction));
  Object.assign(second, {
    id: '33333333-3333-4333-8333-333333333333',
    instructionCode: 'STAI-000002',
    idempotencyKey: 'd2a-key-2'
  });
  Object.assign(second.slices[0], {
    sliceKey: 'd2a-slice-2', segmentOffsetStart: 4, segmentOffsetEnd: 9
  });
  overlap.data.sanalTaksimAllocationInstructions.push(second);
  assert.ok(server.validateSanalTaksimAllocationInstructions(overlap).some((issue) => /kesişemez/.test(issue)));

  const physicalCases = [
    (data) => { data.stockDepotItems[0].depotId = 'side'; data.stockDepotItems[0].nodeKey = 'managed:side'; },
    (data) => { data.stockDepotItems[0].status = 'LOCKED'; data.stockDepotItems[0].stockClass = 'LOCKED'; },
    (data) => { data.stockDepotItems[0].allocationType = 'FROM_SEMI'; },
    (data) => { data.stockDepotItems[0].refId = 'wrong-prc'; },
    (data) => { data.stockDepotItems[0].unit = 'KG'; }
  ];
  physicalCases.forEach((mutate) => {
    const invalid = JSON.parse(JSON.stringify(state));
    mutate(invalid.data);
    assert.ok(server.validateSanalTaksimAllocationInstructions(invalid).length > 0);
  });

  const exactHold = JSON.parse(JSON.stringify(state));
  exactHold.data.montageDispatchPlans = [{
    id: 'mgp-d2a', status: 'DRAFT', exactReservations: [{
      stockRowId: 'stock-a', qty: 2, segmentOffsetStart: 4, segmentOffsetEnd: 6
    }]
  }];
  assert.ok(server.validateSanalTaksimOperationalHoldConflicts(exactHold).length > 0);
  exactHold.data.montageDispatchPlans[0].exactReservations[0] = { stockRowId: 'stock-a', qty: 2 };
  assert.ok(server.validateSanalTaksimOperationalHoldConflicts(exactHold).length > 0);
});

test('D2A frozen evidence MGS-000009 terminal POSTED MCT sonrasında SOR-000016 residual rangeini serbest bırakır', () => {
  const server = require('../serve.js');
  const Resolver = require('../src/core/sanal-taksim-resolver.js');
  const current = JSON.parse(fs.readFileSync(path.join(
    __dirname,
    '..',
    '.state-evidence',
    '2026-09-01_pre_e2e',
    '2026-08-31T12-35-05-924Z_r011923_before-save.json'
  ), 'utf8'));
  assert.equal(current.meta.revision, 11923);
  const shipment = current.data.montageDispatchShipments.find((row) => row.shipmentNo === 'MGS-000009');
  assert.ok(shipment);
  assert.equal(shipment.status, 'RECEIVED');
  const transfer = current.data.montageCompletionTransfers.find((row) => row.transferNo === 'MCT-000014');
  assert.ok(transfer);
  assert.equal(transfer.status, 'POSTED');
  assert.deepEqual(server.validateSanalTaksimOperationalHoldConflicts(current), []);

  const targetOrder = current.data.orders.find((row) => row.orderNo === 'SOR-000016');
  const targetDemand = current.data.planningDemands.find((row) => row.demandCode === 'PLN-000024');
  const targetLine = targetOrder?.lines?.find((row) => row.id === targetDemand?.sourceLineId);
  const targetItem = targetDemand?.items?.[0];
  const item = shipment.items[0];
  assert.ok(targetOrder && targetDemand && targetLine && targetItem && item);
  assert.equal(targetLine.variantCode, 'SVR-000001');
  const target = {
    sourceOrderId: targetOrder.id,
    sourceLineId: targetLine.id,
    demandId: targetDemand.id,
    itemKey: targetItem.id
  };
  const planId = 'mgp-terminal-received-source-range-regression';
  const plan = {
    id: planId,
    planNo: 'MGP-TERMINAL-SOURCE-RANGE-REGRESSION',
    status: 'DRAFT',
    createdAt: '2026-08-31T12:00:00.000Z',
    updatedAt: '2026-08-31T12:00:00.000Z',
    cancelledAt: '',
    items: [{
      ...JSON.parse(JSON.stringify(item)),
      ...target,
      sourceOrderNo: targetOrder.orderNo,
      demandCode: targetDemand.demandCode,
      orderQty: targetLine.qty,
      plannedQty: 2
    }],
    parts: item.recipeParts.map((part, index) => ({
      recipeItemId: `terminal-regression-part-${index + 1}`,
      source: part.source,
      refId: part.refId,
      code: part.code,
      name: part.name,
      qtyPerSet: part.qtyPerSet,
      requiredQty: Number(part.qtyPerSet) * 2,
      unit: part.unit
    })),
    exactReservations: []
  };
  const instructions = [];
  item.recipeParts.forEach((part, partIndex) => {
    const selection = Resolver.resolveExactSourceSelection(current.data, {
      ...target,
      prcId: part.refId,
      prcCode: part.code,
      unit: part.unit
    });
    assert.equal(selection.ok, true, JSON.stringify(selection));
    let remaining = 2 * Number(part.qtyPerSet);
    const instruction = {
      id: `received-source-range-instruction-${partIndex + 1}`,
      instructionCode: `STAI-RECEIVED-SOURCE-RANGE-${partIndex + 1}`,
      idempotencyKey: `received-source-range-idempotency-${partIndex + 1}`,
      contractVersion: 1,
      status: 'ACTIVE',
      target,
      prcId: part.refId,
      prcCode: part.code,
      unit: part.unit,
      qty: remaining,
      reason: 'Terminal MGS residual range regresyonu',
      createdAt: '2026-08-31T12:00:00.000Z',
      createdBy: 'Backbone Test',
      events: [],
      slices: []
    };
    selection.slices.forEach((candidate, sliceIndex) => {
      if (remaining <= 0.000001) return;
      const qty = Math.min(
        remaining,
        Number(candidate.segmentOffsetEnd) - Number(candidate.segmentOffsetStart)
      );
      const sliceKey = `received-source-range-slice-${partIndex + 1}-${sliceIndex + 1}`;
      const reservationKey = `received-source-range-reservation-${partIndex + 1}-${sliceIndex + 1}`;
      const slice = {
        sliceKey,
        planId,
        reservationKey,
        stockRowId: candidate.stockRowId,
        physicalSegmentId: candidate.physicalSegmentId,
        lineageKey: candidate.lineageKey,
        segmentCapacityQtyAtCreate: candidate.segmentCapacityQtyAtCreate,
        segmentOffsetStart: Number(candidate.segmentOffsetStart),
        segmentOffsetEnd: Number(candidate.segmentOffsetStart) + qty,
        qty,
        physicalOriginAudit: candidate.physicalOriginAudit
      };
      instruction.slices.push(slice);
      plan.exactReservations.push({
        instructionId: instruction.id,
        instructionSliceKey: sliceKey,
        reservationKey,
        planId,
        sourceType: 'SALES_ORDER',
        ...instruction.target,
        prcId: instruction.prcId,
        prcCode: instruction.prcCode,
        unit: instruction.unit,
        partSource: part.source,
        stockRowId: slice.stockRowId,
        physicalSegmentId: slice.physicalSegmentId,
        sourceBucket: 'FROM_PRODUCTION',
        segmentOffsetStart: slice.segmentOffsetStart,
        segmentOffsetEnd: slice.segmentOffsetEnd,
        qty
      });
      remaining -= qty;
    });
    assert.ok(remaining <= 0.000001, JSON.stringify({
      partIndex,
      partCode: part.code,
      requiredQty: 2 * Number(part.qtyPerSet),
      unresolvedQty: remaining,
      slices: selection.slices
    }));
    instructions.push(instruction);
  });
  assert.equal(instructions.length, 7);
  assert.equal(instructions.reduce((sum, row) => sum + Number(row.qty), 0), 16);
  assert.equal(instructions.reduce((sum, row) => sum + row.slices.length, 0), 8);
  const historicalMgsStockIds = new Set(shipment.parts.flatMap((part) =>
    part.allocations.map((allocation) => allocation.stockRowId)
  ));
  assert.equal(instructions.flatMap((row) => row.slices)
    .filter((slice) => historicalMgsStockIds.has(slice.stockRowId)).length, 7);

  const validTerminal = JSON.parse(JSON.stringify(current));
  validTerminal.data.montageDispatchPlans.push(plan);
  validTerminal.data.sanalTaksimAllocationInstructions.push(...instructions);
  const validBefore = JSON.stringify(validTerminal);
  const prospective = Resolver.resolve(validTerminal.data);
  assert.equal(prospective.diagnostics.exactHoldLedger.valid, true,
    JSON.stringify(prospective.diagnostics.exactHoldLedger));
  assert.equal(Object.keys(prospective.diagnostics.invariants).length, 15);
  assert.equal(Object.values(prospective.diagnostics.invariants).every(Boolean), true);
  assert.deepEqual(server.validateSanalTaksimOperationalHoldConflicts(validTerminal), []);
  assert.equal(JSON.stringify(validTerminal), validBefore);

  const inTransit = JSON.parse(JSON.stringify(validTerminal));
  const inTransitShipment = inTransit.data.montageDispatchShipments.find((row) => row.id === shipment.id);
  inTransitShipment.status = 'IN_TRANSIT';
  delete inTransitShipment.receivedAt;
  delete inTransitShipment.receiptKey;
  const inTransitBefore = JSON.stringify(inTransit);
  assert.ok(server.validateSanalTaksimOperationalHoldConflicts(inTransit)
    .some((issue) => issue.includes('MGS-000009')));
  assert.equal(JSON.stringify(inTransit), inTransitBefore);

  const ambiguousReceived = JSON.parse(JSON.stringify(validTerminal));
  const receiptStock = ambiguousReceived.data.stockDepotItems.find((row) =>
    row.sourceShipmentId === shipment.id
    && row.stockClass === 'MONTAGE_RECEIVED'
    && row.productCode === 'PRC-000017'
  );
  assert.ok(receiptStock);
  ambiguousReceived.data.stockDepotItems = ambiguousReceived.data.stockDepotItems
    .filter((row) => row.id !== receiptStock.id);
  assert.ok(server.validateSanalTaksimOperationalHoldConflicts(ambiguousReceived)
    .some((issue) => issue.includes('MGS-000009')));

  const missingConsumptionEvidence = JSON.parse(JSON.stringify(validTerminal));
  const missingMovementId = missingConsumptionEvidence.data.montageCompletionTransfers
    .find((row) => row.id === transfer.id).componentAllocations[0].stockMovementId;
  missingConsumptionEvidence.data.stock_movements = missingConsumptionEvidence.data.stock_movements
    .filter((row) => row.id !== missingMovementId);
  assert.ok(server.validateSanalTaksimOperationalHoldConflicts(missingConsumptionEvidence)
    .some((issue) => issue.includes('MGS-000009')));

  const pendingTransfer = JSON.parse(JSON.stringify(validTerminal));
  pendingTransfer.data.montageCompletionTransfers.find((row) => row.id === transfer.id).status = 'PENDING_DEPOT_RECEIPT';
  assert.ok(server.validateSanalTaksimOperationalHoldConflicts(pendingTransfer)
    .some((issue) => issue.includes('MGS-000009')));

  const receiptStockOverlap = JSON.parse(JSON.stringify(current));
  receiptStockOverlap.data.sanalTaksimAllocationInstructions.push({
    id: 'received-stock-overlap-instruction',
    instructionCode: 'STAI-RECEIVED-STOCK-OVERLAP',
    status: 'ACTIVE',
    prcId: receiptStock.refId,
    prcCode: receiptStock.productCode,
    unit: receiptStock.unit,
    slices: [{
      sliceKey: 'received-stock-overlap-slice',
      stockRowId: receiptStock.id,
      physicalSegmentId: `STOCK|${receiptStock.id}`,
      segmentOffsetStart: 0,
      segmentOffsetEnd: 1,
      qty: 1
    }]
  });
  assert.ok(server.validateSanalTaksimOperationalHoldConflicts(receiptStockOverlap)
    .some((issue) => issue.includes('STAI-RECEIVED-STOCK-OVERLAP')));
});

test('D2A server append-only gecisleri ve ACTIVE stockRow korumasini zorunlu tutar', () => {
  const server = require('../serve.js');
  const harness = loadD2APlanningHarness();
  const instruction = harness.PlanningModule.previewSanalTaksimAllocationInstruction(
    buildD2ARequest(harness.snapshot, harness.sor8)
  ).instruction;
  const current = { data: { ...harness.snapshot, sanalTaksimAllocationInstructions: [instruction] } };
  const validCancel = JSON.parse(JSON.stringify(current));
  validCancel.data.sanalTaksimAllocationInstructions[0].status = 'CANCELLED';
  validCancel.data.sanalTaksimAllocationInstructions[0].events.push({
    eventId: '22222222-2222-4222-8222-222222222222',
    type: 'CANCELLED', at: '2026-07-31T10:00:00.000Z', by: 'D2A Test', reason: 'Iptal'
  });
  assert.deepEqual(server.validateSanalTaksimAllocationInstructionTransitions(current, validCancel), []);

  const mutations = [
    (incoming) => { incoming.data.sanalTaksimAllocationInstructions = []; },
    (incoming) => { incoming.data.sanalTaksimAllocationInstructions[0].qty = 4; },
    (incoming) => { incoming.data.sanalTaksimAllocationInstructions[0].target.sourceOrderId = 'other'; },
    (incoming) => { incoming.data.sanalTaksimAllocationInstructions[0].slices[0].qty = 4; },
    (incoming) => { incoming.data.sanalTaksimAllocationInstructions[0].slices[0].physicalOriginAudit.originDemandId = 'other'; },
    (incoming) => { incoming.data.sanalTaksimAllocationInstructions[0].status = 'COMPLETED'; },
    (incoming) => {
      incoming.data.sanalTaksimAllocationInstructions[0].status = 'CANCELLED';
      incoming.data.sanalTaksimAllocationInstructions[0].events.push({
        eventId: '44444444-4444-4444-8444-444444444444',
        type: 'CANCELLED', at: '2026-07-31T11:00:00.000Z', by: 'D2A Test', reason: 'Iptal'
      });
      incoming.data.orders.push({ id: 'same-save-write' });
    }
  ];
  mutations.forEach((mutate) => {
    const incoming = JSON.parse(JSON.stringify(current));
    mutate(incoming);
    assert.ok(server.validateSanalTaksimAllocationInstructionTransitions(current, incoming).length > 0);
  });
  const changedOldEvent = JSON.parse(JSON.stringify(validCancel));
  changedOldEvent.data.sanalTaksimAllocationInstructions[0].events[0].reason = 'Degisti';
  assert.ok(server.validateSanalTaksimAllocationInstructionTransitions(validCancel, changedOldEvent).length > 0);
  const deletedOldEvent = JSON.parse(JSON.stringify(validCancel));
  deletedOldEvent.data.sanalTaksimAllocationInstructions[0].events = [];
  assert.ok(server.validateSanalTaksimAllocationInstructionTransitions(validCancel, deletedOldEvent).length > 0);
  const reactivated = JSON.parse(JSON.stringify(validCancel));
  reactivated.data.sanalTaksimAllocationInstructions[0].status = 'ACTIVE';
  assert.ok(server.validateSanalTaksimAllocationInstructionTransitions(validCancel, reactivated).length > 0);

  const stockMutations = [
    (incoming) => { incoming.data.stockDepotItems[0].qty = 19; },
    (incoming) => { incoming.data.stockDepotItems[0].refId = 'wrong-prc'; },
    (incoming) => { incoming.data.stockDepotItems[0].unit = 'KG'; },
    (incoming) => { incoming.data.stockDepotItems[0].demandId = 'other-origin'; },
    (incoming) => { incoming.data.stockDepotItems = []; }
  ];
  stockMutations.forEach((mutate) => {
    const incoming = JSON.parse(JSON.stringify(current));
    mutate(incoming);
    assert.ok(server.validateSanalTaksimActiveStockRowProtection(current, incoming).length > 0);
  });
});

test('ACTIVE WIP source stockRow korumasinda yanlis pozitif uretmez ve cancel yan yazisini engeller', () => {
  const server = require('../serve.js');
  const instruction = {
    id: '11111111-1111-4111-8111-111111111111',
    instructionCode: 'STAI-000001',
    idempotencyKey: 'WIP-STOCK-PROTECTION-REGRESSION',
    contractVersion: 1,
    status: 'ACTIVE',
    prcId: 'prc-wip',
    prcCode: 'PRC-WIP',
    unit: 'ADET',
    qty: 2,
    target: {
      sourceOrderId: 'order-wip',
      sourceLineId: 'order-line-wip',
      demandId: 'demand-wip',
      itemKey: 'item-wip'
    },
    slices: [{
      sliceKey: 'wip-slice',
      stockRowId: '',
      physicalSegmentId: 'WORK|work-order-wip|work-order-line-wip|IN_PROCESS|1',
      segmentCapacityQtyAtCreate: 5,
      segmentOffsetStart: 0,
      segmentOffsetEnd: 2,
      qty: 2,
      physicalOriginAudit: {
        sourceKind: 'WORK_ORDER',
        originSourceType: 'SALES_ORDER',
        originOrderId: 'order-wip',
        originOrderLineId: 'order-line-wip',
        originDemandId: 'demand-wip',
        originItemKey: 'item-wip',
        originWorkOrderId: 'work-order-wip',
        originWorkOrderLineId: 'work-order-line-wip',
        evidenceIds: ['wot-wip']
      }
    }],
    reason: 'WIP guard regression',
    createdAt: '2026-09-02T12:00:00.000Z',
    createdBy: 'Guard Test',
    events: []
  };
  const current = {
    data: {
      stockDepotItems: [],
      workOrderTransactions: [{ id: 'wot-wip' }],
      sanalTaksimAllocationInstructions: [instruction]
    }
  };
  const cancelled = JSON.parse(JSON.stringify(current));
  cancelled.data.sanalTaksimAllocationInstructions[0].status = 'CANCELLED';
  cancelled.data.sanalTaksimAllocationInstructions[0].events.push({
    eventId: '22222222-2222-4222-8222-222222222222',
    type: 'CANCELLED',
    at: '2026-09-02T12:01:00.000Z',
    by: 'Guard Test',
    reason: 'WIP MGP iptal testi'
  });

  assert.deepEqual(server.validateSanalTaksimActiveStockRowProtection(current, current), []);
  assert.deepEqual(server.validateSanalTaksimActiveStockRowProtection(current, cancelled), []);

  const malformedWip = JSON.parse(JSON.stringify(current));
  delete malformedWip.data.sanalTaksimAllocationInstructions[0]
    .slices[0].physicalOriginAudit.originWorkOrderLineId;
  assert.ok(server.validateSanalTaksimActiveStockRowProtection(malformedWip, malformedWip).length > 0);

  const cancelWithPhysicalSideWrite = JSON.parse(JSON.stringify(cancelled));
  cancelWithPhysicalSideWrite.data.workOrderTransactions.push({ id: 'forbidden-side-write' });
  assert.ok(server.validateSanalTaksimAllocationInstructionTransitions(
    current,
    cancelWithPhysicalSideWrite
  ).length > 0);
});

test('D2A app-core koleksiyon normalizasyonu ve strict conflict opt-in sozlesmesini tasir', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src/core/app-core.js'), 'utf8');
  assert.match(source, /CRITICAL_STATE_COLLECTIONS[\s\S]*["']sanalTaksimAllocationInstructions["']/);
  assert.match(source, /sanalTaksimAllocationInstructions:\s*\[\]/);
  assert.match(source, /Array\.isArray\(d\.sanalTaksimAllocationInstructions\)/);
  assert.match(source, /conflictStrategy\s*===\s*["']fail["'][\s\S]*code:\s*["']save_conflict["']/);
  assert.match(source, /conflictStrategy\s*===\s*["']fail["'][\s\S]*break;/);
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'serve.js'), 'utf8');
  const saveStateSource = serverSource.slice(serverSource.indexOf('async function saveState'));
  assert.ok(saveStateSource.indexOf('baseRevision !== currentRevision')
    < saveStateSource.indexOf('validateSanalTaksimAllocationInstructions(state)'));
});

function buildV12ReadyFinishedProductSnapshot() {
  const productId = 'product-ready-v12';
  const variantId = 'variant-ready-v12';
  const variantCode = 'SVR-READY-V12';
  const prcId = 'prc-ready-v12';
  const prcCode = 'PRC-READY-V12';
  const buildOrder = (id, orderNo, lineId, qty, deliveryDate) => ({
    id,
    orderNo,
    status: 'APPROVED',
    deliveryDate,
    lines: [{
      id: lineId,
      productId,
      productCode: 'SAL-READY-V12',
      idCode: 'SAL-READY-V12',
      variationId: variantId,
      variantCode,
      productName: 'V12 Hazır Ürün',
      unit: 'ADET',
      qty
    }]
  });
  const buildDemand = ({ id, code, order, lineId, itemId, qty, useStockQty, netQty, releasedAt }) => ({
    id,
    demandCode: code,
    status: 'RELEASED',
    sourceType: 'SALES_ORDER',
    sourceOrderId: order.id,
    sourceOrderNo: order.orderNo,
    sourceLineId: lineId,
    dueDate: order.deliveryDate,
    released_at: releasedAt,
    items: [{
      id: itemId,
      itemType: 'MODEL',
      qty,
      variantId: `salesvar_${variantId}`,
      variantCode,
      productCode: variantCode,
      productName: 'V12 Hazır Ürün'
    }],
    poolAnalysis: {
      stockAccountingMode: 'VIRTUAL_V1',
      rows: [{
        key: `${id}-row`,
        itemKey: itemId,
        componentId: prcId,
        code: prcCode,
        unit: 'ADET',
        requiredQty: qty,
        itemQty: qty,
        useStockSelected: useStockQty > 0,
        useStockQty,
        useSemiSelected: false,
        useSemiQty: 0,
        useNetSelected: netQty > 0,
        netQty
      }]
    }
  });
  const orderA = buildOrder('order-a-v12', 'SOR-A-V12', 'line-a-v12', 300, '2026-09-30');
  const orderC = buildOrder('order-c-v12', 'SOR-C-V12', 'line-c-v12', 3, '2026-09-01');
  const demandA = buildDemand({
    id: 'demand-a-v12', code: 'PLN-A-V12', order: orderA, lineId: 'line-a-v12',
    itemId: 'item-a-v12', qty: 300, useStockQty: 0, netQty: 300,
    releasedAt: '2026-08-20T09:00:00.000Z'
  });
  const demandC = buildDemand({
    id: 'demand-c-v12', code: 'PLN-C-V12', order: orderC, lineId: 'line-c-v12',
    itemId: 'item-c-v12', qty: 3, useStockQty: 3, netQty: 0,
    releasedAt: '2026-08-21T09:00:00.000Z'
  });
  const transfer = {
    id: 'mct-ready-v12',
    transferNo: 'MCT-READY-V12',
    status: 'POSTED',
    sourceShipmentId: 'mgs-history-v12',
    sourceShipmentNo: 'MGS-HISTORY-V12',
    sourcePlanId: 'mgp-history-v12',
    sourcePlanNo: 'MGP-HISTORY-V12',
    sourceShipmentItemIndex: 0,
    sourceType: 'SALES_ORDER',
    sourceOrderId: orderA.id,
    sourceOrderNo: orderA.orderNo,
    sourceLineId: 'line-a-v12',
    demandId: demandA.id,
    itemKey: 'item-a-v12',
    productId,
    variantId,
    variationId: variantId,
    variantCode,
    montageCardId: 'montage-card-v12',
    montageCardCode: 'MON-V12',
    qty: 300,
    quantity: 300,
    unit: 'ADET',
    recipeParts: [{ refId: prcId, code: prcCode, unit: 'ADET', qtyPerSet: 1 }],
    componentAllocations: [{
      refId: prcId,
      code: prcCode,
      unit: 'ADET',
      qtyPerSet: 1,
      stockDepotItemId: 'component-history-v12',
      qty: 300,
      stockMovementId: 'movement-component-v12'
    }],
    finishedProductStockItemId: 'finished-stock-v12',
    finishedProductMovementId: 'movement-finished-v12',
    targetDepotId: 'depot_profil',
    targetLocationId: 'location-ready-v12',
    postedAt: '2026-08-22T09:00:00.000Z'
  };
  return {
    partComponentCards: [{ id: prcId, code: prcCode, unit: 'ADET' }],
    orders: [orderA, orderC],
    planningDemands: [demandA, demandC],
    workOrders: [{
      id: 'wo-a-v12',
      workOrderCode: 'WO-A-V12',
      sourceId: demandA.id,
      sourceCode: demandA.demandCode,
      sourceItemKey: 'item-a-v12',
      lines: [{
        id: 'wo-line-a-v12',
        componentId: prcId,
        componentCode: prcCode,
        unit: 'ADET',
        targetQty: 300,
        routes: [{ id: 'route-cnc-v12', seq: 1, stationId: 'u-cnc', processId: 'CNC' }]
      }]
    }],
    workOrderTransactions: [{
      id: 'txn-take-a-v12',
      workOrderId: 'wo-a-v12',
      lineId: 'wo-line-a-v12',
      stationId: 'u-cnc',
      routeId: 'route-cnc-v12',
      routeSeq: 1,
      processId: 'CNC',
      type: 'TAKE',
      qty: 3
    }],
    stockDepotItems: [{
      id: 'finished-stock-v12',
      completionTransferId: transfer.id,
      transferId: transfer.id,
      sourceType: 'SALES_ORDER',
      sourceOrderId: orderA.id,
      sourceOrderNo: orderA.orderNo,
      sourceLineId: 'line-a-v12',
      demandId: demandA.id,
      itemKey: 'item-a-v12',
      productId,
      variantId,
      variationId: variantId,
      variantCode,
      productCode: variantCode,
      code: variantCode,
      cardType: 'SVR',
      stockClass: 'KULLANILABILIR',
      status: 'KULLANILABILIR',
      depotId: 'depot_profil',
      targetDepotId: 'depot_profil',
      locationId: 'location-ready-v12',
      targetLocationId: 'location-ready-v12',
      qty: 300,
      quantity: 300,
      amount: 300,
      unit: 'ADET'
    }],
    stock_movements: [{
      id: 'movement-component-v12',
      movementType: 'MONTAGE_COMPONENT_CONSUMPTION',
      completionTransferId: transfer.id,
      transferId: transfer.id,
      stockDepotItemId: 'component-history-v12',
      productCode: prcCode,
      code: prcCode,
      qty: 300,
      quantity: 300,
      unit: 'ADET'
    }, {
      id: 'movement-finished-v12',
      movementType: 'MONTAGE_FINISHED_PRODUCT_IN',
      type: 'MONTAGE_FINISHED_PRODUCT_IN',
      completionTransferId: transfer.id,
      transferId: transfer.id,
      stockDepotItemId: 'finished-stock-v12',
      sourceType: 'SALES_ORDER',
      sourceOrderId: orderA.id,
      sourceLineId: 'line-a-v12',
      productId,
      variantId,
      variantCode,
      productCode: variantCode,
      targetDepotId: 'depot_profil',
      targetLocationId: 'location-ready-v12',
      qty: 300,
      quantity: 300,
      unit: 'ADET'
    }],
    montageCompletionTransfers: [transfer],
    salesShipmentPlans: [],
    salesShipments: [],
    sanalTaksimAllocationInstructions: []
  };
}

test('V12 Paket 2 canonical ready 300 adedi C 3 ve A 297 olarak dağıtır, yalnız A residual 3 PRC borcu kalır', () => {
  const snapshot = buildV12ReadyFinishedProductSnapshot();
  const before = JSON.stringify(snapshot);
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const debtA = result.productDebts.find((row) => row.originOrderId === 'order-a-v12');
  const debtC = result.productDebts.find((row) => row.originOrderId === 'order-c-v12');
  const allocationsA = result.finishedReadyAllocations.filter((row) => row.targetOrderId === 'order-a-v12');
  const allocationsC = result.finishedReadyAllocations.filter((row) => row.targetOrderId === 'order-c-v12');
  const prcDebtA = result.debts.find((row) => row.originOrderId === 'order-a-v12');
  const prcAllocationA = result.allocations.filter((row) => row.targetDemandId === 'demand-a-v12');

  assert.equal(debtC.finishedReadyQty, 3);
  assert.equal(debtC.residualSetQty, 0);
  assert.equal(allocationsC.reduce((sum, row) => sum + row.qty, 0), 3);
  assert.equal(debtA.finishedReadyQty, 297);
  assert.equal(debtA.residualSetQty, 3);
  assert.equal(allocationsA.reduce((sum, row) => sum + row.qty, 0), 297);
  assert.equal(prcDebtA.openDebtQty, 3);
  assert.equal(prcAllocationA.reduce((sum, row) => sum + row.qty, 0), 3);
  assert.equal(result.finishedReadyAllocations.reduce((sum, row) => sum + row.qty, 0), 300);
  assert.equal(result.diagnostics.invariants.finishedAllocationWithinQty, true);
  assert.equal(result.diagnostics.invariants.productAllocationWithinOpenDebt, true);
  assert.equal(result.diagnostics.invariants.segmentConsumedOnce, true);
  assert.equal(JSON.stringify(snapshot), before);
});

test('V12 Paket 2 tamamen stoktan RELEASED demand-item için WO olmadan ürün borcu ve ready tahsisi üretir', () => {
  const snapshot = buildV12ReadyFinishedProductSnapshot();
  snapshot.orders = snapshot.orders.filter((row) => row.id === 'order-c-v12');
  snapshot.planningDemands = snapshot.planningDemands.filter((row) => row.id === 'demand-c-v12');
  snapshot.workOrders = [];
  snapshot.workOrderTransactions = [];
  snapshot.stockDepotItems[0].qty = 3;
  snapshot.stockDepotItems[0].quantity = 3;
  snapshot.stockDepotItems[0].amount = 3;
  snapshot.montageCompletionTransfers[0].qty = 3;
  snapshot.montageCompletionTransfers[0].quantity = 3;
  snapshot.montageCompletionTransfers[0].componentAllocations[0].qty = 3;
  snapshot.stock_movements.forEach((movement) => {
    movement.qty = 3;
    movement.quantity = 3;
  });
  const result = loadSanalTaksimResolver().resolve(snapshot);
  assert.equal(result.productDebts.length, 1);
  assert.equal(result.productDebts[0].allocationEligible, true);
  assert.equal(result.productDebts[0].finishedReadyQty, 3);
  assert.equal(result.productDebts[0].residualSetQty, 0);
});

test('V12 Paket 2 Sevkiyat Planlama cross-origin ready allocation proofunu hedef SOR icin tasir', () => {
  const snapshot = buildV12ReadyFinishedProductSnapshot();
  const Resolver = loadSanalTaksimResolver();
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', {
    DB: { data: { data: snapshot } },
    PlanningModule: { buildSanalTaksimSnapshot: () => snapshot },
    SanalTaksimResolver: Resolver
  });
  const row = {
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'order-c-v12',
    sourceOrderNo: 'SOR-C-V12',
    sourceLineId: 'line-c-v12',
    demandId: 'demand-c-v12',
    itemKey: 'item-c-v12',
    productId: 'product-ready-v12',
    variationId: 'variant-ready-v12',
    salCode: 'SAL-READY-V12',
    svrCode: 'SVR-READY-V12'
  };
  const availability = StockModule.getSalesShipmentPlanningAvailability(row);
  assert.equal(availability.ok, true);
  assert.equal(availability.readyQty, 3);
  assert.equal(availability.planableQty, 3);
  assert.equal(availability.stockRows.length, 1);
  assert.equal(availability.stockRows[0].stockRow.sourceOrderId, 'order-a-v12');
  assert.equal(availability.stockRows[0].resolverAllocation.targetOrderId, 'order-c-v12');

  const built = StockModule.buildSalesShipmentStockAllocations(availability, 2);
  assert.equal(built.ok, true);
  assert.equal(built.allocations.length, 1);
  assert.equal(built.allocations[0].sourceOrderId, 'order-c-v12');
  assert.equal(built.allocations[0].allocatedQty, 2);
  assert.equal(built.allocations[0].sanalTaksimAllocationProof.targetOrderId, 'order-c-v12');
  assert.equal(built.allocations[0].sanalTaksimAllocationProof.sourceAllocationQty, 3);
  assert.equal(built.allocations[0].sanalTaksimAllocationProof.qty, 2);

  snapshot.salesShipmentPlans.push({
    id: 'svp-client-v12',
    planNo: 'SVP-900003',
    status: 'PLANNED',
    sourceOrderId: 'order-c-v12',
    sourceOrderNo: 'SOR-C-V12',
    items: [{
      sourceLineId: 'line-c-v12',
      productId: 'product-ready-v12',
      productCode: 'SAL-READY-V12',
      variantId: 'variant-ready-v12',
      variantCode: 'SVR-READY-V12',
      salCode: 'SAL-READY-V12',
      svrCode: 'SVR-READY-V12',
      productName: 'V12 Hazır Ürün',
      unit: 'ADET',
      plannedQty: 2,
      stockAllocations: built.allocations
    }]
  });
  const execution = StockModule.buildSalesShipmentDispatchExecution({
    planId: 'svp-client-v12',
    planStatus: 'PLANNED',
    isDispatched: false,
    items: [{ sourceLineId: 'line-c-v12', dispatchQty: 2 }]
  });
  assert.equal(execution.ok, true);
  assert.equal(execution.items[0].allocations[0].stockRow.sourceOrderId, 'order-a-v12');
  assert.equal(execution.items[0].identity.sourceOrderId, 'order-c-v12');
});

test('V12 Paket 2 PLANNED SVP exact resolver proofunu fixed commitment yapar ve legacy manualOrderi yok sayar', () => {
  const Resolver = loadSanalTaksimResolver();
  const currentSnapshot = buildV12ReadyFinishedProductSnapshot();
  const initial = Resolver.resolve(currentSnapshot);
  const cAllocation = initial.finishedReadyAllocations.find((row) => row.targetOrderId === 'order-c-v12');
  const plan = {
    id: 'svp-v12',
    planNo: 'SVP-900001',
    status: 'PLANNED',
    statusLabel: 'Planlandı',
    sourceOrderId: 'order-c-v12',
    sourceOrderNo: 'SOR-C-V12',
    idempotencyKey: 'SALES_SHIPMENT_PLAN|order-c-v12|v12',
    createdAt: '2026-08-24T10:00:00.000Z',
    updatedAt: '2026-08-24T10:00:00.000Z',
    items: [{
      sourceLineId: 'line-c-v12',
      lineKey: 'SALES_ORDER|order-c-v12|line-c-v12',
      productId: 'product-ready-v12',
      productCode: 'SAL-READY-V12',
      variantId: 'variant-ready-v12',
      variantCode: 'SVR-READY-V12',
      salCode: 'SAL-READY-V12',
      svrCode: 'SVR-READY-V12',
      productName: 'V12 Hazır Ürün',
      unit: 'ADET',
      orderQty: 3,
      plannedQty: 3,
      stockAllocations: [{
        stockItemId: cAllocation.stockItemId,
        allocatedQty: 3,
        depotId: 'depot_profil',
        locationId: 'location-ready-v12',
        sourceOrderId: 'order-c-v12',
        sourceLineId: 'line-c-v12',
        sanalTaksimAllocationProof: { ...cAllocation.sanalTaksimAllocationProof, qty: 3 }
      }]
    }]
  };
  const incomingState = { data: JSON.parse(JSON.stringify(currentSnapshot)) };
  incomingState.data.salesShipmentPlans.push(plan);
  const server = require('../serve.js');
  assert.deepEqual(server.validateSanalTaksimSalesShipmentPlanTransitions(
    { data: currentSnapshot }, incomingState
  ), []);
  assert.deepEqual(server.validateSalesShipmentPlans(incomingState), []);

  incomingState.data.orders.find((row) => row.id === 'order-a-v12').productionQueue = {
    manualOrder: 1,
    updatedAt: '2026-08-24T10:01:00.000Z',
    updatedBy: 'V12 Test'
  };
  incomingState.data.orders.find((row) => row.id === 'order-c-v12').productionQueue = {
    manualOrder: 2,
    updatedAt: '2026-08-24T10:02:00.000Z',
    updatedBy: 'V12 Test'
  };
  const resolved = Resolver.resolve(incomingState.data);
  const fixedC = resolved.finishedReadyAllocations.filter((row) =>
    row.fixedBySalesShipmentPlan && row.targetOrderId === 'order-c-v12'
  );
  assert.equal(fixedC.reduce((sum, row) => sum + row.qty, 0), 3);
  assert.equal(resolved.productDebts.find((row) => row.originOrderId === 'order-a-v12').finishedReadyQty, 297);
  assert.equal(resolved.operationalReconciliation.hasConflict, false);
  assert.equal(resolved.operationalReconciliation.issues.some((row) =>
    row.reasonCode === 'PLANNED_SVP_DIFFERS_FROM_CURRENT_PRIORITY'
  ), false);

  const broken = JSON.parse(JSON.stringify(incomingState));
  broken.data.salesShipmentPlans[0].items[0].stockAllocations[0]
    .sanalTaksimAllocationProof.targetOrderId = 'order-a-v12';
  assert.ok(server.validateSanalTaksimSalesShipmentPlanTransitions(
    { data: currentSnapshot }, broken
  ).length > 0);
});

test('V12 Paket 2 DISPATCHED salesShipment ve exact OUT sonrası miktarı final olarak havuzdan çıkarır', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildV12ReadyFinishedProductSnapshot();
  const initial = Resolver.resolve(snapshot);
  const cAllocation = initial.finishedReadyAllocations.find((row) => row.targetOrderId === 'order-c-v12');
  snapshot.stockDepotItems[0].qty = 297;
  snapshot.stockDepotItems[0].quantity = 297;
  snapshot.stockDepotItems[0].amount = 297;
  snapshot.salesShipmentPlans.push({
    id: 'svp-final-v12',
    planNo: 'SVP-900002',
    status: 'DISPATCHED',
    sourceOrderId: 'order-c-v12',
    sourceOrderNo: 'SOR-C-V12',
    items: [{
      sourceLineId: 'line-c-v12',
      productId: 'product-ready-v12',
      variantId: 'variant-ready-v12',
      variantCode: 'SVR-READY-V12',
      svrCode: 'SVR-READY-V12',
      unit: 'ADET',
      plannedQty: 3,
      stockAllocations: [{
        stockItemId: 'finished-stock-v12',
        allocatedQty: 3,
        sanalTaksimAllocationProof: { ...cAllocation.sanalTaksimAllocationProof, qty: 3 }
      }]
    }]
  });
  snapshot.stock_movements.push({
    id: 'movement-sales-out-v12',
    movementType: 'SALES_SHIPMENT_OUT',
    type: 'SALES_SHIPMENT_OUT',
    shipmentId: 'shipment-final-v12',
    shipmentPlanId: 'svp-final-v12',
    stockItemId: 'finished-stock-v12',
    stockDepotItemId: 'finished-stock-v12',
    sourceOrderId: 'order-c-v12',
    sourceLineId: 'line-c-v12',
    productId: 'product-ready-v12',
    variantId: 'variant-ready-v12',
    variantCode: 'SVR-READY-V12',
    depotId: 'depot_profil',
    locationId: 'location-ready-v12',
    qty: 3,
    quantity: 3,
    unit: 'ADET'
  });
  snapshot.salesShipments.push({
    id: 'shipment-final-v12',
    shipmentNo: 'TF-900001',
    shipmentPlanId: 'svp-final-v12',
    status: 'DISPATCHED',
    sourceOrderId: 'order-c-v12',
    idempotencyKey: 'SALES_SHIPMENT_DISPATCH|svp-final-v12',
    snapshot: {
      sourceOrderId: 'order-c-v12',
      items: [{
        sourceOrderId: 'order-c-v12',
        sourceLineId: 'line-c-v12',
        productId: 'product-ready-v12',
        variantId: 'variant-ready-v12',
        svrCode: 'SVR-READY-V12',
        unit: 'ADET',
        dispatchQty: 3,
        stockAllocations: [{
          stockItemId: 'finished-stock-v12',
          allocatedQty: 3,
          stockMovementId: 'movement-sales-out-v12'
        }]
      }]
    }
  });
  const result = Resolver.resolve(snapshot);
  const debtC = result.productDebts.find((row) => row.originOrderId === 'order-c-v12');
  const debtA = result.productDebts.find((row) => row.originOrderId === 'order-a-v12');
  assert.equal(debtC.dispatchedSetQty, 3);
  assert.equal(debtC.openSetQty, 0);
  assert.equal(result.finishedReadyAllocations.some((row) => row.targetOrderId === 'order-c-v12'), false);
  assert.equal(debtA.finishedReadyQty, 297);
  assert.equal(debtA.residualSetQty, 3);
  assert.equal(result.segments.filter((row) => row.stage === 'MONTAGE_FINISHED_STOCK')
    .reduce((sum, row) => sum + row.physicalQty, 0), 297);
});

test('V12 Paket 2 canonical miktar veya lineage belirsizse finished ready havuzu fail-closed kalır', () => {
  const snapshot = buildV12ReadyFinishedProductSnapshot();
  snapshot.stockDepotItems[0].qty = 299;
  snapshot.stockDepotItems[0].quantity = 299;
  snapshot.stockDepotItems[0].amount = 299;
  const result = loadSanalTaksimResolver().resolve(snapshot);
  assert.equal(result.segments.some((row) => row.stage === 'MONTAGE_FINISHED_STOCK'), false);
  assert.equal(result.finishedReadyAllocations.length, 0);
  assert.ok(result.uncertain.some((row) =>
    row.kind === 'MCT_CANONICAL_FINISHED_STOCK'
    && row.reasonCode === 'MCT_FINISHED_EVIDENCE_CONFLICT'
  ));
});

test('V12 Paket 2 Parça ve Üretim Akışı finished ready ile residual PRC aşamasını birlikte gösterir', () => {
  const snapshot = buildV12ReadyFinishedProductSnapshot();
  const Resolver = loadSanalTaksimResolver();
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot } },
    SanalTaksimResolver: Resolver,
    UnitModule: { getRouteStationName: () => 'CNC' }
  });
  const demandA = snapshot.planningDemands.find((row) => row.id === 'demand-a-v12');
  const model = PlanningModule.getReleasedSalesSanalTaksimModel(demandA);
  const html = PlanningModule.renderReleasedSalesSanalTaksimHtml(demandA);
  assert.equal(model.ok, true);
  assert.equal(model.finishedProducts[0].dynamicReadyQty, 297);
  assert.equal(model.finishedProducts[0].residualSetQty, 3);
  assert.match(html, /297 Sevkiyata Hazır/);
  assert.match(html, /data-sanal-taksim-product-residual="true"[^>]*>3 ADET</);
  assert.match(html, /CNC/);
});

function buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq = 4, draftStatus = '' } = {}) {
  const buildCardRoutes = (branchProcess, prefix) => [
    { id: `${prefix}-card-r1`, seq: 1, stationId: 'u_cut', processId: 'CUT-000001' },
    { id: `${prefix}-card-r2`, seq: 2, stationId: 'u_cnc', processId: 'CNC-000001' },
    { id: `${prefix}-card-r3`, seq: 3, stationId: 'u_polish', processId: 'POL-000001' },
    { id: `${prefix}-card-r4`, seq: 4, stationId: 'u_dtm', processId: 'DTR-000001' },
    { id: `${prefix}-card-r5`, seq: 5, stationId: 'u_elx', processId: branchProcess }
  ];
  const frozenRoutes = buildCardRoutes('ELX-GOLD', 'gold').map((route, index) => ({
    ...route,
    id: `wo-r${index + 1}`
  }));
  const transactions = [];
  for (let routeSeq = 1; routeSeq <= stageRouteSeq; routeSeq += 1) {
    const route = frozenRoutes[routeSeq - 1];
    transactions.push({
      id: `txn-take-${routeSeq}`,
      workOrderId: 'wo-technical-phase1',
      lineId: 'line-technical-phase1',
      stationId: route.stationId,
      processId: route.processId,
      routeId: route.id,
      routeSeq,
      type: 'TAKE',
      qty: 10
    });
    if (routeSeq < stageRouteSeq) {
      transactions.push({
        id: `txn-complete-${routeSeq}`,
        workOrderId: 'wo-technical-phase1',
        lineId: 'line-technical-phase1',
        stationId: route.stationId,
        processId: route.processId,
        routeId: route.id,
        routeSeq,
        type: 'COMPLETE',
        qty: 10
      });
    }
  }
  const snapshot = {
    partComponentCards: [
      { id: 'prc-root', code: 'PRC-ROOT', unit: 'ADET' },
      {
        id: 'prc-gold', code: 'PRC-GOLD', unit: 'ADET', masterCode: 'MASTER-001',
        isVariant: true, rootComponentId: 'prc-root', rootComponentCode: 'PRC-ROOT',
        routes: buildCardRoutes('ELX-GOLD', 'gold')
      },
      {
        id: 'prc-bright', code: 'PRC-BRIGHT', unit: 'ADET', masterCode: 'MASTER-001',
        isVariant: true, rootComponentId: 'prc-root', rootComponentCode: 'PRC-ROOT',
        routes: buildCardRoutes('ELX-BRIGHT', 'bright')
      }
    ],
    workOrders: [{
      id: 'wo-technical-phase1',
      workOrderCode: 'WO-TECHNICAL-PHASE1',
      lines: [{
        id: 'line-technical-phase1',
        componentId: 'prc-gold',
        componentCode: 'PRC-GOLD',
        unit: 'ADET',
        targetQty: 10,
        routes: frozenRoutes
      }]
    }],
    workOrderTransactions: transactions,
    stockDepotItems: [],
    montageDispatchShipments: [],
    montageCompletionTransfers: [],
    stock_movements: [],
    outsourceDispatchDrafts: [],
    workOrderExternalSupplierAssignments: []
  };
  if (draftStatus) {
    snapshot.outsourceDispatchDrafts.push({
      id: 'outsource-draft-phase1',
      status: draftStatus,
      unitId: 'u_elx',
      supplierId: 'supplier-elx',
      createdAt: '2026-08-27T08:00:00.000Z',
      items: [{
        qty: 6,
        targetUnitId: 'u_elx',
        targetProcessId: 'ELX-GOLD',
        targetRouteSeq: 5,
        workOrderRefs: [{
          sourceRowKey: 'wo-technical-phase1::line-technical-phase1::u_dtm::wo-r4',
          workOrderId: 'wo-technical-phase1',
          lineId: 'line-technical-phase1',
          componentCode: 'PRC-GOLD',
          qty: 6,
          targetUnitId: 'u_elx',
          targetProcessId: 'ELX-GOLD',
          targetRouteSeq: 5
        }]
      }]
    });
  }
  return snapshot;
}

test('Faz 1 canonical prefix ELX branch oncesini sibling, branch adimini incompatible yapar', () => {
  const Resolver = loadSanalTaksimResolver();
  const preSplit = Resolver.resolve(buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 3 }));
  const preSplitRow = preSplit.technicalEligibility.compatibility.find((row) =>
    row.sourcePrcCode === 'PRC-GOLD' && row.targetPrcCode === 'PRC-BRIGHT'
  );
  assert.equal(preSplitRow.relation, 'SIBLING_PRE_SPLIT');
  assert.equal(preSplitRow.commonPrefixLength, 4);
  assert.equal(preSplitRow.sourceNextToken, 'U_ELX::ELX-GOLD');
  assert.equal(preSplitRow.targetNextToken, 'U_ELX::ELX-BRIGHT');

  const afterSplit = Resolver.resolve(buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 5 }));
  const afterSplitRow = afterSplit.technicalEligibility.compatibility.find((row) =>
    row.sourcePrcCode === 'PRC-GOLD' && row.targetPrcCode === 'PRC-BRIGHT'
  );
  assert.equal(afterSplitRow.relation, 'INCOMPATIBLE');
  assert.equal(afterSplitRow.reasonCode, 'SEGMENT_AT_OR_AFTER_SPLIT_BRANCH');
});

test('Faz 1 outsource DRAFT sibling miktarini kilitler, CANCELLED kilidi cozer ve allocationa dokunmaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const draftSnapshot = buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 4, draftStatus: 'DRAFT' });
  const draft = Resolver.resolve(draftSnapshot);
  const sibling = draft.technicalEligibility.compatibility.find((row) =>
    row.sourcePrcCode === 'PRC-GOLD' && row.targetPrcCode === 'PRC-BRIGHT'
  );
  assert.equal(sibling.relation, 'SIBLING_PRE_SPLIT');
  assert.equal(sibling.siblingLockedQty, 6);
  assert.equal(sibling.siblingAvailableQty, 4);
  assert.equal(draft.technicalEligibility.outsourceSplitLocks.length, 1);
  assert.equal(draft.technicalEligibility.outsourceSplitLocks[0].persistentRange, false);

  const cancelledSnapshot = buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 4, draftStatus: 'CANCELLED' });
  const cancelled = Resolver.resolve(cancelledSnapshot);
  const cancelledSibling = cancelled.technicalEligibility.compatibility.find((row) =>
    row.sourcePrcCode === 'PRC-GOLD' && row.targetPrcCode === 'PRC-BRIGHT'
  );
  assert.equal(cancelled.technicalEligibility.outsourceSplitLocks.length, 0);
  assert.equal(cancelledSibling.siblingLockedQty, 0);
  assert.equal(cancelledSibling.siblingAvailableQty, 10);
  assert.deepEqual(draft.allocations, cancelled.allocations);
  assert.deepEqual(draft.debts, cancelled.debts);

  const dispatchedSnapshot = buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 4, draftStatus: 'DISPATCHED' });
  dispatchedSnapshot.workOrderTransactions.push(
    {
      id: 'txn-complete-4-dispatch', workOrderId: 'wo-technical-phase1', lineId: 'line-technical-phase1',
      stationId: 'u_dtm', processId: 'DTR-000001', routeId: 'wo-r4', routeSeq: 4, type: 'COMPLETE', qty: 6
    },
    {
      id: 'txn-take-5-dispatch', workOrderId: 'wo-technical-phase1', lineId: 'line-technical-phase1',
      stationId: 'u_elx', processId: 'ELX-GOLD', routeId: 'wo-r5', routeSeq: 5, type: 'TAKE', qty: 6
    }
  );
  dispatchedSnapshot.workOrderExternalSupplierAssignments.push({
    id: 'assignment-phase1', status: 'ACTIVE', dispatchDraftId: 'outsource-draft-phase1',
    workOrderId: 'wo-technical-phase1', lineId: 'line-technical-phase1',
    sourceStationId: 'u_dtm', sourceRouteSeq: 4,
    targetUnitId: 'u_elx', targetRouteSeq: 5, targetProcessId: 'ELX-GOLD',
    supplierId: 'supplier-elx', qty: 6,
    sourceRowKey: 'wo-technical-phase1::line-technical-phase1::u_dtm::wo-r4'
  });
  const dispatched = Resolver.resolve(dispatchedSnapshot);
  assert.equal(dispatched.technicalEligibility.outsourceSplitLocks.length, 1);
  assert.equal(dispatched.technicalEligibility.outsourceSplitLocks[0].kind, 'OUTSOURCE_ACTIVE');
  assert.equal(dispatched.technicalEligibility.outsourceSplitLocks[0].sourceRouteSeq, 4);
  assert.equal(dispatched.technicalEligibility.outsourceSplitLocks[0].currentRouteSeq, 5);
});

test('Faz 1 bozuk outsource ref guess yapmadan UNCERTAIN ve sibling fail-closed kalir', () => {
  const snapshot = buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 4, draftStatus: 'DRAFT' });
  snapshot.outsourceDispatchDrafts[0].items[0].workOrderRefs[0].sourceRowKey = '';
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const sibling = result.technicalEligibility.compatibility.find((row) =>
    row.sourcePrcCode === 'PRC-GOLD' && row.targetPrcCode === 'PRC-BRIGHT'
  );
  assert.ok(result.technicalEligibility.uncertain.some((row) =>
    row.reasonCode === 'OUTSOURCE_SOURCE_ROW_KEY_MISMATCH'
  ));
  assert.equal(result.technicalEligibility.outsourceSplitLocks.length, 0);
  assert.equal(sibling.relation, 'SIBLING_PRE_SPLIT');
  assert.equal(sibling.siblingLockedQty, 10);
  assert.equal(sibling.siblingAvailableQty, 0);
  assert.ok(result.technicalEligibility.siblingBlockedSegmentKeys.includes(sibling.segmentKey));

  const qtyMismatchSnapshot = buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 4, draftStatus: 'DRAFT' });
  qtyMismatchSnapshot.outsourceDispatchDrafts[0].items[0].qty = 7;
  const qtyMismatch = loadSanalTaksimResolver().resolve(qtyMismatchSnapshot);
  assert.ok(qtyMismatch.technicalEligibility.uncertain.some((row) =>
    row.reasonCode === 'OUTSOURCE_ITEM_QTY_MISMATCH'
  ));
  assert.equal(qtyMismatch.technicalEligibility.outsourceSplitLocks.length, 0);
});

function resolvePlanningRuntimeOutsourceSnapshot(snapshot) {
  const Resolver = loadSanalTaksimResolver();
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot } },
    SanalTaksimResolver: Resolver
  });
  const runtimeSnapshot = PlanningModule.buildSanalTaksimSnapshot();
  assert.strictEqual(runtimeSnapshot.outsourceDispatchDrafts, snapshot.outsourceDispatchDrafts);
  assert.strictEqual(
    runtimeSnapshot.workOrderExternalSupplierAssignments,
    snapshot.workOrderExternalSupplierAssignments
  );
  return { runtimeSnapshot, result: Resolver.resolve(runtimeSnapshot) };
}

test('Planning snapshot outsource DRAFT kilidini tasir ve CANCELLED kardes miktari yeniden acar', () => {
  const draftSnapshot = buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 4, draftStatus: 'DRAFT' });
  const draft = resolvePlanningRuntimeOutsourceSnapshot(draftSnapshot).result;
  const draftSibling = draft.technicalEligibility.compatibility.find((row) =>
    row.sourcePrcCode === 'PRC-GOLD' && row.targetPrcCode === 'PRC-BRIGHT'
  );
  assert.equal(draftSibling.relation, 'SIBLING_PRE_SPLIT');
  assert.equal(draftSibling.siblingLockedQty, 6);
  assert.equal(draftSibling.siblingAvailableQty, 4);
  assert.equal(draft.technicalEligibility.outsourceSplitLocks.length, 1);

  const cancelledSnapshot = buildTechnicalEligibilityPhase1Snapshot({
    stageRouteSeq: 4,
    draftStatus: 'CANCELLED'
  });
  const cancelled = resolvePlanningRuntimeOutsourceSnapshot(cancelledSnapshot).result;
  const cancelledSibling = cancelled.technicalEligibility.compatibility.find((row) =>
    row.sourcePrcCode === 'PRC-GOLD' && row.targetPrcCode === 'PRC-BRIGHT'
  );
  assert.equal(cancelled.technicalEligibility.outsourceSplitLocks.length, 0);
  assert.equal(cancelledSibling.siblingLockedQty, 0);
  assert.equal(cancelledSibling.siblingAvailableQty, 10);
});

test('Planning snapshot ACTIVE outsource assignment kanitini resolvera tasir', () => {
  const snapshot = buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 4, draftStatus: 'DISPATCHED' });
  snapshot.workOrderTransactions.push(
    {
      id: 'txn-complete-4-runtime', workOrderId: 'wo-technical-phase1', lineId: 'line-technical-phase1',
      stationId: 'u_dtm', processId: 'DTR-000001', routeId: 'wo-r4', routeSeq: 4, type: 'COMPLETE', qty: 6
    },
    {
      id: 'txn-take-5-runtime', workOrderId: 'wo-technical-phase1', lineId: 'line-technical-phase1',
      stationId: 'u_elx', processId: 'ELX-GOLD', routeId: 'wo-r5', routeSeq: 5, type: 'TAKE', qty: 6
    }
  );
  snapshot.workOrderExternalSupplierAssignments.push({
    id: 'assignment-runtime', status: 'ACTIVE', dispatchDraftId: 'outsource-draft-phase1',
    workOrderId: 'wo-technical-phase1', lineId: 'line-technical-phase1',
    sourceStationId: 'u_dtm', sourceRouteSeq: 4,
    targetUnitId: 'u_elx', targetRouteSeq: 5, targetProcessId: 'ELX-GOLD',
    supplierId: 'supplier-elx', qty: 6,
    sourceRowKey: 'wo-technical-phase1::line-technical-phase1::u_dtm::wo-r4'
  });

  const { runtimeSnapshot, result } = resolvePlanningRuntimeOutsourceSnapshot(snapshot);
  assert.equal(runtimeSnapshot.workOrderExternalSupplierAssignments.length, 1);
  assert.equal(result.technicalEligibility.outsourceSplitLocks.length, 1);
  assert.equal(result.technicalEligibility.outsourceSplitLocks[0].kind, 'OUTSOURCE_ACTIVE');
  assert.equal(result.technicalEligibility.outsourceSplitLocks[0].currentRouteSeq, 5);
});

test('Planning snapshot bozuk outsource refi tahmin etmeden fail-closed tasir', () => {
  const snapshot = buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq: 4, draftStatus: 'DRAFT' });
  snapshot.outsourceDispatchDrafts[0].items[0].workOrderRefs[0].sourceRowKey = '';
  const result = resolvePlanningRuntimeOutsourceSnapshot(snapshot).result;
  const sibling = result.technicalEligibility.compatibility.find((row) =>
    row.sourcePrcCode === 'PRC-GOLD' && row.targetPrcCode === 'PRC-BRIGHT'
  );
  assert.ok(result.technicalEligibility.uncertain.some((row) =>
    row.reasonCode === 'OUTSOURCE_SOURCE_ROW_KEY_MISMATCH'
  ));
  assert.equal(result.technicalEligibility.outsourceSplitLocks.length, 0);
  assert.equal(sibling.relation, 'SIBLING_PRE_SPLIT');
  assert.equal(sibling.siblingAvailableQty, 0);
  assert.ok(result.technicalEligibility.siblingBlockedSegmentKeys.includes(sibling.segmentKey));
});

function buildSiblingAllocationPhase2Snapshot({
  stageRouteSeq = 4,
  draftStatus = '',
  sourceQty = 10,
  targetQty = 10,
  sourceDueDate = '2026-09-30',
  targetDueDate = '2026-09-01'
} = {}) {
  const snapshot = buildTechnicalEligibilityPhase1Snapshot({ stageRouteSeq, draftStatus });
  const sourceOrder = snapshot.workOrders[0];
  sourceOrder.sourceId = 'demand-gold-phase2';
  sourceOrder.sourceCode = 'PLN-GOLD-PHASE2';
  sourceOrder.sourceItemKey = 'item-gold-phase2';
  sourceOrder.lines[0].targetQty = sourceQty;
  snapshot.workOrderTransactions.forEach((txn) => { txn.qty = sourceQty; });
  const brightCard = snapshot.partComponentCards.find((card) => card.id === 'prc-bright');
  const brightRoutes = brightCard.routes.map((route, index) => ({ ...route, id: `bright-wo-r${index + 1}` }));
  snapshot.workOrders.push({
    id: 'wo-bright-phase2',
    workOrderCode: 'WO-BRIGHT-PHASE2',
    sourceId: 'demand-bright-phase2',
    sourceCode: 'PLN-BRIGHT-PHASE2',
    sourceItemKey: 'item-bright-phase2',
    lines: [{
      id: 'line-bright-phase2',
      componentId: 'prc-bright',
      componentCode: 'PRC-BRIGHT',
      unit: 'ADET',
      targetQty,
      routes: brightRoutes
    }]
  });
  snapshot.planningDemands = [
    {
      id: 'demand-bright-phase2', demandCode: 'PLN-BRIGHT-PHASE2', sourceType: 'STOCK',
      status: 'RELEASED', released_at: '2026-08-27T08:00:00.000Z', dueDate: targetDueDate,
      workOrderIds: ['wo-bright-phase2'], workOrderCodes: ['WO-BRIGHT-PHASE2'],
      items: [{ id: 'item-bright-phase2', qty: targetQty }]
    },
    {
      id: 'demand-gold-phase2', demandCode: 'PLN-GOLD-PHASE2', sourceType: 'STOCK',
      status: 'RELEASED', released_at: '2026-08-27T08:01:00.000Z', dueDate: sourceDueDate,
      workOrderIds: ['wo-technical-phase1'], workOrderCodes: ['WO-TECHNICAL-PHASE1'],
      items: [{ id: 'item-gold-phase2', qty: sourceQty }]
    }
  ];
  snapshot.orders = [];
  snapshot.salesShipments = [];
  return snapshot;
}

function addSecondBrightDebtPhase2(snapshot, {
  qty = 6,
  dueDate = '2026-09-02'
} = {}) {
  const template = snapshot.workOrders.find((order) => order.id === 'wo-bright-phase2');
  snapshot.workOrders.push({
    ...JSON.parse(JSON.stringify(template)),
    id: 'wo-bright-second-phase2',
    workOrderCode: 'WO-BRIGHT-SECOND-PHASE2',
    sourceId: 'demand-bright-second-phase2',
    sourceCode: 'PLN-BRIGHT-SECOND-PHASE2',
    sourceItemKey: 'item-bright-second-phase2',
    lines: [{
      ...JSON.parse(JSON.stringify(template.lines[0])),
      id: 'line-bright-second-phase2',
      targetQty: qty,
      routes: template.lines[0].routes.map((route, index) => ({ ...route, id: `bright-second-r${index + 1}` }))
    }]
  });
  snapshot.planningDemands.push({
    id: 'demand-bright-second-phase2', demandCode: 'PLN-BRIGHT-SECOND-PHASE2', sourceType: 'STOCK',
    status: 'RELEASED', released_at: '2026-08-27T08:02:00.000Z', dueDate,
    workOrderIds: ['wo-bright-second-phase2'], workOrderCodes: ['WO-BRIGHT-SECOND-PHASE2'],
    items: [{ id: 'item-bright-second-phase2', qty }]
  });
}

test('Faz 2 guvenilir pre-split kardes miktari ticari borca tahsis eder ve exact yolu korur', () => {
  const Resolver = loadSanalTaksimResolver();
  const siblingResult = Resolver.resolve(buildSiblingAllocationPhase2Snapshot());
  const brightDebt = siblingResult.debts.find((debt) => debt.prcCode === 'PRC-BRIGHT');
  const siblingAllocation = siblingResult.allocations.find((allocation) =>
    allocation.targetDebtKey === brightDebt.debtKey
  );
  assert.equal(siblingAllocation.qty, 10);
  assert.equal(siblingAllocation.technicalCompatibility, 'SIBLING_PRE_SPLIT');
  assert.equal(siblingAllocation.physicalPrcCode, 'PRC-GOLD');
  assert.equal(siblingAllocation.targetPrcCode, 'PRC-BRIGHT');
  assert.equal(siblingResult.diagnostics.invariants.canonicalTechnicalCompatibilityOnly, true);
  assert.equal(siblingResult.diagnostics.invariants.exactPrcAndUnitOnly, true);

  const exactResult = Resolver.resolve(buildSiblingAllocationPhase2Snapshot({
    sourceDueDate: '2026-08-31', targetDueDate: '2026-09-30'
  }));
  const goldDebt = exactResult.debts.find((debt) => debt.prcCode === 'PRC-GOLD');
  const exactAllocation = exactResult.allocations.find((allocation) =>
    allocation.targetDebtKey === goldDebt.debtKey
  );
  assert.equal(exactAllocation.qty, 10);
  assert.equal(exactAllocation.prcCode, 'PRC-GOLD');
  assert.equal(Object.hasOwn(exactAllocation, 'technicalCompatibility'), false);
});

test('Faz 2 kardes havuzunda mevcut en ileri asama sirasi korunur', () => {
  const snapshot = buildSiblingAllocationPhase2Snapshot({ targetQty: 5 });
  snapshot.workOrderTransactions = snapshot.workOrderTransactions.filter((txn) => Number(txn.routeSeq) <= 2);
  const line = snapshot.workOrders[0].lines[0];
  [
    { id: 'phase2-r3-take', seq: 3, type: 'TAKE', qty: 10 },
    { id: 'phase2-r3-complete', seq: 3, type: 'COMPLETE', qty: 5 },
    { id: 'phase2-r4-take', seq: 4, type: 'TAKE', qty: 5 }
  ].forEach((entry) => {
    const route = line.routes[entry.seq - 1];
    snapshot.workOrderTransactions.push({
      id: entry.id, workOrderId: snapshot.workOrders[0].id, lineId: line.id,
      stationId: route.stationId, processId: route.processId, routeId: route.id,
      routeSeq: entry.seq, type: entry.type, qty: entry.qty
    });
  });
  const result = loadSanalTaksimResolver().resolve(snapshot);
  const brightDebt = result.debts.find((debt) => debt.prcCode === 'PRC-BRIGHT');
  const firstAllocation = result.allocations.find((allocation) => allocation.targetDebtKey === brightDebt.debtKey);
  assert.equal(firstAllocation.physicalSegmentId, 'WORK|wo-technical-phase1|line-technical-phase1|IN_PROCESS|4');
  assert.equal(firstAllocation.qty, 5);
});

test('Faz 2 DRAFT kilidi kardes miktari sinirlar, CANCELLED acar; split ve UNCERTAIN tahsis edilmez', () => {
  const Resolver = loadSanalTaksimResolver();
  const draft = Resolver.resolve(buildSiblingAllocationPhase2Snapshot({ draftStatus: 'DRAFT' }));
  const draftDebt = draft.debts.find((debt) => debt.prcCode === 'PRC-BRIGHT');
  const draftSiblingQty = draft.allocations
    .filter((allocation) => allocation.targetDebtKey === draftDebt.debtKey
      && allocation.technicalCompatibility === 'SIBLING_PRE_SPLIT')
    .reduce((sum, allocation) => sum + allocation.qty, 0);
  assert.equal(draftSiblingQty, 4);

  const cancelled = Resolver.resolve(buildSiblingAllocationPhase2Snapshot({ draftStatus: 'CANCELLED' }));
  const cancelledDebt = cancelled.debts.find((debt) => debt.prcCode === 'PRC-BRIGHT');
  assert.equal(cancelled.allocations
    .filter((allocation) => allocation.targetDebtKey === cancelledDebt.debtKey)
    .reduce((sum, allocation) => sum + allocation.qty, 0), 10);

  const split = Resolver.resolve(buildSiblingAllocationPhase2Snapshot({ stageRouteSeq: 5 }));
  const splitDebt = split.debts.find((debt) => debt.prcCode === 'PRC-BRIGHT');
  assert.equal(split.allocations.some((allocation) => allocation.targetDebtKey === splitDebt.debtKey), false);

  const uncertainSnapshot = buildSiblingAllocationPhase2Snapshot();
  uncertainSnapshot.partComponentCards.find((card) => card.id === 'prc-gold').routes[1].processId = 'CNC-DRIFT';
  const uncertain = Resolver.resolve(uncertainSnapshot);
  const uncertainDebt = uncertain.debts.find((debt) => debt.prcCode === 'PRC-BRIGHT');
  assert.equal(uncertain.technicalEligibility.compatibility.some((row) =>
    row.targetPrcCode === 'PRC-BRIGHT' && row.relation === 'UNCERTAIN'
  ), true);
  assert.equal(uncertain.allocations.some((allocation) => allocation.targetDebtKey === uncertainDebt.debtKey), false);
});

test('Faz 2 sibling allocation segment kapasitesini asmaz ve RESERVED holdu kullanmaz', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSiblingAllocationPhase2Snapshot({ sourceQty: 6, targetQty: 6 });
  addSecondBrightDebtPhase2(snapshot, { qty: 6 });
  const result = Resolver.resolve(snapshot);
  const segmentKey = 'WORK|wo-technical-phase1|line-technical-phase1|IN_PROCESS|4';
  const siblingAllocated = result.allocations
    .filter((allocation) => allocation.physicalSegmentId === segmentKey
      && allocation.technicalCompatibility === 'SIBLING_PRE_SPLIT')
    .reduce((sum, allocation) => sum + allocation.qty, 0);
  assert.equal(siblingAllocated, 6);
  assert.equal(result.diagnostics.invariants.segmentKeysConsumedOnce, true);
  assert.equal(result.diagnostics.invariants.siblingAllocationWithinTechnicalQty, true);

  const heldSnapshot = buildSiblingAllocationPhase2Snapshot({ sourceQty: 6, targetQty: 6 });
  heldSnapshot.virtualAllocationConstraints = { reservedSegmentKeys: [segmentKey] };
  const held = Resolver.resolve(heldSnapshot);
  const brightDebt = held.debts.find((debt) => debt.prcCode === 'PRC-BRIGHT');
  assert.equal(held.allocations.some((allocation) => allocation.targetDebtKey === brightDebt.debtKey), false);
  assert.ok(held.diagnostics.excludedReservedSegmentKeys.includes(segmentKey));
});

test('Faz 2 borc sirasi degisince sibling miktari deterministik yeniden dagitir ve fiziksel gecmisi degistirmez', () => {
  const Resolver = loadSanalTaksimResolver();
  const snapshot = buildSiblingAllocationPhase2Snapshot({ sourceQty: 6, targetQty: 6 });
  addSecondBrightDebtPhase2(snapshot, { qty: 6, dueDate: '2026-09-02' });
  const historyBefore = JSON.stringify({
    workOrders: snapshot.workOrders,
    workOrderTransactions: snapshot.workOrderTransactions,
    planningDemands: snapshot.planningDemands.map((row) => ({ id: row.id, workOrderIds: row.workOrderIds }))
  });
  const first = Resolver.resolve(snapshot);
  const firstOwner = first.allocations.find((allocation) =>
    allocation.technicalCompatibility === 'SIBLING_PRE_SPLIT'
  )?.targetDemandId;
  assert.equal(firstOwner, 'demand-bright-phase2');

  snapshot.planningDemands.find((row) => row.id === 'demand-bright-phase2').dueDate = '2026-09-03';
  snapshot.planningDemands.find((row) => row.id === 'demand-bright-second-phase2').dueDate = '2026-09-01';
  const second = Resolver.resolve(snapshot);
  const repeated = Resolver.resolve(snapshot);
  const secondOwner = second.allocations.find((allocation) =>
    allocation.technicalCompatibility === 'SIBLING_PRE_SPLIT'
  )?.targetDemandId;
  assert.equal(secondOwner, 'demand-bright-second-phase2');
  assert.deepEqual(second.allocations, repeated.allocations);
  assert.equal(JSON.stringify({
    workOrders: snapshot.workOrders,
    workOrderTransactions: snapshot.workOrderTransactions,
    planningDemands: snapshot.planningDemands.map((row) => ({ id: row.id, workOrderIds: row.workOrderIds }))
  }), historyBefore);
});

function buildPlanningSiblingPresentationSnapshot({ sourceQty = 6, targetQty = 6 } = {}) {
  const snapshot = buildSiblingAllocationPhase2Snapshot({ sourceQty, targetQty });
  const demand = snapshot.planningDemands.find((row) => row.id === 'demand-bright-phase2');
  Object.assign(demand, {
    sourceType: 'SALES_ORDER',
    sourceOrderId: 'sor-bright-phase2',
    sourceOrderNo: 'SOR-BRIGHT-PHASE2',
    sourceLineId: 'sor-bright-line-phase2'
  });
  demand.items[0].variantCode = 'SVR-BRIGHT-PHASE2';
  snapshot.orders = [{
    id: 'sor-bright-phase2',
    orderNo: 'SOR-BRIGHT-PHASE2',
    status: 'Onaylandi',
    deliveryDate: demand.dueDate,
    lines: [{
      id: 'sor-bright-line-phase2',
      productId: 'sal-bright-phase2',
      variationId: 'svr-bright-phase2',
      variantCode: 'SVR-BRIGHT-PHASE2',
      qty: targetQty,
      unit: 'ADET'
    }]
  }];
  return snapshot;
}

function loadPlanningSiblingPresentationHarness(snapshot, resolverResult = null) {
  const Resolver = loadSanalTaksimResolver();
  const resolved = resolverResult || Resolver.resolve(snapshot);
  const harness = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB: { data: { data: snapshot }, save: () => { throw new Error('read-only UI model must not save'); } },
    SanalTaksimResolver: { resolve: () => resolved },
    UnitModule: { getRouteStationName: (stationId) => String(stationId || '') }
  });
  return { PlanningModule: harness.exported, resolved };
}

test('Planning UI sibling contract canonical SIBLING_PRE_SPLIT tahsisini hedef PRC satirinda gosterir ve exact yolu korur', () => {
  const snapshot = buildPlanningSiblingPresentationSnapshot();
  const before = JSON.stringify(snapshot);
  const { PlanningModule, resolved } = loadPlanningSiblingPresentationHarness(snapshot);
  const demand = snapshot.planningDemands.find((row) => row.id === 'demand-bright-phase2');
  const siblingAllocation = resolved.allocations.find((row) =>
    row.technicalCompatibility === 'SIBLING_PRE_SPLIT'
    && row.targetDemandId === demand.id
  );
  assert.equal(siblingAllocation.qty, 6);

  const model = PlanningModule.getReleasedSalesSanalTaksimModel(demand);
  const html = PlanningModule.renderReleasedSalesSanalTaksimHtml(demand);
  const row = model.rows.find((entry) => entry.prcCode === 'PRC-BRIGHT');
  assert.equal(model.ok, true);
  assert.equal(row.allocatedQty, 6);
  assert.equal(row.uncoveredQty, 0);
  assert.deepEqual(Array.from(row.technicalCompatibilities), ['SIBLING_PRE_SPLIT']);
  assert.match(html, /data-sanal-taksim-sibling-pre-split="true"/);
  assert.match(html, /Kardeş PRC · ayrışma öncesi/);
  assert.equal(JSON.stringify(snapshot), before);

  const exactSnapshot = buildSanalTaksimPhase2Snapshot();
  const exactHarness = loadPlanningSiblingPresentationHarness(exactSnapshot);
  const exactDemand = exactSnapshot.planningDemands.find((entry) => entry.id === 'pln-sales');
  const exactModel = exactHarness.PlanningModule.getReleasedSalesSanalTaksimModel(exactDemand);
  assert.equal(exactModel.rows[0].allocatedQty, 40);
  assert.deepEqual(Array.from(exactModel.rows[0].technicalCompatibilities), ['EXACT']);
});

test('Planning UI sibling contract eksik veya tahrif edilmis canonical metadatayi fail-closed tutar', () => {
  const snapshot = buildPlanningSiblingPresentationSnapshot();
  const base = loadSanalTaksimResolver().resolve(snapshot);
  const demand = snapshot.planningDemands.find((row) => row.id === 'demand-bright-phase2');
  const mutations = [
    (result) => { delete result.allocations.find((row) => row.technicalCompatibility === 'SIBLING_PRE_SPLIT').physicalPrcCode; },
    (result) => { result.allocations.find((row) => row.technicalCompatibility === 'SIBLING_PRE_SPLIT').targetPrcCode = 'PRC-TAMPERED'; },
    (result) => {
      result.technicalEligibility.compatibility.find((row) =>
        row.sourcePrcCode === 'PRC-GOLD' && row.targetPrcCode === 'PRC-BRIGHT'
      ).commonPrefixLength = 0;
    },
    (result) => { result.technicalEligibility.compatibility = []; }
  ];

  mutations.forEach((mutate) => {
    const tampered = JSON.parse(JSON.stringify(base));
    mutate(tampered);
    const { PlanningModule } = loadPlanningSiblingPresentationHarness(snapshot, tampered);
    const model = PlanningModule.getReleasedSalesSanalTaksimModel(demand);
    const row = model.rows.find((entry) => entry.prcCode === 'PRC-BRIGHT');
    assert.equal(row.allocatedQty, null);
    assert.equal(row.uncoveredQty, null);
    assert.equal(row.allocationEligible, false);
    assert.ok(row.reasonCodes.includes('SIBLING_ALLOCATION_PROOF_INVALID'));
  });
});

test('Planning UI sibling contract sifir acik borcu ayirir ve invariant ihlalinde double-count gostermez', () => {
  const snapshot = buildPlanningSiblingPresentationSnapshot();
  const base = loadSanalTaksimResolver().resolve(snapshot);
  const demand = snapshot.planningDemands.find((row) => row.id === 'demand-bright-phase2');
  const targetDebt = base.debts.find((row) => row.originDemandId === demand.id && row.prcCode === 'PRC-BRIGHT');

  const zeroDebt = JSON.parse(JSON.stringify(base));
  zeroDebt.debts.find((row) => row.debtKey === targetDebt.debtKey).openDebtQty = 0;
  zeroDebt.allocations = zeroDebt.allocations.filter((row) => row.targetDebtKey !== targetDebt.debtKey);
  zeroDebt.uncoveredDebts = zeroDebt.uncoveredDebts.filter((row) => row.debtKey !== targetDebt.debtKey);
  zeroDebt.uncoveredDebts.push({ debtKey: targetDebt.debtKey, qty: 0, status: 'RESOLVED', reasonCode: '' });
  const zeroHarness = loadPlanningSiblingPresentationHarness(snapshot, zeroDebt);
  const zeroModel = zeroHarness.PlanningModule.getReleasedSalesSanalTaksimModel(demand);
  const zeroRow = zeroModel.rows.find((row) => row.prcCode === 'PRC-BRIGHT');
  const zeroHtml = zeroHarness.PlanningModule.renderReleasedSalesSanalTaksimHtml(demand);
  assert.equal(zeroRow.hasOpenDebt, false);
  assert.equal(zeroRow.targetQty, 0);
  assert.equal(zeroRow.allocatedQty, 0);
  assert.equal(zeroRow.uncoveredQty, 0);
  assert.match(zeroHtml, /data-sanal-taksim-open-debt="false"/);
  assert.match(zeroHtml, /Açık fiziksel borç yok/);
  assert.match(zeroHtml, /Fiziksel tahsis gerekmiyor/);

  const duplicated = JSON.parse(JSON.stringify(base));
  const sibling = duplicated.allocations.find((row) => row.technicalCompatibility === 'SIBLING_PRE_SPLIT');
  duplicated.allocations.push({ ...sibling });
  duplicated.diagnostics.invariants.segmentKeysConsumedOnce = false;
  const duplicateHarness = loadPlanningSiblingPresentationHarness(snapshot, duplicated);
  const duplicateModel = duplicateHarness.PlanningModule.getReleasedSalesSanalTaksimModel(demand);
  const duplicateRow = duplicateModel.rows.find((row) => row.prcCode === 'PRC-BRIGHT');
  assert.equal(duplicateRow.allocatedQty, null);
  assert.equal(duplicateRow.allocationEligible, false);
  assert.ok(duplicateRow.reasonCodes.includes('SIBLING_ALLOCATION_PROOF_INVALID'));

  const source = fs.readFileSync(path.join(__dirname, '..', 'src/modules/planning-module.js'), 'utf8');
  assert.doesNotMatch(source, /:\s*'Dagilim yok'/);
  assert.match(source, /WO \/ istasyon dağılımı yok/);
});

function buildPrototypeCohortPlannerHarness() {
  const demoPath = path.join(__dirname, '..', 'demo_state.json');
  const source = fs.readFileSync(demoPath, 'utf8');
  const state = buildPrototypeSalesCohortCleanupFixture();
  const Planner = require('../src/core/prototype-test-cohort-planner.js');
  const options = {
    baselineManualEntryDocNos: Array.from({ length: 9 }, (_, index) =>
      `EK-2026-${String(index + 1).padStart(6, '0')}`),
    testSeedLocationCodes: ['FAZ5-TEST-01']
  };
  return { demoPath, source, state, Planner, options };
}

function cohortRows(plan, action, collection) {
  return (plan?.classifications?.[action] || [])
    .filter((row) => row.collection === collection);
}

test('PROTOTYPE COHORT PLANNER baseline belgelerini KEEP ve test seed belgelerini DELETE siniflar', () => {
  const harness = buildPrototypeCohortPlannerHarness();
  const plan = harness.Planner.build(harness.state, harness.options);
  const keepEntries = cohortRows(plan, 'KEEP', 'stockManualEntries');
  const deleteEntries = cohortRows(plan, 'DELETE', 'stockManualEntries');

  assert.equal(plan.ok, true, plan.uncertainties.map((row) => row.message).join(' | '));
  assert.deepEqual(keepEntries.map((row) => row.code), harness.options.baselineManualEntryDocNos);
  assert.deepEqual(deleteEntries.map((row) => row.code),
    Array.from({ length: 7 }, (_, index) => `EK-2026-${String(index + 10).padStart(6, '0')}`));
  assert.equal(plan.baseline.manualEntryCount, 9);
  assert.equal(plan.baseline.movementCount, 9);
  assert.equal(plan.baseline.stockRowCount, 9);
  assert.equal(plan.baseline.authoritativeQtyTotal, 13200);
});

test('PROTOTYPE COHORT PLANNER eski SOR PLN WO ve fiziksel test closure kayitlarini DELETE siniflar', () => {
  const harness = buildPrototypeCohortPlannerHarness();
  const data = harness.state.data || harness.state;
  const plan = harness.Planner.build(harness.state, harness.options);
  const coveredCollections = [
    'orders', 'planningDemands', 'workOrders', 'workOrderTransactions',
    'montageDispatchPlans', 'montageDispatchShipments', 'montageCompletionTransfers',
    'sanalTaksimAllocationInstructions', 'salesShipmentPlans',
    'workOrderExternalSupplierAssignments', 'outsourceDispatchDrafts'
  ];

  coveredCollections.forEach((collection) => {
    assert.equal(cohortRows(plan, 'DELETE', collection).length, (data[collection] || []).length, collection);
  });
  const tombstonedOrderIds = data.orders
    .filter((row) => row.prototypeResetTombstone).map((row) => row.id);
  tombstonedOrderIds.forEach((id) => {
    assert.ok(cohortRows(plan, 'DELETE', 'orders').some((row) => row.id === id));
  });
  const currentOrderIds = new Set(data.orders.map((row) => row.id));
  const orphanPlans = data.montageDispatchPlans.filter((row) =>
    (row.items || []).some((item) => item.sourceOrderId && !currentOrderIds.has(item.sourceOrderId)));
  assert.ok(orphanPlans.length > 0);
  orphanPlans.forEach((row) => {
    assert.ok(cohortRows(plan, 'DELETE', 'montageDispatchPlans').some((entry) => entry.id === row.id));
  });
});

test('PROTOTYPE COHORT PLANNER guncel SOR ve tarihsel STOCK kohortu kanitini kapsar', () => {
  const harness = buildPrototypeCohortPlannerHarness();
  const plan = harness.Planner.build(harness.state, harness.options);
  const codes = (action, collection) => new Set(cohortRows(plan, action, collection).map((row) => row.code));

  ['SOR-000007', 'SOR-000008', 'SOR-000009', 'SOR-000011',
    'SOR-000012', 'SOR-000013', 'SOR-000014', 'SOR-000015']
    .forEach((code) => assert.ok(codes('DELETE', 'orders').has(code), code));

  const stockState = JSON.parse(JSON.stringify(harness.state));
  const stockData = stockState.data || stockState;
  stockData.planningDemands = stockData.planningDemands
    .filter((row) => !['PLN-000020', 'PLN-000021'].includes(row.demandCode));
  stockData.workOrders = stockData.workOrders.filter((row) => row.workOrderCode !== 'WO-000127');
  stockData.planningDemands.push(
    { id: 'fixture-pln-20', demandCode: 'PLN-000020', sourceType: 'STOCK', workOrderIds: [] },
    { id: 'fixture-pln-21', demandCode: 'PLN-000021', sourceType: 'STOCK', workOrderIds: ['fixture-wo-127'] }
  );
  stockData.workOrders.push({
    id: 'fixture-wo-127',
    workOrderCode: 'WO-000127',
    sourceType: 'PLAN_POOL_COMPONENT',
    sourceId: 'fixture-pln-21',
    sourceCode: 'PLN-000021'
  });
  const stockPlan = harness.Planner.build(stockState, harness.options);
  const stockCodes = (action, collection) => new Set(cohortRows(stockPlan, action, collection).map((row) => row.code));
  ['PLN-000020', 'PLN-000021']
    .forEach((code) => assert.ok(stockCodes('DELETE', 'planningDemands').has(code), code));
  assert.ok(stockCodes('DELETE', 'workOrders').has('WO-000127'));
});

test('PROTOTYPE COHORT PLANNER baseline disi belirsiz fiziksel kayitta UNCERTAIN fail closed kalir', () => {
  const harness = buildPrototypeCohortPlannerHarness();
  const state = JSON.parse(JSON.stringify(harness.state));
  const data = state.data || state;
  data.stockDepotItems.push({
    id: 'stock-physical-uncertain',
    qty: 1,
    quantity: 1,
    amount: 1,
    unit: 'ADET',
    stockClass: 'KULLANILABILIR',
    depotId: 'main',
    locationId: 'location-unknown'
  });
  const before = JSON.stringify(state);

  const plan = harness.Planner.build(state, harness.options);

  assert.equal(plan.ok, false);
  assert.equal(plan.failClosed, true);
  assert.ok(plan.uncertainties.some((row) => row.reasonCode === 'PHYSICAL_STOCK_PROVENANCE_UNCLASSIFIED'));
  assert.ok(cohortRows(plan, 'UNCERTAIN', 'stockDepotItems')
    .some((row) => row.id === 'stock-physical-uncertain'));
  assert.equal(JSON.stringify(state), before);
});

test('PROTOTYPE COHORT PLANNER bozuk exact range veya rebind kanitinda UNCERTAIN uretir', () => {
  const harness = buildPrototypeCohortPlannerHarness();
  const rangeState = JSON.parse(JSON.stringify(harness.state));
  const rangeData = rangeState.data || rangeState;
  const exactPlan = rangeData.montageDispatchPlans.find((row) =>
    Array.isArray(row.exactReservations) && row.exactReservations.length > 0);
  assert.ok(exactPlan);
  delete exactPlan.exactReservations[0].segmentOffsetEnd;

  const rangePlan = harness.Planner.build(rangeState, harness.options);

  assert.equal(rangePlan.ok, false);
  assert.ok(rangePlan.uncertainties.some((row) => row.reasonCode === 'PHYSICAL_RANGE_INVALID'));

  const rebindState = JSON.parse(JSON.stringify(harness.state));
  const rebindData = rebindState.data || rebindState;
  const rebound = rebindData.montageDispatchPlans.find((row) => row.rebindAudit);
  assert.ok(rebound);
  rebound.rebindAudit.targetPlanId = 'missing-target-plan';

  const rebindPlan = harness.Planner.build(rebindState, harness.options);

  assert.equal(rebindPlan.ok, false);
  assert.ok(rebindPlan.uncertainties.some((row) => row.reasonCode === 'OPERATIONAL_REBIND_INVALID'));

  const reservationState = JSON.parse(JSON.stringify(harness.state));
  const reservationData = reservationState.data || reservationState;
  const exactShipment = reservationData.montageDispatchShipments.find((shipment) =>
    (shipment.parts || []).some((part) => (part.allocations || [])
      .some((allocation) => (allocation.exactReservationKeys || []).length > 0)));
  assert.ok(exactShipment);
  const exactAllocation = exactShipment.parts
    .flatMap((part) => part.allocations || [])
    .find((allocation) => (allocation.exactReservationKeys || []).length > 0);
  exactAllocation.exactReservationKeys[0] = 'missing-reservation-key';

  const reservationPlan = harness.Planner.build(reservationState, harness.options);

  assert.equal(reservationPlan.ok, false);
  assert.ok(reservationPlan.uncertainties
    .some((row) => row.reasonCode === 'EXACT_RESERVATION_LINK_INVALID'));
});

test('PROTOTYPE COHORT PLANNER master koleksiyonlari korur ve state ile demo_state dosyasini degistirmez', () => {
  const harness = buildPrototypeCohortPlannerHarness();
  const beforeState = JSON.stringify(harness.state);
  const beforeFileHash = nodeCrypto.createHash('sha256').update(harness.source).digest('hex');

  const plan = harness.Planner.build(harness.state, harness.options);

  const masterCollections = new Set(harness.Planner.MASTER_COLLECTIONS);
  assert.equal(plan.classifications.DELETE.some((row) => masterCollections.has(row.collection)), false);
  assert.equal(plan.readOnly, true);
  assert.equal(plan.writes, 0);
  assert.equal(JSON.stringify(harness.state), beforeState);
  const afterSource = fs.readFileSync(harness.demoPath, 'utf8');
  const afterFileHash = nodeCrypto.createHash('sha256').update(afterSource).digest('hex');
  assert.equal(afterFileHash, beforeFileHash);
});

test('PROTOTYPE COHORT PLANNER PlanningModule salt okunur cagri yuzeyinden ayni manifesti uretir', () => {
  const harness = buildPrototypeCohortPlannerHarness();
  const DB = { data: JSON.parse(JSON.stringify(harness.state)) };
  const before = JSON.stringify(DB.data);
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
    DB,
    PrototypeTestCohortPlanner: harness.Planner,
    SanalTaksimResolver: loadSanalTaksimResolver()
  });

  const plan = PlanningModule.buildPrototypeTestCohortBaselinePlan();

  assert.equal(plan.ok, true, plan.uncertainties.map((row) => row.message).join(' | '));
  assert.equal(plan.baseline.authoritativeQtyTotal, 13200);
  assert.equal(plan.summary.UNCERTAIN, 0);
  assert.equal(JSON.stringify(DB.data), before);
});

function buildPrototypeStockCleanupFixture() {
  return {
    schema_version: 1,
    meta: { revision: 41, updated_at: '2026-08-28T12:00:00.000Z', counters: { demand: 21, workOrder: 127 } },
    data: {
      products: [{ id: 'product-master-1', code: 'AKS0002' }],
      customers: [{ id: 'customer-master-1' }],
      suppliers: [{ id: 'supplier-master-1' }],
      stockDepots: [{ id: 'main' }],
      stockDepotLocations: [{ id: 'loc-main' }],
      stockManualEntries: [{ id: 'entry-baseline-1', docNo: 'EK-2026-000001', qty: 100 }],
      orders: [{ id: 'sor-foreign', orderNo: 'SOR-FOREIGN' }],
      planningDemands: [
        { id: 'pln-stock-20', demandCode: 'PLN-000020', sourceType: 'STOCK', workOrderIds: [] },
        { id: 'pln-stock-21', demandCode: 'PLN-000021', sourceType: 'STOCK', workOrderIds: ['wo-stock-127'] },
        { id: 'pln-sales-foreign', demandCode: 'PLN-FOREIGN', sourceType: 'SALES_ORDER', sourceOrderId: 'sor-foreign' }
      ],
      workOrders: [
        { id: 'wo-stock-127', workOrderCode: 'WO-000127', sourceType: 'PLAN_POOL_COMPONENT', sourceId: 'pln-stock-21', sourceCode: 'PLN-000021' },
        { id: 'wo-sales-foreign', workOrderCode: 'WO-FOREIGN', sourceId: 'pln-sales-foreign' }
      ],
      workOrderTransactions: [
        { id: 'txn-stock-127', workOrderId: 'wo-stock-127', type: 'TAKE', qty: 6 },
        { id: 'txn-foreign', workOrderId: 'wo-sales-foreign', type: 'TAKE', qty: 1 }
      ],
      stock_movements: [
        { id: 'movement-baseline-1', movementType: 'MANUAL_ENTRY', docNo: 'EK-2026-000001', qty: 100 },
        { id: 'movement-stock-issue', movementType: 'WORK_ORDER_ISSUE', workOrderId: 'wo-stock-127', workOrderCode: 'WO-000127', sourceStockItemId: 'stock-baseline-1', sourceQty: 0.084 },
        { id: 'movement-stock-store', movementType: 'STORE', demandId: 'pln-stock-21', stockItemId: 'stock-derived-1', qty: 6 },
        { id: 'movement-foreign', movementType: 'WORK_ORDER_ISSUE', workOrderId: 'wo-sales-foreign', sourceStockItemId: 'stock-baseline-1', sourceQty: 1 }
      ],
      stockDepotItems: [
        { id: 'stock-baseline-1', code: 'AKS0002', qty: 99.916, quantity: 99.916, amount: 99.916, note: 'EK-2026-000001' },
        { id: 'stock-derived-1', code: 'PRC-TEST', qty: 0, quantity: 0, amount: 0, sourceType: 'STOCK', demandId: 'pln-stock-21' }
      ],
      workOrderExternalSupplierAssignments: [
        { id: 'assignment-stock', workOrderId: 'wo-stock-127' },
        { id: 'assignment-foreign', workOrderId: 'wo-sales-foreign' }
      ],
      outsourceDispatchDrafts: [{
        id: 'draft-shared',
        items: [{
          id: 'draft-item', qty: 7, workOrderRefs: [
            { workOrderId: 'wo-stock-127', qty: 6 },
            { workOrderId: 'wo-sales-foreign', qty: 1 }
          ]
        }]
      }],
      outsourceTransfers: [],
      workOrderDispatchNotes: [],
      montageJobDispatches: [],
      partWorkOrders: [],
      montageDispatchPlans: [],
      montageDispatchShipments: [],
      montageCompletionTransfers: [],
      sanalTaksimAllocationInstructions: [],
      salesShipmentPlans: [],
      salesShipments: []
    }
  };
}

test('PROTOTYPE STOCK CLEANUP exact STOCK closure planlar ve SALES_ORDER ile master kayitlari kapsama almaz', () => {
  const Cleanup = require('../src/core/prototype-stock-test-cleanup.js');
  const state = buildPrototypeStockCleanupFixture();
  const before = JSON.stringify(state);
  const plan = Cleanup.build(state);

  assert.equal(plan.ok, true, plan.issues.map((row) => row.message).join(' | '));
  assert.deepEqual(plan.targets.planningDemands.map((row) => row.code), ['PLN-000020', 'PLN-000021']);
  assert.deepEqual(plan.targets.workOrders.map((row) => row.code), ['WO-000127']);
  assert.equal(plan.targets.stock_movements.length, 2);
  assert.equal(plan.targets.stockDepotItems.length, 1);
  assert.equal(plan.summary.stockReturnQty, 0);
  assert.equal(JSON.stringify(state), before);
});

test('PROTOTYPE STOCK CLEANUP apply kaynak stogu iade etmez ve yabanci zinciri korur', () => {
  const Cleanup = require('../src/core/prototype-stock-test-cleanup.js');
  const state = buildPrototypeStockCleanupFixture();
  const plan = Cleanup.build(state);
  const baselineBefore = JSON.stringify(state.data.stockDepotItems.find((row) => row.id === 'stock-baseline-1'));
  const foreignBefore = JSON.stringify({
    demand: state.data.planningDemands.find((row) => row.id === 'pln-sales-foreign'),
    workOrder: state.data.workOrders.find((row) => row.id === 'wo-sales-foreign'),
    movement: state.data.stock_movements.find((row) => row.id === 'movement-foreign')
  });

  const applied = Cleanup.apply(state, plan);

  assert.equal(applied.ok, true);
  assert.equal(state.data.planningDemands.some((row) => row.id === 'pln-stock-20' || row.id === 'pln-stock-21'), false);
  assert.equal(state.data.workOrders.some((row) => row.id === 'wo-stock-127'), false);
  assert.equal(state.data.stock_movements.some((row) => row.id === 'movement-stock-issue' || row.id === 'movement-stock-store'), false);
  assert.equal(state.data.stockDepotItems.some((row) => row.id === 'stock-derived-1'), false);
  assert.equal(JSON.stringify(state.data.stockDepotItems.find((row) => row.id === 'stock-baseline-1')), baselineBefore);
  assert.equal(JSON.stringify({
    demand: state.data.planningDemands.find((row) => row.id === 'pln-sales-foreign'),
    workOrder: state.data.workOrders.find((row) => row.id === 'wo-sales-foreign'),
    movement: state.data.stock_movements.find((row) => row.id === 'movement-foreign')
  }), foreignBefore);
  assert.equal(state.data.outsourceDispatchDrafts[0].items[0].qty, 1);
  assert.equal(state.data.outsourceDispatchDrafts[0].items[0].workOrderRefs.length, 1);
});

test('PROTOTYPE STOCK CLEANUP stale plan ve yabanci fiziksel referansta mutation yapmadan fail closed kalir', () => {
  const Cleanup = require('../src/core/prototype-stock-test-cleanup.js');
  const staleState = buildPrototypeStockCleanupFixture();
  const stalePlan = Cleanup.build(staleState);
  staleState.data.workOrderTransactions[0].qty = 7;
  const staleBefore = JSON.stringify(staleState);
  assert.equal(Cleanup.apply(staleState, stalePlan).ok, false);
  assert.equal(JSON.stringify(staleState), staleBefore);

  const foreignState = buildPrototypeStockCleanupFixture();
  foreignState.data.salesShipmentPlans.push({ id: 'svp-foreign', stockItemId: 'stock-derived-1' });
  const foreignBefore = JSON.stringify(foreignState);
  const foreignPlan = Cleanup.build(foreignState);
  assert.equal(foreignPlan.ok, false);
  assert.ok(foreignPlan.issues.some((row) => row.reasonCode === 'DERIVED_STOCK_HAS_FOREIGN_REFERENCE'));
  assert.equal(JSON.stringify(foreignState), foreignBefore);
});

test('PROTOTYPE STOCK CLEANUP server v2 yalniz deterministik no-restore gecisini dogrular', () => {
  const Cleanup = require('../src/core/prototype-stock-test-cleanup.js');
  const server = require('../serve.js');
  const before = buildPrototypeStockCleanupFixture();
  const plan = Cleanup.build(before);
  const after = Cleanup.clone(before);
  assert.equal(Cleanup.apply(after, plan).ok, true);
  const approval = {
    type: 'stock_demand_demo_cleanup',
    issues: [],
    meta: { stockCleanupVersion: 2, noStockRestore: true, manifestSignature: plan.manifestSignature }
  };

  assert.equal(server.isVerifiedPrototypeStockTestCleanup(before, after, approval), true);
  const stockTamper = Cleanup.clone(after);
  stockTamper.data.stockDepotItems[0].qty += 0.084;
  assert.equal(server.isVerifiedPrototypeStockTestCleanup(before, stockTamper, approval), false);
  const masterTamper = Cleanup.clone(after);
  masterTamper.data.products = [];
  assert.equal(server.isVerifiedPrototypeStockTestCleanup(before, masterTamper, approval), false);
  assert.equal(server.isVerifiedPrototypeStockTestCleanup(before, after, {
    ...approval, meta: { ...approval.meta, noStockRestore: false }
  }), false);
});

test('PROTOTYPE STOCK CLEANUP PlanningModule tek save yapar ve save hatasinda tum statei geri alir', async () => {
  const Cleanup = require('../src/core/prototype-stock-test-cleanup.js');
  const buildHarness = (saveOk) => {
    const state = buildPrototypeStockCleanupFixture();
    let saveCount = 0;
    let approval = null;
    const DB = {
      data: state,
      cloneState: (value) => Cleanup.clone(value),
      createCriticalDropApproval: (type, beforeState, afterState, meta) => {
        approval = { type, issues: [], meta };
        return approval;
      },
      save: async () => {
        saveCount += 1;
        return saveOk ? { ok: true, revision: 42 } : { ok: false, code: 'forced_failure' };
      }
    };
    const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
      DB,
      PrototypeStockTestCleanup: Cleanup,
      UI: { renderCurrentPage: () => {} },
      Modal: { close: () => {} },
      alert: () => {},
      confirm: () => true
    });
    return { DB, PlanningModule, get saveCount() { return saveCount; }, get approval() { return approval; } };
  };

  const success = buildHarness(true);
  const result = await success.PlanningModule.cleanupPrototypeStockTestCohortForDemo({ confirmBeforeApply: false, silent: true });
  assert.equal(result.ok, true);
  assert.equal(success.saveCount, 1);
  assert.equal(success.approval?.meta?.stockCleanupVersion, 2);
  assert.equal(success.approval?.meta?.noStockRestore, true);
  assert.equal(success.DB.data.data.stockDepotItems.find((row) => row.id === 'stock-baseline-1').qty, 99.916);

  const failed = buildHarness(false);
  const failedBefore = JSON.stringify(failed.DB.data);
  const failedResult = await failed.PlanningModule.cleanupPrototypeStockTestCohortForDemo({ confirmBeforeApply: false, silent: true });
  assert.equal(failedResult.ok, false);
  assert.equal(failed.saveCount, 1);
  assert.equal(JSON.stringify(failed.DB.data), failedBefore);
});

function buildPrototypeSalesCohortCleanupFixture() {
  const baseline = [
    ['EK-2026-000001', 'AKS0002', 100, 'MT'],
    ['EK-2026-000002', 'AKS0003', 500, 'MT'],
    ['EK-2026-000003', 'ALM0005', 100, 'MT'],
    ['EK-2026-000004', 'ALM0004', 500, 'MT'],
    ['EK-2026-000005', 'ALM0003', 500, 'MT'],
    ['EK-2026-000006', 'ALM0001', 500, 'MT'],
    ['EK-2026-000007', 'AKS0001', 10000, 'KG'],
    ['EK-2026-000008', 'DIK0002', 500, 'ADET'],
    ['EK-2026-000009', 'DIK0001', 500, 'ADET']
  ];
  const products = baseline.map(([, code], index) => ({ id: `product-${index + 1}`, code }));
  const entries = baseline.map(([docNo, code, qty, unit], index) => ({
    id: `entry-${index + 1}`, docNo, productId: `product-${index + 1}`, productCode: code,
    qty, unit, depotId: 'main', locationId: 'loc-main', locationCode: 'R01-A1'
  }));
  const movements = baseline.map(([docNo, code, qty, unit], index) => ({
    id: `movement-${index + 1}`, movementType: 'MANUAL_ENTRY', docNo, productCode: code,
    qty, unit, depotId: 'main', locationId: 'loc-main'
  }));
  const stocks = baseline.map(([docNo, code, qty, unit], index) => {
    const currentQty = index === 0 ? qty - 1 : qty;
    return {
      id: `stock-${index + 1}`, productId: `product-${index + 1}`, productCode: code, code,
      qty: currentQty, quantity: currentQty, amount: currentQty, unit,
      depotId: 'main', locationId: 'loc-main', note: `Envantere elle kayit / ${docNo}`
    };
  });
  for (let number = 10; number <= 16; number += 1) {
    const suffix = String(number).padStart(6, '0');
    const docNo = `EK-2026-${suffix}`;
    const idSuffix = number === 10 ? 'test-seed' : `test-seed-${number}`;
    entries.push({
      id: `entry-${idSuffix}`, docNo, productId: 'product-1', productCode: 'AKS0002',
      qty: 5, unit: 'MT', depotId: 'main', locationId: 'loc-test', locationCode: 'FAZ5-TEST-01'
    });
    movements.push({
      id: `movement-${idSuffix}`, movementType: 'MANUAL_ENTRY', docNo,
      productCode: 'AKS0002', qty: 5, unit: 'MT'
    });
    stocks.push({
      id: `stock-${idSuffix}`, code: 'AKS0002', qty: 5, quantity: 5, amount: 5,
      unit: 'MT', locationId: 'loc-test', note: `Envantere elle kayit / ${docNo}`
    });
  }
  movements.push({
    id: 'movement-sales-issue', movementType: 'WORK_ORDER_ISSUE', workOrderId: 'wo-sales',
    workOrderCode: 'WO-SALES', sourceStockItemId: 'stock-1', qty: 1
  });
  const exactReservation = {
    reservationKey: 'reservation-fixture-1',
    physicalSegmentId: 'STOCK|stock-test-seed',
    stockRowId: 'stock-test-seed',
    segmentOffsetStart: 0,
    segmentOffsetEnd: 1,
    qty: 1
  };
  const orderCodes = ['SOR-000007', 'SOR-000008', 'SOR-000009', 'SOR-000011',
    'SOR-000012', 'SOR-000013', 'SOR-000014', 'SOR-000015'];
  const orders = orderCodes.map((orderNo, index) => ({
    id: index === 2 ? 'sor-sales' : `sor-fixture-${index}`,
    orderNo,
    ...(orderNo === 'SOR-000009' || orderNo === 'SOR-000011'
      ? {} : { prototypeResetTombstone: { type: 'PROTOTYPE_TEST_RESET_RETAINED_EVIDENCE' } })
  }));
  const demands = orders.map((order, index) => ({
    id: index === 2 ? 'pln-sales' : `pln-fixture-${index}`,
    demandCode: `PLN-FIXTURE-${index}`,
    sourceType: 'SALES_ORDER',
    sourceOrderId: order.id,
    workOrderIds: index === 2 ? ['wo-sales'] : []
  }));
  return {
    schema_version: 1,
    meta: { revision: 50, updated_at: '2026-08-28T13:00:00.000Z', nextOrderNo: 99 },
    data: {
      products,
      customers: [{ id: 'customer-master' }],
      suppliers: [{ id: 'supplier-master' }],
      stockDepots: [{ id: 'main' }],
      stockDepotLocations: [{ id: 'loc-main' }, { id: 'loc-test', code: 'FAZ5-TEST-01' }],
      stockManualEntries: entries,
      stock_movements: movements,
      stockDepotItems: stocks,
      orders,
      planningDemands: demands,
      workOrders: [{ id: 'wo-sales', workOrderCode: 'WO-SALES', sourceId: 'pln-sales', sourceCode: 'PLN-SALES' }],
      workOrderTransactions: [{ id: 'txn-sales', workOrderId: 'wo-sales', type: 'TAKE', qty: 1 }],
      workOrderExternalSupplierAssignments: [],
      outsourceDispatchDrafts: [],
      outsourceTransfers: [],
      workOrderDispatchNotes: [],
      montageJobDispatches: [],
      partWorkOrders: [],
      montageDispatchPlans: [
        {
          id: 'mgp-fixture-source', planNo: 'MGP-FIXTURE-SOURCE',
          exactReservations: [exactReservation],
          items: [{ sourceOrderId: 'orphan-order-id' }]
        },
        {
          id: 'mgp-fixture-target', planNo: 'MGP-FIXTURE-TARGET',
          rebindAudit: {
            rebindKey: 'rebind-fixture', role: 'TARGET',
            sourcePlanId: 'mgp-fixture-source', targetPlanId: 'mgp-fixture-target',
            exactReservations: [{ ...exactReservation, reservationKey: 'reservation-fixture-2' }]
          }
        }
      ],
      montageDispatchShipments: [{
        id: 'mgs-fixture', shipmentNo: 'MGS-FIXTURE', planId: 'mgp-fixture-source',
        parts: [{ allocations: [{
          exactReservationKeys: ['reservation-fixture-1'],
          segmentRanges: [{ ...exactReservation, planId: 'mgp-fixture-source' }]
        }] }]
      }],
      montageCompletionTransfers: [],
      sanalTaksimAllocationInstructions: [],
      salesShipmentPlans: [],
      salesShipments: []
    }
  };
}

test('PROTOTYPE COMBINED COHORT CLEANUP SALES ve STOCK manifestini DELETE ve authoritative baseline reset planina donusturur', () => {
  const Cleanup = require('../src/core/prototype-sales-test-cohort-cleanup.js');
  const state = buildPrototypeSalesCohortCleanupFixture();
  state.data.planningDemands.push({
    id: 'pln-stock-combined',
    demandCode: 'PLN-000016',
    sourceType: 'STOCK',
    status: 'RELEASED',
    items: []
  });
  const before = JSON.stringify(state);
  const plan = Cleanup.build(state);

  assert.equal(plan.ok, true, plan.issues.map((row) => row.message).join(' | '));
  assert.equal(plan.summary.UNCERTAIN, 0);
  assert.equal(plan.summary.RESET_TO_BASELINE, 1);
  assert.equal(plan.baseline.manualEntryCount, 9);
  assert.equal(plan.baseline.movementCount, 9);
  assert.equal(plan.baseline.stockRowCount, 9);
  assert.equal(plan.baseline.authoritativeQtyTotal, 13200);
  assert.equal(plan.operationalCodeHighWaterMarks.SOR, '15');
  assert.ok(plan.targets.DELETE.some((row) => row.collection === 'orders' && row.id === 'sor-sales'));
  assert.ok(plan.targets.DELETE.some((row) => row.collection === 'planningDemands' && row.id === 'pln-stock-combined'));
  assert.ok(plan.targets.DELETE.some((row) => row.collection === 'stockManualEntries' && row.id === 'entry-test-seed'));
  assert.equal(JSON.stringify(state), before);
});

test('PROTOTYPE SALES COHORT CLEANUP apply test zincirini siler, baseline ve masteri exact korur', () => {
  const Cleanup = require('../src/core/prototype-sales-test-cohort-cleanup.js');
  const state = buildPrototypeSalesCohortCleanupFixture();
  const masterBefore = JSON.stringify({ products: state.data.products, customers: state.data.customers, suppliers: state.data.suppliers });
  const metaBefore = JSON.stringify(state.meta);
  const plan = Cleanup.build(state);
  const result = Cleanup.apply(state, plan);

  assert.equal(result.ok, true);
  assert.equal(state.data.orders.length, 0);
  assert.equal(state.data.planningDemands.length, 0);
  assert.equal(state.data.workOrders.length, 0);
  assert.equal(state.data.workOrderTransactions.length, 0);
  assert.equal(state.data.stockManualEntries.length, 9);
  assert.equal(state.data.stock_movements.length, 9);
  assert.equal(state.data.stockDepotItems.length, 9);
  assert.equal(state.data.stockDepotItems.reduce((sum, row) => sum + Number(row.qty), 0), 13200);
  assert.equal(state.data.stockDepotItems.find((row) => row.code === 'AKS0002').qty, 100);
  assert.equal(JSON.stringify({ products: state.data.products, customers: state.data.customers, suppliers: state.data.suppliers }), masterBefore);
  assert.equal(state.meta.revision, JSON.parse(metaBefore).revision);
  assert.equal(state.meta.updated_at, JSON.parse(metaBefore).updated_at);
  assert.equal(state.meta.nextOrderNo, JSON.parse(metaBefore).nextOrderNo);
  assert.equal(state.meta.operationalCodeHighWaterMarks.SOR, '15');
});

test('PROTOTYPE SALES COHORT CLEANUP temiz koleksiyonlarda monoton operasyon kodlarini korur', () => {
  const DB = {
    data: {
      meta: {
        operationalCodeHighWaterMarks: {
          SOR: 15, PLN: 21, WO: 127, MGP: 28, MGS: 8,
          MCT: 13, STAI: 84, SVP: 1, TF: 0, FTS: 18
        }
      },
      data: {
        orders: [], planningDemands: [], workOrders: [], montageDispatchPlans: [],
        montageDispatchShipments: [], montageCompletionTransfers: [],
        sanalTaksimAllocationInstructions: [], salesShipmentPlans: [], salesShipments: [],
        outsourceDispatchDrafts: []
      }
    }
  };
  const { exported: SalesModule } = loadModule('src/modules/sales-module.js', 'SalesModule', { DB });
  const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', { DB });
  const { exported: UnitModule } = loadModule('src/modules/unit-module.js', 'UnitModule', { DB });
  const { exported: StockModule } = loadModule('src/modules/stock-module.js', 'StockModule', { DB });

  assert.equal(SalesModule.generateSalesOrderNo(), 'SOR-000016');
  assert.equal(PlanningModule.getNextDemandCode(), 'PLN-000022');
  assert.equal(PlanningModule.getNextSanalTaksimAllocationInstructionCode(), 'STAI-000085');
  assert.equal(UnitModule.getNextWorkOrderCode(), 'WO-000128');
  assert.equal(StockModule.getNextMontageDispatchPlanNo(), 'MGP-000029');
  assert.equal(StockModule.getNextMontageDispatchShipmentNo(), 'MGS-000009');
  assert.equal(StockModule.getNextMontageCompletionTransferNo(), 'MCT-000014');
  assert.equal(StockModule.getNextSalesShipmentPlanNo(), 'SVP-000002');
  assert.equal(StockModule.getNextSalesShipmentNo(), 'TF-000001');
  assert.equal(StockModule.getNextOutsourceDispatchNo(), 'FTS-000019');
});

test('OPERATIONAL CODE HIGH WATER canli maksimumu basarili save metadata tabanina tasir', () => {
  const Policy = require('../src/core/operational-code-high-water.js');
  const current = {
    meta: { operationalCodeHighWaterMarks: { TF: 3, MGP: 10 } },
    data: {
      salesShipments: [{ id: 'tf-4', shipmentNo: 'TF-000004' }],
      montageDispatchPlans: [{ id: 'mgp-11', planNo: 'MGP-000011' }]
    }
  };
  const incoming = JSON.parse(JSON.stringify(current));
  incoming.data.salesShipments.push({ id: 'tf-5', shipmentNo: 'TF-000005' });
  incoming.data.montageDispatchPlans.push({ id: 'mgp-12', planNo: 'MGP-000012' });
  const beforeRecords = JSON.stringify(incoming.data);
  const result = Policy.diagnoseTransition(current, incoming);

  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.equal(result.marks.TF, '5');
  assert.equal(result.marks.MGP, '12');
  assert.equal(Policy.applyPersistentMarks(incoming, result.marks), true);
  assert.equal(JSON.stringify(incoming.data), beforeRecords);
  assert.equal(incoming.meta.operationalCodeHighWaterMarks.TF, '5');
  assert.equal(incoming.meta.operationalCodeHighWaterMarks.MGP, '12');
});

test('OPERATIONAL CODE HIGH WATER cleanup sonrasi bos collectionda kod reuse girisimini fail closed reddeder', () => {
  const Policy = require('../src/core/operational-code-high-water.js');
  const beforeCleanup = {
    meta: { operationalCodeHighWaterMarks: { TF: 6 } },
    data: { salesShipments: [{ id: 'tf-history-6', shipmentNo: 'TF-000006' }] }
  };
  const afterCleanup = {
    meta: { operationalCodeHighWaterMarks: {} },
    data: { salesShipments: [] }
  };
  const cleanup = Policy.diagnoseTransition(beforeCleanup, afterCleanup);
  assert.equal(cleanup.ok, true);
  assert.equal(cleanup.marks.TF, '6');
  Policy.applyPersistentMarks(afterCleanup, cleanup.marks);
  assert.equal(afterCleanup.data.salesShipments.length, 0);

  const reused = JSON.parse(JSON.stringify(afterCleanup));
  reused.data.salesShipments.push({ id: 'tf-new-reuse', shipmentNo: 'TF-000001' });
  const reuseResult = Policy.diagnoseTransition(afterCleanup, reused);
  assert.equal(reuseResult.ok, false);
  assert.ok(reuseResult.issues.some((row) => row.reasonCode === 'OPERATIONAL_CODE_REUSE'
    && row.family === 'TF' && row.highWater === '6'));

  const blankLegacy = JSON.parse(JSON.stringify(afterCleanup));
  blankLegacy.data.salesShipments.push({ id: 'tf-legacy-blank', shipmentNo: '' });
  const blankReused = JSON.parse(JSON.stringify(blankLegacy));
  blankReused.data.salesShipments[0].shipmentNo = 'TF-000006';
  const blankReuseResult = Policy.diagnoseTransition(blankLegacy, blankReused);
  assert.equal(blankReuseResult.ok, false);
  assert.ok(blankReuseResult.issues.some((row) => row.reasonCode === 'OPERATIONAL_CODE_REUSE'
    && row.family === 'TF' && row.highWater === '6'));

  const monotonic = JSON.parse(JSON.stringify(afterCleanup));
  monotonic.data.salesShipments.push({ id: 'tf-new-7', shipmentNo: 'TF-000007' });
  assert.equal(Policy.diagnoseTransition(afterCleanup, monotonic).ok, true);
});

test('OPERATIONAL CODE HIGH WATER guvenilir historical baseline yoksa aileyi fail closed tutar', () => {
  const Policy = require('../src/core/operational-code-high-water.js');
  const legacy = {
    meta: { operationalCodeHighWaterMarks: {} },
    data: { salesShipments: [{ id: 'tf-legacy-1', shipmentNo: 'TF-000001' }] }
  };
  const unchanged = JSON.parse(JSON.stringify(legacy));
  const unchangedResult = Policy.diagnoseTransition(legacy, unchanged);
  assert.equal(unchangedResult.ok, true);
  assert.deepEqual(unchangedResult.untrustedFamilies, ['TF']);
  Policy.applyPersistentMarks(unchanged, unchangedResult.marks, unchangedResult.untrustedFamilies);
  assert.deepEqual(unchanged.meta.operationalCodeHighWaterUntrustedFamilies, ['TF']);

  const next = JSON.parse(JSON.stringify(unchanged));
  next.data.salesShipments.push({ id: 'tf-new-2', shipmentNo: 'TF-000002' });
  const blocked = Policy.diagnoseTransition(unchanged, next);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.issues.some((row) => row.reasonCode === 'OPERATIONAL_CODE_HIGH_WATER_UNTRUSTED'
    && row.family === 'TF' && row.highWater === '1'));
});

test('OPERATIONAL CODE HIGH WATER tekrar save sayaci sicr atmaz ve aileleri bagimsiz tutar', () => {
  const Policy = require('../src/core/operational-code-high-water.js');
  const current = {
    meta: { operationalCodeHighWaterMarks: { TF: 6, MGP: 31, SVP: 2 } },
    data: { salesShipments: [], montageDispatchPlans: [], salesShipmentPlans: [] }
  };
  const incoming = JSON.parse(JSON.stringify(current));
  incoming.data.salesShipments.push({ id: 'tf-7', shipmentNo: 'TF-000007' });
  incoming.data.montageDispatchPlans.push({ id: 'mgp-32', planNo: 'MGP-000032' });
  const first = Policy.diagnoseTransition(current, incoming);
  assert.equal(first.ok, true);
  assert.equal(first.marks.TF, '7');
  assert.equal(first.marks.MGP, '32');
  assert.equal(first.marks.SVP, '2');
  Policy.applyPersistentMarks(incoming, first.marks);
  const repeated = Policy.diagnoseTransition(incoming, JSON.parse(JSON.stringify(incoming)));
  assert.equal(repeated.ok, true);
  assert.deepEqual(repeated.marks, first.marks);

  const duplicate = JSON.parse(JSON.stringify(incoming));
  duplicate.data.salesShipments.push({ id: 'tf-duplicate-7', shipmentNo: 'TF-000007' });
  const duplicateResult = Policy.diagnoseTransition(incoming, duplicate);
  assert.equal(duplicateResult.ok, false);
  assert.ok(duplicateResult.issues.some((row) => row.reasonCode === 'OPERATIONAL_CODE_DUPLICATE'
    && row.family === 'TF'));

  const renumbered = JSON.parse(JSON.stringify(incoming));
  renumbered.data.salesShipments[0].shipmentNo = 'TF-000008';
  const renumberResult = Policy.diagnoseTransition(incoming, renumbered);
  assert.equal(renumberResult.ok, false);
  assert.ok(renumberResult.issues.some((row) => row.reasonCode === 'OPERATIONAL_CODE_CHANGED'
    && row.family === 'TF' && row.previousCode === 'TF-000007'));
});

test('OPERATIONAL CODE HIGH WATER gercek state kayitlarini ve resolver sonucunu degistirmez', () => {
  const Policy = require('../src/core/operational-code-high-water.js');
  const Resolver = require('../src/core/sanal-taksim-resolver.js');
  const state = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo_state.json'), 'utf8'));
  const clone = JSON.parse(JSON.stringify(state));
  const criticalCodes = [
    ['montageDispatchPlans', 'planNo', 'MGP-000031'],
    ['montageDispatchShipments', 'shipmentNo', 'MGS-000009'],
    ['montageCompletionTransfers', 'transferNo', 'MCT-000014'],
    ['salesShipmentPlans', 'planNo', 'SVP-000002'],
    ['salesShipments', 'shipmentNo', 'TF-000001']
  ];
  const criticalInstructions = clone.data.sanalTaksimAllocationInstructions.filter((row) => {
    const number = Number(String(row?.instructionCode || '').match(/(\d+)$/)?.[1]);
    return number >= 99 && number <= 112;
  });
  assert.equal(criticalInstructions.length, 14);
  const beforeRecords = JSON.stringify({
    records: criticalCodes.map(([collection, field, value]) =>
      clone.data[collection].find((row) => row?.[field] === value)),
    instructions: criticalInstructions,
    stock: clone.data.stockDepotItems,
    movements: clone.data.stock_movements,
    transactions: clone.data.workOrderTransactions
  });
  const resolverBefore = JSON.stringify(Resolver.resolve(clone.data));
  const marks = Policy.buildPersistentMarks(clone, clone);
  const transition = Policy.diagnoseTransition(state, clone);
  assert.equal(transition.ok, true);
  assert.deepEqual(transition.untrustedFamilies, ['TF']);
  Policy.applyPersistentMarks(clone, marks, transition.untrustedFamilies);
  const resolverAfter = JSON.stringify(Resolver.resolve(clone.data));
  const afterRecords = JSON.stringify({
    records: criticalCodes.map(([collection, field, value]) =>
      clone.data[collection].find((row) => row?.[field] === value)),
    instructions: clone.data.sanalTaksimAllocationInstructions.filter((row) => {
      const number = Number(String(row?.instructionCode || '').match(/(\d+)$/)?.[1]);
      return number >= 99 && number <= 112;
    }),
    stock: clone.data.stockDepotItems,
    movements: clone.data.stock_movements,
    transactions: clone.data.workOrderTransactions
  });

  assert.equal(afterRecords, beforeRecords);
  assert.equal(resolverAfter, resolverBefore);
  assert.equal(marks.MGP, '31');
  assert.equal(marks.STAI, '112');
  assert.equal(marks.MGS, '9');
  assert.equal(marks.MCT, '14');
  assert.equal(marks.SVP, '2');
  assert.equal(marks.TF, '1');
  assert.deepEqual(clone.meta.operationalCodeHighWaterUntrustedFamilies, ['TF']);
});

test('PROTOTYPE SALES COHORT CLEANUP UNCERTAIN ve stale manifestte mutation yapmadan durur', () => {
  const Cleanup = require('../src/core/prototype-sales-test-cohort-cleanup.js');
  const uncertain = buildPrototypeSalesCohortCleanupFixture();
  uncertain.data.stockDepotItems.push({ id: 'unknown-physical', qty: 1, quantity: 1, amount: 1 });
  const uncertainBefore = JSON.stringify(uncertain);
  const uncertainPlan = Cleanup.build(uncertain);
  assert.equal(uncertainPlan.ok, false);
  assert.equal(Cleanup.apply(uncertain, uncertainPlan).ok, false);
  assert.equal(JSON.stringify(uncertain), uncertainBefore);

  const stale = buildPrototypeSalesCohortCleanupFixture();
  const stalePlan = Cleanup.build(stale);
  stale.data.orders[0].status = 'CHANGED';
  const staleBefore = JSON.stringify(stale);
  assert.equal(Cleanup.apply(stale, stalePlan).ok, false);
  assert.equal(JSON.stringify(stale), staleBefore);
});

test('PROTOTYPE COMBINED COHORT CLEANUP server v6 yalniz exact manifest ve baseline gecisini kabul eder', () => {
  const Cleanup = require('../src/core/prototype-sales-test-cohort-cleanup.js');
  const server = require('../serve.js');
  const before = buildPrototypeSalesCohortCleanupFixture();
  const plan = Cleanup.build(before);
  const after = Cleanup.clone(before);
  assert.equal(Cleanup.apply(after, plan).ok, true);
  const approval = {
    type: 'sales_order_demo_cleanup',
    issues: [],
    meta: {
      prototypeResetVersion: 6,
      prototypeResetMode: Cleanup.MODE,
      manifestSignature: plan.manifestSignature
    }
  };

  assert.equal(server.isVerifiedPrototypeSalesTestCohortCleanup(before, after, approval), true,
    JSON.stringify(Cleanup.diagnoseTransition(before, after, approval)));
  assert.equal(server.isVerifiedSalesOrderPrototypeReset(before, after, approval), true);
  const stockTamper = Cleanup.clone(after);
  stockTamper.data.stockDepotItems[0].qty -= 1;
  assert.equal(server.isVerifiedPrototypeSalesTestCohortCleanup(before, stockTamper, approval), false);
  const masterTamper = Cleanup.clone(after);
  masterTamper.data.products = [];
  assert.equal(server.isVerifiedPrototypeSalesTestCohortCleanup(before, masterTamper, approval), false);
});

test('PROTOTYPE SALES COHORT CLEANUP PlanningModule tek save yapar ve save hatasinda rollback yapar', async () => {
  const Cleanup = require('../src/core/prototype-sales-test-cohort-cleanup.js');
  const Planner = require('../src/core/prototype-test-cohort-planner.js');
  const buildHarness = (saveOk, runtimeEnabled = true) => {
    let saveCount = 0;
    let approval = null;
    const DB = {
      data: buildPrototypeSalesCohortCleanupFixture(),
      isDemoTestResetEnabled: () => runtimeEnabled,
      cloneState: (value) => Cleanup.clone(value),
      createCriticalDropApproval: (type, beforeState, afterState, meta) => {
        approval = { type, issues: [], meta };
        return approval;
      },
      save: async () => {
        saveCount += 1;
        return saveOk ? { ok: true, revision: 51 } : { ok: false, code: 'forced_failure' };
      }
    };
    const { exported: PlanningModule } = loadModule('src/modules/planning-module.js', 'PlanningModule', {
      DB,
      PrototypeSalesTestCohortCleanup: Cleanup,
      PrototypeTestCohortPlanner: Planner,
      UI: { renderCurrentPage: () => {} },
      Modal: { close: () => {} },
      alert: () => {},
      confirm: () => true
    });
    return { DB, PlanningModule, get saveCount() { return saveCount; }, get approval() { return approval; } };
  };

  const success = buildHarness(true);
  const result = await success.PlanningModule.cleanupPrototypeSalesTestCohortForDemo({ confirmBeforeApply: false, silent: true });
  assert.equal(result.ok, true);
  assert.equal(success.saveCount, 1);
  assert.equal(success.approval?.meta?.prototypeResetVersion, 6);
  assert.equal(success.DB.data.data.stockDepotItems.reduce((sum, row) => sum + Number(row.qty), 0), 13200);

  const failed = buildHarness(false);
  const failedBefore = JSON.stringify(failed.DB.data);
  const failedResult = await failed.PlanningModule.cleanupPrototypeSalesTestCohortForDemo({ confirmBeforeApply: false, silent: true });
  assert.equal(failedResult.ok, false);
  assert.equal(failed.saveCount, 1);
  assert.equal(JSON.stringify(failed.DB.data), failedBefore);

  const liveMode = buildHarness(true, false);
  const liveBefore = JSON.stringify(liveMode.DB.data);
  const liveResult = await liveMode.PlanningModule.cleanupPrototypeSalesTestCohortForDemo({
    confirmBeforeApply: false,
    silent: true
  });
  assert.equal(liveResult.ok, false);
  assert.equal(liveResult.code, 'DEMO_TEST_RESET_DISABLED');
  assert.equal(liveMode.saveCount, 0);
  assert.equal(JSON.stringify(liveMode.DB.data), liveBefore);
});

test('DEMO TEST ORTAMINI SIFIRLA UI ve runtime kapisi yalniz PROTOTYPE modunda acilir', () => {
  const root = path.join(__dirname, '..');
  const planning = fs.readFileSync(path.join(root, 'src/modules/planning-module.js'), 'utf8');
  const appCore = fs.readFileSync(path.join(root, 'src/core/app-core.js'), 'utf8');
  const server = fs.readFileSync(path.join(root, 'serve.js'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  assert.match(planning, /Demo Test Ortamını Sıfırla/);
  assert.match(planning, /Test ortamı temiz/);
  assert.match(planning, /DEMO_TEST_RESET_DISABLED/);
  assert.match(planning, /DEMO_TEST_RESET_POSTCHECK_FAILED/);
  assert.match(appCore, /demoTestResetEnabled:\s*false/);
  assert.match(appCore, /\[3, 4, 5, 6\]/);
  assert.match(server, /process\.env\.DULDA_ERP_RUNTIME_MODE\s*\|\|\s*["']LIVE["']/);
  assert.match(server, /demo_test_reset_disabled/);
  assert.match(server, /stock_demand_demo_cleanup/);
  assert.equal(packageJson.scripts['start:prototype'], 'node serve.js 5500 --runtime-mode=PROTOTYPE');
  assert.equal(packageJson.scripts['start:live'], 'node serve.js 5500 --runtime-mode=LIVE');
});

async function run() {
  let failed = 0;
  const filter = String(process.env.BACKBONE_TEST_FILTER || '').trim().toLocaleLowerCase('tr');
  const selectedTests = filter
    ? tests.filter((row) => String(row?.name || '').toLocaleLowerCase('tr').includes(filter))
    : tests;
  for (const row of selectedTests) {
    try {
      await row.fn();
      console.log(`OK: ${row.name}`);
    } catch (error) {
      failed += 1;
      const message = error && error.stack ? error.stack : String(error);
      console.error(`FAIL: ${row.name}`);
      console.error(message);
    }
  }
  if (failed > 0) {
    console.error(`Backbone guard testleri basarisiz. Hata sayisi: ${failed}`);
    process.exit(1);
  }
  console.log(`Backbone guard testleri gecti. Toplam: ${selectedTests.length}`);
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
