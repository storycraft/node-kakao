import * as Bson from "bson";
import { LocoRequestPacket, LocoResponsePacket, StatusCode } from "./loco-packet-base";
import { PromiseTicket } from "../ticket/promise-ticket";

/*
 * Created on Wed Oct 30 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class LocoBsonRequestPacket implements LocoRequestPacket {

    private ticketObj: PromiseTicket<any>;

    constructor() {
        this.ticketObj = new PromiseTicket();
    }

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
        this.ticketObj.resolve(packet);
    }

    submitResponseTicket<T extends LocoResponsePacket>(): Promise<T> {
        return this.ticketObj.createTicket();
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