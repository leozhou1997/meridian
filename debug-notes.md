# Debug Notes

## Issue: Dashboard still shows dark mode despite defaultTheme="light"
- Screenshot shows dark background
- The ThemeProvider defaultTheme was changed to "light" in App.tsx
- CSS :root was updated to light variables
- Possible: localStorage has stored "dark" from previous session, overriding default
- Need to check ThemeContext.tsx to see how it initializes
