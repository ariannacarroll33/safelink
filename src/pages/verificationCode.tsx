import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonToast,
  IonInput
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';

// 🔌 REAL FIREBASE IMPORTS
import { auth } from '../services/firebaseConfig';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const CODE_LENGTH = 6;

const VerificationCode: React.FC = () => {
  const history = useHistory();
  const location = useLocation<any>();

  const phone = location.state?.phone;
  const preservedData = location.state || {};

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  
  // 🔐 This replaces generatedCode and holds the real active Firebase session
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [resendDisabled, setResendDisabled] = useState(true);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef<(HTMLIonInputElement | null)[]>([]);

  // ⚡ INIT CODE & SEND REAL SMS ON MOUNT
  useEffect(() => {
    if (!phone) {
      history.push('/createUser'); // Redirect to your registration page if no phone exists
      return;
    }

    // 1. Setup the invisible Recaptcha container
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        'expired-callback': () => {
          setToastMessage('Recaptcha expired. Please try again.');
          setShowToast(true);
        }
      });
    }

    // 2. Trigger the real Firebase SMS
    const sendInitialSMS = async () => {
      try {
        setLoading(true);
        const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifierRef.current!);
        confirmationResultRef.current = confirmationResult;
        
        setToastMessage(`SMS Verification code sent to ${phone}`);
        setShowToast(true);
      } catch (error: any) {
        console.error("Firebase SMS Send Error:", error);
        setToastMessage('Failed to send SMS. Ensure number includes country code (e.g. +34...)');
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };

    sendInitialSMS();

    setResendDisabled(true);
    setTimer(30);

    // Cleanup recaptcha instance on unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [phone, history]);

  // TIMER
  useEffect(() => {
    if (timer <= 0) {
      setResendDisabled(false);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // FOCUS
  const focusInput = async (index: number) => {
    const input = inputsRef.current[index];
    if (!input) return;

    const native = await input.getInputElement();
    native?.focus();
  };

  // INPUT
  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }

    const fullCode = newCode.join('');
    if (fullCode.length === CODE_LENGTH && !newCode.includes('')) {
      verifyCode(fullCode);
    }
  };

  // BACKSPACE
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  // PASTE
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').slice(0, CODE_LENGTH);

    if (!/^[0-9]+$/.test(pasted)) return;

    const newCode = pasted.split('').slice(0, CODE_LENGTH);
    const filled = Array(CODE_LENGTH).fill('').map((_, i) => newCode[i] || '');

    setCode(filled);

    setTimeout(() => {
      focusInput(CODE_LENGTH - 1);
    }, 100);

    const fullCode = filled.join('');
    if (fullCode.length === CODE_LENGTH && !filled.includes('')) {
      verifyCode(fullCode);
    }
  };

  // ⚡ VERIFY REAL FIREBASE CODE
  const verifyCode = async (entered: string) => {
    if (!confirmationResultRef.current) {
      setToastMessage('No active verification session. Please resend.');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      // Validating code with Firebase servers
      await confirmationResultRef.current.confirm(entered);
      
      setToastMessage('Phone verified successfully!');
      setShowToast(true);

      setTimeout(() => {
        history.push('/home');
      }, 1500);
    } catch (error: any) {
      console.error("Firebase Code Verification Error:", error);
      setToastMessage('Invalid verification code. Please try again.');
      setShowToast(true);
      
      // Reset inputs on failure
      setCode(Array(CODE_LENGTH).fill(''));
      focusInput(0);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ RESEND REAL SMS
  const resendCode = async () => {
    if (!phone || !recaptchaVerifierRef.current) return;

    try {
      setLoading(true);
      const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmationResult;

      setResendDisabled(true);
      setTimer(30);
      setCode(Array(CODE_LENGTH).fill(''));
      focusInput(0);

      setToastMessage('A new verification code has been sent');
      setShowToast(true);
    } catch (error: any) {
      console.error("Firebase Resend Error:", error);
      setToastMessage('Failed to resend code. Please try again later.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // CHANGE PHONE
  const changePhoneNumber = () => {
    history.push('/createUser', {
      ...preservedData,
      phone: ''
    });
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={contentBackgroundStyle}>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2500}
          position="bottom"
        />

        {/* 🛠️ GHOST RECAPTCHA CONTAINER REQUIRED BY FIREBASE */}
        <div id="recaptcha-container"></div>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
            Verify your phone number
          </h1>

          <p style={{ color: '#666', fontSize: '14px' }}>
            Enter the 6-digit code sent to {phone}
          </p>
        </div>

        {/* INPUTS */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '40px'
          }}
          onPaste={handlePaste}
        >
          {code.map((digit, index) => (
            <IonInput
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              value={digit}
              maxlength={1}
              inputmode="numeric"
              onIonInput={(e) =>
                handleChange(e.detail.value ?? '', index)
              }
              onKeyDown={(e) => handleKeyDown(e as any, index)}
              disabled={loading}
              style={{
                width: '48px',
                height: '56px',
                textAlign: 'center',
                fontSize: '22px',
                borderRadius: '12px',
                border: '1px solid #ddd',
                background: '#f4f5f8'
              }}
            />
          ))}
        </div>

        {/* VERIFY */}
        <div style={{ marginTop: '30px' }}>
          <IonButton
            expand="block"
            onClick={() => verifyCode(code.join(''))}
            disabled={loading || code.includes('')}
            style={{
              '--background': '#E6A937',
              '--border-radius': '25px',
              height: '46px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </IonButton>
        </div>

        {/* RESEND */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={resendCode}
            disabled={resendDisabled || loading}
            style={{
              background: 'none',
              border: 'none',
              color: resendDisabled || loading ? '#aaa' : '#E6A937',
              fontWeight: '600',
              cursor: resendDisabled || loading ? 'not-allowed' : 'pointer'
            }}
          >
            Resend code {resendDisabled ? `(${timer}s)` : ''}
          </button>
        </div>

        {/* CHANGE PHONE */}
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button
            onClick={changePhoneNumber}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: '13px',
              textDecoration: 'underline',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Change phone number
          </button>
        </div>

      </IonContent>
    </IonPage>
  );
};

/* STYLES */
const contentBackgroundStyle = {
  '--background': '#FFEBB7'
};

export default VerificationCode;