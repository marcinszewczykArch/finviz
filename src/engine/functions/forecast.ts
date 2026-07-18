import type { EngineFunction, DataContext } from "../../models/types.ts";
import { extrapolate } from "../../utils/math.ts";

export const forecastFunction: EngineFunction = {
  name: "forecast",
  minArgs: 2,
  maxArgs: 2,
  evaluate(args: number[][], _context: DataContext): number[] {
    const series = args[0];
    const count = Math.max(1, Math.round(args[1][0]));
    return extrapolate(series, count);
  },
};
