/*
 * Created on Thu Jul 09 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenPostDataStruct, OpenPostScrapData } from "../open-post-struct";
import { Long } from "bson";

export interface OpenPostTemplate {
    
    text?: string;
    postDataList?: OpenPostDataStruct[];
    scrapData?: OpenPostScrapData;

    shareChannelList?: Long[];

}