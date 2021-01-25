/*
 * Created on Mon Jan 25 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AsyncCommandResult } from "../request/command-result";
import { InformedOpenLink, OpenLinkComponent, OpenLink } from "./open-link";
import { OpenLinkKickedUserInfo } from "./open-link-user-info";

export interface OpenLinkSession {

    /**
     * Get latest client link list
     */
    getLatestLinkList(): AsyncCommandResult<Readonly<InformedOpenLink>[]>;
    
    /**
     * Get openlink from link id.
     * 
     * @param components 
     */
    getOpenLink(...components: OpenLinkComponent[]): AsyncCommandResult<Readonly<OpenLink>[]>;
    
    /**
     * Get openlink from link url.
     * 
     * @param linkURL 
     * @param referer Unknown
     */
    getJoinInfo(linkURL: string, referer?: string): AsyncCommandResult<Readonly<InformedOpenLink>>;

    /**
     * Get kicklist of this openlink.
     * Require manage permission otherwise the request fail.
     * 
     * @param link
     */
    getKickList(link: OpenLinkComponent): AsyncCommandResult<OpenLinkKickedUserInfo[]>;

    /**
     * Delete openlink.
     * 
     * @param component openlink to delete
     */
    deleteLink(link: OpenLinkComponent): AsyncCommandResult;

}