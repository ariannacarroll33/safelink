import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline } from 'ionicons/icons';

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


      <IonContent className="page-background">
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


export default MorePage;