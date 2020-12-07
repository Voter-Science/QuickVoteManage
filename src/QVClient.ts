import { string } from "prop-types";
import * as XC from "trc-httpshim/xclient";

// Describe an individual stage
export interface IPolicyDescription {
  key: string; // API value passed to IStageDescription.policy
  description: string; // Human readable description of a policy
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

  policyDetails?: IPolicyDescription[];
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
}
