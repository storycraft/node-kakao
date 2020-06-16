/*
 * Created on Mon Jun 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkManager } from "../open/open-link-manager";
import { OpenUserInfo, OpenKickedUserInfo } from "../user/chat-user";
import { Long } from "bson";
import { OpenMemberStruct, OpenLinkStruct, OpenKickedMemberStruct, OpenLinkReactionInfo } from "../struct/open/open-link-struct";
import { OpenLinkChannel, OpenLinkProfile, OpenLink } from "../open/open-link";
import { RequestResult } from "../request/request-result";


export class ManagedOpenUserInfo implements OpenUserInfo {

    constructor(private manager: OpenLinkManager, private linkId: Long | null, private openToken: number, private memberStruct: OpenMemberStruct) {

    }

    get Client() {
        return this.manager.Client;
    }

    get Id() {
        return this.memberStruct.userId;
    }

    get Nickname() {
        return this.memberStruct.nickname;
    }

    get ProfileLinkId() {
        return this.linkId;
    }

    get ProfileOpenToken() {
        return this.openToken;
    }

    get ProfileType() {
        return this.memberStruct.profileType;
    }

    get MemberType() {
        return this.memberStruct.memberType;
    }

    get ProfileImageURL() {
        return this.memberStruct.profileImageUrl;
    }

    get FullProfileImageURL() {
        return this.memberStruct.fullProfileImageUrl;
    }

    get OriginalProfileImageURL() {
        return this.memberStruct.originalProfileImageUrl;
    }

    async getOpenLink() {
        if (!this.linkId) return null;
        
        return this.manager.get(this.linkId) as Promise<OpenLinkProfile>;
    }

    isOpenUser(): true {
        return true;
    }

    hasOpenProfile() {
        return !!this.linkId;
    }

    updateStruct(memberStruct: OpenMemberStruct) {
        this.memberStruct = memberStruct;
    }

}

export class ManagedOpenKickedUserInfo implements OpenKickedUserInfo {

    constructor(private manager: OpenLinkManager, private kickedMemberStruct: OpenKickedMemberStruct) {
        
    }

    get Client() {
        return this.manager.Client;
    }
    
    get Id() {
        return this.kickedMemberStruct.userId;
    }
    
    get Nickname() {
        return this.kickedMemberStruct.nickname;
    }
    
    get KickedChannelId() {
        return this.kickedMemberStruct.kickedChannelId;
    }

    get ProfileImageURL() {
        return this.kickedMemberStruct.profileImageUrl;
    }

    get FullProfileImageURL() {
        return this.kickedMemberStruct.profileImageUrl;
    }

    get OriginalProfileImageURL() {
        return this.kickedMemberStruct.profileImageUrl;
    }

    isOpenUser(): boolean {
        return false;
    }

}

export class ManagedOpenLink implements OpenLink<ManagedOpenUserInfo>, OpenLinkChannel, OpenLinkProfile {

    private userInfo: ManagedOpenUserInfo;
    
    constructor(private manager: OpenLinkManager, private linkId: Long, private openToken: number, private linkStruct: OpenLinkStruct) {
        this.userInfo = new ManagedOpenUserInfo(manager, linkStruct.owner.linkId || null, linkStruct.owner.openToken, linkStruct.owner);
    }

    get LinkId() {
        return this.linkId;
    }

    get OpenToken() {
        return this.openToken;
    }

    get LinkName() {
        return this.linkStruct.linkName;
    }

    get LinkType() {
        return this.linkStruct.linkType;
    }

    get LinkURL() {
        return this.linkStruct.linkURL;
    }

    get LinkCoverURL() {
        return this.linkStruct.linkCoverURL;
    }

    get Description() {
        return this.linkStruct.description;
    }

    get Searchable() {
        return this.linkStruct.canSearchLink;
    }
    
    get TagList() {
        return []; // TODO
    }

    get CreatedAt() {
        return this.linkStruct.createdAt;
    }

    get Activated() {
        return this.linkStruct.activated;
    }

    get MaxUserLimit() {
        return this.linkStruct.maxUserLimit || 0;
    }

    get MaxChannelLimit() {
        return this.linkStruct.maxChannelLimit || 0;
    }

    get LinkOwnerInfo() {
        return this.userInfo;
    }

    async requestReactionInfo(): Promise<RequestResult<OpenLinkReactionInfo>> {
        return this.manager.requestReactionInfo(this.linkId);
    }

    updateStruct(linkStruct: OpenLinkStruct) {
        this.linkStruct = linkStruct;
        this.userInfo.updateStruct(linkStruct.owner);
    }

}