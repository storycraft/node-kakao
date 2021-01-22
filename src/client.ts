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
import { CommandResult } from "./request/command-result";
import { ClientConfig, ClientConfigProvider, DefaultConfiguration } from "./config/client-config-provider";
import { Long } from ".";
import { ClientSession, LoginResult } from "./client/client-session";
import EventTarget from "event-target-shim";
import { TalkSessionFactory } from "./talk/network/talk-session-factory";
import { TalkClientSession } from "./talk/client/talk-client-session";

/**
 * Simple client implementation.
 */
export class TalkClient extends EventTarget implements CommandSession, ClientSession, Managed {

    private _session: LocoSession | null;

    private _clientSession: TalkClientSession;

    private _cilentUser: ChannelUser;

    private _channelList: TalkChannelList;

    constructor(config: Partial<ClientConfig> = {}, private _sessionFactory: SessionFactory = new TalkSessionFactory()) {
        super();

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

    /**
     * Create new session and login
     * 
     * @param credential 
     */
    async login(credential: OAuthCredential): Promise<CommandResult<LoginResult>> {
        if (this.logon) throw 'Already logon';

        // Create session
        const sessionRes = await this._sessionFactory.createSession(this.configProvider.configuration);
        if (!sessionRes.success) return { status: sessionRes.status, success: false };
        this._session = sessionRes.result;

        this.listen();

        const loginRes = await this._clientSession.login(credential);
        if (!loginRes.success) return { status: loginRes.status, success: false };
        
        this._channelList = await TalkChannelList.initialize(this.createSessionProxy(), loginRes.result.channelList)
        this._cilentUser = { userId: loginRes.result.userId };

        return { status: loginRes.status, success: true, result: loginRes.result };
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
        this._channelList.pushReceived(method, data);

        switch (method) {

            case 'KICKOUT': {
                break;
            }

            case 'CHGSERVER': {
                break;
            }

        }
        
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
        return this.session.request<T>(method, data);
    }

    private listenEnd() {
        if (this._session) this._session = null;
    }

    private onError() {
        // dispatch error event

        this.listen();
    }

    private listen() {
        (async () => {
            for await (const [pushMethod, pushData] of this.session.listen()) {
                this.pushReceived(pushMethod, pushData);
            }
        })().then(this.listenEnd.bind(this)).catch(this.onError.bind(this));
    }

}