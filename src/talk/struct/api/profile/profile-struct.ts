/*
 * Created on Fri May 22 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "../../struct-base";

export interface ProfileFeed extends StructBase {

    id: string;
    serviceName: string;
    typeIconUrl: string;
    downloadId: string;
    contents: Array<{ type: string, value: string }>;
    url: string;
    serviceUrl: string;
    webUrl: string;
    serviceWebUrl: string;
    updatedAt: number;
    cursor: number;
    feedMessage: string;
    permission: number;
    type: number;
    isCurrent: boolean;
    extra: {};

}

export interface ProfileFeedList extends StructBase {

    totalCnts: number;
     feeds: ProfileFeed[];

}

export interface ProfileStruct extends StructBase {

    backgroundImageUrl: string;
    originalBackgroundImageUrl: string;

    statusMessage: string;

    profileImageUrl: string;
    fullProfileImageUrl: string;
    originalProfileImageUrl: string;

    decoration: [];

    profileFeeds: ProfileFeedList;
    backgroundFeeds: ProfileFeedList;

    allowStory: boolean;
    allowStoryPost: boolean;
    hasProfile2Photos: boolean;
    allowPay: boolean;

    screenToken: number;

}