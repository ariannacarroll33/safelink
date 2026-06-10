import React from 'react';
<<<<<<< HEAD
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const YourLinkPage = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Your Link</IonTitle>
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
        Your Link content
      </div>
    </IonContent>
  </IonPage>
);

=======
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline } from 'ionicons/icons';

const YourLinkPage = () => {
  //History use to navigate to notifications page. 
  const history = useHistory();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle class="ion-text-center">Your Link</IonTitle>
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
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          Your Link content
        </div>
      </IonContent>
    </IonPage>
  );
};
>>>>>>> 1c3ce5dc39c4e3200a581da951bfdfa2d32e91a3

export default YourLinkPage;