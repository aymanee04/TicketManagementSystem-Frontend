
export enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
    MANAGER = 'MANAGER'
}

export enum TicketStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    VALIDATED = 'VALIDATED',
    REJECTED = 'REJECTED',
    ARCHIVED = 'ARCHIVED',
    CANCELLED = 'CANCELLED',
    PENDING_VALIDATION = 'PENDING_VALIDATION'
}

export enum ClientStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED'
}
