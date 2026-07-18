import type { TraceFactory } from "../../../models/types.ts";

export const trendTraceFactory: TraceFactory = {
  type: "trend",
  create(layer, x, y, text) {
    return {
      type: "scatter",
      mode: "lines",
      x,
      y,
      name: layer.title ?? `${layer.source ?? layer.y} trend`,
      line: { width: 2, dash: "dash" },
      hovertext: text,
      hovertemplate: text ? "%{x|%m/%y}: %{y}<br>%{hovertext}<extra></extra>" : undefined,
    };
  },
};
