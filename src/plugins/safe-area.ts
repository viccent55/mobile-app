import { SafeArea } from "capacitor-plugin-safe-area";

async function initSafeArea() {
  try {
    const { insets } = await SafeArea.getSafeAreaInsets();

    // Write your own CSS vars once:
    const root = document.documentElement;
    root.style.setProperty("--safe-area-top", `${insets.top}px`);
    root.style.setProperty("--safe-area-bottom", `${insets.bottom}px`);
    root.style.setProperty("--safe-area-left", `${insets.left}px`);
    root.style.setProperty("--safe-area-right", `${insets.right}px`);
  } catch (e) {
    console.warn("SafeArea.getSafeAreaInsets failed:", e);
  }
}
export {
  initSafeArea
}
