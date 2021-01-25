/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { InformedOpenLinkStruct, OpenLinkStruct } from "../struct/openlink";

export interface SyncLinkRes {

    ols: InformedOpenLinkStruct[];

    ltk: number;

}