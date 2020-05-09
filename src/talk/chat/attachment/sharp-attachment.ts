import { ChatAttachment, AttachmentContent } from "./chat-attachment";
import { ChatType } from "../chat-type";

export enum SharpContentType {

    NONE = '',
    LIST = 'list',
    IMAGE = 'image',
    VIDEO_CLIP = 'vclip',
    WEATHER = 'weather',
    MOVIE = 'movie',
    MEDIA = 'media',
    RANK = 'rank',
    SIMPLE = 'simple'

}

export abstract class SharpBaseContent implements AttachmentContent {
    
    abstract readRawContent(rawData: any): void;
    
    abstract toRawContent(): any;

}

export abstract class SharpContent extends SharpBaseContent {
    
    abstract readRawContent(rawData: any): void;
    
    abstract toRawContent(): any;

}

export abstract class SharpFragment extends SharpBaseContent {

}

export class SharpImageFragment extends SharpFragment {

    constructor(
        public ImageURL: string = '',
        public ImageWidth: number = -1,
        public ImageHeight: number = -1
    ) {
        super();
    }

    readRawContent(rawData: any) {
        this.ImageURL = rawData['I'] || '';
        this.ImageWidth = rawData['W'] || -1;
        this.ImageHeight = rawData['H'] || -1;
    }

    toRawContent(): any {
        let obj: any = {
            'I': this.ImageURL
        }

        if (this.ImageWidth !== -1) {
            obj['W'] = this.ImageWidth;
        }

        if (this.ImageHeight !== -1) {
            obj['H'] = this.ImageHeight;
        }

        return obj;
    }
}

export class SharpTextFragment extends SharpFragment {
    constructor(
        public Text: string = '',
        public Description: string = ''
    ) {
        super();
    }

    readRawContent(rawData: any) {
        this.Text = rawData['T'] || '';
        this.Description = rawData['DE'] || '';
    }

    toRawContent(): any {
        let obj: any = {
            'T': this.Text
        }

        if (this.Description !== '') {
            obj['DE'] = this.Description;
        }

        return obj;
    }
}

export class SharpButtonFragment extends SharpFragment {
    constructor(
        public Text: string = '',
        public RedirectLink: string = '',
        public Icon: string = '' //Currently only 'more'
    ) {
        super();
    }

    readRawContent(rawData: any) {
        this.Text = rawData['T'] || '';
        this.RedirectLink = rawData['L'] || '';
        this.Icon = rawData['TP'] || '';
    }

    toRawContent(): any {
        let obj: any = {
            'T': this.Text
        }

        if (this.RedirectLink !== '') {
            obj['L'] = this.RedirectLink;
        }

        if (this.Icon !== '') {
            obj['TP'] = this.Icon;
        }

        return obj;
    }
}

export class SharpAttachment implements ChatAttachment {

    constructor(
        public Question: string = '',
        public RedirectURL: string = '',
        public ContentType: SharpContentType = SharpContentType.NONE,
        public ContentList: SharpContent[] = [],
        public MainImage?: SharpImageFragment,
        public Footer?: SharpButtonListContent
    ) {
        
    }

    get RequiredMessageType() {
        return ChatType.Search;
    }

    readAttachment(rawJson: any): void {
        this.Question = rawJson['Q'];

        this.ContentType = rawJson['V'] || SharpContentType.NONE;

        if (rawJson['I']) {
            this.MainImage = new SharpImageFragment();
            this.MainImage.readRawContent(rawJson);
        }

        this.RedirectURL = rawJson['L'];

        this.ContentList = [];

        if (rawJson['R']) {
            let list: any[] = rawJson['R'];

            for (let rawContent of list) {
                let content: SharpBaseContent;

                switch(this.ContentType) {
                    case SharpContentType.VIDEO_CLIP: content = new SharpVideoContent(); break;
                    
                    case SharpContentType.MEDIA: content = new SharpMediaContent(); break;

                    case SharpContentType.LIST:
                    case SharpContentType.IMAGE: content = new SharpImageContent(); break;

                    case SharpContentType.MOVIE: content = new SharpMovieContent(); break;

                    case SharpContentType.RANK: content = new SharpRankContent(); break;

                    case SharpContentType.WEATHER: content = new SharpWeatherContent(); break;

                    case SharpContentType.SIMPLE: 
                    default: content = new SharpSimpleContent(); break;
                }

                content.readRawContent(rawContent);

                this.ContentList.push(content);
            }
        }

        if (rawJson['F']) {
            this.Footer = new SharpButtonListContent();

            this.Footer.readRawContent(rawJson['F']);
        }
    }

