/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { CommandSession } from "../network/request-session";
import { DefaultRes } from "../packet/bson-data-codec";
import { ChannelUser } from "../user/channel-user";

export interface ChannelTemplate {

    userList: ChannelUser[],

    name?: string;
    profileURL?: string;

}

/**
 * Classes which provides client session operations should implement this.
 */
export interface ClientSessionOp {

    /**
     * Create channel.
     * Perform CREATE command.
     * 
     * @param userList Users to be included.
     */
    createChannel(template: ChannelTemplate): Promise<DefaultRes>;

    /**
     * Create memo channel.
     * Perform CREATE command.
     */
    createMemoChannel(): Promise<DefaultRes>;

}

/**
 * Default client session implementation.
 */
export class ClientSession implements ClientSessionOp {

    private _session: CommandSession;
        
    constructor(session: CommandSession) {
        this._session = session;
    }

    createChannel(template: ChannelTemplate) {
        const data: Record<string, any> = {
            'memberIds': template.userList.map(user => user.userId)
        };

        if (template.name) data['nickname'] = template.name;
        if (template.profileURL) data['profileImageUrl'] = template.profileURL;

        return this._session.request('CREATE', data);
    }

    createMemoChannel() {
        return this._session.request('CREATE', { 'memoChat': true });
    }

}