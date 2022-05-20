/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  Button,
  Container,
  Layout,
  MultiSelectDropDown,
  MultiSelectOption,
  Select,
  SelectOption,
  Text,
  TextInput
} from '@harness/uicore'
import React from 'react'
import HorizontalLineWithText from '@cv/components/HorizontalLineWithText/HorizontalLineWithText'
import { useStrings } from 'framework/strings'
import {
  conditionOptions,
  changeTypeOptions,
  Condition
} from '../ConfigureMonitoredServiceAlertConditions/ConfigureMonitoredServiceAlertConditions.constants'

import type { NotificationRuleRowProps } from './NotificationRuleRow.types'
import { getValueFromEvent } from './NotificationRuleRow.utils'
import type { NotificationRule } from '../../NotificationsContainer.types'
import css from './NotificationRuleRow.module.scss'

const renderConnectedFields = (
  notificationRule: NotificationRule,
  handleChangeField: (
    notificationRule: NotificationRule,
    currentFieldValue: SelectOption | MultiSelectOption[] | string,
    currentField: string,
    nextField?: string,
    nextFieldValue?: SelectOption | MultiSelectOption[] | string
  ) => void
): JSX.Element => {
  const { changeType, duration, id, condition, threshold } = notificationRule

  switch (condition?.value) {
    case Condition.CHANGE_IMPACT:
      return (
        <>
          {changeType ? (
            <Layout.Vertical spacing="xsmall" padding={{ left: 'small', right: 'small' }}>
              <Text>{'Change Type'}</Text>
              <MultiSelectDropDown
                value={Array.isArray(changeType) ? changeType : []}
                items={changeTypeOptions}
                className={css.field}
                onChange={option => {
                  handleChangeField(notificationRule, option, 'changeType', 'threshold', threshold)
                }}
              />
            </Layout.Vertical>
          ) : null}
          {threshold ? (
            <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
              <Text lineClamp={1} width={100}>
                {'Health score is below'}
              </Text>
              <TextInput
                min={0}
                max={100}
                type="number"
                required
                value={threshold}
                name={`${id}.threshold`}
                className={css.numberField}
                onChange={e => {
                  handleChangeField(notificationRule, getValueFromEvent(e), 'threshold', 'duration', duration)
                }}
              />
            </Layout.Vertical>
          ) : null}
          {duration ? (
            <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
              <Text>{'Duration'}</Text>
              <TextInput
                type="number"
                required
                min={0}
                placeholder="min"
                value={duration as string}
                name={`${id}.duration`}
                className={css.numberField}
                onChange={e => {
                  handleChangeField(notificationRule, getValueFromEvent(e), 'duration')
                }}
              />
            </Layout.Vertical>
          ) : null}
        </>
      )
    case Condition.HEALTH_SCORE:
      return (
        <>
          {threshold ? (
            <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
              <Text>{'Threshold is below'}</Text>
              <TextInput
                type="number"
                required
                min={0}
                value={threshold as string}
                name={`${id}.threshold`}
                className={css.numberField}
                onChange={e => {
                  handleChangeField(notificationRule, getValueFromEvent(e), 'threshold', 'duration', duration)
                }}
              />
            </Layout.Vertical>
          ) : null}
          {duration ? (
            <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
              <Text>{'Duration'}</Text>
              <TextInput
                type="number"
                required
                min={0}
                placeholder="min"
                value={duration as string}
                name={`${id}.duration`}
                className={css.numberField}
                onChange={e => {
                  handleChangeField(notificationRule, getValueFromEvent(e), 'duration')
                }}
              />
            </Layout.Vertical>
          ) : null}
        </>
      )
    case Condition.CHNAGE_OBSERVED:
      return (
        <>
          {changeType ? (
            <Layout.Vertical spacing="xsmall" padding={{ left: 'small', right: 'small' }}>
              <Text>{'Change Type'}</Text>
              <MultiSelectDropDown
                value={Array.isArray(changeType) ? changeType : []}
                items={changeTypeOptions}
                className={css.field}
                onChange={option => {
                  handleChangeField(notificationRule, option, 'changeType')
                }}
              />
            </Layout.Vertical>
          ) : null}
        </>
      )
    default:
      return <></>
  }
}

export default function NotificationRuleRow({
  notificationRule,
  showDeleteNotificationsIcon,
  handleDeleteNotificationRule,
  handleChangeField
}: NotificationRuleRowProps): JSX.Element {
  const { getString } = useStrings()
  const { changeType, id, condition, threshold } = notificationRule

  return (
    <>
      <Layout.Horizontal padding={{ top: 'large' }} key={id} spacing="medium">
        <Layout.Vertical spacing="xsmall" padding={{ right: 'small' }}>
          <Text>{getString('cv.notifications.condition')}</Text>
          <Select
            name={`${id}.condition`}
            className={css.conditionField}
            value={condition}
            items={conditionOptions}
            onChange={option => {
              const { nextField, nextFieldValue } =
                option?.value === Condition.HEALTH_SCORE
                  ? { nextField: 'threshold', nextFieldValue: threshold }
                  : { nextField: 'changeType', nextFieldValue: changeType }
              handleChangeField(notificationRule, option, 'condition', nextField, nextFieldValue)
            }}
          />
        </Layout.Vertical>
        {renderConnectedFields(notificationRule, handleChangeField)}
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
