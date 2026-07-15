import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

<<<<<<< HEAD
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


  // Navigation bar and contents
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
>>>>>>> 37f46ced487005ef06d53ebf3fbc24924a1a6b5b

export default MapsPage;