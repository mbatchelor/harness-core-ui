/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Dispatch, SetStateAction } from 'react'
import { Button, Layout, TableV2, Text } from '@wings-software/uicore'
import { RadioGroup, Radio } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import type { artifactTableItem } from '../../interface/TriggersWizardInterface'
import css from './ArtifactTableInfo.module.scss'

interface ArtifactTableInfoInterface {
  artifactTableData?: any
  selectedArtifact?: any
  selectedArtifactLabel?: string
  artifactType?: string
  selectedStage?: string
  isManifest: boolean
  setSelectedStage?: Dispatch<SetStateAction<any>>
  setSelectedArtifact?: Dispatch<SetStateAction<any>>
  setSelectedArtifactLabel?: Dispatch<SetStateAction<any>>
  formikProps: any
  appliedArtifact?: any
  editArtifact?: () => void
  removeArtifact?: () => void
}

interface RenderColumnSelectColumn {
  selectedArtifactLabel?: string
}

interface RenderColumnArtifactLabelColumn {
  appliedArtifact?: any
}
export interface FormValues {
  artifact?: string
}

export interface RenderColumnRow {
  original: artifactTableItem
}
interface RenderColumnEditColumn {
  editArtifact: () => void
  removeArtifact: () => void
}

const RenderColumnSelect = ({ row, column }: { row: RenderColumnRow; column: RenderColumnSelectColumn }) => {
  const data = row.original
  return (
    <>
      <Layout.Horizontal
        className={data.disabled ? css.disabledRow : ''}
        spacing="small"
        style={{ justifyContent: 'center' }}
      >
        <RadioGroup
          selectedValue={column?.selectedArtifactLabel}
          label=""
          name="artifactLabel"
          onChange={e => e.preventDefault()}
          disabled={data.disabled}
        >
          <Radio value={data.artifactLabel} />
        </RadioGroup>
      </Layout.Horizontal>
    </>
  )
}

// const RenderColumnEdit = ({ row, column }) => {
//   const { values } = column.formikProps
//   const data = row.original
//   return (
//     <>
//       <Layout.Horizontal spacing="small" style={{ justifyContent: 'center' }} >
//         <Button
//           style={{ color: 'var(--primary-7)' }}
//           minimal
//           className={css.actionButton}
//           icon="edit"
//           onClick={e => {

//           }}
//         />
//       </Layout.Horizontal>
//     </>
//   )
// }

const RenderColumnArtifactLabel = ({
  row,
  column
}: {
  row: RenderColumnRow
  column: RenderColumnArtifactLabelColumn
}) => {
  const { appliedArtifact } = column
  const data = row.original
  return (
    <Layout.Horizontal className={data.disabled ? css.disabledRow : ''}>
      <Text width={appliedArtifact ? '296px' : '176px'} lineClamp={1}>
        {data.artifactLabel}
      </Text>
    </Layout.Horizontal>
  )
}
const RenderColumnArtifactRepository = ({ row }: { row: RenderColumnRow }) => {
  const data = row.original
  return (
    <Layout.Horizontal className={data.disabled ? css.disabledRow : ''}>
      <Text width="159px" lineClamp={1}>
        {data.artifactRepository?.includes('account.')
          ? data.artifactRepository.split('.')[1]
          : data.artifactRepository}
      </Text>
    </Layout.Horizontal>
  )
}

const RenderColumnLocation = ({ row }: { row: RenderColumnRow }) => {
  const data = row.original
  return (
    <Layout.Horizontal className={data.disabled ? css.disabledRow : ''}>
      <Text style={{ minHeight: '18px' }} width="110px" lineClamp={1}>
        {data.location}
      </Text>
    </Layout.Horizontal>
  )
}

const RenderColumnBuildTag = ({ row }: { row: RenderColumnRow }) => {
  const data = row.original
  return (
    <Layout.Horizontal spacing="small" className={data.disabled ? css.disabledRow : ''}>
      <Text style={{ minHeight: '18px' }} width="100px" lineClamp={1}>
        {data.buildTag}
      </Text>
    </Layout.Horizontal>
  )
}

