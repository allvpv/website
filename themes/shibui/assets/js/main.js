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
  const updateCheckboxState = (isChecked) => { // Because there may be multiple toggles on the same page
    toggleSwitches.forEach(t => {
      t.checked = isChecked;
    });
  };
  const changeTheme = (isDark) => {
    const newTheme = isDark ? darkThemeName : normalThemeName;
    document.documentElement.setAttribute(themeAttribute, newTheme);
    localStorage.setItem(themeAttribute, newTheme);

    updateCheckboxState(isDark);
  };

  updateCheckboxState(currentTheme === darkThemeName); // The initial state

  // Update when toggle button is changed
  toggleSwitches.forEach(t => {
    t.addEventListener("change", e => {
      changeTheme(e.target.checked);
    });
  });

  // Update when browser theme is changed
  if (darkModePreferredQuery.addEventListener) {
    darkModePreferredQuery.addEventListener("change", event => {
      changeTheme(event.matches);
    })
  }
});
