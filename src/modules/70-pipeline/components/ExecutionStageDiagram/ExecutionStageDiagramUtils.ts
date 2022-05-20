/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { defaultTo, delay } from 'lodash-es'
import type { DiagramEngine } from '@projectstorm/react-diagrams-core'
import { IconName, Utils } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { IconProps } from '@harness/icons'
import type { CSSProperties } from 'react'
import {
  ExecutionStatusEnum,
  ExecutionStatus,
  isExecutionRunning,
  isExecutionNotStarted,
  isExecutionFinishedAnyhow
} from '@pipeline/utils/statusHelpers'
import {
  PipelineOrStageStatus,
  statusToStatusMapping
} from '@pipeline/components/PipelineSteps/AdvancedSteps/ConditionalExecutionPanel/ConditionalExecutionPanelUtils'
import type { NodeRunInfo } from 'services/pipeline-ng'
import { BARRIER_WITH_OPEN_LINKS } from '@pipeline/utils/executionUtils'
import type {
  ExecutionPipeline,
  ExecutionPipelineGroupInfo,
  ExecutionPipelineItem,
  ExecutionPipelineNode
} from './ExecutionPipelineModel'
import * as Diagram from '../Diagram'
import type { DefaultNodeModel } from '../Diagram'
import { ExecutionPipelineNodeType } from './ExecutionPipelineModel'
import { StepType } from '../PipelineSteps/PipelineStepInterface'
import css from './ExecutionStageDiagram.module.scss'

export const containGroup = <T>(nodes: Array<ExecutionPipelineNode<T>>): boolean => {
  let contain = false
  nodes.forEach(node => {
    if (node.group) contain = true
    else if (node.parallel) contain = contain || containGroup(node.parallel)
  })
  return contain
}

export const calculateDepth = <T>(
  node: ExecutionPipelineNode<T>,
  groupStatesMap: Map<string, GroupState<T>>,
  spaceAfterGroup: number,
  SPACE_AFTER_GROUP: number
): number => {
  const depth = 1
  let groupMaxDepth = 0
  if (node?.group) {
    const stepState = groupStatesMap.get(node.group.identifier)
    // collapsed group
    if (stepState?.collapsed) {
      return 1
    }
    // expanded group
    if (node.group.items?.length > 0) {
      groupMaxDepth = 0
      node.group.items.forEach(nodeG => {
        let depthInner = 0
        if (nodeG?.group) {
          // group
          depthInner = calculateDepth(nodeG, groupStatesMap, SPACE_AFTER_GROUP, SPACE_AFTER_GROUP) + SPACE_AFTER_GROUP
        } else if (nodeG?.parallel) {
          // parallel
          nodeG?.parallel.forEach(nodeP => {
            depthInner += calculateDepth(nodeP, groupStatesMap, SPACE_AFTER_GROUP, SPACE_AFTER_GROUP)
          })
          // NOTE: adjustment for parallel stage
          depthInner += nodeG?.parallel?.find(item => item.group) ? SPACE_AFTER_GROUP : 0
        } else {
          // step
          depthInner = 1
        }
        groupMaxDepth = Math.max(groupMaxDepth, depthInner)
      })
    }
    groupMaxDepth += spaceAfterGroup
  }

  // NOTE: condition "groupMaxDepth < depth" makes empty group height equal to group with one step
  return groupMaxDepth < depth ? groupMaxDepth + depth : groupMaxDepth
}

export const calculateGroupHeaderDepth = <T>(items: Array<ExecutionPipelineNode<T>>, HEADER_DEPTH: number): number => {
  let maxNum = 0

  items.forEach(node => {
    let num = 0
    if (node.group) {
      num = HEADER_DEPTH
      num += calculateGroupHeaderDepth(node.group.items, HEADER_DEPTH)
      maxNum = Math.max(maxNum, num)
    } else if (node.parallel && node.parallel[0]?.group) {
      num = HEADER_DEPTH
      num += calculateGroupHeaderDepth(node.parallel[0].group.items, HEADER_DEPTH)
      maxNum = Math.max(maxNum, num)
    }
  })

  return maxNum
}