const RenderColumnVersion = ({ row }: { row: RenderColumnRow }) => {
  const data = row.original
  return (
    <Layout.Horizontal spacing="small" className={data.disabled ? css.disabledRow : ''}>
      <Text style={{ minHeight: '18px' }} lineClamp={1}>
        {data.version}
      </Text>
    </Layout.Horizontal>
  )
}

const RenderColumnHasRuntimeInputs = ({ row }: { row: RenderColumnRow }) => {
  const data = row.original
  return (
    <Layout.Horizontal spacing="small" className={data.disabled ? css.disabledRow : ''}>
      <Text>{data.hasRuntimeInputs ? 'Yes' : 'No'}</Text>
    </Layout.Horizontal>
  )
}

const RenderColumnEdit = ({ column }: { column: RenderColumnEditColumn }) => {
  return (
    <>
      <Layout.Horizontal spacing="small" style={{ justifyContent: 'center' }}>
        <Button
          // style={{ color: 'var(--primary-7)' }}
          minimal
          data-name="select-artifact-edit"
          // className={css.actionButton}
          icon="edit"
          onClick={() => column.editArtifact()}
        />
        <Button
          style={{ display: 'inline-block' }}
          minimal
          data-name="main-delete"
          icon="main-trash"
          onClick={() => column.removeArtifact()}
        />
      </Layout.Horizontal>
    </>
  )
}

