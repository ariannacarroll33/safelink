import React, { useState, useEffect } from 'react';
import {IonContent,IonHeader,IonPage,IonTitle,IonToolbar,IonButtons,IonButton,IonIcon,IonAvatar,IonToast,IonAlert,IonList,IonItem,IonLabel,useIonViewWillEnter} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {notificationsOutline,playCircleOutline, personOutline,star,starOutline,addCircleOutline,navigateOutline,timeOutline,trashOutline,mapOutline} from 'ionicons/icons';
import './YourLink.css';

export interface Journey {
  journeyId: string;
  title: string;
  origin: string;
  destination: string;
  date: string;
  isHighlighted?: boolean;
}

// FIREBASE INTEGRATION
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const MorePage: React.FC = () => {
  const history = useHistory();

  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('User Account');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);

  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showAddJourneyAlert, setShowAddJourneyAlert] = useState<boolean>(false);

  // FETCH USER & JOURNEYS
  const loadUserDataAndJourneys = async () => {
    const savedAvatar = localStorage.getItem('avatarUrl');
    if (savedAvatar) setProfileImage(savedAvatar);

    const savedSession = localStorage.getItem('safelink_user');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.id) setUserId(parsed.id);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.avatarUrl) setProfileImage(parsed.avatarUrl);
        if (parsed.journeys) setJourneys(parsed.journeys);
      } catch (e) {
        console.error('Error parsing local storage user data:', e);
      }
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.name) setUserName(data.name);
            if (data.avatarUrl) setProfileImage(data.avatarUrl);
            if (data.journeys) setJourneys(data.journeys);
          }
        } catch (e) {
          console.error('Error fetching Firestore user data:', e);
        }
      }
    });
  };

  useIonViewWillEnter(() => {
    loadUserDataAndJourneys();
  });

  useEffect(() => {
    loadUserDataAndJourneys();
  }, []);

  const saveJourneysToStorageAndFirebase = async (updatedList: Journey[]) => {
    setJourneys(updatedList);
    const savedSession = localStorage.getItem('safelink_user');
    const userData = savedSession ? JSON.parse(savedSession) : { id: userId };
    userData.journeys = updatedList;
    localStorage.setItem('safelink_user', JSON.stringify(userData));

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { journeys: updatedList });
      } catch (e) {
        console.error('Error updating journeys in Firestore:', e);
      }
    }
  };

  const handleAddJourney = async (title: string, origin: string, destination: string) => {
    if (title && destination) {
      const newJourney: Journey = {
        journeyId: `journey_${Date.now()}`,
        title: title.trim(),
        origin: origin.trim() || 'Current Location',
        destination: destination.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        isHighlighted: false
      };
      await saveJourneysToStorageAndFirebase([newJourney, ...journeys]);
      setToastMessage('Route added to history!');
      setShowToast(true);
    }
  };

  const handleToggleHighlight = async (journeyId: string) => {
    const updatedList = journeys.map((j) => j.journeyId === journeyId ? { ...j, isHighlighted: !j.isHighlighted } : j);
    await saveJourneysToStorageAndFirebase(updatedList);
    setToastMessage('Journey status updated!');
    setShowToast(true);
  };

  const handleDeleteJourney = async (journeyId: string) => {
    const updatedList = journeys.filter((j) => j.journeyId !== journeyId);
    await saveJourneysToStorageAndFirebase(updatedList);
    setToastMessage('Journey removed');
    setShowToast(true);
  };

  // REPEAT JOURNEY ACTION WHEN CLICKED
  const handleRepeatJourney = (journey: Journey) => {
    setToastMessage(`Repeating route: ${journey.title} (${journey.destination})`);
    setShowToast(true);
    // Aquí puedes redirigir a tu página de mapa o activar la ruta si tienes una ruta configurada, ej:
    // history.push(`/map?destination=${encodeURIComponent(journey.destination)}`);
  };

  const highlightedJourneys = journeys.filter((j) => j.isHighlighted);
  const previousJourneys = journeys.filter((j) => !j.isHighlighted);

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
            <p style={{ fontSize: '12px', color: '#7d7267', margin: 0 }}>Tap any route to repeat your journey</p>
          </div>
          <IonButton fill="solid" onClick={() => setShowAddJourneyAlert(true)} style={{ '--background': '#633A0E', '--border-radius': '12px', fontWeight: '600' }}>
            <IonIcon slot="start" icon={addCircleOutline} />
            Add Route
          </IonButton>
        </div>

        {/* HIGHLIGHTED JOURNEYS */}
        <div className="info-card" style={{ margin: '12px 16px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <IonIcon icon={star} style={{ fontSize: '22px', color: '#ffc107' }} />
            <strong style={{ fontSize: '16px', color: '#633A0E' }}>Highlighted Journeys</strong>
          </div>

          <IonList lines="none" style={{ background: 'transparent' }}>
            {highlightedJourneys.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#7d7267', textAlign: 'center', margin: '8px 0' }}>
                No highlighted journeys yet. Tap the star icon on any route below to pin it here!
              </p>
            ) : (
              highlightedJourneys.map((journey) => (
                <IonItem key={journey.journeyId} style={{ '--background': '#FFFDF5', borderRadius: '12px', marginBottom: '8px', border: '1px solid #FFE699' }}>
                  <IonButton fill="clear" slot="start" onClick={(e) => { e.stopPropagation(); handleToggleHighlight(journey.journeyId); }}>
                    <IonIcon icon={star} style={{ color: '#ffc107', fontSize: '20px' }} />
                  </IonButton>
                  <IonLabel onClick={() => handleRepeatJourney(journey)} style={{ cursor: 'pointer' }}>
                    <h3 style={{ fontWeight: '700', color: '#2c2117' }}>{journey.title}</h3>
                    <p style={{ color: '#7d7267', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IonIcon icon={navigateOutline} style={{ fontSize: '12px' }} />
                      {journey.origin} → {journey.destination}
                    </p>
                  </IonLabel>
                  <IonButton slot="end" fill="clear" onClick={() => handleRepeatJourney(journey)} title="Repeat Route">
                    <IonIcon icon={playCircleOutline} style={{ fontSize: '22px', color: '#633A0E' }} />
                  </IonButton>
                  <IonButton slot="end" fill="clear" onClick={() => handleDeleteJourney(journey.journeyId)}>
                    <IonIcon icon={trashOutline} style={{ color: '#d32f2f' }} />
                  </IonButton>
                </IonItem>
              ))
            )}
          </IonList>
        </div>

        {/* PREVIOUS JOURNEYS */}
        <div className="info-card" style={{ margin: '12px 16px 24px 16px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <IonIcon icon={mapOutline} style={{ fontSize: '20px', color: '#633A0E' }} />
            <strong style={{ fontSize: '16px', color: '#633A0E' }}>Previous Journeys</strong>
          </div>

          <IonList lines="none" style={{ background: 'transparent' }}>
            {previousJourneys.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#7d7267', textAlign: 'center', margin: '8px 0' }}>
                No previous routes saved.
              </p>
            ) : (
              previousJourneys.map((journey) => (
                <IonItem key={journey.journeyId} style={{ '--background': '#f8f6f2', borderRadius: '12px', marginBottom: '8px' }}>
                  <IonButton fill="clear" slot="start" onClick={(e) => { e.stopPropagation(); handleToggleHighlight(journey.journeyId); }}>
                    <IonIcon icon={starOutline} style={{ color: '#ccc', fontSize: '20px' }} />
                  </IonButton>
                  <IonLabel onClick={() => handleRepeatJourney(journey)} style={{ cursor: 'pointer' }}>
                    <h3 style={{ fontWeight: '700', color: '#2c2117' }}>{journey.title}</h3>
                    <p style={{ color: '#7d7267', fontSize: '12px' }}>
                      {journey.origin} → {journey.destination}
                    </p>
                    <span style={{ fontSize: '11px', color: '#999', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <IonIcon icon={timeOutline} style={{ fontSize: '11px' }} />
                      {journey.date}
                    </span>
                  </IonLabel>
                  <IonButton slot="end" fill="clear" onClick={() => handleRepeatJourney(journey)} title="Repeat Route">
                    <IonIcon icon={playCircleOutline} style={{ fontSize: '22px', color: '#633A0E' }} />
                  </IonButton>
                  <IonButton slot="end" fill="clear" onClick={() => handleDeleteJourney(journey.journeyId)}>
                    <IonIcon icon={trashOutline} style={{ color: '#d32f2f' }} />
                  </IonButton>
                </IonItem>
              ))
            )}
          </IonList>
        </div>

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
            { text: 'Save Route', handler: (data) => handleAddJourney(data.title, data.origin, data.destination) },
          ]}
        />

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2000} />
      </IonContent>
    </IonPage>
  );
};

export default MorePage;