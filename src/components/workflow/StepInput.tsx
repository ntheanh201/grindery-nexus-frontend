import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import _ from "lodash";
import { CircularProgress } from "grindery-ui";
import { ICONS, isLocalOrStaging } from "../../constants";
import useWorkflowContext from "../../hooks/useWorkflowContext";
import WorkflowInputField from "./WorkflowInputField";
import useAddressBook from "../../hooks/useAddressBook";
import useAppContext from "../../hooks/useAppContext";
import { Field } from "../../types/Connector";
import ChainSelector from "./ChainSelector";
import ContractSelector from "./ContractSelector";
import { validator } from "../../helpers/validator";
import {
  getOutputOptions,
  getValidationScheme,
  jsonrpcObj,
} from "../../helpers/utils";
import useWorkflowStepContext from "../../hooks/useWorkflowStepContext";

const Container = styled.div`
  border-top: 1px solid #dcdcdc;
`;

const Header = styled.div`
    padding: 12px 32px; 12px 16px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: nowrap;
    gap: 16px;
    cursor: pointer;

    & span {
        font-weight: 700;
        font-size: 16px;
        line-height: 120%;
        color: #0B0D17;
    }

    &.active {
      cursor: default;
    }
    &:not(.active):hover {
      background: #F4F5F7;
    }
`;

const OperationStateIcon = styled.img`
  display: block;
  margin-left: auto;
`;

const Content = styled.div`
  padding: 20px 32px;
`;

const Button = styled.button`
  box-shadow: none;
  background: #0b0d17;
  border-radius: 5px;
  border: 1px solid #0b0d17;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  text-align: center;
  color: #ffffff;
  cursor: pointer;

  &:hover:not(:disabled) {
    box-shadow: 0px 4px 8px rgba(106, 71, 147, 0.1);
  }

  &:disabled {
    background: #dcdcdc;
    color: #706e6e;
    border-color: #dcdcdc;
    cursor: not-allowed;
  }
`;

const ButtonWrapper = styled.div`
  text-align: right;
  padding-bottom: 12px;
`;

type Props = {
  outputFields: any[];
};

