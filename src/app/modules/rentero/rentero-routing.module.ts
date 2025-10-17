import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroRenteroComponent } from './pages/registro-rentero/registro-rentero.component';
import { RenteroLayoutComponent } from './pages/rentero-layout/rentero-layout.component';
import { FormularioPropiedadComponent } from './components/formulario-propiedad/formulario-propiedad.component';

const routes: Routes = [
  { path: 'registro', component: RegistroRenteroComponent },
  { path: '', component: RenteroLayoutComponent },  // Ruta por defecto para el layout
  { path: 'formulario/:id', component: FormularioPropiedadComponent }  // Ruta para crear/editar propiedad
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RenteroRoutingModule { }
