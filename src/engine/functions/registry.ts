import type { EngineFunction } from "../../models/types.ts";
import { deltaFunction } from "./delta.ts";
import { rollingMeanFunction } from "./rollingMean.ts";
import { rollingSumFunction } from "./rollingSum.ts";
import { absFunction } from "./abs.ts";
import { trendFunction } from "./trend.ts";
import { forecastFunction } from "./forecast.ts";
import { pctFunction } from "./pct.ts";
import { meanFunction } from "./mean.ts";
import { sumFunction } from "./sum.ts";
import { lastFunction } from "./last.ts";
import { sumSliceFunction } from "./sumSlice.ts";
import { meanSliceFunction } from "./meanSlice.ts";

export class FunctionRegistry {
  private functions = new Map<string, EngineFunction>();

  constructor() {
    this.register(defaultFunctions);
  }

  register(functions: EngineFunction[]): void {
    for (const fn of functions) {
      this.functions.set(fn.name, fn);
    }
  }

  get(name: string): EngineFunction | undefined {
    return this.functions.get(name);
  }

  getAll(): Map<string, EngineFunction> {
    return new Map(this.functions);
  }
}

export const defaultFunctions: EngineFunction[] = [
  deltaFunction,
  rollingMeanFunction,
  rollingSumFunction,
  absFunction,
  trendFunction,
  forecastFunction,
  pctFunction,
  meanFunction,
  sumFunction,
  lastFunction,
  sumSliceFunction,
  meanSliceFunction,
];

export const functionRegistry = new FunctionRegistry();
