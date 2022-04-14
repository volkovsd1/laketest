import { useState, useEffect } from 'react'
import {
  useHistory
} from 'react-router-dom'
import { ToastNotification } from '@/components/Toast'
import { DEVLAKE_ENDPOINT } from '@/utils/config'
import request from '@/utils/request'
import { Providers } from '@/data/Providers'

function useSettingsManager ({
  activeProvider,
  activeConnection,
  settings,
}) {
  const history = useHistory()

  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [errors, setErrors] = useState([])
  const [showError, setShowError] = useState(false)

  const saveSettings = () => {
    setIsSaving(true)
    const settingsPayload = {
      ...buildConnectionPayload(activeConnection),
      ...settings,
      // DEV: true
    }

    let saveResponse = {
      success: false,
      settings: {
        ...settingsPayload
      },
      errors: []
    }

    const saveConfiguration = async (settingsPayload) => {
      try {
        setShowError(false)
        ToastNotification.clear()
        const s = await request.put(`${DEVLAKE_ENDPOINT}/plugins/${activeProvider.id}/sources/${activeConnection.ID}`, settingsPayload)
        
        saveResponse = {
          ...saveResponse,
          success: [200, 201].includes(s.status),
          settings: { ...s.data },
          errors: s.isAxiosError ? [s.message] : []
        }
      } catch (e) {
        saveResponse.errors.push(e.message)
        setErrors(saveResponse.errors)
        console.log('>> SETTINGS FAILED TO SAVE', settingsPayload, e)
      }
    }

    saveConfiguration(settingsPayload)

    setTimeout(() => {
      if (saveResponse.success && errors.length === 0) {
        ToastNotification.show({ message: 'Instance Settings saved successfully.', intent: 'success', icon: 'small-tick' })
        setShowError(false)
        setIsSaving(false)
      } else {
        ToastNotification.show({ message: 'Instance Settings failed to save, please try again.', intent: 'danger', icon: 'error' })
        setShowError(true)
        setIsSaving(false)
      }
    }, 2000)
  }

  const buildConnectionPayload = (connection) => {
    let connectionPayload = {}
    switch (activeProvider.id) {
      case Providers.JIRA:
        connectionPayload = {
          ...connectionPayload,
          name: connection.name,
          Endpoint: connection.endpoint,
          BasicAuthEncoded: connection.basicAuthEncoded,
          Proxy: connection.proxy || connection.Proxy
        }
        break
      case Providers.GITHUB:
        connectionPayload = {
          ...connectionPayload,
          name: connection.name,
          GITHUB_ENDPOINT: connection.endpoint,
          GITHUB_AUTH: connection.Auth,
          GITHUB_PROXY: connection.proxy || connection.Proxy
        }
        break
      case Providers.JENKINS:
        connectionPayload = {
          ...connectionPayload,
          name: connection.name,
          JENKINS_ENDPOINT: connection.endpoint,
          JENKINS_USERNAME: connection.username,
          JENKINS_PASSWORD: connection.password
        }
        break
      case Providers.GITLAB:
        connectionPayload = {
          ...connectionPayload,
          name: connection.name,
          GITLAB_ENDPOINT: connection.endpoint,
          GITLAB_AUTH: connection.Auth,
          GITLAB_PROXY: connection.proxy || connection.Proxy
        }
        break
    }
    return connectionPayload
  }

  const clear = () => {

  }

  const restore = () => {

  }

  return {
    saveSettings,
    clear,
    restore,
    isSaving,
    isTesting,
    errors,
    showError,
    setIsSaving,
    setIsTesting,
    setErrors,
    setShowError,
    buildConnectionPayload,
    settings
  }
}

export default useSettingsManager
