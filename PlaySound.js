import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Slider, Image, Dimensions, ScrollView, Modal, Button, TextInput, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import axios from 'axios';
import { Table, Row, Rows } from 'react-native-table-component';
import Spinner from './Spinner';
import { BASE_URL } from './url';

const WINDOW = Dimensions.get('window');
const APP_HEIGHT = WINDOW.height;
const APP_WIDTH = WINDOW.width;
const AXIOS_ERR = 'Axios Error';
const LOADING_STRING = 'Loading';
const INQUIRY_STRING = 'Please enter value(s)';
const NAN_STRING = 'NaN';

class PlaySound extends Component {
    constructor(props) {
        super(props);
        this.isSeeking = false;
        this.state = {
            // UI
            loading: true,
            modalVisible: false,

            // Sound object
            soundObj: null,
            isPlaying: false,
            playbackInstancePosition: null,
            playbackInstanceDuration: null,

            // START OF SOUND DETAILS (GROUPED BY FUNCTIONALITY)
            
            // Sound
            soundEnergy: null,

            // Pitch
            fetchingPitch: false,
            pitch: INQUIRY_STRING,
            
            voicedFrameCount: null,
            
            fetchingValueAtTime: false,
            valueAtTime: INQUIRY_STRING,

            fetchingValueInFrame: false,
            valueInFrame: INQUIRY_STRING,

            // Spectrum
            minFrequency: null,
            maxFrequency: null,

            // Intensity
            startTimeForIntensity: null,
            endTimeForIntensity: null,
            fetchingIntensityOnTimeRange: false,
            intensityOnTimeRange: INQUIRY_STRING,

            minIntensity: null,
            maxIntensity: null,

            meanIntensity: null,

            // Formant
            frameCount: null,

            fetchingFormantInFrame: false,
            formantInFrame: INQUIRY_STRING,

            formantForValue: null,
            timeForValue: null,
            fetchingValueAtFormantAndTime: false,
            valueAtFormantAndTime: INQUIRY_STRING,            

            // Harmonicity
            startTimeForMinHarmonicity: null,
            endTimeForMinHarmonicity: null,
            fetchingMinHarmonicityOnTimeRange: false,
            minHarmonicityOnTimeRange: INQUIRY_STRING,

            startTimeForMaxHarmonicity: null,
            endTimeForMaxHarmonicity: null,
            fetchingMaxHarmonicityOnTimeRange: false,
            maxHarmonicityOnTimeRange: INQUIRY_STRING,

            fetchingHarmonicityAtTime: false,
            harmonicityAtTime: INQUIRY_STRING,

            // PointProcess
            startTimeForPeriodCount: null,
            endTimeForPeriodCount: null,
            fetchingPeriodCountOnTimeRange: false,
            periodCountOnTimeRange: INQUIRY_STRING,

            pointCount: null,

            startTimeForJitter: null,
            endTimeForJitter: null,
            fetchingJitterOnTimeRange: false,
            jitterOnTimeRange: INQUIRY_STRING

            // END OF SOUND DETAILS (GROUPED BY FUNCTIONALITY)
        };
    }

    componentWillMount() {
        this.fetchSound();
        this.fetchEnergy();
        this.fetchVoicedFrameCount();
        this.fetchFrequency();
        this.fetchIntensity();
        this.fetchFrameCount();
        this.fetchPointCount();
    }