export const getNodeStyles = (
  isSelected: boolean,
  status: ExecutionStatus,
  type: ExecutionPipelineNodeType,
  nodeHasBorder: boolean
): React.CSSProperties => {
  const style = {} as React.CSSProperties

  style.borderColor = 'var(--execution-pipeline-color-grey)'
  style.borderWidth = '2px'
  style.borderStyle = 'solid'

  /* istanbul ignore else */ if (status) {
    switch (status) {
      case ExecutionStatusEnum.Success:
        style.borderColor = 'var(--execution-pipeline-color-blue)'
        style.backgroundColor = isSelected ? 'var(--execution-pipeline-color-blue)' : Utils.getRealCSSColor(Color.WHITE)
        break
      case ExecutionStatusEnum.Expired:
        style.borderColor = isSelected ? 'var(--execution-pipeline-color-blue)' : Utils.getRealCSSColor(Color.WHITE)
        break
      case ExecutionStatusEnum.Skipped:
        style.backgroundColor = 'var(--grey-200)'
        break

      case ExecutionStatusEnum.Running:
      case ExecutionStatusEnum.AsyncWaiting:
      case ExecutionStatusEnum.TaskWaiting:
      case ExecutionStatusEnum.TimedWaiting:
        style.borderColor = 'var(--execution-pipeline-color-blue)'
        style.backgroundColor = isSelected ? 'var(--execution-pipeline-color-blue)' : Utils.getRealCSSColor(Color.WHITE)
        break
      case ExecutionStatusEnum.Paused:
        style.borderColor = 'var(--execution-pipeline-color-orange)'
        style.backgroundColor = isSelected
          ? 'var(--execution-pipeline-color-orange)'
          : Utils.getRealCSSColor(Color.WHITE)
        break
      case ExecutionStatusEnum.InterventionWaiting:
      case ExecutionStatusEnum.ApprovalWaiting:
      case ExecutionStatusEnum.ResourceWaiting:
        style.borderColor = 'var(--execution-pipeline-color-orange2)'
        style.backgroundColor = isSelected
          ? 'var(--execution-pipeline-color-orange)'
          : Utils.getRealCSSColor(Color.WHITE)
        break
      case ExecutionStatusEnum.NotStarted:
        style.borderColor = 'var(--execution-pipeline-color-dark-grey)'
        style.backgroundColor = Utils.getRealCSSColor(Color.WHITE)
        break
      case ExecutionStatusEnum.Aborted:
        if (type === ExecutionPipelineNodeType.DIAMOND) {
          style.borderColor = 'var(--execution-pipeline-color-dark-grey2)'
          style.backgroundColor = isSelected ? 'var(--execution-pipeline-color-red)' : 'var(--red-50)'
        } else {
          style.borderColor = 'var(--execution-pipeline-color-dark-grey2)'
          style.backgroundColor = isSelected
            ? 'var(--execution-pipeline-color-dark-grey2)'
            : Utils.getRealCSSColor(Color.WHITE)
        }

        break
      case ExecutionStatusEnum.ApprovalRejected:
      case ExecutionStatusEnum.Failed:
        style.borderColor =
          type === ExecutionPipelineNodeType.DIAMOND
            ? 'var(--execution-pipeline-color-blue)'
            : 'var(--execution-pipeline-color-red)'
        style.backgroundColor = isSelected ? 'var(--execution-pipeline-color-red)' : Utils.getRealCSSColor(Color.WHITE)
        break
      default:
        break
    }
  }

  if (!nodeHasBorder) {
    style.borderWidth = '0px'
  }

  return style
}

export const getParallelNodesStatusForOutLines = <T>(
  parallel: ExecutionPipelineNode<T>[]
): {
  displayLines: boolean
  status: ExecutionStatus
} => {
  if (parallel.length === 0) {
    return {
      displayLines: false,
      status: ExecutionStatusEnum.NotStarted
    }
  }

  // Success like status. This will be overwrite if status is not success like
  const ret: {
    displayLines: boolean
    status: ExecutionStatus
  } = {
    displayLines: true,
    status: ExecutionStatusEnum.Success
  }

  parallel.forEach(pItem => {
    if (pItem.item) {
      // if status set and node status is deferent than not started
      if (!isExecutionFinishedAnyhow(pItem.item.status)) {
        ret.displayLines = false
        ret.status = pItem.item.status
      }
    } else if (pItem.group) {
      // if status set and node status is deferent than not started
      if (!isExecutionFinishedAnyhow(pItem.group.status)) {
        ret.displayLines = false
        ret.status = pItem.group.status
      }
    } else if (pItem.parallel) {
      const parallelRet = getParallelNodesStatusForOutLines(pItem.parallel)
      if (!isExecutionFinishedAnyhow(parallelRet.status)) {
        ret.displayLines = false
        ret.status = parallelRet.status
      }
    }
  })

  return ret
}

/**
 * return ExecutionStatusEnum.NotStarted or one of the other
 * Used for line on right side
 */
