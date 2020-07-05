/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../../web-api-struct";
import { FriendStruct } from "./friend-struct";

export interface FriendReqStruct extends WebApiStruct {

    friend: FriendStruct;

}

export interface FriendReqPhoneNumberStruct extends WebApiStruct {

    pstn_number: string;

}