/// <reference path="../custom-elements.d.ts" />
import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import polyline from '@mapbox/polyline'; // Change string to corrdinates. 
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonInput, IonCheckbox, IonList, IonItem, IonLabel, IonAvatar, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline, searchOutline, personOutline, walkOutline, bicycleOutline, carOutline, busOutline } from 'ionicons/icons';
import './Home.css';
import './components.css';

// FIREBASE INTEGRATION
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, collection, getDoc, setDoc, updateDoc, DocumentReference, DocumentData } from 'firebase/firestore';

// Capacitor Contacts plugin import
import { Contacts } from '@capacitor-community/contacts';


type TripStatus = 'notstarted' | 'tripinformation' | 'traveling' | 'arrived'; // Different states used on the trip.
type TransportMode = 'walking' | 'bicycling' | 'driving' | 'transit'; // Modes of transport. Used when set up trip.

interface ContactItem {
  contactId: string;
  displayName: string;
  phoneNumber?: string;
  selected: boolean;
}

// Changing page when arrieve. Maths changing lat/long to meters. 
// This calculation was taken from https://www.geeksforgeeks.org/dsa/haversine-formula-to-find-distance-between-two-points-on-a-sphere/
const getDistanceMeters = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Converting numbers to Irish format (ie. +353)
const toE164 = (raw: string, defaultCountryCode = '353'): string => {
  let num = raw.replace(/[^\d+]/g, '');
  if (num.startsWith('00')) num = '+' + num.slice(2);
  if (num.startsWith('+')) return num;
  if (num.startsWith('0')) num = num.slice(1);
  return `+${defaultCountryCode}${num}`;
};

