import type { ChartDefinition, ChartRenderer, ParsedData } from "../../models/types.ts";
import { DataEngine } from "../../engine/engine.ts";
import { traceRegistry } from "./traces/registry.ts";
import { linearRegression, extrapolate } from "../../utils/math.ts";
import Plotly from "plotly.js-dist-min";

export class PlotlyRenderer implements ChartRenderer {
  private engine = new DataEngine();

  render(container: HTMLElement, chart: ChartDefinition, data: ParsedData): void {
    const traces: Partial<Plotly.Data>[] = [];
    const start = chart.start ?? 0;

    if (chart.x_labels) {
      for (let i = 0; i < chart.layers.length; i++) {
        const layer = chart.layers[i];
        const traceFactory = traceRegistry.get(layer.type);
        if (!traceFactory) continue;

        const label = chart.x_labels[i] ?? `Layer ${i}`;
        const yValues = this.engine.resolveSeries(layer.y, data);
        const value = yValues[0] ?? 0;
        const displayText = chart.show_values ? [this.formatValue(value)] : undefined;

        traces.push(traceFactory.create(layer, [label], [value], undefined, displayText) as Partial<Plotly.Data>);
      }

      const topMargin = chart.show_values ? 70 : 50;
      const layout: Partial<Plotly.Layout> = {
        title: { text: chart.title },
        margin: { t: topMargin, r: 20, b: 40, l: 60 },
        autosize: true,
        showlegend: false,
        font: { family: "Arial, Helvetica, sans-serif", size: 12, color: "#333" },
        xaxis: { type: "category" },
      };

      Plotly.newPlot(container, traces as Plotly.Data[], layout, {
        responsive: true,
        displayModeBar: false,
      }).then(() => {
        Plotly.Plots.resize(container);
      });
      return;
    }

    for (const layer of chart.layers) {
      const traceFactory = traceRegistry.get(layer.type);
      if (!traceFactory) continue;

      let xValues: string[];
      let yValues: number[];

      if (layer.type === "trend" && layer.source) {
        xValues = this.resolveX(chart, data);
        const sourceValues = this.engine.resolveSeries(layer.source, data);
        const { slope, intercept } = linearRegression(sourceValues);
        yValues = sourceValues.map((_v: number, i: number) => intercept + slope * i);
      } else if (layer.type === "forecast" && layer.source) {
        xValues = this.resolveX(chart, data);
        const sourceValues = this.engine.resolveSeries(layer.source, data);
        const count = layer.by ? parseInt(layer.by, 10) : 12;
        const forecastValues = extrapolate(sourceValues, count, 12);
        xValues = [
          ...xValues,
          ...forecastValues.map((_v, i) => {
            const lastDate = data.records[data.records.length - 1]?.date ?? "";
            return this.forecastDate(lastDate, i + 1);
          }),
        ];
        yValues = [
          ...new Array(data.records.length).fill(null),
          ...forecastValues,
        ] as unknown as number[];
      } else {
        const aggregated = this.engine.resolveAggregated(layer.y, data);
        if (aggregated) {
          xValues = aggregated.x.map((d) => this.toPlotlyDate(d));
          yValues = aggregated.y;
        } else {
          xValues = this.resolveX(chart, data);
          yValues = this.engine.resolveSeries(layer.y, data);
        }
      }

      if (start > 0) {
        xValues = xValues.slice(start);
        yValues = yValues.slice(start);
      }

      const textValues = chart.hover ? this.resolveText(data, chart.hover, start, layer.type === "forecast" ? data.records.length : undefined) : undefined;
      const displayText = chart.show_values ? yValues.map((v) => v !== null ? this.formatValue(v) : "") : undefined;

      traces.push(traceFactory.create(layer, xValues, yValues, textValues, displayText) as Partial<Plotly.Data>);
    }

    const hasAggregated = chart.layers.some(
      (l) => l.type !== "trend" && l.type !== "forecast" && this.isAggregated(l.y)
    );

    const barCount = chart.layers.filter((l) => l.type === "bar").length;
    const topMargin = chart.show_values ? 70 : 50;

    const layout: Partial<Plotly.Layout> = {
      title: { text: chart.title },
      margin: { t: topMargin, r: 20, b: 40, l: 60 },
      autosize: true,
      showlegend: true,
      font: { family: "Arial, Helvetica, sans-serif", size: 12, color: "#333" },
      legend: { orientation: "h", y: -0.15 },
      barmode: (chart.barmode as Plotly.Layout["barmode"]) ?? (barCount > 1 ? "stack" : undefined),
      xaxis: this.buildXAxis(chart.x_tick, hasAggregated),
    };

    Plotly.newPlot(container, traces as Plotly.Data[], layout, {
      responsive: true,
      displayModeBar: false,
    }).then(() => {
      Plotly.Plots.resize(container);
    });
  }

  clear(container: HTMLElement): void {
    Plotly.purge(container);
  }

  private isAggregated(formula: string): boolean {
    return /^agg(Sum|Mean)\(/.test(formula);
  }

  private resolveX(chart: ChartDefinition, data: ParsedData): string[] {
    if (chart.x) {
      return data.records.map((r) => this.toPlotlyDate(String(r[chart.x!] ?? "")));
    }
    return data.records.map((r) => this.toPlotlyDate(r.date));
  }

  private toPlotlyDate(dateStr: string): string {
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      return dateStr + "-01";
    }
    return dateStr;
  }

  private forecastDate(lastDate: string, offset: number): string {
    const match = lastDate.match(/^(\d{4})-(\d{2})$/);
    if (!match) return lastDate;
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const totalMonths = year * 12 + month + offset - 1;
    const y = Math.floor(totalMonths / 12);
    const m = (totalMonths % 12) + 1;
    return `${y}-${String(m).padStart(2, "0")}-01`;
  }

  private buildXAxis(xTick?: string, aggregated?: boolean): Partial<Plotly.Layout["xaxis"]> {
    if (aggregated && !xTick) {
      return { type: "date", tickformat: "%m/%y", tickangle: -45 };
    }
    if (xTick === "year") {
      return { type: "date", tickmode: "linear", dtick: "M12", tickformat: "%Y" };
    }
    if (xTick === "auto") {
      return { type: "date", tickformat: "%m/%y" };
    }
    return { type: "date", tickmode: "linear", dtick: "M1", tickformat: "%m/%y", tickangle: -45 };
  }

  private formatValue(v: number): string {
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(1);
  }

  private resolveText(data: ParsedData, field: string, start: number, forecastFrom?: number): string[] {
    const values = data.records.map((r) => {
      const val = r[field];
      if (Array.isArray(val)) return val.join("<br>");
      if (typeof val === "string") return val;
      return "";
    });

    const sliced = start > 0 ? values.slice(start) : values;

    if (forecastFrom !== undefined) {
      const offset = start > 0 ? start : 0;
      const padded: string[] = [
        ...new Array(Math.max(0, forecastFrom - offset)).fill(""),
        ...sliced,
      ];
      return padded;
    }

    return sliced;
  }
}
