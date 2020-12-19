import * as React from "react";
import styled from "@emotion/styled";

import * as QV from "../QVClient";

import { Copy } from "trc-react/dist/common/Copy";

interface IProps {
  model: QV.IQVModel;
}

const CSVIcon = styled.img`
  width: 24px;
  position: relative;
  top: 5px;
`;

function Reports({ model }: IProps) {
  return (
    <Copy>
      <h3>Downloading CSVs reports</h3>
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
  );
}

export default Reports;
