import { Telegram } from 'telegraf';
import { FieldValue } from "@google-cloud/firestore";

import config from './config';
import { like, post, Post, suggestion, User } from './db';
import { sendMediaMessage } from './utils';
import { forPost } from './user';

export class PostService {
    private readonly tg: Telegram;

    constructor(tg: Telegram) {
        this.tg = tg;
    }

    async publish(id: string) {
        const unpublishedPost = await post().doc(id).get();
        if (!unpublishedPost.exists) {
            console.error(`Post ${id} was not found`);
        }
        const postData = unpublishedPost.data()!;

        let text = postData.text;

        if (postData.user.id.toString() !== config('ADMIN_CHAT_ID')) {
            text += `\n[отправил ${forPost(postData.user)} через ${config('BOT_CHAT_ID')}]`;
        }

        const msg = await sendMediaMessage(this.tg, {
            chatId: config('PUBLIC_CHAT_ID'),
            text,
            file: postData.files[0],
            buttons: this.getPostButtons(postData),
        });

        await post().doc(unpublishedPost.id).set({ messageId: msg.message_id }, { merge: true });
    }

    async publishSuggestion(suggestionId: string, options?: { reactions: string[] }) {
        const s = await suggestion()
            .doc(suggestionId)
            .get();
        const suggestionData = s.data()!;

        const reactionValues = options?.reactions || ['😂', '👌', '🤔', '\uD83D\uDE12'];

        const p = await post().add({
            text: suggestionData.text,
            date: new Date(),
            files: suggestionData.files,
            user: suggestionData.user,
            suggestionId: suggestionId,
            reactions: reactionValues,
            reactionsMap: reactionValues.reduce((acc, cur) => {
                // @ts-ignore
                acc[cur] = 0;
                return acc;
            }, {}),
        });

        await this.publish(p.id);
    }

    async like(value: string, messageId: number, user: User) {
        const previousLike = await like()
            .where('messageId', '==', messageId)
            .where('user.id', '==', user.id)
            .limit(1)
            .get();

        const likedPost = await post()
            .where('messageId', '==', messageId)
            .limit(1)
            .get();

        if (previousLike.docs.length === 0) {
            // create like
            await Promise.all([
                like().add({
                    value,
                    messageId,
                    user,
                    date: new Date(),
                }),
                post()
                    .doc(likedPost.docs[0].id)
                    .update({ [`reactionsMap.${value}`]: FieldValue.increment(1) }),
            ])
        } else if (previousLike.docs[0].data().value === value) {
            // do nothing
            return;
        } else {
            // change like
            const oldValue = previousLike.docs[0].data().value;
            const newValue = value;

            await Promise.all([
                like().doc(previousLike.docs[0].id).set({ value: newValue }, { merge: true }),
                post().doc(likedPost.docs[0].id).update({
                    [`reactionsMap.${newValue}`]: FieldValue.increment(1),
                    [`reactionsMap.${oldValue}`]: FieldValue.increment(-1),
                }),
            ]);
        }

        try {
            await this.updateCounter(likedPost.docs[0].id);
        } catch (e) {
            console.error(e);
        }
    }

    private async updateCounter(id: string) {
        const postData = (await post().doc(id).get()).data()!;

        await this.tg.editMessageReplyMarkup(
            config('PUBLIC_CHAT_ID'),
            postData.messageId,
            undefined,
            JSON.stringify({ inline_keyboard: this.getPostButtons(postData) }),
        );
    }

    private getPostButtons(p: Post): Array<Array<{ text: string, callback_data: string }>> {
        return [p.reactions.map(r => ({
            text: `${r} ${p.reactionsMap[r]}`,
            callback_data: `like_${r}`,
        }))];
    }
}
