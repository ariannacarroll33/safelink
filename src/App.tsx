import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  homeOutline,
  mapOutline,
  linkOutline,
  ellipsisHorizontalOutline
} from 'ionicons/icons';

/* Pages */
import Home from './pages/Home';
import CreateUser from './pages/createUser';
import MapsPage from './pages/Maps';
import YourLinkPage from './pages/YourLink';
import MorePage from './pages/More';
import VerificationCode from './pages/verificationCode';

/* Styles */
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
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>

          <IonRouterOutlet>

            {/* ROOT */}
            <Redirect exact path="/" to="/register" />

            {/* REGISTER */}
            <Route path="/register" exact={true}>
              <CreateUser />
            </Route>

            {/* VERIFICATION CODE */}
            <Route path="/verificationCode" exact={true}>
              <VerificationCode />
            </Route>

            {/* HOME */}
            <Route path="/home" exact={true}>
              <Home />
            </Route>

            {/* MAPS */}
            <Route path="/maps" exact={true}>
              <MapsPage />
            </Route>

            {/* YOUR LINK */}
            <Route path="/yourlink" exact={true}>
              <YourLinkPage />
            </Route>

            {/* MORE */}
            <Route path="/more" exact={true}>
              <MorePage />
            </Route>

          </IonRouterOutlet>

          {/* TAB BAR (HIDDEN DURING SIGNUP FLOW) */}
          <IonTabBar
            slot="bottom"
            className={
              window.location.pathname === '/register' ||
              window.location.pathname === '/' ||
              window.location.pathname === '/verificationCode'
                ? 'ion-hide'
                : ''
            }
          >

            <IonTabButton tab="home" href="/home">
              <IonIcon icon={homeOutline} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>

            <IonTabButton tab="maps" href="/maps">
              <IonIcon icon={mapOutline} />
              <IonLabel>Maps</IonLabel>
            </IonTabButton>

            <IonTabButton tab="yourlink" href="/yourlink">
              <IonIcon icon={linkOutline} />
              <IonLabel>Your Link</IonLabel>
            </IonTabButton>

            <IonTabButton tab="more" href="/more">
              <IonIcon icon={ellipsisHorizontalOutline} />
              <IonLabel>More</IonLabel>
            </IonTabButton>

          </IonTabBar>

        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
}

export default App;