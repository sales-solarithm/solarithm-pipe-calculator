import { CategoryRow, CutItem, BinPackingResult, PipeProject, ComponentItem, ComponentCutRow } from './types';

/**
 * Calculates 10-15% extra pipes for on-site variation contingency.
 * Mirrors the ReportLab lambda: buf = lambda n: (math.ceil(n * 1.10), math.ceil(n * 1.15))
 */
export function calculateBuffer(n: number): [number, number] {
  if (n <= 0) return [0, 0];
  return [Math.ceil(n * 1.10), Math.ceil(n * 1.15)];
}

/**
 * Calculates pipes required for a single cut row given length in feet, quantity, and standard pipe length.
 */
export function calculateRowPipes(length: number, quantity: number, standardLength: number): number {
  if (length <= 0 || quantity <= 0 || standardLength <= 0) return 0;
  return Math.ceil((length * quantity) / standardLength);
}

/**
 * Calculates total standard pipes per pipe size for a single component across its cut rows.
 */
export function calculateComponentPipesPerSize(
  component: ComponentItem,
  standardLength: number,
  pipeSizes: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const size of pipeSizes) {
    let totalLinearLength = 0;
    for (const row of component.cutRows) {
      const qty = Number(row.quantities[size]) || 0;
      if (qty > 0 && row.length > 0) {
        totalLinearLength += row.length * qty;
      }
    }
    result[size] = standardLength > 0 ? Math.ceil(totalLinearLength / standardLength) : 0;
  }
  return result;
}

/**
 * Calculates total piece quantities (not pipes) per pipe size for a component.
 */
export function calculateComponentQuantitiesPerSize(
  component: ComponentItem,
  pipeSizes: string[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const size of pipeSizes) {
    result[size] = component.cutRows.reduce((sum, r) => sum + (Number(r.quantities[size]) || 0), 0);
  }
  return result;
}

/**
 * Calculates total pipes across all sizes for a single component.
 */
export function calculateComponentTotalPipes(
  component: ComponentItem,
  standardLength: number,
  pipeSizes: string[]
): number {
  const perSize = calculateComponentPipesPerSize(component, standardLength, pipeSizes);
  return Object.values(perSize).reduce((a, b) => a + b, 0);
}

/**
 * Calculates total member piece count across all sizes for a component.
 */
export function calculateComponentTotalPieces(
  component: ComponentItem,
  pipeSizes: string[]
): number {
  const perSize = calculateComponentQuantitiesPerSize(component, pipeSizes);
  return Object.values(perSize).reduce((a, b) => a + b, 0);
}

/**
 * Synchronizes category rows used by the ReportLab PDF generator and summary table
 * from the granular component items.
 */
export function syncCategoryRowsFromComponentItems(
  componentItems: ComponentItem[],
  standardLength: number,
  pipeSizes: string[]
): CategoryRow[] {
  return componentItems.map((comp) => {
    const quantities = calculateComponentPipesPerSize(comp, standardLength, pipeSizes);
    return {
      id: comp.id,
      category: comp.name,
      quantities,
    };
  });
}

/**
 * Calculates row total across specified pipe sizes for summary tables.
 */
export function calculateRowTotal(row: CategoryRow, pipeSizes: string[]): number {
  return pipeSizes.reduce((sum, size) => sum + (Number(row.quantities[size]) || 0), 0);
}

/**
 * Calculates total pieces per pipe size across all rows.
 */
export function calculateSizeTotals(rows: CategoryRow[], pipeSizes: string[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const size of pipeSizes) {
    totals[size] = rows.reduce((sum, r) => sum + (Number(r.quantities[size]) || 0), 0);
  }
  return totals;
}

/**
 * Calculates grand total pipes across all categories and sizes.
 */
export function calculateGrandTotal(rows: CategoryRow[], pipeSizes: string[]): number {
  const totals = calculateSizeTotals(rows, pipeSizes);
  return Object.values(totals).reduce((a, b) => a + b, 0);
}

/**
 * 1D Bin Packing Optimization (First-Fit Decreasing)
 */
export function optimizeCutList(
  cuts: CutItem[],
  stockLength: number,
  kerf: number = 0
): Record<string, BinPackingResult> {
  const bySize: Record<string, number[]> = {};
  for (const item of cuts) {
    if (!bySize[item.pipeSize]) bySize[item.pipeSize] = [];
    for (let i = 0; i < item.quantity; i++) {
      if (item.length > 0) {
        bySize[item.pipeSize].push(item.length);
      }
    }
  }

  const results: Record<string, BinPackingResult> = {};

  for (const [pipeSize, pieceLengths] of Object.entries(bySize)) {
    const sorted = [...pieceLengths].sort((a, b) => b - a);
    const bins: { remaining: number; cuts: number[] }[] = [];

    for (const cut of sorted) {
      if (cut > stockLength) {
        bins.push({ remaining: 0, cuts: [cut] });
        continue;
      }

      let placed = false;
      for (const bin of bins) {
        const requiredSpace = cut + (bin.cuts.length > 0 ? kerf : 0);
        if (bin.remaining >= requiredSpace) {
          bin.cuts.push(cut);
          bin.remaining -= requiredSpace;
          placed = true;
          break;
        }
      }

      if (!placed) {
        bins.push({
          remaining: stockLength - cut,
          cuts: [cut],
        });
      }
    }

    const totalCutLength = pieceLengths.reduce((a, b) => a + b, 0);
    const totalStockLength = bins.length * stockLength;
    const efficiency = totalStockLength > 0 ? (totalCutLength / totalStockLength) * 100 : 0;

    results[pipeSize] = {
      pipeSize,
      stockPipesUsed: bins.length,
      totalCutLength,
      totalStockLength,
      efficiencyPercent: Math.round(efficiency * 10) / 10,
      wastePercent: Math.round((100 - efficiency) * 10) / 10,
      patterns: bins.map((b, i) => ({
        stockIndex: i + 1,
        cuts: b.cuts,
        remainingWaste: Math.max(0, Math.round(b.remaining * 100) / 100),
      })),
    };
  }

  return results;
}

