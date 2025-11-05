import { Injectable } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    addDoc,
    updateDoc,
    deleteDoc
} from '@angular/fire/firestore';
import { Medication } from '../models/medication';
import { Observable} from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { StorageService } from './storage.service';

@Injectable({ 
    providedIn: 'root' 
})
export class MedicationService {
    private collectionRef = collection(this.firestore, 'medications');

    constructor(
        private firestore: Firestore,
        private storage: StorageService
    ) { }


    // Create
    addMedication(med: Medication) {
        return addDoc(this.collectionRef, med);
    }

    // Read 
    getMedications(): Observable<Medication[]> {
        return collectionData(this.collectionRef, { idField: 'id' }) as Observable<Medication[]>;
    }

    // Update
    updateMedication(id: string, med: Partial<Medication>) {
        const docRef = doc(this.firestore, `medications/${id}`);
        return updateDoc(docRef, med);
    }

    // Delete
    deleteMedication(id: string) {
        const docRef = doc(this.firestore, `medications/${id}`);
        return deleteDoc(docRef);
    }
}
