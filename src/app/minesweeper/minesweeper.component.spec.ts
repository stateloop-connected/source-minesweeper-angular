import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { LEVELS } from './game';
import { MinesweeperComponent } from './minesweeper.component';

describe('MinesweeperComponent', () => {
  let fixture: ComponentFixture<MinesweeperComponent>;
  let component: MinesweeperComponent;

  const cells = (): HTMLButtonElement[] =>
    fixture.debugElement.queryAll(By.css('.grid .cell')).map((el) => el.nativeElement);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MinesweeperComponent] }).compileComponents();
    fixture = TestBed.createComponent(MinesweeperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a beginner board of covered cells by default', () => {
    expect(cells().length).toBe(LEVELS.beginner.rows * LEVELS.beginner.cols);
    expect(cells().every((cell) => cell.textContent?.trim() === '')).toBe(true);
  });

  it('rebuilds the grid when a difficulty button is pressed', () => {
    const expert = fixture.debugElement
      .queryAll(By.css('.controls .level'))
      .find((el) => el.nativeElement.textContent.includes(LEVELS.expert.label));
    expert?.nativeElement.click();
    fixture.detectChanges();

    expect(cells().length).toBe(LEVELS.expert.rows * LEVELS.expert.cols);
  });

  it('uncovers cells on click and never detonates on the first one', () => {
    cells()[0].click();
    fixture.detectChanges();

    expect(component.game.status).toBe('playing');
    expect(cells().filter((cell) => cell.classList.contains('revealed')).length).toBeGreaterThan(0);
  });

  it('flags on right click and decrements the mine counter', () => {
    cells()[0].dispatchEvent(new MouseEvent('contextmenu', { cancelable: true }));
    fixture.detectChanges();

    expect(component.minesLeft).toBe(LEVELS.beginner.mines - 1);
    expect(cells()[0].textContent?.trim()).toBe('⚑');
  });

  it('uncovers every mine and disables the grid after digging one up', () => {
    cells()[0].click();
    fixture.detectChanges();
    const mine = component.game.cells.findIndex((cell) => cell.mine);
    cells()[mine].click();
    fixture.detectChanges();

    expect(component.game.status).toBe('lost');
    expect(cells()[mine].textContent?.trim()).toBe('\u{1F4A3}');
    expect(cells().every((cell) => cell.disabled)).toBe(true);
  });
});
