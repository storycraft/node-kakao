/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { CommandSession, LocoSession, SessionFactory } from "./network/request-session";
import { ChannelUser } from "./user/channel-user";
import { DefaultReq, DefaultRes } from "./packet/bson-data-codec";
import { TalkChannelList } from "./talk/channel/talk-channel-list";
import { Managed } from "./talk/managed";
import { OAuthCredential } from "./oauth/credential";
import { AsyncCommandResult } from "./request/command-result";
import { ClientConfig, ClientConfigProvider, DefaultConfiguration } from "./config/client-config-provider";
import { Long } from ".";
import { ClientSession, LoginResult } from "./client/client-session";
import { TalkSessionFactory } from "./talk/network/talk-session-factory";
import { TalkClientSession } from "./talk/client/talk-client-session";
import { TypedEmitter } from 'tiny-typed-emitter';
import { ClientEvents } from "./event/events";
import { KickoutRes } from "./packet/chat/kickout";
import { EventContext } from "./event/event-context";
import { ClientStatus } from "./client-status";

/**
 * Talk client session with client user
 */
export interface TalkSession extends CommandSession {

    readonly clientUser: Readonly<ChannelUser>;

}

/**
 * Simple client implementation.
 */
export class TalkClient extends TypedEmitter<ClientEvents> implements CommandSession, ClientSession, Managed<ClientEvents> {

    private _session: LocoSession | null;

    /**
     * Ping request interval. (Default = 900000 (15 min))
     */
    public pingInterval: number;

    private _clientSession: TalkClientSession;

    private _cilentUser: ChannelUser;

    private _channelList: TalkChannelList;

    constructor(config: Partial<ClientConfig> = {}, private _sessionFactory: SessionFactory = new TalkSessionFactory()) {
        super();

        this.pingInterval = 900000;

        this._session = null;
        this._clientSession = new TalkClientSession(this.createSessionProxy(), new ClientConfigProvider(Object.assign(DefaultConfiguration, config)));

        this._channelList = new TalkChannelList(this.createSessionProxy());

        this._cilentUser = { userId: Long.ZERO };
    }

    get configProvider() {
        return this._clientSession.configProvider;
    }
    
    get channelList() {
        if (!this.logon) throw 'Cannot access without logging in';

        return this._channelList!;
    }
    
    get cilentUser() {
        if (!this.logon) throw 'Cannot access without logging in';

        return this._cilentUser;
    }

    get logon() {
        return this._session != null;
    }

    private get session() {
        if (this._session == null) throw 'Session is not created';

        return this._session;
    }

    async login(credential: OAuthCredential): AsyncCommandResult<LoginResult> {
        if (this.logon) throw 'Already logon';

        // Create session
        const sessionRes = await this._sessionFactory.createSession(this.configProvider.configuration);
        if (!sessionRes.success) return sessionRes;
        this._session = sessionRes.result;
        this.listen();

        const loginRes = await this._clientSession.login(credential);
        if (!loginRes.success) return loginRes;

        this.addPingHandler();
        
        this._channelList = await TalkChannelList.initialize(this.createSessionProxy(), loginRes.result.channelList)
        this._cilentUser = { userId: loginRes.result.userId };

        return { status: loginRes.status, success: true, result: loginRes.result };
    }

    setStatus(status: ClientStatus) {
        return this._clientSession.setStatus(status);
    }

    /**
     * Returns true if client user.
     * 
     * @param user Target user to compare
     */
    isClientUser(user: ChannelUser) {
        return user.userId.equals(this._cilentUser.userId);
    }

    /**
     * End session
     */
    close() {
        this.session.close();
    }

    pushReceived(method: string, data: DefaultRes): void {
        const ctx = new EventContext<ClientEvents>(this);

        this._channelList.pushReceived(method, data, ctx);

        switch (method) {

            case 'KICKOUT': {
                super.emit('disconnected', (data as DefaultRes & KickoutRes).reason);
                break;
            }

            case 'CHANGESVR': {
                super.emit('switch_server');
                break;
            }

        }
    }
    
    /**
     * Create proxy that can be used safely without exposing client
     */
    createSessionProxy(): TalkSession {
        return {
            request: (method, data) => this.request(method, data),
            get clientUser() {
                return this.clientUser;
            }
        }
    }

    request<T = DefaultRes>(method: string, data: DefaultReq): Promise<DefaultRes & T> {
        return this.session.request<T>(method, data);
    }

    private listenEnd() {
        if (this._session) this._session = null;
    }

    private onError(err: any) {
        super.emit('error', err);

        if (this.listeners('error').length > 0) {
            this.listen();
        } else {
            this.close();
        }
    }

    private listen() {
        (async () => {
            for await (const { method, data, push } of this.session.listen()) {
                if (push) {
                    this.pushReceived(method, data);
                }                
            }
        })().then(this.listenEnd.bind(this)).catch(this.onError.bind(this));
    }

    private addPingHandler() {
        const pingHandler = () => {
            if (!this.logon) return;

            this.session.request('PING', {});
            setTimeout(pingHandler, this.pingInterval);
        };
        pingHandler();
    }

}