    async fetchSound() {
        const { soundName } = this.props;
        const soundURI = BASE_URL + '/play/' + soundName;
        const soundObj = new Expo.Audio.Sound();

        await soundObj.loadAsync({ uri: soundURI });
        soundObj.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);
        this.setState({ loading: false, soundObj });
    }

    fetchEnergy() {
        const { soundEnergy } = this.state;
        const { soundName } = this.props;
        const energyURI = BASE_URL + '/get-energy/' + soundName;

        axios.get(energyURI)
            .then(response => this.setState({ soundEnergy: response.data }))
            .catch(error => this.setState({ soundEnergy: AXIOS_ERR }));
    }
    
    fetchVoicedFrameCount() {
        const { voicedFrameCount } = this.state;
        const { soundName } = this.props;
        const voicedFrameCountURI = BASE_URL + '/pitch/count-voiced-frames/' + soundName;

        axios.get(voicedFrameCountURI)
            .then(response => this.setState({ voicedFrameCount: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ voicedFrameCount: AXIOS_ERR }));
    }

    fetchFrequency() {
        const { minFrequency, maxFrequency } = this.state;
        const { soundName } = this.props;
        const frequencyURI = BASE_URL + '/spectrum/get-bounds/' + soundName;

        axios.get(frequencyURI)
            .then(response => this.setState({
                minFrequency: response.data.low === 0 ? new Number(0) : response.data.low,
                maxFrequency: response.data.high === 0 ? new Number(0) : response.data.high
            }))
            .catch(error => this.setState({
                minFrequency: AXIOS_ERR,
                maxFrequency: AXIOS_ERR
            }));
    }

    fetchIntensity() {
        const { minIntensity, maxIntensity, meanIntensity } = this.state;
        const { soundName } = this.props;
        const intensityURI = BASE_URL + '/intensity/get-bounds/' + soundName;

        axios.get(intensityURI)
            .then(response => this.setState({
                minIntensity: response.data.min === 0 ? new Number(0) : response.data.min,
                maxIntensity: response.data.max === 0 ? new Number(0) : response.data.max,
                meanIntensity: response.data.mean === 0 ? new Number(0) : response.data.mean
            }))
            .catch(error => this.setState({
                minIntensity: AXIOS_ERR,
                maxIntensity: AXIOS_ERR,
                meanIntensity: AXIOS_ERR
            }));
    }

    fetchFrameCount() {
        const { frameCount } = this.state;
        const { soundName } = this.props;
        const frameURI = BASE_URL + '/formant/number-of-frames/' + soundName;

        axios.get(frameURI)
            .then(response => this.setState({ frameCount : response.data }))
            .catch(error => this.setState({ frameCount : AXIOS_ERR }));
    }

    fetchPointCount() {
        const { pointCount } = this.state;
        const { soundName } = this.props;
        const pointURI = BASE_URL + '/pointprocess/number-of-points/' + soundName;

        axios.get(pointURI)
            .then(response => this.setState({ pointCount: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ pointCount: AXIOS_ERR }));
    }

    componentWillUnmount() {
        const { soundObj } = this.state;

        if (soundObj) {
            soundObj.unloadAsync();
            soundObj.setOnPlaybackStatusUpdate(null);
            this.setState({ soundObj: null });
        }
    }
    
    onPlaybackStatusUpdate = status => {
        if (status.isLoaded) {
            this.setState({ 
                playbackInstancePosition: status.positionMillis,
                playbackInstanceDuration: status.durationMillis,
                isPlaying: status.isPlaying
            });
        } else {
            if (status.error) {
                console.log(`FATAL PLAYER ERROR: ${status.error}`);
            }
        }
    };

    render() {
        return (
            <ScrollView>
                {this.renderSoundPlaybackInstance()}
            </ScrollView>
        );
    }

    renderSoundPlaybackInstance() {
        const { soundName } = this.props;
        const { loading, soundObj, modalVisible } = this.state;
        const { playbackSliderStyle, containerStyle } = styles;
        
        if (loading) return <Spinner />;

        if (soundObj) {
            return (
                <View style={containerStyle}>
                    <Text>Currently playing: {soundName}</Text>

                    {this.renderSoundImage()}

                    <Slider 
                        style={playbackSliderStyle} 
                        value={this.getSeekSliderPosition()}
                        onValueChange={this.onSeekSliderValueChange}
                        onSlidingComplete={this.onSeekSliderSlidingComplete}
                    />
                    
                    <Text>{this.getTimestamp()}</Text>

                    {this.renderModal()}

                    {this.renderShowModalButton()}

                    {this.renderPlayButton()}
                </View>
            );
        } 

        return <Text>Failed to get sound.</Text>;
    }

    getSeekSliderPosition() {
        const { soundObj, playbackInstancePosition, playbackInstanceDuration } = this.state;

        if (
            soundObj != null && 
            playbackInstancePosition != null && 
            playbackInstanceDuration != null
        ) {
            return (playbackInstancePosition / playbackInstanceDuration);
        }

        return 0;
    }

    onSeekSliderValueChange = value => {
        const { soundObj } = this.state;

        if (soundObj != null && !this.isSeeking) {
            this.isSeeking = true;
            soundObj.pauseAsync();
        }
    };

    onSeekSliderSlidingComplete = async value => {
        const { soundObj, playbackInstanceDuration } = this.state;

        if (soundObj != null) {
            this.isSeeking = false;
            const seekPosition = value * playbackInstanceDuration;
            soundObj.playFromPositionAsync(seekPosition);
        }
    };

    getTimestamp() {
        const { soundObj, playbackInstancePosition, playbackInstanceDuration } = this.state;

        if (
            soundObj != null && 
            playbackInstancePosition != null && 
            playbackInstanceDuration != null
        ) {
            return `${this.getMMSSFromMillis(playbackInstancePosition)} / ${this.getMMSSFromMillis(playbackInstanceDuration)}`;
        }
        return '';
    }

    getMMSSFromMillis(millis) {
        const totalSeconds = millis / 1000;
        const seconds = Math.floor(totalSeconds % 60);
        const minutes = Math.floor(totalSeconds / 60);

        const padWithZero = number => {
            const string = number.toString();
            if (number < 10) {
                return '0' + string;
            }
            return string;
        };
        return padWithZero(minutes) + ':' + padWithZero(seconds);
    }
    
    renderSoundImage() {
        const { soundName } = this.props;
        const { playbackInstanceDuration } = this.state;
        const { soundImageStyle } = styles;
        const durationInSeconds = playbackInstanceDuration / 1000;
        const soundImageURI = (
            BASE_URL + '/draw-sound/' + soundName + 
            '/0/' + durationInSeconds + '/?pitch&intensity&formants&spectrogram&'
        );
        
        return (
            <Image
                style={soundImageStyle}
                resizeMode='stretch'
                source={{ uri: soundImageURI }}
            />
        );
    }

    renderModal() {
        const { modalVisible } = this.state;

        const tableData = [
            ['Sound'],
            ['Energy', this.getEnergy()],

            ['Pitch'],
            ['Get pitch at\n(time)', this.inquireTimeForPitch(), this.getPitch()],
            ['# of Voiced Frames', this.getVoicedFrameCount()],
            ['Get value at\n(time)', this.inquireTimeForValue(), this.getValueAtTime()],
            ['Get value in\n(frame)', this.inquireFrameForValue(), this.getValueInFrame()],

            ['Spectrum'],
            ['Min./Max. Frequency', this.getMinFrequency() + '/' + this.getMaxFrequency()],

            ['Intensity'],
            ['Get avg. of intensity at\n(t1), (t2)', this.inquireStartTimeForIntensity(), this.inquireEndTimeForIntensity(), this.getIntensityOnTimeRange()],
            ['Min./Max. Intensity', this.getMinIntensity() + '/' + this.getMaxIntensity()],
            ['Average of Intensity', this.getMeanIntensity()],

            ['Formant'],
            ['# of Frames', this.getFrameCount()],
            ['Get # of Formants at\n(frame)', this.inquireFrameForFormant(), this.getFormantInFrame()],
            ['Get formant value at\n(formant), (t)', this.inquireFormantForFormantValue(), this.inquireTimeForFormantValue(), this.getValueAtFormantAndTime()],

            ['Harmonicity'],
            ['Get min. harmonicity at\n(t1), (t2)', this.inquireStartTimeForMinHarmonicity(), this.inquireEndTimeForMinHarmonicity(), this.getMinHarmonicityOnTimeRange()],
            ['Get max. harmonicity at\n(t1), t2)', this.inquireStartTimeForMaxHarmonicity(), this.inquireEndTimeForMaxHarmonicity(), this.getMaxHarmonicityOnTimeRange()],
            ['Get harmonicity at\n(time)', this.inquireTimeForHarmonicity(), this.getHarmonicityAtTime()],

            ['PointProcess'],
            ['Get # of Periods\n(t1), (t2)', this.inquireStartTimeForPeriodCount(), this.inquireEndTimeForPeriodCount(), this.getPeriodCountOnTimeRange()],
            ['# of Points', this.getPointCount()],
            ['Get Jitter\n(t1), (t2)', this.inquireStartTimeForJitter(), this.inquireEndTimeForJitter(), this.getJitterOnTimeRange()],
        ];

        return (
            <Modal
                animationType='slide'
                transparent={false}
                visible={modalVisible}
                onRequestClose={() => this.setModalVisible(!modalVisible)}
            >
                <ScrollView>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Table style={{ width: APP_WIDTH - (APP_WIDTH * 0.1) }} borderStyle={{ borderWidth: 0.5, borderColor: '#c8e1ff'}}>
                            <Rows data={tableData} style={{ height: 50 }} textStyle={{ textAlign: 'center' }} />
                        </Table>
                    </View>

                    <Button
                        title='Close'
                        onPress={() => this.setModalVisible(!modalVisible)}
                    />
                </ScrollView>
            </Modal>
        );
    }

    getEnergy() {
        const { soundEnergy } = this.state;

        return (soundEnergy ? soundEnergy : <Spinner />);
    }

    getVoicedFrameCount() {
        const { voicedFrameCount } = this.state;

        return (voicedFrameCount ? voicedFrameCount : <Spinner />);
    }

    getMinFrequency() {
        const { minFrequency } = this.state;

        return (minFrequency ? minFrequency + ' Hz' : <Spinner />);
    }

    getMaxFrequency() {
        const { maxFrequency } = this.state;
        
        return (maxFrequency ? maxFrequency + ' Hz' : <Spinner />);
    }

    getMinIntensity() {
        const { minIntensity } = this.state;

        return (minIntensity ? minIntensity + ' dB' : <Spinner />);
    }

    getMaxIntensity() {
        const { maxIntensity } = this.state;

        return (maxIntensity ? maxIntensity + ' dB' : <Spinner />);
    }

    getMeanIntensity() {
        const { meanIntensity } = this.state;

        return (meanIntensity ? meanIntensity + ' dB' : <Spinner />);
    }

    getFrameCount() {
        const { frameCount } = this.state;

        return (frameCount ? frameCount : <Spinner />);
    }

    getPointCount() {
        const { pointCount } = this.state;

        return (pointCount ? pointCount + ' points' : <Spinner />);
    }

    inquireTimeForPitch() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onSubmitEditing={(event) => this.fetchPitchAt(event.nativeEvent.text)}
            />
        );
    }

    fetchPitchAt(time) {
        const valueOfTime = new Number(time).toString();
        if (valueOfTime === NAN_STRING || valueOfTime < 0) {
            Alert.alert('Please enter a value of 0 or bigger');
            return;
        }

        const { pitch } = this.state;
        const { soundName } = this.props;
        const pitchURI = BASE_URL + '/pitch/value-at-time/' + soundName + '/' + valueOfTime;

        this.setState({ fetchingPitch: true });
        axios.get(pitchURI)
            .then(response => this.setState({ fetchingPitch: false, pitch: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingPitch: false, pitch: AXIOS_ERR }));
    }

    getPitch() {
        const { fetchingPitch, pitch } = this.state;

        return (fetchingPitch ? <Spinner /> : pitch);
    }

    inquireTimeForValue() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onSubmitEditing={(event) => this.fetchValueAtTime(event.nativeEvent.text)}
            />
        );
    }

    fetchValueAtTime(time) {
        const valueOfTime = new Number(time).toString();
        if (valueOfTime === NAN_STRING || valueOfTime < 0) {
            Alert.alert('Please enter a value of 0 or bigger');
            return;
        }

        const { valueAtTime } = this.state;
        const { soundName } = this.props;
        const valueAtTimeURI = BASE_URL + '/pitch/value-at-time/' + soundName + '/' + valueOfTime;

        this.setState({ fetchingValueAtTime: true });
        axios.get(valueAtTimeURI)
            .then(response => this.setState({ fetchingValueAtTime: false, valueAtTime: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingValueAtTime: false, valueAtTime: AXIOS_ERR }));
    }

    getValueAtTime() {
        const { fetchingValueAtTime, valueAtTime } = this.state;
        
        return (fetchingValueAtTime ? <Spinner /> : valueAtTime);
    }

    inquireTimeForHarmonicity() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onSubmitEditing={(event) => this.fetchHarmonicityAtTime(event.nativeEvent.text)}
            />
        );
    }

    fetchHarmonicityAtTime(time) {
        const valueOfTime = new Number(time).toString();
        if (valueOfTime === NAN_STRING || valueOfTime < 0) {
            Alert.alert('Please enter a value of 0 or bigger');
            return;
        }

        const { harmonicityAtTime } = this.state;
        const { soundName } = this.props;
        const harmonicityAtTimeURI = BASE_URL + '/harmonicity/value-at-time/' + soundName + '/' + valueOfTime;

        this.setState({ fetchingHarmonicityAtTime: true });
        axios.get(harmonicityAtTimeURI)
            .then(response => this.setState({ fetchingHarmonicityAtTime: false, harmonicityAtTime: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingHarmonicityAtTime: false, harmonicityAtTime: AXIOS_ERR }));
    }

    getHarmonicityAtTime() {
        const { fetchingHarmonicityAtTime, harmonicityAtTime } = this.state;
        
        return (fetchingHarmonicityAtTime ? <Spinner /> : harmonicityAtTime);
    }

    inquireFrameForValue() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onSubmitEditing={(event) => this.fetchValueInFrame(event.nativeEvent.text)}
            />
        );
    }

    fetchValueInFrame(frame) {
        const valueOfFrame = new Number(frame).toString();
        if (valueOfFrame === NAN_STRING || valueOfFrame < 0) {
            Alert.alert('Please enter a value of 0 or bigger');
            return;
        }

        const { valueInFrame } = this.state;
        const { soundName } = this.props;
        const valueInFrameURI = BASE_URL + '/pitch/value-in-frame/' + soundName + '/' + valueOfFrame;

        this.setState({ fetchingValueInFrame: true });
        axios.get(valueInFrameURI)
            .then(response => this.setState({ fetchingValueInFrame: false, valueInFrame: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingValueInFrame: false, valueInFrame: AXIOS_ERR }));
    }

    getValueInFrame() {
        const { fetchingValueInFrame, valueInFrame } = this.state;
        
        return (fetchingValueInFrame ? <Spinner /> : valueInFrame);
    }

    inquireFrameForFormant() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onSubmitEditing={(event) => this.fetchFormantInFrame(event.nativeEvent.text)}
            />
        );
    }

    fetchFormantInFrame(frame) {
        const valueOfFrame = new Number(frame).toString();
        if (valueOfFrame === NAN_STRING || valueOfFrame < 0) {
            Alert.alert('Please enter a value of 0 or bigger');
            return;
        }

        const { formantInFrame } = this.state;
        const { soundName } = this.props;
        const formantInFrameURI = BASE_URL + '/formant/number-of-formants/' + soundName + '/' + valueOfFrame;

        this.setState({ fetchingFormantInFrame: true });
        axios.get(formantInFrameURI)
            .then(response => this.setState({ fetchingFormantInFrame: false, formantInFrame: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingFormantInFrame: false, formantInFrame: AXIOS_ERR }));
    }

    getFormantInFrame() {
        const { fetchingFormantInFrame, formantInFrame } = this.state;
        
        return (fetchingFormantInFrame ? <Spinner /> : formantInFrame);
    }

    inquireStartTimeForIntensity() {
        return (
            <TextInput
                onChangeText={(startTimeForIntensity) => this.setState({ startTimeForIntensity })}
                value={this.state.startTimeForIntensity}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchIntensityOnTimeRange()}
            />
        );
    }

    inquireEndTimeForIntensity() {
        return (
            <TextInput
                onChangeText={(endTimeForIntensity) => this.setState({ endTimeForIntensity })}
                value={this.state.endTimeForIntensity}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchIntensityOnTimeRange()}
            />
        );
    }

    fetchIntensityOnTimeRange() {
        const { startTimeForIntensity, endTimeForIntensity } = this.state;
        const valueOfStartTime = new Number(startTimeForIntensity).toString();
        const valueOfEndTime = new Number(endTimeForIntensity).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            Alert.alert('Please enter a start time of 0 or bigger');
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            Alert.alert('Please enter an end time of 0 or bigger');
            return;
        }

        const { soundName } = this.props;
        let intensityURI;
        if (valueOfStartTime === valueOfEndTime) {
            intensityURI = BASE_URL + '/intensity/value-at-time/' + soundName + '/' + startTimeForIntensity;
        } else {
            intensityURI = BASE_URL + '/intensity/get-mean/' + soundName + '/' + startTimeForIntensity + '/' + endTimeForIntensity;
        }

        this.setState({ fetchingIntensityOnTimeRange: true });
        axios.get(intensityURI)
            .then(response => this.setState({ fetchingIntensityOnTimeRange: false, intensityOnTimeRange: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingIntensityOnTimeRange: false, intensityOnTimeRange: AXIOS_ERR }));
    }

    getIntensityOnTimeRange() {
        const { fetchingIntensityOnTimeRange, intensityOnTimeRange } = this.state;
        
        return (fetchingIntensityOnTimeRange ? <Spinner /> : intensityOnTimeRange);
    }

    inquireStartTimeForMinHarmonicity() {
        return (
            <TextInput
                onChangeText={(startTimeForMinHarmonicity) => this.setState({ startTimeForMinHarmonicity })}
                value={this.state.startTimeForMinHarmonicity}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchMinHarmonicityOnTimeRange()}
            />
        );
    }

    inquireEndTimeForMinHarmonicity() {
        return (
            <TextInput
                onChangeText={(endTimeForMinHarmonicity) => this.setState({ endTimeForMinHarmonicity })}
                value={this.state.endTimeForMinHarmonicity}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchMinHarmonicityOnTimeRange()}
            />
        );
    }

    fetchMinHarmonicityOnTimeRange() {
        const { startTimeForMinHarmonicity, endTimeForMinHarmonicity } = this.state;
        const valueOfStartTime = new Number(startTimeForMinHarmonicity).toString();
        const valueOfEndTime = new Number(endTimeForMinHarmonicity).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            Alert.alert('Please enter a start time of 0 or bigger');
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            Alert.alert('Please enter an end time of 0 or bigger');
            return;
        }

        const { soundName } = this.props;
        const harmonicityURI = BASE_URL + '/harmonicity/get-min/' + soundName + '/' + valueOfStartTime + '/' + valueOfEndTime;

        this.setState({ fetchingMinHarmonicityOnTimeRange: true });
        axios.get(harmonicityURI)
            .then(response => this.setState({ fetchingMinHarmonicityOnTimeRange: false, minHarmonicityOnTimeRange: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingMinHarmonicityOnTimeRange: false, minHarmonicityOnTimeRange: AXIOS_ERR }));
    }

    getMinHarmonicityOnTimeRange() {
        const { fetchingMinHarmonicityOnTimeRange, minHarmonicityOnTimeRange } = this.state;
        
        return (fetchingMinHarmonicityOnTimeRange ? <Spinner /> : minHarmonicityOnTimeRange);
    }

    inquireStartTimeForMaxHarmonicity() {
        return (
            <TextInput
                onChangeText={(startTimeForMaxHarmonicity) => this.setState({ startTimeForMaxHarmonicity })}
                value={this.state.startTimeForMaxHarmonicity}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchMaxHarmonicityOnTimeRange()}
            />
        );
    }

    inquireEndTimeForMaxHarmonicity() {
        return (
            <TextInput
                onChangeText={(endTimeForMaxHarmonicity) => this.setState({ endTimeForMaxHarmonicity })}
                value={this.state.endTimeForMaxHarmonicity}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchMaxHarmonicityOnTimeRange()}
            />
        );
    }

    fetchMaxHarmonicityOnTimeRange() {
        const { startTimeForMaxHarmonicity, endTimeForMaxHarmonicity } = this.state;
        const valueOfStartTime = new Number(startTimeForMaxHarmonicity).toString();
        const valueOfEndTime = new Number(endTimeForMaxHarmonicity).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            Alert.alert('Please enter a start time of 0 or bigger');
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            Alert.alert('Please enter an end time of 0 or bigger');
            return;
        }

        const { soundName } = this.props;
        const harmonicityURI = BASE_URL + '/harmonicity/get-max/' + soundName + '/' + valueOfStartTime + '/' + valueOfEndTime;

        this.setState({ fetchingMaxHarmonicityOnTimeRange: true });
        axios.get(harmonicityURI)
            .then(response => this.setState({ fetchingMaxHarmonicityOnTimeRange: false, maxHarmonicityOnTimeRange: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingMaxHarmonicityOnTimeRange: false, maxHarmonicityOnTimeRange: AXIOS_ERR }));
    }

    getMaxHarmonicityOnTimeRange() {
        const { fetchingMaxHarmonicityOnTimeRange, maxHarmonicityOnTimeRange } = this.state;
        
        return (fetchingMaxHarmonicityOnTimeRange ? <Spinner /> : maxHarmonicityOnTimeRange);
    }

    inquireStartTimeForPeriodCount() {
        return (
            <TextInput
                onChangeText={(startTimeForPeriodCount) => this.setState({ startTimeForPeriodCount })}
                value={this.state.startTimeForPeriodCount}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchPeriodCountOnTimeRange()}
            />
        );
    }

    inquireEndTimeForPeriodCount() {
        return (
            <TextInput
                onChangeText={(endTimeForPeriodCount) => this.setState({ endTimeForPeriodCount })}
                value={this.state.endTimeForPeriodCount}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchPeriodCountOnTimeRange()}
            />
        );
    }

    fetchPeriodCountOnTimeRange() {
        const { startTimeForPeriodCount, endTimeForPeriodCount } = this.state;
        const valueOfStartTime = new Number(startTimeForPeriodCount).toString();
        const valueOfEndTime = new Number(endTimeForPeriodCount).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            Alert.alert('Please enter a start time of 0 or bigger');
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            Alert.alert('Please enter an end time of 0 or bigger');
            return;
        }

        const { soundName } = this.props;
        const periodCountURI = BASE_URL + '/pointprocess/number-of-periods/' + soundName + '/' + valueOfStartTime + '/' + valueOfEndTime;

        this.setState({ fetchingPeriodCountOnTimeRange: true });
        axios.get(periodCountURI)
            .then(response => this.setState({ fetchingPeriodCountOnTimeRange: false, periodCountOnTimeRange: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingPeriodCountOnTimeRange: false, periodCountOnTimeRange: AXIOS_ERR }));
    }

    getPeriodCountOnTimeRange() {
        const { fetchingPeriodCountOnTimeRange, periodCountOnTimeRange } = this.state;
        
        return (fetchingPeriodCountOnTimeRange ? <Spinner /> : periodCountOnTimeRange);
    }

    inquireStartTimeForJitter() {
        return (
            <TextInput
                onChangeText={(startTimeForJitter) => this.setState({ startTimeForJitter })}
                value={this.state.startTimeForJitter}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchJitterOnTimeRange()}
            />
        );
    }

    inquireEndTimeForJitter() {
        return (
            <TextInput
                onChangeText={(endTimeForJitter) => this.setState({ endTimeForJitter })}
                value={this.state.endTimeForJitter}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchJitterOnTimeRange()}
            />
        );
    }

    fetchJitterOnTimeRange() {
        const { startTimeForJitter, endTimeForJitter } = this.state;
        const valueOfStartTime = new Number(startTimeForJitter).toString();
        const valueOfEndTime = new Number(endTimeForJitter).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            Alert.alert('Please enter a start time of 0 or bigger');
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            Alert.alert('Please enter an end time of 0 or bigger');
            return;
        }

        const { soundName } = this.props;
        const jitterURI = BASE_URL + '/pointprocess/get-jitter/' + soundName + '/' + valueOfStartTime + '/' + valueOfEndTime;

        this.setState({ fetchingJitterOnTimeRange: true });
        axios.get(jitterURI)
            .then(response => this.setState({ fetchingJitterOnTimeRange: false, jitterOnTimeRange: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingJitterOnTimeRange: false, jitterOnTimeRange: AXIOS_ERR }));
    }

    getJitterOnTimeRange() {
        const { fetchingJitterOnTimeRange, jitterOnTimeRange } = this.state;
        
        return (fetchingJitterOnTimeRange ? <Spinner /> : jitterOnTimeRange);
    }

    inquireFormantForFormantValue() {
        return (
            <TextInput
                onChangeText={(formantForValue) => this.setState({ formantForValue })}
                value={this.state.formantForValue}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchValueAtFormantAndTime()}
            />
        );
    }

    inquireTimeForFormantValue() {
        return (
            <TextInput
                onChangeText={(timeForValue) => this.setState({ timeForValue })}
                value={this.state.timeForValue}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchValueAtFormantAndTime()}
            />
        );
    }

    fetchValueAtFormantAndTime() {
        const { formantForValue, timeForValue } = this.state;
        const valueOfFormant = new Number(formantForValue).toString();
        const valueOfTime = new Number(timeForValue).toString();
        if (valueOfFormant === NAN_STRING || valueOfFormant < 0) {
            Alert.alert('Please enter a formant of 0 or bigger');
            return;
        }
        if (valueOfTime === NAN_STRING || valueOfTime < 0) {
            Alert.alert('Please enter an end time of 0 or bigger');
            return;
        }

        const { soundName } = this.props;
        const valueURI = BASE_URL + '/formant/value-at-time/' + soundName + '/' + valueOfFormant + '/' + valueOfTime;

        this.setState({ fetchingValueAtFormantAndTime: true });
        axios.get(valueURI)
            .then(response => this.setState({ fetchingValueAtFormantAndTime: false, valueAtFormantAndTime: response.data === 0 ? new Number(0) : response.data }))
            .catch(error => this.setState({ fetchingValueAtFormantAndTime: false, valueAtFormantAndTime: AXIOS_ERR }));
    }

    getValueAtFormantAndTime() {
        const { fetchingValueAtFormantAndTime, valueAtFormantAndTime } = this.state;
        
        return (fetchingValueAtFormantAndTime ? <Spinner /> : valueAtFormantAndTime);
    }

    renderShowModalButton() {
        const { modalVisible } = this.state;

        return (
            <Button
                title='More Details'
                onPress={() => this.setModalVisible(!modalVisible)}
            />
        );
    }

    setModalVisible(visible) {
        this.setState({ modalVisible: visible });
    }

    renderPlayButton() {
        const { isPlaying } = this.state;
        
        return (
            <TouchableOpacity
                onPress={() => this.onPlayPausePressed()}
            >
                <Icon 
                    reverse
                    name={isPlaying ? 'pause' : 'play'}
                    type='font-awesome'
                />
            </TouchableOpacity>
        );
    }

    onPlayPausePressed() {
        const { isPlaying, soundObj } = this.state;

        if (isPlaying) {
            soundObj.pauseAsync();
        } else {
            soundObj.playAsync();
        }
    }
}

const styles = {
    containerStyle: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    playbackSliderStyle: {
        alignSelf: 'stretch'
    },
    soundImageStyle: {
        width: APP_WIDTH,
        height: APP_HEIGHT / 2
    }
};

export default PlaySound;
