import { Telegraf } from 'telegraf';
import { GoogleGenAI } from '@google/genai';
import http from 'http';
import fs from 'fs';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Port ' + PORT + ' is open');
});

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

let guideData = {};
try {
    const rawData = fs.readFileSync('./data.json', 'utf8');
    guideData = JSON.parse(rawData);
    console.log('Database loaded successfully!');
} catch (error) {
    console.error('Error reading data.json:', error);
}

bot.on('text', async (ctx) => {
  try {
    await ctx.sendChatAction('typing');
    
    const userText = ctx.message.text.toLowerCase().trim();
    let foundInGuide = false;

    for (const key in guideData) {
        const cleanKey = key.toLowerCase().replace(/(гостиниц|отел|магазин|аптек|кафе|супермаркет)\w*/g, '').trim();
        const keyVariants = cleanKey.split('|');
      const isMatch = keyVariants.some(variant => userText.includes(variant.trim()));
      if (isMatch) {
        foundInGuide = true;
            
            if (guideData[key].image_url) {
                await ctx.replyWithPhoto(guideData[key].image_url);
            }
            
            await ctx.reply("📍 " + key.split('|')[0] + "\n\nАдрес: " + guideData[key].address);
            break; 
        }
    }

    if (!foundInGuide) {
        const promptText = "Ты — полезный ассистент. Отвечай кратко. Вопрос: " + ctx.message.text;
        
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash", 
          contents: promptText,
        });

        await ctx.reply(response.text);
    }

  } catch (error) {
    console.error('Error:', error);
    await ctx.reply('Упс, произошла ошибка при обработке вашего сообщения.');
  }
});

bot.launch().then(() => {
  console.log('Bot started successfully!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
