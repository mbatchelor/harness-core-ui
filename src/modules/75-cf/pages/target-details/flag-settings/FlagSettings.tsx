/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Container,
  ExpandingSearchInput,
  FlexExpander,
  Layout,
  Select,
  SelectOption,
  Text,
  PageError,
  Pagination
} from '@wings-software/uicore'
import { useGovernance } from '@cf/hooks/useGovernance'
import { useStrings } from 'framework/strings'
import { Feature, GitDetails, GitSyncErrorResponse, Target, useGetAllFeatures, Variation } from 'services/cf'
import { ItemContainer } from '@cf/components/ItemContainer/ItemContainer'
import routes from '@common/RouteDefinitions'
import { CF_DEFAULT_PAGE_SIZE, FlagsSortByField, getErrorMessage, SortOrder } from '@cf/utils/CFUtils'
import { NoDataFoundRow } from '@cf/components/NoDataFoundRow/NoDataFoundRow'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { CFVariationColors } from '@cf/constants'
import { FlagPatchParams, useServeFeatureFlagVariationToTargets } from '@cf/utils/FlagUtils'
import { useToaster } from '@common/exports'
import StringWithTooltip from '@common/components/StringWithTooltip/StringWithTooltip'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RBACTooltip from '@rbac/components/RBACTooltip/RBACTooltip'

import SaveFlagToGitModal from '@cf/components/SaveFlagToGitModal/SaveFlagToGitModal'

import { GitSyncFormValues, GIT_SYNC_ERROR_CODE, UseGitSync } from '@cf/hooks/useGitSync'
import { AUTO_COMMIT_MESSAGES } from '@cf/constants/GitSyncConstants'
import usePlanEnforcement from '@cf/hooks/usePlanEnforcement'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { FeatureWarningTooltip } from '@common/components/FeatureWarning/FeatureWarningWithTooltip'
import { useFeature } from '@common/hooks/useFeatures'
import { DetailHeading } from '../DetailHeading'
import css from './FlagSettings.module.scss'

const CellWidth = {
  USER: 0, // 80, set to 0 as backend is not ready
  LAST_EVALUATED: 0, // 170, set to 0 as backend is not ready
  VARIATION: 180
}

export interface FlagSettingsProps {
  target?: Target | null
  gitSync: UseGitSync
}

