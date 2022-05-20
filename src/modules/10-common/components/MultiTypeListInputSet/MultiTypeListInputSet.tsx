/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import cx from 'classnames'
import {
  MultiTextInput,
  Button,
  getMultiTypeFromValue,
  MultiTypeInputType,
  MultiTextInputProps,
  RUNTIME_INPUT_VALUE
} from '@wings-software/uicore'
import { Intent } from '@harness/design-system'
import { connect, FormikContextType } from 'formik'
import { get, isEmpty } from 'lodash-es'
import { ConfigureOptions, ConfigureOptionsProps } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useStrings } from 'framework/strings'
import MultiTypeFieldSelector, {
  MultiTypeFieldSelectorProps
} from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import type { ConnectorReferenceProps } from '../MultiTypeList/MultiTypeList'
import css from './MultiTypeListInputSet.module.scss'

export type ListType = string[] | { [key: string]: string }[]
export type MultiTypeListType = ListType | string

export type ListUIType = { id: string; value: string }[]
export type MultiTypeListUIType = ListUIType | string

interface MultiTypeListConfigureOptionsProps
  extends Omit<ConfigureOptionsProps, 'value' | 'type' | 'variableName' | 'onChange'> {
  variableName?: ConfigureOptionsProps['variableName']
}

export interface MultiTypeListProps {
  name: string
  placeholder?: string
  withObjectStructure?: boolean
  keyName?: string
  multiTypeFieldSelectorProps: Omit<MultiTypeFieldSelectorProps, 'name' | 'defaultValueToReset' | 'children'>
  multiTextInputProps?: Omit<MultiTextInputProps, 'name'>
  enableConfigureOptions?: boolean
  configureOptionsProps?: MultiTypeListConfigureOptionsProps
  formik?: FormikContextType<any>
  style?: React.CSSProperties
  disabled?: boolean
  restrictToSingleEntry?: boolean
}

const generateNewValue: () => { id: string; value: string } = () => ({
  id: uuid('', nameSpace()),
  value: ''
})

