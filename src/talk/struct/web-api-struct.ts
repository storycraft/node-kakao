/*
 * Created on Tue May 19 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "./struct-base";

export enum WebApiStatusCode {

    SUCCESS = 0,
    OPERATION_DENIED = -500,
    NO_RESULT = -1002

}

export interface WebApiStruct extends StructBase {
    
    status: WebApiStatusCode | number;

}