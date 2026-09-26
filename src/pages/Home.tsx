/// <reference path="../custom-elements.d.ts" />
import React, {useState} from 'react';
import { useEffect, useRef } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import polyline from '@mapbox/polyline'; // Change string to corrdinates.
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonInput } from '@ionic/react';
import { useHistory } from 'react-router-dom'; 
import { notificationsOutline } from 'ionicons/icons';
import { collection, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { setDoc } from 'firebase/firestore';
import { updateDoc } from 'firebase/firestore';
//import '../theme/global.css';
//import '../theme/colours.css';
import './Home.css';
import './components.css';

// FIREBASE INTEGRATION
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, DocumentReference, DocumentData } from 'firebase/firestore';

// Capacitor Contacts plugin import
import { Contacts } from '@capacitor-community/contacts';

type TripStatus = 'notstarted' | 'tripinformation' | 'traveling' | 'arrived';

interface ContactItem {
  contactId: string;
  displayName: string;
  phoneNumber?: string;
  fcmToken?: string; // FCM Token for Push Notifications
  selected: boolean;
}

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
const [tripLink, setTripLink] = useState('');

// Dropdown 
const [predictions, setPredictions] = useState<{ description: string; place_id: string }[]>([]);
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//Start of Map
const mapRef = useRef<HTMLElement>(null); // HTML Element.Empty box. Filled later with google maps.
const googleMapRef = useRef<GoogleMap | null>(null); // Googlemap object. Used later for directions & camera moving. Used with newmaps.
const watchIdRef = useRef<string | null>(null); // String. NEW — holds the watch ID so we can cancel it on cleanup
const destCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
const tripDocRef = useRef<ReturnType<typeof doc> | null>(null); // Holds firestore trip
// Polyline Refs
const polylineIdsRef = useRef<string[]>([]);
const routePathRef = useRef<{ lat: number; lng: number }[]>([]);
const routeIndexRef = useRef(0);

