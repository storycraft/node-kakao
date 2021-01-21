/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../../web-api-struct";
import { FriendStruct } from "./friend-struct";

export interface FriendBlockedListStruct extends WebApiStruct {

    total: number;

    blockedFriends: FriendStruct[];

}