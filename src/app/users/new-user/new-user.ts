import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../services/users';
import { Router } from '@angular/router';
import { ClientsService } from '../../services/clients';
import { Client } from '../../models/client.model';
import { Role } from '../../models/enums';
import { CreateUserRequest } from '../../models/user.model';
import { AuthService } from '../../services/auth';
import { LucideAngularModule } from 'lucide-angular';


@Component({
  selector: 'app-new-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './new-user.html',
  styleUrl: './new-user.css',
})

export class NewUser implements OnInit {

  userForm!: FormGroup;
  clients: Client[] = [];
  roles: Role[] = [];
  loading: boolean = false;
  loadingClients: boolean = false;
  loadingRoles: boolean = false;
  error: string | null = null;
  selectedRoles: Role[] = [];

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private clientsService: ClientsService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
    this.loadRoles();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      jobTitle: ['', [Validators.required]],
      clientId: [null, [Validators.required]]
    });
  }

  loadClients(): void {
    this.loadingClients = true;
    this.clientsService.getClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data.filter(c => c.status === 'ACTIVE');
        this.loadingClients = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        this.error = 'Failed to load clients';
        this.loadingClients = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRoles(): void {
    this.loadingRoles = true;
    this.usersService.getRoles().subscribe({
      next: (data: Role[]) => {
        this.roles = data;
        this.loadingRoles = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading roles:', err);
        this.roles = [Role.ADMIN, Role.MANAGER, Role.USER];
        this.loadingRoles = false;
        this.cdr.detectChanges();
      }
    });
  }

  onRoleToggle(role: Role): void {
    const index = this.selectedRoles.indexOf(role);
    if (index > -1) {
      this.selectedRoles.splice(index, 1);
    } else {
      this.selectedRoles.push(role);
    }
  }

  isRoleSelected(role: Role): boolean {
    return this.selectedRoles.includes(role);
  }

  getRoleBadgeClass(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return 'border-red-500 bg-red-50';
      case Role.MANAGER:
        return 'border-blue-500 bg-blue-50';
      case Role.USER:
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  }

  getRoleTextClass(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return 'text-red-700';
      case Role.MANAGER:
        return 'text-blue-700';
      case Role.USER:
        return 'text-green-700';
      default:
        return 'text-gray-700';
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.selectedRoles.length === 0) {
      this.userForm.markAllAsTouched();
      if (this.selectedRoles.length === 0) {
        this.error = 'Please select at least one role';
      }
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.userForm.value;
    const request: CreateUserRequest = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      jobTitle: formValue.jobTitle,
      roles: this.selectedRoles,
      clientId: formValue.clientId
    };

    this.usersService.createUser(request).subscribe({
      next: (createdUser) => {
        console.log('User created successfully:', createdUser);
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('Error creating user:', err);
        this.error = err.error?.message || 'Failed to create user. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  get name() {
    return this.userForm.get('name');
  }

  get email() {
    return this.userForm.get('email');
  }


  get password() {
    return this.userForm.get('password');
  }

  get jobTitle() {
    return this.userForm.get('jobTitle');
  }

  get clientId() {
    return this.userForm.get('clientId');
  }
}