const ArtifactTableInfo = (props: ArtifactTableInfoInterface): JSX.Element => {
  const {
    appliedArtifact,
    setSelectedArtifact,
    selectedArtifactLabel,
    setSelectedArtifactLabel,
    setSelectedStage,
    formikProps,
    isManifest,
    editArtifact,
    artifactTableData,
    removeArtifact
  } = props

  const { getString } = useStrings()
  const artifactOrManifestText = isManifest
    ? getString('manifestsText')
    : getString('pipeline.artifactTriggerConfigPanel.artifact')

  const getTooltipIds = (manifestTooltipIds: string, artifactTooltipIds: string): string => {
    return isManifest ? manifestTooltipIds : artifactTooltipIds
  }

  let newData = appliedArtifact || artifactTableData
  let showUniqueReferenceWarning = ''
  if (artifactTableData) {
    // hide all manifest overrides that are not unique
    const newFilteredData: artifactTableItem[] = []
    artifactTableData.forEach((data: artifactTableItem) => {
      if (
        newFilteredData.some(
          (nfd: artifactTableItem) => data.isStageOverrideManifest && nfd.artifactId === data.artifactId
        )
      ) {
        showUniqueReferenceWarning = getString('pipeline.artifactTriggerConfigPanel.artifactReferenceUnique', {
          artifact: artifactOrManifestText
        })
      } else {
        newFilteredData.push(data)
      }
    })

    newData = newFilteredData
  }

  const showWarning = artifactTableData?.some((data: any) => data.disabled)
  // should render differently for applied or data table
  // remove has runtime input and version when appliedTable
  const columns: any = React.useMemo(
    () => [
      {
        Header: (
          <Text
            inline={true}
            className={css.textHeading}
            tooltipProps={{ dataTooltipId: getTooltipIds('manifestName', 'artifactName') }}
          >
            {artifactOrManifestText?.toUpperCase()}
          </Text>
        ),
        accessor: 'artifactLabel',
        width: appliedArtifact ? '45%' : '25%',
        Cell: RenderColumnArtifactLabel,
        className: 'className',
        class: 'class',
        disableSortBy: !!appliedArtifact,
        appliedArtifact
      },
      {
        Header: (
          <Text
            inline={true}
            className={css.textHeading}
            tooltipProps={{ dataTooltipId: getTooltipIds('manifestRepository', 'artifactRepository') }}
          >
            {getString?.('pipeline.artifactTriggerConfigPanel.artifactRepository', {
              artifact: artifactOrManifestText
            }).toUpperCase()}
          </Text>
        ),
        accessor: 'activity',
        width: '25%',
        Cell: RenderColumnArtifactRepository,
        disableSortBy: true,
        getString
      },
      {
        Header: (
          <Text inline={true} className={css.textHeading} tooltipProps={{ dataTooltipId: 'artifactManifestLocation' }}>
            {getString?.('pipeline.artifactTriggerConfigPanel.locationRepoPath').toUpperCase()}
          </Text>
        ),
        accessor: 'lastExecutionTime',
        width: '18%',
        Cell: RenderColumnLocation,
        disableSortBy: true,
        getString
      }
    ],
    [appliedArtifact, formikProps, getString]
  )

  if (!newData) {
    return <></>
  }

  if (!appliedArtifact) {
    columns.unshift({
      Header: '',
      accessor: 'select',
      width: '5%',
      disableSortBy: true,
      selectedArtifactLabel,
      formikProps,
      Cell: RenderColumnSelect
    })
    // Insert Location when available
    if (isManifest) {
      columns.push({
        Header: (
          <Text inline={true} className={css.textHeading} tooltipProps={{ dataTooltipId: 'manifestHasVersion' }}>
            {getString?.('version').toUpperCase()}
          </Text>
        ),
        accessor: 'version',
        width: '13%',
        Cell: RenderColumnVersion,
        disableSortBy: true
      })
    } else {
      columns.push({
        Header: (
          <Text inline={true} className={css.textHeading} tooltipProps={{ dataTooltipId: 'artifactBuildTag' }}>
            {getString?.('pipeline.artifactTriggerConfigPanel.buildTagArtifactPath').toUpperCase()}
          </Text>
        ),
        accessor: 'buildTag',
        width: '13%',
        Cell: RenderColumnBuildTag,
        disableSortBy: true
      })
    }

    columns.push({
      Header: (
        <Text
          inline={true}
          className={css.textHeading}
          tooltipProps={{ dataTooltipId: 'artifactManifestRuntimeInputs' }}
        >
          {getString?.('pipeline.artifactTriggerConfigPanel.hasRuntimeInputs').toUpperCase()}
        </Text>
      ),
      accessor: 'hasRuntimeInputs',
      width: '18%',
      Cell: RenderColumnHasRuntimeInputs,
      disableSortBy: true
    })
  } else {
    columns.push({
      Header: ' ',
      accessor: 'edit',
      width: '10%',
      disableSortBy: true,
      appliedArtifact,
      formikProps,
      editArtifact,
      removeArtifact,
      Cell: RenderColumnEdit
    })
  }

  return (
    <>
      <TableV2
        className={`${appliedArtifact ? css.appliedArtifact : css.selectArtifactTable}`}
        columns={columns}
        data={Array.isArray(newData) ? newData : [newData]}
        onRowClick={item => {
          if (!item?.disabled) {
            setSelectedArtifact?.(item?.artifactId)
            setSelectedStage?.(item?.stageId)
            setSelectedArtifactLabel?.(item?.artifactLabel)
          }
        }}
      />
      {!appliedArtifact && showWarning && (
        <Text style={{ color: '#FF7B26' }}>
          {getString?.('pipeline.artifactTriggerConfigPanel.chartVersionRuntimeInput', {
            artifact: artifactOrManifestText.toLowerCase(),
            runTimeStr: isManifest
              ? getString('pipeline.manifestType.http.chartVersion')
              : getString('pipeline.artifactTriggerConfigPanel.tagArtifactPath')
          })}
        </Text>
      )}
      {showUniqueReferenceWarning && <Text style={{ color: '#FF7B26' }}>{showUniqueReferenceWarning}</Text>}
    </>
  )
}
export default ArtifactTableInfo
