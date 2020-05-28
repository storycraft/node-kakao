/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ApiStruct } from "../api-struct";
import { Long } from "bson";

export interface FriendNicknameStruct extends ApiStruct {

    userId: Long;
    nickname: string;

}