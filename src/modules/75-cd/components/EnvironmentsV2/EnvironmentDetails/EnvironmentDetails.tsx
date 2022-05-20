/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Expander } from '@blueprintjs/core'
import type { FormikProps } from 'formik'
import { parse } from 'yaml'
import cx from 'classnames'
import { defaultTo, isEqual } from 'lodash-es'
import * as Yup from 'yup'

import {
  Button,
  ButtonVariation,
  Container,
  Layout,
  Page,
  Tabs,
  Text,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  Formik,
  useToaster,
  getErrorInfoFromErrorObject,
  ThumbnailSelect,
  Card,
  Accordion,
  MultiTypeInputType
} from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import {
  EnvironmentResponse,
  EnvironmentResponseDTO,
  NGEnvironmentInfoConfig,
  updateEnvironmentV2Promise,
  useGetEnvironmentV2,
  useGetYamlSchema
} from 'services/cd-ng'

import type { EnvironmentPathProps, EnvironmentQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { NameIdDescriptionTags } from '@common/components'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { yamlParse, yamlStringify } from '@common/utils/YamlHelperMethods'

import { CustomVariablesEditableStage } from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariablesEditableStage'
import type { AllNGVariables } from '@pipeline/utils/types'

import { PageHeaderTitle, PageHeaderToolbar } from './EnvironmentDetailsPageHeader'
import { ServiceOverride } from './ServiceOverride/ServiceOverride'
import { EnvironmentDetailsTab } from '../utils'

import css from './EnvironmentDetails.module.scss'

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `environment.yaml`,
  entityType: 'Environment',
  width: '100%',
  height: 600,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

export default function EnvironmentDetails() {
  const { accountId, orgIdentifier, projectIdentifier, environmentIdentifier } = useParams<
    ProjectPathProps & EnvironmentPathProps
  >()
  const { sectionId } = useQueryParams<EnvironmentQueryParams>()
  const { updateQueryParams } = useUpdateQueryParams<EnvironmentQueryParams>()

  const { getString } = useStrings()
  const { showSuccess, showError, clear } = useToaster()

  const formikRef = useRef<FormikProps<NGEnvironmentInfoConfig>>()

  const [selectedTabId, setSelectedTabId] = useState<EnvironmentDetailsTab>(
    EnvironmentDetailsTab[EnvironmentDetailsTab[defaultTo(sectionId, 'CONFIGURATION')]]
  )
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [firstLoad, setFirstLoad] = useState(true)
  const [isModified, setIsModified] = useState(false)

  const { data, loading, error, refetch } = useGetEnvironmentV2({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    environmentIdentifier: defaultTo(environmentIdentifier, '')
  })

  useEffect(() => {
    // istanbul ignore else
    if (!loading && firstLoad) {
      setFirstLoad(false)
    }
  }, [loading])

  const { data: environmentSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'Environment',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })

  const handleModeSwitch = useCallback(
    /* istanbul ignore next */ (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '{}')
        const yamlVisual = parse(yaml).environment as NGEnvironmentInfoConfig
        if (yamlVisual) {
          formikRef.current?.setValues({
            ...yamlVisual
          })
        }
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml, data]
  )

  const onUpdate = async (values: EnvironmentResponseDTO) => {
    setUpdateLoading(true)
    clear()
    try {
      const bodyWithoutYaml = {
        name: values.name,
        description: values.description,
        identifier: values.identifier,
        orgIdentifier: values.orgIdentifier,
        projectIdentifier: values.projectIdentifier,
        tags: values.tags,
        type: defaultTo(values.type, 'Production')
      }
      const response = await updateEnvironmentV2Promise({
        body: { ...bodyWithoutYaml, yaml: yamlStringify({ environment: values }) },
        queryParams: {
          accountIdentifier: accountId
        },
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      })

      // istanbul ignore else
      if (response.status === 'SUCCESS') {
        showSuccess(getString('common.environmentUpdated'))
        refetch()
      } else {
        throw response
      }
    } catch (e: any) {
      showError(getErrorInfoFromErrorObject(e, true))
    }
    setUpdateLoading(false)
  }

  const {
    createdAt,
    environment: { name, identifier, description, tags, type, yaml } = {},
    lastModifiedAt
  } = defaultTo(data?.data, {}) as EnvironmentResponse

  const handleTabChange = (tabId: EnvironmentDetailsTab) => {
    updateQueryParams({
      sectionId: EnvironmentDetailsTab[EnvironmentDetailsTab[tabId]]
    })
    setSelectedTabId(tabId)
  }

  const validate = (values: EnvironmentResponseDTO) => {
    const { name: newName, description: newDescription, tags: newTags, type: newType } = values

    if (name === newName && description === newDescription && isEqual(tags, newTags) && type === newType) {
      setIsModified(false)
    } else {
      setIsModified(true)
    }
  }

  const typeList: { label: string; value: string }[] = [
    {
      label: getString('production'),
      value: 'Production'
    },
    {
      label: getString('cd.preProduction'),
      value: 'PreProduction'
    }
  ]

  const parsedYamlEnvironment = useMemo(() => (yamlParse(defaultTo(yaml, '{}')) as any)?.environment, [yaml])
  const variables = parsedYamlEnvironment?.variables
  const serviceOverrides = parsedYamlEnvironment?.serviceOverrides

  return (
    <>
      {firstLoad || error ? null : (
        <Page.Header
          className={cx({ [css.environmentDetailsHeader]: Boolean(description) })}
          size={'large'}
          title={<PageHeaderTitle {...data?.data?.environment} />}
          toolbar={<PageHeaderToolbar createdAt={createdAt} lastModifiedAt={lastModifiedAt} />}
        />
      )}
      <Page.Body error={/*istanbul ignore next */ error?.message} loading={loading || updateLoading}>
        {identifier && (
          <Formik<NGEnvironmentInfoConfig>
            initialValues={
              {
                name: defaultTo(name, ''),
                identifier: defaultTo(identifier, ''),
                description: defaultTo(description, ''),
                tags: defaultTo(tags, {}),
                type: defaultTo(type, ''),
                orgIdentifier: defaultTo(orgIdentifier, ''),
                projectIdentifier: defaultTo(projectIdentifier, ''),
                variables: variables,
                serviceOverrides: serviceOverrides
              } as NGEnvironmentInfoConfig
            }
            formName="editEnvironment"
            onSubmit={
              /* istanbul ignore next */ values => {
                onUpdate?.({
                  ...values
                })
              }
            }
            validationSchema={Yup.object().shape({
              name: NameSchema({ requiredErrorMsg: getString('fieldRequired', { field: 'Name' }) }),
              identifier: IdentifierSchema()
            })}
            validateOnChange
            validate={validate}
          >
            {formikProps => {
              formikRef.current = formikProps
              return (
                <Container className={css.environmentDetailsBody}>
                  <Tabs
                    id="environmentDetails"
                    onChange={handleTabChange}
                    selectedTabId={selectedTabId}
                    data-tabId={selectedTabId}
                    tabList={[
                      {
                        id: EnvironmentDetailsTab.CONFIGURATION,
                        title: (
                          <Text font={{ size: 'normal' }} color={Color.BLACK}>
                            {getString('configuration')}
                          </Text>
                        ),
                        panel: (
                          <Container padding={{ left: 'medium', right: 'medium' }}>
                            <TabSubHeader
                              selectedTabId={selectedTabId}
                              selectedView={selectedView}
                              handleModeSwitch={handleModeSwitch}
                            />
                            {selectedView === SelectedView.VISUAL ? (
                              <>
                                <Container
                                  width={'80%'}
                                  padding={'medium'}
                                  background={Color.WHITE}
                                  border={{ radius: 2 }}
                                  className={css.configCard}
                                  margin={{ bottom: 'large' }}
                                >
                                  <Container width={'40%'} padding={{ top: 'small' }}>
                                    <NameIdDescriptionTags
                                      formikProps={formikProps}
                                      identifierProps={{ isIdentifierEditable: false }}
                                    />
                                  </Container>
                                </Container>

                                <Text
                                  color={Color.GREY_700}
                                  margin={{ bottom: 'small', left: 'small' }}
                                  font={{ weight: 'bold' }}
                                >
                                  {getString('envType')}
                                </Text>
                                <Container
                                  width={'80%'}
                                  padding={'medium'}
                                  background={Color.WHITE}
                                  border={{ radius: 2 }}
                                  className={css.configCard}
                                >
                                  <Container width={'40%'}>
                                    <ThumbnailSelect className={css.thumbnailSelect} name={'type'} items={typeList} />
                                  </Container>
                                </Container>
                                {/* #region Advanced section */}
                                {data?.data && (
                                  <Accordion
                                    activeId={variables?.length > 0 || serviceOverrides?.length > 0 ? 'advanced' : ''}
                                    className={css.accordion}
                                  >
                                    <Accordion.Panel
                                      id="advanced"
                                      addDomId={true}
                                      summary={
                                        <Text
                                          color={Color.GREY_700}
                                          font={{ weight: 'bold' }}
                                          margin={{ left: 'small' }}
                                        >
                                          {getString('common.advanced')}
                                          {getString('titleOptional')}
                                        </Text>
                                      }
                                      details={
                                        <Layout.Vertical width={'80%'} spacing="medium" margin={{ bottom: 'small' }}>
                                          <Card className={css.sectionCard} id="variables">
                                            <Text
                                              color={Color.GREY_700}
                                              margin={{ bottom: 'small' }}
                                              font={{ weight: 'bold' }}
                                            >
                                              {getString('common.variables')}
                                            </Text>
                                            <CustomVariablesEditableStage
                                              formName="editEnvironment"
                                              initialValues={{
                                                variables: defaultTo(
                                                  formikProps.values.variables,
                                                  []
                                                ) as AllNGVariables[],
                                                canAddVariable: true
                                              }}
                                              allowableTypes={[
                                                MultiTypeInputType.FIXED,
                                                MultiTypeInputType.RUNTIME,
                                                MultiTypeInputType.EXPRESSION
                                              ]}
                                              readonly={false}
                                              onUpdate={values => {
                                                formikProps.setFieldValue('variables', values.variables)
                                              }}
                                            />
                                          </Card>

                                          <Card className={css.sectionCard} id="serviceOverrides">
                                            <ServiceOverride
                                              formName="editEnvironment"
                                              initialValues={{
                                                serviceOverrides: defaultTo(formikProps.values.serviceOverrides, []),
                                                canAddOverride: true
                                              }}
                                              allowableTypes={[
                                                MultiTypeInputType.FIXED,
                                                MultiTypeInputType.RUNTIME,
                                                MultiTypeInputType.EXPRESSION
                                              ]}
                                              readonly={false}
                                              onUpdate={values => {
                                                formikProps.setFieldValue('serviceOverrides', values.serviceOverrides)
                                              }}
                                            />
                                          </Card>
                                        </Layout.Vertical>
                                      }
                                    />
                                  </Accordion>
                                )}
                                {/* #endregion */}
                              </>
                            ) : (
                              <YAMLBuilder
                                {...yamlBuilderReadOnlyModeProps}
                                existingJSON={{
                                  environment: {
                                    ...formikProps.values
                                    // envIdentifiers: selectedEnvs.map(
                                    //   /* istanbul ignore next */ item => item.environment?.identifier
                                    // )
                                  }
                                }}
                                schema={environmentSchema?.data}
                                bind={setYamlHandler}
                                showSnippetSection={false}
                              />
                            )}
                          </Container>
                        )
                      }
                    ]}
                  >
                    <Expander />
                    {(selectedTabId === EnvironmentDetailsTab.CONFIGURATION || selectedView === SelectedView.YAML) && (
                      <Layout.Horizontal spacing="medium">
                        <Button
                          variation={ButtonVariation.PRIMARY}
                          type={'submit'}
                          text={getString('save')}
                          data-id="environment-edit"
                          onClick={
                            /* istanbul ignore next */ () => {
                              if (selectedView === SelectedView.YAML) {
                                const latestYaml = defaultTo(
                                  yamlHandler?.getLatestYaml(),
                                  /* istanbul ignore next */ ''
                                )
                                onUpdate(parse(latestYaml)?.environment)
                              } else {
                                formikProps.submitForm()
                              }
                            }
                          }
                          disabled={selectedView === SelectedView.VISUAL && !isModified}
                        />
                        <Button
                          variation={ButtonVariation.TERTIARY}
                          text={getString('cancel')}
                          onClick={
                            /* istanbul ignore next */ () => {
                              formikRef?.current?.setValues({
                                name: defaultTo(name, ''),
                                identifier: defaultTo(identifier, ''),
                                description: defaultTo(description, ''),
                                tags: defaultTo(tags, {}),
                                orgIdentifier: defaultTo(orgIdentifier, ''),
                                projectIdentifier: defaultTo(projectIdentifier, ''),
                                type: defaultTo(type, 'Production')
                              })
                            }
                          }
                          disabled={selectedView === SelectedView.VISUAL && !isModified}
                        />
                      </Layout.Horizontal>
                    )}
                  </Tabs>
                </Container>
              )
            }}
          </Formik>
        )}
      </Page.Body>
    </>
  )
}

function TabSubHeader({
  selectedTabId,
  selectedView,
  handleModeSwitch
}: {
  selectedTabId: EnvironmentDetailsTab
  selectedView: SelectedView
  handleModeSwitch: (nextMode: SelectedView) => void
}) {
  return (
    <Layout.Horizontal
      margin={{ bottom: 'small' }}
      padding={{
        right: 'medium',
        bottom: selectedTabId === EnvironmentDetailsTab.CONFIGURATION && 'small',
        top: selectedTabId === EnvironmentDetailsTab.CONFIGURATION && 'small'
      }}
      flex={{
        justifyContent: selectedTabId !== EnvironmentDetailsTab.CONFIGURATION ? 'flex-start' : 'center'
      }}
      width={'100%'}
    >
      <VisualYamlToggle
        selectedView={selectedView}
        onChange={nextMode => {
          handleModeSwitch(nextMode)
        }}
      />
    </Layout.Horizontal>
  )
}
