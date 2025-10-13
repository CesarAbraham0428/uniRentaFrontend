import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroRenteroComponent } from './pages/registro-rentero/registro-rentero.component';

const routes: Routes = [
  { path: 'registro', component: RegistroRenteroComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RenteroRoutingModule { }
