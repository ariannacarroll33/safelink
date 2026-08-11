import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, mapOutline, linkOutline, ellipsisHorizontalOutline } from 'ionicons/icons';

// Actual existing pages
import Home from './pages/Home';
import CreateUser from './pages/createUser'; 
import MapsPage from './pages/Maps';      
import YourLinkPage from './pages/YourLink'; 
import MorePage from './pages/More';  
import VerificationCode from './pages/verificationCode';
import EmergencyContact from './pages/emergencyContact';
import Welcome from './pages/Welcome';
import Login from './pages/LogIn';
import ForgotPassword from './pages/forgotPassword';
import Onboarding1 from './pages/onboarding/onboarding1';
import Onboarding2 from './pages/onboarding/onboarding2';
import Onboarding3 from './pages/onboarding/onboarding3';
import Onboarding4 from './pages/onboarding/onboarding4';
import EnterPasscode from './pages/enterPasscode';

/* App styles & layout */
import './theme/colours.css';
import './theme/typography.css';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

setupIonicReact();

function App() {
  return (
    <IonApp>
      <IonReactRouter> 
        <IonRouterOutlet>
          
          {/* Ruta Inicial por defecto redirige a Welcome */}
          <Route exact path="/">
            <Redirect to="/welcome" />
          </Route> 

          <Route exact path="/welcome">
            <Welcome />
          </Route>

          <Route path="/register" exact={true}>
            <CreateUser />
          </Route>

          <Route path="/verificationCode" exact={true}> 
            <VerificationCode />
          </Route>

          <Route path="/emergencyContact" exact={true}> 
            <EmergencyContact />
          </Route>

          <Route path="/login" exact={true}>
            <Login />
          </Route>

          <Route path="/forgot-password" exact={true}>
            <ForgotPassword />
          </Route>

          {/* onboarding routes */}
          <Route exact path="/onboarding">
            <Redirect to="/onboarding1" />
          </Route>
          <Route exact path="/onboarding1" component={Onboarding1} />
          <Route exact path="/onboarding2" component={Onboarding2} />
          <Route exact path="/onboarding3" component={Onboarding3} />
          <Route exact path="/onboarding4" component={Onboarding4} />

          <Route exact path="/enterPasscode" component={EnterPasscode} />

          {/* tabs */}
          <Route path="/tabs" render={() => (
            <IonTabs>
              <IonRouterOutlet>
                <Route path="/tabs/home" exact={true}>
                  <Home />
                </Route>
                <Route path="/tabs/maps" render={() => <MapsPage />} exact={true} />
                <Route path="/tabs/yourlink" render={() => <YourLinkPage />} exact={true} />
                <Route path="/tabs/more" render={() => <MorePage />} exact={true} /> 
              </IonRouterOutlet>

              <IonTabBar slot="bottom">
                <IonTabButton tab="home" href="/tabs/home">
                  <IonIcon icon={homeOutline} />
                  <IonLabel>Home</IonLabel>
                </IonTabButton>

                <IonTabButton tab="maps" href="/tabs/maps"> 
                  <IonIcon icon={mapOutline} />
                  <IonLabel>Maps</IonLabel>
                </IonTabButton>

                <IonTabButton tab="yourlink" href="/tabs/yourlink"> 
                  <IonIcon icon={linkOutline} />
                  <IonLabel>Your Link</IonLabel>
                </IonTabButton>

                <IonTabButton tab="more" href="/tabs/more"> 
                  <IonIcon icon={ellipsisHorizontalOutline} />
                  <IonLabel>More</IonLabel>
                </IonTabButton>
              </IonTabBar>
            </IonTabs>
          )} />

          {/* redicrection tabs */}
          <Route exact path="/home">
            <Redirect to="/tabs/home" />
          </Route>
          <Route exact path="/maps">
            <Redirect to="/tabs/maps" />
          </Route>
          <Route exact path="/yourlink">
            <Redirect to="/tabs/yourlink" />
          </Route>
          <Route exact path="/more">
            <Redirect to="/tabs/more" />
          </Route>

        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}

export default App;