/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import { FieldArray, FieldArrayRenderProps, FormikValues } from 'formik'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import {
  Layout,
  FormInput,
  MultiTypeInputType,
  ButtonVariation,
  Text,
  Button,
  Icon,
  ButtonSize
} from '@wings-software/uicore'

import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'
import { useStrings } from 'framework/strings'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'

import css from './ManifestWizardSteps/K8sValuesManifest/ManifestDetails.module.scss'

export interface DragnDropPathsProps {
  formik: FormikValues
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  allowOnlyOneFilePath?: boolean
  pathLabel: string
  fieldPath: string
  placeholder: string
}

const defaultValueToReset = [{ path: '', uuid: uuid('', nameSpace()) }]

function DragnDropPaths({
  formik,
  expressions,
  allowableTypes,
  pathLabel,
  fieldPath,
  placeholder,
  allowOnlyOneFilePath
}: DragnDropPathsProps): React.ReactElement {
  const { getString } = useStrings()
  const onDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.dataTransfer.setData('data', index.toString())
    event.currentTarget.classList.add(css.dragging)
  }, [])

  const onDragEnd = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove(css.dragging)
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove(css.dragOver)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    /* istanbul ignore else */
    if (event.preventDefault) {
      event.preventDefault()
    }
    event.currentTarget.classList.add(css.dragOver)
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>, arrayHelpers: FieldArrayRenderProps, droppedIndex: number) => {
      /* istanbul ignore else */
      if (event.preventDefault) {
        event.preventDefault()
      }
      const data = event.dataTransfer.getData('data')
      /* istanbul ignore else */
      if (data) {
        const index = parseInt(data, 10)
        arrayHelpers.swap(index, droppedIndex)
      }
      event.currentTarget.classList.remove(css.dragOver)
    },
    []
  )

  return (
    <DragDropContext
      onDragEnd={(result: DropResult) => {
        if (!result.destination) {
          return
        }
        const res = Array.from(formik.values[fieldPath])
        const [removed] = res.splice(result.source.index, 1)
        res.splice(result.destination.index, 0, removed)
        formik.setFieldValue(fieldPath, res)
      }}
    >
      <Droppable droppableId="droppable">
        {(provided, _snapshot) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            <MultiTypeFieldSelector
              defaultValueToReset={defaultValueToReset}
              allowedTypes={allowableTypes.filter(allowedType => allowedType !== MultiTypeInputType.EXPRESSION)}
              name={fieldPath}
              label={<Text>{pathLabel}</Text>}
            >
              <FieldArray
                name={fieldPath}
                render={arrayHelpers => (
                  <Layout.Vertical>
                    {formik.values?.[fieldPath]?.map((draggablepath: { path: string; uuid: string }, index: number) => (
                      <Draggable key={draggablepath.uuid} draggableId={draggablepath.uuid} index={index}>
                        {providedDrag => (
                          <Layout.Horizontal
                            key={draggablepath.uuid}
                            flex={{ distribution: 'space-between', alignItems: 'flex-start' }}
                            ref={providedDrag.innerRef}
                            {...providedDrag.draggableProps}
                            {...providedDrag.dragHandleProps}
                          >
                            <Layout.Horizontal
                              spacing="medium"
                              style={{ alignItems: 'baseline' }}
                              draggable={true}
                              onDragStart={event => {
                                onDragStart(event, index)
                              }}
                              onDragEnd={onDragEnd}
                              onDragOver={onDragOver}
                              onDragLeave={onDragLeave}
                              onDrop={event => onDrop(event, arrayHelpers, index)}
                            >
                              {!allowOnlyOneFilePath && (
                                <>
                                  <Icon name="drag-handle-vertical" className={css.drag} />
                                  <Text width={12}>{`${index + 1}.`}</Text>
                                </>
                              )}
                              <FormInput.MultiTextInput
                                label={''}
                                placeholder={placeholder}
                                name={`${fieldPath}[${index}].path`}
                                style={{ width: 275 }}
                                multiTextInputProps={{
                                  expressions,
                                  allowableTypes: allowableTypes.filter(
                                    allowedType => allowedType !== MultiTypeInputType.RUNTIME
                                  )
                                }}
                              />
                            </Layout.Horizontal>
                            {formik.values?.[fieldPath]?.length > 1 && (
                              <Button minimal icon="main-trash" onClick={() => arrayHelpers.remove(index)} />
                            )}
                          </Layout.Horizontal>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {allowOnlyOneFilePath && formik.values?.paths.length === 1 ? null : (
                      <span>
                        <Button
                          text={getString('addFileText')}
                          icon="plus"
                          size={ButtonSize.SMALL}
                          variation={ButtonVariation.LINK}
                          className={css.addFileButton}
                          onClick={() => arrayHelpers.push({ path: '', uuid: uuid('', nameSpace()) })}
                        />
                      </span>
                    )}
                  </Layout.Vertical>
                )}
              />
            </MultiTypeFieldSelector>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default DragnDropPaths
