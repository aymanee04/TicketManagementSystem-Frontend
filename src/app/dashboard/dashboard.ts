import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TicketsService } from '../services/tickets';
import { ClientsService } from '../services/clients';
import { UsersService } from '../services/users';
import { AuthService } from '../services/auth';
import { Ticket } from '../models/ticket.model';
import { Client } from '../models/client.model';
import { User } from '../models/user.model';
import { TicketStatus } from '../models/enums';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Register Chart.js components
Chart.register(...registerables);

interface CompanyStat {
  clientName: string;
  ticketCount: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {

  @ViewChild('companyChartCanvas') set companyCanvas(canvas: ElementRef<HTMLCanvasElement>) {
    if (canvas && !this.companyChart && this.companyStats.length > 0) {
      this.companyChartCanvas = canvas;
      setTimeout(() => this.createCompanyChart(), 50);
    }
  }

  @ViewChild('statusChartCanvas') set statusCanvas(canvas: ElementRef<HTMLCanvasElement>) {
    if (canvas && !this.statusChart && this.tickets.length > 0) {
      this.statusChartCanvas = canvas;
      setTimeout(() => this.createStatusChart(), 50);
    }
  }

  private companyChartCanvas?: ElementRef<HTMLCanvasElement>;
  private statusChartCanvas?: ElementRef<HTMLCanvasElement>;

  // Data
  tickets: Ticket[] = [];
  clients: Client[] = [];
  users: User[] = [];
  recentTickets: Ticket[] = [];

  // Stats
  systemStats = {
    totalTickets: 0,
    activeTickets: 0,
    resolvedTickets: 0,
    totalClients: 0,
    totalUsers: 0,
    resolutionRate: 0
  };

  // Company stats
  companyStats: CompanyStat[] = [];

  // Charts
  companyChart: Chart | null = null;
  statusChart: Chart | null = null;

  // UI State
  loading: boolean = false;
  currentUser: User | null = null;
  TicketStatus = TicketStatus;

  // Chart colors
  chartColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];

