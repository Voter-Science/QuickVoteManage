import * as React from "react";
import styled from "@emotion/styled";

import { Copy } from "trc-react/dist/common/Copy";

import * as QV from "../QVClient";
import useInterval from "../useInterval";

const ButtonMajor = styled.button`
  border: none;
  border-radius: 2px;
  background-color: #4caf50;
  font-size: 16px;
  width: 200px;
  height: 50px;
  font-weight: 700;
  display: block;
  margin-bottom: 1rem;
`;

interface IProps {
  client: QV.QVClient;
  model: QV.IQVModel;
  setModel(model: QV.IQVModel, callback: any): void;
}

function Run({ client, model, setModel }: IProps) {
  const [loading, setLoading] = React.useState(false);
  const [stageResults, setStageResults] = React.useState<QV.IManageResponse>(
    null
  );

  function moveToNextRound(stageRoundMoniker: number) {
    setLoading(true);
    setStageResults(null);
    client.PostMoveToNextRound(stageRoundMoniker).then(() => {
      client.GetModel().then((data) => {
        setModel(data, fetchStageResults);
        setLoading(false);
      });
    });
  }

  function startQuickPoll() {
    const message = prompt("Enter the QuickPoll messsage:", "");

    if (message) {
      setLoading(true);
      setStageResults(null);
      client.PostStartQuickPoll(message).then(() => {
        client.GetModel().then((data) => {
          setModel(data, fetchStageResults);
          setLoading(false);
        });
      });
    }
  }

  function closeQuickPoll() {
    setLoading(true);
    setStageResults(null);
    client.PostCloseQuickPoll().then(() => {
      client.GetModel().then((data) => {
        setModel(data, fetchStageResults);
        setLoading(false);
      });
    });
  }

  function fetchStageResults(stageModel: QV.IQVModel) {
    if (
      (stageModel.stageRoundMoniker > 0 && stageModel.stage % 1 === 0) ||
      (stageModel.stageRoundMoniker > 0 &&
        stageModel.stage % 1 !== 0 &&
        stageModel.activeQuickPollMessage)
    ) {
      client
        .GetPollResult(stageModel.stageRoundMoniker)
        .then((data) => setStageResults(data));
    } else {
      setStageResults(null);
    }
  }

  React.useEffect(() => {
    fetchStageResults(model);
  }, []);

  useInterval(() => {
    fetchStageResults(model);
  }, 8000);

  return (
    <Copy>
      <h3>Run your election</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {model.stage === -1 && (
            <>
              <p>Not yet started.</p>
              <ButtonMajor
                onClick={() => moveToNextRound(model.stageRoundMoniker)}
              >
                Begin
              </ButtonMajor>
            </>
          )}
          {model.stage >= 0 && model.stage % 1 === 0 && (
            <>
              <p>
                Voting is open for{" "}
                <strong>{model.stages[model.stage].title}</strong>
              </p>
              {stageResults ? (
                <p>
                  Received <strong>{stageResults.countBallotsReceived}</strong>{" "}
                  ballots of <strong>{stageResults.numUsers}</strong> (
                  {(
                    (stageResults.countBallotsReceived /
                      stageResults.numUsers) *
                    100
                  ).toFixed(1)}
                  %).
                </p>
              ) : (
                <p>Loading results...</p>
              )}
              <ButtonMajor
                onClick={() => moveToNextRound(model.stageRoundMoniker)}
              >
                Close voting
              </ButtonMajor>
            </>
          )}
          {model.stage >= 0 &&
            model.stage % 1 !== 0 &&
            !model.activeQuickPollMessage && (
              <>
                <p>Inbetween votes.</p>
                <ButtonMajor onClick={() => startQuickPoll()}>
                  QuickPoll
                </ButtonMajor>
                <ButtonMajor
                  onClick={() => moveToNextRound(model.stageRoundMoniker)}
                >
                  Next round
                </ButtonMajor>
              </>
            )}
          {model.stage >= 0 &&
            model.stage % 1 !== 0 &&
            model.activeQuickPollMessage && (
              <>
                <p>Conducting QuickPoll.</p>
                {stageResults ? (
                  <p>
                    Received{" "}
                    <strong>{stageResults.countBallotsReceived}</strong>{" "}
                    responses of <strong>{stageResults.numUsers}</strong> (
                    {(
                      (stageResults.countBallotsReceived /
                        stageResults.numUsers) *
                      100
                    ).toFixed(1)}
                    %).
                  </p>
                ) : (
                  <p>Loading results...</p>
                )}
                <ButtonMajor onClick={() => closeQuickPoll()}>
                  Close poll
                </ButtonMajor>
              </>
            )}
        </>
      )}
    </Copy>
  );
}

export default Run;
