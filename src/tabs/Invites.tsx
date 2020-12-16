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

function Invites({ client, model }: IProps) {
  const [sendingLinks, setSendingLinks] = React.useState(false);
  const [linksSent, setLinksSent] = React.useState(false);

  function sendSecretLinks(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
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

  return (
    <Copy>
      <p>
        You have <strong>{model.credentialMetadata.totalUsers}</strong> possible
        voters.
      </p>
      <p>There are two ways to invite people to this election:</p>
      <ol>
        <li>
          Use a public link:{" "}
          <a href={model.credentialMetadata.publicVoteUrl} target="_blank">
            {model.credentialMetadata.publicVoteUrl}
          </a>
        </li>
        <li>
          Send each individual their own personal secret link.
          <ul>
            <li>
              <a href={model.credentialMetadata.urlCsvDownloadSecretLinks}>
                Download all secret links
              </a>{" "}
              <CSVIcon src="https://trcanvasdata.blob.core.windows.net/publicimages/export-csv.png" />{" "}
              – you can send these yourself via a mail merge
            </li>
            <li>
              <a href="#" onClick={sendSecretLinks}>
                Email out secret links
              </a>
              {sendingLinks && <strong> [sending...]</strong>}
              {linksSent && <strong> [sent ✓]</strong>} – participants will
              receive an invite from <strong>info@Voter-science.com</strong>
            </li>
          </ul>
        </li>
      </ol>
    </Copy>
  );
}

export default Invites;
