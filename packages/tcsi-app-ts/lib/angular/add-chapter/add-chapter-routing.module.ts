import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddChapterComponent } from './add-chapter.component';

const routes: Routes = [{ path: '', component: AddChapterComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AddChapterRoutingModule { }
