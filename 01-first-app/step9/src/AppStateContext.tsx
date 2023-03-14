import React, { createContext, useReducer, useContext, useEffect } from "react"
import { nanoid } from "nanoid"
import { findItemIndexById, insertItemAtIndex, moveItem, overrideItemAtIndex, removeItemAtIndex } from "./utils/arrayUtils"
import { DragItem } from "./DragItem"
import { withData } from "./withData"
import { save } from "./api"

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
  draggedItem: DragItem | undefined
  lists: List[]
}

type Action =
  | {
      type: "SET_DRAGGED_ITEM"
      payload: DragItem | undefined
    }
  | {
      type: "ADD_LIST"
      payload: string
    }
  | {
      type: "ADD_TASK"
      payload: { text: string; listId: string }
    }
  | {
      type: "MOVE_LIST"
      payload: {
        dragIndex: number
        hoverIndex: number
      }
    }
  | {
      type: "MOVE_TASK"
      payload: {
        dragIndex: number
        hoverIndex: number
        sourceColumn: string
        targetColumn: string
      }
    }

interface AppStateContextProps {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppStateContext = createContext<AppStateContextProps>(
  {} as AppStateContextProps
)

const appStateReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "SET_DRAGGED_ITEM": {
      return { ...state, draggedItem: action.payload }
    }
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
    case "MOVE_LIST": {
      const { dragIndex, hoverIndex } = action.payload
      return {
        ...state,
        lists: moveItem(state.lists, dragIndex, hoverIndex)
      }
    }
    case "MOVE_TASK": {
      const {
        dragIndex,
        hoverIndex,
        sourceColumn,
        targetColumn
      } = action.payload

      const sourceListIndex = findItemIndexById(
        state.lists,
        sourceColumn
      )

      const targetListIndex = findItemIndexById(
        state.lists,
        targetColumn
      )

      const sourceList = state.lists[sourceListIndex]
      const task = sourceList.tasks[dragIndex]

      const updatedSourceList = {
        ...sourceList,
        tasks: removeItemAtIndex(sourceList.tasks, dragIndex)
      }

      const stateWithUpdatedSourceList = {
        ...state,
        lists: overrideItemAtIndex(
          state.lists,
          updatedSourceList,
          sourceListIndex
        )
      }

      const targetList =
        stateWithUpdatedSourceList.lists[targetListIndex]

      const updatedTargetList = {
        ...targetList,
        tasks: insertItemAtIndex(targetList.tasks, task, hoverIndex)
      }

      return {
        ...stateWithUpdatedSourceList,
        lists: overrideItemAtIndex(
          stateWithUpdatedSourceList.lists,
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

export const AppStateProvider = withData(({ children, initialState }: React.PropsWithChildren<{initialState: AppState}>) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState)

  useEffect(() => {
    save(state)
  }, [state])

  return (
    <AppStateContext.Provider
      value={{ state, dispatch }}
    >
      {children}
    </AppStateContext.Provider>
  )
})

export const useAppState = () => {
  return useContext(AppStateContext)
}
