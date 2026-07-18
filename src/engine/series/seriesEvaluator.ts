import type { DataRecord, ParsedData, SeriesDefinition } from "../../models/types.ts";
import { ExpressionEvaluator } from "../expression.ts";

export class SeriesEvaluator {
  private evaluator = new ExpressionEvaluator();

  evaluate(
    defs: SeriesDefinition[],
    data: ParsedData,
  ): Map<string, number[]> {
    const result = new Map<string, number[]>();

    const enrichedRecords: DataRecord[] = data.records.map((r) => ({ ...r }));
    const allSeriesNames = [...data.seriesNames];

    for (const def of defs) {
      const context = {
        records: enrichedRecords,
        seriesNames: allSeriesNames,
      };

      const values = this.evaluator.resolveExpression(def.expr, context);
      result.set(def.name, values);

      for (let i = 0; i < enrichedRecords.length; i++) {
        enrichedRecords[i][def.name] = values[i] ?? 0;
      }
      allSeriesNames.push(def.name);
    }

    return result;
  }
}
