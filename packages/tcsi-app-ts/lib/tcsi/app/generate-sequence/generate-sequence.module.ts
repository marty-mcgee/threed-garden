import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {GenerateSequenceRoutingModule} from './generate-sequence-routing.module';
import {GenerateSequenceComponent} from './generate-sequence.component';
import {ReactiveFormsModule} from '@angular/forms';
import {CKEditorModule} from 'ckeditor4-angular';

@NgModule({
  declarations: [GenerateSequenceComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenerateSequenceRoutingModule,
    CKEditorModule
  ]
})
export class GenerateSequenceModule { }
