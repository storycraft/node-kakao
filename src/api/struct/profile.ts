/*
 * Created on Fri May 22 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ProfileFeed {

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
  extra: unknown;

}

export interface ProfileFeedList {

  totalCnts: number;
  feeds: ProfileFeed[];

}

export interface ProfileDecoration {

  itemKind: string;
  itemId: string;
  parameters: { resourceUrl: string };

}

export interface BgEffectDecoration extends ProfileDecoration {

  itemKind: 'BgEffect';

}

export interface StickerDecoration extends ProfileDecoration {

  itemKind: 'Sticker';

  // position by percent
  x: number;
  y: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotation: number;

}

export interface ProfileStruct {

  backgroundImageUrl: string;
  originalBackgroundImageUrl: string;

  statusMessage: string;

  profileImageUrl: string;
  fullProfileImageUrl: string;
  originalProfileImageUrl: string;

  decoration: ProfileDecoration[];

  profileFeeds: ProfileFeedList;
  backgroundFeeds: ProfileFeedList;

  allowStory: boolean;
  allowStoryPost: boolean;
  hasProfile2Photos: boolean;
  allowPay: boolean;

  screenToken: number;

}

export interface ProfileReqStruct {

  profile: ProfileStruct;

  itemNewBadgeToken: number;
  lastSeenAt: number;

}
