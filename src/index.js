const {Telegraf} = require('telegraf')
const {setAudioDevices} = require('./setAudioDevices');
const {filterChat} = require('./filterChat');
const {handleVoiceMsg} = require('./handleVoiceMsg');
const dotenv = require('dotenv');
dotenv.config();

const chatID = process.env.CHAT_ID;
const botToken = process.env.BOT_TOKEN;
const gpioButton = process.env.GPIO_BUTTON;
const mockButton = process.env.MOCK_BUTTON;

if (botToken === undefined) {
    throw new Error('BOT_TOKEN env must be provided!');
}

if (gpioButton === undefined && mockButton !== "true") {
    throw new Error('GPIO_BUTTON env must be provided!');
}

// Instanciates telegram bot
const bot = new Telegraf(botToken);

// Extends the bot context to store App configs
bot.context.appConfigs = {};
bot.context.appConfigs.chatID = chatID;
bot.context.appConfigs.gpioButton = gpioButton;
bot.context.appConfigs.isPlayingVoiceMsg = false;
bot.context.appConfigs.isRecordingVoiceMsg = false;
setAudioDevices(bot.context);
const audioInputDev = bot.context.appConfigs.audioInputDev;
const audioOutputDev = bot.context.appConfigs.audioOutputDev;

// Listen and handle message events
bot.use(filterChat);
bot.on('voice', handleVoiceMsg);
bot.command(['start', 'help'], (ctx) => ctx.reply('Welcome. Send me a voice message.'));

bot.launch();

// Mocks button pressing if env var is true
if (mockButton) {
    const {fakeButtonPress} = require('./fakeButtonPress');
    fakeButtonPress(bot);
    console.info('Started in Mock Button mode. Press \'a\' key to start voice recording and \'s\' key to stop.' );
} else {
    const {handleButtonPress} = require('./handleButtonPress');
    handleButtonPress(bot);
}

// Notify user that app is running
if (chatID === undefined || chatID === '') {
    console.warn('App started with CHAT_ID undefined or empty. Will refuse all messages.');
} else {
    bot.telegram.sendMessage(chatID, 'rpicom-telegram is running.');
    console.info(`Starting Bot App. Chat ID: ${chatID}. Audio input device: ${audioInputDev}. Audio output device: ${audioOutputDev}`);
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
