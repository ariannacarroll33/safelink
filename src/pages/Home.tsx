import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';

<<<<<<< HEAD
const HomePage = () => (
=======
const HomePage = () => {

  // Start Navigation bar. Top and bottom.
const history = useHistory();
//History use to navigate to notifications page. 
  return (   

>>>>>>> badfbf0635016554cf88fe576c7067cd34559fdb
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Home</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      {/* End of navigation bar. Top and bottom. */}


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

export default HomePage;
