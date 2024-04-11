import { Routes } from '@angular/router';
import { FirstComponent } from './first/first.component';
import { SecondComponent } from './second/second.component';
import { FormComponent } from './form/form.component';
import { NestedRoutesComponent } from './nested-routes/nested-routes.component';
import { MineSweeperComponent } from './mine-sweeper/mine-sweeper.component';
import { ModelFormComponent } from './model-form/model-form.component';

export const routes: Routes = [
  { path: 'first', component: FirstComponent },
  { path: 'second', component: SecondComponent },
  { path: 'second/:id', component: SecondComponent },
  { path: 'form', component: FormComponent },
  {
    path: 'nested',
    component: NestedRoutesComponent,
    children: [
      { path: 'first', component: FirstComponent },
      { path: 'second', component: SecondComponent },
      { path: 'second/:id', component: SecondComponent },
    ],
  },
  { path: 'minesweeper', component: MineSweeperComponent },
  { path: 'modelform', component: ModelFormComponent },
];
