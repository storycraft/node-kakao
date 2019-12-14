/*
 * Created on Sat Dec 14 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum FeedType {

    UNDEFINED = -999999,
    LOCAL_LEAVE = -1,
    INVITE = 1,
    LEAVE = 2,
    SECRET_LEAVE = 3,
    OPENLINK_JOIN = 4,
    OPENLINK_DELETE_LINK = 5,
    OPENLINK_KICKED = 6,
    CHAT_KICKED = 7,
    CHAT_DELETED = 8,
    RICH_CONTENT = 10,
    OPENLINK_STAFF_ON = 11,
    OPENLINK_STAFF_OFF = 12,
    OPENLINK_REWRITE_FEED = 13,
    DELETE_TO_ALL = 14,
    OPENLINK_HAND_OVER_HOST = 14,

}