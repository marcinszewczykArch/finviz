import type { ChartDefinition, ChartRenderer, ParsedData } from "../models/types.ts";
import { el, clearElement } from "../utils/dom.ts";

export class Dashboard {
  private container: HTMLDivElement;
  private charts: HTMLDivElement[] = [];

  constructor() {
    this.container = el("div", { class: "dashboard" });
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  render(
    chartDefs: ChartDefinition[],
    data: ParsedData,
    renderer: ChartRenderer
  ): void {
    this.clear();
    clearElement(this.container);

    if (chartDefs.length === 0) {
      const empty = el(
        "div",
        { class: "dashboard-empty" },
        "No charts defined."
      );
      this.container.appendChild(empty);
      return;
    }

    const grid = el("div", { class: "dashboard-grid" });

    for (const chartDef of chartDefs) {
      const card = el("div", { class: "chart-card" });

      const titleText = el("span", { class: "chart-title" }, chartDef.title);
      const titleGroup = el("div", { class: "chart-title-group" }, titleText);
      if (chartDef.description) {
        titleGroup.appendChild(el("span", { class: "chart-description" }, chartDef.description));
      }
      const header = el("div", { class: "chart-header" },
        titleGroup,
        el("span", { class: "chart-chevron" }, "\u25BE"),
      );
      header.addEventListener("click", () => {
        card.classList.toggle("collapsed");
      });
      card.appendChild(header);

      const body = el("div", { class: "chart-body" });

      const formulas = el("div", { class: "chart-formulas" });
      for (const layer of chartDef.layers) {
        let label: string;
        if (layer.type === "trend" && layer.source) {
          label = `trend(${layer.source})`;
        } else if (layer.type === "forecast" && layer.source) {
          label = `forecast(${layer.source}, ${layer.by ?? 12})`;
        } else if (layer.title) {
          label = `${layer.title}: ${layer.y}`;
        } else {
          label = layer.y;
        }
        formulas.appendChild(el("span", { class: "chart-formula" }, label));
      }
      if (formulas.childNodes.length > 0) {
        body.appendChild(formulas);
      }

      const chartContainer = el("div", { class: "chart-container" });
      body.appendChild(chartContainer);
      card.appendChild(body);
      grid.appendChild(card);
      this.charts.push(chartContainer);

      renderer.render(chartContainer, chartDef, data);
    }

    this.container.appendChild(grid);
  }

  clear(): void {
    for (const chart of this.charts) {
      chart.innerHTML = "";
    }
    this.charts = [];
  }
}
