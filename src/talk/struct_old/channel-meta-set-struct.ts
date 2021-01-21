import { Long } from "bson";
import { StructBase } from "./struct-base";
import { ObjectMapper } from "json-proxy-mapper";
import { ChannelMetaStruct } from "./channel-meta-struct";

/*
 * Created on Tue Nov 05 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChannelMetaSetStruct extends StructBase {

    channelId: Long,
    metaList: ChannelMetaStruct[]

}

export namespace ChannelMetaSetStruct {

    export const Mappings = {

        channelId: 'c',
        metaList: 'ms',

    }

    export const MAPPER = new ObjectMapper(Mappings);

}