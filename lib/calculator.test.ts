import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBuffer,
  calculateRowTotal,
  calculateSizeTotals,
  calculateGrandTotal,
  optimizeCutList,
  getDefaultProject,
  createBlankProject,
  calculateRowPipes,
  calculateComponentPipesPerSize,
  calculateComponentTotalPipes,
  calculateComponentTotalPieces,
  syncCategoryRowsFromComponentItems,
} from './calculator';

test('createBlankProject initializes Untitled Project with all 7 components at zero pipes and cuts', () => {
  const blank = createBlankProject('test_user');
  assert.ok(blank.id.startsWith('proj_'));
  assert.equal(blank.projectName, 'Untitled Project');
  assert.equal(blank.clientName, '');
  assert.equal(blank.standardPipeLength, 20);
  assert.equal(blank.componentItems.length, 7);

  // Every component has 1 empty row with length 0 and 0 quantities
  for (const comp of blank.componentItems) {
    assert.equal(comp.cutRows.length, 1);
    assert.equal(comp.cutRows[0].length, 0);
    assert.equal(calculateComponentTotalPipes(comp, blank.standardPipeLength, blank.pipeSizes), 0);
    assert.equal(calculateComponentTotalPieces(comp, blank.pipeSizes), 0);
  }

  const grandTotal = calculateGrandTotal(blank.rows, blank.pipeSizes);
  assert.equal(grandTotal, 0);
  assert.deepEqual(calculateBuffer(grandTotal), [0, 0]);
});

test('calculateBuffer calculates 10-15% extra rounded up correctly', () => {
  assert.deepEqual(calculateBuffer(74), [82, 86]);
  assert.deepEqual(calculateBuffer(43), [48, 50]);
  assert.deepEqual(calculateBuffer(191), [211, 220]);
  assert.deepEqual(calculateBuffer(0), [0, 0]);
});

test('calculateRowPipes calculates standard pipes required per cut row', () => {
  // 14.5 ft * 20 pieces = 290 ft / 20 ft standard = 14.5 -> 15 pipes
  assert.equal(calculateRowPipes(14.5, 20, 20), 15);
  // 20 ft * 43 pieces = 860 ft / 20 ft standard = 43 pipes
  assert.equal(calculateRowPipes(20, 43, 20), 43);
  // Zero handling
  assert.equal(calculateRowPipes(0, 10, 20), 0);
  assert.equal(calculateRowPipes(10, 0, 20), 0);
});

test('calculateComponentPipesPerSize computes cumulative pipes for multiple cut rows', () => {
  const comp = {
    id: 'test-purlin',
    name: 'Purlin',
    cutRows: [
      { id: '1', length: 10, quantities: { '60 x 40': 20 } }, // 200 ft -> 10 pipes
      { id: '2', length: 15, quantities: { '60 x 40': 10 } }, // 150 ft -> total 350 ft / 20 = 17.5 -> 18 pipes
    ],
  };

  const perSize = calculateComponentPipesPerSize(comp, 20, ['60 x 40', '40 x 40']);
  assert.equal(perSize['60 x 40'], 18);
  assert.equal(perSize['40 x 40'], 0);
});

test('getDefaultProject matches ReportLab reference values across components', () => {
  const proj = getDefaultProject();
  const sizes = proj.pipeSizes;

  // Check syncCategoryRowsFromComponentItems produces exact 74, 74, 43, 191
  const rows = syncCategoryRowsFromComponentItems(proj.componentItems, proj.standardPipeLength, sizes);
  const sizeTotals = calculateSizeTotals(rows, sizes);

  assert.equal(sizeTotals['40 x 40'], 74);
  assert.equal(sizeTotals['60 x 40'], 74);
  assert.equal(sizeTotals['80 x 40'], 43);

  const grandTotal = calculateGrandTotal(rows, sizes);
  assert.equal(grandTotal, 191);

  // Check specific component totals
  const purlin = proj.componentItems.find((c) => c.name === 'Purlin');
  assert.ok(purlin);
  assert.equal(calculateComponentTotalPipes(purlin, 20, sizes), 43);

  const rafter = proj.componentItems.find((c) => c.name === 'Rafter');
  assert.ok(rafter);
  assert.equal(calculateComponentTotalPipes(rafter, 20, sizes), 41);
});

test('optimizeCutList correctly packs cuts into stock lengths', () => {
  const cuts = [
    { id: '1', category: 'Purlin', pipeSize: '60 x 40', length: 10, quantity: 2 },
    { id: '2', category: 'Purlin', pipeSize: '60 x 40', length: 5, quantity: 2 },
  ];

  const result = optimizeCutList(cuts, 20);
  assert.ok(result['60 x 40']);
  assert.equal(result['60 x 40'].totalCutLength, 30);
  assert.equal(result['60 x 40'].stockPipesUsed, 2);
  assert.equal(result['60 x 40'].totalStockLength, 40);
  assert.equal(result['60 x 40'].efficiencyPercent, 75);
});

import { blendHex, fitLogoContain, generatePipeSummaryPdf, PDF_COLORS } from './pipePdf';

test('blendHex computes subtle gold sun motif colors over forest green header', () => {
  const rayHex = blendHex(PDF_COLORS.GOLD, PDF_COLORS.GREEN, 0.10);
  const diskHex = blendHex(PDF_COLORS.GOLD, PDF_COLORS.GREEN, 0.07);
  assert.equal(rayHex, '#1a4624');
  assert.equal(diskHex, '#144324');
});

test('fitLogoContain preserves aspect ratio and centers logo inside white card', () => {
  const fitted = fitLogoContain(51, 47, 214, 73.35, 779, 267);
  assert.ok(Math.abs(fitted.width - 214) < 0.1);
  assert.ok(Math.abs(fitted.height - 73.35) < 0.1);
  assert.ok(Math.abs(fitted.x - 51) < 0.1);
  assert.ok(Math.abs(fitted.y - 47) < 0.1);
});

test('generatePipeSummaryPdf builds a valid PDF with embedded PNG logo and all category rows', () => {
  const proj = getDefaultProject();
  const doc = generatePipeSummaryPdf(proj);
  const pdfOutput = doc.output();
  assert.ok(pdfOutput.startsWith('%PDF-'));
  assert.ok(pdfOutput.includes('/Subtype /Image'));
  assert.ok(pdfOutput.includes('PIPE REQUIREMENT'));
  assert.ok(pdfOutput.includes('Purlin'));
  assert.ok(pdfOutput.includes('Stairs'));
});

