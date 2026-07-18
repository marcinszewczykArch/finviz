import type { AggregatedResult, DataContext, ParsedData } from "../models/types.ts";
import { ExpressionEvaluator } from "./expression.ts";

export class DataEngine {
  private evaluator = new ExpressionEvaluator();

  resolveSeries(formula: string, data: ParsedData): number[] {
    const context: DataContext = {
      records: data.records,
      seriesNames: data.seriesNames,
    };
    return this.evaluator.resolveExpression(formula, context);
  }

  resolveAggregated(formula: string, data: ParsedData): AggregatedResult | null {
    const context: DataContext = {
      records: data.records,
      seriesNames: data.seriesNames,
    };
    return this.evaluator.resolveAggregated(formula, context);
  }

  resolveX(data: ParsedData): string[] {
    return data.records.map((r) => r.date);
  }
}
