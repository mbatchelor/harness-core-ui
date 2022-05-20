/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, FlexExpander, Heading, Layout, Text, PageError, useToaster } from '@wings-software/uicore'
import type { HeadingProps } from '@wings-software/uicore/dist/components/Heading/Heading'
import { useStrings } from 'framework/strings'
import { useGovernance } from '@cf/hooks/useGovernance'
import {
  GitSyncErrorResponse,
  SegmentFlag,
  SegmentFlagsResponseResponse,
  useGetSegmentFlags,
  usePatchFeature
} from 'services/cf'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { getErrorMessage, EntityAddingMode } from '@cf/utils/CFUtils'
import {
  SelectedFeatureFlag,
  SelectFeatureFlagsModalButton
} from '@cf/components/SelectFeatureFlagsModalButton/SelectFeatureFlagsModalButton'
import { ItemContainer, ItemContainerProps } from '@cf/components/ItemContainer/ItemContainer'
import { NoDataFoundRow } from '@cf/components/NoDataFoundRow/NoDataFoundRow'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'

import SaveFlagToGitModal from '@cf/components/SaveFlagToGitModal/SaveFlagToGitModal'
import { AUTO_COMMIT_MESSAGES } from '@cf/constants/GitSyncConstants'
import { GitSyncFormValues, GIT_SYNC_ERROR_CODE, UseGitSync } from '@cf/hooks/useGitSync'
import usePlanEnforcement from '@cf/hooks/usePlanEnforcement'
import { DetailHeading } from '../DetailHeading'
import FlagItemOptionsMenuButton from './flag-item-options-menu-button/FlagItemOptionsMenuButton'

interface FlagsUseSegmentProps {
  gitSync: UseGitSync
}

