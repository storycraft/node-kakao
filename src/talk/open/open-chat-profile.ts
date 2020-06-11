/*
 * Created on Tue Jun 11 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

// profilePath: f01 ~ f50

export class KakaoAnonProfile  {

    constructor(
        public nickname: string,
        public profilePath: string = 'f01',
    ) {
    }

    readRawContent(rawData: any) {
        this.nickname = rawData['nn'];
        this.profilePath = rawData['pp'];
    }

    toRawContent(): any {
        let obj: any = {
            'nn': this.nickname,
            'pp': this.profilePath,
        }

        return obj;
    }
}
