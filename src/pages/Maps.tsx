import React, { useRef, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline } from 'ionicons/icons';
import alertNoise from '../assets/mixkit-facility-alarm-sound-999.wav';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import './Maps.css';
import './Home.css'; // Reusing some of the deigns from here for SOS button
// SOS Button imports
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

  await setDoc(ref, {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    status: 'sos',
    updatedAt: Date.now(),
    recipientPhone: '+353838181208', 
  });
};

// Ends the SOS trip in Firestore
const endSosTrip = async () => {
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


<IonContent>
  <div className="sos-card">
    <h1 className="sos-title h1-semibold">Press for Emergency</h1>
    <p className="sos-body body-medium">
      An alert will be activated and your emergency contacts will be sent a text with your location
    </p>
  </div>

  <div className="sos-button-wrapper">
    <IonButton
      className={isAlarmActive ? 'sos-button-on' : 'sos-button-off'}
      onClick={toggleAlarm}
    >
      {isAlarmActive ? 'STOP ALARM' : 'TRIGGER SOS'}
    </IonButton>
  </div>
</IonContent>
    </IonPage>
  );

};

export default SOSPage;