/*
 * Created on Tue Jun 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct, WebApiStatusCode } from "../web-api-struct";

export enum AuthStatusCode {

    LOGIN_FAILED_REASON = 12,
    LOGIN_FAILED = 30,
    MOBILE_UNREGISTERED = 32,
    DEVICE_NOT_REGISTERED = -100,
    ANOTHER_LOGON = -101,
    DEVICE_REGISTER_FAILED = -102,
    INVALID_DEVICE_REGISTER = -110,
    INCORRECT_PASSCODE = -111,
    PASSCODE_REQUEST_FAILED = -112,
    ACCOUNT_RESTRICTED = -997

}

export interface AuthApiStruct extends WebApiStruct {

    status: WebApiStatusCode | AuthStatusCode;
    
}