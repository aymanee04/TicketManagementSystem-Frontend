import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm!: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  errorType: string | null = null;
  showPassword: boolean = false;


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.errorType = null;

    const { email, password } = this.loginForm.value;

    console.log('Login component: Submitting login for', email);

    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Login component: Login successful');
        this.loading = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        console.error('Login component: Login error', err);

        this.authService.clearAuth();

        this.loading = false;

        if (err.error && err.error.message) {
          this.error = err.error.message;
          this.errorType = err.error.type || null;
        } else if (err.status === 403) {
          this.error = err.error?.message || 'Your account has been disabled. Please contact support.';
          this.errorType = 'ACCOUNT_DISABLED';
        } else if (err.status === 401) {
          this.error = err.error?.message || 'Invalid email or password';
          this.errorType = 'BAD_CREDENTIALS';
        } else if (err.status === 0) {
          this.error = 'Cannot connect to server. Please check your connection.';
          this.errorType = 'CONNECTION_ERROR';
        } else {
          this.error = 'An error occurred. Please try again.';
          this.errorType = 'UNKNOWN_ERROR';
        }

        console.log('Error displayed:', this.error);

        this.cdr.detectChanges();
      }
    });
  }
  dismissError(): void {
    this.error = null;
    this.cdr.detectChanges();
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
