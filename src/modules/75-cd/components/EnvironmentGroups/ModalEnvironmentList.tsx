/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import { Spinner } from '@blueprintjs/core'

import { Checkbox, Container, Heading, Layout, Text } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { EnvironmentResponse, getEnvironmentListPromise } from 'services/cd-ng'

import { useInfiniteScroll } from '@common/hooks/useInfiniteScroll'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { EnvironmentGroupName } from './EnvironmentGroupsList/EnvironmentGroupsListColumns'

import EmptyEnvironmentGroup from './images/EmptyEnvironmentGroup.svg'

export default function ModalEnvironmentList({
  searchTerm,
  setIsFetchingEnvironments,
  selectedEnvironments,
  onSelectedEnvironmentChange
}: {
  searchTerm: string
  setIsFetchingEnvironments?: (isFetchingEnvironments: boolean) => void
  selectedEnvironments: (string | EnvironmentResponse)[]
  onSelectedEnvironmentChange: (
    checked: boolean,
    selectedEnvironments: (string | EnvironmentResponse)[],
    item: EnvironmentResponse
  ) => void
}): React.ReactElement {
  const { getString } = useStrings()
  const { orgIdentifier, projectIdentifier, accountId } = useParams<ProjectPathProps & ModulePathParams>()
  const [isFetchingEnvironmentsFirstTime, setIsFetchingEnvironmentsFirstTime] = useState(false)
  const [isFetchingEnvironmentsNextTime, setIsFetchingEnvironmentsNextTime] = useState(true)

  const loadMoreRef = useRef(null)
  const pageSize = useRef(20)

  const queryParams = useMemo(
    () => ({
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      size: pageSize.current,
      searchTerm
    }),
    [accountId, orgIdentifier, projectIdentifier, searchTerm]
  )

  const {
    items: environments,
    error: fetchEnvironmentsError,
    fetching: fetchingEnvironments,
    attachRefToLastElement,
    offsetToFetch
  } = useInfiniteScroll({
    getItems: options => {
      return getEnvironmentListPromise({
        queryParams: { ...queryParams, size: options.limit, page: options.offset }
      })
    },
    limit: pageSize.current,
    loadMoreRef,
    searchTerm
  })

  useEffect(() => {
    const firstFetch = fetchingEnvironments && offsetToFetch.current === 0
    setIsFetchingEnvironmentsFirstTime(fetchingEnvironments && offsetToFetch.current === 0)

    const subsequentFetch = fetchingEnvironments && offsetToFetch.current > 0
    setIsFetchingEnvironmentsNextTime(fetchingEnvironments && offsetToFetch.current > 0)

    setIsFetchingEnvironments?.(firstFetch || subsequentFetch)
  }, [fetchingEnvironments, offsetToFetch.current])

  const isEmptyContent = useMemo(() => {
    return !fetchingEnvironments && !fetchEnvironmentsError && isEmpty(environments)
  }, [fetchingEnvironments, fetchEnvironmentsError, environments])

  return (
    <>
      {isFetchingEnvironmentsFirstTime ? (
        <Container flex={{ align: 'center-center' }} height={'100%'}>
          <Spinner size={32} />
        </Container>
      ) : isEmptyContent ? (
        <Layout.Vertical flex={{ align: 'center-center' }} width={'100%'} height={'100%'}>
          <img src={EmptyEnvironmentGroup} alt={getString('cd.noEnvironment.title')} />
          <Heading level={2}>{getString('cd.noEnvironment.title')}</Heading>
        </Layout.Vertical>
      ) : (
        (environments as EnvironmentResponse[]).map((item, index) => {
          if (!item?.environment) {
            return null
          }

          const { name, identifier, tags } = item?.environment || {}
          const checked =
            (selectedEnvironments as string[]).some((_id: string) => _id === identifier) ||
            (selectedEnvironments as EnvironmentResponse[]).some(
              (selectedEnv: EnvironmentResponse) => selectedEnv?.environment?.identifier === identifier
            )

          return (
            <Layout.Horizontal
              width={'100%'}
              height={60}
              flex={{ justifyContent: 'flex-start', alignItems: 'center' }}
              padding={{ left: 'medium' }}
              margin={{ top: 0 }}
              border={{ bottom: true }}
              key={identifier}
              ref={attachRefToLastElement(index) ? loadMoreRef : undefined}
            >
              <EnvironmentSelection
                identifier={identifier}
                checked={checked}
                onChange={(e: FormEvent<HTMLInputElement>) => {
                  onSelectedEnvironmentChange((e.target as any).checked, selectedEnvironments, item)
                }}
              />
              <Layout.Vertical>
                <EnvironmentGroupName name={name} identifier={identifier} tags={tags} />
              </Layout.Vertical>
            </Layout.Horizontal>
          )
        })
      )}

      {isFetchingEnvironmentsNextTime && (
        <Container padding={{ left: 'xxlarge' }}>
          <Text icon="loading" iconProps={{ size: 20 }} font={{ align: 'center' }}>
            {getString('common.environment.fetchNext')}
          </Text>
        </Container>
      )}
    </>
  )
}

export function EnvironmentSelection({
  identifier,
  checked,
  onChange
}: {
  identifier?: string
  checked: boolean
  onChange: (e: FormEvent<HTMLInputElement>) => void
}) {
  return (
    <Container padding={{ left: 'xsmall' }}>
      <Checkbox
        name="environments"
        value={identifier}
        checked={checked}
        margin={{ right: 'small' }}
        onChange={onChange}
      />
    </Container>
  )
}
