/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Layout,
  StepProps,
  Color,
  FontVariation,
  Text,
  ButtonVariation,
  Button,
  Icon,
  FormInput,
  SelectOption
} from '@harness/uicore'
import { FieldArray, FormikProps } from 'formik'
import { defaultTo } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { channels, notificationChannelsList } from '@ce/constants'
import type { StringsMap } from 'stringTypes'
import css from './AnomaliesAlertDialog.module.scss'

interface StepData {
  name: string
}

interface NotificationChannelProps {
  name: string
  onClose: () => void
  formikProps: FormikProps<NotificationValues>
}

interface Alerts {
  channelName?: channels
  channelUrl?: string | string[]
}

export interface NotificationValues {
  perspective: string
  alertList: Alerts[]
}

const NotificationMethod: React.FC<StepProps<StepData> & NotificationChannelProps> = props => {
  const { getString } = useStrings()
  const notificationList = defaultTo(props.formikProps?.values?.alertList, [])
  const channelList = notificationChannelsList.map(item => {
    return {
      ...item,
      label: getString(item.label as keyof StringsMap)
    }
  })

  return (
    <React.Fragment>
      <Icon name="cross" size={16} onClick={() => props.onClose()} className={css.closeBtn} data-testId="crossModal" />
      <Layout.Vertical spacing="large">
        <Text color={Color.BLACK} font={{ variation: FontVariation.H5 }}>
          {props.name}
        </Text>
        <Text color={Color.GREY_500} font={{ variation: FontVariation.SMALL }}>
          {getString('ce.anomalyDetection.notificationAlerts.notificationStepSubtext')}
        </Text>
      </Layout.Vertical>
      <Layout.Vertical spacing="medium" className={css.addChannelWrapper}>
        <Text color={Color.BLACK} font={{ variation: FontVariation.H6 }}>
          {getString('ce.anomalyDetection.notificationAlerts.alertChannelHeading')}
        </Text>
        <FieldArray
          name="alertList"
          render={arrayHelpers => {
            const removeRow = (index: number) => {
              arrayHelpers.remove(index)
            }

            return (
              <div className={css.alertChannelWrapper}>
                {notificationList.map((_, index) => (
                  <Layout.Horizontal key={index} spacing="xlarge" className={css.addAlertChannel}>
                    <FormInput.Select
                      items={channelList as SelectOption[]}
                      key={`channelName_${index}`}
                      name={`alertList.${index}.channelName`}
                      className={css.channelSelection}
                      placeholder={getString('ce.anomalyDetection.notificationAlerts.selectChannelPlaceholder')}
                      data-testid={`notification-channel`}
                    />
                    <FormInput.Text
                      name={`alertList.${index}.channelUrl`}
                      key={`channelUrl_${index}`}
                      placeholder={getString('ce.anomalyDetection.notificationAlerts.urlInputPlaceholder')}
                      className={css.urlInput}
                    />
                    <Icon name="main-trash" size={16} onClick={() => removeRow(index)} data-testid="deleteChannel" />
                  </Layout.Horizontal>
                ))}
                <Button
                  text={getString('ce.anomalyDetection.notificationAlerts.addChannelBtn')}
                  icon="plus"
                  onClick={() => arrayHelpers.push({ channelName: '', channelUrl: '' })}
                  variation={ButtonVariation.LINK}
                  className={css.addChannelBtn}
                />
              </div>
            )
          }}
        />
      </Layout.Vertical>
      <Layout.Horizontal className={css.actionBtn} spacing="medium">
        <Button
          onClick={() => props.previousStep?.({ name: props.name || '' })}
          text={getString('back')}
          icon="chevron-left"
          variation={ButtonVariation.TERTIARY}
        />
        <Button
          type="submit"
          variation={ButtonVariation.PRIMARY}
          rightIcon="chevron-right"
          onClick={() => props.nextStep?.({ name: props.name || '' })}
          text={getString('saveAndContinue')}
          data-testid="submitForm"
          disabled={!notificationList.length}
        />
      </Layout.Horizontal>
    </React.Fragment>
  )
}

export default NotificationMethod
