import { ChatroomType } from "../chat/chatroom-type";
import { StructBase } from "./struct-base";
import { JsonUtil } from "../../util/json-util";
import { Long } from "bson";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatDataStruct implements StructBase {

    constructor(
        public ChannelId: Long = Long.ZERO,
        public Type: ChatroomType = ChatroomType.GROUP,
        public MemberCount: number = 0,
        public PushAlert: boolean = false,
        public readonly Metadata: ChatDataMetaStruct = new ChatDataMetaStruct(),
        public OpenToken: number = -1
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

        if (this.Type == ChatroomType.OPENCHAT_DIRECT || this.Type == ChatroomType.OPENCHAT_GROUP) {
            this.OpenToken = rawData['otk'];
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