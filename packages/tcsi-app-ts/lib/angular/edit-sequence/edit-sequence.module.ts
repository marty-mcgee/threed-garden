import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {EditSequenceRoutingModule} from './edit-sequence-routing.module';
import {EditSequenceComponent} from './edit-sequence.component';
import {ReactiveFormsModule} from '@angular/forms';
import {CKEditorModule} from 'ckeditor4-angular';

// import { ResizableDirective } from './../resizable.directive';

@NgModule({
    declarations: [EditSequenceComponent,
        // ResizableDirective
    ],
  imports: [
    CommonModule,
    EditSequenceRoutingModule,
    ReactiveFormsModule,
    CKEditorModule
  ]
})
export class EditSequenceModule {
}
