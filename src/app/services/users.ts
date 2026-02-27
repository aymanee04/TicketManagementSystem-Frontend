import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateUserRequest, User } from '../models/user.model';
import { Role } from '../models/enums';
import { PageResponse } from '../models/pagedResponse.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private backendHost = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  public getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.backendHost}/api/users/${id}`);
  }

  public getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.backendHost}/api/users`);
  }

  public createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.backendHost}/api/users`, request);
  }

  public updateUser(id: number, user: any): Observable<User> {
    return this.http.put<User>(`${this.backendHost}/api/users/${id}`, user);
  }

  public getUsersByClientName(clientName: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.backendHost}/api/users/client/${clientName}`);
  }

  public getUsersByClientId(clientId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.backendHost}/api/users/client/${clientId}`);
  }

  public getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.backendHost}/api/users/roles`);
  }

  // Pagination useCase
  public getUsersWithPagination(
    page: number = 0,
    size: number = 10
  ): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())

    return this.http.get<PageResponse<User>>(
      `${this.backendHost}/api/users`, { params }
    )
  }

  public getUsersByClientIdWithPagination(
    clientId: number,
    page: number = 0,
    size: number = 10
  ): Observable<PageResponse<User>> {
    const params = new HttpParams()

      .set('page', page.toString())
      .set('size', size.toString())

    return this.http.get<PageResponse<User>>(
      `${this.backendHost}/api/users/client/${clientId}`, { params }
    )
  }
  public searchUsersWithPagination(
    searchTerm: string,
    page: number = 0,
    size: number = 10
  ): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('searchTerm', searchTerm)
      .set('page', page.toString())
      .set('size', size.toString())

    return this.http.get<PageResponse<User>>(
      `${this.backendHost}/api/users/search`, { params }
    )
  }
}
