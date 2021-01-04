import * as React from "react";
import styled from "@emotion/styled";
import css from "@emotion/css";

import { Copy } from "trc-react/dist/common/Copy";

import * as QV from "../QVClient";
import useInterval from "../useInterval";

import Agenda from "./Agenda";
import { HorizontalList } from "trc-react/dist/common/HorizontalList";

const ButtonMajor = styled.button<{ secondary?: boolean }>`
  border: none;
  border-radius: 2px;
  background-color: #4caf50;
  font-size: 16px;
  width: 200px;
  height: 50px;
  font-weight: 700;
  display: block;
  margin-bottom: 1rem;
  &:disabled {
    opacity: 0.5;
  }
  ${(props) =>
    props.secondary &&
    css`
      background-color: #bbb;
    `}
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

const InbetweenMessage = styled.p`
  font-weight: 600;
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

const AgendaWrapper = styled.div`
  margin-top: 6rem;
`;

const QuickPollResults = styled.code`
  background: #ddd;
`;

const ButtonMessage = styled.p`
  font-style: italic;
  font-size: 13px;
  position: relative;
  top: 5px;
`;

interface ITallyResultsEntryWithState extends QV.ITallyResultsEntry {
  result: string;
}

interface IProps {
  authToken: string;
  sheetId: string;
  client: QV.QVClient;
  model: QV.IQVModel;
  setModel(model: QV.IQVModel, callback: any): void;
}

function Run({ authToken, sheetId, client, model, setModel }: IProps) {
  const [loading, setLoading] = React.useState(false);
  const [stageResults, setStageResults] = React.useState<QV.IManageResponse>(
    null
  );
  const [results, setResults] = React.useState<ITallyResultsEntryWithState[]>(
    null
  );
  const [resultsError, setResultsError] = React.useState("");
  const [quickPollResults, setQuickPollResults] = React.useState("");

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
    setQuickPollResults("");
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
      setQuickPollResults("");
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
    setQuickPollResults("");
    client.PostCloseQuickPoll().then((data) => {
      setQuickPollResults(data.resultsStr);
      client.GetModel().then((data) => {
        setModel(data, fetchStageResults);
        setLoading(false);
      });
    });
  }

  function fetchStageResults(stageModel: QV.IQVModel) {
    if (
      client.GetMode(stageModel) === QV.Mode.Stage ||
      client.GetMode(stageModel) === QV.Mode.InbetweenQuickpoll
    ) {
      client.GetPollResult(stageModel.stageRoundMoniker).then((data) => {
        setStageResults(data);
      });
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

  function renderAgenda() {
    return (
      <AgendaWrapper>
        {client.GetMode(model) === QV.Mode.Inbetween && (
          <InbetweenMessage>Current stage: inbetween votes</InbetweenMessage>
        )}
        <Agenda
          authToken={authToken}
          sheetId={sheetId}
          model={model}
          client={client}
          setModel={() => {}}
          readonly
        />
      </AgendaWrapper>
    );
  }

  if (model.done) {
    return (
      <>
        <Copy>
          <h3>The election has been completed.</h3>
        </Copy>
        {renderAgenda()}
      </>
    );
  }

  function renderError() {
    return (
      <>
        {model.errorMessage && (
          <p style={{ color: "red" }}>
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
            {model.errorMessage}
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <Copy>
        <h3>Run your election</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {client.GetMode(model) === QV.Mode.Begin && (
              <>
                <p>Not yet started.</p>
                {quickPollResults && (
                  <p>
                    Results for the latest QuickPoll:{" "}
                    <QuickPollResults>{quickPollResults}</QuickPollResults>
                  </p>
                )}
                {renderError()}
                <ButtonMajor
                  disabled={!!model.errorMessage}
                  onClick={() => startQuickPoll()}
                  secondary
                >
                  QuickPoll
                </ButtonMajor>
                <ButtonMajor
                  disabled={!!model.errorMessage}
                  onClick={() => moveToNextRound(model.stageRoundMoniker)}
                >
                  Begin
                </ButtonMajor>
              </>
            )}
            {client.GetMode(model) === QV.Mode.Stage && (
              <>
                <p>
                  Voting is open for{" "}
                  <strong>{model.stages[model.stage].title}</strong> (Round{" "}
                  {model.stageRoundMoniker % 100})
                </p>
                {stageResults ? (
                  <p>
                    Received{" "}
                    <strong>{stageResults.countBallotsReceived}</strong> ballots
                    of <strong>{stageResults.numUsers}</strong> (
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
                {renderError()}
                <ButtonMajor
                  disabled={!!model.errorMessage}
                  onClick={() => moveToNextRound(model.stageRoundMoniker)}
                >
                  Close voting
                </ButtonMajor>
              </>
            )}
            {client.GetMode(model) === QV.Mode.StagePartial && (
              <>
                <p>
                  Votes are tallied, now pick up to{" "}
                  <strong>{model.partialResults.nSlots}</strong> winners
                  according to rules.
                </p>
                <p>If you pick less, there will be a runoff.</p>
                {resultsError && <p style={{ color: "red" }}>{resultsError}</p>}
                {renderError()}
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

                <ButtonMajor
                  disabled={!!model.errorMessage}
                  onClick={() => validateResults()}
                >
                  Submit results
                </ButtonMajor>
              </>
            )}
            {client.GetMode(model) === QV.Mode.Inbetween && (
              <>
                {quickPollResults && (
                  <p>
                    Results for the latest QuickPoll:{" "}
                    <QuickPollResults>{quickPollResults}</QuickPollResults>
                  </p>
                )}
                {renderError()}
                <HorizontalList>
                  <ButtonMajor
                    disabled={!!model.errorMessage}
                    onClick={() => startQuickPoll()}
                    secondary
                  >
                    QuickPoll
                  </ButtonMajor>
                  <ButtonMessage>
                    Ask public Yes/No questions that aren’t on the agenda.
                    <br />
                    Useful for floor motions and Robert’s Rules.
                  </ButtonMessage>
                </HorizontalList>
                <ButtonMajor
                  disabled={!!model.errorMessage}
                  onClick={() => moveToNextRound(model.stageRoundMoniker)}
                >
                  Next round
                </ButtonMajor>
              </>
            )}
            {client.GetMode(model) === QV.Mode.InbetweenQuickpoll && (
              <>
                <p>
                  Conducting QuickPoll:{" "}
                  <strong>{model.activeQuickPollMessage}</strong>
                </p>
                {stageResults ? (
                  <p>
                    Received{" "}
                    <strong>
                      {stageResults.quickPollCountBallotsReceived}
                    </strong>{" "}
                    responses of <strong>{stageResults.numUsers}</strong> (
                    {(
                      (stageResults.quickPollCountBallotsReceived /
                        stageResults.numUsers) *
                      100
                    ).toFixed(1)}
                    %).
                  </p>
                ) : (
                  <p>Loading results...</p>
                )}
                {renderError()}
                <ButtonMajor
                  disabled={!!model.errorMessage}
                  onClick={() => closeQuickPoll()}
                >
                  Close poll
                </ButtonMajor>
              </>
            )}
          </>
        )}
      </Copy>
      {renderAgenda()}
    </>
  );
}

export default Run;
