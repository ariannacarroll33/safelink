import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonButton
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

// import svg logo
import logoGris from '../assets/gris-safelink.svg';

const Welcome: React.FC = () => {
  const history = useHistory();
  const [showButtons, setShowButtons] = useState(false);

  // Los botones aparecen después de que termine la nueva animación larga (2.5s logo + margen)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 2700);

    return () => clearTimeout(timer);
  }, []);

  return (
    <IonPage>
      <IonContent className="ion-padding" style={contentBackgroundStyle}>
        
        {/* animation styles */}
        <style>{animationStyles}</style>

        <div style={mainContainerStyle}>
          
          {/* animated logo area */}
          <div style={logoWrapperStyle}>
            <img 
              src={logoGris} 
              alt="SafeLink Logo" 
              style={{ width: '140px', height: '140px', objectFit: 'contain', marginBottom: '20px' }} 
            />
            <h1 style={brandNameStyle}>SafeLink</h1>
          </div>

          {/* fade-in buttons */}
          <div 
            style={{
              ...buttonContainerStyle,
              opacity: showButtons ? 1 : 0,
              transform: showButtons ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
            }}
          >
            {/* sign up button */}
            <IonButton
              expand="block"
              onClick={() => history.push('/register')}
              style={signUpButtonStyle}
            >
              You're new? Sign up now
            </IonButton>

            <button
              type="button"
              onClick={() => history.push('/login')}
              style={logInLinkStyle}
            >
              I'm already part of Safelink! Log In
            </button>
          </div>

        </div>

      </IonContent>
    </IonPage>
  );
};

/* animation CSS */
const animationStyles = `
  @keyframes popInBounce {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }
    70% {
      transform: scale(1.1);
      opacity: 1;
    }
    100% {
      transform: scale(1);
    }
  }
`;

/* styles */
const contentBackgroundStyle = {
  '--background': '#FFEBB7'
};

const mainContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '100%',
  padding: '60px 10px 40px 10px',
  boxSizing: 'border-box'
};

// animation
const logoWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  animation: 'popInBounce 2.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
};

const brandNameStyle: React.CSSProperties = {
  fontSize: '42px',
  fontWeight: '800',
  color: '#633A0E',
  margin: 0,
  letterSpacing: '1px'
};

const buttonContainerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px'
};

const signUpButtonStyle = {
  '--background': '#E6A937',
  '--color': '#FFFFFF',
  '--border-radius': '25px',
  height: '54px',
  fontWeight: 'bold',
  fontSize: '16px',
  width: '100%',
  margin: 0
};

const logInLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#A05C1B',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'underline',
  cursor: 'pointer',
  padding: '10px'
};

export default Welcome;