/*
 * Created on Thu Jul 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "../../struct-base";
import { OpenStruct } from "./open-struct";
import { Long } from "bson";
import { ObjectMapper, Converter } from "json-proxy-mapper";
import { LinkReactionType } from "../../open/open-link-struct";

export interface OpenPostDataStruct extends StructBase {

    originalFileName: string;
    path: string,
    imagePaths: { originalImagePath: string, largeImagePath: string, smallImagePath: string };
    width: number;
    height: number;

}

export enum OpenPostTagType {

    SHARP = 2

}

export interface OpenPostTagStruct extends StructBase {

    type: OpenPostTagType;
    text: string;

}

export namespace OpenPostTagStruct {
    
    export const Mappings = {

        type: 't',
        text: 'c'

    }

    export const MAPPER = new ObjectMapper(Mappings);

}

export interface OpenPostDescStruct extends StructBase {

    text: string;
    tagList: OpenPostTagStruct[];

}

export namespace OpenPostDescStruct {
    
    export const Mappings = {

        text: 'text',
        tagList: 'tags'

    }

    export const ConvertMap = {

        tagList: new Converter.Array(OpenPostTagStruct.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings);

}

export interface OpenPostStruct extends StructBase {

    id: Long;
    linkId: Long;

    description?: OpenPostDescStruct;
    postDataList?: OpenPostDataStruct[];

    date: number;
    reactionList?: { type: LinkReactionType, count: number }[];
    reactionUserList?: { reactId: number, linkId: Long, type: LinkReactionType, name: string, description: string, profileImagePath: string }[];
    postURL: string;
    latestUpdateToken: number;
    
}

export namespace OpenPostStruct {

    export const Mappings = {

        id: 'id',
        linkId: 'linkId',

        description: 'postDescription',
        postDataList: 'postDatas',

        date: 'date',
        postURL: 'postUrl',

        reactionList: 'reacts',
        reactionUserList: 'reactUsers',
        
        latestUpdateToken: 'latestUpdateToken'
    }

    export const ConvertMap = {

        description: new Converter.Object(OpenPostDescStruct.Mappings, OpenPostDescStruct.ConvertMap)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);
    
}

export interface OpenPostListStruct extends OpenStruct {

    count: number;
    postList: OpenPostStruct[];

}

export namespace OpenPostListStruct {

    export const Mappings = {

        count: 'count',
        postList: 'posts'

    }

    export const ConvertMap = {

        postList: new Converter.Array(OpenPostStruct.Mappings, OpenPostStruct.ConvertMap)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}

export interface OpenPostReactStruct extends OpenStruct {

    postId: Long;

}

export interface OpenPostReactNotiStruct extends OpenStruct {

    linkIdList: Long[];

}

export namespace OpenPostReactNotiStruct {

    export const Mappings = {

        linkIdList: 'linkIds',

    }

    export const MAPPER = new ObjectMapper(Mappings);

}

export interface OpenPostApiStruct extends OpenStruct {

    post: OpenPostStruct;

}

export namespace OpenPostApiStruct {

    export const Mappings = {

        post: 'post',

    }

    export const ConvertMap = {

        post: new Converter.Object(OpenPostStruct.Mappings, OpenPostStruct.ConvertMap)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}