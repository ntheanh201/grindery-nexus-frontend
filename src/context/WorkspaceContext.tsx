import React, { useState, createContext, useEffect } from "react";
import { useGrinderyNexus } from "use-grindery-nexus";
import { defaultFunc, replaceTokens } from "../helpers/utils";
import { workspacesRequest } from "../helpers/workspaces";

export type Workspace = {
  key: string;
  title: string;
  about?: string;
  creator: string;
  admins?: string[];
  users?: string[];
};

type ContextProps = {
  workspace: null | string;
  workspaces: Workspace[];
  createWorkspace: (
    userId: string,
    data: any,
    token: string
  ) => Promise<string>;
  leaveWorkspace: (
    userId: string,
    data: any,
    token: string
  ) => Promise<boolean>;
  setWorkspace: (workspaceId: string) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  isLoaded: boolean;
  deleteWorkspace: (
    userId: string,
    data: any,
    token: string
  ) => Promise<boolean>;
  updateWorkspace: (
    userId: string,
    data: any,
    token: string
  ) => Promise<boolean>;
  isSuccess: string | null;
  setIsSuccess: (value: string | null) => void;
  isWorkspaceSwitching: boolean;
};

type WorkspaceContextProps = {
  children: React.ReactNode;
};

const defaultWorkspace = {
  key: "personal",
  title: "My workspace",
  about: "",
  creator: "{{user}}",
  admins: ["{{user}}"],
  users: [],
};

const defaultContext = {
  workspace: null,
  workspaces: [defaultWorkspace],
  createWorkspace: async () => {
    return "";
  },
  leaveWorkspace: async () => {
    return true;
  },
  setWorkspace: defaultFunc,
  setWorkspaces: defaultFunc,
  deleteWorkspace: async () => {
    return true;
  },
  updateWorkspace: async () => {
    return true;
  },
  isLoaded: false,
  isSuccess: null,
  setIsSuccess: defaultFunc,
  isWorkspaceSwitching: false,
};

export const WorkspaceContext = createContext<ContextProps>(defaultContext);

export const WorkspaceContextProvider = ({
  children,
}: WorkspaceContextProps) => {
  // App main context
  const { user, token } = useGrinderyNexus();

  const access_token = token?.access_token;

  // Currently active workspace.
  const [workspace, setWorkspace] = useState<null | string>(null);

  // List of workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Is initial list of workspaces loaded
  const [isLoaded, setIsLoaded] = useState(false);

  // Is workspace operation success
  const [isSuccess, setIsSuccess] = useState<string | null>(null);

  // Is workspace switching
  const [isWorkspaceSwitching, setIsWorkspaceSwitching] = useState(false);

  // Get list of user's workspaces
  const listWorkspaces = async (userId: string, token: string) => {
    const res = await workspacesRequest("or_listWorkspaces", {}, token);
    let spaces: Workspace[] = [];
    if (res && res.data && res.data.result) {
      spaces = [...res.data.result];
    }

    setWorkspaces([
      replaceTokens(defaultWorkspace, { user: userId }),
      ...spaces,
    ]);
    setIsLoaded(true);
  };

  // Create new workspace
  const createWorkspace = async (userId: string, data: any, token: string) => {
    const res = await workspacesRequest("or_createWorkspace", data, token);
    if (res && res.data && res.data.result) {
      listWorkspaces(userId, token);
      if (res.data.result.key) {
        setIsSuccess(`Workspace ${data.title} created successfully.`);
        return res.data.result.key;
      }
    }
    return "";
  };

  // Update workspace
  const updateWorkspace = async (userId: string, data: any, token: string) => {
    const res = await workspacesRequest("or_updateWorkspace", data, token);
    if (res && res.data && res.data.result) {
      listWorkspaces(userId, token);
      setIsSuccess(`Workspace ${data.title} updated successfully.`);
      return true;
    }
    return false;
  };

  // Leave current workspace
  const leaveWorkspace = async (userId: string, data: any, token: string) => {
    const res = await workspacesRequest(
      "or_leaveWorkspace",
      { key: data.workspaceKey || "" },
      token
    );
    if (res && res.data && res.data.result && res.data.result.left) {
      setIsSuccess(`You successfully left ${data.title} workspace.`);
      listWorkspaces(userId, token);
      return true;
    }
    return false;
  };

  // Delete workspace
  const deleteWorkspace = async (userId: string, data: any, token: string) => {
    const res = await workspacesRequest(
      "or_deleteWorkspace",
      { key: data.workspaceKey || "" },
      token
    );
    if (res && res.data && res.data.result) {
      setIsSuccess(`Workspace ${data.title} deleted successfully.`);
      listWorkspaces(userId, token);
      return true;
    }
    return false;
  };

  // Get list of user's workspaces when user and access token is known
  useEffect(() => {
    if (user && access_token) {
      listWorkspaces(user, access_token);
    }
  }, [user, access_token]);

  useEffect(() => {
    if (!workspace && workspaces && workspaces.length > 0) {
      setWorkspace(workspaces[0].key);
    }
  }, [workspaces, workspace]);

  useEffect(() => {
    if (!user) {
      setWorkspace(null);
      setWorkspaces([]);
    }
  }, [user]);

  useEffect(() => {
    if (workspace) {
      setIsWorkspaceSwitching(true);
      setTimeout(() => {
        setIsWorkspaceSwitching(false);
      }, 750);
    }
  }, [workspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        workspaces,
        createWorkspace,
        leaveWorkspace,
        setWorkspace,
        setWorkspaces,
        isLoaded,
        deleteWorkspace,
        updateWorkspace,
        isSuccess,
        setIsSuccess,
        isWorkspaceSwitching,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export default WorkspaceContextProvider;
