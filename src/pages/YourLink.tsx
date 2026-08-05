import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const YourLinkPage = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Your Link</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className="page-background">
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

export default YourLinkPage;