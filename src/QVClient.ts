import * as XC from "trc-httpshim/xclient";

// Describe an individual stage
export interface IPolicyDescription {
  key: string; // API value passed to IStageDescription.policy
  description: string; // Human readable description of a policy
}

export interface IFilterMetadataEntry {
  value: string;
  countHint: number;
}

export interface IFilterMetadata {
  // public Dictionary<string, Entry[]> Columns { get; set; }
  columns: { [columnName: string]: IFilterMetadataEntry[] };
}

// Describes reports that are available for download.
// These can contstruct hyperlinks.
export interface IReportMetadata {
  title: string;
  details: string;

  // This hyperlink will point to an endpoint that provides a CSV download.
  urlCsvDownload: string; // https://quickvote....
}

export interface ICredentialMetadata {
  // Users in the credential list.
  totalUsers: number;

  // A full url for the public invite link.
  publicVoteUrl: string;

  urlCsvDownloadSecretLinks: string; // Url to download secret links.
}

// Called from polling endpoint
export interface IManageResponse {
  numUsers: number;
  quickPollCountBallotsReceived: number;
  countBallotsReceived: number;
  errorMessage: string; // critical configuration error. Warn and block moving.
}

// Describe each stage of the election.
export interface IStageDescription {
  // Policy determines the voting rules for this stage.
  policy: string;

  // The title for this stage.
  title: string;

  // Positive integer number for # of winners we need to elect in this stage.
  nWinners: number;

  // If true, then ballots can't have an undervote.
  // Default to false.
  forbidUndervote?: boolean;

  // The "source" fields are all exclusive. They determine where the candidates come frome
  // If set, the URL of the Slate. Will look like:
  // https://petitionbuilder.org/slate/85a7fe1888d04cec88cedd387cfbf5b6
  sourceSlate?: string;

  // If set, then a *ordered* comma-separate list of items to appear on the ballot.
  sourceInline?: string;

  // Boolean - if set, then ths candidates from this stage are the "losers" from the previous stage.
  sourceAlternates?: boolean;

  // Optional field. If not set, all users can participate in this stage.
  // If set, Only given users are allowed to participate in this stage.
  // Filter is of form: "Column:Value"
  // Column uses the extra data from VoterInfo
  filterUser?: string;
}

// Subset of fields that can be edited
export interface IQVModelEdit {
  title: string;
  targetDate?: Date;

  stages: IStageDescription[];
}

export interface IQVModel extends IQVModelEdit {
  // Boolean. If true, then the election is completed.
  done?: boolean;

  // 0-based index into "current stage".
  // -1 if we haven't started the election yet.
  stage: number;

  // Stage and round combined.
  stageRoundMoniker: number;

  policyDetails?: IPolicyDescription[];

  filterMetadata?: IFilterMetadata;

  reportMetadata?: IReportMetadata[];

  credentialMetadata?: ICredentialMetadata;
}

// Client for QuickVote APIs.
export class QVClient {
  public _http: XC.XClient;
  public _sheetId: string;

  public constructor(http: XC.XClient, sheetId: string) {
    this._http = http;
    this._sheetId = sheetId;
  }

  public GetModel(): Promise<IQVModel> {
    let plainUri = `/api/manage/${this._sheetId}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.getAsync(uri);
  }

  public PostModel(model: IQVModel): Promise<void> {
    let plainUri = `/api/manage/${this._sheetId}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, model);
  }

  public PostMoveToNextRound(stageRoundMoniker: number): Promise<void> {
    let plainUri = `/api/manage/${this._sheetId}/MoveNextRound?round=${stageRoundMoniker}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, {});
  }

  public GetPollResult(stageRoundMoniker: number): Promise<IManageResponse> {
    var shortId = this._sheetId.substr(3);
    let plainUri = `/election/${shortId}/ajaxmanage?round=${stageRoundMoniker}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync<IManageResponse>(uri, {});
  }

  public SendLinks(): Promise<void> {
    let plainUri = `/api/manage/${this._sheetId}/sendlinks`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, {});
  }
}
