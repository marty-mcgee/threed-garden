import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {HomeComponent} from './home.component';
import {ValidateTokenResolverService} from '../resolver/validate-token-resolver.service';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    /*resolve: {
      'validate-token': ValidateTokenResolverService
    }*/
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {
}
