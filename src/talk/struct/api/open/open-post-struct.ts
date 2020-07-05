/*
 * Created on Thu Jul 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "../../struct-base";
import { OpenStruct } from "./open-struct";
import { Long } from "bson";

export interface OpenPostStruct extends StructBase {

    id: Long;
    linkId: Long;
    postDescription: { text: string, tags: string[] };
    date: number,
    postUrl: string;
    latestUpdateToken: number;
    
}

export interface OpenPostListStruct extends OpenStruct {

    count: number;
    posts: OpenPostStruct[];

}