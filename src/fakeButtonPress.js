
const {spawn} = require('child_process');

let arecord;

async function startVoiceRecording(bot) {
    if (bot.context.appConfigs.isRecordingVoiceMsg) {
        console.warn('It seems arecord is already running. Avoiding spawning it again.');
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

function fakeButtonPress(bot) {

    const readline = require('readline');
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            process.exit();
        } else {
            if (str === 'a') {
                console.log('Fake Button PRESSED. Starting voice recording.');
                startVoiceRecording(bot);
            } else if (str === 's') {
                console.log('Fake Button RELEASED. Stoping voice recording.');
                stopVoiceRecording(bot);
            }
        }
    });
}

module.exports = {fakeButtonPress};
