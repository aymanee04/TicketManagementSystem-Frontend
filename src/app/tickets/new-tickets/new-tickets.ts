import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TicketsService } from '../../services/tickets';
import { Router } from '@angular/router';
import { CreateTicketRequest } from '../../models/ticket.model';
import { User } from '../../models/user.model';
import { UsersService } from '../../services/users';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-new-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-tickets.html',
  styleUrl: './new-tickets.css',
})
export class NewTickets implements OnInit {
  ticketForm!: FormGroup;
  currentUser: User | null = null;
  selectedFiles: File[] = [];
  loading: boolean = false;
  error: string | null = null;
  loadingUser: boolean = false;

  constructor(
    private fb: FormBuilder,
    private ticketsService: TicketsService,
    private userService: UsersService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUser();
  }

  initForm(): void {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  loadCurrentUser(): void {
    this.loadingUser = true;

    this.currentUser = this.authService.currentUserValue;

    if (!this.currentUser) {
      this.error = 'User not logged in';
      this.loadingUser = false;
      this.router.navigate(['/login']);
      return;
    }

    this.loadingUser = false;
    this.cdr.detectChanges();
    console.log('Current user loaded:', this.currentUser);
  }

  onFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  onSubmit(): void {
    if (this.ticketForm.invalid || !this.currentUser || !this.currentUser.clientId) {
      this.ticketForm.markAllAsTouched();
      if (!this.currentUser?.clientId) {
        this.error = 'You must be assigned to a client to create a ticket';
      }
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.ticketForm.value;
    const request: CreateTicketRequest = {
      title: formValue.title,
      description: formValue.description,
      createdById: this.currentUser.userId,
      clientIds: [this.currentUser.clientId]
    };

    this.ticketsService.createTicket(request).subscribe({
      next: (createdTicket) => {
        console.log('Ticket created successfully:', createdTicket);

        if (this.selectedFiles.length > 0) {
          this.uploadAttachments(createdTicket.ticketId);
        } else {
          this.router.navigate(['/tickets']);
        }
      },
      error: (err) => {
        console.error('Error creating ticket:', err);
        this.error = 'Failed to create ticket. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  uploadAttachments(ticketId: number): void {
    let uploadedCount = 0;
    const totalFiles = this.selectedFiles.length;

    this.selectedFiles.forEach((file) => {
      this.ticketsService.uploadAttachment(ticketId, file).subscribe({
        next: () => {
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.router.navigate(['/tickets']);
          }
        },
        error: (err) => {
          console.error('Error uploading file:', err);
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.router.navigate(['/tickets']);
          }
        }
      });
    });
  }

  getCurrentUserId(): number {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.userId;
  }

  cancel(): void {
    this.router.navigate(['/tickets']);
  }

  get title() {
    return this.ticketForm.get('title');
  }

  get description() {
    return this.ticketForm.get('description');
  }
}