import * as React from "react";
import styled from "@emotion/styled";
import css from "@emotion/css";

import * as QV from "../QVClient";

import { Copy } from "trc-react/dist/common/Copy";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";

interface IProps {
  client: QV.QVClient;
  model: QV.IQVModel;
}

const ButtonMajor = styled.a<{ upgrade?: boolean }>`
  display: inline-block;
  border: none;
  border-radius: 2px;
  color: #fff;
  text-decoration: none;
  background-color: #6485ff;
  font-size: 16px;
  padding: 0.8rem 1.5rem;
  margin-top: 5rem;
  width: 15rem;
  text-align: center;
  ${(props) =>
    props.upgrade &&
    css`
      background-color: #4caf50;
      color: inherit;
    `}
`;

const ButtonMessage = styled.p`
  font-style: italic;
  font-size: 13px;
  position: relative;
  top: 5px;
`;

function Credentials({ client, model }: IProps) {
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

      {model.credentialMetadata.totalUsers > model.quotaMetadata.maxUsers && (
        <HorizontalList>
          <ButtonMajor
            upgrade
            href={`${model.quotaMetadata.buyLink}&redirectURI=${window.location.href}`}
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
              arrow_upward
            </i>{" "}
            Upgrade
          </ButtonMajor>

          <ButtonMessage>
            <strong>{model.credentialMetadata.totalUsers}</strong> possible
            voters out of <strong>{model.quotaMetadata.maxUsers}</strong>{" "}
            available.
          </ButtonMessage>
        </HorizontalList>
      )}
    </Copy>
  );
}

export default Credentials;
