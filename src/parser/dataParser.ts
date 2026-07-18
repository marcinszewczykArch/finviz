import { parse } from "smol-toml";
import type { DataParser, DataRecord, ParsedData } from "../models/types.ts";

export class TomlDataParser implements DataParser {
  parse(input: string): ParsedData {
    const parsed = parse(input) as Record<string, DataRecord[]>;

    const records: DataRecord[] = [];
    const seriesNamesSet = new Set<string>();

    for (const key of Object.keys(parsed)) {
      const items = parsed[key];
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const record: DataRecord = { date: "" };
        for (const [field, value] of Object.entries(item)) {
          if (field === "date") {
            record.date = String(value);
          } else {
            record[field] = value as string | number | string[];
            seriesNamesSet.add(field);
          }
        }
        records.push(record);
      }
    }

    return {
      records,
      seriesNames: Array.from(seriesNamesSet).sort(),
    };
  }
}