/**
 * Returns default project configuration matching the reference ReportLab script
 * and pre-populates componentItems for the component workspace.
 */
export function getDefaultProject(userId: string = 'guest-local'): PipeProject {
  const pipeSizes = ['40 x 40', '60 x 40', '80 x 40'];
  const components = ['Purlin', 'Rafter', 'Leg', 'Supports', 'Walkway', 'Bypass', 'Stairs'];

  const componentItems: ComponentItem[] = [
    {
      id: 'comp-purlin',
      name: 'Purlin',
      cutRows: [
        { id: 'cut-purlin-1', length: 20, quantities: { '40 x 40': 0, '60 x 40': 43, '80 x 40': 0 } },
      ],
    },
    {
      id: 'comp-rafter',
      name: 'Rafter',
      cutRows: [
        { id: 'cut-rafter-1', length: 20, quantities: { '40 x 40': 10, '60 x 40': 31, '80 x 40': 0 } },
      ],
    },
    {
      id: 'comp-leg',
      name: 'Leg',
      cutRows: [
        { id: 'cut-leg-1', length: 20, quantities: { '40 x 40': 12, '60 x 40': 0, '80 x 40': 28 } },
      ],
    },
    {
      id: 'comp-supports',
      name: 'Supports',
      cutRows: [
        { id: 'cut-supports-1', length: 20, quantities: { '40 x 40': 15, '60 x 40': 0, '80 x 40': 0 } },
      ],
    },
    {
      id: 'comp-walkway',
      name: 'Walkway',
      cutRows: [
        { id: 'cut-walkway-1', length: 20, quantities: { '40 x 40': 25, '60 x 40': 0, '80 x 40': 0 } },
      ],
    },
    {
      id: 'comp-bypass',
      name: 'Bypass',
      cutRows: [
        { id: 'cut-bypass-1', length: 20, quantities: { '40 x 40': 6, '60 x 40': 0, '80 x 40': 15 } },
      ],
    },
    {
      id: 'comp-stairs',
      name: 'Stairs',
      cutRows: [
        { id: 'cut-stairs-1', length: 20, quantities: { '40 x 40': 6, '60 x 40': 0, '80 x 40': 0 } },
      ],
    },
  ];

  const rows = syncCategoryRowsFromComponentItems(componentItems, 20, pipeSizes);

  return {
    id: 'shresth-parisar-e-block',
    userId,
    projectName: 'Shresth Parisar (E Block)',
    clientName: 'Shresth Infrastructure',
    submissionDate: '05 Oct 2026',
    standardPipeLength: 20,
    pipeLengthUnit: 'ft',
    companyName: 'Solarithm Design & Engineering',
    companyCity: 'Surat, India',
    showBranding: true,
    noteText: 'PLEASE QUOTE 10-15% EXTRA PIPES OF ALL SIZES FOR ON-SITE VARIATION.',
    pipeSizes,
    components,
    componentItems,
    rows,
    cutList: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Creates a completely clean, zeroed-out PipeProject state for "+ New Project".
 * All 7 built-in components are initialized with 1 empty row (length: 0, all quantities: 0).
 */
export function createBlankProject(userId: string = 'guest_user'): PipeProject {
  const pipeSizes = ['40 x 40', '60 x 40', '80 x 40'];
  const components = ['Purlin', 'Rafter', 'Leg', 'Supports', 'Walkway', 'Bypass', 'Stairs'];
  const nowIso = new Date().toISOString();

  const componentItems: ComponentItem[] = components.map((name) => {
    const slug = name.toLowerCase();
    return {
      id: `comp-${slug}`,
      name,
      cutRows: [
        {
          id: `cut-${slug}-1`,
          length: 0,
          quantities: {
            '40 x 40': 0,
            '60 x 40': 0,
            '80 x 40': 0,
          },
        },
      ],
    };
  });

  const rows = syncCategoryRowsFromComponentItems(componentItems, 20, pipeSizes);

  return {
    id: `proj_${Date.now()}`,
    userId,
    projectName: 'Untitled Project',
    clientName: '',
    submissionDate: nowIso.slice(0, 10),
    standardPipeLength: 20,
    pipeLengthUnit: 'ft',
    companyName: 'Solarithm Design & Engineering',
    companyCity: 'Surat, India',
    showBranding: true,
    noteText: 'PLEASE QUOTE 10-15% EXTRA PIPES OF ALL SIZES FOR ON-SITE VARIATION.',
    pipeSizes,
    components,
    componentItems,
    rows,
    cutList: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

