import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-nested-routes',
  standalone: true,
  imports: [RouterOutlet, RouterModule, NgFor],
  template: `
    <style>
      .container {
        display: flex;
        align-items: center;
        width: 100%;
      }
    </style>
    <div class="container">
      <ul class="list-group">
        <li class="list-group-item">
          <a routerLink="/nested/first" routerLinkActive="active">First</a>
        </li>
        <li class="list-group-item" *ngFor="let id of ids">
          <a [routerLink]="['/nested/second', id]" routerLinkActive="active"
            >Second {{ id }}</a
          >
        </li>
        <div class="list-group-item">Now showing id {{ routeId }}</div>
      </ul>

      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './nested-routes.component.css',
})
export class NestedRoutesComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}
  routeId = 0;
  ids = Array(5)
    .fill(0)
    .map((_, i) => i + 1);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      let id = params.get('id');
      this.routeId = parseInt(id || '0', 10);
    });
  }
}
