/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, omit, pick } from 'lodash-es'
import {
  Layout,
  NestedAccordionProvider,
  Text,
  PageHeader,
  PageBody,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  useConfirmationDialog,
  ButtonVariation,
  Button
} from '@wings-software/uicore'
import { FontVariation, Color, Intent } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import { parse } from 'yaml'
import type { FormikProps } from 'formik'
import type { PipelineInfoConfig } from 'services/cd-ng'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import {
  useGetTemplateFromPipeline,
  useGetPipeline,
  useCreateInputSetForPipeline,
  useGetInputSetForPipeline,
  useUpdateInputSetForPipeline,
  useSanitiseInputSet,
  ResponseInputSetResponse,
  useGetMergeInputSetFromPipelineTemplateWithListInput,
  ResponsePMSPipelineResponseDTO,
  ResponseInputSetTemplateWithReplacedExpressionsResponse,
  useDeleteInputSetForPipeline
} from 'services/pipeline-ng'

import RbacButton from '@rbac/components/Button/Button'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useToaster } from '@common/exports'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import type { InputSetGitQueryParams, InputSetPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useStrings } from 'framework/strings'
import { AppStoreContext } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { useMutateAsGet, useQueryParams } from '@common/hooks'
import type { GitContextProps } from '@common/components/GitContextForm/GitContextForm'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import type { InputSetDTO, InputSetType } from '@pipeline/utils/types'
import { clearNullUndefined, isInputSetInvalid } from '@pipeline/utils/inputSetUtils'
import { clearRuntimeInput } from '../PipelineStudio/StepUtil'
import GitPopover from '../GitPopover/GitPopover'
import FormikInputSetForm from './FormikInputSetForm'
import { useSaveInputSet } from './useSaveInputSet'
import css from './InputSetForm.module.scss'

const getDefaultInputSet = (
  template: PipelineInfoConfig,
  orgIdentifier: string,
  projectIdentifier: string
): InputSetDTO => ({
  name: '',
  identifier: '',
  description: undefined,
  orgIdentifier,
  projectIdentifier,
  pipeline: template,
  repo: '',
  branch: ''
})

export interface InputSetFormProps {
  executionView?: boolean
}

const getInputSet = (
  orgIdentifier: string,
  projectIdentifier: string,
  inputSetResponse: ResponseInputSetResponse | null,
  template: ResponseInputSetTemplateWithReplacedExpressionsResponse | null,
  mergeTemplate?: string,
  isGitSyncEnabled = false
): InputSetDTO | InputSetType => {
  if (inputSetResponse?.data) {
    const inputSetObj = inputSetResponse?.data

    const parsedInputSetObj = parse(defaultTo(inputSetObj?.inputSetYaml, ''))
    /*
      Context of the below if block
      We need to populate existing values of input set in the form.
      The values are to be filled come from 'merge' API i.e. mergeTemplate object
      But if the merge API fails (due to invalid input set or any other reason) - we populate the value from the input set response recevied (parsedInputSetObj).
    */
    const parsedPipelineWithValues = mergeTemplate
      ? defaultTo(parse(defaultTo(mergeTemplate, ''))?.pipeline, {})
      : parsedInputSetObj?.inputSet?.pipeline

    if (isGitSyncEnabled && parsedInputSetObj && parsedInputSetObj.inputSet) {
      return {
        name: parsedInputSetObj.inputSet.name,
        tags: parsedInputSetObj.inputSet.tags,
        identifier: parsedInputSetObj.inputSet.identifier,
        description: parsedInputSetObj.inputSet.description,
        orgIdentifier: parsedInputSetObj.inputSet.orgIdentifier,
        projectIdentifier: parsedInputSetObj.inputSet.projectIdentifier,
        pipeline: clearRuntimeInput(parsedPipelineWithValues),
        gitDetails: defaultTo(inputSetObj.gitDetails, {}),
        entityValidityDetails: defaultTo(inputSetObj.entityValidityDetails, {}),
        outdated: inputSetObj.outdated
      }
    }
    return {
      name: inputSetObj.name,
      tags: inputSetObj.tags,
      identifier: defaultTo(inputSetObj.identifier, ''),
      description: inputSetObj?.description,
      orgIdentifier,
      projectIdentifier,
      pipeline: clearRuntimeInput(parsedPipelineWithValues),
      gitDetails: defaultTo(inputSetObj.gitDetails, {}),
      entityValidityDetails: defaultTo(inputSetObj.entityValidityDetails, {}),
      outdated: inputSetObj.outdated
    }
  }
  return getDefaultInputSet(
    clearRuntimeInput(parse(defaultTo(template?.data?.inputSetTemplateYaml, ''))?.pipeline),
    orgIdentifier,
    projectIdentifier
  )
}

