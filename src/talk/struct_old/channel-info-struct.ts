import { Long } from "bson";
import { ChatlogStruct } from "./chatlog-struct";
import { MemberStruct, DisplayMemberStruct } from "./member-struct";
import { ChannelMetaStruct } from "./channel-meta-struct";
import { ObjectMapper, Converter } from "json-proxy-mapper";
import { ChannelDataStruct } from "./channel-data-struct";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChannelInfoStruct extends ChannelDataStruct {

    activeMemberCount: number;
    newMessageCount: number;
    lastUpdatedAt: string;
    lastMessage: string;
    lastLogId: Long;
    lastSeenLogId: Long;
    lastChatLog?: ChatlogStruct;
    displayMemberList: DisplayMemberStruct[];
    channelMetaList?: ChannelMetaStruct[];
    isDirectChat: boolean;

}

export namespace ChannelInfoStruct {

    export const Mappings = {
        
        channelId: 'chatId',
        type: 'type',
        activeMemberCount: 'activeMembersCount',
        newMessageCount: 'newMessageCount',
        lastUpdatedAt: 'lastUpdatedAt',
        lastMessage: 'lastMessage',
        lastLogId: 'lastLogId',
        lastSeenLogId: 'lastSeenLogId',
        lastChatLog: 'lastChatLog',
        metadata: 'meta',
        displayMemberList: 'displayMembers',
        pushAlert: 'pushAlert',
        channelMetaList: 'chatMetas',
        isDirectChat: 'directChat',

        linkId: 'li',
        openToken: 'otk'

    }

    export const ConvertMap = {

        displayMemberList: new Converter.Array(DisplayMemberStruct.Mappings),
        lastChatLog: new Converter.Object(ChatlogStruct.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}