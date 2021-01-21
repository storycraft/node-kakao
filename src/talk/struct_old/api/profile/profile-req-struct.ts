/*
 * Created on Fri May 22 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { WebApiStruct } from "../../web-api-struct";
import { ProfileStruct } from "./profile-struct";

export interface ProfileReqStruct extends WebApiStruct {

    profile: ProfileStruct;

    itemNewBadgeToken: number;
    lastSeenAt: number;

}