export const FlagsUseSegment = ({ gitSync }: FlagsUseSegmentProps): ReactElement => {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const {
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    segmentIdentifier
  } = useParams<Record<string, string>>()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()
  const { handleError: handleGovernanceError, isGovernanceError } = useGovernance()

  const queryParams = {
    accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    environmentIdentifier
  }
  const {
    loading,
    error,
    data: flags,
    refetch: refetchFlags
  } = useGetSegmentFlags({
    identifier: segmentIdentifier,
    queryParams
  })
  const { mutate: patchFeature } = usePatchFeature({
    identifier: '',
    queryParams
  })

  const addSegmentToFlags = async (
    selectedFeatureFlags: SelectedFeatureFlag[],
    gitFormValues?: GitSyncFormValues
  ): Promise<void> => {
    // Note: Due to https://harness.atlassian.net/browse/FFM-713 not done, we make
    // multiple patch APIs instead of single one

    return await Promise.all(
      selectedFeatureFlags.map(({ feature, variationIdentifier }) => {
        const patchInstruction = {
          instructions: [
            {
              kind: 'addSegmentToVariationTargetMap',
              parameters: { variation: variationIdentifier, targetSegments: [segmentIdentifier] }
            }
          ]
        }

        return patchFeature(
          gitFormValues ? { ...patchInstruction, gitDetails: gitFormValues.gitDetails } : patchInstruction,
          {
            pathParams: { identifier: feature.identifier }
          }
        )
      })
    )
      .then(async responses => {
        responses.forEach(response => {
          if (isGovernanceError(response)) {
            handleGovernanceError(response)
          }
        })
        if (gitFormValues?.autoCommit) {
          await gitSync.handleAutoCommit(gitFormValues?.autoCommit)
        }
        refetchFlags()
      })
      .catch(e => {
        if (e.status === GIT_SYNC_ERROR_CODE) {
          gitSync.handleError(e.data as GitSyncErrorResponse)
        } else {
          if (isGovernanceError(e?.data)) {
            handleGovernanceError(e.data)
          } else {
            showError(getErrorMessage(e), undefined, 'cf.path.feature.error')
          }
        }
      })
  }

  const removeRules = async (
    featureFlagIdentifier: string,
    instruction: string,
    variationIdentifier?: string,
    ruleId?: string,
    gitSyncFormValues?: GitSyncFormValues
  ): Promise<void> => {
    let gitDetails
    if (gitSync) {
      const { gitSyncInitialValues } = gitSync.getGitSyncFormMeta(AUTO_COMMIT_MESSAGES.DELETED_FLAG_FROM_SEGMENT)

      if (gitSync.isGitSyncEnabled) {
        if (gitSync.isAutoCommitEnabled) {
          gitDetails = gitSyncInitialValues.gitDetails
        } else {
          gitDetails = gitSyncFormValues?.gitDetails
        }
      }
    }

    const instructions = {
      instructions: [
        {
          kind: instruction,
          parameters: {
            variation: variationIdentifier,
            targetSegments: [segmentIdentifier],
            ruleID: ruleId
          }
        }
      ]
    }

    await patchFeature(gitSync?.isGitSyncEnabled ? { ...instructions, gitDetails } : instructions, {
      pathParams: { identifier: featureFlagIdentifier }
    })
      .then(async () => {
        await refetchFlags()
      })
      .catch(e => {
        if (e.status === GIT_SYNC_ERROR_CODE) {
          gitSync.handleError(e.data as GitSyncErrorResponse)
        } else {
          showError(getErrorMessage(e), undefined, 'cf.path.feature.error')
        }
      })
  }

  return (
    <Container width={480} height="100%" style={{ background: '#F8FAFB', overflow: 'auto', minWidth: '480px' }}>
      <Layout.Horizontal width="100%" height={55} style={{ alignItems: 'baseline' }} padding={{ right: 'small' }}>
        <DetailHeading style={{ paddingBottom: 0 }}>
          {getString(flags?.length ? 'cf.segments.usingSegmentWithCount' : 'cf.segments.usingSegment', {
            count: flags?.length || 0
          })}
        </DetailHeading>
        <FlexExpander />
        <SelectFeatureFlagsModalButton
          text={getString('cf.segmentDetail.addToFlag')}
          minimal
          gitSync={gitSync}
          intent="primary"
          accountIdentifier={accountIdentifier}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
          environmentIdentifier={environmentIdentifier}
          modalTitle={getString('cf.segmentDetail.addSegmentToFlag')}
          submitButtonTitle={getString('add')}
          onSubmit={async (checkedFeatureFlags, gitSyncFormValues) =>
            await addSegmentToFlags(checkedFeatureFlags, gitSyncFormValues)
          }
          shouldDisableItem={feature =>
            (flags?.filter(flag => flag.type === EntityAddingMode.DIRECT) || [])
              .map(flag => flag.identifier)
              .includes(feature.identifier)
          }
        />
      </Layout.Horizontal>
      <Container
        width="100%"
        height="calc(100% - 55px)"
        style={{ overflow: 'auto', padding: '0 var(--spacing-xxlarge) var(--spacing-xxlarge)' }}
      >
        {error && <PageError message={getErrorMessage(error)} onClick={() => refetchFlags()} />}
        {!error && !loading && <FlagsList flags={flags} gitSync={gitSync} onRemoveRule={removeRules} />}
        {loading && <ContainerSpinner />}
      </Container>
    </Container>
  )
}

const SectionHeader: React.FC<HeadingProps> = ({ children, ...props }) => {
  const { getString } = useStrings()
  return (
    <>
      <Heading
        level={3}
        style={{
          color: '#4F5162',
          position: 'sticky',
          top: 0,
          padding: 'var(--spacing-xxlarge) 0 var(--spacing-large)',
          background: 'rgb(248, 250, 251)',
          fontSize: '14px',
          fontWeight: 500
        }}
        {...props}
      >
        {children}
      </Heading>
      <Layout.Horizontal style={{ alignItems: 'center' }} margin={{ bottom: 'small' }} padding={{ left: 'small' }}>
        <Text
          padding={{ left: 'small' }}
          style={{ color: '#4F5162', fontSize: '10px', fontWeight: 'bold', flexGrow: 1 }}
        >
          {getString('cf.shared.flags').toLocaleUpperCase()}
        </Text>
        <Text
          width={150}
          style={{ color: '#4F5162', fontSize: '10px', fontWeight: 'bold' }}
          padding={{ left: 'small' }}
        >
          {getString('cf.shared.variation').toLocaleUpperCase()}
        </Text>
      </Layout.Horizontal>
    </>
  )
}

