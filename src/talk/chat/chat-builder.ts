/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatContent, MentionContentList, ChatMention } from "./attachment/chat-attachment";
import { JsonUtil } from "../../util/json-util";

export namespace ChatBuilder {
    export type BuiltMessage = {
        'text': string,
        'extra': any
    };

    export function buildMessage(...textFormat: (string | ChatContent)[]): BuiltMessage {
        let text = '';

        if (textFormat.length < 1) {
            throw new Error('Text is empty');
        }

        let mentionPrefix = '@';
        let mentionMap: Map<string, MentionContentList> = new Map();

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

                        let mentionContentList = mentionMap.get(mentionContent.User.UserId.toString());
                        let nickname = mentionContent.User.UserInfo.Nickname || 'unknown';

                        if (!mentionContentList) {
                            mentionContentList = new MentionContentList(mentionContent.User.UserId, nickname.length);

                            mentionMap.set(mentionContent.User.UserId.toString(), mentionContentList);
                        }

                        mentionContentList.IndexList.push(mentionCount++);

                        text += `${mentionPrefix}${nickname}`;
                        break;
                    }

                    default: throw new Error(`Unknownt ChatContent ${fragment} at format index:${i}`);
                }

            } else {
                throw new Error(`Unknown type ${typeof(fragment)} at format index:${i}`);
            }
        }

        if (text === '') {
            throw new Error('Text is empty');
        }

        let extra: any = {};

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