import type { SeriesDefinition } from "../../models/types.ts";

const FUNCTION_NAMES = new Set([
  "delta",
  "rollingMean",
  "rollingSum",
  "abs",
  "pct",
  "trend",
  "forecast",
  "mean",
  "sum",
  "last",
  "sumSlice",
  "meanSlice",
  "aggSum",
  "aggMean",
]);

export class DependencyResolver {
  resolve(
    defs: SeriesDefinition[],
  ): SeriesDefinition[] {
    const byName = new Map<string, SeriesDefinition>();
    for (const d of defs) {
      byName.set(d.name, d);
    }

    const deps = new Map<string, Set<string>>();
    for (const d of defs) {
      const referenced = this.extractReferences(d.expr);
      const seriesDeps = new Set<string>();
      for (const ref of referenced) {
        if (byName.has(ref) && ref !== d.name) {
          seriesDeps.add(ref);
        }
      }
      deps.set(d.name, seriesDeps);
    }

    const sorted = this.topologicalSort(defs.map((d) => d.name), deps);

    return sorted.map((name) => byName.get(name)!);
  }

  private extractReferences(expr: string): string[] {
    const tokenPattern = /\b([a-zA-Z_]\w*)\b/g;
    const refs: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = tokenPattern.exec(expr)) !== null) {
      const token = match[1];
      if (!FUNCTION_NAMES.has(token) && !/^\d/.test(token)) {
        refs.push(token);
      }
    }
    return refs;
  }

  private topologicalSort(
    nodes: string[],
    deps: Map<string, Set<string>>,
  ): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, Set<string>>();

    for (const node of nodes) {
      inDegree.set(node, 0);
      adjacency.set(node, new Set());
    }

    for (const node of nodes) {
      for (const dep of deps.get(node) ?? []) {
        if (!adjacency.has(dep)) continue;
        adjacency.get(dep)!.add(node);
        inDegree.set(node, (inDegree.get(node) ?? 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [node, degree] of inDegree) {
      if (degree === 0) queue.push(node);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);
      for (const neighbor of adjacency.get(node) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== nodes.length) {
      const remaining = nodes.filter((n) => !sorted.includes(n));
      throw new Error(
        `Circular dependency detected: ${remaining.join(" → ")}`,
      );
    }

    return sorted;
  }
}