    toJsonAttachment() {
        let obj: any = {
            'Q': this.Question,
            'V': this.ContentType,
            'L': this.RedirectURL
        };

        if (this.MainImage) {
            Object.assign(obj, this.MainImage.toRawContent());
        }

        if (this.ContentList.length > 0) {
            let rawList = [];

            for (let content of this.ContentList) {
                rawList.push(content.toRawContent());
            }

            obj['R'] = rawList;
        }

        if (this.Footer) {
            obj['F'] = this.Footer.toRawContent();
        }

        return obj;
    }

}

export class SharpButtonListContent extends SharpContent {
    constructor(
        public ButtonList?: SharpButtonFragment[],
        
    ) {
        super();
    }

    readRawContent(rawData: any) {
        if (rawData['BU']) {
            this.ButtonList = [];

            for (let rawBtn of rawData['BU']) {
                let btn = new SharpButtonFragment();

                btn.readRawContent(rawBtn);

                this.ButtonList.push(btn);
            }
        }
        
    }

    toRawContent(): any {
        let list: any = [];

        if (this.ButtonList) {
            for (let btn of this.ButtonList) {
                list.push(btn.toRawContent());
            }
        } else {
            return {};
        }

        return {
            'BU': list
        };
    }
}

export class SharpImageContent extends SharpContent {

    constructor(
        public RedirectURL: string = '',
        public Text?: SharpTextFragment,
        public InfoText: string = '',
        public Image?: SharpImageFragment,
    ) {
        super();
    }

    readRawContent(rawData: any) {
        if (rawData['T']) {
            this.Text = new SharpTextFragment();
            this.Text.readRawContent(rawData);
        }

        this.InfoText = rawData['D'];

        this.RedirectURL = rawData['L'];

        if (rawData['I']) {
            this.Image = new SharpImageFragment();
            this.Image.readRawContent(rawData);
        }
        
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL
        };

        if (this.InfoText !== '') {
            obj['D'] = this.InfoText;
        }

        if (this.Text) {
            Object.assign(obj, this.Text.toRawContent());
        }

        if (this.Image) {
            Object.assign(obj, this.Image.toRawContent());
        }

        return obj;
    }

}

export enum WeatherIcon {

    CLEAR = '01',
    SUN_SILGHTLY_CLOUDY = '02',
    SUN_CLOUDY = '03',
    CLOUDY = '04',
    SUN_WITH_CLOUD = '05',
    SUN_CLOUDY_2 = '06',
    RAIN = '07',
    CLOUD_RAIN = '08',
    RAIN_UMBRELLA = '09',
    LITTLE_RAIN = '10',
    SNOW = '11',
    CLOUD_SNOW = '12',
    CLOUD_SUN_SNOW = '13',
    SNOW_RAIN = '14',
    CLOUDY_SNOW_RAIN = '15',
    LITTLE_SNOW = '16',
    LIGHTNING = '17',
    FOG = '18',
    HAIL = '19',

    NIGHT_CLEAR = '20',
    NIGHT_SILGHTLY_CLOUDY = '21',
    NIGHT_MOON_CLOUDY = '22',
    MOON_WITH_CLOUD = '23',
    NIGHT_CLOUDY_2 = '24',
    NIGHT_LITTLE_RAIN = '25',
    CLOUD_MOON_SNOW = '26',
    NIGHT_LITTLE_RAIN_2 = '27',
    NIGHT_CLOUDY = '28',
    NIGHT_RAIN = '29',
    NIGHT_CLOUD_RAIN = '30',
    NIGHT_RAIN_UMBRELLA = '31',
    NIGHT_SNOW = '32',
    NIGHT_CLOUD_SNOW = '33',
    NIGHT_SNOW_RAIN = '34',
    NIGHT_CLOUDY_SNOW_RAIN = '35',
    NIGHT_LIGHTNING = '36',
    NIGHT_FOG = '37',
    NIGHT_HAIL = '38'
}

