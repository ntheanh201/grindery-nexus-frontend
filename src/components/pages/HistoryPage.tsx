import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import moment from "moment";
import _ from "lodash";
import { TextInput, Tabs, Tooltip } from "grindery-ui";
import { useSearchParams } from "react-router-dom";
import DataBox from "../shared/DataBox";
import { ICONS, SCREEN } from "../../constants";
import useWindowSize from "../../hooks/useWindowSize";
import useAppContext from "../../hooks/useAppContext";
import { WorkflowExecutionLog } from "../../types/Workflow";

const statusIconMapping: { [key: string]: string } = {
  Executed: ICONS.EXECUTED,
  Error: ICONS.ERROR,
};

const RootWrapper = styled.div`
  @media (min-width: ${SCREEN.TABLET}) {
    margin: 40px 20px 0;
    border: 1px solid #dcdcdc;
  }
  @media (min-width: ${SCREEN.DESKTOP}) {
    margin: 20px 20px 0;
  }
  @media (min-width: ${SCREEN.DESKTOP_XL}) {
    margin: 40px 20px 0;
  }
`;

const TabsWrapper = styled.div`
  & .MuiTab-root {
    text-transform: initial;
    font-weight: 400;
    font-size: var(--text-size-horizontal-tab-label);
    line-height: 150%;

    @media (min-width: ${SCREEN.TABLET}) {
      min-width: 150px;
    }
  }
`;

const Wrapper = styled.div`
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  flex-wrap: nowrap;
  gap: 20px;

  @media (min-width: ${SCREEN.TABLET}) {
    padding: 40px;
  }

  @media (min-width: ${SCREEN.DESKTOP_XL}) {
    padding: 60px 106px;
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: nowrap;
  gap: 5px;
`;

const SearchInputWrapper = styled.div`
  flex: 1;

  & .MuiBox-root {
    margin-bottom: 0;
  }
  & .MuiOutlinedInput-root {
    margin-top: 0;
  }

  @media (min-width: ${SCREEN.TABLET}) {
    flex: 0.5;
  }
`;

const ItemsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  flex-wrap: nowrap;
  gap: 10px;

  @media (min-width: ${SCREEN.TABLET}) {
    & > div > div > div:nth-child(1) {
      margin-right: 20px !important;
    }

    & > div > div > div:nth-child(2) {
      margin-left: 0 !important;
      overflow: hidden;
    }
  }
`;

const ItemTitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 70px;

  @media (min-width: ${SCREEN.TABLET}) {
    gap: 8px;
    min-width: 230px;
    max-width: 230px;
  }
`;

const ItemIcon = styled.img`
  width: 12px;
  height: 12px;
  display: block;

  @media (min-width: ${SCREEN.TABLET}) {
    width: 24px;
    height: 24px;
  }
`;

const Title = styled.span`
  font-weight: 400;
  font-size: var(--text-size-history-item-label);
  line-height: 150%;
  color: #0b0d17;
`;

const ItemAppsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 4px;
  margin-left: 0;
`;

const ItemWorkflowName = styled.div`
  margin-left: 4px;
  font-weight: 400;
  font-size: 12px;
  line-height: 160%;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 64px);
`;

const ItemAppWrapper = styled.div`
  padding: 4px;
  background: #ffffff;
  border: 1px solid #dcdcdc;
  border-radius: 5px;
`;

const ItemAppIcon = styled.img`
  display: block;
  width: 16px;
  height: 16px;
`;

const ItemDate = styled.div`
  font-weight: 400;
  font-size: var(--text-size-history-date);
  line-height: 150%;
  color: #758796;
  margin-left: 10px;
  min-width: 110px;
`;

const TitleWrapper = styled.div`
  margin-right: 8px;
