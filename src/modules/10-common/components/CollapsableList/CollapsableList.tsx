/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import cx from 'classnames'

import type { IconProps } from '@harness/icons'
import { Collapse, Pagination, PaginationProps } from '@wings-software/uicore'
import type { Scope } from '@common/interfaces/SecretsInterface'

import type { EntityReferenceResponse } from '../EntityReference/EntityReference'

import css from './CollapsableList.module.scss'

export interface CollapsableTableProps<T> {
  selectedRecord: T | undefined
  setSelectedRecord: (val: T | undefined) => void
  data: EntityReferenceResponse<T>[]
  recordRender: (args: { item: EntityReferenceResponse<T>; selectedScope: Scope; selected?: boolean }) => JSX.Element
  collapsedRecordRender?: (args: {
    item: EntityReferenceResponse<T>
    selectedScope: Scope
    selected?: boolean
  }) => JSX.Element
  pagination: PaginationProps
  selectedScope: Scope
  disableCollapse?: boolean
}

export function CollapsableList<T>(props: CollapsableTableProps<T>): JSX.Element {
  const { disableCollapse = false } = props
  return (
    <>
      <div className={css.referenceList}>
        {props.data.map((item: EntityReferenceResponse<T>) => (
          <Collapse
            key={item.identifier}
            collapsedIcon="main-chevron-right"
            expandedIcon="main-chevron-down"
            iconProps={{ size: 12 } as IconProps}
            isRemovable={false}
            collapseClassName={cx(css.collapseWrapper, {
              [css.selectedItem]: props.selectedRecord === item.record
            })}
            collapseHeaderClassName={cx(css.collapseHeader, { [css.hideCollapseIcon]: disableCollapse })}
            heading={
              <div
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  props.setSelectedRecord(props.selectedRecord === item.record ? undefined : item.record)
                }}
                className={css.collapeHeaderContent}
              >
                {props.recordRender({
                  item,
                  selectedScope: props.selectedScope,
                  selected: props.selectedRecord === item.record
                })}
              </div>
            }
          >
            {props.collapsedRecordRender?.({
              item,
              selectedScope: props.selectedScope,
              selected: props.selectedRecord === item.record
            })}
          </Collapse>
        ))}
      </div>
      <Pagination {...props.pagination} />
    </>
  )
}
