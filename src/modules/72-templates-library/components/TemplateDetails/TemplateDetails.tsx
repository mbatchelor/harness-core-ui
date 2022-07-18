/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import {
  ButtonSize,
  ButtonVariation,
  Container,
  Icon,
  Layout,
  PageError,
  SelectOption,
  Tab,
  Tabs,
  Text
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo, isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import { TemplateTags } from '@templates-library/components/TemplateTags/TemplateTags'
import { PageSpinner } from '@common/components'
import {
  getIconForTemplate,
  getTypeForTemplate,
  TemplateListType
} from '@templates-library/pages/TemplatesPage/TemplatesPageUtils'
import { useMutateAsGet } from '@common/hooks'
import { TemplateSummaryResponse, useGetTemplateList } from 'services/template-ng'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import GitPopover from '@pipeline/components/GitPopover/GitPopover'
import { TemplateYaml } from '@pipeline/components/PipelineStudio/TemplateYaml/TemplateYaml'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import templateDoesNotExistSvg from '@templates-library/pages/TemplatesPage/images/template-does-not-exist.svg'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getVersionLabelText } from '@templates-library/utils/templatesUtils'
import { TemplateInputs } from '@templates-library/components/TemplateInputs/TemplateInputs'
import EntitySetupUsage from '@common/pages/entityUsage/EntityUsage'
import { EntityType } from '@common/pages/entityUsage/EntityConstants'
import { VersionsDropDown } from '@templates-library/components/VersionsDropDown/VersionsDropDown'
import { TemplateActivityLog } from '../TemplateActivityLog/TemplateActivityLog'
import css from './TemplateDetails.module.scss'

export interface TemplateDetailsProps {
  template: TemplateSummaryResponse
  allowStableSelection?: boolean
  setTemplate?: (template: TemplateSummaryResponse) => void
}

export enum TemplateTabs {
  INPUTS = 'INPUTS',
  YAML = 'YAML',
  REFERENCEDBY = 'REFERENCEDBY'
}

export enum ParentTemplateTabs {
  BASIC = 'BASIC',
  ACTVITYLOG = 'ACTVITYLOG'
}

const DefaultStableVersionValue = '-1'

interface Params {
  selectedTemplate: TemplateSummaryResponse
  templates: TemplateSummaryResponse[]
}

const getTemplateEntityIdentifier = ({ selectedTemplate, templates }: Params) => {
  const versionLabel = selectedTemplate.versionLabel
    ? selectedTemplate.versionLabel
    : (templates.find(template => template.stableTemplate && template.versionLabel) as TemplateSummaryResponse)
        .versionLabel

  return `${selectedTemplate.identifier}/${versionLabel}/`
}

