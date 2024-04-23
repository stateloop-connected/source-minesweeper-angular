# Minesweeper — the classic game in Angular, with the rules as a pure module

Beginner/Intermediate/Expert boards, first-click safety, right-click flagging and a
cascading reveal. The interesting part is not the UI: it is keeping every rule of the
game in `game.ts`, a module that imports nothing — no Angular, no DOM — so the flood
fill, the mine placement and the win condition are plain data transforms that any
runner can point at. (The repo runs them under Karma with the component specs, which
does need Chrome; the module itself does not.)

## Stack

- **Angular 17**, standalone components — no NgModules, no router, no state library.
  The whole app is two components and one plain TypeScript file.
- **Built-in control flow** (`@for`) in templates rather than `*ngFor`.
- **Karma + Jasmine** — Angular's default runner, kept so the repo needs zero extra
  test wiring; `karma.conf.js` adds a `ChromeHeadlessCI` launcher for CI.
- **ESLint** with `@angular-eslint`, including the template accessibility rules.
- No runtime dependencies beyond Angular itself, and no CSS framework.

## Running it

```bash
npm install
npm start        # dev server on http://localhost:4200
npm test         # karma in watch mode
npm run test:ci  # single headless run, what CI executes
npm run lint
npm run build    # production bundle into dist/minesweeper
```

There is no configuration and no API key: the game is entirely client-side and never
talks to a network.

## Architecture

```
src/main.ts                                 bootstraps AppComponent, no providers
 └── app/app.component.ts                   page shell
      └── app/minesweeper/
           ├── minesweeper.component.ts     renders the grid, forwards clicks
           ├── minesweeper.component.html   difficulty controls + CSS-grid board
           └── game.ts                      all game rules — pure, no Angular import
```

| Module | Responsibility |
| --- | --- |
| `game.ts` | `createGame`, `plantMines`, `reveal`, `toggleFlag`, `minesRemaining`. Every function takes a `Game` and returns a new `Game`. |
| `minesweeper.component.ts` | Holds the current `Game`, translates DOM events into calls on `game.ts`, maps cell state to text and CSS classes. |
| `app.component.ts` | Shell and title. |

## Design notes

- **The board is a flat row-major array**, `index = row * cols + col`, not an array of
  arrays. Neighbours come from eight offsets filtered against the bounds, which is the
  only place the 2-D geometry lives — every other function works on indices, so there
  is no nested-loop bookkeeping and no chance of a row/column transposition bug.
- **Mines are planted after the first click, never before.** `plantMines` excludes the
  clicked cell and its eight neighbours, then takes the first *n* entries of a partial
  Fisher–Yates shuffle of the remaining candidates: O(rows × cols), and unlike the
  usual "pick a random cell, retry if occupied" loop it cannot degrade as the board
  fills up. A consequence worth stating: the first click is always a blank cell, so it
  always opens a region rather than a bare `1`. Ordering matters here: `reveal` checks
  that the cell is actually clickable *before* it plants, otherwise a left click on a
  flagged cell of a fresh board would spend the one-per-game safe zone on nine cells
  around a square the player has explicitly marked and will never open.
- **The cascade is an explicit stack, not recursion.** The earlier version recursed
  into neighbours and guarded with `visited.add(key)` immediately *before* checking
  `!visited.has(key)` — a condition that can never be true, so the reveal never
  propagated past the first ring; had the guard worked as written, the mutual recursion
  between two blank neighbours would have run until the stack overflowed. The iterative
  version pushes each cell at most once and is O(rows × cols) time and space, with 480
  cells at Expert as the worst case.
- **The win is counted from revealed cells, not from flags** (`revealed === cells −
  mines`). Flag-based win checks are the classic minesweeper bug: they let a player win
  by blanket-flagging the board, and they refuse the win to a player who cleared it
  without flagging anything. Flags are also skipped by the cascade so an auto-open can
  never silently discard the player's marks.
- **Immutable state buys OnPush.** Each move rebuilds the cell array, so the component
  can run `ChangeDetectionStrategy.OnPush` and Angular diffs on reference equality.
  Copying 480 objects per click is far cheaper than the DOM update it causes, and it
  makes the rules trivially testable — a test asserts that `reveal` left the board it
  was handed untouched.

## Tests

28 specs, run with `npm run test:ci`:

- **`game.spec.ts` (21)** — the rules, against fixed boards built from ASCII maps
  (`'*'` = mine) rather than random layouts. Covers: neighbour clamping at corners and
  the no-wrap-around-a-row-edge case; exact mine count and the safe-zone exclusion
  under an adversarial RNG that packs mines against it; mine-count clamping when the
  safe zone leaves too few cells; adjacency counts; a cascade opening a blank region
  and stopping on its numbered border; termination on an all-blank board; flags
  surviving a cascade; losing uncovering every mine but nothing else; winning without
  a single flag placed; no-ops on revealed, flagged and finished-game clicks, including
  a flagged first click that must not plant mines; and non-mutation of the input.
- **`minesweeper.component.spec.ts` (7)** — grid size per difficulty, rebuilding the
  board from the difficulty buttons, revealing on click, flagging on right click with
  the counter decrementing, the grid disabling itself after a mine is dug up, and the
  two accessible-name cases that empty text collapses: an opened blank cell must not
  announce the same as a covered one, and the mine counter must keep its number.
