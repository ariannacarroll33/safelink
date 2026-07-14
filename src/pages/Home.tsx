import React, {useState} from 'react';
import { useEffect, useRef } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput } from '@ionic/react';
import { useHistory } from 'react-router-dom'; 
import { notificationsOutline } from 'ionicons/icons';
import './Home.css';

// There is 3 different states for this page. This declares each state and sets default. See bellow change of states.
type TripStatus = 'notstarted' | 'tripinformation' | 'traveling' | 'arrived';


const HomePage = () => {
const history = useHistory(); //History use to navigate to notifications page. 
const [destinationInput, setDestinationInput] = useState('');
const [tripStatus, setTripStatus] = useState<TripStatus>('notstarted'); // Default to 'notstarted' 

//Map
const mapRef = useRef<HTMLElement>(null); // Empty box
 useEffect(() => {
    if (tripStatus === 'traveling' && mapRef.current) {
      createMap();
    }
  }, [tripStatus]);

  const createMap = async () => {
    const position = await Geolocation.getCurrentPosition();

    const newMap = await GoogleMap.create({
      id: 'trip-map',
      element: mapRef.current!,
      apiKey: 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI',
      config: {
        center: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        zoom: 15,
      },
    });
      await newMap.addMarker({
    coordinate: {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    },
    title: 'You',
  });
};


  return (   

    //Start navigation
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
};


export default HomePage;