  constructor(
    private ticketsService: TicketsService,
    private clientsService: ClientsService,
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Use forkJoin to load all data in parallel
    forkJoin({
      tickets: this.ticketsService.getTickets().pipe(
        catchError(err => {
          console.error('Error loading tickets:', err);
          return of({ content: [], totalElements: 0 });
        })
      ),
      clients: this.clientsService.getClients().pipe(
        catchError(err => {
          console.error('Error loading clients:', err);
          return of([]);
        })
      ),
      users: this.usersService.getAllUsers().pipe(
        catchError(err => {
          console.error('Error loading users:', err);
          return of({ content: [], totalElements: 0 });
        })
      )
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        // Handle tickets
        if (data.tickets) {
          this.tickets = Array.isArray(data.tickets)
            ? data.tickets
            : (data.tickets as any).content || [];
        }

        // Handle clients
        this.clients = Array.isArray(data.clients) ? data.clients : [];

        // Handle users
        if (data.users) {
          this.users = Array.isArray(data.users)
            ? data.users
            : (data.users as any).content || [];
        }

        // Calculate stats
        this.calculateSystemStats();
        this.calculateCompanyStats();
        this.getRecentTickets();

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
      }
    });
  }

  calculateSystemStats(): void {
    this.systemStats.totalTickets = this.tickets.length;
    this.systemStats.activeTickets = this.tickets.filter(
      t => t.status === TicketStatus.IN_PROGRESS || t.status === TicketStatus.PENDING_VALIDATION
    ).length;
    this.systemStats.resolvedTickets = this.tickets.filter(
      t => t.status === TicketStatus.VALIDATED
    ).length;
    this.systemStats.totalClients = this.clients.length;
    this.systemStats.totalUsers = this.users.length;
    this.systemStats.resolutionRate = this.systemStats.totalTickets > 0
      ? Math.round((this.systemStats.resolvedTickets / this.systemStats.totalTickets) * 100)
      : 0;
  }

  calculateCompanyStats(): void {
    const companyMap = new Map<string, number>();

    this.tickets.forEach(ticket => {
      const clientNames = Array.isArray(ticket.clientName)
        ? ticket.clientName
        : (ticket.clientName ? [ticket.clientName] : []);

      clientNames.forEach(clientName => {
        if (clientName && typeof clientName === 'string') {
          companyMap.set(clientName, (companyMap.get(clientName) || 0) + 1);
        }
      });
    });

    this.companyStats = Array.from(companyMap.entries())
      .map(([clientName, ticketCount], index) => ({
        clientName,
        ticketCount,
        color: this.chartColors[index % this.chartColors.length]
      }))
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 10);
  }

  createCompanyChart(): void {
    if (!this.companyChartCanvas?.nativeElement || this.companyStats.length === 0) {
      return;
    }

    // Destroy existing chart
    if (this.companyChart) {
      this.companyChart.destroy();
      this.companyChart = null;
    }

    try {
      const ctx = this.companyChartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      const config: ChartConfiguration = {
        type: 'bar',
        data: {
          labels: this.companyStats.map(stat => stat.clientName),
          datasets: [{
            label: 'Tickets',
            data: this.companyStats.map(stat => stat.ticketCount),
            backgroundColor: this.companyStats.map(stat => stat.color + 'CC'),
            borderColor: this.companyStats.map(stat => stat.color),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                label: (context) => ` ${context.parsed.y} ticket${context.parsed.y !== 1 ? 's' : ''}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                maxRotation: 45,
                minRotation: 45,
                font: { size: 11 }
              }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: {
                stepSize: 1,
                font: { size: 11 },
                precision: 0
              }
            }
          },
          animation: {
            duration: 750,
            easing: 'easeInOutQuart'
          }
        }
      };

      this.companyChart = new Chart(ctx, config);
    } catch (error) {
      console.error('Error creating company chart:', error);
    }
  }

  createStatusChart(): void {
    if (!this.statusChartCanvas?.nativeElement || this.tickets.length === 0) {
      return;
    }

    // Destroy existing chart
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null;
    }

    try {
      const ctx = this.statusChartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      const statusCounts: { [key: string]: number } = {
        'In Progress': this.tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
        'Pending Validation': this.tickets.filter(t => t.status === TicketStatus.PENDING_VALIDATION).length,
        'Validated': this.tickets.filter(t => t.status === TicketStatus.VALIDATED).length,
        'Rejected': this.tickets.filter(t => t.status === TicketStatus.REJECTED).length,
        'Archived': this.tickets.filter(t => t.status === TicketStatus.ARCHIVED).length,
        'Cancelled': this.tickets.filter(t => t.status === TicketStatus.CANCELLED).length
      };

      const labels = Object.keys(statusCounts).filter(key => statusCounts[key] > 0);
      const data = labels.map(label => statusCounts[label]);

      const colorMap: { [key: string]: string } = {
        'In Progress': '#F59E0B',
        'Pending Validation': '#3B82F6',
        'Validated': '#10B981',
        'Rejected': '#EF4444',
        'Archived': '#6B7280',
        'Cancelled': '#9CA3AF'
      };
      const colors = labels.map(label => colorMap[label] || '#6B7280');

      const config: ChartConfiguration = {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.map(c => c + 'CC'),
            borderColor: colors,
            borderWidth: 2,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: { size: 12 },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                label: (context) => {
                  const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return ` ${context.label}: ${context.parsed} (${percentage}%)`;
                }
              }
            }
          }
        }
      };

      this.statusChart = new Chart(ctx, config);
    } catch (error) {
      console.error('Error creating status chart:', error);
    }
  }

  getRecentTickets(): void {
    this.recentTickets = [...this.tickets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }

  viewTicket(ticketId: number): void {
    this.router.navigate(['/tickets', ticketId]);
  }

  viewAllTickets(): void {
    this.router.navigate(['/tickets']);
  }

  viewClients(): void {
    this.router.navigate(['/clients']);
  }

  getStatusBadgeClass(status: TicketStatus): string {
    const statusClasses: { [key: string]: string } = {
      [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
      [TicketStatus.PENDING_VALIDATION]: 'bg-blue-100 text-blue-800',
      [TicketStatus.VALIDATED]: 'bg-green-100 text-green-800',
      [TicketStatus.REJECTED]: 'bg-red-100 text-red-800',
      [TicketStatus.ARCHIVED]: 'bg-gray-100 text-gray-800',
      [TicketStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  ngOnDestroy(): void {
    if (this.companyChart) {
      this.companyChart.destroy();
      this.companyChart = null;
    }
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null;
    }
  }
}