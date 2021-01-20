/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel, OpenChannel } from "../../channel/channel";
import { ChannelManageSession, ChannelManageSessionOp, ChannelTemplate } from "../../channel/channel-session";
import { CommandSession } from "../../network/request-session";
import { DefaultRes } from "../../packet/bson-data-codec";
import { KnownDataStatusCode } from "../../packet/status-code";
import { CommandResult } from "../../request/command-result";
import { Managed } from "../managed";
import { TalkChannel, TalkOpenChannel } from "./talk-channel";

/**
 * Manage session channels
 */
export class TalkChannelList implements ChannelManageSessionOp, Managed {

    private _session: CommandSession;

    private _manageSession: ChannelManageSession;

    private _normalChannelMap: Map<string, TalkChannel>;
    private _openChannelMap: Map<string, TalkOpenChannel>;

    /**
     * Construct managed channel list and initialize using channelList if present.
     * @param session 
     * @param channelList 
     * @param openChannelList 
     */
    constructor(session: CommandSession, channelList: Channel[] = [], openChannelList: OpenChannel[] = []) {
        this._session = session;
        this._manageSession = new ChannelManageSession(session);
        
        this._normalChannelMap = new Map();
        this._openChannelMap = new Map();

        for (const channel of channelList) {
            const talkChannel = new TalkChannel(channel, this._session);

            this._normalChannelMap.set(channel.channelId.toString(), talkChannel);
        }

        for (const channel of openChannelList) {
            const talkChannel = new TalkOpenChannel(channel, this._session);

            this._openChannelMap.set(channel.channelId.toString(), talkChannel);
        }
    }

    /**
     * Returns true if list instance is managing channel.
     * @param channelId 
     */
    contains(channelId: Long) {
        const strId = channelId.toString();

        return this._normalChannelMap.has(strId) || this._openChannelMap.has(strId);
    }
    
    private delete(channelId: Long) {
        const strId = channelId.toString();

        return this._normalChannelMap.delete(strId) || this._openChannelMap.delete(strId);
    }

    createChannel(template: ChannelTemplate) {
        return this._manageSession.createChannel(template);
    }

    createMemoChannel() {
        return this._manageSession.createMemoChannel();
    }

    async leaveChannel(channel: Channel, block?: boolean) {
        const res = await this._manageSession.leaveChannel(channel, block);

        if (res.status === KnownDataStatusCode.SUCCESS && this.contains(channel.channelId)) {
            this.delete(channel.channelId);
        }

        return res;
    }

    pushReceived(method: string, data: DefaultRes): void {
        for (const channel of this._normalChannelMap.values()) {
            channel.pushReceived(method, data);
        }

        for (const openChannel of this._openChannelMap.values()) {
            openChannel.pushReceived(method, data);
        }
    }

}