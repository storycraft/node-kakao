/*
 * Created on Fri Jun 12 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkType } from "./open-link-type";

export interface OpenLinkSettings {

    linkName: string;
    linkType: OpenLinkType;

    maxUser?: number;
    maxChannelLimit?: number;

    passcode?: string; // '' === passcode disabled
    canSearchLink: boolean;

    description: string;
    linkURL: string;
    linkCoverURL: string;

}