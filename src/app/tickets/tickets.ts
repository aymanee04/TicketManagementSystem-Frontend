import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../models/ticket.model';
import { TicketsService } from '../services/tickets';
import { TicketStatus } from '../models/enums';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { Observable, switchMap } from 'rxjs';
import { AuthService } from '../services/auth';
import { PageResponse } from '../models/pagedResponse.model';


@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  loading: boolean = false;
  error: string | null = null;
  searchTerm: string = '';
  selectedStatus: TicketStatus | 'ALL' = 'ALL';
  sortAscending: boolean = false;
  currentUser: User | null = null;

  TicketStatus = TicketStatus;

  // Pagination
  currentPage: number = 0;
  pageSize: number = 8;
  totalElements: number = 0;
  totalPages: number = 0;
  pageSizeOptions: number[] = [5, 10, 20, 50];

  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: TicketStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TicketStatus.VALIDATED, label: 'Validated' },
    { value: TicketStatus.REJECTED, label: 'Rejected' },
    { value: TicketStatus.ARCHIVED, label: 'Archived' },
    { value: TicketStatus.CANCELLED, label: 'Cancelled' }
  ];

  constructor(
    private ticketsService: TicketsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;

    this.authService.currentUser$.pipe(
      switchMap(user => {
        this.currentUser = user;

        if (this.searchTerm.trim()) {
          return this.ticketsService.searchTicketsWithPagination(this.searchTerm, this.currentPage, this.pageSize);
        }

        if (this.selectedStatus !== 'ALL') {
          return this.ticketsService.getTicketsByStatusWithPagination(this.selectedStatus, this.currentPage, this.pageSize);
        }

        if (user?.clientId) {
          return this.ticketsService.getTicketsByClient(user.clientId);
        }

        return this.ticketsService.getTicketsWithPagination(this.currentPage, this.pageSize);
      })
    ).subscribe({
      next: (data) => {
        if (this.isPageResponse(data)) {
          this.tickets = data.content;
          this.totalElements = data.totalElements;
          this.totalPages = data.totalPages;
          this.currentPage = data.pageNumber;
        } else {
          this.tickets = data as Ticket[];
          this.totalElements = this.tickets.length;
          this.totalPages = Math.ceil(this.tickets.length / this.pageSize);
          const start = this.currentPage * this.pageSize;
          const end = start + this.pageSize;
          this.tickets = this.tickets.slice(start, end);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tickets:', err);
        this.error = 'Failed to load tickets. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isPageResponse(data: any): data is PageResponse<Ticket> {
    return data && typeof data === 'object' && 'content' in data && 'totalElements' in data;
  }

  onStatusChange(): void {
    this.currentPage = 0;
    this.loadTickets();
  }

  onSearch(): void {
    this.currentPage = 0;
    if (this.searchTerm.trim()) {
      this.loadTickets();
    } else {
      this.loadTickets();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadTickets();
  }

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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      minute: '2-digit',
      hour: '2-digit'
    });
  }

  viewTicket(ticketId: number): void {
    this.router.navigate(['/tickets', ticketId]);
  }

  handleSortByDate(): void {
    if (this.sortAscending) {
      this.tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.sortAscending = false;
    } else {
      this.tickets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      this.sortAscending = true;
    }
    this.cdr.detectChanges();
  }
}