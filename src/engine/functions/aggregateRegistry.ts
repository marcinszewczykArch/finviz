import type { AggregatedFunction } from "../../models/types.ts";
import { aggSumFunction, aggMeanFunction } from "./aggregate.ts";

export class AggregatedFunctionRegistry {
  private functions = new Map<string, AggregatedFunction>();

  constructor() {
    this.register(defaultAggregatedFunctions);
  }

  register(functions: AggregatedFunction[]): void {
    for (const fn of functions) {
      this.functions.set(fn.name, fn);
    }
  }

  get(name: string): AggregatedFunction | undefined {
    return this.functions.get(name);
  }

  getAll(): Map<string, AggregatedFunction> {
    return new Map(this.functions);
  }
}

export const defaultAggregatedFunctions: AggregatedFunction[] = [
  aggSumFunction,
  aggMeanFunction,
];

export const aggregatedFunctionRegistry = new AggregatedFunctionRegistry();
