import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
  contentBackgroundStyle, headerToolbarStyle, headerContainerStyle, 
  headerWelcomeTextStyle, mainContainerStyle, contentStyle, 
  iconContainerStyle, titleStyle, descriptionStyle, 
  dotsContainerStyle, dotStyle, bottomContainerStyle, actionButtonStyle 
} from './onboarding1';
import '../components.css';
import Picture3 from '../../assets/Walkthrough-Page/Picture3.png';

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

          {/* content */}
          <div className="onboarding-box-container">
            <img
              className="onboarding-img-container"
              src={Picture3}
              alt="Img"
              width={350}
              height={350}
            />
            <h2 style={titleStyle}>Alerted when arrive home and location sharing ended</h2>
          </div>

          {/* Indicador de Páginas (Punto 3 Activo) */}
          <div style={dotsContainerStyle}>
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#E6A937' }} />
          </div>

          {/* Bandeja inferior dorada idéntica a la foto */}
          <div style={bottomContainerStyle}>
            <button 
              onClick={() => history.push('/enterPasscode')} 
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

export default Onboarding3;