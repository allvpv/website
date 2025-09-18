(() => {
  // <stdin>
  var themeAttribute = "data-theme";
  var darkThemeName = "dark";
  var normalThemeName = "light";
  var darkModePreferredQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var currentTheme = localStorage.getItem(themeAttribute) || (darkModePreferredQuery.matches ? darkThemeName : normalThemeName);
  document.documentElement.setAttribute(themeAttribute, currentTheme);
  window.addEventListener("load", function() {
    const toggleSwitches = document.querySelectorAll(".theme-toggle");
    const updateCheckboxState = (isChecked) => {
      toggleSwitches.forEach((t) => {
        t.checked = isChecked;
      });
    };
    const changeTheme = (isDark) => {
      const newTheme = isDark ? darkThemeName : normalThemeName;
      document.documentElement.setAttribute(themeAttribute, newTheme);
      localStorage.setItem(themeAttribute, newTheme);
      updateCheckboxState(isDark);
    };
    updateCheckboxState(currentTheme === darkThemeName);
    toggleSwitches.forEach((t) => {
      t.addEventListener("change", (e) => {
        changeTheme(e.target.checked);
      });
    });
    if (darkModePreferredQuery.addEventListener) {
      darkModePreferredQuery.addEventListener("change", (event) => {
        changeTheme(event.matches);
      });
    }
  });
})();
