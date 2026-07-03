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
import { doc, setDoc } from 'firebase/firestore';

// LISTA DE PAÍSES AMPLIADA CON EUROPA Y LATINOAMÉRICA (ORDENADA ALFABÉTICAMENTE)
const COUNTRIES = [
  { code: '+49', name: 'Alemania', flag: '🇩🇪' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+32', name: 'Bélgica', flag: '🇧🇪' },
  { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: '+45', name: 'Dinamarca', flag: '🇩🇰' },
  { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
  { code: '+34', name: 'España', flag: '🇪🇸' },
  { code: '+1', name: 'USA / Canadá', flag: '🇺🇸' },
  { code: '+33', name: 'Francia', flag: '🇫🇷' },
  { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: '+504', name: 'Honduras', flag: '🇭🇳' },
  { code: '+44', name: 'Inglaterra / UK', flag: '🇬🇧' },
  { code: '+353', name: 'Irlanda', flag: '🇮🇪' },
  { code: '+39', name: 'Italia', flag: '🇮🇹' },
  { code: '+52', name: 'México', flag: '🇲🇽' },
  { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
  { code: '+47', name: 'Noruega', flag: '🇳🇴' },
  { code: '+31', name: 'Países Bajos', flag: '🇳🇱' },
  { code: '+507', name: 'Panamá', flag: '🇵🇦' },
  { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: '+51', name: 'Perú', flag: '🇵🇪' },
  { code: '+48', name: 'Polonia', flag: '🇵🇱' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+1', name: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: '+44', name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: '+46', name: 'Suecia', flag: '🇸🇪' },
  { code: '+41', name: 'Suiza', flag: '🇨🇭' },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
];

const CreateUser: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  
  // SEPARAMOS EL PREFIJO Y EL NÚMERO LOCAL
  const [countryPrefix, setCountryPrefix] = useState<string>('+34'); // Por defecto España
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

  // ⚡ INICIALIZAR RECAPTCHA
  const setupRecaptcha = () => {
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
      
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('ReCAPTCHA verificado con éxito.');
        },
        'expired-callback': () => {
          alert('El reCAPTCHA ha expirado. Reinténtalo.');
        }
      });
      return (window as any).recaptchaVerifier;
    } catch (err) {
      console.error('Error en RecaptchaVerifier:', err);
    }
  };

  // ⚡ REGISTRO Y ENVÍO DE SMS
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Unimos el prefijo seleccionado con el número limpio ingresado por el usuario
    const cleanPhoneDigits = phone.replace(/\s+/g, ''); 
    const fullPhoneNumber = `${countryPrefix}${cleanPhoneDigits}`;

    if (!name || !email || !cleanPhoneDigits || !password || !confirmPassword) {
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

      const appVerifier = setupRecaptcha();
      if (!appVerifier) {
        throw new Error('No se pudo inicializar el validador de seguridad.');
      }

      // 1. Crear credenciales Email/Password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Vincular y enviar SMS con el número completo e internacional estructurado por detrás
      console.log('Enviando SMS real a:', fullPhoneNumber);
      const confirmationResult = await linkWithPhoneNumber(user, fullPhoneNumber, appVerifier);
      (window as any).confirmationResult = confirmationResult;

      // 3. Guardar datos en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: name,
        email: email,
        mobilePhone: fullPhoneNumber,
        createdAt: new Date().toISOString()
      });

      setLoading(false);
      history.push('/verificationCode', { phone: fullPhoneNumber });

    } catch (error: any) {
      setLoading(false);
      console.error('Error detectado:', error);
      
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

          {/* NAME */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Full Name {requiredAsterisk}</div>
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

          {/* PHONE FIELD WITH COUNTRY SELECTOR */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Mobile Phone {requiredAsterisk}</div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              
              {/* SELECTOR DE BANDERA + PREFIJO */}
              <div style={{ ...boxStyle, marginTop: 0, width: '120px', flexShrink: 0 }}>
                <IonItem lines="none" style={itemStyle}>
                  <IonSelect 
                    value={countryPrefix} 
                    onIonChange={(e) => setCountryPrefix(e.detail.value)}
                    interface="action-sheet" 
                    style={{ '--padding-start': '0', fontSize: '14px' }}
                  >
                    {COUNTRIES.map((country, index) => (
                      <IonSelectOption key={index} value={country.code}>
                        {country.flag} {country.code}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </div>

              {/* INPUT PARA EL NÚMERO LOCAL SOLO */}
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

          <IonNote style={{ fontSize: '12px', color: '#A05C1B', fontWeight: '500', display: 'block', marginTop: '4px' }}>
            Must be at least 8 characters long.
          </IonNote>

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
            {loading ? 'Sending SMS Code...' : 'Sign Up'}
          </IonButton>

        </form>
      </IonContent>
    </IonPage>
  );
};

/* 🎨 ESTILOS MANTENIDOS */
const contentBackgroundStyle = { '--background': '#FFEBB7' };
const headerToolbarStyle = { '--background': '#E5A93C', '--border-width': '0' };
const headerFlexContainer: React.CSSProperties = { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' };
const backButtonStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const headerTitleStyle: React.CSSProperties = { color: '#FFFFFF', fontSize: '22px', fontWeight: '700', margin: 0 };
const boxStyle = { background: '#FFFFFF', '--background': '#FFFFFF', borderRadius: '12px', border: '1px solid #999999', padding: '2px 14px', marginTop: '6px' };
const itemStyle = { '--background': 'transparent', '--min-height': 'unset' };
const labelStyle: React.CSSProperties = { fontSize: '17px', fontWeight: 700, color: '#000', marginBottom: '4px' };

export default CreateUser;