import React, { useState, useEffect } from 'react';
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
  IonSelect,
  IonSelectOption
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
import { createUserWithEmailAndPassword, RecaptchaVerifier, linkWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

// countries + number 
const COUNTRIES = [
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+1', name: 'USA / Canada', flag: '🇺🇸' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: '+504', name: 'Honduras', flag: '🇭🇳' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+507', name: 'Panama', flag: '🇵🇦' },
  { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: '+51', name: 'Peru', flag: '🇵🇪' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+1', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: '+44', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
];

const CreateUser: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  
  // prefix setting 
  const [countryPrefix, setCountryPrefix] = useState<string>('+34'); // Por defecto España
  const [phone, setPhone] = useState<string>('');
  
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  // real time password validation
  const [hasEightChars, setHasEightChars] = useState<boolean>(false);
  const [hasNumber, setHasNumber] = useState<boolean>(false);
  const [hasSpecialChar, setHasSpecialChar] = useState<boolean>(false);

  const history = useHistory();

  const requiredAsterisk = (
    <span style={{ color: '#E6A937', marginLeft: '4px' }}>*</span>
  );

  // validation password settings 
  useEffect(() => {
    setHasEightChars(password.length >= 8);
    setHasNumber(/\d/.test(password));
    setHasSpecialChar(/[!@#$%^&*(),.?":{}|<>_+\-[\]/\\]/.test(password));
  }, [password]);

  // see if password is valid (for requirements)
  const isPasswordValid = hasEightChars && hasNumber && hasSpecialChar;

  // see contries summary
  const selectedCountry = COUNTRIES.find(c => c.code === countryPrefix) || COUNTRIES[11];

  // start RECAPTCHA
  const setupRecaptcha = () => {
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
      
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('ReCAPTCHA verified successfully.');
        },
        'expired-callback': () => {
          alert('ReCAPTCHA expired. Please try again.');
        }
      });
      return (window as any).recaptchaVerifier;
    } catch (err) {
      console.error('Error in RecaptchaVerifier:', err);
    }
  };

  // ⚡ register and send sms
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // clean data
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanPhoneDigits = phone.replace(/\s+/g, ''); 
    const fullPhoneNumber = `${countryPrefix}${cleanPhoneDigits}`;

    if (!name || !cleanUsername || !email || !cleanPhoneDigits || !password || !confirmPassword) {
      setToastMessage('Please fill in all required fields.');
      setShowToast(true);
      return;
    }

    // strict verification password 
    if (!isPasswordValid) {
      setToastMessage('Password does not meet all security requirements.');
      setShowToast(true);
      return;
    }

    if (password !== confirmPassword) {
      setToastMessage('Passwords do not match.');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);

      // verfication username is unique 
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', cleanUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setLoading(false);
        setToastMessage('This username is already taken. Please choose another.');
        setShowToast(true);
        return;
      }

      const appVerifier = setupRecaptcha();
      if (!appVerifier) {
        throw new Error('Could not initialize security validator.');
      }

      // create email and password 
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // send sms 
      console.log('Sending real SMS to:', fullPhoneNumber);
      const confirmationResult = await linkWithPhoneNumber(user, fullPhoneNumber, appVerifier);
      (window as any).confirmationResult = confirmationResult;

      // save in firestore 
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: name,
        username: cleanUsername,
        email: email,
        mobilePhone: fullPhoneNumber,
        createdAt: new Date().toISOString()
      });

      setLoading(false);
      history.push('/verificationCode', { phone: fullPhoneNumber });

    } catch (error: any) {
      setLoading(false);
      console.error('Error detected:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setToastMessage('This email address is already registered.');
      } else if (error.code === 'auth/invalid-email') {
        setToastMessage('The email address format is invalid.');
      } else if (error.code === 'auth/sms-quota-exceeded') {
        setToastMessage('SMS daily limit exceeded. Please try again tomorrow.');
      } else {
        setToastMessage(`Registration failed: ${error.message || 'Check connection'}`);
      }
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      {/* yellow-400 font for the countries selection page */}
      <style>{`
        ion-action-sheet.custom-country-select-sheet {
          --background: var(--yellow-400) !important;
          --button-background: var(--yellow-400) !important;
          --button-background-selected: var(--yellow-500) !important;
          --button-color: var(--black) !important;
        }

        .custom-country-select-sheet .action-sheet-container,
        .custom-country-select-sheet .action-sheet-group {
          background-color: var(--yellow-400) !important;
          background: var(--yellow-400) !important;
        }

        .custom-country-select-sheet .action-sheet-button {
          --background: var(--yellow-400) !important;
          background-color: var(--yellow-400) !important;
          background: var(--yellow-400) !important;
          color: var(--black) !important;
          font-weight: 600 !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
        }

        .custom-country-select-sheet .action-sheet-button.action-sheet-cancel {
          --background: var(--yellow-600) !important;
          background-color: var(--yellow-600) !important;
          background: var(--yellow-600) !important;
          color: var(--white) !important;
          font-weight: bold !important;
        }
        
        .custom-country-select-sheet .action-sheet-button.activated {
          background-color: var(--yellow-500) !important;
          background: var(--yellow-500) !important;
        }
      `}</style>

      <IonHeader className="ion-no-border">
        <IonToolbar style={headerToolbarStyle}>
          <div style={headerFlexContainer}>
            <button onClick={() => history.goBack()} style={backButtonStyle} type="button">
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

        <div id="recaptcha-container"></div>

        <div style={{ textAlign: 'center', margin: '30px 0 25px 0' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#633A0E' }}>
            Create your User
          </h1>
        </div>

        <form onSubmit={handleCreateUser} style={{ padding: '0 10px', paddingBottom: '30px' }}>

          {/* YOUR NAME */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Your Name {requiredAsterisk}</div>
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

          {/* USERNAME */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Username {requiredAsterisk}</div>
            <div style={boxStyle}>
              <IonItem lines="none" style={itemStyle}>
                <IonInput
                  value={username}
                  onIonChange={(e) => setUsername(e.detail.value || '')}
                  placeholder="@userexample"
                />
              </IonItem>
            </div>
          </div>

          {/* EMAIL */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Email Address {requiredAsterisk}</div>
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

          {/* PHONE FIELD */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Mobile Phone {requiredAsterisk}</div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              
              {/* dynamic countries selector */}
              <div style={{ 
                ...boxStyle, 
                marginTop: 0, 
                minWidth: '110px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                padding: '2px 8px'
              }}>
                {/* visual display */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontSize: '15px', 
                  fontWeight: '600', 
                  color: '#000000',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap'
                }}>
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.code}</span>
                </div>

                {/* ionic select */}
                <IonSelect 
                  value={countryPrefix} 
                  onIonChange={(e) => setCountryPrefix(e.detail.value)}
                  interface="action-sheet" 
                  interfaceOptions={{
                    cssClass: 'custom-country-select-sheet'
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    pointerEvents: 'auto'
                  }}
                >
                  {COUNTRIES.map((country, index) => {
                    const listLabel = `${country.flag} ${country.code} - ${country.name}`;
                    return (
                      <IonSelectOption key={index} value={country.code}>
                        {listLabel}
                      </IonSelectOption>
                    );
                  })}
                </IonSelect>
              </div>

              {/* input number  */}
              <div style={{ ...boxStyle, marginTop: 0, flexGrow: 1 }}>
                <IonItem lines="none" style={itemStyle}>
                  <IonInput
                    type="tel"
                    value={phone}
                    onIonChange={(e) => setPhone(e.detail.value || '')}
                    placeholder="600 000 000" 
                  />
                </IonItem>
              </div>

            </div>
          </div>

          {/* PASSWORD */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Create Password {requiredAsterisk}</div>
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

          {/* dynamic rules */}
          <div style={{ padding: '0 4px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>
              Password Requirements:
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
              <li style={{ 
                color: hasEightChars ? '#A05C1B' : '#999999', 
                transition: 'color 0.3s ease',
                fontWeight: hasEightChars ? '700' : '500' 
              }}>
                At least 8 characters long
              </li>
              <li style={{ 
                color: hasNumber ? '#A05C1B' : '#999999', 
                transition: 'color 0.3s ease',
                fontWeight: hasNumber ? '700' : '500' 
              }}>
                At least one number
              </li>
              <li style={{ 
                color: hasSpecialChar ? '#A05C1B' : '#999999', 
                transition: 'color 0.3s ease',
                fontWeight: hasSpecialChar ? '700' : '500' 
              }}>
                At least one special character (e.g., !@#$%)
              </li>
            </ul>
          </div>

          {/* CONFIRM PASSWORD */}
          <div style={{ marginTop: '14px', marginBottom: '28px' }}>
            <div style={labelStyle}>Confirm Password {requiredAsterisk}</div>
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
            disabled={loading || !isPasswordValid}
            style={{
              '--background': isPasswordValid ? '#E6A937' : '#D4C3A3',
              '--color': '#FFFFFF',
              '--border-radius': '25px',
              height: '50px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {loading ? 'Sending SMS Code...' : 'Sign Up'}
          </IonButton>

        </form>
      </IonContent>
    </IonPage>
  );
};

/* styles */
const contentBackgroundStyle = { '--background': '#FFEBB7' };
const headerToolbarStyle = { '--background': '#E5A93C', '--border-width': '0' };
const headerFlexContainer: React.CSSProperties = { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' };
const backButtonStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const headerTitleStyle: React.CSSProperties = { color: '#FFFFFF', fontSize: '22px', fontWeight: '700', margin: 0 };
const boxStyle = { background: '#FFFFFF', '--background': '#FFFFFF', borderRadius: '12px', border: '1px solid #999999', padding: '2px 14px', marginTop: '6px' };
const itemStyle = { '--background': 'transparent', '--min-height': 'unset' };
const labelStyle: React.CSSProperties = { fontSize: '17px', fontWeight: 700, color: '#000', marginBottom: '4px' };

export default CreateUser;