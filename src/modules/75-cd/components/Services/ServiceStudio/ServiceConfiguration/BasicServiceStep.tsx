/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import { Card, Formik, FormikForm } from '@harness/uicore'
import { debounce, noop } from 'lodash-es'
import produce from 'immer'
import { NameIdDescriptionTags } from '@common/components'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import type { NGServiceV2InfoConfig } from 'services/cd-ng'
import { setNameIDDescription } from '../../utils/ServiceUtils'
import css from './ServiceConfiguration.module.scss'

function BasicServiceStep(): React.ReactElement {
  const {
    state: { pipeline },
    isReadonly,
    updatePipeline
  } = usePipelineContext()

  const getInitialValues = useCallback(() => {
    return {
      name: pipeline.name,
      identifier: pipeline.identifier,
      description: pipeline.description,
      tags: pipeline.tags
    }
  }, [pipeline.description, pipeline.identifier, pipeline.name, pipeline.tags])

  const onUpdate = (value: NGServiceV2InfoConfig): void => {
    const newPipelineData = produce({ ...pipeline }, draft => {
      setNameIDDescription(draft, value)
    })
    updatePipeline(newPipelineData)
  }
  const delayedOnUpdate = React.useRef(debounce(onUpdate || noop, 1000)).current

  return (
    <Formik
      enableReinitialize
      initialValues={getInitialValues()}
      validate={values => delayedOnUpdate(values)}
      formName="service-entity"
      onSubmit={noop}
    >
      {formikProps => (
        <FormikForm>
          <Card className={css.sectionCard}>
            <NameIdDescriptionTags
              className={css.nameIdDescriptionTags}
              formikProps={formikProps}
              identifierProps={{
                isIdentifierEditable: false,
                inputGroupProps: {
                  disabled: isReadonly
                }
              }}
              descriptionProps={{ disabled: isReadonly }}
              tagsProps={{ disabled: isReadonly }}
            />
          </Card>
        </FormikForm>
      )}
    </Formik>
  )
}

export default BasicServiceStep
