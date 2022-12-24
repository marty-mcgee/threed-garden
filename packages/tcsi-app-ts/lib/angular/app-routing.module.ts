import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  /*{
    path: '**',
    component: PageNotFoundComponent
  },*/
  {path: 'add-story-group', loadChildren: () => import('./add-story-group/add-story-group.module').then(m => m.AddStoryGroupModule)},
  {path: 'view-story/:cid', loadChildren: () => import('./view-story/view-story.module').then(m => m.ViewStoryModule)},
  {path: 'library', loadChildren: () => import('./library/library.module').then(m => m.LibraryModule)},
  {
    path: 'generate-sequence/:cid',
    loadChildren: () => import('./generate-sequence/generate-sequence.module').then(m => m.GenerateSequenceModule)
  },
  {path: 'add-chapter', loadChildren: () => import('./add-chapter/add-chapter.module').then(m => m.AddChapterModule)},
  {path: 'add-story', loadChildren: () => import('./add-story/add-story.module').then(m => m.AddStoryModule)},
  {path: 'login', loadChildren: () => import('./login/login.module').then(m => m.LoginModule)},
  {path: 'customers', loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule)},
  {path: 'thank-you', loadChildren: () => import('./thank-you/thank-you.module').then(m => m.ThankYouModule)},
  {path: 'privacy-policy', loadChildren: () => import('./privacy-policy/privacy-policy.module').then(m => m.PrivacyPolicyModule)},
  {
    path: 'terms-and-condition',
    loadChildren: () => import('./terms-and-condition/terms-and-condition.module').then(m => m.TermsAndConditionModule)
  },
  {path: 'page-not-found', loadChildren: () => import('./page-not-found/page-not-found.module').then(m => m.PageNotFoundModule)},
  {path: '', loadChildren: () => import('./home/home.module').then(m => m.HomeModule)},
  {path: 'view-story', loadChildren: () => import('./view-story/view-story.module').then(m => m.ViewStoryModule)},
  {path: 'edit-sequence/:pid', loadChildren: () => import('./edit-sequence/edit-sequence.module').then(m => m.EditSequenceModule)},
  {path: 'manage-explorer', loadChildren: () => import('./manage-explorer/manage-explorer.module').then(m => m.ManageExplorerModule)},

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
