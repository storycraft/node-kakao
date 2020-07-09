/*
 * Created on Sun Jul 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenStruct } from "./open-struct";
import { Converter, ObjectMapper } from "json-proxy-mapper";
import { OpenLinkType } from "../../../open/open-link-type";
import { StructBase } from "../../struct-base";

export enum OpenSearchType {

    PROFILE = 'p',
    DIRECT = 'd',
    GROUP = 'm'

}

export interface OpenSearchStruct extends OpenStruct {

    page: number;
    count: number;

    totalCount: number;

    itemList: OpenSearchStruct.LinkItem[];

    pageReferrer: string;

}

export namespace OpenSearchStruct {
    
    export interface LinkItem extends StructBase {

        linkName: string;
        linkType: OpenLinkType,
        linkURL: string;
        linkImageURL: string;
        
        locked: boolean;

        memberCount?: number;

        description?: string;
        tagList: string[];

        ownerNickname: string;
        ownerProfileImageURL: string;

        lastChatAt?: number;

        reactCount: number;
    }

    export namespace LinkItem {
        
        export const Mappings = {

            linkName: 'ln',
            linkType: 'lt',
            linkURL: 'lu',
            linkImageURL: 'liu',
            memberCount: 'mcnt',

            description: 'desc',
            tagList: 'tags',

            locked: 'lk',

            ownerNickname: 'nn',
            ownerProfileImageURL: 'pi',

            lastChatAt: 'writtenAt',

            reactCount: 'rc',
    
        }

        export const MAPPER = new ObjectMapper(Mappings);

    }



    export const Mappings = {

        page: 'page',
        count: 'count',
        itemList: 'items',
        pageReferrer: 'apr'

    }

    export const ConvertMap = {

        itemList: new Converter.Array(LinkItem.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}