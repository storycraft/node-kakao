import { KakaoAPI } from "../kakao-api";
import * as BSON from "bson";
import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatroomType } from "../chat/chatroom-type";
import { JsonUtil } from "../util/json-util";

/*
 * Created on Fri Oct 18 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class LocoLoginReq extends LocoBsonRequestPacket {

    constructor(
        public DeviceUUID: string = '',
        public OAuthToken: string = '',
        public Appver: string = KakaoAPI.InternalAppVersion,
        public Os: string = KakaoAPI.Agent,
        public NetType: number = 0,
        public NetworkMccMnc: string = '',
        public Language: string = 'ko',
        public Revision: number = 0, //Always 0 since I didnt implement revision data and dunno what
        public RevisionData: null | Buffer = null, // idk
        public ChatIds: number[] = [],
        public MaxIds: number[] = [],
        public LastTokenId: number = 0,
        public LastChatId: number = 0,
        public Lbk: number = 0, // ?
        public Bg: boolean = false // background checking (maybe)
    ) {
        super();

    }
    
    get PacketName() {
        return 'LOGINLIST';
    }

    toBodyJson() {
        let obj: any = {
            'appVer': this.Appver,
            'prtVer': '1',
            'os': this.Os,
            'lang': this.Language,
            'duuid': this.DeviceUUID,
            'oauthToken': this.OAuthToken,
            'dtype': 1,
            'ntype': this.NetType,
            'MCCMNC': this.NetworkMccMnc,
            'revision': this.Revision,
            'rp': null,
            'chatIds': this.ChatIds,
            'maxIds': this.MaxIds,
            'lastTokenId': BSON.Long.fromNumber(this.LastTokenId),
            'lbk': this.Lbk,
            'bg': this.Bg
        };

        if (this.LastChatId !== 0) {
            obj.lastChatId = this.LastChatId;
        }

        return obj;
    }
}

export class LocoLoginRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public UserId: number = 0,
        public Revision: number = 0,
        public RevisionDetail: string = '',
        public ChatDataList: ChatDataStruct[] = []
    ) {
        super(status);

    }
    
    get PacketName() {
        return 'LOGINLIST';
    }

    readBodyJson(body: any) {
        this.UserId = body['userId'];
        this.Revision = body['revision'];
        this.RevisionDetail = body['revisionInfo'];
        this.ChatDataList = [];

        if (body['chatDatas']) {
            let chatDataList: any[] = body['chatDatas'];

            for (let rawChatData of chatDataList) {
                this.ChatDataList.push(ChatDataStruct.fromChatDataJson(rawChatData));
            }
        }
    }
}

export class ChatDataStruct {

    constructor(
        public Id: number = 0,
        public Type: ChatroomType = ChatroomType.GROUP,
        public MemberCount: number = 0,
        public PushAlert: boolean = false,
        public Metadata: ChatDataMetaStruct | null = null
    ) {

    }

    static fromChatDataJson(rawData: any) {
        let data = new ChatDataStruct();

        data.Id = JsonUtil.readLong(rawData['c']);
        data.Type = rawData['t'];
        data.MemberCount = rawData['a'];
        data.PushAlert = rawData['p'];

        if (rawData['m']) {
            data.Metadata = ChatDataMetaStruct.fromChatMetaJson(rawData['m']);
        }

        return data;
    }

}

export class ChatDataMetaStruct {

    constructor(
        public ImageURL: string = '',
        public FullImageURL: string = '',
        public Name: string = '',
        public Favorite: boolean = false
    ) {

    }

    static fromChatMetaJson(rawData: any) {
        let data = new ChatDataMetaStruct();

        data.ImageURL = rawData['imageUrl'];
        data.FullImageURL = rawData['fullImageUrl'];
        data.Name = rawData['name'];
        data.Favorite = rawData['favorite'];

        return data;
    }

}