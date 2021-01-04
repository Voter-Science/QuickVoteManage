import * as React from "react";
import * as ReactDOM from "react-dom";
import styled from "@emotion/styled";
import { ToastContainer } from "react-toastify";

import * as XC from "trc-httpshim/xclient";

import { PluginShell } from "trc-react/dist/PluginShell";
import { TabsPanel } from "trc-react/dist/common/TabsPanel";

import Settings from "./tabs/Settings";
import Credentials from "./tabs/Credentials";
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

const GlobalError = styled.p`
  text-align: center;
  color: red;
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
        {this.state.Model.errorMessage && (
          <GlobalError>
            <i
              className="material-icons"
              style={{
                fontSize: "20px",
                lineHeight: "0",
                position: "relative",
                top: "4px",
              }}
            >
              warning
            </i>{" "}
            {this.state.Model.errorMessage}
          </GlobalError>
        )}
        <ToastContainer />
        <TabsPanel
          initialTab={
            new URLSearchParams(window.location.search).get("tab") ||
            "[4] Agenda"
          }
          tabNames={[
            "[1] Settings",
            "[2] Credentials",
            "[3] Invites",
            "[4] Agenda",
            "[5] Run",
            "[6] Reports",
          ]}
          onTabClick={this.handleTabClick}
        >
          <>
            <Settings
              model={this.state.Model}
              client={this.qvClient}
              setModel={(model: QV.IQVModel, callback?: any) =>
                this.setState({ Model: model }, () => {
                  if (callback) {
                    callback(this.state.Model);
                  }
                })
              }
            />
          </>
          <>
            <Credentials client={this.qvClient} />
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
              setModel={(model: QV.IQVModel, callback?: any) =>
                this.setState({ Model: model }, () => {
                  if (callback) {
                    callback(this.state.Model);
                  }
                })
              }
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
