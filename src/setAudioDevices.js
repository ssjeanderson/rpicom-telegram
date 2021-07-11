const {spawnSync} = require('child_process');

function detectDevice(pattern, deviceType) {

    if (pattern === undefined) {
        console.warn(`Environment var pattern for ${deviceType} device not provided. Selecting "default" device.`);
        return 'default';
    }

    let childOutputData = '';
    let audioDevice = '';

    if (deviceType === 'input') {
        childOutputData = spawnSync('arecord', ['-l']).stdout;
    } else {
        childOutputData = spawnSync('aplay', ['-l']).stdout;
    }

    const dataArray = childOutputData.toString().split('\n');
    const lineMatch = dataArray.find(element => element.includes(pattern));
    
    if (lineMatch === undefined) {
        console.warn(`Could not find any device description with pattern: "${pattern}". Selecting "default" as ${deviceType} device.`);
        audioDevice = 'default';
    } else {
        const cardNumber = lineMatch.match(/card [0-9]:/)[0].match(/\d+/)[0];
        const deviceNumber = lineMatch.match(/device [0-9]:/)[0].match(/\d+/)[0];
        audioDevice = `plughw:${cardNumber},${deviceNumber}`;
    }

    return audioDevice;
};

function setAudioDevices(ctx) {

    let audioOutputDev = process.env.AUDIO_OUTPUT_DEV;
    let audioInputDev = process.env.AUDIO_INPUT_DEV;
    const audioOutputDevPattern = process.env.AUDIO_OUTPUT_DEV_PATTERN;
    const audioInputDevPattern = process.env.AUDIO_INPUT_DEV_PATTERN;

    if (audioInputDev === undefined) {
        audioInputDev = 'default';
    } else if (audioInputDev === 'pattern') {
        audioInputDev = detectDevice(audioInputDevPattern, 'input');
    }

    if (audioOutputDev === undefined) {
        audioOutputDev = 'default';
    } else if (audioOutputDev === 'pattern') {
        audioOutputDev = detectDevice(audioOutputDevPattern, 'output');
    }

    ctx.appConfigs.audioInputDev = audioInputDev;
    ctx.appConfigs.audioOutputDev = audioOutputDev;
    
};
    
module.exports = {setAudioDevices};
