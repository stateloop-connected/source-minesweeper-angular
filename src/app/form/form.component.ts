import { JsonPipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChildComponent } from '../child/child.component';

interface FormI {
  name: string;
  email: string;
  option: string;
}

let selectOpts = ['default', 'Option 1', 'Option 2', 'Option 3'];
class Form implements FormI {
  constructor(
    public name = '',
    public email = '',
    public option = selectOpts[0]
  ) {}
}

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, JsonPipe, ChildComponent],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css',
})
export class FormComponent {
  constructor() {}
  formModel = new Form();
  loading = false;
  submitted = false;
  selectOpts = selectOpts;
  messageFromChild = '';
  optsHaveError = true;

  validateOpts(val: string) {
    this.optsHaveError = val === selectOpts[0];
  }

  handleSubmit() {
    this.loading = true;
    console.log(this.formModel);
    setTimeout(() => {
      this.loading = false;
      this.submitted = true;
    }, 2000);
  }

  receiveMessage($event: string) {
    this.messageFromChild = $event;
  }
}
