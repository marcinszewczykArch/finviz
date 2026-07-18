import type { DataRecord, ParsedData } from "../../models/types.ts";

export class DatasetEnricher {
  enrich(data: ParsedData, computed: Map<string, number[]>): ParsedData {
    if (computed.size === 0) return data;

    const records: DataRecord[] = data.records.map((r) => {
      const enriched = { ...r };
      for (const [name, values] of computed) {
        enriched[name] = values[0] ?? 0;
      }
      return enriched;
    });

    for (let i = 0; i < records.length; i++) {
      for (const [name, values] of computed) {
        records[i][name] = values[i] ?? 0;
      }
    }

    const seriesNamesSet = new Set(data.seriesNames);
    for (const name of computed.keys()) {
      seriesNamesSet.add(name);
    }

    return {
      records,
      seriesNames: Array.from(seriesNamesSet).sort(),
    };
  }
}
