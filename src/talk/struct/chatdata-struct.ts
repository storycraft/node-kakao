import { ChannelType } from "../chat/channel-type";
import { StructBase } from "./struct-base";
import { Long } from "bson";
import { ObjectMapper } from "json-proxy-mapper";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatDataStruct extends StructBase {

    channelId: Long;
    type: ChannelType;
    memberCount: number;
    pushAlert: boolean;
    linkId?: Long;
    openToken?: number;
    metadata: ChatMetaStruct;

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

    export const MAPPER = new ObjectMapper(Mappings);

}

export interface ChatMetaStruct extends StructBase {

    fullImageURL: string;
    imageURL: string;
    name: string;
    favorite: boolean;

}