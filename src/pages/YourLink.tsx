import React, { useState, useRef, useEffect } from 'react';
import { IonContent, IonHeader, IonSearchbar, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonAvatar, IonToast, IonAlert, IonList, IonItem, IonLabel, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { notificationsOutline, closeCircleOutline, navigateOutline, linkOutline, cameraOutline, personOutline, createOutline, callOutline, peopleOutline, addCircleOutline, trashOutline, star, starOutline } from 'ionicons/icons';
import { IonModal, IonCheckbox, IonSpinner, IonFooter } from '@ionic/react';
import { saveEmergencyContacts } from '../services/contactsService';
import { cloudDownloadOutline } from 'ionicons/icons'; 
import { Capacitor } from '@capacitor/core';
import type { DocumentData } from 'firebase/firestore';
import { Contacts } from '@capacitor-community/contacts';
import './YourLink.css';

export interface EmergencyContact {
  contactId: string; 
  displayName: string;
  phoneNumber: string;
  relation?: string;
  selected?: boolean;
  favorite?: boolean;
}

// FIREBASE INTEGRATION
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, } from 'firebase/firestore';

const YourLinkPage = () => {
  const history = useHistory();
  const watchIdRef = useRef<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('User Account');
  const [userPhone, setUserPhone] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  const [isLive, setIsLive] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<string>('Location sharing disabled');
  const [lastKnownLocation, setLastKnownLocation] = useState<string>('');

  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showEditAlert, setShowEditAlert] = useState<boolean>(false);
  const [showPhoneAlert, setShowPhoneAlert] = useState<boolean>(false);
  const [showAddContactAlert, setShowAddContactAlert] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPickerModal, setShowPickerModal] = useState<boolean>(false);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerQuery, setPickerQuery] = useState<string>('');
  const [loadingContacts, setLoadingContacts] = useState<boolean>(false);

  // FETCH USER DATA FROM SIGN UP (createUser.tsx & Firebase)
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
        
        // Contacts selected during createUser.tsx
        if (Array.isArray(parsed.emergencyContacts)) setEmergencyContacts(parsed.emergencyContacts);
      } catch (e) {
        console.error('Error parsing local storage user data:', e);
      }
    }
    let data: DocumentData = {};
const currentUser = auth.currentUser;
if (currentUser) {
  const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
  if (docSnap.exists()) {
    data = docSnap.data();
  }
}
    if (Array.isArray(data.emergencyContacts)) {
  setEmergencyContacts(data.emergencyContacts);
}
const saveContactsToStorageAndFirebase = async (updatedList: EmergencyContact[]) => {
  setEmergencyContacts(updatedList);
  const savedSession = localStorage.getItem('safelink_user');
  const userData = savedSession ? JSON.parse(savedSession) : { id: userId };
  userData.emergencyContacts = updatedList;
  localStorage.setItem('safelink_user', JSON.stringify(userData));

  try {
    await saveEmergencyContacts(updatedList);
  } catch (e) {
    console.error('Error saving contacts to Firebase:', e);
    setToastMessage('Guardado solo en el móvil (sin conexión)');
    setShowToast(true);
  }
};
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.name) setUserName(data.name);
            if (data.phone) setUserPhone(data.phone);
            if (data.avatarUrl) setProfileImage(data.avatarUrl);
            if (Array.isArray(data.emergencyContacts) && data.emergencyContacts.length > 0) {
            setEmergencyContacts(data.emergencyContacts);
            }
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

  // GEOLOCATION
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
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
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
        () => setUserLocation('Location Permission Disabled'),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setUserLocation('Geolocation not supported');
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(Number(watchIdRef.current));
      }
    };
  }, [isLive]);

  const toggleLiveStatus = () => {
    setIsLive(!isLive);
    setToastMessage(!isLive ? 'Live location enabled' : 'Location sharing paused');
    setShowToast(true);
  };

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
          await updateDoc(doc(db, 'users', auth.currentUser.uid), { avatarUrl: base64Image });
        }

        setToastMessage('Profile picture updated!');
        setShowToast(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = async (newName: string) => {
    if (newName?.trim()) {
      const updated = newName.trim();
      setUserName(updated);
      const savedSession = localStorage.getItem('safelink_user');
      const userData = savedSession ? JSON.parse(savedSession) : { id: userId };
      userData.name = updated;
      localStorage.setItem('safelink_user', JSON.stringify(userData));
      window.dispatchEvent(new Event('safelink_user_updated'));

      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { name: updated });
      }
      setToastMessage('Name updated!');
      setShowToast(true);
    }
  };

  const handleSavePhone = async (newPhone: string) => {
    if (newPhone?.trim()) {
      const updated = newPhone.trim();
      setUserPhone(updated);
      const savedSession = localStorage.getItem('safelink_user');
      const userData = savedSession ? JSON.parse(savedSession) : { id: userId };
      userData.phone = updated;
      localStorage.setItem('safelink_user', JSON.stringify(userData));
      window.dispatchEvent(new Event('safelink_user_updated'));

      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { phone: updated });
      }
      setToastMessage('Phone number updated!');
      setShowToast(true);
    }
  };

  const saveContactsToStorageAndFirebase = async (updatedList: EmergencyContact[]) => {
    setEmergencyContacts(updatedList);
    const savedSession = localStorage.getItem('safelink_user');
    const userData = savedSession ? JSON.parse(savedSession) : { id: userId };
    userData.emergencyContacts = updatedList;
    localStorage.setItem('safelink_user', JSON.stringify(userData));

    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { emergencyContacts: updatedList });
    }
  };

  interface DeviceContact {
  id: string;
  name: string;
  phone: string;
}

