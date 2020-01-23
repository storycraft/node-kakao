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

        this.AllowPay = rawData['allowPay'];
        this.AllowStory = rawData['allowStory'];
        this.AllowStoryPost = rawData['allowStoryPost'];
        this.BackgroundImageURL = rawData['backgroundImageUrl'];
        this.OriginalBackgroundImageURL = rawData['originalBackgroundImageUrl'];
        this.ProfileImageURL = rawData['profileImageUrl'];
        this.FullProfileImageURL = rawData['fullProfileImageUrl'];
        this.OriginalProfileImageURL = rawData['originalProfileImageUrl'];
        this.StatusMessage = rawData['statusMessage'];
        this.StoryURL = rawData['storyWebUrl'];
        this.Suspended = rawData['suspended'];
        this.UserId = rawData['userId'];
    }
    
    toJson() {
        return {
            'status': this.Status,
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
        };
    }


}