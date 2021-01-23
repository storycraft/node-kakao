/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { EventContext } from "../../event/event-context";
import { ChannelEvents, OpenChannelEvents } from "../../event/events";
import { DefaultRes } from "../../packet/bson-data-codec";
import { JsonUtil } from "../../util/json-util";
import { Managed } from "../managed";
import { AnyTalkChannel, TalkOpenChannel } from "./talk-channel";

/**
 * Capture and handle pushes coming to channel
 */
export class TalkChannelHandler implements Managed<ChannelEvents> {

    constructor(private _channel: AnyTalkChannel) {

    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        
    }

}

/**
 * Capture and handle pushes coming to open channel
 */
export class TalkOpenChannelHandler implements Managed<OpenChannelEvents> {

    constructor(private _channel: TalkOpenChannel) {

    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<ChannelEvents>) {
        
    }

}