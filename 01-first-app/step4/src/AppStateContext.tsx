import React, { createContext, useReducer, useContext } from "react"
import { nanoid } from "nanoid"
import {
  overrideItemAtIndex,
  findItemIndexById,
} from "./utils/arrayUtils"

interface Task {
  id: string
  text: string
}

interface List {
  id: string
  text: string
  tasks: Task[]
}

export interface AppState {
  lists: List[]
}

type Action =
  | {
      type: "ADD_LIST"
      payload: string
    }
  | {
      type: "ADD_TASK"
      payload: { text: string; listId: string }
    }

interface AppStateContextProps {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppStateContext = createContext<AppStateContextProps>({} as AppStateContextProps)

const appStateReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "ADD_LIST": {
      return {
        ...state,
        lists: [
          ...state.lists,
          { id: nanoid(), text: action.payload, tasks: [] }
        ]
      }
    }
    case "ADD_TASK": {
      const targetListIndex = findItemIndexById(
        state.lists,
        action.payload.listId
      )

      const targetList = state.lists[targetListIndex]

      const updatedTargetList = {
        ...targetList,
        tasks: [
          ...targetList.tasks,
          { id: nanoid(), text: action.payload.text }
        ]
      }

      return {
        ...state,
        lists: overrideItemAtIndex(
          state.lists,
          updatedTargetList,
          targetListIndex
        )
      }
    }
    default: {
      return state
    }
  }
}

const appData: AppState = {
  lists: [
    {
      id: "0",
      text: "To Do",
      tasks: [{ id: "c0", text: "Generate app scaffold" }]
    },
    {
      id: "1",
      text: "In Progress",
      tasks: [{ id: "c2", text: "Learn Typescript" }]
    },
    {
      id: "2",
      text: "Done",
      tasks: [{ id: "c3", text: "Begin to use static typing" }]
    }
  ]
}

export const AppStateProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [state, dispatch] = useReducer(appStateReducer, appData)

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  )
}

export const useAppState = () => {
  return useContext(AppStateContext)
}
