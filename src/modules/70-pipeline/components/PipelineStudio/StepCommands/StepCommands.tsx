/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Tab, Tabs, Layout } from '@wings-software/uicore'
import { Expander } from '@blueprintjs/core'
import cx from 'classnames'
import type { FormikProps } from 'formik'
import { isEmpty, noop, omit } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { StepWidgetWithFormikRef } from '@pipeline/components/AbstractSteps/StepWidget'
import { AdvancedStepsWithRef } from '@pipeline/components/PipelineSteps/AdvancedSteps/AdvancedSteps'
import type { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StageType } from '@pipeline/utils/stageHelpers'
import type { StepElementConfig } from 'services/cd-ng'
import { SaveTemplateButton } from '@pipeline/components/PipelineStudio/SaveTemplateButton/SaveTemplateButton'
import type { TemplateStepNode } from 'services/pipeline-ng'
import { TemplateBar } from '@pipeline/components/PipelineStudio/TemplateBar/TemplateBar'
import { getStepDataFromValues } from '@pipeline/utils/stepUtils'
import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import { StepCommandsProps, StepCommandsViews, TabTypes, Values } from './StepCommandTypes'
import css from './StepCommands.module.scss'

export type StepFormikRef<T = unknown> = {
  isDirty(): FormikProps<T>['dirty'] | undefined
  submitForm: FormikProps<T>['submitForm']
  getErrors(): FormikProps<T>['errors']
  setFieldError(key: string, error: string): void
  getValues(): T
  resetForm: FormikProps<T>['resetForm']
}

export type StepCommandsRef<T = unknown> =
  | ((instance: StepFormikRef<T> | null) => void)
  | React.MutableRefObject<StepFormikRef<T> | null>
  | null

enum StepCommandTabs {
  StepConfiguration = 'StepConfiguration',
  Advanced = 'Advanced'
}

