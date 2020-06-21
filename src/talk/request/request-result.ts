/*
 * Created on Mon Jun 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StatusCode } from "../../packet/loco-packet-base";

export interface RequestResult<T> {

    status: StatusCode;
    result?: T | null;

}