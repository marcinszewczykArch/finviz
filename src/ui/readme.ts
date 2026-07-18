import { el } from "../utils/dom.ts";
import { marked } from "marked";
import readmeMd from "../../README.md?raw";

export function createReadmeView(): HTMLElement {
  const container = el("div", { class: "readme-view" });

  const copyBtn = el("button", { class: "btn-copy-readme" }, "Copy to clipboard");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(readmeMd);
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy to clipboard"; }, 2000);
    } catch {
      copyBtn.textContent = "Failed";
      setTimeout(() => { copyBtn.textContent = "Copy to clipboard"; }, 2000);
    }
  });

  container.appendChild(copyBtn);

  const html = marked.parse(readmeMd) as string;
  const content = el("div", { class: "readme-content" });
  content.innerHTML = html;
  container.appendChild(content);

  return container;
}
