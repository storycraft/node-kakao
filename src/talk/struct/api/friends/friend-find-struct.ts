/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ApiStruct } from "../api-struct";
import { FriendStruct } from "./friend-struct";
import { Long } from "bson";

export interface FriendFindIdStruct extends ApiStruct {

    token: Long;
    friend: FriendStruct;

}

export interface FriendFindUUIDStruct extends ApiStruct {

    member: FriendStruct;

}