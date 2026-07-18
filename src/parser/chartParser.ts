import { parse } from "smol-toml";
import type { ChartDefinition, LayerDefinition, ParsedCharts } from "../models/types.ts";

interface TomlChartRaw {
  title?: string;
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
  layer?: TomlLayerRaw | TomlLayerRaw[];
}

interface TomlLayerRaw {
  type?: string;
  y?: string;
  source?: string;
  by?: string;
  title?: string;
}

export class ChartParser {
  parse(input: string): ParsedCharts {
    const parsed = parse(input) as Record<string, unknown>;
    const chartEntries = parsed["chart"] as TomlChartRaw | TomlChartRaw[] | undefined;

    if (!chartEntries) {
      return { charts: [] };
    }

    const rawCharts = Array.isArray(chartEntries) ? chartEntries : [chartEntries];
    const charts: ChartDefinition[] = rawCharts.map((raw) => this.parseChart(raw));

    return { charts };
  }

  private parseChart(raw: TomlChartRaw): ChartDefinition {
    const type = raw.type;
    const x = raw.x;
    const x_tick = raw.x_tick;
    const x_labels = raw.x_labels;
    const barmode = raw.barmode;
    const hover = raw.hover;
    const show_values = raw.show_values;
    const start = raw.start;
    const description = raw.description;

    const layers: LayerDefinition[] = [];

    if (raw.layer) {
      const rawLayers = Array.isArray(raw.layer) ? raw.layer : [raw.layer];
      for (const rl of rawLayers) {
        layers.push({
          type: rl.type ?? type ?? "line",
          y: rl.y ?? "",
          source: rl.source,
          by: rl.by,
          title: rl.title,
        });
      }
    } else if (raw.y) {
      layers.push({
        type: type ?? "line",
        y: raw.y,
      });
    }

    return {
      title: raw.title ?? "Untitled",
      description,
      type,
      x,
      x_tick,
      x_labels,
      barmode,
      hover,
      show_values,
      start,
      layers,
    };
  }
}
