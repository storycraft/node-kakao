/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../../web-api-struct";
import { FriendStruct } from "./friend-struct";
import { Long } from "bson";

export interface FriendFindIdStruct extends WebApiStruct {

    token: Long;
    friend: FriendStruct;

}

export interface FriendFindUUIDStruct extends WebApiStruct {

    member: FriendStruct;

}