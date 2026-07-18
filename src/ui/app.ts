import type { ChartRenderer, ParsedData } from "../models/types.ts";
import type { ChartDefinition } from "../models/types.ts";
import { TomlDataParser } from "../parser/dataParser.ts";
import { ChartParser } from "../parser/chartParser.ts";
import { SeriesParser } from "../parser/seriesParser.ts";
import { DataEngine } from "../engine/engine.ts";
import { processSeries } from "../engine/series/seriesPipeline.ts";
import { el } from "../utils/dom.ts";
import { createTextarea, createButton } from "./textarea.ts";
import { Dashboard } from "./dashboard.ts";
import { createReadmeView } from "./readme.ts";
import defaultData from "../../data/example.toml?raw";
import defaultCharts from "../../data/example-charts.toml?raw";

const MONTH_OPTIONS = [
  { label: "All", value: 0 },
  { label: "Last 3 months", value: 3 },
  { label: "Last 6 months", value: 6 },
  { label: "Last 12 months", value: 12 },
  { label: "Last 24 months", value: 24 },
  { label: "Custom", value: -1 },
];

export function buildApp(root: HTMLElement, renderer: ChartRenderer): void {
  const dataParser = new TomlDataParser();
  const chartParser = new ChartParser();
  const seriesParser = new SeriesParser();
  const engine = new DataEngine();
  const dashboard = new Dashboard();

  let currentData: ParsedData | null = null;
  let currentCharts: ChartDefinition[] = [];

  const header = el("header", { class: "app-header" },
    el("h1", {}, "FinViz"),
    el("p", { class: "app-subtitle" }, "Universal text data visualization engine")
  );

  const { container: dataGroup, textarea: dataTextarea } = createTextarea(
    "DATA (TOML)",
    "Paste your data here...",
    defaultData
  );

  const { container: chartsGroup, textarea: chartsTextarea } = createTextarea(
    "CHART DEFINITIONS (TOML)",
    "Define your charts here...",
    defaultCharts
  );

  const rangeSelect = el("select", { class: "range-select" }) as HTMLSelectElement;
  for (const opt of MONTH_OPTIONS) {
    const option = el("option", { value: String(opt.value) }, opt.label);
    rangeSelect.appendChild(option);
  }

  const customInput = el("input", {
    class: "range-custom-input",
    type: "number",
    min: "1",
    placeholder: "months",
  }) as HTMLInputElement;
  customInput.style.display = "none";

  const rerender = () => {
    if (currentData && currentCharts.length > 0) {
      renderDashboard(currentData, currentCharts, dashboard, renderer, rangeSelect, customInput);
    }
  };

  rangeSelect.addEventListener("change", () => {
    const isCustom = rangeSelect.value === "-1";
    customInput.style.display = isCustom ? "" : "none";
    rerender();
  });

  customInput.addEventListener("input", rerender);

  const rangeWrapper = el("div", { class: "range-wrapper" },
    el("span", { class: "range-label" }, "Period:"),
    rangeSelect,
    customInput
  );

  const button = createButton("Generate Dashboard", () => {
    generateDashboard(
      dataTextarea.value,
      chartsTextarea.value,
      dataParser,
      chartParser,
      seriesParser,
      engine,
      dashboard,
      renderer,
      errorDisplay,
      rangeSelect,
      customInput,
      (data, charts) => { currentData = data; currentCharts = charts; }
    );
  });

  const errorDisplay = el("div", { class: "error-display" });

  const editors = el("div", { class: "editors" },
    dataGroup,
    chartsGroup,
    el("div", { class: "button-row" }, button),
    errorDisplay
  );

  const dashboardLabel = el("div", { class: "section-label" }, "DASHBOARD");

  const dashboardWrapper = el("div", { class: "dashboard" },
    dashboardLabel,
    rangeWrapper,
    dashboard.getElement()
  );

  const dashboardTab = el("button", { class: "tab-btn active" }, "Dashboard");
  const readmeTab = el("button", { class: "tab-btn" }, "Readme");
  const tabBar = el("div", { class: "tab-bar" }, dashboardTab, readmeTab);

  root.appendChild(header);
  root.appendChild(tabBar);
  root.appendChild(editors);
  root.appendChild(dashboardWrapper);

  const readmeView = createReadmeView();
  readmeView.style.display = "none";
  root.appendChild(readmeView);

  dashboardTab.addEventListener("click", () => {
    dashboardTab.classList.add("active");
    readmeTab.classList.remove("active");
    editors.style.display = "";
    dashboardWrapper.style.display = "";
    readmeView.style.display = "none";
  });

  readmeTab.addEventListener("click", () => {
    readmeTab.classList.add("active");
    dashboardTab.classList.remove("active");
    editors.style.display = "none";
    dashboardWrapper.style.display = "none";
    readmeView.style.display = "";
  });
}

function generateDashboard(
  dataInput: string,
  chartsInput: string,
  dataParser: TomlDataParser,
  chartParser: ChartParser,
  seriesParser: SeriesParser,
  engine: DataEngine,
  dashboard: Dashboard,
  renderer: ChartRenderer,
  errorDisplay: HTMLDivElement,
  rangeSelect: HTMLSelectElement,
  customInput: HTMLInputElement,
  onParsed: (data: ParsedData, charts: ChartDefinition[]) => void
): void {
  errorDisplay.textContent = "";
  errorDisplay.style.display = "none";

  try {
    const data: ParsedData = dataParser.parse(dataInput);
    const seriesDefs = seriesParser.parse(chartsInput);
    const charts = chartParser.parse(chartsInput);
    const enrichedData = processSeries(seriesDefs, data);

    for (const chart of charts.charts) {
      for (const layer of chart.layers) {
        if (layer.type === "trend" && layer.source) {
          engine.resolveSeries(layer.source, enrichedData);
        } else if (layer.type === "forecast" && layer.source) {
          engine.resolveSeries(layer.source, enrichedData);
        } else if (layer.y) {
          engine.resolveSeries(layer.y, enrichedData);
        }
      }
    }

    onParsed(enrichedData, charts.charts);
    renderDashboard(enrichedData, charts.charts, dashboard, renderer, rangeSelect, customInput);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errorDisplay.textContent = `Error: ${message}`;
    errorDisplay.style.display = "block";
  }
}

function renderDashboard(
  fullData: ParsedData,
  charts: ChartDefinition[],
  dashboard: Dashboard,
  renderer: ChartRenderer,
  rangeSelect: HTMLSelectElement,
  customInput: HTMLInputElement
): void {
  const value = parseInt(rangeSelect.value, 10);
  const months = value === -1 ? (parseInt(customInput.value, 10) || 0) : value;
  const data = months > 0 ? filterData(fullData, months) : fullData;
  dashboard.render(charts, data, renderer);
}

function filterData(data: ParsedData, months: number): ParsedData {
  const records = data.records;
  const start = Math.max(0, records.length - months);
  return {
    records: records.slice(start),
    seriesNames: data.seriesNames,
  };
}
