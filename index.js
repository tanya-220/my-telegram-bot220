import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';
import http from 'http';

// Создаем простой сервер, чтобы Render видел открытый порт
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(Port ${PORT} is open);
});
// Берем ключи из переменных окружения Render
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Выбираем модель (gemini-1.5-flash работает быстро и бесплатно)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

bot.on('text', async (ctx) => {
  try {
    // Отправляем статус "печатает..."
    await ctx.sendChatAction('typing');
    
    // Получаем ответ от Gemini
    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    const text = response.text();

    // Отправляем ответ пользователю
    await ctx.reply(text);
  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('Упс, произошла ошибка при обработке вашего сообщения.');
  }
});

// Запускаем бота
bot.launch().then(() => {
  console.log('Бот успешно запущен!');
});

// Обработка остановки
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
