import { Telegram } from 'telegraf';
import { Media } from './db';

export async function sendMediaMessage(tg: Telegram, opts: { chatId: number | string, file: Media | undefined, text: string, buttons: any[][] }) {
    const { chatId, file, text, buttons } = opts;
    const extra = {
        caption: text,
        reply_markup: {
            inline_keyboard: buttons,
        },
    };

    let msg;
    switch (file?.type) {
        case 'photo':
            msg = await tg.sendPhoto(chatId, file.id, extra);
            break;
        case 'video':
            msg = await tg.sendVideo(chatId, file.id, extra);
            break;
        case 'animation':
            msg = await tg.sendAnimation(chatId, file.id, extra);
            break;
        default:
            msg = await tg.sendMessage(chatId, extra.caption, extra);
    }

    return msg;
}
