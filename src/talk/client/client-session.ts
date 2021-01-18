/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoSession } from "../../network/loco-session";
import { Sessioned } from "../sessioned";
import { ChannelUser } from "../user/channel-user";

export interface ChannelTemplate {

    userList: ChannelUser[],

    name?: string;
    profileURL?: string;

}

export class ClientSession implements Sessioned {

    private _session: LocoSession;
        
    constructor(session: LocoSession) {
        this._session = session;
    }

    get session() {
        return this._session;
    }

    /**
     * Create channel.
     * Perform CREATE command.
     * 
     * @param userList Users to be included.
     */
    createChannel(template: ChannelTemplate) {
        const data: Record<string, any> = {
            'memberIds': template.userList.map(user => user.userId)
        };

        if (template.name) data['nickname'] = template.name;
        if (template.profileURL) data['profileImageUrl'] = template.profileURL;

        return this.session.sendData('CREATE', data);
    }

    /**
     * Create memo channel.
     * Perform CREATE command.
     */
    createMemoChannel() {
        return this.session.sendData('CREATE', { 'memoChat': true });
    }

}