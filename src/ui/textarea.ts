import { el } from "../utils/dom.ts";

export function createTextarea(
  label: string,
  placeholder: string,
  defaultValue: string
): { container: HTMLDivElement; textarea: HTMLTextAreaElement } {
  const textarea = el("textarea", {
    placeholder,
    spellcheck: "false",
  });
  textarea.textContent = defaultValue;
  textarea.classList.add("editor-textarea");

  const labelEl = el("label", { class: "editor-label" }, label);
  const wrapper = el("div", { class: "editor-group" }, labelEl, textarea);

  return { container: wrapper, textarea };
}

export function createButton(
  label: string,
  onClick: () => void
): HTMLButtonElement {
  const button = el("button", { class: "btn-generate" }, label);
  button.addEventListener("click", onClick);
  return button;
}
