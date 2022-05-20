/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import * as Yup from 'yup'
import type { FormikProps } from 'formik'
import { defaultTo } from 'lodash-es'
import { parse } from 'yaml'

import {
  Button,
  ButtonVariation,
  Formik,
  Layout,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  Container,
  getErrorInfoFromErrorObject,
  ExpandingSearchInput
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import {
  createEnvironmentGroupPromise,
  EnvironmentGroupResponseDTO,
  EnvironmentResponse,
  useGetYamlSchema
} from 'services/cd-ng'

import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { NameIdDescriptionTags } from '@common/components'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { useToaster } from '@common/exports'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'

import { cleanData, EnvironmentGroupDetailsTab } from './utils'
import ModalEnvironmentList from './ModalEnvironmentList'

import css from './EnvironmentGroups.module.scss'

interface CreateEnvironmentGroupModalProps {
  closeModal: () => void
}

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `environmentGroup.yaml`,
  entityType: 'EnvironmentGroup',
  width: '100%',
  height: 250,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

export default function CreateEnvironmentGroupModal({ closeModal }: CreateEnvironmentGroupModalProps): JSX.Element {
  const { orgIdentifier, projectIdentifier, accountId, module } = useParams<ProjectPathProps & ModulePathParams>()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const formikRef = useRef<FormikProps<EnvironmentGroupResponseDTO>>()

  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [createLoading, setCreateLoading] = useState(false)
  const [isFetchingEnvironments, setIsFetchingEnvironments] = useState(true)

  const { getString } = useStrings()
  const history = useHistory()
  const { showSuccess, showError, clear } = useToaster()

  useEffect(() => {
    /* istanbul ignore next */ inputRef.current?.focus()
  }, [])

  const onSubmit = async (value: EnvironmentGroupResponseDTO) => {
    setCreateLoading(true)
    try {
      const values = cleanData(value)
      const valuesYaml = yamlStringify(
        JSON.parse(
          JSON.stringify({
            environmentGroup: { ...values }
          })
        )
      )
      const response = await createEnvironmentGroupPromise({
        body: {
          identifier: values.identifier,
          orgIdentifier: values.orgIdentifier,
          projectIdentifier: values.projectIdentifier,
          yaml: valuesYaml
        },
        queryParams: {
          accountIdentifier: accountId
        },
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      })

      // istanbul ignore else
      if (response.status === 'SUCCESS') {
        clear()
        showSuccess(getString('common.environmentGroup.created'))
        history.push(
          routes.toEnvironmentGroupDetails({
            orgIdentifier,
            projectIdentifier,
            accountId,
            module,
            environmentGroupIdentifier: defaultTo(/* istanbul ignore next */ response.data?.envGroup?.identifier, ''),
            sectionId: EnvironmentGroupDetailsTab.ENVIRONMENTS
          })
        )
      } else {
        throw response
      }
    } catch (e: any) {
      setCreateLoading(false)
      showError(getErrorInfoFromErrorObject(e, true))
    }
  }

  const handleModeSwitch = useCallback(
    /* istanbul ignore next */ (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '{}')
        const yamlVisual = parse(yaml).environmentGroup as EnvironmentGroupResponseDTO

        if (yamlVisual) {
          formikRef.current?.setValues({
            ...cleanData(yamlVisual)
          })
        }
      }

      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml]
  )

  const { data: environmentGroupSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'EnvironmentGroup',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })

  const onSelectedEnvironmentChange = (
    checked: boolean,
    selectedEnvironments: (string | EnvironmentResponse)[],
    item: EnvironmentResponse
  ) => {
    const identifier = /* istanbul ignore next */ item?.environment?.identifier
    if (checked && identifier) {
      /* istanbul ignore next */ formikRef.current?.setFieldValue('envIdentifiers', [
        ...defaultTo(selectedEnvironments, []),
        identifier
      ])
    } else {
      /* istanbul ignore next */ formikRef.current?.setFieldValue(
        'envIdentifiers',
        (selectedEnvironments as string[]).filter((_id: string) => _id !== identifier)
      )
    }
  }

  return (
    <>
      <Layout.Horizontal
        flex={{ justifyContent: 'flex-start' }}
        padding={{ top: 'medium', bottom: 'medium' }}
        width={'320px'}
      >
        <VisualYamlToggle
          selectedView={selectedView}
          onChange={nextMode => {
            handleModeSwitch(nextMode)
          }}
        />
      </Layout.Horizontal>
      <Formik<EnvironmentGroupResponseDTO>
        initialValues={
          {
            name: '',
            identifier: '',
            description: '',
            orgIdentifier,
            projectIdentifier,
            tags: {},
            envIdentifiers: []
          } as EnvironmentGroupResponseDTO
        }
        formName="createEnvGroup"
        onSubmit={values => {
          onSubmit(values)
        }}
        validationSchema={Yup.object().shape({
          name: NameSchema({ requiredErrorMsg: getString('fieldRequired', { field: 'Name' }) }),
          identifier: IdentifierSchema()
        })}
      >
        {formikProps => {
          formikRef.current = formikProps
          const selectedEnvironments = defaultTo(formikProps.values.envIdentifiers, [])

          return (
            <>
              {selectedView === SelectedView.VISUAL ? (
                <Layout.Horizontal padding={{ top: 'large', left: 'xsmall', right: 'xsmall' }} border={{ top: true }}>
                  <Layout.Vertical
                    width={'50%'}
                    padding={{ right: 'large' }}
                    border={{ right: true }}
                    flex={{ justifyContent: 'space-between', alignItems: 'stretch' }}
                  >
                    <NameIdDescriptionTags
                      formikProps={formikProps}
                      identifierProps={{
                        inputLabel: getString('name'),
                        inputGroupProps: {
                          inputGroup: {
                            inputRef: ref => (inputRef.current = ref)
                          }
                        }
                      }}
                    />

                    <Layout.Horizontal spacing="large">
                      <Button
                        variation={ButtonVariation.PRIMARY}
                        type={'submit'}
                        text={getString('submit')}
                        data-id="environment-group-save"
                        onClick={() => {
                          formikProps.submitForm()
                        }}
                        disabled={isFetchingEnvironments || createLoading}
                      />
                      <Button
                        variation={ButtonVariation.TERTIARY}
                        text={getString('cancel')}
                        onClick={closeModal}
                        disabled={createLoading}
                      />
                    </Layout.Horizontal>
                  </Layout.Vertical>
                  <Layout.Vertical padding={{ left: 'large' }} flex={{ alignItems: 'stretch' }} width={'50%'}>
                    <ExpandingSearchInput
                      alwaysExpanded
                      placeholder={'Search Environments'}
                      autoFocus={false}
                      width={'100%'}
                      onChange={setSearchTerm}
                      throttle={200}
                    />
                    <Layout.Vertical height={300} className={css.modalEnvironmentList}>
                      <ModalEnvironmentList
                        searchTerm={searchTerm}
                        setIsFetchingEnvironments={setIsFetchingEnvironments}
                        selectedEnvironments={selectedEnvironments}
                        onSelectedEnvironmentChange={onSelectedEnvironmentChange}
                      />
                    </Layout.Vertical>
                  </Layout.Vertical>
                </Layout.Horizontal>
              ) : (
                <Container>
                  <YAMLBuilder
                    {...yamlBuilderReadOnlyModeProps}
                    existingJSON={{
                      environmentGroup: {
                        ...formikProps.values
                      }
                    }}
                    schema={/* istanbul ignore next */ environmentGroupSchema?.data}
                    bind={setYamlHandler}
                    showSnippetSection={false}
                  />
                  <Layout.Horizontal padding={{ top: 'large' }}>
                    <Button
                      variation={ButtonVariation.PRIMARY}
                      type="submit"
                      text={getString('submit')}
                      onClick={
                        /* istanbul ignore next */ () => {
                          const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), '')
                          onSubmit(parse(latestYaml)?.environmentGroup)
                        }
                      }
                      disabled={createLoading}
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
