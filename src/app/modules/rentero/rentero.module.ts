import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RenteroRoutingModule } from './rentero-routing.module';
import { RenteroLayoutComponent } from './pages/rentero-layout/rentero-layout.component';


@NgModule({
  declarations: [
    
  
    RenteroLayoutComponent
  ],
  imports: [
    CommonModule,
    RenteroRoutingModule
  ]
})
export class RenteroModule { }
