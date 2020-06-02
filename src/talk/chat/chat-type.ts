/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum ChatType {
    
    Unknown = -1,
    Feed = 0,
    Text = 1,
    Photo = 2,
    Video = 3,
    Contact = 4,
    Audio = 5,
    DitemEmoticon = 6,
    DitemGift = 7,
    DitemImg = 8,
    KakaoLinkV1 = 9,
    Avatar = 11,
    Sticker = 12,
    Schedule = 13,
    Vote = 14,
    Lottery = 15,
    Map = 16,
    Profile = 17,
    File = 18,
    StickerAni = 20,
    Nudge = 21,
    Actioncon = 22,
    Search = 23,
    Post = 24,
    Reply = 26,
    MultiPhoto = 27,
    Voip = 51,
    LiveTalk = 52,
    Custom = 71,
    Alim = 72,
    PlusFriend = 81,
    PlusEvent = 82,
    PlusFriendViral = 83,
    OpenVote = 97,
    OpenPost = 98,

}

export namespace MessageTypeOffset {

    export const DELETED_MESSAGE_OFFSET = 16384;

}