export const getParallelNodesStatusForInLine = <T>(parallel: ExecutionPipelineNode<T>[]) => {
  let status = ExecutionStatusEnum.NotStarted

  parallel.forEach(pItem => {
    if (pItem.item) {
      // if status set and node status is deferent than not started
      if (pItem.item.status && !isExecutionNotStarted(pItem.item.status)) {
        status = pItem.item.status
      }
    } else if (pItem.group) {
      // if status set and node status is deferent than not started
      if (pItem.group.status && !isExecutionNotStarted(pItem.group.status)) {
        status = pItem.group.status
      }
    } else if (pItem.parallel) {
      const parallelStatus = getParallelNodesStatusForInLine(pItem.parallel)
      if (!isExecutionNotStarted(parallelStatus)) {
        status = parallelStatus
      }
    }
  })

  return status
}

export const getArrowsColor = (
  status: ExecutionStatus,
  isParallel = false,
  hideLines = false,
  isLast = false
): string => {
  if (hideLines) {
    return 'var(--pipeline-transparent-border)'
  } else if (status === ExecutionStatusEnum.NotStarted) {
    return 'var(--execution-pipeline-color-arrow-not-started)'
  } else if (isParallel && isExecutionRunning(status)) {
    return 'var(--execution-pipeline-color-arrow-not-started)'
  } else if (isLast && isExecutionRunning(status)) {
    return 'var(--execution-pipeline-color-arrow-not-started)'
  } else {
    return 'var(--execution-pipeline-color-arrow-complete)'
  }
}

export const getStatusProps = (
  status: ExecutionStatus,
  stepType: ExecutionPipelineNodeType
): {
  secondaryIcon?: IconName
  secondaryIconProps: Omit<IconProps, 'name'>
  secondaryIconStyle: CSSProperties
} => {
  const secondaryIconStyle: React.CSSProperties =
    stepType === ExecutionPipelineNodeType.DIAMOND ? {} : { top: -7, right: -7 }
  let secondaryIcon: IconName | undefined = undefined
  const secondaryIconProps: Omit<IconProps, 'name'> = { size: 16 }
  /* istanbul ignore else */ if (status) {
    switch (status) {
      case ExecutionStatusEnum.IgnoreFailed:
        secondaryIcon = 'warning-outline'
        secondaryIconProps.size = 18
        secondaryIconStyle.color = 'var(--execution-pipeline-color-dark-red)'
        secondaryIconStyle.animation = `${css.fadeIn} 1s`
        break
      case ExecutionStatusEnum.Failed:
        secondaryIcon = 'execution-warning'
        secondaryIconProps.size = 18
        secondaryIconStyle.color = 'var(--execution-pipeline-color-dark-red)'
        secondaryIconStyle.animation = `${css.fadeIn} 1s`
        secondaryIconStyle.paddingBottom = `2px`
        break
      case ExecutionStatusEnum.ResourceWaiting:
        secondaryIcon = 'execution-warning'
        secondaryIconProps.size = 20
        secondaryIconStyle.color = 'var(--execution-pipeline-color-orange)'
        secondaryIconStyle.animation = `${css.fadeIn} 1s`
        break
      case ExecutionStatusEnum.Success:
        secondaryIcon = 'execution-success'
        secondaryIconProps.color = Color.GREEN_450
        secondaryIconStyle.animation = `${css.fadeIn} 1s`
        break
      case ExecutionStatusEnum.Running:
      case ExecutionStatusEnum.AsyncWaiting:
      case ExecutionStatusEnum.TaskWaiting:
      case ExecutionStatusEnum.TimedWaiting:
        secondaryIcon = 'spinner'
        secondaryIconStyle.animation = `${css.rotate} 2s`
        secondaryIconStyle.color = Utils.getRealCSSColor(Color.WHITE)
        secondaryIconStyle.backgroundColor = 'var(--primary-7)'
        secondaryIconStyle.borderRadius = '50%'
        secondaryIconStyle.height = '15px'
        secondaryIconStyle.padding = '1px'
        secondaryIconStyle.boxShadow = '0px 0px 0px 0.6px rgba(255,255,255,1)'
        secondaryIconProps.size = 13
        break
      case ExecutionStatusEnum.Aborted:
        secondaryIcon = 'stop'
        secondaryIconStyle.animation = `${css.fadeIn} 1s`
        secondaryIconStyle.color = 'var(--grey-700)'
        secondaryIconStyle.backgroundColor = Utils.getRealCSSColor(Color.WHITE)
        secondaryIconStyle.borderRadius = '50%'
        secondaryIconStyle.border = '1px solid var(--grey-700)'
        secondaryIconStyle.height = '16px'
        secondaryIconStyle.padding = '3px'
        secondaryIconStyle.boxShadow = '0px 0px 0px 0.6px rgba(255,255,255,1)'
        secondaryIconProps.size = 8

        break
      case ExecutionStatusEnum.Expired:
        secondaryIcon = 'execution-abort'
        secondaryIconStyle.animation = `${css.fadeIn} 1s`
        secondaryIconStyle.color = 'var(--execution-pipeline-color-dark-grey2)'
        break
      case ExecutionStatusEnum.Paused:
      case ExecutionStatusEnum.Pausing:
        secondaryIcon = 'execution-input'
        secondaryIconStyle.animation = `${css.fadeIn} 1s`
        secondaryIconStyle.color = 'var(--execution-pipeline-color-orange)'
        break
      case ExecutionStatusEnum.ApprovalWaiting:
      case ExecutionStatusEnum.InterventionWaiting:
        secondaryIcon = 'waiting'
        secondaryIconStyle.animation = `${css.fadeIn} 1s`
        secondaryIconStyle.color = Utils.getRealCSSColor(Color.WHITE)
        secondaryIconStyle.backgroundColor = 'var(--execution-pipeline-color-orange2)'
        secondaryIconStyle.borderRadius = '50%'
        secondaryIconStyle.height = '16px'
        secondaryIconStyle.padding = '2px'
        secondaryIconProps.size = 12
        secondaryIconStyle.boxShadow = '0px 0px 0px 0.6px rgba(255,255,255,1)'
        break
      default:
        break
    }
  }
  return { secondaryIconStyle, secondaryIcon: secondaryIcon, secondaryIconProps }
}

