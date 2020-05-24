import { StructBaseOld, Long } from "../..";
import { JsonUtil } from "../../util/json-util";
import { StructBase } from "./struct-base";
import { ObjectMapper } from "json-proxy-mapper";

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

export interface ChannelMetaStruct extends StructBase {

    type: ChannelMetaType,
    revision: Long,
    authorId: Long,
    content: string,
    updatedAt: number

}

export interface ChannelMetaSetStruct extends StructBase {

    channelId: Long,
    metaList: ChannelMetaStruct[]

}

export namespace ChannelMetaSetStruct {

    export const Mappings = {

        channelId: 'c',
        metaList: 'ms',

    }

    export const ConvertMap = {

        channelId: JsonUtil.LongConverter

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}