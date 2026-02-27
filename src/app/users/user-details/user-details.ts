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
  isEditing: boolean = false;
  loading: boolean = false;
  loadingTickets: boolean = false;
  error: string | null = null;

  activeTab: 'info' | 'created' | 'assigned' = 'info';

  // Expose enum
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

  initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      cin: ['', [Validators.required]],
      jobTitle: ['', [Validators.required]]
    });
    this.userForm.disable();
  }

  loadUser(): void {
    this.loading = true;
    this.error = null;

    this.usersService.getUserById(this.userId).subscribe({
      next: (data: User) => {
        this.user = data;
        this.populateForm();
        this.loading = false;
        this.cdr.detectChanges();

        // Load tickets
        this.loadTickets();
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.error = 'Failed to load user details';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTickets(): void {
    this.loadingTickets = true;

    // Load all tickets and filter by this user
    this.ticketsService.getTickets().subscribe({
      next: (data: Ticket[]) => {
        this.createdTickets = data.filter(t => t.createdById === this.userId);
        this.assignedTickets = data.filter(t => t.assignedToId === this.userId);
        this.loadingTickets = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tickets:', err);
        this.loadingTickets = false;
        this.cdr.detectChanges();
      }
    });
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
  }

  saveChanges(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const updatedUser = {
      ...this.user,
      ...this.userForm.value
    };

    this.usersService.updateUser(this.userId, updatedUser).subscribe({
      next: (data: User) => {
        this.user = data;
        this.isEditing = false;
        this.userForm.disable();
        this.loading = false;
        this.cdr.detectChanges();
        console.log('User updated successfully');
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.error = 'Failed to update user';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'info' | 'created' | 'assigned'): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  viewTicket(ticketId: number): void {
    this.router.navigate(['/tickets', ticketId]);
  }

  getRoleBadgeClass(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return 'bg-red-100 text-red-800';
      case Role.MANAGER:
        return 'bg-blue-100 text-blue-800';
      case Role.USER:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'VALIDATED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Getters
  get name() {
    return this.userForm.get('name');
  }

  get email() {
    return this.userForm.get('email');
  }


  get jobTitle() {
    return this.userForm.get('jobTitle');
  }
}