export const FlagSettings: React.FC<FlagSettingsProps> = ({ target, gitSync }) => {
  const { getString } = useStrings()
  const [sortByField] = useState(FlagsSortByField.NAME)
  const [sortOrder, setSortOrder] = useState(SortOrder.ASCENDING)
  const {
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    targetIdentifier
  } = useParams<Record<string, string>>()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()
  const patchParams = {
    accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    environmentIdentifier
  }

  const [pageNumber, setPageNumber] = useState(0)
  const [queryString, setQueryString] = useState('')
  const queryParams = useMemo(
    () => ({
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier,
      targetIdentifier,
      pageSize: CF_DEFAULT_PAGE_SIZE,
      pageNumber,
      sortByField,
      sortOrder,
      name: queryString
    }),
    [
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier,
      targetIdentifier,
      pageNumber,
      sortByField,
      sortOrder,
      queryString
    ]
  )
  const { data, loading: loadingFeatures, error, refetch } = useGetAllFeatures({ queryParams })

  const FlagSettingsHeader: React.FC = () => {
    const textStyle = {
      color: '#4F5162',
      fontSize: '10px',
      cursor: 'pointer',
      fontWeight: 'bold'
    } as React.CSSProperties

    return (
      <Container
        padding={{ left: 'xsmall', right: 'xsmall' }}
        style={{ position: 'sticky', top: '82px', background: '#fcfdfd', zIndex: 2 }}
      >
        <Layout.Horizontal padding={{ top: 'xsmall', right: 'xxxlarge', bottom: 'xsmall', left: 'xxxlarge' }}>
          <Text
            width={`calc(100% - ${CellWidth.USER + CellWidth.LAST_EVALUATED + CellWidth.VARIATION}px)`}
            tabIndex={0}
            role="button"
            rightIcon={
              sortByField === FlagsSortByField.NAME
                ? sortOrder === SortOrder.ASCENDING
                  ? 'caret-up'
                  : 'caret-down'
                : undefined
            }
            style={textStyle}
            onClick={() => {
              setSortOrder(previous => (previous === SortOrder.ASCENDING ? SortOrder.DESCENDING : SortOrder.ASCENDING))
            }}
          >
            {getString('flag').toUpperCase()}
          </Text>
          <Text width={CellWidth.USER} style={{ display: 'none' }} />
          <Text width={CellWidth.LAST_EVALUATED} style={{ ...textStyle, display: 'none' }}>
            {getString('cf.shared.lastEvaluated').toUpperCase()}
          </Text>
          <Text width={CellWidth.VARIATION} style={textStyle}>
            {getString('cf.shared.variation').toUpperCase()}
          </Text>
        </Layout.Horizontal>
      </Container>
    )
  }
  const noData = data?.features?.length === 0
  const hasData = (data?.features?.length || 0) >= 1
  const loading = loadingFeatures

  return (
    <Container
      height="100%"
      flex
      style={{ overflow: 'auto', flexGrow: 1, background: '#fcfdfd', flexDirection: 'column' }}
    >
      <Layout.Horizontal
        style={{
          width: '100%',
          paddingRight: 'var(--spacing-xxlarge)',
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: '#fcfdfd'
        }}
      >
        <DetailHeading style={{ alignSelf: 'baseline' }}>
          <StringWithTooltip stringId="cf.targetDetail.flagSetting" tooltipId="ff_targetFlagSettings_heading" />
        </DetailHeading>
        <FlexExpander />
        <Container height={35} style={{ alignSelf: 'baseline' }}>
          <ExpandingSearchInput
            placeholder={getString('cf.targetDetail.searchPlaceholder')}
            onChange={setQueryString}
          />
        </Container>
      </Layout.Horizontal>
      <Container style={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {!error && noData && (
          <NoDataFoundRow
            message={getString('cf.targetDetail.noFlagConfigured')}
            margin={{ left: 'xxlarge', right: 'xxlarge' }}
          />
        )}

        {!loading && !error && hasData && (
          <>
            <FlagSettingsHeader />
            <Layout.Vertical
              spacing="small"
              padding={{ top: 'xsmall', right: 'xxlarge', bottom: 'xxlarge', left: 'xxlarge' }}
              style={{ flexGrow: 1 }}
            >
              {data?.features?.map((feature, index) => (
                <FlagSettingsRow
                  index={index}
                  target={target as Target}
                  feature={feature}
                  patchParams={patchParams}
                  key={feature.identifier}
                  gitSync={gitSync}
                />
              ))}
            </Layout.Vertical>

            {(data?.itemCount || 0) > CF_DEFAULT_PAGE_SIZE && (
              <Container className={css.pagination}>
                <Pagination
                  itemCount={data?.itemCount || 0}
                  pageSize={data?.pageSize || 0}
                  pageCount={data?.pageCount || 0}
                  pageIndex={pageNumber}
                  gotoPage={setPageNumber}
                  breakAt={1660}
                />
              </Container>
            )}
          </>
        )}

        {loading && <ContainerSpinner />}
        {!loading && error && <PageError message={getErrorMessage(error)} onClick={() => refetch()} />}
      </Container>
    </Container>
  )
}

const FlagSettingsRow: React.FC<{
  index: number
  target: Target
  feature: Feature
  patchParams: FlagPatchParams
  gitSync: UseGitSync
}> = ({ feature, index, patchParams, target, gitSync }) => {
  const { withActiveEnvironment } = useActiveEnvironment()

  return (
    <ItemContainer>
      <Layout.Horizontal>
        <Container
          width={`calc(100% - ${CellWidth.USER + CellWidth.LAST_EVALUATED + CellWidth.VARIATION}px)`}
          style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column' }}
        >
          <Text
            lineClamp={1}
            style={{ color: '#22222A', fontWeight: 600, fontSize: '13px', lineHeight: '24px' }}
            padding={{ right: 'xlarge' }}
          >
            <Link
              className={css.link}
              to={withActiveEnvironment(
                routes.toCFFeatureFlagsDetail({
                  accountId: patchParams.accountIdentifier,
                  orgIdentifier: patchParams.orgIdentifier,
                  projectIdentifier: patchParams.projectIdentifier,
                  featureFlagIdentifier: feature.identifier
                })
              )}
            >
              {feature.name}
            </Link>
          </Text>
          {!!feature.description && (
            <Text lineClamp={1} style={{ color: '#4F5162', fontSize: '12px' }} padding={{ right: 'xlarge' }}>
              {feature.description}
            </Text>
          )}
        </Container>

        <Container
          width={CellWidth.USER}
          flex={{ align: 'center-center' }}
          style={{ color: '#627386', fontSize: '12px', display: 'none' }}
        >
          <Text icon="user" tooltip={feature.owner?.join(', ')}>
            {(feature.owner?.length || 0) > 1 ? feature.owner?.length : ''}
          </Text>
        </Container>

        <Container
          width={CellWidth.LAST_EVALUATED}
          style={{ flexDirection: 'column', alignSelf: 'center', display: 'none' }}
        >
          <Text>{/* Dec 1, 2012 */}</Text>
          <Text>{/* Via conditional rules */}</Text>
        </Container>

        <Container width={CellWidth.VARIATION} style={{ alignSelf: 'center' }}>
          <VariationSelect
            rowIndex={index}
            patchParams={patchParams}
            variations={feature.variations}
            selectedIdentifier={feature.evaluationIdentifier as string}
            feature={feature}
            gitSync={gitSync}
            target={target}
          />
        </Container>
      </Layout.Horizontal>
    </ItemContainer>
  )
}

export interface VariationSelectProps {
  variations: Variation[]
  rowIndex: number
  selectedIdentifier: string
  patchParams: FlagPatchParams
  feature: Feature
  target: Target
  gitSync: UseGitSync
}

export const VariationSelect: React.FC<VariationSelectProps> = ({
  variations,
  rowIndex,
  selectedIdentifier,
  target,
  feature,
  patchParams,
  gitSync
}) => {
  const { getString } = useStrings()
  const [index, setIndex] = useState<number>(variations.findIndex(v => v.identifier === selectedIdentifier))
  const value =
    index !== -1
      ? {
          label: variations[index].name as string,
          value: variations[index].identifier as string,
          icon: {
            name: 'full-circle',
            style: {
              color: CFVariationColors[index]
            }
          }
        }
      : undefined
  const { activeEnvironment } = useActiveEnvironment()
  const { handleError: handleGovernanceError, isGovernanceError } = useGovernance()
  const [canEdit] = usePermission({
    resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: activeEnvironment },
    permissions: [PermissionIdentifier.EDIT_FF_FEATUREFLAG]
  })
  const [isGitSyncModalOpen, setIsGitSyncModalOpen] = useState(false)

  const { isPlanEnforcementEnabled, isFreePlan } = usePlanEnforcement()
  const { enabled } = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.MAUS
    }
  })

  const { showError } = useToaster()

  const { gitSyncInitialValues, gitSyncValidationSchema } = gitSync.getGitSyncFormMeta(
    AUTO_COMMIT_MESSAGES.UPDATED_FLAG_VARIATIONS
  )

  const _useServeFlagVariationToTargets = useServeFeatureFlagVariationToTargets(patchParams)

  const previousSelectedIdentifier = useRef(variations.findIndex(v => v.identifier === selectedIdentifier))

  useEffect(() => {
    const updateVariation = async (): Promise<void> => {
      if (previousSelectedIdentifier.current !== index) {
        if (gitSync.isGitSyncEnabled && !gitSync.isAutoCommitEnabled) {
          setIsGitSyncModalOpen(true)
        } else {
          saveVariationChange()
        }
      }
    }

    updateVariation()
  }, [index])

  const saveVariationChange = async (gitSyncFormValues?: GitSyncFormValues): Promise<void> => {
    try {
      let gitDetails: GitDetails | undefined

      if (gitSync?.isAutoCommitEnabled) {
        gitDetails = gitSyncInitialValues.gitDetails
      } else {
        gitDetails = gitSyncFormValues?.gitDetails
      }

      if (!gitSync?.isAutoCommitEnabled && gitSyncFormValues?.autoCommit) {
        await gitSync.handleAutoCommit(gitSyncFormValues.autoCommit)
      }

      const response = await _useServeFlagVariationToTargets(
        feature,
        variations[index].identifier,
        [target.identifier],
        gitDetails
      )

      if (isGovernanceError(response)) {
        handleGovernanceError(response)
      }

      previousSelectedIdentifier.current = index
    } catch (e: any) {
      if (e.status === GIT_SYNC_ERROR_CODE) {
        gitSync.handleError(e.data as GitSyncErrorResponse)
      } else {
        if (isGovernanceError(e?.data)) {
          handleGovernanceError(e.data)
        } else {
          showError(getErrorMessage(e), 0, 'cf.serve.flag.variant.error')
        }
      }
      setIndex(previousSelectedIdentifier.current)
    } finally {
      setIsGitSyncModalOpen(false)
    }
  }

  const selectDisabled = isPlanEnforcementEnabled && isFreePlan && !enabled

  const getFeatureRowTooltip = (): ReactElement | undefined => {
    if (!canEdit) {
      return (
        <RBACTooltip resourceType={ResourceType.ENVIRONMENT} permission={PermissionIdentifier.EDIT_FF_FEATUREFLAG} />
      )
    } else if (selectDisabled) {
      return <FeatureWarningTooltip featureName={FeatureIdentifier.MAUS} />
    } else if (feature.envProperties?.state === 'off') {
      return (
        <Container padding="small" width={300}>
          {getString('cf.targetDetail.flagDisabled')}
        </Container>
      )
    }

    return undefined
  }

  return (
    <>
      <Text data-testid={`variation_select_${rowIndex}`} tooltip={getFeatureRowTooltip()}>
        <Select
          disabled={!canEdit || feature.envProperties?.state === 'off' || selectDisabled}
          items={variations.map<SelectOption>((variation, _index) => ({
            label: variation.name as string,
            value: variation.identifier as string,
            icon: {
              name: 'full-circle',
              style: {
                color: CFVariationColors[_index]
              }
            }
          }))}
          value={value as SelectOption}
          onChange={async ({ value: _value }) => {
            const newIndex = variations.findIndex(v => v.identifier === _value)

            if (newIndex !== -1 && newIndex !== index) {
              setIndex(newIndex)
            }
          }}
        />
      </Text>
      {isGitSyncModalOpen && (
        <SaveFlagToGitModal
          flagName={feature?.name || ''}
          flagIdentifier={feature?.identifier || ''}
          gitSyncInitialValues={gitSyncInitialValues}
          gitSyncValidationSchema={gitSyncValidationSchema}
          onSubmit={saveVariationChange}
          onClose={() => {
            setIsGitSyncModalOpen(false)
            setIndex(previousSelectedIdentifier.current)
          }}
        />
      )}
    </>
  )
}
