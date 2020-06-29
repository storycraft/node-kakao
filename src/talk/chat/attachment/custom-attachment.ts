/*
 * Created on Thu Apr 30 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatType } from "../chat-type";
import { ChatAttachment } from "./chat-attachment";
import { AttachmentContent } from "./chat-attachment";

export enum CustomType {

    FEED = 'Feed',
    LIST = 'List',
    COMMERCE = 'Commerce',
    CAROUSEL = 'Carousel',

    

}

export enum CustomButtonStyle {

    HORIZONTAL = 0,
    VERTICAL = 1

}

export enum CustomButtonDisplayType {

    ALL = 'both',
    SENDER_ONLY = 'sender',
    RECEIVER = 'receiver'

}

export enum CustomImageCropStyle {

    CENTER_CROP = 0,
    ORIGINAL = 1

}

export abstract class CustomBaseContent implements AttachmentContent {

    abstract readRawContent(rawData: any): void;

    abstract toRawContent(): any;

}

export abstract class CustomFragment implements CustomBaseContent {

    abstract readRawContent(rawData: any): void;

    abstract toRawContent(): any;

}

export class TextDescFragment extends CustomFragment {

    constructor(
        public Text: string = '',
        public Description: string = ''
    ) {
        super();
    }

    readRawContent(rawData: any) {
        this.Text = rawData['T'];
        if (rawData['D']) this.Description = rawData['D'];
    }

    toRawContent() {
        let obj: any = {
            'T': this.Text
        };

        if (this.Description) obj['D'] = this.Description;

        return obj;
    }
}

export class URLFragment extends CustomFragment {

    constructor(
        public LinkWin: string = '',
        public LinkMacOS: string = LinkWin,
        
        public LinkAndroid: string = LinkWin,
        public LinkIos: string = LinkAndroid

    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['LPC']) this.LinkWin = rawData['LPC'];
        if (rawData['LMO']) this.LinkMacOS = rawData['LMO'];

        if (rawData['LCA']) this.LinkAndroid = rawData['LCA'];
        if (rawData['LCI']) this.LinkIos = rawData['LCI'];
    }

    toRawContent() {
        let obj: any = {};

        if (this.LinkWin !== '') obj['LPC'] = this.LinkWin;
        if (this.LinkMacOS !== '') obj['LMO'] = this.LinkMacOS;

        if (this.LinkAndroid !== '') obj['LCA'] = this.LinkAndroid;
        if (this.LinkIos !== '') obj['LCI'] = this.LinkIos;

        return obj;
    }

}

export class ImageFragment extends CustomFragment {

    constructor(
        public Url: string = '',
        public Width: number = 0,
        public Height: number = 0,
        public CropStyle: CustomImageCropStyle = CustomImageCropStyle.ORIGINAL,
        public IsLive: boolean = false,
        public PlayTime: number = 0
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        this.Url = rawData['THU'];
        this.Width = rawData['W'];
        this.Height = rawData['H'];
        this.CropStyle = rawData['SC'];
        this.IsLive = rawData['LI'];
        this.PlayTime = rawData['PT'];
    }

    toRawContent() {
        let obj: any = {
            'THU': this.Url,
            'W': this.Width,
            'H': this.Height,
            'SC': this.CropStyle,
            'LI': this.IsLive,
            'PlayTime': this.PlayTime
        };

        return obj;
    }

}

export class ButtonFragment extends CustomFragment {

    constructor(
        public Text: string = '',
        public DisplayType?: CustomButtonDisplayType,
        public Link?: URLFragment,
        public Highlight?: boolean
    ) {
        super();
    }
    
    readRawContent(rawData: any): void {
        if (rawData['BU']) {
            if (rawData['BU']['T']) this.Text = rawData['BU']['T'];
            if (rawData['BU']['SR']) this.DisplayType = rawData['BU']['SR'];
            if (rawData['BU']['HL']) this.Highlight = rawData['BU']['HL'];
        }

        if (rawData['L']) {
            this.Link = new URLFragment();
            this.Link.readRawContent(rawData['L']);
        }
    }

    toRawContent() {
        let obj: any = {
            'BU': { 'T': this.Text }
        };

        if (this.DisplayType) obj['BU']['SR'] = this.DisplayType;
        if (this.Highlight) obj['BU']['HL'] = this.Highlight;

        if (this.Link) obj['L'] = this.Link.toRawContent();

        return obj;
    }

}

export class SocialFragment extends CustomFragment {

    constructor(
        public Like: number = 0,
        public Comment: number = 0,
        public Share: number = 0,
        public View: number = 0,
        public Subscriber: number = 0
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['LK']) this.Like = rawData['LK'];
        if (rawData['CM']) this.Comment = rawData['CM'];
        if (rawData['SH']) this.Share = rawData['SH'];
        if (rawData['VC']) this.View = rawData['VC'];
        if (rawData['SB']) this.Subscriber = rawData['SB'];
    }

    toRawContent() {
        let obj: any = {};
        
        if (this.Like) obj['LK'] = this.Like;
        if (this.Comment) obj['CM'] = this.Comment;
        if (this.Share) obj['SH'] = this.Share;
        if (this.View) obj['VC'] = this.View;
        if (this.Subscriber) obj['SB'] = this.Subscriber;

        return obj;
    }

}

export class ProfileFragment extends CustomFragment {

    constructor(
        public TextDesc: TextDescFragment = new TextDescFragment(),
        public Link?: URLFragment,
        public Background?: ImageFragment,
        public Thumbnail?: ImageFragment
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['TD']) {
            this.TextDesc.readRawContent(rawData['TD']);
        }

        if (rawData['L']) {
            this.Link = new URLFragment();
            this.Link.readRawContent(rawData['L']);
        }

        if (rawData['BG']) {
            this.Background = new ImageFragment();
            this.Background.readRawContent(rawData['BG']);
        }

        if (rawData['TH']) {
            this.Thumbnail = new ImageFragment();
            this.Thumbnail.readRawContent(rawData['TH']);
        }
    }
    
    toRawContent() {
        let obj: any = {
            'TD': this.TextDesc.toRawContent()
        };

        if (this.Link) obj['L'] = this.Link.toRawContent();

        if (this.Background) obj['BG'] = this.Background.toRawContent();

        if (this.Thumbnail) obj['TH'] = this.Thumbnail.toRawContent();

        return obj;
    }

}

export class ListHeaderFragment extends CustomFragment {

    constructor(
        public TextDesc: TextDescFragment = new TextDescFragment(),
        public Link?: URLFragment,
        public Background?: ImageFragment
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['TD']) {
            this.TextDesc.readRawContent(rawData['TD']);
        }

        if (rawData['L']) {
            this.Link = new URLFragment();
            this.Link.readRawContent(rawData['L']);
        }

        if (rawData['BG']) {
            this.Background = new ImageFragment();
            this.Background.readRawContent(rawData['BG']);
        }
    }
    
    toRawContent() {
        let obj: any = {
            'TD': this.TextDesc.toRawContent()
        };

        if (this.Link) obj['L'] = this.Link.toRawContent();

        if (this.Background) obj['BG'] = this.Background.toRawContent();

        return obj;
    }

}

export abstract class CustomContent extends CustomBaseContent {

    static fromRawContent(rawContent: any, type: CustomType): CustomContent {
        let content: CustomContent;

        switch(type) {

            case CustomType.CAROUSEL: content = new CustomCarouselContent(); break;

            case CustomType.LIST: content = new CustomListContent(); break;

            case CustomType.COMMERCE: content = new CustomCommerceContent(); break;

            case CustomType.FEED:
            default: content = new CustomFeedContent(); break;
        }

        content.readRawContent(rawContent);

        return content;
    }

}

export class CustomFeedContent extends CustomContent {

    constructor(
        public TextDesc: TextDescFragment = new TextDescFragment(),
        public ButtonStyle: CustomButtonStyle = CustomButtonStyle.HORIZONTAL,
        public ButtonList: ButtonFragment[] = [],
        public ThumbnailList: ImageFragment[] = [],
        public ExtraThumbCount: number = 0,
        public TextLink?: URLFragment,
        public FullText?: boolean,
        public Link?: URLFragment,
        public Profile?: ProfileFragment,
        public Social?: SocialFragment
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['TI']) {
            if (rawData['TI']['TD']) this.TextDesc.readRawContent(rawData['TI']['TD']);

            if (rawData['TI']['L']) {
                this.TextLink = new URLFragment();
                this.TextLink.readRawContent(rawData['TI']['L']);
            }

            if (rawData['TI']['FT']) this.FullText = rawData['TI']['FT'];
        }

        this.ButtonStyle = rawData['BUT'];

        if (rawData['BUL']) {
            this.ButtonList = [];

            for (let rawButton of rawData['BUL']) {
                if (!rawButton) continue;

                let btn = new ButtonFragment();
                btn.readRawContent(rawButton);

                this.ButtonList.push(btn);
            }
        }

        if (rawData['THC']) this.ExtraThumbCount = rawData['THC'];

        if (rawData['THL']) {
            this.ThumbnailList = [];

            for (let rawImg of rawData['THL']) {
                if (rawImg['TH']) {
                    let img = new ImageFragment();
                    img.readRawContent(rawImg['TH']);

                    this.ThumbnailList.push(img);
                }
            }
        }

        if (rawData['SO']) {
            this.Social = new SocialFragment();
            this.Social.readRawContent(rawData['SO']);
        }

        if (rawData['PR']) {
            this.Profile = new ProfileFragment();
            this.Profile.readRawContent(rawData['PR']);
        }

        if (rawData['L']) {
            this.Link = new URLFragment();
            this.Link.readRawContent(rawData['L']);
        }

    }

    toRawContent() {
        let textItem: any = {};

        textItem['TD'] = this.TextDesc.toRawContent();

        if (this.TextLink) textItem['L'] = this.TextLink.toRawContent();

        if (typeof(this.FullText) !== 'undefined') textItem['FT'] = this.FullText;

        let obj: any = {
            'TI': textItem,
            'BUT': this.ButtonStyle
        };

        if (this.ExtraThumbCount) obj['THC'] = this.ExtraThumbCount;

        let thumbList = [];
        for (let thumb of this.ThumbnailList) {
            thumbList.push({ 'TH': thumb.toRawContent() });
        }
        obj['THL'] = thumbList;

        let buttonList = [];
        for (let btn of this.ButtonList) {
            buttonList.push(btn.toRawContent());
        }
        obj['BUL'] = buttonList;

        if (this.Link) obj['L'] = this.Link.toRawContent();
        if (this.Profile) obj['PR'] = this.Profile.toRawContent();
        if (this.Social) obj['SO'] = this.Social.toRawContent();

        return obj;
    }

}

export class ListItemFragment extends CustomFragment {

    constructor(
        public Text: TextDescFragment = new TextDescFragment(),
        public Link?: URLFragment,
        public Thumbnail?: ImageFragment
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['TD']) this.Text.readRawContent(rawData['TD']);

        if (rawData['L']) {
            this.Link = new URLFragment();
            this.Link.readRawContent(rawData['L']);
        }

        if (rawData['TH']) {
            this.Thumbnail = new ImageFragment();
            this.Thumbnail.readRawContent(rawData['TH']);
        }
    }

    toRawContent() {
        let obj: any = {
            'TD': this.Text.toRawContent()
        };

        if (this.Link) {
            obj['L'] = this.Link.toRawContent();
        }

        if (this.Thumbnail) {
            obj['TH'] = this.Thumbnail.toRawContent();
        }

        return obj;
    }

}

export class CustomListContent extends CustomContent {

    constructor(
        public Header: ListHeaderFragment = new ListHeaderFragment(),
        public ItemList: ListItemFragment[] = [],
        public ButtonStyle: CustomButtonStyle = CustomButtonStyle.HORIZONTAL,
        public ButtonList: ButtonFragment[] = [],
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['HD']) {
            this.Header.readRawContent(rawData['HD']);
        }

        this.ButtonStyle = rawData['BUT'];

        if (rawData['BUL']) {
            this.ButtonList = [];

            for (let rawButton of rawData['BUL']) {
                if (!rawButton) continue;

                let btn = new ButtonFragment();
                btn.readRawContent(rawButton);

                this.ButtonList.push(btn);
            }
        }

        if (rawData['ITL']) {
            this.ItemList = [];

            for (let rawItem of rawData['ITL']) {
                if (!rawItem) continue;

                let item = new ListItemFragment();
                item.readRawContent(rawItem);

                this.ItemList.push(item);
            }
        }

    }

    toRawContent() {
        let obj: any = {
            'HD': this.Header.toRawContent(),
            'BUT': this.ButtonStyle
        };

        let buttonList = [];
        for (let btn of this.ButtonList) {
            buttonList.push(btn.toRawContent());
        }
        obj['BUL'] = buttonList;

        let itemList = [];
        for (let item of this.ItemList) {
            itemList.push(item.toRawContent());
        }
        obj['ITL'] = itemList;

        return obj;
    }

}

export class CommercePriceFragment extends CustomContent {

    constructor(
        public RealPrice: number = 0,
        public DiscountedPrice: number = 0,
        public DiscountRate: number = 0,
        public PriceUnit: string = '',
        public UnitFirst: number = 0 // 0 == false, 0 !== true; perfect logic
    ) {
        super();
    }

    readRawContent(rawData: any) {
        this.RealPrice = rawData['RP'];
        this.DiscountedPrice = rawData['DP'];
        this.DiscountRate = rawData['DR'];
        this.PriceUnit = rawData['CU'];
        this.UnitFirst = rawData['CP'];
    }

    toRawContent(): any {
        let obj: any = {
            'RP': this.RealPrice,
            'DP': this.DiscountedPrice,
            'DR': this.DiscountRate,
            'CU': this.PriceUnit,
            'CP': this.UnitFirst
        };

        return obj;
    }

}

export class CustomCommerceContent extends CustomContent {

    constructor(
        public ThumbnailList: ImageFragment[] = [],
        public ExtraThumbCount: number = 0,
        public ButtonStyle: CustomButtonStyle = CustomButtonStyle.HORIZONTAL,
        public ButtonList: ButtonFragment[] = [],
        public TextDesc?: TextDescFragment,
        public Price?: CommercePriceFragment,
        public Profile?: ProfileFragment
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['TI']) {
            if (rawData['TI']['TD']) {
                this.TextDesc = new TextDescFragment();
                this.TextDesc.readRawContent(rawData['TI']['TD']);
            }
        }

        this.ButtonStyle = rawData['BUT'];

        if (rawData['BUL']) {
            this.ButtonList = [];

            for (let rawButton of rawData['BUL']) {
                if (!rawButton) continue;

                let btn = new ButtonFragment();
                btn.readRawContent(rawButton);

                this.ButtonList.push(btn);
            }
        }

        if (rawData['THC']) this.ExtraThumbCount = rawData['THC'];

        if (rawData['THL']) {
            this.ThumbnailList = [];

            for (let rawImg of rawData['THL']) {
                if (rawImg['TH']) {
                    let img = new ImageFragment();
                    img.readRawContent(rawImg['TH']);

                    this.ThumbnailList.push(img);
                }
            }
        }

        if (rawData['PR']) {
            this.Profile = new ProfileFragment();
            this.Profile.readRawContent(rawData['PR']);
        }

        if (rawData['CMC']) {
            this.Price = new CommercePriceFragment();
            this.Price.readRawContent(rawData['CMC']);
        }

    }

    toRawContent() {
        let textItem: any = {};

        if (this.TextDesc) {
            textItem['TD'] = this.TextDesc.toRawContent();
        }

        let obj: any = {
            'TI': textItem,
            'BUT': this.ButtonStyle
        };

        if (this.ExtraThumbCount) obj['THC'] = this.ExtraThumbCount;

        let thumbList = [];
        for (let thumb of this.ThumbnailList) {
            thumbList.push({ 'TH': thumb.toRawContent() });
        }
        obj['THL'] = thumbList;

        let buttonList = [];
        for (let btn of this.ButtonList) {
            buttonList.push(btn.toRawContent());
        }
        obj['BUL'] = buttonList;

        if (this.Profile) {
            obj['PR'] = this.Profile.toRawContent();
        }

        if (this.Price) {
            obj['CMC'] = this.Price.toRawContent();
        }

        return obj;
    }

}

export class CarouselCover extends CustomContent {

    constructor(
        public Text: TextDescFragment = new TextDescFragment(),
        public Thumbnail?: ImageFragment,
        public Link?: URLFragment,

        public Background?: ImageFragment
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['L']) {
            this.Link = new URLFragment();
            this.Link.readRawContent(rawData['L']);
        }

        if (rawData['TD']) this.Text.readRawContent(rawData['TD']);
        if (rawData['TH']) {
            this.Thumbnail = new ImageFragment();
            this.Thumbnail.readRawContent(rawData['TH']);
        }

        if (rawData['BG']) {
            this.Background = new ImageFragment();
            this.Background.readRawContent(rawData['BG']);
        }
    }

    toRawContent() {
        let obj: any = {
            'TD': this.Text.toRawContent()
        };

        if (this.Link) {
            obj['L'] = this.Link.toRawContent();
        }

        if (this.Thumbnail) {
            obj['TH'] = this.Thumbnail.toRawContent();
        }

        if (this.Background) {
            obj['BG'] = this.Background.toRawContent();
        }

        return obj;
    }
    
}

export class CustomCarouselContent extends CustomContent {

    constructor(
        public CardType: CustomType = CustomType.FEED,
        public ContentList: CustomContent[] = [],
        public ContentHead?: CarouselCover,
        public ContentTail?: CarouselCover
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['CTP']) this.CardType = rawData['CTP'];

        if (rawData['CIL']) {
            this.ContentList = [];

            for (let rawContent of rawData['CIL']) {
                this.ContentList.push(CustomContent.fromRawContent(rawContent, this.CardType));
            }
        }

        if (rawData['CHD']) {
            this.ContentHead = new CarouselCover();
            this.ContentHead.readRawContent(rawData['CHD']);
        }

        if (rawData['CTA']) {
            this.ContentTail = new CarouselCover();
            this.ContentTail.readRawContent(rawData['CTA']);
        }
    }

    toRawContent() {
        let obj: any = {
            'CTP': this.CardType
        };

        let list = [];
        for (let content of this.ContentList) {
            list.push(content.toRawContent());
        }
        obj['CIL'] = list;

        if (this.ContentHead) {
            obj['CHD'] = this.ContentHead.toRawContent();
        }

        if (this.ContentTail) {
            obj['CTA'] = this.ContentTail.toRawContent();
        }

        return obj;
    }

}

export class ServiceSettingsContent extends CustomContent {

    constructor(
        public SenderReceiver?: string,
        public Link?: URLFragment,
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        this.SenderReceiver = rawData['SR'];

        if (rawData['L']) {
            this.Link = new URLFragment();
            this.Link.readRawContent(rawData['L']);
        }
    }

    toRawContent() {
        let obj: any = {
            'SR': this.SenderReceiver
        };

        if (this.Link) {
            obj['L'] = this.Link.toRawContent();
        }

        return obj;
    }

}

export class CustomInfo implements CustomBaseContent {

    constructor(
        public Message: string = '',
        public Type: CustomType = CustomType.FEED,
        public ServiceId: string = '',
        public ProviderId: string = '',
        public AndroidVersion: string = '',
        public IosVersion: string = '',
        public WinVersion: string = '',
        public MacVersion: string = '',
        public ServiceSettings?: ServiceSettingsContent,
        public ServiceNickname?: string,
        public ServiceIcon?: string,
        public ServiceLink?: URLFragment,
        public Link?: URLFragment,
        public BigChat?: boolean,
        public Secure?: boolean,
        public KakaoVerified?: boolean,
        public CanForward?: boolean,
        public Ref: string = '',
        public Ad?: boolean,
    ) {

    }

    readRawContent(rawData: any): void {
        this.Message = rawData['ME'];
        this.Type = rawData['TP'];

        this.ServiceId = rawData['SID'];
        this.ProviderId = rawData['DID'];

        this.AndroidVersion = rawData['VA'];
        this.IosVersion = rawData['VI'];
        this.WinVersion = rawData['VW'];
        this.MacVersion = rawData['VM'];

        this.ServiceNickname = rawData['SNM'];
        this.ServiceIcon = rawData['SIC'];

        this.Ad = rawData['AD'];
        this.Secure = rawData['LOCK'];

        if (typeof(rawData['KV']) !== 'undefined') this.KakaoVerified = rawData['KV'];
        if (typeof(rawData['FW']) !== 'undefined') this.CanForward = rawData['FW'];

        if (typeof(rawData['BC']) !== 'undefined') this.BigChat = rawData['BC'];

        if (rawData['SST']) {
            this.ServiceSettings = new ServiceSettingsContent();
            this.ServiceSettings.readRawContent(rawData['SST']);
        }

        if (rawData['L']) {
            this.Link = new URLFragment();
            this.Link.readRawContent(rawData['L']);
        }

        if (rawData['SL']) {
            this.ServiceLink = new URLFragment();
            this.ServiceLink.readRawContent(rawData['SL']);
        }
    }

    toRawContent() {
        let obj: any = {
            'ME': this.Message,
            'TP': this.Type,

            'SID': this.ServiceId,
            'DID': this.ProviderId,

            'VA': this.AndroidVersion,
            'VI': this.IosVersion,
            'VW': this.WinVersion,
            'VM': this.MacVersion,
        };

        if (this.ServiceSettings) obj['SST'] = this.ServiceSettings.toRawContent();

        if (this.ServiceNickname) obj['SNM'] = this.ServiceNickname;
        if (this.ServiceIcon) obj['SIC'] = this.ServiceIcon;

        if (typeof(this.Secure) !== 'undefined') obj['LOCK'] = this.Secure;

        if (typeof(this.BigChat) !== 'undefined') obj['BC'] = this.BigChat;
        if (typeof(this.CanForward) !== 'undefined') obj['FW'] = this.CanForward;
        if (typeof(this.KakaoVerified) !== 'undefined') obj['KV'] = this.KakaoVerified;
        if (typeof(this.Ad) !== 'undefined') obj['AD'] = this.Ad;

        if (this.Ref !== '') obj['RF'] = this.Ref;

        if (this.Link) obj['L'] = this.Link.toRawContent();
        if (this.ServiceLink) obj['SL'] = this.ServiceLink.toRawContent();

        return obj;
    }

}

export class KakaoLinkInfo implements CustomBaseContent {

    constructor(
        public AppId: string = '',
        public TemplateId?: string,
        public LinkVersion?: string,
        public AppKey?: string,
        public AppVersion?: string
    ) {

    }

    readRawContent(rawData: any): void {
        this.AppId = rawData['ai'];
        this.TemplateId = rawData['ti'];
        this.LinkVersion = rawData['lv'];
        this.AppKey = rawData['ak'];
        this.AppVersion = rawData['av'];
    }

    toRawContent() {
        let obj: any = {
            'ai': this.AppId
        };

        if (this.TemplateId) obj['ti'] = this.TemplateId;
        if (this.LinkVersion) obj['lv'] = this.LinkVersion;
        if (this.AppKey) obj['ak'] = this.AppKey;
        if (this.AppVersion) obj['av'] = this.AppVersion;

        return obj;
    }

}

export class CustomAttachment implements ChatAttachment {

    constructor(
        public Info: CustomInfo = new CustomInfo(),
        public Content?: CustomContent,
        public LinkInfo?: KakaoLinkInfo
    ) {

    }

    readAttachment(rawJson: any): void {
        if (rawJson['P']) this.Info.readRawContent(rawJson['P']);

        if (rawJson['C']) this.Content = CustomContent.fromRawContent(rawJson['C'], this.Info.Type);

        if (rawJson['K']) {
            this.LinkInfo = new KakaoLinkInfo();
            this.LinkInfo.readRawContent(rawJson['K']);
        }
    }

    toJsonAttachment() {
        let obj: any = {
            'P': this.Info.toRawContent()
        };

        if (this.Content) obj['C'] = this.Content.toRawContent();

        if (this.LinkInfo) {
            obj['K'] = this.LinkInfo.toRawContent();
        }

        return obj;
    }

    get RequiredMessageType() {
        return ChatType.Custom;
    }

}
