import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EstudianteRoutingModule } from './estudiante-routing.module';
import { HomeComponent } from './pages/home/home.component';
import { PropiedadDetalleComponent } from './pages/propiedad-detalle/propiedad-detalle.component';


@NgModule({
  declarations: [
    HomeComponent,
    PropiedadDetalleComponent
  ],
  imports: [
    CommonModule,
    EstudianteRoutingModule,
    FormsModule
  ]
})
export class EstudianteModule { }
