import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TermsAndConditionComponent } from './terms-and-condition.component';

const routes: Routes = [{ path: '', component: TermsAndConditionComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TermsAndConditionRoutingModule { }
