/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../../web-api-struct";

export interface FriendDeleteStruct extends WebApiStruct {

    friend_ids: number[];

}