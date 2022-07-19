/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import {
  Text,
  Button,
  getMultiTypeFromValue,
  MultiTypeInputType,
  MultiTextInputProps,
  ExpressionInput,
  EXPRESSION_INPUT_PLACEHOLDER,
  Layout,
  Icon
} from '@harness/uicore'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'

import { FieldArray, connect, FormikContextType } from 'formik'
import { get } from 'lodash-es'
import { useStrings } from 'framework/strings'

import { ConfigureOptions, ConfigureOptionsProps } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { MultiTypeFieldSelectorProps } from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { errorCheck } from '@common/utils/formikHelpers'

import { FILE_TYPE_VALUES } from '@pipeline/components/ConfigFilesSelection/ConfigFilesHelper'
import FileStoreSelectField from '@filestore/components/MultiTypeFileSelect/FileStoreSelect/FileStoreSelectField'
import FileSelectField from '@filestore/components/MultiTypeFileSelect/EncryptedSelect/EncryptedFileSelectField'
import MultiTypeConfigFileSelect from './MultiTypeConfigFileSelect'
import css from './MultiConfigSelectField.module.scss'

export type MapValue = { id: string; key: string; value: string }[]
export type MultiTypeMapValue = MapValue | string

interface MultiTypeMapConfigureOptionsProps
  extends Omit<ConfigureOptionsProps, 'value' | 'type' | 'variableName' | 'onChange'> {
  variableName?: ConfigureOptionsProps['variableName']
}

export interface MultiTypeMapProps {
  name: string
  multiTypeFieldSelectorProps: Omit<MultiTypeFieldSelectorProps, 'name' | 'defaultValueToReset' | 'children'>
  valueMultiTextInputProps?: Omit<MultiTextInputProps, 'name'>
  enableConfigureOptions?: boolean
  configureOptionsProps?: MultiTypeMapConfigureOptionsProps
  formik?: FormikContextType<any>
  style?: React.CSSProperties
  cardStyle?: React.CSSProperties
  disabled?: boolean
  appearance?: 'default' | 'minimal'
  keyLabel?: string
  valueLabel?: string
  restrictToSingleEntry?: boolean
  fileType: string
  expressions: string[]
  values: string | string[]
}

