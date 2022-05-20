/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { DiagramEngine } from '@projectstorm/react-diagrams-core'
import { Utils } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { DefaultLinkFactory } from './DefaultLinkFactory'
import type { DefaultLinkModel } from './DefaultLinkModel'
import { Event, DiagramDrag } from '../Constants'

export interface DefaultLinkSegmentWidgetProps {
  path: string
  link: DefaultLinkModel
  selected: boolean
  forwardRef: React.RefObject<SVGPathElement>
  factory: DefaultLinkFactory
  diagramEngine: DiagramEngine
  onSelection: (selected: boolean) => void
  extras: Record<string, any>
}

export function DefaultLinkSegmentWidget(props: DefaultLinkSegmentWidgetProps): JSX.Element {
  const { onSelection, link } = props
  //NOTE: isDragOver is used to set pointerEvents="none" to plus button on dragOver event
  const [isDragOver, setDragOver] = React.useState(false)
  const allowAdd = link.getOptions().allowAdd ?? true
  const prevColorRef = React.useRef('')
  const color = link.getOptions().color
  React.useEffect(() => {
    prevColorRef.current = color || ''
  })
  const Bottom = React.cloneElement(
    props.factory.generateLinkSegment(
      props.link,
      props.selected || props.link.isSelected(),
      props.path,
      allowAdd,
      prevColorRef.current
    ),
    {
      ref: props.forwardRef
    }
  )

  const BeforePath = React.cloneElement(Bottom, {
    stroke: prevColorRef.current,
    className: ''
  })

  const onMouseLeave = React.useCallback(() => {
    onSelection(false)
  }, [onSelection])

  const onMouseEnter = React.useCallback(() => {
    onSelection(true)
  }, [onSelection])

  const onContextMenu = React.useCallback(
    event => {
      if (!link.isLocked()) {
        event?.preventDefault()
        link.remove()
      }
    },
    [link]
  )

  const onClick = React.useCallback(() => {
    allowAdd && link.fireEvent({}, Event.AddLinkClicked)
  }, [link, allowAdd])

  const pathRef = React.useRef<SVGPathElement>()

  const [point, setPoint] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    try {
      if (pathRef.current) {
        const totalLength = (pathRef.current.getTotalLength?.() || 0) * 0.5
        const position = pathRef.current.getPointAtLength?.(totalLength) || { x: 0, y: 0 }
        setPoint({ x: position.x, y: position.y })
      }
    } catch (_e) {
      // do nothing
    }
  }, [pathRef])

  const Top = React.cloneElement(Bottom, {
    strokeLinecap: 'round',
    onMouseLeave,
    onMouseEnter,
    ...props.extras,
    ref: pathRef,
    'data-linkid': props.link.getID(),
    strokeOpacity: 0, // props.selected ? 0.1 : 0,
    strokeWidth: 20,
    fill: 'none',
    onContextMenu,
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
      setDragOver(true)
      if (event.dataTransfer.types.indexOf(DiagramDrag.AllowDropOnLink) !== -1) {
        if (allowAdd) {
          onSelection(true)
          event.preventDefault()
        }
      }
    },
    onDragLeave: (event: React.DragEvent<HTMLDivElement>) => {
      setDragOver(false)
      if (event.dataTransfer.types.indexOf(DiagramDrag.AllowDropOnLink) !== -1) {
        if (allowAdd) {
          onSelection(false)
        }
      }
    },
    onDrop: (event: React.DragEvent<HTMLDivElement>) => {
      if (event.dataTransfer.types.indexOf(DiagramDrag.AllowDropOnLink) !== -1) {
        if (allowAdd) {
          const dropData: { id: string; identifier: string } = JSON.parse(
            event.dataTransfer.getData(DiagramDrag.NodeDrag)
          )
          link.fireEvent({ node: dropData }, Event.DropLinkEvent)
        }
      }
    }
  })

  return (
    <g>
      {link.getOptions().color !== prevColorRef.current && BeforePath}
      {Bottom}
      {Top}
      {allowAdd && (
        <>
          <circle
            fill={props.link.getOptions().selectedColor}
            r={10}
            cx={point.x}
            pointerEvents={isDragOver ? 'none' : 'all'}
            onMouseLeave={onMouseLeave}
            onMouseEnter={onMouseEnter}
            cy={point.y}
            opacity={props.selected ? 1 : 0}
            onClick={onClick}
          />
          <line
            stroke={Utils.getRealCSSColor(Color.WHITE)}
            x1={point.x - 5}
            y1={point.y}
            x2={point.x + 5}
            y2={point.y}
            strokeWidth="1"
            opacity={props.selected ? 1 : 0}
          ></line>
          <line
            stroke={Utils.getRealCSSColor(Color.WHITE)}
            x1={point.x}
            y1={point.y - 5}
            x2={point.x}
            y2={point.y + 5}
            strokeWidth="1"
            opacity={props.selected ? 1 : 0}
          ></line>
        </>
      )}
    </g>
  )
}
