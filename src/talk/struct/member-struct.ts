import { StructBase } from "./struct-base";
import { UserType } from "../user/user-type";
import { JsonUtil } from "../../util/json-util";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class MemberStruct implements StructBase {

    constructor(
        public UserId: number = 0,
        public NickName: string = '',
        public ProfileImageUrl: string = '',
        public OriginalProfileImageUrl: string = '',
        public FullProfileImageUrl: string = '',
        public Type: UserType = UserType.Undefined,
        public AccountId: number = 0,
        public LinkedService: string = '',
        public StatusMessage: string = ''
    ) {

    }

    fromJson(rawData: any): void {
        this.UserId = JsonUtil.readLong(rawData['userId']);
        this.NickName = rawData['nickName'];
        this.ProfileImageUrl = rawData['pi'] || '';
        this.OriginalProfileImageUrl = rawData['opi'] || '';
        this.FullProfileImageUrl = rawData['fpi'] || '';
        this.Type = rawData['type'];
        this.AccountId = rawData['accountId'];
        this.LinkedService = rawData['linkedService'] || '';
        this.StatusMessage = rawData['statusMessage'] || '';
    }
    
    toJson() {
        let obj: any = {
            'userId': JsonUtil.writeLong(this.UserId),
            'nickName': this.NickName,
            'profileImageUrl': this.ProfileImageUrl,
            'originalProfileImageUrl': this.OriginalProfileImageUrl,
            'fullProfileImageUrl': this.FullProfileImageUrl,
            'type': this.Type,
            'accountId': this.AccountId
        };

        if (this.LinkedService !== '') {
            obj['linkedService'] = this.LinkedService
        }

        if (this.StatusMessage !== '') {
            obj['statusMessage'] = this.StatusMessage;
        }

        return obj;
    }


}
