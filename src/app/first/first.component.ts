import { Component, OnInit } from '@angular/core';
import { Cat, DataService } from '../second/data.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-first',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './first.component.html',
  styleUrl: './first.component.css',
})
export class FirstComponent implements OnInit {
  data: Cat[] = [];
  gen = this.dataService.getCats();
  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.gen.next().value!.subscribe((d) => {
      this.data = d.data;
    });
  }

  next() {
    let next = this.gen.next();
    if (next.done) {
      return;
    }
    next.value.subscribe((d) => {
      this.data.push(...d.data);
    });
  }
}
