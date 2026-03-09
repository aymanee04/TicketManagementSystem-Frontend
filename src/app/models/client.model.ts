import { ClientStatus } from './enums';
import { User } from './user.model';

export interface Client {
    clientId: number;
    name: string;
    email: string;
    phone: string;
    company: string;
    status: ClientStatus;
    createdAt: string;
    suspensionReason?: string;
    suspendedBy?: number;
    suspendedAt?: string;
    ticketIds?: number[];
    employees?: User[];
}

export interface CreateClientRequest {
    name: string;
    email: string;
    phone: string;
    company: string;
    status?: ClientStatus;
}

export interface UpdateClientRequest {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    status?: ClientStatus;
}

export interface SuspendClientRequest {
    suspensionReason: string;
}

export interface ReactivateClientRequest {
}