import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon  } from '@ionic/react';
import { useHistory } from 'react-router-dom'; 
import { notificationsOutline } from 'ionicons/icons';

const MapsPage = () => {
  //History use to navigate to notifications page. 
  const history = useHistory();
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
    <IonContent>
    </IonContent>
  </IonPage>
);

};

export default MapsPage;