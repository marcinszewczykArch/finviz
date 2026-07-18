import type { TraceFactory } from "../../../models/types.ts";

export const barTraceFactory: TraceFactory = {
  type: "bar",
  create(layer, x, y, hovertext, displayText) {
    return {
      type: "bar",
      x,
      y,
      name: layer.title ?? layer.y,
      text: displayText,
      textposition: "outside",
      textfont: { size: 10 },
      hovertext,
      hovertemplate: hovertext ? "%{y}<br>%{hovertext}<extra></extra>" : undefined,
    };
  },
};
