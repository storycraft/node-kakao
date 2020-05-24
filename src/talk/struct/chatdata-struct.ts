import { ChannelType } from "../chat/channel-type";
import { StructBaseOld, StructBase } from "./struct-base";
import { JsonUtil } from "../../util/json-util";
import { Long } from "bson";
import { Converter, ObjectMapper } from "json-proxy-mapper";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatDataStruct extends StructBase {

    channelId: Long;
    type: ChannelType,
    memberCount: number,
    pushAlert: boolean,
    linkId?: Long,
    openToken?: number,
    metadata: ChatDataMetaStruct

}

export namespace ChatDataStruct {

    export const Mappings = {

        channelId: 'c',
        type: 't',
        memberCount: 'a',
        pushAlert: 'p',
        linkId: 'li',
        openToken: 'otk',
        metadata: 'm'

    }

    export const ConvertMap = {

        channelId: JsonUtil.LongConverter,
        linkId: JsonUtil.LongConverter

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}

export interface ChatDataMetaStruct extends StructBase {

    imageUrl: string;
    fullImageUrl: string;
    name: string;
    favorite: boolean;

}