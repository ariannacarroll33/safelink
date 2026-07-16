import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
  contentBackgroundStyle, headerToolbarStyle, headerContainerStyle, 
  headerWelcomeTextStyle, mainContainerStyle, contentStyle, 
  iconContainerStyle, titleStyle, descriptionStyle, 
  dotsContainerStyle, dotStyle, bottomContainerStyle, actionButtonStyle 
} from './onboarding1';

const Onboarding3: React.FC = () => {
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
            {/* Icono grande adaptado */}
            <div style={iconContainerStyle}>
              <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="#633A0E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
                <path d="M2 15h20" strokeWidth="1" strokeDasharray="3 3"/>
              </svg>
            </div>

            <h2 style={titleStyle}>We Track Your Time</h2>
            <p style={descriptionStyle}>
              No more forgetting to text "I'm home." SafeLink checks you in automatically based on your arrival time and temporary location tracking.
            </p>
          </div>

          {/* Indicador de Páginas (Punto 3 Activo) */}
          <div style={dotsContainerStyle}>
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#E6A937' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
          </div>

          {/* Bandeja inferior dorada idéntica a la foto */}
          <div style={bottomContainerStyle}>
            <button 
              onClick={() => history.push('/onboarding4')} 
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

export default Onboarding3;