const normalizePhone = (p: string) => p.replace(/[^\d+]/g, '');

const openDeviceContactsPicker = async () => {
  if (!Capacitor.isNativePlatform()) {
    setToastMessage('Esta función solo está disponible en la app móvil');
    setShowToast(true);
    return;
  }

  try {
    setLoadingContacts(true);

    const perm = await Contacts.requestPermissions();
    if (perm.contacts !== 'granted') {
      setToastMessage('Permiso de contactos denegado');
      setShowToast(true);
      return;
    }

    const { contacts } = await Contacts.getContacts({
      projection: { name: true, phones: true },
    });

    const list: DeviceContact[] = contacts
      .filter(c => c.phones && c.phones.length > 0 && c.phones[0].number)
      .map(c => ({
        id: c.contactId,
        name: c.name?.display || c.phones![0].number!,
        phone: c.phones![0].number!,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setDeviceContacts(list);
    setSelectedIds(new Set());
    setPickerQuery('');
    setShowPickerModal(true);
  } catch (e) {
    console.error('Error reading device contacts:', e);
    setToastMessage('No se pudieron leer los contactos');
    setShowToast(true);
  } finally {
    setLoadingContacts(false);
  }
};

const toggleSelectDeviceContact = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};

const handleImportSelected = async () => {
  // Evita duplicados comparando por teléfono
  const existingPhones = new Set(emergencyContacts.map(c => normalizePhone(c.phoneNumber)));

  const toAdd: EmergencyContact[] = deviceContacts
    .filter(c => selectedIds.has(c.id) && !existingPhones.has(normalizePhone(c.phone)))
    .map(c => ({
      contactId: `contact_${Date.now()}_${c.id}`,
      displayName: c.name,
      phoneNumber: c.phone,
      relation: '',
      favorite: false,
    }));

  if (toAdd.length === 0) {
    setToastMessage('Esos contactos ya estaban en tu lista');
    setShowToast(true);
    setShowPickerModal(false);
    return;
  }

  await saveContactsToStorageAndFirebase([...emergencyContacts, ...toAdd]);
  setShowPickerModal(false);
  setToastMessage(`${toAdd.length} contacto(s) añadido(s)`);
  setShowToast(true);
};

const filteredDeviceContacts = deviceContacts.filter(c => {
  const q = pickerQuery.trim().toLowerCase();
  if (!q) return true;
  return c.name.toLowerCase().includes(q) || normalizePhone(c.phone).includes(normalizePhone(q));
});

  const handleAddEmergencyContact = async (contactName: string, contactPhone: string, contactRelation?: string) => {
    if (contactName && contactPhone) {
      const newContact: EmergencyContact = {
        contactId: `contact_${Date.now()}`,   
        displayName: contactName.trim(),      
        phoneNumber: contactPhone.trim(),
        relation: contactRelation?.trim() || '',
        favorite: false,
      };
      await saveContactsToStorageAndFirebase([...emergencyContacts, newContact]);
      setToastMessage('Emergency contact added!');
      setShowToast(true);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    const updatedList = emergencyContacts.filter(c => c.contactId !== contactId);
    await saveContactsToStorageAndFirebase(updatedList);
    setToastMessage('Contact deleted');
    setShowToast(true);
  };

  const handleToggleFavorite = async (contactId: string) => {
    const currentFavoritesCount = emergencyContacts.filter(c => c.favorite).length;
    const updatedList = emergencyContacts.map(c => {
      if (c.contactId === contactId) {
        const nextFavoriteState = !c.favorite;
        if (nextFavoriteState && currentFavoritesCount >= 10) return c; 
        return { ...c, favorite: nextFavoriteState };
      }
      return c;
    });

    await saveContactsToStorageAndFirebase(updatedList);
    setToastMessage('Favorites updated');
    setShowToast(true);
  };

  const favoriteContacts = emergencyContacts.filter(c => c.favorite);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = normalizedQuery
  ? emergencyContacts.filter(c =>
      c.displayName.toLowerCase().includes(normalizedQuery) ||
      (c.relation || '').toLowerCase().includes(normalizedQuery) ||
      c.phoneNumber.replace(/\s+/g, '').includes(normalizedQuery.replace(/\s+/g, ''))
    )
  : [];

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
              <span className="location-label">{isLive ? 'Current location' : 'Last known location'}</span>
              <span className="location-address">{isLive ? userLocation : lastKnownLocation || 'Sharing Paused'}</span>
            </div>
            <button type="button" className={`live-badge-btn ${isLive ? 'badge-live' : 'badge-paused'}`} onClick={toggleLiveStatus}>
              <span className={`live-dot ${isLive ? 'dot-green' : 'dot-red'}`}></span>
              {isLive ? 'Live' : 'Off'}
            </button>
          </div>
        </div>

        <div className="profile-hero-section">
          <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
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
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />

          <div className="hero-text-container">
            <div className="editable-name-row" onClick={() => setShowEditAlert(true)}>
              <h1 className="hero-title">{userName}</h1>
              <IonIcon icon={createOutline} className="edit-icon" />
            </div>
          </div>
        </div>

        {/* PHONE NUMBER CARD */}
        <div className="info-card" style={{ margin: '0 16px 16px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IonIcon icon={callOutline} style={{ fontSize: '20px', color: '#633A0E' }} />
              <div>
                <span style={{ fontSize: '12px', color: '#7d7267', display: 'block' }}>Phone Number</span>
                <strong style={{ fontSize: '15px', color: '#2c2117' }}>{userPhone || 'Not provided'}</strong>
              </div>
            </div>
            <IonButton fill="clear" onClick={() => setShowPhoneAlert(true)}>
              <IonIcon icon={createOutline} style={{ color: '#633A0E' }} />
            </IonButton>
          </div>
        </div>

        {/* EMERGENCY CONTACTS CARD */}
        <div className="info-card" style={{ margin: '0 16px 24px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={peopleOutline} style={{ fontSize: '20px', color: '#633A0E' }} />
              <div>
                <strong style={{ fontSize: '16px', color: '#633A0E', display: 'block' }}>Emergency Contacts</strong>
                <span style={{ fontSize: '11px', color: '#7d7267' }}>
                </span>
              </div>
            </div>
            <IonButton fill="clear" onClick={() => setShowAddContactAlert(true)}>
              <IonIcon icon={addCircleOutline} style={{ fontSize: '22px', color: '#633A0E' }} />
            </IonButton>
          </div>
      <IonButton
        expand="block"
        fill="outline"
        onClick={openDeviceContactsPicker}
        disabled={loadingContacts}
        style={{ '--color': '#633A0E', '--border-color': '#633A0E', marginTop: '8px' }}>
        {loadingContacts ? <IonSpinner name="dots" /> : (<> <IonIcon slot="start" icon={cloudDownloadOutline} />Search through your contacts </>)} </IonButton>
          <IonList lines="none" style={{ background: 'transparent' }}>
            {emergencyContacts.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#7d7267', textAlign: 'center', margin: '8px 0' }}>
                No emergency contacts added yet.
              </p> ) : (
                
              emergencyContacts.map((contact) => (
                <IonItem key={contact.contactId} style={{ '--background': '#f8f6f2', borderRadius: '12px', marginBottom: '8px' }}>
                  <IonButton slot="start" fill="clear" onClick={() => handleToggleFavorite(contact.contactId)}>
                    <IonIcon icon={contact.favorite ? star : starOutline} style={{ fontSize: '20px', color: contact.favorite ? '#ffc107' : '#ccc' }} />
                  </IonButton>
                  <IonModal isOpen={showPickerModal} onDidDismiss={() => setShowPickerModal(false)}>
  <IonHeader>
    <IonToolbar>
      <IonButtons slot="start">
        <IonButton onClick={() => setShowPickerModal(false)}>Cancel</IonButton>
      </IonButtons>
      <IonTitle>Your contacts</IonTitle>
    </IonToolbar>
    <IonToolbar>
      <IonSearchbar
        value={pickerQuery}
        onIonInput={(e) => setPickerQuery(e.detail.value || '')}
        placeholder="Buscar por nombre o teléfono"
        debounce={150}
      />
    </IonToolbar>
  </IonHeader>

  <IonContent>
    <IonList>
      {filteredDeviceContacts.map(c => (
        <IonItem key={c.id} button detail={false} onClick={() => toggleSelectDeviceContact(c.id)}>
          <IonCheckbox slot="start" checked={selectedIds.has(c.id)} style={{ pointerEvents: 'none' }} />
          <IonLabel>
            <h3>{c.name}</h3>
            <p>{c.phone}</p>
          </IonLabel>
        </IonItem>
      ))}
      {filteredDeviceContacts.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7d7267' }}>Contacts not found.</p>
      )}
    </IonList>
  </IonContent>

  <IonFooter>
    <IonToolbar>
      <IonButton
        expand="block"
        disabled={selectedIds.size === 0}
        onClick={handleImportSelected}
        style={{ margin: '8px 16px' }}
      >
        Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
      </IonButton>
    </IonToolbar>
  </IonFooter>
</IonModal>
                  <IonLabel>
                    <h3 style={{ fontWeight: '700', color: '#2c2117' }}>
                      {contact.displayName} {contact.favorite && <span style={{fontSize: '10px', background: '#ffc107', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px'}}>Fav</span>}
                    </h3>
                    <p style={{ color: '#7d7267', fontSize: '12px' }}>
                      {contact.relation ? `${contact.relation} • ` : ''}{contact.phoneNumber}
                    </p>
                  </IonLabel>
                  <IonButton slot="end" fill="clear" href={`tel:${contact.phoneNumber}`}>
                    <IonIcon icon={callOutline} style={{ color: '#2e7d32' }} />
                  </IonButton>
                  <IonButton slot="end" fill="clear" onClick={() => handleDeleteContact(contact.contactId)}>
                    <IonIcon icon={trashOutline} style={{ color: '#d32f2f' }} />
                  </IonButton>
                </IonItem>
              ))
            )}
          </IonList>
        </div>
{/* FAVORITES CARD */}
<div className="info-card" style={{ margin: '0 16px 24px', padding: '16px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
    <IonIcon icon={star} style={{ fontSize: '20px', color: '#ffc107' }} />
    <div>
      <strong style={{ fontSize: '16px', color: '#633A0E', display: 'block' }}>Favorites</strong>
      <span style={{ fontSize: '11px', color: '#7d7267' }}>{favoriteContacts.length}/10</span>
    </div>
  </div>

  <IonSearchbar
    value={searchQuery}
    onIonInput={(e) => setSearchQuery(e.detail.value || '')}
    onIonClear={() => setSearchQuery('')}
    placeholder="Search your contacts"
    debounce={150}
    style={{ '--background': '#f8f6f2', '--border-radius': '12px', padding: 0, marginBottom: '8px' }}
  />

  <IonList lines="none" style={{ background: 'transparent' }}>
    {normalizedQuery ? (
      searchResults.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#7d7267', textAlign: 'center', margin: '8px 0' }}>
          No contacts match "{searchQuery}".
        </p>
      ) : (
        searchResults.map(contact => (
          <IonItem key={contact.contactId} style={{ '--background': '#f8f6f2', borderRadius: '12px', marginBottom: '8px' }}>
            <IonLabel>
              <h3 style={{ fontWeight: '700', color: '#2c2117' }}>{contact.displayName}</h3>
              <p style={{ color: '#7d7267', fontSize: '12px' }}>
                {contact.relation ? `${contact.relation} • ` : ''}{contact.phoneNumber}
              </p>
            </IonLabel>
            <IonButton slot="end" fill="clear" onClick={() => handleToggleFavorite(contact.contactId)}>
              <IonIcon
                icon={contact.favorite ? star : starOutline}
                style={{ fontSize: '22px', color: contact.favorite ? '#ffc107' : '#ccc' }}
              />
            </IonButton>
          </IonItem>
        ))
      )
    ) : favoriteContacts.length === 0 ? (
      <p style={{ fontSize: '13px', color: '#7d7267', textAlign: 'center', margin: '8px 0' }}>
        No favorites yet. Search a contact above and tap the star.
      </p>
    ) : (
      favoriteContacts.map(contact => (
        <IonItem key={contact.contactId} style={{ '--background': '#f8f6f2', borderRadius: '12px', marginBottom: '8px' }}>
          <IonLabel>
            <h3 style={{ fontWeight: '700', color: '#2c2117' }}>{contact.displayName}</h3>
            <p style={{ color: '#7d7267', fontSize: '12px' }}>
              {contact.relation ? `${contact.relation} • ` : ''}{contact.phoneNumber}
            </p>
          </IonLabel>
          <IonButton slot="end" fill="clear" href={`tel:${contact.phoneNumber}`}>
            <IonIcon icon={callOutline} style={{ color: '#2e7d32' }} />
          </IonButton>
          <IonButton slot="end" fill="clear" onClick={() => handleToggleFavorite(contact.contactId)}>
            <IonIcon icon={closeCircleOutline} style={{ color: '#999' }} />
          </IonButton>
        </IonItem>
      ))
    )}
  </IonList>
</div>


        <IonAlert
          isOpen={showEditAlert}
          onDidDismiss={() => setShowEditAlert(false)}
          header="Change Display Name"
          inputs={[{ name: 'newName', type: 'text', placeholder: 'Enter your name', value: userName }]}
          buttons={[{ text: 'Cancel', role: 'cancel' }, { text: 'Save', handler: (data) => handleSaveName(data.newName) }]}
        />

        <IonAlert
          isOpen={showPhoneAlert}
          onDidDismiss={() => setShowPhoneAlert(false)}
          header="Update Phone Number"
          inputs={[{ name: 'newPhone', type: 'tel', placeholder: '+1 555-0000', value: userPhone }]}
          buttons={[{ text: 'Cancel', role: 'cancel' }, { text: 'Save', handler: (data) => handleSavePhone(data.newPhone) }]}
        />

        <IonAlert
          isOpen={showAddContactAlert}
          onDidDismiss={() => setShowAddContactAlert(false)}
          header="Add Emergency Contact"
          inputs={[
            { name: 'contactName', type: 'text', placeholder: 'Name (e.g. John Doe)' },
            { name: 'contactPhone', type: 'tel', placeholder: 'Phone (+1 555-0000)' },
            { name: 'contactRelation', type: 'text', placeholder: 'Relationship (e.g. Spouse, Friend)' },
          ]}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Add', handler: (data) => handleAddEmergencyContact(data.contactName, data.contactPhone, data.contactRelation) }
          ]}
        />

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2000} />
      </IonContent>
    </IonPage>
  );
};

export default YourLinkPage;