import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const MapsPage = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle class="ion-text-center">Maps</IonTitle>
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


export default MapsPage;