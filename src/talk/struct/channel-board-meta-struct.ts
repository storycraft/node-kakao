import { StructBase } from "./struct-base";

/*
 * Created on Tue Nov 05 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChannelBoardMetaStruct implements StructBase {
    
    fromJson(rawData: any): void {
        throw new Error("Method not implemented.");
    }
    
    toJson() {
        throw new Error("Method not implemented.");
    }

}

export enum ChannelBoardType {
    NONE = 0,
    FLOATING_NOTICE = 1,
    SIDE_NOTICE = 2,
    BADGE = 3
}