/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  Button,
  ButtonVariation,
  Formik,
  FormInput,
  Layout,
  MultiSelectOption,
  StepProps,
  Text
} from '@wings-software/uicore'
import React from 'react'
import { Color, Intent } from '@harness/design-system'
import * as Yup from 'yup'
import { Form } from 'formik'
import { startCase, isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { NotificationRules, PipelineEvent } from 'services/pipeline-ng'
import css from '../useNotificationModal.module.scss'

export enum PipelineEventType {
  ALL_EVENTS = 'AllEvents',
  PipelineSuccess = 'PipelineSuccess',
  PipelineFailed = 'PipelineFailed',
  PipelinePaused = 'PipelinePaused',
  StageSuccess = 'StageSuccess',
  StageFailed = 'StageFailed',
  StageStart = 'StageStart',
  StepFailed = 'StepFailed',
  PipelineEnd = 'PipelineEnd',
  PipelineStart = 'PipelineStart'
}

const pipelineEventItems = [
  {
    label: startCase(PipelineEventType.ALL_EVENTS),
    value: PipelineEventType.ALL_EVENTS
  },
  {
    label: startCase(PipelineEventType.PipelineStart),
    value: PipelineEventType.PipelineStart
  },
  {
    label: startCase(PipelineEventType.PipelineEnd),
    value: PipelineEventType.PipelineEnd
  },

  {
    label: startCase(PipelineEventType.PipelineSuccess),
    value: PipelineEventType.PipelineSuccess
  },
  {
    label: startCase(PipelineEventType.PipelineFailed),
    value: PipelineEventType.PipelineFailed
  },
  {
    label: startCase(PipelineEventType.PipelinePaused),
    value: PipelineEventType.PipelinePaused
  },
  {
    label: startCase(PipelineEventType.StageFailed),
    value: PipelineEventType.StageFailed
  },
  {
    label: startCase(PipelineEventType.StageSuccess),
    value: PipelineEventType.StageSuccess
  },
  {
    label: startCase(PipelineEventType.StageStart),
    value: PipelineEventType.StageStart
  },
  {
    label: startCase(PipelineEventType.StepFailed),
    value: PipelineEventType.StepFailed
  }
]

interface PipelineEventsFormData {
  types: { [key: string]: any }
  [key: string]: any
}

type PipelineEventsProps = StepProps<NotificationRules> & { stagesOptions?: MultiSelectOption[] }

function PipelineEvents({ nextStep, prevStepData, stagesOptions }: PipelineEventsProps): React.ReactElement {
  const { getString } = useStrings()
  const initialValues: PipelineEventsFormData = { types: {} }
  const types: Required<PipelineEventsFormData>['types'] = {}

  const getStageOption = (stageId: string) => {
    return stagesOptions?.find(item => item.value === stageId)
  }

  prevStepData?.pipelineEvents?.map(event => {
    const type = event.type
    if (type) {
      types[type] = true
      if (event.forStages?.length) {
        initialValues[type] = event.forStages.map(stageId => getStageOption(stageId)).filter(item => !!item)
      }
    }
  })

  return (
    <Layout.Vertical spacing="xxlarge" padding="small">
      <Text font="medium" color={Color.BLACK}>
        {getString('notifications.pipelineEvents')}
      </Text>
      <Formik<PipelineEventsFormData>
        initialValues={{ ...initialValues, types }}
        formName="pipelineEvents"
        validationSchema={Yup.object()
          .shape({
            types: Yup.object().required()
          })
          .test({
            test: function (val) {
              if (isEmpty(val?.types)) {
                return this.createError({
                  path: 'types',
                  message: getString('notifications.eventRequired')
                })
              }
              if (Object.keys(val.types).length === 1 && val.types[PipelineEventType.ALL_EVENTS] === false) {
                return this.createError({
                  path: 'types',
                  message: getString('notifications.eventRequired')
                })
              }

              if (
                val.types[PipelineEventType.StageStart] &&
                (!val[PipelineEventType.StageStart] || !val[PipelineEventType.StageStart].length)
              ) {
                return this.createError({
                  path: PipelineEventType.StageStart,
                  message: getString('notifications.stageRequired')
                })
              } else if (
                val.types[PipelineEventType.StageFailed] &&
                (!val[PipelineEventType.StageFailed] || !val[PipelineEventType.StageFailed].length)
              ) {
                return this.createError({
                  path: PipelineEventType.StageFailed,
                  message: getString('notifications.stageRequired')
                })
              } else if (
                val.types[PipelineEventType.StageSuccess] &&
                (!val[PipelineEventType.StageSuccess] || !val[PipelineEventType.StageSuccess].length)
              ) {
                return this.createError({
                  path: PipelineEventType.StageSuccess,
                  message: getString('notifications.stageRequired')
                })
              }

              return true
            }
          })
          .required()}
        validateOnChange={false}
        onSubmit={values => {
          const pipelineEvents: PipelineEvent[] = Object.keys(values.types)
            .filter(function (k) {
              return values.types[k]
            })
            .map(value => {
              const dataToSubmit: PipelineEvent = { type: value as PipelineEventType }
              if (values[value]?.length)
                dataToSubmit['forStages'] = values[value].map((item: { value: string }) => item.value)
              return dataToSubmit
            })

          nextStep?.({ ...prevStepData, pipelineEvents })
        }}
      >
        {formikProps => {
          return (
            <Form>
              <Layout.Vertical spacing="medium" className={css.formContent}>
                <Text margin={{ bottom: !isEmpty(formikProps.errors) ? 'small' : 'large' }}>
                  {getString('notifications.selectPipelineEvents')}
                </Text>
                {!isEmpty(formikProps.errors) && (
                  <Text intent={Intent.DANGER} margin={{ top: 'none', bottom: 'small' }}>
                    {getString('notifications.eventRequired')}
                  </Text>
                )}
                {pipelineEventItems.map(event => {
                  return (
                    <Layout.Vertical key={event.label}>
                      <Layout.Horizontal margin={{ bottom: 'small' }} flex>
                        <FormInput.CheckBox
                          className={formikProps.values.types[event.value] ? 'checked' : 'unchecked'}
                          name={`types.${event.value}`}
                          checked={formikProps.values.types[event.label]}
                          label={event.label}
                          padding={{ left: 'xxxlarge' }}
                          onChange={e => {
                            if (e.currentTarget.checked) {
                              if (event.value === PipelineEventType.ALL_EVENTS) {
                                const finalUpdatedValue = {
                                  types: { [PipelineEventType.ALL_EVENTS]: true }
                                } as PipelineEventsFormData

                                Object.keys(formikProps.values.types).forEach(item => {
                                  finalUpdatedValue.types[item] = item === PipelineEventType.ALL_EVENTS
                                })
                                formikProps.setValues(finalUpdatedValue)
                              } else {
                                formikProps.setValues({
                                  types: {
                                    ...formikProps.values.types,
                                    [PipelineEventType.ALL_EVENTS]: false,
                                    [event?.value]: true
                                  }
                                })
                              }
                            }
                          }}
                        />
                        {(event.value === PipelineEventType.StageSuccess ||
                          event.value === PipelineEventType.StageFailed ||
                          event.value === PipelineEventType.StageStart) && (
                          <FormInput.MultiSelect
                            disabled={!formikProps.values.types[event.value]}
                            className={css.stagesMultiSelect}
                            items={stagesOptions || []}
                            name={event.value}
                            label={''}
                            multiSelectProps={{
                              placeholder: getString('notifications.selectStagesPlaceholder'),
                              allowCreatingNewItems: false
                            }}
                          />
                        )}
                      </Layout.Horizontal>
                    </Layout.Vertical>
                  )
                })}
              </Layout.Vertical>
              <Button
                type="submit"
                variation={ButtonVariation.PRIMARY}
                rightIcon="chevron-right"
                text={getString('continue')}
              />
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export default PipelineEvents
