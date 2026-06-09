import React, { useState } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton, 
  IonIcon,
  IonText,
  IonNote
} from '@ionic/react';
import { personAddOutline, mailOutline, lockClosedOutline, shieldCheckmarkOutline } from 'ionicons/icons';

const CreateUser: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SafeLink - Registering new user:', { name, email });
    // Aquí conectarás con vuestro backend o Firebase
    alert(`Success! SafeLink profile created for ${name}.`);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle>SafeLink Setup</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '64px', color: 'var(--ion-color-primary)' }} />
          <h1 style={{ fontWeight: '700', fontSize: '28px', marginTop: '10px' }}>Create your User</h1>
          <p style={{ color: '#666' }}>Set up this quickly!.</p>
        </div>

        <form onSubmit={handleCreateUser}>
          <IonItem lines="inset" className="ion-margin-bottom">
            <IonIcon slot="start" icon={personAddOutline} color="medium" />
            <IonLabel position="floating">Full Name</IonLabel>
            <IonInput 
              placeholder="e.g. Laura Valia"
              value={name} 
              onIonInput={(e) => setName(e.detail.value!)} 
              required 
            />
          </IonItem>

          <IonItem lines="inset" className="ion-margin-bottom">
            <IonIcon slot="start" icon={mailOutline} color="medium" />
            <IonLabel position="floating">Email Address</IonLabel>
            <IonInput 
              type="email" 
              placeholder="name@example.com"
              value={email} 
              onIonInput={(e) => setEmail(e.detail.value!)} 
              required 
            />
          </IonItem>

          <IonItem lines="inset" className="ion-margin-bottom">
            <IonIcon slot="start" icon={lockClosedOutline} color="medium" />
            <IonLabel position="floating">Create Password</IonLabel>
            <IonInput 
              type="password" 
              value={password} 
              onIonInput={(e) => setPassword(e.detail.value!)} 
              required 
            />
          </IonItem>
          <IonNote className="ion-padding-start" style={{ fontSize: '12px' }}>
            Must be at least 8 characters long.
          </IonNote>

          <div style={{ marginTop: '50px' }}>
            <IonButton expand="block" type="submit" shape="round" color="primary">
              Initialize Profile
            </IonButton>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <IonText color="medium" style={{ fontSize: '14px' }}>
            Ready? <a href="/login" style={{ fontWeight: 'bold', textDecoration: 'none' }}>Log In</a>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateUser;