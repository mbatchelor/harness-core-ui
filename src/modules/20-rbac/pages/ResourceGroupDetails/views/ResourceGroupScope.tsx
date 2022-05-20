/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Card, Color, FontVariation, Layout, Text } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import type { ResourceGroupDetailsPathProps, ModulePathParams } from '@common/interfaces/RouteInterfaces'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { useResourceScopeModal } from '@rbac/modals/ResourceScope/ResourceScopeModal'
import type { ResourceGroupV2, ScopeSelector } from 'services/resourcegroups'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { getSelectedScopeLabel } from '../utils'
import OrgSelectionRenderer from './OrgSelectionRenderer'
import ProjectSelectionRenderer from './ProjectSelectionRenderer'
import css from './ResourceGroupScope.module.scss'
interface ResourceGroupScopeProps {
  resourceGroup: ResourceGroupV2
  includedScopes: ScopeSelector[]
  onSuccess: (scopes: ScopeSelector[]) => void
  setIsUpdated: (updated: boolean) => void
}

const ResourceGroupScope: React.FC<ResourceGroupScopeProps> = ({ includedScopes, onSuccess, setIsUpdated }) => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ResourceGroupDetailsPathProps & ModulePathParams>()
  const { getString } = useStrings()
  const { CUSTOM_RESOURCEGROUP_SCOPE } = useFeatureFlags()
  const scope = getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })

  const { openResourceScopeModal } = useResourceScopeModal({
    onSuccess: scopes => {
      setIsUpdated(true)
      onSuccess(scopes)
    }
  })

  return (
    <Card className={css.card}>
      <Layout.Vertical spacing="medium">
        <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
          <Text font={{ variation: FontVariation.H5 }} color={Color.GREY_800}>
            {getString('rbac.resourceScope.label')}
          </Text>
          <Text
            onClick={() => openResourceScopeModal(includedScopes)}
            border={{ color: Color.GREY_250 }}
            font={{ variation: FontVariation.BODY }}
            color={Color.GREY_900}
            padding="small"
            className={css.dropdown}
            rightIcon="chevron-down"
          >
            {getSelectedScopeLabel(getString, scope, includedScopes, CUSTOM_RESOURCEGROUP_SCOPE)}
          </Text>
        </Layout.Horizontal>
        {scope === Scope.ACCOUNT && <OrgSelectionRenderer includedScopes={includedScopes} />}
        {scope === Scope.ORG && <ProjectSelectionRenderer includedScopes={includedScopes} />}
      </Layout.Vertical>
    </Card>
  )
}

export default ResourceGroupScope
