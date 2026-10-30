import { auth, db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export interface EmergencyContact {
  contactId: string;
  displayName: string;
  phoneNumber: string;
  relation?: string;
  favorite?: boolean;
}

export const saveEmergencyContacts = async (list: EmergencyContact[]) => {
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(doc(db, 'users', user.uid), { emergencyContacts: list }, { merge: true });
};