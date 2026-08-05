import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';

const Onboarding1: React.FC = () => {
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
          <div style={contentStyle}>
            <div style={iconContainerStyle}>
              <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="#633A0E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 4.418-8 12-8 12s-8-7.582-8-12a8 8 0 1 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M4 18c-1.5 0-2 1-.5 2s4.5.5 5.5-1M20 18c1.5 0 2 1 .5 2s-4.5.5-5.5-1" />
                <path d="M8 19c2-2 6-2 8 0" strokeDasharray="2 2" />
              </svg>
            </div>

            <h2 style={titleStyle}>Your Journey, Fully Covered</h2>
            <p style={descriptionStyle}>
              SafeLink keeps you safe on the move, entirely on your terms. No constant tracking, no battery drain, and zero hassle for your loved ones..
            </p>
          </div>

          {/* space and style - colours */}
          <div style={dotsContainerStyle}>
            <span style={{ ...dotStyle, backgroundColor: '#E6A937' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
            <span style={{ ...dotStyle, backgroundColor: '#FFFFFF' }} />
          </div>

          {/* next button */}
          <div style={bottomContainerStyle}>
            <button 
              onClick={() => history.push('/onboarding2')} 
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

/* layout styles */
export const contentBackgroundStyle = { '--background': '#FFEBB7' };
export const headerToolbarStyle = { '--background': '#E5A93C', '--border-width': '0' };
export const headerContainerStyle: React.CSSProperties = { height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
export const headerWelcomeTextStyle: React.CSSProperties = { color: '#FFFFFF', fontSize: '20px', fontWeight: '600', letterSpacing: '0.5px' };


export const mainContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', paddingTop: '30px' };
export const contentStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 24px' };
export const iconContainerStyle: React.CSSProperties = { marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' };

// bigger texts
export const titleStyle: React.CSSProperties = { color: '#633A0E', fontSize: '26px', fontWeight: '800', marginBottom: '16px', lineHeight: '1.2' };
export const descriptionStyle: React.CSSProperties = { color: '#84623D', fontSize: '15.5px', lineHeight: '1.6', maxWidth: '330px', margin: '0 auto' };

export const dotsContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', gap: '12px', margin: '20px 0' };
export const dotStyle: React.CSSProperties = { width: '11px', height: '11px', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' };

export const bottomContainerStyle: React.CSSProperties = {
  backgroundColor: '#E5A93C',
  borderTopLeftRadius: '32px',
  borderTopRightRadius: '32px',
  padding: '24px 20px 34px 20px', 
  width: '100%',
  boxShadow: '0 -6px 15px rgba(214, 158, 59, 0.3)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

// layout white button
export const actionButtonStyle: React.CSSProperties = {
  width: '100%',
  height: '56px',
  backgroundColor: '#FFFFFF',
  color: '#84623D', 
  border: '3px solid #84623D',
  borderRadius: '20px',
  fontSize: '20px',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 5px 0px #6A4B29', // Efecto sombra 3D bajo el botón
  outline: 'none',
  transition: 'transform 0.1s ease'
};

export default Onboarding1;