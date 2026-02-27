import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewClient } from './new-client';

describe('NewClient', () => {
  let component: NewClient;
  let fixture: ComponentFixture<NewClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewClient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewClient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
