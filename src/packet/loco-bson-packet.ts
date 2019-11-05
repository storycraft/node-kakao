import * as Bson from "bson";
import { LocoRequestPacket, LocoResponsePacket } from "./loco-packet-base";
import { EventEmitter } from "events";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class LocoBsonRequestPacket extends EventEmitter implements LocoRequestPacket {

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

    on<T extends LocoResponsePacket>(event: 'response' | string, listener: (packet: T) => void): this;

    on(event: string, listener: (...args: any[]) => void) {
        return super.on(event, listener);
    }

    once<T extends LocoResponsePacket>(event: 'response' | string, listener: (packet: T) => void): this;

    once(event: string, listener: (...args: any[]) => void) {
        return super.once(event, listener);
    }

}

export abstract class LocoBsonResponsePacket implements LocoResponsePacket {

    constructor(private headerStatus: number, private status: number = 0) {
        
    }

    get StatusCode() {
        return this.status;
    }

    get HeaderStatus() {
        return this.headerStatus;
    }

    abstract get PacketName(): string;

    get BodyType() {
        return 0;
    }

    abstract readBodyJson(body: any): void;

    readBody(buffer: Buffer) {
        let json = Bson.deserialize(buffer, {
            promoteLongs: false
        });

        this.status = json['status'] || 0;

        this.readBodyJson(json);
    }

}

export class DefaultBsonRequestPacket extends LocoBsonRequestPacket {

    private packetName: string;
    
    private content: any;

    constructor(packetName: string, content: any = {}) {
        super();

        this.packetName = packetName;
        this.content = content;
    }

    get PacketName() {
        return this.packetName;
    }

    toBodyJson() {
        return this.content;
    }

}

export class DefaultBsonResponsePacket extends LocoBsonResponsePacket {

    private packetName: string;
    
    private content: any;

    constructor(headerStatus: number, packetName: string) {
        super(headerStatus);

        this.packetName = packetName;
        this.content = {};
    }

    get PacketName() {
        return this.packetName;
    }

    readBodyJson(rawJson: any) {
        this.content = rawJson;
    }

}