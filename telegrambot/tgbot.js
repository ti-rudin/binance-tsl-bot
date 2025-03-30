const redis = require("redis");
const TelegramBot = require('node-telegram-bot-api');

const redisUrl = "//redis:6379";
const redisPassword = "YzRAdGgkF25g";

const subscriber = redis.createClient(redisUrl);
subscriber.auth(redisPassword);

const client = redis.createClient(redisUrl);
client.auth(redisPassword);

const getRedisValue = (key) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, reply) => {
      if (err) reject(err);
      resolve(reply);
    });
  });
};

const initBot = async () => {
  try {
    const tgkey = await getRedisValue('global_settings:telegram_api_key');
    if (!tgkey) {
      throw new TypeError('BOT_TOKEN must be provided!');
    }

    const chatid = await getRedisValue('global_settings:telegram_chat_id');
    if (!chatid) {
      throw new TypeError('CHAT_ID must be provided!');
    }

    const bot = new TelegramBot(tgkey, { polling: true });

    const send = (tgpost) => {
      bot.sendMessage(chatid, tgpost);
    };

    subscriber.on("message", (channel, message) => {
      try {
        const msgg = JSON.parse(message);
        console.log(msgg);
        send(msgg.tgmsg);
      } catch (err) {
        console.error(err);
      }


    });

    subscriber.subscribe("tgpost");
    bot.onText(/\/gs/, async (msg) => {

      try {
        const autoStartValue = await getRedisValue('global_settings:auto_start');
        send(`Auto Start Value: ${autoStartValue}`);
      } catch (error) {
        send('Error retrieving the auto start value.');
        console.error(error);
      }
    });
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (err) {
    console.error(err);
  }
};



initBot();
