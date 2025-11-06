import { Routes } from '@angular/router';
import { HomePage } from './home/home.page';

// export const routes: Routes = [
//   {
//     path: 'home',
//     loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
//   },
//   {
//     path: '',
//     redirectTo: 'home',
//     pathMatch: 'full',
//   },
// ];

export const routes: Routes = [
  {
    path: '',
    component: HomePage
  },
  {
    path: 'reminders',
    loadComponent: () => import('./reminders/reminders.page').then( m => m.RemindersPage)
  }
];