import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
  contentBackgroundStyle, headerToolbarStyle, headerContainerStyle, 
  headerWelcomeTextStyle, mainContainerStyle, contentStyle, 
  iconContainerStyle, titleStyle, descriptionStyle, 
  dotsContainerStyle, dotStyle, bottomContainerStyle, actionButtonStyle 
} from './onboarding1';

const Onboarding4: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={headerToolbarStyle}>
          <div style={headerContainerStyle}>
            <span style={headerWelcomeTextStyle}>Welcome</span>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent style={contentBackgroundStyle} scrollY={false}>
        <div style={mainContainerStyle}>
          
          <div style={contentStyle}>
            {/* Icono S.O.S gigante adaptado */}
            <div style={iconContainerStyle}>
              <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="#633A0E" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                <text x="12" y="15.5" fill="#633A0E" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">S.O.S</text>
              </svg>
            </div>

            <h2 style={titleStyle}>SOS Button</h2>
            <p style={descriptionStyle}>
              In an emergency, every millisecond counts. We've placed an SOS button, connected to your emergency contact for the moment we need help the most.
            </p>
          </div>

          {/* Indicador de Páginas (Punto 4 Activo) */}
          <div style={dotsContainerStyle}>
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#E6A937' }} />
          </div>

          {/* Bandeja inferior dorada idéntica a la foto */}
          <div style={bottomContainerStyle}>
            <button 
              onClick={() => history.push('/enter-passcode')} 
              style={actionButtonStyle}
              type="button"
            >
              Get Started
            </button>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Onboarding4;