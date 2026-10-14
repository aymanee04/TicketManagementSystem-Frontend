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
import { AuthService } from '../../services/auth';
import { ErrorResponse } from '../../models/ErrorResponse';

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

  loading = false;
  loadingUsers = false;
  error: string | null = null;
  errorType: string | null = null;
  success: string | null = null;

  selectedUserId: number | null = null;
  validationComment = '';
  showValidationModal = false;
  validationAction: 'approve' | 'reject' | null = null;

  // Popup — same pattern as client-details
  popupConfig: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDanger: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  } = {
      isOpen: false, title: '', message: '',
      confirmText: 'Confirm', cancelText: 'Cancel',
      isDanger: false, onConfirm: () => { }, onCancel: () => { }
    };

  TicketStatus = TicketStatus;
  Role = Role;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketsService: TicketsService,
    private usersService: UsersService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCurrentUser();
    this.loadTicket();
  }

  //  Loaders 

  loadCurrentUser(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user?.userId) {
          this.usersService.getUserById(user.userId).subscribe({
            next: (data) => {
              this.currentUser = data;
              this.cdr.detectChanges();
            }
          });
        }
      }
    });
  }

  loadTicket(): void {
    this.loading = true;
    this.clearMessages();

    this.ticketsService.getTicketById(this.ticketId).subscribe({
      next: (data: Ticket) => {
        this.ticket = data;
        this.loading = false;
        this.cdr.detectChanges();

        if (this.canAssign()) {
          this.loadAssignableUsers();
        }
      },
      error: (err: ErrorResponse) => {
        this.setError(err);
        this.loading = false;
        if (err?.type === 'RESOURCE_NOT_FOUND') {
          setTimeout(() => this.router.navigate(['/tickets']), 2500);
        }
        this.cdr.detectChanges();
      }
    });
  }

  loadAssignableUsers(): void {
    if (!this.ticket?.clientIds) return;

    this.loadingUsers = true;

    const primaryClientId = this.ticket.clientIds;

    this.usersService.getUsersByClientId(primaryClientId).subscribe({
      next: (data: User[]) => {
        // Only MANAGERs can be assigned to tickets
        this.availableUsers = data.filter(u => u.roles.includes(Role.MANAGER));
        this.loadingUsers = false;
        this.cdr.detectChanges();
      },
      error: (err: ErrorResponse) => {
        this.setError(err);
        this.loadingUsers = false;
        this.cdr.detectChanges();
      }
    });
  }

  //  Permissions 

  canAssign(): boolean {
    return this.currentUser?.roles.includes(Role.ADMIN) ?? false;
  }

  canValidate(): boolean {
    return (this.currentUser?.roles.includes(Role.ADMIN) ||
      this.currentUser?.roles.includes(Role.MANAGER)) ?? false;
  }

  canArchive(): boolean {
    return (this.currentUser?.roles.includes(Role.ADMIN) ||
      this.currentUser?.roles.includes(Role.MANAGER)) ?? false;
  }

  canDelete(): boolean {
    return this.currentUser?.roles.includes(Role.ADMIN) ?? false;
  }

  //  Actions 

  assignTicket(): void {
    if (!this.selectedUserId || !this.ticket) return;

    this.loading = true;
    this.clearMessages();

    this.ticketsService.assignTicket(this.ticketId, this.selectedUserId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.selectedUserId = null;
        this.loading = false;
        this.success = 'Ticket assigned successfully';
        this.cdr.detectChanges();
        this.autoHideSuccess();
      },
      error: (err: ErrorResponse) => {
        this.setError(err);
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
    if (!this.validationComment.trim()) return;

    this.loading = true;
    this.clearMessages();

    const action$ = this.validationAction === 'approve'
      ? this.ticketsService.approveTicket(this.ticketId, this.validationComment)
      : this.ticketsService.rejectTicket(this.ticketId, this.validationComment);

    action$.subscribe({
      next: (data) => {
        this.ticket = data;
        this.loading = false;
        this.success = `Ticket ${this.validationAction === 'approve' ? 'approved' : 'rejected'} successfully`;
        this.closeValidationModal();
        this.cdr.detectChanges();
        this.autoHideSuccess();
      },
      error: (err: ErrorResponse) => {
        this.setError(err);
        this.loading = false;
        this.closeValidationModal();
        this.cdr.detectChanges();
      }
    });
  }

  archiveTicket(): void {
    this.showPopup({
      title: 'Archive Ticket',
      message: 'Archive this ticket? It will be permanently deleted after 5 days if cancelled, or kept indefinitely if archived.',
      confirmText: 'Archive',
      isDanger: false,
      onConfirm: () => {
        this.closePopup();
        this.loading = true;
        this.clearMessages();
        this.ticketsService.archiveTicket(this.ticketId).subscribe({
          next: (data) => {
            this.ticket = data;
            this.loading = false;
            this.success = 'Ticket archived successfully';
            this.cdr.detectChanges();
            this.autoHideSuccess();
          },
          error: (err: ErrorResponse) => {
            this.setError(err);
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  cancelTicket(): void {
    this.showPopup({
      title: 'Cancel Ticket',
      message: 'Cancel this ticket? It will be automatically deleted after 5 days.',
      confirmText: 'Cancel Ticket',
      isDanger: true,
      onConfirm: () => {
        this.closePopup();
        this.loading = true;
        this.clearMessages();
        this.ticketsService.cancelTicket(this.ticketId).subscribe({
          next: (data) => {
            this.ticket = data;
            this.loading = false;
            this.success = 'Ticket cancelled';
            this.cdr.detectChanges();
            this.autoHideSuccess();
          },
          error: (err: ErrorResponse) => {
            this.setError(err);
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  hardDeleteTicket(): void {
    this.showPopup({
      title: 'Permanently Delete Ticket',
      message: 'This action CANNOT be undone. The ticket and all its attachments will be permanently deleted.',
      confirmText: 'Delete Permanently',
      isDanger: true,
      onConfirm: () => {
        this.closePopup();
        this.loading = true;
        this.clearMessages();
        this.ticketsService.hardDeleteTicket(this.ticketId).subscribe({
          next: () => {
            this.router.navigate(['/tickets']);
          },
          error: (err: ErrorResponse) => {
            this.setError(err);
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  //  Attachments 

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
      error: (err: ErrorResponse) => {
        this.setError(err);
        this.cdr.detectChanges();
      }
    });
  }

  viewAttachment(attachment: Attachment): void {
    window.open(attachment.cloudinaryUrl, '_blank');
  }

  //  Popup 

  showPopup(config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }): void {
    this.popupConfig = {
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText ?? 'Confirm',
      cancelText: config.cancelText ?? 'Cancel',
      isDanger: config.isDanger ?? false,
      onConfirm: config.onConfirm,
      onCancel: config.onCancel ?? (() => this.closePopup())
    };
    this.cdr.detectChanges();
  }

  closePopup(): void {
    this.popupConfig.isOpen = false;
    this.cdr.detectChanges();
  }

  //  UI helpers 

  getStatusBadgeClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.VALIDATED: return 'bg-green-100 text-green-800';
      case TicketStatus.REJECTED: return 'bg-red-100 text-red-800';
      case TicketStatus.PENDING_VALIDATION: return 'bg-blue-100 text-blue-800';
      case TicketStatus.ARCHIVED:
      case TicketStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  //  Private helpers 

  private setError(err: ErrorResponse): void {
    this.error = err?.message ?? 'An unexpected error occurred';
    this.errorType = err?.type ?? null;
  }

  private clearMessages(): void {
    this.error = null;
    this.errorType = null;
    this.success = null;
  }

  private autoHideSuccess(): void {
    setTimeout(() => {
      this.success = null;
      this.cdr.detectChanges();
    }, 3000);
  }
}