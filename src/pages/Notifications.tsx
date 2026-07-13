import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton } from '@ionic/react';

const NotificationsPage = () => (


    //Start of Navigation bar. Top and bottom.s
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/home" />
        </IonButtons>
        <IonTitle class="ion-text-center">Notifications</IonTitle>
      </IonToolbar>
    </IonHeader>
    {/* End of Navigation bar */}


    <IonContent>
      <div style={{ padding: '16px' }}>
        No notifications yet.
      </div>
    </IonContent>
  </IonPage>
);

export default NotificationsPage;