`;

type Props = {};

const HistoryPage = (props: Props) => {
  const {
    workflowExecutions,
    setWorkflowExecutions,
    workflows,
    getWorkflowHistory,
    connectors,
  } = useAppContext();
  let [searchParams] = useSearchParams();
  const initialTab = parseInt(searchParams.get("tab") || "0");

  const items = workflowExecutions;
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState(initialTab);
  const { size } = useWindowSize();

  const filteredItems = _.orderBy(
    items
      .filter((item: WorkflowExecutionLog[]) => {
        if (tab === 0) return true;
        if (
          tab === 1 &&
          item.filter((log: WorkflowExecutionLog) => log.error).length < 1
        ) {
          return true;
        }
        if (
          tab === 2 &&
          item.filter((log: WorkflowExecutionLog) => log.error).length > 0
        ) {
          return true;
        }
        return false;
      })
      .filter((item) => {
        const workflowKey = item[0].workflowKey;
        const workflow = workflows.find((wf) => wf.key === workflowKey);
        const apps: any[] = [
          connectors.find(
            (connector) => connector.key === workflow?.trigger.connector
          ),
          ...(workflow?.actions || []).map((action) =>
            connectors.find((connector) => connector.key === action.connector)
          ),
        ].map((connector) => ({
          name: connector?.name || "",
          icon: connector?.icon || "",
        }));
        return (
          apps.filter(
            (app) =>
              app &&
              app.name &&
              app.name.toLowerCase().includes(searchTerm.toLowerCase())
          ).length > 0
        );
      }),
    [
      (item) =>
        item[item.length - 1].endedAt || item[item.length - 1].startedAt,
    ],
    ["desc"]
  );

  const handleSearchChange = (e: string) => {
    setSearchTerm(e);
  };

  const addExecutions = useCallback(
    (newItems: WorkflowExecutionLog[]) => {
      setWorkflowExecutions((items) => [...items, newItems]);
    },
    [setWorkflowExecutions]
  );

  useEffect(() => {
    setWorkflowExecutions([]);
    if (workflows && workflows.length > 0) {
      workflows.forEach((workflow) => {
        if (workflow.key) {
          getWorkflowHistory(workflow.key, addExecutions);
        }
      });
    }
  }, [workflows, addExecutions, getWorkflowHistory, setWorkflowExecutions]);

  return (
    <RootWrapper>
      <TabsWrapper>
        <Tabs
          value={tab}
          onChange={(index: number) => {
            setTab(index);
          }}
          options={["All", "Success", "Error"]}
          orientation="horizontal"
          activeIndicatorColor="#A963EF"
          activeColor="#8C30F5"
          type="text"
          tabColor=""
          variant={size === "phone" ? "fullWidth" : ""}
        />
      </TabsWrapper>
      <Wrapper>
        <SearchWrapper>
          <SearchInputWrapper>
            <TextInput
              placeholder={"History"}
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              type="search"
              icon="search"
            />
          </SearchInputWrapper>
        </SearchWrapper>
        <ItemsWrapper>
          {filteredItems.map((item, i) => (
            <WorkflowExecutionRow item={item} />
          ))}
        </ItemsWrapper>
      </Wrapper>
    </RootWrapper>
  );
};

type WorkflowExecutionRowProps = {
  item: WorkflowExecutionLog[];
};

const WorkflowExecutionRow = (props: WorkflowExecutionRowProps) => {
  const { workflows, connectors } = useAppContext();
  const { item } = props;
  const [showError, setShowError] = useState(false);
  const executionId = item[0].executionId;
  const workflowKey = item[0].workflowKey;
  const executedAt =
    item[item.length - 1].endedAt || item[item.length - 1].startedAt;
  const status =
    item.filter((log: WorkflowExecutionLog) => log.error).length > 0
      ? "Error"
      : "Executed";
  const workflow = workflows.find((wf) => wf.key === workflowKey);

  const apps: any[] = [
    connectors.find(
      (connector) => connector.key === workflow?.trigger.connector
    ),
    ...(workflow?.actions || []).map((action) =>
      connectors.find((connector) => connector.key === action.connector)
    ),
  ].map((connector) => ({
    name: connector?.name || "",
    icon: connector?.icon || "",
  }));

  let errorText = item
    .filter((log: WorkflowExecutionLog) => log.error)
    .map((log: WorkflowExecutionLog) => log.error)
    .join("; ");

  if (errorText.startsWith("Error: ")) {
    errorText = errorText.replace("Error: ", "");
  }

  if (item.length < 1) {
    return null;
  }

  return (
    <DataBox
      WrapperProps={{
        onMouseEnter: () => setShowError(true),
        onMouseLeave: () => setShowError(false),
      }}
      key={executionId}
      size="small"
      LeftComponent={
        <ItemTitleWrapper>
          {status === "Error" && errorText ? (
            <Tooltip title={errorText} open={showError}>
              <ItemIcon src={statusIconMapping[status]} alt={status} />
            </Tooltip>
          ) : (
            <ItemIcon src={statusIconMapping[status]} alt={status} />
          )}
          <TitleWrapper>
            <Title>{status}</Title>
          </TitleWrapper>
        </ItemTitleWrapper>
      }
      CenterComponent={
        <ItemAppsWrapper>
          {apps.length > 0 &&
            apps
              .filter((app: any) => app.icon)
              .map((app: any, i2) => (
                <ItemAppWrapper key={executionId + i2} title={app.name}>
                  <ItemAppIcon src={app.icon} alt={app.name} />
                </ItemAppWrapper>
              ))}
          <ItemWorkflowName title={workflow?.title}>
            {workflow?.title}
          </ItemWorkflowName>
        </ItemAppsWrapper>
      }
      RightComponent={
        <ItemDate>
          {moment(executedAt).format("MMM DD, YYYY HH:mm:ss")}
        </ItemDate>
      }
    />
  );
};

export default HistoryPage;
