import * as React from "react";
import * as ReactDOM from "react-dom";
import styled from "@emotion/styled";
import { ToastContainer } from "react-toastify";

import * as XC from "trc-httpshim/xclient";

import { PluginShell } from "trc-react/dist/PluginShell";
import { Copy } from "trc-react/dist/common/Copy";
import { TabsPanel } from "trc-react/dist/common/TabsPanel";

import Settings from "./tabs/Settings";
import Invites from "./tabs/Invites";
import Agenda from "./tabs/Agenda";
import Run from "./tabs/Run";
import Reports from "./tabs/Reports";

import * as QV from "./QVClient";
import { withQVContainer, SERVER } from "./QVContainer";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";

interface IState {
  Model: QV.IQVModel;
  globalError: string;
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
  padding: 0.8rem 1.5rem;
  margin-top: 5rem;
`;

const ButtonMessage = styled.p`
  font-style: italic;
  font-size: 13px;
  position: relative;
  top: 5px;
`;


export class App extends React.Component<IProps, IState> {
  private qvClient: QV.QVClient;

  public constructor(props: any) {
    super(props);

    this.state = {
      Model: props.model,
      globalError: "",
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
        {this.state.globalError && (
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
            {this.state.globalError}
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
            <Copy>
              <h3>Determines who is allowed to vote in the election</h3>
              <HorizontalList>
                <ButtonMajor
                  href={`https://quickvote.voter-science.com/Election/${this.qvClient.GetShortId()}/manage?userTableOnly=true`}
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
                    person_search
                  </i>{" "}
                  View Current Users
                </ButtonMajor>
                <ButtonMessage>
                    Show realtime view of users currently connected to this election. 
                </ButtonMessage>
              </HorizontalList>

              <HorizontalList>
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

                <ButtonMessage>
                    Upload or Download the user list as a CSV.
                </ButtonMessage>
              </HorizontalList>



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
              setGlobalError={(message: string) =>
                this.setState({ globalError: message })
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