export const TemplateDetails: React.FC<TemplateDetailsProps> = props => {
  const { template, allowStableSelection = false, setTemplate } = props
  const { getString } = useStrings()
  const history = useHistory()
  const [versionOptions, setVersionOptions] = React.useState<SelectOption[]>([])
  const { isGitSyncEnabled } = useAppStore()
  const [templates, setTemplates] = React.useState<TemplateSummaryResponse[]>([])
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateSummaryResponse>()
  const [selectedParentTab, setSelectedParentTab] = React.useState<ParentTemplateTabs>(ParentTemplateTabs.BASIC)
  const [selectedTab, setSelectedTab] = React.useState<TemplateTabs>(TemplateTabs.INPUTS)
  const { module } = useParams<ProjectPathProps & ModulePathParams>()

  const {
    data: templateData,
    refetch: reloadTemplates,
    loading,
    error: templatesError
  } = useMutateAsGet(useGetTemplateList, {
    body: {
      filterType: 'Template',
      templateIdentifiers: [template.identifier]
    },
    queryParams: {
      accountIdentifier: template.accountId,
      orgIdentifier: template.orgIdentifier,
      projectIdentifier: template.projectIdentifier,
      templateListType: TemplateListType.All,
      module,
      repoIdentifier: template.gitDetails?.repoIdentifier,
      branch: template.gitDetails?.branch
    },
    queryParamStringifyOptions: { arrayFormat: 'comma' }
  })

  const onChange = React.useCallback(
    (option: SelectOption): void => {
      const version = defaultTo(option.value?.toString(), '')
      if (version === DefaultStableVersionValue) {
        setSelectedTemplate(templates.find(item => !item.versionLabel))
      } else {
        setSelectedTemplate(templates.find(item => item.versionLabel === version))
      }
    },
    [templates]
  )

  React.useEffect(() => {
    if (selectedTemplate) {
      setTemplate?.(selectedTemplate)
    }
  }, [selectedTemplate])

  React.useEffect(() => {
    const newVersionOptions: SelectOption[] = templates.map(item => {
      return {
        label: getVersionLabelText(item, getString),
        value: defaultTo(item.versionLabel, DefaultStableVersionValue)
      } as SelectOption
    })
    setVersionOptions(newVersionOptions)
    setSelectedTemplate(templates.find(item => item.versionLabel === template.versionLabel))
  }, [templates])

  React.useEffect(() => {
    if (templateData?.data?.content) {
      const allVersions = [...templateData.data.content]
      if (allowStableSelection) {
        const stableVersion = { ...allVersions.find(item => item.stableTemplate) }
        delete stableVersion.versionLabel
        allVersions.unshift(stableVersion)
      }
      setTemplates(allVersions)
    }
  }, [templateData])

  const goToTemplateStudio = () => {
    if (selectedTemplate) {
      history.push(
        routes.toTemplateStudio({
          projectIdentifier: selectedTemplate.projectIdentifier,
          orgIdentifier: selectedTemplate.orgIdentifier,
          accountId: defaultTo(selectedTemplate.accountId, ''),
          module,
          templateType: selectedTemplate.templateEntityType,
          templateIdentifier: selectedTemplate.identifier,
          versionLabel: selectedTemplate.versionLabel,
          repoIdentifier: selectedTemplate.gitDetails?.repoIdentifier,
          branch: selectedTemplate.gitDetails?.branch
        })
      )
    }
  }

  const stableVersion = React.useMemo(() => {
    return templates?.find(item => item.stableTemplate && !isEmpty(item.versionLabel))?.versionLabel
  }, [templates])

  const handleTabChange = React.useCallback((tab: TemplateTabs) => {
    setSelectedTab(tab)
  }, [])

  const handleParentTabChange = React.useCallback(
    (tab: ParentTemplateTabs) => {
      setSelectedParentTab(tab)
    },
    [setSelectedParentTab]
  )

  const showNoResultsView = useMemo(
    () => !loading && !templatesError && isEmpty(selectedTemplate),
    [loading, templatesError, selectedTemplate]
  )

  const templateIcon = React.useMemo(() => getIconForTemplate(getString, selectedTemplate), [selectedTemplate])
  const templateType = React.useMemo(() => getTypeForTemplate(getString, selectedTemplate), [selectedTemplate])

  return (
    <Container height={'100%'} className={css.container} data-template-id={template.identifier}>
      <Layout.Vertical flex={{ align: 'center-center' }} height={'100%'}>
        {loading && <PageSpinner />}
        {!loading && templatesError && (
          <PageError
            message={defaultTo((templatesError.data as Error)?.message, templatesError.message)}
            onClick={reloadTemplates}
          />
        )}
        {showNoResultsView && (
          <NoResultsView
            text={getString('templatesLibrary.templateHasBeenDeleted')}
            minimal={true}
            customImgSrc={templateDoesNotExistSvg}
          />
        )}
        {!templatesError && selectedTemplate && (
          <Container height={'100%'} width={'100%'}>
            <Layout.Vertical height={'100%'}>
              <Layout.Horizontal
                flex={{ alignItems: 'center' }}
                spacing={'huge'}
                padding={{ top: 'large', left: 'xxlarge', bottom: 'large', right: 'xxlarge' }}
                border={{ bottom: true }}
              >
                <Layout.Horizontal className={css.shrink} spacing={'small'}>
                  <Text lineClamp={2} font={{ size: 'medium', weight: 'bold' }} color={Color.GREY_800}>
                    {selectedTemplate.name}
                  </Text>
                  {isGitSyncEnabled && (
                    <GitPopover
                      data={defaultTo(selectedTemplate.gitDetails, {})}
                      iconProps={{ margin: { left: 'small', top: 'xsmall' } }}
                    />
                  )}
                </Layout.Horizontal>
                <RbacButton
                  text={getString('templatesLibrary.openInTemplateStudio')}
                  variation={ButtonVariation.SECONDARY}
                  size={ButtonSize.SMALL}
                  className={css.openInStudio}
                  onClick={goToTemplateStudio}
                  permission={{
                    permission: PermissionIdentifier.VIEW_TEMPLATE,
                    resource: {
                      resourceType: ResourceType.TEMPLATE
                    }
                  }}
                />
              </Layout.Horizontal>
              <Container background={Color.FORM_BG} className={css.tabsContainer}>
                <Tabs id="template-details-parent" selectedTabId={selectedParentTab} onChange={handleParentTabChange}>
                  <Tab
                    id={ParentTemplateTabs.BASIC}
                    title={getString('details')}
                    panel={
                      <Layout.Vertical height={'100%'}>
                        <Container>
                          <Layout.Vertical
                            className={css.topContainer}
                            spacing={'large'}
                            padding={{ top: 'xlarge', right: 'xxlarge', bottom: 'xlarge', left: 'xxlarge' }}
                          >
                            <Container>
                              <Layout.Vertical spacing={'small'}>
                                <Text font={{ weight: 'semi-bold' }} color={Color.BLACK}>
                                  {getString('typeLabel')}
                                </Text>
                                <Container>
                                  <Layout.Horizontal
                                    spacing={'small'}
                                    flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
                                  >
                                    {templateIcon && <Icon name={templateIcon} size={20} />}
                                    {templateType && <Text color={Color.GREY_900}>{templateType}</Text>}
                                  </Layout.Horizontal>
                                </Container>
                              </Layout.Vertical>
                            </Container>
                            <Container>
                              <Layout.Vertical spacing={'small'}>
                                <Text font={{ weight: 'semi-bold' }} color={Color.BLACK}>
                                  {getString('description')}
                                </Text>
                                <Text color={Color.GREY_900}>{defaultTo(selectedTemplate.description, '-')}</Text>
                              </Layout.Vertical>
                            </Container>
                            <Container>
                              <Layout.Vertical spacing={'small'}>
                                <Text font={{ weight: 'semi-bold' }} color={Color.BLACK}>
                                  {getString('tagsLabel')}
                                </Text>
                                {selectedTemplate.tags && !isEmpty(selectedTemplate.tags) ? (
                                  <Container>
                                    <TemplateTags tags={selectedTemplate.tags} />
                                  </Container>
                                ) : (
                                  <Text color={Color.GREY_900}>-</Text>
                                )}
                              </Layout.Vertical>
                            </Container>
                            <Container>
                              <Layout.Vertical spacing={'small'}>
                                <Text font={{ weight: 'semi-bold' }} color={Color.BLACK}>
                                  {getString('common.versionLabel')}
                                </Text>
                                <VersionsDropDown
                                  items={versionOptions}
                                  value={defaultTo(selectedTemplate.versionLabel, DefaultStableVersionValue)}
                                  onChange={onChange}
                                  width={300}
                                  popoverClassName={css.dropdown}
                                  stableVersion={stableVersion}
                                />
                              </Layout.Vertical>
                            </Container>
                          </Layout.Vertical>
                        </Container>
                        <Container className={css.innerTabsContainer}>
                          <Tabs id="template-details" selectedTabId={selectedTab} onChange={handleTabChange}>
                            <Tab
                              id={TemplateTabs.INPUTS}
                              title={getString('pipeline.templateInputs')}
                              panel={<TemplateInputs template={selectedTemplate} />}
                            />
                            <Tab
                              id={TemplateTabs.YAML}
                              title={getString('yaml')}
                              panel={<TemplateYaml templateYaml={defaultTo(selectedTemplate.yaml, '')} />}
                            />
                            <Tab
                              id={TemplateTabs.REFERENCEDBY}
                              title={getString('templatesLibrary.referencedBy')}
                              className={css.referencedByTab}
                              panel={
                                <EntitySetupUsage
                                  pageSize={4}
                                  pageHeaderClassName={css.referencedByHeader}
                                  pageBodyClassName={css.referencedByBody}
                                  entityType={EntityType.Template}
                                  entityIdentifier={getTemplateEntityIdentifier({ selectedTemplate, templates })}
                                />
                              }
                            />
                          </Tabs>
                        </Container>
                      </Layout.Vertical>
                    }
                  />
                  <Tab
                    id={ParentTemplateTabs.ACTVITYLOG}
                    title={getString('activityLog')}
                    panel={<TemplateActivityLog template={selectedTemplate} />}
                  />
                </Tabs>
              </Container>
            </Layout.Vertical>
          </Container>
        )}
      </Layout.Vertical>
    </Container>
  )
}
