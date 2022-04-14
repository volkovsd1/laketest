import React, { useEffect, useState, useCallback, Fragment } from 'react'
import {
  ButtonGroup,
  FormGroup,
  InputGroup,
  MenuItem,
  Position,
  Button,
  Intent,
  Label,
  Icon,
  Colors,
  Tag,
} from '@blueprintjs/core'
import useJIRA from '@/hooks/useJIRA'
import { Select, MultiSelect } from '@blueprintjs/select'

import ClearButton from '@/components/ClearButton'
import '@/styles/integration.scss'
import '@/styles/connections.scss'

const MAPPING_TYPES = {
  Requirement: 'Requirement',
  Incident: 'Incident',
  Bug: 'Bug'
}

export default function JiraSettings (props) {
  const { connection, provider, isSaving, isSavingConnection, onSettingsChange } = props
  // const { providerId, connectionId } = useParams()
  // const history = useHistory()

  const API_PROXY_ENDPOINT = `/api/plugins/jira/sources/${connection?.ID}/proxy/rest`
  const ISSUE_TYPES_ENDPOINT = `${API_PROXY_ENDPOINT}/api/2/issuetype`
  const ISSUE_FIELDS_ENDPOINT = `${API_PROXY_ENDPOINT}/api/2/field`

  const { fetchIssueTypes, fetchFields, issueTypes, fields, isFetching: isFetchingJIRA, error: jiraProxyError } = useJIRA({
    apiProxyPath: API_PROXY_ENDPOINT,
    issuesEndpoint: ISSUE_TYPES_ENDPOINT,
    fieldsEndpoint: ISSUE_FIELDS_ENDPOINT
  })

  const [typeMappingBug, setTypeMappingBug] = useState([])
  const [typeMappingIncident, setTypeMappingIncident] = useState([])
  const [typeMappingRequirement, setTypeMappingRequirement] = useState([])
  const [typeMappingAll, setTypeMappingAll] = useState({})
  const [statusMappings, setStatusMappings] = useState()
  const [jiraIssueEpicKeyField, setJiraIssueEpicKeyField] = useState('')
  const [jiraIssueStoryCoefficient, setJiraIssueStoryCoefficient] = useState(1)
  const [jiraIssueStoryPointField, setJiraIssueStoryPointField] = useState('')
  const [remoteLinkCommitSha, setRemoteLinkCommitSha] = useState('')

  const [requirementTags, setRequirementTags] = useState([])
  const [bugTags, setBugTags] = useState([])
  const [incidentTags, setIncidentTags] = useState([])

  const [requirementTagsList, setRequirementTagsList] = useState([])
  const [bugTagsList, setBugTagsList] = useState([])
  const [incidentTagsList, setIncidentTagsList] = useState([])

  const [fieldsList, setFieldsList] = useState(fields)
  const [issueTypesList, setIssueTypesList] = useState(issueTypes)

  const createTypeMapObject = (customType, standardType) => {
    return customType && standardType
      ? {
          [customType]: {
            standardType
          }
        }
      : null
  }

  const parseTypeMappings = useCallback((mappings = []) => {
    const GroupedMappings = {
      [MAPPING_TYPES.Requirement]: [],
      [MAPPING_TYPES.Incident]: [],
      [MAPPING_TYPES.Bug]: [],
    }
    Object.entries(mappings).forEach(([tag, typeObj]) => {
      GroupedMappings[typeObj.standardType].push(tag)
    })
    console.log('>>>> PARSED TYPE MAPPINGS ....', GroupedMappings)
    setTypeMappingRequirement(GroupedMappings[MAPPING_TYPES.Requirement])
    setTypeMappingBug(GroupedMappings[MAPPING_TYPES.Bug])
    setTypeMappingIncident(GroupedMappings[MAPPING_TYPES.Incident])
    setRequirementTags(requirementTagsList?.filter(t => GroupedMappings[MAPPING_TYPES.Requirement].includes(t.value)))
    setBugTags(bugTagsList?.filter(t => GroupedMappings[MAPPING_TYPES.Bug].includes(t.value)))
    setIncidentTags(incidentTagsList?.filter(t => GroupedMappings[MAPPING_TYPES.Incident].includes(t.value)))
    return GroupedMappings
  }, [requirementTagsList, bugTagsList, incidentTagsList])

  useEffect(() => {
    const settings = {
      epicKeyField: jiraIssueEpicKeyField?.value || '',
      typeMappings: typeMappingAll,
      storyPointField: jiraIssueStoryPointField?.value || '',
      remotelinkCommitShaPattern: remoteLinkCommitSha || ''
    }
    onSettingsChange(settings)
    console.log('>> JIRA INSTANCE SETTINGS FIELDS CHANGED!', settings)
    console.log(
      typeMappingBug,
      typeMappingAll,
      typeMappingIncident,
      typeMappingRequirement,
      statusMappings,
      jiraIssueEpicKeyField,
      jiraIssueStoryPointField,
      jiraIssueStoryCoefficient,
      remoteLinkCommitSha,
      onSettingsChange)
  }, [
    typeMappingBug,
    typeMappingAll,
    typeMappingIncident,
    typeMappingRequirement,
    statusMappings,
    jiraIssueEpicKeyField,
    jiraIssueStoryPointField,
    jiraIssueStoryCoefficient,
    remoteLinkCommitSha,
    onSettingsChange
  ])

  useEffect(() => {
    if (typeMappingBug && typeMappingIncident && typeMappingRequirement) {
      const RequirementMappings = typeMappingRequirement !== ''
        ? typeMappingRequirement.map(r => createTypeMapObject(r.value, MAPPING_TYPES.Requirement))
        : []
      const IncidentMappings = typeMappingIncident !== ''
        ? typeMappingIncident.map(i => createTypeMapObject(i.value, MAPPING_TYPES.Incident))
        : []
      const BugMappings = typeMappingBug !== ''
        ? typeMappingBug.map(b => createTypeMapObject(b.value, MAPPING_TYPES.Bug))
        : []
      const CombinedMappings = [...RequirementMappings, ...IncidentMappings, ...BugMappings].filter(m => m !== null)
      const MappingTypeObjects = CombinedMappings.reduce((pV, cV) => { return { ...cV, ...pV } }, {})
      setTypeMappingAll(MappingTypeObjects)
      console.log('>> INCIDENT TYPE MAPPING OBJECTS....', RequirementMappings, IncidentMappings, BugMappings)
      console.log('>> ALL MAPPINGS COMBINED...', CombinedMappings)
      console.log('>> FINAL MAPPING OBJECTS FOR API REQUEST...', MappingTypeObjects)
    }
  }, [typeMappingBug, typeMappingIncident, typeMappingRequirement])

  useEffect(() => {
    console.log('>> CONN SETTINGS OBJECT ', connection)
    if (connection && connection.ID) {
      // Parse Type Mappings (V2)
      parseTypeMappings(connection.typeMappings)
      setStatusMappings([])
      setRemoteLinkCommitSha(connection.remotelinkCommitShaPattern)
      // setJiraIssueEpicKeyField(fieldsList.find(f => f.value === connection.epicKeyField))
      // setJiraIssueStoryPointField(fieldsList.find(f => f.value === connection.storyPointField))
    }
  }, [connection, parseTypeMappings])

  useEffect(() => {
    setTypeMappingRequirement(requirementTags)
  }, [requirementTags])

  useEffect(() => {
    setTypeMappingBug(bugTags)
  }, [bugTags])

  useEffect(() => {
    setTypeMappingIncident(incidentTags)
  }, [incidentTags])

  useEffect(() => {
    // Fetch Issue Types & Fields from JIRA API Proxy
    fetchIssueTypes()
    fetchFields()
  }, [connection.UpdatedAt, fetchIssueTypes, fetchFields])

  useEffect(() => {
    console.log('>>> JIRA SETTINGS :: FIELDS LIST DATA CHANGED!', fields)
    setFieldsList(fields)
  }, [fields])

  useEffect(() => {
    console.log('>>> JIRA SETTINGS :: ISSUE TYPES LIST DATA CHANGED!', issueTypes)
    setIssueTypesList(issueTypes)
    setRequirementTagsList(issueTypes)
    setBugTagsList(issueTypes)
    setIncidentTagsList(issueTypes)
  }, [issueTypes])

  useEffect(() => {
    setJiraIssueEpicKeyField(fieldsList.find(f => f.value === connection.epicKeyField))
    setJiraIssueStoryPointField(fieldsList.find(f => f.value === connection.storyPointField))
  }, [fieldsList, connection.epicKeyField, connection.storyPointField])

  useEffect(() => {
    parseTypeMappings(connection.typeMappings)
  }, [requirementTagsList, bugTagsList, incidentTagsList, connection.typeMappings, parseTypeMappings])

  return (
    <>
      <div className='headlineContainer'>
        <h3 className='headline'>Issue Type Mappings</h3>
        <p>Map your own issue types to <strong>DevLake's</strong> standard types</p>
      </div>

      <div className='issue-type-multiselect' style={{ display: 'flex', marginBottom: '10px' }}>
        <div className='issue-type-label' style={{ minWidth: '150px', paddingRight: '10px', paddingTop: '3px' }}>
          <span
            className='bp3-tag tag-requirement'
            style={{ float: 'right' }}
          ><span className='bp3-fill bp3-text-overflow-ellipsis'>Requirement</span>
          </span>
        </div>
        <div className='issue-type-multiselect-selector' style={{ minWidth: '200px', width: '50%' }}>
          <MultiSelect
            disabled={isSaving}
            resetOnSelect
            placeholder='< Select one or more Requirement Tags >'
            popoverProps={{ usePortal: false, minimal: true, fill: true, style: { width: '100%' } }}
            className='multiselector-requirement-type'
            inline
            fill
            items={requirementTagsList}
            selectedItems={requirementTags}
            activeItem={null}
            itemPredicate={(query, item) => item?.title.toLowerCase().indexOf(query.toLowerCase()) >= 0}
            itemRenderer={(item, { handleClick, modifiers }) => (
              <MenuItem
                active={modifiers.active || requirementTags.includes(item)}
                disabled={requirementTags.includes(item)}
                key={item.value}
                label={<span style={{ marginLeft: '20px' }}>{item.description || item.value}</span>}
                onClick={handleClick}
                text={requirementTags.includes(item)
                  ? (
                    <>
                      <img src={item.iconUrl} width={12} height={12} /> {item.title} <Icon icon='small-tick' color={Colors.GREEN5} />
                    </>
                    )
                  : (
                    <span style={{ fontWeight: 700 }}>
                      <img src={item.iconUrl} width={12} height={12} /> {item.title}
                    </span>
                    )}
                style={{ marginBottom: '2px', fontWeight: requirementTags.includes(item) ? 700 : 'normal' }}
              />
            )}
            tagRenderer={(item) => item.title}
            tagInputProps={{
              tagProps: {
                intent: Intent.NONE,
                color: Colors.RED3,
                minimal: true
              },
            }}
            noResults={<MenuItem disabled text='No results.' />}
            onRemove={(item) => {
              setRequirementTags((rT) => rT.filter(t => t.id !== item.id))
            }}
            onItemSelect={(item) => {
              setRequirementTags((rT) => !rT.includes(item) ? [...rT, item] : [...rT])
            }}
          />
        </div>
        <div className='multiselect-clear-action' style={{ marginLeft: '5px' }}>
          <ClearButton
            disabled={requirementTags.length === 0 || isSaving}
            intent={Intent.WARNING} minimal={false} onClick={() => setRequirementTags([])}
          />
        </div>
      </div>

      <div className='issue-type-multiselect' style={{ display: 'flex', marginBottom: '10px' }}>
        <div className='issue-type-label' style={{ minWidth: '150px', paddingRight: '10px', paddingTop: '3px' }}>
          <span
            className='bp3-tag tag-bug'
            style={{ float: 'right' }}
          ><span className='bp3-fill bp3-text-overflow-ellipsis'>Bug</span>
          </span>
        </div>
        <div className='issue-type-multiselect-selector' style={{ minWidth: '200px', width: '50%' }}>
          <MultiSelect
            disabled={isSaving}
            resetOnSelect
            placeholder='< Select one or more Bug Tags >'
            popoverProps={{ usePortal: false, minimal: true }}
            className='multiselector-bug-type'
            inline
            fill
            items={bugTagsList}
            selectedItems={bugTags}
            activeItem={null}
            itemPredicate={(query, item) => item?.title.toLowerCase().indexOf(query.toLowerCase()) >= 0}
            itemRenderer={(item, { handleClick, modifiers }) => (
              <MenuItem
                active={modifiers.active || bugTags.includes(item)}
                disabled={bugTags.includes(item)}
                key={item.value}
                label={<span style={{ marginLeft: '20px' }}>{item.description || item.value}</span>}
                onClick={handleClick}
                text={bugTags.includes(item)
                  ? (
                    <>
                      <img src={item.iconUrl} width={12} height={12} /> {item.title} <Icon icon='small-tick' color={Colors.GREEN5} />
                    </>
                    )
                  : (
                    <span style={{ fontWeight: 700 }}>
                      <img src={item.iconUrl} width={12} height={12} /> {item.title}
                    </span>
                    )}
                style={{ marginBottom: '2px', fontWeight: bugTags.includes(item) ? 700 : 'normal' }}
              />
            )}
            tagRenderer={(item) => item.title}
            tagInputProps={{
              tagProps: {
                intent: Intent.NONE,
                color: Colors.RED3,
                minimal: true
              },
            }}
            noResults={<MenuItem disabled text='No results.' />}
            onRemove={(item) => {
              setBugTags((rT) => rT.filter(t => t.id !== item.id))
            }}
            onItemSelect={(item) => {
              setBugTags((rT) => !rT.includes(item) ? [...rT, item] : [...rT])
            }}
          />
        </div>
        <div className='multiselect-clear-action' style={{ marginLeft: '5px' }}>
          <ClearButton
            disabled={bugTags.length === 0 || isSaving}
            intent={Intent.WARNING} minimal={false} onClick={() => setBugTags([])}
          />
        </div>
      </div>

      <div className='issue-type-multiselect' style={{ display: 'flex', marginBottom: '10px' }}>
        <div className='issue-type-label' style={{ minWidth: '150px', paddingRight: '10px', paddingTop: '3px' }}>
          <span
            className='bp3-tag tag-incident'
            style={{ float: 'right' }}
          ><span className='bp3-fill bp3-text-overflow-ellipsis'>Incident</span>
          </span>
        </div>
        <div className='issue-type-multiselect-selector' style={{ minWidth: '200px', width: '50%' }}>
          <MultiSelect
            disabled={isSaving}
            resetOnSelect
            placeholder='< Select one or more Incident Tags >'
            popoverProps={{ usePortal: false, minimal: true }}
            className='multiselector-incident-type'
            inline
            fill
            items={incidentTagsList}
            selectedItems={incidentTags}
            activeItem={null}
            itemPredicate={(query, item) => item?.title.toLowerCase().indexOf(query.toLowerCase()) >= 0}
            itemRenderer={(item, { handleClick, modifiers }) => (
              <MenuItem
                active={modifiers.active || incidentTags.includes(item)}
                disabled={incidentTags.includes(item)}
                key={item.value}
                label={<span style={{ marginLeft: '20px' }}>{item.description || item.value}</span>}
                onClick={handleClick}
                text={incidentTags.includes(item)
                  ? (
                    <>
                      <img src={item.iconUrl} width={12} height={12} /> {item.title} <Icon icon='small-tick' color={Colors.GREEN5} />
                    </>
                    )
                  : (
                    <span style={{ fontWeight: 700 }}>
                      <img src={item.iconUrl} width={12} height={12} /> {item.title}
                    </span>
                    )}
                style={{ marginBottom: '2px', fontWeight: incidentTags.includes(item) ? 700 : 'normal' }}
              />
            )}
            tagRenderer={(item) => item.title}
            tagInputProps={{
              tagProps: {
                intent: Intent.NONE,
                color: Colors.RED3,
                minimal: true
              },
            }}
            noResults={<MenuItem disabled text='No results.' />}
            onRemove={(item) => {
              setIncidentTags((rT) => rT.filter(t => t.id !== item.id))
            }}
            onItemSelect={(item) => {
              setIncidentTags((rT) => !rT.includes(item) ? [...rT, item] : [...rT])
            }}
          />
        </div>
        <div className='multiselect-clear-action' style={{ marginLeft: '5px' }}>
          <ClearButton
            disabled={incidentTags.length === 0 || isSaving}
            intent={Intent.WARNING} minimal={false} onClick={() => setIncidentTags([])}
          />
        </div>
      </div>

      <div className='headlineContainer'>
        <h3 className='headline'>
          Epic Key<span className='requiredStar'>*</span>
        </h3>
        <p className=''>Choose the JIRA field you’re using to represent the key of an Epic to which an issue belongs to.</p>
        <div style={{ display: 'flex', minWidth: '260px' }}>
          <ButtonGroup disabled={isSaving}>
            <Select
              disabled={isSaving || fieldsList.length === 0}
              className='select-epic-key'
              inline
              fill
              items={fieldsList}
              activeItem={jiraIssueEpicKeyField}
              itemPredicate={(query, item) => item?.title.toLowerCase().indexOf(query.toLowerCase()) >= 0}
              itemRenderer={(item, { handleClick, modifiers }) => (
                <MenuItem
                  disabled={jiraIssueStoryPointField?.value === item.value}
                  active={false}
                  intent={modifiers.active ? Intent.NONE : Intent.NONE}
                  key={item.value}
                  label={item.value}
                  onClick={handleClick}
                  text={
                    <>
                      <span>{item.title}</span>{' '}
                      <Tag minimal intent={Intent.PRIMARY} style={{ fontSize: '9px' }}>{item.type}</Tag>{' '}
                      {modifiers.active && (<Icon icon='small-tick' color={Colors.GREEN5} size={14} />)}
                    </>
                  }
                  style={{
                    fontSize: '11px',
                    fontWeight: modifiers.active ? 800 : 'normal',
                    backgroundColor: modifiers.active ? Colors.LIGHT_GRAY4 : 'none'
                  }}
                />
              )}
              noResults={<MenuItem disabled text='No epic results.' />}
              onItemSelect={(item) => {
                setJiraIssueEpicKeyField(item)
              }}
              popoverProps={{
                position: Position.TOP
              }}
            >
              <Button
                disabled={isSaving || fieldsList.length === 0}
                fill
                style={{ justifyContent: 'space-between', display: 'flex', minWidth: '260px', maxWidth: '300px' }}
                text={jiraIssueEpicKeyField ? `${jiraIssueEpicKeyField.title}` : '< None Specified >'}
                rightIcon='double-caret-vertical'
              />
            </Select>
            <Button
              disabled={!jiraIssueEpicKeyField || isSaving}
              icon='eraser'
              intent={jiraIssueEpicKeyField ? Intent.WARNING : Intent.NONE} minimal={false} onClick={() => setJiraIssueEpicKeyField('')}
            />
          </ButtonGroup>
          <div style={{ marginLeft: '10px' }}>
            {jiraProxyError && (
              <p style={{ color: Colors.GRAY4 }}>
                <Icon icon='warning-sign' color={Colors.RED5} size={12} style={{ marginBottom: '2px' }} />{' '}
                {jiraProxyError.toString() || 'JIRA API not accessible.'}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className='headlineContainer'>
        <h3 className='headline'>Story Point Field</h3>
        <p className=''>Choose the JIRA field you’re using to represent the granularity of a requirement-type issue.</p>
        <div style={{ display: 'flex', minWidth: '260px' }}>
          <ButtonGroup disabled={isSaving}>
            <Select
              disabled={isSaving || fieldsList.length === 0}
              className='select-story-key'
              inline
              fill
              items={fieldsList}
              activeItem={jiraIssueStoryPointField}
              itemPredicate={(query, item) => item?.title.toLowerCase().indexOf(query.toLowerCase()) >= 0}
              itemRenderer={(item, { handleClick, modifiers }) => (
                <MenuItem
                  disabled={jiraIssueEpicKeyField?.value === item.value}
                  active={false}
                  intent={modifiers.active ? Intent.NONE : Intent.NONE}
                  key={item.value}
                  label={item.value}
                  onClick={handleClick}
                  text={
                    <>
                      {item.title}{' '}
                      <Tag minimal intent={Intent.PRIMARY} style={{ fontSize: '9px' }}>{item.type}</Tag>{' '}
                      {modifiers.active && (<Icon icon='small-tick' color={Colors.GREEN5} size={14} />)}
                    </>
                  }
                  style={{
                    fontSize: '11px',
                    fontWeight: modifiers.active ? 800 : 'normal',
                    backgroundColor: modifiers.active ? Colors.LIGHT_GRAY4 : 'none'
                  }}
                />
              )}
              noResults={<MenuItem disabled text='No epic results.' />}
              onItemSelect={(item) => {
                setJiraIssueStoryPointField(item)
              }}
              popoverProps={{
                position: Position.TOP
              }}
            >
              <Button
                // loading={isFetchingJIRA}
                disabled={isSaving || fieldsList.length === 0}
                fill
                style={{ justifyContent: 'space-between', display: 'flex', minWidth: '260px', maxWidth: '300px' }}
                text={jiraIssueStoryPointField ? `${jiraIssueStoryPointField.title}` : '< None Specified >'}
                rightIcon='double-caret-vertical'
              />
            </Select>
            <Button
              loading={isFetchingJIRA}
              disabled={!jiraIssueStoryPointField || isSaving}
              icon='eraser'
              intent={jiraIssueStoryPointField
                ? Intent.WARNING
                : Intent.NONE} minimal={false} onClick={() => setJiraIssueStoryPointField('')}
            />
          </ButtonGroup>
          <div style={{ marginLeft: '10px' }}>
            {jiraProxyError && (
              <p style={{ color: Colors.GRAY4 }}>
                <Icon icon='warning-sign' color={Colors.RED5} size={12} style={{ marginBottom: '2px' }} />{' '}
                {jiraProxyError.toString() || 'JIRA API not accessible.'}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className='headlineContainer'>
        <h3 className='headline'>Remotelink Commit SHA <Tag className='bp3-form-helper-text'>RegExp</Tag></h3>
        <p>Issue Weblink <strong>Commit SHA Pattern</strong> (Add weblink to jira for gitlab.)</p>
      </div>
      <div className='formContainer' style={{ maxWidth: '550px' }}>
        <FormGroup
          fill={false}
          disabled={isSaving}
          labelFor='jira-remotelink-sha'
          className='formGroup'
          contentClassName='formGroupContent'
        >
          <Label>
            Commit Pattern
          </Label>
          <InputGroup
            id='jira-remotelink-sha'
            fill={false}
            placeholder='/commit/([0-9a-f]{40})$'
            defaultValue={remoteLinkCommitSha}
            onChange={(e) => setRemoteLinkCommitSha(e.target.value)}
            disabled={isSaving}
            className='input'
          />
        </FormGroup>
      </div>
    </>
  )
}
