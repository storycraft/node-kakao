/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { IdStore } from "../../store/store";
import { ChatUser } from "./chat-user";
import { Long } from "bson";
import { TalkClient } from "../../talk-client";

export class UserManager extends IdStore<ChatUser> {

    constructor(private client: TalkClient) {
        super();
    }

    get Client() {
        return this.client;
    }

    protected async fetchValue(key: Long): Promise<ChatUser> {
        return new ChatUser(this.client, key);
    }

    async get(key: Long) {
        if (this.client.ClientUser.Id.equals(key)) return this.client.ClientUser;

        return super.get(key, true);
    }

}