import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateTicketRequest, Ticket } from '../models/ticket.model';
import { TicketStatus } from '../models/enums';
import { PageResponse } from '../models/pagedResponse.model';
import { ErrorResponse } from '../models/ErrorResponse';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {

  private readonly api = 'http://localhost:8080/api/tickets';

  constructor(private http: HttpClient) { }

  //  Create 

  createTicket(request: CreateTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(this.api, request).pipe(
      catchError(this.handleError)
    );
  }

  createIncident(request: {
    title: string;
    description: string;
    clientIds: number[];
  }): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.api}/incident`, request).pipe(
      catchError(this.handleError)
    );
  }

  //  Ticket Lifecycle (Update) 

  assignTicket(ticketId: number, assignedToId: number): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.api}/${ticketId}/assign`,
      { assignedToId }
    ).pipe(catchError(this.handleError));
  }

  approveTicket(ticketId: number, comment: string): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.api}/${ticketId}/approve`,
      { comment }
    ).pipe(catchError(this.handleError));
  }

  rejectTicket(ticketId: number, comment: string): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.api}/${ticketId}/reject`,
      { comment }
    ).pipe(catchError(this.handleError));
  }

  archiveTicket(ticketId: number): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.api}/${ticketId}/archive`,
      {}
    ).pipe(catchError(this.handleError));
  }

  cancelTicket(ticketId: number): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.api}/${ticketId}/cancel`,
      {}
    ).pipe(catchError(this.handleError));
  }

  //  Delete 

  hardDeleteTicket(ticketId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${ticketId}`).pipe(
      catchError(this.handleError)
    );
  }

  //  Read - simple 

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.api}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.api).pipe(
      catchError(this.handleError)
    );
  }

  getTicketsByStatus(status: TicketStatus): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.api}/status/${status}`).pipe(
      catchError(this.handleError)
    );
  }

  getTicketsByUserId(userId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.api}/user/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  getTicketsByClient(clientId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.api}/client/${clientId}`).pipe(
      catchError(this.handleError)
    );
  }

  getTicketsAssignedTo(userId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.api}/assigned/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  searchTickets(searchTerm: string): Observable<Ticket[]> {
    const params = new HttpParams().set('q', searchTerm);
    return this.http.get<Ticket[]>(`${this.api}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  //  Attachments 

  uploadAttachment(ticketId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.api}/attachments/ticket/${ticketId}`,
      formData
    ).pipe(catchError(this.handleError));
  }

  downloadAttachment(attachmentId: number): Observable<Blob> {
    return this.http.get(
      `${this.api}/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    ).pipe(catchError(this.handleError));
  }

  //  Read - paginated 
  // All paginated endpoints require ?page param to trigger the paginated controller method.

  getTicketsWithPagination(
    page = 0,
    size = 10,
    sortBy = 'createdAt',
    direction = 'desc'
  ): Observable<PageResponse<Ticket>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<Ticket>>(this.api, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getTicketsByStatusWithPagination(
    status: TicketStatus,
    page = 0,
    size = 10,
    sortBy = 'createdAt',
    direction = 'desc'
  ): Observable<PageResponse<Ticket>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<Ticket>>(
      `${this.api}/status/${status}`,
      { params }
    ).pipe(catchError(this.handleError));
  }

  searchTicketsWithPagination(
    searchTerm: string,
    page = 0,
    size = 10,
    sortBy = 'createdAt',
    direction = 'desc'
  ): Observable<PageResponse<Ticket>> {
    const params = new HttpParams()
      .set('q', searchTerm)
      .set('page', page)      // ?page triggers the paginated controller method
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
    return this.http.get<PageResponse<Ticket>>(
      `${this.api}/search`,
      { params }
    ).pipe(catchError(this.handleError));
  }

  //  Error handler 

  private handleError(error: HttpErrorResponse): Observable<never> {
    const err: ErrorResponse = error.error;
    return throwError(() => err);
  }
}