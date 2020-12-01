import Telegraf from 'telegraf';
import { IncomingMessage } from 'telegraf/typings/telegram-types';
import { Media, suggestion } from './db';
import { sendMediaMessage } from './utils';
import { PostService } from './PostService';
import config from './config';
import { forSuggestion } from './user';

function getFileId(message: IncomingMessage): Media | undefined {
    if (message.photo?.length) {
        return  { id: message.photo[0].file_id, type: 'photo' };
    }

    if (message.animation) {
        return { id: message.animation.file_id, type: 'animation' };
    }

    if (message.video) {
        return { id: message.video.file_id, type: 'video' };
    }

    return undefined;
}

export default function () {
    const bot = new Telegraf(config('TOKEN'));

    const postService = new PostService(bot.telegram);

    bot.command('ping', ctx => ctx.reply('pong'));

    bot.command('help', ctx => ctx.reply('Отправляй картинку, видео, ссылку или просто текст и админ оценит'));

    bot.on('message', async (ctx) => {
        if (ctx.message) {
            if (ctx.message.media_group_id) {
                return ctx.reply('Я слегка прихуел с того как Павел сделал отправку нескольких файлов в одном сообщении, поэтому пока такая функция не поддерживается');
            }

            const file = getFileId(ctx.message);
            const text = ctx.message.caption || ctx.message.text || '';

            const suggestionData = {
                text,
                files: file ? [file] : [],
                user: ctx.message.from!,
                date: new Date(),
            };
            const res = await suggestion().add(suggestionData);

            if (ctx.chat?.id.toString() === config('ADMIN_CHAT_ID')) {
                await postService.publishSuggestion(res.id);
            } else {
                await sendMediaMessage(bot.telegram, {
                    chatId: config('ADMIN_CHAT_ID'),
                    file: suggestionData.files[0],
                    text: `Предложка от ${forSuggestion(suggestionData.user)}\n${suggestionData.text}`,
                    buttons: [[{ text: 'Опубликовать', callback_data: `publish_${res.id}` }]]
                });
            }
        }
        return ctx.reply('Отправлено в предложку');
    });

    bot.on('callback_query', async ctx => {
        if (ctx.callbackQuery!.data?.startsWith('publish')) {
            const id = ctx.callbackQuery?.data?.split('_')[1] || '';
            await Promise.all([
                ctx.editMessageReplyMarkup({ inline_keyboard: [[{ text: 'Опубликовано', callback_data: '11' }]] }),
                postService.publishSuggestion(id),
            ]);
            return ctx.answerCbQuery('Опубликовано');
        }

        if (ctx.callbackQuery!.data?.startsWith('like')) {
            const value = ctx.callbackQuery?.data?.split('_')[1]!;
            const messageId = ctx.callbackQuery?.message?.message_id;
            const user = ctx.callbackQuery?.from;

            if (value && messageId && user) {
                await postService.like(value, messageId, user);
            }

            return ctx.answerCbQuery('liked');
        }

        return ctx.answerCbQuery('placeholder');
    });

    return bot;
}