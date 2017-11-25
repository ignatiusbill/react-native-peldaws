import React from 'react';
import { Scene, Router, Actions } from 'react-native-router-flux';
import SoundList from './screens/SoundList';
import PlaySound from './screens/PlaySound';

/*

There are 2 Screens used in this app: SoundList.js and PlaySound.js
SoundList shows all the sounds uploaded in the cloud.
PlaySound allows user to play the selected sound and shows the sound image and details/attributes.

*/
const RouterComponent = () => {
    return (
        <Router sceneStyle={{ paddingTop: 25 }}>
            <Scene key="sound">
                <Scene 
                    key="soundList"
                    component={SoundList}
                    title="Sound List"
                    initial
                />
                <Scene 
                    key="playSound"
                    component={PlaySound}
                    title="Play Sound"
                    onLeft={() => Actions.pop()}
                />
            </Scene>
        </Router>
    );
};

export default RouterComponent;
