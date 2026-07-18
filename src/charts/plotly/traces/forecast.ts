import type { TraceFactory } from "../../../models/types.ts";

export const forecastTraceFactory: TraceFactory = {
  type: "forecast",
  create(layer, x, y, text) {
    return {
      type: "scatter",
      mode: "lines",
      x,
      y,
      name: layer.title ?? `${layer.source ?? layer.y} forecast`,
      line: { width: 2, dash: "dot" },
      hovertext: text,
      hovertemplate: text ? "%{x|%m/%y}: %{y}<br>%{hovertext}<extra></extra>" : undefined,
    };
  },
};
