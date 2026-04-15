const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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

function buildTransferHarness({ statusKey = 'available' } = {}) {
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

async function run() {
  let failed = 0;
  for (const row of tests) {
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
  console.log(`Backbone guard testleri gecti. Toplam: ${tests.length}`);
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
