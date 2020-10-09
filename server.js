const config = require('./config.json');
const Database = require('./Database');
const db = new Database(config.database.path);
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.telegram.token);
bot.setWebHook(`${config.app.url}/bot${config.telegram.token}`);
const app = express();

app.use(express.json());

app.post(`/bot${config.telegram.token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/v1/*', (req, res) => {
    const channelId = req.params[0].replace(/[^\w+]/g, '');
    const msg = req.query.msg;
    // db.raw.get(subscribes).filter({token: channelId}).value() 
    console.log(`${channelId}: ${msg}`);
})

app.listen(config.app.port, () => {
    console.log(`Express server is listening on ${config.app.port}`);
})

let isTokenWaiting = false;

function channelSubscribe(channelId, chatId) {
    if (db.isRecordExists('channels', channelId)) {
        if (db.isAlredySubscribed(chatId, channelId)) {
            return 'Вы уже подписаны на этот канал';
        } else {
            db.addSubscribe(channelId, chatId)
            return `Вы подписались на канал <i>${channelId}</i>`;
        }
    }
    else {
        return `Канала <i>${channelId}</i> не существует`;   
    }
}

bot.onText(/\/newchannel/, (msg, match) => {
    const chatId = msg.chat.id;
    const newChannelId = db.createNewChannel();
    const link = `${config.app.url}/${newChannelId}`;
    const message = `Cоздан новый канал, теперь вы можете:
        - отправлять сообщения на <a href="${link}">API</a>
        - подписаться на <i>${newChannelId}</> и получать уведомления`;
    bot.sendMessage(chatId, message, { parse_mode : 'HTML'});
});

bot.onText(/\/subscribe ?(.+)?/, (msg, match) => {
    const chatId = msg.chat.id;
    if (match[1] === undefined) {
        isTokenWaiting = true;
        bot.sendMessage(chatId, 'Введите <i>токен</i> канала', {parse_mode : 'HTML'});
    }
    else {
        const channelId = match[1].replace(/[^\w+]/g, '');
        bot.sendMessage(chatId, channelSubscribe(channelId, chatId), {parse_mode : 'HTML'}); 
    }
});

bot.on('message', (msg) => {

    if (isTokenWaiting) {
        const chatId = msg.chat.id;
        const channelId = msg.text.replace(/[^\w+]/g, '');
        bot.sendMessage(chatId, channelSubscribe(channelId, chatId), {parse_mode : 'HTML'});    
        isTokenWaiting = false;
    }
})