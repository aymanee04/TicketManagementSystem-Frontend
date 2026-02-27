import { Role } from './enums';

export interface User {
    userId: number;
    name: string;
    jobTitle: string;
    email: string;
    roles: Role[];
    clientId?: number;
    clientName?: string;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    jobTitle: string;
    password: string;
    roles?: Role[];
    clientId?: number;
}