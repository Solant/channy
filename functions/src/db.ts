import { Firestore, FirestoreDataConverter } from '@google-cloud/firestore';
import config from './config';

const firestore = new Firestore({
    projectId: config('PROJECT_ID'),
    timestampsInSnapshots: true,
});

const suffix = config('IS_LOCAL') ? '_dev' : '';

export interface Media {
    id: string,
    type: 'photo' | 'animation' | 'video',
}

export interface User {
    first_name: string,
    id: number,
    is_bot: boolean,
    last_name?: string,
    username?: string,
}

interface Suggestion {
    text: string,
    files: Media[],
    user: User,
    date: Date,
}

const suggestionConverter: FirestoreDataConverter<Suggestion> = {
    toFirestore(modelObject: Suggestion): FirebaseFirestore.DocumentData {
        return modelObject;
    },
    fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): Suggestion {
        return snapshot.data() as Suggestion;
    },
}

export function suggestion() {
    return firestore
        .collection(`suggestions${suffix}`)
        .withConverter(suggestionConverter);
}

export interface Post {
    text: string,
    files: Media[],
    user: User,
    reactions: string[],
    reactionsMap: { [key: string]: number },
    date: Date,
    messageId?: number,
    suggestionId: string,
}

const postConverter: FirestoreDataConverter<Post> = {
    toFirestore(modelObject: Post): FirebaseFirestore.DocumentData {
        return modelObject;
    },
    fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): Post {
        return snapshot.data() as Post;
    },
}

export function post() {
    return firestore
        .collection(`posts${suffix}`)
        .withConverter(postConverter);
}

interface Like {
    user: User,
    messageId: number,
    value: string,
    date: Date,
}

const likeConverter: FirestoreDataConverter<Like> = {
    toFirestore(modelObject: Like): FirebaseFirestore.DocumentData {
        return modelObject;
    },
    fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): Like {
        return snapshot.data() as Like;
    },
}

export function like() {
    return firestore
        .collection(`likes${suffix}`)
        .withConverter(likeConverter);
}
