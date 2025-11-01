# Retro Notepad — Dark Edition

A sleek, dark-themed retro notepad with a modern, animated UI and Word‑like formatting behavior. Built with vanilla HTML, CSS, and JavaScript.

## ✨ Features

### Text Formatting
- Bold (Ctrl+B)
- Italic (Ctrl+I)
- Underline (Ctrl+U)
- Bullet lists, Numbered lists
- Horizontal rule
- Word‑like behavior for fonts and styles:
	- Selection: applies instantly to selected text
	- Caret: sets a “pending” style so upcoming text uses your choice (font family, size, color, B/I/U)

### Customization
- 11 Font Families: Fira Code, JetBrains Mono, IBM Plex Mono, Source Code Pro, Space Mono, Roboto Mono, Courier New, Georgia, Merriweather, Times New Roman, Consolas
- 7 Font Sizes: 12, 14, 16, 18, 20, 24, 28
- Color Picker for text color
- Theme switcher with 6 curated themes

### UI/UX
- 6 Themes: Cyber Purple, Neon Blue, Retro Orange, Matrix Green, Hot Pink, Mint Fresh
- Modern micro‑interactions and tasteful animations (hover glow, active pulse, accent caret, selection highlight)
- Animated theme modal open/close
- Custom dropdowns and color picker pulse feedback
- Autosave every 900ms + status flash; manual Save and Clear
- Responsive and minimal by default; respects prefers‑reduced‑motion

### New: Focus Mode (Typewriter)
- Hide toolbar and status for a distraction‑free canvas
- Typewriter centering keeps the caret around the vertical center as you write
- Toggle via the toolbar button or F9; press Esc to exit
- Persists across sessions

### Storage
- Content autosaved to localStorage
- Theme preference persisted
- Clear button resets content

## 🚀 Quick Start

1. Open `index.html` in your browser
2. Start typing — content is automatically saved
3. Use the toolbar to format text
4. Customize font, size, and color using the dropdowns
5. Your preferences are saved automatically

## 🎨 Design

- Dark retro base, neon accents via theme variables
- Monospace‑forward typography for a nostalgic feel
- Smooth hover/focus states, subtle depth, and clean motion
- Minimal, distraction‑free layout that feels fast

## 📦 Tech Stack

- Pure HTML5
- CSS3 (Flexbox, Gradients, Animations)
- Vanilla JavaScript (No frameworks)
- Google Fonts
- FontAwesome v7.1.0 Icons

## 🔧 Browser Support

Modern browsers with:
- `contenteditable`, Selection/Range API, `beforeinput`
- `document.execCommand` (used for selection toggles)
- CSS Flexbox/Grid, transitions
- localStorage

## 📝 Keyboard Shortcuts

- `Ctrl+B` — Bold
- `Ctrl+I` — Italic
- `Ctrl+U` — Underline
- `Escape` — Close theme selector
- `F9` — Toggle Focus Mode

## 🎯 Future Enhancements

- Export as HTML/Markdown/Plain Text
- Import files
- Find and replace
- Word/character count
- Undo/Redo history

## 💬 Why this notepad?

Let’s be honest: most notepads have forgettable, clunky, or just plain trash UI. This one focuses on a clean, modern, animated experience that feels great to use while staying lightweight and distraction‑free.

---

Made with ❤️ for retro aesthetics
