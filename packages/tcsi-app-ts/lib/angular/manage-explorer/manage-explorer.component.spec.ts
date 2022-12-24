import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageExplorerComponent } from './manage-explorer.component';

describe('ManageExplorerComponent', () => {
  let component: ManageExplorerComponent;
  let fixture: ComponentFixture<ManageExplorerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageExplorerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
