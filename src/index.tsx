import * as React from "react";
import * as ReactDOM from "react-dom";
import styled from "@emotion/styled";
import css from "@emotion/css";
import { ToastContainer, toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

import * as XC from "trc-httpshim/xclient";

import TRCContext from "trc-react/dist/context/TRCContext";

import { PluginShell } from "trc-react/dist/PluginShell";
import { Panel } from "trc-react/dist/common/Panel";
import { Copy } from "trc-react/dist/common/Copy";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";
import { Button } from "trc-react/dist/common/Button";
import { Grid } from "trc-react/dist/common/Grid";

import * as QV from "./QVClient";
import { withQVContainer } from "./QVContainer";

interface IState {
  Model: QV.IQVModel;
  saving: boolean;
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

const PseudoTableHeader = styled.div<{ saving: boolean }>`
  border-top: solid 1px gray;
  border-bottom: solid 1px gray;
  padding: 0.6rem 0;
  display: flex;
  margin-bottom: 1rem;
  margin-top: 0.5rem;
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
    width: 25%;
  }
  > div:nth-child(4) {
    width: 15%;
  }
  > div:nth-child(5) {
    width: 47%;
  }
  ${(props) =>
    props.saving &&
    css`
      opacity: 0.4;
      pointer-events: none;
    `}
`;

const PseudoTableBody = styled.ul<{ saving: boolean }>`
  margin: 0;
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

const PseudoTableRow = styled.li`
  display: flex;
  padding: 0.8rem 0;
  border-bottom: solid 1px #d8d8d8;
  line-height: 1.35;
  position: relative;
  &:last-child {
    border-bottom: none;
  }
  > div {
    flex-grow: 0;
    flex-shrink: 0;
    word-wrap: break-word;
  }
  > div:nth-child(1) {
    cursor: grab;
    width: 3%;
    i {
      line-height: 1.3;
      font-size: 15px;
      position: relative;
      top: 1px;
    }
  }
  > div:nth-child(2) {
    width: 10%;
    overflow: hidden;
    border-right: solid 8px #fff;
  }
  > div:nth-child(3) {
    width: 25%;
  }
  > div:nth-child(4) {
    width: 15%;
  }
  > div:nth-child(5) {
    width: 47%;
  }
  &:hover .remove-stage {
    display: block;
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
  right: -20px;
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
  float: right;
`;

export class App extends React.Component<IProps, IState> {
  static contextType = TRCContext;

  public constructor(props: any) {
    super(props);

    this.state = {
      Model: props.model,
      saving: false,
    };

    this.addStage = this.addStage.bind(this);
    this.removeStage = this.removeStage.bind(this);

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handlePolicyChange = this.handlePolicyChange.bind(this);
    this.handleForbidUndervoteChange = this.handleForbidUndervoteChange.bind(
      this
    );
    this.handleNWinnersChange = this.handleNWinnersChange.bind(this);
    this.handleSouceChange = this.handleSouceChange.bind(this);
    this.handleSInlineChange = this.handleSInlineChange.bind(this);
    this.handleSSlateChange = this.handleSSlateChange.bind(this);

    this.calculateSourceValue = this.calculateSourceValue.bind(this);

    this.updateSorting = this.updateSorting.bind(this);

    this.save = this.save.bind(this);
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
    this.setState({ Model: modelCopy });
  }

  private handleTitleChange(title: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].title = title;
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy });
  }

  private handlePolicyChange(policy: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].policy = policy;
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy });
  }

  private handleForbidUndervoteChange(val: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].forbidUndervote = val === "1";
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy });
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
    this.setState({ Model: modelCopy });
  }

  private handleSInlineChange(val: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].sourceInline = val;
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy });
  }

  private handleSSlateChange(val: string, index: number): void {
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    stagesCopy[index].sourceSlate = val;
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy });
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
    this.setState({ Model: modelCopy });
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
    const modelCopy = { ...this.state.Model };
    const stagesCopy = [...this.state.Model.stages];
    arrayMove(stagesCopy, oldIndex, newIndex);
    modelCopy.stages = stagesCopy;
    this.setState({ Model: modelCopy });
  }

  private save(): Promise<any> {
    const server = "https://quickvote.voter-science.com";
    const httpClient = XC.XClient.New(server, this.props.authToken, undefined);
    const sheetClient = new QV.QVClient(httpClient, this.props.sheetId);

    return sheetClient.PostModel(this.state.Model);
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
      <PseudoTableRow>
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
              style={{ width: "290px" }}
              onChange={(e) => this.handleSInlineChange(e.target.value, indx)}
            />
          )}
          {this.calculateSourceValue(indx) === "slate" && (
            <EditableString
              type="text"
              value={stage.sourceSlate}
              placeholder="Enter slate URL"
              style={{ width: "290px" }}
              onChange={(e) => this.handleSSlateChange(e.target.value, indx)}
            />
          )}
        </div>
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
      </PseudoTableRow>
    );
  });

  render() {
    return (
      <PluginShell
        description="A plugin for managing elections."
        title="QuickVote-Manage"
      >
        <Panel>
          <Copy>
            <h3>
              {this.state.Model.title} on{" "}
              {new Date(this.state.Model.targetDate).toLocaleString()}
            </h3>
            <Grid>
              <p>
                Current stage is: <strong>{this.state.Model.stage}</strong>
              </p>
              <LegacyUrl
                href={`https://quickvote.voter-science.com/Election/${this.props.sheetId.replace(
                  "el_",
                  ""
                )}/manage`}
                target="_blank"
              >
                Open in legacy plugin
              </LegacyUrl>
            </Grid>
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
              disabled={this.state.saving}
              onClick={async () => {
                this.setState({ saving: true });
                this.save()
                  .then(() => {
                    toast.success("Model updated successfully.");
                    this.setState({ saving: false });
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
        </Panel>

        <ToastContainer />
      </PluginShell>
    );
  }
}

const EnchancedApp = withQVContainer(App);

ReactDOM.render(<EnchancedApp />, document.getElementById("app"));
