import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Client, CreateClientRequest } from '../models/client.model';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {

  private backendHost = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  public getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.backendHost}/api/clients`);
  }

  public getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.backendHost}/api/clients/${id}`);
  }

  public createClient(request: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(`${this.backendHost}/api/clients`, request);
  }

  public updateClient(id: number, client: any): Observable<Client> {
    return this.http.put<Client>(`${this.backendHost}/api/clients/client/${id}`, client);
  }

  public getClientsByStatus(status: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.backendHost}/api/clients/status/${status}`);
  }
}
