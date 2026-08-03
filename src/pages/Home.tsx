/// <reference path="../custom-elements.d.ts" />
import React, {useState} from 'react';
import { useEffect, useRef } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import polyline from '@mapbox/polyline';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput } from '@ionic/react';
import { useHistory } from 'react-router-dom'; 
import { notificationsOutline } from 'ionicons/icons';
import '../theme/global.css';
import './Home.css';

// There is 3 different states for this page. This declares each state and sets default. See bellow change of states.
type TripStatus = 'notstarted' | 'tripinformation' | 'traveling' | 'arrived';


const HomePage = () => {
const history = useHistory(); //History use to navigate to notifications page. 
const [destinationInput, setDestinationInput] = useState('');
const [tripStatus, setTripStatus] = useState<TripStatus>('notstarted'); // Default to 'notstarted' 
const [eta, setEta] = useState('');


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

      await getDirections(
        { lat: currentPosition.coords.latitude, lng: currentPosition.coords.longitude },
        destinationInput
      );

          // you blue dot
    await newMap.enableCurrentLocation(true);


// NEW Tracking throughout; Not just showing position once.
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

const getDirections = async (
  origin: { lat: number; lng: number },
  destination: string
) => {
  const apiKey = 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI'; // use your real key
  const originStr = `${origin.lat},${origin.lng}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    console.error('No route found', data);
    return;
  }

  const route = data.routes[0];
  const points = route.overview_polyline.points;
  const etaText = route.legs[0].duration.text;

  const decodedPoints = polyline.decode(points);
  const path = decodedPoints.map(([lat, lng]) => ({ lat, lng }));

  await googleMapRef.current?.addPolylines([
    {
      path,
      strokeColor: '#2563eb',
      strokeWeight: 4,
    },
  ]);

  setEta(etaText);
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
    <IonContent className="page-background">
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
      <IonButton className="start-button" onClick={() => setTripStatus('tripinformation')}>
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