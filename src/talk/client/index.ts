/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { CommandSession, LocoSession, SessionFactory } from "../../network/request-session";
import { ChannelUser } from "../../user/channel-user";
import { DefaultReq, DefaultRes } from "../../packet/bson-data-codec";
import { Managed } from "../managed";
import { OAuthCredential } from "../../oauth/credential";
import { AsyncCommandResult } from "../../request";
import { ClientConfig, ClientConfigProvider, DefaultConfiguration } from "../../config/client-config-provider";
import { ClientSession, LoginResult } from "../../client/client-session";
import { TalkSessionFactory } from "../network/talk-session-factory";
import { TalkClientSession } from "../client/talk-client-session";
import { TypedEmitter } from 'tiny-typed-emitter';
import { KickoutRes } from "../../packet/chat/kickout";
import { EventContext } from "../../event/event-context";
import { ClientStatus } from "../../client-status";
import { OpenLinkService } from "../openlink/open-link-service";
import { TalkChannelList } from "../channel/talk-channel-list";
import { ClientEvents } from "../event/events";
import { Long } from "bson";

export * from "./talk-client-session";


/**
 * Talk client session with client user
 */
export interface TalkSession extends CommandSession {

    readonly clientUser: Readonly<ChannelUser>;

    readonly configuration: Readonly<ClientConfig>;

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

    private _openLink: OpenLinkService;

    constructor(config: Partial<ClientConfig> = {}, private _sessionFactory: SessionFactory = new TalkSessionFactory()) {
        super();

        this.pingInterval = 900000;

        this._session = null;
        this._clientSession = new TalkClientSession(this.createSessionProxy(), new ClientConfigProvider(Object.assign(DefaultConfiguration, config)));

        this._channelList = new TalkChannelList(this.createSessionProxy());

        this._cilentUser = { userId: Long.ZERO };

        this._openLink = new OpenLinkService(this.createSessionProxy());
    }

    get configProvider() {
        return this._clientSession.configProvider;
    }

    get channelList() {
        if (!this.logon) throw new Error('Cannot access without logging in');

        return this._channelList!;
    }

    get cilentUser() {
        if (!this.logon) throw new Error('Cannot access without logging in');

        return this._cilentUser;
    }

    get openLink() {
        if (!this.logon) throw new Error('Cannot access without logging in');

        return this._openLink;
    }

    /**
     * true if session created
     */
    get logon() {
        return this._session != null;
    }

    private get session() {
        if (this._session == null) throw new Error('Session is not created');

        return this._session;
    }

    async login(credential: OAuthCredential): AsyncCommandResult<LoginResult> {
        if (this.logon) throw new Error('Already logon');

        // Create session
        const sessionRes = await this._sessionFactory.createSession(this.configProvider.configuration);
        if (!sessionRes.success) return sessionRes;
        this._session = sessionRes.result;
        this.listen();

        const loginRes = await this._clientSession.login(credential);
        if (!loginRes.success) return loginRes;

        this.addPingHandler();

        this._cilentUser = { userId: loginRes.result.userId };

        await TalkChannelList.initialize(this._channelList, loginRes.result.channelList);
        await this._openLink.updateAll();

        return { status: loginRes.status, success: true, result: loginRes.result };
    }

    setStatus(status: ClientStatus) {
        return this._clientSession.setStatus(status);
    }

    /**
     * @param user Target user to compare
     *
     * @returns true if client user.
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

        this._openLink.pushReceived(method, data, ctx);
        
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
        const instance = this;

        return {
            request: (method, data) => this.request(method, data),

            get clientUser() {
                return instance.cilentUser;
            },

            get configuration() {
                return instance.configProvider.configuration;
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