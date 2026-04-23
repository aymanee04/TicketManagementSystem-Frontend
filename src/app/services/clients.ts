import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  SuspendClientRequest
} from '../models/client.model';
import { ClientStatus } from '../models/enums';
import { PageResponse } from '../models/pagedResponse.model';
import { ErrorResponse } from '../models/ErrorResponse';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private readonly api = 'http://localhost:8080/api/clients';

  constructor(private http: HttpClient) { }

  //  Write 

  createClient(request: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(this.api, request).pipe(
      catchError(this.handleError)
    );
  }

  updateClient(id: number, request: UpdateClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.api}/${id}`, request).pipe(
      catchError(this.handleError)
    );
  }

  suspendClient(id: number, request: SuspendClientRequest): Observable<Client> {
    return this.http.put<Client>(
      `${this.api}/${id}/suspend`,
      request
    ).pipe(catchError(this.handleError));
  }

  reactivateClient(id: number): Observable<Client> {
    return this.http.put<Client>(
      `${this.api}/${id}/reactivate`,
      {}
    ).pipe(catchError(this.handleError));
  }

  //  Read - simple 

  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.api}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.api).pipe(
      catchError(this.handleError)
    );
  }

  getClientsByStatus(status: ClientStatus): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.api}/status/${status}`).pipe(
      catchError(this.handleError)
    );
  }

  //  Read - paginated 

  getClientsWithPagination(
    page = 0,
    size = 10,
    sortBy = 'name',
    direction = 'asc'
  ): Observable<PageResponse<Client>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<Client>>(this.api, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getClientsByStatusWithPagination(
    status: ClientStatus,
    page = 0,
    size = 10,
    sortBy = 'name',
    direction = 'asc'
  ): Observable<PageResponse<Client>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<Client>>(
      `${this.api}/status/${status}`, { params }
    ).pipe(catchError(this.handleError));
  }

  // ── Error handler ────────────────────────────────────────────────────────────

  private handleError(error: HttpErrorResponse): Observable<never> {
    const err: ErrorResponse = error.error;
    return throwError(() => err);
  }
}