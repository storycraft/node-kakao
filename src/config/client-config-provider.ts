/*
 * Created on Mon Aug 17 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ClientConfig, DefaultConfiguration } from "./client-config";

export interface ClientConfigProvider {

    readonly Configuration: ClientConfig;

}

export class DefaultClientConfigProvider implements ClientConfigProvider {

    private configuration: ClientConfig;

    constructor(config?: Partial<ClientConfig>) {
        this.configuration = config ? Object.assign(DefaultConfiguration, config) : DefaultConfiguration;
    }

    get Configuration() {
        return this.configuration;
    }

}