import React, { useState, useEffect } from 'react';
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
import { arrowBackOutline, chatbubbleOutline, logoGoogle, logoApple } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';

// FIREBASE
import { auth, db } from '../services/firebaseConfig';
import { 
  RecaptchaVerifier, 
  linkWithPhoneNumber, 
  GoogleAuthProvider, 
  OAuthProvider, 
  linkWithPopup 
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

interface LocationState {
  phone?: string;
}

const VerificationCode: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  
  // Retrieve the phone number passed from CreateUser.tsx
  const phone = location.state?.phone || '';

  const [verificationCode, setVerificationCode] = useState<string>('');
  const [smsSent, setSmsSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Controla qué método está expandido visualmente ('sms' | 'google' | 'apple' | null)
  const [activeMethod, setActiveMethod] = useState<'sms' | 'google' | 'apple' | null>('sms');

  // Función para limpiar por completo el panel de SMS si se cambia de opción
  const resetSMSState = () => {
    setSmsSent(false);
    setVerificationCode('');
  };

  // 1. INITIALIZE INVISIBLE RECAPTCHA FOR SMS
  const setupRecaptcha = () => {
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('ReCAPTCHA successfully verified'),
        'expired-callback': () => alert('ReCAPTCHA has expired. Please try again.')
      });
      return (window as any).recaptchaVerifier;
    } catch (err) {
      console.error('Error in RecaptchaVerifier:', err);
    }
  };

  // 💬 OPTION A: SEND SMS
  const handleSendSMS = async () => {
    setActiveMethod('sms'); // Asegura que el método activo es SMS
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
      const appVerifier = setupRecaptcha();
      if (!appVerifier) throw new Error('Failed to initialize security validator.');

      console.log('Sending test/real SMS to:', phone);
      const confirmationResult = await linkWithPhoneNumber(currentUser, phone, appVerifier);
      (window as any).confirmationResult = confirmationResult;

      setSmsSent(true);
      setLoading(false);
      setToastMessage('Verification code sent.');
      setShowToast(true);
    } catch (error: any) {
      setLoading(false);
      console.error('Error sending SMS:', error);
      setToastMessage(`Error sending SMS: ${error.message}`);
      setShowToast(true);
    }
  };

  // 💬 OPTION A (CONTINUED): VALIDATE THE SMS CODE
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmationResult = (window as any).confirmationResult;

    if (!confirmationResult) {
      setToastMessage('No active verification session. Send the SMS first.');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      await confirmationResult.confirm(verificationCode);

      // Update verification status in Firestore
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          verified: true,
          verifiedBy: 'sms'
        });
      }

      setLoading(false);
      setToastMessage('Phone verified successfully!');
      setShowToast(true);
      
      // Redirecting to onboarding page as requested
      history.push('/onboarding'); 

    } catch (error: any) {
      setLoading(false);
      console.error('SMS verification failed:', error);
      setToastMessage('Invalid code. Please check and try again.');
      setShowToast(true);
    }
  };

  // 🚀 OPTION B: VERIFY/LINK WITH GOOGLE POPUP
  const handleVerifyWithGoogle = async () => {
    // Si pulsa aquí, hacemos desaparecer los huecos del SMS al instante
    setActiveMethod('google');
    resetSMSState();

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setToastMessage('Session not active. Please register first.');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      // Link Google account to the currently created email user
      await linkWithPopup(currentUser, provider);

      // Mark user as verified via Google in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        verified: true,
        verifiedBy: 'google'
      });

      setLoading(false);
      setToastMessage('Account verified with Google!');
      setShowToast(true);
      
      // Redirecting to onboarding page as requested
      history.push('/onboarding'); 
    } catch (error: any) {
      setLoading(false);
      console.error('Error linking Google:', error);
      setToastMessage(error.code === 'auth/credential-already-in-use' 
        ? 'This Google account is already linked to another user.' 
        : 'Failed to verify with Google.'
      );
      setShowToast(true);
    }
  };

  // 🍏 OPTION C: VERIFY/LINK WITH APPLE POPUP
  const handleVerifyWithApple = async () => {
    // Si pulsa aquí, hacemos desaparecer los huecos del SMS al instante
    setActiveMethod('apple');
    resetSMSState();

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setToastMessage('Session not active. Please register first.');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      const provider = new OAuthProvider('apple.com');
      // Link Apple account to the current user
      await linkWithPopup(currentUser, provider);

      // Mark user as verified via Apple in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        verified: true,
        verifiedBy: 'apple'
      });

      setLoading(false);
      setToastMessage('Account verified with Apple!');
      setShowToast(true);
      
      // Redirecting to onboarding page as requested
      history.push('/onboarding');
    } catch (error: any) {
      setLoading(false);
      console.error('Error linking Apple:', error);
      setToastMessage(error.code === 'auth/credential-already-in-use' 
        ? 'This Apple account is already linked to another user.' 
        : 'Failed to verify with Apple.'
      );
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

        {/* Invisible container div required by reCAPTCHA */}
        <div id="recaptcha-container"></div>

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
          {/* Fusión limpia del estilo solucionando el error anterior */}
          <h3 onClick={() => setActiveMethod('sms')} style={{ ...sectionTitleStyle, cursor: 'pointer' }}>
            <IonIcon icon={chatbubbleOutline} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Option 1: Verify via SMS
          </h3>
          
          {/* Si el método activo es SMS y aún no se envía el código */}
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

          {/* Si el código ya se envió Y el método activo sigue siendo SMS, se muestran los 6 huecos */}
          {activeMethod === 'sms' && smsSent && (
            <form onSubmit={handleVerifyCode}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                Enter the 6-digit code received:
              </p>
              <div style={inputBoxStyle}>
                <IonItem lines="none" style={itemStyle}>
                  <IonInput
                    type="number"
                    value={verificationCode}
                    onIonInput={(e) => setVerificationCode(e.detail.value || '')}
                    placeholder="123456"
                    maxlength={6}
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
                  />
                </IonItem>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <IonButton 
                  expand="block" 
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
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

          {/* Si el usuario seleccionó otro método (Google/Apple), mostramos un botón discreto para volver al flujo SMS */}
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

        {/* ================= GOOGLE & APPLE SECTION ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* VERIFY WITH GOOGLE */}
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
              transition: 'border 0.2s ease'
            }}
          >
            <IonIcon icon={logoGoogle} style={{ color: '#EA4335', fontSize: '20px' }} />
            Verify with Google
          </button>

          {/* VERIFY WITH APPLE */}
          <button
            type="button"
            onClick={handleVerifyWithApple}
            disabled={loading}
            style={{
              height: '50px',
              borderRadius: '12px',
              border: activeMethod === 'apple' ? '2px solid #E6A937' : '1px solid #000000',
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              color: '#FFFFFF',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'border 0.2s ease'
            }}
          >
            <IonIcon icon={logoApple} style={{ color: '#FFFFFF', fontSize: '20px' }} />
            Verify with Apple
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

const inputBoxStyle = {
  background: '#F5F5F5',
  borderRadius: '10px',
  border: '1px solid #CCCCCC',
  padding: '2px 8px',
  marginTop: '6px'
};

export default VerificationCode;