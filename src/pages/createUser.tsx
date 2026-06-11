import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonNote,
  IonToast,
  IonItem,
  IonHeader,
  IonToolbar
} from '@ionic/react';

import {
  personAddOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  arrowBackOutline
} from 'ionicons/icons';

import { useHistory } from 'react-router-dom';

const CreateUser: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const history = useHistory();

  const requiredAsterisk = (
    <span style={{ color: '#E6A937', marginLeft: '4px' }}>*</span>
  );

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone || !password || !confirmPassword) {
      setToastMessage('Please fill in all required fields.');
      setShowToast(true);
      return;
    }

    if (password !== confirmPassword) {
      setToastMessage('Passwords do not match.');
      setShowToast(true);
      return;
    }

    history.push('/verificationCode', { phone });
  };

  return (
    <IonPage>
      {/* 🛠️ SOLUCIÓN: Usamos IonHeader e IonToolbar nativos de Ionic */}
      <IonHeader className="ion-no-border">
        <IonToolbar style={headerToolbarStyle}>
          <div style={headerFlexContainer}>
            <button 
              onClick={() => history.goBack()} 
              style={backButtonStyle}
              type="button"
            >
              <IonIcon icon={arrowBackOutline} style={{ color: '#FFFFFF', fontSize: '24px' }} />
            </button>
            <h1 style={headerTitleStyle}>Create Account</h1>
            <div style={{ width: '40px' }} /> {/* Espaciador */}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={contentBackgroundStyle}>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        {/* SUBHEADER */}
        <div style={{ textAlign: 'center', margin: '30px 0 25px 0' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#633A0E' }}>
            Create your User
          </h1>
        </div>

        <form onSubmit={handleCreateUser} style={{ padding: '0 10px', paddingBottom: '30px' }}>

          {/* NAME */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>
              Full Name {requiredAsterisk}
            </div>

            <div style={boxStyle}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={personAddOutline} style={{ color: '#999' }} />
                <IonInput
                  value={name}
                  onIonInput={(e) => setName(e.detail.value!)}
                  placeholder="e.g. Betty Higgs"
                />
              </IonItem>
            </div>
          </div>

          {/* EMAIL */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>
              Email Address {requiredAsterisk}
            </div>

            <div style={boxStyle}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={mailOutline} style={{ color: '#999' }} />
                <IonInput
                  type="email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value!)}
                  placeholder="name@example.com"
                />
              </IonItem>
            </div>
          </div>

          {/* PHONE */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>
              Mobile Phone {requiredAsterisk}
            </div>

            <div style={boxStyle}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={personAddOutline} style={{ color: '#999' }} />
                <IonInput
                  type="tel"
                  value={phone}
                  onIonInput={(e) => setPhone(e.detail.value!)}
                  placeholder="+34 600 000 000"
                />
              </IonItem>
            </div>
          </div>

          {/* PASSWORD */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>
              Create Password {requiredAsterisk}
            </div>

            <div style={boxStyle}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={lockClosedOutline} style={{ color: '#999' }} />

                <IonInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                />

                <IonIcon
                  slot="end"
                  icon={showPassword ? eyeOutline : eyeOffOutline}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer', color: '#666' }}
                />
              </IonItem>
            </div>
          </div>

          <IonNote style={{ fontSize: '12px', color: '#A05C1B', fontWeight: '500', display: 'block', marginTop: '4px' }}>
            Must be at least 8 characters long.
          </IonNote>

          {/* CONFIRM PASSWORD */}
          <div style={{ marginTop: '14px', marginBottom: '28px' }}>
            <div style={labelStyle}>
              Confirm Password {requiredAsterisk}
            </div>

            <div style={boxStyle}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={lockClosedOutline} style={{ color: '#999' }} />

                <IonInput
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                />

                <IonIcon
                  slot="end"
                  icon={showConfirmPassword ? eyeOutline : eyeOffOutline}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ cursor: 'pointer', color: '#666' }}
                />
              </IonItem>
            </div>
          </div>

          {/* BUTTON */}
          <IonButton
            expand="block"
            type="submit"
            style={{
              '--background': '#E6A937',
              '--color': '#FFFFFF',
              '--border-radius': '25px',
              height: '50px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Sign In
          </IonButton>

        </form>

      </IonContent>
    </IonPage>
  );
};

/* STYLES */
const contentBackgroundStyle = {
  '--background': '#FFEBB7' 
};

const headerToolbarStyle = {
  '--background': '#E5A93C',
  '--border-width': '0'
};

const headerFlexContainer: React.CSSProperties = {
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px'
};

const backButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const headerTitleStyle: React.CSSProperties = {
  color: '#FFFFFF',
  fontSize: '22px',
  fontWeight: '700',
  margin: 0
};

const boxStyle: React.CSSProperties = {
  background: '#FFFFFF', 
  '--background': '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #999999',
  padding: '2px 14px',
  marginTop: '6px'
} as any;

const itemStyle: React.CSSProperties = {
  '--background': 'transparent',
  '--min-height': 'unset'
} as any;

const labelStyle: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 700,
  color: '#000',
  marginBottom: '4px'
};

export default CreateUser;