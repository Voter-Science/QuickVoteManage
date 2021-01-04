import * as React from "react";
import styled from "@emotion/styled";

import * as QV from "../QVClient";

import { Copy } from "trc-react/dist/common/Copy";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";

interface IProps {
  client: QV.QVClient;
}

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

function Credentials({ client }: IProps) {
  return (
    <Copy>
      <h3>Determines who is allowed to vote in the election</h3>
      <HorizontalList>
        <ButtonMajor
          href={`https://quickvote.voter-science.com/Election/${client.GetShortId()}/manage?userTableOnly=true`}
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
          href={`https://quickvote.voter-science.com/Election/${client.GetShortId()}/credential?return=1`}
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
  );
}

export default Credentials;
