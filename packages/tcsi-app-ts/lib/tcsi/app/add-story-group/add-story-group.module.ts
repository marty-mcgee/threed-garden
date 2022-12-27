import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddStoryGroupRoutingModule } from './add-story-group-routing.module';
import { AddStoryGroupComponent } from './add-story-group.component';
import {ReactiveFormsModule} from '@angular/forms';


@NgModule({
  declarations: [AddStoryGroupComponent],
    imports: [
        CommonModule,
        AddStoryGroupRoutingModule,
        ReactiveFormsModule
    ]
})
export class AddStoryGroupModule { }
