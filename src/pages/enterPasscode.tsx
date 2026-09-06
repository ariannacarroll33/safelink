import React, { useState, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonToast,
  IonHeader,
  IonToolbar,
  IonInput
} from '@ionic/react';
import { arrowBackOutline, pinOutline, lockClosedOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

// FIREBASE
import { auth, db } from '../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const EnterPasscode: React.FC = () => {
  const history = useHistory();

  // Step 1: Initial Passcode | Step 2: Confirm Passcode
  const [step, setStep] = useState<1 | 2>(1);
  const [passcode, setPasscode] = useState<string[]>(['', '', '', '']);
  const [confirmPasscode, setConfirmPasscode] = useState<string[]>(['', '', '', '']);

  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Fixed hook usage for refs array
  const inputRefs = useRef<Array<HTMLIonInputElement | null>>([]);
  const confirmInputRefs = useRef<Array<HTMLIonInputElement | null>>([]);

  const handleInputChange = (
    value: string, 
    index: number, 
    isConfirm: boolean = false
  ) => {
    const digit = value.slice(-1);
    const targetState = isConfirm ? [...confirmPasscode] : [...passcode];
    const targetRefs = isConfirm ? confirmInputRefs : inputRefs;

    targetState[index] = digit;

    if (isConfirm) {
      setConfirmPasscode(targetState);
    } else {
      setPasscode(targetState);
    }

    // Auto focus next input
    if (digit !== '' && index < 3) {
      targetRefs.current[index + 1]?.setFocus();
    }

    // Auto advance to Step 2 when Step 1 is complete
    if (!isConfirm && index === 3 && digit !== '') {
      const fullPasscode = [...targetState].join('');
      if (fullPasscode.length === 4) {
        setTimeout(() => {
          setStep(2);
        }, 150);
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLIonInputElement>, 
    index: number, 
    isConfirm: boolean = false
  ) => {
    const targetState = isConfirm ? confirmPasscode : passcode;
    const targetRefs = isConfirm ? confirmInputRefs : inputRefs;

    if (e.key === 'Backspace' && targetState[index] === '' && index > 0) {
      targetRefs.current[index - 1]?.setFocus();
    }
  };

  const currentDigits = step === 1 ? passcode : confirmPasscode;
  const isCurrentComplete = currentDigits.every(digit => digit !== '');

  const handleNext = async () => {
    if (!isCurrentComplete || loading) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    // Validation step 2
    const originalPin = passcode.join('');
    const confirmedPin = confirmPasscode.join('');

    if (originalPin !== confirmedPin) {
      setToastMessage('Passcodes do not match. Please try again.');
      setShowToast(true);
      setConfirmPasscode(['', '', '', '']);
      confirmInputRefs.current[0]?.setFocus();
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setToastMessage('User session not found. Please log in again.');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      // Save directly to user document in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        emergencyPasscode: confirmedPin,
        passcodeUpdatedAt: new Date().toISOString()
      });

      setLoading(false);
      setToastMessage('Passcode set successfully!');
      setShowToast(true);
      history.push('/emergencyContact'); 
    } catch (error: any) {
      setLoading(false);
      console.error('Error saving passcode:', error);
      setToastMessage(`Failed to save passcode: ${error.message}`);
      setShowToast(true);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setConfirmPasscode(['', '', '', '']);
    } else {
      history.goBack();
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={headerToolbarStyle}>
          <div style={headerFlexContainer}>
            <button onClick={handleBack} style={backButtonStyle} type="button">
              <IonIcon icon={arrowBackOutline} style={{ color: '#FFFFFF', fontSize: '24px' }} />
            </button>
            <h1 style={headerTitleStyle}>{step === 1 ? 'Create Passcode' : 'Confirm Passcode'}</h1>
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
            <IonIcon 
              icon={step === 1 ? pinOutline : lockClosedOutline} 
              style={{ color: '#D58D1F', fontSize: '28px' }} 
            />
          </div>

          <h2 style={titleStyle}>
            {step === 1 ? 'Enter Passcode' : 'Re-enter Passcode'}
          </h2>
          <p style={subtitleStyle}>
            {step === 1 
              ? 'This code will be used to stop emergency texts being sent.'
              : 'Please confirm your 4-digit passcode to complete setup.'
            }
          </p>

          <div style={passcodeRowStyle}>
            {currentDigits.map((digit, index) => (
              <div key={`${step}-${index}`} style={digitBoxStyle}>
                <IonInput
                  ref={(el: HTMLIonInputElement | null) => {
                    if (step === 1) inputRefs.current[index] = el;
                    else confirmInputRefs.current[index] = el;
                  }}
                  type="number"
                  value={digit}
                  onIonInput={(e) => handleInputChange(e.detail.value || '', index, step === 2)}
                  onKeyDown={(e) => handleKeyDown(e, index, step === 2)}
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
            disabled={!isCurrentComplete || loading}
            style={{
              backgroundColor: isCurrentComplete ? '#FFB703' : '#FFE8A3', 
              color: isCurrentComplete ? '#FFFFFF' : '#A68542',
              borderRadius: '30px', 
              height: '54px',
              width: '100%',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              letterSpacing: '0.5px',
              cursor: isCurrentComplete ? 'pointer' : 'default',
              transition: 'all 0.2s ease-in-out',
              boxShadow: isCurrentComplete ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'SAVING...' : step === 1 ? 'NEXT' : 'CONFIRM & SAVE'}
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