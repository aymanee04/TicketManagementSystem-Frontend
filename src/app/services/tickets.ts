import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTicketRequest, Ticket } from '../models/ticket.model';
import { TicketStatus } from '../models/enums';
import { PageResponse } from '../models/pagedResponse.model';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {

  private backendHost = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  public getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.backendHost}/api/tickets`);
  }

  public getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.backendHost}/api/tickets/${id}`);
  }

  public getTicketsByStatus(status: TicketStatus): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.backendHost}/api/tickets/status/${status}`);
  }

  public getTicketsByUserId(userId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.backendHost}/api/tickets/user/${userId}`);
  }

  public getTicketsByClient(clientId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.backendHost}/api/tickets/client/${clientId}`);
  }

  public createTicket(request: CreateTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.backendHost}/api/tickets`, request);
  }

  createIncident(incident: { title: string; description: string; clientIds: number[] }): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.backendHost}/api/tickets/incident`, incident);
  }

  public getTicketsAssignedTo(userId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.backendHost}/api/tickets/assigned/${userId}`);
  }


  public uploadAttachment(ticketId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.backendHost}/api/attachments/ticket/${ticketId}`,
      formData
    );
  }

  public searchByClient(searchTerm: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      `${this.backendHost}/api/tickets/search/client?q=${encodeURIComponent(searchTerm)}`
    );
  }

  public searchTickets(searchTerm: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      `${this.backendHost}/api/tickets/search?q=${encodeURIComponent(searchTerm)}`
    );
  }

  public assignTicket(ticketId: number, userId: number): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.backendHost}/api/tickets/${ticketId}/assign`,
      { assignedToId: userId }
    );
  }

  public approveTicket(ticketId: number, managerId: number, comment: string): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.backendHost}/api/tickets/${ticketId}/approve?managerId=${managerId}`,
      { comment: comment }
    );
  }

  public rejectTicket(ticketId: number, managerId: number, comment: string): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.backendHost}/api/tickets/${ticketId}/reject?managerId=${managerId}`,
      { comment: comment }
    );
  }

  public archiveTicket(ticketId: number): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.backendHost}/api/tickets/${ticketId}/archive`,
      {}
    );
  }

  public cancelTicket(ticketId: number): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.backendHost}/api/tickets/${ticketId}/cancel`,
      {}
    );
  }

  public downloadAttachment(attachmentId: number): Observable<Blob> {
    return this.http.get(
      `${this.backendHost}/api/attachments/${attachmentId}/download`,
      {
        responseType: 'blob'
      }
    );
  }


  // Pagination useCase
  public getTicketsWithPagination(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'createdAt',
    direction: string = 'desc'
  ): Observable<PageResponse<Ticket>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    return this.http.get<PageResponse<Ticket>>(
      `${this.backendHost}/api/tickets`,
      { params }
    );
  }

  public getTicketsByStatusWithPagination(
    status: TicketStatus,
    page: number = 0,
    size: number = 10
  ): Observable<PageResponse<Ticket>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<Ticket>>(
      `${this.backendHost}/api/tickets/status/${status}`,
      { params }
    );
  }

  public searchTicketsWithPagination(
    searchTerm: string,
    page: number = 0,
    size: number = 10
  ): Observable<PageResponse<Ticket>> {
    const params = new HttpParams()
      .set('q', searchTerm)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<Ticket>>(
      `${this.backendHost}/api/tickets/search`,
      { params }
    );
  }

}