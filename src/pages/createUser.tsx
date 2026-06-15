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
  IonToolbar,
  InputChangeEventDetail
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

// FIREBASE INTEGRATION
import { auth, db } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const CreateUser: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const history = useHistory();

  const requiredAsterisk = (
    <span style={{ color: '#E6A937', marginLeft: '4px' }}>*</span>
  );

  // ⚡ ASYNC FUNCTION TO HANDLE SIGN UP WITH FIREBASE
  const handleCreateUser = async (e: React.FormEvent) => {
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

    if (password.length < 8) {
      setToastMessage('Password must be at least 8 characters long.');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);

      // 1. Create credential user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save additional profile data (Name & Phone) in Firestore database
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: name,
        email: email,
        mobilePhone: phone,
        createdAt: new Date().toISOString()
      });

      // 3. Success! Proceed to SMS Verification View
      setLoading(false);
      history.push('/verificationCode', { phone });

    } catch (error: any) {
      setLoading(false);
      
      if (error.code === 'auth/email-already-in-use') {
        setToastMessage('This email address is already registered.');
      } else if (error.code === 'auth/invalid-email') {
        setToastMessage('The email address format is invalid.');
      } else {
        setToastMessage('An error occurred during registration. Please try again.');
      }
      setShowToast(true);
    }
  };

  return (
    <IonPage>
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
            <div style={{ width: '40px' }} />
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
                  onIonChange={(e) => setName(e.detail.value || '')}
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
                  onIonChange={(e) => setEmail(e.detail.value || '')}
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
                  onIonChange={(e) => setPhone(e.detail.value || '')}
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
                  onIonChange={(e) => setPassword(e.detail.value || '')}
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
                  onIonChange={(e) => setConfirmPassword(e.detail.value || '')}
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
            disabled={loading}
            style={{
              '--background': '#E6A937',
              '--color': '#FFFFFF',
              '--border-radius': '25px',
              height: '50px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {loading ? 'Creating Profile...' : 'Sign In'}
          </IonButton>

        </form>

      </IonContent>
    </IonPage>
  );
};

/* 🎨 ALL MISSING STYLES RESTORED HERE */
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

const boxStyle = {
  background: '#FFFFFF', 
  '--background': '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #999999',
  padding: '2px 14px',
  marginTop: '6px'
};

const itemStyle = {
  '--background': 'transparent',
  '--min-height': 'unset'
};

const labelStyle: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 700,
  color: '#000',
  marginBottom: '4px'
};

export default CreateUser;