export const MultiTypeListInputSet = (props: MultiTypeListProps & ConnectorReferenceProps): React.ReactElement => {
  const {
    name,
    placeholder,
    withObjectStructure,
    keyName,
    multiTypeFieldSelectorProps,
    multiTextInputProps = {},
    enableConfigureOptions = true,
    configureOptionsProps,
    formik,
    disabled,
    restrictToSingleEntry,
    showConnectorRef,
    connectorTypes,
    connectorRefRenderer,
    ...restProps
  } = props

  const { getString } = useStrings()

  const getStageFormikValues = React.useCallback(() => {
    return get(formik?.values, name, '')
  }, [formik?.values, name])

  const [value, setValue] = React.useState<ListUIType>(() => {
    let initialValue = getStageFormikValues()
    if (initialValue === RUNTIME_INPUT_VALUE) {
      initialValue = []
    }
    const initialValueInCorrectFormat = (initialValue || []).map((item: string | { [key: string]: string }) => ({
      id: uuid('', nameSpace()),
      value: withObjectStructure && keyName ? ((item as { [key: string]: string })[keyName] as string) : item
    })) as ListUIType

    // Adding a default value
    if (Array.isArray(initialValueInCorrectFormat) && initialValueInCorrectFormat.length === 0) {
      initialValueInCorrectFormat.push(generateNewValue())
    }

    return initialValueInCorrectFormat
  })

  const error = get(formik?.errors, name, '')
  const touched = get(formik?.touched, name)
  const hasSubmitted = get(formik, 'submitCount', 0) > 0

  const addValue: () => void = () => {
    setValue(currentValue => currentValue.concat(generateNewValue()))
  }

  const removeValue: (id: string) => () => void = id => () => {
    setValue(currentValue => currentValue.filter(item => item.id !== id))
  }

  const changeValue: (id: string, newValue: string) => void = (id, newValue) => {
    formik?.setFieldTouched(name, true)
    setValue(currentValue =>
      currentValue.map(item => {
        if (item.id === id) {
          return {
            id,
            value: newValue
          }
        }
        return item
      })
    )
  }

  React.useEffect(() => {
    let initialValue = getStageFormikValues()
    if (initialValue === RUNTIME_INPUT_VALUE) {
      initialValue = []
    }
    const valueWithoutEmptyItems = value.filter(item => !!item.value)

    if (isEmpty(valueWithoutEmptyItems) && initialValue) {
      const initialValueInCorrectFormat = initialValue.map((item: string | { [key: string]: string }) => ({
        id: uuid('', nameSpace()),
        value:
          withObjectStructure && keyName
            ? (item as { [key: string]: string })[keyName]
            : typeof item === 'string'
            ? item
            : item?.value
      })) as ListUIType

      // Adding a default value
      if (Array.isArray(initialValueInCorrectFormat) && !initialValueInCorrectFormat.length) {
        initialValueInCorrectFormat.push(generateNewValue())
      }

      setValue(initialValueInCorrectFormat)
    }
  }, [formik?.values, name])

  React.useEffect(() => {
    let valueInCorrectFormat: ListType = []
    if (Array.isArray(value)) {
      valueInCorrectFormat = value
        .filter(item => !!item.value && typeof item.value === 'string')
        .map(item => {
          return withObjectStructure && keyName ? { [keyName]: item.value } : item.value
        }) as ListType
    }

    if (get(formik?.values, name, '') !== RUNTIME_INPUT_VALUE) {
      if (isEmpty(valueInCorrectFormat)) {
        formik?.setFieldValue(name, undefined)
      } else {
        formik?.setFieldValue(name, valueInCorrectFormat)
      }
    }
  }, [name, value, formik?.setFieldValue])

  return (
    <div className={cx(css.group, css.withoutSpacing)} {...restProps}>
      <MultiTypeFieldSelector
        name={name}
        defaultValueToReset={[{ id: uuid('', nameSpace()), value: '' }]}
        style={{ flexGrow: 1, marginBottom: 0 }}
        {...multiTypeFieldSelectorProps}
        disableTypeSelection={multiTypeFieldSelectorProps.disableTypeSelection || disabled}
      >
        <>
          {value.map(({ id, value: valueValue }, index: number) => {
            // const valueError = get(error, `[${index}].value`)

            return (
              <div className={css.group} key={id}>
                {showConnectorRef ? (
                  connectorRefRenderer?.({
                    name: `${name}.${index}`,
                    connectorTypes
                  })
                ) : (
                  <div style={{ flexGrow: 1 }}>
                    <MultiTextInput
                      name=""
                      textProps={{ name: `${name}[${index}].value` }}
                      value={valueValue}
                      placeholder={placeholder}
                      onChange={v => changeValue(id, v as any)}
                      data-testid={`value-${name}-[${index}]`}
                      intent={(touched || hasSubmitted) && error ? Intent.DANGER : Intent.NONE}
                      disabled={disabled}
                      allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
                      {...multiTextInputProps}
                    />
                  </div>
                )}
                {!disabled && (
                  <Button
                    icon="main-trash"
                    iconProps={{ size: 20 }}
                    minimal
                    onClick={removeValue(id)}
                    data-testid={`remove-${name}-[${index}]`}
                    style={{ padding: 0 }}
                  />
                )}
              </div>
            )
          })}

          {(restrictToSingleEntry && Array.isArray(value) && value?.length === 1) || disabled ? null : (
            <Button
              intent="primary"
              minimal
              text={getString('plusAdd')}
              data-testid={`add-${name}`}
              onClick={addValue}
            />
          )}
        </>
      </MultiTypeFieldSelector>
      {enableConfigureOptions &&
        typeof value === 'string' &&
        getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            style={{ marginBottom: 11 }}
            value={value}
            type={getString('list')}
            variableName={name}
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={val => formik?.setFieldValue(name, val)}
            {...configureOptionsProps}
            isReadonly={props.disabled}
          />
        )}
    </div>
  )
}

export default connect(MultiTypeListInputSet)
