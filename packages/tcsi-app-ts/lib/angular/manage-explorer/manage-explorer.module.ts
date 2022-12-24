import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManageExplorerRoutingModule } from './manage-explorer-routing.module';
import { ManageExplorerComponent } from './manage-explorer.component';


@NgModule({
  declarations: [ManageExplorerComponent],
  imports: [
    CommonModule,
    ManageExplorerRoutingModule
  ]
})
export class ManageExplorerModule { }
