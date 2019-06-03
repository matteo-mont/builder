import vcCake from 'vc-cake'

export const setupCake = () => {
  vcCake.env('platform', 'wordpress').start(() => {
    vcCake.env('editor', 'frontend')
    require('../../editor/stores/events/eventsStorage')
    require('../../editor/stores/elements/elementsStorage')
    require('../../editor/stores/assets/assetsStorage')
    require('../../editor/stores/shortcodesAssets/storage')
    require('../../editor/stores/cacheStorage')
    require('../../editor/stores/migrationStorage')

    require('../../editor/stores/workspaceStorage')
    require('../../editor/stores/hub/hubElementsStorage')
    require('../../editor/stores/hub/hubTemplatesStorage')
    require('../../editor/stores/hub/hubAddonsStorage')
    const hubElementsStorage = vcCake.getStorage('hubElements')
    hubElementsStorage.trigger('start')
    const hubTemplatesStorage = vcCake.getStorage('hubTemplates')
    hubTemplatesStorage.trigger('start')
    const hubAddonsStorage = vcCake.getStorage('hubAddons')
    hubAddonsStorage.trigger('start')
    require('../../editor/stores/sharedAssets/storage')
    const sharedAssetsStorage = vcCake.getStorage('sharedAssets')
    sharedAssetsStorage.trigger('start')
    require('../../editor/stores/history/historyStorage')
    require('../../editor/stores/settingsStorage')
    const settingsStorage = vcCake.getStorage('settings')
    settingsStorage.trigger('start')
    require('../../editor/stores/notifications/storage')
    require('../../editor/stores/wordpressData/wordpressDataStorage')
    // require('./editor/stores/elementsLoader/elementsLoaderStorage')
    require('../../config/wp-modules')
  })
}
