import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

<<<<<<< HEAD
const MorePage = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>More</IonTitle>
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
=======
const MorePage = () => {

  
  //Start of Navigation bar. Top and bottom.
  const history = useHistory();
  //History use to navigate to notifications page. 
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle class="ion-text-center">More</IonTitle>
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
          More content
        </div>
      </IonContent>
    </IonPage>
  );
};
>>>>>>> badfbf0635016554cf88fe576c7067cd34559fdb


export default MorePage;