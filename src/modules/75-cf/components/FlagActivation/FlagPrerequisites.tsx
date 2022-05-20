/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { flatMap, get, isEqual } from 'lodash-es'
import * as yup from 'yup'
import {
  Button,
  ButtonSize,
  Container,
  Formik,
  FormikForm as Form,
  FormInput,
  Heading,
  Layout,
  Text
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color, FontVariation } from '@harness/design-system'
import { FieldArray } from 'formik'
import { Divider, Dialog } from '@blueprintjs/core'
import { useToaster } from '@common/exports'
import StringWithTooltip from '@common/components/StringWithTooltip/StringWithTooltip'
import { useStrings } from 'framework/strings'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { PermissionsRequest } from '@rbac/hooks/usePermission'
import {
  Feature,
  GitSyncErrorResponse,
  PatchFeatureQueryParams,
  Prerequisite,
  useGetAllFeatures,
  usePatchFeature,
  Variation
} from 'services/cf'
import { AUTO_COMMIT_MESSAGES } from '@cf/constants/GitSyncConstants'

import { GIT_SYNC_ERROR_CODE, UseGitSync } from '@cf/hooks/useGitSync'
import { useGovernance } from '@cf/hooks/useGovernance'
import usePlanEnforcement from '@cf/hooks/usePlanEnforcement'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import patch from '../../utils/instructions'
import SaveFlagToGitSubForm from '../SaveFlagToGitSubForm/SaveFlagToGitSubForm'
import { PrerequisiteItem } from './FlagPrerequisiteItem'
interface FlagPrerequisitesProps {
  featureFlag: Feature
  gitSync: UseGitSync
  refetchFlag: () => void
  setGovernanceMetadata: (governanceMetadata: any) => void
}

