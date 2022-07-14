/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { CSSProperties, ReactChild } from 'react'
import {
  MultiTypeInputType,
  getMultiTypeFromValue,
  RUNTIME_INPUT_VALUE,
  FormError,
  FormikTooltipContext,
  DataTooltipInterface,
  HarnessDocTooltip,
  FormInput,
  EXECUTION_TIME_INPUT_VALUE,
  Container
} from '@harness/uicore'
import { IFormGroupProps, Intent, FormGroup } from '@blueprintjs/core'
import { FormikContextType, connect } from 'formik'
import { get } from 'lodash-es'
import { errorCheck } from '@common/utils/formikHelpers'
import MultiTypeSelectorButton from '@common/components/MultiTypeSelectorButton/MultiTypeSelectorButton'

import css from './MultiConfigSelectField.module.scss'

export interface MultiTypeFieldSelectorProps extends Omit<IFormGroupProps, 'label' | 'placeholder'> {
  children: Exclude<React.ReactNode, null | undefined>
  name: string
  label: string | ReactChild
  defaultValueToReset?: unknown
  style?: CSSProperties
  disableTypeSelection?: boolean
  skipRenderValueInExpressionLabel?: boolean
  expressionRender?(): React.ReactNode
  allowedTypes?: MultiTypeInputType[]
  useExecutionTimeInput?: boolean
  isOptional?: boolean
  optionalLabel?: string
  tooltipProps?: DataTooltipInterface
  disableMultiSelectBtn?: boolean
  onTypeChange?: (type: MultiTypeInputType) => void
  hideError?: boolean
  supportListOfExpressions?: boolean
  index?: number
  defaultType?: string
  value?: string
  localId?: string
  changed?: boolean
  values?: string | string[]
  isFieldInput?: boolean
}

export interface ConnectedMultiTypeFieldSelectorProps extends MultiTypeFieldSelectorProps {
  formik: FormikContextType<any>
}

export function MultiTypeConfigFileSelect(props: ConnectedMultiTypeFieldSelectorProps): React.ReactElement | null {
  const {
    formik,
    label,
    name,
    children,
    defaultValueToReset,
    disableTypeSelection,
    allowedTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME],
    expressionRender,
    skipRenderValueInExpressionLabel,
    isOptional,
    disableMultiSelectBtn,
    hideError,
    optionalLabel = '(optional)',
    onTypeChange,
    supportListOfExpressions,
    useExecutionTimeInput,
    defaultType,
    changed,
    localId,
    values,
    isFieldInput = false,
    ...restProps
  } = props
  const error = get(formik?.errors, name)
  const hasError = errorCheck(name, formik) && typeof error === 'string'
  const showError = hasError && !hideError
  const labelText = !isOptional ? label : `${label} ${optionalLabel}`
  const {
    intent = showError ? Intent.DANGER : Intent.NONE,
    helperText = showError ? <FormError name={name} errorMessage={get(formik?.errors, name)} /> : null,
    disabled,
    ...rest
  } = restProps

  const tooltipContext = React.useContext(FormikTooltipContext)
  const dataTooltipId =
    props.tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')

  const value: string = get(formik?.values, name, '')

  const [type, setType] = React.useState(
    value ? getMultiTypeFromValue(value, allowedTypes, supportListOfExpressions) : ('FIXED' as MultiTypeInputType)
  )

  React.useEffect(() => {
    setType(
      value ? getMultiTypeFromValue(value, allowedTypes, supportListOfExpressions) : ('FIXED' as MultiTypeInputType)
    )
  }, [setType])

  if (!allowedTypes.includes(type)) {
    setType(MultiTypeInputType.FIXED)
  }

  React.useEffect(() => {
    if (!value && type != MultiTypeInputType.EXPRESSION) {
      setType(MultiTypeInputType.FIXED)
    }
  }, [value])

  function handleChange(newType: MultiTypeInputType): void {
    setType(newType)
    onTypeChange?.(newType)

    if (newType === type) {
      return
    }

    const runtimeValue = useExecutionTimeInput ? EXECUTION_TIME_INPUT_VALUE : RUNTIME_INPUT_VALUE
    formik.setFieldValue(name, newType === MultiTypeInputType.RUNTIME ? runtimeValue : defaultValueToReset)
  }

  if (
    type === MultiTypeInputType.RUNTIME &&
    getMultiTypeFromValue(value, allowedTypes, supportListOfExpressions) !== MultiTypeInputType.RUNTIME
  ) {
    value
      ? setType(getMultiTypeFromValue(value, allowedTypes, supportListOfExpressions))
      : ('FIXED' as MultiTypeInputType)
  }

  return isFieldInput ? (
    <FormGroup
      {...rest}
      labelFor={name}
      helperText={helperText}
      intent={intent}
      disabled={disabled}
      label={
        <div className={css.formLabel}>
          <HarnessDocTooltip tooltipId={dataTooltipId} labelText={labelText} />
          {disableTypeSelection ? null : (
            <MultiTypeSelectorButton
              allowedTypes={allowedTypes}
              type={type}
              onChange={handleChange}
              disabled={disableMultiSelectBtn}
            />
          )}
        </div>
      }
    >
      {disableTypeSelection || type === MultiTypeInputType.FIXED ? (
        children
      ) : type === MultiTypeInputType.EXPRESSION && typeof expressionRender === 'function' ? (
        expressionRender()
      ) : type === MultiTypeInputType.RUNTIME && typeof value === 'string' ? (
        <FormInput.Text className={css.runtimeDisabled} name={name} disabled label="" />
      ) : null}
    </FormGroup>
  ) : (
    <FormGroup
      {...rest}
      className={type === MultiTypeInputType.RUNTIME ? css.formGroup : ''}
      labelFor={name}
      helperText={helperText}
      intent={intent}
      disabled={disabled}
      label={
        <Container flex>
          <HarnessDocTooltip tooltipId={dataTooltipId} labelText={labelText} />
        </Container>
      }
    >
      <Container flex className={css.selectFieldContainer}>
        {disableTypeSelection || type === MultiTypeInputType.FIXED ? (
          children
        ) : type === MultiTypeInputType.EXPRESSION && typeof expressionRender === 'function' ? (
          expressionRender()
        ) : type === MultiTypeInputType.RUNTIME && typeof value === 'string' ? (
          <FormInput.Text className={css.runtimeDisabled} name={name} disabled label="" />
        ) : null}
        {disableTypeSelection ? null : (
          <MultiTypeSelectorButton
            allowedTypes={allowedTypes}
            type={type}
            onChange={handleChange}
            disabled={disableMultiSelectBtn}
          />
        )}
      </Container>
    </FormGroup>
  )
}

export default connect<MultiTypeFieldSelectorProps>(MultiTypeConfigFileSelect)
