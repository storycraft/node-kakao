import { StructBase } from "./struct-base";

/*
 * Created on Sun Nov 03 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ClientSettingsStruct implements StructBase {

    constructor(
        public Status: number = 0,
        public AllowPay: boolean = false,
        public AllowStory: boolean = false,
        public AllowStoryPost: boolean = false,
        public BackgroundImageURL: string = '',
        public OriginalBackgroundImageURL: string = '',
        public ProfileImageURL: string = '',
        public FullProfileImageURL: string = '',
        public OriginalProfileImageURL: string = '',
        public StatusMessage: string = '',
        public StoryURL: string = '',
        public Suspended: boolean = false,
        public UserId: number = 0
    ) {

    }

    fromJson(rawData: any): void {
        this.Status = rawData['status'];

        let profile = rawData['profile'];

        if (profile) {
            this.AllowPay = profile['allowPay'];
            this.AllowStory = profile['allowStory'];
            this.AllowStoryPost = profile['allowStoryPost'];
            this.BackgroundImageURL = profile['backgroundImageUrl'];
            this.OriginalBackgroundImageURL = profile['originalBackgroundImageUrl'];
            this.ProfileImageURL = profile['profileImageUrl'];
            this.FullProfileImageURL = profile['fullProfileImageUrl'];
            this.OriginalProfileImageURL = profile['originalProfileImageUrl'];
            this.StatusMessage = profile['statusMessage'];
            this.StoryURL = profile['storyWebUrl'];
            this.Suspended = profile['suspended'];
            this.UserId = profile['userId'];
        }
    }
    
    toJson() {
        return {
            'status': this.Status,
            'profile': {
                'allowPay': this.AllowPay,
                'allowStory': this.AllowStory,
                'allowStoryPost': this.AllowStoryPost,
                'backgroundImageUrl': this.BackgroundImageURL,
                'originalBackgroundImageUrl': this.OriginalBackgroundImageURL,
                'profileImageUrl': this.ProfileImageURL,
                'fullProfileImageUrl': this.FullProfileImageURL,
                'originalProfileImageUrl': this.OriginalProfileImageURL,
                'statusMessage': this.StatusMessage,
                'storyWebUrl': this.StoryURL,
                'suspended': this.Suspended,
                'userId': this.UserId
            }
        };
    }


}