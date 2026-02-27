import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../services/auth';
import { TicketsService } from '../services/tickets';
import { ClientsService } from '../services/clients';
import { UsersService } from '../services/users';
import { User } from '../models/user.model';
import { Ticket } from '../models/ticket.model';
import { Client } from '../models/client.model';
import { TicketStatus, Role, ClientStatus } from '../models/enums';


interface CompanyStats {
  clientName: string;
  ticketCount: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;
  tickets: Ticket[] = [];
  clients: Client[] = [];
  users: User[] = [];

  loading: boolean = false;


  systemStats = {
    totalTickets: 0,
    totalClients: 0,
    totalUsers: 0,
    activeTickets: 0,
    resolvedTickets: 0,
    pendingTickets: 0
  };


  companyStats: CompanyStats[] = [];


  recentTickets: Ticket[] = [];


  chartColors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316'
  ];

  constructor(
    private authService: AuthService,
    private ticketsService: TicketsService,
    private clientsService: ClientsService,
    private usersService: UsersService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.currentUserValue;
    this.cdr.detectChanges();
  }

  loadDashboardData(): void {
    this.loading = true;

    Promise.all([
      this.loadTickets(),
      this.loadClients(),
      this.loadUsers()
    ]).then(() => {
      this.calculateSystemStats();
      this.calculateCompanyStats();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  loadTickets(): Promise<void> {
    return new Promise((resolve) => {
      this.ticketsService.getTickets().subscribe({
        next: (data: Ticket[]) => {
          this.tickets = data;
          this.recentTickets = data
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadClients(): Promise<void> {
    return new Promise((resolve) => {
      this.clientsService.getClients().subscribe({
        next: (data: Client[]) => {
          this.clients = data;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadUsers(): Promise<void> {
    return new Promise((resolve) => {
      this.usersService.getAllUsers().subscribe({
        next: (data: User[]) => {
          this.users = data;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  calculateSystemStats(): void {
    this.systemStats.totalTickets = this.tickets.length;
    this.systemStats.totalClients = this.clients.filter(c => c.status === ClientStatus.ACTIVE).length;
    this.systemStats.totalUsers = this.users.length;

    this.systemStats.activeTickets = this.tickets.filter(t =>
      t.status === TicketStatus.IN_PROGRESS
    ).length;

    this.systemStats.resolvedTickets = this.tickets.filter(t =>
      t.status === TicketStatus.VALIDATED
    ).length;

    this.systemStats.pendingTickets = this.tickets.filter(t =>
      t.status === TicketStatus.IN_PROGRESS
    ).length;
  }

  calculateCompanyStats(): void {
    const companyMap = new Map<string, number>();

    this.tickets.forEach(ticket => {
      if (ticket.clientName && Array.isArray(ticket.clientName)) {
        ticket.clientName.forEach(clientName => {
          if (clientName && clientName.trim().length > 0) {
            const count = companyMap.get(clientName) || 0;
            companyMap.set(clientName, count + 1);
          }
        });
      }
    });

    this.companyStats = Array.from(companyMap.entries())
      .map(([clientName, ticketCount], index) => ({
        clientName,
        ticketCount,
        color: this.chartColors[index % this.chartColors.length]
      }))
      .sort((a, b) => b.ticketCount - a.ticketCount);
  }

  getChartHeight(count: number): number {
    if (this.companyStats.length === 0 || count === 0) return 0;
    const maxCount = Math.max(...this.companyStats.map(c => c.ticketCount));
    if (maxCount === 0) return 0;
    return Math.max((count / maxCount) * 100, 5);
  }

  viewTicket(ticketId: number): void {
    this.router.navigate(['/tickets', ticketId]);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }
}