/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { MultiSelectOption, Layout, Checkbox, MultiSelect, Radio } from '@harness/uicore'
import produce from 'immer'
import { defaultTo } from 'lodash-es'
import { SelectionType } from '@rbac/utils/utils'
import { useStrings } from 'framework/strings'
import { useGetProjectList } from 'services/cd-ng'
import type { ScopeSelector } from 'services/resourcegroups'

interface OrgSelectionRendererProps {
  accountIdentifier: string
  orgIdentifier: string
  index: number
  setSelectedScopes: React.Dispatch<React.SetStateAction<ScopeSelector[][]>>
  includeProjects?: boolean
  projects?: string[]
}
const OrgSelectionRenderer: React.FC<OrgSelectionRendererProps> = ({
  accountIdentifier,
  orgIdentifier,
  includeProjects,
  projects,
  index,
  setSelectedScopes
}) => {
  const { getString } = useStrings()
  const [searchTerm, setSearchTerm] = useState('')
  const { data } = useGetProjectList({
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      searchTerm
    },
    debounce: 300
  })
  const [includeProjectResources, setIncludeProjectResources] = useState(includeProjects)
  const [projectSelection, setProjectSelection] = useState<SelectionType>(
    projects?.length ? SelectionType.SPECIFIED : SelectionType.ALL
  )
  const projectOpts: MultiSelectOption[] = defaultTo(
    /* istanbul ignore next */ data?.data?.content?.map(res => ({
      label: res.project.name,
      value: res.project.identifier
    })),
    []
  )

  /* istanbul ignore next */ const selectedScopes = data?.data?.content?.reduce((acc: MultiSelectOption[], curr) => {
    if (projects?.includes(curr.project.identifier)) {
      acc.push({
        label: curr.project.name,
        value: curr.project.identifier
      })
    }
    return acc
  }, [])

  return (
    <Layout.Vertical padding={{ top: 'medium' }}>
      <Checkbox
        label={getString('rbac.resourceScope.includeProjResources')}
        data-testid={`${orgIdentifier}-INCLUDE-PROJECTS`}
        checked={includeProjectResources}
        onChange={event => {
          setIncludeProjectResources(event.currentTarget.checked)
          setSelectedScopes(oldVal =>
            produce(oldVal, draft => {
              draft[index] = [
                {
                  accountIdentifier,
                  orgIdentifier,
                  filter: event?.currentTarget?.checked ? 'INCLUDING_CHILD_SCOPES' : 'EXCLUDING_CHILD_SCOPES'
                }
              ]
            })
          )
        }}
      />
      {includeProjectResources && (
        <Layout.Vertical spacing="small" padding={{ top: 'xsmall' }}>
          <Layout.Horizontal spacing="huge" margin={{ left: 'xxlarge' }}>
            <Radio
              label={getString('rbac.resourceGroup.all')}
              data-testid={`${orgIdentifier}-INCLUDE-ALL-PROJECTS`}
              inline={true}
              value={SelectionType.ALL}
              checked={projectSelection === SelectionType.ALL}
              onChange={e => {
                setSelectedScopes(oldVal =>
                  produce(oldVal, draft => {
                    draft[index] = [
                      {
                        accountIdentifier,
                        orgIdentifier,
                        filter: 'INCLUDING_CHILD_SCOPES'
                      }
                    ]
                  })
                )
                setProjectSelection(e.currentTarget.value as SelectionType)
              }}
            />
            <Radio
              label={getString('common.specified')}
              inline={true}
              data-testid={`${orgIdentifier}-INCLUDE-SPECFIED-PROJECTS`}
              value={SelectionType.SPECIFIED}
              checked={projectSelection === SelectionType.SPECIFIED}
              onChange={e => {
                setSelectedScopes(oldVal =>
                  produce(oldVal, draft => {
                    draft[index] = [
                      {
                        accountIdentifier,
                        orgIdentifier,
                        filter: 'EXCLUDING_CHILD_SCOPES'
                      }
                    ]
                  })
                )
                setProjectSelection(e.currentTarget.value as SelectionType)
              }}
            />
          </Layout.Horizontal>
          {projectSelection === SelectionType.SPECIFIED && (
            <MultiSelect
              fill
              items={projectOpts}
              value={selectedScopes}
              onQueryChange={
                /* istanbul ignore next */ item => {
                  setSearchTerm(item)
                }
              }
              allowCreatingNewItems={false}
              onChange={
                /* istanbul ignore next */ items => {
                  setSelectedScopes(oldVal =>
                    produce(oldVal, draft => {
                      draft[index] =
                        items.length === 0
                          ? [
                              {
                                accountIdentifier,
                                orgIdentifier,
                                filter: 'INCLUDING_CHILD_SCOPES'
                              }
                            ]
                          : [
                              {
                                accountIdentifier,
                                orgIdentifier,
                                filter: 'EXCLUDING_CHILD_SCOPES'
                              },
                              ...items.map(
                                item =>
                                  ({
                                    accountIdentifier,
                                    orgIdentifier,
                                    projectIdentifier: item.value.toString(),
                                    filter: 'EXCLUDING_CHILD_SCOPES'
                                  } as ScopeSelector)
                              )
                            ]
                    })
                  )
                }
              }
            />
          )}
        </Layout.Vertical>
      )}
    </Layout.Vertical>
  )
}

export default OrgSelectionRenderer
