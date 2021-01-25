/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TalkSession } from "../../client";
import { InformedOpenLink, OpenLink, OpenLinkComponent } from "../../openlink/open-link";
import { OpenLinkSession } from "../../openlink/open-link-session";
import { AsyncCommandResult } from "../../request/command-result";
import { TalkOpenLinkSession } from "./talk-openlink-session";

/**
 * Provide openlink services
 */
export class OpenLinkService implements OpenLinkSession {
    
    private _session: TalkOpenLinkSession;

    private _clientMap: Map<string, InformedOpenLink>;

    constructor(session: TalkSession) {
        this._session = new TalkOpenLinkSession(session);

        this._clientMap = new Map();
    }

    /**
     * Get client link iterator
     */
    getLinkList() {
        return this._clientMap.values();
    }

    async getLatestLinkList(): AsyncCommandResult<Readonly<InformedOpenLink>[]> {
        const res = await this._session.getLatestLinkList();

        if (res.success) {
            const clientMap = new Map();

            res.result.forEach(link => clientMap.set(link.openLink.linkId.toString(), link));

            this._clientMap = clientMap;
        }

        return res;
    }

    getOpenLink(...components: OpenLinkComponent[]) {
        return this._session.getOpenLink(...components);
    }

    getJoinInfo(linkURL: string, referer?: string) {
        return this._session.getJoinInfo(linkURL, referer);
    }

    async deleteLink(link: OpenLinkComponent) {
        const res = await this._session.deleteLink(link);

        if (res.success) {
            this._clientMap.delete(link.linkId.toString());
        }

        return res;
    }

    /**
     * Update every properties
     */
    updateAll() {
        return this.getLatestLinkList();
    }

}