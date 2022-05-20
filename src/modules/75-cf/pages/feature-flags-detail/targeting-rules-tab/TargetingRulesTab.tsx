/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Card, Container, Formik, FormikForm, Layout } from '@harness/uicore'
import React, { ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { FieldArray, FieldArrayRenderProps } from 'formik'
import FlagToggleSwitch from '@cf/components/EditFlagTabs/FlagToggleSwitch'
import {
  Feature,
  GetAllSegmentsQueryParams,
  GetAllTargetsQueryParams,
  useGetAllSegments,
  useGetAllTargets,
  Variation
} from 'services/cf'
import { FeatureFlagActivationStatus } from '@cf/utils/CFUtils'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'

import usePatchFeatureFlag from './hooks/usePatchFeatureFlag'
import TargetingRulesTabFooter from './components/tab-targeting-footer/TargetingRulesTabFooter'

import FlagEnabledRulesCard from './components/flag-enabled-rules-card/FlagEnabledRulesCard'
import { FormVariationMap, VariationPercentageRollout, TargetingRuleItemType, TargetingRuleItemStatus } from './types'
import useFeatureEnabled from './hooks/useFeatureEnabled'
import DefaultRules from './components/default-rules/DefaultRules'
import useTargetingRulesFormValidation from './hooks/useTargetingRulesFormValidation'
import useTargetingRulesFormData from './hooks/useTargetingRulesFormData'
import css from './TargetingRulesTab.module.scss'
export interface TargetingRulesTabProps {
  featureFlagData: Feature
  refetchFlag: () => Promise<unknown>
  refetchFlagLoading: boolean
}

const TargetingRulesTab = ({
  featureFlagData,
  refetchFlag,
  refetchFlagLoading
}: TargetingRulesTabProps): ReactElement => {
  const { orgIdentifier, accountId: accountIdentifier, projectIdentifier } = useParams<Record<string, string>>()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()

  const debounce = 500

  const queryParams = {
    environmentIdentifier,
    projectIdentifier,
    accountIdentifier,
    orgIdentifier,
    pageSize: 100
  }

  const {
    data: targetsData,
    loading: targetsLoading,
    refetch: refetchTargets
  } = useGetAllTargets({
    queryParams: queryParams as GetAllTargetsQueryParams,
    debounce
  })

  const {
    data: segmentsData,
    loading: segmentsLoading,
    refetch: refetchSegments
  } = useGetAllSegments({
    queryParams: queryParams as GetAllSegmentsQueryParams,
    debounce
  })

  const segments = segmentsData?.segments || []
  const targets = targetsData?.targets || []

  const { initialValues, getNextPriority, variationColorMap } = useTargetingRulesFormData({ featureFlagData, segments })
  const { validate } = useTargetingRulesFormValidation()
  const { saveChanges, loading: patchFeatureLoading } = usePatchFeatureFlag({
    initialValues,
    variations: featureFlagData.variations,
    featureFlagIdentifier: featureFlagData.identifier,
    featureFlagName: featureFlagData.name,
    refetchFlag
  })

  const { featureEnabled } = useFeatureEnabled()
  const disabled = patchFeatureLoading || refetchFlagLoading || targetsLoading || segmentsLoading || !featureEnabled

  const handleRefetchSegments = async (searchTerm: string): Promise<void> =>
    await refetchSegments({
      queryParams: { ...queryParams, identifier: searchTerm, name: searchTerm },
      debounce
    })

  const handleRefetchTargets = async (searchTerm: string): Promise<void> =>
    await refetchTargets({
      queryParams: { ...queryParams, targetIdentifier: searchTerm, targetName: searchTerm },
      debounce
    })

  const handleAddVariation = (
    newVariation: Variation,
    targetingRuleItems: (FormVariationMap | VariationPercentageRollout)[],
    arrayHelpers: FieldArrayRenderProps
  ): void => {
    const priority = getNextPriority(targetingRuleItems)
    const variation: FormVariationMap = {
      status: TargetingRuleItemStatus.ADDED,
      priority: priority,
      type: TargetingRuleItemType.VARIATION,
      variationIdentifier: newVariation.identifier,
      variationName: newVariation.name as string,
      targets: [],
      targetGroups: []
    }

    arrayHelpers.push(variation)
  }

  const handleRemoveVariation = (
    removedVariationIndex: number,
    targetingRuleItems: (FormVariationMap | VariationPercentageRollout)[],
    arrayHelpers: FieldArrayRenderProps
  ): void => {
    const item = targetingRuleItems[removedVariationIndex] as FormVariationMap
    const variation: FormVariationMap = {
      ...item,
      status: TargetingRuleItemStatus.DELETED
    }
    arrayHelpers.replace(removedVariationIndex, variation)
  }

  const handleAddPercentageRollout = (
    targetingRuleItems: (FormVariationMap | VariationPercentageRollout)[],
    arrayHelpers: FieldArrayRenderProps
  ): void => {
    // need to add with empty fields so the validation messages appear correctly
    const priority = getNextPriority(targetingRuleItems)
    const newPercentageRollout: VariationPercentageRollout = {
      status: TargetingRuleItemStatus.ADDED,
      ruleId: uuid(),
      priority: priority,
      type: TargetingRuleItemType.PERCENTAGE_ROLLOUT,
      bucketBy: 'identifier',
      clauses: [
        {
          attribute: '',
          id: '',
          negate: false,
          op: '',
          values: ['']
        }
      ],
      variations: featureFlagData.variations.map(variation => ({
        variation: variation.identifier,
        weight: 0
      }))
    }
    arrayHelpers.push(newPercentageRollout)
  }

  const handleRemovePercentageRollout = (
    removedPercentageRolloutIndex: number,
    targetingRuleItems: (FormVariationMap | VariationPercentageRollout)[],
    arrayHelpers: FieldArrayRenderProps
  ): void => {
    const item = targetingRuleItems[removedPercentageRolloutIndex] as VariationPercentageRollout

    const variation: VariationPercentageRollout = {
      ...item,
      status: TargetingRuleItemStatus.DELETED
    }
    arrayHelpers.replace(removedPercentageRolloutIndex, variation)
  }

  return (
    <Formik
      enableReinitialize={true}
      validateOnChange={false}
      validateOnBlur={false}
      formName="targeting-rules-form"
      initialValues={initialValues}
      validate={values => validate(values)}
      onSubmit={values => {
        saveChanges(values)
      }}
    >
      {formikProps => (
        <FormikForm data-testid="targeting-rules-tab-form" disabled={disabled}>
          <Container className={css.tabContainer}>
            <Layout.Vertical
              spacing="small"
              padding={{ left: 'xlarge', right: 'xlarge', bottom: 'xlarge' }}
              className={css.flagRulesSection}
            >
              <Card elevation={0}>
                <FlagToggleSwitch
                  disabled={disabled}
                  currentState={formikProps.values.state}
                  currentEnvironmentState={featureFlagData.envProperties?.state}
                  handleToggle={() =>
                    formikProps.setFieldValue(
                      'state',
                      formikProps.values.state === FeatureFlagActivationStatus.OFF
                        ? FeatureFlagActivationStatus.ON
                        : FeatureFlagActivationStatus.OFF
                    )
                  }
                />
              </Card>
              <FieldArray
                name="targetingRuleItems"
                render={arrayHelpers => (
                  <FlagEnabledRulesCard
                    variationColorMap={variationColorMap}
                    targetingRuleItems={formikProps.values.targetingRuleItems}
                    targets={targets}
                    segments={segments}
                    featureFlagVariations={featureFlagData.variations}
                    disabled={disabled}
                    refetchSegments={handleRefetchSegments}
                    refetchTargets={handleRefetchTargets}
                    addVariation={newVariation =>
                      handleAddVariation(newVariation, formikProps.values.targetingRuleItems, arrayHelpers)
                    }
                    removeVariation={removedVariationIndex =>
                      handleRemoveVariation(removedVariationIndex, formikProps.values.targetingRuleItems, arrayHelpers)
                    }
                    addPercentageRollout={() =>
                      handleAddPercentageRollout(formikProps.values.targetingRuleItems, arrayHelpers)
                    }
                    removePercentageRollout={removedPercentageRolloutIndex =>
                      handleRemovePercentageRollout(
                        removedPercentageRolloutIndex,
                        formikProps.values.targetingRuleItems,
                        arrayHelpers
                      )
                    }
                  />
                )}
              />

              <Card>
                <DefaultRules
                  hideSubheading
                  featureFlagVariations={featureFlagData.variations}
                  titleStringId="cf.featureFlags.rules.whenFlagDisabled"
                  inputName="offVariation"
                />
              </Card>
            </Layout.Vertical>

            {formikProps.dirty && (
              <TargetingRulesTabFooter
                isLoading={disabled}
                handleSubmit={formikProps.handleSubmit}
                handleCancel={formikProps.handleReset}
              />
            )}
          </Container>
        </FormikForm>
      )}
    </Formik>
  )
}

export default TargetingRulesTab
