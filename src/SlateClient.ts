import * as XC from "trc-httpshim/xclient";

export interface ISlateModel {
  Results: ISlate[];
}

export interface ISlate {
  CreatedTimeUtc: string;
  Description: string;
  DontList: boolean;
  ElectionYear: number;
  GeoScope: string;
  ImageUrl: string;
  IsOwner: boolean;
  Items?: {
    CandidateName: string;
    Comments: string;
    FacebookUrl: string;
    ImageUrl: string;
    Position: string;
    TwitterUrl: string;
    Url: string;
    ViewSize: string;
  }[];
  LastUpdateTimeUtc: string;
  OwnerInfo: {
    LastNDaysViews: number[];
    TotalViews: number;
  };
  SlateId: string;
  Title: string;
  TotalViews: number;
}

export class SlatesClient {
  public _http: XC.XClient;
  public _sheetId: string;

  public constructor(http: XC.XClient, sheetId: string) {
    this._http = http;
    this._sheetId = sheetId;
  }

  public GetSlates(): Promise<ISlateModel> {
    let plainUri = `/slate`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.getAsync(uri);
  }

  public GetSlate(slateId: string): Promise<ISlate> {
    let plainUri = `/slate/${slateId}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.getAsync(uri);
  }
}
