import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { FileUploadComponent } from './file-upload/file-upload.component';

@NgModule({
  declarations: [
    FileUploadComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    FileUploadComponent
  ]
})
export class UploadModule {}
