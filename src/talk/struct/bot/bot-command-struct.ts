/*
 * Created on Fri Sep 04 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { StructBase } from "../struct-base";
import { Long } from "bson";

export interface BotCommandStruct extends StructBase {
    
    id: string;

}

export interface BotAddCommandStruct extends BotCommandStruct {
    
    name: string;

    updatedAt: number;

    botId: Long;

}

export interface BotDelCommandStruct extends BotCommandStruct {

}