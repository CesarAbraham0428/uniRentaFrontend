import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { PropiedadDetalleComponent } from './pages/propiedad-detalle/propiedad-detalle.component';
import { RegistroEstudianteComponent } from './pages/registro-estudiante/registro-estudiante.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'registro', component: RegistroEstudianteComponent },
  { path: 'propiedad/:id', component: PropiedadDetalleComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EstudianteRoutingModule { }
