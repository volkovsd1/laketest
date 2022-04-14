import React, { Fragment, useEffect, useCallback, useState } from 'react'
import { CSSTransition } from 'react-transition-group'
import {
  useHistory,
  useLocation,
  Link,
} from 'react-router-dom'
import { GRAFANA_URL } from '@/utils/config'
import {
  Button, Icon, Intent, Switch,
  FormGroup, ButtonGroup, InputGroup,
  Elevation,
  TextArea,
  Card,
  Popover,
  Tooltip,
  Position,
  Colors,
  Tag
} from '@blueprintjs/core'
import {
  Providers,
  ProviderTypes,
  ProviderIcons
} from '@/data/Providers'
import { integrationsData, pluginsData } from '@/data/integrations'
import usePipelineManager from '@/hooks/usePipelineManager'
import usePipelineValidation from '@/hooks/usePipelineValidation'
import useConnectionManager from '@/hooks/useConnectionManager'
import FormValidationErrors from '@/components/messages/FormValidationErrors'
import PipelineIndicator from '@/components/widgets/PipelineIndicator'
import PipelinePresetsMenu from '@/components/menus/PipelinePresetsMenu'
import PipelineConfigsMenu from '@/components/menus/PipelineConfigsMenu'
import ProviderSettings from '@/components/pipelines/ProviderSettings'
import Nav from '@/components/Nav'
import Sidebar from '@/components/Sidebar'
import AppCrumbs from '@/components/Breadcrumbs'
import Content from '@/components/Content'
// import CodeEditor from '@uiw/react-textarea-code-editor'
import { ReactComponent as HelpIcon } from '@/images/help.svg'
import { ReactComponent as BackArrowIcon } from '@/images/undo.svg'
import RunPipelineIcon from '@/images/duplicate.png'

import GitlabHelpNote from '@/images/help/gitlab-help.png'
import JiraHelpNote from '@/images/help/jira-help.png'
import GithubHelpNote from '@/images/help/github-help.png'

import '@/styles/pipelines.scss'

