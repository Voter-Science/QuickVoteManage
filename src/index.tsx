import * as React from "react";
import * as ReactDOM from "react-dom";
import styled from "@emotion/styled";
import css from "@emotion/css";
import { ToastContainer, toast } from "react-toastify";


import TRCContext from "trc-react/dist/context/TRCContext";

import { PluginShell } from "trc-react/dist/PluginShell";

import ErrorBoundary from "./ErrorBoundary";

import { Loader } from "./Loader";

import * as QV from './QVClient';
import {IQVState, QVContainer} from './QVContainer';


// Hack since Context doesn't work. 
declare var _contextHack: IQVState;



// State for <App>
interface IState {
  // loading: boolean;   // infer by 
}

export class App extends React.Component<{}, IState> {
  static contextType = TRCContext;

  public constructor(props: any) {
    super(props);

    // $$$ !!! Context variable is not set, even though our parent
    // is QVContainer and it set it during render. 
    // var ctx : IQVState = this.context;
    var ctx = _contextHack;

    this.state = {
      //loading: false,
      // names: ["abc", "def"]
      //names :ctx.Model.Values
    };


    // this.updateText = this.updateText.bind(this);    
  }




  render() {
    var ctx = _contextHack;
    var model = ctx.Model;

    const style = {
      border: 1,
    }

    return (
      <PluginShell
        description="A plugin for managing elections."
        title="QuickVote-Manage"
      >
        <h1>{model.title} on {model.targetDate}</h1>

        <p>Current stage is: {model.stage}</p>
        {(model.stage == -1) && <p>Election is Not Yet Open</p>}
        {model.done && <p>Election is DONE</p>}

        <p>Stages:</p>

        <table style={style}>
          <tr>
            <td>Policy</td>
            <td>Title</td>
            <td>NumberWinners</td>
            <td>Source</td>
          </tr>

          {model.stages.map((stage, idx) =>
            <tr>
              <td>{stage.policy}</td>
              <td>{stage.title}</td>
              <td>{stage.forbidUndervote ? "Exactly " : "Up to "} {stage.nWinners}</td>
              <td>{stage.sourceSlate} 
                  {stage.sourceInline}
                  {stage.sourceAlternates ? "use alternates" : ""}</td>
            </tr>)}
        </table>

      </PluginShell>
    );
  }
}

ReactDOM.render(
  <QVContainer>
    <App />
  </QVContainer>,
  document.getElementById("app")
);
