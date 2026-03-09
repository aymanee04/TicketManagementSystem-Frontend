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
import { Profile } from './profile/profile';
import { NewIncidentTicket } from './tickets/new-incident-ticket/new-incident-ticket';
import { Layout } from './layout/layout';

export const routes: Routes = [

    { path: 'login', component: Login },
    { path: 'unauthorized', component: Unauthorized },

    {
        path: '',
        component: Layout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'clients', component: Clients, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
            { path: 'clients/new', component: NewClient },
            { path: 'clients/:id', component: ClientDetails, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
            { path: 'tickets', component: Tickets },
            { path: 'tickets/new', component: NewTickets, canActivate: [roleGuard], data: { roles: ['USER', 'MANAGER'] } },
            { path: 'tickets/new-incident', component: NewIncidentTicket, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
            { path: 'tickets/:id', component: TicketDetails },
            { path: 'user/profile', component: Profile, canActivate: [roleGuard], data: { roles: ['USER', 'MANAGER', 'ADMIN'] } },
            { path: 'users', component: Users },
            { path: 'users/new', component: NewUser, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
            { path: 'users/:id', component: UserDetails },
        ]
    },

    { path: '**', redirectTo: '' }
];
