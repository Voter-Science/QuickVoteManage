import * as React from "react";
import styled from "@emotion/styled";
import css from "@emotion/css";
import { toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import * as autosize from "autosize";

import * as XC from "trc-httpshim/xclient";

import { Copy } from "trc-react/dist/common/Copy";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";
import { Button } from "trc-react/dist/common/Button";
import Modal from "trc-react/dist/common/Modal";
import { DownloadCsv } from "trc-react/dist/DownloadCsv";
import { CsvInput } from "trc-react/dist/CsvInput";

import * as QV from "../QVClient";
import * as Slates from "../SlateClient";
import { ISheetContents } from "trc-sheet/sheetContents";

interface IProps {
  authToken: string;
  sheetId: string;
  client: QV.QVClient;
  model: QV.IQVModel;
  setModel(model: QV.IQVModel, callback?: any): void;
  readonly?: boolean;
}

interface IState {
  Model: QV.IQVModel;
  isDirty: boolean;
  saving: boolean;
  loadingSlates: boolean;
  slates: Slates.ISlate[];
  slatesMap: { [dynamic: string]: boolean | Slates.ISlate };
  importActive: boolean;
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
    width: 9%;
  }
  > div:nth-child(3) {
    width: 18%;
  }
  > div:nth-child(4) {
    width: 12%;
  }
  > div:nth-child(5) {
    width: 11%;
  }
  > div:nth-child(6) {
    width: 47%;
  }
  ${(props) =>
    props.saving &&
    css`
      opacity: 0.4;
      pointer-events: none;
    `}
`;

const PseudoTableBody = styled.ul<{ saving: boolean; readonly: boolean }>`
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
  ${(props) =>
    props.readonly &&
    css`
      pointer-events: none;
    `}
`;

const PseudoTableRow = styled.li<{
  current: boolean;
  readonly: boolean;
  midstage: boolean;
}>`
  display: flex;
  flex-wrap: wrap;
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
    width: 9%;
    overflow: hidden;
    border-right: solid 8px transparent;
  }
  > div:nth-child(3) {
    width: 18%;
  }
  > div:nth-child(4) {
    width: 12%;
  }
  > div:nth-child(5) {
    width: 11%;
  }
  > div:nth-child(6) {
    width: 47%;
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

const EditableTextarea = styled.textarea`
  border: none;
  background: none;
  display: inline;
  resize: none;
  line-height: 1.35;
  font-size: 12px;
  height: 16px;
  &:hover,
  &:focus {
    border: solid 1px #aaa;
    border-radius: 2px;
    outline: none;
  }
`;

const EditableOption = styled.select`
  appearance: none;
  border: none;
  background: none;
  margin-right: 3px;
  vertical-align: top;
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

const Winners = styled.div`
  flex-basis: 100%;
  text-align: center;
  margin-top: 1rem;
  > span {
    font-weight: 700;
  }
  > span:after {
    content: ", ";
  }
  > span:last-child:after {
    content: "";
  }
`;

export class Agenda extends React.Component<IProps, IState> {
  private slateClient: Slates.SlatesClient;

  public constructor(props: any) {
    super(props);

    this.state = {
      Model: props.model,
      saving: false,
      isDirty: false,
      loadingSlates: true,
      slates: [],
      slatesMap: {},
      importActive: false,
    };

    const server2 = "https://trc-login.voter-science.com";
    const httpClient2 = XC.XClient.New(
      server2,
      this.props.authToken,
      undefined
    );
    this.slateClient = new Slates.SlatesClient(httpClient2, this.props.sheetId);

    this.addStage = this.addStage.bind(this);
    this.removeStage = this.removeStage.bind(this);

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handlePolicyChange = this.handlePolicyChange.bind(this);
    this.handleForbidUndervoteChange = this.handleForbidUndervoteChange.bind(
      this
    );
    this.handleNWinnersChange = this.handleNWinnersChange.bind(this);
    this.handleFilterUserChange1 = this.handleFilterUserChange1.bind(this);
    this.handleFilterUserChange2 = this.handleFilterUserChange2.bind(this);
    this.handleSourceChange = this.handleSourceChange.bind(this);
    this.handleSInlineChange = this.handleSInlineChange.bind(this);
    this.handleSSplitChange = this.handleSSplitChange.bind(this);
    this.handleSSlateChange = this.handleSSlateChange.bind(this);
    this.populateSlatesMap = this.populateSlatesMap.bind(this);

    this.calculateSourceValue = this.calculateSourceValue.bind(this);

    this.updateSorting = this.updateSorting.bind(this);
    this.csvImport = this.csvImport.bind(this);

    this.save = this.save.bind(this);
  }

  private addStage() {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    stagesCopy.push({
      policy: "Manual",
      title: "Choose your candidate",
      nWinners: 1,
      forbidUndervote: false,
      sourceSlate: null,
      sourceInline: "CandidateA, CandidateB, CandidateC",
      sourceAlternates: false,
      sourceSplit: null,
    });
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy, () => {
      this.save();
      this.autosizing();
    });
  }

  private removeStage(index: number) {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    stagesCopy.splice(index, 1);
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handleTitleChange(title: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    stagesCopy[index].title = title;
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handlePolicyChange(policy: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    stagesCopy[index].policy = policy;
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handleForbidUndervoteChange(val: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    stagesCopy[index].forbidUndervote = val === "1";
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handleNWinnersChange(num: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    if (stagesCopy[index].sourceInline === "Yes,No") {
      alert(
        'Invalid operation: the "Yes/No" source type supports at most one winner. Change the source type to increase the number of potential winners.'
      );
      return;
    }
    stagesCopy[index].nWinners = Number(num);
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handleFilterUserChange1(val: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    stagesCopy[index].filterUser = val
      ? `${val}:${this.props.model.filterMetadata.columns[val][0].value}`
      : null;
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handleFilterUserChange2(val: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    const parts = stagesCopy[index].filterUser.split(":");
    stagesCopy[index].filterUser = val ? `${parts[0]}:${val}` : null;
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handleSInlineChange(val: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    stagesCopy[index].sourceInline = val;
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handleSSplitChange(val: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    stagesCopy[index].sourceSplit = val;
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handleSSlateChange(val: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    const normalizedVal = SLATE_BASE_URL + val.replace(SLATE_BASE_URL, "");
    stagesCopy[index].sourceSlate = val ? normalizedVal : "";
    modelCopy.stages = stagesCopy;
    if (val) {
      this.populateSlatesMap(normalizedVal);
    }
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
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

  private handleSourceChange(val: string, index: number): void {
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];

    if (val === "yn") {
      stagesCopy[index].nWinners = 1;
      stagesCopy[index].sourceInline = "Yes,No";
      stagesCopy[index].sourceAlternates = false;
      stagesCopy[index].sourceSlate = null;
      stagesCopy[index].sourceSplit = null;
    }

    if (val === "inline") {
      stagesCopy[index].sourceInline = "";
      stagesCopy[index].sourceAlternates = false;
      stagesCopy[index].sourceSlate = null;
      stagesCopy[index].sourceSplit = null;
    }

    if (val === "slate") {
      stagesCopy[index].sourceInline = null;
      stagesCopy[index].sourceAlternates = false;
      stagesCopy[index].sourceSlate = "";
      stagesCopy[index].sourceSplit = null;
    }

    if (val === "alternates") {
      stagesCopy[index].sourceInline = null;
      stagesCopy[index].sourceAlternates = true;
      stagesCopy[index].sourceSlate = null;
      stagesCopy[index].sourceSplit = null;
    }

    if (val === "sourceSplit") {
      stagesCopy[index].sourceInline = null;
      stagesCopy[index].sourceAlternates = false;
      stagesCopy[index].sourceSlate = null;
      stagesCopy[index].sourceSplit = "";
    }

    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy, () => {
      this.autosizing();
    });
    this.setState({ isDirty: true });
  }

  private calculateSourceValue(index: number): string {
    const stage = this.props.model.stages[index];

    if (stage.sourceInline === "Yes,No") {
      return "yn";
    }

    if (typeof stage.sourceInline === "string") {
      return "inline";
    }

    if (typeof stage.sourceSplit === "string") {
      return "sourceSplit";
    }

    if (typeof stage.sourceSlate === "string") {
      return "slate";
    }

    if (stage.sourceAlternates) {
      return "alternates";
    }
  }

  private updateSorting(oldIndex: number, newIndex: number) {
    if (newIndex <= this.props.model.stage) {
      toast.error(
        "Can't move a future stage before a completed or active stage."
      );
      return;
    }
    const modelCopy = { ...this.props.model };
    const stagesCopy = [...this.props.model.stages];
    arrayMove(stagesCopy, oldIndex, newIndex);
    modelCopy.stages = stagesCopy;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private save() {
    this.setState({ saving: true });
    this.props.client
      .PostModel(this.props.model)
      .then(() => {
        toast.success("Model updated successfully.");
        this.setState({ saving: false, isDirty: false });
      })
      .catch((err) => {
        alert("Error: " + err.Message);
        toast.error("An error has occured, please try again.");
        this.setState({ saving: false });
      });
  }

  private SortableList = SortableContainer(() => {
    return (
      <PseudoTableBody
        saving={this.state.saving}
        readonly={this.props.readonly}
      >
        {this.props.model.stages.map((stage: any, index: number) => {
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
    return (
      <PseudoTableRow
        current={this.props.model.stage === indx}
        midstage={this.props.model.stage === indx + 0.5}
        readonly={indx < this.props.model.stage}
      >
        <div>
          {!this.props.readonly && (
            <i className="material-icons">drag_indicator</i>
          )}
        </div>
        <div>
          <EditableOption
            value={stage.policy}
            onChange={(e) => this.handlePolicyChange(e.target.value, indx)}
            style={{ width: "54px" }}
          >
            {this.props.model.policyDetails.map((policy) => (
              <option key={policy.key} value={policy.key}>
                {policy.key}
              </option>
            ))}
          </EditableOption>
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
            style={{ width: "88px" }}
          >
            <option value="">Everyone</option>
            {this.props.model.filterMetadata &&
              Object.keys(this.props.model.filterMetadata.columns).map(
                (key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                )
              )}
          </EditableOption>
          {stage.filterUser && (
            <>
              <span style={{ position: "relative", top: "-2px" }}>=</span>{" "}
              <EditableOption
                value={stage.filterUser ? stage.filterUser.split(":")[1] : ""}
                onChange={(e) =>
                  this.handleFilterUserChange2(e.target.value, indx)
                }
                style={{ width: "75px" }}
              >
                {this.props.model.filterMetadata.columns[
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
            onChange={(e) => this.handleSourceChange(e.target.value, indx)}
          >
            <option value="yn">Yes/No</option>
            <option value="inline">Inline</option>
            <option value="slate">Slate</option>
            <option value="alternates">Alternates</option>
            <option value="sourceSplit">Breakout</option>
          </EditableOption>

          {this.calculateSourceValue(indx) === "inline" && (
            <EditableTextarea
              className="autosizeTextarea"
              value={stage.sourceInline}
              placeholder="Enter list of comma separated names"
              onChange={(e) => this.handleSInlineChange(e.target.value, indx)}
              style={{ width: "340px" }}
            />
          )}
          {this.calculateSourceValue(indx) === "slate" && (
            <>
              <EditableString
                list={`slate-${indx}`}
                type="text"
                value={stage.sourceSlate.replace(SLATE_BASE_URL, "")}
                placeholder="Enter slate URL or ID"
                style={{ width: "316px" }}
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
                {!this.props.readonly && (
                  <CreateNewSlate
                    href="https://petitionbuilder.org/slate/create"
                    target="_blank"
                  >
                    Create new slate
                  </CreateNewSlate>
                )}
              </div>
            </>
          )}
          {this.calculateSourceValue(indx) === "sourceSplit" && (
            <EditableString
              value={stage.sourceSplit}
              placeholder="Enter election ID"
              onChange={(e) => this.handleSSplitChange(e.target.value, indx)}
              style={{ width: "340px" }}
            />
          )}
        </div>
        {!this.props.readonly && indx > this.props.model.stage && (
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
        {this.props.model.stageResults[indx] && (
          <Winners>
            {this.props.model.stageResults[indx].winners.length > 1
              ? "Winners"
              : "Winner"}
            :{" "}
            {this.props.model.stageResults[indx].winners.map((winner) => (
              <span key={winner.displayOrder}>{winner.name}</span>
            ))}
          </Winners>
        )}
      </PseudoTableRow>
    );
  });

  private autosizing() {
    autosize.destroy(document.querySelectorAll(".autosizeTextarea"));
    autosize(document.querySelectorAll(".autosizeTextarea"));
  }

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

    this.props.model.stages.forEach((stage) => {
      if (stage.sourceSlate) {
        this.populateSlatesMap(stage.sourceSlate);
      }
    });

    this.autosizing();
  }

  private generateCsvData(): ISheetContents {
    const csvData: ISheetContents = {
      Policy: [],
      Title: [],
      nWinners: [],
      ForbidUndervote: [],
      SourceType: [],
      SourceParameter: [],
    };
    this.props.model.stages.forEach((stage, index) => {
      let sourceType = this.calculateSourceValue(index);
      sourceType = sourceType === "inline" ? "sourceInline" : sourceType;
      sourceType = sourceType === "yn" ? "sourceInline" : sourceType;
      sourceType =
        sourceType === "alternates" ? "sourceAlternates" : sourceType;
      sourceType = sourceType === "slate" ? "sourceSlate" : sourceType;
      csvData.Policy.push(stage.policy);
      csvData.Title.push(stage.title);
      csvData.nWinners.push(stage.nWinners?.toString());
      csvData.ForbidUndervote.push(stage.forbidUndervote?.toString());
      csvData.SourceType.push(sourceType);
      // @ts-ignore
      csvData.SourceParameter.push(stage[sourceType]?.toString());
    });
    return csvData;
  }

  private csvImport(data: ISheetContents) {
    try {
      const modelCopy = { ...this.props.model };
      modelCopy.stages = [];
      data.Policy.forEach((_: any, index: number) => {
        modelCopy.stages.push({
          policy: data.Policy[index],
          title: data.Title[index],
          nWinners: parseInt(data.nWinners[index]),
          forbidUndervote:
            data.ForbidUndervote[index] === ""
              ? null
              : !(data.ForbidUndervote[index] === "false"),
          sourceSlate:
            data.SourceType[index] === "sourceSlate"
              ? data.SourceParameter[index]
              : null,
          sourceInline:
            data.SourceType[index] === "sourceInline"
              ? data.SourceParameter[index]
              : null,
          sourceAlternates: data.SourceType[index] === "sourceAlternates",
          sourceSplit:
            data.SourceType[index] === "sourceSplit"
              ? data.SourceParameter[index]
              : null,
        });
      });
      this.setState({ isDirty: true, importActive: false });
      this.props.setModel(modelCopy);
    } catch {
      alert("Import failed, please try again.");
    }
  }

  render() {
    const csvData = this.generateCsvData();

    return (
      <>
        {!this.props.readonly && (
          <>
            <Copy>
              <h3>Edit the agenda</h3>
              {this.props.client.GetMode(this.props.model) ===
                QV.Mode.Begin && (
                <p>
                  <i>Election is not yet open</i>
                </p>
              )}
              {this.props.model.done && (
                <p>
                  Election is <strong>done</strong>.
                </p>
              )}
            </Copy>

            <Copy>
              <h4 style={{ marginTop: `2rem` }}>Stages:</h4>
            </Copy>
          </>
        )}

        {this.state.importActive && (
          <Modal close={() => this.setState({ importActive: false })}>
            <div style={{ width: "400px" }}>
              <CsvInput onSubmit={this.csvImport} />
            </div>
          </Modal>
        )}

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

        {!this.props.readonly && (
          <>
            <HorizontalList alignRight>
              {this.props.model.stages.length > 0 && (
                <DownloadCsv data={csvData} />
              )}
              <Button
                secondary
                style={{ marginRight: "2rem" }}
                onClick={() => this.setState({ importActive: true })}
                disabled={this.state.saving || this.props.model.done}
              >
                Import form CSV
              </Button>
              <Button
                onClick={this.addStage}
                disabled={this.state.saving || this.props.model.done}
              >
                Add stage
              </Button>
              <Button
                disabled={this.state.saving || !this.state.isDirty}
                onClick={this.save}
              >
                Save
              </Button>
            </HorizontalList>
          </>
        )}
      </>
    );
  }
}

export default Agenda;
