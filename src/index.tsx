import * as React from "react";
import * as ReactDOM from "react-dom";
import styled from "@emotion/styled";

import * as XC from "trc-httpshim/xclient";

import { PluginShell } from "trc-react/dist/PluginShell";
import { Copy } from "trc-react/dist/common/Copy";
import { TabsPanel } from "trc-react/dist/common/TabsPanel";

import Invites from "./tabs/Invites";
import Agenda from "./tabs/Agenda";
import Run from "./tabs/Run";
import Reports from "./tabs/Reports";

import * as QV from "./QVClient";
import { withQVContainer } from "./QVContainer";

interface IState {
  Model: QV.IQVModel;
}

interface IProps {
  authToken: string;
  sheetId: string;
  model: QV.IQVModel;
}

const LegacyUrl = styled.a`
  display: block;
  color: #6485ff;
`;

export class App extends React.Component<IProps, IState> {
  private qvClient: QV.QVClient;

  public constructor(props: any) {
    super(props);

    this.state = {
      Model: props.model,
    };

    const server1 = "https://quickvote.voter-science.com";
    const httpClient1 = XC.XClient.New(
      server1,
      this.props.authToken,
      undefined
    );
    this.qvClient = new QV.QVClient(httpClient1, this.props.sheetId);

    this.handleTabClick = this.handleTabClick.bind(this);
  }

  private handleTabClick(tab: string) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", tab);
    const newRelativePathQuery =
      window.location.pathname + "?" + searchParams.toString();
    history.pushState(null, "", newRelativePathQuery);
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
            <Invites model={this.state.Model} client={this.qvClient} />
          </>
          <>
            <Agenda
              authToken={this.props.authToken}
              sheetId={this.props.sheetId}
              model={this.state.Model}
              client={this.qvClient}
              setModel={(model: QV.IQVModel) => this.setState({ Model: model })}
            />
          </>
          <>
            <Run
              model={this.state.Model}
              client={this.qvClient}
              setModel={(model: QV.IQVModel, callback: any) =>
                this.setState({ Model: model }, () =>
                  callback(this.state.Model)
                )
              }
            />
          </>
          <>
            <Reports model={this.state.Model} />
          </>
        </TabsPanel>
      </PluginShell>
    );
  }
}

const EnchancedApp = withQVContainer(App);

ReactDOM.render(<EnchancedApp />, document.getElementById("app"));