const CreatePipeline = (props) => {
  const history = useHistory()
  const location = useLocation()
  // const { providerId } = useParams()
  // const [activeProvider, setActiveProvider] = useState(integrationsData[0])
  const [integrations, setIntegrations] = useState([...integrationsData, ...pluginsData])
  const [jiraIntegration, setJiraIntegration] = useState(integrationsData.find(p => p.id === Providers.JIRA))

  const [today, setToday] = useState(new Date())
  const pipelinePrefixes = ['COLLECT', 'SYNC']
  const pipelineSuffixes = [
    today.getTime(), // 1639630123107
    today.toString(), // Wed Dec 15 2021 23:48:43 GMT-0500 (EST)
    today.toISOString(), // 2021-12-16T04:48:43.107Z
    // eslint-disable-next-line max-len
    `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}${today.getHours()}${today.getMinutes()}${today.getSeconds()}`, // 202112154936
    today.toUTCString(), // Thu, 16 Dec 2021 04:49:52 GMT
  ]

  const [readyProviders, setReadyProviders] = useState([])
  const [advancedMode, setAdvancedMode] = useState(false)

  const [enabledProviders, setEnabledProviders] = useState([])
  const [runTasks, setRunTasks] = useState([])
  const [runTasksAdvanced, setRunTasksAdvanced] = useState([])
  const [existingTasks, setExistingTasks] = useState([])
  const [rawConfiguration, setRawConfiguration] = useState(JSON.stringify([runTasks], null, '  '))
  const [isValidConfiguration, setIsValidConfiguration] = useState(false)
  const [validationError, setValidationError] = useState()

  const [namePrefix, setNamePrefix] = useState(pipelinePrefixes[0])
  const [nameSuffix, setNameSuffix] = useState(pipelineSuffixes[0])
  const [pipelineName, setPipelineName] = useState(`${namePrefix} ${nameSuffix}`)
  const [projectId, setProjectId] = useState([])
  const [boardId, setBoardId] = useState([])
  const [sourceId, setSourceId] = useState('')
  const [sources, setSources] = useState([])
  const [selectedSource, setSelectedSource] = useState()
  const [repositoryName, setRepositoryName] = useState('')
  const [owner, setOwner] = useState('')
  const [gitExtractorUrl, setGitExtractorUrl] = useState('')
  const [gitExtractorRepoId, setGitExtractorRepoId] = useState('')
  const [refDiffRepoId, setRefDiffRepoId] = useState('')
  const [refDiffPairs, setRefDiffPairs] = useState([])
  const [refDiffTasks, setRefDiffTasks] = useState(['calculateCommitsDiff', 'calculateIssuesDiff'])

  const [autoRedirect, setAutoRedirect] = useState(true)
  const [restartDetected, setRestartDetected] = useState(false)

  const {
    runPipeline,
    cancelPipeline,
    fetchPipeline,
    pipelineRun,
    buildPipelineStages,
    isRunning,
    errors: pipelineErrors,
    setSettings: setPipelineSettings,
    lastRunId
  } = usePipelineManager(pipelineName, runTasks)

  const {
    validate,
    validateAdvanced,
    errors: validationErrors,
    setErrors: setPipelineErrors,
    isValid: isValidPipelineForm,
    detectedProviders
  } = usePipelineValidation({
    enabledProviders,
    pipelineName,
    projectId,
    boardId,
    owner,
    repositoryName,
    sourceId,
    gitExtractorUrl,
    gitExtractorRepoId,
    refDiffRepoId,
    refDiffTasks,
    refDiffPairs,
    tasks: runTasks,
    tasksAdvanced: runTasksAdvanced,
    advancedMode
  })

  const {
    allConnections,
    isFetching: isFetchingConnections,
    fetchAllConnections,
    getConnectionName
  } = useConnectionManager({
    activeProvider: jiraIntegration
  })

  useEffect(() => {
    [...integrationsData, ...pluginsData].forEach((i, idx) => {
      setTimeout(() => {
        setReadyProviders(r => [...r, i.id])
      }, idx * 50)
    })
  }, [])

  const isProviderEnabled = (providerId) => {
    return enabledProviders.includes(providerId)
  }

  const isValidPipeline = () => {
    if (advancedMode) { return isValidAdvancedPipeline() }
    return enabledProviders.length >= 1 &&
      pipelineName !== '' &&
      pipelineName.length > 2 &&
      validationErrors.length === 0
  }

  const isValidAdvancedPipeline = () => {
    return pipelineName !== '' &&
    pipelineName.length > 2 &&
    validationErrors.length === 0 &&
    isValidConfiguration
  }

  const isMultiStagePipeline = (tasks = []) => {
    return tasks.length > 1 && Array.isArray(tasks[0])
  }

  const getManyProviderOptions = useCallback((providerId, optionProperty, ids, options = {}) => {
    return ids.map(id => {
      return {
        Plugin: providerId,
        Options: {
          [optionProperty]: parseInt(id, 10),
          ...options
        }
      }
    })
  }, [])

  const getProviderOptions = useCallback((providerId) => {
    let options = {}
    switch (providerId) {
      case Providers.JENKINS:
        // NO OPTIONS for Jenkins!
        break
      case Providers.JIRA:
        options = {
          boardId: parseInt(boardId, 10),
          sourceId: parseInt(sourceId, 10)
        }
        break
      case Providers.GITHUB:
        options = {
          repo: repositoryName,
          owner
        }
        break
      case Providers.GITLAB:
        options = {
          projectId: parseInt(projectId, 10)
        }
        break
      case Providers.GITEXTRACTOR:
        options = {
          url: gitExtractorUrl,
          repoId: gitExtractorRepoId
        }
        break
      case Providers.REFDIFF:
        options = {
          repoId: refDiffRepoId,
          pairs: refDiffPairs,
          tasks: refDiffTasks,
        }
        break
      default:
        break
    }
    return options
  }, [boardId,
    owner,
    projectId,
    repositoryName,
    sourceId,
    gitExtractorUrl,
    gitExtractorRepoId,
    refDiffRepoId,
    refDiffTasks,
    refDiffPairs
  ])

  const configureProvider = useCallback((providerId) => {
    let providerConfig = {}
    switch (providerId) {
      case Providers.GITLAB:
        providerConfig = getManyProviderOptions(providerId, 'projectId', [...projectId])
        break
      case Providers.JIRA:
        providerConfig = getManyProviderOptions(
          providerId,
          'boardId',
          [...boardId],
          {
            sourceId: parseInt(sourceId, 10)
          }
        )
        break
      default:
        providerConfig = {
          Plugin: providerId,
          Options: {
            ...getProviderOptions(providerId)
          }
        }
        break
    }
    return providerConfig
  }, [getProviderOptions, getManyProviderOptions, projectId, boardId, sourceId])

  const resetPipelineName = () => {
    setToday(new Date())
    setPipelineName(`${namePrefix} ${nameSuffix}`)
  }

  const resetConfiguration = () => {
    window.history.replaceState(null, '')
    resetPipelineName()
    setExistingTasks([])
    setEnabledProviders([])
    setProjectId([])
    setBoardId([])
    setSelectedSource(null)
    setRepositoryName('')
    setOwner('')
    setGitExtractorUrl('')
    setGitExtractorRepoId('')
    setRefDiffRepoId('')
    setRefDiffTasks([])
    setRefDiffPairs([])
    setAdvancedMode(false)
    setRawConfiguration('[[]]')
  }

  const parseJSON = (jsonString = '') => {
    try {
      return JSON.parse(jsonString)
    } catch (e) {
      console.log('>> PARSE JSON ERROR!', e)
      setValidationError(e.message)
      setPipelineErrors(errs => [...errs, e.message])
      // ToastNotification.show({ message: e.message, intent: 'danger', icon: 'error' })
    }
  }

  const formatRawCode = () => {
    try {
      setRawConfiguration(config => {
        const parsedConfig = parseJSON(config)
        const formattedConfig = JSON.stringify(parsedConfig, null, '  ')
        return formattedConfig || config
      })
    } catch (e) {
      console.log('>> FORMAT CODE: Invalid Code Format!')
    }
  }

  const isValidCode = useCallback(() => {
    let isValid = false
    try {
      const parsedCode = parseJSON(rawConfiguration)
      isValid = parsedCode
      // setValidationError(null)
    } catch (e) {
      console.log('>> FORMAT CODE: Invalid Code Format!', e)
      setValidationError(e.message)
    }
    setIsValidConfiguration(isValid)
    return isValid
  }, [rawConfiguration])

  useEffect(() => {

  }, [pipelineName])

  useEffect(() => {
    console.log('>> PIPELINE RUN TASK SETTINGS FOR PIPELINE MANAGER ....', runTasks)
    setPipelineSettings({
      name: pipelineName,
      tasks: advancedMode ? runTasksAdvanced : [[...runTasks]]
    })
    // setRawConfiguration(JSON.stringify(buildPipelineStages(runTasks, true), null, '  '))
    if (advancedMode) {
      validateAdvanced()
    } else {
      validate()
    }
  }, [advancedMode, runTasks, runTasksAdvanced, pipelineName, setPipelineSettings, validate, validateAdvanced])

  useEffect(() => {
    console.log('>> ENBALED PROVIDERS = ', enabledProviders)
    const PipelineTasks = enabledProviders.map(p => configureProvider(p))
    setRunTasks(PipelineTasks.flat())
    console.log('>> CONFIGURED PIPELINE TASKS = ', PipelineTasks)
    validate()
    if (enabledProviders.includes(Providers.JIRA)) {
      fetchAllConnections(false)
    } else {
      setSources([])
      setSelectedSource(null)
    }
  }, [
    enabledProviders,
    projectId,
    boardId, sourceId,
    owner, repositoryName,
    configureProvider,
    validate,
    fetchAllConnections,
    buildPipelineStages
  ])

  useEffect(() => {
    console.log('>> PIPELINE LAST RUN OBJECT CHANGED!!...', pipelineRun)
    if (pipelineRun.ID && autoRedirect) {
      history.push(`/pipelines/activity/${pipelineRun.ID}`)
    }
  }, [pipelineRun, autoRedirect, history])

  useEffect(() => {
    console.log(namePrefix, nameSuffix)
    setPipelineName(`${namePrefix} ${nameSuffix}`)
    setToday(new Date())
  }, [namePrefix, nameSuffix])

  useEffect(() => {
    console.log('>> JIRA SOURCE ID SELECTED, CONNECTION INSTANCE = ', selectedSource)
    setSourceId(sId => selectedSource ? selectedSource.value : null)
    validate()
  }, [selectedSource, validate])

  useEffect(() => {
    console.log('>> FETCHED ALL JIRA CONNECTIONS... ', allConnections)
    setSources(allConnections.map(c => { return { id: c.ID, title: c.name || 'Instance', value: c.ID } }))
  }, [allConnections])

  useEffect(() => {
    console.log('>> BUILT JIRA INSTANCE SELECT MENU... ', sources)
  }, [sources])

  useEffect(() => {
    if (location.state?.existingTasks) {
      console.log('>> RESTART ATTEMPT: DETECTED EXISTING PIPELINE CONFIGURATION... ', location.state.existingTasks)
      const tasks = location.state.existingTasks
      setRestartDetected(true)
      setExistingTasks(tasks)
      window.history.replaceState(null, '')
      // !WARNING! This logic will only handle ONE STAGE (Stage 1)
      // @todo: refactor later for multi-stage
      const GitLabTask = tasks.filter(t => t.plugin === Providers.GITLAB)
      const GitHubTask = tasks.find(t => t.plugin === Providers.GITHUB)
      const JiraTask = tasks.filter(t => t.plugin === Providers.JIRA)
      const JenkinsTask = tasks.find(t => t.plugin === Providers.JENKINS)
      const GitExtractorTask = tasks.find(t => t.plugin === Providers.GITEXTRACTOR)
      const RefDiffTask = tasks.find(t => t.plugin === Providers.REFDIFF)
      const configuredProviders = []
      if (GitLabTask && GitLabTask.length > 0) {
        configuredProviders.push(Providers.GITLAB)
        setProjectId(Array.isArray(GitLabTask) ? GitLabTask.map(gT => gT.options?.projectId) : GitLabTask.options?.projectId)
      }
      if (GitHubTask) {
        configuredProviders.push(Providers.GITHUB)
        setRepositoryName(GitHubTask.options?.repositoryName || GitHubTask.options?.repo)
        setOwner(GitHubTask.options?.owner)
      }
      if (JiraTask && JiraTask.length > 0) {
        fetchAllConnections(false)
        configuredProviders.push(Providers.JIRA)
        setBoardId(Array.isArray(JiraTask) ? JiraTask.map(jT => jT.options?.boardId) : JiraTask.options?.boardId)
        const connSrcId = JiraTask[0].options?.sourceId
        setSelectedSource({
          id: parseInt(connSrcId, 10),
          title: '(Instance)',
          value: parseInt(connSrcId, 10)
        })
      }
      if (JenkinsTask) {
        configuredProviders.push(Providers.JENKINS)
      }
      if (GitExtractorTask) {
        setGitExtractorRepoId(GitExtractorTask.options?.repoId)
        setGitExtractorUrl(GitExtractorTask.options?.url)
        configuredProviders.push(Providers.GITEXTRACTOR)
      }
      if (RefDiffTask) {
        setRefDiffRepoId(RefDiffTask.options?.repoId)
        setRefDiffTasks(RefDiffTask.options?.tasks || [])
        setRefDiffPairs(RefDiffTask.options?.pairs || [])
        configuredProviders.push(Providers.REFDIFF)
      }
      setEnabledProviders(eP => [...eP, ...configuredProviders])
    } else {
      setRestartDetected(false)
      setExistingTasks([])
    }

    return () => {
      setRestartDetected(false)
      setExistingTasks([])
    }
  }, [location, fetchAllConnections])

  useEffect(() => {
    if (isValidCode()) {
      setRunTasksAdvanced(JSON.parse(rawConfiguration))
    }
  }, [rawConfiguration, isValidCode])

  useEffect(() => {
    if (existingTasks.length > 0) {
      const multiStageTasks = buildPipelineStages(existingTasks, true)
      const PipelineTasks = multiStageTasks.map(s => {
        return s.map(t => {
          return {
            Plugin: t.plugin,
            Options: {
              ...t.options
            }
          }
        })
      })
      setRunTasksAdvanced(PipelineTasks)
      setRawConfiguration(JSON.stringify(PipelineTasks, null, '  '))
    }
  }, [existingTasks, buildPipelineStages])

  useEffect(() => {
    console.log('>>> ADVANCED MODE ENABLED?: ', advancedMode)
  }, [advancedMode])

  return (
    <>
      <div className={`container container-create-pipeline ${advancedMode ? 'advanced-mode' : ''}`}>
        <Nav />
        <Sidebar />
        <Content>
          <main className='main'>
            <AppCrumbs
              items={[
                { href: '/', icon: false, text: 'Dashboard' },
                { href: '/pipelines', icon: false, text: 'Pipelines' },
                { href: '/pipelines/create', icon: false, text: 'Create Pipeline Run', current: true },
              ]}
            />

            <div className='headlineContainer'>
              <Link style={{ display: 'flex', fontSize: '14px', float: 'right', marginLeft: '10px', color: '#777777' }} to='/pipelines'>
                <Icon
                  icon={
                    <BackArrowIcon
                      width={16} height={16}
                      fill='rgba(0,0,0,0.25)'
                      style={{
                        marginRight: '6px'
                      }}
                    />
                  } size={16}
                /> Go Back
              </Link>
              <div style={{ display: 'flex' }}>
                <div>
                  <span style={{ marginRight: '10px' }}>
                    <Icon icon={<img src={RunPipelineIcon} width='38' height='38' />} size={38} />
                  </span>
                </div>
                <div>
                  <h1 style={{ margin: 0 }}>
                    Create Pipeline Run
                    <Popover
                      key='popover-help-key-create-pipeline'
                      className='trigger-delete-connection'
                      popoverClassName='popover-help-create-pipeline'
                      position={Position.RIGHT}
                      autoFocus={false}
                      enforceFocus={false}
                      usePortal={false}
                    >
                      <a href='#' rel='noreferrer'><HelpIcon width={19} height={19} style={{ marginLeft: '10px' }} /></a>
                      <>
                        <div style={{ textShadow: 'none', fontSize: '12px', padding: '12px', maxWidth: '300px' }}>
                          <div style={{ marginBottom: '10px', fontWeight: 700, fontSize: '14px', fontFamily: '"Montserrat", sans-serif' }}>
                            <Icon icon='help' size={16} /> Run Pipeline
                          </div>
                          <p>Need Help? &mdash; Configure the <strong>Data Providers</strong> you want and click
                            <Icon icon='play' size={12} /> <strong>RUN</strong> to trigger a new Pipeline run.
                          </p>
                        </div>
                      </>
                    </Popover>
                  </h1>

                  <p className='page-description mb-0'>Trigger data collection for one or more Data Providers.</p>
                  <p style={{ margin: 0, padding: 0 }}>
                    In a future release you’ll be able to define Blueprints, and schedule recurring plans.
                  </p>
                </div>
              </div>
            </div>

            <div className='' style={{ width: '100%', marginTop: '10px', alignSelf: 'flex-start', alignContent: 'flex-start' }}>
              <h2 className='headline'>
                <Icon
                  icon='git-pull'
                  height={16} size={16} color='rgba(0,0,0,0.5)'
                /> Pipeline Name {advancedMode && <>(Advanced)</>}<span className='requiredStar'>*</span>
              </h2>
              <p className='group-caption'>Create a user-friendly name for this Run, or select and use a default auto-generated one.</p>
              <div className='form-group' style={{ maxWidth: '480px', paddingLeft: '22px' }}>
                {isValidPipeline() && (
                  <Icon
                    icon='tick' color={Colors.GREEN5} size={12}
                    style={{ float: 'right', marginTop: '7px', marginLeft: '5px' }}
                  />)}
                {!isValidPipeline() && (
                  <>
                    <Icon
                      icon='exclude-row' color={Colors.RED5}
                      size={12}
                      style={{ float: 'right', marginTop: '7px', marginLeft: '5px' }}
                    />
                  </>
                )}
                <FormGroup
                  disabled={isRunning}
                  label=''
                  labelFor='pipeline-name'
                  className=''
                  contentClassName=''
                  helperText={`RUN DATE = ${today.toLocaleString()}`}
                  fill
                  required
                >

                  <InputGroup
                    id='pipeline-name'
                    disabled={isRunning}
                    placeholder='eg. COLLECTION YYYYMMDDHHMMSS'
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    className={!isValidPipelineForm ? 'input-pipeline-name is-invalid' : 'input-pipeline-name is-valid'}
                    rightElement={
                      <>
                        <Button
                          icon='reset' text='' small
                          minimal
                          onClick={() => resetPipelineName()}
                        />
                        <Popover
                          className='popover-pipeline-menu-trigger'
                          popoverClassName='popover-pipeline-menu'
                          position={Position.RIGHT_BOTTOM}
                          usePortal
                        >
                          <Button text={`${today.toLocaleTimeString()}`} />
                          <>
                            <PipelinePresetsMenu
                              namePrefix={namePrefix}
                              pipelineSuffixes={pipelineSuffixes}
                              setNamePrefix={setNamePrefix}
                              setNameSuffix={setNameSuffix}
                              setRawConfiguration={setRawConfiguration}
                              advancedMode={advancedMode}
                            />
                          </>
                        </Popover>
                        {validationErrors.length > 0 && (
                          <>
                            <div style={{ display: 'block', float: 'right' }}>
                              <Popover
                                key='popover-help-key-validation-errors'
                                className='trigger-validation-errors'
                                popoverClassName='popover-help-validation-errors'
                                position={Position.RIGHT}
                                autoFocus={false}
                                enforceFocus={false}
                                usePortal={false}
                              >
                                <Button
                                  intent={Intent.PRIMARY}
                                  icon={<Icon icon='warning-sign' size={14} color={Colors.ORANGE5} />}
                                  small
                                  style={{ margin: '3px 4px 0 0' }}
                                />
                                <div style={{ padding: '5px', minWidth: '300px', maxWidth: '300px', justifyContent: 'flex-start' }}>
                                  <FormValidationErrors errors={validationErrors} textAlign='left' styles={{ display: 'flex' }} />
                                </div>
                              </Popover>
                            </div>
                          </>
                        )}
                      </>
                    }
                    required
                    // large
                    fill
                  />
                </FormGroup>
              </div>

              {advancedMode && (
                <>
                  <h2 className='headline'>
                    <Icon icon='code' height={16} size={16} color='rgba(0,0,0,0.5)' />{' '}
                    <strong>JSON</strong> Provider Configuration<span className='requiredStar'>*</span>
                  </h2>
                  <p className='group-caption'>Define Plugins and Options manually. Only valid JSON code is allowed.</p>
                  <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                    <div className='form-group' style={{ paddingLeft: '22px' }}>
                      <Card
                        className='code-editor-card'
                        interactive={false}
                        elevation={Elevation.TWO}
                        style={{ padding: '2px', minWidth: '320px', width: '100%', maxWidth: '640px', marginBottom: '20px' }}
                      >
                        <h3 style={{ borderBottom: '1px solid #eeeeee', margin: 0, padding: '8px 10px' }}>
                          <span style={{ float: 'right', fontSize: '9px', color: '#aaaaaa' }}>application/json</span>
                          TASKS EDITOR
                          {isMultiStagePipeline(runTasksAdvanced) && (
                            <>
                              {' '} &rarr; {' '}
                              <Icon icon='layers' color={Colors.GRAY4} size={14} style={{ marginRight: '5px' }} />
                              <span style={{
                                fontStyle: 'normal',
                                fontWeight: 900,
                                letterSpacing: '1px',
                                color: '#333',
                                fontSize: '11px'
                              }}
                              >
                                MULTI-STAGE <Tag intent={Intent.PRIMARY} style={{ borderRadius: '20px' }}>{runTasksAdvanced.length}</Tag>
                              </span>
                            </>
                          )}
                        </h3>
                        <TextArea
                          growVertically={false}
                          fill
                          className='codeArea'
                          style={{ height: '440px !important', maxWidth: '640px' }}
                          value={rawConfiguration}
                          onChange={(e) => setRawConfiguration(e.target.value)}
                        />
                        {/* @todo: fix bug with @uiw/react-textarea-code-editor in a future release */}
                        {/* <div
                          className='code-editor-wrapper' style={{
                            minHeight: '384px',
                            height: '440px !important',
                            maxWidth: '640px',
                            maxHeight: '384px',
                            overflow: 'hidden',
                            overflowY: 'auto'
                          }}
                        >
                          <CodeEditor
                            value={rawConfiguration}
                            language='json'
                            placeholder='< Please enter JSON configuration with supported Plugins. >'
                            onChange={(e) => setRawConfiguration(e.target.value)}
                            padding={15}
                            minHeight={384}
                            style={{
                              fontSize: 12,
                              backgroundColor: '#f5f5f5',
                              // eslint-disable-next-line max-len
                              fontFamily: 'JetBrains Mono,Source Code Pro,ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                            }}
                          />
                        </div> */}
                        <div
                          className='code-editor-card-footer'
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            padding: '5px',
                            borderTop: '1px solid #eeeeee',
                            fontSize: '11px'
                          }}
                        >
                          <ButtonGroup
                            className='code-editor-controls' style={{
                              borderRadius: '3px',
                              boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.30)'
                            }}
                          >
                            <Popover
                              className='popover-options-menu-trigger'
                              popoverClassName='popover-options-menu'
                              position={Position.TOP}
                              usePortal
                            >
                              <Button
                                disabled={isRunning}
                                icon='cog'
                              />
                              <>
                                <PipelineConfigsMenu
                                  setRawConfiguration={setRawConfiguration}
                                  advancedMode={advancedMode}
                                />
                              </>
                            </Popover>
                            <Button
                              disabled={!isValidConfiguration}
                              small text='Format' icon='align-left'
                              onClick={() => formatRawCode()}
                            />
                            <Button
                              small text='Revert' icon='reset'
                              onClick={() => setRawConfiguration(JSON.stringify([runTasks], null, '  '))}
                            />
                            <Button
                              small text='Clear' icon='eraser'
                              onClick={() => setRawConfiguration('[[]]')}
                            />
                            <Popover
                              className='trigger-code-validation-help'
                              popoverClassName='popover-code-validation-help'
                              position={Position.RIGHT}
                              autoFocus={false}
                              enforceFocus={false}
                              usePortal={false}
                            >
                              <Button
                                intent={isValidConfiguration ? Intent.SUCCESS : Intent.PRIMARY}
                                small
                                text={isValidConfiguration ? 'Valid' : 'Invalid'}
                                icon={isValidConfiguration ? 'confirm' : 'warning-sign'}
                              />
                              <>
                                <div style={{
                                  textShadow: 'none',
                                  fontSize: '12px',
                                  padding: '12px',
                                  minWidth: '300px',
                                  maxWidth: '300px',
                                  maxHeight: '200px',
                                  overflow: 'hidden',
                                  overflowY: 'auto'
                                }}
                                >
                                  {isValidConfiguration
                                    ? (
                                      <>
                                        <Icon
                                          icon='tick' color={Colors.GREEN5} size={16}
                                          style={{ float: 'left', marginRight: '5px' }}
                                        />
                                        <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '5px' }}>
                                          JSON Configuration Valid
                                        </div>
                                        {isMultiStagePipeline(runTasksAdvanced) && (
                                          <>
                                            <div
                                              className='bp3-elevation-1' style={{
                                                backgroundColor: '#f6f6f6',
                                                padding: '4px 6px',
                                                borderRadius: '3px',
                                                marginBottom: '10px'
                                              }}
                                            >
                                              <Icon icon='layers' color={Colors.GRAY4} size={14} style={{ marginRight: '5px' }} />
                                              <span style={{
                                                fontFamily: 'Montserrat',
                                                fontStyle: 'normal',
                                                fontWeight: 900,
                                                letterSpacing: '1px',
                                                color: '#333',
                                                fontSize: '11px'
                                              }}
                                              >
                                                MULTI-STAGE <Tag>{runTasksAdvanced.length}</Tag>
                                              </span>
                                            </div>
                                            <span style={{ fontSize: '10px' }}>Multi-stage task configuration detected.</span>
                                          </>
                                        )}
                                      </>
                                      )
                                    : (
                                      <>
                                        <Icon
                                          icon='issue' color={Colors.RED5} size={16}
                                          style={{ float: 'left', marginRight: '5px' }}
                                        />
                                        <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '5px' }}>
                                          Invalid JSON Configuration
                                        </div>
                                        {validationError}
                                      </>
                                      )}
                                </div>
                              </>
                            </Popover>

                          </ButtonGroup>
                        </div>
                      </Card>
                      <div style={{ marginTop: '0', maxWidth: '640px' }}>
                        <div style={{ display: 'flex', minHeight: '34px' }}>
                          <div style={{
                            marginRight: '5px',
                            paddingLeft: '10px',
                            fontWeight: 800,
                            letterSpacing: '2px',
                            color: Colors.GRAY2,
                            fontFamily: '"Montserrat", sans-serif'
                          }}
                          ><span><Icon icon='nest' size={12} color={Colors.GRAY4} style={{ marginRight: '2px' }} /> DATA PROVIDERS</span>
                          </div>
                          {detectedProviders.map((provider, pIdx) => (
                            <div className='detected-provider-icon' key={`provider-icon-key-${pIdx}`} style={{ margin: '5px 18px' }}>
                              {ProviderIcons[provider] ? ProviderIcons[provider](20, 20) : <></>}
                            </div>
                          ))}
                          {detectedProviders.length === 0 && (<span style={{ color: Colors.GRAY4 }}>&lt; None Configured &gt;</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!advancedMode && (
                <>
                  <h2 className='headline'>
                    <Icon icon='database' height={16} size={16} color='rgba(0,0,0,0.5)' />{' '}
                    Data Providers<span className='requiredStar'>*</span>
                  </h2>
                  <p className='group-caption'>
                    Configure available plugins to enable for this <strong>Pipeline Run</strong>.<br />
                    Turn the switch to the ON position to activate.
                  </p>
                  <div className='data-providers' style={{ marginTop: '8px', width: '100%' }}>
                    {integrations.map((provider) => (
                      <CSSTransition
                        key={`fx-key-provider-${provider.id}`}
                        in={readyProviders.includes(provider.id)}
                        timeout={350}
                        classNames='provider-datarow'
                        unmountOnExit
                      >
                        {/* <div key={`provider-${provider.id}`}> */}
                        <div
                          // eslint-disable-next-line max-len
                          className={`data-provider-row data-provider-${provider.id.toLowerCase()} ${enabledProviders.includes(provider.id) ? 'on' : 'off'}`}
                        >
                          <div className='provider-info'>
                            <div className='provider-icon'>{provider.iconDashboard}</div>
                            <span className='provider-name'>{provider.name}</span>
                            <Tooltip
                              intent={Intent.PRIMARY}
                              content={`Enable ${provider.name}`} position={Position.LEFT} popoverClassName='pipeline-tooltip'
                            >
                              <Switch
                          // alignIndicator={Alignment.CENTER}
                                disabled={isRunning}
                                className={`provider-toggle-switch switch-${provider.id.toLowerCase()}`}
                                innerLabel={!enabledProviders.includes(provider.id) ? 'OFF' : null}
                                innerLabelChecked='ON'
                                checked={enabledProviders.includes(provider.id)}
                                onChange={() => setEnabledProviders(p =>
                                  enabledProviders.includes(provider.id) ? p.filter(p => p !== provider.id) : [...p, provider.id]
                                )}
                              />
                            </Tooltip>
                          </div>
                          <div className='provider-settings'>
                            {/* showProviderSettings(provider.id) */}
                            <ProviderSettings
                              providerId={provider.id}
                              projectId={projectId}
                              owner={owner}
                              repositoryName={repositoryName}
                              sourceId={sourceId}
                              sources={sources}
                              selectedSource={selectedSource}
                              setSelectedSource={setSelectedSource}
                              boardId={boardId}
                              gitExtractorUrl={gitExtractorUrl}
                              gitExtractorRepoId={gitExtractorRepoId}
                              refDiffRepoId={refDiffRepoId}
                              refDiffTasks={refDiffTasks}
                              refDiffPairs={refDiffPairs}
                              setProjectId={setProjectId}
                              setOwner={setOwner}
                              setRepositoryName={setRepositoryName}
                              setSourceId={setSourceId}
                              setBoardId={setBoardId}
                              setGitExtractorUrl={setGitExtractorUrl}
                              setGitExtractorRepoId={setGitExtractorRepoId}
                              setRefDiffRepoId={setRefDiffRepoId}
                              setRefDiffPairs={setRefDiffPairs}
                              setRefDiffTasks={setRefDiffTasks}
                              isEnabled={isProviderEnabled}
                              isRunning={isRunning}
                            />
                          </div>
                          <div className='provider-actions'>
                            <ButtonGroup minimal rounded='true'>
                              {provider.type === ProviderTypes.INTEGRATION && (
                                <Button className='pipeline-action-btn' minimal onClick={() => history.push(`/integrations/${provider.id}`)}>
                                  <Icon icon='cog' color={Colors.GRAY4} size={16} />
                                </Button>
                              )}
                              <Popover
                                key={`popover-help-key-provider-${provider.id}`}
                                className='trigger-provider-help'
                                popoverClassName='popover-provider-help'
                                position={Position.RIGHT}
                                autoFocus={false}
                                enforceFocus={false}
                                usePortal
                              >
                                <Button className='pipeline-action-btn' minimal><Icon icon='help' color={Colors.GRAY4} size={16} /></Button>
                                <>
                                  <div style={{ textShadow: 'none', fontSize: '12px', padding: '12px', maxWidth: '300px' }}>
                                    <div style={{
                                      marginBottom: '10px',
                                      fontWeight: 700,
                                      fontSize: '14px',
                                      fontFamily: '"Montserrat", sans-serif'
                                    }}
                                    >
                                      <Icon icon='help' size={16} /> {provider.name} Settings
                                    </div>
                                    <p>
                                      Need Help? &mdash; Please enter the required{' '}
                                      <strong>Run Settings</strong> for this data provider.
                                    </p>
                                    {/* specific provider field help notes */}
                                    {(() => {
                                      let helpContext = null
                                      switch (provider.id) {
                                        case Providers.GITLAB:
                                          helpContext = (
                                            <img
                                              src={GitlabHelpNote}
                                              alt={provider.name} style={{ maxHeight: '64px', maxWidth: '100%' }}
                                            />
                                          )
                                          break
                                        case Providers.JENKINS:
                                          helpContext = <strong>(Options not required)</strong>
                                          break
                                        case Providers.JIRA:
                                          helpContext = (
                                            <img
                                              src={JiraHelpNote}
                                              alt={provider.name} style={{ maxHeight: '64px', maxWidth: '100%' }}
                                            />
                                          )
                                          break
                                        case Providers.GITHUB:
                                          helpContext = (
                                            <img
                                              src={GithubHelpNote}
                                              alt={provider.name} style={{ maxHeight: '64px', maxWidth: '100%' }}
                                            />
                                          )
                                          break
                                        case Providers.GITEXTRACTOR:
                                          helpContext = (
                                            <>
                                              <div><strong>GitExtractor README</strong></div>
                                              <p>This plugin extract commits and references from a remote or local git repository.</p>
                                              <a
                                                className='bp3-button bp3-small'
                                                rel='noreferrer'
                                                target='_blank'
                                                href='https://github.com/merico-dev/lake/tree/main/plugins/gitextractor'
                                              >Learn More
                                              </a>
                                            </>
                                          )
                                          break
                                        case Providers.REFDIFF:
                                          helpContext = (
                                            <>
                                              <div><strong>RefDiff README</strong></div>
                                              <p>You need to run gitextractor before the refdiff plugin.</p>
                                              <a
                                                className='bp3-button bp3-small'
                                                rel='noreferrer'
                                                target='_blank'
                                                href='https://github.com/merico-dev/lake/tree/main/plugins/refdiff'
                                              >Learn More
                                              </a>
                                            </>
                                          )
                                          break
                                      }
                                      return helpContext
                                    })()}
                                  </div>
                                </>
                              </Popover>
                            </ButtonGroup>
                          </div>
                        </div>
                        {/* </div> */}
                      </CSSTransition>
                    ))}
                  </div>
                </>
              )}

            </div>

            <div style={{ display: 'flex', marginTop: '32px', width: '100%', justifyContent: 'flex-start' }}>
              {validationErrors.length > 0 && (
                <FormValidationErrors errors={validationErrors} />
              )}
            </div>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <Button
                id='btn-run-pipeline'
                className='btn-pipeline btn-run-pipeline' icon='play' intent='primary'
                disabled={advancedMode ? !isValidAdvancedPipeline() : !isValidPipeline()}
                onClick={runPipeline}
                loading={isRunning}
              ><strong>Run</strong> Pipeline
              </Button>
              <Tooltip content='Manage Pipelines' position={Position.TOP}>
                <Button
                  onClick={() => history.push('/pipelines')}
                  className='btn-pipeline btn-view-jobs'
                  icon='pulse' minimal style={{ marginLeft: '5px' }}
                >View All Pipelines
                </Button>
              </Tooltip>
              <Button
                className='btn-pipeline btn-reset-pipeline'
                icon='eraser' minimal style={{ marginLeft: '5px' }}
                onClick={resetConfiguration}
              >Reset
              </Button>
              <div style={{ padding: '7px 5px 0 50px' }}>
                <Tooltip content='Advanced Pipeline Mode' position={Position.TOP}>
                  <Switch
                    className='advanced-mode-toggleswitch'
                    intent={Intent.DANGER}
                    checked={advancedMode}
                    onChange={() => setAdvancedMode(t => !t)}
                    labelElement={
                      <>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          fontFamily: '"Montserrat", sans-serif',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}
                        >Advanced Mode
                        </span><br />
                        <strong style={{ color: !advancedMode ? Colors.GRAY3 : '' }}>Raw JSON Trigger</strong>
                      </>
                    }
                  />
                </Tooltip>
              </div>
            </div>
            <p style={{ margin: '5px 3px', alignSelf: 'flex-start', fontSize: '10px' }}>
              Visit the <a href='#'><strong>All Jobs</strong></a> section to monitor complete pipeline activity.<br />
              Once you run this pipeline, you’ll be redirected to collection status.
            </p>
            {advancedMode && (
              <div style={{ alignSelf: 'flex-start' }}>
                <h4 style={{
                  marginBottom: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: '"Montserrat", sans-serif'
                }}
                ><Icon icon='issue' size={12} style={{ marginBottom: '2px' }} /> <span>Expert Use Only</span>
                </h4>
                <p style={{ fontSize: '10px' }}>
                  Trigger a manual Pipeline with <a href='#'><strong>JSON Configuration</strong></a>.<br />
                  Please review the{' '}
                  <a
                    href='https://github.com/merico-dev/lake/wiki/How-to-use-the-triggers-page' target='_blank'
                    rel='noreferrer'
                    style={{
                      fontWeight:
                          'bold',
                      color: '#E8471C',
                      textDecoration: 'underline'
                    }}
                  >
                    Documentation
                  </a> on creating complex Pipelines.
                </p>
              </div>
            )}
          </main>
        </Content>
      </div>
      <PipelineIndicator
        pipeline={pipelineRun}
        graphsUrl={GRAFANA_URL}
        onFetch={fetchPipeline}
        onCancel={cancelPipeline}
        onView={() => history.push(`/pipelines/activity/${pipelineRun.ID}`)}
      />
    </>
  )
}

export default CreatePipeline
