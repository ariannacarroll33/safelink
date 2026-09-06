import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonItem,
  IonGrid,
  IonRow,
  IonCol,
  IonActionSheet
} from '@ionic/react';

import {
  personOutline,
  callOutline,
  arrowBackOutline,
  addOutline,
  bookOutline, 
  createOutline,
  trashOutline
} from 'ionicons/icons';

import { useHistory } from 'react-router-dom';

// Capacitor Native Contacts Plugin
import { Contacts } from '@capacitor-community/contacts';

interface Contact {
  id: string;
  name: string;
  countryCode: string;
  phone: string;
}

const EmergencyContact: React.FC = () => {
  const history = useHistory();
  
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: '', countryCode: '+353', phone: '' }
  ]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);

  const requiredAsterisk = (
    <span style={{ color: '#E6A937', marginLeft: '4px' }}>*</span>
  );

  const updateContactField = (id: string, field: keyof Contact, value: string) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addNewManualContact = () => {
    const newId = Date.now().toString();
    setContacts(prev => [...prev, { id: newId, name: '', countryCode: '+353', phone: '' }]);
  };

  // Helper to separate country code from raw phone number
  const parsePhoneNumber = (rawPhone: string) => {
    const cleaned = rawPhone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      // Basic extraction of 1-3 digit country codes
      const match = cleaned.match(/^(\+\d{1,3})(\d+)$/);
      if (match) {
        return { countryCode: match[1], phone: match[2] };
      }
    }
    return { countryCode: '+353', phone: cleaned };
  };

  // Import directly using native iOS contacts picker
  const handleImportFromDevice = async () => {
    try {
      // Check and request permission on iOS
      const permission = await Contacts.requestPermissions();
      if (permission.contacts !== 'granted') {
        setToastMessage('Contacts access permission was denied.');
        setShowToast(true);
        return;
      }

      // Opens the native iOS Contact Picker
      const result = await Contacts.pickContact({
        projection: {
          name: true,
          phones: true
        }
      });

      if (!result || !result.contact) {
        return; // User cancelled selection
      }

      const nativeContact = result.contact;
      
      // Extract full name
      const displayName = 
        nativeContact.name?.display ||
        `${nativeContact.name?.given || ''} ${nativeContact.name?.family || ''}`.trim() ||
        'Unknown Contact';

      // Extract first phone number available
      const rawPhone = nativeContact.phones?.[0]?.number || '';
      const { countryCode, phone } = parsePhoneNumber(rawPhone);

      const importedContact: Contact = {
        id: Date.now().toString(),
        name: displayName,
        countryCode,
        phone
      };

      // Replace initial empty slot or append to existing array
      setContacts(prev => {
        if (prev.length === 1 && !prev[0].name && !prev[0].phone) {
          return [importedContact];
        }
        return [...prev, importedContact];
      });

      setToastMessage('Contact imported successfully.');
      setShowToast(true);
    } catch (err: any) {
      console.error('Error selecting contact:', err);
      if (err?.message !== 'User cancelled') {
        setToastMessage('Could not access native contacts.');
        setShowToast(true);
      }
    }
  };

  const removeContact = (id: string) => {
    if (contacts.length === 1) {
      setContacts([{ id: '1', name: '', countryCode: '+353', phone: '' }]);
    } else {
      setContacts(contacts.filter(c => c.id !== id));
    }
  };

  const isFormValid = contacts.every(
    c => c.name.trim() !== '' && c.countryCode.trim() !== '' && c.phone.trim() !== ''
  );

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setToastMessage('Please fill in all required fields for your contacts.');
      setShowToast(true);
      return;
    }
    history.push('Home');
  };

  const dynamicButtonStyle = {
    '--background': isFormValid ? '#FFEBB7' : '#FFFFFF',
    '--color': '#444444',
    '--border-radius': '16px',
    '--border-color': '#999999',
    '--border-style': 'solid',
    '--border-width': '1px',
    height: '52px',
    fontWeight: 'bold',
    fontSize: '18px',
    margin: 0
  };

  return (
    <IonPage>
      {/* HEADER */}
      <div style={headerStyle}>
        <button onClick={() => history.goBack()} style={backButtonStyle} type="button">
          <IonIcon icon={arrowBackOutline} style={{ color: '#FFFFFF', fontSize: '24px' }} />
        </button>
        <h1 style={headerTitleStyle}>Create Account</h1>
        <div style={{ width: '40px' }} />
      </div>

      <IonContent className="ion-padding" style={pageBackgroundStyle}>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header="Add Emergency Contact"
          buttons={[
            {
              text: 'Import from Contacts',
              icon: bookOutline,
              handler: () => { handleImportFromDevice(); }
            },
            {
              text: 'Add Manually',
              icon: createOutline,
              handler: () => { addNewManualContact(); }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        {/* LOGO */}
        <div style={logoContainerStyle}>
          <div style={outerCircleStyle}>
            <div style={innerCircleStyle} />
          </div>
        </div>

        {/* TITLES */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={mainTitleStyle}>Emergency Contact</h2>
          <p style={descriptionStyle}>
            Add one or more emergency contacts. These numbers will be alerted by default if the SOS button is activated.
          </p>
        </div>

        <form onSubmit={handleNext} style={{ padding: '0 10px', marginBottom: '160px' }}>
          
          {contacts.map((contact, index) => (
            <div key={contact.id} style={contactCardContainer}>
              <div style={cardHeaderRow}>
                <span style={cardIndexLabel}>Contact #{index + 1}</span>
                {contacts.length > 1 && (
                  <button type="button" onClick={() => removeContact(contact.id)} style={deleteContactButton}>
                    <IonIcon icon={trashOutline} />
                  </button>
                )}
              </div>

              {/* CONTACT NAME */}
              <div style={{ marginBottom: '12px' }}>
                <div style={labelStyle}>Contact Name {requiredAsterisk}</div>
                <div style={boxStyle}>
                  <IonItem lines="none" style={itemStyle}>
                    <IonIcon slot="start" icon={personOutline} style={{ color: '#999' }} />
                    <IonInput
                      value={contact.name}
                      onIonInput={(e) => updateContactField(contact.id, 'name', e.detail.value!)}
                      placeholder="Add name"
                    />
                  </IonItem>
                </div>
              </div>

              {/* PHONE NUMBER GROUP */}
              <div style={{ marginBottom: '8px' }}>
                <div style={labelStyle}>Add Phone {requiredAsterisk}</div>
                <IonGrid className="ion-no-padding">
                  <IonRow style={{ gap: '12px', display: 'flex', flexWrap: 'nowrap' }}>
                    <IonCol style={{ flex: '0 0 28%' }}>
                      <div style={boxStyle}>
                        <IonItem lines="none" style={itemStyle}>
                          <IonInput
                            value={contact.countryCode}
                            onIonInput={(e) => updateContactField(contact.id, 'countryCode', e.detail.value!)}
                            placeholder="+353"
                            style={{ textAlign: 'center' }}
                          />
                        </IonItem>
                      </div>
                    </IonCol>
                    <IonCol style={{ flex: '1' }}>
                      <div style={boxStyle}>
                        <IonItem lines="none" style={itemStyle}>
                          <IonIcon slot="start" icon={callOutline} style={{ color: '#999' }} />
                          <IonInput
                            type="tel"
                            value={contact.phone}
                            onIonInput={(e) => updateContactField(contact.id, 'phone', e.detail.value!)}
                            placeholder="87 123 4567"
                          />
                        </IonItem>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
            </div>
          ))}

          {/* BOTÓN MÁS (+) */}
          <div style={addButtonWrapper}>
            <button 
              type="button" 
              onClick={() => setShowActionSheet(true)} 
              style={circularAddButton}
            >
              <IonIcon icon={addOutline} style={{ fontSize: '28px', color: '#633A0E' }} />
            </button>
            <span style={addButtonLabel}>Add another contact</span>
          </div>

          {/* BOTÓN FIJO INFERIOR */}
          <div style={bottomContainerStyle}>
            <IonButton
              expand="block"
              type="submit"
              style={dynamicButtonStyle}
            >
              Explore SafeLink!
            </IonButton>
          </div>

        </form>
      </IonContent>
    </IonPage>
  );
};

/* 🎨 ESTILOS CSS */
const pageBackgroundStyle = { '--background': '#FFEBB7' };
const headerStyle: React.CSSProperties = { backgroundColor: '#E5A93C', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' };
const backButtonStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const headerTitleStyle: React.CSSProperties = { color: '#FFFFFF', fontSize: '22px', fontWeight: '700', margin: 0 };

const logoContainerStyle: React.CSSProperties = { display: 'flex', marginTop: '24px', marginBottom: '20px', alignSelf: 'center', justifyContent: 'center' };

const outerCircleStyle: React.CSSProperties = { width: '54px', height: '54px', borderRadius: '50%', border: '2px dashed #fcdf67', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const innerCircleStyle: React.CSSProperties = { width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#A97D40' };
const mainTitleStyle: React.CSSProperties = { fontSize: '28px', fontWeight: '700', color: '#d6b53d', margin: '0 0 10px 0' };
const descriptionStyle: React.CSSProperties = { fontSize: '14px', color: '#A05C1B', lineHeight: '1.5', margin: '0 auto', maxWidth: '310px', fontWeight: '500' };
const boxStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: '12px', border: '1px solid #999999', padding: '2px 8px' };
const itemStyle: React.CSSProperties = { '--background': 'transparent', '--min-height': 'unset' } as any;
const labelStyle: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: '#444', marginBottom: '6px' };
const bottomContainerStyle: React.CSSProperties = { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#E5A93C', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px', boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.08)', zIndex: 10 };

const contactCardContainer: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.4)',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '20px',
  border: '1.5px dashed rgba(160, 92, 27, 0.2)'
};

const cardHeaderRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const cardIndexLabel: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold', color: '#A05C1B', textTransform: 'uppercase' };
const deleteContactButton: React.CSSProperties = { background: 'none', border: 'none', color: '#C62828', fontSize: '20px', cursor: 'pointer', padding: '4px' };
const addButtonWrapper: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '24px 0' };
const circularAddButton: React.CSSProperties = { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#E5A93C', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', marginBottom: '8px' };
const addButtonLabel: React.CSSProperties = { fontSize: '15px', fontWeight: 'bold', color: '#633A0E' };

export default EmergencyContact;