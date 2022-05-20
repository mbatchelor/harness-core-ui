/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Expander } from '@blueprintjs/core'
import type { FormikProps } from 'formik'
import { parse } from 'yaml'
import cx from 'classnames'
import { defaultTo, difference, isEqual } from 'lodash-es'
import * as Yup from 'yup'

import {
  Button,
  ButtonVariation,
  Container,
  Dialog,
  Layout,
  Page,
  Tabs,
  Text,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  useToaster,
  getErrorInfoFromErrorObject,
  Formik,
  ButtonSize
} from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import { useStrings } from 'framework/strings'
import {
  EnvironmentGroupResponse,
  EnvironmentGroupResponseDTO,
  EnvironmentResponse,
  updateEnvironmentGroupPromise,
  useGetEnvironmentGroup,
  useGetYamlSchema
} from 'services/cd-ng'

import type {
  EnvironmentGroupPathProps,
  EnvironmentGroupQueryParams,
  ProjectPathProps
} from '@common/interfaces/RouteInterfaces'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { NameIdDescriptionTags } from '@common/components'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { useDeepCompareEffect, useQueryParams, useUpdateQueryParams } from '@common/hooks'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'

import { EnvironmentList } from './EnvironmentList'
import EditEnvironmentGroupModal from './EditEnvironmentGroupModal'
import { PageHeaderTitle, PageHeaderToolbar } from './EnvironmentGroupDetailsPageHeader'
import { cleanData, EnvironmentGroupDetailsTab } from '../utils'

import css from './EnvironmentGroupDetails.module.scss'

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `environmentGroup.yaml`,
  entityType: 'EnvironmentGroup',
  width: '100%',
  height: 300,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

