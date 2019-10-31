import { KakaoAPI } from "../kakao-api";
import * as BSON from "bson";
import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { ChatDataStruct } from "../talk/struct/chatdata-struct";

/*
 * Created on Fri Oct 18 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketLoginReq extends LocoBsonRequestPacket {

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

export class PacketLoginRes extends LocoBsonResponsePacket {

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
                this.ChatDataList.push(new ChatDataStruct().fromJson(rawChatData));
            }
        }
    }
}