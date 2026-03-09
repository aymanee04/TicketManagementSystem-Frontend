import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { switchMap } from 'rxjs';
import { PageResponse } from '../models/pagedResponse.model';
// ============================================================= FIX THE SEARCH by user/Client AND PAGINATION ============================================================= \\
@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  standalone: true,
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  loading: boolean = false;
  loadingClients: boolean = false;
  error: string | null = null;
  users: User[] = [];
  Role = Role;
  clients: Client[] = [];
  selectedClientId: number | 'ALL' = 'ALL';
  searchTerm: string = '';
  currentUser: User | null = null;

  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  pageSizeOptions: number[] = [5, 10, 20, 50];


  constructor(
    private usersService: UsersService,
    private clientsService: ClientsService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.loadAllUsers();
  }



  loadClients(): void {
    this.loadingClients = true;
    this.clientsService.getClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        this.loadingClients = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading clients', err);
        this.loadingClients = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAllUsers(): void {
    this.loading = true;
    this.error = null;
    this.authService.currentUser$.pipe(
      switchMap(user => {
        this.currentUser = user;
        if (this.searchTerm.trim()) {
          return this.usersService.searchUsersWithPagination(this.searchTerm, this.currentPage, this.pageSize);
        }
        if (this.selectedClientId !== 'ALL') {
          return this.usersService.getUsersByClientIdWithPagination(this.selectedClientId, this.currentPage, this.pageSize);
        }
        if (user?.clientId) {
          return this.usersService.getUsersByClientId(user.clientId)
        }
        return this.usersService.getUsersWithPagination(this.currentPage, this.pageSize)
      })
    ).subscribe({
      next: (data) => {
        if (this.isPageResponse(data)) {
          this.users = data.content;
          this.totalElements = data.totalElements;
          this.totalPages = data.totalPages;
          this.currentPage = data.pageNumber;
        } else {
          this.users = data as User[];
          this.totalElements = this.users.length;
          this.totalPages = Math.ceil(this.users.length / this.pageSize);
          const start = this.currentPage * this.pageSize;
          const end = start + this.pageSize;
          this.users = this.users.slice(start, end);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.error = 'Failed to load users. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    if (this.searchTerm.trim()) {
      this.loadAllUsers();
    } else {
      this.loadAllUsers();
    }
  }


  isPageResponse(data: any): data is PageResponse<User> {
    return data && typeof data === 'object' && 'content' in data && 'totalElements' in data;
  }


  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadAllUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadAllUsers();
    }
  }

  loadUsersByClient(clientId: number): void {
    this.loading = true;
    this.error = null;
    this.usersService.getUsersByClientIdWithPagination(clientId).subscribe({
      next: (data) => {
        if (this.isPageResponse(data)) {
          this.users = data.content;
          this.totalElements = data.totalElements;
          this.totalPages = data.totalPages;
          this.currentPage = data.pageNumber;
        } else {
          this.users = data as User[];
          this.totalElements = this.users.length;
          this.totalPages = Math.ceil(this.users.length / this.pageSize);
          const start = this.currentPage * this.pageSize;
          const end = start + this.pageSize;
          this.users = this.users.slice(start, end);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users by client', err);
        this.error = 'Failed to load users. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onClientChange(): void {
    if (this.selectedClientId === 'ALL') {
      this.loadAllUsers();
    } else {
      this.loadUsersByClient(this.selectedClientId as number);
    }
  }

  clearFilter(): void {
    this.selectedClientId = 'ALL';
    this.loadAllUsers();
  }

  viewUser(userId: number): void {
    this.router.navigate(['/users', userId]);
  }
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
}