export function InputSetForm(props: InputSetFormProps): React.ReactElement {
  const { executionView } = props
  const { getString } = useStrings()
  const history = useHistory()
  const [isEdit, setIsEdit] = React.useState(false)
  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier, inputSetIdentifier, module } = useParams<
    PipelineType<InputSetPathProps> & { accountId: string }
  >()
  const { repoIdentifier, branch, inputSetRepoIdentifier, inputSetBranch } = useQueryParams<InputSetGitQueryParams>()
  const { isGitSyncEnabled } = React.useContext(AppStoreContext)
  const [inputSetUpdateResponse, setInputSetUpdateResponse] = React.useState<ResponseInputSetResponse>()
  const {
    refetch: refetchTemplate,
    data: template,
    loading: loadingTemplate
  } = useMutateAsGet(useGetTemplateFromPipeline, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    },
    body: {
      stageIdentifiers: []
    },
    lazy: true
  })

  const [selectedView, setSelectedView] = React.useState<SelectedView>(SelectedView.VISUAL)
  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const [formErrors, setFormErrors] = React.useState<Record<string, any>>({})
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  const {
    data: inputSetResponse,
    refetch,
    loading: loadingInputSet
  } = useGetInputSetForPipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier,
      repoIdentifier: inputSetRepoIdentifier,
      branch: inputSetBranch
    },
    inputSetIdentifier: defaultTo(inputSetIdentifier, ''),
    lazy: true
  })

  const { mutate: deleteInputSet, loading: loadingDeleteInputSet } = useDeleteInputSetForPipeline({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier, pipelineIdentifier }
  })

  const [mergeTemplate, setMergeTemplate] = React.useState<string>()
  const { mutate: mergeInputSet, loading: loadingMerge } = useGetMergeInputSetFromPipelineTemplateWithListInput({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      pipelineIdentifier,
      pipelineRepoID: repoIdentifier,
      pipelineBranch: branch,
      repoIdentifier: inputSetRepoIdentifier,
      branch: inputSetBranch
    }
  })

  const { mutate: createInputSet, loading: createInputSetLoading } = useCreateInputSetForPipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier,
      pipelineRepoID: repoIdentifier,
      pipelineBranch: branch
    },
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })
  const { mutate: updateInputSet, loading: updateInputSetLoading } = useUpdateInputSetForPipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier,
      pipelineRepoID: repoIdentifier,
      pipelineBranch: branch
    },
    inputSetIdentifier: '',
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const { mutate: sanitiseInputSet, loading: sanitiseInputSetLoading } = useSanitiseInputSet({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier,
      pipelineRepoID: repoIdentifier,
      pipelineBranch: branch
    },
    inputSetIdentifier: '',
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const {
    data: pipeline,
    loading: loadingPipeline,
    refetch: refetchPipeline
  } = useGetPipeline({
    pipelineIdentifier,
    lazy: true,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch,
      getTemplatesResolvedPipeline: true
    }
  })

  const { handleSubmit } = useSaveInputSet({ createInputSet, updateInputSet, inputSetResponse, isEdit, setFormErrors })

  const inputSet: InputSetDTO | InputSetType = React.useMemo(() => {
    if (inputSetUpdateResponse) {
      return getInputSet(
        orgIdentifier,
        projectIdentifier,
        inputSetUpdateResponse,
        template,
        mergeTemplate,
        isGitSyncEnabled
      )
    }
    return getInputSet(orgIdentifier, projectIdentifier, inputSetResponse, template, mergeTemplate, isGitSyncEnabled)
  }, [
    mergeTemplate,
    inputSetResponse?.data,
    template?.data?.inputSetTemplateYaml,
    isGitSyncEnabled,
    inputSetUpdateResponse
  ])

  const [disableVisualView, setDisableVisualView] = React.useState(inputSet.entityValidityDetails?.valid === false)

  const formikRef = React.useRef<FormikProps<InputSetDTO & GitContextProps>>()

  const [canUpdateInputSet] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineIdentifier
      },
      permissions: [PermissionIdentifier.EDIT_PIPELINE]
    },
    [accountId, orgIdentifier, projectIdentifier, pipelineIdentifier]
  )

  const goToInputSetList = () => {
    const route = routes.toInputSetList({
      orgIdentifier,
      projectIdentifier,
      accountId,
      pipelineIdentifier,
      module,
      branch: pipeline?.data?.gitDetails?.branch,
      repoIdentifier: pipeline?.data?.gitDetails?.repoIdentifier
    })
    history.push(route)
  }

  const { openDialog: openDeleteInputSetModal } = useConfirmationDialog({
    contentText: getString('pipeline.inputSets.invalidInputSet2'),
    titleText: getString('pipeline.inputSets.invalidInputSet'),
    customButtons: (
      <>
        <RbacButton
          text={getString('pipeline.inputSets.deleteInputSet')}
          intent="danger"
          disabled={!canUpdateInputSet}
          onClick={async () => {
            const gitParams = inputSet?.gitDetails?.objectId
              ? {
                  ...pick(inputSet?.gitDetails, ['branch', 'repoIdentifier', 'filePath', 'rootFolder']),
                  lastObjectId: inputSet?.gitDetails?.objectId
                }
              : {}
            await deleteInputSet(defaultTo(inputSet?.identifier, ''), {
              queryParams: {
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier,
                pipelineIdentifier: defaultTo(inputSet?.pipeline?.identifier, ''),
                ...gitParams
              },
              headers: { 'content-type': 'application/json' }
            })
            goToInputSetList()
          }}
        />
        <Button
          variation={ButtonVariation.TERTIARY}
          text={getString('pipeline.inputSets.goBackToInputSetList')}
          onClick={goToInputSetList}
        />
      </>
    ),
    intent: Intent.DANGER,
    showCloseButton: false,
    canEscapeKeyClose: false,
    canOutsideClickClose: false
  })

  const { openDialog: openInvalidFieldsModal, closeDialog: closeInvalidFieldsModal } = useConfirmationDialog({
    contentText: getString('pipeline.inputSets.invalidInputSet1'),
    titleText: getString('pipeline.inputSets.invalidFields'),
    customButtons: (
      <>
        <RbacButton
          text={getString('pipeline.inputSets.removeInvalidFields')}
          intent="danger"
          disabled={!canUpdateInputSet}
          onClick={async () => {
            const inputSett = omit(inputSet, 'gitDetails', 'entityValidityDetails', 'outdated')
            const gitParams = inputSet?.gitDetails?.objectId
              ? {
                  ...pick(inputSet?.gitDetails, ['branch', 'repoIdentifier', 'filePath', 'rootFolder']),
                  lastObjectId: inputSet?.gitDetails?.objectId,
                  pipelineRepoID: repoIdentifier,
                  pipelineBranch: branch
                }
              : {}
            const response = await sanitiseInputSet(yamlStringify({ inputSet: clearNullUndefined(inputSett) }), {
              pathParams: {
                inputSetIdentifier
              },
              queryParams: {
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier,
                pipelineIdentifier,
                ...gitParams
              }
            })
            closeInvalidFieldsModal()
            if (response?.data?.shouldDeleteInputSet) {
              openDeleteInputSetModal()
            } else {
              setInputSetUpdateResponse({
                data: {
                  ...response?.data?.inputSetUpdateResponse,
                  inputSetYaml: response?.data?.inputSetUpdateResponse?.inputSetYaml
                }
              })
            }
          }}
        />
        <Button
          variation={ButtonVariation.TERTIARY}
          text={getString('pipeline.inputSets.editInYamlView')}
          onClick={() => closeInvalidFieldsModal()}
        />
      </>
    ),
    intent: Intent.DANGER
  })

  React.useEffect(() => {
    if (isInputSetInvalid(inputSet) || selectedView === SelectedView.YAML) {
      setSelectedView(SelectedView.YAML)
    } else {
      setSelectedView(SelectedView.VISUAL)
    }
  }, [inputSet, inputSet.entityValidityDetails?.valid])

  React.useEffect(() => {
    if (inputSet.entityValidityDetails?.valid === false) {
      setDisableVisualView(true)
    } else {
      setDisableVisualView(false)
    }
  }, [inputSet.entityValidityDetails?.valid])

  React.useEffect(() => {
    if (inputSetIdentifier !== '-1') {
      setIsEdit(true)
      refetch({ pathParams: { inputSetIdentifier: inputSetIdentifier } })
      refetchTemplate()
      refetchPipeline()
    } else {
      refetchTemplate()
      refetchPipeline()

      setIsEdit(false)
    }
  }, [inputSetIdentifier])
  React.useEffect(() => {
    if (!loadingInputSet && inputSetResponse && !isInputSetInvalid(inputSet)) {
      // Merge only if inputset is valid
      mergeInputSet({ inputSetReferences: [inputSetIdentifier] })
        .then(response => {
          setMergeTemplate(response.data?.pipelineYaml)
        })
        .catch(e => {
          setMergeTemplate(undefined)
          showError(getRBACErrorMessage(e), undefined, 'pipeline.get.template')
        })
    }
  }, [inputSetIdentifier, loadingInputSet])

  React.useEffect(() => {
    // In inputset is invalid, show modal
    if (!loadingInputSet && inputSetResponse && isInputSetInvalid(inputSet)) {
      openInvalidFieldsModal()
    }
  }, [loadingInputSet])

  useDocumentTitle([
    defaultTo(parse(defaultTo(pipeline?.data?.yamlPipeline, ''))?.pipeline?.name, getString('pipelines')),
    isEdit ? defaultTo(inputSetResponse?.data?.name, '') : getString('inputSets.newInputSetLabel')
  ])

  const handleModeSwitch = React.useCallback(
    (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '')
        const inputSetYamlVisual = parse(yaml).inputSet as InputSetDTO
        if (inputSetYamlVisual) {
          inputSet.name = inputSetYamlVisual.name
          inputSet.identifier = inputSetYamlVisual.identifier
          inputSet.description = inputSetYamlVisual.description
          inputSet.pipeline = inputSetYamlVisual.pipeline

          formikRef.current?.setValues({
            ...omit(inputSet, 'gitDetails', 'entityValidityDetails', 'outdated'),
            repo: defaultTo(repoIdentifier, ''),
            branch: defaultTo(branch, '')
          })
        }
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml, inputSet]
  )

  const child = React.useCallback(
    () => (
      <FormikInputSetForm
        inputSet={inputSet}
        template={template}
        pipeline={pipeline}
        resolvedTemplatesPipelineYaml={pipeline?.data?.resolvedTemplatesPipelineYaml}
        handleSubmit={handleSubmit}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        yamlHandler={yamlHandler}
        setYamlHandler={setYamlHandler}
        formikRef={formikRef}
        selectedView={selectedView}
        executionView={executionView}
        isEdit={isEdit}
        isGitSyncEnabled={isGitSyncEnabled}
      />
    ),
    [
      inputSet,
      template,
      pipeline,
      pipeline?.data?.resolvedTemplatesPipelineYaml,
      handleSubmit,
      formErrors,
      setFormErrors,
      yamlHandler,
      setYamlHandler,
      formikRef,
      selectedView,
      executionView,
      isEdit,
      isGitSyncEnabled,
      sanitiseInputSetLoading
    ]
  )

  return executionView ? (
    child()
  ) : (
    <InputSetFormWrapper
      loading={
        loadingInputSet ||
        loadingPipeline ||
        loadingTemplate ||
        sanitiseInputSetLoading ||
        loadingDeleteInputSet ||
        (!isGitSyncEnabled && (createInputSetLoading || updateInputSetLoading)) ||
        loadingMerge
      }
      isEdit={isEdit}
      selectedView={selectedView}
      handleModeSwitch={handleModeSwitch}
      inputSet={inputSet}
      pipeline={pipeline}
      isGitSyncEnabled={isGitSyncEnabled}
      disableVisualView={disableVisualView}
    >
      {child()}
    </InputSetFormWrapper>
  )
}

