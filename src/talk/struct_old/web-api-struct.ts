/*
 * Created on Tue May 19 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "./struct-base";

export enum WebApiStatusCode {

    SUCCESS = 0,
    INVALID_SESSION = -950,
    OPERATION_DENIED = -500
    
}

export interface WebApiStruct extends StructBase {
    
    status: WebApiStatusCode | number;

}
