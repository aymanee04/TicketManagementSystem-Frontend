import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTickets } from './new-tickets';

describe('NewTickets', () => {
  let component: NewTickets;
  let fixture: ComponentFixture<NewTickets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewTickets]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewTickets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