export const getIconStyleBasedOnStatus = (
  status: ExecutionStatus,
  isSelected: boolean,
  data: any
): React.CSSProperties => {
  let toReturn: CSSProperties = {}
  if (isSelected && status !== ExecutionStatusEnum.NotStarted) {
    toReturn = { color: Utils.getRealCSSColor(Color.WHITE) }
  }
  if (!isSelected && (status === ExecutionStatusEnum.Skipped || status === ExecutionStatusEnum.Expired)) {
    toReturn = { color: Utils.getRealCSSColor(Color.GREY_500) }
  }

  if (data.stepType === StepType.HarnessApproval && !isSelected) {
    toReturn = { color: Utils.getRealCSSColor(Color.PRIMARY_5) }
  }

  return toReturn
}

export const getStageFromExecutionPipeline = <T>(
  data: ExecutionPipeline<T>,
  identifier = '-1'
): ExecutionPipelineItem<T> | undefined => {
  let stage: ExecutionPipelineItem<T> | undefined = undefined
  data.items?.forEach(node => {
    if (!stage) {
      if (node?.item?.identifier === identifier) {
        stage = node?.item
      } else if (node?.parallel) {
        stage = getStageFromExecutionPipeline({ items: node.parallel, identifier: '', allNodes: [] }, identifier)
      } else if (node?.group) {
        stage = getStageFromExecutionPipeline({ items: node.group.items, identifier: '', allNodes: [] }, identifier)
      }
    }
  })

  return stage
}

export interface GroupState<T> {
  data?: T
  group?: ExecutionPipelineGroupInfo<T>
  collapsed: boolean
  name: string
  status: ExecutionStatus
  identifier: string
}

export const getGroupsFromData = <T>(items: Array<ExecutionPipelineNode<T>>): Map<string, GroupState<T>> => {
  let groupState = new Map<string, GroupState<T>>()
  items.forEach(node => {
    if (node.parallel) {
      const itemsGroupState = getGroupsFromData(node.parallel)
      groupState = new Map([...groupState, ...itemsGroupState])
    } else if (node.group) {
      groupState.set(node.group.identifier, {
        collapsed: false,
        name: node.group.name,
        status: node.group.status,
        identifier: node.group.identifier,
        data: node.group.data,
        group: node.group
      })
      if (node.group.items.length > 0) {
        const itemsGroupState = getGroupsFromData(node.group.items)
        groupState = new Map([...groupState, ...itemsGroupState])
      }
    } else if (node.item?.showInLabel) {
      groupState.set(node.item.identifier, {
        collapsed: false,
        name: node.item.name,
        status: node.item.status,
        identifier: node.item.identifier,
        data: node.item.data
      })
    }
  })
  return groupState
}

export const moveStageToFocusDelayed = (engine: DiagramEngine, identifier: string, focusOnVisibility = false): void => {
  delay(() => moveStageToFocus(engine, identifier, focusOnVisibility), 1)
}

