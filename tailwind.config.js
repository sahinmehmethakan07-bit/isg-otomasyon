/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        skin: {
          base: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          sidebar: "var(--bg-sidebar)",
          card: "var(--bg-card)",
          input: "var(--bg-input)",
        },
      },
    },
  },
};
