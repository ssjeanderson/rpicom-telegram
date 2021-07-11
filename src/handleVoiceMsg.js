
const {spawn, spawnSync} = require('child_process');
const fetch = require('node-fetch');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function playVoiceMsg(responseData, audioOutputDev) {
	return new Promise((resolve, reject) => {
		// Spawns opusdec and aplay to pipe stream: fetch > opusdec > aplay
		const opusdec = spawn('opusdec', ['--quiet', '--force-wav', '-', '-']);
		const aplay = spawn('aplay', ['--quiet', '-D', audioOutputDev]);
		responseData.pipe(opusdec.stdin);
		opusdec.stdout.pipe(aplay.stdin);

		aplay.on('exit', code => {
			if (code === 0) {
				resolve();
			} else {
				reject(Error(aplay.stderr.read()));
			}
		});

		// handle pipe error when occurs before aplay exit event
		aplay.stdin.on('error', err => console.error(err.message));
	});
}

async function handleVoiceMsg(ctx) {
	try {
		// Prevents messages to be played simultaneous
		while (ctx.appConfigs.isPlayingVoiceMsg) {
			await sleep(1000);
		}
		ctx.appConfigs.isPlayingVoiceMsg = true;

		const {audioOutputDev} = ctx.appConfigs;
		const userID = ctx.update.message.from.id;
		const userFirstName = ctx.update.message.from.first_name;
		const fileID = ctx.update.message.voice.file_id;
		
		// Downloads voice to stream
		const { href: audioUrl } = await ctx.telegram.getFileLink(fileID);
		const { body: responseData } = await fetch(audioUrl);

		// Notify user for audio message status
		var { message_id: replyID } = await ctx.reply('🔊 Playing voice message', { reply_to_message_id: ctx.update.message.message_id });
		console.info(`Playing audio from ${userFirstName}(${userID})`);

		// Beeps for incoming voice message
		const aplayChild = spawnSync('aplay', ['--quiet', '-D', audioOutputDev, 'media/incoming-voice.wav']);
		if (aplayChild.status !== 0) throw Error(aplayChild.stderr);

		// Spawns opusdec and aplay to pipe stream: fetch > opusdec > aplay
		await playVoiceMsg(responseData, audioOutputDev);

		ctx.telegram.editMessageText(ctx.chat.id, replyID, undefined, '✅ Voice message played');
		ctx.appConfigs.isPlayingVoiceMsg = false;

	} catch (err) {
		console.error(err)
		if (replyID) {
			ctx.telegram.editMessageText(ctx.chat.id, replyID, undefined, '⚠️ Message not played due to errors');
		} else {
			ctx.reply('⚠️ Message not played due to errors', { reply_to_message_id: ctx.update.message.message_id });
		}
		ctx.appConfigs.isPlayingVoiceMsg = false;
	}
}

module.exports = {handleVoiceMsg}
