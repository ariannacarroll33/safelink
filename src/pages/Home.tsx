import React, {useState} from 'react';
import { useEffect, useRef } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom'; 
import { notificationsOutline } from 'ionicons/icons';
import './Home.css';

// The different scenarios
type TripStatus = 'notstarted' | 'traveling' | 'arrived';

const HomePage = () => {
  //History use to navigate to notifications page. 
const history = useHistory();
// Requesting location status function
const [tripStatus, setTripStatus] = useState<TripStatus>('notstarted'); // Default to 'notstarted' 
const mapRef = useRef<HTMLElement>(null);

//Map
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
      

{/* Trip has not yet started. */}
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
      <IonButton onClick={() => setTripStatus('traveling')}>
      Start Trip
    </IonButton>
  </div>
)}


{/* Trip happening. */}
{tripStatus === 'traveling' && (
  // @ts-ignore
  <capacitor-google-map
    ref={mapRef}
    
    style={{
      display: 'inline-block',
      width: '100%',
      height: '100%',
    }}
  ></capacitor-google-map>
)}



{/* Trip is over */}
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