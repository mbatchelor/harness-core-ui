/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo, useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import {
  Layout,
  SelectOption,
  ExpandingSearchInput,
  Container,
  GridListToggle,
  Views,
  ButtonVariation,
  DropDown,
  Page,
  ButtonSize
} from '@wings-software/uicore'

import { useQueryParams } from '@common/hooks'
import { useGetOrganizationList, useGetProjectAggregateDTOList } from 'services/cd-ng'
import type { Project } from 'services/cd-ng'
import { useProjectModal } from '@projects-orgs/modals/ProjectModal/useProjectModal'
import { useCollaboratorModal } from '@projects-orgs/modals/ProjectModal/useCollaboratorModal'
import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import { useToaster } from '@common/components'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { AccountPathProps, OrgPathProps } from '@common/interfaces/RouteInterfaces'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import RbacButton from '@rbac/components/Button/Button'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import ProjectsListView from './views/ProjectListView/ProjectListView'
import ProjectsGridView from './views/ProjectGridView/ProjectGridView'
import ProjectsEmptyState from './projects-empty-state.png'
import css from './ProjectsPage.module.scss'

enum OrgFilter {
  ALL = '$$ALL$$'
}

const ProjectsListPage: React.FC = () => {
  const { accountId } = useParams<AccountPathProps>()
  const { orgIdentifier } = useQueryParams<OrgPathProps>()
  const { verify } = useQueryParams<{ verify?: boolean }>()
  const { getString } = useStrings()
  useDocumentTitle(getString('projectsText'))

  const { preference: savedProjectView, setPreference: setSavedProjectView } = usePreferenceStore<Views | undefined>(
    PreferenceScope.MACHINE,
    'projectsViewType'
  )
  const initialSelectedView = savedProjectView || Views.GRID
  const [view, setView] = useState(initialSelectedView)
  const [searchParam, setSearchParam] = useState<string>()
  const [page, setPage] = useState(0)
  const history = useHistory()
  const allOrgsSelectOption: SelectOption = useMemo(
    () => ({
      label: getString('all'),
      value: OrgFilter.ALL
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const { data: orgsData } = useGetOrganizationList({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const { showSuccess } = useToaster()

  useEffect(
    () => {
      if (verify) {
        showSuccess(getString('common.banners.trial.success'))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verify]
  )

  const organizations: SelectOption[] = useMemo(() => {
    return [
      allOrgsSelectOption,
      ...(orgsData?.data?.content?.map(org => {
        return {
          label: org.organization.name,
          value: org.organization.identifier
        }
      }) || [])
    ]
  }, [orgsData?.data?.content, orgIdentifier, allOrgsSelectOption])

  React.useEffect(() => {
    setPage(0)
  }, [searchParam, orgIdentifier])

  const { data, loading, refetch, error } = useGetProjectAggregateDTOList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      searchTerm: searchParam,
      pageIndex: page,
      pageSize: 100
    },
    debounce: 300
  })
  const projectCreateSuccessHandler = (): void => {
    refetch()
  }

  const { openProjectModal, closeProjectModal } = useProjectModal({
    onSuccess: projectCreateSuccessHandler,
    onWizardComplete: () => {
      closeProjectModal()
      projectCreateSuccessHandler()
    }
  })

  const showEditProject = (project: Project): void => {
    openProjectModal(project)
  }

  const { openCollaboratorModal } = useCollaboratorModal()

  const showCollaborators = (project: Project): void => {
    openCollaboratorModal({ projectIdentifier: project.identifier, orgIdentifier: project.orgIdentifier || 'default' })
  }

  const setProjectView = (viewType: Views): void => {
    setView(viewType)
    setSavedProjectView(viewType)
  }

  return (
    <Container className={css.projectsPage} height="inherit">
      <Page.Header breadcrumbs={<NGBreadcrumbs />} title={getString('projectsText')} />
      {data?.data?.totalItems || searchParam || loading || error || orgIdentifier ? (
        <Layout.Horizontal spacing="large" className={css.header}>
          <RbacButton
            featuresProps={{
              featuresRequest: {
                featureNames: [FeatureIdentifier.MULTIPLE_PROJECTS]
              }
            }}
            variation={ButtonVariation.PRIMARY}
            text={getString('projectsOrgs.newProject')}
            icon="plus"
            onClick={() => openProjectModal()}
          />
          <DropDown
            disabled={loading}
            filterable={false}
            className={css.orgDropdown}
            items={organizations}
            value={orgIdentifier || OrgFilter.ALL}
            onChange={item => {
              history.push({
                pathname: routes.toProjects({ accountId }),
                search: item.value !== OrgFilter.ALL ? `?orgIdentifier=${item.value.toString()}` : undefined
              })
            }}
            getCustomLabel={item => getString('projectsOrgs.tabOrgs', { name: item.label })}
          />
          <div style={{ flex: 1 }}></div>
          <ExpandingSearchInput
            alwaysExpanded
            onChange={text => {
              setSearchParam(text.trim())
            }}
            width={300}
            className={css.expandSearch}
          />
          <GridListToggle initialSelectedView={initialSelectedView} onViewToggle={setProjectView} />
        </Layout.Horizontal>
      ) : null}
      <Page.Body
        loading={loading}
        retryOnError={() => refetch()}
        error={(error?.data as Error)?.message || error?.message}
        noData={
          !searchParam && openProjectModal
            ? {
                when: () => !data?.data?.content?.length,
                image: ProjectsEmptyState,
                imageClassName: css.imageClassName,
                messageTitle: getString('projectsOrgs.youHaveNoProjects'),
                message: getString('projectDescription'),
                button: (
                  <RbacButton
                    featuresProps={{
                      featuresRequest: {
                        featureNames: [FeatureIdentifier.MULTIPLE_PROJECTS]
                      }
                    }}
                    size={ButtonSize.LARGE}
                    variation={ButtonVariation.PRIMARY}
                    text={getString('projectsOrgs.createAProject')}
                    onClick={() => openProjectModal?.()}
                  />
                )
              }
            : {
                when: () => !data?.data?.content?.length,
                image: ProjectsEmptyState,
                imageClassName: css.imageClassName,
                messageTitle: getString('noProjects')
              }
        }
      >
        {view === Views.GRID ? (
          <ProjectsGridView
            data={data}
            showEditProject={showEditProject}
            collaborators={showCollaborators}
            reloadPage={refetch}
            gotoPage={(pageNumber: number) => setPage(pageNumber)}
          />
        ) : null}
        {view === Views.LIST ? (
          <ProjectsListView
            data={data}
            showEditProject={showEditProject}
            collaborators={showCollaborators}
            reloadPage={refetch}
            gotoPage={(pageNumber: number) => setPage(pageNumber)}
          />
        ) : null}
      </Page.Body>
    </Container>
  )
}

export default ProjectsListPage
