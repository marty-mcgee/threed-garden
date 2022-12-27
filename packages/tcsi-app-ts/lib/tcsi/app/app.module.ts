import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HeaderComponent} from './header/header.component';
import {LoaderComponent} from './loader/loader.component';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ErrorPageComponent} from './error-page/error-page.component';
import {ValidateTokenResolverService} from './resolver/validate-token-resolver.service';
import {PopUpComponent} from './pop-up/pop-up.component';
import {CKEditorModule} from 'ckeditor4-angular';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoaderComponent,
    ErrorPageComponent,
    PopUpComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    CKEditorModule
  ],
  providers: [
    ValidateTokenResolverService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
