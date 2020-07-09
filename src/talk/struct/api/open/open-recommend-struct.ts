/*
 * Created on Thu Jul 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenStruct } from "./open-struct";
import { StructBase } from "../../struct-base";
import { ObjectMapper, Converter } from "json-proxy-mapper";
import { OpenLinkType } from "../../../open/open-link-type";
import { OpenPostStruct } from "./open-post-struct";
import { OpenSearchStruct } from "./open-search-struct";

export namespace OpenRecommend {

    export interface TagItem extends StructBase {

        tagName: string;
        backgroundColor?: string;
        pageReferrer: string;

    }
    
    export interface LinkItem extends StructBase {

        linkName: string;
        linkType: OpenLinkType,
        linkURL: string;
        linkImageURL: string;

        memberCount: number;

        description: string;

        ownerNickname: string;
        ownerProfileImageURL: string;

        lastChatAt: number;

        reactCount: number;

        pageReferrer: string;
    }
    
    export interface TagList extends StructBase {

        title: string;
        items: TagItem[];

    }

    export namespace TagItem {

        export const Mappings = {

            tagName: 'tn',
            backgroundColor: 'bgColor',
            pageReferrer: 'apr'
    
        }

        export const MAPPER = new ObjectMapper(Mappings);

    }

    export interface LinkList extends StructBase {

        title: string;
        items: LinkItem[];

    }


    
    export namespace LinkItem {
        
        export const Mappings = {

            linkName: 'ln',
            linkType: 'lt',
            linkURL: 'lu',
            linkImageURL: 'liu',
            memberCount: 'mcnt',
            description: 'desc',

            ownerNickname: 'nn',
            ownerProfileImageURL: 'pi',

            lastChatAt: 'writtenAt',

            reactCount: 'rc',

            pageReferrer: 'apr'
    
        }

        export const MAPPER = new ObjectMapper(Mappings);

    }

    export namespace TagList {

        export const Mappings = {

            title: 'title',
            items: 'items'
    
        }

        export const ConvertMap = {

            items: new Converter.Array(TagItem.Mappings)
    
        }
    
        export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
        
    }

    export namespace LinkList {

        export const Mappings = {

            title: 'title',
            items: 'items'
    
        }

        export const ConvertMap = {

            items: new Converter.Array(LinkItem.Mappings)
    
        }
    
        export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
        
    }

}

export interface OpenRecommendStruct extends OpenStruct {

    tag: OpenRecommend.TagList;
    linkList: OpenRecommend.LinkList[];

}

export namespace OpenRecommendStruct {

    export const Mappings = {

        tag: 'tag',
        linkList: 'links'

    }

    export const ConvertMap = {

        tag: new Converter.Object(OpenRecommend.TagList.Mappings, OpenRecommend.TagList.ConvertMap),
        linkList: new Converter.Array(OpenRecommend.LinkList.Mappings, OpenRecommend.LinkList.ConvertMap),

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}


export interface OpenPostRecommendStruct extends OpenStruct {

    title: string;
    postList: OpenSearchStruct.PostItem[];

}

export namespace OpenPostRecommendStruct {

    export const Mappings = {

        title: 'title',
        postList: 'recommendPosts'

    }

    export const ConvertMap = {

        postList: new Converter.Array(OpenSearchStruct.PostItem.Mappings, OpenSearchStruct.PostItem.ConvertMap),

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}