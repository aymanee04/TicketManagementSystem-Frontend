import { TicketStatus } from './enums';
import { Attachment } from './attachment.model';

export interface Ticket {
    ticketId: number;
    title: string;
    description: string;
    status: TicketStatus;
    createdAt: string;
    updatedAt?: string;
    validatedAt?: string;
    validationComment?: string;
    createdById: number;
    createdByName: string;
    assignedToId?: number;
    assignedToName?: string;
    validatedById?: number;
    attachments: Attachment[];
    clientIds: number;
    clientName: string[];
}

export interface CreateTicketRequest {
    title: string;
    description: string;
    createdById: number;
}