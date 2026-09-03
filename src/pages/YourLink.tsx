import React, { useState, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline } from 'ionicons/icons';
import './YourLink.css';
import alertNoise from '../assets/mixkit-facility-alarm-sound-999.wav';

const YourLinkPage = () => {
  const history = useHistory();
  const [isAlarmActive, setIsAlarmActive] = useState(false);


  // Alarm function. Code retrieved from Github sound example. 
  function startAlarm() {
    const alarmSound = new Audio(alertNoise);
    alarmSound.loop = true; // loops through sound
    alarmSound.play();
    audioRef.current = alarmSound;
  };


  // 2. useRef hook. Controls pause / play of audio. 
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };


  // Button logic. Kept console.log for testing.
  const toggleAlarm = () => {
    if (isAlarmActive) {
      stopAlarmSound();
      setIsAlarmActive(false);
      console.log("Alarm Stopped!");
    } else {
      startAlarm();
      setIsAlarmActive(true);
      console.log("Alarm Started!");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="ion-text-center">Your Link</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>

        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '20px'
          }}
        >
          <IonButton
            className={isAlarmActive ? "sos-button-on" : "sos-button-off"}
            onClick={toggleAlarm}
          >
            {isAlarmActive ? "STOP ALARM" : "TRIGGER SOS"}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default YourLinkPage;