import type { EngineFunction, DataContext } from "../../models/types.ts";
import { linearRegression } from "../../utils/math.ts";

export const trendFunction: EngineFunction = {
  name: "trend",
  minArgs: 1,
  maxArgs: 1,
  evaluate(args: number[][], _context: DataContext): number[] {
    const series = args[0];
    const { slope, intercept } = linearRegression(series);
    return series.map((_v, i) => intercept + slope * i);
  },
};
