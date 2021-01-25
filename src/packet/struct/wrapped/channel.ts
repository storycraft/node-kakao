/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChannelMetaMap, NormalChannelInfo } from "../../../channel/channel-info";
import { OpenChannelInfo } from "../../../openlink/open-channel-info";
import { ChannelInfoStruct, NormalChannelInfoExtra, OpenChannelInfoExtra } from "../channel";
import { WrappedChatlog } from "./chat";

/**
 * Wrap ChannelInfoStruct and implement NormalChannelInfo
 */
export class WrappedChannelInfo implements NormalChannelInfo {

    constructor(private _struct: ChannelInfoStruct & NormalChannelInfoExtra) {

    }

    get channelId() {
        return this._struct.chatId;
    }

    get type() {
        return this._struct.type;
    }

    get activeUserCount() {
        return this._struct.activeMembersCount;
    }

    get displayUserList() {
        return this._struct.displayMembers.map(
            userStruct => {
                return {
                    userId: userStruct.userId,
                    nickname: userStruct.nickName,
                    countryIso: userStruct.countryIso,
                    profileURL: userStruct.profileImageUrl
                };
            }
        );
    }

    get metaMap() {
        const map: ChannelMetaMap = {};

        this._struct.chatMetas.forEach(meta => map[meta.type] = { ...meta });

        return map;
    }

    get newChatCount() {
        return this._struct.newMessageCount;
    }

    get newChatCountInvalid() {
        return this._struct.invalidNewMessageCount;
    }

    get lastChatLogId() {
        return this._struct.lastLogId;
    }
    
    get lastSeenLogId() {
        return this._struct.lastSeenLogId;
    }
    
    get lastChatLog() {
        if (this._struct.lastChatLog) return new WrappedChatlog(this._struct.lastChatLog);
    }
    
    get pushAlert() {
        return this._struct.pushAlert;
    }

    get joinTime() {
        return this._struct.joinedAtForNewMem * 1000;
    }

}

export class WrappedOpenChannelInfo implements OpenChannelInfo {

    constructor(private _struct: ChannelInfoStruct & OpenChannelInfoExtra) {

    }

    get channelId() {
        return this._struct.chatId;
    }

    get openToken() {
        return this._struct.otk;
    }

    get linkId() {
        return this._struct.li;
    }

    get type() {
        return this._struct.type;
    }

    get activeUserCount() {
        return this._struct.activeMembersCount;
    }

    get displayUserList() {
        return this._struct.displayMembers.map(
            userStruct => {
                return {
                    userId: userStruct.userId,
                    nickname: userStruct.nickName,
                    countryIso: userStruct.countryIso || '',
                    profileURL: userStruct.profileImageUrl
                };
            }
        );
    }

    get metaMap() {
        const map: ChannelMetaMap = {};

        this._struct.chatMetas.forEach(meta => map[meta.type] = { ...meta });

        return map;
    }

    get newChatCount() {
        return this._struct.newMessageCount;
    }

    get newChatCountInvalid() {
        return this._struct.invalidNewMessageCount;
    }

    get lastChatLogId() {
        return this._struct.lastLogId;
    }
    
    get lastSeenLogId() {
        return this._struct.lastSeenLogId;
    }
    
    get lastChatLog() {
        if (this._struct.lastChatLog) return new WrappedChatlog(this._struct.lastChatLog);
    }
    
    get pushAlert() {
        return this._struct.pushAlert;
    }

    get directChannel() {
        return this._struct.directChat;
    }

    get o() {
        return this._struct.o;
    }

}