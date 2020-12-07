import * as React from "react";
import * as ReactDOM from "react-dom";
import styled from "@emotion/styled";
import css from "@emotion/css";
import { ToastContainer, toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

import TRCContext from "trc-react/dist/context/TRCContext";

import { PluginShell } from "trc-react/dist/PluginShell";
import { Panel } from "trc-react/dist/common/Panel";
import { Copy } from "trc-react/dist/common/Copy";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";
import { Button } from "trc-react/dist/common/Button";

import * as QV from "./QVClient";
import { withQVContainer } from "./QVContainer";

interface IState {
  saving: boolean;
}

interface IProps {
  model: QV.IQVModel;
  addStage(): void;
  removeStage(index: number): void;
  handleTitleChange(title: string, index: number): void;
  handlePolicyChange(policy: string, index: number): void;
  handleForbidUndervoteChange(val: string, index: number): void;
  handleNWinnersChange(num: string, index: number): void;
  handleSInlineChange(val: string, index: number): void;
  handleSSlateChange(val: string, index: number): void;
  handleSouceChange(val: string, index: number): void;
  updateSorting(oldIndex: number, newIndex: number): void;
  calculateSourceValue(index: number): string;
  save(): Promise<any>;
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

export class App extends React.Component<IProps, IState> {
  static contextType = TRCContext;

  public constructor(props: any) {
    super(props);

    this.state = {
      saving: false,
    };
  }

  private SortableList = SortableContainer(() => {
    return (
      <PseudoTableBody saving={this.state.saving}>
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
      <PseudoTableRow>
        <div>
          <i className="material-icons">drag_indicator</i>
        </div>
        <div>
          <EditableOption
            value={stage.policy}
            onChange={(e) =>
              this.props.handlePolicyChange(e.target.value, indx)
            }
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
            onChange={(e) => this.props.handleTitleChange(e.target.value, indx)}
          />
        </div>
        <div>
          <EditableOption
            value={stage.forbidUndervote ? "1" : "0"}
            onChange={(e) =>
              this.props.handleForbidUndervoteChange(e.target.value, indx)
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
            onChange={(e) =>
              this.props.handleNWinnersChange(e.target.value, indx)
            }
          />
        </div>
        <div>
          <EditableOption
            value={this.props.calculateSourceValue(indx)}
            onChange={(e) => this.props.handleSouceChange(e.target.value, indx)}
          >
            <option value="yn">Yes/No</option>
            <option value="inline">Inline</option>
            <option value="slate">Slate</option>
            <option value="alternates">Alternates</option>
          </EditableOption>

          <span data-tip="An info tip that describes each source/candidates rule">
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

          {this.props.calculateSourceValue(indx) === "inline" && (
            <EditableString
              type="text"
              value={stage.sourceInline}
              placeholder="Enter list of comma separated names"
              style={{ width: "290px" }}
              onChange={(e) =>
                this.props.handleSInlineChange(e.target.value, indx)
              }
            />
          )}
          {this.props.calculateSourceValue(indx) === "slate" && (
            <EditableString
              type="text"
              value={stage.sourceSlate}
              placeholder="Enter slate URL"
              style={{ width: "290px" }}
              onChange={(e) =>
                this.props.handleSSlateChange(e.target.value, indx)
              }
            />
          )}
        </div>
        <RemoveStage
          className="remove-stage"
          onClick={() => this.props.removeStage(indx)}
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
              {this.props.model.title} on{" "}
              {new Date(this.props.model.targetDate).toLocaleString()}
            </h3>
            <p>
              Current stage is: <strong>{this.props.model.stage}</strong>
            </p>
            {this.props.model.stage === -1 && (
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
              this.props.updateSorting(oldIndex, newIndex);
            }}
            pressDelay={100}
            axis="y"
          />

          <HorizontalList alignRight>
            <Button onClick={this.props.addStage} disabled={this.state.saving}>
              Add stage
            </Button>
            <Button
              disabled={this.state.saving}
              onClick={async () => {
                this.setState({ saving: true });
                this.props.save().then(() => {
                  toast.success("Model updated successfully.");
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
