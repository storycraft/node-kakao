/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatType } from "./chat-type";

/**
 * Chat interface
 */
export interface Chat {

    /**
     * Chat type
     */
    readonly type: ChatType;
    
    /**
     * Cgat text. Can be empty string
     */
    readonly text: string;

    /**
     * Optional attachment json
     */
    attachment?: string;

    /**
     * Optional suppliment json.
     * Only used in Pluschat for extra components(quick reply, custom menus, e.t.c.) and cannot be sent.
     */
    suppliment?: string;

}

export interface ChatOptions {

    /**
     * 
     */
    shout?: boolean;

}