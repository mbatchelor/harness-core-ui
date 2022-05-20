/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Container, Layout, Text, Icon } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { RenderColumnDetails } from '@rbac/components/ResourceGroupList/ResourceGroupListView'
import ResourceHandlerTable from '@rbac/components/ResourceHandlerTable/ResourceHandlerTable'
import { PageSpinner } from '@common/components'
import type { RbacResourceModalProps } from '@rbac/factories/RbacFactory'
import { useStrings } from 'framework/strings'
import { ResourceGroupV2Response, useGetFilterResourceGroupList } from 'services/resourcegroups'
import { useMutateAsGet } from '@common/hooks/useMutateAsGet'

export type ResourceGroupColumn = ResourceGroupV2Response & { identifier: string }

const ResourceGroupsResourceModalBody: React.FC<RbacResourceModalProps> = ({
  searchTerm,
  onSelectChange,
  selectedData,
  resourceScope
}) => {
  const { accountIdentifier, orgIdentifier, projectIdentifier } = resourceScope
  const [page, setPage] = useState(0)
  const { getString } = useStrings()
  const { data, loading } = useMutateAsGet(useGetFilterResourceGroupList, {
    body: { accountIdentifier, orgIdentifier, projectIdentifier, searchTerm },
    queryParams: {
      accountIdentifier,
      pageIndex: page,
      pageSize: 10
    }
  })

  const resourceGroups = data?.data?.content?.map(resource => ({
    ...resource,
    identifier: resource.resourceGroup.identifier
  }))

  if (loading) return <PageSpinner />
  return resourceGroups?.length ? (
    <Container>
      <ResourceHandlerTable<ResourceGroupColumn>
        data={resourceGroups}
        selectedData={selectedData}
        columns={[
          {
            Header: getString('common.resourceGroupLabel'),
            id: 'name',
            accessor: row => row.resourceGroup.name,
            width: '95%',
            Cell: RenderColumnDetails,
            disableSortBy: true
          }
        ]}
        pagination={{
          itemCount: data?.data?.totalItems || 0,
          pageSize: data?.data?.pageSize || 10,
          pageCount: data?.data?.totalPages || -1,
          pageIndex: data?.data?.pageIndex || 0,
          gotoPage: pageNumber => setPage(pageNumber)
        }}
        onSelectChange={onSelectChange}
      />
    </Container>
  ) : (
    <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
      <Icon name="resources-icon" size={20} />
      <Text font="medium" color={Color.BLACK}>
        {getString('noData')}
      </Text>
    </Layout.Vertical>
  )
}

export default ResourceGroupsResourceModalBody
