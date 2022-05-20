/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Color } from '@harness/design-system'
import { Icon } from '@harness/uicore'
import { DiagramDrag, DiagramType, Event } from '@pipeline/components/Diagram'
import type { FireEventMethod } from '@pipeline/components/PipelineDiagram/types'
interface AddLinkNodeProps<T> {
  nextNode: any
  style: any
  parentIdentifier?: string
  isParallelNode?: boolean
  readonly?: boolean
  identifier?: string
  fireEvent?: FireEventMethod
  prevNodeIdentifier: string
  showAddLink?: boolean
  data: T
  className?: string
  id?: string
  isRightAddIcon?: boolean
  setShowAddLink?: (data: boolean) => void
}
export default function AddLinkNode<T>(props: AddLinkNodeProps<T>): React.ReactElement | null {
  return (
    <div
      style={{ ...props.style }}
      data-linkid={props?.identifier}
      onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation()
        props?.fireEvent?.({
          type: Event.AddLinkClicked,
          target: event.target,
          data: {
            prevNodeIdentifier: props?.prevNodeIdentifier,
            parentIdentifier: props?.parentIdentifier,
            isRightAddIcon: props?.isRightAddIcon,
            entityType: DiagramType.Link,
            identifier: props?.identifier,
            node: { ...props, ...props?.data }
          }
        })
      }}
      onDragOver={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation()
        event.preventDefault()
        props?.setShowAddLink && props?.setShowAddLink(true)
      }}
      onDrop={event => {
        event.stopPropagation()
        props?.fireEvent?.({
          type: Event.DropLinkEvent,
          target: event.target,
          data: {
            entityType: DiagramType.Link,
            isRightAddIcon: props?.isRightAddIcon,
            node: JSON.parse(event.dataTransfer.getData(DiagramDrag.NodeDrag)),
            destination: { ...props, ...props?.data }
          }
        })
        props?.setShowAddLink && props?.setShowAddLink(false)
      }}
      className={props.className}
    >
      <Icon name="plus" color={Color.WHITE} />
    </div>
  )
}
