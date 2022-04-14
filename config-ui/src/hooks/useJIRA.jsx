import { useEffect, useState, useCallback } from 'react'
import request from '@/utils/request'
import { ToastNotification } from '@/components/Toast'

const useJIRA = ({ apiProxyPath, issuesEndpoint, fieldsEndpoint }) => {
  const [isFetching, setIsFetching] = useState(false)
  const [issueTypes, setIssueTypes] = useState([])
  const [fields, setFields] = useState([])
  const [issueTypesResponse, setIssueTypesResponse] = useState([])
  const [fieldsResponse, setFieldsResponse] = useState([])
  const [error, setError] = useState()

  const fetchIssueTypes = useCallback(() => {
    try {
      if (apiProxyPath.includes('null')) {
        throw new Error('Connection Source ID is Null')
      }
      setError(null)
      const fetchIssueTypes = async () => {
        const issues = await
        request
          .get(issuesEndpoint)
          .catch(e => setError(e))
        
        setIssueTypesResponse(issues && Array.isArray(issues.data) ? issues.data : [])
        setTimeout(() => {
          setIsFetching(false)
        }, 1000)
      }
      fetchIssueTypes()
    } catch (e) {
      setIsFetching(false)
      setError(e)
      ToastNotification.show({ message: e.message, intent: 'danger', icon: 'error' })
    }
  }, [issuesEndpoint, apiProxyPath])

  const fetchFields = useCallback(() => {
    try {
      if (apiProxyPath.includes('null')) {
        throw new Error('Connection Source ID is Null')
      }
      setError(null)
      const fetchIssueFields = async () => {
        const fields = await
        request
          .get(fieldsEndpoint)
          .catch(e => setError(e))
        
        setFieldsResponse(fields && Array.isArray(fields.data) ? fields.data : [])
        setTimeout(() => {
          setIsFetching(false)
        }, 1000)
      }
      fetchIssueFields()
    } catch (e) {
      setIsFetching(false)
      setError(e)
      ToastNotification.show({ message: e.message, intent: 'danger', icon: 'error' })
    }
  }, [fieldsEndpoint, apiProxyPath])

  const createListData = (data = [], titleProperty = 'name', valueProperty = 'name') => {
    return data.map((d, dIdx) => {
      return {
        ...d,
        id: dIdx,
        key: d.key ? d.key : dIdx,
        title: d[titleProperty],
        value: d[valueProperty],
        type: d.schema?.type || 'string'
      }
    })
  }

  useEffect(() => {
    setIssueTypes(issueTypesResponse ? createListData(issueTypesResponse) : [])
  }, [issueTypesResponse])

  useEffect(() => {
    setFields(fieldsResponse ? createListData(fieldsResponse, 'name', 'key') : [])
  }, [fieldsResponse])

  useEffect(() => {
    
  }, [fields])

  useEffect(() => {
    if (error) {
      
    }
  }, [error])

  return {
    isFetching,
    fetchFields,
    fetchIssueTypes,
    createListData,
    issueTypesResponse,
    fieldsResponse,
    issueTypes,
    fields,
    error
  }
}

export default useJIRA
