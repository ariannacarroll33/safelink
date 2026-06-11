import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonButton
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

const Welcome: React.FC = () => {
  const history = useHistory();
  const [showButtons, setShowButtons] = useState(false);

  // Trigger the buttons to fade in after the logo animation completes (1.2 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <IonPage>
      <IonContent className="ion-padding" style={contentBackgroundStyle}>
        
        {/* INJECT ANIMATION STYLES */}
        <style>{animationStyles}</style>

        <div style={mainContainerStyle}>
          
          {/* ANIMATED LOGO AREA */}
          <div style={logoWrapperStyle}>
            <div style={outerCircleStyle}>
              <div style={innerCircleStyle} />
            </div>
            <h1 style={brandNameStyle}>SafeLink</h1>
          </div>

          {/* FADE-IN BUTTONS CONTROLLER */}
          <div 
            style={{
              ...buttonContainerStyle,
              opacity: showButtons ? 1 : 0,
              transform: showButtons ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
            }}
          >
            {/* SIGN UP BUTTON */}
            {/* 🛠️ CORREGIDO: Ahora redirige a '/register' para que coincida con App.tsx */}
            <IonButton
              expand="block"
              onClick={() => history.push('/register')}
              style={signUpButtonStyle}
            >
              You're new? Sign up now
            </IonButton>

            {/* LOG IN LINK BUTTON */}
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

/* CSS ANIMATIONS */
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

  @keyframes fadeInText {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
`;

/* UI STYLES */
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

const logoWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  animation: 'popInBounce 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
};

const outerCircleStyle: React.CSSProperties = {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  border: '4px dashed #E5A93C',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px'
};

const innerCircleStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#A97D40'
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