import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddStoryGroupComponent } from './add-story-group.component';

const routes: Routes = [{ path: '', component: AddStoryGroupComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AddStoryGroupRoutingModule { }
