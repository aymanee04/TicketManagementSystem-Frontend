import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../models/ticket.model';
import { TicketsService } from '../services/tickets';
import { TicketStatus } from '../models/enums';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorResponse } from '../models/ErrorResponse';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class Tickets implements OnInit, OnDestroy {

  tickets: Ticket[] = [];
  loading = false;
  error: string | null = null;
  errorType: string | null = null;

  searchTerm = '';
  selectedStatus: TicketStatus | 'ALL' = 'ALL';
  sortDirection: 'asc' | 'desc' = 'desc';

  TicketStatus = TicketStatus;

  currentPage = 0;
  pageSize = 8;
  totalElements = 0;
  totalPages = 0;

  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: TicketStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TicketStatus.VALIDATED, label: 'Validated' },
    { value: TicketStatus.REJECTED, label: 'Rejected' },
    { value: TicketStatus.ARCHIVED, label: 'Archived' },
    { value: TicketStatus.CANCELLED, label: 'Cancelled' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private ticketsService: TicketsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //  Loaders 

  loadTickets(): void {
    this.loading = true;
    this.clearError();

    this.buildRequest().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.tickets = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.currentPage = data.pageNumber;
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

  onSearch(): void {
    this.currentPage = 0;
    this.loadTickets();
  }

  onStatusChange(): void {
    this.currentPage = 0;
    this.searchTerm = '';
    this.loadTickets();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadTickets();
  }

  handleSortByDate(): void {
    this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
    this.currentPage = 0;
    this.loadTickets();
  }

  //  Pagination 

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadTickets();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadTickets();
    }
  }

  getDisplayRange(): { start: number; end: number } {
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
    return { start, end };
  }

  //  Navigation 

  viewTicket(ticketId: number): void {
    this.router.navigate(['/tickets', ticketId]);
  }

  //  Helpers 

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private buildRequest() {
    if (this.searchTerm.trim()) {
      return this.ticketsService.searchTicketsWithPagination(
        this.searchTerm, this.currentPage, this.pageSize, 'createdAt', this.sortDirection
      );
    }
    if (this.selectedStatus !== 'ALL') {
      return this.ticketsService.getTicketsByStatusWithPagination(
        this.selectedStatus, this.currentPage, this.pageSize
      );
    }
    return this.ticketsService.getTicketsWithPagination(
      this.currentPage, this.pageSize, 'createdAt', this.sortDirection
    );
  }

  private setError(err: ErrorResponse): void {
    this.error = err?.message ?? 'Failed to load tickets. Please try again.';
    this.errorType = err?.type ?? null;
  }

  private clearError(): void {
    this.error = null;
    this.errorType = null;
  }
}