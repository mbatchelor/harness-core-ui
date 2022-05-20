/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Button, Container, Layout, Select, Text, TextInput } from '@harness/uicore'
import React from 'react'
import HorizontalLineWithText from '@cv/components/HorizontalLineWithText/HorizontalLineWithText'
import { useStrings } from 'framework/strings'
import type { NotificationRuleRowProps } from './SLONotificationRuleRow.types'
import { getValueFromEvent } from './SLONotificationRuleRow.utils'
import { SLOCondition, sloConditionOptions } from './SLONotificationRuleRow.constants'
import css from './SLONotificationRuleRow.module.scss'

export default function SLONotificationRuleRow({
  notificationRule,
  showDeleteNotificationsIcon,
  handleDeleteNotificationRule,
  handleChangeField
}: NotificationRuleRowProps): JSX.Element {
  const { getString } = useStrings()
  const { threshold, lookBackDuration, id, condition } = notificationRule || {}

  return (
    <>
      <Layout.Horizontal padding={{ top: 'large' }} key={id} spacing="medium">
        <Layout.Vertical spacing="xsmall" padding={{ right: 'small' }}>
          <Text>{getString('cv.notifications.condition')}</Text>
          <Select
            name={`${id}.condition`}
            className={css.sloConditionField}
            value={condition}
            items={sloConditionOptions}
            onChange={option => {
              handleChangeField(notificationRule, option, 'condition', 'threshold', threshold)
            }}
          />
        </Layout.Vertical>
        {threshold ? (
          <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
            <Text>{'Value'}</Text>
            <TextInput
              required
              type="number"
              placeholder={condition?.value === SLOCondition.ERROR_BUDGET_REMAINING_MINUTES ? 'min' : '%'}
              min={0}
              value={threshold as string}
              name={`${id}.threshold`}
              className={css.numberField}
              onChange={e => {
                handleChangeField(
                  notificationRule,
                  getValueFromEvent(e),
                  'threshold',
                  'lookBackDuration',
                  lookBackDuration
                )
              }}
            />
          </Layout.Vertical>
        ) : null}
        {lookBackDuration && condition?.value === SLOCondition.ERROR_BUDGET_BURN_RATE_IS_ABOVE ? (
          <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
            <Text>{'Lookback Duration'}</Text>
            <TextInput
              required
              type="number"
              min={0}
              placeholder="min"
              value={lookBackDuration as string}
              name={`${id}.lookBackDuration`}
              className={css.numberField}
              onChange={e => {
                handleChangeField(notificationRule, getValueFromEvent(e), 'lookBackDuration')
              }}
            />
          </Layout.Vertical>
        ) : null}
        {showDeleteNotificationsIcon ? (
          <Container padding={{ top: 'large' }}>
            <Button
              icon="main-trash"
              iconProps={{ size: 20 }}
              minimal
              onClick={() => handleDeleteNotificationRule(notificationRule.id)}
            />
          </Container>
        ) : null}
      </Layout.Horizontal>
      <Container padding={{ top: 'small' }}>
        <HorizontalLineWithText text={'OR'} />
      </Container>
    </>
  )
}
