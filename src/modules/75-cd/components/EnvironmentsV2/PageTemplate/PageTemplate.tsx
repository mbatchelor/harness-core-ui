/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactNode, useMemo, PropsWithChildren, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'

import {
  Page,
  FontVariation,
  Heading,
  HarnessDocTooltip,
  getErrorInfoFromErrorObject,
  Views,
  Container,
  Layout,
  ExpandingSearchInput,
  GridListToggle,
  Pagination,
  SelectOption,
  Text,
  DropDown
} from '@harness/uicore'
import { Color } from '@harness/design-system'

import { useStrings } from 'framework/strings'

import RbacButton, { ButtonProps } from '@rbac/components/Button/Button'

import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { usePageStore } from './PageContext'
import { Sort, SortFields } from '../utils'

import css from './PageTemplate.module.scss'

interface CreateButtonProps {
  text: string
  dataTestid: string
  permission: ButtonProps['permission']
  onClick: () => void
}

export interface PageTemplateProps {
  title: string
  titleTooltipId?: string
  headerContent?: ReactNode
  headerToolbar?: ReactNode
  createButtonProps: CreateButtonProps
  useGetListHook: any
  emptyContent: ReactNode
  ListComponent: any
  GridComponent: any
  sortOptions: any[]
  defaultSortOption: any
}
export default function PageTemplate({
  title,
  titleTooltipId,
  headerContent,
  headerToolbar,
  createButtonProps,
  useGetListHook,
  emptyContent,
  ListComponent,
  GridComponent,
  sortOptions,
  defaultSortOption
}: PropsWithChildren<PageTemplateProps>) {
  useDocumentTitle(title)
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()

  const { view, setView } = usePageStore()
  const { getString } = useStrings()

  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState<string[]>(defaultSortOption)
  const [sortOption, setSortOption] = useState<SelectOption>(sortOptions[0])

  const queryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    page,
    size: 10,
    searchTerm,
    sort
  }

  const { data, loading, error, refetch } = useGetListHook({
    queryParams,
    queryParamStringifyOptions: {
      arrayFormat: 'comma'
    }
  })

  const response = data?.data
  const noData = Boolean(!loading && response?.empty)

  enum STATUS {
    'loading',
    'error',
    'ok'
  }

  // TODO: to be extracted
  const handleSortChange = (item: SelectOption) => {
    const sortArray =
      item.value === SortFields.AZ09
        ? [SortFields.Name, Sort.ASC]
        : item.value === SortFields.ZA90
        ? [SortFields.Name, Sort.DESC]
        : [SortFields.LastUpdatedAt, Sort.DESC]
    setSort(sortArray)
    setSortOption(item)
  }

  const state = useMemo<STATUS>(() => {
    if (error) {
      return STATUS.error
    } else if (loading) {
      return STATUS.loading
    }

    return STATUS.ok
  }, [error, loading, STATUS])

  return (
    <main className={css.layout}>
      <Page.Header
        title={
          <Heading level={3} font={{ variation: FontVariation.H4 }} data-tooltip-id={titleTooltipId}>
            {title}
            <HarnessDocTooltip tooltipId={titleTooltipId} useStandAlone />
          </Heading>
        }
        breadcrumbs={<NGBreadcrumbs customPathParams={{ module }} />}
        className={css.header}
        content={headerContent}
        toolbar={headerToolbar}
      />
      <Page.SubHeader className={css.toolbar}>
        <Layout.Horizontal flex={{ justifyContent: 'space-between' }} width={'100%'}>
          <Layout.Horizontal>
            <RbacButton
              intent="primary"
              icon="plus"
              iconProps={{ size: 12 }}
              font={{ weight: 'bold' }}
              {...createButtonProps}
            />
          </Layout.Horizontal>
          <Layout.Horizontal spacing="medium" flex={{ alignItems: 'center' }}>
            <ExpandingSearchInput
              alwaysExpanded
              width={200}
              placeholder={getString('search')}
              onChange={setSearchTerm}
            />
            <GridListToggle initialSelectedView={Views.LIST} onViewToggle={setView} />
          </Layout.Horizontal>
        </Layout.Horizontal>
      </Page.SubHeader>

      <div className={css.content}>
        {state === STATUS.error && (
          <Page.Error message={getErrorInfoFromErrorObject(defaultTo(error, {}))} onClick={refetch} />
        )}
        {state === STATUS.ok && !noData && (
          <Layout.Horizontal
            flex={{ justifyContent: 'space-between' }}
            padding={{ top: 'large', right: 'xlarge', left: 'xlarge' }}
          >
            <Text color={Color.GREY_800} iconProps={{ size: 14 }}>
              {getString('total')}: {response?.totalItems}
            </Text>
            <DropDown
              items={sortOptions}
              value={sortOption.value.toString()}
              filterable={false}
              width={180}
              icon={'main-sort'}
              iconProps={{ size: 16, color: Color.GREY_400 }}
              onChange={handleSortChange}
            />
          </Layout.Horizontal>
        )}
        {state === STATUS.ok ? (
          noData ? (
            <Container flex={{ align: 'center-center' }}>
              <Container flex style={{ flexDirection: 'column' }}>
                {emptyContent}
              </Container>
            </Container>
          ) : view === Views.LIST ? (
            <Container padding={{ top: 'medium', right: 'xlarge', left: 'xlarge' }}>
              <ListComponent response={response} refetch={refetch} />
            </Container>
          ) : (
            <GridComponent response={response} refetch={refetch} />
          )
        ) : null}
      </div>

      {state === STATUS.ok && (
        <div className={css.footer}>
          <Pagination
            itemCount={data?.data?.totalItems || 0}
            pageSize={data?.data?.pageSize || 0}
            pageCount={data?.data?.totalPages || 0}
            pageIndex={page}
            gotoPage={index => {
              setPage(index)
            }}
          />
        </div>
      )}

      {state === STATUS.loading && !error && (
        <div className={css.loading}>
          <ContainerSpinner />
        </div>
      )}
    </main>
  )
}
