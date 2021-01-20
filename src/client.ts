/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { CommandSession, LocoSession } from "./network/request-session";
import { ChannelUser } from "./user/channel-user";
import { DefaultReq, DefaultRes } from "./packet/bson-data-codec";
import { TalkChannelList } from "./talk/channel/talk-channel-list";
import { Managed } from "./talk/managed";
import { OAuthCredential } from "./oauth/credential";
import * as NetSocket from "./network/socket/net-socket";
import { CommandResult } from "./request/command-result";
import { BookingConfig, CheckinConfig, ClientConfig, ClientConfigProvider, DefaultClientConfigProvider, DefaultConfiguration, LocoLoginConfig } from "./config/client-config-provider";
import { getBookingData, getCheckinData } from "./network/util/loco-entrance";
import { newCryptoStore } from "./crypto/crypto-store";
import { LocoSecureLayer } from "./network/loco-secure-layer";
import { KnownDataStatusCode } from "./packet/status-code";
import { Stream } from "./network/stream";
import { Long } from ".";
import { ClientSession, ClientSessionOp } from "./client/client-session";

/**
 * Simple client implementation.
 */
export class TalkClient implements CommandSession, ClientSessionOp, Managed {

    private _session: LocoSession;
    private _clientSession: ClientSession;

    private _cilentUser: ChannelUser;

    private _logon: boolean;

    private _channelList: TalkChannelList;

    constructor(stream: Stream, config: ClientConfig) {
        this._session = new LocoSession(stream);
        this._clientSession = new ClientSession(this.createSessionProxy(), new DefaultClientConfigProvider(config));

        this._channelList = new TalkChannelList(this.createSessionProxy());

        this._cilentUser = { userId: Long.ZERO };

        this._logon = false;
    }

    get configProvider() {
        return this._clientSession.configProvider;
    }

    set configProvider(configProvider) {
        this._clientSession.configProvider = configProvider;
    }
    
    get channelList() {
        return this._channelList;
    }
    
    get cilentUser() {
        if (!this._logon) throw 'Cannot access without logging in';

        return this._cilentUser;
    }

    get logon() {
        return this._logon;
    }

    async login(credential: OAuthCredential) {
        if (this._logon) throw 'Already logon';

        this.listen();

        const loginRes = await this._clientSession.login(credential);
        if (!loginRes.success) return { status: loginRes.status, success: false };

        for (const channel of loginRes.result) {
            // TODO: Do something to channel list
        }

        return { status: loginRes.status, success: true, result: loginRes.result };
    }

    /**
     * Logout and end session.
     */
    close() {
        this._session.close();
    }

    pushReceived(method: string, data: DefaultRes): void {
        this._channelList.pushReceived(method, data);
        
        if (method === 'KICKOUT') {
            // TODO
        }
    }
    
    /**
     * Create proxy that can be used safely without exposing client
     */
    createSessionProxy(): CommandSession {
        return {
            request: (method, data) => this.request(method, data)
        }
    }

    request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T> {
        return this._session.request<T>(method, data);
    }

    private listenEnd() {
        if (this._logon) this._logon = false;
    }

    private listen() {
        (async () => {
            for await (const [pushMethod, pushData] of this._session.listen()) {
                this.pushReceived(pushMethod, pushData);
            }
        })().then(this.listenEnd.bind(this));
    }

    /**
     * Create loco stream and TalkClient.
     * Returns TalkClient as result on success.
     * 
     * @param config 
     */
    static async createClient(config: Partial<LocoLoginConfig & ClientConfig> = {}): Promise<CommandResult<TalkClient>> {
        const clientConfig = Object.assign(DefaultConfiguration, config);

        const streamRes = await TalkClient.createLocoStream(clientConfig);
        if (!streamRes.success) return { success: false, status: streamRes.status };

        return { status: KnownDataStatusCode.SUCCESS, success: true, result: new TalkClient(streamRes.result, clientConfig) };
    }

    /**
     * Create loco stream.
     * 
     * @param config 
     */
    static async createLocoStream(config: BookingConfig & CheckinConfig & LocoLoginConfig): Promise<CommandResult<Stream>> {
        const bookingStream = await NetSocket.createTLSSocket({
            host: config.locoBookingURL,
            port: config.locoBookingPort,
            keepAlive: false
        });
    
        const bookingRes = await getBookingData(bookingStream, config);
        if (!bookingRes.success) return { status: bookingRes.status, success: false };

        const checkinStream = new LocoSecureLayer(await NetSocket.createTCPSocket({
            host: bookingRes.result.ticket.lsl[0],
            port: bookingRes.result.wifi.ports[0],
            keepAlive: false
        }), newCryptoStore(config.locoPEMPublicKey));
        
        const checkinRes = await getCheckinData(checkinStream, config);
        if (!checkinRes.success) return { status: checkinRes.status, success: false };

        const locoStream = new LocoSecureLayer(await NetSocket.createTCPSocket({
            host: checkinRes.result.host,
            port: checkinRes.result.port,
            keepAlive: true
        }), newCryptoStore(config.locoPEMPublicKey));

        return { status: KnownDataStatusCode.SUCCESS, success: true, result: locoStream };
    }

}