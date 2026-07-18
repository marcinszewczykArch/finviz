import type { TraceFactory } from "../../../models/types.ts";
import { lineTraceFactory } from "./line.ts";
import { barTraceFactory } from "./bar.ts";
import { scatterTraceFactory } from "./scatter.ts";
import { areaTraceFactory } from "./area.ts";
import { trendTraceFactory } from "./trend.ts";
import { forecastTraceFactory } from "./forecast.ts";

export class TraceRegistry {
  private factories = new Map<string, TraceFactory>();

  constructor() {
    this.register(defaultTraceFactories);
  }

  register(factories: TraceFactory[]): void {
    for (const factory of factories) {
      this.factories.set(factory.type, factory);
    }
  }

  get(type: string): TraceFactory | undefined {
    return this.factories.get(type);
  }
}

export const defaultTraceFactories: TraceFactory[] = [
  lineTraceFactory,
  barTraceFactory,
  scatterTraceFactory,
  areaTraceFactory,
  trendTraceFactory,
  forecastTraceFactory,
];

export const traceRegistry = new TraceRegistry();
