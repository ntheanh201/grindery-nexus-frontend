import React from "react";
import styled from "styled-components";
import { Select } from "grindery-ui";
import { ICONS } from "../../constants";
import useWorkflowContext from "../../hooks/useWorkflowContext";
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

type Props = {};

const StepOperation = (props: Props) => {
  const { type, step, activeRow, setActiveRow, operation, connector } =
    useWorkflowStepContext();
  const { updateWorkflow } = useWorkflowContext();

  const index = step - 2;

  const selectedOperationKey = operation?.key;

  const isAppSelected = Boolean(connector);

  const options =
    type === "trigger"
      ? connector?.triggers?.map((availableTrigger) => ({
          value: availableTrigger.key,
          label: availableTrigger.display?.label,
          icon: availableTrigger.display?.icon || connector?.icon || "",
          description: availableTrigger.display?.description,
        }))
      : connector?.actions?.map((availableAction) => ({
          value: availableAction.key,
          label: availableAction.display?.label,
          icon: availableAction.display?.icon || connector?.icon || "",
          description: availableAction.display?.description,
        }));

  const value = operation?.key;

  const handleOperationChange = (value: string) => {
    if (type === "trigger") {
      updateWorkflow({
        "trigger.operation": value || "",
        "trigger.input": {},
      });
    } else {
      updateWorkflow({
        ["actions[" + index + "].operation"]: value || "",
        ["actions[" + index + "].input"]: {},
      });
    }
  };

  const handleContinueClick = () => {
    setActiveRow(activeRow + 1);
  };

  const handleHeaderClick = () => {
    setActiveRow(0);
  };

  return isAppSelected ? (
    <Container>
      <Header
        style={{ cursor: activeRow <= 0 ? "default" : "pointer" }}
        onClick={handleHeaderClick}
        className={activeRow <= 0 ? "active" : ""}
      >
        {activeRow <= 0 ? (
          <img src={ICONS.ANGLE_UP} alt="" />
        ) : (
          <img src={ICONS.ANGLE_DOWN} alt="" />
        )}
        <span>
          {type === "trigger" ? "Choose an event" : "Choose an action"}
        </span>

        <OperationStateIcon
          src={selectedOperationKey ? ICONS.CHECK_CIRCLE : ICONS.EXCLAMATION}
          alt=""
        />
      </Header>
      {activeRow <= 0 && (
        <Content>
          <Select
            label={type === "trigger" ? "Event" : "Action"}
            type="default"
            placeholder={
              type === "trigger" ? "Select a Trigger" : "Select an action"
            }
            onChange={handleOperationChange}
            options={options}
            value={value}
            tooltip={
              type === "trigger"
                ? "This is the what will start your workflow."
                : "This is performed when the workflow runs."
            }
          />
          <ButtonWrapper>
            <Button
              disabled={!Boolean(selectedOperationKey)}
              onClick={handleContinueClick}
            >
              Continue
            </Button>
          </ButtonWrapper>
        </Content>
      )}
    </Container>
  ) : null;
};

export default StepOperation;
