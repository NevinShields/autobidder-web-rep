import { useEffect } from "react";

/**
 * Forces light mode on public-facing pages (e.g. directory) by temporarily
 * removing the "dark" class from <html>. Restores it on unmount if it was present.
 */
export function useForceLightMode() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    const previousTheme = window.localStorage.getItem("autobidder-theme");

    const applyLightMode = () => {
      root.classList.remove("dark");
      window.localStorage.setItem("autobidder-theme", "light");
    };

    applyLightMode();

    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();

      if (previousTheme === null) {
        window.localStorage.removeItem("autobidder-theme");
      } else {
        window.localStorage.setItem("autobidder-theme", previousTheme);
      }

      if (wasDark || previousTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };
  }, []);
}
