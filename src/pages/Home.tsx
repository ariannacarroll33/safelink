/// <reference path="../custom-elements.d.ts" />
import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import polyline from '@mapbox/polyline'; // Change string to corrdinates. 
import './Home.css';
import './components.css';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonInput, IonCheckbox, IonList, IonItem, IonLabel, IonAvatar, useIonViewWillEnter, IonToast, IonAlert } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline, searchOutline, star, starOutline, alertCircle, alertCircleOutline, personAddOutline, personOutline, walkOutline, bicycleOutline, carOutline, busOutline } from 'ionicons/icons';
import Arrivedimage from '../assets/Walkthrough-Page/Arrivedimage.png';
import toastIcon from '../assets/toast-icon.svg';


// FIREBASE INTEGRATION
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import { doc, collection, getDoc, setDoc, updateDoc, DocumentReference, DocumentData } from 'firebase/firestore';

// Capacitor Contacts plugin import
import { Contacts } from '@capacitor-community/contacts';

// Using Type alias 
type TripStatus = 'notstarted' | 'tripinformation' | 'traveling' | 'arrived'; // States of trip
type TransportMode = 'walking' | 'transit' | 'driving' | 'bicycling'; // Moed of transport.

// Start of laura code on contacts.
interface ContactItem {
  contactId: string;
  displayName: string;
  phoneNumber?: string;
  selected: boolean;
  isFavorite?: boolean;   
  isEmergency?: boolean;  
}

// Same shape as YourLink's EmergencyContact
interface YourLinkContact {
  contactId: string;
  displayName: string;
  phoneNumber: string;
  relation?: string;
  favorite?: boolean;
}

// style legend
const chip = (active: boolean): React.CSSProperties => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 8px',
  borderRadius: 12,
  border: active ? '2px solid #8B4A12' : '1px solid #E0CFA8',
  background: active ? '#FFE9B8' : '#FFFFFF',
  color: '#7A4510',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
});

const shortcutButton = (active: boolean, accent: string, tint: string): React.CSSProperties => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 16,
  border: active ? `2px solid ${accent}` : '1px solid #E0CFA8',
  background: active ? tint : '#FFFFFF',
  boxShadow: active ? `0 3px 10px ${accent}44` : '0 1px 3px rgba(0, 0, 0, 0.06)',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.15s ease',
});

// filtering and selecting people
type Panel = 'favorites' | 'emergency' | 'all' | null;

const normalize = (s: string) =>
s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// End of laura code on contacts.


// Changing page when arrieve. Maths changing lat/long to meters. Retrieved from website. ADD LINK.
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

const toE164 = (raw: string) =>
  parsePhoneNumberFromString(raw, 'IE')?.number ?? raw; // Arianna change. I installed libphonenumber-js so that 

