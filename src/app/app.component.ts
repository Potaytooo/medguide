import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    try {
      await this.storage.create();
      console.log('✅ Ionic Storage initialized globally');
    } catch (err) {
      console.error('❌ Failed to initialize storage:', err);
    }
  } 
}