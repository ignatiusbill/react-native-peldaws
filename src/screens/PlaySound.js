import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Slider, Image, Dimensions, ScrollView, Modal, Button, TextInput, Alert, TouchableWithoutFeedback, Clipboard, ToastAndroid } from 'react-native';
import { Icon, CheckBox, normalize } from 'react-native-elements';
import axios from 'axios';
import { Table, Row } from 'react-native-table-component';
import Spinner from '../components/Spinner';
import { BASE_URL } from '../url';

/* START OF GLOBAL VARIABLES */

// Don't modify these dynamically! You can modify this manually, especially the numbers (int/double/float), as long as you know what you're doing.
const WINDOW = Dimensions.get('window');
const APP_HEIGHT = WINDOW.height;
const APP_WIDTH = WINDOW.width;
const AXIOS_ERR = 'Fetch failed';
const LOADING_STRING = 'Loading';
const NAN_STRING = 'NaN';
const GO_STRING = 'Go';
const NUMBER_OF_SECTIONS = 18;
const DECIMAL_PLACE = 6;

/* END OF GLOBAL VARIABLES */

class PlaySound extends Component {
    constructor(props) {
        super(props);
        this.isSeeking = false;
        this.state = {
            /* START OF STATES FOR SOUND OBJECT */

            fetchingSoundObj: true,
            soundObj: null,
            isPlaying: false,
            playbackInstancePosition: null,
            playbackInstanceDuration: null,

            /* END OF STATES FOR SOUND OBJECT */

            /* START OF STATES FOR TIME PICKER BUTTONS */

            pickingT1: false,
            t1: null,
            pickingT2: false,
            t2: null,

            /* END OF STATES FOR TIME PICKER BUTTONS */

            /* START OF STATES FOR SOUND DETAILS (GROUPED BY FUNCTIONALITY) */
            
            soundDetailModalVisible: false,
            filterModalVisible: false,

            // Sound
            soundEnergy: null,

            // Pitch
            timePitchInput: null,
            fetchingPitch: false,
            pitch: this.renderGetPitchButton(),
            
            voicedFrameCount: null,
            
            timeValueInput: null,
            fetchingValueAtTime: false,
            valueAtTime: this.renderGetValueAtTimeButton(),

            frameValueInput: null,
            fetchingValueInFrame: false,
            valueInFrame: this.renderGetValueInFrameButton(),

            // Spectrum
            minFrequency: null,
            maxFrequency: null,

            // Intensity
            startTimeForIntensity: null,
            endTimeForIntensity: null,
            fetchingIntensityOnTimeRange: false,
            intensityOnTimeRange: this.renderGetIntensityOnTimeRangeButton(),

            minIntensity: null,
            maxIntensity: null,

            meanIntensity: null,

            // Formant
            frameCount: null,

            frameFormantInput: null,
            fetchingFormantInFrame: false,
            formantInFrame: this.renderGetFormantInFrameButton(),

            formantForValue: null,
            timeForValue: null,
            fetchingValueAtFormantAndTime: false,
            valueAtFormantAndTime: this.renderGetValueAtFormantAndTimeButton(),            

            // Harmonicity
            startTimeForMinHarmonicity: null,
            endTimeForMinHarmonicity: null,
            fetchingMinHarmonicityOnTimeRange: false,
            minHarmonicityOnTimeRange: this.renderGetMinHarmonicityOnTimeRangeButton(),

            startTimeForMaxHarmonicity: null,
            endTimeForMaxHarmonicity: null,
            fetchingMaxHarmonicityOnTimeRange: false,
            maxHarmonicityOnTimeRange: this.renderGetMaxHarmonicityOnTimeRangeButton(),

            timeHarmonicityInput: null,
            fetchingHarmonicityAtTime: false,
            harmonicityAtTime: this.renderGetHarmonicityAtTimeButton(),

            // PointProcess
            startTimeForPeriodCount: null,
            endTimeForPeriodCount: null,
            fetchingPeriodCountOnTimeRange: false,
            periodCountOnTimeRange: this.renderGetPeriodCountOnTimeRangeButton(),

            pointCount: null,

            startTimeForJitter: null,
            endTimeForJitter: null,
            fetchingJitterOnTimeRange: false,
            jitterOnTimeRange: this.renderGetJitterOnTimeRangeButton(),

            /* END OF STATES FOR SOUND DETAILS (GROUPED BY FUNCTIONALITY) */
            
            // rowVisibilityArrays' content has a tight coupling with data inside the function renderModal().
            // Be careful when modifying one or the other.
            rowVisibilityArrays: {
                sound: { rowVisibilityArray: [true] },
                pitch: { rowVisibilityArray: [true, true, true, true] },
                spectrum: { rowVisibilityArray: [true] },
                intensity: { rowVisibilityArray: [true, true, true] },
                formant: { rowVisibilityArray: [true, true, true] },
                harmonicity: { rowVisibilityArray: [true, true, true] },
                pointProcess: { rowVisibilityArray: [true, true, true] },
                count: NUMBER_OF_SECTIONS
            }
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
        this.setState({ fetchingSoundObj: false, soundObj });
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
        const { fetchingSoundObj, soundObj, soundDetailModalVisible, pickingT1, pickingT2 } = this.state;
        const { playbackSliderStyle, containerStyle, normalSoundPlaybackContainerStyle, darkSoundPlaybackContainerStyle } = styles;
        
        if (fetchingSoundObj) return <Spinner />;

        if (soundObj) {
            return (
                <View style={pickingT1 || pickingT2 ? darkSoundPlaybackContainerStyle : normalSoundPlaybackContainerStyle}>
                    <Text style={{ fontSize: 18, padding: 3 }}>Currently playing: {soundName}</Text>

                    {this.renderSoundImage()}

                    {this.renderTimePickerButtons()}

                    {this.renderPickedStartAndEndTime()}

                    <Slider 
                        style={playbackSliderStyle} 
                        value={this.getSeekSliderPosition()}
                        onValueChange={this.onSeekSliderValueChange}
                        onSlidingComplete={this.onSeekSliderSlidingComplete}
                        disabled={pickingT1 || pickingT2}
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

    handlePress(event) {
        const { pickingT1, pickingT2, playbackInstanceDuration } = this.state;

        const locationX = event.nativeEvent.locationX;
        const startOfGraph = 0.104 * APP_WIDTH; // approximately
        const endOfGraph = 0.9825 * APP_WIDTH; // approximately
        const widthOfGraph = endOfGraph - startOfGraph;

        if (locationX > startOfGraph && locationX < endOfGraph) {
            const audioDurationInSeconds = playbackInstanceDuration / 1000;
            const timeInSeconds = (locationX - startOfGraph) / widthOfGraph* audioDurationInSeconds;
            if (pickingT1) {
                this.setState({ t1: timeInSeconds, pickingT1: !pickingT1 });
            } else if (pickingT2) {
                this.setState({ t2: timeInSeconds, pickingT2: !pickingT2 });
            }
        }
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
            <TouchableWithoutFeedback onPress={event => this.handlePress(event)}>
                <Image
                    style={soundImageStyle}
                    resizeMode='stretch'
                    source={{ uri: soundImageURI }}
                />
            </TouchableWithoutFeedback>
        );
    }

    renderTimePickerButtons() {
        const { pickingT1, pickingT2 } = this.state;

        /*

        00 - t1 is false, t2 is false => if one of them is pressed, 00 -> 01 or 10
        when current state is 01, it can only go back to 00. It can't go from 01 to 11.
        Same thing with 10.

        */

        handleStartTimePress = (time) => {
            if ((!pickingT1 && !pickingT2) || time) {
                this.setState({ pickingT1: !time });
            }
        }

        handleEndTimePress = (time) => {
            if ((!pickingT1 && !pickingT2) || time) {
                this.setState({ pickingT2: !time });
            }
        }

        return (
            <View style={styles.timePickerContainerStyle}>
                <Button 
                    title={'Pick Start Time (T1)'}
                    onPress={() => handleStartTimePress(pickingT1)}
                    disabled={pickingT2}
                    style={{ alignSelf: 'center' }}
                />
                
                <Button 
                    title={'Pick End Time (T2)'}
                    onPress={() => handleEndTimePress(pickingT2)}
                    disabled={pickingT1}
                    style={{ alignSelf: 'center' }}
                />
            </View>
        );
    }

    renderPickedStartAndEndTime() {
        const { t1, t2 } = this.state;

        return (
            <View style={styles.timePickerContainerStyle}>
                <Text>T1: {t1 ? t1.toFixed(DECIMAL_PLACE) : 'null'}</Text>
                <Text>T2: {t2 ? t2.toFixed(DECIMAL_PLACE) : 'null'}</Text>
            </View>
        );
    }

    renderModal() {
        // data's content has a tight coupling with rowVisibilityArrays inside this component's state.
        // Be careful when modifying one or the other.
        const data = {
            sound: {
                tableHead: ['Sound'],
                tableData: [
                    ['Energy', this.getEnergy()],
                ],
                tableDescription: [
                    'Energy'
                ]
            },
            pitch: {
                tableHead: ['Pitch'],
                tableData: [
                    ['Get pitch at\n(time)', this.inquireTimeForPitch(), this.getPitch()],
                    ['# of Voiced Frames', this.getVoicedFrameCount()],
                    ['Get value at\n(time)', this.inquireTimeForValue(), this.getValueAtTime()],
                    ['Get value in\n(frame)', this.inquireFrameForValue(), this.getValueInFrame()],
                ],
                tableDescription: [
                    'Pitch at time X',
                    '# of Voiced Frames',
                    'Value at time X',
                    'Value in frame X'
                ]
            },
            spectrum: {
                tableHead: ['Spectrum'],
                tableData: [
                    ['Min./Max. Frequency', this.getMinAndMaxFrequency()],
                ],
                tableDescription: [
                    'Min./Max. Frequency'
                ]
            },
            intensity: {
                tableHead: ['Intensity'],
                tableData: [
                    ['Get avg. of intensity at\n(t1), (t2)', this.inquireStartTimeForIntensity(), this.inquireEndTimeForIntensity(), this.getIntensityOnTimeRange()],
                    ['Min./Max. Intensity', this.getMinAndMaxIntensity()],
                    ['Average of Intensity', this.getMeanIntensity()],
                ],
                tableDescription: [
                    'Average of Intensity between time X and Y',
                    'Min./Max. Intensity',
                    'Average of Intensity'
                ]
            },
            formant: {
                tableHead: ['Formant'],
                tableData: [
                    ['# of Frames', this.getFrameCount()],
                    ['Get # of Formants at\n(frame)', this.inquireFrameForFormant(), this.getFormantInFrame()],
                    ['Get formant value at\n(formant), (t)', this.inquireFormantForFormantValue(), this.inquireTimeForFormantValue(), this.getValueAtFormantAndTime()],
                ],
                tableDescription: [
                    '# of Frames',
                    '# of Formants at frame X',
                    'Formant value at formant X'
                ]
            },
            harmonicity: {
                tableHead: ['Harmonicity'],
                tableData: [
                    ['Get min. harmonicity at\n(t1), (t2)', this.inquireStartTimeForMinHarmonicity(), this.inquireEndTimeForMinHarmonicity(), this.getMinHarmonicityOnTimeRange()],
                    ['Get max. harmonicity at\n(t1), t2)', this.inquireStartTimeForMaxHarmonicity(), this.inquireEndTimeForMaxHarmonicity(), this.getMaxHarmonicityOnTimeRange()],
                    ['Get harmonicity at\n(time)', this.inquireTimeForHarmonicity(), this.getHarmonicityAtTime()],
                ],
                tableDescription: [
                    'Min. harmonicity between time X and Y',
                    'Max. harmonicity between time X and Y',
                    'Harmonicity at time X'
                ]
            },
            pointProcess: {
                tableHead: ['PointProcess'],
                tableData: [
                    ['Get # of Periods\n(t1), (t2)', this.inquireStartTimeForPeriodCount(), this.inquireEndTimeForPeriodCount(), this.getPeriodCountOnTimeRange()],
                    ['# of Points', this.getPointCount()],
                    ['Get Jitter\n(t1), (t2)', this.inquireStartTimeForJitter(), this.inquireEndTimeForJitter(), this.getJitterOnTimeRange()],
                ],
                tableDescription: [
                    '# of Periods between time X and Y',
                    '# of Points',
                    'Jitter between time X and Y'
                ]
            },
        };

        const { containerStyle, tableStyle, soundDetailCheckBoxesContainerStyle, tableBorderStyle, tableHeadStyle, tableHeadTextStyle, tableBodyStyle, tableBodyTextStyle } = styles;
        
        renderSoundDetailCheckBoxes = (data, rowVisibilityArrays) => {
            let buffer = [];
            for (let key in data) {
                const currentObj = rowVisibilityArrays[key];
                if (currentObj.hasOwnProperty('rowVisibilityArray')) {
                    buffer.push(
                        <Table style={tableStyle} borderStyle={tableBorderStyle}>
                            <Row data={data[key].tableHead} style={tableHeadStyle} textStyle={tableHeadTextStyle} />
                        </Table>
                    );

                    const currentRowVisibilityArray = rowVisibilityArrays[key].rowVisibilityArray;
                    for (let i = 0; i < currentRowVisibilityArray.length; i++) {
                        buffer.push(
                            <CheckBox
                                title={data[key].tableDescription[i]}
                                checked={rowVisibilityArrays[key].rowVisibilityArray[i]}
                                onPress={() => {
                                    let newState = rowVisibilityArrays;
                                    newState[key].rowVisibilityArray[i] = !newState[key].rowVisibilityArray[i];

                                    if (!newState[key].rowVisibilityArray[i]) {
                                        newState.count--;
                                    } else {
                                        newState.count++;
                                    }

                                    this.setState({ rowVisibilityArrays: newState });
                                }}
                                containerStyle={soundDetailCheckBoxesContainerStyle}
                            />
                        );
                    }
                }
                
            }

            return buffer;
        }

        setAllSectionsVisible = (booleanValue, rowVisibilityArrays) => {
            let newState = rowVisibilityArrays;
            if (booleanValue){
                newState.count = NUMBER_OF_SECTIONS;
            } else {
                newState.count = 0;
            }
            
            for (let key in data) {
                const currentObj = rowVisibilityArrays[key];
                if (currentObj.hasOwnProperty('rowVisibilityArray')) {
                    const currentRowVisibilityArray = rowVisibilityArrays[key].rowVisibilityArray;
                    for (let i = 0; i < currentRowVisibilityArray.length; i++) {
                        currentRowVisibilityArray[i] = booleanValue
                    }
                }
            }

            this.setState({ rowVisibilityArrays: newState });
        }

        // Pushes rows that are checked by user in the filter function into a buffer array. O(n) runtime, O(n) space.
        renderSoundDetails = (data, rowVisibilityArrays) => {
            let buffer = [];
            for (let key in data) {
                const currentObj = rowVisibilityArrays[key];
                if (currentObj.hasOwnProperty('rowVisibilityArray')) {
                    const currentRowVisibilityArray = rowVisibilityArrays[key].rowVisibilityArray;
                    let tableHeadAdded = false;
                    for (let i = 0; i < currentRowVisibilityArray.length; i++) {
                        if (currentRowVisibilityArray[i]) {
                            if (!tableHeadAdded) {
                                buffer.push(<Row data={data[key].tableHead} style={tableHeadStyle} textStyle={tableHeadTextStyle} />);
                                tableHeadAdded = true;
                            }
                            
                            buffer.push(<Row data={data[key].tableData[i]} style={tableBodyStyle} textStyle={tableBodyTextStyle} />);
                        }
                    }
                }
            }

            return buffer;
        }
        
        const { soundDetailModalVisible, filterModalVisible, rowVisibilityArrays } = this.state;

        return (
            <Modal
                animationType='slide'
                transparent={false}
                visible={soundDetailModalVisible}
                onRequestClose={() => this.setSoundDetailModalVisible(!soundDetailModalVisible)}
            >
                <View>
                    <ScrollView>
                        {/* START OF FILTER FUNCTION */}
                        <Button 
                            title='Filter'
                            onPress={() => this.setFilterModalVisible(!filterModalVisible)}
                        />
                        
                        <Modal
                            animationType='slide'
                            transparent={false}
                            visible={filterModalVisible}
                            onRequestClose={() => this.setFilterModalVisible(!filterModalVisible)}
                        >
                            <ScrollView>
                                <View style={[{ flex: 1, flexDirection: 'row', alignSelf: 'center' }, soundDetailCheckBoxesContainerStyle]}>
                                    <CheckBox
                                        title={'Select All'}
                                        checked={rowVisibilityArrays.count === NUMBER_OF_SECTIONS}
                                        onPress={() => setAllSectionsVisible(true, rowVisibilityArrays)}
                                        containerStyle={{ flex: 1 }}
                                    />

                                    <CheckBox
                                        title={'Unselect All'}
                                        checked={rowVisibilityArrays.count === 0}
                                        onPress={() => setAllSectionsVisible(false, rowVisibilityArrays)}
                                        containerStyle={{ flex: 1 }}
                                    />
                                </View>

                                <View style={containerStyle}>
                                    {renderSoundDetailCheckBoxes(data, rowVisibilityArrays)}
                                </View>

                                <Button 
                                    title='Show Selected Items'
                                    onPress={() => {
                                        this.setFilterModalVisible(!filterModalVisible);
                                        this.forceUpdate();
                                    }}
                                />
                            </ScrollView>
                        </Modal>
                        {/* END OF FILTER FUNCTION */}

                        {this.renderCopyT1AndT2ValueButtons()}
                        
                        <View style={containerStyle}>
                            <Table style={tableStyle} borderStyle={tableBorderStyle}>
                                {renderSoundDetails(data, rowVisibilityArrays)}
                            </Table>
                        </View>

                        <Button
                            title='Close'
                            onPress={() => this.setSoundDetailModalVisible(!soundDetailModalVisible)}
                        />
                    </ScrollView>
                </View>
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

    getMinAndMaxFrequency() {
        const { minFrequency, maxFrequency } = this.state;

        return ( minFrequency && maxFrequency ? minFrequency + ' Hz/' + maxFrequency + ' Hz' : <Spinner />);
    }

    getMinAndMaxIntensity() {
        const { minIntensity, maxIntensity } = this.state;
        
        return ( minIntensity && maxIntensity ? minIntensity + ' dB/' + maxIntensity + ' dB' : <Spinner />);
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

    renderGetPitchButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchPitchAt(this.state.timePitchInput)} />;
    }

    inquireTimeForPitch() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onChangeText={(timePitchInput) => this.setState({ timePitchInput })}
                onSubmitEditing={(event) => this.fetchPitchAt(event.nativeEvent.text)}
                onFocus={() => this.setState({ pitch: this.renderGetPitchButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    showErrorMessageForSingleTimeParam() {
        Alert.alert('Please enter a value of 0 or bigger');
    }

    fetchPitchAt(time) {
        const valueOfTime = new Number(time).toString();
        if (valueOfTime === NAN_STRING || valueOfTime < 0) {
            this.showErrorMessageForSingleTimeParam();
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

    renderGetValueAtTimeButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchValueAtTime(this.state.timeValueInput)} />;
    }

    inquireTimeForValue() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onChangeText={(timeValueInput) => this.setState({ timeValueInput })}
                onSubmitEditing={(event) => this.fetchValueAtTime(event.nativeEvent.text)}
                onFocus={() => this.setState({ valueAtTime: this.renderGetValueAtTimeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    fetchValueAtTime(time) {
        const valueOfTime = new Number(time).toString();
        if (valueOfTime === NAN_STRING || valueOfTime < 0) {
            this.showErrorMessageForSingleTimeParam();
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

    renderGetHarmonicityAtTimeButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchHarmonicityAtTime(this.state.timeHarmonicityInput)} />;
    }

    inquireTimeForHarmonicity() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onChangeText={(timeHarmonicityInput) => this.setState({ timeHarmonicityInput })}
                onSubmitEditing={(event) => this.fetchHarmonicityAtTime(event.nativeEvent.text)}
                onFocus={() => this.setState({ harmonicityAtTime: this.renderGetHarmonicityAtTimeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    fetchHarmonicityAtTime(time) {
        const valueOfTime = new Number(time).toString();
        if (valueOfTime === NAN_STRING || valueOfTime < 0) {
            this.showErrorMessageForSingleTimeParam();
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

    renderGetValueInFrameButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchValueInFrame(this.state.frameValueInput)} />;
    }

    inquireFrameForValue() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onChangeText={(frameValueInput) => this.setState({ frameValueInput })}
                onSubmitEditing={(event) => this.fetchValueInFrame(event.nativeEvent.text)}
                onFocus={() => this.setState({ valueInFrame: this.renderGetValueInFrameButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    fetchValueInFrame(frame) {
        const valueOfFrame = new Number(frame).toString();
        if (valueOfFrame === NAN_STRING || valueOfFrame < 0) {
            this.showErrorMessageForSingleTimeParam();
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

    renderGetFormantInFrameButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchFormantInFrame(this.state.frameFormantInput)} />;
    }

    inquireFrameForFormant() {
        return (
            <TextInput
                keyboardType={'numeric'}
                onChangeText={(frameFormantInput) => this.setState({ frameFormantInput })}
                onSubmitEditing={(event) => this.fetchFormantInFrame(event.nativeEvent.text)}
                onFocus={() => this.setState({ formantInFrame: this.renderGetFormantInFrameButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    fetchFormantInFrame(frame) {
        const valueOfFrame = new Number(frame).toString();
        if (valueOfFrame === NAN_STRING || valueOfFrame < 0) {
            this.showErrorMessageForSingleTimeParam();
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

    renderGetIntensityOnTimeRangeButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchIntensityOnTimeRange()} />;
    }

    inquireStartTimeForIntensity() {
        return (
            <TextInput
                onChangeText={(startTimeForIntensity) => this.setState({ startTimeForIntensity })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchIntensityOnTimeRange()}
                onFocus={() => this.setState({ intensityOnTimeRange: this.renderGetIntensityOnTimeRangeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    inquireEndTimeForIntensity() {
        return (
            <TextInput
                onChangeText={(endTimeForIntensity) => this.setState({ endTimeForIntensity })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchIntensityOnTimeRange()}
                onFocus={() => this.setState({
                    intensityOnTimeRange: <Button title={GO_STRING} onPress={() => this.fetchIntensityOnTimeRange()} />
                })}
                style={styles.textInputStyle}
            />
        );
    }

    showErrorMessageForStartTimeParam() {
        Alert.alert('Please enter a start time of 0 or bigger');
    }

    showErrorMessageForEndTimeParam() {
        Alert.alert('Please enter an end time of 0 or bigger');
    }

    fetchIntensityOnTimeRange() {
        const { startTimeForIntensity, endTimeForIntensity } = this.state;
        const valueOfStartTime = new Number(startTimeForIntensity).toString();
        const valueOfEndTime = new Number(endTimeForIntensity).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            this.showErrorMessageForStartTimeParam();
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            this.showErrorMessageForEndTimeParam();
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

    renderGetMinHarmonicityOnTimeRangeButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchMinHarmonicityOnTimeRange()} />;
    }

    inquireStartTimeForMinHarmonicity() {
        return (
            <TextInput
                onChangeText={(startTimeForMinHarmonicity) => this.setState({ startTimeForMinHarmonicity })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchMinHarmonicityOnTimeRange()}
                onFocus={() => this.setState({ minHarmonicityOnTimeRange: this.renderGetMinHarmonicityOnTimeRangeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    inquireEndTimeForMinHarmonicity() {
        return (
            <TextInput
                onChangeText={(endTimeForMinHarmonicity) => this.setState({ endTimeForMinHarmonicity })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchMinHarmonicityOnTimeRange()}
                onFocus={() => this.setState({ minHarmonicityOnTimeRange: this.renderGetMinHarmonicityOnTimeRangeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    fetchMinHarmonicityOnTimeRange() {
        const { startTimeForMinHarmonicity, endTimeForMinHarmonicity } = this.state;
        const valueOfStartTime = new Number(startTimeForMinHarmonicity).toString();
        const valueOfEndTime = new Number(endTimeForMinHarmonicity).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            this.showErrorMessageForStartTimeParam();
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            this.showErrorMessageForEndTimeParam();
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

    renderGetMaxHarmonicityOnTimeRangeButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchMaxHarmonicityOnTimeRange()} />;
    }

    inquireStartTimeForMaxHarmonicity() {
        return (
            <TextInput
                onChangeText={(startTimeForMaxHarmonicity) => this.setState({ startTimeForMaxHarmonicity })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchMaxHarmonicityOnTimeRange()}
                onFocus={() => this.setState({ maxHarmonicityOnTimeRange: this.renderGetMaxHarmonicityOnTimeRangeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    inquireEndTimeForMaxHarmonicity() {
        return (
            <TextInput
                onChangeText={(endTimeForMaxHarmonicity) => this.setState({ endTimeForMaxHarmonicity })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchMaxHarmonicityOnTimeRange()}
                onFocus={() => this.setState({ maxHarmonicityOnTimeRange: this.renderGetMaxHarmonicityOnTimeRangeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    fetchMaxHarmonicityOnTimeRange() {
        const { startTimeForMaxHarmonicity, endTimeForMaxHarmonicity } = this.state;
        const valueOfStartTime = new Number(startTimeForMaxHarmonicity).toString();
        const valueOfEndTime = new Number(endTimeForMaxHarmonicity).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            this.showErrorMessageForStartTimeParam();
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            this.showErrorMessageForEndTimeParam();
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

    renderGetPeriodCountOnTimeRangeButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchPeriodCountOnTimeRange()} />;
    }

    inquireStartTimeForPeriodCount() {
        return (
            <TextInput
                onChangeText={(startTimeForPeriodCount) => this.setState({ startTimeForPeriodCount })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchPeriodCountOnTimeRange()}
                onFocus={() => this.setState({ periodCountOnTimeRange: this.renderGetPeriodCountOnTimeRangeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    inquireEndTimeForPeriodCount() {
        return (
            <TextInput
                onChangeText={(endTimeForPeriodCount) => this.setState({ endTimeForPeriodCount })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchPeriodCountOnTimeRange()}
                onFocus={() => this.setState({ periodCountOnTimeRange: this.renderGetPeriodCountOnTimeRangeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    fetchPeriodCountOnTimeRange() {
        const { startTimeForPeriodCount, endTimeForPeriodCount } = this.state;
        const valueOfStartTime = new Number(startTimeForPeriodCount).toString();
        const valueOfEndTime = new Number(endTimeForPeriodCount).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            this.showErrorMessageForStartTimeParam();
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            this.showErrorMessageForEndTimeParam();
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

    renderGetJitterOnTimeRangeButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchJitterOnTimeRange()} />;
    }

    inquireStartTimeForJitter() {
        return (
            <TextInput
                onChangeText={(startTimeForJitter) => this.setState({ startTimeForJitter })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchJitterOnTimeRange()}
                onFocus={() => this.setState({ jitterOnTimeRange: this.renderGetJitterOnTimeRangeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    inquireEndTimeForJitter() {
        return (
            <TextInput
                onChangeText={(endTimeForJitter) => this.setState({ endTimeForJitter })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchJitterOnTimeRange()}
                onFocus={() => this.setState({ jitterOnTimeRange: this.renderGetJitterOnTimeRangeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    fetchJitterOnTimeRange() {
        const { startTimeForJitter, endTimeForJitter } = this.state;
        const valueOfStartTime = new Number(startTimeForJitter).toString();
        const valueOfEndTime = new Number(endTimeForJitter).toString();
        if (valueOfStartTime === NAN_STRING || valueOfStartTime < 0) {
            this.showErrorMessageForStartTimeParam();
            return;
        }
        if (valueOfEndTime === NAN_STRING || valueOfEndTime < 0) {
            this.showErrorMessageForEndTimeParam();
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

    renderGetValueAtFormantAndTimeButton() {
        return <Button title={GO_STRING} onPress={() => this.fetchValueAtFormantAndTime()} />;
    }

    inquireFormantForFormantValue() {
        return (
            <TextInput
                onChangeText={(formantForValue) => this.setState({ formantForValue })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchValueAtFormantAndTime()}
                onFocus={() => this.setState({ valueAtFormantAndTime: this.renderGetValueAtFormantAndTimeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    inquireTimeForFormantValue() {
        return (
            <TextInput
                onChangeText={(timeForValue) => this.setState({ timeForValue })}
                keyboardType={'numeric'}
                onSubmitEditing={() => this.fetchValueAtFormantAndTime()}
                onFocus={() => this.setState({ valueAtFormantAndTime: this.renderGetValueAtFormantAndTimeButton() })}
                style={styles.textInputStyle}
            />
        );
    }

    showErrorMessageForSingleFormantParam() {
        Alert.alert('Please enter a formant of 0 or bigger');
    }

    fetchValueAtFormantAndTime() {
        const { formantForValue, timeForValue } = this.state;
        const valueOfFormant = new Number(formantForValue).toString();
        const valueOfTime = new Number(timeForValue).toString();
        if (valueOfFormant === NAN_STRING || valueOfFormant < 0) {
            this.showErrorMessageForSingleFormantParam();
            return;
        }
        if (valueOfTime === NAN_STRING || valueOfTime < 0) {
            this.showErrorMessageForEndTimeParam();
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
        const { soundDetailModalVisible, pickingT1, pickingT2 } = this.state;

        return (
            <Button
                title='More Details'
                onPress={() => this.setSoundDetailModalVisible(!soundDetailModalVisible)}
                style={{ padding: 3 }}
                disabled={pickingT1 || pickingT2}
            />
        );
    }

    showCopiedToClipboardToast(strToBeCopied) {
        if (strToBeCopied) {
            ToastAndroid.show('Copied to clipboard!', ToastAndroid.SHORT);
        } else {
            ToastAndroid.show('You copied null.', ToastAndroid.SHORT);
        }
    }

    copyNumberToClipboard(n) {
        Clipboard.setString(n ? n.toFixed(DECIMAL_PLACE) + '' : ' ');
    }

    renderCopyT1AndT2ValueButtons() {
        const { t1, t2 } = this.state;

        return (
            <View style={styles.timePickerContainerStyle}>
                <Button 
                    title={"Copy T1's value"}
                    onPress={() => {
                        this.copyNumberToClipboard(t1);
                        this.showCopiedToClipboardToast(t1);
                    }}
                />
                <Button 
                    title={"Copy T2's value"}
                    onPress={() => {
                        this.copyNumberToClipboard(t2);
                        this.showCopiedToClipboardToast(t2);
                    }}
                />
            </View>
        );
    }

    setSoundDetailModalVisible(visible) {
        this.setState({ soundDetailModalVisible: visible });
    }

    setFilterModalVisible(visible) {
        this.setState({ filterModalVisible: visible });
    }

    renderPlayButton() {
        const { isPlaying, pickingT1, pickingT2 } = this.state;
        
        return (
            <TouchableOpacity
                onPress={() => this.onPlayPausePressed()}
                disabled={pickingT1 || pickingT2}
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
    normalSoundPlaybackContainerStyle: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    darkSoundPlaybackContainerStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'darkgrey'
    },
    playbackSliderStyle: {
        alignSelf: 'stretch',
        padding: 5
    },
    soundImageStyle: {
        width: APP_WIDTH,
        height: APP_HEIGHT / 2,
        padding: 3
    },
    timePickerContainerStyle: { 
        flex: 1, 
        flexDirection: 'row', 
        alignSelf: 'stretch', 
        justifyContent: 'space-around', 
        padding: 5 
    },
    soundDetailCheckBoxesContainerStyle: {
        width: 0.9 * APP_WIDTH
    },
    tableStyle: {
        width: 0.9 * APP_WIDTH
    },
    tableBorderStyle: {
        borderWidth: 0.5, borderColor: '#c8e1ff'
    },
    tableHeadStyle: {
        backgroundColor: '#f1f8ff',
        height: 50
    },
    tableHeadTextStyle: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold'
    },
    tableBodyStyle: {
        height: 60,
        alignSelf: 'center'
    },
    tableBodyTextStyle: {
        textAlign: 'center'
    },
    textInputStyle: {
        textAlign: 'center'
    }
};

export default PlaySound;
