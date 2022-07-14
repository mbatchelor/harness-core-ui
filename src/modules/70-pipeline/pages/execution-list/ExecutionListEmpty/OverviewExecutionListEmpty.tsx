import React, { ReactNode } from 'react'
import { Text, Container, Layout, ModalDialog } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import cdPipelineIllustration from '@pipeline/pages/pipeline-list/images/cd-pipeline-illustration.svg'
import type { PMSPipelineSummaryResponse } from 'services/pipeline-ng'
import type { UseStringsReturn } from 'framework/strings'
import type { QueryParams } from '../types'
import cdExecutionIllustration from '../images/cd-execution-illustration.svg'
import css from './ExecutionListEmpty.module.scss'

export function OverviewExecutionListEmpty(props: {
  getString: UseStringsReturn['getString']
  canCreatePipeline: boolean
  cta: ReactNode
}): JSX.Element {
  const { getString, canCreatePipeline, cta } = props
  return (
    <ModalDialog
      isOpen={true}
      style={{ width: 610 }}
      enforceFocus={false}
      portalClassName={css.createModalCss}
      usePortal={true}
    >
      <Layout.Horizontal>
        <Layout.Vertical width="40%">
          <Text
            className={css.noPipelineText}
            margin={{ top: 'medium', bottom: 'small' }}
            font={{ weight: 'bold', size: 'medium' }}
            color={Color.GREY_700}
          >
            {canCreatePipeline
              ? getString('pipeline.OverviewEmptyStates.createPipelineHeaderMsg')
              : getString('pipeline.OverviewEmptyStates.runPipelineHeaderMsg')}
          </Text>
          <Text
            margin={{ top: 'xsmall', bottom: 'xlarge' }}
            font={{ variation: FontVariation.BODY }}
            color={Color.GREY_700}
            padding={{ bottom: 'small' }}
          >
            {canCreatePipeline
              ? getString('pipeline.OverviewEmptyStates.createPipelineInfo')
              : getString('pipeline.OverviewEmptyStates.runPipelineInfo')}
          </Text>
          {cta}
        </Layout.Vertical>
        <Container width="50%">
          <img src={canCreatePipeline ? cdPipelineIllustration : cdExecutionIllustration} />
        </Container>
      </Layout.Horizontal>
    </ModalDialog>
  )
}
