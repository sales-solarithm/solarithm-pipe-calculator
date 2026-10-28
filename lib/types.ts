export interface PipeSizeItem {
  id: string;
  label: string; // e.g. "40 x 40", "60 x 40", "80 x 40"
  unitWeightKgPerM?: number;
}

export interface CutItem {
  id: string;
  category: string;
  pipeSize: string;
  length: number; // in feet or meters
  quantity: number;
}

export interface ComponentCutRow {
  id: string;
  length: number; // length in feet
  quantities: Record<string, number>; // size -> quantity of pieces
}

export interface ComponentItem {
  id: string;
  name: string; // e.g. "Purlin", "Rafter", "Leg", "Supports", "Walkway", "Bypass", "Stairs"
  cutRows: ComponentCutRow[];
}

export interface CategoryRow {
  id: string;
  category: string; // e.g. "Purlin", "Rafter", "Leg", "Supports", "Walkway", "Bypass", "Stairs"
  quantities: Record<string, number>; // pipeSize -> count
  notes?: string;
}

export interface PipeProject {
  id: string;
  userId: string;
  userEmail?: string;
  projectName: string;
  clientName: string;
  submissionDate: string;
  standardPipeLength: number; // e.g. 20
  pipeLengthUnit: 'ft' | 'm';
  companyName: string;
  companyCity: string;
  showBranding: boolean;
  noteText: string;
  logoUrl?: string;
  clientLogoUrl?: string;
  pipeSizes: string[];
  components: string[];
  componentItems: ComponentItem[];
  rows: CategoryRow[];
  cutList?: CutItem[];
  createdAt: any;
  updatedAt: any;
}

export interface BinPackingResult {
  pipeSize: string;
  stockPipesUsed: number;
  totalCutLength: number;
  totalStockLength: number;
  efficiencyPercent: number;
  wastePercent: number;
  patterns: {
    stockIndex: number;
    cuts: number[];
    remainingWaste: number;
  }[];
}
