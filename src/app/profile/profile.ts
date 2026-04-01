import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TicketsService } from '../services/tickets';
import { UsersService } from '../services/users';
import { AuthService } from '../services/auth';
import { User } from '../models/user.model';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TicketStatus, Role } from '../models/enums';
import { Ticket } from '../models/ticket.model';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  currentUser: User | null = null;
  myTickets: Ticket[] = [];
  assignedTickets: Ticket[] = [];

  stats = {
    totalCreated: 0,
    totalAssigned: 0,
    inProgress: 0,
    validated: 0,
    rejected: 0
  };

  activeTab: 'overview' | 'created' | 'assigned' | 'activity' = 'overview';
  loading: boolean = false;
  loadingTickets: boolean = false;
  error: string | null = null;
  success: string | null = null;


  isEditing: boolean = false;
  profileForm!: FormGroup;


  showPasswordForm: boolean = false;
  passwordForm!: FormGroup;
  passwordLoading: boolean = false;
  passwordError: string | null = null;
  passwordSuccess: string | null = null;

  TicketStatus = TicketStatus;
  Role = Role;

  constructor(
    private ticketsService: TicketsService,
    private usersService: UsersService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.initForms();
    this.loadUserData();
    this.loadTickets();
  }

  initForms(): void {

    this.profileForm = this.fb.group({
      name: [this.currentUser?.name || '', [Validators.required, Validators.minLength(3)]],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      jobTitle: [this.currentUser?.jobTitle || '', [Validators.required]]
    });
    this.profileForm.disable();


    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  loadUserData(): void {
    if (!this.currentUser) return;

    this.loading = true;
    this.usersService.getUserById(this.currentUser.userId).subscribe({
      next: (data: User) => {
        this.currentUser = data;
        this.populateProfileForm();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTickets(): void {
    if (!this.currentUser) return;

    this.loadingTickets = true;

    this.ticketsService.getTicketsByUserId(this.currentUser.userId).subscribe({
      next: (data: Ticket[]) => {
        this.myTickets = data;
        this.calculateStats();
        this.loadingTickets = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading created tickets:', err);
        this.error = 'Failed to load your tickets';
        this.loadingTickets = false;
        this.cdr.detectChanges();
      }
    });

    if (this.hasRole('MANAGER') || this.hasRole('ADMIN')) {
      this.ticketsService.getTicketsAssignedTo(this.currentUser.userId).subscribe({
        next: (data: Ticket[]) => {
          this.assignedTickets = data;
          this.calculateStats();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading assigned tickets:', err);
        }
      });
    }
  }

  calculateStats(): void {
    this.stats.totalCreated = this.myTickets.length;
    this.stats.totalAssigned = this.assignedTickets.length;

    const allTickets = [...this.myTickets, ...this.assignedTickets];
    this.stats.inProgress = allTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length;
    this.stats.validated = allTickets.filter(t => t.status === TicketStatus.VALIDATED).length;
    this.stats.rejected = allTickets.filter(t => t.status === TicketStatus.REJECTED).length;
  }

  populateProfileForm(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        jobTitle: this.currentUser.jobTitle
      });
    }
  }

  enableEdit(): void {
    this.isEditing = true;
    this.profileForm.enable();

    this.profileForm.get('email')?.disable();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.profileForm.disable();
    this.populateProfileForm();
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.currentUser) return;

    this.loading = true;
    this.error = null;

    const updatedUser = {
      ...this.currentUser,
      name: this.profileForm.value.name,
      cin: this.profileForm.value.cin,
      jobTitle: this.profileForm.value.jobTitle
    };

    this.usersService.updateUser(this.currentUser.userId, updatedUser).subscribe({
      next: (data: User) => {
        this.currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        this.isEditing = false;
        this.profileForm.disable();
        this.loading = false;
        this.success = 'Profile updated successfully!';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.success = null;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.error = 'Failed to update profile';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }

  changePassword(): void {
    if (this.passwordForm.invalid || !this.currentUser) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading = true;
    this.passwordError = null;
    this.passwordSuccess = null;

    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
      confirmPassword: this.passwordForm.value.confirmPassword
    };

    this.usersService.changePassword(this.currentUser.userId, passwordData).subscribe({
      next: (response) => {
        this.passwordLoading = false;
        this.passwordSuccess = response.message;
        this.passwordForm.reset();
        this.cdr.detectChanges();

        setTimeout(() => {
          this.showPasswordForm = false;
          this.passwordSuccess = null;
          this.cdr.detectChanges();
        }, 2000);
      },
      error: (err) => {
        console.error('Error changing password:', err);
        this.passwordError = err.error?.message || 'Failed to change password';
        this.passwordLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'overview' | 'created' | 'assigned' | 'activity'): void {
    this.activeTab = tab;
    this.error = null;
  }

  viewTicket(ticketId: number): void {
    this.router.navigate(['/tickets', ticketId]);
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role as any) || false;
  }

  getStatusBadgeClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.VALIDATED:
        return 'bg-green-100 text-green-800';
      case TicketStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case TicketStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      case TicketStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
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

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

  get name() { return this.profileForm.get('name'); }
  get email() { return this.profileForm.get('email'); }
  get cin() { return this.profileForm.get('cin'); }
  get jobTitle() { return this.profileForm.get('jobTitle'); }
  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}
