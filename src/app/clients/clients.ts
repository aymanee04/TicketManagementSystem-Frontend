import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Client } from '../models/client.model';
import { ClientStatus } from '../models/enums';
import { ClientsService } from '../services/clients';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients implements OnInit {
  clients: Client[] = [];
  loading: boolean = false;
  error: string | null = null;
  selectedStatus: ClientStatus | 'ALL' = 'ALL';
  searchTerm: string = '';

  ClientStatus = ClientStatus;

  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: ClientStatus.ACTIVE, label: 'Active' },
    { value: ClientStatus.INACTIVE, label: 'Inactive' },
    { value: ClientStatus.SUSPENDED, label: 'Suspended' }
  ];

  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;

    this.clientsService.getClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Clients loaded');
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        this.error = 'Failed to load clients. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadClientsByStatus(): void {
    if (this.selectedStatus === 'ALL') {
      this.loadClients();
      return;
    }

    this.loading = true;
    this.error = null;

    this.clientsService.getClientsByStatus(this.selectedStatus).subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading clients by status:', err);
        this.error = 'Failed to load clients. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onStatusChange(): void {
    this.loadClientsByStatus();
  }

  onSearch(): void {
    // Filter clients locally by search term
    if (this.searchTerm.trim()) {
      this.clients = this.clients.filter(client =>
        client.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.loadClients();
    }
  }

  viewClient(clientId: number): void {
    this.router.navigate(['/clients', clientId]);
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
}
