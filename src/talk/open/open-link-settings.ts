/*
 * Created on Fri Jun 12 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkProfileContent, OpenProfileTemplates } from "./open-link-profile-template";

export interface OpenLinkSettings {

    linkName: string;
    linkCoverPath: string;

    maxUserLimit?: number;
    maxChannelLimit?: number;

    passcode?: string; // '' === passcode disabled
    canSearchLink: boolean;

    description: string;
    profileContent?: OpenLinkProfileContent;

    clientProfile: OpenProfileTemplates;

}