/// <reference path="../custom-elements.d.ts" />
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


//Start of Map
const mapRef = useRef<HTMLElement>(null); // Empty box
const googleMapRef = useRef<GoogleMap | null>(null); // NEW — holds the map instance so watchPosition can update it later
const watchIdRef = useRef<string | null>(null);       // NEW — holds the watch ID so we can cancel it on cleanup

 useEffect(() => {
    if (tripStatus === 'traveling' && mapRef.current) {
      createMap();
    }

        // Stops watching the position when the component unmounts or when tripStatus changes.
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
        watchIdRef.current = null;
      }
    };
  }, [tripStatus]);


const createMap = async () => {
  if (!mapRef.current) return;

      // Asks permission to use location. Pop up.
    const permission = await Geolocation.requestPermissions();
    if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
      console.error('Location permission was not granted');
      return;
    }

    const currentPosition = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
    });

  const newMap = await GoogleMap.create({
    id: 'trip-map',
    element: mapRef.current,
    apiKey: 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI',
    config: {
        center: {
          lat: currentPosition.coords.latitude,  
          lng: currentPosition.coords.longitude, 
        },
      zoom: 8,
    },
  });

      googleMapRef.current = newMap; // NEW

          // you blue dot
    await newMap.enableCurrentLocation(true);

    // Tracking throughout; Not just showing position once.
    const watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (err || !position || !googleMapRef.current) return;

        googleMapRef.current.setCamera({
          coordinate: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          animate: true,
        });
      }
    );
    watchIdRef.current = watchId;
};
//End of Map



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

{/* CHANGE OF STATE */}
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

{/* CHANGE OF STATE */}
{tripStatus === 'traveling' && (
  <capacitor-google-map
    ref={mapRef}
    
    style={{
      display: 'inline-block',
      width: '500px',
      height: '500px',
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