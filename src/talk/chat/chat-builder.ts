/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatContent, MentionContentList, ChatMention } from "./attachment/chat-attachment";

export namespace ChatBuilder {
    export type BuiltMessage = {
        'text': string,
        'extra': any
    };

    export function buildMessage(...textFormat: (string | ChatContent)[]): BuiltMessage {
        let text = '';

        let mentionPrefix = '@';
        let mentionMap: Map<string, MentionContentList> = new Map();

        let extra: any = {};

        let mentionCount = 1;
        let len = textFormat.length;
        for (let i = 0; i < len; i++) { // TODO: Better format parsing
            let fragment = textFormat[i];

            let type = typeof(fragment);

            if (type === 'string') {
                text += fragment;
            } else if (type === 'object') {
                let content = fragment as ChatContent;
                switch (content.ContentType) {

                    case 'mention': {
                        let mentionContent = content as ChatMention;

                        let mentionContentList = mentionMap.get(mentionContent.Info.Id.toString());
                        let nickname = mentionContent.Info.Nickname || 'unknown';

                        if (!mentionContentList) {
                            mentionContentList = new MentionContentList(mentionContent.Info.Id, nickname.length);

                            mentionMap.set(mentionContent.Info.Id.toString(), mentionContentList);
                        }

                        mentionContentList.IndexList.push(mentionCount++);

                        text += `${mentionPrefix}${nickname}`;
                        break;
                    }

                    default: throw new Error(`Unknown ChatContent ${fragment} at format index:${i}`);
                }

            } else {
                throw new Error(`Unknown type ${typeof(fragment)} at format index:${i}`);
            }
        }

        let mentionMapValues = mentionMap.values();
        let mentions: any[] = [];
        for (let mentionList of mentionMapValues) {
            mentions.push(mentionList.toRawContent());
        }

        if (mentions.length > 0) {
            extra['mentions'] = mentions;
        }

        return {
            'text': text,
            'extra': extra
        }
    }

}