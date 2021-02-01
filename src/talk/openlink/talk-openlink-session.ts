/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TalkSession } from "../client";
import { InformedOpenLink, OpenLink, OpenLinkComponent } from "../../openlink";
import { OpenLinkSession } from "../../openlink/open-link-session";
import { OpenLinkKickedUser, OpenLinkKickedUserInfo } from "../../openlink/open-link-user-info";
import { JoinInfoRes } from "../../packet/chat/join-info";
import { KLSyncRes } from "../../packet/chat/kl-sync";
import { SyncLinkRes } from "../../packet/chat/sync-link";
import { KnownDataStatusCode } from "../../request";
import { structToOpenLink, structToOpenLinkInfo } from "../../packet/struct/wrap/openlink";
import { structToOpenLinkKickedUserInfo } from "../../packet/struct/wrap/user";
import { AsyncCommandResult } from "../../request";

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

        const list: InformedOpenLink[] = !res.ols ? [] : res.ols.map(struct => {
            return { openLink: structToOpenLink(struct), info: structToOpenLinkInfo(struct) };
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

        const list: OpenLink[] = res.ols.map(structToOpenLink);

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

        return { status: res.status, success: true, result: { openLink: structToOpenLink(res.ol), info: structToOpenLinkInfo(res.ol) } };
    }

    async getKickList(link: OpenLinkComponent): AsyncCommandResult<OpenLinkKickedUserInfo[]> {
        const res = await this._session.request<KLSyncRes>(
            'KLSYNC',
            {
                'li': link.linkId
            }
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        return { status: res.status, success: true, result: res.kickMembers.map(structToOpenLinkKickedUserInfo) };
    }

    async removeKicked(link: OpenLinkComponent, user: OpenLinkKickedUser): AsyncCommandResult {
        const res = await this._session.request(
            'KLDELITEM',
            {
                'li': link.linkId,
                'c': user.kickedChannelId,
                'kid': user.userId
            }
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
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

    async react(link: OpenLinkComponent, flag: boolean) {
        const res = await this._session.request<JoinInfoRes>(
            'REACT',
            {
                'li': link.linkId,
                'rt': flag ? 1 : 0
            }
        );

        return { status: res.status, success: res.status === KnownDataStatusCode.SUCCESS };
    }

    async getReaction(link: OpenLinkComponent): AsyncCommandResult<[number, boolean]> {
        const res = await this._session.request(
            'REACTCNT',
            {
                'li': link.linkId
            }
        );
        if (res.status !== KnownDataStatusCode.SUCCESS) return { status: res.status, success: false };

        return { status: res.status, success: true, result: [res['rc'], res['rt']] };
    }

}