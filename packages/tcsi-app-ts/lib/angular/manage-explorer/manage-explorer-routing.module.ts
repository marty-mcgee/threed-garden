import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageExplorerComponent } from './manage-explorer.component';

const routes: Routes = [{ path: '', component: ManageExplorerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManageExplorerRoutingModule { }
