import { Long } from "bson";
import { Serializer } from "json-proxy-mapper";
import { ChannelDataStruct } from "../talk/struct/channel-data-struct";
import { JsonUtil } from "../util/json-util";
import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";

/*
 * Created on Fri Oct 18 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketLoginReq extends LocoBsonRequestPacket {

    constructor(
        public DeviceUUID: string = '',
        public OAuthToken: string = '',
        public Appver: string = '',
        public Os: string = '',
        public DeviceType: number = 0,
        public NetType: number = 0,
        public NetworkMccMnc: string = '',
        public Language: string = '',
        public Revision: number = 0, //Always 0 since I didnt implement revision data and dunno what
        public RevisionData: null | Buffer = null, // idk
        public ChannelIdList: Long[] = [],
        public MaxIdList: Long[] = [],
        public LastTokenId: Long = Long.ZERO,
        public LastChatId: Long = Long.ZERO,
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
            'dtype': this.DeviceType,
            'ntype': this.NetType,
            'MCCMNC': this.NetworkMccMnc,
            'revision': this.Revision,
            'rp': null,
            'chatIds': this.ChannelIdList,
            'maxIds': this.MaxIdList,
            'lastTokenId': this.LastTokenId,
            'lbk': this.Lbk,
            'bg': this.Bg
        };

        if (this.LastChatId !== Long.ZERO) {
            obj['lastChatId'] = this.LastChatId;
        }

        return obj;
    }
}

export class PacketLoginRes extends LocoBsonResponsePacket {

    constructor(
        status: number,
        public UserId: Long = Long.ZERO,
        public Revision: number = 0,
        public OpenChatToken: number = 0,
        public RevisionDetail: string = '',
        public ChatDataList: ChannelDataStruct[] = []
    ) {
        super(status);

    }
    
    get PacketName() {
        return 'LOGINLIST';
    }

    readBodyJson(body: any) {
        this.UserId = JsonUtil.readLong(body['userId']);
        this.Revision = body['revision'];
        this.RevisionDetail = body['revisionInfo'];
        this.OpenChatToken = body['ltk'];
        
        this.ChatDataList = [];
        if (body['chatDatas']) {
            let chatDataList: any[] = body['chatDatas'];

            for (let rawChatData of chatDataList) {
                this.ChatDataList.push(Serializer.deserialize<ChannelDataStruct>(rawChatData, ChannelDataStruct.MAPPER));
            }
        }
    }
}