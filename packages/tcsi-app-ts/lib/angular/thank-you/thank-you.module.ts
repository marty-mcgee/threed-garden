import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThankYouRoutingModule } from './thank-you-routing.module';
import { ThankYouComponent } from './thank-you.component';


@NgModule({
  declarations: [ThankYouComponent],
  imports: [
    CommonModule,
    ThankYouRoutingModule
  ]
})
export class ThankYouModule { }
