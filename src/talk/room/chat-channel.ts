import { ChatUser } from "../user/chat-user";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatChannel {

    async getUserNickname(user: ChatUser): Promise<string> {
        return '';
    }

}

export class SelfChatChannel extends ChatChannel {

}

export class GroupChatChannel extends ChatChannel {

}

export class PlusFriendChatChannel extends ChatChannel {

}

export class OpenChatChannel extends ChatChannel {

}

export class SecretChatChannel extends ChatChannel {

}