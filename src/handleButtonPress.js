const {Gpio} = require('onoff'); 
const {spawn} = require('child_process');

let arecord;

async function startVoiceRecording(bot) {
    if (bot.context.appConfigs.isRecordingVoiceMsg) {
        console.warn('It seems arecord is already running. Avoiding starting it again.');
        return;
    }
    bot.context.appConfigs.isRecordingVoiceMsg = true;

    const opusencStdoutArray = [];
    const {audioInputDev, chatID} = bot.context.appConfigs;
    
    arecord = spawn('arecord', [ '-N', '--quiet', '-D', audioInputDev, '-f', 'CD']);
    const opusenc = spawn('opusenc', [ '--quiet', '-', '-']);
    arecord.stdout.pipe(opusenc.stdin);
    opusenc.stdout.on('data', (data) => opusencStdoutArray.push(data));
    opusenc.on('exit', async () => {
        try {
            const voiceBuffer = Buffer.concat(opusencStdoutArray);
            bot.context.appConfigs.isRecordingVoiceMsg = false;
            await bot.telegram.sendVoice(chatID, {source: voiceBuffer});
            console.info('Voice message sent.');
        } catch (error) {
            console.error(error);
            bot.context.appConfigs.isRecordingVoiceMsg = false;
        }
    });
}

function stopVoiceRecording(bot) {
    if (bot.context.appConfigs.isRecordingVoiceMsg) {
        arecord.kill();
    } else {
        console.warn('It seems arecord is not running. Avoiding stopping it again.');
    }
}

function handleButtonPress(bot) {
    const {gpioButton} = bot.context.appConfigs;
    const pushButton = new Gpio(gpioButton, 'in', 'both', {debounceTimeout: 50});

    pushButton.watch((err, value) => {
        if (err) { 
            console.error('There was an error:', err); 
            return;
        } else {
            if (value === 1) {
                console.info('Button pressed. Starting voice record.');
                startVoiceRecording(bot);
            } else if (value === 0) {
                console.info('Button released. Stopping voice record.');
                stopVoiceRecording(bot);
            }
        }
    });

    function unexportOnClose() {
        pushButton.unexport(); 
    };
    
    process.on('SIGINT', unexportOnClose);
    process.on('SIGTERM', unexportOnClose); 
}

module.exports = {handleButtonPress};
