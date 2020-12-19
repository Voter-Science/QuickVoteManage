import * as React from "react";
import styled from "@emotion/styled";
import css from "@emotion/css";

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

const PseudoTableHeader = styled.div`
  border-top: solid 1px gray;
  border-bottom: solid 1px gray;
  padding: 0.6rem 0;
  display: flex;
  margin: 1rem 0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  > div:nth-child(1) {
    width: 30%;
    padding-left: 0.5rem;
  }
  > div:nth-child(2) {
    width: 12.5%;
  }
  > div:nth-child(3) {
    width: 12.5%;
  }
  > div:nth-child(4) {
    width: 15%;
    text-align: center;
  }
  > div:nth-child(5) {
    width: 15%;
    text-align: center;
  }
  > div:nth-child(6) {
    width: 15%;
    text-align: center;
  }
`;

const PseudoTableBody = styled.ul`
  margin: 0 0 1.5rem 0;
  padding: 0;
  list-style-type: none;
  font-size: 15px;
`;

const PseudoTableRow = styled.li<{ result: string }>`
  display: flex;
  padding: 0.8rem 0;
  border-bottom: solid 1px #d8d8d8;
  line-height: 1.35;
  position: relative;
  > div {
    flex-grow: 0;
    flex-shrink: 0;
    word-wrap: break-word;
  }
  > div:nth-child(1) {
    width: 30%;
    padding-left: 0.5rem;
  }
  > div:nth-child(2) {
    width: 12.5%;
  }
  > div:nth-child(3) {
    width: 12.5%;
  }
  > div:nth-child(4) {
    width: 15%;
    text-align: center;
  }
  > div:nth-child(5) {
    width: 15%;
    text-align: center;
  }
  > div:nth-child(6) {
    width: 15%;
    text-align: center;
  }
  ${(props) =>
    props.result === "win" &&
    css`
      background: #cefdd2;
    `}
  ${(props) =>
    props.result === "lose" &&
    css`
      background: #ffeaea;
    `}
`;

interface ITallyResultsEntryWithState extends QV.ITallyResultsEntry {
  result: string;
}

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

  const [results, setResults] = React.useState<ITallyResultsEntryWithState[]>(
    null
  );
  const [resultsError, setResultsError] = React.useState("");

  React.useEffect(() => {
    const resultsWithState: ITallyResultsEntryWithState[] = model.partialResults?.results2?.map(
      (x) => {
        const xWithState = x as ITallyResultsEntryWithState;
        xWithState.result = "draw";
        return xWithState;
      }
    );
    setResults(resultsWithState);
  }, [model]);

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
      (stageModel.stageRoundMoniker > 0 &&
        stageModel.stage % 1 === 0 &&
        !stageModel.partialResults) ||
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

  function setResult(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const resultsCopy = [...results];
    resultsCopy[index].result = e.target.value;
    setResults(resultsCopy);
  }

  function validateResults() {
    let allLose = true;
    let nWinners = 0;

    results.forEach((result) => {
      if (result.result !== "lose") {
        allLose = false;
        if (result.result === "win") {
          nWinners++;
        }
      }
    });

    if (allLose) setResultsError("At least one winner or runoff is required.");
    else if (nWinners > model.partialResults.nSlots)
      setResultsError("You can submit at most 2 winners.");
    else {
      setLoading(true);
      setStageResults(null);
      setResultsError("");
      client
        .PostSubmitResults({
          round: model.partialResults.round as number,
          results: results,
        })
        .then(() => {
          client.GetModel().then((data) => {
            setModel(data, fetchStageResults);
            setLoading(false);
          });
        });
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
              {!model.partialResults ? (
                <>
                  <p>
                    Voting is open for{" "}
                    <strong>{model.stages[model.stage].title}</strong>
                  </p>
                  {stageResults ? (
                    <p>
                      Received{" "}
                      <strong>{stageResults.countBallotsReceived}</strong>{" "}
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
              ) : (
                <>
                  <p>
                    Votes are tallied, now pick up to{" "}
                    <strong>{model.partialResults.nSlots}</strong> winners
                    according to rules.
                  </p>
                  <p>If you pick less, there will be a runoff.</p>
                  {resultsError && (
                    <p style={{ color: "red" }}>{resultsError}</p>
                  )}
                  <PseudoTableHeader>
                    <div>Name</div>
                    <div>Votes</div>
                    <div>Vote %</div>
                    <div>Win</div>
                    <div>Runoff</div>
                    <div>Lose</div>
                  </PseudoTableHeader>
                  <PseudoTableBody>
                    {results?.map((result, index) => (
                      <PseudoTableRow key={result.name} result={result.result}>
                        <div>{result.name}</div>
                        <div>{result.votes}</div>
                        <div>{result.votePercent}</div>
                        <div>
                          <input
                            type="radio"
                            name={`result-${index}`}
                            value="win"
                            checked={result.result === "win"}
                            onChange={(e) => setResult(e, index)}
                          />
                        </div>
                        <div>
                          <input
                            type="radio"
                            name={`result-${index}`}
                            value="draw"
                            checked={result.result === "draw"}
                            onChange={(e) => setResult(e, index)}
                          />
                        </div>
                        <div>
                          <input
                            type="radio"
                            name={`result-${index}`}
                            value="lose"
                            checked={result.result === "lose"}
                            onChange={(e) => setResult(e, index)}
                          />
                        </div>
                      </PseudoTableRow>
                    ))}
                  </PseudoTableBody>

                  <ButtonMajor onClick={() => validateResults()}>
                    Submit results
                  </ButtonMajor>
                </>
              )}
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
