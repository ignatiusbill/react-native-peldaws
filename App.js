import React, { Component } from 'react';
import { View, StatusBar } from 'react-native';
import Router from './src/Router';

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
