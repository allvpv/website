// These should be inlined
const themeAttribute = "data-theme";
const darkThemeName = "dark";
const normalThemeName = "light";

// Get the initial state
const darkModePreferredQuery = window.matchMedia("(prefers-color-scheme: dark)");
const currentTheme = localStorage.getItem(themeAttribute) || (darkModePreferredQuery.matches ? darkThemeName : normalThemeName);
document.documentElement.setAttribute(themeAttribute, currentTheme);

window.addEventListener("load", function () {
  const toggleSwitches = document.querySelectorAll(".theme-toggle");

  // Helpers
  const changeTheme = (isDark) => {
    const newTheme = isDark ? darkThemeName : normalThemeName;
    document.documentElement.setAttribute(themeAttribute, newTheme);
    localStorage.setItem(themeAttribute, newTheme);
  };

  // Update when toggle button is changed
  toggleSwitches.forEach(t => {
    t.addEventListener("click", e => {
      const isDark = localStorage.getItem(themeAttribute) !== darkThemeName;
      changeTheme(isDark);
    });
  });

  // Update when browser theme is changed
  if (darkModePreferredQuery.addEventListener) {
    darkModePreferredQuery.addEventListener("change", event => {
      changeTheme(event.matches);
    })
  }
});
