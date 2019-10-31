import { ChatroomType } from "../chat/chatroom-type";
import { JsonUtil } from "../../util/json-util";
import { StructBase } from "./struct-base";

/*
 * Created on Thu Oct 31 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChatDataStruct implements StructBase {

    constructor(
        public Id: number = 0,
        public Type: ChatroomType = ChatroomType.GROUP,
        public MemberCount: number = 0,
        public PushAlert: boolean = false,
        public Metadata: ChatDataMetaStruct | null = null
    ) {

    }

    fromJson(rawData: any) {
        let data = new ChatDataStruct();

        data.Id = JsonUtil.readLong(rawData['c']);
        data.Type = rawData['t'];
        data.MemberCount = rawData['a'];
        data.PushAlert = rawData['p'];
        data.Metadata = null;

        if (rawData['m']) {
            data.Metadata = new ChatDataMetaStruct().fromJson(rawData['m']);
        }

        return data;
    }

    toJson() {
        let obj: any = {
            'c': this.Id,
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