import React, { useEffect, useState, useCallback } from 'react'
import {
  Button, Colors,
  FormGroup, InputGroup, Label,
  Card,
  Icon,
  Tag,
  Elevation,
  Popover,
  // PopoverInteractionKind,
  Position,
  Intent,
  PopoverInteractionKind
} from '@blueprintjs/core'
import { Providers } from '@/data/Providers'
import GenerateTokenForm from '@/pages/configure/connections/GenerateTokenForm'
import FormValidationErrors from '@/components/messages/FormValidationErrors'
import InputValidationError from '@/components/validation/InputValidationError'

import '@/styles/integration.scss'
import '@/styles/connections.scss'

export default function ConnectionForm (props) {
  const {
    isLocked = false,
    isValid = true,
    validationErrors = [],
    activeProvider,
    name,
    endpointUrl,
    token,
    username,
    password,
    proxy = '',
    isSaving,
    isTesting,
    showError,
    errors,
    testStatus,
    onSave = () => {},
    onCancel = () => {},
    onTest = () => {},
    onNameChange = () => {},
    onEndpointChange = () => {},
    onTokenChange = () => {},
    onUsernameChange = () => {},
    onPasswordChange = () => {},
    onProxyChange = () => {},
    onValidate = () => {},
    authType = 'token',
    sourceLimits = {},
    showLimitWarning = true,
    labels,
    placeholders
  } = props

  // const [isValidForm, setIsValidForm] = useState(true)
  const [allowedAuthTypes, setAllowedAuthTypes] = useState(['token', 'plain'])
  const [showTokenCreator, setShowTokenCreator] = useState(false)
  const getConnectionStatusIcon = () => {
    let statusIcon = <Icon icon='full-circle' size='10' color={Colors.RED3} />
    switch (testStatus) {
      case 1:
        statusIcon = <Icon icon='full-circle' size='10' color={Colors.GREEN3} />
        break
      case 2:
        statusIcon = <Icon icon='full-circle' size='10' color={Colors.RED3} />
        break
      case 0:
      default:
        statusIcon = <Icon icon='full-circle' size='10' color={Colors.GRAY3} />
        break
    }
    return statusIcon
  }

  const validate = useCallback(() => {
    onValidate({
      name,
      endpointUrl,
      token,
      username,
      password
    })
  }, [name, endpointUrl, token, username, password, onValidate])

  const handleTokenInteraction = (isOpen) => {
    setShowTokenCreator(isOpen)
  }

  const fieldHasError = (fieldId) => {
    return validationErrors.some(e => e.includes(fieldId))
  }

  const getFieldError = (fieldId) => {
    return validationErrors.find(e => e.includes(fieldId))
  }

  useEffect(() => {
    if (!allowedAuthTypes.includes(authType)) {
      
    }
  }, [authType, allowedAuthTypes])

  useEffect(() => {
    setAllowedAuthTypes(['token', 'plain'])
  }, [])

  useEffect(() => {
    validate()
  }, [name, endpointUrl, token, username, password, validate])

  useEffect(() => {
    
  }, [isValid])

  return (
    <>
      <form className='form form-add-connection'>
        <div className='headlineContainer'>
          <h2 className='headline' style={{ marginTop: 0, textDecoration: isLocked ? 'line-through' : 'none' }}>Configure Connection</h2>
          <p className='description'>Instance Account & Authentication settings</p>
          {activeProvider && activeProvider.id && sourceLimits[activeProvider.id] && showLimitWarning && (
            <Card
              interactive={false} elevation={Elevation.TWO} style={{
                width: '100%',
                maxWidth: '480px',
                marginBottom: '20px',
                backgroundColor: '#f0f0f0'
              }}
            >
              <p className='warning-message' intent={Intent.WARNING}>
                <Icon icon='warning-sign' size='16' color={Colors.GRAY1} style={{ marginRight: '5px' }} />
                <strong>CONNECTION SOURCES LIMITED</strong><br />
                You may only add <Tag intent={Intent.PRIMARY}>{sourceLimits[activeProvider.id]}</Tag> instance(s) at this time,
                multiple sources will be supported in a future release.
              </p>
            </Card>
          )}
        </div>

        {showError && (
          <Card
            className='app-error-card'
            interactive={false}
            elevation={showLimitWarning ? Elevation.TWO : Elevation.ZERO}
            style={{
              maxWidth: '480px',
              marginBottom: '20px',
              backgroundColor: showLimitWarning ? '#f0f0f0' : 'transparent',
              border: showLimitWarning ? 'inherit' : 0
            }}
          >
            <p className='warning-message' intent={Intent.WARNING}>
              <Icon icon='error' size='16' color={Colors.RED4} style={{ marginRight: '5px' }} />
              <strong>UNABLE TO SAVE CONNECTION ({name !== '' ? name : 'BLANK'})</strong><br />
            </p>
            {errors.length > 0 && (
              <ul>
                {errors.map((errorMessage, idx) => (
                  <li key={`save-error-message-${idx}`}>{errorMessage}</li>
                ))}
              </ul>)}
          </Card>
        )}

        <div className='formContainer'>
          <FormGroup
            disabled={isTesting || isSaving || isLocked}
            readOnly={[Providers.GITHUB, Providers.GITLAB, Providers.JENKINS].includes(activeProvider.id)}
            label=''
            inline
            labelFor='connection-name'
            className='formGroup-inline'
            contentClassName='formGroupContent'
          >
            <Label style={{ display: 'inline', marginRight: 0 }}>
              {labels
                ? labels.name
                : (
                  <>Connection&nbsp;Name</>
                  )}
              <span className='requiredStar'>*</span>
            </Label>
            <InputGroup
              id='connection-name'
              disabled={isTesting || isSaving || isLocked}
              readOnly={[Providers.GITHUB, Providers.GITLAB, Providers.JENKINS].includes(activeProvider.id)}
              placeholder={placeholders ? placeholders.name : 'Enter Instance Name'}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={`input connection-name-input ${fieldHasError('Connection Source') ? 'invalid-field' : ''}`}
              leftIcon={[Providers.GITHUB, Providers.GITLAB, Providers.JENKINS].includes(activeProvider.id) ? 'lock' : null}
              inline
              rightElement={(
                <InputValidationError
                  error={getFieldError('Connection Source')}
                />
              )}
              // fill
            />
          </FormGroup>
        </div>

        <div className='formContainer'>
          <FormGroup
            disabled={isTesting || isSaving || isLocked}
            label=''
            inline
            labelFor='connection-endpoint'
            className='formGroup'
            contentClassName='formGroupContent'
          >
            <Label>
              {labels
                ? labels.endpoint
                : (
                  <>Endpoint&nbsp;URL</>
                  )}
              <span className='requiredStar'>*</span>
            </Label>
            <InputGroup
              id='connection-endpoint'
              disabled={isTesting || isSaving || isLocked}
              placeholder={placeholders ? placeholders.endpoint : 'Enter Endpoint URL'}
              value={endpointUrl}
              onChange={(e) => onEndpointChange(e.target.value)}
              className={`input endpoint-url-input ${fieldHasError('Endpoint') ? 'invalid-field' : ''}`}
              fill
              rightElement={(
                <InputValidationError
                  error={getFieldError('Endpoint')}
                />
              )}
            />
            {/* <a href='#' style={{ margin: '5px 0 5px 5px' }}><Icon icon='info-sign' size='16' /></a> */}
          </FormGroup>
        </div>

        {authType === 'token' && (
          <div className='formContainer'>
            <FormGroup
              disabled={isTesting || isSaving || isLocked}
              label=''
              inline
              labelFor='connection-token'
              className='formGroup'
              contentClassName='formGroupContent'
            >
              <Label style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {labels
                  ? labels.token
                  : (
                    <>Basic&nbsp;Auth&nbsp;Token</>
                    )}
                <span className='requiredStar'>*</span>
              </Label>
              <InputGroup
                id='connection-token'
                disabled={isTesting || isSaving || isLocked}
                placeholder={placeholders ? placeholders.token : 'Enter Auth Token eg. EJrLG8DNeXADQcGOaaaX4B47'}
                value={token}
                onChange={(e) => onTokenChange(e.target.value)}
                className={`input auth-input ${fieldHasError('Auth') ? 'invalid-field' : ''}`}
                fill
                required
                rightElement={(
                  <InputValidationError
                    error={getFieldError('Auth')}
                  />
                )}
              />
              {
                activeProvider.id === Providers.JIRA &&
                  <Popover
                    className='popover-generate-token'
                    position={Position.RIGHT}
                    autoFocus={false}
                    enforceFocus={false}
                    isOpen={showTokenCreator}
                    onInteraction={handleTokenInteraction}
                    onClosed={() => setShowTokenCreator(false)}
                    usePortal={false}
                  >
                    <Button
                      disabled={isTesting || isSaving || isLocked}
                      type='button' icon='key' intent={Intent.PRIMARY} style={{ marginLeft: '5px' }}
                    />
                    <>
                      <div style={{ padding: '15px 20px 15px 15px' }}>
                        <GenerateTokenForm
                          isTesting={isTesting}
                          isSaving={isSaving}
                          isLocked={isLocked}
                          onTokenChange={onTokenChange}
                          setShowTokenCreator={setShowTokenCreator}
                        />
                      </div>
                    </>
                  </Popover>
              }
              {/* <a href='#' style={{ margin: '5px 0 5px 5px' }}><Icon icon='info-sign' size='16' /></a> */}
            </FormGroup>
          </div>
        )}
        {authType === 'plain' && (
          <>
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Username & Password</h3>
              <span className='description' style={{ margin: 0, color: Colors.GRAY2 }}>
                If this connection uses login credentials to generate a token or uses PLAIN Auth, specify it here.
              </span>
            </div>
            <div className='formContainer'>
              <FormGroup
                label=''
                disabled={isTesting || isSaving || isLocked}
                inline
                labelFor='connection-username'
                className='formGroup'
                contentClassName='formGroupContent'
              >
                <Label style={{ display: 'inline' }}>
                  {labels
                    ? labels.username
                    : (
                      <>Username</>
                      )}
                  <span className='requiredStar'>*</span>
                </Label>
                <InputGroup
                  id='connection-username'
                  disabled={isTesting || isSaving || isLocked}
                  placeholder='Enter Username'
                  defaultValue={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  className={`input username-input ${fieldHasError('Username') ? 'invalid-field' : ''}`}
                  // style={{ maxWidth: '300px' }}
                  rightElement={(
                    <InputValidationError
                      error={getFieldError('Username')}
                    />
                  )}
                />
              </FormGroup>
            </div>
            <div className='formContainer'>
              <FormGroup
                disabled={isTesting || isSaving || isLocked}
                label=''
                inline
                labelFor='connection-password'
                className='formGroup'
                contentClassName='formGroupContent'
              >
                <Label style={{ display: 'inline' }}>
                  {labels
                    ? labels.password
                    : (
                      <>Password</>
                      )}
                  <span className='requiredStar'>*</span>
                </Label>
                <InputGroup
                  id='connection-password'
                  type='password'
                  disabled={isTesting || isSaving || isLocked}
                  placeholder='Enter Password'
                  defaultValue={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className={`input password-input ${fieldHasError('Password') ? 'invalid-field' : ''}`}
                  // style={{ maxWidth: '300px' }}
                  rightElement={(
                    <InputValidationError
                      error={getFieldError('Password')}
                    />
                  )}
                />
              </FormGroup>
            </div>
          </>
        )}
        {[Providers.GITHUB, Providers.GITLAB, Providers.JIRA].includes(activeProvider.id) && (
          <div className='formContainer'>
            <FormGroup
              disabled={isTesting || isSaving || isLocked}
              inline
              labelFor='connection-proxy'
              className='formGroup'
              contentClassName='formGroupContent'
            >
              <Label>
                {labels
                  ? labels.proxy
                  : (
                    <>Proxy&nbsp;URL</>
                    )}
              </Label>
              <InputGroup
                id='connection-proxy'
                placeholder={placeholders.proxy ? placeholders.proxy : 'http://proxy.localhost:8080'}
                defaultValue={proxy}
                onChange={(e) => onProxyChange(e.target.value)}
                disabled={isTesting || isSaving || isLocked}
                className={`input input-proxy ${fieldHasError('Proxy') ? 'invalid-field' : ''}`}
                rightElement={(
                  <InputValidationError
                    error={getFieldError('Proxy')}
                  />
                )}
              />
            </FormGroup>
          </div>
        )}
        <div
          className='form-actions-block'
          style={{ display: 'flex', marginTop: '30px', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex' }}>
            <Button
              id='btn-test'
              className='btn-test-connection'
              icon={getConnectionStatusIcon()}
              text='Test Connection'
              onClick={onTest}
              loading={isTesting}
              disabled={isTesting || isSaving || isLocked}
            />
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ justifyContent: 'center', padding: '8px' }}>
              {validationErrors.length > 0 && (
                <Popover interactionKind={PopoverInteractionKind.HOVER_TARGET_ONLY}>
                  <Icon icon='warning-sign' size={16} color={Colors.RED5} style={{ outline: 'none' }} />
                  <div style={{ padding: '5px' }}><FormValidationErrors errors={validationErrors} /></div>
                </Popover>
              )}
            </div>
            <Button className='btn-cancel' icon='remove' text='Cancel' onClick={onCancel} disabled={isSaving || isTesting} />
            <Button
              id='btn-save'
              className='btn-save'
              icon='cloud-upload' intent='primary' text='Save Connection'
              loading={isSaving}
              disabled={isSaving || isTesting || isLocked || !isValid}
              onClick={onSave}
            />
          </div>
        </div>
      </form>
    </>
  )
}
