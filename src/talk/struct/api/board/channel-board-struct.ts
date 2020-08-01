/*
 * Created on Sun Aug 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct, WebApiStatusCode } from "../../web-api-struct";

export enum ChannelBoardStatusCode {
    
    NO_PERM = -4031

}

export interface ChannelBoardStruct extends WebApiStruct {

    status: WebApiStatusCode | ChannelBoardStatusCode;
    permission?: number;
    error_message?: string;

}