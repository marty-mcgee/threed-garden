import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GenerateSequenceComponent } from './generate-sequence.component';

const routes: Routes = [{ path: '', component: GenerateSequenceComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateSequenceRoutingModule { }
