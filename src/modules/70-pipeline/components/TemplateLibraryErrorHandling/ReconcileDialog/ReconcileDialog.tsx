/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonVariation, Container, Layout, Text, useToaster } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { Color } from '@wings-software/design-system'
import { clone, defaultTo, isEmpty, isEqual } from 'lodash-es'
import { useHistory, useParams } from 'react-router-dom'
import { PageSpinner } from '@harness/uicore'
import { parse } from 'yaml'
import {
  refreshAllPromise as refreshAllTemplatePromise,
  ErrorNodeSummary,
  TemplateResponse,
  updateExistingTemplateLabelPromise,
  createTemplatePromise
} from 'services/template-ng'
import { YamlDiffView } from '@pipeline/components/TemplateLibraryErrorHandling/YamlDiffView/YamlDiffView'
import { ErrorNode } from '@pipeline/components/TemplateLibraryErrorHandling/ErrorDirectory/ErrorNode'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { String, useStrings } from 'framework/strings'
import { refreshAllPromise as refreshAllPipelinePromise } from 'services/pipeline-ng'
import { getScopeBasedProjectPathParams, getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { GitQueryParams, ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useQueryParams } from '@common/hooks'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { getFirstLeafNode } from '@pipeline/components/TemplateLibraryErrorHandling/TemplateLibraryErrorHandlingUtils'
import { savePipeline } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { StoreMetadata, StoreType } from '@common/constants/GitSyncTypes'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { SaveToGitFormInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import routes from '@common/RouteDefinitions'
import css from './ReconcileDialog.module.scss'

export interface ReconcileDialogProps {
  templateInputsErrorNodeSummary: ErrorNodeSummary
  entity: 'Pipeline' | 'Template'
  setResolvedTemplateResponses: (resolvedTemplateInfos: TemplateResponse[]) => void
  reload: () => void
  originalEntityYaml: string
  storeMetadata?: StoreMetadata
}

export function ReconcileDialog({
  templateInputsErrorNodeSummary,
  entity,
  setResolvedTemplateResponses: setResolvedTemplates,
  reload,
  originalEntityYaml,
  storeMetadata
}: ReconcileDialogProps) {
  const hasChildren = !isEmpty(templateInputsErrorNodeSummary.childrenErrorNodes)
  const [selectedErrorNodeSummary, setSelectedErrorNodeSummary] = React.useState<ErrorNodeSummary>()
  const [resolvedTemplateResponses, setResolvedTemplateResponses] = React.useState<TemplateResponse[]>([])
  const params = useParams<ProjectPathProps & ModulePathParams>()
  const { accountId, orgIdentifier, projectIdentifier, module } = params
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()
  const [loading, setLoading] = React.useState<boolean>(false)
  const { showError } = useToaster()
  const { isGitSyncEnabled } = useAppStore()
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { OPA_PIPELINE_GOVERNANCE } = useFeatureFlags()
  const history = useHistory()

  const [canEditTemplate] = usePermission({
    resource: {
      resourceType: ResourceType.TEMPLATE
    },
    permissions: [PermissionIdentifier.EDIT_TEMPLATE]
  })

  const updateButtonEnabled = React.useMemo(() => {
    if (isGitSyncEnabled) {
      return false
    } else if (entity === 'Pipeline' && hasChildren) {
      return canEditTemplate
    } else {
      return true
    }
  }, [])

  React.useEffect(() => {
    setResolvedTemplates(resolvedTemplateResponses)
  }, [resolvedTemplateResponses])

  React.useEffect(() => {
    setSelectedErrorNodeSummary(getFirstLeafNode(templateInputsErrorNodeSummary))
  }, [])

  const navigateToPipelineStudio = (newPipelineId: string, updatedGitDetails?: SaveToGitFormInterface): void => {
    history.replace(
      routes.toPipelineStudio({
        projectIdentifier,
        orgIdentifier,
        pipelineIdentifier: newPipelineId,
        accountId,
        module,
        repoIdentifier: defaultTo(updatedGitDetails?.repoIdentifier, repoIdentifier),
        branch: updatedGitDetails?.branch
      })
    )
  }

  const navigateToTemplateStudio = (
    newTemplate: TemplateResponse,
    updatedGitDetails?: SaveToGitFormInterface
  ): void => {
    history.replace(
      routes.toTemplateStudio({
        projectIdentifier: newTemplate.projectIdentifier,
        orgIdentifier: newTemplate.orgIdentifier,
        accountId,
        ...(!isEmpty(newTemplate.projectIdentifier) && { module }),
        templateType: newTemplate.templateEntityType,
        templateIdentifier: newTemplate.identifier,
        versionLabel: newTemplate.versionLabel,
        repoIdentifier: updatedGitDetails?.repoIdentifier,
        branch: updatedGitDetails?.branch
      })
    )
  }

  const onUpdateAll = async (): Promise<void> => {
    setLoading(true)
    if (templateInputsErrorNodeSummary.templateResponse) {
      const scope = getScopeFromDTO(templateInputsErrorNodeSummary.templateResponse)
      try {
        const response = await refreshAllTemplatePromise({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, scope),
            templateIdentifier: defaultTo(templateInputsErrorNodeSummary.templateResponse.identifier, ''),
            versionLabel: defaultTo(templateInputsErrorNodeSummary.templateResponse.versionLabel, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          reload()
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'template.refresh.all.error')
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const response = await refreshAllPipelinePromise({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, Scope.PROJECT),
            identifier: defaultTo(templateInputsErrorNodeSummary?.nodeInfo?.identifier, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          reload()
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'pipeline.refresh.all.error')
      } finally {
        setLoading(false)
      }
    }
  }

  const updatePipeline = async (refreshedYaml: string, isEdit: boolean) => {
    try {
      const response = await savePipeline(
        {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          ...(storeMetadata?.storeType ? { storeType: storeMetadata?.storeType } : {}),
          ...(storeMetadata?.storeType === StoreType.REMOTE ? { connectorRef: storeMetadata?.connectorRef } : {})
        },
        parse(refreshedYaml).pipeline,
        isEdit,
        !!OPA_PIPELINE_GOVERNANCE
      )
      if (response && response.status === 'SUCCESS') {
        if (isEdit) {
          reload()
        } else {
          navigateToPipelineStudio(parse(refreshedYaml).pipeline.identifier)
        }
      } else {
        throw response
      }
    } catch (error) {
      showError(getRBACErrorMessage(error), undefined, 'pipeline.update.error')
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async (refreshedYaml: string) => {
    try {
      const response = await createTemplatePromise({
        body: refreshedYaml,
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          comments: 'Reconciling template'
        },
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      })
      if (response && response.status === 'SUCCESS') {
        if (response?.data?.templateResponseDTO) {
          navigateToTemplateStudio(response?.data?.templateResponseDTO)
        }
        //navigate to location
      } else {
        throw response
      }
    } catch (error) {
      showError(getRBACErrorMessage(error), undefined, 'template.update.error')
    } finally {
      setLoading(false)
    }
  }

  const updateTemplate = async (refreshedYaml: string) => {
    try {
      const response = await updateExistingTemplateLabelPromise({
        templateIdentifier: defaultTo(selectedErrorNodeSummary?.templateResponse?.identifier, ''),
        versionLabel: defaultTo(selectedErrorNodeSummary?.templateResponse?.versionLabel, ''),
        body: refreshedYaml,
        queryParams: {
          accountIdentifier: defaultTo(selectedErrorNodeSummary?.templateResponse?.accountId, ''),
          projectIdentifier: defaultTo(selectedErrorNodeSummary?.templateResponse?.projectIdentifier, ''),
          orgIdentifier: defaultTo(selectedErrorNodeSummary?.templateResponse?.orgIdentifier, ''),
          comments: 'Reconciling template'
        },
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      })
      if (response && response.status === 'SUCCESS') {
        if (isEqual(selectedErrorNodeSummary?.nodeInfo, templateInputsErrorNodeSummary.nodeInfo)) {
          reload()
        } else if (selectedErrorNodeSummary?.templateResponse) {
          setResolvedTemplateResponses([
            ...resolvedTemplateResponses,
            clone(selectedErrorNodeSummary?.templateResponse)
          ])
        }
      } else {
        throw response
      }
    } catch (error) {
      showError(getRBACErrorMessage(error), undefined, 'template.update.error')
    } finally {
      setLoading(false)
    }
  }

  const onUpdateNode = async (refreshedYaml: string): Promise<void> => {
    setLoading(true)
    if (selectedErrorNodeSummary?.nodeInfo) {
      if (selectedErrorNodeSummary?.templateResponse) {
        await updateTemplate(refreshedYaml)
      } else {
        await updatePipeline(refreshedYaml, true)
      }
    } else {
      if (entity === 'Template') {
        await saveTemplate(refreshedYaml)
      } else {
        await updatePipeline(refreshedYaml, false)
      }
    }
  }

  return (
    <Container className={css.mainContainer} height={'100%'}>
      {loading && <PageSpinner />}
      <Layout.Vertical height={'100%'}>
        <Container
          border={{ bottom: true }}
          padding={{ top: 'large', right: 'xxxlarge', bottom: 'large', left: 'xxxlarge' }}
        >
          <Text font={{ variation: FontVariation.H4 }}>{getString('pipeline.reconcileDialog.title')}</Text>
        </Container>
        <Container
          className={css.contentContainer}
          background={Color.FORM_BG}
          padding={{ top: 'large', right: 'xxxlarge', bottom: 'xxxlarge', left: 'xxxlarge' }}
        >
          <Layout.Horizontal spacing={'huge'} height={'100%'}>
            <Container width={376}>
              <Layout.Vertical spacing={'xlarge'}>
                <Container>
                  <Layout.Vertical spacing={'medium'}>
                    <Text font={{ variation: FontVariation.H5 }}>{getString('pipeline.reconcileDialog.subtitle')}</Text>
                    <Text font={{ variation: FontVariation.BODY }}>
                      <String
                        stringID={
                          hasChildren
                            ? 'pipeline.reconcileDialog.unsyncedTemplateInfo'
                            : 'pipeline.reconcileDialog.updatedTemplateInfo'
                        }
                        vars={{
                          name: `${entity}: ${templateInputsErrorNodeSummary.nodeInfo?.name}`
                        }}
                        useRichText={true}
                      />
                    </Text>
                  </Layout.Vertical>
                </Container>
                <Button
                  text={
                    hasChildren
                      ? getString('pipeline.reconcileDialog.updateAllLabel')
                      : getString('pipeline.reconcileDialog.updateEntityLabel', { entity })
                  }
                  variation={ButtonVariation.PRIMARY}
                  width={248}
                  disabled={!updateButtonEnabled}
                  onClick={onUpdateAll}
                />
                {hasChildren && (
                  <ErrorNode
                    templateInputsErrorNodeSummary={templateInputsErrorNodeSummary}
                    resolvedTemplateResponses={resolvedTemplateResponses}
                    selectedErrorNodeSummary={selectedErrorNodeSummary}
                    setSelectedErrorNodeSummary={setSelectedErrorNodeSummary}
                  />
                )}
              </Layout.Vertical>
            </Container>
            <Container style={{ flex: 1 }}>
              <YamlDiffView
                errorNodeSummary={selectedErrorNodeSummary}
                resolvedTemplateResponses={resolvedTemplateResponses}
                onUpdate={onUpdateNode}
                originalEntityYaml={originalEntityYaml}
              />
            </Container>
          </Layout.Horizontal>
        </Container>
      </Layout.Vertical>
    </Container>
  )
}
