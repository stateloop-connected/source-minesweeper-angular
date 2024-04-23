/**
 * Minesweeper rules as pure data transforms. No Angular, no DOM, no timers:
 * every function takes a Game and returns a new Game, which keeps the rules
 * unit-testable and lets the component run with OnPush change detection.
 */

export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  readonly mine: boolean;
  /** Number of mines in the 8 surrounding cells. 0 until mines are planted. */
  readonly adjacent: number;
  readonly state: CellState;
}

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export interface Game {
  readonly rows: number;
  readonly cols: number;
  /** Effective mine count, clamped to the cells left outside the safe zone. */
  readonly mines: number;
  /** Row-major flat grid: index = row * cols + col. */
  readonly cells: readonly Cell[];
  readonly status: GameStatus;
}

export type Difficulty = 'beginner' | 'intermediate' | 'expert';

export interface Level {
  readonly label: string;
  readonly rows: number;
  readonly cols: number;
  readonly mines: number;
}

/** Board sizes and mine counts from the original Windows Minesweeper. */
export const LEVELS: Readonly<Record<Difficulty, Level>> = {
  beginner: { label: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { label: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { label: 'Expert', rows: 16, cols: 30, mines: 99 },
};

/** Injectable randomness so mine layouts are deterministic under test. */
export type Rng = () => number;

const HIDDEN: Cell = { mine: false, adjacent: 0, state: 'hidden' };

const OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

export function createGame(difficulty: Difficulty): Game {
  const { rows, cols, mines } = LEVELS[difficulty];
  return { rows, cols, mines, cells: Array<Cell>(rows * cols).fill(HIDDEN), status: 'ready' };
}

/** Indices of the up-to-8 in-bounds neighbours of `index`. */
export function neighbours({ rows, cols }: Pick<Game, 'rows' | 'cols'>, index: number): number[] {
  const row = Math.floor(index / cols);
  const col = index % cols;
  return OFFSETS
    .map(([dr, dc]): [number, number] => [row + dr, col + dc])
    .filter(([r, c]) => r >= 0 && r < rows && c >= 0 && c < cols)
    .map(([r, c]) => r * cols + c);
}

/**
 * Plant mines everywhere except `safeIndex` and its neighbours, so the first
 * click can never lose and always opens a region. Partial Fisher-Yates over the
 * candidate indices: O(rows * cols), no rejection-sampling retry loop.
 */
export function plantMines(game: Game, safeIndex: number, rng: Rng = Math.random): Game {
  const safe = new Set([safeIndex, ...neighbours(game, safeIndex)]);
  const candidates = game.cells.map((_, index) => index).filter((index) => !safe.has(index));
  const mines = Math.min(game.mines, candidates.length);
  for (let taken = 0; taken < mines; taken++) {
    const pick = taken + Math.floor(rng() * (candidates.length - taken));
    [candidates[taken], candidates[pick]] = [candidates[pick], candidates[taken]];
  }
  const mined = new Set(candidates.slice(0, mines));
  const cells = game.cells.map((cell, index) => ({ ...cell, mine: mined.has(index) }));
  return countAdjacent({ ...game, cells, mines, status: 'playing' });
}

function countAdjacent(game: Game): Game {
  const cells = game.cells.map((cell, index) => ({
    ...cell,
    adjacent: neighbours(game, index).filter((n) => game.cells[n].mine).length,
  }));
  return { ...game, cells };
}

/**
 * The clickability guard runs before `plantMines`, not after: a click on a
 * flagged cell of a fresh board has to be a complete no-op, and planting first
 * would spend the once-per-game safe zone on a cell the player will never open.
 */
export function reveal(game: Game, index: number, rng: Rng = Math.random): Game {
  if (isOver(game) || game.cells[index].state !== 'hidden') return game;
  const started = game.status === 'ready' ? plantMines(game, index, rng) : game;
  return started.cells[index].mine ? detonate(started) : settle(floodFill(started, index));
}

/**
 * Iterative flood fill from `index`. Numbered cells are revealed but do not
 * propagate; only blank (adjacent === 0) cells expand. Flagged cells are left
 * alone so an auto-open cannot silently discard the player's marks. Each cell
 * enters the stack at most once, so this is O(rows * cols) worst case.
 */
function floodFill(game: Game, index: number): Game {
  const cells = game.cells.slice();
  const stack = [index];
  const queued = new Set(stack);
  for (let current = stack.pop(); current !== undefined; current = stack.pop()) {
    const cell = cells[current];
    if (cell.state === 'flagged') continue;
    cells[current] = { ...cell, state: 'revealed' };
    if (cell.adjacent !== 0) continue;
    const next = neighbours(game, current).filter((n) => !queued.has(n));
    next.forEach((n) => queued.add(n));
    stack.push(...next);
  }
  return { ...game, cells };
}

/**
 * The win is counted from revealed cells, never from flags: flagging every mine
 * is neither necessary nor sufficient, and flag-counted wins let a player win
 * by flagging the whole board.
 */
function settle(game: Game): Game {
  const revealed = game.cells.filter((cell) => cell.state === 'revealed').length;
  const won = revealed === game.cells.length - game.mines;
  return { ...game, status: won ? 'won' : 'playing' };
}

function detonate(game: Game): Game {
  const cells = game.cells.map((cell) => (cell.mine ? { ...cell, state: 'revealed' as const } : cell));
  return { ...game, cells, status: 'lost' };
}

export function toggleFlag(game: Game, index: number): Game {
  const cell = game.cells[index];
  if (isOver(game) || cell.state === 'revealed') return game;
  const cells = game.cells.slice();
  cells[index] = { ...cell, state: cell.state === 'flagged' ? 'hidden' : 'flagged' };
  return { ...game, cells };
}

export function isOver(game: Game): boolean {
  return game.status === 'won' || game.status === 'lost';
}

/** Mines left to account for: never negative-clamped, over-flagging goes below zero. */
export function minesRemaining(game: Game): number {
  return game.mines - game.cells.filter((cell) => cell.state === 'flagged').length;
}