const HomePage = () => {
  const history = useHistory(); //History use to navigate to notifications page.  
  const [destinationInput, setDestinationInput] = useState('');
  const [tripStatus, setTripStatus] = useState<TripStatus>('notstarted'); // Default state to 'notstarted'  
  const [eta, setEta] = useState('');
  const [tripLink, setTripLink] = useState('');
  const [transportMode, setTransportMode] = useState<TransportMode | null>(null); // Nothing selected for public transport by deafult.

  // User Profile State
  const [userName, setUserName] = useState<string>('User');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Dropdown menu for predicted destinations.  
  const [predictions, setPredictions] = useState<{ description: string; place_id: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if destination is selected to show contacts step
  const [isDestinationSelected, setIsDestinationSelected] = useState(false);

  // Contacts state management & Search Filter
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareableLink, setShareableLink] = useState('');

  // Const used to store info on maps. Create maps and watch position. 
  const mapRef = useRef<HTMLElement>(null); // HTML Element.Empty box. Filled later with google maps.
  const googleMapRef = useRef<GoogleMap | null>(null); // Googlemap object. Used later for directions & camera moving. Used with newmaps.
  const watchIdRef = useRef<string | null>(null); // String. Holds the watch ID so we can cancel it on cleanup
  const destCoordsRef = useRef<{ lat: number; lng: number } | null>(null); // Stores destination coordinates
  const tripDocRef = useRef<ReturnType<typeof doc> | null>(null); // Stores firestore trip 
  const recipientPhoneRef = useRef<string | null>(null); // Stores selected contact information


  // Polyline Refs
  const polylineIdsRef = useRef<string[]>([]);
  const routePathRef = useRef<{ lat: number; lng: number }[]>([]);
  const routeIndexRef = useRef(0);


  // Start Laura code. Contact & Search. 
  // Synchronized Profile Fetching --> basically that recoginzes the log in
  const fetchUserProfile = () => {
    // 1. Prioritize LocalStorage uploaded avatar and saved user object
    const savedAvatar = localStorage.getItem('avatarUrl');
    if (savedAvatar) {
      setProfileImage(savedAvatar);
    }

    const savedUserSession = localStorage.getItem('safelink_user');
    if (savedUserSession) {
      try {
        const parsed = JSON.parse(savedUserSession);
        if (parsed.name || parsed.fullName) setUserName(parsed.name || parsed.fullName);
        if (parsed.avatarUrl) setProfileImage(parsed.avatarUrl);
      } catch (e) {
        console.error('Error parsing local user:', e);
      }
    }

    // Sync with Firestore DB (default photo with app avatar)
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.name) setUserName(data.name);
            // Always prefer app avatarUrl over Google Auth photoURL
            if (data.avatarUrl) {
              setProfileImage(data.avatarUrl);
              localStorage.setItem('avatarUrl', data.avatarUrl);
            }
          }
        } catch (err) {
          console.error('Error fetching profile on Home:', err);
        }
      }
    });
  };
  // Refresh user profile whenever the Ionic view is entered/navigated
  useIonViewWillEnter(() => {
    fetchUserProfile();
  });
  // Global listeners to re-fetch profile on custom updates 
  useEffect(() => {
    fetchUserProfile();

    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('safelink_user_updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('safelink_user_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);
  // End Laura code. Contact & Search. 


  // When status traveling. If the map is not created, create it.  
  useEffect(() => {
    if (tripStatus === 'traveling' && mapRef.current) {
      const newTripRef = doc(collection(db, 'trips'));
      tripDocRef.current = newTripRef; // Store trip for later 
      createMap();
    }

    // Stops watching the position when the component deactivates or when tripStatus changes. 
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
        watchIdRef.current = null;
      }
    };
  }, [tripStatus]);

  // Contacts: request permission of device to access contacts and load them (making them visible) //Arianna edit: I added the contacts.length === 0 check to avoid reloading contacts if they are already loaded.
  useEffect(() => {
    if (tripStatus === 'tripinformation' && contacts.length === 0) {
      loadDeviceContacts();
    }
  }, [tripStatus]);
  // Load device contacts automatically as soon as a destination is selected
  // Request contact permissions and fetch device contacts 
  const loadDeviceContacts = async () => {
    try {
      const checkStatus = await Contacts.checkPermissions();
      let granted = checkStatus.contacts === 'granted';

      if (!granted) {
        const reqStatus = await Contacts.requestPermissions();
        granted = reqStatus.contacts === 'granted';
      }

      if (granted) {
        const res = await Contacts.getContacts({
          projection: { name: true, phones: true },
        });

        if (res && res.contacts && res.contacts.length > 0) {
          const formattedContacts: ContactItem[] = res.contacts.map((c) => ({
            contactId: c.contactId,
            displayName: c.name?.display || c.name?.given || 'Unknown Contact',
            phoneNumber: c.phones?.[0]?.number || '',
            selected: false,
          }));
          setContacts(formattedContacts);
        } else {
          useFallbackContacts();
        }
      } else {
        useFallbackContacts();
      }
    } catch (err) {
      console.warn('Error loading contacts or running in browser:', err);
      useFallbackContacts();
    }
  };

  const useFallbackContacts = () => {

  };


  // Predicted destinations from Google Places Autocomplete
  const fetchPredictions = async (input: string) => {
    if (!input.trim()) {
      setPredictions([]);
      return;
    }
    const apiKey = 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI'; // Need to hide for real app.
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    setPredictions(data.status === 'OK' ? data.predictions : []);
  };

  // Debounce so we don't fetch on every keystroke 
  const handleDestinationChange = (value: string) => {
    setDestinationInput(value);
    setIsDestinationSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(value), 300);
  };

  const createMap = async () => {
    const mapElement = mapRef.current;
    if (!mapElement) return; // From null to current

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
      maximumAge: 1000,
    });

    // Storing trip in firestore. 
    if (tripDocRef.current) {
      await setDoc(tripDocRef.current, {
        lat: currentPosition.coords.latitude,
        lng: currentPosition.coords.longitude,
        destination: destinationInput,
        status: 'traveling',
        updatedAt: Date.now(),
        recipientPhone: recipientPhoneRef.current,
      });
    }

    // See messaging (Twilo) functionality in functions> src> index.ts
    if (tripDocRef.current) {
      setTripLink(`https://safelink-2acc5.web.app/watch/${tripDocRef.current.id}`); // URL link for safelink-watcher. 
    }

    // Start of move
    // Create Google Map 
    const newMap = await GoogleMap.create({
      id: 'trip-map',
      element: mapElement,
      apiKey: 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI',
      config: {
        center: {
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
        },
        zoom: 18,
      },
    });


    googleMapRef.current = newMap; // Store map instance to be used later

    await getDirections(
      { lat: currentPosition.coords.latitude, lng: currentPosition.coords.longitude, },
      destinationInput
    );
    // Blue dot 
    await newMap.enableCurrentLocation(true);


    // Tracking throughout; Not just showing position once. 
    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
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
          zoom: 18, // Map zoom level. Change if want.
          animate: true,
        });

        const currentPos = { lat: position.coords.latitude, lng: position.coords.longitude, };
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
              { path: path.slice(idx), strokeColor: '#2563eb', strokeWeight: 4, },
            ]);
            polylineIdsRef.current = newIds ?? [];
          })();
        }

        // Check if user has reached destination 
        if (destCoordsRef.current) {
          const dist = getDistanceMeters(
            { lat: position.coords.latitude, lng: position.coords.longitude },
            destCoordsRef.current
          );
          if (dist < 50) {
            setTripStatus('arrived');
            if (tripDocRef.current) {
              updateDoc(tripDocRef.current, { status: 'arrived' });
            }
          }
        }
      }
    );
    watchIdRef.current = watchId;
  };

  // I edited the function bellow so you can only select one user. Although could select multiple before, only 1 would ever function. - Arianna
  // Toggle selection status for emergency contacts list (only one can be selected)
  const toggleContactSelection = (contactId: string) => {
    setContacts((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.contactId === contactId ? !item.selected : false,
      }))
    );
  };

  // Contact bellow is Lauras code. Inially, she tried to do SMS Text, so possibly some old code is still here. However, Arianna not changing it, incase cause issues.
  // Travelling state set up.
  // (FIRESTORE TRIGGER FOR PUSH NOTIFICATION):Generate tracking link, open Web Share sheet if available, and transition to traveling state
  const handleBeginTrip = async () => {
    const selectedContact = contacts.find((c) => c.selected); // Ari edit start
    const rawNumber = selectedContact?.phoneNumber || '';
    recipientPhoneRef.current = rawNumber ? toE164(rawNumber) : null; // Ari edit end
    const tripId = `trip_${Date.now()}`;
    if (tripDocRef.current === null) {
      const newTripRef = doc(collection(db, 'trips'));
      tripDocRef.current = newTripRef;

      const generatedLink = `https://yourdomain.com/track?tripId=${tripId}`;
      setShareableLink(generatedLink);
      // Arianna deleted popup for 'Trigger native Web Share API dialog if supported'. Located in old files> Laura deleted code.
      setTripStatus('traveling');
    }
  };

  // Arrived state setup
  const handleEndTrip = async () => {
    if (watchIdRef.current) {
      Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    if (tripDocRef.current) {
      try {
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


  // Arianna code again. 
  // Getting directions code. 
  const getDirections = async (
    origin: { lat: number; lng: number },
    destination: string
  ) => {
    const apiKey = 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI'; // Need to hide for real app.
    const originStr = `${origin.lat},${origin.lng}`;
    const modeParam = transportMode ? `&mode=${transportMode}` : ''; // Only add mode if one was chosen
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${encodeURIComponent(destination)}${modeParam}&key=${apiKey}`;

    let response = await fetch(url);
    let data = await response.json(); //Retrieving the scrambled 
    let modeFailed = false; // true if the chosen mode had no route

    // If the chosen mode (e.g. transit) has no route, try again without a mode
    if ((!data.routes || data.routes.length === 0) && transportMode) {
      modeFailed = true;
      const fallbackUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;
      response = await fetch(fallbackUrl);
      data = await response.json();
    }

    if (!data.routes || data.routes.length === 0) {
      console.error('No route found', data);
      return;
    }// Error message for invalud entry.

    const route = data.routes[0];
    const points = route.overview_polyline.points;
    const etaText = route.legs[0].duration.text;
    const endLocation = route.legs[0].end_location; // lat, lng  

    destCoordsRef.current = { lat: endLocation.lat, lng: endLocation.lng }; // Storing destination. Same with endLocation.

    // Storing destinations long/lat for Secondary Website.
    if (tripDocRef.current) {
      updateDoc(tripDocRef.current, {
        destLat: endLocation.lat,
        destLng: endLocation.lng,
        recipientPhone: recipientPhoneRef.current,
        transportMode: modeFailed ? null : transportMode, // null if no mode or no route
        eta: transportMode && !modeFailed ? etaText : null, // only save a valid ETA
      });
    }

    const decodedPoints = polyline.decode(points);
    const path = decodedPoints.map(([lat, lng]) => ({ lat, lng }));

    // Store path
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

    setEta(modeFailed ? '' : etaText); // empty means the ETA is hidden
  };
  // End of map

  // Filter contacts
  const filteredContacts = contacts.filter((c) =>
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phoneNumber && c.phoneNumber.includes(searchQuery))
  );

  return (
    //Start navigation 
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#FFFFFF', '--border-width': '0' }}>
          <IonButtons slot="start" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
            <IonAvatar style={{ width: '36px', height: '36px', cursor: 'pointer' }} onClick={() => history.push('/tabs/yourlink')}>{profileImage ? (<img src={profileImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#E6A937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                <IonIcon icon={personOutline} style={{ fontSize: '18px' }} />
              </div>)}
            </IonAvatar>
            <span style={{ fontSize: '14px', color: '#633A0E', fontWeight: '700', whiteSpace: 'nowrap' }}>{userName}
            </span>
          </IonButtons>
          <IonTitle style={{ color: '#633A0E', fontWeight: '800', fontSize: '18px', textAlign: 'center' }}> SafeLink </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} style={{ color: '#633A0E', fontSize: '22px' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="page-background">{tripStatus === 'notstarted' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', }}>
          <IonButton className="start-button" onClick={() => setTripStatus('tripinformation')}>Start Trip test</IonButton> </div>)}



        {/* CHANGE OF STATE */}
        {tripStatus === 'tripinformation' && (
          <div style={{ marginTop: 24, marginRight: 16, marginLeft: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="box-container">
              <div className="box-container-text">
                <span className="mini-text" style={{ color: 'var(--yellow-700)' }}>
                  Mandatory
                </span>
                <span className="field-label h5-medium" style={{ color: 'var(--yellow-700)' }}>
                  Enter destination
                </span>
              </div>
              <div className="field-box">
                <IonInput
                  placeholder="Enter destination"
                  value={destinationInput}
                  onIonInput={(e) => handleDestinationChange(e.detail.value!)}
                />

                {/* Predicted destination dropdown */}
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
            <div className="box-container" style={{ marginTop: 20, width: '100%' }}>
              <div className="box-container-text">
                <span className="mini-text" style={{ color: 'var(--yellow-700)' }}>
                  Mandatory
                </span>
                <span className="field-label h5-medium" style={{ color: 'var(--yellow-700)' }}>
                  Share route with
                </span>
              </div>

              <div className="field-box">
                <IonInput
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onIonInput={(e) => setSearchQuery(e.detail.value!)}
                >
                  <IonIcon icon={searchOutline} slot="start" style={{ marginLeft: 8 }} />
                </IonInput>
              </div>

              <div className="field-box" style={{ marginTop: 8, padding: 0, overflow: 'hidden' }}>
                <IonList style={{ width: '100%', maxHeight: '200px', overflowY: 'auto', background: 'transparent' }}>
                  {filteredContacts.length === 0 ? (
                    <IonItem>
                      <IonLabel style={{ textAlign: 'center', color: 'var(--grey-500)' }}>
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
            </div>


            <div className="box-container" style={{ marginTop: 20, width: '100%' }}>
              <div className="box-container-text">
                <span className="mini-text" style={{ color: 'var(--yellow-700)' }}>
                  Optional
                </span>
                <span className="field-label h5-medium" style={{ color: 'var(--yellow-700)' }}>
                  Select mode of transport for ETA
                </span>
              </div>
              {/* Array of transport options. */}
              <div className="field-box" style={{ width: '100%', padding: '16px 8px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  {([
                    { mode: 'walking', icon: walkOutline, label: 'Walk' },
                    { mode: 'transit', icon: busOutline, label: 'Public transport' },
                    { mode: 'driving', icon: carOutline, label: 'Drive' },
                    { mode: 'bicycling', icon: bicycleOutline, label: 'Cycle' },
                  ] as { mode: TransportMode; icon: string; label: string }[]).map((opt) => {
                    {/* Loop through transport array above */ }
                    const isSelected = transportMode === opt.mode;
                    return (
                      <div
                        key={opt.mode}
                        className="transport-option"
                        onClick={() => setTransportMode(isSelected ? null : opt.mode)}
                      >
                        <div
                          className="transport-circle"
                          style={isSelected ? { background: 'var(--yellow-400)', color: 'var(--black)' } : undefined}
                        >
                          <IonIcon icon={opt.icon} />
                        </div>
                        <span style={isSelected ? { color: 'var(--yellow-500)', fontWeight: 600 } : undefined}>
                          {opt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <span className="mini-text" style={{ color: 'var(--grey-600)', display: 'block', marginTop: 8 }}>
                If you are more than 5 minutes late, a second text will be sent to your contact asking them to check in
              </span>

            </div>

            <IonButton
              className="large-button"
              disabled={!isDestinationSelected || !contacts.some((c) => c.selected)} // Destination greyed out until valid selection
              onClick={handleBeginTrip}
              style={{ marginTop: 20 }}>
              Begin
            </IonButton>

<IonButton
  className="large-button"
  onClick={() => setTripStatus('notstarted')}
  style={{ marginTop: 20, '--background': 'var(--grey-400)' }}>
  Back
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

            {transportMode && eta && (
              <p className="h6-regular" style={{ textAlign: 'center', marginTop: 0 }}>
                ETA: {eta}
              </p>
            )}
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
export default HomePage;
