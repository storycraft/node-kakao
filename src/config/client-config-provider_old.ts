/*
 * Created on Mon Aug 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ClientConfigOld, DefaultConfiguration } from "./client-config-provider";

export interface ClientConfigProvider {

    readonly Configuration: ClientConfigOld;

}

export class DefaultClientConfigProvider implements ClientConfigProvider {

    configuration: ClientConfigOld;

    constructor(config?: Partial<ClientConfigOld>) {
        this.configuration = config ? Object.assign(DefaultConfiguration, config) : DefaultConfiguration;
    }

    get Configuration() {
        return this.configuration;
    }

}