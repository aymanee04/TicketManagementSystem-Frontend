import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Client } from '../models/client.model';
import { ClientStatus } from '../models/enums';
import { ClientsService } from '../services/clients';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorResponse } from '../models/ErrorResponse';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients implements OnInit, OnDestroy {

  clients: Client[] = [];
  loading = false;
  error: string | null = null;
  errorType: string | null = null;

  selectedStatus: ClientStatus | 'ALL' = 'ALL';
  searchTerm = '';

  ClientStatus = ClientStatus;

  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: ClientStatus.ACTIVE, label: 'Active' },
    { value: ClientStatus.INACTIVE, label: 'Inactive' },
    { value: ClientStatus.SUSPENDED, label: 'Suspended' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //  Loaders 

  loadClients(): void {
    this.loading = true;
    this.clearError();

    const request$ = this.selectedStatus === 'ALL'
      ? this.clientsService.getClients()
      : this.clientsService.getClientsByStatus(this.selectedStatus);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: ErrorResponse) => {
        this.setError(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  //  Filters 

  onStatusChange(): void {
    this.searchTerm = '';
    this.loadClients();
  }

  onSearch(): void {
    // Search is server-side: clear filter and reload, or implement a search endpoint
    // For now we reload with the current status filter and let the results reset
    if (!this.searchTerm.trim()) {
      this.loadClients();
    }
    // If a backend search endpoint is added later, call it here
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadClients();
  }

  //  Navigation 

  viewClient(clientId: number): void {
    this.router.navigate(['/clients', clientId]);
  }

  //  UI helpers 

  get filteredClients(): Client[] {
    if (!this.searchTerm.trim()) return this.clients;
    const term = this.searchTerm.toLowerCase();
    return this.clients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.company?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
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
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  //  Private helpers 

  private setError(err: ErrorResponse): void {
    this.error = err?.message ?? 'Failed to load clients. Please try again.';
    this.errorType = err?.type ?? null;
  }

  private clearError(): void {
    this.error = null;
    this.errorType = null;
  }
}