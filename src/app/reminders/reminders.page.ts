import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList,
  IonItem, IonLabel, IonButton, IonButtons, IonIcon, ViewWillEnter
} from '@ionic/angular/standalone';
import { LocalNotifications } from '@capacitor/local-notifications';
import { addIcons } from 'ionicons';
import { trash, notifications } from 'ionicons/icons';
import { ModalController, ToastController } from '@ionic/angular';
import { EditReminderModalComponent } from '../edit-reminder-modal/edit-reminder-modal.component';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.page.html',
  styleUrls: ['./reminders.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonButton, IonButtons,
    IonIcon]
})
export class RemindersPage implements ViewWillEnter {
  reminders: any[] = [];
  private cacheKey = 'reminders_cache';
  private storageReady = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private storage: Storage
  ) {
    addIcons({ trash, notifications });
    this.initStorage();
  }

  // ✅ Initialize Storage
  private async initStorage() {
    await this.storage.create();
    this.storageReady = true;
  }

  async checkPermissions() {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  }

  // ✅ Auto refresh and caching logic when entering page
  async ionViewWillEnter() {
    await this.checkPermissions();

    // 1️⃣ Load cached reminders first (instant display)
    if (!this.storageReady) await this.initStorage();
    const cached = await this.storage.get(this.cacheKey);
    if (cached && cached.length > 0) {
      this.reminders = cached;
      console.log('Loaded cached reminders:', this.reminders);
    }

    // 2️⃣ Then load actual reminders from LocalNotifications
    await this.loadReminders();
  }

  // ✅ Load and update cache
  async loadReminders() {
    const result = await LocalNotifications.getPending();
    this.reminders = result.notifications || [];

    // Update cache
    if (!this.storageReady) await this.initStorage();
    await this.storage.set(this.cacheKey, this.reminders);

    console.log('Pending reminders:', this.reminders);
  }

  async cancelReminder(id: number) {
    await LocalNotifications.cancel({ notifications: [{ id }] });
    this.reminders = this.reminders.filter(r => r.id !== id);
    await this.storage.set(this.cacheKey, this.reminders); // ✅ Update cache
  }

  async cancelAllReminders() {
    await LocalNotifications.cancel({ notifications: [] });
    this.reminders = [];
    await this.storage.set(this.cacheKey, []); // ✅ Clear cache

    const toast = document.createElement('ion-toast');
    toast.message = '🗑️ All reminders cancelled successfully.';
    toast.duration = 2500;
    toast.color = 'medium';
    document.body.appendChild(toast);
    await toast.present();
  }

  // ✅ Edit Reminder Time
  async editReminder(reminder: any) {
    const modal = await this.modalCtrl.create({
      component: EditReminderModalComponent,
      componentProps: { reminder }
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data?.newTime) {
      const newDate = new Date(data.newTime);

      // Cancel old reminder
      await LocalNotifications.cancel({ notifications: [{ id: reminder.id }] });

      // Schedule updated reminder
      await LocalNotifications.schedule({
        notifications: [
          {
            ...reminder,
            schedule: { at: newDate, repeats: true, every: 'day' }
          }
        ]
      });

      // Refresh list and update cache
      await this.loadReminders();

      // Show success toast
      const toast = await this.toastCtrl.create({
        message: `⏰ Reminder updated to ${newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        duration: 2500,
        color: 'success',
        position: 'bottom',
        cssClass: 'medguide-toast'
      });
      await toast.present();
    }
  }
}
