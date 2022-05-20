/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import cx from 'classnames'

import {
  Layout,
  Text,
  Button,
  Container,
  Dialog,
  ExpandingSearchInput,
  Pagination,
  SelectOption
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import type { Breadcrumb } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { Select } from '@blueprintjs/select'

import { Menu } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import { useGet } from 'restful-react'

import { Page } from '@common/exports'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import ModuleTagsFilter from '@dashboards/components/ModuleTagsFilter/ModuleTagsFilter'

import routes from '@common/RouteDefinitions'

import { DashboardLayoutViews } from '@dashboards/types/DashboardTypes'
import { useStrings } from 'framework/strings'
import { useDeleteDashboard } from '@dashboards/services/CustomDashboardsService'
import Dashboards from './Dashboards'
import { useDashboardsContext } from '../DashboardsContext'
import FilterTagsSideBar from './FilterTagsSideBar'
import CreateDashboardForm from './CreateDashboardForm'
import css from './HomePage.module.scss'
import moduleTagCss from '@dashboards/common/ModuleTags.module.scss'

export const PAGE_SIZE = 20

interface Permission {
  resource: {
    resourceType: ResourceType
    resourceIdentifier?: string
  }
  permission: PermissionIdentifier
}

const DEFAULT_FILTER: { [key: string]: boolean } = {
  HARNESS: false,
  CE: false,
  CD: false,
  CI: false,
  CF: false,
  CG_CD: false
}

const CustomSelect = Select.ofType<SelectOption>()

const getBreadcrumbLinks = (
  folderDetail: { resource: string },
  accountId: string,
  folderId: string,
  folderString: string
): Breadcrumb[] => {
  if (folderDetail?.resource) {
    return [
      {
        url: routes.toCustomFolderHome({ accountId }),
        label: folderString
      },
      {
        url: routes.toViewCustomFolder({ folderId, accountId }),
        label: folderDetail.resource
      }
    ]
  }
  return []
}

const HomePage: React.FC = () => {
  const { getString } = useStrings()
  const { accountId, folderId } = useParams<{ accountId: string; folderId: string }>()

  const { includeBreadcrumbs } = useDashboardsContext()

  const [filteredTags, setFilteredTags] = React.useState<string[]>([])
  const [selectedFilter, setCheckboxFilter] = React.useState(DEFAULT_FILTER)
  const [searchTerm, setSearchTerm] = useState<string | undefined>()
  const [page, setPage] = useState(0)
  const [layoutView, setLayoutView] = useState(DashboardLayoutViews.GRID)
  const defaultSortBy: SelectOption = {
    label: 'Select Option',
    value: ''
  }

  const sortingOptions: SelectOption[] = [
    {
      label: 'Name',
      value: 'title'
    },
    {
      label: 'Recently Viewed',
      value: 'last_viewed_at desc'
    },
    {
      label: 'Recently Created',
      value: 'created_at desc'
    },
    {
      label: 'Most Viewed',
      value: 'view_count desc'
    },
    {
      label: 'Most Liked',
      value: 'favorite_count desc'
    }
  ]

  const [sortby, setSortingFilter] = useState<SelectOption>(defaultSortBy)

  const serialize = (obj: { [key: string]: boolean }): string => {
    return new URLSearchParams(Object.entries(obj).map(([k, v]) => [k, v.toString()])).toString()
  }

  const folderIdOrBlank = (): string => {
    return folderId.replace('shared', '')
  }

  React.useEffect(() => {
    const script = document.createElement('script')

    script.src = 'https://fast.wistia.com/assets/external/E-v1.js'
    script.async = true

    document.body.appendChild(script)
  }, [])

  const {
    data,
    loading,
    refetch: refetchDashboards,
    error
  } = useGet({
    // Inferred from RestfulProvider in index.js
    path: 'gateway/dashboard/v1/search',
    debounce: true,
    queryParams: {
      accountId: accountId,
      folderId: folderIdOrBlank(),
      searchTerm,
      page: page + 1,
      pageSize: PAGE_SIZE,
      tags: serialize(selectedFilter),
      sortBy: sortby?.value,
      customTag: filteredTags.join('%')
    }
  })

  const dashboardList = React.useMemo(() => data?.resource, [data])

  const { data: folderDetail } = useGet({
    path: 'gateway/dashboard/folderDetail',
    queryParams: { accountId: accountId, folderId: folderIdOrBlank() }
  })

  const { mutate: deleteDashboard, loading: deleting } = useDeleteDashboard(accountId)

  React.useEffect(() => {
    if (searchTerm || selectedFilter || sortby?.value || filteredTags?.length > 0) setPage(0)
  }, [searchTerm, selectedFilter, sortby?.value, filteredTags])

  const setPredefinedFilter = (filterType: string, isChecked: boolean): void => {
    const updatedValue: any = {}
    updatedValue[filterType] = isChecked
    setCheckboxFilter({ ...selectedFilter, ...updatedValue })
  }

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog isOpen={true} enforceFocus={false} onClose={hideModal} className={cx(css.dashboardDialog, css.create)}>
        <CreateDashboardForm hideModal={hideModal} />
      </Dialog>
    ),
    []
  )

  const permissionObj: Permission = {
    permission: PermissionIdentifier.EDIT_DASHBOARD,
    resource: {
      resourceType: ResourceType.DASHBOARDS
    }
  }

  if (folderId !== 'shared') {
    permissionObj['resource']['resourceIdentifier'] = folderId
  }

  React.useEffect(() => {
    includeBreadcrumbs(getBreadcrumbLinks(folderDetail, accountId, folderId, getString('dashboards.homePage.folders')))
  }, [folderDetail, accountId, folderId])

  const onDeleteDashboard = (dashboardId: string): void => {
    deleteDashboard({ dashboardId }).then(() => {
      refetchDashboards()
    })
  }

  return (
    <Page.Body loading={loading || deleting} error={error?.data?.message}>
      <Layout.Horizontal>
        <Layout.Horizontal
          padding="large"
          background={Color.GREY_0}
          spacing="medium"
          flex={{ justifyContent: 'space-between', alignItems: 'center' }}
          border={{ bottom: true, color: 'grey100' }}
          width="100%"
        >
          <RbacButton
            intent="primary"
            text={getString('dashboardLabel')}
            onClick={showModal}
            icon="plus"
            className={css.createButton}
            permission={permissionObj}
          />
          <Container className={cx(moduleTagCss.predefinedTags, css.mainNavTag)}>
            <ModuleTagsFilter selectedFilter={selectedFilter} setPredefinedFilter={setPredefinedFilter} />
          </Container>
          <Layout.Horizontal>
            <CustomSelect
              items={sortingOptions}
              filterable={false}
              itemRenderer={(item, { handleClick }) => <Menu.Item text={item.label} onClick={handleClick} />}
              onItemSelect={item => {
                setSortingFilter(item)
              }}
              popoverProps={{ minimal: true, popoverClassName: '' }}
            >
              <Button
                inline
                round
                rightIcon="chevron-down"
                className={css.customSelect}
                text={
                  <Text color={Color.BLACK}>
                    {getString('dashboards.sortBy')} {sortby?.label}
                  </Text>
                }
              />
            </CustomSelect>
            <Layout.Horizontal>
              <Button
                minimal
                aria-label={getString('dashboards.switchToGridView')}
                icon="grid-view"
                intent={layoutView === DashboardLayoutViews.GRID ? 'primary' : 'none'}
                onClick={() => {
                  setLayoutView(DashboardLayoutViews.GRID)
                }}
              />
              <Button
                minimal
                aria-label={getString('dashboards.switchToListView')}
                icon="list"
                intent={layoutView === DashboardLayoutViews.LIST ? 'primary' : 'none'}
                onClick={() => {
                  setLayoutView(DashboardLayoutViews.LIST)
                }}
              />
            </Layout.Horizontal>
          </Layout.Horizontal>
        </Layout.Horizontal>
      </Layout.Horizontal>

      <FilterTagsSideBar setFilteredTags={setFilteredTags} />

      <Layout.Vertical className={css.homeContent}>
        <Layout.Horizontal padding={{ top: 'large', right: 'xxxlarge', bottom: 'large', left: 'xxxlarge' }}>
          <ExpandingSearchInput
            placeholder={getString('dashboards.homePage.searchPlaceholder')}
            onChange={(text: string) => {
              setSearchTerm(text)
            }}
            className={css.search}
          />
        </Layout.Horizontal>
        <Layout.Horizontal
          margin={{ left: 'xxxlarge' }}
          flex={{ justifyContent: 'flex-start', alignItems: 'baseline' }}
        >
          <Container>
            {filteredTags.map((tag: string, index: number) => {
              return (
                <Container className={cx(moduleTagCss.customTag, css.filteredTags)} key={tag + index}>
                  {tag}
                  <Button
                    minimal
                    aria-label={getString('dashboards.homePage.removeTagFromFilter')}
                    icon="cross"
                    className={css.clearTagButton}
                    onClick={() => {
                      const filterTags = filteredTags.filter(v => v !== tag)
                      setFilteredTags(filterTags)
                    }}
                  />
                </Container>
              )
            })}
          </Container>
          {filteredTags?.length > 0 && (
            <Button minimal intent="primary" onClick={() => setFilteredTags([])}>
              {getString('filters.clearAll')}
            </Button>
          )}
        </Layout.Horizontal>
        <Dashboards
          dashboards={dashboardList}
          loading={loading}
          deleteDashboard={onDeleteDashboard}
          triggerRefresh={refetchDashboards}
          view={layoutView}
        />
      </Layout.Vertical>

      {!loading && (
        <Layout.Vertical padding={{ left: 'medium', right: 'medium' }}>
          <Pagination
            itemCount={dashboardList?.items || 1}
            pageSize={PAGE_SIZE}
            pageCount={dashboardList?.pages || 1}
            pageIndex={page}
            gotoPage={(pageNumber: number) => setPage(pageNumber)}
          />
        </Layout.Vertical>
      )}
    </Page.Body>
  )
}

export default HomePage
