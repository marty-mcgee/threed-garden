import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStoryGroupComponent } from './add-story-group.component';

describe('AddStoryGroupComponent', () => {
  let component: AddStoryGroupComponent;
  let fixture: ComponentFixture<AddStoryGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddStoryGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStoryGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
