import { create } from "zustand";

const THEME_KEY = "cqi-theme";

function getInitialTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The DOM theme still works when browser storage is unavailable.
  }
}

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      return { theme };
    }),
}));
