/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TalkSession } from "../../client";
import { InformedOpenLink, OpenLink, OpenLinkComponent } from "../../openlink/open-link";
import { OpenLinkSession } from "../../openlink/open-link-session";
import { JoinInfoRes } from "../../packet/chat/join-info";
import { SyncLinkRes } from "../../packet/chat/sync-link";
import { KnownDataStatusCode } from "../../packet/status-code";
import { WrappedOpenLink, WrappedOpenLinkInfo } from "../../packet/struct/wrapped/openlink";
import { AsyncCommandResult } from "../../request/command-result";

/**
 * Provides openlink operations
 */
export class TalkOpenLinkSession implements OpenLinkSession {

    private _lastLinkToken: number;

    constructor(private _session: TalkSession) {
        this._lastLinkToken = 0;
    }

    async getLatestLinkList(): AsyncCommandResult<Readonly<InformedOpenLink>[]> {
        const res = await this._session.request<SyncLinkRes>(
            'SYNCLINK',
            {
                'ltk': this._lastLinkToken
            }
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };
        
        const list: InformedOpenLink[] = res.ols.map(struct => {
            return { openLink: new WrappedOpenLink(struct), info: new WrappedOpenLinkInfo(struct) };
        });

        this._lastLinkToken = res.ltk;

        return { status: res.status, success: true, result: list };
    }
    
    async getOpenLink(...components: OpenLinkComponent[]): AsyncCommandResult<Readonly<OpenLink>[]> {
        const res = await this._session.request<SyncLinkRes>(
            'INFOLINK',
            {
                'lis': components.map(component => component.linkId)
            }
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        const list: OpenLink[] = res.ols.map(struct => new WrappedOpenLink(struct));

        return { status: res.status, success: true, result: list };
    }
    
    async getJoinInfo(linkURL: string, referer: string = 'EW'): AsyncCommandResult<Readonly<InformedOpenLink>> {
        const res = await this._session.request<JoinInfoRes>(
            'JOININFO',
            {
                'lu': linkURL,
                'ref': referer
            }
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        return { status: res.status, success: true, result: { openLink: new WrappedOpenLink(res.ol), info: new WrappedOpenLinkInfo(res.ol) } };
    }

    async deleteLink(link: OpenLinkComponent): AsyncCommandResult {
        const res = await this._session.request<JoinInfoRes>(
            'DELETELINK',
            {
                'li': link.linkId
            }
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

}