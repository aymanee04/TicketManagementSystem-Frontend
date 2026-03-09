import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../../models/ticket.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketsService } from '../../services/tickets';
import { Role, TicketStatus } from '../../models/enums';
import { UsersService } from '../../services/users';
import { User } from '../../models/user.model';
import { Attachment } from '../../models/attachment.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './ticket-details.html',
  styleUrl: './ticket-details.css',
})
export class TicketDetails implements OnInit {
  ticketId!: number;
  ticket: Ticket | null = null;
  currentUser: User | null = null;
  availableUsers: User[] = [];

  loading: boolean = false;
  loadingUsers: boolean = false;
  error: string | null = null;

  selectedUserId: number | null = null;
  validationComment: string = '';
  showValidationModal: boolean = false;
  validationAction: 'approve' | 'reject' | null = null;

  TicketStatus = TicketStatus;
  Role = Role;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketsService: TicketsService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCurrentUser();
    this.loadTicket();
  }

  loadCurrentUser(): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user.userId) {
      this.usersService.getUserById(user.userId).subscribe({
        next: (data) => {
          this.currentUser = data;
          this.cdr.detectChanges();
        }
      });
    }
  }



  loadTicket(): void {
    this.loading = true;
    this.error = null;

    this.ticketsService.getTicketById(this.ticketId).subscribe({
      next: (data: Ticket) => {
        this.ticket = data;
        this.loading = false;
        this.cdr.detectChanges();

        if (this.canAssign()) {
          this.loadUsers();
        }
      },
      error: (err) => {
        console.error('Error loading ticket:', err);
        this.error = 'Failed to load ticket details';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;

    console.log('Ticket data:', this.ticket);
    console.log('Ticket clientName:', this.ticket?.clientName);

    this.usersService.getUsersByClientId(this.ticket?.clientIds || 0).subscribe({
      next: (data: User[]) => {
        this.availableUsers = data.filter(user => user.roles.includes(Role.MANAGER));

        this.loadingUsers = false;
        console.log('Available users for assignment:', this.availableUsers);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loadingUsers = false;
        this.cdr.detectChanges();
      }
    });
  }

  canAssign(): boolean {
    return this.currentUser?.roles.includes(Role.ADMIN) || false;
  }

  canValidate(): boolean {
    return this.currentUser?.roles.includes(Role.MANAGER) || false;
  }

  canArchive(): boolean {
    return this.currentUser?.roles.includes(Role.ADMIN) ||
      this.currentUser?.roles.includes(Role.MANAGER) || false;
  }

  assignTicket(): void {
    if (!this.selectedUserId || !this.ticket) return;

    this.loading = true;
    this.ticketsService.assignTicket(this.ticketId, this.selectedUserId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.loading = false;
        this.selectedUserId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error assigning ticket:', err);
        this.error = 'Failed to assign ticket';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openValidationModal(action: 'approve' | 'reject'): void {
    this.validationAction = action;
    this.validationComment = '';
    this.showValidationModal = true;
  }

  closeValidationModal(): void {
    this.showValidationModal = false;
    this.validationAction = null;
    this.validationComment = '';
  }

  submitValidation(): void {
    if (!this.validationComment.trim() || !this.currentUser) return;

    this.loading = true;

    // Make sure you're passing managerId from currentUser
    const action = this.validationAction === 'approve'
      ? this.ticketsService.approveTicket(
        this.ticketId,
        this.currentUser.userId,  // ← managerId
        this.validationComment
      )
      : this.ticketsService.rejectTicket(
        this.ticketId,
        this.currentUser.userId,  // ← managerId
        this.validationComment
      );

    action.subscribe({
      next: (data) => {
        this.ticket = data;
        this.loading = false;
        this.closeValidationModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error validating ticket:', err);
        this.error = `Failed to ${this.validationAction} ticket`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  archiveTicket(): void {
    if (!confirm('Are you sure you want to archive this ticket?')) return;

    this.loading = true;
    this.ticketsService.archiveTicket(this.ticketId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error archiving ticket:', err);
        this.error = 'Failed to archive ticket';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelTicket(): void {
    if (!confirm('Are you sure you want to cancel this ticket?')) return;

    this.loading = true;
    this.ticketsService.cancelTicket(this.ticketId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error canceling ticket:', err);
        this.error = 'Failed to cancel ticket';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // UI helpers
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
      case TicketStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  downloadAttachment(attachment: Attachment): void {
    this.ticketsService.downloadAttachment(attachment.attachmentId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.fileName;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading file:', err);
        this.error = 'Failed to download file';
      }
    });
  }

  viewAttachment(attachment: Attachment): void {
    window.open(attachment.cloudinaryUrl, '_blank');
  }

  downloadAttachmentDirect(attachment: Attachment): void {
    const link = document.createElement('a');
    link.href = attachment.cloudinaryUrl;
    link.download = attachment.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
