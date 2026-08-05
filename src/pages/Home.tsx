/// <reference path="../custom-elements.d.ts" />
import React, {useState} from 'react';
import { useEffect, useRef } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import polyline from '@mapbox/polyline'; // Change string to corrdinates.
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput } from '@ionic/react';
import { useHistory } from 'react-router-dom'; 
import { notificationsOutline } from 'ionicons/icons';
import '../theme/global.css';
import './Home.css';

// There is 3 different states for this page. This declares each state and sets default. See bellow change of states.
type TripStatus = 'notstarted' | 'tripinformation' | 'traveling' | 'arrived';

    // Changing page when arrieve. Maths changing lat/long to meters.
const getDistanceMeters = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const HomePage = () => {
const history = useHistory(); //History use to navigate to notifications page. 
const [destinationInput, setDestinationInput] = useState('');
const [tripStatus, setTripStatus] = useState<TripStatus>('notstarted'); // Default to 'notstarted' 
const [eta, setEta] = useState('');
//Start of Map
const mapRef = useRef<HTMLElement>(null); // HTML Element.Empty box. Filled later with google maps.
const googleMapRef = useRef<GoogleMap | null>(null); // Googlemap object. Used later for directions & camera moving. Used with newmaps.
const watchIdRef = useRef<string | null>(null); // String. NEW — holds the watch ID so we can cancel it on cleanup
const destCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

// When status traveling. If the map is not created, create it. 
 useEffect(() => {
    if (tripStatus === 'traveling' && mapRef.current) { // If status traveling and does mapRef have something in box yetm
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
  if (!mapRef.current) return; //from null to current 


      // Required for Capacitor Geolocator plugin. Asks permission to use location. Pop up. requestPermission. 
    const permission = await Geolocation.requestPermissions();
    if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
      console.error('Location permission was not granted');
      return;
    }

    // getCurrentPosition API from geolocation plugin. Only retireves inital position.
    const currentPosition = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      maximumAge: 0 
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

          // Blue dot
    await newMap.enableCurrentLocation(true);


// NEW Tracking throughout; Not just showing position once.
    const watchId = await Geolocation.watchPosition(
      { 
        enableHighAccuracy: true,
       maximumAge: 0 
      },
      (position, err) => {
        if (err || !position || !googleMapRef.current) return;

        googleMapRef.current.setCamera({
          coordinate: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          animate: true,
        });


      // NEW — check if user has reached destination
  if (destCoordsRef.current) {
    const dist = getDistanceMeters(
      { lat: position.coords.latitude, lng: position.coords.longitude },
      destCoordsRef.current
    );
    if (dist < 50) {
      setTripStatus('arrived');
    }
  }
}
    );
    watchIdRef.current = watchId;
};


 // Getting directions code.
const getDirections = async (
  origin: { lat: number; lng: number },
  destination: string
) => {
  const apiKey = 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI'; 
  const originStr = `${origin.lat},${origin.lng}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json(); //Retrieving the scrambled

  if (!data.routes || data.routes.length === 0) {
    console.error('No route found', data);
    return;
  } // Error message for invalud entry.

  const route = data.routes[0];
  const points = route.overview_polyline.points;
  const etaText = route.legs[0].duration.text;
  const endLocation = route.legs[0].end_location; // { lat, lng }

  destCoordsRef.current = { lat: endLocation.lat, lng: endLocation.lng }; // Storing destination. Same with endLocation.

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
        <IonTitle>Home</IonTitle>
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
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    }}
  >
    <p>You've arrived!</p>
    <IonButton onClick={() => {
      setTripStatus('notstarted');
      setDestinationInput('');
      setEta('');
      destCoordsRef.current = null;
      googleMapRef.current = null;
    }}>
      Back to Start
    </IonButton>
  </div>
)}
    </IonContent>
  </IonPage>
);

export default HomePage;