// When status traveling. If the map is not created, create it. 
 useEffect(() => {
    if (tripStatus === 'traveling' && mapRef.current) { 
      const newTripRef = doc(collection(db, 'trips'));
    tripDocRef.current = newTripRef; // Store trip for later
      // If status traveling and does mapRef have something in box yetm
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

    // NEW — fetch predicted destinations from Google Places Autocomplete
const fetchPredictions = async (input: string) => {
  if (!input.trim()) {
    setPredictions([]);
    return;
  }
  const apiKey = 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI';
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();
  setPredictions(data.status === 'OK' ? data.predictions : []);
};

// NEW — debounce so we don't fetch on every keystroke
const handleDestinationChange = (value: string) => {
  setDestinationInput(value);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => fetchPredictions(value), 300);
};

const createMap = async () => {
  if (!mapRef.current) return; //from null to current 


  const useFallbackContacts = () => {
    setContacts([
      { contactId: '1', displayName: 'Alex Johnson', phoneNumber: '+1 555-0199', selected: false },
      { contactId: '2', displayName: 'Emily Davis', phoneNumber: '+1 555-0142', selected: false },
      { contactId: '3', displayName: 'Michael Brown', phoneNumber: '+1 555-0188', selected: false },
      { contactId: '4', displayName: 'Sarah Wilson', phoneNumber: '+1 555-0123', selected: false },
    ]);
  };

  const fetchPredictions = async (input: string) => {
    if (!input.trim()) {
      setPredictions([]);
      return;
    }
    const apiKey = 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI';
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();
    setPredictions(data.status === 'OK' ? data.predictions : []);
  };

  const handleDestinationChange = (value: string) => {
    setDestinationInput(value);
    setIsDestinationSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(value), 300);
  };

  const toggleContactSelection = (contactId: string) => {
    setContacts((prev) =>
      prev.map((item) =>
        item.contactId === contactId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  // --- BEGIN TRIP (FIRESTORE TRIGGER FOR PUSH NOTIFICATION) ---
  const handleBeginTrip = async () => {
    const selectedContacts = contacts.filter((c) => c.selected);
    const tripId = `trip_${Date.now()}`;
    
    // Extract recipient FCM tokens for Push Notifications
    const recipientTokens: string[] = selectedContacts
      .map((c) => c.fcmToken)
      .filter((token): token is string => Boolean(token));

    // Reference to Firestore Document
    const tripRef = doc(db, 'trips', tripId);
    tripDocRef.current = tripRef;

    try {
      // Writing to 'trips' fires Cloud Function 'onTripCreated'
      await setDoc(tripRef, {
        tripId,
        userName: userName || 'SafeLink User',
        destination: destinationInput,
        status: 'traveling',
        recipientTokens,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Error saving trip to Firestore:', err);
    }

    const generatedLink = `https://yourdomain.com/track?tripId=${tripId}`;
    setShareableLink(generatedLink);

    if (navigator.share && selectedContacts.length > 0) {
      try {
        await navigator.share({
          title: 'Follow My Route',
          text: `I am sharing my live route to ${destinationInput}. Follow along here:`,
          url: generatedLink,
        });
      } catch (e) {
        console.log('Share prompt dismissed or unsupported');
      }
    }

    setTripStatus('traveling');
  };

  // --- ARRIVED / END TRIP (FIRESTORE TRIGGER FOR ARRIVAL NOTIFICATION) ---
  const handleEndTrip = async () => {
    if (tripDocRef.current) {
      try {
        // Updating status to 'arrived' fires Cloud Function 'onTripStatusUpdated'
        await updateDoc(tripDocRef.current, {
          status: 'arrived',
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.error('Error updating trip arrival:', err);
      }
    }
    setTripStatus('arrived');
  };

  const createMap = async () => {
    if (!mapRef.current) return;

      // Required for Capacitor Geolocator plugin. Asks permission to use location. Pop up. requestPermission. 
    const permission = await Geolocation.requestPermissions();
    if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
      console.error('Location permission was not granted');
      return;
    }

    // getCurrentPosition API from geolocation plugin. Only retireves inital position.
    const currentPosition = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000 
    });

    // Storing trip in firestore.
    if (tripDocRef.current) {
    await setDoc(tripDocRef.current, {
      lat: currentPosition.coords.latitude,
      lng: currentPosition.coords.longitude,
      destination: destinationInput,
      status: 'traveling',
      updatedAt: Date.now(),
    });
  }

   if (tripDocRef.current) {
    setTripLink(`https://safelink-2acc5.web.app/watch/${tripDocRef.current.id}`); // URL link for safelink-watcher
  }

  const newMap = await GoogleMap.create({
    id: 'trip-map',
    element: mapRef.current,
    apiKey: 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI',
    config: {
        center: {
          lat: currentPosition.coords.latitude,  
          lng: currentPosition.coords.longitude, 
        },
      zoom: 18,
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
       maximumAge: 1000 
      },
      (position, err) => {
        if (err) { console.error('watchPosition error', err); return; }
        if (!position || !googleMapRef.current) return;

        // Update Firestore with new position
        if (tripDocRef.current) {
          updateDoc(tripDocRef.current, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            updatedAt: Date.now(),
          });
        }

        googleMapRef.current.setCamera({
          coordinate: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          zoom: 18,
          animate: true,
        });

        const currentPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        const path = routePathRef.current;
        let idx = routeIndexRef.current;

        while (idx < path.length - 1 && getDistanceMeters(currentPos, path[idx]) < 10) {
          idx++;
        }

        if (idx > routeIndexRef.current) {
          routeIndexRef.current = idx;

          (async () => {
            if (polylineIdsRef.current.length) {
              await googleMapRef.current!.removePolylines(polylineIdsRef.current);
            }
            const newIds = await googleMapRef.current!.addPolylines([
              { path: path.slice(idx), strokeColor: '#2563eb', strokeWeight: 4 },
            ]);
            polylineIdsRef.current = newIds ?? [];
          })();
        }

        if (destCoordsRef.current) {
          const dist = getDistanceMeters(
            { lat: position.coords.latitude, lng: position.coords.longitude },
            destCoordsRef.current
          );
          if (dist < 50) {
            handleEndTrip();
          }
        }
      }
    }
  }
}
    );
    watchIdRef.current = watchId;
  };

  const getDirections = async (
    origin: { lat: number; lng: number },
    destination: string
  ) => {
    const apiKey = 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI';
    const originStr = `${origin.lat},${origin.lng}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${encodeURIComponent(
      destination
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error('No route found', data);
      return;
    }

    const route = data.routes[0];
    const points = route.overview_polyline.points;
    const etaText = route.legs[0].duration.text;
    const endLocation = route.legs[0].end_location;

    destCoordsRef.current = { lat: endLocation.lat, lng: endLocation.lng };

    const decodedPoints = polyline.decode(points);
    const path = decodedPoints.map(([lat, lng]) => ({ lat, lng }));

    routePathRef.current = path;
    routeIndexRef.current = 0;

    const ids = await googleMapRef.current?.addPolylines([
      {
        path,
        strokeColor: '#2563eb',
        strokeWeight: 4,
      },
    ]);
    if (ids) polylineIdsRef.current = ids;

    setEta(etaText);
  };

  const filteredContacts = contacts.filter((c) =>
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phoneNumber && c.phoneNumber.includes(searchQuery))
  );

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#FFFFFF', '--border-width': '0' }}>
          <IonButtons slot="start" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
            <IonAvatar 
              style={{ width: '36px', height: '36px', cursor: 'pointer' }}
              onClick={() => history.push('/tabs/yourlink')}
            >
              {profileImage ? (
                <img src={profileImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#E6A937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  <IonIcon icon={personOutline} style={{ fontSize: '18px' }} />
                </div>
              )}
            </IonAvatar>

            <span style={{ fontSize: '14px', color: '#633A0E', fontWeight: '700', whiteSpace: 'nowrap' }}>
              {userName}
            </span>
          </IonButtons>

          <IonTitle style={{ color: '#633A0E', fontWeight: '800', fontSize: '18px', textAlign: 'center' }}>
            SafeLink
          </IonTitle>

          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} style={{ color: '#633A0E', fontSize: '22px' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="page-background">
        {tripStatus === 'notstarted' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <IonButton
              className="start-button"
              onClick={() => setTripStatus('tripinformation')}
            >
              Start Trip test
            </IonButton>
          </div>
        )}

        {tripStatus === 'tripinformation' && (
          <div
            style={{
              marginTop: 24,
              marginRight: 16,
              marginLeft: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div className="box-container">
              <div className="box-container-text">
                <span
                  className="mini-text"
                  style={{ color: 'var(--yellow-700)' }}
                >
                  Mandatory
                </span>
                <span
                  className="field-label h5-medium"
                  style={{ color: 'var(--yellow-700)' }}
                >
                  My Destination
                </span>
              </div>
              <div className="field-box">
                <IonInput
                  placeholder="Enter destination"
                  value={destinationInput}
                  onIonInput={(e) => handleDestinationChange(e.detail.value!)}
                />

                {predictions.length > 0 && (
                  <div className="prediction-list">
                    {predictions.map((p) => (
                      <div
                        key={p.place_id}
                        className="prediction-item"
                        onClick={() => {
                          setDestinationInput(p.description);
                          setIsDestinationSelected(true);
                          setPredictions([]);
                        }}
                      >
                        {p.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isDestinationSelected && (
              <div
                className="box-container"
                style={{ marginTop: 20, width: '100%' }}
              >
                <div className="box-container-text">
                  <span className="field-label h5-medium">
                    Share Route With
                  </span>
                </div>

                <div className="field-box" style={{ marginTop: 8, marginBottom: 8 }}>
                  <IonInput
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onIonInput={(e) => setSearchQuery(e.detail.value!)}
                  >
                    <IonIcon icon={searchOutline} slot="start" style={{ marginLeft: 8 }} />
                  </IonInput>
                </div>

                <IonList style={{ maxHeight: '200px', overflowY: 'auto', borderRadius: '8px' }}>
                  {filteredContacts.length === 0 ? (
                    <IonItem>
                      <IonLabel style={{ textAlign: 'center', color: '#666' }}>
                        No contacts found
                      </IonLabel>
                    </IonItem>
                  ) : (
                    filteredContacts.map((c) => (
                      <IonItem key={c.contactId}>
                        <IonLabel>
                          <h2>{c.displayName}</h2>
                          <p>{c.phoneNumber}</p>
                        </IonLabel>
                        <IonCheckbox
                          slot="end"
                          checked={c.selected}
                          onIonChange={() => toggleContactSelection(c.contactId)}
                        />
                      </IonItem>
                    ))
                  )}
                </IonList>
              </div>
            )}

            <IonButton
              className="large-button"
              disabled={!isDestinationSelected}
              onClick={handleBeginTrip}
              style={{ marginTop: 20 }}
            >
              Begin
            </IonButton>
          </div>
        )}

        {tripStatus === 'traveling' && (
          <div>
            <div
              style={{
                margin: '16px',
                padding: '0px',
                backgroundColor: 'var(--white)',
                border: '2px solid var(--yellow-700)',
                borderRadius: '12px',
                boxSizing: 'border-box',
              }}
            >
              <capacitor-google-map
                ref={mapRef}
                style={{
                  display: 'block',
                  width: '100%',
                  height: '400px',
                }}
              ></capacitor-google-map>
            </div>

            {shareableLink && (
              <div style={{ padding: '0 16px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  Alternative Web Tracking Link:
                </p>
                <code style={{ fontSize: '11px', display: 'block', marginBottom: 10 }}>
                  {shareableLink}
                </code>
              </div>
            )}

            <IonButton
              className="large-button"
              onClick={handleEndTrip}
              style={{ margin: '16px' }}
            >
              End Trip
            </IonButton>
          </div>
        )}

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
            <IonButton
              onClick={() => {
                setTripStatus('notstarted');
                setDestinationInput('');
                setIsDestinationSelected(false);
                setContacts([]);
                setSearchQuery('');
                setEta('');
                destCoordsRef.current = null;
                googleMapRef.current = null;
                tripDocRef.current = null;
              }}
            >
              Back to Start
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
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

  // Storing destinations long/lat for Safelink-Watcher
if (tripDocRef.current) {
  updateDoc(tripDocRef.current, {
    destLat: endLocation.lat,
    destLng: endLocation.lng,
  });
}

  const decodedPoints = polyline.decode(points);
  const path = decodedPoints.map(([lat, lng]) => ({ lat, lng }));

    // store path
    routePathRef.current = path;
  routeIndexRef.current = 0;

  const ids = await googleMapRef.current?.addPolylines([
    {
      path,
      strokeColor: '#2563eb',
      strokeWeight: 4,
    },
  ]);
  if (ids) polylineIdsRef.current = ids;

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
      Start Trip test
    </IonButton>
  </div>
)}

{/* CHANGE OF STATE */}
{tripStatus === 'tripinformation' && (
  <div style={{ marginTop: 24, marginRight: 16, marginLeft: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div className="box-container">
      <div className="box-container-text">
  <span className="mini-text" style={{ color: 'var(--yellow-700)' }}>
  Mandatory
</span>
  <span className="field-label h5-medium" style={{ color: 'var(--yellow-700)' }}>
    When I arrive
  </span>
  </div>
  <div className="field-box">
  <IonInput 
    placeholder="Enter destination"
    value={destinationInput}
    onIonInput={(e) => handleDestinationChange(e.detail.value!)}
  />


        {/* NEW — predicted destination dropdown */}
    {predictions.length > 0 && (
      <div className="prediction-list">
        {predictions.map((p) => (
          <div
            key={p.place_id}
            className="prediction-item"
            onClick={() => {
              setDestinationInput(p.description);
              setPredictions([]);
            }}
          >
            {p.description}
          </div>
        ))}
      </div>
    )}
    </div>
    </div>
    <IonButton className="large-button" onClick={() => setTripStatus('traveling')}>
      Begin
    </IonButton>
  </div>
)}


{/* CHANGE OF STATE */}
{tripStatus === 'traveling' && (
  <div>
    <div
      style={{
        margin: '16px',
        padding: '0px',
        backgroundColor: 'var(--white)',
        border: '2px solid var(--yellow-700)',
        borderRadius: '12px',
        boxSizing: 'border-box',
      }}
    >
      <capacitor-google-map
        ref={mapRef}
        style={{
          display: 'block',
          width: '100%',
          height: '400px',
        }}
      ></capacitor-google-map>
    </div>

<IonButton 
  className="large-button" 
  onClick={() => {
    setTripStatus('arrived');
    if (tripDocRef.current) {
      updateDoc(tripDocRef.current, { status: 'arrived' });
    }
  }}
  style={{ margin: '16px' }}
>
  End Trip
</IonButton>
  </div>
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
}

export default HomePage;
