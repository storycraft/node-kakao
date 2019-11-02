import { ChatUser } from "../user/chat-user";
import { TalkClient } from "../../talk-client";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class UserManager {

    static USER_INFO_UPDATE_INTERVAL: number = 1800000;

    private client: TalkClient;

    private userMap: Map<number, ChatUser>;
    
    constructor(client: TalkClient) {
        this.client = client;

        this.userMap = new Map();
    }

    get Client() {
        return this.client;
    }

    get UserList() {
        return Array.from(this.userMap.values());
    }

    hasUser(id: number): boolean {
        return this.userMap.has(id);
    }

    async getUser(id: number): Promise<ChatUser> {

        let user: ChatUser;
        if (this.hasUser(id)) {
            user = this.userMap.get(id)!;
        } else {
            user = new ChatUser(id);
            this.userMap.set(id, user);
        }

        if (user.LastInfoCache <= Date.now() + UserManager.USER_INFO_UPDATE_INTERVAL) {
            await this.updateUserInfo(user);
        }

        return user;
    }

    async updateUserInfo(user: ChatUser, ) {
        
    }

}