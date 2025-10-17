import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-procesamiento-documento',
  templateUrl: './procesamiento-documento.component.html',
  styleUrls: ['./procesamiento-documento.component.scss']
})
export class ProcesamientoDocumentoComponent {
  @Input() mensaje: string = 'Procesando documento...';
  @Input() visible: boolean = false;
}
