/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import {
  Button,
  ButtonVariation,
  Container,
  Icon,
  Layout,
  Text,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { TemplateStudioPathProps } from '@common/interfaces/RouteInterfaces'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import type { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import {
  GetErrorResponse,
  SaveTemplatePopover
} from '@templates-library/components/TemplateStudio/SaveTemplatePopover/SaveTemplatePopover'
import { DefaultNewTemplateId } from 'framework/Templates/templates'
import { TemplateStudioSubHeaderLeftView } from '@templates-library/components/TemplateStudio/TemplateStudioSubHeader/views/TemplateStudioSubHeaderLeftView/TemplateStudioSubHeaderLeftView'
import css from './TemplateStudioSubHeader.module.scss'

export interface TemplateStudioSubHeaderProps {
  onViewChange: (view: SelectedView) => boolean
  getErrors: () => Promise<GetErrorResponse>
  onGitBranchChange: (selectedFilter: GitFilterScope) => void
}

export const TemplateStudioSubHeader: (props: TemplateStudioSubHeaderProps) => JSX.Element = ({
  onViewChange,
  getErrors,
  onGitBranchChange
}) => {
  const { state, fetchTemplate, view, isReadonly } = React.useContext(TemplateContext)
  const { isUpdated, entityValidityDetails } = state
  const { getString } = useStrings()
  const { templateIdentifier } = useParams<TemplateStudioPathProps>()
  const isYaml = view === SelectedView.YAML
  const isVisualViewDisabled = React.useMemo(() => entityValidityDetails.valid === false, [entityValidityDetails.valid])

  return (
    <Container
      className={css.subHeader}
      height={49}
      padding={{ right: 'xlarge', left: 'xlarge' }}
      border={{ bottom: true, color: Color.GREY_200 }}
      background={Color.WHITE}
    >
      <Layout.Horizontal height={'100%'} flex={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <TemplateStudioSubHeaderLeftView onGitBranchChange={onGitBranchChange} />
        <Container>
          <VisualYamlToggle
            className={css.visualYamlToggle}
            selectedView={isYaml || isVisualViewDisabled ? SelectedView.YAML : SelectedView.VISUAL}
            onChange={nextMode => {
              onViewChange(nextMode)
            }}
            disableToggle={isVisualViewDisabled}
          />
        </Container>
        <Container>
          <Layout.Horizontal spacing={'medium'} flex={{ alignItems: 'center' }}>
            {isReadonly && (
              <Container>
                <Layout.Horizontal spacing={'small'}>
                  <Icon name="eye-open" size={16} color={Color.ORANGE_800} />
                  <Text color={Color.ORANGE_800} font={{ size: 'small' }}>
                    {getString('common.readonlyPermissions')}
                  </Text>
                </Layout.Horizontal>
              </Container>
            )}
            {isUpdated && !isReadonly && (
              <Text color={Color.ORANGE_600} font={{ size: 'small' }} className={css.tagRender}>
                {getString('unsavedChanges')}
              </Text>
            )}
            {!isReadonly && (
              <Container>
                <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'center' }}>
                  <SaveTemplatePopover getErrors={getErrors} />
                  {templateIdentifier !== DefaultNewTemplateId && (
                    <Button
                      disabled={!isUpdated}
                      onClick={() => {
                        fetchTemplate({ forceFetch: true, forceUpdate: true })
                      }}
                      variation={ButtonVariation.SECONDARY}
                      text={getString('common.discard')}
                    />
                  )}
                </Layout.Horizontal>
              </Container>
            )}
          </Layout.Horizontal>
        </Container>
      </Layout.Horizontal>
    </Container>
  )
}
