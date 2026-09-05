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

interface LocationState {
  phone?: string;
}

const VerificationCode: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  
  const phone = location.state?.phone || '';

  // Store 4 individual digits for the SMS verification code
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  
  // References to handle automatic focus switching between input boxes
  const inputRefs = useRef<Array<HTMLIonInputElement | null>>([]);

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Active authentication option selected by user ('sms' or 'google')
  const [activeMethod, setActiveMethod] = useState<'sms' | 'google' | null>('sms');

  const resetSMSState = () => {
    setSmsSent(false);
    setDigits(['', '', '', '']);
    setVerificationId(null);
  };

  // Handle value change across the 4 code inputs
  const handleDigitChange = (value: string, index: number) => {
    const newChar = value.slice(-1);
    const updatedDigits = [...digits];
    updatedDigits[index] = newChar;
    setDigits(updatedDigits);

    if (newChar && index < 3) {
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
      console.log('SMS sent, verificationId received');
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
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setToastMessage('User session not found. Please register again.');
      setShowToast(true);
      return;
    }

    if (!phone) {
      setToastMessage('Phone number not specified.');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      console.log('Sending SMS to:', phone);

      await FirebaseAuthentication.linkWithPhoneNumber({ phoneNumber: phone });

    } catch (error: any) {
      setLoading(false);
      console.error('Error sending SMS:', error);
      setToastMessage(`Error sending SMS: ${error.message}`);
      setShowToast(true);
    }
  };

  // OPTION 1 (CONTINUED): VALIDATE 4-DIGIT SMS CODE
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationId) {
      setToastMessage('No active verification session. Send the SMS first.');
      setShowToast(true);
      return;
    }

    const verificationCode = digits.join('');

    try {
      setLoading(true);
      await FirebaseAuthentication.confirmVerificationCode({
        verificationId,
        verificationCode
      });

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
      
      history.push('/onboarding'); 

    } catch (error: any) {
      setLoading(false);
      console.error('SMS verification failed:', error);
      setToastMessage('Invalid code. Please check and try again.');
      setShowToast(true);
    }
  };

  // OPTION 2: VERIFY WITH GOOGLE (SOLUCIONADO CON setDoc)
  const handleVerifyWithGoogle = async () => {
    setActiveMethod('google');
    resetSMSState();

    try {
      setLoading(true);

      const result = await FirebaseAuthentication.signInWithGoogle();
      const user = auth.currentUser || result.user;

      if (user) {
        // setDoc con merge:true crea el documento si no existe o lo actualiza si ya existe
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
          
          {activeMethod === 'sms' && !smsSent && (
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
                {loading ? 'Sending...' : 'Send Code via SMS'}
              </IonButton>
            </div>
          )}

          {activeMethod === 'sms' && smsSent && (
            <form onSubmit={handleVerifyCode}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                Enter the 4-digit code received:
              </p>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '12px 0' }}>
                {digits.map((digit, index) => (
                  <div key={index} style={digitInputBoxStyle}>
                    <IonItem lines="none" style={itemStyle}>
                      <IonInput
                        ref={(el: HTMLIonInputElement | null) => {
                          inputRefs.current[index] = el;
                        }}
                        type="number"
                        value={digit}
                        onIonInput={(e) => handleDigitChange(e.detail.value || '', index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        maxlength={1}
                        style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}
                      />
                    </IonItem>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <IonButton 
                  expand="block" 
                  type="submit"
                  disabled={loading || digits.join('').length !== 4}
                  style={{ flex: 1, '--background': '#E6A937', '--color': '#FFF', '--border-radius': '10px' }}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </IonButton>
                <IonButton 
                  fill="outline"
                  onClick={() => resetSMSState()}
                  style={{ '--border-radius': '10px', '--color': '#E6A937', '--border-color': '#E6A937' }}
                >
                  Change Method
                </IonButton>
              </div>
            </form>
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
const itemStyle = { '--background': 'transparent', '--min-height': 'unset' };

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

const digitInputBoxStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: '50px',
  height: '50px',
  background: '#F5F5F5',
  borderRadius: '10px',
  border: '1px solid #CCCCCC',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default VerificationCode;