interface PrerequisiteEntry {
  feature: string
  variation: string
}
export const FlagPrerequisites: React.FC<FlagPrerequisitesProps> = props => {
  const { featureFlag, refetchFlag, gitSync, setGovernanceMetadata } = props
  const { showError } = useToaster()
  const { getString } = useStrings()
  const {
    orgIdentifier,
    accountId: accountIdentifier,
    projectIdentifier,
    environmentIdentifier
  } = useParams<Record<string, string>>()
  const [searchTerm, setSearchTerm] = useState<string>()
  const { handleError: handleGovernanceError, isGovernanceError } = useGovernance()
  const gitSyncFormMeta = gitSync?.getGitSyncFormMeta(AUTO_COMMIT_MESSAGES.UPDATES_FLAG_PREREQS)
  const PAGE_SIZE = 500

  const queryParams = useMemo(
    () => ({
      environmentIdentifier: environmentIdentifier !== 'undefined' ? environmentIdentifier : '',
      projectIdentifier,
      accountIdentifier,
      orgIdentifier,
      name: searchTerm,
      pageSize: PAGE_SIZE
    }),
    [accountIdentifier, environmentIdentifier, orgIdentifier, projectIdentifier, searchTerm]
  )
  const {
    data: searchedFeatures,
    loading,
    error,
    refetch: fetchFlags
  } = useGetAllFeatures({
    lazy: true,
    queryParams,
    debounce: 500
  })

  const featureList = useMemo(() => {
    return searchedFeatures?.features?.filter(_feature => _feature.identifier !== featureFlag.identifier) || []
  }, [featureFlag.identifier, searchedFeatures?.features?.filter])

  const [isEditingPrerequisites, setEditingPrerequisites] = useState<boolean>(false)

  const { mutate: patchPrerequisites } = usePatchFeature({
    identifier: featureFlag.identifier as string,
    queryParams: {
      projectIdentifier: featureFlag.project as string,
      environmentIdentifier: featureFlag.envProperties?.environment as string,
      accountIdentifier,
      orgIdentifier
    } as PatchFeatureQueryParams
  })

  const { isPlanEnforcementEnabled } = usePlanEnforcement()

  const handlePrerequisiteInteraction = (action: 'edit' | 'delete', prereq: Prerequisite): void => {
    if (action === 'delete') {
      patch.feature.addInstruction(patch.creators.removePrerequisite(prereq.feature))
      patch.feature.onPatchAvailable(data => {
        patchPrerequisites(data)
          .then(refetchFlag)
          .catch(err => {
            showError(get(err, 'data.message', err?.message), undefined, 'cf.patch.prereq.error')
          })
          .finally(patch.feature.reset)
      })
    } else {
      setEditingPrerequisites(true)
      openModalPrerequisites()
    }
  }

  const [openModalPrerequisites, hideModalPrerequisites] = useModalHook(() => {
    const initialPrereqValues = {
      gitDetails: gitSyncFormMeta?.gitSyncInitialValues.gitDetails,
      autoCommit: gitSyncFormMeta?.gitSyncInitialValues.autoCommit,
      prerequisites: flatMap(featureFlag.prerequisites, ({ feature, variations }) => {
        return variations.map(variation => ({ variation, feature } as PrerequisiteEntry))
      })
    }

    const handleAddPrerequisite = (prereqValues: typeof initialPrereqValues): void => {
      const validPreqs = prereqValues.prerequisites
        .reduce((acc, next) => {
          const prIndex = acc.findIndex(p => p.feature === next.feature)
          if (prIndex === -1) {
            acc.push({ feature: next.feature, variations: [next.variation] })
          } else {
            acc[prIndex].variations.push(next.variation)
          }
          return acc
        }, [] as Prerequisite[])
        .filter(({ feature, variations }) => Boolean(feature.length && variations.filter(x => x?.length).length))
      const prerequisites = validPreqs
        .reduce((acc, prereq) => {
          const { feature, variations } = prereq
          const exists = acc.find(p => p.feature === feature)
          if (exists) {
            exists.variations = exists.variations.concat(variations)
            return acc
          } else {
            return [...acc, prereq]
          }
        }, [] as Prerequisite[])
        .map(p => ({ ...p, variations: p.variations.sort() } as Prerequisite))
        .sort((a, b) => a.feature.localeCompare(b.feature))

      const initialPrerequisites = featureFlag.prerequisites || []
      const removedPrerequisites = initialPrerequisites.filter(pr => !prerequisites.find(p => pr.feature === p.feature))
      const newPrerequisites = prerequisites.filter(p => !initialPrerequisites.find(pr => pr.feature === p.feature))
      const updatedPrerequisites = prerequisites.filter(p =>
        initialPrerequisites.find(pr => pr.feature === p.feature && !isEqual(pr.variations, p.variations))
      )

      const instructions = [
        ...removedPrerequisites.map(p => patch.creators.removePrerequisite(p.feature)),
        ...newPrerequisites.map(patch.creators.addPrerequisite),
        ...updatedPrerequisites.map(patch.creators.updatePrequisite)
      ]

      patch.feature.addAllInstructions(instructions)
      patch.feature
        .onPatchAvailable(data => {
          patchPrerequisites(
            gitSync?.isGitSyncEnabled
              ? {
                  ...data,
                  gitDetails: prereqValues.gitDetails
                }
              : data
          )
            .then(async response => {
              if (!gitSync?.isAutoCommitEnabled && prereqValues?.autoCommit) {
                await gitSync?.handleAutoCommit(prereqValues.autoCommit)
              }

              setGovernanceMetadata(response?.details?.governanceMetadata)
              hideModalPrerequisites()
              refetchFlag()
            })
            .catch(err => {
              if (err.status === GIT_SYNC_ERROR_CODE) {
                gitSync.handleError(err.data as GitSyncErrorResponse)
              } else {
                if (isGovernanceError(err?.data)) {
                  handleGovernanceError(err?.data)
                } else {
                  showError(get(err, 'data.message', err?.message), undefined, 'cf.patch.req.error')
                }
              }
            })
            .finally(() => {
              patch.feature.reset()
            })
        })
        .onEmptyPatch(hideModalPrerequisites)
    }
    const title = isEditingPrerequisites
      ? getString('cf.addPrerequisites.editPrerequisitesHeading')
      : getString('cf.addPrerequisites.addPrerequisitesHeading')
    const updateSelect = (e: React.FormEvent<HTMLInputElement>): void => {
      const _searchTerm = (e?.target as HTMLInputElement)?.value || ''
      if (_searchTerm && _searchTerm !== searchTerm) {
        setSearchTerm(_searchTerm)
        fetchFlags({ queryParams: { ...queryParams, name: _searchTerm } })
      } else {
        fetchFlags()
      }
    }
    const updateSelectFromVariation = (entry: PrerequisiteEntry): void => {
      setSearchTerm(entry.feature)
      fetchFlags({ queryParams: { ...queryParams, name: entry.feature } })
    }

    return (
      <Dialog enforceFocus={false} title="" onClose={hideModalPrerequisites} isOpen={true}>
        <Layout.Vertical padding={{ left: 'large', right: 'medium' }} data-testid="flag-prerequisite-modal">
          <Heading level={3} font={{ variation: FontVariation.H3 }} margin={{ bottom: 'xlarge' }}>
            {title}
          </Heading>
          <Text margin={{ top: 'medium', bottom: 'xlarge' }}>
            {getString('cf.addPrerequisites.addPrerequisitesDesc')}
          </Text>
          {!loading && !error && (
            <Formik
              enableReinitialize={true}
              initialValues={initialPrereqValues}
              formName="flagPrerequisite"
              onSubmit={handleAddPrerequisite}
              validationSchema={yup.object().shape({
                gitDetails: gitSyncFormMeta?.gitSyncValidationSchema
              })}
            >
              {formikProps => (
                <Form data-testid="prerequisites-form">
                  <FieldArray name="prerequisites">
                    {arrayHelpers => {
                      return (
                        <>
                          {formikProps.values.prerequisites.map((elem, i) => {
                            return (
                              <Layout.Horizontal flex key={`prereq-${i}`}>
                                <div data-testid={`prerequisites-dropdown-${i}`}>
                                  <FormInput.Select
                                    name={`prerequisites.${i}.feature`}
                                    placeholder={getString('cf.addPrerequisites.selectFlag')}
                                    items={
                                      featureList?.map((flag: Feature) => ({
                                        label: flag.name,
                                        value: flag.identifier
                                      })) ||
                                      (formikProps?.values?.prerequisites[i]?.feature
                                        ? [
                                            {
                                              label: formikProps.values.prerequisites[i].feature,
                                              value: formikProps.values.prerequisites[i].feature
                                            }
                                          ]
                                        : [])
                                    }
                                    selectProps={{
                                      inputProps: {
                                        onFocus: updateSelect,
                                        onInput: updateSelect
                                      }
                                    }}
                                  />
                                </div>
                                <div data-testid={`prerequisites-variations-dropdown-${i}`}>
                                  <FormInput.Select
                                    name={`prerequisites.${i}.variation`}
                                    placeholder={getString('cf.addPrerequisites.selectVariation')}
                                    items={
                                      featureList
                                        ?.find(ff => ff.identifier === elem.feature)
                                        ?.variations?.map((v: Variation) => ({
                                          label: v.name?.length ? v.name : v.identifier,
                                          value: v.identifier
                                        })) ||
                                      (formikProps?.values?.prerequisites[i]?.variation
                                        ? [
                                            {
                                              label: formikProps.values.prerequisites[i].variation,
                                              value: formikProps.values.prerequisites[i].variation
                                            }
                                          ]
                                        : [])
                                    }
                                    selectProps={{
                                      inputProps: {
                                        onFocus: () => updateSelectFromVariation(elem)
                                      }
                                    }}
                                  />
                                </div>
                              </Layout.Horizontal>
                            )
                          })}
                          <Button
                            minimal
                            intent="primary"
                            text={getString('cf.shared.prerequisites')}
                            icon="small-plus"
                            data-testid="prerequisites-button"
                            onClick={() => {
                              arrayHelpers.push({ feature: '', variations: [''] })
                            }}
                          />
                        </>
                      )
                    }}
                  </FieldArray>
                  {gitSync?.isGitSyncEnabled && !gitSync?.isAutoCommitEnabled && (
                    <>
                      <Container margin={{ top: 'medium', bottom: 'medium' }}>
                        <Divider />
                      </Container>
                      <SaveFlagToGitSubForm subtitle="Commit Changes" hideNameField />
                    </>
                  )}
                  <Layout.Horizontal padding={{ top: 'large', bottom: 'large' }} spacing="small">
                    <Button
                      text={getString('save')}
                      intent="primary"
                      type="submit"
                      data-testid="save-prequisites-button"
                    />
                    <Button text={getString('cancel')} onClick={hideModalPrerequisites} />
                  </Layout.Horizontal>
                </Form>
              )}
            </Formik>
          )}
        </Layout.Vertical>
      </Dialog>
    )
  }, [featureList, isEditingPrerequisites, gitSync.isGitSyncEnabled, gitSync.isAutoCommitEnabled])

  const rbacPermission: Omit<PermissionsRequest, 'permissions'> & { permission: PermissionIdentifier } = {
    resource: { resourceType: ResourceType.FEATUREFLAG },
    permission: PermissionIdentifier.EDIT_FF_FEATUREFLAG
  }

  const planEnforcementProps = isPlanEnforcementEnabled
    ? {
        featuresProps: {
          featuresRequest: {
            featureNames: [FeatureIdentifier.MAUS]
          }
        }
      }
    : undefined

  return (
    <Layout.Vertical margin={{ bottom: 'medium', top: 'medium' }}>
      <Layout.Vertical margin={{ bottom: 'medium' }}>
        <Heading level={5} font={{ variation: FontVariation.H5 }}>
          <StringWithTooltip stringId="cf.shared.prerequisites" tooltipId="ff_ffPrerequisites_heading" />
        </Heading>
        <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_500}>
          {getString('cf.featureFlags.prerequisitesDesc')}
        </Text>
      </Layout.Vertical>
      {!!featureFlag.prerequisites?.length && (
        <>
          <Layout.Horizontal
            flex={{ justifyContent: 'flex-start' }}
            margin={{ bottom: 'xsmall' }}
            padding="none"
            border={{ bottom: true, color: Color.GREY_300 }}
          >
            <Text width="45%">{getString('flag')}</Text>
            <Text width="45%">{getString('cf.shared.variation')}</Text>
          </Layout.Horizontal>
          {featureFlag.prerequisites.map((prereq, i) => (
            <PrerequisiteItem
              key={i}
              prerequisite={prereq}
              permission={rbacPermission}
              flagArchived={featureFlag?.archived || false}
              handlePrerequisiteInteraction={handlePrerequisiteInteraction}
            />
          ))}
        </>
      )}
      <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
        <RbacButton
          data-testid="add-prerequisites-button"
          minimal
          icon="small-plus"
          size={ButtonSize.SMALL}
          font={{ size: 'small' }}
          style={{ padding: 0 }}
          text={getString('cf.featureFlags.newPrerequisite')}
          onClick={() => {
            setEditingPrerequisites(false)
            openModalPrerequisites()
          }}
          disabled={featureFlag.archived}
          permission={rbacPermission}
          {...planEnforcementProps}
        />
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}
