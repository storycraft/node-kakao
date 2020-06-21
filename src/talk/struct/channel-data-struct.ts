import { ChannelType } from "../channel/channel-type";
import { StructBase } from "./struct-base";
import { Long } from "bson";
import { ObjectMapper } from "json-proxy-mapper";
import { ChannelClientMetaStruct } from "./channel-meta-struct";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChannelDataStruct extends StructBase {

    channelId: Long;
    type: ChannelType;
    memberCount: number;
    pushAlert: boolean;
    linkId?: Long;
    openToken?: number;
    metadata?: ChannelClientMetaStruct;

}

export namespace ChannelDataStruct {

    export const Mappings = {

        channelId: 'c',
        type: 't',
        memberCount: 'a',
        pushAlert: 'p',
        linkId: 'li',
        openToken: 'otk',
        metadata: 'm'

    }

    export const MAPPER = new ObjectMapper(Mappings);

}