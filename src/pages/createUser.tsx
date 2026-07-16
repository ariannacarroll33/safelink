import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
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
import { collection, query, where, getDocs } from 'firebase/firestore';

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
  const history = useHistory();

  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [countryPrefix, setCountryPrefix] = useState<string>('+34'); 
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  const [hasEightChars, setHasEightChars] = useState<boolean>(false);
  const [hasNumber, setHasNumber] = useState<boolean>(false);
  const [hasSpecialChar, setHasSpecialChar] = useState<boolean>(false);

  useEffect(() => {
    setHasEightChars(password.length >= 8);
    setHasNumber(/\d/.test(password));
    setHasSpecialChar(/[!@#$%^&*(),.?":{}|<>_+\-[\]/\\]/.test(password));
  }, [password]);

  const isPasswordValid = hasEightChars && hasNumber && hasSpecialChar;

  const isFormFullyValid = 
    name.trim() !== '' && 
    username.trim() !== '' && 
    email.trim() !== '' && 
    phone.trim() !== '' && 
    password !== '' && 
    confirmPassword !== '' && 
    isPasswordValid && 
    password === confirmPassword;

  const selectedCountry = COUNTRIES.find(c => c.code === countryPrefix) || COUNTRIES[11];

  const setupRecaptcha = () => {
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('ReCAPTCHA verified successfully.'),
        'expired-callback': () => alert('ReCAPTCHA expired. Please try again.')
      });
      return (window as any).recaptchaVerifier;
    } catch (err) {
      console.error('Error in RecaptchaVerifier:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentErrors: { [key: string]: boolean } = {};

    if (!name.trim()) currentErrors.name = true;
    if (!username.trim()) currentErrors.username = true;
    if (!email.trim()) currentErrors.email = true;
    if (!phone.trim()) currentErrors.phone = true;
    if (!password) currentErrors.password = true;
    if (!confirmPassword) currentErrors.confirmPassword = true;

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      setToastMessage('Please fill in all required highlighted fields.');
      setShowToast(true);
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanPhoneDigits = phone.replace(/\s+/g, ''); 
    const fullPhoneNumber = `${countryPrefix}${cleanPhoneDigits}`;

    if (!isPasswordValid) {
      currentErrors.password = true;
      setErrors(currentErrors);
      setToastMessage('Password does not meet all security requirements.');
      setShowToast(true);
      return;
    }

    if (password !== confirmPassword) {
      currentErrors.confirmPassword = true;
      setErrors(currentErrors);
      setToastMessage('Passwords do not match.');
      setShowToast(true);
      return;
    }

    setErrors({});

    try {
      setLoading(true);

      // Check unique username
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', cleanUsername));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setLoading(false);
        currentErrors.username = true;
        setErrors(currentErrors);
        setToastMessage('This username is already taken. Please choose another.');
        setShowToast(true);
        return;
      }

      const appVerifier = setupRecaptcha();
      if (!appVerifier) throw new Error('Could not initialize security validator.');

      // Create Authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Link phone number via SMS
      console.log('Sending real SMS to:', fullPhoneNumber);
      const confirmationResult = await linkWithPhoneNumber(user, fullPhoneNumber, appVerifier);
      (window as any).confirmationResult = confirmationResult;

      setLoading(false);

      // Push all fresh user profile data to the verification screen
      history.push('/verificationCode', { 
        phone: fullPhoneNumber,
        userData: {
          uid: user.uid,
          fullName: name,
          username: cleanUsername,
          email: email
        }
      });

    } catch (error: any) {
      setLoading(false);
      console.error('Error detected:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: true });
        setToastMessage('This email address is already registered.');
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: true });
        setToastMessage('The email address format is invalid.');
      } else if (error.code === 'auth/sms-quota-exceeded') {
        setToastMessage('SMS daily limit exceeded. Please try again tomorrow.');
      } else {
        setToastMessage(`Registration failed: ${error.message || 'Check connection'}`);
      }
      setShowToast(true);
    }
  };

  const getBoxStyle = (fieldName: string) => {
    return {
      ...boxStyle,
      border: errors[fieldName] ? '2px solid #FF3B30' : '1px solid #999999',
      transition: 'border 0.2s ease-in-out'
    };
  };

  return (
    <IonPage>
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
        }
        .custom-country-select-sheet .action-sheet-button {
          --background: var(--yellow-400) !important;
          color: var(--black) !important;
          font-weight: 600 !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
        }
        .custom-country-select-sheet .action-sheet-button.action-sheet-cancel {
          --background: var(--yellow-600) !important;
          color: var(--white) !important;
          font-weight: bold !important;
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
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#633A0E' }}>Create your User</h1>
        </div>

        <form onSubmit={handleCreateUser} style={{ padding: '0 10px', paddingBottom: '30px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Your Name <span style={{ color: '#E6A937' }}>*</span></div>
            <div style={getBoxStyle('name')}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={personAddOutline} style={{ color: '#999' }} />
                <IonInput
                  value={name}
                  onIonInput={(e) => {
                    setName(e.detail.value || '');
                    if(errors.name) setErrors({...errors, name: false});
                  }}
                  placeholder="e.g. Betty Higgs"
                />
              </IonItem>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Username <span style={{ color: '#E6A937' }}>*</span></div>
            <div style={getBoxStyle('username')}>
              <IonItem lines="none" style={itemStyle}>
                <IonInput
                  value={username}
                  onIonInput={(e) => {
                    setUsername(e.detail.value || '');
                    if(errors.username) setErrors({...errors, username: false});
                  }}
                  placeholder="@userexample"
                />
              </IonItem>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Email Address <span style={{ color: '#E6A937' }}>*</span></div>
            <div style={getBoxStyle('email')}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={mailOutline} style={{ color: '#999' }} />
                <IonInput
                  type="email"
                  value={email}
                  onIonInput={(e) => {
                    setEmail(e.detail.value || '');
                    if(errors.email) setErrors({...errors, email: false});
                  }}
                  placeholder="name@example.com"
                />
              </IonItem>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Mobile Phone <span style={{ color: '#E6A937' }}>*</span></div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <div style={{ 
                ...boxStyle, marginTop: 0, minWidth: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', padding: '2px 8px', border: errors.phone ? '2px solid #FF3B30' : '1px solid #999999'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: '600', color: '#000' }}>
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.code}</span>
                </div>
                <IonSelect 
                  value={countryPrefix} 
                  onIonChange={(e) => setCountryPrefix(e.detail.value)}
                  interface="action-sheet" 
                  interfaceOptions={{ cssClass: 'custom-country-select-sheet' }}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0 }}
                >
                  {COUNTRIES.map((country, idx) => (
                    <IonSelectOption key={idx} value={country.code}>
                      {country.flag} {country.code} - {country.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </div>

              <div style={{ ...getBoxStyle('phone'), marginTop: 0, flexGrow: 1 }}>
                <IonItem lines="none" style={itemStyle}>
                  <IonInput
                    type="tel"
                    value={phone}
                    onIonInput={(e) => {
                      setPhone(e.detail.value || '');
                      if(errors.phone) setErrors({...errors, phone: false});
                    }}
                    placeholder="600 000 000" 
                  />
                </IonItem>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Create Password <span style={{ color: '#E6A937' }}>*</span></div>
            <div style={getBoxStyle('password')}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={lockClosedOutline} style={{ color: '#999' }} />
                <IonInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onIonInput={(e) => {
                    setPassword(e.detail.value || '');
                    if(errors.password) setErrors({...errors, password: false});
                  }}
                />
                <IonIcon slot="end" icon={showPassword ? eyeOutline : eyeOffOutline} onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }} />
              </IonItem>
            </div>
          </div>

          <div style={{ padding: '0 4px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Password Requirements:</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
              <li style={{ color: hasEightChars ? '#A05C1B' : '#999', fontWeight: hasEightChars ? '700' : '500' }}>At least 8 characters long</li>
              <li style={{ color: hasNumber ? '#A05C1B' : '#999', fontWeight: hasNumber ? '700' : '500' }}>At least one number</li>
              <li style={{ color: hasSpecialChar ? '#A05C1B' : '#999', fontWeight: hasSpecialChar ? '700' : '500' }}>At least one special character</li>
            </ul>
          </div>

          <div style={{ marginTop: '14px', marginBottom: '28px' }}>
            <div style={labelStyle}>Confirm Password <span style={{ color: '#E6A937' }}>*</span></div>
            <div style={getBoxStyle('confirmPassword')}>
              <IonItem lines="none" style={itemStyle}>
                <IonIcon slot="start" icon={lockClosedOutline} style={{ color: '#999' }} />
                <IonInput
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onIonInput={(e) => {
                    setConfirmPassword(e.detail.value || '');
                    if(errors.confirmPassword) setErrors({...errors, confirmPassword: false});
                  }}
                />
                <IonIcon slot="end" icon={showConfirmPassword ? eyeOutline : eyeOffOutline} onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: 'pointer' }} />
              </IonItem>
            </div>
          </div>

          <IonButton
            expand="block"
            type="submit"
            disabled={loading}
            style={{
              '--background': isFormFullyValid ? '#E6A937' : '#F7E2B4',
              '--color': isFormFullyValid ? '#FFFFFF' : '#A08E70',
              '--border-radius': '25px', height: '50px', fontWeight: 'bold', fontSize: '16px'
            }}
          >
            {loading ? 'Next...' : 'Sign Up'}
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

const contentBackgroundStyle = { '--background': '#FFEBB7' };
const headerToolbarStyle = { '--background': '#E5A93C', '--border-width': '0' };
const headerFlexContainer: React.CSSProperties = { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' };
const backButtonStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const headerTitleStyle: React.CSSProperties = { color: '#FFFFFF', fontSize: '22px', fontWeight: '700', margin: 0 };
const boxStyle = { background: '#FFFFFF', '--background': '#FFFFFF', borderRadius: '12px', border: '1px solid #999999', padding: '2px 14px', marginTop: '6px' };
const itemStyle = { '--background': 'transparent', '--min-height': 'unset' };
const labelStyle: React.CSSProperties = { fontSize: '17px', fontWeight: 700, color: '#000', marginBottom: '4px' };

export default CreateUser;