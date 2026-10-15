import { afterEach, expect, it, vi } from "vitest";

class ElementStub {
  innerHTML = "";
  onclick: (() => void) | null = null;
  classList = { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() };
  constructor(public tagName = "DIV") {}
  getContext() {
    return {};
  }
  focus() {}
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it("leaves focused button activation to the browser while preventing canvas Space scrolling", async () => {
  const elements = new Map<string, ElementStub>();
  const buttons = [
    "start-street",
    "pause-street",
    "resume-street",
    "retry-street",
  ];
  const getElement = (id: string) => {
    if (!elements.has(id))
      elements.set(
        id,
        new ElementStub(buttons.includes(id) ? "BUTTON" : "CANVAS"),
      );
    return elements.get(id)!;
  };
  const listeners = new Map<string, (event: KeyboardEvent) => void>();
  vi.stubGlobal("document", {
    querySelector: () => new ElementStub(),
    getElementById: getElement,
    addEventListener() {},
  });
  vi.stubGlobal("window", {
    addEventListener: (
      name: string,
      listener: (event: KeyboardEvent) => void,
    ) => listeners.set(name, listener),
  });
  vi.stubGlobal("localStorage", { getItem: () => null });
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  await import("../src/streets/main");
  getElement("start-street").onclick!();
  for (const button of buttons) {
    const preventDefault = vi.fn();
    listeners.get("keydown")!({
      key: " ",
      target: getElement(button),
      repeat: false,
      preventDefault,
    } as unknown as KeyboardEvent);
    expect(preventDefault, button).not.toHaveBeenCalled();
  }
  const preventDefault = vi.fn();
  listeners.get("keydown")!({
    key: " ",
    target: getElement("street-view"),
    repeat: false,
    preventDefault,
  } as unknown as KeyboardEvent);
  expect(preventDefault).toHaveBeenCalledOnce();
});
