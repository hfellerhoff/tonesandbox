import { IoSunny, IoMoon } from "solid-icons/io";
import { createSignal, onMount } from "solid-js";

const COLOR_THEMES = ["light", "dark"] as const;
type ColorTheme = (typeof COLOR_THEMES)[number];

const [colorTheme, setColorTheme] = createSignal<ColorTheme | null>(null);
const [savedTheme, setSavedTheme] = createSignal<ColorTheme | null>(null);
const [systemTheme, setSystemTheme] = createSignal<ColorTheme | null>(null);

const isColorTheme = (theme: string | null): theme is ColorTheme => {
  return COLOR_THEMES.includes(theme as ColorTheme);
};

const updateRootClass = (theme: ColorTheme) => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

const toggleTheme = () => {
  const newTheme = colorTheme() === "light" ? "dark" : "light";
  setColorTheme(newTheme);

  if (systemTheme() !== newTheme) {
    localStorage.setItem("theme", newTheme);
  } else {
    localStorage.removeItem("theme");
  }

  updateRootClass(newTheme);
};

export default function DarkModeButton() {
  // https://mattstein.com/thoughts/astro-dark-mode
  onMount(() => {
    const updatedSavedTheme = localStorage.getItem("theme");
    if (isColorTheme(updatedSavedTheme)) {
      setSavedTheme(updatedSavedTheme);
    }

    const updatedSystemTheme =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    setSystemTheme(updatedSystemTheme);

    setColorTheme(savedTheme() || systemTheme());

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        const newColorScheme = event.matches ? "dark" : "light";
        // Keep system preference up to date
        setSystemTheme(newColorScheme);

        if (!savedTheme()) {
          // If we don’t have a saved theme and this one is new, update!
          setColorTheme(systemTheme());
          updateRootClass(newColorScheme);
        }
      });
  });

  return (
    <button
      aria-label="Toggle dark mode"
      class="bg-white dark:bg-gray-800 dark:text-white rounded shadow px-3 py-2 flex items-center justify-center border-transparent hover:border-purple-600 border-2 transition-all"
      onClick={toggleTheme}
    >
      {colorTheme() === "light" ? <IoMoon /> : <IoSunny />}
    </button>
  );
}
