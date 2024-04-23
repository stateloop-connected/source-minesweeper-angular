import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Cell,
  Difficulty,
  GameStatus,
  LEVELS,
  createGame,
  isOver,
  minesRemaining,
  reveal,
  toggleFlag,
} from './game';

const STATUS_TEXT: Readonly<Record<GameStatus, string>> = {
  ready: 'Left click to dig, right click to flag',
  playing: 'In progress',
  won: 'Board cleared',
  lost: 'Boom',
};

/**
 * Rendering and input only: every state transition is delegated to the pure
 * functions in ./game, and the returned Game replaces the reference, which is
 * what makes OnPush change detection correct here.
 */
@Component({
  selector: 'app-minesweeper',
  standalone: true,
  templateUrl: './minesweeper.component.html',
  styleUrl: './minesweeper.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinesweeperComponent {
  readonly levels = (Object.keys(LEVELS) as Difficulty[]).map((id) => ({ id, ...LEVELS[id] }));

  difficulty: Difficulty = 'beginner';
  game = createGame(this.difficulty);

  get minesLeft(): number {
    return minesRemaining(this.game);
  }

  get statusText(): string {
    return STATUS_TEXT[this.game.status];
  }

  get isOver(): boolean {
    return isOver(this.game);
  }

  selectDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
    this.game = createGame(difficulty);
  }

  restart(): void {
    this.game = createGame(this.difficulty);
  }

  dig(index: number): void {
    this.game = reveal(this.game, index);
  }

  flag(event: Event, index: number): void {
    event.preventDefault();
    this.game = toggleFlag(this.game, index);
  }

  cellText(cell: Cell): string {
    if (cell.state === 'flagged') return '⚑';
    if (cell.state === 'hidden') return '';
    if (cell.mine) return '\u{1F4A3}';
    return cell.adjacent === 0 ? '' : String(cell.adjacent);
  }

  /**
   * Derived from state, not from `cellText`: a revealed blank and a covered
   * cell both render as empty text, so a text-derived label would announce
   * them identically and hide the whole opened region from a screen reader.
   */
  cellLabel(cell: Cell): string {
    if (cell.state !== 'revealed') return cell.state === 'flagged' ? 'flagged cell' : 'covered cell';
    if (cell.mine) return 'mine';
    if (cell.adjacent === 0) return 'empty cell';
    return `${cell.adjacent} adjacent mine${cell.adjacent === 1 ? '' : 's'}`;
  }

  cellClass(cell: Cell): string {
    if (cell.state !== 'revealed') return `cell ${cell.state}`;
    if (cell.mine) return 'cell revealed mine';
    return `cell revealed adjacent-${cell.adjacent}`;
  }
}
