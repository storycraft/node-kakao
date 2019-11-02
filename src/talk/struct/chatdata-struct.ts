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
        public ChannelId: Long = Long.fromNumber(0),
        public Type: ChatroomType = ChatroomType.GROUP,
        public MemberCount: number = 0,
        public PushAlert: boolean = false,
        public Metadata: ChatDataMetaStruct | null = null
    ) {

    }

    fromJson(rawData: any) {
        this.ChannelId = JsonUtil.readLong(rawData['c']);
        this.Type = rawData['t'];
        this.MemberCount = rawData['a'];
        this.PushAlert = rawData['p'];
        this.Metadata = null;

        if (rawData['m']) {
            this.Metadata = new ChatDataMetaStruct().fromJson(rawData['m']);
        }
    }

    toJson() {
        let obj: any = {
            'c': this.ChannelId,
            't': this.Type,
            'a': this.MemberCount,
            'p': this.PushAlert
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

        return data;
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