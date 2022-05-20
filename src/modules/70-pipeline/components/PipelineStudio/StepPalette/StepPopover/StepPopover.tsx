/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Popover, Container, Layout, Card, Icon } from '@wings-software/uicore'
import { Classes, IPopoverProps, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { isEmpty, isNil } from 'lodash-es'
import cx from 'classnames'
import { iconMap } from '@pipeline/components/PipelineStudio/StepPalette/iconMap'
import { FeatureWarningTooltip } from '@common/components/FeatureWarning/FeatureWarningWithTooltip'
import type { StepData } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import type { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import type { StringsMap } from 'stringTypes'
import type { AbstractStepFactory } from '../../../AbstractSteps/AbstractStepFactory'
import css from './StepPopover.module.scss'

export interface StepPopoverProps {
  stepData?: StepData
  stepsFactory: AbstractStepFactory
  popoverProps?: IPopoverProps
  className?: string
}

interface StepTooltipContentInterface {
  stepData: StepData
  stepsFactory: AbstractStepFactory
  description?: keyof StringsMap
}

function TooltipContent({ description, stepsFactory, stepData }: StepTooltipContentInterface) {
  // Component renders the tooltip over steps in the palette.
  // If the step is disabled, show the enforcement tooltip
  const { getString } = useStrings()
  const { disabled, featureRestrictionName = '' } = stepData || {}
  if (disabled && featureRestrictionName) {
    return <FeatureWarningTooltip featureName={featureRestrictionName as FeatureIdentifier} />
  }
  if (description) {
    return (
      <Container width={200} padding="medium">
        <Text font={{ size: 'small' }} color={Color.GREY_50}>
          {getString(description)}
        </Text>
        {stepsFactory.getStepIsHarnessSpecific(stepData.type || '') && (
          <Layout.Horizontal margin={{ top: 'small' }} flex={{ justifyContent: 'flex-start' }} spacing={'small'}>
            <Icon size={12} name="harness-logo-white-bg-blue" />
            <Text font={{ size: 'xsmall' }} color={Color.GREY_400}>
              {getString('pipeline.poweredByHarness')}
            </Text>
          </Layout.Horizontal>
        )}
      </Container>
    )
  }
  return null
}

export function StepPopover(props: StepPopoverProps): React.ReactElement {
  const { stepData, stepsFactory, popoverProps, className } = props
  if (stepData && !isEmpty(stepData)) {
    const step = stepsFactory.getStep(stepData.type)
    const description = stepsFactory.getStepDescription(stepData.type || '')
    return (
      <Popover
        interactionKind={PopoverInteractionKind.HOVER}
        position={Position.TOP}
        className={Classes.DARK}
        {...popoverProps}
      >
        <Card
          interactive={!isNil(step)}
          selected={false}
          className={cx(css.paletteCard, className)}
          data-testid={`step-card-${stepData.name}`}
          disabled={stepData.disabled}
        >
          {stepsFactory.getStepIsHarnessSpecific(stepData.type || '') && (
            <Icon size={12} name="harness-logo-white-bg-blue" className={css.stepHarnessLogo} />
          )}

          <Icon
            name={!isNil(step) ? step.getIconName?.() : iconMap[stepData.name || '']}
            size={25}
            {...(!isNil(step) && !isNil(step?.getIconColor?.()) ? { color: step.getIconColor() } : {})}
            style={{ color: step?.getIconColor?.() }}
          />
        </Card>
        <TooltipContent description={description} stepData={stepData} stepsFactory={stepsFactory} />
      </Popover>
    )
  } else {
    return (
      <Card interactive={true} className={cx(css.paletteCard, css.addStep)} data-testid={`step-card-empty`}>
        <Icon name={'plus'} size={25} />
      </Card>
    )
  }
}
