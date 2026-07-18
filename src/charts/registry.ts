import type { ChartRenderer } from "../models/types.ts";

export class ChartRendererRegistry {
  private renderers = new Map<string, ChartRenderer>();

  register(name: string, renderer: ChartRenderer): void {
    this.renderers.set(name, renderer);
  }

  get(name: string): ChartRenderer | undefined {
    return this.renderers.get(name);
  }

  getDefault(): ChartRenderer | undefined {
    return this.renderers.values().next().value;
  }
}

export const chartRendererRegistry = new ChartRendererRegistry();
