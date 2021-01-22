/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { ChannelMetaMap, NormalChannelInfo, OpenChannelInfo } from "../../channel/channel-info";
import { Chatlog } from "../../chat/chat";
import { SimpleChannelUserInfo } from "../../user/channel-user-info";

/**
 * NormalChannelInfo used in TalkChannel
 */
export class TalkNormalChannelInfo implements NormalChannelInfo {

    channelId: Long;
    
    type: string;
    
    activeUserCount: number;

    newChatCount: number;
    newChatCountInvalid: boolean;

    lastChatLogId: Long;
    lastSeenLogId: Long;
    lastChatLog?: Chatlog;

    displayUserList: SimpleChannelUserInfo[];
    
    metaMap: ChannelMetaMap;

    pushAlert: boolean;

    joinTime: number;

    constructor(info: NormalChannelInfo) {
        this.channelId = info.channelId;

        this.type = info.type;

        this.activeUserCount = info.activeUserCount;
        this.newChatCount = info.newChatCount;
        this.newChatCountInvalid = info.newChatCountInvalid;

        this.lastChatLogId = info.lastChatLogId;
        this.lastChatLog = info.lastChatLog;
        this.lastSeenLogId = info.lastSeenLogId;

        this.displayUserList = info.displayUserList;

        this.metaMap = info.metaMap;

        this.pushAlert = info.pushAlert;
        this.joinTime = info.joinTime;
    }

    static createPartial(info: Partial<NormalChannelInfo>) {
        const defaultInfo = Object.assign({
            channelId: Long.ZERO,

            type: '',
            
            activeUserCount: 0,
        
            newChatCount: 0,
            newChatCountInvalid: true,
        
            lastChatLogId: Long.ZERO,
            lastSeenLogId: Long.ZERO,
        
            displayUserList: [],
            
            metaMap: {},
        
            pushAlert: false,
        
            joinTime: 0,
        }, info);

        return new TalkNormalChannelInfo(defaultInfo);
    }

}

export class TalkOpenChannelInfo implements OpenChannelInfo {
    
    channelId: Long;

    linkId: Long;
    openToken: number;
    
    type: string;

    directChannel: boolean;
    o: Long;

    activeUserCount: number;
    displayUserList: SimpleChannelUserInfo[];

    metaMap: ChannelMetaMap;

    newChatCount: number;
    newChatCountInvalid: boolean;

    lastChatLogId: Long;
    lastSeenLogId: Long;
    lastChatLog?: Chatlog;

    pushAlert: boolean;

    constructor(info: OpenChannelInfo) {
        this.channelId = info.channelId;

        this.linkId = info.linkId;
        this.openToken = info.openToken;

        this.type = info.type;

        this.directChannel = info.directChannel;
        this.o = info.o;

        this.activeUserCount = info.activeUserCount;
        this.newChatCount = info.newChatCount;
        this.newChatCountInvalid = info.newChatCountInvalid;

        this.lastChatLogId = info.lastChatLogId;
        this.lastChatLog = info.lastChatLog;
        this.lastSeenLogId = info.lastSeenLogId;

        this.displayUserList = info.displayUserList;

        this.metaMap = info.metaMap;

        this.pushAlert = info.pushAlert;
    }

    static createPartial(info: Partial<OpenChannelInfo>) {
        const defaultInfo = Object.assign({
            channelId: Long.ZERO,

            linkId: Long.ZERO,
            openToken: 0,

            directChannel: false,

            type: '',
            
            activeUserCount: 0,
        
            newChatCount: 0,
            newChatCountInvalid: true,
        
            lastChatLogId: Long.ZERO,
            lastSeenLogId: Long.ZERO,
        
            displayUserList: [],
        
            metaMap: {},

            pushAlert: false,

            o: Long.ZERO
        }, info);

        return new TalkOpenChannelInfo(defaultInfo);
    }

}