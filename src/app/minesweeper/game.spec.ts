import {
  Cell,
  Game,
  LEVELS,
  createGame,
  minesRemaining,
  neighbours,
  plantMines,
  reveal,
  toggleFlag,
} from './game';

/**
 * Builds a fixed board from an ASCII map ('*' = mine, '.' = empty) so the rules
 * are exercised against known layouts instead of random ones. Adjacency is
 * derived with the production `neighbours` helper.
 */
function boardOf(map: string[], status: Game['status'] = 'playing'): Game {
  const rows = map.length;
  const cols = map[0].length;
  const mined = map.join('').split('').map((char) => char === '*');
  const cells: Cell[] = mined.map((mine, index) => ({
    mine,
    adjacent: neighbours({ rows, cols }, index).filter((n) => mined[n]).length,
    state: 'hidden',
  }));
  return { rows, cols, mines: mined.filter(Boolean).length, cells, status };
}

const at = (game: Game, row: number, col: number): Cell => game.cells[row * game.cols + col];
const index = (game: Game, row: number, col: number): number => row * game.cols + col;
const revealedCount = (game: Game): number =>
  game.cells.filter((cell) => cell.state === 'revealed').length;

describe('createGame', () => {
  it('sizes the board from the chosen difficulty and starts with no mines placed', () => {
    const game = createGame('expert');

    expect(game.rows).toBe(LEVELS.expert.rows);
    expect(game.cols).toBe(LEVELS.expert.cols);
    expect(game.cells.length).toBe(LEVELS.expert.rows * LEVELS.expert.cols);
    expect(game.cells.every((cell) => cell.state === 'hidden' && !cell.mine)).toBe(true);
    expect(game.status).toBe('ready');
  });

  it('offers three difficulties whose mine counts leave room for the 9-cell safe zone', () => {
    Object.values(LEVELS).forEach((level) => {
      expect(level.mines).toBeLessThanOrEqual(level.rows * level.cols - 9);
    });
  });
});

describe('neighbours', () => {
  it('returns three cells for a corner and eight for an interior cell', () => {
    const grid = { rows: 4, cols: 4 };

    expect(neighbours(grid, 0).sort()).toEqual([1, 4, 5]);
    expect(neighbours(grid, 5).length).toBe(8);
  });

  it('does not wrap around a row edge', () => {
    // Index 4 is the start of row 1; index 3 is the end of row 0 and not adjacent.
    expect(neighbours({ rows: 4, cols: 4 }, 4)).not.toContain(3);
  });
});

describe('plantMines', () => {
  it('plants exactly the requested number of mines', () => {
    const planted = plantMines(createGame('intermediate'), 0, () => 0.5);

    expect(planted.cells.filter((cell) => cell.mine).length).toBe(LEVELS.intermediate.mines);
    expect(planted.status).toBe('playing');
  });

  it('keeps the first-clicked cell and its neighbours mine-free so a first click cannot lose', () => {
    // rng() === 0 always takes the lowest untaken candidate, which packs mines
    // against the safe zone and would expose an off-by-one in the exclusion.
    const game = createGame('beginner');
    const start = index(game, 4, 4);
    const planted = plantMines(game, start, () => 0);

    [start, ...neighbours(planted, start)].forEach((i) => expect(planted.cells[i].mine).toBe(false));
  });

  it('clamps the mine count to the cells available outside the safe zone', () => {
    const crowded: Game = { ...boardOf(['...', '...', '...']), mines: 8 };
    const planted = plantMines(crowded, 4, () => 0);

    expect(planted.mines).toBe(0);
    expect(planted.cells.some((cell) => cell.mine)).toBe(false);
  });

  it('counts adjacent mines for every cell, including clamped edges', () => {
    const board = boardOf(['*..', '...', '..*']);

    expect(at(board, 0, 0).adjacent).toBe(0);
    expect(at(board, 1, 1).adjacent).toBe(2);
    expect(at(board, 0, 1).adjacent).toBe(1);
    expect(at(board, 2, 1).adjacent).toBe(1);
  });
});

