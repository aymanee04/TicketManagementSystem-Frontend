import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  LucideAngularModule, ChevronDown, BellIcon, PlusIcon, LoaderCircleIcon, ArrowLeft, LogOut, UserCheck, LogInIcon, User,
  LayoutDashboard, Building2, Settings, TicketsIcon, Users, Eye, EyeClosed, ArrowDownUp, Search, Inbox, ArrowRight, ChevronRight,
  Clock, List, TrendingUp, Activity, ChartPie, ChartBar, CircleCheck, CircleX, MessageSquare, Paperclip, File, Download, Archive,
  Ban, X, ChevronLeft, CircleAlert, TriangleAlert, CircleQuestionMark, PenLine, Loader, Save, UserRoundPen, Menu, PanelLeftClose,
  PanelLeftOpen, Mail, Calendar, TicketIcon, ChartColumn
} from 'lucide-angular';
import { authInterceptor } from './interceptors/auth-interceptor-interceptor';
const appIcons = {
  User, ChevronDown, BellIcon, PlusIcon, LoaderCircleIcon, ArrowLeft,
  LogOut, UserCheck, LogInIcon, LayoutDashboard, Building2, Settings, TicketsIcon, Users,
  Eye, EyeClosed, ArrowDownUp, Search, Inbox, ArrowRight, ChevronRight, Clock, List, TrendingUp,
  Activity, ChartPie, ChartBar, CircleCheck, CircleX, MessageSquare, Paperclip, File, Download,
  Archive, Ban, X, ChevronLeft, CircleAlert, TriangleAlert, CircleQuestionMark, UserRoundPen, Loader,
  Save, Menu, PanelLeftClose, PanelLeftOpen, Mail, Calendar, TicketIcon, ChartColumn
};
export const appConfig: ApplicationConfig = {

  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()), provideHttpClient(),
    importProvidersFrom(LucideAngularModule.pick(appIcons)), provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
