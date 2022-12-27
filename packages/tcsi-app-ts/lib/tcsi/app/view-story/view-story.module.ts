import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ViewStoryRoutingModule} from './view-story-routing.module';
import {ViewStoryComponent} from './view-story.component';
import {CKEditorModule} from 'ckeditor4-angular';

// import { ResizableDirective } from './../resizable.directive';

@NgModule({
    declarations: [ViewStoryComponent
        // ResizableDirective
    ],
  imports: [
    CommonModule,
    ViewStoryRoutingModule,
    CKEditorModule
  ]
})
export class ViewStoryModule {
}
