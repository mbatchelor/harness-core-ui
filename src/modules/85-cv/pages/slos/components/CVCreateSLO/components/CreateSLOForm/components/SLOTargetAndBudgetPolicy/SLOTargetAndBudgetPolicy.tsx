/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Card, FormInput, Heading, Icon, Layout, Text, Container } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import SLOTargetChartWrapper from '@cv/pages/slos/components/SLOTargetChart/SLOTargetChart'
import {
  getPeriodLengthOptions,
  getPeriodLengthOptionsForRolling,
  getPeriodTypeOptions,
  getWindowEndOptionsForMonth,
  getWindowEndOptionsForWeek,
  getErrorBudget,
  getCustomOptionsForSLOTargetChart,
  convertSLOFormDataToServiceLevelIndicatorDTO
} from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.utils'
import {
  SLOTargetAndBudgetPolicyProps,
  PeriodTypes,
  PeriodLengthTypes,
  SLOFormFields
} from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.types'
import SLOTargetContextualHelpText from './components/SLOTargetContextualHelpText'
import { flexStart } from './SLOTargetAndBudgetPolicy.constants'
import SLOTargetNotificationsContainer from './components/SLOTargetNotificationsContainer/SLOTargetNotificationsContainer'
import css from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.module.scss'

const SLOTargetAndBudgetPolicy: React.FC<SLOTargetAndBudgetPolicyProps> = ({ children, formikProps, ...rest }) => {
  const { getString } = useStrings()

  const { periodType, periodLengthType, notificationRuleRefs, identifier } = formikProps.values || {}

  return (
    <>
      <Heading level={2} font={{ variation: FontVariation.FORM_TITLE }} margin={{ bottom: 'xsmall' }}>
        {getString('cv.slos.sloTargetAndBudget.setSLOTarget')}
      </Heading>
      <Card className={css.card}>
        <Layout.Horizontal flex={{ justifyContent: flexStart, alignItems: 'stretch' }}>
          <Container padding={{ right: 'large' }}>
            <Layout.Vertical width="100%">
              <Heading
                level={4}
                font={{ variation: FontVariation.FORM_SUB_SECTION }}
                margin={{ top: 'small', bottom: 'medium' }}
              >
                {getString('cv.slos.sloTargetAndBudget.complianceTimePeriodTitle')}
              </Heading>
              <Layout.Horizontal spacing="medium">
                <FormInput.Select
                  name={SLOFormFields.PERIOD_TYPE}
                  label={getString('cv.slos.sloTargetAndBudget.periodType')}
                  items={getPeriodTypeOptions(getString)}
                />
                {periodType === PeriodTypes.CALENDAR ? (
                  <>
                    <FormInput.Select
                      name={SLOFormFields.PERIOD_LENGTH_TYPE}
                      label={getString('cv.periodLength')}
                      items={getPeriodLengthOptions(getString)}
                    />
                    {periodLengthType === PeriodLengthTypes.MONTHLY && (
                      <FormInput.Select
                        name={SLOFormFields.DAY_OF_MONTH}
                        label={getString('cv.windowEndsDay')}
                        items={getWindowEndOptionsForMonth()}
                        disabled={!periodLengthType}
                      />
                    )}
                    {periodLengthType === PeriodLengthTypes.WEEKLY && (
                      <FormInput.Select
                        name={SLOFormFields.DAY_OF_WEEK}
                        label={getString('cv.widowEnds')}
                        items={getWindowEndOptionsForWeek(getString)}
                        disabled={!periodLengthType}
                      />
                    )}
                  </>
                ) : (
                  <FormInput.Select
                    name={SLOFormFields.PERIOD_LENGTH}
                    label={getString('cv.periodLengthDays')}
                    items={getPeriodLengthOptionsForRolling()}
                  />
                )}
              </Layout.Horizontal>

              <FormInput.Text
                name={SLOFormFields.SLO_TARGET_PERCENTAGE}
                label={getString('cv.SLOTarget')}
                inputGroup={{
                  type: 'number',
                  min: 0,
                  max: 100,
                  step: 'any',
                  rightElement: <Icon name="percentage" padding="small" />
                }}
                className={css.sloTarget}
              />
              <Layout.Horizontal spacing="xxxlarge" flex={{ alignItems: flexStart, justifyContent: flexStart }}>
                <Container width={450}>
                  <SLOTargetChartWrapper
                    customChartOptions={getCustomOptionsForSLOTargetChart(formikProps.values)}
                    monitoredServiceIdentifier={formikProps.values.monitoredServiceRef}
                    serviceLevelIndicator={convertSLOFormDataToServiceLevelIndicatorDTO(formikProps.values)}
                    {...rest}
                    bottomLabel={
                      <Text
                        color={Color.GREY_500}
                        font={{ variation: FontVariation.SMALL_SEMI }}
                        margin={{ top: 'large', left: 'xxxlarge' }}
                        icon="symbol-square"
                        iconProps={{ color: Color.PRIMARY_4 }}
                      >
                        {getString('cv.SLIMetricRatio')}
                      </Text>
                    }
                  />
                </Container>

                <Container height={180} background={Color.GREY_100} padding="medium" className={css.errorBudget}>
                  <Text font={{ variation: FontVariation.BODY2 }} color={Color.GREY_600}>
                    {getString('cv.errorBudget')}
                  </Text>
                  <Heading inline level={1} font={{ variation: FontVariation.DISPLAY2 }}>
                    {getErrorBudget(formikProps.values)}
                  </Heading>
                  <Text inline font={{ variation: FontVariation.FORM_SUB_SECTION }}>
                    {getString('cv.mins')}
                  </Text>
                </Container>
              </Layout.Horizontal>
            </Layout.Vertical>
          </Container>
          <Container className={css.contextualHelp} padding={{ left: 'large', right: 'large' }} border={{ left: true }}>
            <SLOTargetContextualHelpText />
          </Container>
        </Layout.Horizontal>
        <SLOTargetNotificationsContainer
          identifier={identifier}
          setFieldValue={formikProps?.setFieldValue}
          notificationRuleRefs={notificationRuleRefs}
        />
      </Card>
      {children}
    </>
  )
}

export default SLOTargetAndBudgetPolicy
