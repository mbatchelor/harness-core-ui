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
  FormInput,
  Button,
  getMultiTypeFromValue,
  MultiTypeInputType,
  MultiTextInputProps
} from '@wings-software/uicore'
import { FieldArray, connect, FormikContextType } from 'formik'
import { get } from 'lodash-es'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { ConfigureOptions, ConfigureOptionsProps } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useStrings } from 'framework/strings'
import MultiTypeFieldSelector, {
  MultiTypeFieldSelectorProps
} from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import css from './MultiTypeList.module.scss'

export type ListValue = { id: string; value: string }[]
export type MultiTypeListType = ListValue | string

interface MultiTypeListConfigureOptionsProps
  extends Omit<ConfigureOptionsProps, 'value' | 'type' | 'variableName' | 'onChange'> {
  variableName?: ConfigureOptionsProps['variableName']
}

export interface ConnectorReferenceProps {
  showConnectorRef?: boolean
  connectorTypes?: ConnectorInfoDTO['type'] | ConnectorInfoDTO['type'][]
  connectorRefRenderer?: ({
    name,
    connectorTypes
  }: {
    name: string
    connectorTypes?: ConnectorReferenceProps['connectorTypes']
  }) => JSX.Element
}

export interface MultiTypeListProps {
  name: string
  placeholder?: string
  multiTypeFieldSelectorProps: Omit<MultiTypeFieldSelectorProps, 'name' | 'defaultValueToReset' | 'children'>
  multiTextInputProps?: Omit<MultiTextInputProps, 'name'>
  enableConfigureOptions?: boolean
  configureOptionsProps?: MultiTypeListConfigureOptionsProps
  formik?: FormikContextType<any>
  style?: React.CSSProperties
  disabled?: boolean
  restrictToSingleEntry?: boolean
}

export const MultiTypeList = (props: MultiTypeListProps & ConnectorReferenceProps): React.ReactElement => {
  const {
    name,
    placeholder,
    multiTypeFieldSelectorProps,
    multiTextInputProps = {},
    enableConfigureOptions = true,
    configureOptionsProps,
    formik,
    disabled,
    showConnectorRef,
    connectorTypes,
    connectorRefRenderer,
    restrictToSingleEntry,
    ...restProps
  } = props

  const { getString } = useStrings()

  const getDefaultResetValue = () => {
    return [{ id: uuid('', nameSpace()), value: '' }]
  }

  const value = get(formik?.values, name, getDefaultResetValue()) as MultiTypeListType

  return (
    <div className={cx(css.group, css.withoutSpacing)} {...restProps}>
      {typeof value === 'string' && getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME ? (
        <FormInput.MultiTextInput
          style={{ flexGrow: 1, marginBottom: 0 }}
          name={name}
          multiTextInputProps={{
            allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
          }}
          {...multiTypeFieldSelectorProps}
        />
      ) : (
        <MultiTypeFieldSelector
          name={name}
          defaultValueToReset={getDefaultResetValue()}
          style={{ flexGrow: 1, marginBottom: 0 }}
          {...multiTypeFieldSelectorProps}
          disableTypeSelection={multiTypeFieldSelectorProps.disableTypeSelection || disabled}
        >
          <FieldArray
            name={name}
            render={({ push, remove }) => (
              <>
                {Array.isArray(value) &&
                  value.map(({ id }, index: number) => (
                    <div className={cx(css.group, css.withoutAligning)} key={id}>
                      {showConnectorRef ? (
                        connectorRefRenderer?.({
                          name: `${name}[${index}].value`,
                          connectorTypes
                        })
                      ) : (
                        <FormInput.MultiTextInput
                          label=""
                          name={`${name}[${index}].value`}
                          placeholder={placeholder}
                          multiTextInputProps={{
                            allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION],
                            ...multiTextInputProps
                          }}
                          style={{ flexGrow: 1 }}
                          disabled={disabled}
                        />
                      )}
                      <Button
                        icon="main-trash"
                        iconProps={{ size: 20 }}
                        minimal
                        onClick={() => remove(index)}
                        data-testid={`remove-${name}-[${index}]`}
                        disabled={disabled}
                        className={cx({ [css.trashBtn]: showConnectorRef })}
                      />
                    </div>
                  ))}
                {restrictToSingleEntry && Array.isArray(value) && value?.length === 1 ? null : (
                  <Button
                    intent="primary"
                    minimal
                    text={getString('plusAdd')}
                    data-testid={`add-${name}`}
                    onClick={() => push({ id: uuid('', nameSpace()), value: '' })}
                    disabled={disabled}
                    style={{ padding: 0 }}
                  />
                )}
              </>
            )}
          />
        </MultiTypeFieldSelector>
      )}
      {enableConfigureOptions &&
        typeof value === 'string' &&
        getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            style={{ marginTop: 11 }}
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

export default connect(MultiTypeList)
