/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'

import { Text, Icon, IconName } from '@wings-software/uicore'
import { Status } from './WizardHelper'
import WizardHeader from './WizardHeader'
import css from './StepWizard.module.scss'

export interface PanelInterface {
  id: string
  tabTitle?: string
  tabTitleComponent?: JSX.Element
  status?: string
}
interface StepChangeData<SharedObject> {
  prevStep: number
  nextStep: number
  prevStepData: SharedObject
}
export interface StepWizardProps<SharedObject = unknown> {
  icon?: IconName
  // iconProps?: Omit<IconProps, 'name'>
  title?: string | JSX.Element
  children: Array<React.ReactElement<StepProps<SharedObject>> | null>
  isNavMode?: boolean
  className?: string
  stepClassName?: string
  navClassName?: string
  onStepChange?: (data: StepChangeData<SharedObject | undefined>) => void
  onCompleteWizard?: (data: SharedObject | undefined) => void
  initialStep?: number
  panels: PanelInterface[]
  props?: string
}

export interface StepProps<SharedObject> {
  name?: string
  // These props will be passed by wizard
  prevStepData?: SharedObject
  currentStep?: () => number
  totalSteps?: () => number
  nextStep?: (prevStepData?: SharedObject) => void
  previousStep?: (prevStepData?: SharedObject) => void
  gotoStep?: (stepNumber: number, prevStepData?: SharedObject) => void
  firstStep?: (prevStepData?: SharedObject) => void
  lastStep?: (prevStepData?: SharedObject) => void
}

interface StepState<SharedObject> {
  activeStep: number
  prevStep: number
  prevStepData?: SharedObject
  stepNames?: string[]
  totalSteps: number
  panels: PanelInterface[]
  panelActiveId: number
}

export function WizardWithProgress<SharedObject>(props: StepWizardProps<SharedObject>): React.ReactElement {
  const {
    className = '',
    isNavMode = true,
    initialStep = 1,
    children,
    stepClassName = '',
    navClassName = '',
    icon = '',
    title = '',
    panels
  } = props

  const [state, setState] = React.useState<StepState<SharedObject>>({
    activeStep: initialStep < 1 || initialStep > children.length ? 1 : initialStep,
    totalSteps: 0,
    prevStep: -1,
    panels,
    panelActiveId: 0
  })
  const gotoStep = React.useCallback(
    (stepNumber: number, prevStepData?: SharedObject) => {
      if (state.activeStep === stepNumber) {
        return
      }
      if (props.onCompleteWizard && state.totalSteps > 0 && stepNumber > 1 && stepNumber === state.totalSteps + 1) {
        props.onCompleteWizard(prevStepData)
        return
      } else if (stepNumber > state.totalSteps || stepNumber < 1) {
        // Not a valid step stepNumber
        return
      }
      setState(prevState => ({ ...prevState, prevStep: prevState.activeStep, activeStep: stepNumber, prevStepData }))
    },
    [state.activeStep, state.totalSteps]
  )

  React.useEffect(() => {
    if (props.onStepChange && state.prevStep !== -1) {
      props.onStepChange({ prevStep: state.prevStep, nextStep: state.activeStep, prevStepData: state.prevStepData })
    }
  }, [state.prevStep, state.activeStep, state.prevStepData])

  const currentStep = React.useCallback(() => {
    return state.activeStep
  }, [state.activeStep])
  const totalSteps = React.useCallback(() => {
    return state.totalSteps
  }, [state.activeStep])
  const nextStep = React.useCallback(
    (prevStepData?: SharedObject) => {
      panels[state.activeStep - 1].status = Status.COMPLETED
      panels[state.activeStep].status = Status.INPROGRESS
      gotoStep(state.activeStep + 1, prevStepData)
      // const panelActiveId = state.activeStep ? state.panelActiveId + 1 : state.panelActiveId
      setState(prevState => ({ ...prevState, panels }))
    },
    [gotoStep]
  )
  const previousStep = React.useCallback(
    (prevStepData?: SharedObject) => {
      gotoStep(state.activeStep - 1, prevStepData)
    },
    [gotoStep]
  )
  const firstStep = React.useCallback(
    (prevStepData?: SharedObject) => {
      gotoStep(1, prevStepData)
    },
    [gotoStep]
  )
  const lastStep = React.useCallback(
    (prevStepData?: SharedObject) => {
      gotoStep(state.totalSteps, prevStepData)
    },
    [gotoStep]
  )

  React.useLayoutEffect(() => {
    const steps = React.Children.toArray(props.children)
    const stepNames: string[] = []

    setState(prevState => ({ ...prevState, stepNames, totalSteps: steps.length }))
  }, [children])

  const renderStep = () => (
    <React.Fragment>
      {state.stepNames &&
        state.stepNames.map((stepName, index) => {
          const activeStep = index + 1 === state.activeStep
          const completedSteps = state.activeStep > index + 1
          return (
            <div
              key={index}
              onClick={() => completedSteps && gotoStep(index + 1, state.prevStepData)}
              className={cx(
                css.navStep,
                navClassName,
                { [css.activeStep]: activeStep },
                { [css.completedStep]: completedSteps }
              )}
            >
              {completedSteps ? (
                <Icon name="small-tick" size={22} color="green500" style={{ marginRight: 'var(--spacing-xsmall)' }} />
              ) : (
                <span className={css.number}>{index + 1}</span>
              )}
              <Text className={css.stepName} lineClamp={2} width={240}>
                {stepName}
              </Text>
            </div>
          )
        })}
    </React.Fragment>
  )

  const activeChild = (React.Children.toArray(props.children)[state.activeStep - 1] as React.ReactElement) || <div />

  const childProps: StepProps<SharedObject> = {
    currentStep,
    totalSteps,
    prevStepData: state.prevStepData,
    nextStep: nextStep,
    previousStep,
    gotoStep,
    firstStep,
    lastStep
  }

  return (
    <div className={cx(css.main, className, { [css.navBar]: isNavMode })}>
      {isNavMode && (
        <div className={css.navBarList}>
          {icon ? (
            <span className={css.header}>
              <Icon name={icon} />
            </span>
          ) : null}
          {title ? (
            typeof title === 'string' ? (
              <span className={cx(css.title, css.header)}>{title}</span>
            ) : (
              title
            )
          ) : null}
          {renderStep()}
        </div>
      )}
      {!isNavMode && (
        <WizardHeader
          panels={panels}
          onClick={() => {
            // console.log(state.activeStep - 1, state.activeStep)
          }}
        />
      )}
      {state.activeStep && (
        <div className={cx(css.stepDetails, stepClassName)}> {React.cloneElement(activeChild, childProps)}</div>
      )}
    </div>
  )
}

export default WizardWithProgress
