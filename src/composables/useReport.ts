import { ref } from "vue";
import { setConfig } from "@/utils/statistics";

export function useReport() {
  const isRunning = ref(false);

  // ✅ Per-day key
  const DAY_KEY = "last_report_alive";

  // ✅ Lifetime key
  const LIFETIME_KEY = "first_install_reported";

  // -----------------------------
  // ✅ Check if should run TODAY
  // -----------------------------
  const shouldRunToday = () => {
    const last = localStorage.getItem(DAY_KEY);
    if (!last) return true;

    const lastDate = new Date(last);
    const now = new Date();

    return (
      lastDate.getFullYear() !== now.getFullYear() ||
      lastDate.getMonth() !== now.getMonth() ||
      lastDate.getDate() !== now.getDate()
    );
  };

  // -----------------------------
  // ✅ Run ONCE PER DAY (active)
  // -----------------------------
  const runOncePerDay = async () => {
    if (isRunning.value) return;
    if (!shouldRunToday()) return;

    isRunning.value = true;
    try {
      await setConfig({
        appId: "1234567898765432100",
        productId: "xhslandpage",
        backendURL: import.meta.env.VITE_TRANSACTION_API_BASE,
        promoCode: "Pim9FD",
        productCode: "xhslandpage",
        actionType: "click",
      });

      // ✅ Save today's date
      localStorage.setItem(DAY_KEY, new Date().toISOString());
    } catch (e) {
      console.error("setConfig failed:", e);
    } finally {
      isRunning.value = false;
    }
  };

  // -----------------------------
  // ✅ Run ONLY ONCE IN LIFETIME (install)
  // -----------------------------
  const getFirstVisitInApp = async () => {
    const alreadyReported = localStorage.getItem(LIFETIME_KEY);

    if (alreadyReported === "1") {
      // ✅ Already reported once in lifetime → STOP
      return;
    }

    try {
      await setConfig({
        appId: "1234567898765432100",
        productId: "xhslandpage",
        backendURL: import.meta.env.VITE_TRANSACTION_API_BASE,
        promoCode: "Pim9FD",
        productCode: "xhslandpage",
        actionType: "install",
      });

      // ✅ PERMANENTLY LOCK IT
      localStorage.setItem(LIFETIME_KEY, "1");
    } catch (e) {
      console.error("first install report failed:", e);
    }
  };

  return {
    runOncePerDay, // ✅ daily active report
    getFirstVisitInApp, // ✅ lifetime install report
  };
}
