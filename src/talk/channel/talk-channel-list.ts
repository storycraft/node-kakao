/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { Channel, OpenChannel } from "../../channel/channel";
import { NormalChannelInfo } from "../../channel/channel-info";
import { ChannelManageSession, ChannelTemplate } from "../../channel/channel-session";
import { CommandSession } from "../../network/request-session";
import { DefaultRes } from "../../packet/bson-data-codec";
import { CommandResult } from "../../request/command-result";
import { Managed } from "../managed";
import { TalkChannel, TalkOpenChannel } from "./talk-channel";
import { TalkChannelManageSession } from "./talk-channel-session";

/**
 * Manage session channels
 */
export class TalkChannelList implements ChannelManageSession, Managed {

    private _session: CommandSession;

    private _manageSession: TalkChannelManageSession;

    private _normalChannelMap: Map<string, TalkChannel>;
    private _openChannelMap: Map<string, TalkOpenChannel>;

    /**
     * Construct managed channel list and initialize using channelList if present.
     * @param session 
     * @param channelList 
     * @param openChannelList 
     */
    constructor(session: CommandSession) {
        this._session = session;
        this._manageSession = new TalkChannelManageSession(session);
        
        this._normalChannelMap = new Map();
        this._openChannelMap = new Map();
    }

    /**
     * Returns true if list instance is managing channel.
     * @param channelId 
     */
    contains(channelId: Long) {
        const strId = channelId.toString();

        return this._normalChannelMap.has(strId) || this._openChannelMap.has(strId);
    }

    private async addChannel(channel: Channel | OpenChannel) {
        let talkChannel: TalkChannel | TalkOpenChannel;
        if ('linkId' in channel) {
            talkChannel = new TalkOpenChannel(channel, this._session);
            this._openChannelMap.set(channel.channelId.toString(), talkChannel);
        } else {
            talkChannel = new TalkChannel(channel, this._session);
            this._normalChannelMap.set(channel.channelId.toString(), talkChannel);
        }

        await talkChannel.updateInfo();
    }

    private async addCreatedChannel(channel: Channel, info: NormalChannelInfo | null) {
        const talkChannel = new TalkChannel(channel, this._session, info);
        this._normalChannelMap.set(talkChannel.channelId.toString(), talkChannel);

        if (!talkChannel.info) await talkChannel.updateInfo();

        return talkChannel;
    }
    
    private delete(channelId: Long) {
        const strId = channelId.toString();

        return this._normalChannelMap.delete(strId) || this._openChannelMap.delete(strId);
    }

    async createChannel(template: ChannelTemplate): Promise<CommandResult<[TalkChannel, NormalChannelInfo]>> {
        const res = await this._manageSession.createChannel(template);
        if (!res.success) return res;

        const talkChannel = await this.addCreatedChannel(...res.result);

        return { status: res.status, success: true, result: [talkChannel, talkChannel.info] };
    }

    async createMemoChannel(): Promise<CommandResult<[TalkChannel, NormalChannelInfo]>> {
        const res = await this._manageSession.createMemoChannel();
        if (!res.success) return res;

        const talkChannel = await this.addCreatedChannel(...res.result);

        return { status: res.status, success: true, result: [talkChannel, talkChannel.info] };
    }

    async leaveChannel(channel: Channel, block?: boolean) {
        const res = await this._manageSession.leaveChannel(channel, block);

        if (res.success && this.contains(channel.channelId)) {
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

    /**
     * Initialize TalkChannelList using channelList.
     * @param session 
     * @param channelList 
     */
    static async initialize(session: CommandSession, channelList: (Channel | OpenChannel)[] = []): Promise<TalkChannelList> {
        const talkChannelList = new TalkChannelList(session);

        await Promise.all(channelList.map(channel => talkChannelList.addChannel(channel)));

        return talkChannelList;
    }

}