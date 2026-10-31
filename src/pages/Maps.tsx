import React, { useRef, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline } from 'ionicons/icons';
import alertNoise from '../assets/mixkit-facility-alarm-sound-999.wav';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import './Maps.css';
import './components.css'
import { Geolocation } from '@capacitor/geolocation';
import { doc, collection, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const SOSPage = () => {
  //History use to navigate to notifications page. 
  const history = useHistory();

  // Refs
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const sosDocRef = useRef<ReturnType<typeof doc> | null>(null); // SOS Button
  const sosWatchRef = useRef<string | null>(null); // Updating location

  // SOS ALARM
  function startAlarm() {
    const alarmSound = new Audio(alertNoise);
    alarmSound.loop = true;
    alarmSound.play();
    audioRef.current = alarmSound;

    // Start repeating vibration
    intervalRef.current = window.setInterval(() => {
      Haptics.impact({ style: ImpactStyle.Heavy });
    }, 500);
  }

  // useRef hook. Controls pause / play of audio.
  const stopAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

// SOS Button. 
const createSosTrip = async () => {
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
  const ref = doc(collection(db, 'trips'));
  sosDocRef.current = ref;

  // Resued from Home.tsx. Reads off of Snapshot. 
  await setDoc(ref, {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    status: 'sos',
    updatedAt: Date.now(),
    recipientPhone: '+353838181208',
  });

  sosWatchRef.current = await Geolocation.watchPosition(
    { enableHighAccuracy: true, maximumAge: 1000 },
    (position) => {
      if (position && sosDocRef.current) {
        updateDoc(sosDocRef.current, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          updatedAt: Date.now(),
        });
      }
    }
  );
};



// Watching live position until status changes to SOS ending. Watch and update code resued from Home.tsx
const endSosTrip = async () => {
  if (sosWatchRef.current) {
  Geolocation.clearWatch({ id: sosWatchRef.current });
  sosWatchRef.current = null;
}
  if (sosDocRef.current) {
    await updateDoc(sosDocRef.current, { status: 'sosEnded', updatedAt: Date.now() });
    sosDocRef.current = null;
  }
};


// Button logic. Kept console.log for testing.
const toggleAlarm = () => {
  if (isAlarmActive) {
    stopAlarmSound();
    setIsAlarmActive(false);
    endSosTrip();
    console.log("Alarm Stopped!");
  } else {
    startAlarm();
    setIsAlarmActive(true);
    createSosTrip();
    console.log("Alarm Started!");
  }
};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle class="ion-text-center">SOS Button</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>


<IonContent className="page-background">
  <div className="sos-page-wrapper">
    <h1 className="align-centre h1-semibold" style={{ color: 'var(--red-dark)' }}>
  Press for Emergency
</h1>
<div className="sos-box-container">
    <p className="body-medium style={{ color: 'var(--grey-600)' }" >
      An alert will be activated and your emergency contacts will be sent a text with your location
    </p>
    <IonButton
      className={isAlarmActive ? 'sos-button-on' : 'sos-button-off'}
      onClick={toggleAlarm}>
      {isAlarmActive ? 'STOP ALARM' : 'SOS'}
    </IonButton>
    </div>
  </div>
</IonContent>
    </IonPage>
  );
};

export default SOSPage;