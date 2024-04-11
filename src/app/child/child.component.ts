import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-child',
  standalone: true,
  imports: [],
  styleUrl: './child.component.css',
  template: `
    <p>Name: {{ name }}</p>
    <button (click)="onClick()">Send Message to Parent</button>
  `,
})
export class ChildComponent {
  @Input() name: string = '';
  @Output() msgEvent = new EventEmitter<string>();

  constructor() {}

  onClick() {
    this.msgEvent.emit('Hello from child');
  }
}