export interface InputSetFormWrapperProps {
  isEdit: boolean
  children: React.ReactNode
  selectedView: SelectedView
  loading: boolean
  handleModeSwitch(mode: SelectedView): void
  inputSet: InputSetDTO
  pipeline: ResponsePMSPipelineResponseDTO | null
  isGitSyncEnabled?: boolean
  disableVisualView: boolean
}

export function InputSetFormWrapper(props: InputSetFormWrapperProps): React.ReactElement {
  const {
    isEdit,
    children,
    selectedView,
    handleModeSwitch,
    loading,
    inputSet,
    pipeline,
    isGitSyncEnabled,
    disableVisualView
  } = props
  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier, module } = useParams<
    PipelineType<InputSetPathProps> & { accountId: string }
  >()
  const { getString } = useStrings()

  return (
    <React.Fragment>
      <GitSyncStoreProvider>
        <PageHeader
          className={css.pageHeaderStyles}
          title={
            <Layout.Horizontal width="42%">
              <Text lineClamp={1} color={Color.GREY_800} font={{ weight: 'bold', variation: FontVariation.H4 }}>
                {isEdit
                  ? getString('inputSets.editTitle', { name: inputSet.name })
                  : getString('inputSets.newInputSetLabel')}
              </Text>
              {isGitSyncEnabled && isEdit && (
                <GitPopover
                  data={defaultTo(inputSet.gitDetails, {})}
                  iconProps={{ margin: { left: 'small', top: 'xsmall' } }}
                />
              )}
              <div className={css.optionBtns}>
                <VisualYamlToggle
                  selectedView={selectedView}
                  onChange={nextMode => {
                    handleModeSwitch(nextMode)
                  }}
                  disableToggle={disableVisualView}
                />
              </div>
            </Layout.Horizontal>
          }
          breadcrumbs={
            <NGBreadcrumbs
              links={[
                {
                  url: routes.toPipelines({ orgIdentifier, projectIdentifier, accountId, module }),
                  label: getString('pipelines')
                },
                {
                  url: routes.toInputSetList({
                    orgIdentifier,
                    projectIdentifier,
                    accountId,
                    pipelineIdentifier,
                    module,
                    branch: pipeline?.data?.gitDetails?.branch,
                    repoIdentifier: pipeline?.data?.gitDetails?.repoIdentifier
                  }),
                  label: defaultTo(parse(defaultTo(pipeline?.data?.yamlPipeline, ''))?.pipeline.name, '')
                }
              ]}
            />
          }
        />
      </GitSyncStoreProvider>
      <PageBody loading={loading}>{children}</PageBody>
    </React.Fragment>
  )
}

export function EnhancedInputSetForm(props: InputSetFormProps): React.ReactElement {
  return (
    <NestedAccordionProvider>
      <InputSetForm {...props} />
    </NestedAccordionProvider>
  )
}
