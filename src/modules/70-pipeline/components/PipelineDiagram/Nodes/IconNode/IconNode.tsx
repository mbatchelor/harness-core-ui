/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as React from 'react'
import { isEmpty } from 'lodash-es'
import cx from 'classnames'
import { Text, IconName, Icon, Button, ButtonVariation } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { DiagramDrag, DiagramType, Event } from '@pipeline/components/Diagram'
import { PipelineGraphType, NodeType, BaseReactComponentProps } from '../../types'
import AddLinkNode from '../DefaultNode/AddLinkNode/AddLinkNode'
import { getPositionOfAddIcon } from '../utils'
import cssDefault from '../DefaultNode/DefaultNode.module.scss'
import css from './IconNode.module.scss'

interface IconNodeProps extends BaseReactComponentProps {
  isInComplete?: boolean
  graphType?: PipelineGraphType
}
export function IconNode(props: IconNodeProps): React.ReactElement {
  const allowAdd = props.allowAdd ?? false
  const [showAdd, setVisibilityOfAdd] = React.useState(false)
  const CreateNode: React.FC<BaseReactComponentProps> | undefined = props?.getNode?.(NodeType.CreateNode)?.component

  const setAddVisibility = (visibility: boolean): void => {
    if (!allowAdd) {
      return
    }
    setVisibilityOfAdd(visibility)
  }
  const isSelectedNode = (): boolean => props.isSelected || props.id === props?.selectedNodeId
  const onDropEvent = (event: React.DragEvent) => {
    event.stopPropagation()

    props?.fireEvent?.({
      type: Event.DropNodeEvent,
      target: event.target,
      data: {
        entityType: DiagramType.Default,
        node: JSON.parse(event.dataTransfer.getData(DiagramDrag.NodeDrag)),
        destination: props
      }
    })
  }
  return (
    <div
      className={cx(cssDefault.defaultNode, css.iconNodeContainer)}
      onMouseDown={e => e.stopPropagation()}
      onDragOver={event => {
        event.stopPropagation()

        if (event.dataTransfer.types.indexOf(DiagramDrag.AllowDropOnNode) !== -1) {
          setAddVisibility(true)
          event.preventDefault()
        }
      }}
      onDragLeave={event => {
        event.stopPropagation()

        if (event.dataTransfer.types.indexOf(DiagramDrag.AllowDropOnNode) !== -1) {
          setAddVisibility(false)
        }
      }}
      onClick={event => {
        event.stopPropagation()
        if (props?.onClick) {
          props.onClick?.(event)
          return
        }
        props?.fireEvent?.({
          type: Event.ClickNode,
          target: event.target,
          data: {
            entityType: DiagramType.IconNode,
            ...props
          }
        })
      }}
      onDrop={event => {
        props?.fireEvent?.({
          type: Event.DropNodeEvent,
          target: event.target,
          data: {
            entityType: DiagramType.Default,
            node: JSON.parse(event.dataTransfer.getData(DiagramDrag.NodeDrag)),
            destination: props
          }
        })
      }}
    >
      <div
        id={props.id}
        className={cx(cssDefault.defaultCard, 'icon-node', css.iconNode, { [cssDefault.selected]: isSelectedNode() })}
        data-nodeid={props.id}
        draggable={!props.readonly}
        onDragStart={event => {
          event.stopPropagation()
          event.dataTransfer.setData(DiagramDrag.NodeDrag, JSON.stringify(props))
          // NOTE: onDragOver we cannot access dataTransfer data
          // in order to detect if we can drop, we are setting and using "keys" and then
          // checking in onDragOver if this type (AllowDropOnLink/AllowDropOnNode) exist we allow drop
          event.dataTransfer.setData(DiagramDrag.AllowDropOnLink, '1')
          //   event.dataTransfer.setData(DiagramDrag.AllowDropOnNode, '1')
          // if (options.allowDropOnNode) event.dataTransfer.setData(DiagramDrag.AllowDropOnNode, '1')
          event.dataTransfer.dropEffect = 'move'
        }}
        onDragEnd={event => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onMouseEnter={event => {
          event.stopPropagation()
          props?.fireEvent?.({
            type: Event.MouseEnterNode,
            target: event.target,
            data: { ...props }
          })
        }}
        onMouseLeave={event => {
          event.stopPropagation()

          props?.fireEvent?.({
            type: Event.MouseLeaveNode,
            target: event.target,
            data: { ...props }
          })
        }}
      >
        <div>
          {props.data.isInComplete && (
            <Icon className={css.inComplete} size={12} name={'warning-sign'} color="orange500" />
          )}
          {!props.readonly && (
            <Button
              className={cx(cssDefault.closeNode)}
              variation={ButtonVariation.PRIMARY}
              minimal
              withoutCurrentColor
              icon="cross"
              iconProps={{ size: 10 }}
              onMouseDown={e => {
                e.stopPropagation()
                props?.fireEvent?.({
                  type: Event.RemoveNode,
                  target: e.target,
                  data: {
                    identifier: props?.identifier,
                    node: props
                  }
                })
              }}
            />
          )}
          <Icon name={props.icon as IconName} size={50} inverse={props.isSelected} />
        </div>
      </div>
      {!isEmpty(props.name) && (
        <div className={cssDefault.nodeNameText}>
          <Text
            width={125}
            font={{ size: 'normal', align: 'center' }}
            color={props.defaultSelected ? Color.GREY_900 : Color.GREY_600}
            padding={'small'}
            lineClamp={2}
          >
            {props.name}
          </Text>
        </div>
      )}
      {allowAdd && !props.readonly && CreateNode ? (
        <CreateNode
          onMouseOver={() => setAddVisibility(true)}
          onMouseLeave={() => setAddVisibility(false)}
          onDragOver={() => setAddVisibility(true)}
          onDrop={onDropEvent}
          onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            event.stopPropagation()
            props?.fireEvent?.({
              type: Event.AddParallelNode,
              target: event.target,
              data: {
                identifier: props?.identifier,
                parentIdentifier: props?.parentIdentifier,
                entityType: DiagramType.Default,
                node: props
              }
            })
          }}
          className={cx(
            cssDefault.addNode,
            { [cssDefault.visible]: showAdd },
            {
              [cssDefault.stepAddNode]: props.data.graphType === PipelineGraphType.STEP_GRAPH
            },
            {
              [cssDefault.stageAddNode]: props.data.graphType === PipelineGraphType.STAGE_GRAPH
            }
          )}
          data-nodeid="add-parallel"
          id=""
        />
      ) : null}
      {!props.isParallelNode && !props.readonly && (
        <AddLinkNode<IconNodeProps>
          nextNode={props?.nextNode}
          style={{ left: getPositionOfAddIcon(props) }}
          parentIdentifier={props?.parentIdentifier}
          isParallelNode={props.isParallelNode}
          readonly={props.readonly}
          data={props}
          fireEvent={props?.fireEvent}
          identifier={props?.identifier}
          prevNodeIdentifier={props.prevNodeIdentifier as string}
          className={cx(
            cssDefault.addNodeIcon,
            cssDefault.left,
            {
              [cssDefault.stepAddIcon]: props.data.graphType === PipelineGraphType.STEP_GRAPH
            },
            {
              [cssDefault.stageAddIcon]: props.data.graphType === PipelineGraphType.STAGE_GRAPH
            }
          )}
        />
      )}
      {(props?.nextNode?.nodeType === NodeType.StepGroupNode || (!props?.nextNode && props?.parentIdentifier)) &&
        !props.isParallelNode && (
          <AddLinkNode<IconNodeProps>
            nextNode={props?.nextNode}
            style={{ right: getPositionOfAddIcon(props, true) }}
            parentIdentifier={props?.parentIdentifier}
            isParallelNode={props.isParallelNode}
            readonly={props.readonly}
            data={props}
            fireEvent={props?.fireEvent}
            identifier={props?.identifier}
            prevNodeIdentifier={props.prevNodeIdentifier as string}
            isRightAddIcon={true}
            className={cx(
              cssDefault.addNodeIcon,
              cssDefault.right,
              {
                [cssDefault.stepAddIcon]: props.data.graphType === PipelineGraphType.STEP_GRAPH
              },
              {
                [cssDefault.stageAddIcon]: props.data.graphType === PipelineGraphType.STAGE_GRAPH
              }
            )}
          />
        )}
    </div>
  )
}
