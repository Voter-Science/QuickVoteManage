import * as React from "react";
import * as ReactDOM from "react-dom";

import * as QV from './QVClient';

import TRCContext from "trc-react/dist/context/TRCContext";
import * as XC from "trc-httpshim/xclient";

export interface IQVState {
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

// Hack since Context doesn't work. 
declare var _contextHack: IQVState;
  

// Replaces <SheetContainer>
// https://github.com/Voter-Science/trc-react/blob/master/src/SheetContainer.tsx
// Sets a context, which can be access in a child component by "this.context"
export class QVContainer extends React.Component<{}, IQVState>
{
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
    _contextHack = this.state;

    if (!this.state || !this.state.Model) {
      return <div>Loading...</div>
    }

    return (
      <TRCContext.Provider value={this.state}>
        {this.props.children}
      </TRCContext.Provider>
    );
  }

  // Called by PluginMain() once sheetId is available.
  public setSheetRef(sheetRef: IPluginSheetRef): void {
    // debugger;

    var server = sheetRef.Server;
    // server = "https://localhost:44321";
    server = "https://quickvote.voter-science.com";

    var httpClient = XC.XClient.New(server, sheetRef.AuthToken, undefined);
    var sheetClient = new QV.QVClient(httpClient, sheetRef.SheetId);

    this.setState({
      SheetId: sheetRef.SheetId,
      QVClient: sheetClient
    }, () => {


      //  $$$ catch errr
      sheetClient.GetModel().then(model => {
        this.setState({ Model: model });
        /*
                return sheetClient.PostModel(model).then( ()=> {
                  alert("Done!");
                });*/
      }).catch((err) => {
        alert("Error: " + err.Message);
      });
    });

  }
}
