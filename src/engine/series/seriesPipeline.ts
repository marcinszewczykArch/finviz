import type { ParsedData, SeriesDefinition } from "../../models/types.ts";
import { DependencyResolver } from "./dependencyResolver.ts";
import { SeriesEvaluator } from "./seriesEvaluator.ts";
import { DatasetEnricher } from "./datasetEnricher.ts";

export function processSeries(
  seriesDefs: SeriesDefinition[],
  data: ParsedData,
): ParsedData {
  if (seriesDefs.length === 0) return data;

  const resolver = new DependencyResolver();
  const ordered = resolver.resolve(seriesDefs);

  const evaluator = new SeriesEvaluator();
  const computed = evaluator.evaluate(ordered, data);

  const enricher = new DatasetEnricher();
  return enricher.enrich(data, computed);
}
