# Agent Decker (web)

An unofficial web adaptation of **[Agent Decker](https://gr9yfox.itch.io/agent-decker)**, the solo print-and-play deckbuilding game by **Manuel Correia**. You're a secret agent fresh out of spy school: build your deck, deal with the obstacles in the line before they raise the alarm, and complete five missions.

**Play:** <https://sergiomartinezcid.github.io/Agent-Decker/>

- The full five-mission campaign with all 54 cards. Every rule is enforced and all line movement is automatic.
- Works on desktop and on phones (portrait or landscape).
- Installable and playable offline (PWA). Progress is saved in your browser after every action. Save files can be exported and imported.
- Undo within a turn, until a draw or shuffle reveals new cards.
- English and Spanish.
- The rulebook, a clarifications FAQ and a card gallery inside the app.
- Sound effects, synthesized in the browser.

> Agent Decker by Manuel Correia is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License. This adaptation is free, non-commercial and not endorsed by the designer. See [CONTENT-LICENSE.md](CONTENT-LICENSE.md).

## How rules questions were settled

The rulebook leaves some situations open. [`docs/rulings.md`](docs/rulings.md) records how the app handles each one. Most rulings come from the designer's own answers on BoardGameGeek, and each entry cites its source. The engine tests in `src/engine/engine.test.ts` cover these rulings.

## Development

Requires Node 22 (see `.nvmrc`) and npm 11. npm 10 crashes while installing this dependency tree.

```sh
npm install -g npm@11
npm install
npm run dev        # http://localhost:5173/Agent-Decker/
npm test           # rules engine tests
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
```

Add `?dev` to the URL to get **Test scenarios** in the in-game menu. These are prepared situations (crowded lines, Hawk + Clumsy Guard, big hands, choice dialogs) for checking the interface without playing up to them.

### Project layout

| Path | What it is |
|---|---|
| `src/engine/` | Rules engine: pure TypeScript, no UI. `cards.ts` has the card data and `engine.ts` the rules. |
| `src/state/store.ts` | App state: autosave, undo checkpoints, mission retry, high scores, end-of-turn animation |
| `src/ui/` | React UI. `Desktop.tsx` is the desktop layout (side inspector, compact landscape mode); `Phone.tsx` is the phone layout (vertical conveyor). |
| `src/i18n/`, `src/content/` | Strings and rules text in English and Spanish |
| `src/audio/sfx.ts` | Synthesized sound effects |
| `scripts/` | Python scripts that cut card images and diagrams out of the PDFs and draw the app icons (`npm run assets`, needs `pymupdf` and `Pillow`) |
| `design/layout-lab/` | The layout mockups the UI was chosen from |
| `docs/rulings.md` | Rule clarifications and their sources |

### Deployment

`.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages on every push to `main`. In the repository settings, under **Pages → Source**, select **GitHub Actions**.

## License

- Code: [MIT](LICENSE).
- Game content (card art, card texts, rules and their translations): CC BY-NC 4.0, © Manuel Correia. See [CONTENT-LICENSE.md](CONTENT-LICENSE.md).
