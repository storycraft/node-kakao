import { ChannelType } from "../chat/channel-type";
import { StructBase } from "./struct-base";
import { JsonUtil } from "../../util/json-util";
import { Long } from "bson";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatDataBase {
    ChannelId: Long;
    Type: ChannelType;
    OpenLinkId: Long;
    OpenChatToken: number;
    readonly Metadata: ChatDataMetaStruct;
}

export class ChatDataStruct implements ChatDataBase, StructBase {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChannelType = ChannelType.GROUP,
        public OpenLinkId: Long = Long.ZERO,
        public OpenChatToken: number = -1,
        public MemberCount: number = 0,
        public PushAlert: boolean = false,
        public readonly Metadata: ChatDataMetaStruct = new ChatDataMetaStruct(),
    ) {

    }

    fromJson(rawData: any) {
        this.ChannelId = JsonUtil.readLong(rawData['c']);
        this.Type = rawData['t'];
        this.MemberCount = rawData['a'];
        this.PushAlert = rawData['p'];
        if (rawData['m']) {
            this.Metadata.fromJson(rawData['m']);
        }

        this.OpenLinkId = Long.ZERO;
        if (rawData['li']) {
            this.OpenLinkId = JsonUtil.readLong(rawData['li']);
        }

        this.OpenChatToken = -1;
        if (rawData['otk']) {
            this.OpenChatToken = rawData['otk'];
        }
    }

    toJson() {
        let obj: any = {
            'c': this.ChannelId,
            't': this.Type,
            'a': this.MemberCount,
            'p': this.PushAlert,
            'm': null
        };

        if (this.Metadata) {
            obj['m'] = this.Metadata.toJson();
        }

        if (this.OpenLinkId !== Long.ZERO) {
            obj['li'] = this.OpenLinkId;
        }

        this.OpenChatToken = -1;
        if (this.OpenChatToken !== -1) {
            obj['otk'] = this.OpenChatToken;
        }

        return obj;
    }

}

export class ChatDataMetaStruct implements StructBase {

    constructor(
        public ImageURL: string = '',
        public FullImageURL: string = '',
        public Name: string = '',
        public Favorite: boolean = false
    ) {

    }

    fromJson(rawData: any) {
        let data = new ChatDataMetaStruct();

        data.ImageURL = rawData['imageUrl'];
        data.FullImageURL = rawData['fullImageUrl'];
        data.Name = rawData['name'];
        data.Favorite = rawData['favorite'];
    }

    toJson() {
        return {
            'imageUrl': this.ImageURL,
            'fullImageUrl': this.FullImageURL,
            'name': this.Name,
            'favorite': this.Favorite
        };
    }

}