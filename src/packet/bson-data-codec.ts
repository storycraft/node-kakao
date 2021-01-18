/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import * as Bson from "bson";
import { LocoPacketDataCodec } from "../packet_old/loco-packet";

export const BsonDataCodec: LocoPacketDataCodec<Record<string, any>> = {
    canDecode(dataType: number): boolean {
        return dataType == 0;
    },

    decode(data: ArrayBuffer): Record<string, any> {
        return Bson.deserialize(Buffer.from(data), {
            promoteLongs: false
        });
    },

    encode(data: Record<string, any>): [number, ArrayBuffer] {
        return [0, Bson.serialize(data)];
    }

}