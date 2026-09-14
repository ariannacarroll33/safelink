import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonAvatar,
  IonToast,
  IonAlert,
  IonList,
  IonItem,
  IonLabel,
  useIonViewWillEnter
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  notificationsOutline,
  navigateOutline,
  linkOutline,
  cameraOutline,
  personOutline,
  createOutline,
  callOutline,
  peopleOutline,
  addCircleOutline,
} from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';
import './YourLink.css';
import alertNoise from '../assets/mixkit-facility-alarm-sound-999.wav';

// FIREBASE INTEGRATION
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation?: string;
}

const YourLinkPage: React.FC = () => {
  const history = useHistory();

  // 1. USER STATE (Initial state set to empty strings, populated from Firestore/Auth)
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('User Account');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // 2. EMERGENCY CONTACTS STATE
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  // 3. REAL-TIME LOCATION & TOGGLE STATE
  const [isLive, setIsLive] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<string>('Fetching location...');
  const [lastKnownLocation, setLastKnownLocation] = useState<string>('');
  const watchIdRef = useRef<number | null>(null);

  // Load User Data from Firestore or Local Storage Fallback
  const loadUserData = () => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserId(data.uid || currentUser.uid);
            setUserName(data.name || currentUser.displayName || 'User Account');
            setUserEmail(data.email || currentUser.email || '');
            setUserPhone(data.phone || currentUser.phoneNumber || '');
            
            // Prefer manually selected avatar over Google Auth photo
            const activeAvatar = data.avatarUrl || localStorage.getItem('avatarUrl');
            if (activeAvatar) setProfileImage(activeAvatar);
            
            if (data.emergencyContacts) setEmergencyContacts(data.emergencyContacts);

            localStorage.setItem('safelink_user', JSON.stringify({ ...data, avatarUrl: activeAvatar }));
            return;
          }
        } catch (err) {
          console.error('Error reading Firestore:', err);
        }
      }

      // Fallback to LocalStorage
      const savedUserSession = localStorage.getItem('safelink_user');
      if (savedUserSession) {
        try {
          const parsed = JSON.parse(savedUserSession);
          setUserId(parsed.id || parsed.uid || `usr_${Date.now()}`);
          setUserName(parsed.name || parsed.fullName || 'User Account');
          setUserEmail(parsed.email || '');
          setUserPhone(parsed.phone || '');
          
          const storedAvatar = parsed.avatarUrl || localStorage.getItem('avatarUrl');
          if (storedAvatar) setProfileImage(storedAvatar);
          if (parsed.emergencyContacts) setEmergencyContacts(parsed.emergencyContacts);
        } catch (e) {
          console.error('Error parsing localStorage:', e);
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

  // REAL-TIME GPS GEOLOCATION
  useEffect(() => {
    if (!isLive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
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
        navigator.geolocation.clearWatch(watchIdRef.current);
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

  const personalLink = `https://safelink-2acc5.web.app/add-contact?userId=${userId || 'account'}`;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showEditAlert, setShowEditAlert] = useState<boolean>(false);
  const [showPhoneAlert, setShowPhoneAlert] = useState<boolean>(false);
  const [showAddContactAlert, setShowAddContactAlert] = useState<boolean>(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setProfileImage(base64Image);

        // Save image key explicitly and broadcast global sync event
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
        id: `contact_${Date.now()}`,
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relation: contactRelation?.trim() || 'Contact',
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

  const toggleAlarm = () => {
    if (isAlarmActive) {
      if (audioRef.current) audioRef.current.pause();
      setIsAlarmActive(false);
    } else {
      const alarmSound = new Audio(alertNoise);
      alarmSound.loop = true;
      alarmSound.play();
      audioRef.current = alarmSound;
      setIsAlarmActive(true);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="header-toolbar">
          <IonButtons slot="start">
            <IonAvatar className="header-avatar">
              {profileImage ? (
                <img src={profileImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="empty-avatar-circle header-empty-circle">
                  <IonIcon icon={personOutline} />
                </div>
              )}
            </IonAvatar>
          </IonButtons>
          <IonTitle className="ion-text-center header-title">SafeLink</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/notifications')}>
              <IonIcon icon={notificationsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="yourlink-content">
        <div className="location-pill-container">
          <div className={`location-pill ${isLive ? 'pill-active' : 'pill-paused'}`}>
            <IonIcon icon={navigateOutline} className="location-icon" />
            <div className="location-info">
              <span className="location-label">
                {isLive ? 'Current location' : 'Last known location'}
              </span>
              <span className="location-address">
                {isLive ? userLocation : lastKnownLocation || 'Sharing Paused'}
              </span>
            </div>

            <button
              type="button"
              className={`live-badge-btn ${isLive ? 'badge-live' : 'badge-paused'}`}
              onClick={toggleLiveStatus}
            >
              <span className={`live-dot ${isLive ? 'dot-green' : 'dot-red'}`}></span>
              {isLive ? 'Live' : 'Off'}
            </button>
          </div>
        </div>

        <div className="profile-hero-section">
          <div
            className="avatar-wrapper"
            onClick={() => fileInputRef.current?.click()}
          >
            {profileImage ? (
              <img src={profileImage} alt={userName} className="main-profile-img" />
            ) : (
              <div className="empty-avatar-circle main-empty-circle">
                <IonIcon icon={personOutline} />
              </div>
            )}
            <div className="camera-overlay">
              <IonIcon icon={cameraOutline} />
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <div className="hero-text-container">
            <span className="hero-subtitle">Your Personal Link</span>
            <div className="editable-name-row" onClick={() => setShowEditAlert(true)}>
              <h1 className="hero-title">{userName}</h1>
              <IonIcon icon={createOutline} className="edit-icon" />
            </div>
          </div>
        </div>

        {/* PHONE NUMBER CARD */}
        <div className="info-card" style={{ margin: '0 16px 16px', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IonIcon icon={callOutline} style={{ fontSize: '20px', color: '#633A0E' }} />
              <div>
                <span style={{ fontSize: '12px', color: '#888', display: 'block' }}>Phone Number</span>
                <strong style={{ fontSize: '15px', color: '#333' }}>{userPhone || 'Not provided'}</strong>
              </div>
            </div>
            <IonButton fill="clear" onClick={() => setShowPhoneAlert(true)}>
              <IonIcon icon={createOutline} style={{ color: '#633A0E' }} />
            </IonButton>
          </div>
        </div>

        {/* EMERGENCY CONTACTS CARD */}
        <div className="info-card" style={{ margin: '0 16px 16px', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={peopleOutline} style={{ fontSize: '20px', color: '#633A0E' }} />
              <strong style={{ fontSize: '16px', color: '#633A0E' }}>Emergency Contacts</strong>
            </div>
            <IonButton fill="clear" onClick={() => setShowAddContactAlert(true)}>
              <IonIcon icon={addCircleOutline} style={{ fontSize: '22px', color: '#633A0E' }} />
            </IonButton>
          </div>

          <IonList lines="none" style={{ background: 'transparent' }}>
            {emergencyContacts.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', margin: '8px 0' }}>
                No emergency contacts added yet.
              </p>
            ) : (
              emergencyContacts.map((contact) => (
                <IonItem key={contact.id} style={{ '--background': '#F9F9F9', borderRadius: '10px', marginBottom: '8px' }}>
                  <IonLabel>
                    <h3 style={{ fontWeight: '700', color: '#333' }}>{contact.name}</h3>
                    <p style={{ color: '#666', fontSize: '12px' }}>{contact.relation} • {contact.phone}</p>
                  </IonLabel>
                  <IonButton slot="end" fill="clear" href={`tel:${contact.phone}`}>
                    <IonIcon icon={callOutline} style={{ color: '#2e7d32' }} />
                  </IonButton>
                </IonItem>
              ))
            )}
          </IonList>
        </div>

        {/* SHARING CARD */}
        <div className="share-card">
          <p className="card-subtitle">Share your contact and live location with anyone</p>
          <h2 className="card-title">Your Personal QR</h2>

          <div className="qr-container">
            <QRCodeSVG
              value={personalLink}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="link-box" onClick={handleCopyLink}>
            <IonIcon icon={linkOutline} className="link-icon" />
            <span className="link-text">{personalLink}</span>
          </div>

          <IonButton
            className="send-text-btn"
            expand="block"
            onClick={handleSendViaText}
          >
            Send via. Text
          </IonButton>

          <p className="card-footer-text">
            Your link never changes. Just like the app, others can only see your location whilst you're live.
          </p>

          <div style={{ marginTop: '24px' }}>
            <IonButton
              className={isAlarmActive ? 'sos-button-on' : 'sos-button-off'}
              onClick={toggleAlarm}
            >
              {isAlarmActive ? 'STOP ALARM' : 'TRIGGER SOS'}
            </IonButton>
          </div>
        </div>

        {/* EDIT NAME MODAL */}
        <IonAlert
          isOpen={showEditAlert}
          onDidDismiss={() => setShowEditAlert(false)}
          header="Change Display Name"
          inputs={[
            {
              name: 'newName',
              type: 'text',
              placeholder: 'Enter your name',
              value: userName,
            },
          ]}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            {
              text: 'Save',
              handler: (data) => handleSaveName(data.newName),
            },
          ]}
        />

        {/* EDIT PHONE MODAL */}
        <IonAlert
          isOpen={showPhoneAlert}
          onDidDismiss={() => setShowPhoneAlert(false)}
          header="Update Phone Number"
          inputs={[
            {
              name: 'newPhone',
              type: 'tel',
              placeholder: '+1 555-0000',
              value: userPhone,
            },
          ]}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            {
              text: 'Save',
              handler: (data) => handleSavePhone(data.newPhone),
            },
          ]}
        />

        {/* ADD EMERGENCY CONTACT MODAL */}
        <IonAlert
          isOpen={showAddContactAlert}
          onDidDismiss={() => setShowAddContactAlert(false)}
          header="Add Emergency Contact"
          inputs={[
            {
              name: 'contactName',
              type: 'text',
              placeholder: 'Name (e.g. John Doe)',
            },
            {
              name: 'contactPhone',
              type: 'tel',
              placeholder: 'Phone (+1 555-0000)',
            },
            {
              name: 'contactRelation',
              type: 'text',
              placeholder: 'Relationship (e.g. Spouse, Friend)',
            },
          ]}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            {
              text: 'Add',
              handler: (data) =>
                handleAddEmergencyContact(
                  data.contactName,
                  data.contactPhone,
                  data.contactRelation
                ),
            },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default YourLinkPage;