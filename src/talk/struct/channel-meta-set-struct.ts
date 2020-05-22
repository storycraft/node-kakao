import { StructBaseOld, Long } from "../..";
import { JsonUtil } from "../../util/json-util";

/*
 * Created on Tue Nov 05 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum ChannelMetaType {
    
    NOTICE = 1,
    GROUP = 2,
    TITLE = 3,
    PROFILE = 4,
    TV = 5,
    PRIVILEGE = 6,
    TV_LIVE = 7,
    PLUS_BACKGROUND = 8,
    LIVE_TALK_INFO = 11,
    LIVE_TALK_COUNT = 12
}

export class ChannelMetaStruct implements StructBaseOld {

    constructor(
        public Type: ChannelMetaType = 0,
        public Revision: Long = Long.ZERO,
        public AuthorId: Long = Long.ZERO,
        public Content: string = '',
        public UpdatedAt: number = -1
    ) {

    }

    toJson() {
        return {
            'type': this.Type,
            'revision': this.Revision,
            'authorId': this.AuthorId,
            'content': this.Content,
            'updateAt': this.UpdatedAt
        }
    }

    fromJson(rawJson: any) {
        this.Type = rawJson['type'];
        this.Revision = JsonUtil.readLong(rawJson['revision']);
        this.AuthorId = JsonUtil.readLong(rawJson['authorId']);
        this.Content = rawJson['content'];
        this.UpdatedAt = rawJson['updatedAt'];
    }

}

export class ChannelMetaSetStruct implements StructBaseOld {
    
    constructor(
        public ChannelId: Long = Long.ZERO,
        public MetaList: ChannelMetaStruct[] = []
    ) {

    }

    fromJson(rawData: any): void {
        this.ChannelId = JsonUtil.readLong(rawData['c']);

        this.MetaList = [];
        if (rawData['ms']) {
            let list: any[] = rawData['ms'];

            for (let rawMeta of list) {
                let meta = new ChannelMetaStruct();

                meta.fromJson(rawMeta);

                this.MetaList.push(meta);
            }
        }
    }
    
    toJson() {
        let rawMetaList: any[] = [];

        for (let meta of this.MetaList) {
            rawMetaList.push(meta.toJson());
        }

        return {
            'c': this.ChannelId,
            'ms': rawMetaList
        }
    }

}