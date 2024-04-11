import { NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Data } from '../../utils/api';
import { DataService } from './data.service';

@Component({
  selector: 'app-second',
  standalone: true,
  imports: [NgIf],
  templateUrl: './second.component.html',
  styleUrl: './second.component.css',
})
export class SecondComponent implements OnInit, OnDestroy {
  id = 0;
  data: Data | null = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dataService: DataService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      this.data = null;
      this.dataService.clear();
      let id = params.get('id');
      this.id = parseInt(id || '0', 10);
      this.data = await this.dataService.getData(this.id);
    });
  }

  findIfNested() {
    return this.router.url.split('/').filter((val) => val).length > 2;
  }

  getBase() {
    return this.findIfNested() ? '/nested/second' : '/second';
  }

  goBack() {
    this.router.navigate([this.getBase(), this.id - 1]);
  }

  goForward() {
    this.router.navigate([this.getBase(), this.id + 1]);
  }

  ngOnDestroy() {
    this.dataService.clear();
  }
}
