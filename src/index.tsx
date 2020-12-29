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
import { withQVContainer, SERVER } from "./QVContainer";

interface IState {
  Model: QV.IQVModel;
}

interface IProps {
  authToken: string;
  sheetId: string;
  model: QV.IQVModel;
}

const PageTitle = styled.h1`
  margin-top: 2rem;
  text-align: center;
  font-size: 26px;
`;

const PageDate = styled.p`
  text-align: center;
  font-style: italic;
`;

const LegacyUrl = styled.a`
  display: block;
  color: #6485ff;
`;

const ButtonMajor = styled.a`
  display: inline-block;
  border: none;
  border-radius: 2px;
  color: #fff;
  text-decoration: none;
  background-color: #6485ff;
  font-size: 16px;
  padding: .8rem 1.5rem;
  margin-top: 5rem;
`;

export class App extends React.Component<IProps, IState> {
  private qvClient: QV.QVClient;

  public constructor(props: any) {
    super(props);

    this.state = {
      Model: props.model,
    };

    const httpClient1 = XC.XClient.New(SERVER, this.props.authToken, undefined);
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
        <PageTitle>{this.state.Model.title}</PageTitle>
        <PageDate>
          on {new Date(this.props.model.targetDate).toLocaleDateString()}
        </PageDate>
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
                href={`https://quickvote.voter-science.com/Election/${this.qvClient.GetShortId()}/manage`}
                target="_blank"
              >
                Please access this functionality on the legacy management page
              </LegacyUrl>
              <ButtonMajor
                href={`https://quickvote.voter-science.com/Election/${this.qvClient.GetShortId()}/credential?return=1`}
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
                  text_snippet
                </i>{" "}
                Edit Credentials List
              </ButtonMajor>
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
              authToken={this.props.authToken}
              sheetId={this.props.sheetId}
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
            <Reports
              client={this.qvClient}
              model={this.state.Model}
              setModel={(model: QV.IQVModel) => this.setState({ Model: model })}
            />
          </>
        </TabsPanel>
      </PluginShell>
    );
  }
}

const EnchancedApp = withQVContainer(App);

ReactDOM.render(<EnchancedApp />, document.getElementById("app"));
