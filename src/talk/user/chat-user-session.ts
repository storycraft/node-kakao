/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoSession } from "../../network/loco-session";
import { Sessioned } from "../sessioned";
import { ChatUser } from "./chat-user";

type Constructor<T> = new (...args: any[]) => T;

export function ChatUserSessionMixin<T extends Constructor<Sessioned & ChatUser>>(Base: T) {
    return class extends Base {

        

    };
}

class SessionedChatUser implements Sessioned, ChatUser {

    private _user: ChatUser;
    private _session: LocoSession;

    constructor(user: ChatUser, session: LocoSession) {
        this._user = user;
        this._session = session;
    }
    
    get userId() {
        return this._user.userId;
    }

    get session() {
        return this._session;
    }

}

export const ChatUserSession = ChatUserSessionMixin(SessionedChatUser);