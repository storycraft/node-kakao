/*
 * Created on Wed May 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../../web-api-struct";
import { FriendStruct } from "./friend-struct";

export interface FriendSearchUserListStruct extends WebApiStruct {

    count: number;
    list: FriendStruct[];

}

export interface FriendSearchStruct extends WebApiStruct {

    query: string;
    user?: FriendSearchUserListStruct;
    plus?: FriendSearchUserListStruct;
    categories: string[];
    total_counts: number;

}