import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonNote,
  IonToast,
  IonItem
} from '@ionic/react';

import {
  personAddOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline
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

    // conditionals to fill everything * 
    if (!name || !email || !phone || !password || !confirmPassword) {
      setToastMessage('Please fill in all required fields.');
      setShowToast(true);
      return;
    }

    // confirm same passowrd is entered
    if (password !== confirmPassword) {
      setToastMessage('Passwords do not match.');
      setShowToast(true);
      return;
    }
  history.push('/verificationCode', { phone });
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        {/* HEADER */}
        <div style={{ textAlign: 'center', margin: '40px 0 25px 0' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700' }}>
            Create your User
          </h1>
        </div>

        <form onSubmit={handleCreateUser} style={{ padding: '0 10px' }}>

          {/* NAME */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#000' }}>
              Full Name {requiredAsterisk}
            </div>

            <div style={boxStyle}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={personAddOutline} />
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
                <IonIcon slot="start" icon={mailOutline} />
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
                <IonIcon slot="start" icon={personAddOutline} />
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
                <IonIcon slot="start" icon={lockClosedOutline} />

                <IonInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                />

                <IonIcon
                  slot="end"
                  icon={showPassword ? eyeOutline : eyeOffOutline}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer' }}
                />
              </IonItem>
            </div>
          </div>

          <IonNote style={{ fontSize: '11px', color: '#777' }}>
            Must be at least 8 characters long.
          </IonNote>

          {/* CONFIRM PASSWORD */}
          <div style={{ marginTop: '14px', marginBottom: '20px' }}>
            <div style={labelStyle}>
              Confirm Password {requiredAsterisk}
            </div>

            <div style={boxStyle}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={lockClosedOutline} />

                <IonInput
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                />

                <IonIcon
                  slot="end"
                  icon={showConfirmPassword ? eyeOutline : eyeOffOutline}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ cursor: 'pointer' }}
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
              '--border-radius': '25px',
              height: '46px',
              fontWeight: 'bold'
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
const boxStyle: React.CSSProperties = {
  background: '#f4f5f8',
  borderRadius: '20px',
  border: '1px solid #e0e0e0',
  padding: '2px 14px'
};

const itemStyle: React.CSSProperties = {
  '--background': 'transparent',
  '--min-height': 'unset'
} as any;

const labelStyle: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 700,
  color: '#000',
  marginBottom: '6px'
};

export default CreateUser;