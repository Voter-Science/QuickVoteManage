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
    }

    render() {
      if (!this.state || !this.state.Model) {
        return <Loader />;
      }

      return (
        // @ts-ignore
        <WrappedComponent
          authToken={this.state.AuthToken}
          sheetId={this.state.SheetId}
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
