# Game content license

**Agent Decker by Manuel Correia is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).**

Original game: <https://gr9yfox.itch.io/agent-decker> · <https://gamesbymanuel.com/portfolio/agent-decker/>

This project is an unofficial, non-commercial adaptation. It is not affiliated with or endorsed by Manuel Correia.

## What is covered by CC BY-NC 4.0

- `source/` — the original print-and-play PDFs (cards and rulebook).
- `public/cards/` — card images cropped from the card PDF.
- `public/rules/` — diagrams cropped from the rulebook.
- `public/icons/`, `public/favicon.png`, `public/apple-touch-icon.png` — an "AD" monogram modelled on the card-back logo.
- `design/layout-lab/cards/` — card images used by the layout mockups.
- `src/content/` — the rulebook text adapted for screens, its Spanish translation, and the FAQ.
- The card names, card texts and mission texts in `src/i18n/en.ts` and their translation in `src/i18n/es.ts` (the `cards` and `missions` sections).

## Changes made to the original

- Card images and diagrams are cropped and rasterised from the PDFs. The art itself is unchanged.
- The rulebook is reformatted for screens, notes are added where the app automates a step, and it is translated into Spanish.
- A clarifications FAQ is added, based on the designer's answers on BoardGameGeek (see `docs/rulings.md`).
- Card and mission texts are transcribed and translated into Spanish.
- The game's procedures (setup, line movement, alarm, scoring) are implemented as software.

## Third-party font

`scripts/fonts/SairaSemiCondensed-Bold.ttf` is Saira Semi Condensed by The Saira Project Authors, under the SIL Open Font License 1.1 (`scripts/fonts/OFL.txt`). It is used only to draw the icons.

Everything else in this repository (the source code) is under the MIT License; see `LICENSE`.
