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

export interface OpenPostDescStruct extends StructBase {

    text: string;
    tags: string[]

}

export interface OpenPostStruct extends StructBase {

    id: Long;
    linkId: Long;

    description: OpenPostDescStruct;
    postDataList?: OpenPostDataStruct[];

    date: number;
    reactionList?: { type: LinkReactionType, count: number }[];
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

        
        latestUpdateToken: 'latestUpdateToken'
    }

    export const MAPPER = new ObjectMapper(Mappings);
    
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

        postList: new Converter.Array(OpenPostStruct.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}

export interface OpenPostReactStruct extends OpenStruct {

    postId: Long

}

export interface OpenPostApiStruct extends OpenStruct {

    post: OpenPostStruct

}

export namespace OpenPostApiStruct {

    export const Mappings = {

        post: 'post',

    }

    export const ConvertMap = {

        post: new Converter.Object(OpenPostStruct.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}