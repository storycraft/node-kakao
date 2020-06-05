/*
 * Created on Tue Nov 05 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "./struct-base";

export interface ChannelBoardMetaStruct extends StructBase {

}

export enum ChannelBoardType {

    NONE = 0,
    FLOATING_NOTICE = 1,
    SIDE_NOTICE = 2,
    BADGE = 3
    
}