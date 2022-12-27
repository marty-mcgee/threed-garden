import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TermsAndConditionRoutingModule } from './terms-and-condition-routing.module';
import { TermsAndConditionComponent } from './terms-and-condition.component';


@NgModule({
  declarations: [TermsAndConditionComponent],
  imports: [
    CommonModule,
    TermsAndConditionRoutingModule
  ]
})
export class TermsAndConditionModule { }
