/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TypedEmitter } from "tiny-typed-emitter";
import { EventContext } from "../../event";
import { AsyncCommandResult } from "../../request";
import { DefaultRes } from "../../request";
import { TalkSession } from "../client";
import { BlockListEvents } from "../event";
import { Managed } from "../managed";

/**
 * Manage blocked users
 */
export class TalkBlockList extends TypedEmitter<BlockListEvents> implements Managed<BlockListEvents> {

    private _map: Map<string, any>;

    constructor(private _session: TalkSession) {
        super();

        this._map = new Map();
    }

    get size() {
        return this._map.size;
    }

    async getLatestBlockList() {
        const map = new Map();

        this._map = map;
    }

    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<BlockListEvents>) {
        
    }

    /**
     * Initialize TalkBlockList
     *
     * @param blockList
     */
    static async initialize(blockList: TalkBlockList) {
        blockList._map.clear();

        await blockList.getLatestBlockList();
    }

}