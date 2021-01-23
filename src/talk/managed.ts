/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ListenerSignature } from "tiny-typed-emitter";
import { EventContext } from "../event/event-context";
import { DefaultRes } from "../packet/bson-data-codec";

export interface Managed<T extends ListenerSignature<T>> {

    /**
     * Called when broadcast packets are recevied
     * 
     * @param method 
     * @param data 
     * @param parentCtx
     */
    pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<T>): void;
    
}