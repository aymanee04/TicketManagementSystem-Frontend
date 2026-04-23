import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateUserRequest, User } from '../models/user.model';
import { Role } from '../models/enums';
import { PageResponse } from '../models/pagedResponse.model';
import { ErrorResponse } from '../models/ErrorResponse';

@Injectable({ providedIn: 'root' })
export class UsersService {

  private readonly api = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) { }

  //  Write 

  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.api, request).pipe(
      catchError(this.handleError)
    );
  }

  // updateUser now receives only the fields from UpdateUserRequest — not the whole entity
  updateUser(id: number, request: { name: string; email: string; jobTitle: string }): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, request).pipe(
      catchError(this.handleError)
    );
  }

  changePassword(userId: number, data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.api}/${userId}/change-password`, data
    ).pipe(catchError(this.handleError));
  }

  //  Read - simple 

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getUsersByClientId(clientId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/client/${clientId}`).pipe(
      catchError(this.handleError)
    );
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.api}/roles`).pipe(
      catchError(this.handleError)
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.api).pipe(
      catchError(this.handleError)
    );
  }

  //  Read - paginated 
  // All paginated endpoints require ?page param to trigger the paginated controller method.
  // sortBy and direction are forwarded to match backend Pageable construction.

  getUsersWithPagination(
    page = 0,
    size = 10,
    sortBy = 'name',
    direction = 'asc'
  ): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<User>>(this.api, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getUsersByClientIdWithPagination(
    clientId: number,
    page = 0,
    size = 10,
    sortBy = 'name',
    direction = 'asc'
  ): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<User>>(
      `${this.api}/client/${clientId}`, { params }
    ).pipe(catchError(this.handleError));
  }

  searchUsersWithPagination(
    searchTerm: string,
    page = 0,
    size = 10
  ): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('searchTerm', searchTerm)
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<User>>(
      `${this.api}/search`, { params }
    ).pipe(catchError(this.handleError));
  }

  //  Error handler 

  private handleError(error: HttpErrorResponse): Observable<never> {
    const err: ErrorResponse = error.error;
    return throwError(() => err);
  }
}