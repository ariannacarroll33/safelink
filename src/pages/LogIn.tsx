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
import { arrowBackOutline, mailOutline, lockClosedOutline, helpCircleOutline } from 'ionicons/icons';

// 1. IMPORT FIREBASE AUTH
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Import your logo asset
import logoGris from '../assets/gris-safelink.svg';

// 2. CONFIG FIREBASE 
const firebaseConfig = {
  apiKey: "AIzaSyB8NRMMMhl9AUoTcrK6mmFXzU4dYipN1Y4",
  authDomain: "safelink-2acc5.firebaseapp.com",
  projectId: "safelink-2acc5",
  storageBucket: "safelink-2acc5.firebasestorage.app",
  messagingSenderId: "895007403296",
  appId: "1:895007403296:web:c9daf9693e4ec6a03afb45"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // TRACK FAILED ATTEMPTS STATE
  const [failedAttempts, setFailedAttempts] = useState(0);

  // 3. CONNECTION SETTING WITH FIREBASE 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // REAL LOG IN LOGIC
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in successfully with Firebase:', userCredential.user);
      
      setFailedAttempts(0); // Reset on success
      history.push('/tabs/home'); // REDIRECTION HOME APP
    } catch (error: any) {
      console.error('Error logging in:', error);
      setFailedAttempts(prev => prev + 1);

      // WRONG CREDENTIALS LOGIC 
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert("Incorrect password or credentials. Please try again.");
      } else if (error.code === 'auth/user-not-found') {
        alert("This email address is not registered.");
      } else {
        alert("Login failed. Please check your network and try again.");
      }
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={contentBackgroundStyle}>
        
        {/* BACK BUTTON */}
        <button 
          type="button" 
          onClick={() => history.push('/welcome')} 
          style={backButtonStyle}
        >
          <IonIcon icon={arrowBackOutline} style={{ fontSize: '24px' }} />
        </button>

        <div style={mainContainerStyle}>
          
          {/* HEADER WITH SMALL LOGO */}
          <div style={headerContainerStyle}>
            <img 
              src={logoGris} 
              alt="SafeLink Logo" 
              style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px' }} 
            />
            <h2 style={titleStyle}>Welcome Back!</h2>
            <p style={subtitleStyle}>Log in to protect your links</p>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} style={formStyle}>
            
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

            {/* PASSWORD INPUT */}
            <IonItem lines="none" style={inputItemStyle}>
              <IonIcon icon={lockClosedOutline} style={iconStyle} />
              <IonInput
                type="password"
                placeholder="Password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
                required
                style={inputStyle}
              />
            </IonItem>

            {/* CONDITIONAL DYNAMIC RESET PASSWORD BUTTON */}
            {failedAttempts >= 1 && (
              <button
                type="button"
                onClick={() => history.push('/forgot-password')} 
                style={forgotPasswordButtonStyle}
              >
                <IonIcon icon={helpCircleOutline} style={{ fontSize: '16px' }} />
                Forgot or want to change password?
              </button>
            )}

            {/* SUBMIT BUTTON */}
            <IonButton
              expand="block"
              type="submit"
              style={loginButtonStyle}
            >
              Log In
            </IonButton>
          </form>

          {/* SIGN UP SIGNPOSTING */}
          <div style={footerStyle}>
            <p style={footerTextStyle}>
              Don't have an account?{' '}
              <span onClick={() => history.push('/register')} style={registerLinkStyle}>
                Sign Up
              </span>
            </p>
          </div>

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
  marginBottom: '40px'
};

const titleStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: '800',
  color: '#633A0E',
  margin: '0 0 5px 0'
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#A05C1B',
  margin: 0,
  fontWeight: '500'
};

const formStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
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

const forgotPasswordButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#A05C1B',
  fontSize: '13px',
  fontWeight: '600',
  textAlign: 'right',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '5px',
  textDecoration: 'underline',
  cursor: 'pointer',
  padding: '5px 0',
  width: '100%',
  animation: 'fadeInText 0.3s ease-out'
};

const loginButtonStyle = {
  '--background': '#E6A937',
  '--color': '#FFFFFF',
  '--border-radius': '25px',
  height: '54px',
  fontWeight: 'bold',
  fontSize: '16px',
  width: '100%',
  marginTop: '5px'
};

const footerStyle: React.CSSProperties = {
  marginTop: '30px',
  textAlign: 'center'
};

const footerTextStyle: React.CSSProperties = {
  color: '#633A0E',
  fontSize: '14px'
};

const registerLinkStyle: React.CSSProperties = {
  color: '#A05C1B',
  fontWeight: '700',
  textDecoration: 'underline',
  cursor: 'pointer'
};

export default Login;