export class SharpWeatherFragment extends SharpFragment {
    
    constructor(
        public Icon: WeatherIcon = WeatherIcon.CLEAR,
        public Text: SharpTextFragment = new SharpTextFragment(),
        public Temperature: string = ''
    ) {
        super();
    }

    readRawContent(rawData: any): void {
        if (rawData['T']) {
            this.Text.readRawContent(rawData);
        }

        this.Icon = rawData['IC'];

        this.Temperature = rawData['TE'];
    }

    toRawContent() {
        let obj: any = {
            'IC': this.Icon
        };

        if (this.Temperature !== '') {
            obj['TE'] = this.Temperature;
        }

        if (this.Text) {
            Object.assign(obj, this.Text.toRawContent());
        }

        return obj;
    }

}

export class SharpWeatherContent extends SharpContent {

    constructor(
        public RedirectURL: string = '',
        public InfoText: string = '',
        public Place: string = '',
        public LastUpdate: string = '',
        public MainWeather: SharpWeatherFragment[] = [],
        public SubWeather: SharpWeatherFragment[] = [],
    ) {
        super();
    }

    readRawContent(rawData: any) {
        this.InfoText = rawData['D'];

        this.RedirectURL = rawData['L'];

        this.Place = rawData['PL'];
        this.LastUpdate = rawData['TM'];

        if (rawData['MA']) {
            this.MainWeather = [];

            for (let raw of rawData['MA']) {
                let fragment = new SharpWeatherFragment();

                fragment.readRawContent(raw);

                this.MainWeather.push(fragment);
            }
        }

        if (rawData['SU']) {
            this.SubWeather = [];

            for (let raw of rawData['SU']) {
                let fragment = new SharpWeatherFragment();

                fragment.readRawContent(raw);

                this.SubWeather.push(fragment);
            }
        }
        
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL
        };

        if (this.Place !== '') {
            obj['PL'] = this.Place;
        }

        if (this.LastUpdate !== '') {
            obj['TM'] = this.LastUpdate;
        }

        if (this.InfoText !== '') {
            obj['D'] = this.InfoText;
        }

        if (this.MainWeather.length > 0) {
            let list = [];
            for (let weather of this.MainWeather) {
                list.push(weather.toRawContent());
            }

            obj['MA'] = list;
        }

        if (this.SubWeather.length > 0) {
            let list = [];
            for (let weather of this.SubWeather) {
                list.push(weather.toRawContent());
            }

            obj['SU'] = list;
        }

        return obj;
    }

}

export class SharpSimpleContent extends SharpFragment {

    constructor(
        public RedirectURL: string = '',
        public Text: string = '', //HTML partially Supported
        public InfoText: string = ''
    ) {
        super();
    }

    readRawContent(rawData: any) {
        this.Text = rawData['T'];

        this.InfoText = rawData['D'];

        this.RedirectURL = rawData['L'];
        
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL
        };

        if (this.InfoText !== '') {
            obj['D'] = this.InfoText;
        }

        if (this.Text !== '') {
            obj['T'] = this.Text;
        }

        return obj;
    }

}

export class SharpMediaContent extends SharpContent {

    constructor(
        public RedirectURL: string = '',
        public Text?: SharpTextFragment,
        public InfoText: string = '',
        public ExtraInfoList: SharpTextFragment[] = [],
        public Image?: SharpImageFragment,
    ) {
        super();
    }

    readRawContent(rawData: any) {
        if (rawData['T']) {
            this.Text = new SharpTextFragment();
            this.Text.readRawContent(rawData);
        }

        if (rawData['DL']) {
            this.ExtraInfoList = [];

            for (let rawText of rawData['DL']) {
                if (!rawText) continue;
                
                let text = new SharpTextFragment();
                text.readRawContent(rawText);
                this.ExtraInfoList.push(text);
            }
        }

        this.InfoText = rawData['D'];

        this.RedirectURL = rawData['L'];

        if (rawData['I']) {
            this.Image = new SharpImageFragment();
            this.Image.readRawContent(rawData);
        }
        
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL
        };

        if (this.InfoText !== '') {
            obj['D'] = this.InfoText;
        }

        if (this.Text) {
            Object.assign(obj, this.Text.toRawContent());
        }

        if (this.Image) {
            Object.assign(obj, this.Image.toRawContent());
        }