describe('reveal', () => {
  it('opens the whole blank region and its numbered border in one click', () => {
    // A single mine in the bottom-right corner: clicking (0,0) must cascade
    // across the board and stop on the numbered ring around the mine.
    const board = boardOf(['....', '....', '....', '...*']);
    const opened = reveal(board, 0);

    expect(revealedCount(opened)).toBe(15);
    expect(at(opened, 2, 2).state).toBe('revealed');
    expect(at(opened, 3, 3).state).toBe('hidden');
  });

  it('reveals a numbered cell without cascading past it', () => {
    const board = boardOf(['*.....', '......', '......']);
    const opened = reveal(board, index(board, 1, 1));

    expect(revealedCount(opened)).toBe(1);
    expect(at(opened, 1, 1).adjacent).toBe(1);
  });

  it('terminates on a fully blank board instead of recursing between neighbours', () => {
    // The naive mutual-recursion flood fill revisits its own caller forever;
    // every cell must be revealed exactly once and the call must return.
    const board = boardOf(['....', '....', '....', '....']);
    const opened = reveal(board, 0);

    expect(revealedCount(opened)).toBe(16);
    expect(opened.status).toBe('won');
  });

  it('leaves flagged cells covered when a cascade runs over them', () => {
    const board = boardOf(['....', '....', '....', '...*']);
    const flagged = toggleFlag(board, index(board, 0, 2));
    const opened = reveal(flagged, 0);

    expect(at(opened, 0, 2).state).toBe('flagged');
    expect(at(opened, 0, 1).state).toBe('revealed');
  });

  it('loses on a mine and uncovers every mine while leaving safe cells alone', () => {
    const board = boardOf(['*..', '...', '..*']);
    const lost = reveal(board, index(board, 0, 0));

    expect(lost.status).toBe('lost');
    expect(at(lost, 2, 2).state).toBe('revealed');
    expect(at(lost, 1, 1).state).toBe('hidden');
  });

  it('wins when the last safe cell is uncovered, with no mine flagged', () => {
    const board = boardOf(['*..', '...', '..*']);
    const safeCells = board.cells
      .map((cell, i) => ({ cell, i }))
      .filter(({ cell }) => !cell.mine)
      .map(({ i }) => i);
    const finished = safeCells.reduce((game, i) => reveal(game, i), board);

    expect(finished.status).toBe('won');
    expect(minesRemaining(finished)).toBe(2);
  });

  it('plants mines on the first click of a fresh game and not before', () => {
    const fresh = createGame('beginner');
    const opened = reveal(fresh, 0, () => 0.5);

    expect(fresh.cells.some((cell) => cell.mine)).toBe(false);
    expect(opened.cells.filter((cell) => cell.mine).length).toBe(LEVELS.beginner.mines);
    expect(at(opened, 0, 0).state).toBe('revealed');
  });

  it('ignores clicks on revealed or flagged cells and on a finished game', () => {
    const board = boardOf(['*..', '...', '..*']);
    const opened = reveal(board, index(board, 1, 1));
    const flagged = toggleFlag(board, index(board, 0, 1));
    const lost = reveal(board, index(board, 0, 0));

    expect(reveal(opened, index(board, 1, 1))).toBe(opened);
    expect(reveal(flagged, index(board, 0, 1))).toBe(flagged);
    expect(reveal(lost, index(board, 1, 1))).toBe(lost);
  });

  it('plants nothing when the first click of a fresh game lands on a flagged cell', () => {
    // The guard has to precede plantMines: otherwise the one first-click safe
    // zone is burned on a cell the player has marked and will never open.
    const fresh = toggleFlag(createGame('beginner'), 40);

    expect(reveal(fresh, 40, () => 0.5)).toBe(fresh);
    expect(fresh.status).toBe('ready');
    expect(fresh.cells.some((cell) => cell.mine)).toBe(false);
  });

  it('does not mutate the game it is given', () => {
    const board = boardOf(['....', '....', '....', '...*']);
    reveal(board, 0);

    expect(revealedCount(board)).toBe(0);
  });
});

describe('toggleFlag', () => {
  it('cycles a covered cell between flagged and hidden', () => {
    const board = boardOf(['*..', '...', '..*']);
    const flagged = toggleFlag(board, 1);

    expect(flagged.cells[1].state).toBe('flagged');
    expect(toggleFlag(flagged, 1).cells[1].state).toBe('hidden');
  });

  it('refuses to flag a revealed cell or a finished game', () => {
    const board = boardOf(['*..', '...', '..*']);
    const opened = reveal(board, index(board, 1, 1));
    const lost = reveal(board, index(board, 0, 0));

    expect(toggleFlag(opened, index(board, 1, 1))).toBe(opened);
    expect(toggleFlag(lost, index(board, 1, 0))).toBe(lost);
  });

  it('reports the outstanding mine count and goes negative when over-flagged', () => {
    const board = boardOf(['*..', '...', '..*']);
    const overFlagged = [1, 2, 3].reduce((game, i) => toggleFlag(game, i), board);

    expect(minesRemaining(board)).toBe(2);
    expect(minesRemaining(overFlagged)).toBe(-1);
  });
});
