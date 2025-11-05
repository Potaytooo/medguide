import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonInput, IonButton,
  IonButtons, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { MedicationService } from '../services/medication.service';
import { Medication } from '../models/medication';
import { Observable } from 'rxjs';
import { ModalController, AlertController } from '@ionic/angular';
import { EditModalComponent } from './edit-modal.component';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonInput, IonButton,
    IonButtons, IonIcon, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent
  ]
})
export class HomePage {
  medications$: Observable<Medication[]>;
  newMed: Medication = { name: '', dosage: '', time: '' };
  offline = !navigator.onLine;

  constructor(
    private medService: MedicationService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ create, trash });
    this.medications$ = this.medService.getMedications();

    // Detect online/offline changes
    window.addEventListener('online', () => (this.offline = false));
    window.addEventListener('offline', () => (this.offline = true));

    // ✅ Ask notification permission once
    this.requestNotificationPermission();
  }

  // ✅ Request Notification Permission
  async requestNotificationPermission() {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') {
      const alert = await this.alertCtrl.create({
        header: 'Permission Required',
        message: 'Please allow notifications to receive medication reminders.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  // ✅ Add Medication
  async addMedication() {
    if (!this.newMed.name || !this.newMed.dosage || !this.newMed.time) {
      const alert = await this.alertCtrl.create({
        header: 'Missing Information',
        message: 'Please fill in all fields before adding a medication.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    try {
      await this.medService.addMedication(this.newMed);
      await this.scheduleNotification(this.newMed);

      // const success = await this.alertCtrl.create({
      //   header: 'Added Successfully',
      //   message: `${this.newMed.name} has been added with a reminder at ${this.newMed.time}.`,
      //   buttons: ['OK']
      // });
      // await success.present();

      const toast = await this.toastCtrl.create({
        message: `💊 ${this.newMed.name} added! Reminder set for ${this.newMed.time}.`,
        duration: 3000,
        color: 'success', //success = green
        position: 'bottom',
        cssClass: 'medguide-toast success-toast',
        icon: 'checkmark-circle',
        animated: true,
        swipeGesture: 'vertical' // allows user to dismiss by swiping down
      });
      await toast.present();


      this.newMed = { name: '', dosage: '', time: '' };
    } catch (err) {
      const error = await this.alertCtrl.create({
        header: 'Error',
        message: 'Could not add medication. Try again later.',
        buttons: ['OK']
      });
      await error.present();
    }
  }

  // ✅ Schedule Local Notification
  async scheduleNotification(med: Medication) {
    try {
      const [hour, minute] = med.time.split(':').map(Number);

      // Schedule for today’s date at the chosen time
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: '💊 Medication Reminder',
            body: `Time to take ${med.name} (${med.dosage})`,
            id: Date.now(),
            schedule: { 
              repeats: true,
              every: 'day',
              at: scheduledTime },
            sound: 'default',
            smallIcon: 'ic_launcher'
          }
        ]
      });

      console.log('Notification scheduled for:', scheduledTime);

      // ✅ Add “Daily Reminder Activated” Toast
      const toast = await this.toastCtrl.create({
        message: `📅 Daily reminder set for ${med.name} at ${med.time}.`,
        duration: 3000,
        color: 'tertiary',
        position: 'bottom',
        cssClass: 'medguide-toast reminder-toast',
        icon: 'notifications',
        animated: true
      });
      await toast.present();


    } catch (error) {
      console.error('Error scheduling notification:', error);

      const errorToast = await this.toastCtrl.create({
        message: '⚠️ Failed to schedule reminder. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
        cssClass: 'medguide-toast delete-toast'
      });
      await errorToast.present();
    }
  }

  // ✅ Delete Medication
  async deleteMedication(id: string, name: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: `Delete ${name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          // handler: () => this.medService.deleteMedication(id)

          handler: async () => {
            await this.medService.deleteMedication(id);
            const toast = await this.toastCtrl.create({
              message: `${name} deleted successfully.`,
              duration: 2500,
              color: 'light',
              position: 'bottom',
              cssClass: 'medguide-toast delete-toast',
              icon: 'trash',
              animated: true
            });
            await toast.present();
          }
        }]
    });
    await alert.present();
  }

  // ✅ Edit Modal
  async openEditModal(med: Medication) {
    const modal = await this.modalCtrl.create({
      component: EditModalComponent,
      componentProps: { medication: med }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data) {
      await this.medService.updateMedication(med.id!, data);
      const alert = await this.alertCtrl.create({
        header: 'Updated',
        message: `${data.name} has been updated successfully.`,
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}
