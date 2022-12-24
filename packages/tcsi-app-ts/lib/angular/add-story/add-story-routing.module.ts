import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AddStoryComponent} from './add-story.component';
import {AuthGuard} from '../guards/auth.guard';

const routes: Routes = [{path: '', component: AddStoryComponent, canActivate: [AuthGuard]}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AddStoryRoutingModule {
}
