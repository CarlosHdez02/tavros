import "@testing-library/jest-dom/vitest";

// Newer Node versions define their own global `localStorage`, which is undefined
// unless Node is started with --localstorage-file and hides jsdom's working one.
// Point the global back at jsdom's so tests see a browser-like localStorage.
const jsdomWindow = (
  globalThis as unknown as { jsdom?: { window?: { localStorage?: Storage } } }
).jsdom?.window;
if (jsdomWindow?.localStorage) {
  let usable = false;
  try {
    usable = typeof globalThis.localStorage?.clear === "function";
  } catch {
    usable = false;
  }
  if (!usable) {
    Object.defineProperty(globalThis, "localStorage", {
      value: jsdomWindow.localStorage,
      configurable: true,
      writable: true,
    });
  }
}
