/*
 * Created on Fri May 01 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum OpenLinkType {

    PROFILE = 1,
    CHANNEL = 2

}

export enum OpenMemberType {

    OWNER = 1,
    NONE = 2,
    MANAGER = 4,
    BOT = 8

}

export enum OpenProfileType {

    MAIN = 1,
    KAKAO_ANON = 2,
    KAKAO_ANON_2 = 4,
    UNKNOWN_1 = 8,
    OPEN_PROFILE = 16

}

export enum OpenChannelType {

    UNKNOWN = 0,
    DIRECT = 1,
    GROUP = 2
    
}
