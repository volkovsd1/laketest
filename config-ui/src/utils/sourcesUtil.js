import { DEVLAKE_ENDPOINT } from './config.js'
import request from './request'
import PLUGINS from '../data/availablePlugins'

const SourcesUtil = {
  getPluginSources: async () => {
    const pluginsToSet = []
    const errors = []
    for (const plugin of PLUGINS) {
      try {
        const res = await request.get(`${DEVLAKE_ENDPOINT}/plugins/${plugin}/sources`)
        if (res?.data?.length > 0) {
          pluginsToSet.push(plugin)
        }
      } catch (error) {
        errors.push(error)
      }
    }
    if (errors.length > 0) {
      
    }
    return pluginsToSet
  }
}

export default SourcesUtil
