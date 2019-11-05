import { StructBase, Long } from "../..";
import { JsonUtil } from "../../util/json-util";
import { ChannelMetaStruct } from "./chat-info-struct";

/*
 * Created on Tue Nov 05 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChannelMetaSetStruct implements StructBase {
    
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