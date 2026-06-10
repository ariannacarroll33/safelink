import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom'; 
import { notificationsOutline } from 'ionicons/icons';
import './Home.css';

const HomePage = () => {
const history = useHistory();
  return (   

  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle class="ion-text-center">Home</IonTitle>
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
        Home content
      </div>
    </IonContent>
  </IonPage>
);
};
export default HomePage;