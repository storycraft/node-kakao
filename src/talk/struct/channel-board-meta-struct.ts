/*
 * Created on Tue Nov 05 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "./struct-base";
import { ObjectMapper } from "json-proxy-mapper";
import { Long } from "bson";
import { JsonUtil } from "../../util/json-util";

export interface ChannelBoardMetaStruct extends StructBase {

    type: ChannelBoardMetaType;
    content: string;

    boardRevision: Long;
    userRevision: Long;

}

export namespace ChannelBoardMetaStruct {

    export const Mappings = {

        'type': 't',
        'content': 'ct',
        'boardRevision': 'br',
        'userRevision': 'ur'

    }

    export const ConvertMap = {

        'boardRevision': JsonUtil.LongConverter,
        'userRevision': JsonUtil.LongConverter

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}

export enum ChannelBoardMetaType {

    NONE = 0,
    FLOATING_NOTICE = 1,
    SIDE_NOTICE = 2,
    BADGE = 3
    
}