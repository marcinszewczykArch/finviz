import type { EngineFunction, DataContext } from "../../models/types.ts";

export const deltaFunction: EngineFunction = {
  name: "delta",
  minArgs: 1,
  maxArgs: 1,
  evaluate(args: number[][], _context: DataContext): number[] {
    const series = args[0];
    const result: number[] = [0];
    for (let i = 1; i < series.length; i++) {
      result.push(series[i] - series[i - 1]);
    }
    return result;
  },
};
