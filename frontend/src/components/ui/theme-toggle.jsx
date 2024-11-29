import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  // Check local storage for the saved theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Default to light theme
      setTheme("light");
    }
  }, []);

  // Toggle the theme between light and dark
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme); // Save the selected theme in localStorage
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <button
      className="relative flex items-center justify-center p-2 rounded-full focus:outline-none"
      onClick={toggleTheme}
    >
      {/* Moon Icon (for Dark Mode) */}
      {theme === "dark" && (
        <Moon className="h-6 w-6 text-white transition-transform duration-300" />
      )}

      {/* Sun Icon (for Light Mode) */}
      {theme === "light" && (
        <Sun className="h-6 w-6 text-black transition-transform duration-300" />
      )}

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
