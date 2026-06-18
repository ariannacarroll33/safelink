import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, mapOutline, linkOutline, ellipsisHorizontalOutline } from 'ionicons/icons'; /*navbar icons*/


import HomePage from './pages/Home';
import MapsPage from './pages/Maps';
import YourLinkPage from './pages/YourLink';
import MorePage from './pages/More';
import NotificationsPage from './pages/Notifications';


import './theme/colours.css';
import './theme/typography.css';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();


// Start Navigation bar. Top and bottom.
function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/home" render={() => <HomePage />} exact={true} />
            <Route path="/maps" render={() => <MapsPage />} exact={true} />
            <Route path="/yourlink" render={() => <YourLinkPage />} exact={true} />
            <Route path="/more" render={() => <MorePage />} exact={true} />
            <Route path="/notifications" render={() => <NotificationsPage />} exact={true} />
            <Route exact path="/" render={() => <Redirect to="/home" />} />
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
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
// End Navigation bar. Top and bottom.
