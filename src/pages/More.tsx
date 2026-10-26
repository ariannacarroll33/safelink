import React, { useState } from 'react';
import {IonContent,IonHeader,IonPage,IonTitle,IonToolbar,IonButtons,IonButton,IonIcon,IonAvatar,IonToast,IonAlert,IonList,IonItem,IonLabel,useIonViewWillEnter} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {notificationsOutline,playCircleOutline, personOutline,star,starOutline,addCircleOutline,navigateOutline,timeOutline,trashOutline,mapOutline,peopleOutline} from 'ionicons/icons';
import './YourLink.css';


import type { EmergencyContact } from './YourLink';

export interface Journey {
  journeyId: string;
  title: string;
  origin: string;
  destination: string;
  date: string;
  isHighlighted?: boolean;
  sharedWith?: string[]; // contactId with sahred contacts
}

// automatic history of routes already made 
export interface JourneyHistoryEntry {
  historyId: string;
  title: string;
  origin: string;
  destination: string;
  completedAt: string; // ISO
  sharedWith?: string[];
}

// FIREBASE INTEGRATION
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MorePage: React.FC = () => {
  const history = useHistory();

  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('User Account');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [tripHistory, setTripHistory] = useState<JourneyHistoryEntry[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showAddJourneyAlert, setShowAddJourneyAlert] = useState<boolean>(false);

  // pick contacts + selection + confirmation 
  const [draft, setDraft] = useState<Partial<Journey> | null>(null);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [journeyToConfirm, setJourneyToConfirm] = useState<Journey | null>(null);

  // FETCH USER, JOURNEYS, HISTORY & CONTACTS
  const loadUserDataAndJourneys = async () => {
    // 1. local
    try {
      const saved = localStorage.getItem('safelink_user');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.id) setUserId(p.id);
        if (p.name) setUserName(p.name);
        if (p.avatarUrl) setProfileImage(p.avatarUrl);
        if (Array.isArray(p.journeys)) setJourneys(p.journeys);
        if (Array.isArray(p.journeyHistory)) setTripHistory(p.journeyHistory);
        if (Array.isArray(p.emergencyContacts)) setContacts(p.emergencyContacts);
      }
    } catch (e) {
      console.error('Error parsing local storage user data:', e);
    }

    const savedAvatar = localStorage.getItem('avatarUrl');
    if (savedAvatar) setProfileImage(savedAvatar);

    // 2. Firestore 
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) return;
      const d = snap.data();
      setUserId(user.uid);
      if (d.name) setUserName(d.name);
      if (d.avatarUrl) setProfileImage(d.avatarUrl);
      if (Array.isArray(d.journeys) && d.journeys.length) setJourneys(d.journeys);
      if (Array.isArray(d.journeyHistory) && d.journeyHistory.length) setTripHistory(d.journeyHistory);
      if (Array.isArray(d.emergencyContacts) && d.emergencyContacts.length) setContacts(d.emergencyContacts);
    } catch (e) {
      console.error('Error fetching Firestore user data:', e);
    }
  };

  
  useIonViewWillEnter(() => {
    loadUserDataAndJourneys();
  });

  // save route --> in local and firestore 
  const persist = async (fields: Record<string, any>) => {
    const prev = JSON.parse(localStorage.getItem('safelink_user') || '{}');
    localStorage.setItem('safelink_user', JSON.stringify({ ...prev, id: prev.id || userId, ...fields }));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), fields, { merge: true });
      } catch (e) {
        console.error('Error saving to Firestore:', e);
      }
    }
  };

  const saveJourneysToStorageAndFirebase = async (updatedList: Journey[]) => {
    setJourneys(updatedList);
    await persist({ journeys: updatedList });
  };

  // 1) ADD ROUTE
  const handleAddJourney = (title: string, origin: string, destination: string) => {
    if (!title?.trim() || !destination?.trim()) {
      setToastMessage('Route name and destination are required');
      setShowToast(true);
      return;
    }
    setDraft({
      journeyId: `journey_${Date.now()}`,
      title: title.trim(),
      origin: origin?.trim() || 'Current Location',
      destination: destination.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
    setShowPicker(true);
  };

  // 2) confirm contacts: the route maintain the same with their selected contacts (they dont change) 
  const handleSaveHighlighted = async (selected: string[]) => {
    if (!draft) return;
    const journey: Journey = {
      journeyId: draft.journeyId ?? `journey_${Date.now()}`,
      title: draft.title ?? '',
      origin: draft.origin ?? 'Current Location',
      destination: draft.destination ?? '',
      date: draft.date ?? '',
      isHighlighted: true,
      sharedWith: selected, // array for firestore 
    };
    const exists = journeys.some((j) => j.journeyId === journey.journeyId);
    await saveJourneysToStorageAndFirebase(
      exists
        ? journeys.map((j) => (j.journeyId === journey.journeyId ? journey : j))
        : [journey, ...journeys]
    );
    setDraft(null);
    setToastMessage('Recurring route saved');
    setShowToast(true);
  };

  // 3) touch a highlighted route--> asks for confirmation
  const handleTapJourney = (journey: Journey) => {
    if (!journey.sharedWith || journey.sharedWith.length === 0) {
      // Ruta antigua sin contactos: primero hay que elegirlos
      setDraft(journey);
      setShowPicker(true);
      return;
    }
    setJourneyToConfirm(journey);
  };

  //  start route, share and add to history 
  const handleConfirmJourney = async () => {
    const j = journeyToConfirm;
    if (!j) return;
    const recipients = contacts.filter((c) => j.sharedWith?.includes(c.contactId));

    // Share logic
    history.push(`/map?destination=${encodeURIComponent(j.destination)}&share=${recipients.map((r) => r.contactId).join(',')}`);

    const entry: JourneyHistoryEntry = {
      historyId: `trip_${Date.now()}`,
      title: j.title,
      origin: j.origin,
      destination: j.destination,
      completedAt: new Date().toISOString(),
      sharedWith: j.sharedWith ?? [],
    };
    const updated = [entry, ...tripHistory].slice(0, 50);
    setTripHistory(updated);
    await persist({ journeyHistory: updated });
    setJourneyToConfirm(null);
  };

  const handleDeleteJourney = async (journeyId: string) => {
    const updatedList = journeys.filter((j) => j.journeyId !== journeyId);
    await saveJourneysToStorageAndFirebase(updatedList);
    setToastMessage('Journey removed');
    setShowToast(true);
  };

  const handleDeleteHistory = async (historyId: string) => {
    const updated = tripHistory.filter((t) => t.historyId !== historyId);
    setTripHistory(updated);
    await persist({ journeyHistory: updated });
  };

  // transform route into a recurrent one
  const handlePromoteHistory = (t: JourneyHistoryEntry) => {
    setDraft({
      journeyId: `journey_${Date.now()}`,
      title: t.title,
      origin: t.origin,
      destination: t.destination,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      sharedWith: t.sharedWith ?? [],
    });
    setShowPicker(true);
  };

  const nameOf = (ids?: string[]) =>
    contacts.filter((c) => ids?.includes(c.contactId)).map((c) => c.displayName);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="header-toolbar">
          <IonButtons slot="start">
            <IonAvatar className="header-avatar">
              {profileImage ? (
                <img src={profileImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="empty-avatar-circle header-empty-circle">
                  <IonIcon icon={personOutline} />
                </div>
              )}
            </IonAvatar>
          </IonButtons>
          <IonTitle className="ion-text-center header-title">More & Routes</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="yourlink-content">
        <div style={{ margin: '16px 16px 8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#633A0E', margin: 0 }}>Your Activity</h2>
            <p style={{ fontSize: '12px', color: '#7d7267', margin: 0 }}>Tap a recurring route to start and share it</p>
          </div>
          <IonButton fill="solid" onClick={() => setShowAddJourneyAlert(true)} style={{ '--background': '#633A0E', '--border-radius': '12px', fontWeight: '600' }}>
            <IonIcon slot="start" icon={addCircleOutline} />
            Add Route
          </IonButton>
        </div>

        {/* HIGHLIGHTED JOURNEYS  */}
        <div className="info-card" style={{ margin: '12px 16px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <IonIcon icon={star} style={{ fontSize: '22px', color: '#ffc107' }} />
            <strong style={{ fontSize: '16px', color: '#633A0E' }}>Highlighted Journeys</strong>
          </div>

          <IonList lines="none" style={{ background: 'transparent' }}>
            {journeys.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#7d7267', textAlign: 'center', margin: '8px 0' }}>
                No recurring routes yet. Add one or tap the star on a previous journey.
              </p>
            ) : (
              journeys.map((journey) => (
                <IonItem
                  key={journey.journeyId}
                  button
                  detail={false}
                  onClick={() => handleTapJourney(journey)}
                  style={{ '--background': '#FFFDF5', borderRadius: '12px', marginBottom: '8px', border: '1px solid #FFE699' }}
                >
                  <IonIcon slot="start" icon={star} style={{ color: '#ffc107', fontSize: '20px' }} />
                  <IonLabel>
                    <h3 style={{ fontWeight: '700', color: '#2c2117' }}>{journey.title}</h3>
                    <p style={{ color: '#7d7267', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IonIcon icon={navigateOutline} style={{ fontSize: '12px' }} />
                      {journey.origin} → {journey.destination}
                    </p>
                    <p style={{ color: '#633A0E', fontSize: '11px' }}>
                      Shares with: {nameOf(journey.sharedWith).join(', ') || 'nobody yet'}
                    </p>
                  </IonLabel>
                  <IonButton
                    slot="end"
                    fill="clear"
                    title="Edit people"
                    onClick={(e) => { e.stopPropagation(); setDraft(journey); setShowPicker(true); }}
                  >
                    <IonIcon icon={peopleOutline} style={{ fontSize: '22px', color: '#633A0E' }} />
                  </IonButton>
                  <IonButton
                    slot="end"
                    fill="clear"
                    onClick={(e) => { e.stopPropagation(); handleDeleteJourney(journey.journeyId); }}
                  >
                    <IonIcon icon={trashOutline} style={{ color: '#d32f2f' }} />
                  </IonButton>
                </IonItem>
              ))
            )}
          </IonList>
        </div>

        {/* PREVIOUS JOURNEYS  */}
        <div className="info-card" style={{ margin: '12px 16px 24px 16px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <IonIcon icon={mapOutline} style={{ fontSize: '20px', color: '#633A0E' }} />
            <strong style={{ fontSize: '16px', color: '#633A0E' }}>Previous Journeys</strong>
          </div>

          <IonList lines="none" style={{ background: 'transparent' }}>
            {tripHistory.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#7d7267', textAlign: 'center', margin: '8px 0' }}>
                No journeys yet. They will appear here after you start a route.
              </p>
            ) : (
              tripHistory.map((t) => (
                <IonItem key={t.historyId} style={{ '--background': '#f8f6f2', borderRadius: '12px', marginBottom: '8px' }}>
                  <IonLabel>
                    <h3 style={{ fontWeight: '700', color: '#2c2117' }}>{t.title}</h3>
                    <p style={{ color: '#7d7267', fontSize: '12px' }}>
                      {t.origin} → {t.destination}
                    </p>
                    <span style={{ fontSize: '11px', color: '#999', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <IonIcon icon={timeOutline} style={{ fontSize: '11px' }} />
                      {new Date(t.completedAt).toLocaleString()}
                    </span>
                  </IonLabel>
                  <IonButton slot="end" fill="clear" onClick={() => handlePromoteHistory(t)} title="Save as recurring">
                    <IonIcon icon={starOutline} style={{ color: '#ffc107' }} />
                  </IonButton>
                  <IonButton slot="end" fill="clear" onClick={() => handleDeleteHistory(t.historyId)}>
                    <IonIcon icon={trashOutline} style={{ color: '#d32f2f' }} />
                  </IonButton>
                </IonItem>
              ))
            )}
          </IonList>
        </div>

        {/* ADD ROUTE */}
        <IonAlert
          isOpen={showAddJourneyAlert}
          onDidDismiss={() => setShowAddJourneyAlert(false)}
          header="Add New Route"
          inputs={[
            { name: 'title', type: 'text', placeholder: 'Route Name (e.g. Work Commute)' },
            { name: 'origin', type: 'text', placeholder: 'Start Location' },
            { name: 'destination', type: 'text', placeholder: 'Destination' },
          ]}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Next', handler: (data) => handleAddJourney(data.title, data.origin, data.destination) },
          ]}
        />

        {/* contacts selection */}
        <IonAlert
          isOpen={showPicker}
          onDidDismiss={() => setShowPicker(false)}
          header="Share this route with"
          subHeader={draft?.title}
          message={contacts.length === 0 ? 'You have no emergency contacts yet. Add some in YourLink.' : undefined}
          inputs={contacts.map((c) => ({
            type: 'checkbox' as const,
            label: `${c.displayName} (${c.phoneNumber})`,
            value: c.contactId,
            checked: draft?.sharedWith ? draft.sharedWith.includes(c.contactId) : !!c.favorite,
          }))}
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => { setDraft(null); } },
            {
              text: 'Save',
              handler: (selected: string[]) => {
                if (!selected || selected.length === 0) {
                  setToastMessage('Select at least one contact');
                  setShowToast(true);
                  return false; // maintains alert
                }
                handleSaveHighlighted(selected);
              },
            },
          ]}
        />

        {/* Highlighted route confirmation */}
        <IonAlert
          isOpen={!!journeyToConfirm}
          onDidDismiss={() => setJourneyToConfirm(null)}
          header="Start this route?"
          message={
            journeyToConfirm
              ? `${journeyToConfirm.title}: ${journeyToConfirm.origin} → ${journeyToConfirm.destination}. Share with ${nameOf(journeyToConfirm.sharedWith).join(', ') || 'no one'}.`
              : ''
          }
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Confirm & share', handler: () => { handleConfirmJourney(); } },
          ]}
        />

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2000} />
      </IonContent>
    </IonPage>
  );
};

export default MorePage;
