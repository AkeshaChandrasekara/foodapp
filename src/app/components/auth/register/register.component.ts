import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ]
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = '';
  isLoading: boolean = false;
  success: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      address: ['', [Validators.required, Validators.minLength(5)]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.success = false;

    const userData = {
      fullName: this.registerForm.get('fullName')?.value,
      username: this.registerForm.get('username')?.value,
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value,
      phoneNumber: this.registerForm.get('phoneNumber')?.value,
      address: this.registerForm.get('address')?.value
    };

    console.log('Sending registration data:', userData);

    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.isLoading = false;
        this.success = true;

        const user = {
          username: userData.username,
          email: userData.email,
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          address: userData.address,
          role: 'USER'
        };
        localStorage.setItem('user_data', JSON.stringify(user));
        console.log('User data stored in localStorage:', user);

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Registration error:', err);

        if (err.status === 0) {
          this.error = 'Cannot connect to server. Please make sure the backend is running on port 8080.';
        } else if (err.status === 400) {
          this.error = err.error?.message || 'Invalid data. Please check your inputs.';
        } else if (err.status === 409) {
          this.error = 'Username or email already exists.';
        } else if (err.status === 500) {
          this.error = 'Server error. Please try again later.';
        } else {
          this.error = err.error?.message || 'Registration failed. Please try again.';
        }
      }
    });
  }
}
