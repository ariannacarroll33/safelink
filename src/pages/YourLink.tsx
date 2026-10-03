import React, { useState, useRef, useEffect } from 'react';
import {IonContent, IonHeader,IonPage,IonTitle,IonToolbar, IonButtons,IonButton,IonIcon,IonAvatar,IonToast,IonAlert,IonList,IonItem,IonLabel,useIonViewWillEnter} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {notificationsOutline,navigateOutline,linkOutline,cameraOutline,personOutline,createOutline,callOutline,peopleOutline,addCircleOutline,} from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';
import './YourLink.css';
import alertNoise from '../assets/mixkit-facility-alarm-sound-999.wav';
import { Haptics, ImpactStyle } from '@capacitor/haptics';


export interface EmergencyContact {
  contactId: string; 
  displayName: string;
  phoneNumber: string;
  relation?: string;
  selected?: boolean;
}

// FIREBASE INTEGRATION
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const YourLinkPage = () => {
  const history = useHistory();
  const watchIdRef = useRef<string | number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 2. USER STATES
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('User Account');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  // 3. GEOLOCATION STATES
  const [isLive, setIsLive] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<string>('Location sharing disabled');
  const [lastKnownLocation, setLastKnownLocation] = useState<string>('');

  // 4. UI STATES
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showEditAlert, setShowEditAlert] = useState<boolean>(false);
  const [showPhoneAlert, setShowPhoneAlert] = useState<boolean>(false);
  const [showAddContactAlert, setShowAddContactAlert] = useState<boolean>(false);

  // 5. LOAD USER DATA FUNCTION
  const loadUserData = async () => {
    const savedAvatar = localStorage.getItem('avatarUrl');
    if (savedAvatar) setProfileImage(savedAvatar);

    const savedSession = localStorage.getItem('safelink_user');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.id) setUserId(parsed.id);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.phone) setUserPhone(parsed.phone);
        if (parsed.avatarUrl) setProfileImage(parsed.avatarUrl);
        if (parsed.emergencyContacts) setEmergencyContacts(parsed.emergencyContacts);
      } catch (e) {
        console.error('Error parsing local storage user data:', e);
      }
    }

    

    // Firebase Auth & Firestore --> to fetch personal info.
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        if (user.email) setUserEmail(user.email);

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.name) setUserName(data.name);
            if (data.phone) setUserPhone(data.phone);
            if (data.avatarUrl) setProfileImage(data.avatarUrl);
            if (data.emergencyContacts) setEmergencyContacts(data.emergencyContacts);
          }
        } catch (e) {
          console.error('Error fetching Firestore user data:', e);
        }
      }
    });
  };

  useIonViewWillEnter(() => {
    loadUserData();
  });

  useEffect(() => {
    loadUserData();
  }, []);

  // REAL-TIME GPS GEOLOCATION (on and off switcher)
  useEffect(() => {
    if (!isLive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(Number(watchIdRef.current));
        watchIdRef.current = null;
      }
      return;
    }

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || '';
            const road = data.address?.road || data.address?.suburb || '';
            const locationString = road ? `${road}, ${city}` : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            setUserLocation(locationString);
            setLastKnownLocation(locationString);
          } catch (err) {
            const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setUserLocation(fallback);
            setLastKnownLocation(fallback);
          }
        },
        (error) => {
          console.warn('GPS Error:', error.message);
          setUserLocation('Location Permission Disabled');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setUserLocation('Geolocation not supported');
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch (Number(watchIdRef.current));
      }
    };
  }, [isLive]);

  const toggleLiveStatus = () => {
    if (isLive) {
      setIsLive(false);
      setToastMessage('Location sharing paused');
      setShowToast(true);
    } else {
      setIsLive(true);
      setUserLocation('Updating location...');
      setToastMessage('Live location enabled');
      setShowToast(true);
    }
  };

  // SOS ALARM
function startAlarm() {
const alarmSound = new Audio(alertNoise);
alarmSound.loop = true;
alarmSound.play();
audioRef.current = alarmSound;

// Start repeating vibration
intervalRef.current = window.setInterval(() => {
Haptics.impact({ style: ImpactStyle.Heavy });
}, 500);
}


// useRef hook. Controls pause / play of audio.
const stopAlarmSound = () => {
if (audioRef.current) {
audioRef.current.pause();
}
if (intervalRef.current) {
window.clearInterval(intervalRef.current);
intervalRef.current = null;
}
};


