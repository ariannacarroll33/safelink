import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
  contentBackgroundStyle, headerToolbarStyle, headerContainerStyle, 
  headerWelcomeTextStyle, mainContainerStyle, contentStyle, 
  iconContainerStyle, titleStyle, descriptionStyle, 
  dotsContainerStyle, dotStyle, bottomContainerStyle, actionButtonStyle 
} from './onboarding1';

const Onboarding2: React.FC = () => {
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
            <div style={iconContainerStyle}>
              <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="#633A0E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>

            <h2 style={titleStyle}>Share Through Link</h2>
            <p style={descriptionStyle}>
              SafeLink can send SMS messages with a live location link to your contact, meaning you are the only one who needs the app downloaded.
            </p>
          </div>

          {/* Indicador de Páginas (Punto 2 Activo) */}
          <div style={dotsContainerStyle}>
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#E6A937' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
          </div>

          {/* Bandeja inferior dorada idéntica a la foto */}
          <div style={bottomContainerStyle}>
            <button 
              onClick={() => history.push('/onboarding3')} 
              style={actionButtonStyle}
              type="button"
            >
              Next
            </button>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Onboarding2;