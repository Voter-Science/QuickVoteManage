import * as React from "react";
import styled from "@emotion/styled";

import * as QV from "../QVClient";

import { Copy } from "trc-react/dist/common/Copy";

interface IProps {
  client: QV.QVClient;
  model: QV.IQVModel;
}

const CSVIcon = styled.img`
  width: 24px;
  position: relative;
  top: 5px;
`;

const InlineButton = styled.button`
  background: rgb(100, 133, 255);
  border: none;
  border-radius: 2px;
  color: #fff;
  padding: 3px 6px;
`;

const ListItem = styled.li`
  margin: 0.5rem 0;
`;

function Invites({ client, model }: IProps) {
  const [sendingLinks, setSendingLinks] = React.useState(false);
  const [linksSent, setLinksSent] = React.useState(false);

  function sendSecretLinks() {
    const proceed = confirm("Are you sure you want to continue?");
    if (proceed) {
      setSendingLinks(true);
      client
        .SendLinks()
        .then(() => {
          setLinksSent(true);
          setSendingLinks(false);
        })
        .catch(() => setSendingLinks(false));
    }
  }

  function calculateLoggedInPercentage(): number {
    return Number(
      (
        (model.credentialMetadata.countEverLoggedIn /
          model.credentialMetadata.totalUsers) *
        100
      ).toFixed(1)
    );
  }

  return (
    <Copy>
      <h3>Invite people to log in to this election</h3>
      <p>
        You have <strong>{model.credentialMetadata.totalUsers}</strong> possible
        voters. <strong>{model.credentialMetadata.countEverLoggedIn}</strong>{" "}
        <span
          style={{
            color: calculateLoggedInPercentage() < 30 ? "red" : "inherit",
          }}
        >
          (
          {calculateLoggedInPercentage() < 30 && (
            <>
              <i
                className="material-icons"
                style={{
                  fontSize: "17px",
                  lineHeight: "0",
                  position: "relative",
                  top: "3px",
                  marginRight: "5px",
                }}
              >
                error
              </i>{" "}
            </>
          )}
          {calculateLoggedInPercentage()}%)
        </span>{" "}
        have logged in.
      </p>
      <p>
        Users can’t vote until you begin the election, but they should still
        access the invitation to verify they have access.
      </p>
      <p>There are two ways to invite people to this election:</p>
      <ol>
        <ListItem>
          Use a public link:{" "}
          <a href={model.credentialMetadata.publicVoteUrl} target="_blank">
            {model.credentialMetadata.publicVoteUrl}
          </a>
        </ListItem>
        <ListItem>
          Send each individual their own personal secret link.
          <ul>
            <ListItem>
              <a href={model.credentialMetadata.urlCsvDownloadSecretLinks}>
                Download all secret links
              </a>{" "}
              <CSVIcon src="https://trcanvasdata.blob.core.windows.net/publicimages/export-csv.png" />{" "}
              – you can send these yourself via a mail merge
            </ListItem>
            <ListItem>
              <InlineButton onClick={sendSecretLinks}>
                <i
                  className="material-icons"
                  style={{
                    fontSize: "17px",
                    lineHeight: "0",
                    position: "relative",
                    top: "3px",
                    marginRight: "5px",
                  }}
                >
                  email
                </i>
                Email out secret links
              </InlineButton>
              {sendingLinks && <strong> [sending...]</strong>}
              {linksSent && <strong> [sent ✓]</strong>} – participants will
              receive an invite from <strong>info@Voter-science.com</strong>
            </ListItem>
          </ul>
        </ListItem>
      </ol>
    </Copy>
  );
}

export default Invites;