const StepInput = ({ outputFields }: Props) => {
  const {
    type,
    step,
    activeRow,
    setActiveRow,
    connector,
    operation,
    operationIsConfigured,
    operationIsAuthenticated,
    setConnector,
    inputError,
    setInputError,
    errors,
    setErrors,
  } = useWorkflowStepContext();
  const { workflow, updateWorkflow, loading, setLoading } =
    useWorkflowContext();
  const { user, client } = useAppContext();
  const { addressBook, setAddressBook } = useAddressBook(user);

  const index = step - 2;

  const currentInput =
    type === "trigger" ? workflow.trigger.input : workflow.actions[index].input;

  const inputFields =
    (operation &&
      operation.operation &&
      operation.operation.inputFields &&
      operation.operation.inputFields.filter(
        (inputField: Field) => inputField && !inputField.computed
      )) ||
    [];

  const credentials =
    type === "trigger"
      ? workflow.trigger.credentials
      : workflow.actions[index].credentials;

  const chainValue =
    type === "trigger"
      ? (workflow.trigger.input._grinderyChain || "").toString()
      : (workflow.actions[index].input._grinderyChain || "").toString();

  const options: any[] = _.flatten([
    ...outputFields.map((out) =>
      getOutputOptions(out.operation, out.connector)
    ),
  ]);

  const handleHeaderClick = () => {
    setActiveRow(2);
  };

  const handleContinueClick = () => {
    setInputError("");
    setErrors(true);

    const validationSchema = getValidationScheme([
      ...(operation?.operation?.inputFields || []),
      ...(operation?.operation?.type === "blockchain:event" &&
      (operation?.operation?.inputFields || []).filter(
        (inputfield: Field) => inputfield.key === "_grinderyChain"
      ).length < 1
        ? [
            {
              key: "_grinderyChain",
              type: "string",
              required: true,
            },
          ]
        : []),
      ...(operation?.operation?.type === "blockchain:event" &&
      (operation?.operation?.inputFields || []).filter(
        (inputfield: Field) => inputfield.key === "_grinderyContractAddress"
      ).length < 1
        ? [
            {
              key: "_grinderyContractAddress",
              type: "string",
              required: true,
            },
          ]
        : []),
    ]);

    const check = validator.compile(validationSchema);

    const validated = check(currentInput);

    if (typeof validated === "boolean") {
      setActiveRow(activeRow + 1);
    } else {
      setErrors(validated);
      setInputError("Please complete all required fields.");
    }
  };

  const handleChainChange = (value: string) => {
    setInputError("");
    if (type === "trigger") {
      updateWorkflow({
        "trigger.input._grinderyChain": value || "",
      });
    } else {
      updateWorkflow({
        ["actions[" + index + "].input._grinderyChain"]: value || "",
      });
    }
  };

  const handleContractChange = (value: string) => {
    setInputError("");
    if (type === "trigger") {
      updateWorkflow({
        "trigger.input._grinderyContractAddress": value || "",
      });
    } else {
      updateWorkflow({
        ["actions[" + index + "].input._grinderyContractAddress"]: value || "",
      });
    }
  };

  const updateFieldsDefinition = () => {
    if (operation?.operation?.inputFieldProviderUrl) {
      if (workflow) {
        setLoading(true);
        client
          ?.callInputProvider(
            connector?.key || "",
            operation.key,
            jsonrpcObj("grinderyNexusConnectorUpdateFields", {
              key: operation.key,
              fieldData: {},
              credentials: credentials,
            }),
            isLocalOrStaging ? "staging" : undefined
          )
          .then((res) => {
            if (res && res.data && res.data.error) {
              console.error(
                "grinderyNexusConnectorUpdateFields error",
                res.data.error
              );
            }
            if (res) {
              if (res.inputFields && connector) {
                setConnector({
                  ...connector,
                  triggers: [
                    ...(connector.triggers || []).map((trig) => {
                      if (trig.key === operation?.key && trig.operation) {
                        return {
                          ...trig,
                          operation: {
                            ...trig.operation,
                            inputFields:
                              res.inputFields || trig.operation.inputFields,
                            outputFields:
                              res.outputFields ||
                              trig.operation.outputFields ||
                              [],
                            sample: res.sample || trig.operation.sample || {},
                          },
                        };
                      } else {
                        return trig;
                      }
                    }),
                  ],
                  actions: [
                    ...(connector.actions || []).map((act) => {
                      if (act.key === operation?.key && act.operation) {
                        return {
                          ...act,
                          operation: {
                            ...act.operation,
                            inputFields:
                              res.inputFields || act.operation.inputFields,
                            outputFields:
                              res.outputFields ||
                              act.operation.outputFields ||
                              [],
                            sample: res.sample || act.operation.sample || {},
                          },
                        };
                      } else {
                        return act;
                      }
                    }),
                  ],
                });
              }
            }
            setLoading(false);
          })
          .catch((err) => {
            console.error("grinderyNexusConnectorUpdateFields error", err);
            setLoading(false);
          });
      }
    }
  };

  const setComputedDefaultValues = useCallback(() => {
    let input = {} as any;
    (operation?.operation?.inputFields || []).forEach((inputField: Field) => {
      if (inputField.computed && inputField.default) {
        if (type === "trigger") {
          input["trigger.input." + inputField.key] = inputField.default;
        } else {
          input["actions[" + index + "].input." + inputField.key] =
            inputField.default;
        }
      }
    });
    updateWorkflow(input);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operation]);

  useEffect(() => {
    setComputedDefaultValues();
  }, [setComputedDefaultValues]);

  useEffect(() => {
    updateFieldsDefinition();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return operation && operationIsAuthenticated ? (
    <Container>
      <Header
        onClick={handleHeaderClick}
        className={activeRow === 2 ? "active" : ""}
      >
        {activeRow === 2 ? (
          <img src={ICONS.ANGLE_UP} alt="" />
        ) : (
          <img src={ICONS.ANGLE_DOWN} alt="" />
        )}
        <span>{type === "trigger" ? "Set up trigger" : "Set up action"}</span>

        <OperationStateIcon
          src={operationIsConfigured ? ICONS.CHECK_CIRCLE : ICONS.EXCLAMATION}
          alt=""
        />
      </Header>
      {activeRow === 2 && (
        <Content>
          <div style={{ marginTop: 40 }}>
            {operation?.operation?.type === "blockchain:event" &&
              (operation?.operation?.inputFields || []).filter(
                (inputfield: Field) => inputfield.key === "_grinderyChain"
              ).length < 1 && (
                <ChainSelector
                  value={chainValue}
                  onChange={handleChainChange}
                  errors={errors}
                  setErrors={setErrors}
                />
              )}
            {operation?.operation?.type === "blockchain:event" &&
              (operation?.operation?.inputFields || []).filter(
                (inputfield: Field) =>
                  inputfield.key === "_grinderyContractAddress"
              ).length < 1 && (
                <ContractSelector
                  value={(
                    workflow.trigger.input._grinderyContractAddress || ""
                  ).toString()}
                  onChange={handleContractChange}
                  options={[]}
                  addressBook={addressBook}
                  setAddressBook={setAddressBook}
                  errors={errors}
                  setErrors={setErrors}
                />
              )}
            {inputFields.map((inputField: Field) => (
              <WorkflowInputField
                type={type}
                inputField={inputField}
                key={inputField.key}
                options={options}
                setError={setInputError}
                addressBook={addressBook}
                setAddressBook={setAddressBook}
                errors={errors}
                setErrors={setErrors}
                index={index}
              />
            ))}

            {loading && (
              <div
                style={{ marginTop: 40, textAlign: "center", color: "#8C30F5" }}
              >
                <CircularProgress color="inherit" />
              </div>
            )}
          </div>
          <ButtonWrapper>
            <Button disabled={loading} onClick={handleContinueClick}>
              Continue
            </Button>
          </ButtonWrapper>
        </Content>
      )}
    </Container>
  ) : null;
};

export default StepInput;
