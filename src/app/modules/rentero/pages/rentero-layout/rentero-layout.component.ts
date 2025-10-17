import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rentero-layout',
  templateUrl: './rentero-layout.component.html',
  styleUrl: './rentero-layout.component.scss'
})
export class RenteroLayoutComponent {

  constructor(private router: Router) {}

  navegarAFormulario(): void {
    this.router.navigate(['/rentero/formulario/nuevo']);  // Navega a formulario para creación
  }
}
