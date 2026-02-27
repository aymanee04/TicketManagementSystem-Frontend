import { Component, signal } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { Sidebar } from "./sidebar/sidebar";
import { Header } from './header/header';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ticket-management-system');

}
