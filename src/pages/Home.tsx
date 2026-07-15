import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';

const HomePage = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Home</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      {/* End of navigation bar. Top and bottom. */}
      

{/* CHANGE OF STATE */}
{tripStatus === 'notstarted' && (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    }}
  >
    Home content (not started state)
      <IonButton onClick={() => setTripStatus('tripinformation')}>
      Start Trip
    </IonButton>
  </div>
)}

{tripStatus === 'tripinformation' && (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    }}
  >
    <IonInput
      placeholder="Enter destination"
      value={destinationInput}
      onIonInput={(e) => setDestinationInput(e.detail.value!)}
    />
    <IonButton onClick={() => setTripStatus('traveling')}>
      Begin
    </IonButton>
  </div>
)}

{/* Trip happening. */}
{tripStatus === 'traveling' && (
  <capacitor-google-map
    ref={mapRef}
    
    style={{
      display: 'inline-block',
      width: '100%',
      height: '100%',
    }}
  ></capacitor-google-map>
)}



{/* CHANGE OF STATE */}
{tripStatus === 'arrived' && (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    }}
  >
    You've arrived!
  </div>
)}
    </IonContent>
  </IonPage>
);

export default HomePage;