        if (this.ExtraInfoList.length > 0) {
            let list = [];
            for (let text of this.ExtraInfoList) {
                list.push(text.toRawContent());
            }

            obj['DL'] = list;
        }

        return obj;
    }

}

export class SharpMovieContent extends SharpContent {

    constructor(
        public RedirectURL: string = '',
        public Text?: SharpTextFragment,
        public InfoText: string = '',
        public StarRate: string = '',
        public ExtraInfoList: SharpTextFragment[] = [],
        public ImageList: SharpImageFragment[] = []
    ) {
        super();
    }

    readRawContent(rawData: any) {
        if (rawData['T']) {
            this.Text = new SharpTextFragment();
            this.Text.readRawContent(rawData);
        }

        this.InfoText = rawData['D'];

        this.RedirectURL = rawData['L'];

        if (rawData['IL']) {
            this.ImageList = [];

            for (let rawImage of rawData['IL']) {
                if (!rawImage) continue;
                
                let img = new SharpImageFragment();
                img.readRawContent(rawImage);
                this.ImageList.push(img);
            }
            
        }

        if (rawData['DL']) {
            this.ExtraInfoList = [];

            for (let rawText of rawData['DL']) {
                if (!rawText) continue;
                
                let text = new SharpTextFragment();
                text.readRawContent(rawText);
                this.ExtraInfoList.push(text);
            }
        }
        
        this.StarRate = rawData['ST'];
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL
        };

        if (this.InfoText !== '') {
            obj['D'] = this.InfoText;
        }

        if (this.Text) {
            Object.assign(obj, this.Text.toRawContent());
        }

        if (this.ImageList.length > 0) {
            let list = [];
            for (let image of this.ImageList) {
                list.push(image.toRawContent());
            }

            obj['IL'] = list;
        }

        if (this.ExtraInfoList.length > 0) {
            let list = [];
            for (let text of this.ExtraInfoList) {
                list.push(text.toRawContent());
            }

            obj['DL'] = list;
        }

        obj['ST'] = this.StarRate;

        return obj;
    }

}

export class SharpRankContent extends SharpContent {

    constructor(
        public RedirectURL: string = '',
        public Text?: SharpTextFragment,
        public StarRate: string = '',
        public Rank: string = '',
        public Image?: SharpImageFragment
    ) {
        super();
    }

    readRawContent(rawData: any) {
        if (rawData['T']) {
            this.Text = new SharpTextFragment();
            this.Text.readRawContent(rawData);
        }

        this.RedirectURL = rawData['L'];

        if (rawData['I']) {
            this.Image = new SharpImageFragment();

            this.Image.readRawContent(rawData);
        }

        if (rawData['RA']) {
            this.Rank = rawData['RA'];
        }
        
        this.StarRate = rawData['ST'];
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL
        };

        if (this.Text) {
            Object.assign(obj, this.Text.toRawContent());
        }

        if (this.Image) {
            Object.assign(obj, this.Image.toRawContent());
        }

        if (this.Rank !== '') {
            obj['RA'] = this.Rank;
        }

        obj['ST'] = this.StarRate;

        return obj;
    }

}

export class SharpVideoContent extends SharpContent {

    constructor(
        public RedirectURL: string = '',
        public Text?: SharpTextFragment,
        public InfoText: string = '',
        public PlayTime: number = 0,
        public Image?: SharpImageFragment
    ) {
        super();
    }

    readRawContent(rawData: any) {
        if (rawData['T']) {
            this.Text = new SharpTextFragment();
            this.Text.readRawContent(rawData);
        }

        this.InfoText = rawData['D'];

        this.PlayTime = rawData['PT'] || 0;

        if (rawData['I']) {
            this.Image = new SharpImageFragment();
            this.Image.readRawContent(rawData);
        }

        this.RedirectURL = rawData['L'];
    }

    toRawContent(): any {
        let obj: any = {
            'L': this.RedirectURL,
            'PT': this.PlayTime
        };

        if (this.InfoText !== '') {
            obj['D'] = this.InfoText;
        }

        if (this.Text) {
            Object.assign(obj, this.Text.toRawContent());
        }

        if (this.Image) {
            Object.assign(obj, this.Image.toRawContent());
        }

        return obj;
    }

}