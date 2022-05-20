/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonVariation,
  Formik,
  FormikForm,
  Layout,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  getErrorInfoFromErrorObject,
  Container
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { defaultTo, omit } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { parse } from 'yaml'
import type { FormikProps } from 'formik'
import {
  ServiceRequestDTO,
  ServiceResponseDTO,
  useUpsertServiceV2,
  useCreateServicesV2,
  useGetYamlSchema
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { useToaster } from '@common/exports'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'

import { NameIdDescriptionTags, PageSpinner } from '@common/components'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { flexStart } from './DeployServiceUtils'
import type { NewEditServiceModalProps } from './DeployServiceInterface'
import css from './DeployServiceStep.module.scss'

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `service.yaml`,
  entityType: 'Service',
  width: '100%',
  height: 194,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

const cleanData = (values: ServiceRequestDTO): ServiceRequestDTO => {
  const newDescription = values.description?.toString().trim()
  const newId = values.identifier?.toString().trim()
  const newName = values.name?.toString().trim()
  return {
    name: newName,
    identifier: newId,
    orgIdentifier: values.orgIdentifier,
    projectIdentifier: values.projectIdentifier,
    description: newDescription,
    tags: values.tags
  }
}

export const NewEditServiceModal: React.FC<NewEditServiceModalProps> = ({
  isEdit,
  data,
  isService,
  onCreateOrUpdate,
  closeModal
}): JSX.Element => {
  const { getString } = useStrings()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    orgIdentifier: string
    projectIdentifier: string
    accountId: string
  }>()

  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const [selectedView, setSelectedView] = React.useState<SelectedView>(SelectedView.VISUAL)
  const { loading: createLoading, mutate: createService } = useCreateServicesV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const { loading: updateLoading, mutate: updateService } = useUpsertServiceV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])
  const { showSuccess, showError, clear } = useToaster()

  const onSubmit = React.useCallback(
    async (value: ServiceRequestDTO) => {
      try {
        const values = cleanData(value)
        if (!values.name) {
          showError(getString('fieldRequired', { field: 'Service' }))
        } else if (!values.identifier) {
          showError(getString('common.validation.fieldIsRequired', { name: 'Identifier' }))
        } else if (isEdit && id !== values.identifier) {
          showError(getString('cd.editIdError', { id: id }))
        } else if (isEdit && !isService) {
          const response = await updateService({
            ...omit(values, 'accountId', 'deleted'),
            orgIdentifier,
            projectIdentifier
          })
          if (response.status === 'SUCCESS') {
            clear()
            showSuccess(getString('cd.serviceUpdated'))
            onCreateOrUpdate(values)
          }
        } else {
          const response = await createService([{ ...values, orgIdentifier, projectIdentifier }])
          if (response.status === 'SUCCESS') {
            clear()
            showSuccess(getString('cd.serviceCreated'))
            onCreateOrUpdate(values)
          }
        }
      } catch (e) {
        showError(getErrorInfoFromErrorObject(e, true))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onCreateOrUpdate, orgIdentifier, projectIdentifier, isEdit, isService]
  )

  const formikRef = React.useRef<FormikProps<ServiceResponseDTO>>()
  const id = data.identifier
  const { data: serviceSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'Service',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })

  const handleModeSwitch = React.useCallback(
    (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '')
        const serviceSetYamlVisual = parse(yaml).service as ServiceResponseDTO
        if (serviceSetYamlVisual) {
          formikRef.current?.setValues({
            ...omit(cleanData(serviceSetYamlVisual) as ServiceResponseDTO)
          })
        }
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml, data]
  )
  if (createLoading || updateLoading) {
    return <PageSpinner />
  }

  return (
    <>
      <Container className={css.yamlToggle}>
        <Layout.Horizontal flex={{ justifyContent: flexStart }} padding={{ top: 'small' }}>
          <VisualYamlToggle
            selectedView={selectedView}
            onChange={nextMode => {
              handleModeSwitch(nextMode)
            }}
          />
        </Layout.Horizontal>
      </Container>
      <Formik<Required<ServiceResponseDTO>>
        initialValues={data as Required<ServiceResponseDTO>}
        formName="deployService"
        onSubmit={values => {
          onSubmit(values)
        }}
        validationSchema={Yup.object().shape({
          name: NameSchema({ requiredErrorMsg: getString?.('fieldRequired', { field: 'Service' }) }),
          identifier: IdentifierSchema()
        })}
      >
        {formikProps => {
          formikRef.current = formikProps as FormikProps<ServiceResponseDTO> | undefined
          return (
            <>
              {selectedView === SelectedView.VISUAL ? (
                <FormikForm>
                  <NameIdDescriptionTags
                    formikProps={formikProps}
                    identifierProps={{
                      inputLabel: getString('name'),
                      inputGroupProps: {
                        inputGroup: {
                          inputRef: ref => (inputRef.current = ref)
                        }
                      },
                      isIdentifierEditable: !isEdit
                    }}
                  />
                  <Layout.Horizontal spacing="small" padding={{ top: 'xlarge' }}>
                    <Button
                      variation={ButtonVariation.PRIMARY}
                      type={'submit'}
                      text={getString('save')}
                      data-id="service-save"
                    />
                    <Button variation={ButtonVariation.TERTIARY} text={getString('cancel')} onClick={closeModal} />
                  </Layout.Horizontal>
                </FormikForm>
              ) : (
                <Container className={css.editor}>
                  <YAMLBuilder
                    {...yamlBuilderReadOnlyModeProps}
                    existingJSON={{
                      service: {
                        ...omit(formikProps?.values),
                        description: defaultTo(formikProps.values.description, ''),
                        tags: defaultTo(formikProps.values.tags, {})
                      }
                    }}
                    bind={setYamlHandler}
                    schema={serviceSchema?.data}
                    showSnippetSection={false}
                  />
                  <Layout.Horizontal spacing={'small'} padding={{ top: 'large' }}>
                    <Button
                      variation={ButtonVariation.PRIMARY}
                      type="submit"
                      text={getString('save')}
                      onClick={() => {
                        const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), '')
                        const errorMsg = yamlHandler?.getYAMLValidationErrorMap()
                        if (errorMsg?.size) {
                          showError(errorMsg.entries().next().value[1])
                        } else {
                          onSubmit(parse(latestYaml)?.service)
                        }
                      }}
                    />
                    <Button variation={ButtonVariation.TERTIARY} onClick={closeModal} text={getString('cancel')} />
                  </Layout.Horizontal>
                </Container>
              )}
            </>
          )
        }}
      </Formik>
    </>
  )
}
