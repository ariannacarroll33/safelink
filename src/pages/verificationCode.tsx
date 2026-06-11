import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonToast,
  IonInput
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';

const CODE_LENGTH = 6;

const VerificationCode: React.FC = () => {
  const history = useHistory();
  const location = useLocation<any>();

  const phone = location.state?.phone;
  const preservedData = location.state || {};

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [generatedCode, setGeneratedCode] = useState('');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [resendDisabled, setResendDisabled] = useState(true);
  const [timer, setTimer] = useState(30);

  const inputsRef = useRef<(HTMLIonInputElement | null)[]>([]);

  // INIT CODE
  useEffect(() => {
    if (!phone) {
      history.push('/register');
      return;
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(newCode);

    console.log("SMS sent to:", phone);
    console.log("🔐 Code:", newCode);

    setResendDisabled(true);
    setTimer(30);
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
  };

  // VERIFY
  const verifyCode = (entered: string) => {
    if (entered === generatedCode) {
      setToastMessage('Phone verified successfully');
      setShowToast(true);

      setTimeout(() => {
        history.push('/home');
      }, 1000);
    } else {
      setToastMessage('Invalid verification code');
      setShowToast(true);
      setCode(Array(CODE_LENGTH).fill(''));
      focusInput(0);
    }
  };

  // RESEND
  const resendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    setGeneratedCode(newCode);
    setResendDisabled(true);
    setTimer(30);

    setCode(Array(CODE_LENGTH).fill(''));
    focusInput(0);

    console.log("🔁 New SMS sent to:", phone);
    console.log("🔐 New code:", newCode);

    setToastMessage('New code sent');
    setShowToast(true);
  };

  // CHANGE PHONE
  const changePhoneNumber = () => {
    history.push('/register', {
      ...preservedData,
      phone: ''
    });
  };

  return (
    <IonPage>
      {/* Añadido tu estilo de fondo aquí directamente en el IonContent */}
      <IonContent className="ion-padding" style={contentBackgroundStyle}>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2500}
          position="bottom"
        />

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
            style={{
              '--background': '#E6A937',
              '--border-radius': '25px',
              height: '46px',
              fontWeight: 'bold'
            }}
          >
            Verify
          </IonButton>
        </div>

        {/* RESEND */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={resendCode}
            disabled={resendDisabled}
            style={{
              background: 'none',
              border: 'none',
              color: resendDisabled ? '#aaa' : '#E6A937',
              fontWeight: '600',
              cursor: resendDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            Resend code {resendDisabled ? `(${timer}s)` : ''}
          </button>
        </div>

        {/* CHANGE PHONE */}
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button
            onClick={changePhoneNumber}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: '13px',
              textDecoration: 'underline',
              cursor: 'pointer'
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