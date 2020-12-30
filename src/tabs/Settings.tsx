import * as React from "react";
import styled from "@emotion/styled";
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
  saving: boolean;
}

const EditableTitle = styled.input`
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
`;

export class Agenda extends React.Component<IProps, IState> {
  public constructor(props: any) {
    super(props);

    this.state = {
      Model: props.model,
      isDirty: false,
      saving: false,
    };

    this.handlePageTitleChange = this.handlePageTitleChange.bind(this);
    this.handlePageDateChange = this.handlePageDateChange.bind(this);

    this.save = this.save.bind(this);
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

  private save(): Promise<any> {
    return this.props.client.PostModel(this.props.model);
  }

  render() {
    return (
      <>
        <Copy>
          <h3>Manage settings for this election</h3>
          <Grid>
            <EditableTitle
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
        </Copy>
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
