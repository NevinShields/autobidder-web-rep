import { useEffect } from "react";

/**
 * Forces light mode on public-facing pages (e.g. directory) by temporarily
 * removing the "dark" class from <html>. Restores it on unmount if it was present.
 */
export function useForceLightMode() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");

    if (wasDark) {
      root.classList.remove("dark");
    }

    return () => {
      if (wasDark) {
        root.classList.add("dark");
      }
    };
  }, []);
}
