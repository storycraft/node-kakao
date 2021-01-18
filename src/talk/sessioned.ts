/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { LocoSession } from "../network/loco-session";

export interface Sessioned {

    readonly session: LocoSession;

}