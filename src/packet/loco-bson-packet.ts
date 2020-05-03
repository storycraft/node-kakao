import * as Bson from "bson";
import { LocoRequestPacket, LocoResponsePacket, StatusCode } from "./loco-packet-base";
import { EventEmitter } from "events";
import { promises } from "dns";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class LocoBsonRequestPacket implements LocoRequestPacket {

    private resolveList: ((packet: any) => void)[] = [];

    get StatusCode(): StatusCode {
        return StatusCode.SUCCESS;
    }

    abstract get PacketName(): string;

    get BodyType() {
        return 0;
    }
    
    abstract toBodyJson(): any;

    writeBody() {
        return Bson.serialize(this.toBodyJson());
    }

    onResponse<T extends LocoResponsePacket>(packet: T) {
        this.resolveList.forEach(resolve => resolve(packet));
        this.resolveList = [];
    }

    submitResponseTicket<T extends LocoResponsePacket>(): Promise<T> {
        let promise = new Promise<T>((resolve, reject) => { this.resolveList.push(resolve) });
        return promise;
    }

}

export abstract class LocoBsonResponsePacket implements LocoResponsePacket {

    constructor(private headerStatus: number, private status: number = 0) {
        
    }

    get StatusCode(): StatusCode {
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

        this.status = json['status'] || StatusCode.SUCCESS;

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