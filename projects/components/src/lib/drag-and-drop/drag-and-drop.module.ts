import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NUIDragDirective } from './drag.directive';

@NgModule({
  declarations: [
    NUIDragDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    NUIDragDirective
  ]
})
export class NUIDragAndDropModule { }
