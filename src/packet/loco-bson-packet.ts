import * as Bson from "bson";
import { LocoRequestPacket, LocoResponsePacket } from "./loco-packet-base";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class LocoBsonRequestPacket implements LocoRequestPacket {

    get StatusCode() {
        return 0;
    }

    abstract get PacketName(): string;

    get BodyType() {
        return 0;
    }
    
    abstract toBodyJson(): any;

    writeBody() {
        return Bson.serialize(this.toBodyJson());
    }

}

export abstract class LocoBsonResponsePacket implements LocoResponsePacket {

    constructor(private status: number) {

    }

    get StatusCode() {
        return this.status;
    }

    abstract get PacketName(): string;

    get BodyType() {
        return 0;
    }

    abstract readBodyJson(body: any): void;

    readBody(buffer: Buffer) {
        this.readBodyJson(Bson.deserialize(buffer));
    }

}