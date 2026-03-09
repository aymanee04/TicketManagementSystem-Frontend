import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../services/auth';
import { TicketsService } from '../services/tickets';
import { User } from '../models/user.model';
import { Ticket } from '../models/ticket.model';
import { TicketStatus, Role } from '../models/enums';
import { filter } from 'rxjs';

export interface Notification {
  id: number;
  type: 'status_change' | 'assignment' | 'approval' | 'rejection';
  title: string;
  message: string;
  ticketId: number;
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {
  pageTitle = '';
  currentUser: User | null = null;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;

  constructor(
    private authService: AuthService,
    private ticketsService: TicketsService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        let currentRoute = this.route.root;

        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        this.pageTitle = currentRoute.snapshot.title ?? '';
      });
    this.loadCurrentUser();
    this.loadNotifications();
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadNotifications();
      }
      this.cdr.detectChanges();
    });
  }

  loadNotifications(): void {
    if (!this.currentUser) return;

    this.ticketsService.getTickets().subscribe({
      next: (tickets: Ticket[]) => {
        this.generateNotifications(tickets);
        this.cdr.detectChanges();
      }
    });
  }

  generateNotifications(tickets: Ticket[]): void {
    this.notifications = [];
    const now = new Date();

    if (!this.currentUser) return;

    const myTickets = tickets.filter(t => t.createdById === this.currentUser?.userId);

    myTickets.forEach((ticket, index) => {
      if (ticket.status === TicketStatus.VALIDATED && ticket.validatedAt) {
        this.notifications.push({
          id: index + 1,
          type: 'approval',
          title: 'Ticket Approved ✓',
          message: `"${ticket.title}" has been approved`,
          ticketId: ticket.ticketId,
          timestamp: new Date(ticket.validatedAt),
          read: this.isOlderThan(ticket.validatedAt, 2)
        });
      } else if (ticket.status === TicketStatus.REJECTED && ticket.validatedAt) {
        this.notifications.push({
          id: index + 100,
          type: 'rejection',
          title: 'Ticket Rejected ✗',
          message: `"${ticket.title}" needs revision`,
          ticketId: ticket.ticketId,
          timestamp: new Date(ticket.validatedAt),
          read: this.isOlderThan(ticket.validatedAt, 2)
        });
      }
    });

    if (this.currentUser.roles.includes(Role.MANAGER)) {
      const assignedTickets = tickets.filter(t =>
        t.assignedToId === this.currentUser?.userId &&
        t.status === TicketStatus.IN_PROGRESS
      );

      assignedTickets.forEach((ticket, index) => {
        this.notifications.push({
          id: index + 200,
          type: 'assignment',
          title: 'New Assignment',
          message: `"${ticket.title}" needs your review`,
          ticketId: ticket.ticketId,
          timestamp: new Date(ticket.createdAt),
          read: this.isOlderThan(ticket.createdAt, 1)
        });
      });
    }

    this.notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    this.notifications = this.notifications.slice(0, 20);

    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  isOlderThan(dateString: string, days: number): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > days;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notification: Notification): void {
    notification.read = true;
    this.unreadCount = this.notifications.filter(n => !n.read).length;
    this.showNotifications = false;
    this.router.navigate(['/tickets', notification.ticketId]);
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'approval': return 'checkCircle2';
      case 'rejection': return 'xCircle';
      case 'assignment': return 'userCheck';
      default: return 'bell';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'approval': return 'text-green-600';
      case 'rejection': return 'text-red-600';
      case 'assignment': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
  navigateToNewTicket(): void {
    this.router.navigate(['/tickets/new']);
  }
  navigateToNewIncidentTicket(): void {
    this.router.navigate(['/tickets/new-incident']);
  }
}