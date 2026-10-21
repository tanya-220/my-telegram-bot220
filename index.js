import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import http from 'http';

// Создаем сервер-заглушку, чтобы Render видел порт
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Port ${PORT} is open`);
});

// Подключаем ключи из Render
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-lite" });

bot.on('text', async (ctx) => {
  try {
    await ctx.sendChatAction('typing');
    
    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    const text = response.text();

    await ctx.reply(text);
  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('Упс, произошла ошибка при обработке вашего сообщения.');
  }
});

bot.launch().then(() => {
  console.log('Бот успешно запущен!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
