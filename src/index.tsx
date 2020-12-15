import * as React from "react";
import * as ReactDOM from "react-dom";
import styled from "@emotion/styled";
import css from "@emotion/css";
import { ToastContainer, toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import DatePicker from "react-datepicker";

import * as XC from "trc-httpshim/xclient";

import { PluginShell } from "trc-react/dist/PluginShell";
import { Copy } from "trc-react/dist/common/Copy";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";
import { Button } from "trc-react/dist/common/Button";
import { Grid } from "trc-react/dist/common/Grid";
import { TabsPanel } from "trc-react/dist/common/TabsPanel";

import Reports from "./tabs/Reports";

import * as QV from "./QVClient";
import * as Slates from "./SlateClient";
import { withQVContainer } from "./QVContainer";

interface IState {
  Model: QV.IQVModel;
  isDirty: boolean;
  saving: boolean;
  loadingSlates: boolean;
  sendingLinks: boolean;
  linksSent: boolean;
  slates: Slates.ISlate[];
  slatesMap: { [dynamic: string]: boolean | Slates.ISlate };
}

interface IProps {
  authToken: string;
  sheetId: string;
  model: QV.IQVModel;
}

function arrayMove(arr: any[], oldIndex: number, newIndex: number) {
  if (newIndex >= arr.length) {
    let k = newIndex - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  return arr;
}

const SLATE_BASE_URL = "https://petitionbuilder.org/slate/";

const PseudoTableHeader = styled.div<{ saving: boolean }>`
  border-top: solid 1px gray;
  border-bottom: solid 1px gray;
  padding: 0.6rem 0;
  display: flex;
  margin: 0.5rem -2rem 1rem -2rem;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  > div:nth-child(1) {
    width: 3%;
  }
  > div:nth-child(2) {
    width: 10%;
  }
  > div:nth-child(3) {
    width: 18%;
  }
  > div:nth-child(4) {
    width: 15%;
  }
  > div:nth-child(5) {
    width: 18%;
  }
  > div:nth-child(6) {
    width: 36%;
  }
  ${(props) =>
    props.saving &&
    css`
      opacity: 0.4;
      pointer-events: none;
    `}
`;

const PseudoTableBody = styled.ul<{ saving: boolean }>`
  margin: 0 -2rem 1.5rem -2rem;
  padding: 0;
  list-style-type: none;
  font-size: 15px;
  ${(props) =>
    props.saving &&
    css`
      opacity: 0.4;
      pointer-events: none;
    `}
`;

const PseudoTableRow = styled.li<{
  current: boolean;
  readonly: boolean;
  midstage: boolean;
}>`
  display: flex;
  padding: 0.8rem 0;
  border-bottom: solid 1px #d8d8d8;
  line-height: 1.35;
  position: relative;
  > div {
    flex-grow: 0;
    flex-shrink: 0;
    word-wrap: break-word;
  }
  > div:nth-child(1) {
    cursor: grab;
    width: 3%;
    text-align: center;
    i {
      line-height: 1.3;
      font-size: 15px;
      position: relative;
      top: 2px;
    }
  }
  > div:nth-child(2) {
    width: 10%;
    overflow: hidden;
    border-right: solid 8px transparent;
  }
  > div:nth-child(3) {
    width: 18%;
  }
  > div:nth-child(4) {
    width: 15%;
  }
  > div:nth-child(5) {
    width: 18%;
  }
  > div:nth-child(6) {
    width: 36%;
  }
  &:hover .remove-stage {
    display: block;
  }
  ${(props) =>
    props.readonly &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
  ${(props) =>
    props.current &&
    css`
      background: #cefdd2;
      pointer-events: none;
    `}
  ${(props) =>
    props.midstage &&
    css`
      border-bottom: solid 4px #13a01f;
      pointer-events: none;
      opacity: 0.5;
    `}
`;

const EditableTitle = styled.input`
  border: none;
  background: none;
  display: block;
  width: 100%;
  font-weight: 700;
  font-size: 28px;
  margin-bottom: 8px;
  &:hover,
  &:focus {
    border: solid 1px #aaa;
    border-radius: 2px;
    outline: none;
  }
`;

const EditableString = styled.input`
  border: none;
  background: none;
  display: inline;
  &:hover,
  &:focus {
    border: solid 1px #aaa;
    border-radius: 2px;
    outline: none;
  }
  &[type="number"] {
    width: 36px;
  }
`;

const EditableOption = styled.select`
  appearance: none;
  border: none;
  background: none;
  margin-right: 3px;
  &:hover,
  &:focus {
    border-bottom: solid 2px #aaa;
    font-size: 15px;
    outline: none;
  }
`;

const RemoveStage = styled.button`
  display: none;
  cursor: pointer;
  color: red;
  position: absolute;
  top: 50%;
  right: -30px;
  transform: translateY(-50%);
  height: 46px;
  background: none;
  border: none;
  &:focus,
  &:active {
    outline: none;
  }
`;

const LegacyUrl = styled.a`
  display: block;
  color: #6485ff;
`;

const SlateUrl = styled.a`
  color: #6485ff;
  font-size: 15px;
  margin-left: 8px;
  pointer-events: all;
`;

const CreateNewSlate = styled.a`
  color: #6485ff;
  font-size: 11px;
  margin-top: 8px;
  pointer-events: all;
`;

const CandidatesNames = styled.ul`
  margin: 8px 0 0 0;
  padding: 0;
  list-style-type: none;
  font-size: 11px;
  li {
    display: inline;
    &::after {
      content: ", ";
    }
    &:last-child::after {
      content: "";
    }
  }
`;

const SlateError = styled.p`
  color: red;
  margin: 8px 0 0 0;
  font-size: 11px;
`;

const CSVIcon = styled.img`
  width: 24px;
  position: relative;
  top: 5px;
`;

export class App extends React.Component<IProps, IState> {
  private qvClient: QV.QVClient;
  private slateClient: Slates.SlatesClient;

  public constructor(props: any) {
    super(props);

    this.state = {
      Model: props.model,
      saving: false,
      isDirty: false,
      loadingSlates: true,
      sendingLinks: false,
      linksSent: false,
      slates: [],
      slatesMap: {},
    };

    const server1 = "https://quickvote.voter-science.com";
    const httpClient1 = XC.XClient.New(
      server1,
      this.props.authToken,
      undefined
    );
    this.qvClient = new QV.QVClient(httpClient1, this.props.sheetId);

    const server2 = "https://trc-login.voter-science.com";
    const httpClient2 = XC.XClient.New(
      server2,
      this.props.authToken,
      undefined
    );
    this.slateClient = new Slates.SlatesClient(httpClient2, this.props.sheetId);

    this.addStage = this.addStage.bind(this);
    this.removeStage = this.removeStage.bind(this);

    this.handlePageTitleChange = this.handlePageTitleChange.bind(this);
    this.handlePageDateChange = this.handlePageDateChange.bind(this);
    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handlePolicyChange = this.handlePolicyChange.bind(this);
    this.handleForbidUndervoteChange = this.handleForbidUndervoteChange.bind(
      this
    );
    this.handleNWinnersChange = this.handleNWinnersChange.bind(this);
    this.handleFilterUserChange1 = this.handleFilterUserChange1.bind(this);
    this.handleFilterUserChange2 = this.handleFilterUserChange2.bind(this);
    this.handleSouceChange = this.handleSouceChange.bind(this);
    this.handleSInlineChange = this.handleSInlineChange.bind(this);
    this.handleSSlateChange = this.handleSSlateChange.bind(this);
    this.populateSlatesMap = this.populateSlatesMap.bind(this);

    this.calculateSourceValue = this.calculateSourceValue.bind(this);

    this.updateSorting = this.updateSorting.bind(this);

    this.save = this.save.bind(this);

    this.sendSecretLinks = this.sendSecretLinks.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
  }

  private addStage() {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy.push({
      policy: "TopN",
      title: "",
      nWinners: 1,
      forbidUndervote: false,
      sourceSlate: null,
      sourceInline: "Yes,No",
      sourceAlternates: false,
    });
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy });
  }

  private removeStage(index: number) {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy.splice(index, 1);
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handlePageTitleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const modelCopy = { ...this.state.Model };
    modelCopy.title = e.target.value;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handlePageDateChange(date: Date): void {
    const modelCopy = { ...this.state.Model };
    modelCopy.targetDate = date;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handleTitleChange(title: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].title = title;
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handlePolicyChange(policy: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].policy = policy;
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handleForbidUndervoteChange(val: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].forbidUndervote = val === "1";
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handleNWinnersChange(num: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    if (stagesCopy[index].sourceInline === "Yes,No") {
      alert(
        'Invalid operation: the "Yes/No" source type supports at most one winner. Change the source type to increase the number of potential winners.'
      );
      return;
    }
    stagesCopy[index].nWinners = Number(num);
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handleFilterUserChange1(val: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].filterUser = val
      ? `${val}:${this.state.Model.filterMetadata.columns[val][0].value}`
      : null;
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handleFilterUserChange2(val: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    const parts = stagesCopy[index].filterUser.split(":");
    stagesCopy[index].filterUser = val ? `${parts[0]}:${val}` : null;
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handleSInlineChange(val: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].sourceInline = val;
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private handleSSlateChange(val: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    const normalizedVal = SLATE_BASE_URL + val.replace(SLATE_BASE_URL, "");
    stagesCopy[index].sourceSlate = val ? normalizedVal : "";
    modelCopy.stages = stagesCopy;
    if (val) {
      this.populateSlatesMap(normalizedVal);
    }
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private populateSlatesMap(slateId: string) {
    if (this.state.slatesMap[slateId] === undefined) {
      this.slateClient
        .GetSlate(slateId.replace(SLATE_BASE_URL, ""))
        .then((data) => {
          const slatesMapCopy = { ...this.state.slatesMap };
          slatesMapCopy[slateId] = data;
          this.setState({ slatesMap: slatesMapCopy });
        })
        .catch(() => {
          const slatesMapCopy = { ...this.state.slatesMap };
          slatesMapCopy[slateId] = false;
          this.setState({ slatesMap: slatesMapCopy });
        });
    }
  }

  private handleSouceChange(val: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];

    if (val === "yn") {
      stagesCopy[index].nWinners = 1;
      stagesCopy[index].sourceInline = "Yes,No";
      stagesCopy[index].sourceAlternates = false;
      stagesCopy[index].sourceSlate = null;
    }

    if (val === "inline") {
      stagesCopy[index].sourceInline = "";
      stagesCopy[index].sourceAlternates = false;
      stagesCopy[index].sourceSlate = null;
    }

    if (val === "slate") {
      stagesCopy[index].sourceInline = null;
      stagesCopy[index].sourceAlternates = false;
      stagesCopy[index].sourceSlate = "";
    }

    if (val === "alternates") {
      stagesCopy[index].sourceInline = null;
      stagesCopy[index].sourceAlternates = true;
      stagesCopy[index].sourceSlate = null;
    }

    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private calculateSourceValue(index: number): string {
    const stage = this.state.Model.stages[index];

    if (stage.sourceInline === "Yes,No") {
      return "yn";
    }

    if (typeof stage.sourceInline === "string") {
      return "inline";
    }

    if (typeof stage.sourceSlate === "string") {
      return "slate";
    }

    if (stage.sourceAlternates) {
      return "alternates";
    }
  }

  private updateSorting(oldIndex: number, newIndex: number) {
    if (newIndex <= this.state.Model.stage) {
      toast.error(
        "Can't move a future stage before a completed or active stage."
      );
      return;
    }
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    arrayMove(stagesCopy, oldIndex, newIndex);
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy, isDirty: true });
  }

  private save(): Promise<any> {
    return this.qvClient.PostModel(this.state.Model);
  }

  private sendSecretLinks(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const proceed = confirm("Are you sure you want to continue?");
    if (proceed) {
      this.setState({ sendingLinks: true });
      this.qvClient
        .SendLinks()
        .then(() => this.setState({ linksSent: true, sendingLinks: false }))
        .catch(() => this.setState({ sendingLinks: false }));
    }
  }

  private handleTabClick(tab: string) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", tab);
    const newRelativePathQuery =
      window.location.pathname + "?" + searchParams.toString();
    history.pushState(null, "", newRelativePathQuery);
  }

  private SortableList = SortableContainer(() => {
    return (
      <PseudoTableBody saving={this.state.saving}>
        {this.state.Model.stages.map((stage: any, index: number) => {
          return (
            <this.SortableItem
              stage={stage}
              key={index}
              index={index}
              indx={index}
            />
          );
        })}
      </PseudoTableBody>
    );
  });

  private SortableItem = SortableElement(({ stage, indx }: any) => {
    let sourceTooltipMessage = "";
    const source = this.calculateSourceValue(indx);
    if (source === "yn") sourceTooltipMessage = "Choices are “yes,no”";
    if (source === "slate")
      sourceTooltipMessage =
        "Choices are pulled from a Slate page via PetitionBuilder.org";
    if (source === "alternates")
      sourceTooltipMessage =
        "Choices from this stage are the losers from the previous stage.";
    if (source === "inline")
      sourceTooltipMessage = "Enter candidate names directly here.";

    return (
      <PseudoTableRow
        current={this.state.Model.stage === indx}
        midstage={this.state.Model.stage === indx + 0.5}
        readonly={indx < this.state.Model.stage}
      >
        <div>
          <i className="material-icons">drag_indicator</i>
        </div>
        <div>
          <EditableOption
            value={stage.policy}
            onChange={(e) => this.handlePolicyChange(e.target.value, indx)}
            style={{ width: "54px" }}
          >
            {this.state.Model.policyDetails.map((policy) => (
              <option key={policy.key} value={policy.key}>
                {policy.key}
              </option>
            ))}
          </EditableOption>
          <span
            data-tip={
              this.state.Model?.policyDetails.find(
                (x) => x.key === stage.policy
              )?.description
            }
          >
            <i
              className="material-icons"
              style={{
                fontSize: "17px",
                lineHeight: "0",
                position: "relative",
                top: "4px",
              }}
            >
              info
            </i>
          </span>
        </div>
        <div>
          <EditableString
            type="text"
            value={stage.title}
            onChange={(e) => this.handleTitleChange(e.target.value, indx)}
            style={{ width: "158px" }}
          />
        </div>
        <div>
          <EditableOption
            value={stage.forbidUndervote ? "1" : "0"}
            onChange={(e) =>
              this.handleForbidUndervoteChange(e.target.value, indx)
            }
          >
            <option value="1">Exactly</option>
            <option value="0">Up to</option>
          </EditableOption>
          <EditableString
            type="number"
            min="1"
            max="4"
            value={stage.nWinners}
            onChange={(e) => this.handleNWinnersChange(e.target.value, indx)}
          />
        </div>
        <div>
          <EditableOption
            value={stage.filterUser ? stage.filterUser.split(":")[0] : ""}
            onChange={(e) => this.handleFilterUserChange1(e.target.value, indx)}
            style={{ width: "64px" }}
          >
            <option value="">Everyone</option>
            {this.state.Model.filterMetadata &&
              Object.keys(this.state.Model.filterMetadata.columns).map(
                (key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                )
              )}
          </EditableOption>
          {stage.filterUser && (
            <>
              {" "}
              ={" "}
              <EditableOption
                value={stage.filterUser ? stage.filterUser.split(":")[1] : ""}
                onChange={(e) =>
                  this.handleFilterUserChange2(e.target.value, indx)
                }
                style={{ width: "64px" }}
              >
                {this.state.Model.filterMetadata.columns[
                  stage.filterUser.split(":")[0]
                ].map(({ value, countHint }) => (
                  <option key={value} value={value}>
                    {value} ({countHint})
                  </option>
                ))}
              </EditableOption>
            </>
          )}
        </div>
        <div>
          <EditableOption
            value={this.calculateSourceValue(indx)}
            onChange={(e) => this.handleSouceChange(e.target.value, indx)}
          >
            <option value="yn">Yes/No</option>
            <option value="inline">Inline</option>
            <option value="slate">Slate</option>
            <option value="alternates">Alternates</option>
          </EditableOption>

          <span data-tip={sourceTooltipMessage}>
            <i
              className="material-icons"
              style={{
                fontSize: "17px",
                lineHeight: "0",
                position: "relative",
                top: "4px",
                marginRight: "5px",
              }}
            >
              info
            </i>
          </span>

          {this.calculateSourceValue(indx) === "inline" && (
            <EditableString
              type="text"
              value={stage.sourceInline}
              placeholder="Enter list of comma separated names"
              style={{ width: "220px" }}
              onChange={(e) => this.handleSInlineChange(e.target.value, indx)}
            />
          )}
          {this.calculateSourceValue(indx) === "slate" && (
            <>
              <EditableString
                list={`slate-${indx}`}
                type="text"
                value={stage.sourceSlate.replace(SLATE_BASE_URL, "")}
                placeholder="Enter slate URL or ID"
                style={{ width: "200px" }}
                onChange={(e) => this.handleSSlateChange(e.target.value, indx)}
              />
              <datalist id={`slate-${indx}`}>
                {this.state.slates.map((slate) => (
                  <option value={slate.SlateId} key={slate.SlateId}>
                    {slate.Title}
                  </option>
                ))}
              </datalist>
              {stage.sourceSlate && (
                <SlateUrl href={stage.sourceSlate} target="_blank">
                  &#x2197;
                </SlateUrl>
              )}
              <div>
                {/* @ts-ignore */}
                {this.state.slatesMap[stage.sourceSlate]?.Items?.length > 0 && (
                  <CandidatesNames>
                    {/* @ts-ignore */}
                    {this.state.slatesMap[stage.sourceSlate].Items?.map(
                      // @ts-ignore
                      (candidate, i) => (
                        <li key={i}>[{candidate.CandidateName}]</li>
                      )
                    )}
                  </CandidatesNames>
                )}
                {this.state.slatesMap[stage.sourceSlate] === false && (
                  <SlateError>Invalid slate ID</SlateError>
                )}
                <CreateNewSlate
                  href="https://petitionbuilder.org/slate/create"
                  target="_blank"
                >
                  Create new slate
                </CreateNewSlate>
              </div>
            </>
          )}
        </div>
        {indx > this.state.Model.stage && (
          <RemoveStage
            className="remove-stage"
            onClick={() => this.removeStage(indx)}
          >
            <i
              className="material-icons"
              style={{
                fontSize: "17px",
                lineHeight: "0",
                position: "relative",
                top: "4px",
              }}
            >
              remove_circle
            </i>
          </RemoveStage>
        )}
      </PseudoTableRow>
    );
  });

  componentDidMount() {
    window.addEventListener("beforeunload", (e) => {
      if (!this.state.isDirty) {
        return undefined;
      }

      const confirmationMessage =
        "There are unsaved changes. " +
        "If you leave before saving, your changes will be lost.";

      (e || window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    });

    this.slateClient
      .GetSlates()
      .then((data) =>
        this.setState({ loadingSlates: false, slates: data.Results })
      );

    this.state.Model.stages.forEach((stage) => {
      if (stage.sourceSlate) {
        this.populateSlatesMap(stage.sourceSlate);
      }
    });
  }

  render() {
    return (
      <PluginShell
        description="A plugin for managing elections."
        title="QuickVote-Manage"
      >
        <TabsPanel
          initialTab={
            new URLSearchParams(window.location.search).get("tab") ||
            "[3] Agenda"
          }
          tabNames={[
            "[1] Credentials",
            "[2] Invites",
            "[3] Agenda",
            "[4] Run",
            "[5] Reports",
          ]}
          onTabClick={this.handleTabClick}
        >
          <>
            <Copy>
              <h3>Determines who is allowed to vote in the election</h3>
              <LegacyUrl
                href={`https://quickvote.voter-science.com/Election/${this.props.sheetId.replace(
                  "el_",
                  ""
                )}/manage`}
                target="_blank"
              >
                Please access this functionality on the legacy management page
              </LegacyUrl>
            </Copy>
          </>
          <>
            <Copy>
              <p>
                You have{" "}
                <strong>
                  {this.state.Model.credentialMetadata.totalUsers}
                </strong>{" "}
                possible voters.
              </p>
              <p>There are two ways to invite people to this election:</p>
              <ol>
                <li>
                  Use a public link:{" "}
                  <a
                    href={this.state.Model.credentialMetadata.publicVoteUrl}
                    target="_blank"
                  >
                    {this.state.Model.credentialMetadata.publicVoteUrl}
                  </a>
                </li>
                <li>
                  Send each individual their own personal secret link.
                  <ul>
                    <li>
                      <a
                        href={
                          this.state.Model.credentialMetadata
                            .urlCsvDownloadSecretLinks
                        }
                      >
                        Download all secret links
                      </a>{" "}
                      <CSVIcon src="https://trcanvasdata.blob.core.windows.net/publicimages/export-csv.png" />{" "}
                      – you can send these yourself via a mail merge
                    </li>
                    <li>
                      <a href="#" onClick={this.sendSecretLinks}>
                        Email out secret links
                      </a>
                      {this.state.sendingLinks && (
                        <strong> [sending...]</strong>
                      )}
                      {this.state.linksSent && <strong> [sent ✓]</strong>} –
                      participants will receive an invite from{" "}
                      <strong>info@Voter-science.com</strong>
                    </li>
                  </ul>
                </li>
              </ol>
            </Copy>
          </>
          <>
            <Copy>
              <EditableTitle
                value={this.state.Model.title}
                type="text"
                onChange={this.handlePageTitleChange}
              />{" "}
              on{" "}
              <DatePicker
                selected={new Date(this.state.Model.targetDate)}
                onChange={this.handlePageDateChange}
              />
              <Grid>
                <div>
                  {this.state.Model.stage === -1 && (
                    <p>
                      <i>Election is not yet open</i>
                    </p>
                  )}
                  {this.state.Model.done && (
                    <p>
                      Election is <strong>done</strong>.
                    </p>
                  )}
                </div>
                <LegacyUrl
                  href={`https://quickvote.voter-science.com/Election/${this.props.sheetId.replace(
                    "el_",
                    ""
                  )}/manage`}
                  target="_blank"
                  style={{ textAlign: "right" }}
                >
                  Open in legacy plugin
                </LegacyUrl>
              </Grid>
            </Copy>

            <Copy>
              <h4 style={{ marginTop: `2rem` }}>Stages:</h4>
            </Copy>

            <ReactTooltip />

            <PseudoTableHeader saving={this.state.saving}>
              <div />
              <div>
                Policy{" "}
                <span data-tip="The rules for this stage, such as whether winners need a majority or just plurality, handling ties, runoffs, etc">
                  <i
                    className="material-icons"
                    style={{
                      fontSize: "17px",
                      lineHeight: "0",
                      position: "relative",
                      top: "4px",
                    }}
                  >
                    info
                  </i>
                </span>
              </div>
              <div>Title</div>
              <div>
                nWinners{" "}
                <span data-tip="How many candidates can we vote for on this ballot?">
                  <i
                    className="material-icons"
                    style={{
                      fontSize: "17px",
                      lineHeight: "0",
                      position: "relative",
                      top: "4px",
                    }}
                  >
                    info
                  </i>
                </span>
              </div>
              <div>
                Who{" "}
                <span data-tip="Who can vote in this stage.">
                  <i
                    className="material-icons"
                    style={{
                      fontSize: "17px",
                      lineHeight: "0",
                      position: "relative",
                      top: "4px",
                    }}
                  >
                    info
                  </i>
                </span>
              </div>
              <div>Source</div>
            </PseudoTableHeader>

            <this.SortableList
              onSortEnd={({ oldIndex, newIndex }) => {
                this.updateSorting(oldIndex, newIndex);
              }}
              pressDelay={100}
              axis="y"
            />

            <HorizontalList alignRight>
              <Button onClick={this.addStage} disabled={this.state.saving}>
                Add stage
              </Button>
              <Button
                disabled={this.state.saving || !this.state.isDirty}
                onClick={async () => {
                  this.setState({ saving: true });
                  this.save()
                    .then(() => {
                      toast.success("Model updated successfully.");
                      this.setState({ saving: false, isDirty: false });
                    })
                    .catch((err) => {
                      alert("Error: " + err.Message);
                      toast.error("An error has occured, please try again.");
                      this.setState({ saving: false });
                    });
                }}
              >
                Save
              </Button>
            </HorizontalList>
          </>
          <>
            <Copy>
              <h3>Run your election</h3>
              <LegacyUrl
                href={`https://quickvote.voter-science.com/Election/${this.props.sheetId.replace(
                  "el_",
                  ""
                )}/manage`}
                target="_blank"
              >
                Please access this functionality on the legacy management page
              </LegacyUrl>
            </Copy>
          </>
          <>
            <Reports model={this.state.Model} />
          </>
        </TabsPanel>
        <ToastContainer />
      </PluginShell>
    );
  }
}

const EnchancedApp = withQVContainer(App);

ReactDOM.render(<EnchancedApp />, document.getElementById("app"));
