import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonItem,
  IonInput,
  IonIcon
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { arrowBackOutline, mailOutline, checkmarkCircleOutline } from 'ionicons/icons';

// 1. IMPORTACIONES DIRECTAS DE FIREBASE
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

// Import your logo asset
import logoGris from '../assets/gris-safelink.svg';

// 2. CONFIGURACIÓN DE TU PROYECTO FIREBASE
// (Reemplaza estos valores con los datos reales de tu Consola de Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyB8NRMMMhl9AUoTcrK6mmFXzU4dYipN1Y4",
  authDomain: "safelink-2acc5.firebaseapp.com",
  projectId: "safelink-2acc5",
  storageBucket: "safelink-2acc5.firebasestorage.app",
  messagingSenderId: "895007403296",
  appId: "1:895007403296:web:c9daf9693e4ec6a03afb45"
};

// Inicialización segura de Firebase para evitar duplicados en desarrollo
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const ForgotPassword: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 3. FUNCIÓN DE ENVÍO DE CORREO REAL
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Firebase valida el correo y envía el link de recuperación automáticamente
      await sendPasswordResetEmail(auth, email);
      console.log('Firebase password reset link dispatched to:', email);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Error triggered during password reset request:', error);
      
      // Control de errores de Firebase traducidos a alertas claras
      if (error.code === 'auth/user-not-found') {
        alert('This email address is not registered with SafeLink.');
      } else if (error.code === 'auth/invalid-email') {
        alert('Please enter a valid email address.');
      } else {
        alert('Something went wrong. Please check your connection and try again.');
      }
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={contentBackgroundStyle}>
        
        {/* BACK BUTTON */}
        <button 
          type="button" 
          onClick={() => history.push('/login')} 
          style={backButtonStyle}
        >
          <IonIcon icon={arrowBackOutline} style={{ fontSize: '24px' }} />
        </button>

        <div style={mainContainerStyle}>
          
          {/* HEADER WITH LOGO */}
          <div style={headerContainerStyle}>
            <img 
              src={logoGris} 
              alt="SafeLink Logo" 
              style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px' }} 
            />
            <h2 style={titleStyle}>Reset Password</h2>
          </div>

          {!isSubmitted ? (
            /* STEP 1: REQUEST EMAIL FORM */
            <form onSubmit={handleResetPassword} style={formStyle}>
              <p style={descriptionStyle}>
                Enter the email address associated with your SafeLink account, and we'll send you a link to reset your password.
              </p>

              {/* EMAIL INPUT */}
              <IonItem lines="none" style={inputItemStyle}>
                <IonIcon icon={mailOutline} style={iconStyle} />
                <IonInput
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value!)}
                  required
                  style={inputStyle}
                />
              </IonItem>

              {/* SUBMIT BUTTON */}
              <IonButton
                expand="block"
                type="submit"
                style={submitButtonStyle}
              >
                Send Reset Link
              </IonButton>
            </form>
          ) : (
            /* STEP 2: SUCCESS STATE CONFIRMATION */
            <div style={successContainerStyle}>
              <IonIcon icon={checkmarkCircleOutline} style={successIconStyle} />
              <h3 style={successTitleStyle}>Link Sent Successfully!</h3>
              <p style={descriptionStyle}>
                We have sent email instructions to <strong>{email}</strong>. Please check your inbox and spam folders.
              </p>
              
              <IonButton
                expand="block"
                onClick={() => history.push('/login')}
                style={submitButtonStyle}
              >
                Back to Log In
              </IonButton>
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};

/* UI STYLES */
const contentBackgroundStyle = {
  '--background': '#FFEBB7'
};

const backButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#633A0E',
  cursor: 'pointer',
  padding: '10px',
  position: 'absolute',
  top: '20px',
  left: '10px',
  zIndex: 10
};

const mainContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  padding: '0 20px',
  boxSizing: 'border-box'
};

const headerContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px'
};

const titleStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: '800',
  color: '#633A0E',
  margin: 0
};

const formStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#A05C1B',
  textAlign: 'center',
  lineHeight: '1.5',
  margin: '0 0 10px 0',
  fontWeight: '500'
};

const inputItemStyle = {
  '--background': '#FFFFFF',
  '--border-radius': '15px',
  '--padding-start': '15px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  margin: 0
};

const iconStyle = {
  color: '#A97D40',
  marginRight: '12px'
};

const inputStyle = {
  '--color': '#633A0E',
  fontSize: '15px'
};

const submitButtonStyle = {
  '--background': '#E6A937',
  '--color': '#FFFFFF',
  '--border-radius': '25px',
  height: '54px',
  fontWeight: 'bold',
  fontSize: '16px',
  width: '100%',
  marginTop: '10px'
};

const successContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  gap: '15px'
};

const successIconStyle = {
  fontSize: '64px',
  color: '#A97D40'
};

const successTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#633A0E',
  margin: 0,
  textAlign: 'center'
};

export default ForgotPassword;