export default function EnvironmentGroupDetails() {
  const { accountId, orgIdentifier, projectIdentifier, environmentGroupIdentifier } = useParams<
    ProjectPathProps & EnvironmentGroupPathProps
  >()
  const { sectionId } = useQueryParams<EnvironmentGroupQueryParams>()
  const { updateQueryParams } = useUpdateQueryParams<EnvironmentGroupQueryParams>()

  const { getString } = useStrings()
  const { showSuccess, showError, clear } = useToaster()

  const formikRef = useRef<FormikProps<EnvironmentGroupResponseDTO>>()

  const [selectedTabId, setSelectedTabId] = useState<EnvironmentGroupDetailsTab>(
    EnvironmentGroupDetailsTab[EnvironmentGroupDetailsTab[defaultTo(sectionId, 'CONFIGURATION')]]
  )
  const [selectedEnvs, setSelectedEnvs] = useState<EnvironmentResponse[]>([])
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [firstLoad, setFirstLoad] = useState(true)
  const [isModified, setIsModified] = useState(false)

  const { data, loading, error, refetch } = useGetEnvironmentGroup({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    envGroupIdentifier: defaultTo(environmentGroupIdentifier, '')
  })

  useEffect(() => {
    // istanbul ignore else
    if (!loading && firstLoad) {
      setFirstLoad(false)
    }
  }, [loading])

  const { data: environmentGroupSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'EnvironmentGroup',
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
        const yamlVisual = parse(yaml).environmentGroup as EnvironmentGroupResponseDTO
        if (yamlVisual) {
          formikRef.current?.setValues({
            ...cleanData(yamlVisual)
          })
        }
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml, data]
  )

  const onUpdate = async (values: EnvironmentGroupResponseDTO) => {
    setUpdateLoading(true)
    clear()
    try {
      const valuesYaml = yamlStringify(
        JSON.parse(
          JSON.stringify({
            environmentGroup: { ...values }
          })
        )
      )

      const response = await updateEnvironmentGroupPromise({
        body: {
          identifier: values.identifier,
          orgIdentifier: values.orgIdentifier,
          projectIdentifier: values.projectIdentifier,
          yaml: valuesYaml
        },
        queryParams: {
          accountIdentifier: accountId
        },
        envGroupIdentifier: environmentGroupIdentifier,
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      })

      // istanbul ignore else
      if (response.status === 'SUCCESS') {
        showSuccess(getString('common.environmentGroup.updated'))
        refetch()
      } else {
        throw response
      }
    } catch (e: any) {
      showError(getErrorInfoFromErrorObject(e, true))
    }
    setUpdateLoading(false)
  }

  const onEnvironmentUpdate = (envsChanged: boolean, newEnvs?: EnvironmentResponse[]) => {
    // istanbul ignore else
    if (envsChanged) {
      onUpdate({
        ...formikRef?.current?.values,
        envIdentifiers: newEnvs?.map(env => defaultTo(env.environment?.identifier, ''))
      })
    }
    hideModal()
  }

  useDeepCompareEffect(() => {
    setSelectedEnvs(defaultTo(/* istanbul ignore next */ data?.data?.envGroup?.envResponse, []))
  }, [data?.data])

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideModal}
        title={getString('common.environmentGroup.edit')}
        isCloseButtonShown
        className={cx('padded-dialog', css.dialogStyles)}
      >
        <EditEnvironmentGroupModal selectedEnvs={selectedEnvs} onEnvironmentUpdate={onEnvironmentUpdate} />
      </Dialog>
    ),
    [selectedEnvs]
  )

  const {
    createdAt,
    envGroup: { name, identifier, description, tags, envIdentifiers } = {},
    envGroup,
    lastModifiedAt
  } = defaultTo(data?.data, {}) as EnvironmentGroupResponse

  const handleTabChange = (tabId: EnvironmentGroupDetailsTab) => {
    updateQueryParams({
      sectionId: EnvironmentGroupDetailsTab[EnvironmentGroupDetailsTab[tabId]]
    })
    setSelectedTabId(tabId)
  }

  const onDeleteEnvironments = (environmentsToRemove: EnvironmentResponse[]) => {
    // istanbul ignore else
    if (environmentsToRemove.length) {
      onUpdate({
        ...formikRef?.current?.values,
        envIdentifiers: difference(
          selectedEnvs.map(/* istanbul ignore next */ env => defaultTo(env?.environment?.identifier, '')),
          environmentsToRemove?.map(/* istanbul ignore next */ env => defaultTo(env?.environment?.identifier, ''))
        )
      })
    }
  }

  const validate = (values: EnvironmentGroupResponseDTO) => {
    const { name: newName, description: newDescription, tags: newTags } = values

    if (name === newName && description === newDescription && isEqual(tags, newTags)) {
      setIsModified(false)
    } else {
      setIsModified(true)
    }
  }

  return (
    <>
      {firstLoad || error ? null : (
        <Page.Header
          className={cx({ [css.environmentGroupDetailsHeader]: Boolean(description) })}
          size={'large'}
          title={<PageHeaderTitle {...envGroup} />}
          toolbar={<PageHeaderToolbar createdAt={createdAt} lastModifiedAt={lastModifiedAt} />}
        />
      )}
      <Page.Body error={/*istanbul ignore next */ error?.message} loading={loading || updateLoading}>
        {envGroup && (
          <Formik<EnvironmentGroupResponseDTO>
            initialValues={
              {
                name: defaultTo(name, ''),
                identifier: defaultTo(identifier, ''),
                description: defaultTo(description, ''),
                tags: defaultTo(tags, {}),
                orgIdentifier: defaultTo(orgIdentifier, ''),
                projectIdentifier: defaultTo(projectIdentifier, ''),
                envIdentifiers: defaultTo(envIdentifiers, [])
              } as EnvironmentGroupResponseDTO
            }
            formName="editEnvGroup"
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
                <Container className={css.environmentGroupDetailsBody}>
                  <Tabs
                    id="environmentGroupDetails"
                    onChange={handleTabChange}
                    selectedTabId={selectedTabId}
                    data-tabId={selectedTabId}
                    tabList={[
                      {
                        id: EnvironmentGroupDetailsTab.CONFIGURATION,
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
                              showModal={showModal}
                            />
                            {selectedView === SelectedView.VISUAL ? (
                              <Container
                                width={'80%'}
                                padding={'medium'}
                                background={Color.WHITE}
                                border={{ radius: 2 }}
                                className={css.configCard}
                              >
                                <Container width={'40%'} padding={{ top: 'small' }}>
                                  <NameIdDescriptionTags
                                    formikProps={formikProps}
                                    identifierProps={{ isIdentifierEditable: false }}
                                  />
                                </Container>
                              </Container>
                            ) : (
                              <YAMLBuilder
                                {...yamlBuilderReadOnlyModeProps}
                                existingJSON={{
                                  environmentGroup: {
                                    ...formikProps.values,
                                    envIdentifiers: selectedEnvs.map(
                                      /* istanbul ignore next */ item => item.environment?.identifier
                                    )
                                  }
                                }}
                                schema={environmentGroupSchema?.data}
                                bind={setYamlHandler}
                                showSnippetSection={false}
                              />
                            )}
                          </Container>
                        )
                      },
                      {
                        id: EnvironmentGroupDetailsTab.ENVIRONMENTS,
                        title: (
                          <Text font={{ size: 'normal' }} color={Color.BLACK}>
                            {getString('common.environmentList')}
                          </Text>
                        ),
                        panel: (
                          <Container padding={{ left: 'medium', right: 'medium' }}>
                            <TabSubHeader
                              selectedTabId={selectedTabId}
                              selectedView={selectedView}
                              handleModeSwitch={handleModeSwitch}
                              showModal={showModal}
                            />
                            {selectedView === SelectedView.VISUAL ? (
                              <EnvironmentList
                                list={selectedEnvs}
                                showModal={showModal}
                                onDeleteEnvironments={onDeleteEnvironments}
                              />
                            ) : (
                              <YAMLBuilder
                                {...yamlBuilderReadOnlyModeProps}
                                existingJSON={{
                                  environmentGroup: {
                                    ...formikProps.values,
                                    envIdentifiers: selectedEnvs.map(
                                      /* istanbul ignore next */ item => item.environment?.identifier
                                    )
                                  }
                                }}
                                schema={environmentGroupSchema?.data}
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
                    {(selectedTabId === EnvironmentGroupDetailsTab.CONFIGURATION ||
                      selectedView === SelectedView.YAML) && (
                      <Layout.Horizontal spacing="medium">
                        <Button
                          variation={ButtonVariation.PRIMARY}
                          type={'submit'}
                          text={getString('save')}
                          data-id="environment-group-edit"
                          onClick={
                            /* istanbul ignore next */ () => {
                              if (selectedView === SelectedView.YAML) {
                                const latestYaml = defaultTo(
                                  yamlHandler?.getLatestYaml(),
                                  /* istanbul ignore next */ ''
                                )
                                onUpdate(parse(latestYaml)?.environmentGroup)
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
                                envIdentifiers: defaultTo(envIdentifiers, [])
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
  showModal,
  selectedView,
  handleModeSwitch
}: {
  selectedTabId: EnvironmentGroupDetailsTab
  showModal: () => void
  selectedView: SelectedView
  handleModeSwitch: (nextMode: SelectedView) => void
}) {
  const { getString } = useStrings()

  return (
    <Layout.Horizontal
      margin={{ bottom: 'small' }}
      padding={{
        right: 'medium',
        bottom: selectedTabId === EnvironmentGroupDetailsTab.CONFIGURATION && 'small',
        top: selectedTabId === EnvironmentGroupDetailsTab.CONFIGURATION && 'small'
      }}
      flex={{
        justifyContent: selectedTabId === EnvironmentGroupDetailsTab.ENVIRONMENTS ? 'flex-start' : 'center'
      }}
      width={'100%'}
    >
      {selectedTabId === EnvironmentGroupDetailsTab.ENVIRONMENTS && (
        <Container width={'45.5%'}>
          <Button
            text={getString('environment')}
            font={{ weight: 'bold' }}
            icon="plus"
            onClick={showModal}
            minimal
            size={ButtonSize.SMALL}
          />
        </Container>
      )}
      <VisualYamlToggle
        selectedView={selectedView}
        onChange={nextMode => {
          handleModeSwitch(nextMode)
        }}
      />
    </Layout.Horizontal>
  )
}
