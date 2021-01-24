/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { OpenLinkType } from "./open-link-type";
import { OpenLinkUserInfo } from "./open-link-user-info";

export interface OpenLinkComponent {

    /**
     * OpenLink id
     */
    linkId: Long;

}

export interface OpenTokenComponent {

    /**
     * Info last update time
     */
    openToken: number;

}

export interface OpenPrivilegeComponent {

    /**
     * Special privilege masks
     */
    privilege: LinkPrivilegeMask;

}

/**
 * Contains openlink information
 */
export interface OpenLink extends OpenLinkComponent, OpenTokenComponent, OpenPrivilegeComponent {

    /**
     * Link type
     */
    type: OpenLinkType;

    linkName: string;

    openToken: number;
    
    linkType: OpenLinkType;

    linkURL: string;

    linkCoverURL: string;

    linkOwner: OpenLinkUserInfo;

    description: string;
    tagList: string[];

    searchable: boolean;

    createdAt: number;

    activated: boolean;

}

export enum KnownLinkPrivilegeMask {

    URL_SHARABLE = 2,
    REPORTABLE = 4,
    PROFILE_EDITABLE = 8,
    ANY_PROFILE_ALLOWED = 32,
    USE_PASS_CODE = 64,
    BLINDABLE = 128,
    NON_SPECIAL_LINK = 512,
    USE_BOT = 1024,

}

export type LinkPrivilegeMask = KnownLinkPrivilegeMask | number;