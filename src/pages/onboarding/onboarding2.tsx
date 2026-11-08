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
import Picture2 from '../../assets/Walkthrough-Page/Picture2.png';

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

          {/* content */}
          <div className="onboarding-box-container">
            <img
              className="onboarding-img-container"
              src={Picture2}
              alt="Select contact and destination"
              width={350}
              height={350}
            />
            <h2 style={titleStyle}>Select contact and destination</h2>
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