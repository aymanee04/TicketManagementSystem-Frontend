import { Routes } from '@angular/router';
import { Tickets } from './tickets/tickets';
import { Dashboard } from './dashboard/dashboard';
import { NewTickets } from './tickets/new-tickets/new-tickets';
import { Users } from './users/users';
import { NewUser } from './users/new-user/new-user';
import { Clients } from './clients/clients';
import { NewClient } from './clients/new-client/new-client';
import { ClientDetails } from './clients/client-details/client-details';
import { TicketDetails } from './tickets/ticket-details/ticket-details';
import { UserDetails } from './users/user-details/user-details';
import { Login } from './login/login';
import { Unauthorized } from './unauthorized/unauthorized';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [

    { path: 'login', component: Login },
    { path: 'unauthorized', component: Unauthorized },
    //protected routes
    { path: '', component: Dashboard, canActivate: [authGuard], title: 'Dashboard' },
    { path: 'clients', component: Clients, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] }, title: 'Clients' },
    { path: 'clients/new', component: NewClient, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] }, title: 'New Client' },
    { path: 'clients/:id', component: ClientDetails, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] }, title: 'Client Details' },
    { path: 'tickets', component: Tickets, canActivate: [authGuard], title: 'Tickets' },
    { path: 'tickets/new', component: NewTickets, canActivate: [authGuard, roleGuard], data: { roles: ['USER', 'MANAGER'] }, title: 'New Ticket' },
    { path: 'tickets/:id', component: TicketDetails, canActivate: [authGuard], title: 'Ticket Details' },
    { path: 'users', component: Users, canActivate: [authGuard], title: 'Users' },
    { path: "users/new", component: NewUser, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN', 'MANAGER'] }, title: 'New User' },
    { path: 'users/:id', component: UserDetails, canActivate: [authGuard], title: 'User Details' },
    //unknown routes
    { path: '**', redirectTo: '' }
];
