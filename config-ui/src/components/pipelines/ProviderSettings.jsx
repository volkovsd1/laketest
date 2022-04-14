import React from 'react'
import {
  Providers,
} from '@/data/Providers'
import {
  Button,
  ButtonGroup,
  FormGroup,
  InputGroup,
  MenuItem,
  Intent,
  TagInput,
  Tooltip,
} from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import RefDiffSettings from '@/components/pipelines/pipeline-settings/refdiff'

const ProviderSettings = (props) => {
  const {
    providerId,
    projectId = [],
    sourceId,
    selectedSource,
    sources = [],
    boardId = [],
    owner,
    repositoryName,
    gitExtractorUrl,
    gitExtractorRepoId,
    refDiffRepoId,
    refDiffPairs = [],
    refDiffTasks = [],
    setProjectId = () => {},
    setSourceId = () => {},
    setSelectedSource = () => {},
    setBoardId = () => {},
    setOwner = () => {},
    setRepositoryName = () => {},
    setGitExtractorUrl = () => {},
    setGitExtractorRepoId = () => {},
    setRefDiffRepoId = () => {},
    setRefDiffPairs = () => {},
    setRefDiffTasks = () => {},
    isEnabled = () => {},
    isRunning = false,
    onReset = () => {}
  } = props

  let providerSettings = null

  switch (providerId) {
    case Providers.JENKINS:
      providerSettings = <p><strong style={{ fontWeight: 900 }}>AUTO-CONFIGURED</strong><br />No Additional Settings</p>
      break
    case Providers.JIRA:
      providerSettings = (
        <>
          <FormGroup
            disabled={isRunning || !isEnabled(providerId)}
            label={<strong>Source ID<span className='requiredStar'>*</span></strong>}
            labelInfo={<span style={{ display: 'block' }}>Choose Connection Instance ID</span>}
            inline={false}
            labelFor='source-id'
            className=''
            contentClassName=''
            fill
          >
            <ButtonGroup>
              <Select
                disabled={isRunning || !isEnabled(providerId)}
                className='selector-source-id'
                popoverProps={{ popoverClassName: 'source-id-popover' }}
                multiple
                inline
                fill
                items={sources}
                activeItem={selectedSource}
                itemPredicate={(query, item) => item?.title?.toLowerCase().indexOf(query.toLowerCase()) >= 0}
                itemRenderer={(item, { handleClick, modifiers }) => (
                  <MenuItem
                    active={modifiers.active}
                    key={item.value}
                    label={item.value}
                    onClick={handleClick}
                    text={item.title}
                  />
                )}
                noResults={<MenuItem disabled text='No Connections.' />}
                onItemSelect={(item) => {
                  setSelectedSource(item)
                }}
              >
                <Button
                  className='btn-source-id-selector'
                  disabled={isRunning || !isEnabled(providerId)}
                  style={{ justifyContent: 'space-between', minWidth: '206px', maxWidth: '290px', whiteSpace: 'nowrap' }}
                  text={selectedSource ? `${selectedSource.title} [${selectedSource.value}]` : 'Select Instance'}
                  rightIcon='double-caret-vertical'
                  fill
                />
              </Select>
              <Button
                icon='eraser'
                intent={Intent.WARNING}
                disabled={isRunning || !isEnabled(providerId)}
                onClick={() => setSelectedSource(null)}
              />
            </ButtonGroup>
          </FormGroup>
          <FormGroup
            disabled={isRunning || !isEnabled(providerId)}
            label={
              <strong>Board IDs<span className='requiredStar'>*</span>
                <span
                  className='badge-count'
                  style={{
                    opacity: isEnabled(providerId) ? 0.5 : 0.1
                  }}
                >{boardId.length}
                </span>
              </strong>
            }
            labelInfo={<span style={{ display: 'block' }}>Enter one or more JIRA Board IDs.</span>}
            inline={false}
            labelFor='board-id'
            className=''
            contentClassName=''
            style={{ marginLeft: '12px' }}
            fill
          >
            <div style={{ width: '100%' }}>
              <TagInput
                id='board-id'
                disabled={isRunning || !isEnabled(providerId)}
                placeholder='eg. 8, 100, 200'
                values={boardId || []}
                fill
                onChange={(values) => setBoardId([...new Set(values)])}
                addOnPaste
                addOnBlur
                rightElement={
                  <Button
                    disabled={isRunning || !isEnabled(providerId)}
                    icon='eraser'
                    minimal
                    onClick={() => setBoardId([])}
                  />
                  }
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                className='input-board-id tagInput'
              />
            </div>
          </FormGroup>
        </>
      )
      break
    case Providers.GITHUB:
      providerSettings = (
        <>
          <FormGroup
            disabled={isRunning || !isEnabled(providerId)}
            label={<strong>Owner<span className='requiredStar'>*</span></strong>}
            labelInfo={<span style={{ display: 'block' }}>Enter Project Owner</span>}
            inline={false}
            labelFor='owner'
            className=''
            contentClassName=''
            fill
          >
            <InputGroup
              id='owner'
              disabled={isRunning || !isEnabled(providerId)}
              placeholder='eg. merico-dev'
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className='input-owner'
              autoComplete='off'
            />
          </FormGroup>
          <FormGroup
            disabled={isRunning || !isEnabled(providerId)}
            label={<strong>Repository Name<span className='requiredStar'>*</span></strong>}
            labelInfo={<span style={{ display: 'block' }}>Enter Git repository</span>}
            inline={false}
            labelFor='repository-name'
            className=''
            contentClassName=''
            style={{ marginLeft: '12px' }}
            fill
          >
            <InputGroup
              id='repository-name'
              disabled={isRunning || !isEnabled(providerId)}
              placeholder='eg. lake'
              value={repositoryName}
              onChange={(e) => setRepositoryName(e.target.value)}
              className='input-repository-name'
              autoComplete='off'
              fill={false}
            />
          </FormGroup>
        </>
      )
      break
    case Providers.GITLAB:
      providerSettings = (
        <>
          <FormGroup
            disabled={isRunning || !isEnabled(providerId)}
            label={
              <strong>Project IDs<span className='requiredStar'>*</span>
                <span
                  className='badge-count'
                  style={{
                    opacity: isEnabled(providerId) ? 0.5 : 0.1
                  }}
                >{projectId.length}
                </span>
              </strong>
            }
            labelInfo={<span style={{ display: 'block' }}>Enter one or more GitLab Project IDs.</span>}
            inline={false}
            labelFor='project-id'
            className=''
            contentClassName=''
          >
            <div style={{ width: '100%' }}>
              <TagInput
                id='project-id'
                disabled={isRunning || !isEnabled(providerId)}
                placeholder='eg. 937810831, 95781015'
                values={projectId || []}
                fill
                onChange={(values) => setProjectId([...new Set(values)])}
                addOnPaste
                addOnBlur
                rightElement={
                  <Button
                    disabled={isRunning || !isEnabled(providerId)}
                    icon='eraser'
                    minimal
                    onClick={() => setProjectId([])}
                  />
                  }
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                className='input-project-id tagInput'
              />
            </div>
          </FormGroup>
        </>
      )
      break
    case Providers.GITEXTRACTOR:
      providerSettings = (
        <>
          <FormGroup
            disabled={isRunning || !isEnabled(providerId)}
            label={<strong>Git URL<span className='requiredStar'>*</span></strong>}
            labelInfo={<span style={{ display: 'block' }}>Enter Repository URL</span>}
            inline={false}
            labelFor='git-url'
            className=''
            contentClassName=''
            fill
            style={{ minWidth: '372px' }}
          >
            <InputGroup
              id='gitextractor-url'
              disabled={isRunning || !isEnabled(providerId)}
              placeholder='eg. https://github.com/merico-dev/lake.git'
              value={gitExtractorUrl}
              onChange={(e) => setGitExtractorUrl(e.target.value)}
              className='input-gitextractor-url'
              autoComplete='off'
            />
          </FormGroup>
          <FormGroup
            disabled={isRunning || !isEnabled(providerId)}
            label={<strong>Repository ID<span className='requiredStar'>*</span></strong>}
            labelInfo={<span style={{ display: 'block' }}>Enter Repo Column ID</span>}
            inline={false}
            labelFor='gitextractor-repo-id'
            className=''
            contentClassName=''
            style={{ marginLeft: '12px', minWidth: '280px' }}
            fill
          >
            <InputGroup
              id='gitextractor-repo-id'
              disabled={isRunning || !isEnabled(providerId)}
              placeholder='eg. github:GithubRepo:384111310'
              value={gitExtractorRepoId}
              onChange={(e) => setGitExtractorRepoId(e.target.value)}
              className='input-gitextractor-repo-id'
              autoComplete='off'
              fill={false}
            />
          </FormGroup>
        </>
      )
      break
    case Providers.REFDIFF:
      providerSettings = (
        <RefDiffSettings
          providerId={providerId}
          repoId={refDiffRepoId}
          tasks={refDiffTasks}
          pairs={refDiffPairs}
          setRepoId={setRefDiffRepoId}
          setTasks={setRefDiffTasks}
          setPairs={setRefDiffPairs}
          isRunning={isRunning}
          isEnabled={isEnabled}
        />
      )
      break
    default:
      providerSettings = null
      break
  }

  return providerSettings
}

export default ProviderSettings
