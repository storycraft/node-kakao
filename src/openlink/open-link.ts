/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";
import { OpenLinkType } from "./open-link-type";

export interface OpenLinkComponent {

    readonly linkId: Long;

}

export interface OpenTokenComponent {

    readonly openToken: number;

}

export interface OpenLink extends OpenLinkComponent {

    readonly type: OpenLinkType;

}