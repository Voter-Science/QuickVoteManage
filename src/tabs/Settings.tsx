import * as React from "react";
import styled from "@emotion/styled";
import css from "@emotion/css";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";

import { Copy } from "trc-react/dist/common/Copy";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";
import { Grid } from "trc-react/dist/common/Grid";
import { Button } from "trc-react/dist/common/Button";

import * as QV from "../QVClient";

interface IProps {
  client: QV.QVClient;
  model: QV.IQVModel;
  setModel(model: QV.IQVModel): void;
}

interface IState {
  Model: QV.IQVModel;
  isDirty: boolean;
  isDirtyOwners: boolean;
  saving: boolean;
}

const Input = styled.input<{ inline?: boolean }>`
  background: none;
  border: solid 1px rgb(118, 118, 118);
  border-radius: 2px;
  display: block;
  width: 100%;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  font-style: italic;
  &:hover,
  &:focus {
    border: solid 1px #aaa;
    border-radius: 2px;
    outline: none;
  }
  ${(props) =>
    props.inline &&
    css`
      display: inline;
      width: auto;
    `}
`;

const ButtonMajor = styled.a`
  border: none;
  border-radius: 2px;
  background-color: #4caf50;
  font-size: 16px;
  padding: 0.8rem 1.5rem;
  font-weight: 700;
  display: inline-block;
  color: inherit;
  text-decoration: none;
`;

const Section = styled.section`
  border-top: solid 1px #ddd;
  padding: 1.5rem 0;
  > h4 {
    font-weight: 600;
  }
  > *:first-child {
    margin-top: 0;
  }
  > *:last-child {
    margin-bottom: 0;
  }
`;

const Owner = styled.div`
  position: relative;
  &:hover .remove-stage {
    display: block;
  }
`;

const SimpleButton = styled.button`
  background: #6485ff;
  border: none;
  border-radius: 2px;
  padding: 5px 15px;
  color: #fff;
  margin-right: 0.5rem;
  &:disabled {
    opacity: 0.5;
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

export class Agenda extends React.Component<IProps, IState> {
  public constructor(props: any) {
    super(props);

    this.state = {
      Model: props.model,
      isDirty: false,
      isDirtyOwners: false,
      saving: false,
    };

    this.handlePageTitleChange = this.handlePageTitleChange.bind(this);
    this.handlePageDateChange = this.handlePageDateChange.bind(this);
    this.handleOwnerChange = this.handleOwnerChange.bind(this);
    this.removeOwner = this.removeOwner.bind(this);
    this.addOwner = this.addOwner.bind(this);

    this.save = this.save.bind(this);
    this.saveOwners = this.saveOwners.bind(this);
  }

  private handlePageTitleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const modelCopy = { ...this.props.model };
    modelCopy.title = e.target.value;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handlePageDateChange(date: Date): void {
    const modelCopy = { ...this.props.model };
    modelCopy.targetDate = date;
    this.props.setModel(modelCopy);
    this.setState({ isDirty: true });
  }

  private handleOwnerChange(
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ): void {
    const modelCopy = { ...this.props.model };
    modelCopy.owners.owners[index] = e.target.value;
    this.props.setModel(modelCopy);
    this.setState({ isDirtyOwners: true });
  }

  private removeOwner(index: number): void {
    const modelCopy = { ...this.props.model };
    modelCopy.owners.owners.splice(index, 1);
    this.props.setModel(modelCopy);
    this.setState({ isDirtyOwners: true });
  }

  private addOwner(): void {
    const modelCopy = { ...this.props.model };
    if (!modelCopy.owners.owners[modelCopy.owners.owners.length - 1]) {
      return;
    }
    modelCopy.owners.owners.push("");
    this.props.setModel(modelCopy);
    this.setState({ isDirtyOwners: true });
  }

  private save(): Promise<any> {
    return this.props.client.PostModel(this.props.model);
  }

  private saveOwners(): Promise<any> {
    const modelCopy = { ...this.props.model };
    modelCopy.owners.owners = modelCopy.owners.owners.filter(Boolean);
    this.props.setModel(modelCopy);
    return this.props.client
      .PostUpdateOwners(this.props.model.owners.owners.filter(Boolean))
      .then(() => {
        toast.success("Owners updated successfully.");
        this.setState({ isDirtyOwners: false });
      });
  }

  render() {
    return (
      <>
        <Copy>
          <h3>Manage settings for this election</h3>
        </Copy>

        <Section>
          <h4>Title and date</h4>
          <Grid>
            <Input
              value={this.props.model.title}
              type="text"
              onChange={this.handlePageTitleChange}
            />
            <div>
              on{" "}
              <DatePicker
                selected={new Date(this.props.model.targetDate)}
                onChange={this.handlePageDateChange}
              />
            </div>
          </Grid>
        </Section>

        <Section>
          <h4>Quota</h4>
          <Copy>
            <p>
              This account allows for{" "}
              <strong>{this.props.model.quotaMetadata.maxUsers}</strong> users.
            </p>
          </Copy>
          {this.props.model.quotaMetadata.buyLink && (
            <p>
              <ButtonMajor
                href={`${this.props.model.quotaMetadata.buyLink}&redirectURI=${window.location.href}`}
                target="_blank"
              >
                <i
                  className="material-icons"
                  style={{
                    fontSize: "22px",
                    lineHeight: "0",
                    position: "relative",
                    marginRight: "4px",
                    top: "4px",
                  }}
                >
                  arrow_upward
                </i>{" "}
                Upgrade
              </ButtonMajor>
            </p>
          )}
        </Section>

        <Section>
          <h4>Owners</h4>
          <Grid>
            <>
              {this.props.model.owners.owners.map((owner, index) => (
                <Owner>
                  <Input
                    value={owner}
                    type="text"
                    onChange={(e) => this.handleOwnerChange(e, index)}
                  />
                  <RemoveStage
                    className="remove-stage"
                    onClick={() => this.removeOwner(index)}
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
                </Owner>
              ))}
              <SimpleButton
                disabled={!this.state.isDirtyOwners}
                onClick={this.saveOwners}
              >
                Save
              </SimpleButton>
              <SimpleButton onClick={this.addOwner}>Add</SimpleButton>
            </>
            <></>
          </Grid>
        </Section>

        <HorizontalList alignRight>
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
    );
  }
}

export default Agenda;
