/*
 * Created on Mon Jan 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { EventContext, TypedListeners } from '../event';
import { DefaultRes } from '../request';

export interface Managed<T extends TypedListeners<T>> {

  /**
   * Called when broadcast packets are recevied
   *
   * @param method
   * @param data
   * @param parentCtx
   */
  pushReceived(method: string, data: DefaultRes, parentCtx: EventContext<T>): void;

}