export const moveStageToFocus = (engine: DiagramEngine, identifier: string, focusOnVisibility = false): void => {
  const model = engine.getModel() as Diagram.DiagramModel
  const layer = model.getGroupLayer(identifier) || model.getNodeFromId(identifier)
  const canvas = engine.getCanvas()
  /* istanbul ignore else */ if (layer && canvas) {
    const rect = canvas.getBoundingClientRect()
    const zoom = engine.getModel().getZoomLevel()
    const s = (num: number): number => num * (1 / (100 / zoom))
    const offsetX = engine.getModel().getOffsetX()
    const offsetY = engine.getModel().getOffsetY()
    let newOffsetX = engine.getModel().getOffsetX()
    let newOffsetY = engine.getModel().getOffsetY()

    const node = (engine.getModel() as Diagram.DiagramModel).getNodeFromId(identifier)

    if (focusOnVisibility && node && rect.width < offsetX + s(node.getPosition().x) + s(node.width) + s(40)) {
      newOffsetX = (rect.width - s(node.width)) * 0.8 - s(node.getPosition().x)
    } else if (!focusOnVisibility) {
      if (layer instanceof Diagram.StepGroupNodeLayerModel) {
        newOffsetX = rect.width * 0.2 - s(layer.startNode.getPosition().x)
      } else {
        newOffsetX = rect.width * 0.2 - s(layer.getPosition().x)
      }
    }

    if (node && rect.height < offsetY + s(node.getPosition().y) + s(node.height) + s(40)) {
      newOffsetY = (rect.height - s(node.height)) * 0.7 - s(node.getPosition().y)
    }

    let shouldRepaint = false
    if (newOffsetX !== offsetX || newOffsetY !== offsetY) {
      engine.getModel().setOffset(newOffsetX, newOffsetY)
      shouldRepaint = true
    }
    if (shouldRepaint) {
      engine.repaintCanvas()
    }
  }
}

export const getStageFromDiagramEvent = <T>(
  event: Diagram.DefaultNodeEvent,
  data: ExecutionPipeline<T>
): ExecutionPipelineItem<T> | undefined => {
  const entity = event.entity as DefaultNodeModel
  const id = entity.getOptions().identifier
  const stage = getStageFromExecutionPipeline(data, id)
  return stage
}

export const getRunningNode = <T>(data: ExecutionPipeline<T>): ExecutionPipelineItem<T> | undefined => {
  let stage: ExecutionPipelineItem<T> | undefined = undefined
  data.items?.forEach(node => {
    if (!stage) {
      if (isExecutionRunning(node?.item?.status)) {
        stage = node?.item
      } else if (node?.parallel) {
        stage = getRunningNode({ items: node.parallel, identifier: '', allNodes: [] })
      } else if (node?.group) {
        stage = getRunningNode({ items: node.group.items, identifier: '', allNodes: [] })
      }
    }
  })
  return stage
}

export const focusRunningNode = <T>(engine: DiagramEngine, data: ExecutionPipeline<T>): void => {
  const runningStage = getRunningNode(data)
  /* istanbul ignore else */ if (runningStage) {
    const node = (engine.getModel() as Diagram.DiagramModel).getNodeFromId(runningStage.identifier)
    const canvas = engine.getCanvas()
    if (canvas && node) {
      const rect = canvas.getBoundingClientRect()
      const nodePosition = node.getPosition()
      const nodeWidth = node.width
      /* istanbul ignore else */ if (rect.width < nodePosition.x + nodeWidth + 40) {
        const newOffsetX = (rect.width - node.width) * 0.8 - nodePosition.x
        if (newOffsetX !== engine.getModel().getOffsetX()) {
          const offsetY = engine.getModel().getOffsetY()
          engine.getModel().setOffset(newOffsetX, offsetY)
          //engine.getModel().setZoomLevel(100)
          engine.repaintCanvas()
        }
      }
    }
  }
}

export const getTertiaryIconProps = <T>(stage: ExecutionPipelineItem<T>): { tertiaryIcon?: IconName } => {
  const tertiaryIconProps: { tertiaryIcon?: IconName } = {}
  if (stage?.barrierFound) {
    tertiaryIconProps.tertiaryIcon = BARRIER_WITH_OPEN_LINKS
  }
  return tertiaryIconProps
}

export const getConditionalExecutionFlag = (when?: NodeRunInfo): boolean => {
  if (when?.whenCondition) {
    const conditionArr = when.whenCondition.split(' && ')
    const status = statusToStatusMapping[defaultTo(conditionArr.shift()?.replace(/[^a-zA-Z]/g, ''), '')]
    const condition = conditionArr.join(' && ')
    return !(status === PipelineOrStageStatus.SUCCESS && !condition?.trim())
  } else {
    return false
  }
}
