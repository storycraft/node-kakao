/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenProfileType } from "../../../openlink/open-link-type";
import { OpenLinkChannelUserInfo } from "../../../openlink/open-link-user-info";
import { ChannelUserInfo, OpenChannelUserInfo } from "../../../user/channel-user-info";
import { UserType } from "../../../user/user-type";
import { NormalMemberStruct, OpenLinkChannelUserStruct, OpenLinkUserStruct, OpenMemberStruct } from "../user";

export class WrappedChannelUserInfo implements ChannelUserInfo {

    constructor(private _struct: NormalMemberStruct) {

    }
    
    get userId() {
        return this._struct.userId;
    }

    get nickname() {
        return this._struct.nickName;
    }

    get countryIso() {
        return this._struct.countryIso;
    }

    get userType() {
        return this._struct.type;
    }

    get profileURL() {
        return this._struct.profileImageUrl;
    }

    get fullProfileURL() {
        return this._struct.fullProfileImageUrl;
    }

    get originalProfileURL() {
        return this._struct.originalProfileImageUrl;
    }

    get statusMessage() {
        return this._struct.statusMessage;
    }

    get linkedServies() {
        return this._struct.linkedServices;
    }

    get ut() {
        return this._struct.ut;
    }

    get suspended() {
        return this._struct.suspended;
    }

}

export class WrappedOpenChannelUserInfo implements OpenChannelUserInfo {

    constructor(private _struct: OpenMemberStruct) {

    }
    
    
    get userId() {
        return this._struct.userId;
    }
    
    get userType() {
        return this._struct.type;
    }

    get nickname() {
        return this._struct.nickName;
    }

    get profileURL() {
        return this._struct.pi;
    }

    get fullProfileURL() {
        return this._struct.fpi;
    }

    get originalProfileURL() {
        return this._struct.opi;
    }

    get perm() {
        return this._struct.mt;
    }

    get linkId() {
        return this._struct.pli;
    }

    get openToken() {
        return this._struct.opt;
    }

}

export class WrappedOpenLinkChannelUserInfo implements OpenLinkChannelUserInfo {

    constructor(private _struct: OpenLinkChannelUserStruct) {

    }
    
    get userId() {
        return this._struct.userId;
    }
    
    get userType() {
        return UserType.OPEN_PROFILE;
    }

    get nickname() {
        return this._struct.nn;
    }

    get profileURL() {
        return this._struct.pi;
    }

    get fullProfileURL() {
        return this._struct.fpi;
    }

    get originalProfileURL() {
        return this._struct.opi;
    }

    get perm() {
        return this._struct.lmt;
    }

    get linkId() {
        return this._struct.pli;
    }

    get openToken() {
        return this._struct.opt;
    }

    get profileType() {
        return this._struct.ptp;
    }
    
    get privilege() {
        return this._struct.pv;
    }

}