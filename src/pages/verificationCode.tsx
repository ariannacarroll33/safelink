import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonItem,
  IonHeader,
  IonToolbar
} from '@ionic/react';
import { arrowBackOutline, chatbubbleOutline, logoGoogle } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';

// FIREBASE
import { auth, db } from '../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

// PLUGIN Google/SMS in Capacitor
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const CODE_LENGTH = 6;

interface LocationState {
  phone?: string;
}

const VerificationCode: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();

  const phone = location.state?.phone || '';

  // References to handle automatic focus switching between input boxes
  const inputRefs = useRef<Array<HTMLIonInputElement | null>>([]);

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));

  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Active authentication option selected by user ('sms' or 'google')
  const [activeMethod, setActiveMethod] = useState<'sms' | 'google' | null>('sms');

  const resetSMSState = () => {
    setSmsSent(false);
    setDigits(Array(CODE_LENGTH).fill(''));
    setVerificationId(null);
  };

  // Handle value change across the code inputs
  const handleDigitChange = (value: string, index: number) => {
    const clean = value.replace(/\D/g, '');

    // Si pegan o autocompletan el código entero
    if (clean.length > 1) {
      const filled = clean.slice(0, CODE_LENGTH).split('');
      setDigits([...filled, ...Array(CODE_LENGTH - filled.length).fill('')]);
      inputRefs.current[Math.min(filled.length, CODE_LENGTH - 1)]?.setFocus();
      return;
    }

    const updated = [...digits];
    updated[index] = clean;
    setDigits(updated);

    if (clean && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.setFocus();
    }
  };

  // Handle key navigation (Backspacing back to previous field)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.setFocus();
    }
  };

  // LISTENERS for Native Plugin SMS events
  useEffect(() => {
    const codeSentListener = FirebaseAuthentication.addListener('phoneCodeSent', (event: any) => {
      console.log('SMS sent, verificationId:', event.verificationId);
      setVerificationId(event.verificationId);
      setSmsSent(true);
      setLoading(false);
      setToastMessage('Verification code sent.');
      setShowToast(true);
    });

    const verificationFailedListener = FirebaseAuthentication.addListener('phoneVerificationFailed', (event: any) => {
      console.error('Phone verification failed:', event);
      setLoading(false);
      setToastMessage(`Error sending SMS: ${event.message || 'unknown error'}`);
      setShowToast(true);
    });

    return () => {
      codeSentListener.then((handle) => handle.remove());
      verificationFailedListener.then((handle) => handle.remove());
    };
  }, []);

  // OPTION 1: SEND SMS
  const handleSendSMS = async () => {
    setActiveMethod('sms');

    if (!auth.currentUser) {
      setToastMessage('User session not found. Please register again.');
      setShowToast(true);
      return;
    }
    if (!phone) {
      setToastMessage('Phone number not specified.');
      setShowToast(true);
      return;
    }
    if (!/^\+\d{8,15}$/.test(phone)) {
      setToastMessage('Phone must be in international format, e.g. +34600123456');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      setVerificationId(null); // descarta el ID del envío anterior
      setDigits(Array(CODE_LENGTH).fill('')); // limpia los huecos
      console.log('Sending SMS to:', phone);

      const result: any = await FirebaseAuthentication.linkWithPhoneNumber({ phoneNumber: phone });
      console.log('linkWithPhoneNumber result:', JSON.stringify(result));

      if (result?.verificationId) {
        setVerificationId(result.verificationId);
        setSmsSent(true);
        setToastMessage('Verification code sent.');
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('Error sending SMS:', JSON.stringify(error), error?.code, error?.message);
      setToastMessage(`Error sending SMS: ${error?.code || error?.message || 'unknown error'}`);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // OPTION 1 (CONTINUED): VALIDATE SMS CODE
  const handleVerifyCode = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();

    if (!verificationId) {
      setToastMessage('No active verification session. Send the SMS first.');
      setShowToast(true);
      return;
    }

    const verificationCode = digits.join('');

    if (verificationCode.length !== CODE_LENGTH) {
      setToastMessage(`Enter the ${CODE_LENGTH}-digit code.`);
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      console.log('Verifying with:', verificationId, verificationCode);

      try {
        // Intento 1: método documentado para confirmar el código
        await FirebaseAuthentication.confirmVerificationCode({
          verificationId,
          verificationCode
        });
      } catch (firstError: any) {
        console.error('confirmVerificationCode failed:', JSON.stringify(firstError), firstError?.code, firstError?.message);

        // Intento 2: vincular el teléfono pasando el código
        await FirebaseAuthentication.linkWithPhoneNumber({
          phoneNumber: phone,
          verificationId,
          verificationCode
        } as any);
      }

      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          verified: true,
          verifiedBy: 'sms',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      setLoading(false);
      setToastMessage('Phone verified successfully!');
      setShowToast(true);

      // next step direction is onboarding
      history.push('/onboarding');

    } catch (error: any) {
      setLoading(false);
      console.error('SMS verification failed:', JSON.stringify(error), error?.code, error?.message);
      setToastMessage(`Verification failed: ${error?.code || error?.message || 'unknown error'}`);
      setShowToast(true);
    }
  };

  // OPTION 2: VERIFY WITH GOOGLE
  const handleVerifyWithGoogle = async () => {
    setActiveMethod('google');
    resetSMSState();

    try {
      setLoading(true);

      const result = await FirebaseAuthentication.signInWithGoogle();
      const user = auth.currentUser || result.user;

      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          verified: true,
          verifiedBy: 'google',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      setLoading(false);
      setToastMessage('Account verified with Google!');
      setShowToast(true);

      history.push('/onboarding');
    } catch (error: any) {
      setLoading(false);
      console.error('Error with Google Auth:', error);
      setToastMessage(`Google Auth Error: ${error.message || 'Failed to verify'}`);
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
            <h1 style={headerTitleStyle}>Verify Account</h1>
            <div style={{ width: '40px' }} />
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={contentBackgroundStyle}>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        <div style={{ textAlign: 'center', margin: '30px 0 20px 0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#633A0E' }}>
            Verify Your Account
          </h2>
          <p style={{ color: '#555', fontSize: '14px', padding: '0 20px' }}>
            Choose a method to verify your identity and activate your profile.
          </p>
        </div>

        {/* ================= SMS SECTION ================= */}
        <div style={sectionBoxStyle}>
          <h3 onClick={() => setActiveMethod('sms')} style={{ ...sectionTitleStyle, cursor: 'pointer' }}>
            <IonIcon icon={chatbubbleOutline} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Option 1: Verify via SMS
          </h3>

          {activeMethod === 'sms' && (
            <div>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                We will send a validation code to: <strong>{phone || 'unspecified number'}</strong>
              </p>

              <IonButton
                expand="block"
                onClick={handleSendSMS}
                disabled={loading || !phone}
                style={{ '--background': '#E6A937', '--color': '#FFF', '--border-radius': '10px' }}
              >
                {loading ? 'Sending...' : smsSent ? 'Resend Code' : 'Send Code via SMS'}
              </IonButton>

              <p style={{ fontSize: '13px', color: '#666', margin: '16px 0 8px' }}>
                Enter the {CODE_LENGTH}-digit code you receive by SMS:
              </p>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '12px 0' }}>
                {digits.map((digit, index) => (
                  <div key={index} style={digitInputBoxStyle}>
                    <IonItem lines="none" style={itemStyle}>
                      <IonInput
                        ref={(el: HTMLIonInputElement | null) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputmode="numeric"
                        autocomplete="one-time-code"
                        value={digit}
                        onIonInput={(e) => handleDigitChange(String(e.detail.value || ''), index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}
                      />
                    </IonItem>
                  </div>
                ))}
              </div>

              <IonButton
                expand="block"
                onClick={handleVerifyCode as any}
                disabled={loading || !verificationId || digits.join('').length !== CODE_LENGTH}
                style={{ '--background': '#E6A937', '--color': '#FFF', '--border-radius': '10px' }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </IonButton>
            </div>
          )}

          {activeMethod !== 'sms' && (
            <IonButton
              fill="clear"
              expand="block"
              size="small"
              onClick={() => setActiveMethod('sms')}
              style={{ '--color': '#E6A937', fontWeight: '600', margin: '4px 0 0 0' }}
            >
              Use SMS Verification instead
            </IonButton>
          )}
        </div>
        {/* ================= VISUAL DIVIDER ================= */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '28px 0 20px 0',
          color: '#633A0E',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <span style={{ flex: 1, height: '1px', background: 'rgba(99, 58, 14, 0.2)', marginRight: '10px' }}></span>
          <span>OR VERIFY INSTANTLY WITH</span>
          <span style={{ flex: 1, height: '1px', background: 'rgba(99, 58, 14, 0.2)', marginLeft: '10px' }}></span>
        </div>

        {/* ================= GOOGLE SECTION ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleVerifyWithGoogle}
            disabled={loading}
            style={{
              height: '50px',
              borderRadius: '12px',
              border: activeMethod === 'google' ? '2px solid #E6A937' : '1px solid #999999',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              color: '#000000',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'border 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            <IonIcon icon={logoGoogle} style={{ color: '#EA4335', fontSize: '20px' }} />
            {loading && activeMethod === 'google' ? 'Verifying...' : 'Verify with Google'}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

/* 🎨 STYLES */
const contentBackgroundStyle = { '--background': '#FFEBB7' };
const headerToolbarStyle = { '--background': '#E5A93C', '--border-width': '0' };
const headerFlexContainer: React.CSSProperties = { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' };
const backButtonStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const headerTitleStyle: React.CSSProperties = { color: '#FFFFFF', fontSize: '22px', fontWeight: '700', margin: 0 };

const sectionBoxStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '18px',
  border: '1px solid #D4C3A3',
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#633A0E',
  margin: '0 0 12px 0'
};
const itemStyle = {
  '--background': 'transparent',
  '--min-height': 'unset',
  '--padding-start': '0px',
  '--padding-end': '0px',
  '--inner-padding-end': '0px',
  width: '100%'
};

const digitInputBoxStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: '52px',
  height: '50px',
  background: '#F5F5F5',
  borderRadius: '10px',
  border: '1px solid #CCCCCC',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default VerificationCode;