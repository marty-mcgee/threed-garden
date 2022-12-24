import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddStoryRoutingModule } from './add-story-routing.module';
import {AddStoryComponent} from './add-story.component';
import {ReactiveFormsModule} from '@angular/forms';


@NgModule({
  declarations: [AddStoryComponent],
  imports: [
    CommonModule,
    AddStoryRoutingModule,
    ReactiveFormsModule
  ]
})
export class AddStoryModule { }
