/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../../web-api-struct";
import { Long } from "bson";

export interface FriendNicknameStruct extends WebApiStruct {

    userId: Long;
    nickname: string;

}