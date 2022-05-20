/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import _entries from 'lodash/entries'
import _map from 'lodash/map'
import { Text, Container } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { ChangeSourceTypes } from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import { EXECUTED_BY } from '@cv/constants'
import type { ChangeEventDTO } from 'services/cv'
import { createDetailsTitle, getOnClickOptions, statusToColorMapping } from './ChangeDetails.utils'
import type { ChangeDetailsDataInterface } from '../../ChangeEventCard.types'
import StatusChip from './components/StatusChip/StatusChip'
import css from './ChangeDetails.module.scss'

export default function ChangeDetails({
  ChangeDetailsData
}: {
  ChangeDetailsData: ChangeDetailsDataInterface
}): JSX.Element {
  const { getString } = useStrings()
  const { type, category, status, executedBy } = ChangeDetailsData
  let { details } = ChangeDetailsData
  const { color, backgroundColor } = statusToColorMapping(status, type) || {}
  if (type === ChangeSourceTypes.HarnessCDNextGen) {
    details = { source: type, ...details, executedBy: (executedBy as any) || null }
  }
  return (
    <Container>
      {type && category ? (
        <Text font={{ size: 'medium', weight: 'bold' }} color={Color.GREY_800}>
          {createDetailsTitle(type, category)} {getString('details')}
        </Text>
      ) : null}
      <div className={css.gridContainer}>{getChanges(details)}</div>
      {status && type !== ChangeSourceTypes.HarnessCDNextGen ? (
        <StatusChip status={status} color={color} backgroundColor={backgroundColor} />
      ) : null}
    </Container>
  )
}

export const getChanges = (details: {
  [key: string]: string | { name: string | ChangeEventDTO['type']; url?: string }
}) => {
  return _map(_entries(details), item => {
    const isExecutedBy = item[0] === EXECUTED_BY
    const value = isExecutedBy ? item[1] : typeof item[1] === 'string' ? item[1] : item[1]?.name
    return value ? (
      <>
        <Text className={css.gridItem} font={{ size: 'small' }}>
          {item[0]}
        </Text>
        {isExecutedBy ? (
          value
        ) : (
          <Text
            className={cx(typeof item[1] !== 'string' && item[1]?.url && css.isLink)}
            font={{ size: 'small' }}
            {...getOnClickOptions(item[1])}
          >
            {value}
          </Text>
        )}
      </>
    ) : null
  })
}
