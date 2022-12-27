import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {AddChapterRoutingModule} from './add-chapter-routing.module';
import {AddChapterComponent} from './add-chapter.component';
import {ReactiveFormsModule} from '@angular/forms';


@NgModule({
    declarations: [AddChapterComponent],
    imports: [
        CommonModule,
        AddChapterRoutingModule,
        ReactiveFormsModule
    ]
})
export class AddChapterModule {
}
