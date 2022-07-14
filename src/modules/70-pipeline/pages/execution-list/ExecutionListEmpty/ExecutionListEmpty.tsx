import React, { ReactNode } from 'react'
import { Text, Icon, IconName, Layout, ButtonVariation, Button } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { UseStringsReturn } from 'framework/strings'
import type { Module } from 'framework/types/ModuleName'
import type { StringsMap } from 'stringTypes'
import cdExecutionListIllustration from '../images/cd-execution-illustration.svg'
import ciExecutionListIllustration from '../images/ci-execution-illustration.svg'
import stoExecutionListIllustration from '../images/sto-execution-illustration.svg'
import css from './ExecutionListEmpty.module.scss'

export function ExecutionListEmpty(props: {
  hasFilter: boolean
  resetFilter: () => void
  module: Module
  getString: UseStringsReturn['getString']
  canRunPipeline: boolean
  cta: ReactNode
}): JSX.Element {
  const { hasFilter, module, getString, resetFilter, canRunPipeline, cta } = props

  let icon: IconName
  let illustration: string
  let noDeploymentString: keyof StringsMap
  let aboutDeploymentString: keyof StringsMap

  switch (module) {
    case 'ci':
      icon = 'ci-main'
      illustration = ciExecutionListIllustration
      noDeploymentString = 'pipeline.noBuildsText'
      aboutDeploymentString = 'noBuildsText'
      break

    case 'sto':
      icon = 'sto-color-filled'
      illustration = stoExecutionListIllustration
      noDeploymentString = 'stoSteps.noScansText'
      aboutDeploymentString = 'stoSteps.noScansRunPipelineText'
      break

    default:
      icon = 'cd-main'
      illustration = cdExecutionListIllustration
      noDeploymentString = 'pipeline.noDeploymentText'
      aboutDeploymentString = 'noDeploymentText'
  }

  if (!canRunPipeline) {
    aboutDeploymentString = 'pipeline.noPipelineText'
  }

  return (
    <div className={css.noDeploymentSection}>
      {hasFilter ? (
        <Layout.Vertical spacing="small" flex>
          <Icon size={50} name={icon} margin={{ bottom: 'large' }} />
          <Text
            margin={{ top: 'large', bottom: 'small' }}
            font={{ weight: 'bold', size: 'medium' }}
            color={Color.GREY_800}
          >
            {getString('common.filters.noMatchingFilterData')}
          </Text>
          <Button
            text={getString('common.filters.clearFilters')}
            variation={ButtonVariation.LINK}
            onClick={resetFilter}
          />
        </Layout.Vertical>
      ) : (
        <Layout.Vertical spacing="small" flex={{ justifyContent: 'center', alignItems: 'center' }} width={720}>
          <img src={illustration} className={css.image} />
          <Text className={css.noDeploymentText} margin={{ top: 'medium', bottom: 'small' }}>
            {getString(noDeploymentString)}
          </Text>
          <Text className={css.aboutDeployment} margin={{ top: 'xsmall', bottom: 'xlarge' }}>
            {getString(aboutDeploymentString)}
          </Text>
          {cta}
        </Layout.Vertical>
      )}
    </div>
  )
}