// Button logic. Kept console.log for testing.
const toggleAlarm = () => {
if (isAlarmActive) {
stopAlarmSound();
setIsAlarmActive(false);
console.log("Alarm Stopped!");
} else {
startAlarm();
setIsAlarmActive(true);
console.log("Alarm Started!");
}
};

// Your link 
  const personalLink = `https://safelink-2acc5.web.app/add-contact?userId=${userId || 'account'}`;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setProfileImage(base64Image);

        localStorage.setItem('avatarUrl', base64Image);
        
        const savedSession = localStorage.getItem('safelink_user');
        const userData = savedSession ? JSON.parse(savedSession) : { id: userId, name: userName };
        userData.avatarUrl = base64Image;
        localStorage.setItem('safelink_user', JSON.stringify(userData));
        
        window.dispatchEvent(new Event('safelink_user_updated'));

        if (auth.currentUser) {
          try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              avatarUrl: base64Image
            });
          } catch (e) {
            console.error('Error updating photo in Firestore:', e);
          }
        }

        setToastMessage('Profile picture updated!');
        setShowToast(true);
      };
      reader.readAsDataURL(file);
    }
  };
// fetch info from the sign up form 
  const handleSaveName = async (newName: string) => {
    if (newName && newName.trim().length > 0) {
      const updated = newName.trim();
      setUserName(updated);

      const savedSession = localStorage.getItem('safelink_user');
      const userData = savedSession ? JSON.parse(savedSession) : { id: userId };
      userData.name = updated;
      localStorage.setItem('safelink_user', JSON.stringify(userData));
      window.dispatchEvent(new Event('safelink_user_updated'));

      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            name: updated
          });
        } catch (e) {
          console.error('Error updating name in Firestore:', e);
        }
      }

      setToastMessage('Name updated!');
      setShowToast(true);
    }
  };
// edit or have info about your details
  const handleSavePhone = async (newPhone: string) => {
    if (newPhone && newPhone.trim().length > 0) {
      const updated = newPhone.trim();
      setUserPhone(updated);

      const savedSession = localStorage.getItem('safelink_user');
      const userData = savedSession ? JSON.parse(savedSession) : { id: userId };
      userData.phone = updated;
      localStorage.setItem('safelink_user', JSON.stringify(userData));
      window.dispatchEvent(new Event('safelink_user_updated'));

      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            phone: updated
          });
        } catch (e) {
          console.error('Error updating phone in Firestore:', e);
        }
      }

      setToastMessage('Phone number updated!');
      setShowToast(true);
    }
  };

  const handleAddEmergencyContact = async (contactName: string, contactPhone: string, contactRelation?: string) => {
    if (contactName && contactPhone) {
      const newContact: EmergencyContact = {
  contactId: `contact_${Date.now()}`,   
  displayName: contactName.trim(),      
  phoneNumber: contactPhone.trim(),
      };

      const updatedList = [...emergencyContacts, newContact];
      setEmergencyContacts(updatedList);

      const savedSession = localStorage.getItem('safelink_user');
      const userData = savedSession ? JSON.parse(savedSession) : { id: userId };
      userData.emergencyContacts = updatedList;
      localStorage.setItem('safelink_user', JSON.stringify(userData));

      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            emergencyContacts: updatedList
          });
        } catch (e) {
          console.error('Error updating emergency contacts in Firestore:', e);
        }
      }

      setToastMessage('Emergency contact added!');
      setShowToast(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(personalLink);
      setToastMessage('Link copied to clipboard!');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Error copying link');
      setShowToast(true);
    }
  };

  const handleSendViaText = async () => {
    const shareData = {
      title: `${userName}'s SafeLink Profile`,
      text: `Hi! Add ${userName} as an emergency contact on SafeLink: ${personalLink}`,
      url: personalLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        console.log('Sharing canceled');
      }
    } else {
      window.location.href = `sms:?&body=${encodeURIComponent(shareData.text)}`;
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="ion-text-center">Your Link</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>

        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '20px'
          }}
        >
          <IonButton
            className={isAlarmActive ? "sos-button-on" : "sos-button-off"}
            onClick={toggleAlarm}
          >
            {isAlarmActive ? "STOP ALARM" : "TRIGGER SOS"}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default YourLinkPage;