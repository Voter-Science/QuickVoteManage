import * as React from "react";

import * as XC from "trc-httpshim/xclient";

import * as QV from "./QVClient";
import { Loader } from "./Loader";

export interface IQVState {
  AuthToken: string;
  QVClient: QV.QVClient;
  SheetId: string;
  Model: QV.IQVModel; // set on Init
}

// Passed from Plugin hosting interface to call SetSheetRef()
interface IPluginSheetRef {
  Server: string;
  AuthToken: string;
  SheetId: string;
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

export function withQVContainer<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return class QVContainer extends React.Component<{}, IQVState> {
    public constructor(props: any) {
      super(props);

      // Ordering:
      // - DOM has an html element
      // - <SheetContainer> is rendered to that element. This sets the global
      // - Load complete.
      // - PluginMain() is called (after the OnLoad event). This reads the global
      //     to get <SheetContainer> and call setSheetRef();
      var x: any = window;
      x.mainMajor = this;

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
      const httpClient = XC.XClient.New(
        server,
        this.state.AuthToken,
        undefined
      );
      const sheetClient = new QV.QVClient(httpClient, this.state.SheetId);

      return sheetClient.PostModel(this.state.Model).catch((err) => {
        alert("Error: " + err.Message);
      });
    }

    render() {
      if (!this.state || !this.state.Model) {
        return <Loader />;
      }

      return (
        // @ts-ignore
        <WrappedComponent
          addStage={this.addStage}
          removeStage={this.removeStage}
          handleTitleChange={this.handleTitleChange}
          handlePolicyChange={this.handlePolicyChange}
          handleForbidUndervoteChange={this.handleForbidUndervoteChange}
          handleNWinnersChange={this.handleNWinnersChange}
          handleSouceChange={this.handleSouceChange}
          handleSInlineChange={this.handleSInlineChange}
          handleSSlateChange={this.handleSSlateChange}
          calculateSourceValue={this.calculateSourceValue}
          updateSorting={this.updateSorting}
          save={this.save}
          model={this.state.Model}
        />
      );
    }

    // Called by PluginMain() once sheetId is available.
    public setSheetRef(sheetRef: IPluginSheetRef): void {
      const server = "https://quickvote.voter-science.com";
      // const server = "https://localhost:44321";
      const httpClient = XC.XClient.New(server, sheetRef.AuthToken, undefined);
      const sheetClient = new QV.QVClient(httpClient, sheetRef.SheetId);

      this.setState(
        {
          AuthToken: sheetRef.AuthToken,
          SheetId: sheetRef.SheetId,
          QVClient: sheetClient,
        },
        () => {
          sheetClient
            .GetModel()
            .then((model) => {
              this.setState({ Model: model });
            })
            .catch((err) => {
              alert("Error: " + err.Message);
            });
        }
      );
    }
  };
}
