import { StructBase } from "./struct-base";
import { Long } from "bson";
import { JsonUtil } from "../../util/json-util";

/*
 * Created on Fri Nov 22 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */


export class OpenLinkStruct implements StructBase {

    constructor(
        public LinkId: Long = Long.ZERO,
        public OpenToken: number = 0,
        public LinkName: string = '',
        public LinkURL: string = '',
        public readonly Member: OpenMemberStruct = new OpenMemberStruct()
    ) {
        
    }

    fromJson(rawData: any): void {
        this.LinkId = JsonUtil.readLong(rawData['li']);
        this.OpenToken = rawData['otk'];
        this.LinkName = rawData['ln'];
        this.LinkURL = rawData['lu'];

        this.Member.fromJson(rawData['olu']);
    }
    
    toJson() {
        let obj: any = {
            'li': this.LinkId,
            'otk': this.OpenToken,
            'ln': this.LinkName,
            'lu': this.LinkURL,
            'olu': this.Member.toJson()
        };

        return obj;
    }

}

export class OpenMemberStruct implements StructBase {

    constructor(
        public UserId: Long = Long.ZERO,
        public NickName: string = '',
        public ProfileImageUrl: string = '',
        public OriginalProfileImageUrl: string = '',
        public FullProfileImageUrl: string = '',
    ) {

    }

    fromJson(rawData: any): void {
        this.UserId = JsonUtil.readLong(rawData['userId']);
        this.NickName = rawData['nn'];
        this.ProfileImageUrl = rawData['pi'] || rawData['profileImageUrl'] || '';
        this.OriginalProfileImageUrl = rawData['opi'] || rawData['originalProfileImageUrl'] || '';
        this.FullProfileImageUrl = rawData['fpi'] || rawData['fullProfileImageUrl'] || '';
    }
    
    toJson() {
        let obj: any = {
            'userId': this.UserId,
            'nn': this.NickName,
            'pi': this.ProfileImageUrl,
            'opi': this.OriginalProfileImageUrl,
            'fpi': this.FullProfileImageUrl
        };

        return obj;
    }
}