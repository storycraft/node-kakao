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

export type OpenMainProfileTemplate = OpenProfileTemplate<OpenProfileType.MAIN>;
export type OpenAnonProfileTemplate = OpenProfileTemplate<OpenProfileType.KAKAO_ANON> & OpenProfileTemplate.Anon;
export type OpenLinkProfileTemplate = OpenProfileTemplate<OpenProfileType.OPEN_PROFILE> & OpenProfileTemplate.Link;

export type OpenProfileTemplates = OpenMainProfileTemplate | OpenAnonProfileTemplate | OpenLinkProfileTemplate;

export interface OpenLinkProfileContent {

    description: string;
    tags: string;

}