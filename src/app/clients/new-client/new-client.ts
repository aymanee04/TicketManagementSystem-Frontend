import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientsService } from '../../services/clients';
import { Router } from '@angular/router';
import { ClientStatus } from '../../models/enums';
import { CreateClientRequest } from '../../models/client.model';

@Component({
  selector: 'app-new-client',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-client.html',
  styleUrl: './new-client.css',
})
export class NewClient implements OnInit {
  clientForm!: FormGroup;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private clientsService: ClientsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      company: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      status: [ClientStatus.ACTIVE, [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.clientForm.value;
    const request: CreateClientRequest = {
      name: formValue.name,
      company: formValue.company,
      email: formValue.email,
      phone: formValue.phone,
      status: formValue.status
    };

    this.clientsService.createClient(request).subscribe({
      next: (createdClient) => {
        console.log('Client created successfully:', createdClient);
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        console.error('Error creating client:', err);
        this.error = err.error?.message || 'Failed to create client. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/clients']);
  }

  get name() {
    return this.clientForm.get('name');
  }

  get company() {
    return this.clientForm.get('company');
  }

  get email() {
    return this.clientForm.get('email');
  }

  get phone() {
    return this.clientForm.get('phone');
  }

  get status() {
    return this.clientForm.get('status');
  }
}
