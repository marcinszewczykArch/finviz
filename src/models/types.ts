export interface DataRecord {
  date: string;
  [field: string]: string | number | string[];
}

export interface ParsedData {
  records: DataRecord[];
  seriesNames: string[];
}

export interface SeriesDefinition {
  name: string;
  expr: string;
}

export interface LayerDefinition {
  type: string;
  y: string;
  source?: string;
  by?: string;
  title?: string;
}

export interface ChartDefinition {
  title: string;
  description?: string;
  type?: string;
  x?: string;
  x_tick?: string;
  x_labels?: string[];
  barmode?: string;
  hover?: string;
  show_values?: boolean;
  start?: number;
  y?: string;
  layers: LayerDefinition[];
}

export interface ParsedCharts {
  charts: ChartDefinition[];
}

export interface EngineFunction {
  name: string;
  minArgs: number;
  maxArgs: number;
  evaluate(args: number[][], context: DataContext): number[];
}

export interface DataContext {
  records: DataRecord[];
  seriesNames: string[];
}

export interface AggregatedResult {
  x: string[];
  y: number[];
}

export interface AggregatedFunction {
  name: string;
  minArgs: number;
  maxArgs: number;
  evaluate(args: number[][], context: DataContext): AggregatedResult;
}

export interface TraceFactory {
  type: string;
  create(layer: LayerDefinition, x: string[], y: number[], hovertext?: string[], displayText?: string[]): Partial<Plotly.Data>;
}

export interface ChartRenderer {
  render(container: HTMLElement, chart: ChartDefinition, data: ParsedData): void;
  clear(container: HTMLElement): void;
}

export interface DataParser {
  parse(input: string): ParsedData;
}
