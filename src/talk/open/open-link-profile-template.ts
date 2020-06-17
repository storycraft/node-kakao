/*
 * Created on Wed Jun 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenProfileType } from "./open-link-type";
import { Long } from "bson";

export interface OpenProfileTemplate {

    type: OpenProfileType;

    anonNickname?: string;
    anonProfilePath?: string;
    profileLinkId?: Long;

}

export interface OpenMainProfileTemplate {

    type: OpenProfileType.MAIN;

}

export interface OpenAnonProfileTemplate {

    type: OpenProfileType.KAKAO_ANON;

    anonNickname: string;
    anonProfilePath: string;

}

export interface OpenLinkProfileTemplate {

    type: OpenProfileType.OPEN_PROFILE;

    profileLinkId: Long;

}

export interface OpenLinkProfileContent {

    description: string;
    tags: string;

}