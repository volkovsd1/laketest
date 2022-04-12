import React, { useState, useEffect, useCallback } from 'react'
import { DEVLAKE_ENDPOINT } from '@/utils/config'
import request from '@/utils/request'
import { NullPipelineRun } from '@/data/NullPipelineRun'
import { ToastNotification } from '@/components/Toast'
import { parseCronExpression } from 'cron-schedule'
import cron from 'cron-validate'

function useBlueprintManager (blueprintName = `BLUEPRINT WEEKLY ${Date.now()}`, initialConfiguration = {}) {
  const [isFetching, setIsFetching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [blueprints, setBlueprints] = useState([])
  const [blueprintCount, setBlueprintCount] = useState(0)
  const [blueprint, setBlueprint] = useState(null)
  const [errors, setErrors] = useState([])

  const [name, setName] = useState('DAILY BLUEPRINT')
  const [cronConfig, setCronConfig] = useState('0 0 * * *')
  const [customCronConfig, setCustomCronConfig] = useState('0 0 * * *')
  const [tasks, setTasks] = useState([])
  const [enable, setEnable] = useState(false)

  const [cronPresets, setCronPresets] = useState([
    // eslint-disable-next-line max-len
    { id: 0, name: 'hourly', label: 'Hourly', cronConfig: '59 * * * 1-5', description: 'At minute 59 on every day-of-week from Monday through Friday.' },
    { id: 1, name: 'daily', label: 'Daily', cronConfig: '0 0 * * *', description: 'At 00:00 (Midnight) on every day-of-week from Monday through Friday.' },
    { id: 2, name: 'weekly', label: 'Weekly', cronConfig: '0 0 * * 1', description: 'At 00:00 (Midnight) on Monday.' },
    { id: 3, name: 'monthly', label: 'Monthly', cronConfig: '0 0 1 * *', description: 'At 00:00 (Midnight) on day-of-month 1.' },
  ])

  const [saveComplete, setSaveComplete] = useState(false)
  const [deleteComplete, setDeleteComplete] = useState(false)

  const fetchAllBlueprints = useCallback(async (notify = false) => {
    try {
      setIsFetching(true)
      setErrors([])
      ToastNotification.clear()
      console.log('>> FETCHING ALL BLUEPRINTS')
      const b = await request.get(`${DEVLAKE_ENDPOINT}/blueprints`)
      console.log('>> RAW ALL BLUEPRINTS DATA FROM API...', b.data)
      const blueprints = [].concat(Array.isArray(b.data.blueprints) ? b.data.blueprints : []).map((blueprint, idx) => {
        return {
          ...blueprint,
          id: blueprint.id,
          enable: blueprint.enable,
          status: 0,
          nextRunAt: null, // @todo: calculate next run date
          interval: detectCronInterval(blueprint.cronConfig)
        }
      })
      if (notify) {
        ToastNotification.show({ message: 'Loaded all blueprints.', intent: 'success', icon: 'small-tick' })
      }
      setBlueprints(blueprints)
      setBlueprintCount(b.data.count || blueprints.length)
      setIsFetching(false)
    } catch (e) {
      console.log('>> FAILED TO FETCH ALL CONNECTIONS', e)
      ToastNotification.show({ message: `Failed to Load Blueprints - ${e.message}`, intent: 'danger', icon: 'error' })
      setIsFetching(false)
      setBlueprints([])
      setBlueprintCount(0)
      setErrors([e.message])
    }
  }, [])

  const fetchBlueprint = useCallback((blueprintId = null) => {
    console.log('>> FETCHING BLUEPRINT....')
    try {
      setIsFetching(true)
      setErrors([])
      ToastNotification.clear()
      console.log('>> FETCHING BLUEPRINT #', blueprintId)
      const fetch = async () => {
        const b = await request.get(`${DEVLAKE_ENDPOINT}/blueprints/${blueprintId}`)
        const blueprintData = b.data
        console.log('>> RAW BLUEPRINT DATA FROM API...', b)
        setBlueprint({
          ...blueprintData,
          id: blueprintData.id,
          enable: blueprint.enable,
          status: 0,
          nextRunAt: null, // @todo: calculate next run date
          interval: detectCronInterval(blueprint.cronConfig)
        })
        setTimeout(() => {
          setIsFetching(false)
        }, 500)
      }
      fetch()
    } catch (e) {
      setIsFetching(false)
      setBlueprint(null)
      setErrors([e.message])
      ToastNotification.show({ message: `${e}`, intent: 'danger', icon: 'error' })
      console.log('>> FAILED TO FETCH BLUEPRINT', e)
    }
  }, [])

  const saveBlueprint = useCallback((blueprintId = null) => {
    console.log('>> SAVING BLUEPRINT....')
    try {
      setIsSaving(true)
      setErrors([])
      ToastNotification.clear()
      const blueprintPayload = {
        name,
        cronConfig: cronConfig === 'custom' ? customCronConfig : cronConfig,
        tasks,
        enable: enable
      }
      console.log('>> DISPATCHING BLUEPRINT SAVE REQUEST', blueprintPayload)
      const run = async () => {
        // eslint-disable-next-line max-len
        // const b = await request.post(`${DEVLAKE_ENDPOINT}/blueprints`, blueprintPayload)
        const b = blueprintId
          ? await request.put(`${DEVLAKE_ENDPOINT}/blueprints/${blueprintId}`, blueprintPayload)
          : await request.post(`${DEVLAKE_ENDPOINT}/blueprints`, blueprintPayload)
        console.log('>> RAW BLUEPRINT DATA FROM API...', b.data)
        setBlueprint(b.data)
        setSaveComplete(b.data)
        ToastNotification.show({
          message: `${blueprintId ? 'Updated' : 'Created'} Blueprint - ${name}.`,
          intent: 'danger',
          icon: 'small-tick'
        })
        setTimeout(() => {
          setIsSaving(false)
        }, 500)
      }
      run()
    } catch (e) {
      setIsSaving(false)
      setErrors([e.message])
      setSaveComplete(false)
      console.log('>> FAILED TO SAVE BLUEPRINT!!', e)
    }
  }, [name, cronConfig, tasks, enable])

  const deleteBlueprint = useCallback(async (blueprint) => {
    try {
      setIsDeleting(true)
      setErrors([])
      console.log('>> TRYING TO DELETE BLUEPRINT...', blueprint)
      const d = await request.delete(`${DEVLAKE_ENDPOINT}/blueprints/${blueprint.id}`)
      console.log('>> BLUEPRINT DELETED...', d)
      setIsDeleting(false)
      setDeleteComplete({ status: d.status, data: d.data || null })
    } catch (e) {
      setIsDeleting(false)
      setDeleteComplete(false)
      setErrors([e.message])
      console.log('>> FAILED TO DELETE BLUEPRINT', e)
    }
  }, [])

  const createCronExpression = (cronExpression = '0 0 * * *') => {
    let newCron = parseCronExpression('0 0 * * *')
    try {
      if (cron(cronExpression).isValid()) {
        newCron = parseCronExpression(cronExpression)
      }
    } catch (e) {
      console.log('>> INVALID CRON EXPRESSION INPUT!', e)
    }
    return newCron
  }

  const getCronSchedule = useCallback((cronExpression, events = 5) => {
    let schedule = []
    try {
      const cS = cron(cronExpression).isValid() ? parseCronExpression(cronExpression) : parseCronExpression('0 0 * * *')
      schedule = cS ? cS.getNextDates(events) : []
    } catch (e) {
      console.log('>> INVALID CRON SCHEDULE!', e)
    }
    return schedule
  }, [])

  const getCronPreset = (presetName) => {
    return cronPresets.find(p => p.name === presetName)
  }

  const detectCronInterval = (cronConfig) => {
    return cronPresets.find(p => p.cronConfig === cronConfig)
      ? cronPresets.find(p => p.cronConfig === cronConfig).label
      : 'Custom'
  }

  const activateBlueprint = useCallback((blueprint) => {
    console.log('>> ACTIVATING BLUEPRINT....')
    try {
      setIsSaving(true)
      setErrors([])
      ToastNotification.clear()
      const blueprintPayload = {
        id: blueprint.id,
        name: blueprint.name,
        cronConfig: blueprint.cronConfig,
        tasks: blueprint.tasks || [],
        enable: true
      }
      console.log('>> DISPATCHING BLUEPRINT ACTIVATION REQUEST', blueprintPayload)
      const run = async () => {
        // eslint-disable-next-line max-len
        // const b = await request.post(`${DEVLAKE_ENDPOINT}/blueprints`, blueprintPayload)
        const activateB = await request.put(`${DEVLAKE_ENDPOINT}/blueprints/${blueprint.id}`, blueprintPayload)
        console.log('>> RAW BLUEPRINT DATA FROM API...', activateB.data)
        const updatedBlueprint = activateB.data
        // setBlueprint(b.data)
        // setSaveComplete(b.data)
        ToastNotification.show({ message: `Activated Blueprint - ${blueprint.name}.`, intent: 'danger', icon: 'small-tick' })
        setTimeout(() => {
          setIsSaving(false)
          fetchAllBlueprints()
        }, 500)
      }
      run()
    } catch (e) {
      setIsSaving(false)
      setErrors([e.message])
      // setSaveComplete(false)
      console.log('>> FAILED TO ACTIVATE BLUEPRINT!!', e)
    }
  }, [])

  const deactivateBlueprint = useCallback((blueprint) => {
    console.log('>> DEACTIVATING BLUEPRINT....')
    try {
      setIsSaving(true)
      setErrors([])
      ToastNotification.clear()
      const blueprintPayload = {
        id: blueprint.id,
        cronConfig: blueprint.cronConfig,
        tasks: tasks,
        enable: false
      }
      console.log('>> DISPATCHING BLUEPRINT ACTIVATION REQUEST', blueprintPayload)
      const run = async () => {
        // eslint-disable-next-line max-len
        // const b = await request.post(`${DEVLAKE_ENDPOINT}/blueprints`, blueprintPayload)
        const deactivateB = await request.put(`${DEVLAKE_ENDPOINT}/blueprints/${blueprint.id}`, blueprintPayload)
        console.log('>> RAW BLUEPRINT DATA FROM API...', deactivateB.data)
        const updatedBlueprint = deactivateB.data
        // setBlueprint(b.data)
        // setSaveComplete(b.data)
        ToastNotification.show({ message: `Deactivated Blueprint - ${blueprint.name}.`, intent: 'danger', icon: 'small-tick' })
        setTimeout(() => {
          setIsSaving(false)
          fetchAllBlueprints()
        }, 500)
      }
      run()
    } catch (e) {
      setIsSaving(false)
      setErrors([e.message])
      // setSaveComplete(false)
      console.log('>> FAILED TO DEACTIVATE BLUEPRINT!!', e)
    }
  }, [])

  return {
    blueprints,
    blueprintCount,
    name,
    cronConfig,
    customCronConfig,
    cronPresets,
    tasks,
    enable,
    saveBlueprint,
    deleteBlueprint,
    fetchAllBlueprints,
    fetchBlueprint,
    saveComplete,
    deleteComplete,
    createCronExpression,
    getCronSchedule,
    getCronPreset,
    detectCronInterval,
    activateBlueprint,
    deactivateBlueprint,
    setName,
    setCronConfig,
    setCustomCronConfig,
    setTasks,
    setEnable,
    isFetching,
    isSaving,
    isDeleting,
    errors
  }
}

export default useBlueprintManager
