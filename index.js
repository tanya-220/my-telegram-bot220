import { Telegraf } from 'telegraf';
import { GoogleGenAI } from '@google/genai';
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
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
bot.on('text', async (ctx) => {
  try {
    await ctx.sendChatAction('typing');
    
    // Новый синтаксис вызова Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", // Если будет ошибка, поменяем на "gemini-flash-latest"
      contents: ctx.message.text,
    });

    // Отправляем ответ пользователю
    await ctx.reply(response.text);
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
