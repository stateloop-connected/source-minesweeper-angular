import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MineSweeperComponent } from './mine-sweeper.component';

describe('MineSweeperComponent', () => {
  let component: MineSweeperComponent;
  let fixture: ComponentFixture<MineSweeperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MineSweeperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MineSweeperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
