import React, { useState, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonToast,
  IonHeader,
  IonToolbar,
  IonInput
} from '@ionic/react';
import { arrowBackOutline, pinOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

// FIREBASE
import { auth, db } from '../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const EnterPasscode: React.FC = () => {
  const history = useHistory();

  const [passcode, setPasscode] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const inputRefs = [
    useRef<HTMLIonInputElement>(null),
    useRef<HTMLIonInputElement>(null),
    useRef<HTMLIonInputElement>(null),
    useRef<HTMLIonInputElement>(null),
  ];

  const handleInputChange = (value: string, index: number) => {
    const digit = value.slice(-1);
    const newPasscode = [...passcode];
    newPasscode[index] = digit;
    setPasscode(newPasscode);

    if (digit !== '' && index < 3) {
      inputRefs[index + 1].current?.setFocus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLIonInputElement>, index: number) => {
    if (e.key === 'Backspace' && passcode[index] === '' && index > 0) {
      inputRefs[index - 1].current?.setFocus();
    }
  };

  const isPasscodeComplete = passcode.every(digit => digit !== '');
  const finalPasscodeString = passcode.join('');

  const handleNext = async () => {
    if (!isPasscodeComplete || loading) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setToastMessage('User session not found. Please log in again.');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        emergencyPasscode: finalPasscodeString,
        passcodeUpdatedAt: new Date().toISOString()
      });
      setLoading(false);
      setToastMessage('Passcode set successfully!');
      setShowToast(true);
      history.push('/emergency-contact'); 
    } catch (error: any) {
      setLoading(false);
      console.error('Error saving passcode:', error);
      setToastMessage(`Failed to save passcode: ${error.message}`);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={headerToolbarStyle}>
          <div style={headerFlexContainer}>
            <button onClick={() => history.goBack()} style={backButtonStyle} type="button">
              <IonIcon icon={arrowBackOutline} style={{ color: '#FFFFFF', fontSize: '24px' }} />
            </button>
            <h1 style={headerTitleStyle}>Create Password</h1>
            <div style={{ width: '40px' }} />
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={contentBackgroundStyle} scrollY={false}>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        <div style={centerContainerStyle}>
          <div style={iconCircleStyle}>
            <IonIcon icon={pinOutline} style={{ color: '#D58D1F', fontSize: '28px' }} />
          </div>

          <h2 style={titleStyle}>Enter Passcode</h2>
          <p style={subtitleStyle}>
            This code will be used to stop emergency texts being sent.
          </p>

          <div style={passcodeRowStyle}>
            {passcode.map((digit, index) => (
              <div key={index} style={digitBoxStyle}>
                <IonInput
                  ref={inputRefs[index]}
                  type="number"
                  value={digit}
                  onIonInput={(e) => handleInputChange(e.detail.value || '', index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder="0"
                  maxlength={1}
                  style={{
                    textAlign: 'center',
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#633A0E',
                    '--background': 'transparent'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={footerTrayStyle}>
          <button
            onClick={handleNext}
            style={{
              backgroundColor: isPasscodeComplete ? '#FFB703' : '#FFE8A3', 
              color: isPasscodeComplete ? '#FFFFFF' : '#A68542',
              
              borderRadius: '30px', 
              height: '54px',
              width: '100%',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              letterSpacing: '0.5px',
              cursor: isPasscodeComplete ? 'pointer' : 'default',
              transition: 'all 0.2s ease-in-out',
              boxShadow: isPasscodeComplete ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'SAVING...' : 'NEXT'}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

/* styles */
const contentBackgroundStyle = { '--background': '#FFEBB7' };
const headerToolbarStyle = { '--background': '#E5A93C', '--border-width': '0' };
const headerFlexContainer: React.CSSProperties = { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' };
const backButtonStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const headerTitleStyle: React.CSSProperties = { color: '#FFFFFF', fontSize: '22px', fontWeight: '700', margin: 0 };

const centerContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '40px',
  padding: '0 24px'
};

const iconCircleStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: 'rgba(229, 169, 60, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
  border: '1px solid rgba(229, 169, 60, 0.3)'
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#633A0E',
  margin: '0 0 10px 0',
  textAlign: 'center'
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#A06A32',
  textAlign: 'center',
  lineHeight: '1.4',
  fontWeight: '600',
  margin: '0 0 35px 0',
  padding: '0 15px'
};

const passcodeRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  width: '100%'
};

const digitBoxStyle: React.CSSProperties = {
  width: '50px',
  height: '54px',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #B59E7A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
};

const footerTrayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#D99A2B',
  borderTopLeftRadius: '24px',
  borderTopRightRadius: '24px',
  padding: '20px 24px 30px 24px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

export default EnterPasscode;