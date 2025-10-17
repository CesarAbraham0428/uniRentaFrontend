import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { RenteroRoutingModule } from './rentero-routing.module';
import { RenteroLayoutComponent } from './pages/rentero-layout/rentero-layout.component';
import { RegistroRenteroComponent } from './pages/registro-rentero/registro-rentero.component';
import { FormularioPropiedadComponent } from './components/formulario-propiedad/formulario-propiedad.component';


@NgModule({
  declarations: [
    
    
    RenteroLayoutComponent,
    RegistroRenteroComponent,
    FormularioPropiedadComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RenteroRoutingModule
  ]
})
export class RenteroModule { }
