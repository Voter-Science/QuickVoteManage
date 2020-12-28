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

  // Users that have logged in.
  countEverLoggedIn: number;

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

export interface ITallyResultsEntry {
  name: string; // Candidate name. Matches candidate list.
  votes: number; // # of votes received.
  votePercent: string; // % of total vote.

  // True = this candidate won the round. (and will not appear on next ballot
  // False = this candidate lost the round (and will not appear on next ballot)
  // null/undefined - this candidate will be in runoff election next round.
  winner?: boolean; // Win, Lose, Draw

  reason: string; // human-readable string for explaining which rule determined Winner.
}

// Interface for posting partial results.
interface IPostResultEntry {
  name: string;
  result: string; // should be string literal:  "win", "lose", "draw"
}

interface IPostResult {
  round: number; // round this is intended for
  results: IPostResultEntry[];
}

export interface ITallyResults {
  // Candidate results from last ballot.
  // Sorted in decreasing order from most to least.
  results2: ITallyResultsEntry[];

  // How many total winners.
  // This is also how many max votes on each per-ballot.
  nSlots: number;

  // Number of ballots cast. Very important for determining what's a majority.
  totalBallots: number;

  round: number;
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

  //  If a non-zero length string, there's an active quick poll is out!
  activeQuickPollMessage: string;

  // undefined if voting is open (we don't have any results yet).
  // Non-null if voting is closed and we can no longer vote in this round.
  // Happens for manual voting policies. When set, display these results to the admin and
  // let them determine winners.
  partialResults: ITallyResults;

  // Stage and round combined.
  stageRoundMoniker: number;

  stageResults: {
    winners: {
      name: string;
      displayOrder: number;
      winner: boolean;
      roundDecided: number;
      votesReceived: number;
      votesCast: number;
    }[];
  }[];

  policyDetails?: IPolicyDescription[];

  filterMetadata?: IFilterMetadata;

  reportMetadata?: IReportMetadata[];

  credentialMetadata?: ICredentialMetadata;
}

export enum Mode {
  Begin,
  Stage,
  StagePartial,
  Inbetween,
  InbetweenQuickpoll,
}

// Client for QuickVote APIs.
export class QVClient {
  public _http: XC.XClient;
  public _sheetId: string;

  public constructor(http: XC.XClient, sheetId: string) {
    this._http = http;
    this._sheetId = sheetId;
  }

  public GetShortId(): string {
    return this._sheetId.substr(3);
  }

  public GetModel(): Promise<IQVModel> {
    const plainUri = `/api/manage/${this._sheetId}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.getAsync(uri);
  }

  public PostModel(model: IQVModel): Promise<void> {
    const plainUri = `/api/manage/${this._sheetId}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, model);
  }

  public GetMode(model: IQVModel): Mode {
    if (model.stage === -1) {
      if (model.activeQuickPollMessage) {
        return Mode.InbetweenQuickpoll;
      }
      return Mode.Begin;
    }
    if (model.stage >= 0 && model.stage % 1 === 0) {
      if (!model.partialResults) {
        return Mode.Stage;
      } else {
        return Mode.StagePartial;
      }
    }
    if (model.stage >= 0 && model.stage % 1 !== 0) {
      if (!model.activeQuickPollMessage) {
        return Mode.Inbetween;
      } else {
        return Mode.InbetweenQuickpoll;
      }
    }
  }

  public PostMoveToNextRound(stageRoundMoniker: number): Promise<void> {
    const plainUri = `/api/manage/${this._sheetId}/MoveNextRound?round=${stageRoundMoniker}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, {});
  }

  public GetPollResult(stageRoundMoniker: number): Promise<IManageResponse> {
    const plainUri = `/election/${this.GetShortId()}/ajaxmanage?round=${stageRoundMoniker}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync<IManageResponse>(uri, {});
  }

  public SendLinks(): Promise<void> {
    const plainUri = `/api/manage/${this._sheetId}/sendlinks`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, {});
  }

  public PostStartQuickPoll(message: string): Promise<void> {
    const plainUri = `/election/${this.GetShortId()}/ajaxquickpoll?msg=${message}`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, {});
  }

  public PostCloseQuickPoll(): Promise<{ resultsStr: string }> {
    const plainUri = `/election/${this.GetShortId()}/ajaxquickpoll/done`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, {});
  }

  public PostSubmitResults(body: {
    round: number;
    results: ITallyResultsEntry[];
  }): Promise<void> {
    const plainUri = `/election/${this.GetShortId()}/ajaxmanage/submitpartials`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, body);
  }

  public PostResetElection(): Promise<any> {
    const plainUri = `/api/manage/${this._sheetId}/reset`;
    const uri = new XC.UrlBuilder(plainUri);
    return this._http.postAsync(uri, {});
  }
}
