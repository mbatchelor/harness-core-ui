/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@harness/uicore'
import type { CSSProperties } from 'react'

export interface ListenerHandle {
  deregister: () => any
  id: string
  listener: BaseListener
}

export interface NodeData {
  name: string
  icon: IconName
  selectedColour: string
  unSelectedColour: string
  selectedIconColour: string
  unSelectedIconColour: string
}

export type BaseListener = (event: any) => void

export const enum PipelineGraphType {
  STAGE_GRAPH = 'STAGE_GRAPH',
  STEP_GRAPH = 'STEP_GRAPH'
}
export interface PipelineGraphState {
  id: string
  identifier: string
  type: string
  name: string
  icon: IconName
  status?: string
  data: any
  nodeType?: string
  graphType?: PipelineGraphType
  children?: PipelineGraphState[]
  parentStepGroupId?: string
  readonly?: boolean
}
export interface NodeIds {
  startNode: string
  createNode: string
  endNode: string
}
export interface KVPair {
  [key: string]: string
}
export interface SVGPathRecord {
  [key: string]: {
    pathData: string
    className?: string
    getLinkStyles?: () => void
    dataProps?: KVPair
  }
}

export type NodeBank = Map<string, NodeDetails>
export interface NodeDetails {
  component: React.FC<BaseReactComponentProps>
  isDefault?: boolean
}

export interface NodeCollapsibleProps {
  /** percent child visible to collapse */
  percentageNodeVisible?: number
  /** margin from child bottom to start expanding */
  bottomMarginInPixels?: number
}

export enum NodeStatus {
  Loading = 'Loading',
  Success = 'Success',
  Failure = 'Failure'
}

export enum NodeType {
  Default = 'default-node',
  EmptyNode = 'empty-node',
  CreateNode = 'create-node',
  DiamondNode = 'default-diamond',
  StartNode = 'start-node',
  GroupNode = 'group-node',
  IconNode = 'icon-node',
  EndNode = 'end-node',
  StepGroupNode = 'StepGroup'
}

export interface NodeProps<T> {
  width: number
  height: number
  onUpdate?: (data: T) => void
  onChange?: (data: T) => void
}

export interface NodeInterface {
  identifier: string
  type: NodeType
  name: string
  defaultIcon: IconName
  secondaryIcon?: IconName
  selectedColour?: string
  unSelectedColour?: string
  selectedIconColour?: string
  unSelectedIconColour?: string
}

export type FireEventMethod = (arg0: {
  type: string
  target: EventTarget
  data: {
    allowAdd?: boolean
    entityType?: string
    identifier?: string
    id?: string
    parentIdentifier?: string
    prevNodeIdentifier?: string
    node?: any
    destination?: any
    nodesInfo?: NodeInfo[]
    isRightAddIcon?: boolean
  }
}) => void

export interface NodeInfo {
  name: string
  icon: string
  identifier: string
  type: string
}

export type GetNodeMethod = (type?: string | undefined) => NodeDetails | null
export interface BaseReactComponentProps {
  getNode?: GetNodeMethod
  fireEvent?: FireEventMethod
  setSelectedNode?(identifier: string): void
  getDefaultNode?: GetNodeMethod
  updateGraphLinks?(): void
  onMouseOver?(event: MouseEvent): void
  onMouseLeave?(): void
  onDragOver?(): void
  onDrop?(event: React.DragEvent): void
  isFirstParallelNode?: boolean
  className?: string
  name?: string
  identifier?: string
  id: string
  icon?: string
  iconStyle?: CSSProperties
  readonly?: boolean
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  isSelected?: boolean
  defaultSelected?: any
  parentIdentifier?: string
  isParallelNode?: boolean
  prevNodeIdentifier?: string
  nextNode?: PipelineGraphState
  allowAdd?: boolean
  prevNode?: PipelineGraphState
  type?: string
  selectedNodeId?: string
  nodesInfo?: NodeInfo[]
  width?: number
  height?: number
  data?: any
}
