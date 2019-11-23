import React, { Fragment } from "react";
import styled from "styled-components";
import { observer } from 'mobx-react';
import Select from "react-select";
import Button from "./Button";
import { useStore } from "./store/useStore";

const loginOptions = [
  { value: "voter1", label: "Voter 1" },
  { value: "voter2", label: "Voter 2" }
];
const voteOptions = [
  { value: "0", label: "LiquidCrypto by MaltaBlock" },
  { value: "1", label: "Monte Carlo by VigorDAC" },
  { value: "2", label: "Rekt Land by Gnoll" }
];

const FormWrapper = styled.form`
  width: 450px;
  max-width: 450px;
  background-color: #d3d3dbea;
  border-radius: 4px;
  padding: 16px 48px 16px 48px;
`;

const SectionDivider = styled.div`
  font-weight: 700;
  text-transform: uppercase;
  margin: 48px 0;
`;

const HexDisplay = styled.pre`
  display: block;
  max-width: 100%;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0 0 4px 0;
`;

const Label = styled.label`
  display: inline-block;
  font-weight: 600;
`
const Error = styled.div`
  display: block;
  font-weight: 600;
  color: red;
`

const Input = styled.input`
width: 100%;
border: 1px solid #ddd;
border-radius: 4px;
padding: 6px 4px;
color: #333;
font-size: 14px;
font-weight: 600;
outline: none;
margin: 0 0 12px 0;

::placeholder {
  color: #A1A8B3;
}
`;

const Form: React.FC<{}> = props => {
  const store = useStore(rootStore => rootStore);

  const renderLogin = () => {
    return (
      <React.Fragment>
        <h3>Test User Login</h3>
        <Select
          value={store.formState.login.selectedValue as any}
          onChange={(selectedOption: any) =>
            store.dispatch({ type: `login/select`, payload: selectedOption })
          }
          options={loginOptions}
        />
        <Button type="submit" margin="8px 0">
          Login
        </Button>
      </React.Fragment>
    );
  };

  const renderRequestVote = () => {
    return (
      <React.Fragment>
        <h3>Request Vote Anonymously</h3>
        <Select
          value={store.formState.requestvote.selectedValue as any}
          onChange={(selectedOption: any) =>
            store.dispatch({ type: `requestvote/select`, payload: selectedOption })
          }
          options={voteOptions}
        />
        <Button type="submit" margin="8px 0">
          Get Blind Signature
        </Button>
      </React.Fragment>
    );
  };

  const renderRequestVoteResult = () => {
    return (
      <React.Fragment>
        <h3>Your Secret Voting Information</h3>
        <div>
          <Label>Vote Message:</Label>
          <HexDisplay>
            {store.formState.requestvoteresult.message}
          </HexDisplay>
          <Label>Signaure:</Label>
          <HexDisplay>
            {store.formState.requestvoteresult.signatureHex}
          </HexDisplay>
        </div>
      </React.Fragment>
    );
  };

  const renderCastVote = () => {
    return (
      <Fragment>
        <SectionDivider>or</SectionDivider>
        <h3>Submit Anonymous Vote</h3>
        <div>
          <Label>Vote Message</Label>:
          <Input
            type="text"
            value={store.formState.countvote.message}
            onChange={evt =>
              store.dispatch({ type: `countvote/message`, payload: evt.target.value })
            }
          />
          <Label>Vote Signature</Label>:
          <Input
            type="text"
            value={store.formState.countvote.signatureHex}
            onChange={evt =>
              store.dispatch({ type: `countvote/signature`, payload: evt.target.value })
            }
          />
        </div>

        <Button
          type="button"
          onClick={e => {
            e.preventDefault();
            store.dispatch({ type: `countvote/submit` });
          }}
          disabled={store.formState.countvote.success}
          margin="8px 0"
        >
          {store.formState.countvote.success ? `Sucess` : `Cast Anonymous Vote`}
        </Button>
      </Fragment>
    );
  };

  return (
    <FormWrapper
      onSubmit={e => {
        e.preventDefault();
        store.dispatch({ type: `${store.formState.type}/submit` });
      }}
    >
      {store.formState.type === `login`
        ? renderLogin()
        : store.formState.type === `requestvote`
        ? renderRequestVote()
        : renderRequestVoteResult()}
      {renderCastVote()}
      {store.formState.error ? <Error>{store.formState.error}</Error>: null}
    </FormWrapper>
  );
};


export default observer(Form);
