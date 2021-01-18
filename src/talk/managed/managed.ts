/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultRes } from "../../packet/bson-data-codec";

export interface Managed {

    /**
     * Called when broadcast packets are recevied
     * 
     * @param method 
     * @param data 
     */
    pushReceived(method: string, data: DefaultRes): void;
    
}