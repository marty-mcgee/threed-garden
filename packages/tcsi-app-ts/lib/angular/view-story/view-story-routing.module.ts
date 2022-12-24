import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewStoryComponent } from './view-story.component';

const routes: Routes = [{ path: '', component: ViewStoryComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViewStoryRoutingModule { }
