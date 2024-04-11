import { NgFor } from "@angular/common";
import { Component, OnInit } from "@angular/core";

type Board = Array<Array<Square>>;

type Square = {
  value: number;
  isRevealed: boolean;
  flagged?: boolean;
};

@Component({
  selector: "app-mine-sweeper",
  standalone: true,
  imports: [NgFor],
  template: `
    <style>
      .col {
        border: 1px solid #000;
        padding: 10px;
        text-align: center;
        cursor: pointer;
        background-color: #f0f0f0;
      }
      .lightred {
        background-color: lightcoral;
        heght: 50px;
      }

      .darkred {
        background-color: red;
        height: 50px;
      }
      .hidden {
        display: none;
      }
    </style>
    <div class="container">
      <div class="row" *ngFor="let _ of board; index as i">
        <div
          *ngFor="let num of board[i]; index as j"
          [class]="i % 2 === j % 2 ? 'col lightred' : 'col darkred'"
          (click)="onCellClick(i, j)"
        >
          <div [class]="!board[i][j].isRevealed ? 'hidden' : ''">
            {{ board[i][j].value === -1 ? "💣" : board[i][j].value }}
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: "./mine-sweeper.component.css",
})

// if number is 0, show white
// mine will be -1
export class MineSweeperComponent implements OnInit {
  cols = 10;
  rows = 10;
  diffulty = 0.1;
  board: Board = Array(this.rows)
    .fill([])
    .map(() => Array(this.cols).fill(0));
  constructor() {}

  recursiveReveal(i: number, j: number) {
    let visited = new Set<string>();
    let indexesAroundSquare = getIndexesAroundSquare(
      i,
      j,
      this.rows,
      this.cols,
    );
    for (let [i, j] of indexesAroundSquare) {
      visited.add(`${i},${j}`);
      let cell = this.board[i][j];
      cell.isRevealed = true;
      if (cell.value === 0 && !visited.has(`${i},${j}`)) {
        this.recursiveReveal(i, j);
      }
    }
  }

  onCellClick(i: number, j: number) {
    let cell = this.board[i][j];
    cell.isRevealed = true;
    if (cell.value === -1) {
      alert("Game Over");
    }
    if (cell.value === 0) {
      this.recursiveReveal(i, j);
    }
  }

  ngOnInit() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        let isMine = Math.random() < this.diffulty;
        let square: Square = {
          value: isMine ? -1 : 0,
          isRevealed: false,
        };
        this.board[i][j] = square;
      }
    }

    // now we need to calculate the square values around the mines

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        let isMine = this.board[i][j].value === -1;
        if (!isMine) {
          let mines = 0;
          // check all the squares around the current square
          let indexesAroundSquare = getIndexesAroundSquare(
            i,
            j,
            this.rows,
            this.cols,
          );
          indexesAroundSquare.forEach(([i, j]) => {
            let square = this.board[i][j];
            if (square.value === -1) {
              mines++;
            }
          });
          this.board[i][j].value = mines;
        }
      }
    }
  }
}

function getIndexesAroundSquare(
  i: number,
  j: number,
  rows: number,
  cols: number,
) {
  let indexesToCheck = [
    [i - 1, j - 1],
    [i - 1, j],
    [i - 1, j + 1],
    [i, j - 1],
    [i, j + 1],
    [i + 1, j - 1],
    [i + 1, j],
    [i + 1, j + 1],
  ];

  return indexesToCheck.filter(
    ([i, j]) => i >= 0 && i < rows && j >= 0 && j < cols,
  );
}
