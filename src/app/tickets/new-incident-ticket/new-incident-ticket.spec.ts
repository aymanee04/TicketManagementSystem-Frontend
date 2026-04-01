import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewIncidentTicket } from './new-incident-ticket';

describe('NewIncidentTicket', () => {
  let component: NewIncidentTicket;
  let fixture: ComponentFixture<NewIncidentTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewIncidentTicket]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewIncidentTicket);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
