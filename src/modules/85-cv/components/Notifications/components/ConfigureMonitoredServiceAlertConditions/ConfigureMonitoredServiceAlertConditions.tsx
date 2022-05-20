/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  Button,
  ButtonVariation,
  Color,
  Container,
  Formik,
  Layout,
  MultiSelectOption,
  SelectOption,
  Text
} from '@harness/uicore'
import React, { useCallback, useMemo, useState } from 'react'
import { Form } from 'formik'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import NotificationRuleRow from '../NotificationRuleRow/NotificationRuleRow'
import {
  createNotificationRule,
  getInitialNotificationRules,
  getUpdatedNotificationRules
} from '../../NotificationsContainer.utils'
import {
  ConfigureMonitoredServiceAlertConditionsProps,
  NotificationConditions,
  NotificationRule,
  SRMNotificationType
} from '../../NotificationsContainer.types'
import css from './ConfigureMonitoredServiceAlertConditions.module.scss'

export default function ConfigureMonitoredServiceAlertConditions({
  prevStepData,
  nextStep,
  previousStep
}: ConfigureMonitoredServiceAlertConditionsProps): JSX.Element {
  const { projectIdentifier } = useParams<ProjectPathProps>()
  const [conditions, setConditions] = useState<NotificationRule[]>(getInitialNotificationRules(prevStepData))

  const { getString } = useStrings()

  const dataTillCurrentStep = useMemo(() => {
    return {
      ...prevStepData,
      conditions,
      type: SRMNotificationType.MONITORED_SERVICE
    }
  }, [conditions, prevStepData])

  const handleAddNotificationRule = useCallback(() => {
    const newConditions = [...conditions, createNotificationRule()]
    setConditions(newConditions)
  }, [conditions])

  const handleDeleteNotificationRule = useCallback(
    notificationIdToDelete => {
      if (notificationIdToDelete) {
        const updatedNotificationRules = conditions.filter(
          notificationRule => notificationRule.id !== notificationIdToDelete
        )
        setConditions(updatedNotificationRules)
      }
    },
    [conditions]
  )

  const handleChangeField = useCallback(
    (
      notificationRule: NotificationRule,
      currentFieldValue: SelectOption | MultiSelectOption[] | string,
      currentField: string,
      nextField?: string,
      nextFieldValue?: SelectOption | MultiSelectOption[] | string
    ) => {
      const updatedNotificationRules = getUpdatedNotificationRules({
        conditions,
        notificationRule,
        currentField,
        currentFieldValue,
        nextField,
        nextFieldValue
      })
      setConditions(updatedNotificationRules)
    },
    [conditions]
  )

  const renderConditions = (): JSX.Element => {
    const showDeleteNotificationsIcon = conditions.length > 1
    return (
      <Container padding={{ top: 'medium' }} className={css.notificationRulesContainer}>
        {conditions.length
          ? conditions.map(notificationRule => {
              return (
                <NotificationRuleRow
                  key={notificationRule?.id}
                  showDeleteNotificationsIcon={showDeleteNotificationsIcon}
                  notificationRule={notificationRule}
                  handleChangeField={handleChangeField}
                  handleDeleteNotificationRule={handleDeleteNotificationRule}
                />
              )
            })
          : null}
        <RbacButton
          padding={{ bottom: 'small' }}
          icon="plus"
          text={'Add Condition'}
          variation={ButtonVariation.LINK}
          onClick={handleAddNotificationRule}
          data-testid="addCondtion-button"
          margin={{ top: 'small' }}
          permission={{
            permission: PermissionIdentifier.EDIT_MONITORED_SERVICE,
            resource: {
              resourceType: ResourceType.MONITOREDSERVICE,
              resourceIdentifier: projectIdentifier
            }
          }}
        />
      </Container>
    )
  }

  return (
    <>
      <Text color={Color.BLACK} font={{ weight: 'semi-bold', size: 'medium' }}>
        {getString('cv.notifications.configureAlertConditions')}
      </Text>
      <Text color={Color.BLACK} font={{ weight: 'semi-bold', size: 'normal' }} padding={{ top: 'large' }}>
        {`Category:${getString('cv.notifications.serviceHealth')} `}
      </Text>
      <Text font={{ size: 'small' }} padding={{ top: 'small' }}>
        {getString('cv.notifications.serviceHealthDescription')}
      </Text>
      <Formik<NotificationConditions>
        initialValues={{ ...prevStepData, conditions: [createNotificationRule()] }}
        formName="notificationsOverview"
        onSubmit={() => {
          nextStep?.(dataTillCurrentStep)
        }}
      >
        {() => {
          return (
            <Form>
              <Container className={css.configureConditionsContainer}>
                {renderConditions()}
                <Container flex={{ justifyContent: 'flex-start' }}>
                  <Layout.Horizontal spacing={'small'}>
                    <Button
                      variation={ButtonVariation.TERTIARY}
                      text={getString('back')}
                      onClick={() => previousStep?.(dataTillCurrentStep)}
                    />
                    <Button
                      type="submit"
                      variation={ButtonVariation.PRIMARY}
                      rightIcon="chevron-right"
                      text={getString('continue')}
                    />
                  </Layout.Horizontal>
                </Container>
              </Container>
            </Form>
          )
        }}
      </Formik>
    </>
  )
}
