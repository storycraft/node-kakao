/*
 * Created on Sun Jul 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct, WebApiStatusCode } from "../../web-api-struct";

export enum OpenStatusCode {

    INVALID_REQUEST = -203,
    NO_RESULT = -1002

}

export interface OpenStruct extends WebApiStruct {

    status: OpenStatusCode | WebApiStatusCode;

}