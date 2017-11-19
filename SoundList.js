import React, { Component } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import axios from 'axios';
import { List, ListItem } from 'react-native-elements';
import { Actions } from 'react-native-router-flux';
import { BASE_URL } from './url';

class SoundList extends Component {
  state = {
    soundList: null
  }

  componentWillMount() {
    this.fetchSoundList();
  }

  fetchSoundList() {
    axios.get(BASE_URL + '/list-sounds')
      .then(response => this.setState({ soundList: response.data.files }))
      .catch(err => this.setState({ soundList: ['Axios error. Please refresh/restart app.'] }));
  }

  render() {
    return (
      <ScrollView>
        {this.renderSoundList()}
      </ScrollView>
    );
  }

  renderSoundList() {
    const { soundList } = this.state;

    if (soundList) {
      return (
      <List>
        {
          soundList.map((soundName, i) => (
            <ListItem
              key={i}
              title={soundName}
              onPress={() => Actions.playSound({ soundName })}
            />
          ))
        }
      </List>
      );
    }
    
    return (
      <View style={styles.textStyle}>
        <Text>Fetching data</Text>
      </View>
    );
  }
}

const styles = {
  textStyle: {
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default SoundList;
