/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Checkbox, Layout, MultiSelect, MultiSelectOption, PageSpinner } from '@harness/uicore'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import produce from 'immer'
import { defaultTo } from 'lodash-es'
import type { OrgPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useGetProjectList } from 'services/cd-ng'
import type { ScopeSelector } from 'services/resourcegroups'
import { getAllProjects } from '@rbac/pages/ResourceGroupDetails/utils'

interface OrgCustomScopeProps {
  selectedScopes: ScopeSelector[][]
  setSelectedScopes: React.Dispatch<React.SetStateAction<ScopeSelector[][]>>
  hasCurrentScope: boolean
  onCurrentScopeChange: (value: boolean) => void
}

const OrgCustomScope: React.FC<OrgCustomScopeProps> = ({
  selectedScopes,
  setSelectedScopes,
  hasCurrentScope,
  onCurrentScopeChange
}) => {
  const { accountId, orgIdentifier } = useParams<OrgPathProps>()
  const { getString } = useStrings()
  const [searchTerm, setSearchTerm] = useState('')
  const projects = getAllProjects(selectedScopes[0])
  const { data, loading } = useGetProjectList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      searchTerm
    },
    debounce: 300
  })

  /* istanbul ignore next */ const projectOpts: MultiSelectOption[] = defaultTo(
    data?.data?.content?.map(res => ({
      label: res.project.name,
      value: res.project.identifier
    })),
    []
  )

  /* istanbul ignore next */ const selectedProjects = data?.data?.content?.reduce((acc: MultiSelectOption[], curr) => {
    if (projects?.includes(curr.project.identifier)) {
      acc.push({
        label: curr.project.name,
        value: curr.project.identifier
      })
    }
    return acc
  }, [])

  return (
    <Layout.Vertical spacing="small" padding={{ top: 'large' }}>
      {loading && /* istanbul ignore next */ <PageSpinner />}
      <Checkbox
        label={getString('rbac.resourceScope.includeOrgResources')}
        data-testid={`INCLUDE_ORG_RESOURCES`}
        checked={hasCurrentScope}
        onChange={event => {
          onCurrentScopeChange(event.currentTarget.checked)
        }}
      />
      <Layout.Vertical spacing="small">
        <MultiSelect
          fill
          items={projectOpts}
          value={selectedProjects}
          onQueryChange={
            /* istanbul ignore next */ item => {
              setSearchTerm(item)
            }
          }
          onChange={
            /* istanbul ignore next */ items => {
              setSelectedScopes(oldVal =>
                produce(oldVal, draft => {
                  draft[0] = items.map(item => ({
                    accountIdentifier: accountId,
                    orgIdentifier,
                    projectIdentifier: item.value.toString(),
                    filter: 'EXCLUDING_CHILD_SCOPES'
                  }))
                })
              )
            }
          }
        />
      </Layout.Vertical>
    </Layout.Vertical>
  )
}

export default OrgCustomScope
