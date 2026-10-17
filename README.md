# Student Dashboard

A student performance dashboard built with plain HTML, CSS, and vanilla JavaScript — no frameworks, no libraries, no backend.

## Features

- **Rank card** — shows your overall rank against all students, with the class average
- **Stats cards** — overall average, tests taken, best subject, and improvement trend
- **Subject bars** — each subject vs the class average with a dashed marker line
- **Leaderboard** — searchable, filterable by section, and sortable (average, name)
- **Add test score form** — add a score for any student/subject; ranks update live
- **States** — loading, empty, success, and error states throughout
- **localStorage** — all data persists across page reloads
- **Responsive** — works from mobile to desktop

## Run it

Just open `index.html` in a browser, or use a local dev server:

```bash
npx vite
```

Then visit the URL shown in the terminal.

## Files

| File         | Purpose                          |
|--------------|---------------------------------|
| `index.html` | Page structure and state markup  |
| `style.css`  | All styling and responsive rules |
| `script.js`  | Data, logic, rendering, events   |

## Tech

HTML5, CSS3 (custom properties, grid, flexbox), vanilla JavaScript (ES modules). Data is seeded with 12 sample students across 5 subjects.
