import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Client } from '../../models/client.model';
import { AuthService } from '../../services/auth';
import { ClientsService } from '../../services/clients';
import { TicketsService } from '../../services/tickets';

@Component({
  selector: 'app-new-incident-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './new-incident-ticket.html',
  styleUrl: './new-incident-ticket.css',
})
export class NewIncidentTicket {
  incidentForm!: FormGroup;
  clients: Client[] = [];
  selectedClients: Set<number> = new Set();
  loading: boolean = false;
  loadingClients: boolean = false;
  error: string | null = null;
  success: boolean = false;

  constructor(
    private fb: FormBuilder,
    private ticketsService: TicketsService,
    private clientsService: ClientsService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (!this.authService.hasRole('ADMIN')) {
      this.router.navigate(['/admin/tickets']);
      return;
    }

    this.initForm();
    this.loadClients();
  }

  initForm(): void {
    this.incidentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      clientIds: [[], [Validators.required, Validators.minLength(1)]]
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

  toggleClient(clientId: number): void {
    if (this.selectedClients.has(clientId)) {
      this.selectedClients.delete(clientId);
    } else {
      this.selectedClients.add(clientId);
    }

    this.incidentForm.patchValue({
      clientIds: Array.from(this.selectedClients)
    });
  }

  selectAll(): void {
    this.selectedClients.clear();
    this.clients.forEach(client => this.selectedClients.add(client.clientId));
    this.incidentForm.patchValue({
      clientIds: Array.from(this.selectedClients)
    });
  }

  clearAll(): void {
    this.selectedClients.clear();
    this.incidentForm.patchValue({
      clientIds: []
    });
  }

  isSelected(clientId: number): boolean {
    return this.selectedClients.has(clientId);
  }

  onSubmit(): void {
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    if (this.selectedClients.size === 0) {
      this.error = 'Please select at least one client';
      return;
    }

    this.loading = true;
    this.error = null;

    const incidentData = {
      title: this.incidentForm.value.title,
      description: this.incidentForm.value.description,
      clientIds: Array.from(this.selectedClients)
    };

    this.ticketsService.createIncident(incidentData).subscribe({
      next: (ticket) => {
        this.success = true;
        this.loading = false;

        setTimeout(() => {
          this.router.navigate(['/tickets', ticket.ticketId]);
        }, 1500);
      },
      error: (err) => {
        console.error('Error creating incident:', err);
        this.error = err.error?.message || 'Failed to create incident';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/tickets']);
  }

  get title() { return this.incidentForm.get('title'); }
  get description() { return this.incidentForm.get('description'); }
  getSelectedClientsArray(): number[] {
    return Array.from(this.selectedClients);
  }

  getClientName(clientId: number): string {
    return this.clients.find(c => c.clientId === clientId)?.name || 'Unknown';
  }

}

