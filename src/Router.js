import React from 'react';
import { Scene, Router, Actions } from 'react-native-router-flux';
import SoundList from './screens/SoundList';
import PlaySound from './screens/PlaySound';

const RouterComponent = () => {
    return (
        <Router sceneStyle={{ paddingTop: 65 }}>
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
