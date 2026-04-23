import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Client, SuspendClientRequest } from '../../models/client.model';
import { User } from '../../models/user.model';
import { Ticket } from '../../models/ticket.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientsService } from '../../services/clients';
import { UsersService } from '../../services/users';
import { TicketsService } from '../../services/tickets';
import { CommonModule } from '@angular/common';
import { ClientStatus } from '../../models/enums';
import { LucideAngularModule } from "lucide-angular";
import { AuthService } from '../../services/auth';
import { ErrorResponse } from '../../models/ErrorResponse';

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './client-details.html',
  styleUrl: './client-details.css',
})
export class ClientDetails implements OnInit {
  clientId!: number;
  client: Client | null = null;
  employees: User[] = [];
  tickets: Ticket[] = [];

  clientForm!: FormGroup;
  suspensionForm!: FormGroup;
  isEditing: boolean = false;
  loading: boolean = false;
  loadingEmployees: boolean = false;
  loadingTickets: boolean = false;
  error: string | null = null;
  errorType: string | null = null;
  success: string | null = null;

  activeTab: 'info' | 'employees' | 'tickets' | 'suspension' = 'info';
  ClientStatus = ClientStatus;

  popupConfig: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDanger: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  } = {
      isOpen: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isDanger: false,
      onConfirm: () => { },
      onCancel: () => { }
    };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private clientsService: ClientsService,
    private usersService: UsersService,
    private ticketsService: TicketsService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.clientId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForms();
    this.loadClient();
  }

  initForms(): void {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      company: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      status: ['', [Validators.required]]
    });
    this.clientForm.disable();

    this.suspensionForm = this.fb.group({
      suspensionReason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  //  Loaders   

  loadClient(): void {
    this.loading = true;
    this.clearMessages();

    this.clientsService.getClientById(this.clientId).subscribe({
      next: (data: Client) => {
        this.client = data;
        this.populateForm();
        this.populateSuspensionForm();
        this.loading = false;
        this.cdr.detectChanges();
        this.loadEmployees();
        this.loadTickets();
      },
      error: (err: ErrorResponse) => {
        this.setError(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadEmployees(): void {
    this.loadingEmployees = true;
    this.usersService.getUsersByClientId(this.clientId).subscribe({
      next: (data: User[]) => {
        this.employees = data;
        this.loadingEmployees = false;
        this.cdr.detectChanges();
      },
      error: (err: ErrorResponse) => {
        console.error('Error loading employees:', err);
        this.loadingEmployees = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTickets(): void {
    this.loadingTickets = true;
    this.ticketsService.getTicketsByClient(this.clientId).subscribe({
      next: (data: Ticket[]) => {
        this.tickets = data;
        this.loadingTickets = false;
        this.cdr.detectChanges();
      },
      error: (err: ErrorResponse) => {
        console.error('Error loading tickets:', err);
        this.loadingTickets = false;
        this.cdr.detectChanges();
      }
    });
  }

  //  Form helpers 

  populateForm(): void {
    if (this.client) {
      this.clientForm.patchValue({
        name: this.client.name,
        company: this.client.company,
        email: this.client.email,
        phone: this.client.phone,
        status: this.client.status
      });
    }
  }

  populateSuspensionForm(): void {
    if (this.client?.suspensionReason) {
      this.suspensionForm.patchValue({
        suspensionReason: this.client.suspensionReason
      });
    }
  }

  enableEdit(): void {
    this.isEditing = true;
    this.clientForm.enable();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.clientForm.disable();
    this.populateForm();
    this.clearMessages();
  }

  saveChanges(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.clearMessages();

    const updatedClient = {
      name: this.clientForm.value.name,
      company: this.clientForm.value.company,
      email: this.clientForm.value.email,
      phone: this.clientForm.value.phone,
      status: this.clientForm.value.status
    };

    this.clientsService.updateClient(this.clientId, updatedClient).subscribe({
      next: (data: Client) => {
        this.client = data;
        this.isEditing = false;
        this.clientForm.disable();
        this.loading = false;
        this.success = 'Client updated successfully';
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

  //  Suspend / reactivate 

  suspendClient(): void {
    if (this.suspensionForm.invalid) {
      this.suspensionForm.markAllAsTouched();
      return;
    }

    this.showPopup({
      title: 'Suspend Client',
      message: 'Are you sure you want to SUSPEND this client? All users will be unable to login.',
      confirmText: 'Suspend',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: () => {
        this.closePopup();
        this.confirmSuspend();
      }
    });
  }

  private confirmSuspend(): void {
    this.loading = true;
    this.clearMessages();

    const request: SuspendClientRequest = {
      suspensionReason: this.suspensionForm.value.suspensionReason
    };

    this.clientsService.suspendClient(this.clientId, request).subscribe({
      next: (data: Client) => {
        this.client = data;
        this.loading = false;
        this.success = 'Client suspended successfully';
        this.populateForm();
        this.cdr.detectChanges();
        this.autoHideSuccess();
      },
      error: (err: ErrorResponse) => {
        this.setError(err);
        // If backend rejected the reason text, highlight the field
        if (err?.type === 'VALIDATION_ERROR') {
          this.suspensionForm.get('suspensionReason')?.markAsTouched();
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  reactivateClient(): void {
    this.showPopup({
      title: 'Reactivate Client',
      message: 'Are you sure you want to REACTIVATE this client? All users will be able to login again.',
      confirmText: 'Reactivate',
      cancelText: 'Cancel',
      isDanger: false,
      onConfirm: () => {
        this.closePopup();
        this.confirmReactivate();
      }
    });
  }

  private confirmReactivate(): void {
    this.loading = true;
    this.clearMessages();

    this.clientsService.reactivateClient(this.clientId).subscribe({
      next: (data: Client) => {
        this.client = data;
        this.loading = false;
        this.success = 'Client reactivated successfully';
        this.populateForm();
        this.suspensionForm.reset();
        this.cdr.detectChanges();
        this.autoHideSuccess();
      },
      error: (err: ErrorResponse) => {
        // RESOURCE_NOT_FOUND: client was deleted — redirect after showing message
        if (err?.type === 'RESOURCE_NOT_FOUND') {
          this.setError(err);
          this.loading = false;
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/clients']), 3000);
          return;
        }
        this.setError(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  //  Popup 

  showPopup(config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }): void {
    this.popupConfig = {
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      isDanger: config.isDanger || false,
      onConfirm: config.onConfirm,
      onCancel: config.onCancel || (() => this.closePopup())
    };
    this.cdr.detectChanges();
  }

  closePopup(): void {
    this.popupConfig.isOpen = false;
    this.cdr.detectChanges();
  }

  //  Navigation / misc 

  setTab(tab: 'info' | 'employees' | 'tickets' | 'suspension'): void {
    this.activeTab = tab;
    this.clearMessages();
  }

  goBack(): void {
    this.router.navigate(['/clients']);
  }

  getStatusBadgeClass(status: ClientStatus): string {
    switch (status) {
      case ClientStatus.ACTIVE: return 'bg-green-100 text-green-800';
      case ClientStatus.INACTIVE: return 'bg-yellow-100 text-yellow-800';
      case ClientStatus.SUSPENDED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  viewTicket(ticketId: number): void { this.router.navigate(['/tickets', ticketId]); }
  viewUser(userId: number): void { this.router.navigate(['/users', userId]); }
  hasRole(role: string): boolean { return this.authService.hasRole(role); }

  getCurrentUserId(): number | null {
    const currentUser = this.authService.currentUserValue;
    return currentUser ? currentUser.userId : null;
  }

  //  Private helpers 

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

  //  Form accessors 

  get name() { return this.clientForm.get('name'); }
  get company() { return this.clientForm.get('company'); }
  get email() { return this.clientForm.get('email'); }
  get phone() { return this.clientForm.get('phone'); }
  get statusControl() { return this.clientForm.get('status'); }
  get suspensionReason() { return this.suspensionForm.get('suspensionReason'); }
}