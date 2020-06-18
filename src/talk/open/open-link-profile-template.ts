/*
 * Created on Wed Jun 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenProfileType } from "./open-link-type";
import { Long } from "bson";

export namespace OpenProfileTemplate {

    export interface Anon {
        
        anonNickname: string;
        anonProfilePath: string;
    }

    export interface Link {
        
        profileLinkId: Long;
        
    }

}

export interface OpenProfileTemplate<T extends OpenProfileType> extends Partial<OpenProfileTemplate.Anon>, Partial<OpenProfileTemplate.Link> {

    type: T;

}

export type OpenProfileTemplates = OpenProfileTemplate<OpenProfileType.MAIN> | OpenProfileTemplate<OpenProfileType.KAKAO_ANON> & OpenProfileTemplate.Anon | OpenProfileTemplate<OpenProfileType.OPEN_PROFILE> & OpenProfileTemplate.Link;

export interface OpenLinkProfileTemplate {

    type: OpenProfileType.OPEN_PROFILE;

    profileLinkId: Long;

}



export interface OpenLinkProfileContent {

    description: string;
    tags: string;

}