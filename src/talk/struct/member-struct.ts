import { StructBase } from "./struct-base";
import { UserType } from "../user/user-type";
import { JsonUtil } from "../../util/json-util";
import { Long } from "bson";
import { OpenMemberType } from "../open/open-member-type";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class MemberStruct implements StructBase {

    constructor(
        public UserId: Long = Long.ZERO,
        public NickName: string = '',
        public ProfileImageUrl: string = '',
        public OriginalProfileImageUrl: string = '',
        public FullProfileImageUrl: string = '',
        public Type: UserType = UserType.Undefined,
        public AccountId: number = 0,
        public LinkedService: string = '',
        public StatusMessage: string = '',
        public OpenChatToken: number = 0,
        public OpenChatMemberType: OpenMemberType = OpenMemberType.NONE,
        public ProfileLinkId: Long = Long.ZERO
    ) {

    }

    fromJson(rawData: any): void {
        this.UserId = JsonUtil.readLong(rawData['userId']);
        this.NickName = rawData['nickName'];
        this.ProfileImageUrl = rawData['pi'] || rawData['profileImageUrl'] || '';
        this.OriginalProfileImageUrl = rawData['opi'] || rawData['originalProfileImageUrl'] || '';
        this.FullProfileImageUrl = rawData['fpi'] || rawData['fullProfileImageUrl'] || '';
        this.Type = rawData['type'] || UserType.Undefined;
        this.AccountId = rawData['accountId'] || 0;
        this.LinkedService = rawData['linkedService'] || '';
        this.StatusMessage = rawData['statusMessage'] || '';

        this.OpenChatToken = rawData['opt'] || 0;
        this.ProfileLinkId = rawData['pli'] || Long.ZERO;
        this.OpenChatMemberType = rawData['mt'] || OpenMemberType.NONE;
    }
    
    toJson() {
        let obj: any = {
            'userId': this.UserId,
            'nickName': this.NickName,
            'pi': this.ProfileImageUrl,
            'opi': this.OriginalProfileImageUrl,
            'fpi': this.FullProfileImageUrl,
            'type': this.Type,
            'accountId': this.AccountId
        };

        if (this.LinkedService !== '') {
            obj['linkedService'] = this.LinkedService
        }

        if (this.StatusMessage !== '') {
            obj['statusMessage'] = this.StatusMessage;
        }

        if (this.OpenChatToken !== 0) {
            obj['opt'] = this.OpenChatToken;
            obj['mt'] = this.OpenChatMemberType;
        }

        if (this.ProfileLinkId !== Long.ZERO) {
            obj['pli'] = this.ProfileLinkId;
        }

        return obj;
    }


}
