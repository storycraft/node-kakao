/*
 * Created on Thu Jul 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenStruct } from "./open-struct";
import { StructBase } from "../../struct-base";
import { ObjectMapper, Converter } from "json-proxy-mapper";
import { OpenLinkType } from "../../../open/open-link-type";

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

        writtenAt: number;

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

            writtenAt: 'writtenAt',

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

            'items': new Converter.Array(TagItem.Mappings)
    
        }
    
        export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
        
    }

    export namespace LinkList {

        export const Mappings = {

            title: 'title',
            items: 'items'
    
        }

        export const ConvertMap = {

            'items': new Converter.Array(LinkItem.Mappings)
    
        }
    
        export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
        
    }

}

export interface OpenRecommendStruct extends OpenStruct {

    tag: OpenRecommend.TagList;
    links: OpenRecommend.LinkList[];

}

export namespace OpenRecommendStruct {

    export const Mappings = {

        tag: 'tag',
        links: 'links'

    }

    export const ConvertMap = {

        'tag': new Converter.Object(OpenRecommend.TagList.Mappings, OpenRecommend.TagList.ConvertMap),
        'links': new Converter.Array(OpenRecommend.LinkList.Mappings, OpenRecommend.LinkList.ConvertMap),

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}