import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const MorePage = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle class="ion-text-center">More</IonTitle>
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
        More content
      </div>
    </IonContent>
  </IonPage>
);


export default MorePage;