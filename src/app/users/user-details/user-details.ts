import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Role } from '../../models/enums';
import { UsersService } from '../../services/users';
import { TicketsService } from '../../services/tickets';
import { User } from '../../models/user.model';
import { Ticket } from '../../models/ticket.model';
import { LucideAngularModule } from 'lucide-angular';
import { ErrorResponse } from '../../models/ErrorResponse';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './user-details.html',
  styleUrl: './user-details.css'
})
export class UserDetails implements OnInit {

  userId!: number;
  user: User | null = null;
  createdTickets: Ticket[] = [];
  assignedTickets: Ticket[] = [];

  userForm!: FormGroup;
  isEditing = false;
  loading = false;
  loadingTickets = false;
  error: string | null = null;
  errorType: string | null = null;
  success: string | null = null;

  activeTab: 'info' | 'created' | 'assigned' = 'info';
  Role = Role;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private usersService: UsersService,
    private ticketsService: TicketsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadUser();
  }

  //  Form 

  initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: ['', [Validators.required]]
    });
    this.userForm.disable();
  }

  populateForm(): void {
    if (this.user) {
      this.userForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        jobTitle: this.user.jobTitle
      });
    }
  }

  enableEdit(): void {
    this.isEditing = true;
    this.userForm.enable();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.userForm.disable();
    this.populateForm();
    this.clearMessages();
  }

  saveChanges(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.clearMessages();

    // Send only the 3 fields UpdateUserRequest expects — never spread the whole entity
    const request = {
      name: this.userForm.value.name,
      email: this.userForm.value.email,
      jobTitle: this.userForm.value.jobTitle
    };

    this.usersService.updateUser(this.userId, request).subscribe({
      next: (data: User) => {
        this.user = data;
        this.isEditing = false;
        this.userForm.disable();
        this.loading = false;
        this.success = 'User updated successfully';
        this.cdr.detectChanges();
        this.autoHideSuccess();
      },
      error: (err: ErrorResponse) => {
        this.setError(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  //  Loaders 

  loadUser(): void {
    this.loading = true;
    this.clearMessages();

    this.usersService.getUserById(this.userId).subscribe({
      next: (data: User) => {
        this.user = data;
        this.populateForm();
        this.loading = false;
        this.cdr.detectChanges();
        this.loadTickets();
      },
      error: (err: ErrorResponse) => {
        this.setError(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTickets(): void {
    this.loadingTickets = true;

    // Use dedicated endpoints instead of fetching all tickets and filtering client-side
    this.ticketsService.getTicketsByUserId(this.userId).subscribe({
      next: (data: Ticket[]) => {
        this.createdTickets = data;
        this.loadingTickets = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTickets = false;
        this.cdr.detectChanges();
      }
    });

    this.ticketsService.getTicketsAssignedTo(this.userId).subscribe({
      next: (data: Ticket[]) => {
        this.assignedTickets = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }

  //  Navigation 

  setTab(tab: 'info' | 'created' | 'assigned'): void {
    this.activeTab = tab;
    this.clearMessages();
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  viewTicket(ticketId: number): void {
    this.router.navigate(['/tickets', ticketId]);
  }

  //  Helpers 

  getRoleBadgeClass(role: Role): string {
    switch (role) {
      case Role.ADMIN: return 'bg-red-100 text-red-800';
      case Role.MANAGER: return 'bg-blue-100 text-blue-800';
      case Role.USER: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'VALIDATED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  private setError(err: ErrorResponse): void {
    this.error = err?.message ?? 'An unexpected error occurred';
    this.errorType = err?.type ?? null;
  }

  private clearMessages(): void {
    this.error = null;
    this.errorType = null;
    this.success = null;
  }

  private autoHideSuccess(): void {
    setTimeout(() => {
      this.success = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  get name() { return this.userForm.get('name'); }
  get email() { return this.userForm.get('email'); }
  get jobTitle() { return this.userForm.get('jobTitle'); }
}