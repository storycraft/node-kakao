import { StructBase } from "./struct-base";
import { Long } from "bson";
import { JsonUtil } from "../../util/json-util";
import { OpenLinkType } from "../open/open-link-type";

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
        public LinkType: OpenLinkType = OpenLinkType.PROFILE,
        public readonly Owner: OpenMemberStruct = new OpenMemberStruct(),
        public Description: string = '',
        public CoverURL: string = ''
        ) {
        
    }

    fromJson(rawData: any): void {
        this.LinkId = JsonUtil.readLong(rawData['li']);
        this.OpenToken = rawData['otk'];
        this.LinkName = rawData['ln'];
        this.LinkURL = rawData['lu'];

        this.LinkType = rawData['lt'];

        this.Owner.fromJson(rawData['olu']);

        this.Description = rawData['desc'];
        this.CoverURL = rawData['liu'];
    }
    
    toJson() {
        let obj: any = {
            'li': this.LinkId,
            'otk': this.OpenToken,
            'ln': this.LinkName,
            'lu': this.LinkURL,
            'lt': this.LinkType,
            'olu': this.Owner.toJson(),
            'desc': this.Description,
            'liu': this.CoverURL
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
        public MemberType: number = 0,
        public OpenChatToken: number = 0
    ) {

    }

    fromJson(rawData: any): void {
        this.UserId = JsonUtil.readLong(rawData['userId']);
        this.NickName = rawData['nn'];
        this.ProfileImageUrl = rawData['pi'] || rawData['profileImageUrl'] || '';
        this.OriginalProfileImageUrl = rawData['opi'] || rawData['originalProfileImageUrl'] || '';
        this.FullProfileImageUrl = rawData['fpi'] || rawData['fullProfileImageUrl'] || '';
        this.MemberType = rawData['lmt'];
        this.OpenChatToken = rawData['opt'];
    }
    
    toJson() {
        let obj: any = {
            'userId': this.UserId,
            'nn': this.NickName,
            'pi': this.ProfileImageUrl,
            'opi': this.OriginalProfileImageUrl,
            'fpi': this.FullProfileImageUrl,
            'lmt': this.MemberType,
            'opt': this.OpenChatToken
        };

        return obj;
    }
}