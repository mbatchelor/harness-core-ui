/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Color, Container, Layout, Page, Text } from '@harness/uicore'
import { defaultTo } from 'lodash-es'
import ResourcesCard from '@rbac/components/ResourcesCard/ResourcesCard'
import { useStrings } from 'framework/strings'
import type { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'

export interface ResourcesCardListProps {
  selectedResourcesMap: Map<ResourceType, string[] | string>
  resourceCategoryMap?: Map<ResourceType | ResourceCategory, ResourceType[] | undefined>
  onResourceSelectionChange: (resourceType: ResourceType, isAdd: boolean, identifiers?: string[] | undefined) => void
  onResourceCategorySelect: (types: ResourceType[], isAdd: boolean) => void
  disableAddingResources?: boolean
  disableSelection?: boolean
}

const ResourcesCardList: React.FC<ResourcesCardListProps> = ({
  selectedResourcesMap,
  resourceCategoryMap,
  onResourceSelectionChange,
  onResourceCategorySelect,
  ...props
}) => {
  const { getString } = useStrings()

  //TODO: Add Cypress tests for Drag and Drop
  return (
    <Container
      padding="xlarge"
      height={'100%'}
      onDrop={
        /* istanbul ignore next */ event => {
          const resourceCategory: ResourceType | ResourceCategory = event.dataTransfer.getData('text/plain') as
            | ResourceType
            | ResourceCategory
          const types = resourceCategoryMap?.get(resourceCategory)
          if (types) {
            onResourceCategorySelect(types, true)
          } else {
            onResourceSelectionChange(resourceCategory as ResourceType, true)
          }

          event.preventDefault()
          event.stopPropagation()
        }
      }
      onDragOver={
        /* istanbul ignore next */ event => {
          event.dataTransfer.dropEffect = 'copy'
          event.preventDefault()
        }
      }
    >
      <Text color={Color.GREY_900} padding={{ bottom: 'medium' }}>
        {getString('rbac.resourceGroup.resourceFilterSelection')}
      </Text>
      {Array.from(selectedResourcesMap.keys()).length === 0 && (
        <Page.NoDataCard
          message={getString('rbac.resourceGroup.dragAndDropData')}
          icon="drag-handle-horizontal"
          iconSize={100}
        />
      )}
      <Layout.Vertical spacing="small">
        {Array.from(selectedResourcesMap.keys()).map(resourceType => {
          return (
            <ResourcesCard
              key={resourceType}
              resourceType={resourceType}
              resourceValues={defaultTo(selectedResourcesMap.get(resourceType), [])}
              onResourceSelectionChange={onResourceSelectionChange}
              {...props}
            />
          )
        })}
      </Layout.Vertical>
    </Container>
  )
}

export default ResourcesCardList
