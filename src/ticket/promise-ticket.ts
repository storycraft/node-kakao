/*
 * Created on Mon Jun 15 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */


export class PromiseTicket<T> {

    private resolveList: ((obj: T) => void)[];
    private rejectList: ((err: any) => void)[];

    constructor() {
        this.resolveList = [];
        this.rejectList = [];
    }

    createTicket(): Promise<T> {
        return new Promise<T>((resolve, reject) => { this.resolveList.push(resolve); this.rejectList.push(reject) });
    }

    resolve(obj: T) {
        for (let resolve of this.resolveList) {
            resolve(obj);
        }

        this.clear();
    }

    reject(err: any) {
        for (let reject of this.rejectList) {
            reject(err);
        }

        this.clear();
    }

    protected clear() {
        this.resolveList = [];
        this.rejectList = [];
    }

}