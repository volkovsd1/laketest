import React, { useState, useEffect, useCallback } from 'react'
import { DEVLAKE_ENDPOINT } from '@/utils/config'
import request from '@/utils/request'
import { NullPipelineRun } from '@/data/NullPipelineRun'
import { ToastNotification } from '@/components/Toast'
// import { integrationsData } from '@/data/integrations'

function usePipelineManager (pipelineName = `COLLECTION ${Date.now()}`, initialTasks = []) {
  // const [integrations, setIntegrations] = useState(integrationsData)
  const [isFetching, setIsFetching] = useState(false)
  const [isFetchingAll, setIsFetchingAll] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [errors, setErrors] = useState([])
  const [settings, setSettings] = useState({
    name: pipelineName,
    tasks: [
      [...initialTasks]
    ]
  })

  const [pipelines, setPipelines] = useState([])
  const [pipelineCount, setPipelineCount] = useState(0)
  const [activePipeline, setActivePipeline] = useState(NullPipelineRun)
  const [lastRunId, setLastRunId] = useState(null)
  const [pipelineRun, setPipelineRun] = useState(NullPipelineRun)

  const runPipeline = useCallback(() => {
    
    try {
      setIsRunning(true)
      setErrors([])
      ToastNotification.clear()
      
      const run = async () => {
        const p = await request.post(`${DEVLAKE_ENDPOINT}/pipelines`, settings)
        const t = await request.get(`${DEVLAKE_ENDPOINT}/pipelines/${p.data?.ID || p.data?.id}/tasks`)
        
        setPipelineRun({ ...p.data, ID: p.data?.ID || p.data?.id, tasks: [...t.data.tasks] })
        setLastRunId(p.data?.ID || p.data?.id)
        ToastNotification.show({ message: `Created New Pipeline - ${pipelineName}.`, intent: 'danger', icon: 'small-tick' })
        setTimeout(() => {
          setIsRunning(false)
        }, 500)
      }
      run()
    } catch (e) {
      setIsRunning(false)
      setErrors([e.message])
      console.log('>> FAILED TO RUN PIPELINE!!', e)
    }
  }, [pipelineName, settings])

  const cancelPipeline = useCallback((pipelineID) => {
    try {
      setIsCancelling(true)
      setErrors([])
      ToastNotification.clear()
      
      const cancel = async () => {
        const c = await request.delete(`${DEVLAKE_ENDPOINT}/pipelines/${pipelineID}`)
        
        setPipelineRun(NullPipelineRun)
        ToastNotification.show({ message: `Pipeline RUN ID - ${pipelineID} Cancelled`, intent: 'danger', icon: 'small-tick' })
        setTimeout(() => {
          setIsCancelling(false)
        }, 500)
      }
      cancel()
    } catch (e) {
      setIsCancelling(false)
      setErrors([e.message])
      console.log('>> FAILED TO FETCH CANCEL PIPELINE RUN!!', pipelineID, e)
    }
  }, [])

  const fetchPipeline = useCallback((pipelineID, refresh = false) => {
    if (!pipelineID) {
      
      // return ToastNotification.show({ message: 'Pipeline ID Missing! Aborting Fetch...', intent: 'danger', icon: 'warning-sign' })
    }
    try {
      setIsFetching(true)
      setErrors([])
      ToastNotification.clear()
      
      const fetch = async () => {
        const p = await request.get(`${DEVLAKE_ENDPOINT}/pipelines/${pipelineID}`)
        const t = await request.get(`${DEVLAKE_ENDPOINT}/pipelines/${pipelineID}/tasks`)
        
        
        setActivePipeline({
          ...p.data,
          ID: p.data.ID || p.data.id,
          tasks: [...t.data.tasks]
        })
        setPipelineRun((pR) => refresh ? { ...p.data, ID: p.data.id, tasks: [...t.data.tasks] } : pR)
        setLastRunId((lrId) => refresh ? p.data?.ID : lrId)
        // ToastNotification.show({ message: `Fetched Pipeline ID - ${p.data?.ID}.`, intent: 'danger', icon: 'small-tick' })
        setTimeout(() => {
          setIsFetching(false)
        }, 500)
      }
      fetch()
    } catch (e) {
      setIsFetching(false)
      setErrors([e.message])
      setActivePipeline(NullPipelineRun)
      console.log('>> FAILED TO FETCH PIPELINE RUN!!', e)
    }
  }, [])

  const fetchPipelineTasks = useCallback(() => {
    try {
      setIsFetching(true)
      setErrors([])
      ToastNotification.clear()
    } catch (e) {
      setIsFetching(false)
      setErrors([e.message])
      console.log('>> FAILED TO FETCH PIPELINE RUN TASKS!!', e)
    }
  }, [])

  const fetchAllPipelines = useCallback(() => {
    try {
      setIsFetchingAll(true)
      setErrors([])
      ToastNotification.clear()
      
      const fetchAll = async () => {
        const p = await request.get(`${DEVLAKE_ENDPOINT}/pipelines`)
        
        let pipelines = p.data && p.data.pipelines ? [...p.data.pipelines] : []
        pipelines = pipelines.map(p => ({ ...p, ID: p.ID || p.id }))
        setPipelines(pipelines)
        setPipelineCount(p.data ? p.data.count : 0)
        // ToastNotification.show({ message: `Fetched All Pipelines`, intent: 'danger', icon: 'small-tick' })
        setTimeout(() => {
          setIsFetchingAll(false)
        }, 500)
      }
      fetchAll()
    } catch (e) {
      setIsFetchingAll(false)
      setErrors([e.message])
      setPipelines([])
      setPipelineCount(0)
      console.log('>> FAILED TO FETCH ALL PIPELINE RUNS!!', e)
    }
  }, [])

  const buildPipelineStages = useCallback((tasks = [], outputArray = false) => {
    let stages = {}
    let stagesArray = []
    tasks?.forEach(tS => {
      stages = {
        ...stages,
        [tS.pipelineRow]: tasks?.filter(t => t.pipelineRow === tS.pipelineRow)
      }
    })
    const stageKeys = Object.keys(stages)
    stagesArray = Object.values(stages)
    
    return outputArray ? stagesArray : stages
  }, [])

  useEffect(() => {
    
  }, [settings])

  useEffect(() => {

  }, [pipelineName, initialTasks])

  return {
    errors,
    isRunning,
    isFetching,
    isFetchingAll,
    isCancelling,
    settings,
    setSettings,
    pipelineRun,
    activePipeline,
    pipelines,
    pipelineCount,
    lastRunId,
    runPipeline,
    cancelPipeline,
    fetchPipeline,
    fetchPipelineTasks,
    fetchAllPipelines,
    buildPipelineStages
  }
}

export default usePipelineManager
