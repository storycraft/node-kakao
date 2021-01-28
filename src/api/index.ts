/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

// export * from "./struct";
export * from "./auth-client";

import { DefaultRes } from "../request";
import { isBrowser, isDeno, isNode } from "../util/platform";

export type RequestHeader = Record<string, any>;
export type RequestMethod = 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'LINK' | 'UNLINK';
export type FileRequestData = { value: ArrayBuffer, options: { filename: string, contentType?: string } };
export type RequestForm = { [key: string]: FileRequestData | any };

/**
 * Provides various web request api
 */
export interface ApiClient extends HeaderDecorator {

    /**
     * Returns url
     */
    readonly url: string;

    /**
     * Request with optional form and header overrides
     * @param method
     * @param path
     * @param form
     * @param headers
     */
    request(method: RequestMethod, path: string, form?: RequestForm, headers?: RequestHeader): Promise<DefaultRes>;

    /**
     * Request multipart form
     *
     * @param method
     * @param path
     * @param form
     * @param headers
     */
    requestMultipart(method: RequestMethod, path: string, form?: RequestForm, headers?: RequestHeader): Promise<DefaultRes>;

}

/**
 * Decorate common request headers
 */
export interface HeaderDecorator {

    fillHeader(header: RequestHeader): void;

}

/**
 * Create api client by platform
 *
 * @param scheme
 * @param host
 * @param decorator
 */
export async function createApiClient(scheme: string, host: string, decorator?: HeaderDecorator): Promise<ApiClient> {
    if (isNode()) {
        return new (await import('./axios-api-client')).AxiosApiClient(scheme, host, decorator);
    } else if (isDeno()) {
        return new (await import('./fetch-api-client')).FetchApiClient(scheme, host, decorator);
    } else if (isBrowser()) {
        return new (await import('./fetch-api-client')).FetchApiClient(scheme, host, decorator);
    } else {
        throw new Error('Unknown environment');
    }
}

