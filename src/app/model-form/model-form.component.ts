import { JsonPipe, NgFor, NgIf } from '@angular/common';
import { JsonpClientBackend } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-model-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, JsonPipe],
  template: `
    <form [formGroup]="form">
      <div class="form-group">
        <label for="exampleInputEmail1">Email address</label>
        <input
          [class.is-invalid]="(username?.errors && username?.touched) || username?.errors?.['test']"
          type="email"
          class="form-control"
          placeholder="Enter email"
          formControlName="username"
        />
        <input
          type="email"
          class="form-control"
          placeholder="Enter email"
          formControlName="email"
          [class.is-invalid]="email?.errors"
        />
        <button (click)="addAlternateEmail()" class="btn btn-primary">
          Add Email
        </button>
        {{ email?.errors | json }}
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            value=""
            id="flexCheckDefault"
            formControlName="subscribe"
          />
          <label class="form-check-label" for="flexCheckDefault">
            Subscribe to our newsletter
          </label>
        </div>
        <div *ngIf="username?.touched">
          <small *ngIf="username?.errors?.['required']" class="text-danger"
            >Username is required</small
          >

          <small *ngIf="username?.errors?.['minlength']" class="text-danger"
            >Must be at least 3 characters</small
          >
          <small *ngIf="username?.errors?.['test']" class="text-danger"
            >Cannot be test</small
          >
        </div>

        <small
          *ngIf="form.get('username')?.errors?.['minLength'] && form.get('username')?.touched"
          class="text-danger"
          >Username is required</small
        >
      </div>
      <div
        formArrayName="alternateEmails"
        *ngFor="let email of alternateEmails.controls; let i = index"
      >
        <input
          type="email"
          class="form-control"
          placeholder="Enter email"
          [formControlName]="i"
          [class.is-invalid]="alternateEmails.controls[i].invalid"
        />
        <small
          *ngIf="alternateEmails.controls[i].errors?.['email']"
          class="text-danger"
        >
          {{ alternateEmails.controls[i].errors | json }}
        </small>
      </div>
      <div class="form-group">
        <label for="exampleInputPassword1">Password</label>
        <input
          type="password"
          class="form-control"
          placeholder="Password"
          formControlName="password"
          [class.is-invalid]="password?.touched && (form.errors?.['mismatch'] || password?.errors)"
        />
        <small
          *ngIf="password?.touched && password?.errors?.['required']"
          class="text-danger"
          >Password is required</small
        >
        <small
          *ngIf="password?.touched && password?.errors?.['minlength']"
          class="text-danger"
          >Must be at least 3 characters</small
        >
      </div>

      <div class="form-group">
        <label for="exampleInputPassword1">Confirm Password</label>
        <input
          type="password"
          class="form-control"
          placeholder="Password"
          formControlName="confirmPassword"
          [class.is-invalid]="form.errors?.['mismatch'] && confirmPassword?.touched"
        />
      </div>

      <small
        *ngIf="form.errors?.['mismatch'] && confirmPassword?.touched"
        class="text-danger"
        >Passwords do not match</small
      >

      <div formGroupName="address">
        <div class="form-group">
          <label for="city">City</label>
          <input
            type="text"
            class="form-control"
            placeholder="City"
            formControlName="city"
          />
        </div>

        <div class="form-group">
          <label for="state">State</label>
          <select class="form-control" formControlName="state">
            <option *ngFor="let state of states">
              {{ state }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="zipcode">Zipcode</label>
          <input
            type="text"
            class="form-control"
            placeholder="Zipcode"
            formControlName="zipcode"
          />
        </div>
      </div>

      <div class="btn-group">
        <button
          [disabled]="form.invalid"
          (click)="onSubmit()"
          type="submit"
          class="btn btn-primary"
        >
          Submit
        </button>
        <button (click)="form.reset()" class="btn btn-danger" type="button">
          Clear
        </button>
      </div>
    </form>
    {{ confirmPassword?.value }}
  `,
  styleUrl: './model-form.component.css',
})
export class ModelFormComponent implements OnInit {
  constructor(private fb: FormBuilder) {}

  states = ['CA', 'MD', 'OH', 'VA'];
  form = this.fb.group({});
  passwordsMatch = true;

  get email() {
    return this.form.get('email');
  }
  get alternateEmails() {
    return this.form.get('alternateEmails') as unknown as FormArray;
  }
  addAlternateEmail() {
    this.alternateEmails.push(this.fb.control('', Validators.required));
  }
  ngOnInit() {
    this.form = this.fb.group(
      {
        username: [
          'hello',
          [Validators.required, Validators.minLength(3), usernameValidator],
        ],
        password: ['', [Validators.required, Validators.minLength(3)]],
        email: [''],
        alternateEmails: this.fb.array([]),
        subscribe: [false],
        confirmPassword: [''],
        address: this.fb.group({
          city: [''],
          state: [this.states[0]],
          zipcode: [''],
        }),
      },
      { validator: passwordChangeValidator }
    );

    this.form.get('subscribe')?.valueChanges.subscribe((checked) => {
      let email = this.form.get('email');
      if (checked) {
        email?.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        email?.clearValidators();
      }

      email?.updateValueAndValidity();
    });
  }

  get username() {
    return this.form.get('username');
  }

  get password() {
    return this.form.get('password');
  }

  get confirmPassword() {
    return this.form.get('confirmPassword');
  }

  onSubmit() {
    console.log(this.form.value);
  }
}

function passwordChangeValidator(control: AbstractControl) {
  let password = control.get('password');
  let confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { mismatch: true };
  }

  return null;
}

function usernameValidator(control: AbstractControl) {
  if (control.value === 'test') {
    return { test: true };
  }

  return null;
}
