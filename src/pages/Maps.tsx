<<<<<<< HEAD
import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const MapsPage = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Maps</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        Maps content
      </div>
    </IonContent>
  </IonPage>
);
=======
import { Geolocation } from '@capacitor/geolocation';
import React, { useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline } from 'ionicons/icons';

const MapsPage = () => {


  //Start Navigation bar. Top and bottom.
  const history = useHistory();
  //History use to navigate to notifications page. 

  // Requesting location function
  const checkAndRequestPermissions = async () => {
    const status = await Geolocation.checkPermissions();
    console.log('Permission status:', status);
    if (status.location === 'prompt') {
      const requestStatus = await Geolocation.requestPermissions();
      console.log('Request status:', requestStatus);
    }
    else if (status.location === 'denied') {
      console.log('Permission denied - user needs to enable in Settings');
    }
  }; 

  useEffect(() => {
    checkAndRequestPermissions();
  }, []); 

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle class="ion-text-center">Maps</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      {/* End of Navigation bar */}


      <IonContent>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          Maps content
        </div>
      </IonContent>
    </IonPage>
  );
};
>>>>>>> badfbf0635016554cf88fe576c7067cd34559fdb

export default MapsPage;