export function MultiConfigSelectField(props: MultiTypeMapProps): React.ReactElement {
  const {
    name,
    multiTypeFieldSelectorProps,
    enableConfigureOptions = true,
    configureOptionsProps,
    cardStyle,
    formik,
    disabled,
    appearance = 'default',
    keyLabel,
    valueLabel,
    restrictToSingleEntry,
    fileType,
    expressions,
    values,
    ...restProps
  } = props

  const getDefaultResetValue = () => {
    return ['']
  }

  const [changed, setChanged] = React.useState(false)

  const value = get(formik?.values, name, getDefaultResetValue()) as MultiTypeMapValue

  const isRunTime = React.useMemo(() => {
    return getMultiTypeFromValue(get(formik?.values, name, getDefaultResetValue())) === MultiTypeInputType.RUNTIME
  }, [value])

  const { getString } = useStrings()

  return (
    <DragDropContext
      onDragEnd={(result: DropResult) => {
        if (!result.destination) {
          return
        }
        const res = Array.from(value as [])
        const [removed] = res.splice(result.source.index, 1)
        res.splice(result.destination.index, 0, removed)
        formik?.setFieldValue(name, [...res])
        setChanged(!changed)
      }}
    >
      <Droppable droppableId="droppableSelect">
        {(provided, _snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cx(css.group, appearance === 'minimal' ? css.minimalCard : '')}
            {...restProps}
          >
            <MultiTypeConfigFileSelect
              isFieldInput={true}
              name={name}
              defaultValueToReset={getDefaultResetValue()}
              style={{ flexGrow: 1, marginBottom: 0 }}
              allowedTypes={[MultiTypeInputType.RUNTIME, MultiTypeInputType.FIXED]}
              {...multiTypeFieldSelectorProps}
              disableTypeSelection={multiTypeFieldSelectorProps.disableTypeSelection || disabled}
              hasParentValidation={true}
              onTypeChange={e => {
                if (e !== MultiTypeInputType.RUNTIME) {
                  formik?.setFieldValue(name, [''])
                }
              }}
            >
              <FieldArray
                name={name}
                render={({ push, remove, replace }) => {
                  return (
                    <>
                      <div className={css.listFieldsWrapper}>
                        {Array.isArray(values) &&
                          values.map((field: any, index: number) => {
                            const { ...restValue } = field
                            const error = get(formik?.errors, `${name}[${index}]`)
                            const hasError = errorCheck(`${name}[${index}]`, formik) && typeof error === 'string'
                            return (
                              <Draggable key={index} draggableId={`${index}`} index={index}>
                                {providedDrag => (
                                  <Layout.Horizontal
                                    flex={{ distribution: 'space-between', alignItems: 'center' }}
                                    margin={{ top: 'small', bottom: hasError && 'medium' }}
                                    key={index}
                                    ref={providedDrag.innerRef}
                                    {...providedDrag.draggableProps}
                                    {...providedDrag.dragHandleProps}
                                  >
                                    <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
                                      <>
                                        <Icon name="drag-handle-vertical" />
                                        <Text className={css.text}>{`${index + 1}.`}</Text>
                                      </>

                                      <div className={css.multiSelectField}>
                                        <div className={cx(css.group)}>
                                          {fileType === FILE_TYPE_VALUES.ENCRYPTED ? (
                                            <MultiTypeConfigFileSelect
                                              hasParentValidation={true}
                                              name={`${name}[${index}]`}
                                              label={''}
                                              defaultValueToReset={''}
                                              style={{ flexGrow: 1, marginBottom: 0, marginTop: 0 }}
                                              disableTypeSelection={false}
                                              changed={changed}
                                              supportListOfExpressions={true}
                                              defaultType={getMultiTypeFromValue(
                                                get(formik?.values, `${name}[${index}]`),
                                                [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION],
                                                true
                                              )}
                                              allowedTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
                                              expressionRender={() => {
                                                return (
                                                  <ExpressionInput
                                                    name={`${name}[${index}]`}
                                                    value={get(formik?.values, `${name}[${index}]`)}
                                                    disabled={false}
                                                    inputProps={{ placeholder: EXPRESSION_INPUT_PLACEHOLDER }}
                                                    items={expressions}
                                                    onChange={val =>
                                                      /* istanbul ignore next */
                                                      formik?.setFieldValue(`${name}[${index}]`, val)
                                                    }
                                                  />
                                                )
                                              }}
                                            >
                                              <div className={css.fieldWrapper}>
                                                <FileSelectField
                                                  value={get(formik?.values, `${name}[${index}]`)}
                                                  name={`${name}[${index}]`}
                                                  onChange={(newValue, i) => {
                                                    replace(i as number, {
                                                      ...restValue,
                                                      value: newValue
                                                    })
                                                    formik?.setFieldValue(`${name}[${index}]`, newValue)
                                                  }}
                                                />
                                              </div>
                                            </MultiTypeConfigFileSelect>
                                          ) : (
                                            <MultiTypeConfigFileSelect
                                              name={`${name}[${index}]`}
                                              label={''}
                                              defaultValueToReset={''}
                                              style={{ flexGrow: 1, marginBottom: 0, marginTop: 0 }}
                                              disableTypeSelection={false}
                                              changed={changed}
                                              supportListOfExpressions={true}
                                              defaultType={getMultiTypeFromValue(
                                                get(formik?.values, `${name}[${index}]`),
                                                [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION],
                                                true
                                              )}
                                              allowedTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]}
                                              expressionRender={() => {
                                                return (
                                                  <ExpressionInput
                                                    name={`${name}[${index}]`}
                                                    value={get(formik?.values, `${name}[${index}]`)}
                                                    disabled={false}
                                                    inputProps={{ placeholder: EXPRESSION_INPUT_PLACEHOLDER }}
                                                    items={expressions}
                                                    onChange={val =>
                                                      /* istanbul ignore next */
                                                      formik?.setFieldValue(`${name}[${index}]`, val)
                                                    }
                                                  />
                                                )
                                              }}
                                            >
                                              <div className={css.fieldWrapper}>
                                                <FileStoreSelectField
                                                  name={`${name}[${index}]`}
                                                  fileUsage="MANIFEST"
                                                  onChange={(newValue, i) => {
                                                    replace(i, {
                                                      ...restValue,
                                                      value: newValue
                                                    })
                                                    formik?.setFieldValue(`${name}[${index}]`, newValue)
                                                  }}
                                                />
                                              </div>
                                            </MultiTypeConfigFileSelect>
                                          )}
                                          <Button
                                            icon="main-trash"
                                            iconProps={{ size: 20 }}
                                            minimal
                                            data-testid={`remove-${name}-[${index}]`}
                                            onClick={() => remove(index)}
                                            disabled={disabled || values.length <= 1}
                                          />
                                        </div>
                                      </div>
                                    </Layout.Horizontal>
                                  </Layout.Horizontal>
                                )}
                              </Draggable>
                            )
                          })}
                      </div>
                      {restrictToSingleEntry && Array.isArray(value) && value?.length === 1 ? null : (
                        <Button
                          intent="primary"
                          minimal
                          text={getString('plusAdd')}
                          data-testid={`add-${name}`}
                          onClick={() => {
                            push('')
                          }}
                          disabled={disabled || isRunTime}
                          style={{ padding: 0, marginTop: 24 }}
                        />
                      )}
                    </>
                  )
                }}
              />
            </MultiTypeConfigFileSelect>
            {provided.placeholder}
            {enableConfigureOptions &&
              typeof value === 'string' &&
              getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME && (
                <ConfigureOptions
                  style={{ marginTop: 11 }}
                  value={value}
                  type={getString('map')}
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
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default connect(MultiConfigSelectField)
