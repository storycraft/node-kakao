/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/**
 * Read / write stream
 */
export interface Stream {
    
    /**
     * Write data
     * @param data 
     */
    write(data: ArrayBuffer): void;

    /**
     * Try to read data from stream
     */
    iterate(): AsyncIterable<ArrayBuffer>;

    /**
     * Indicate current stream is ended or not
     */
    readonly ended: boolean;

    /**
     * Close current stream
     */
    close(): void;

}