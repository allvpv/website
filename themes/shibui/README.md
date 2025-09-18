<div align="center">
 <img src="./static/favicon_io/apple-icon-180x180.png">
 <h1>Shibui (渋い)</h1>
 <p>A minimalist Hugo theme emphasizing simplicity and refinement</p>
 <p>
  <a href="https://github.com/ntk148v/shibui/blob/master/LICENSE">
   <img alt="GitHub license" src="https://img.shields.io/github/license/ntk148v/shibui?style=for-the-badge">
  </a>
  <a href="https://github.com/ntk148v/shibui/stargazers">
   <img alt="GitHub stars" src="https://img.shields.io/github/stars/ntk148v/shibui?style=for-the-badge">
  </a>
  <a href="https://gohugo.io">
   <img alt="Hugo" src="https://img.shields.io/badge/hugo-0.93.0-blue.svg?style=for-the-badge">
  </a>
 </p>
</div>

Table of contents:
- [Features](#features)
- [Installation](#installation)
  - [As a Git Submodule](#as-a-git-submodule)
  - [Configuration](#configuration)
  - [Page Configuration](#page-configuration)
- [Color Scheme](#color-scheme)
- [Customization](#customization)
  - [CSS Variables](#css-variables)
- [Contributing](#contributing)
- [License](#license)
- [Demo](#demo)
- [Theme Structure](#theme-structure)
  - [Template Organization](#template-organization)
  - [Assets](#assets)
  - [ExampleSite](#examplesite)
- [Updating](#updating)
- [Version Requirements](#version-requirements)
- [Credits](#credits)

|                                                                      |                                                                      |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| <img src="https://raw.githubusercontent.com/ntk148v/shibui/refs/heads/master/images/1.png" alt="dark" style="border-radius:1%"/> | <img src="https://raw.githubusercontent.com/ntk148v/shibui/refs/heads/master/images/2.png" alt="dark" style="border-radius:1%"/> |
| <img src="https://raw.githubusercontent.com/ntk148v/shibui/refs/heads/master/images/3.png" alt="dark" style="border-radius:1%"/> | <img src="https://raw.githubusercontent.com/ntk148v/shibui/refs/heads/master/images/4.png" alt="dark" style="border-radius:1%"/> |

[Shibui](https://en.wikipedia.org/wiki/Shibui) (渋い) (adjective), shibumi (渋み) (subjective noun), or shibusa (渋さ) (objective noun) are Japanese words that refer to a particular aesthetic of simple, subtle, and unobtrusive beauty. Like other Japanese aesthetics terms, such as iki and wabi-sabi, shibui can apply to a wide variety of subjects, not just art or fashion.

## Features

- Minimalist design following Shibui (渋い) aesthetics
- Terminal-inspired navigation
- Clean typography with monospace font
- Semantic HTML with proper text styling (bold, italic, blockquotes)
- Paper-like color scheme
- Automatic dark/light theme support
- Nested heading counters
- Zero JavaScript (pure CSS solutions)
- Highly customizable through CSS variables
- Mobile-responsive layout
- Table of Contents support
- Tags support

## Installation

### As a Git Submodule

```bash
git submodule add https://github.com/ntk148v/shibui.git themes/shibui
git submodule update --init --recursive
```

### Configuration

Add the following to your `config.toml`:

```toml
baseURL = 'http://example.org/'
languageCode = 'en-us'
title = 'Your Site Title'
theme = "shibui"

[params]
  author = "Your Name"
  email = "your.email@example.com"

[menu]
  [[menu.main]]
    name = "Posts"
    url = "/posts/"
    weight = 1
  [[menu.main]]
    name = "About"
    url = "/about/"
    weight = 2
```

### Page Configuration

In the front matter of your content files:

```yaml
---
title: "Your Post Title"
date: 2023-06-13
tags: ["hugo", "theme"]
---
```

## Color Scheme

The theme uses a paper-like color palette:

```css
/* Colors */
--color-bg-primary: hsl(0, 0%, 99%);
--color-bg-secondary: hsl(0, 0%, 97.3%);
--color-border: hsl(0, 0%, 93%);
--color-text-primary: hsl(0, 0%, 9%);
--color-text-muted: hsl(0, 0%, 43.5%);
--color-text-code: hsl(0, 0%, 20%);
--color-selection-bg: hsl(0, 0%, 85.8%);
```

## Customization

### CSS Variables

You can customize the theme by overriding CSS variables in your `assets/css/custom.css`:

```css
:root {
  /* Typography */
  --spacing-base: 1.5em;          /* Base line height and spacing unit */
  --font-family-mono: monospace;  /* Base monospace font */
  --font-size-base: 1em;         /* Base font size */
  --font-size-small: 0.9em;      /* Small text size */

  /* Colors */
  --color-bg-primary: hsl(0, 0%, 99%);
  --color-bg-secondary: hsl(0, 0%, 97.3%);
  --color-border: hsl(0, 0%, 93%);
  --color-text-primary: hsl(0, 0%, 9%);
  --color-text-muted: hsl(0, 0%, 43.5%);
  --color-text-code: hsl(0, 0%, 20%);
  --color-selection-bg: hsl(0, 0%, 85.8%);
}
```

## Contributing

Contributions are welcome! Primary goals are:

- Maintain minimalist design principles
- Keep it simple and efficient
- Avoid JavaScript when CSS can solve the problem
- Follow Shibui (渋い) aesthetics

## License

MIT

## Demo

Visit the [demo site](https://ntk148v.github.io/shibui) to see the theme in action.

## Theme Structure

```
shibui/
├── archetypes/          # Content template files
├── assets/
│   ├── css/            # Theme CSS files
│   └── js/             # Theme JavaScript files
├── layouts/            # Template files
│   ├── _default/       # Default templates
│   ├── _partials/      # Reusable template parts
│   └── index.html      # Homepage template
├── static/             # Static assets
└── exampleSite/        # Example site for reference
```

### Template Organization

- `layouts/_default/baseof.html`: Base template with common layout
- `layouts/_default/single.html`: Template for individual pages
- `layouts/_default/list.html`: Template for section pages
- `layouts/_partials/`: Contains reusable components like header, footer
- `layouts/index.html`: Homepage template

### Assets

The theme uses a minimal set of assets:

- CSS: Single stylesheet with CSS variables for customization
- JS: Optional JavaScript for enhanced functionality
- Static: Basic favicon and other static assets

### ExampleSite

The `exampleSite` directory contains a complete example of a site using the theme. Use it as a reference for:

- Configuration setup
- Content organization
- Front matter examples
- Menu structure

## Updating

Since the theme is installed as a Git submodule, you can update it to the latest version with:

```bash
cd themes/shibui
git pull origin main
```

## Version Requirements

- Hugo Extended v0.93.0 or higher
- Go 1.18 or higher (for Hugo modules)

## Credits

This theme was inspired by various minimalist designs and the Japanese concept of Shibui (渋い). Special thanks to:

- [William Jansson](https://williamjansson.com)
- The Hugo community
- [Minimalist design principles](https://en.wikipedia.org/wiki/Minimalism_(computing))
- Japanese aesthetics, particularly [Shibui](https://en.wikipedia.org/wiki/Shibui)
