import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../models/user.model';
import { UsersService } from '../services/users';
import { ClientsService } from '../services/clients';
import { Client } from '../models/client.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Role } from '../models/enums';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageResponse } from '../models/pagedResponse.model';
import { ErrorResponse } from '../models/ErrorResponse';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  standalone: true,
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit, OnDestroy {

  loading = false;
  loadingClients = false;
  error: string | null = null;
  errorType: string | null = null;

  users: User[] = [];
  clients: Client[] = [];
  Role = Role;

  selectedClientId: number | 'ALL' = 'ALL';
  searchTerm = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  pageSizeOptions = [5, 10, 20, 50];

  private destroy$ = new Subject<void>();

  constructor(
    private usersService: UsersService,
    private clientsService: ClientsService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //  Loaders 

  loadClients(): void {
    this.loadingClients = true;
    this.clientsService.getClients().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        this.loadingClients = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingClients = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.clearError();

    // Pick the right endpoint based on current filter state
    const request$ = this.buildRequest();

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: PageResponse<User>) => {
        this.users = data.content;
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

  //  Filters / search 

  onSearch(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  onClientChange(): void {
    this.currentPage = 0;
    this.searchTerm = '';
    this.loadUsers();
  }

  clearFilter(): void {
    this.selectedClientId = 'ALL';
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadUsers();
  }

  //  Pagination 

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  //  Navigation 

  viewUser(userId: number): void {
    this.router.navigate(['/users', userId]);
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  //  Private helpers 

  private buildRequest() {
    if (this.searchTerm.trim()) {
      return this.usersService.searchUsersWithPagination(
        this.searchTerm, this.currentPage, this.pageSize
      );
    }
    if (this.selectedClientId !== 'ALL') {
      return this.usersService.getUsersByClientIdWithPagination(
        this.selectedClientId as number, this.currentPage, this.pageSize
      );
    }
    return this.usersService.getUsersWithPagination(this.currentPage, this.pageSize);
  }

  private setError(err: ErrorResponse): void {
    this.error = err?.message ?? 'Failed to load users. Please try again.';
    this.errorType = err?.type ?? null;
  }

  private clearError(): void {
    this.error = null;
    this.errorType = null;
  }
}