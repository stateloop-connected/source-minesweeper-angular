import { Injectable } from '@angular/core';
import { mockApi, Data } from '../../utils/api';
import { HttpClient } from '@angular/common/http';

export interface Cat {
  breed: string;
  coat: string;
  country: string;
  origin: string;
  pattern: string;
}

@Injectable()
export class DataService {
  constructor(private http: HttpClient) {}

  loading = false;
  clear = (log?: boolean) => {};
  async getData(id: number) {
    this.loading = true;
    let temp = await mockApi(id);
    this.loading = false;
    this.clear = temp.clear;
    return temp.data;
  }

  *getCats() {
    let pages = Array(20)
      .fill(0)
      .map((_, i) => i + 1);
    for (let page of pages) {
      yield this.http.get<{ data: Cat[] }>(
        `https://catfact.ninja/breeds?page=${page}`
      );
    }
  }
}