export function StepCommands(
  props: StepCommandsProps & { checkDuplicateStep?: () => boolean },
  ref: StepCommandsRef
): React.ReactElement {
  const {
    step,
    onChange,
    onUpdate,
    onUseTemplate,
    onRemoveTemplate,
    isStepGroup,
    isReadonly,
    stepsFactory,
    hiddenPanels,
    checkDuplicateStep,
    hasStepGroupAncestor,
    withoutTabs,
    isNewStep = true,
    stageType = StageType.DEPLOY,
    stepViewType,
    className = '',
    viewType,
    allowableTypes
  } = props
  const { getString } = useStrings()
  const templatesEnabled = useFeatureFlag(FeatureFlag.NG_TEMPLATES)
  const [activeTab, setActiveTab] = React.useState(StepCommandTabs.StepConfiguration)
  const stepRef = React.useRef<FormikProps<unknown> | null>(null)
  const advancedConfRef = React.useRef<FormikProps<unknown> | null>(null)
  const isTemplateStep = !!(step as TemplateStepNode)?.template
  const { module } = useParams<ModulePathParams>()

  async function handleTabChange(newTab: StepCommandTabs, prevTab: StepCommandTabs): Promise<void> {
    if (prevTab === StepCommandTabs.StepConfiguration && stepRef.current) {
      if (checkDuplicateStep?.()) {
        return Promise.resolve()
      }
      // please do not remove the await below.
      // This is required for errors to be populated correctly
      await stepRef.current.submitForm()

      if (isEmpty(stepRef.current.errors)) {
        setActiveTab(newTab)
      }
    } else if (prevTab === StepCommandTabs.Advanced && advancedConfRef.current) {
      // please do not remove the await below.
      // This is required for errors to be populated correctly
      await advancedConfRef.current.submitForm()

      if (isEmpty(advancedConfRef.current.errors)) {
        setActiveTab(newTab)
      }
    }
  }

  const stepType: StepType = isStepGroup
    ? StepType.StepGroup
    : isTemplateStep
    ? StepType.Template
    : ((step as StepElementConfig).type as StepType)

  React.useImperativeHandle(ref, () => ({
    setFieldError(fieldName: string, error: string) {
      if (activeTab === StepCommandTabs.StepConfiguration && stepRef.current) {
        stepRef.current.setFieldError(fieldName, error)
      }
    },
    isDirty() {
      if (activeTab === StepCommandTabs.StepConfiguration && stepRef.current) {
        return stepRef.current.dirty
      }

      if (activeTab === StepCommandTabs.Advanced && advancedConfRef.current) {
        return advancedConfRef.current.dirty
      }
    },
    submitForm() {
      if (activeTab === StepCommandTabs.StepConfiguration && stepRef.current) {
        return stepRef.current.submitForm()
      }

      if (activeTab === StepCommandTabs.Advanced && advancedConfRef.current) {
        return advancedConfRef.current.submitForm()
      }
      return Promise.resolve()
    },
    getErrors() {
      return activeTab === StepCommandTabs.StepConfiguration && stepRef.current
        ? stepRef.current.errors
        : activeTab === StepCommandTabs.Advanced && advancedConfRef.current
        ? advancedConfRef.current.errors
        : {}
    },
    getValues() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stepObj = isStepGroup
        ? (stepsFactory.getStep(StepType.StepGroup) as PipelineStep<any>)
        : stepType === StepType.Template
        ? (stepsFactory.getStep(StepType.Template) as PipelineStep<any>)
        : (stepsFactory.getStep((step as StepElementConfig).type) as PipelineStep<any>)
      return activeTab === StepCommandTabs.StepConfiguration && stepRef.current
        ? stepObj.processFormData(stepRef.current.values)
        : activeTab === StepCommandTabs.Advanced && advancedConfRef.current
        ? advancedConfRef.current.values
        : {}
    },
    resetForm() {
      if (activeTab === StepCommandTabs.StepConfiguration && stepRef.current) {
        return stepRef.current?.resetForm()
      }
      if (activeTab === StepCommandTabs.Advanced && advancedConfRef.current) {
        return advancedConfRef.current.resetForm()
      }
      return noop
    }
  }))

  const getStepWidgetWithFormikRef = () => {
    return (
      <StepWidgetWithFormikRef
        factory={stepsFactory}
        initialValues={step}
        readonly={isReadonly}
        isNewStep={isNewStep}
        onChange={onChange}
        onUpdate={onUpdate}
        type={stepType}
        stepViewType={stepViewType}
        ref={stepRef}
        allowableTypes={allowableTypes}
      />
    )
  }

  if (withoutTabs) {
    return <div className={cx(css.stepCommand, css.withoutTabs)}>{getStepWidgetWithFormikRef()}</div>
  }

  const getStepDataForTemplate = async (): Promise<StepElementConfig> => {
    const stepObj = stepsFactory.getStep((step as StepElementConfig).type) as PipelineStep<any>
    if (activeTab === StepCommandTabs.StepConfiguration && stepRef.current) {
      await stepRef.current.validateForm()
      const errors = omit(stepRef.current.errors, 'name')
      if (isEmpty(errors)) {
        return getStepDataFromValues(stepObj.processFormData(stepRef.current.values), step)
      } else {
        await stepRef.current.submitForm()
        throw errors
      }
    } else if (activeTab === StepCommandTabs.Advanced && advancedConfRef.current) {
      await advancedConfRef.current.validateForm()
      const errors = omit(advancedConfRef.current.errors, 'name')
      if (isEmpty(errors)) {
        return getStepDataFromValues(
          { ...(advancedConfRef.current.values as Partial<Values>), tab: TabTypes.Advanced },
          step
        )
      } else {
        await advancedConfRef.current.submitForm()
        throw errors
      }
    } else {
      return step as StepElementConfig
    }
  }

  return (
    <div className={cx(css.stepCommand, className)}>
      {stepType === StepType.Template && onUseTemplate && onRemoveTemplate ? (
        <Layout.Vertical margin={'xlarge'} spacing={'xxlarge'}>
          <TemplateBar
            templateLinkConfig={(step as TemplateStepNode).template}
            onOpenTemplateSelector={onUseTemplate}
            onRemoveTemplate={onRemoveTemplate}
          />
          <Container>{getStepWidgetWithFormikRef()}</Container>
        </Layout.Vertical>
      ) : (
        <div className={cx(css.stepTabs, { stepTabsAdvanced: activeTab === StepCommandTabs.Advanced })}>
          <Tabs id="step-commands" selectedTabId={activeTab} onChange={handleTabChange}>
            <Tab
              id={StepCommandTabs.StepConfiguration}
              title={isStepGroup ? getString('stepGroupConfiguration') : getString('stepConfiguration')}
              panel={getStepWidgetWithFormikRef()}
            />
            <Tab
              id={StepCommandTabs.Advanced}
              title={getString('advancedTitle')}
              panel={
                <AdvancedStepsWithRef
                  step={step}
                  isReadonly={isReadonly}
                  stepsFactory={stepsFactory}
                  allowableTypes={allowableTypes}
                  onChange={onChange}
                  onUpdate={onUpdate}
                  hiddenPanels={hiddenPanels}
                  isStepGroup={isStepGroup}
                  hasStepGroupAncestor={hasStepGroupAncestor}
                  ref={advancedConfRef}
                  stageType={stageType}
                  stepType={stepType}
                />
              }
            />
            {templatesEnabled &&
            !isStepGroup &&
            viewType === StepCommandsViews.Pipeline &&
            module !== 'cf' &&
            (step as StepElementConfig).type !== StepType.FlagConfiguration ? (
              <>
                <Expander />
                <SaveTemplateButton data={getStepDataForTemplate} type={'Step'} />
              </>
            ) : null}
          </Tabs>
        </div>
      )}
    </div>
  )
}

export const StepCommandsWithRef = React.forwardRef(StepCommands)