const FlagsList: React.FC<{
  gitSync: UseGitSync
  flags: SegmentFlagsResponseResponse | null
  onRemoveRule: (
    featureFlagIdentifier: string,
    instruction: string,
    variationIdentifier?: string,
    ruleId?: string,
    gitSyncFormValues?: GitSyncFormValues
  ) => Promise<void>
}> = ({ flags, onRemoveRule, gitSync }) => {
  const { isPlanEnforcementEnabled } = usePlanEnforcement()
  const { getString } = useStrings()
  const directAddedFlags = flags?.filter(flag => flag.type === EntityAddingMode.DIRECT) || []
  const conditionalAddedFlags = flags?.filter(flag => flag.type === EntityAddingMode.CONDITION) || []

  if (!flags?.length) {
    return <NoDataFoundRow message={getString('cf.segmentDetail.noFlagsUseThisSegment')} margin={{ top: 'xxlarge' }} />
  }

  return (
    <>
      {!!directAddedFlags?.length && (
        <>
          <SectionHeader>{getString('cf.segmentDetail.directlyAdded')}</SectionHeader>
          <Layout.Vertical spacing="small" style={{ padding: '1px' }}>
            {directAddedFlags.map(_flag => (
              <FlagItem
                key={_flag.identifier}
                flag={_flag}
                gitSync={gitSync}
                onRemoveRule={onRemoveRule}
                instruction="removeSegmentToVariationTargetMap"
                isPlanEnforcementEnabled={isPlanEnforcementEnabled}
              />
            ))}
          </Layout.Vertical>
        </>
      )}
      {!!conditionalAddedFlags?.length && (
        <>
          <SectionHeader>{getString('cf.segmentDetail.autoAdded')}</SectionHeader>
          <Layout.Vertical spacing="small" style={{ padding: '1px' }}>
            {conditionalAddedFlags.map(_flag => (
              <FlagItem
                key={_flag.identifier}
                flag={_flag}
                gitSync={gitSync}
                onRemoveRule={onRemoveRule}
                instruction="removeRule"
                isPlanEnforcementEnabled={isPlanEnforcementEnabled}
              />
            ))}
          </Layout.Vertical>
        </>
      )}
    </>
  )
}

interface FlagItemProps extends ItemContainerProps {
  gitSync: UseGitSync
  flag: SegmentFlag
  isPlanEnforcementEnabled: boolean
  instruction: string
  onRemoveRule?: (
    featureFlagIdentifier: string,
    instruction: string,
    variationIdentifier?: string,
    ruleId?: string,
    gitSyncFormValues?: GitSyncFormValues
  ) => Promise<void>
}

const FlagItem: React.FC<FlagItemProps> = ({
  gitSync,
  flag,
  onRemoveRule,
  instruction,
  isPlanEnforcementEnabled,
  ...props
}) => {
  const { name, description, variation } = flag
  const { gitSyncInitialValues, gitSyncValidationSchema } = gitSync.getGitSyncFormMeta()

  const variationTextWidth = onRemoveRule ? '88px' : '135px'
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  return (
    <ItemContainer style={{ paddingRight: 'var(--spacing-xsmall)' }} {...props}>
      <Layout.Horizontal spacing="xsmall" style={{ alignItems: 'center' }}>
        <Container style={{ flexGrow: 1 }} padding={{ left: 'xsmall', right: 'small' }}>
          <Text
            margin={{ bottom: description?.length ? 'xsmall' : undefined }}
            style={{ color: '#22222A', fontSize: '12px', fontWeight: 600, lineHeight: '16px' }}
          >
            {name}
          </Text>
          {description && <Text style={{ color: '#22222ac7' }}>{description}</Text>}
        </Container>

        {/* NOTE: flag does not have enough info to render variation icon.
            Only identifier text for now. See: https://harness.atlassian.net/browse/FFM-699 */}
        <Text style={{ minWidth: variationTextWidth, maxWidth: variationTextWidth }}>{variation}</Text>

        {onRemoveRule && (
          <FlagItemOptionsMenuButton
            onClick={() => {
              if (gitSync?.isGitSyncEnabled && !gitSync?.isAutoCommitEnabled) {
                setIsDeleteModalOpen(true)
              } else {
                onRemoveRule(flag.identifier, instruction, variation, flag.ruleId)
              }
            }}
          />
        )}
      </Layout.Horizontal>
      {isDeleteModalOpen && (
        <SaveFlagToGitModal
          flagName={flag.name}
          flagIdentifier={flag.identifier}
          gitSyncInitialValues={gitSyncInitialValues}
          gitSyncValidationSchema={gitSyncValidationSchema}
          onSubmit={formValues => onRemoveRule?.(flag.identifier, instruction, variation, flag.ruleId, formValues)}
          onClose={() => {
            setIsDeleteModalOpen(false)
          }}
        />
      )}
    </ItemContainer>
  )
}
