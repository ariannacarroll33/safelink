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
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();


// Start Navigation bar. Top and bottom.
function App() {
  return (
    <IonApp>
      <IonReactRouter> 
        <IonRouterOutlet>
          
          <Route exact path="/">
            <Welcome />
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

<<<<<<< HEAD
export default App;
=======
export default App;
// End Navigation bar. Top and bottom.
>>>>>>> badfbf0635016554cf88fe576c7067cd34559fdb
