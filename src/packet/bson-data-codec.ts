/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as Bson from "bson";
import { LocoPacketDataCodec } from "./loco-packet";

export interface DefaultReq {

    [key: string]: any;

};

export interface DefaultRes {

    status: number;
    [key: string]: any;

};

export const BsonDataCodec: LocoPacketDataCodec<DefaultReq, DefaultRes> = {
    canDecode(dataType: number): boolean {
        return dataType == 0 || dataType == 8;
    },

    decode(data: ArrayBuffer): DefaultRes {
        return Bson.deserialize(Buffer.from(data), {
            promoteLongs: false
        });
    },

    encode(data: DefaultReq): [number, ArrayBuffer] {
        return [0, Bson.serialize(data)];
    }

}