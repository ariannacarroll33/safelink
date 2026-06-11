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
  IonCol
} from '@ionic/react';

import {
  personOutline,
  callOutline,
  arrowBackOutline
} from 'ionicons/icons';

import { useHistory } from 'react-router-dom';

const EmergencyContact: React.FC = () => {
  const [contactName, setContactName] = useState('');
  const [countryCode, setCountryCode] = useState('+353');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const history = useHistory();

  // Yellow asterisk element for required fields
  const requiredAsterisk = (
    <span style={{ color: '#E6A937', marginLeft: '4px' }}>*</span>
  );

  // Checks if every required input contains a valid value
  const isFormValid = contactName.trim() !== '' && countryCode.trim() !== '' && phoneNumber.trim() !== '';

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent navigation completely if fields are missing
    if (!isFormValid) {
      setToastMessage('Please fill in all required fields.');
      setShowToast(true);
      return;
    }

    // Replace '/nextScreen' with your actual next route name
    history.push('/nextScreen', { contactName, countryCode, phoneNumber });
  };

  // Dynamically switch button colors between clear White and Pastel Yellow (#FFEBB7)
  const dynamicButtonStyle = {
    '--background': isFormValid ? '#FFEBB7' : '#FFFFFF',
    '--color': '#444444', // Dark neutral text for maximum readability on yellow/white backgrounds
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
        <button 
          onClick={() => history.goBack()} 
          style={backButtonStyle}
          type="button"
        >
          <IonIcon icon={arrowBackOutline} style={{ color: '#FFFFFF', fontSize: '24px' }} />
        </button>
        <h1 style={headerTitleStyle}>Create Account</h1>
        <div style={{ width: '40px' }} /> {/* Spacer to balance the layout */}
      </div>

      <IonContent className="ion-padding" style={pageBackgroundStyle}>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        {/* LOGO / GRAPHIC TARGET */}
        <div style={logoContainerStyle}>
          <div style={outerCircleStyle}>
            <div style={innerCircleStyle} />
          </div>
        </div>

        {/* TITLE & DESCRIPTION */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={mainTitleStyle}>Emergency Contact</h2>
          <p style={descriptionStyle}>
            Add your emergency contact. This number will be alerted by default if SOS button is activated. This can be changed at any time.
          </p>
        </div>

        <form onSubmit={handleNext} style={{ padding: '0 10px', marginBottom: '140px' }}>
          
          {/* CONTACT NAME */}
          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>
              Contact Name {requiredAsterisk}
            </div>
            <div style={boxStyle}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={personOutline} style={{ color: '#999' }} />
                <IonInput
                  value={contactName}
                  onIonInput={(e) => setContactName(e.detail.value!)}
                  placeholder="Add name"
                />
              </IonItem>
            </div>
          </div>

          {/* PHONE NUMBER GROUP */}
          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>
              Add Phone {requiredAsterisk}
            </div>
            <IonGrid className="ion-no-padding">
              <IonRow style={{ gap: '12px', display: 'flex', flexWrap: 'nowrap' }}>
                {/* Country Code */}
                <IonCol style={{ flex: '0 0 25%' }}>
                  <div style={boxStyle}>
                    <IonItem lines="none" style={itemStyle}>
                      <IonInput
                        value={countryCode}
                        onIonInput={(e) => setCountryCode(e.detail.value!)}
                        placeholder="+353"
                        style={{ textAlign: 'center' }}
                      />
                    </IonItem>
                  </div>
                </IonCol>
                {/* Phone Number */}
                <IonCol style={{ flex: '1' }}>
                  <div style={boxStyle}>
                    <IonItem lines="none" style={itemStyle}>
                      <IonIcon slot="start" icon={callOutline} style={{ color: '#999' }} />
                      <IonInput
                        type="tel"
                        value={phoneNumber}
                        onIonInput={(e) => setPhoneNumber(e.detail.value!)}
                        placeholder="87 123 4567"
                      />
                    </IonItem>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>

          {/* BOTTOM TRAY CONTROLLER BUTTON */}
          <div style={bottomContainerStyle}>
            <IonButton
              expand="block"
              type="submit"
              style={dynamicButtonStyle}
            >
              Next
            </IonButton>
          </div>

        </form>
      </IonContent>
    </IonPage>
  );
};

/* STYLES */
const pageBackgroundStyle = {
  '--background': '#FFEBB7'
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#E5A93C',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px'
};

const backButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const headerTitleStyle: React.CSSProperties = {
  color: '#FFFFFF',
  fontSize: '22px',
  fontWeight: '700',
  margin: 0
};

const logoContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginTop: '24px',
  marginBottom: '20px'
};

const outerCircleStyle: React.CSSProperties = {
  width: '54px',
  height: '54px',
  borderRadius: '50%',
  border: '2px dashed #fcdf67',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const innerCircleStyle: React.CSSProperties = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  backgroundColor: '#A97D40'
};

const mainTitleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#d6b53d',
  margin: '0 0 10px 0'
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#A05C1B',
  lineHeight: '1.5',
  margin: '0 auto',
  maxWidth: '310px',
  fontWeight: '500'
};

const boxStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #999999',
  padding: '2px 8px'
};

const itemStyle: React.CSSProperties = {
  '--background': 'transparent',
  '--min-height': 'unset'
} as any;

const labelStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#000',
  marginBottom: '8px',
  marginTop: '8px'
};

const bottomContainerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#E5A93C',
  borderTopLeftRadius: '32px',
  borderTopRightRadius: '32px',
  padding: '24px',
  boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.08)',
  zIndex: 10
};

export default EmergencyContact;