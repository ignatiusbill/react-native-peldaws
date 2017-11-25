import React, { Component } from 'react';
import { View, StatusBar } from 'react-native';
import Router from './src/Router';

/* 

The main/driver class of the project.
App.js returns a Router, which is a routing library that allows user to switch between different screens.

*/
class App extends Component {
    constructor(props) {
        super(props);
        StatusBar.setHidden(true);
    }

    render() {
        return (
            <Router />
        );
    }
}

export default App;
