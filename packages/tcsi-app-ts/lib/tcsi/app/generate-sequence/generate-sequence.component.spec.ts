import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateSequenceComponent } from './generate-sequence.component';

describe('GenerateSequenceComponent', () => {
  let component: GenerateSequenceComponent;
  let fixture: ComponentFixture<GenerateSequenceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GenerateSequenceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerateSequenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
