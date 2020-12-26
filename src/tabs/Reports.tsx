import * as React from "react";
import styled from "@emotion/styled";

import * as QV from "../QVClient";

import { Copy } from "trc-react/dist/common/Copy";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";

interface IProps {
  client: QV.QVClient;
  model: QV.IQVModel;
  setModel(model: QV.IQVModel): void;
}

const CSVIcon = styled.img`
  width: 24px;
  position: relative;
  top: 5px;
`;

const ButtonMajor = styled.button<{ secondary?: boolean }>`
  border: none;
  color: #fff;
  border-radius: 2px;
  background-color: #d83c3c;
  font-size: 16px;
  width: 200px;
  height: 50px;
  font-weight: 700;
  display: inline-block;
  margin-top: 5rem;
`;

function Reports({ client, model, setModel }: IProps) {
  const [resetting, setResetting] = React.useState(false);
  const [reset, setReset] = React.useState(false);

  function resetElection() {
    const proceed = confirm("Are you sure you want to reset this election?");

    if (proceed) {
      setResetting(true);
      setReset(false);
      client
        .PostResetElection()
        .then(() => {
          client.GetModel().then((data) => {
            setModel(data);
            setResetting(false);
            setReset(true);
          });
        })
        .catch(() => setResetting(false));
    }
  }

  return (
    <>
      <Copy>
        <h3>Downloading CSVs reports</h3>
        <p>Here are reports for after your election is complete:</p>
        <ul>
          {model.reportMetadata?.map((entry) => (
            <li key={entry.title}>
              <CSVIcon src="https://trcanvasdata.blob.core.windows.net/publicimages/export-csv.png" />{" "}
              <a href={entry.urlCsvDownload}>{entry.title}</a> &mdash;{" "}
              {entry.details}
            </li>
          ))}
        </ul>
      </Copy>
      <ButtonMajor onClick={resetElection}>
        {resetting ? "Resetting..." : "Reset"}
      </ButtonMajor> {reset ? "✓" : ""}
    </>
  );
}

export default Reports;
