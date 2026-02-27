import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Client } from '../../models/client.model';
import { User } from '../../models/user.model';
import { Ticket } from '../../models/ticket.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientsService } from '../../services/clients';
import { UsersService } from '../../services/users';
import { TicketsService } from '../../services/tickets';
import { CommonModule } from '@angular/common';
import { ClientStatus } from '../../models/enums';

@Component({
  selector: 'app-client-details',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-details.html',
  styleUrl: './client-details.css',
})
export class ClientDetails implements OnInit {
  clientId!: number;
  client: Client | null = null;
  employees: User[] = [];
  tickets: Ticket[] = [];

  clientForm!: FormGroup;
  isEditing: boolean = false;
  loading: boolean = false;
  loadingEmployees: boolean = false;
  loadingTickets: boolean = false;
  error: string | null = null;

  activeTab: 'info' | 'employees' | 'tickets' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private clientsService: ClientsService,
    private usersService: UsersService,
    private ticketsService: TicketsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.clientId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadClient();
  }

  initForm(): void {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      company: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      status: ['', [Validators.required]]
    });
    this.clientForm.disable();
  }

  loadClient(): void {
    this.loading = true;
    this.error = null;

    this.clientsService.getClientById(this.clientId).subscribe({
      next: (data: Client) => {
        this.client = data;
        this.populateForm();
        this.loading = false;
        this.cdr.detectChanges();

        this.loadEmployees();
        this.loadTickets();
      },
      error: (err) => {
        console.error('Error loading client:', err);
        this.error = 'Failed to load client details';
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
        console.log("employees")
        this.cdr.detectChanges();
      },
      error: (err) => {
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
      error: (err) => {
        console.error('Error loading tickets:', err);
        this.loadingTickets = false;
        this.cdr.detectChanges();
      }
    });
  }

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

  enableEdit(): void {
    this.isEditing = true;
    this.clientForm.enable();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.clientForm.disable();
    this.populateForm();
  }

  saveChanges(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const updatedClient = {
      ...this.client,
      ...this.clientForm.value
    };

    this.clientsService.updateClient(this.clientId, updatedClient).subscribe({
      next: (data: Client) => {
        this.client = data;
        this.isEditing = false;
        this.clientForm.disable();
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Client updated successfully', data);
        this.goBack();
      },
      error: (err) => {
        console.error('Error updating client:', err);
        this.error = 'Failed to update client';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'info' | 'employees' | 'tickets'): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/clients']);
  }

  getStatusBadgeClass(status: ClientStatus): string {
    return status === ClientStatus.ACTIVE
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewTicket(ticketId: number): void {
    this.router.navigate(['/tickets', ticketId]);
  }
  viewUser(userId: number): void {
    this.router.navigate(['/users', userId]);
  }

  get name() {
    return this.clientForm.get('name');
  }

  get company() {
    return this.clientForm.get('company');
  }

  get email() {
    return this.clientForm.get('email');
  }

  get phone() {
    return this.clientForm.get('phone');
  }

  get status() {
    return this.clientForm.get('status');
  }
}