// Const variables used to store values.
const HomePage = () => {
  const history = useHistory(); //History use to navigate to notifications page.  
  const [destinationInput, setDestinationInput] = useState('');
  const [tripStatus, setTripStatus] = useState<TripStatus>('notstarted'); // Default to 'notstarted'  
  const [eta, setEta] = useState('');
  const [tripLink, setTripLink] = useState('');
  const [transportMode, setTransportMode] = useState<TransportMode | null>(null); // Nothing selected for public transport by deafult.
  const [showToast, setShowToast] = useState(false); // Toast popup for travelling and arrieved
  const [showArrivedToast, setShowArrivedToast] = useState(false);
  const [showManualAlert, setShowManualAlert] = useState(false);
  

  // User Profile State
  const [userName, setUserName] = useState<string>('User');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Dropdown menu for predicted destinations. ADD LINK.
  const [predictions, setPredictions] = useState<{ description: string; place_id: string }[]>([]); 
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null); 

  // Track if destination is selected to show contacts step
  const [isDestinationSelected, setIsDestinationSelected] = useState(false);
  
  // Contacts state management & Search Filter
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [shareableLink, setShareableLink] = useState('');

  // Const used to store info on maps. Create maps and watch position. 
  const mapRef = useRef<HTMLElement>(null); // HTML Element.Empty box. Filled later with google maps.
  const googleMapRef = useRef<GoogleMap | null>(null); // Googlemap object. Used later for directions & camera moving. Used with newmaps.
  const watchIdRef = useRef<string | null>(null); // String. Holds the watch ID so we can cancel it on cleanup
  const destCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const tripDocRef = useRef<DocumentReference<DocumentData> | null>(null); // Stores firestore trip 
  const recipientPhonesRef = useRef<string[]>([]); // Stores selected contacts' phone numbers
  const authUnsubRef = useRef<Unsubscribe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const transportModeRef = useRef<TransportMode>('walking'); // Used to update the trip
  

  // Polyline Refs. These are used to for the blue route, to show trip.
  const polylineIdsRef = useRef<string[]>([]);
  const routePathRef = useRef<{ lat: number; lng: number }[]>([]);
  const routeIndexRef = useRef(0);


  // Start of Laura code on contacts.
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

    if (authUnsubRef.current) authUnsubRef.current();

    // Sync with Firestore DB (default photo with app avatar)
    authUnsubRef.current = onAuthStateChanged(auth, async (currentUser) => {
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

  // Compare phones by their last 9 digits 
  const phoneKey = (p?: string) => (p ?? '').replace(/\D/g, '').slice(-9);

  const fetchYourLinkContacts = async (): Promise<YourLinkContact[]> => {
    // 1. Firestore (source of truth), if the user is logged in
    const user = auth.currentUser;
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && Array.isArray(snap.data().emergencyContacts)) {
          return snap.data().emergencyContacts as YourLinkContact[];
        }
      } catch (e) {
        console.error('Error fetching YourLink contacts:', e);
      }
    }
    // 2. Fallback: local copy saved by YourLink
    try {
      const saved = JSON.parse(localStorage.getItem('safelink_user') || '{}');
      if (Array.isArray(saved.emergencyContacts)) return saved.emergencyContacts;
    } catch (e) {
      console.error('Error reading local contacts:', e);
    }
    return [];
  };

  // Refresh user profile whenever the Ionic view is entered/navigated
  // reload so its updated
  useIonViewWillEnter(() => {
    fetchUserProfile();
    setContacts([]);                  // clear old list
    setIsDestinationSelected(false);  // contacts reload when a destination is picked again
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
      if (authUnsubRef.current) authUnsubRef.current();
    };
  }, []);
  // End of Laura code on contacts.

  // When status traveling. If the map is not created, create it.  
  useEffect(() => { 
    if (tripStatus === 'traveling' && mapRef.current) {  
      const newTripRef = doc(collection(db, 'trips')); 
      tripDocRef.current = newTripRef; // Store trip for later 
      createMap().catch((e) => console.error('createMap failed:', e));
      // If status traveling and does mapRef have something in box yetm 
      createMap(); 
    } 

    // Stops watching the position when the component unmounts or when tripStatus changes. 
return () => { 
  if (watchIdRef.current) { 
    Geolocation.clearWatch({ id: watchIdRef.current }); 
    watchIdRef.current = null; 
  } 

  if (googleMapRef.current) { // destroys code each time at end. Bug which made user close app.
  googleMapRef.current.destroy().catch((e) => console.warn('Map destroy failed:', e)); 
   googleMapRef.current = null;
  }
};
}, [tripStatus]); 

  // Contacts: request permission of device to access contacts and load them (making them visible)
  useEffect(() => {
    if (isDestinationSelected && contacts.length === 0) {
      loadDeviceContacts();
    }
  }, [isDestinationSelected]);

  // Load device contacts automatically as soon as a destination is selected
  // Request contact permissions and fetch device contacts 
  const loadDeviceContacts = async () => {
    try {
      let merged: ContactItem[] = [];

      // 1. Phone contacts (optional: skipped if permission is denied or in browser)
      try {
        const checkStatus = await Contacts.checkPermissions();
        let granted = checkStatus.contacts === 'granted';
        if (!granted) {
          const reqStatus = await Contacts.requestPermissions();
          granted = reqStatus.contacts === 'granted';
        }

        if (granted) {
          const res = await Contacts.getContacts({ projection: { name: true, phones: true } });
          merged = (res.contacts || [])
            .filter((c) => c.contactId && c.phones && c.phones.length > 0)
            .map((c) => ({
              contactId: c.contactId as string,
              displayName: c.name?.display || c.name?.given || 'Unknown Contact',
              phoneNumber: c.phones?.[0]?.number || '',
              selected: false,
              isFavorite: false,
              isEmergency: false,
            }));
        }
      } catch (e) {
        console.warn('Device contacts unavailable:', e);
      }

      // 2. YourLink contacts: all are emergency, some are also favorites
      const yourLink = await fetchYourLinkContacts();

      yourLink.forEach((p) => {
        const key = phoneKey(p.phoneNumber);
        const existing = key ? merged.find((c) => phoneKey(c.phoneNumber) === key) : undefined;

        if (existing) {
          existing.isEmergency = true;
          existing.isFavorite = !!p.favorite;
        } else {
          merged.push({
            contactId: p.contactId,
            displayName: p.displayName,
            phoneNumber: p.phoneNumber,
            selected: false,
            isEmergency: true,
            isFavorite: !!p.favorite,
          });
        }
      });

      setContacts(merged);
    } catch (err) {
      console.warn('Error loading contacts:', err);
    }
  };


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
    setIsDestinationSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(value), 300);
  };

  const createMap = async () => { 
    const mapElement = mapRef.current;
    if (!mapElement) return; //from null to current // made a little change because it was giving me problems because it was not an HTMLElement

    // Required for Capacitor Geolocator plugin. Asks permission to use location. Pop up. requestPermission.
    const permission = await Geolocation.requestPermissions();
    if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') 
    {
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
        recipientPhone: recipientPhonesRef.current[0] ?? null, // changed. lost in merge. NOTE
        uid: auth.currentUser?.uid ?? null,
        userName: userName,
      }); 
    } 

    if (tripDocRef.current) { 
      setTripLink(`https://safelink-2acc5.web.app/watch/${tripDocRef.current.id}`); // URL link for safelink-watcher 
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
  { lat: currentPosition.coords.latitude, lng: currentPosition.coords.longitude },
  destinationInput,
  transportModeRef.current // Store selected mode of transport.
);

    // Blue dot 
    await newMap.enableCurrentLocation(true);

    // NEW Tracking throughout; Not just showing position once. 
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

        // NEW — check if user has reached destination 
        if (destCoordsRef.current) {
          const dist = getDistanceMeters(
            { lat: position.coords.latitude, lng: position.coords.longitude },
            destCoordsRef.current
          );
          if (dist < 25) { //changed from 50 to 25
            setTripStatus('arrived');
            setShowArrivedToast(true);
            if (tripDocRef.current) { 
              updateDoc(tripDocRef.current, { status: 'arrived' }); 
            }
          }
        }
      }
    );
    watchIdRef.current = watchId;
  }; //end of move

  // BEGIN TRIP (FIRESTORE TRIGGER FOR PUSH NOTIFICATION):Generate tracking link, open Web Share sheet if available, and transition to traveling state
  const openPanel = (p: Exclude<Panel, null>) => {
    setPanel((current) => (current === p ? null : p));
    setSearchQuery('');
  };

  const handleShortcut = (p: 'favorites' | 'emergency') => {
    const flag = p === 'favorites' ? 'isFavorite' : 'isEmergency';
    const opening = panel !== p;
    setContacts((prev) =>
      prev.map((c) => (c[flag] ? { ...c, selected: opening } : c))
    );
    openPanel(p);
  };

  const toggleFlag = (contactId: string, flag: 'isFavorite' | 'isEmergency') => {
    setContacts((prev) =>
      prev.map((c) =>
        c.contactId === contactId ? { ...c, [flag]: !c[flag] } : c
      )
    );
  };

  const handleAddManualContact = (name?: string, phone?: string) => {
    const cleanName = (name ?? '').trim();
    const cleanPhone = (phone ?? '').trim();

    // Devolver false mantiene el alert abierto si falta algo
    if (!cleanName || cleanPhone.replace(/\D/g, '').length < 6) return false;

    const key = phoneKey(cleanPhone);
    const existing = contacts.find((c) => phoneKey(c.phoneNumber) === key);

    if (existing) {
      // exists?--> just select them
      setContacts((prev) =>
        prev.map((c) => (c.contactId === existing.contactId ? { ...c, selected: true } : c))
      );
    } else {
      setContacts((prev) => [
        ...prev,
        {
          contactId: `manual_${Date.now()}`,
          displayName: cleanName,
          phoneNumber: cleanPhone,
          selected: true,
          isFavorite: false,
          isEmergency: false,
        },
      ]);
    }

    // Open "All contacts" to see change 
    setPanel('all');
    setSearchQuery('');
  };

  const toggleSelected = (contactId: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.contactId === contactId ? { ...c, selected: !c.selected } : c
      )
    );
  };

  // Same action, name used by the new "Share route with" list
  const toggleContactSelection = toggleSelected;

  // Filter used by the "Share route with" search box
  // to search through contacts: 
  const filteredContacts = contacts.filter((c) =>
    normalize(c.displayName ?? '').includes(normalize(searchQuery.trim()))
  );

  // Contact bellow is Lauras code. Inially, she tried to do SMS Text, so possibly some old code is still here. However, Arianna not changing it, incase cause issues.
  // Travelling state set up.
  // (FIRESTORE TRIGGER FOR PUSH NOTIFICATION):Generate tracking link, open Web Share sheet if available, and transition to traveling state
  const visibleContacts = contacts
    .filter((c) => {
      if (panel === 'favorites') return c.isFavorite;
      if (panel === 'emergency') return c.isEmergency;
      if (panel === 'all') {
        const q = normalize(searchQuery.trim());
        const qDigits = q.replace(/\D/g, '');
        return (
          q === '' ||
          normalize(c.displayName).includes(q) ||
          (qDigits !== '' &&
            (c.phoneNumber ?? '').replace(/\D/g, '').includes(qDigits))
        );
      }
      return false;
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const contactsToDisplay = panel ? visibleContacts : filteredContacts;
  
const handleBeginTrip = async () => {
  transportModeRef.current = transportMode ?? 'walking';
  const selectedContacts = contacts.filter((c) => c.selected && c.phoneNumber);
  recipientPhonesRef.current = selectedContacts.map((c) => toE164(c.phoneNumber!));

  const tripId = tripDocRef.current?.id ?? Date.now().toString();
  const generatedLink = `https://yourdomain.com/track?tripId=${tripId}`;
  setShareableLink(generatedLink);
  setShowToast(true);
  setTripStatus('traveling');
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
    setShowArrivedToast(true);
    setTripStatus('arrived');
  };

  // possibility to update
  /*
  {panel === 'all'
    ? 'No contacts found.'
    : panel === 'favorites'
    ? 'No favorites yet. Add them in Your Link.'
    : 'No emergency contacts yet. Add them in Your Link.'}
  */


  // Arianna code again. 
  // Getting directions code. 
const getDirections = async (
  origin: { lat: number; lng: number },
  destination: string,
  mode: TransportMode
) => {
  const apiKey = 'AIzaSyD-tOmqP-EHhjX4FU-a4ddBK1BCiFk5ZgI';
  const originStr = `${origin.lat},${origin.lng}`;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${apiKey}`;

  console.log('Directions mode:', mode);
  const response = await fetch(url);
  const data = await response.json();
  console.log('Directions status:', data.status, 'ETA:', data.routes?.[0]?.legs?.[0]?.duration?.text);

    if (!data.routes || data.routes.length === 0) {
      console.error('No route found', data);
      return;
    }// Error message for invalud entry.

    const route = data.routes[0];
    const points = route.overview_polyline.points;
    const etaText = route.legs[0].duration.text;
    const endLocation = route.legs[0].end_location; // lat, lng  

    destCoordsRef.current = { lat: endLocation.lat, lng: endLocation.lng }; // Storing destination. Same with endLocation.

    // Storing destinations long/lat for Safelink-Watcher 
    if (tripDocRef.current) { 
      updateDoc(tripDocRef.current, { 
        destLat: endLocation.lat, 
        destLng: endLocation.lng, 
        recipientPhone: recipientPhonesRef.current[0] ?? null, // Changed. Lost in merge.
      }); 
    } 

    const decodedPoints = polyline.decode(points);
    const path = decodedPoints.map(([lat, lng]) => ({ lat, lng }));

    //store path
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
  // End of map


  const selectedContactName = contacts.find((c) => c.selected)?.displayName; // name which is selected. Used in Toast.
  const selectedList = contacts.filter((c) => c.selected);
  const favoriteContacts = contacts.filter((c) => c.isFavorite);
  const emergencyContacts = contacts.filter((c) => c.isEmergency);

  return (
    //Start navigation 
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#FFFFFF', '--border-width': '0' }}>
          <IonButtons slot="start" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
            <IonAvatar style={{ width: '36px', height: '36px', cursor: 'pointer' }} onClick={() => history.push('/tabs/yourlink')}>
              {profileImage ? (
                <img src={profileImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#E6A937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                  <IonIcon icon={personOutline} style={{ fontSize: '18px' }} />
                </div>
              )}
            </IonAvatar>
            <span style={{ fontSize: '14px', color: '#633A0E', fontWeight: '700', whiteSpace: 'nowrap' }}>{userName}</span>
          </IonButtons>
          <IonTitle style={{ color: '#633A0E', fontWeight: '800', fontSize: '18px', textAlign: 'center' }}> SafeLink </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} style={{ color: '#633A0E', fontSize: '22px' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="page-background">
        {tripStatus === 'notstarted' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <IonButton className="start-button" onClick={() => setTripStatus('tripinformation')}>Start Trip</IonButton>
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

              <button
                onClick={() => setShowManualAlert(true)}
                style={{ ...chip(false), width: '100%', marginTop: 8, padding: '10px 14px' }}
              >
                <IonIcon icon={personAddOutline} />Add someone manually
              </button>
              <IonAlert
                isOpen={showManualAlert}
                onDidDismiss={() => setShowManualAlert(false)}
                header="Add Contact"
                inputs={[
                  { name: 'contactName', type: 'text', placeholder: 'Name (e.g. John Doe)' },
                  { name: 'contactPhone', type: 'tel', placeholder: 'Phone (+34 600 000 000)' },
                ]}
                buttons={[
                  { text: 'Cancel', role: 'cancel' },
                  { text: 'Add', handler: (data: any) => handleAddManualContact(data.contactName, data.contactPhone) },
                ]}
              />
              <IonList
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: 'transparent'
                }}
              >
                {contactsToDisplay.length === 0 ? (
                  <IonItem>
                    <IonLabel style={{ textAlign: 'center', color: 'var(--grey-500)' }}>
                      {panel === 'favorites'
                        ? 'No favorites yet. Add them in Your Link.'
                        : panel === 'emergency'
                        ? 'No emergency contacts yet. Add them in Your Link.'
                        : 'No contacts found'}
                    </IonLabel>
                  </IonItem>
                ) : (
                  contactsToDisplay.map((c) => (
                    <IonItem key={c.contactId}>
                      <IonLabel>
                        <h2>{c.displayName}</h2>
                        <p>{c.phoneNumber}</p>
                      </IonLabel>

                      <IonCheckbox
                        slot="end"
                        checked={c.selected}
                        onIonChange={(e) => {
                          if (e.detail.checked !== c.selected) {
                            toggleContactSelection(c.contactId);
                          }
                        }}
                      />
                    </IonItem>
                  ))
                )}
              </IonList>
              {/* Favorites and Emergency shortcuts */}
              <div style={{ display: 'flex', gap: 10, marginTop: 12, marginBottom: 8 }}>

                <button
                  onClick={() => handleShortcut('favorites')}
                  style={shortcutButton(panel === 'favorites', '#E5A63A', '#FFF4D6')}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFF4D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IonIcon icon={star} style={{ color: '#E5A63A', fontSize: 18 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#7A4510' }}>Favorites</span>
                    <span style={{ fontSize: 11, color: '#9A7B55' }}>
                      {favoriteContacts.length === 0
                        ? 'None yet'
                        : `${favoriteContacts.filter((c) => c.selected).length}/${favoriteContacts.length} selected`}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleShortcut('emergency')}
                  style={shortcutButton(panel === 'emergency', '#D9534F', '#FDE8E7')}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FDE8E7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IonIcon icon={alertCircle} style={{ color: '#D9534F', fontSize: 18 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#7A4510' }}>Emergency</span>
                    <span style={{ fontSize: 11, color: '#9A7B55' }}>
                      {emergencyContacts.length === 0
                        ? 'None yet'
                        : `${emergencyContacts.filter((c) => c.selected).length}/${emergencyContacts.length} selected`}
                    </span>
                  </div>
                </button>

              </div>

              {selectedList.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--grey-600)', marginTop: 4, lineHeight: 1.4 }}>
                  <strong>{selectedList.length} selected:</strong> {selectedList.map((c) => c.displayName).join(', ')}
                </div>
              )}
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
                    /* Loop through transport array above */
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
              style={{ marginTop: 20 }}
            >
              Begin
            </IonButton>

            <IonButton
              className="large-button-outline"
              onClick={() => setTripStatus('notstarted')}
              style={{ marginTop: 20 }}
            >
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
                style={{ display: 'block', width: '100%', height: '400px' }}
              ></capacitor-google-map>
            </div>

                {eta && (
      <p style={{ textAlign: 'center', fontWeight: 600, color: '#633A0E', margin: '0 16px 8px' }}>
        {transportMode === 'transit' ? 'Public transport' : transportMode ?? 'walking'} ETA: {eta}
      </p>
    )}


            {shareableLink && (
              <div style={{ padding: '0 16px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#666' }}>Alternative Web Tracking Link:</p>
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
            <div className="onboarding-box-container">
              <img
                className="onboarding-img-container"
                src={Arrivedimage}
                alt="Img"
                width={350}
                height={350}
              />
            </div>
            <p>You've arrived!</p>
            <IonButton
              className="large-button"
              onClick={() => {
                setTripStatus('notstarted');
                setDestinationInput('');
                setIsDestinationSelected(false);
                setContacts([]);
                setPanel(null);
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

      <IonToast //Traveling toast popup
        position="top"
        isOpen={showToast}
        header={`Text Sent To ${selectedContactName}`}
        message={`I am traveling to ${destinationInput}. See live location here: https://safelink.com`}
        onDidDismiss={() => setShowToast(false)}
        duration={5000}
        icon={toastIcon}
      ></IonToast>

      <IonToast //Arrived toast popup
        position="top"
        isOpen={showArrivedToast}
        header={`Text sent to ${selectedContactName}`}
        message={`I have arrived at ${destinationInput}`}
        onDidDismiss={() => setShowArrivedToast(false)}
        duration={5000}
        icon={toastIcon}
      ></IonToast>
    </IonPage>
  );
};
export default HomePage;
