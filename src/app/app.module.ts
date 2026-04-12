import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { PortfolioWorldComponent } from './portfolio-world/portfolio-world.component';

@NgModule({
  declarations: [
    AppComponent,
    PortfolioWorldComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
