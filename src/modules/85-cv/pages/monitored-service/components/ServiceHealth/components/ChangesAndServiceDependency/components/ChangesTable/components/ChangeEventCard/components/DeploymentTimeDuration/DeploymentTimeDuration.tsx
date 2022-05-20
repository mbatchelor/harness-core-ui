/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import moment from 'moment'
import { Container, Layout, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { ChangeSourceTypes } from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import { durationAsString } from './DeploymentTimeDuration.utils'
import { TIME_FORMAT } from './DeploymentTimeDuration.constant'
import css from './DeploymentTimeDuration.module.scss'

export default function DeploymentTimeDuration({
  startTime,
  endTime,
  type
}: {
  startTime: number
  endTime: number
  type?: keyof typeof ChangeSourceTypes
}) {
  const { getString } = useStrings()
  const durationString = durationAsString(startTime, endTime)
  const timePassed = durationAsString(endTime, moment().valueOf())
  const marginals = type === ChangeSourceTypes.HarnessCDNextGen ? { right: 'medium' } : undefined

  return (
    <Container className={css.main}>
      <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
        {type === ChangeSourceTypes.HarnessCDNextGen && (
          <Text icon={'time'} iconProps={{ size: 12 }} font={{ size: 'small' }} margin={marginals}>
            {`Start: ${moment(startTime).format(TIME_FORMAT)}`}
          </Text>
        )}
        <Text icon={'time'} iconProps={{ size: 12 }} font={{ size: 'small' }} margin={marginals}>
          {getString('cv.changeSource.changeSourceCard.finished')}
          {moment(endTime).format(TIME_FORMAT)}
        </Text>
        <Text icon={'time'} iconProps={{ size: 12 }} font={{ size: 'small' }} margin={marginals}>
          {getString('common.durationPrefix')}
          {durationString}
        </Text>
        {type !== ChangeSourceTypes.HarnessCDNextGen && (
          <Text icon={'calendar'} iconProps={{ size: 12 }} font={{ size: 'small' }} margin={marginals}>
            {timePassed || 0} &nbsp;
            {getString('cv.changeSource.changeSourceCard.ago')}
          </Text>
        )}
      </Layout.Horizontal>
    </Container>
  )
}
