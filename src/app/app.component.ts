import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MinesweeperComponent } from './minesweeper/minesweeper.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MinesweeperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Minesweeper</h1>
      <app-minesweeper />
    </main>
  `,
  styles: `
    main {
      padding: 1.5rem;
    }
    h1 {
      font-size: 1.25rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0 0 1rem;
    }
  `,
})
export class AppComponent {}
