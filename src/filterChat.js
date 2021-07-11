async function filterChat(ctx, next) {

    // Checks if its a normal message (not a group member status)
    if (ctx.message) {
        const messageChatID = ctx.message.chat.id.toString();
        const {chatID: allowedChatID} = ctx.appConfigs;

        if (messageChatID === allowedChatID) {
            await next();
        } else {
            ctx.reply('Chat ID not allowed: ' + messageChatID);
            console.warn('Chat ID not allowed: ' + messageChatID);
        }
    // Handles group member status messages
    } else if (ctx.update.my_chat_member.new_chat_member.status) {
        const memberStatus = ctx.update.my_chat_member.new_chat_member.status;
        const chatTitle = ctx.update.my_chat_member.chat.title;
        if (memberStatus === 'member') {
            console.info(`Bot added to '${chatTitle}' group.`)
        } else if (memberStatus === 'left') {
            console.info(`Bot removed from '${chatTitle}' group.`)
        }
    }
}

module.exports = {filterChat};
