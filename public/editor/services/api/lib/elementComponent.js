import React from 'react'
import ReactDOM from 'react-dom'
import lodash from 'lodash'
import vcCake from 'vc-cake'
import YoutubeBackground from './youtubeBackground'
import VimeoBackground from './vimeoBackground'
import ImageSimpleBackground from './imageSimpleBackground'
import ImageBackgroundZoom from './imageBackgroundZoom'
import ImageSlideshowBackground from './imageSlideshowBackground'
import EmbedVideoBackground from './embedVideoBackground'
import ColorGradientBackground from './colorGradientBackground'
import ParallaxBackground from './parallaxBackground'
import Divider from './divider'
import PropTypes from 'prop-types'

const shortcodesAssetsStorage = vcCake.getStorage('shortcodeAssets')
const elementsStorage = vcCake.getStorage('elements')
const assetsStorage = vcCake.getStorage('assets')

let dataProcessor = null

export default class ElementComponent extends React.Component {
  static propTypes = {
    id: PropTypes.string,
    api: PropTypes.object,
    atts: PropTypes.object,
    editor: PropTypes.object
  }

  constructor (props) {
    super(props)
    this.updateElementAssets = this.updateElementAssets.bind(this)
  }

  spinnerHTML () {
    return '<span class="vcv-ui-content-editable-helper-loader vcv-ui-wp-spinner"></span>'
  }

  // [gallery ids="318,93"]
  getShortcodesRegexp () {
    return new RegExp('\\[(\\[?)([\\w|-]+\\b)(?![\\w-])([^\\]\\/]*(?:\\/(?!\\])[^\\]\\/]*)*?)(?:(\\/)\\]|\\](?:([^\\[]*(?:\\[(?!\\/\\2\\])[^\\[]*)*)(\\[\\/\\2\\]))?)(\\]?)')
  }

  componentWillUnmount () {
    if (this.ajax) {
      this.ajax.cancelled = true
    }

    if (vcCake.env('FT_UPDATE_ASSETS_ONLY_WHEN_NEEDED')) {
      if (this.props.element && this.props.element.id) {
        elementsStorage.off(`element:${this.props.element.id}`, this.updateElementAssets)
      }
    }
  }

  componentDidMount () {
    if (vcCake.env('FT_UPDATE_ASSETS_ONLY_WHEN_NEEDED')) {
      if (this.props.element && this.props.element.id) {
        elementsStorage.on(`element:${this.props.element.id}`, this.updateElementAssets)
      }
    }
  }

  updateElementAssets (data, source, options) {
    this.updateElementAssetsWithExclusion(this.props.element.id, options)
  }

  updateElementAssetsWithExclusion (id, options, excludedAttributes = []) {
    if (!excludedAttributes.length) {
      assetsStorage.trigger('updateElement', id, options)
    } else if (options && excludedAttributes.indexOf(options.changedAttribute) < 0) {
      assetsStorage.trigger('updateElement', id, options)
    }
  }

  updateShortcodeToHtml (content, ref, cb) {
    if (content.match(this.getShortcodesRegexp())) {
      ref && (ref.innerHTML = this.spinnerHTML())
      if (!dataProcessor) {
        dataProcessor = vcCake.getService('dataProcessor')
      }
      this.ajax = dataProcessor.appServerRequest({
        'vcv-action': 'elements:ajaxShortcode:adminNonce',
        'vcv-shortcode-string': content,
        'vcv-nonce': window.vcvNonce,
        'vcv-source-id': window.vcvSourceID
      }).then((data) => {
        if (this.ajax && this.ajax.cancelled) {
          this.ajax = null
          return
        }
        let iframe = vcCake.env('iframe')

        try {
          ((function (window, document) {
            let jsonData = JSON.parse(data)
            let { headerContent, shortcodeContent, footerContent } = jsonData
            ref && (ref.innerHTML = '')

            let headerDom = window.jQuery('<div>' + headerContent + '</div>', document)
            headerDom.context = document
            shortcodesAssetsStorage.trigger('add', { type: 'header', ref: ref, domNodes: headerDom.children(), cacheInnerHTML: true, addToDocument: true })

            let shortcodeDom = window.jQuery('<div>' + shortcodeContent + '</div>', document)
            shortcodeDom.context = document
            if (shortcodeDom.children().length) {
              shortcodesAssetsStorage.trigger('add', { type: 'shortcode', ref: ref, domNodes: shortcodeDom.contents(), addToDocument: true })
            } else if (shortcodeDom.text()) {
              window.jQuery(ref).append(document.createTextNode(shortcodeDom.text()))
            }

            let footerDom = window.jQuery('<div>' + footerContent + '</div>', document)
            footerDom.context = document
            shortcodesAssetsStorage.trigger('add', { type: 'footer', ref: ref, domNodes: footerDom.children(), addToDocument: true, ignoreCache: true })
          })(iframe, iframe.document))
        } catch (e) {
          let isValidJsonFound = false
          let jsonString = this.getJsonFromString(data, 1)
          if (jsonString) {
            try {
              ((function (window, document) {
                let jsonData = JSON.parse(jsonString)
                let { headerContent, shortcodeContent, footerContent } = jsonData
                ref && (ref.innerHTML = '')

                let headerDom = window.jQuery('<div>' + headerContent + '</div>', document)
                headerDom.context = document
                shortcodesAssetsStorage.trigger('add', { type: 'header', ref: ref, domNodes: headerDom.children(), cacheInnerHTML: true, addToDocument: true })

                let shortcodeDom = window.jQuery('<div>' + shortcodeContent + '</div>', document)
                shortcodeDom.context = document
                if (shortcodeDom.children().length) {
                  shortcodesAssetsStorage.trigger('add', { type: 'shortcode', ref: ref, domNodes: shortcodeDom.contents(), addToDocument: true })
                } else if (shortcodeDom.text()) {
                  window.jQuery(ref).append(document.createTextNode(shortcodeDom.text()))
                }

                let footerDom = window.jQuery('<div>' + footerContent + '</div>', document)
                footerDom.context = document
                shortcodesAssetsStorage.trigger('add', { type: 'footer', ref: ref, domNodes: footerDom.children(), addToDocument: true, ignoreCache: true })
                isValidJsonFound = true
              })(iframe, iframe.document))
            } catch (pe) {
              console.warn(pe)
            }
          }
          if (!isValidJsonFound) {
            console.warn('failed to parse json', e, data)
          }
        }
        this.ajax = null
        cb && cb.constructor === Function && cb()
      })
    } else {
      ref && (ref.innerHTML = content)
    }
  }

  getJsonFromString = (string) => {
    let regex = /(\{"\w+".*\})/g
    var result = string.match(regex)
    if (result) {
      return result[0]
    }
    return false
  }

  updateInlineHtml (elementWrapper, html = '', tagString = '') {
    // const helper = document.createElement('vcvhelper')
    // const comment = document.createComment('[vcvSourceHtml]' + tagString + '[/vcvSourceHtml]')
    // elementWrapper.innerHTML = ''
    // let range = document.createRange()
    // let documentFragment = range.createContextualFragment(tagString)
    //
    // helper.appendChild(documentFragment)
    // elementWrapper.appendChild(comment)
    // elementWrapper.appendChild(helper)

    const helper = document.createElement('div')
    elementWrapper.innerHTML = ''
    if (!tagString) {
      tagString = html
    }
    helper.setAttribute('data-vcvs-html', `${tagString}`)
    helper.classList.add('vcvhelper')
    let range = document.createRange()
    let documentFragment = range.createContextualFragment(html)
    helper.appendChild(documentFragment)
    elementWrapper.appendChild(helper)
  }

  updateInlineScript (elementWrapper, tagString = '') {
    const helper = document.createElement('div')
    elementWrapper.innerHTML = ''
    let scriptHtml = `<script type="text/javascript">${tagString}</script>`
    helper.classList.add('vcvhelper')
    helper.setAttribute('data-vcvs-html', `${scriptHtml}`)
    let script = document.createElement('script')
    script.type = 'text/javascript'
    let escapedString = escape(tagString)
    script.text = `try{ 
      eval(unescape('${escapedString}'))
    } catch(e) {console.warn(e);}`
    // TODO: add catched error message to console..
    helper.appendChild(script)
    elementWrapper.appendChild(helper)
  }

  getDomNode () {
    return ReactDOM.findDOMNode(this)
  }

  getBackgroundClass (designOptions) {
    let { device } = designOptions
    let classes = []
    if (device) {
      let { all } = device
      if (all && (all.backgroundColor !== undefined || (all.images && all.images.urls && all.images.urls.length))) {
        classes.push('vce-element--has-background')
      } else {
        for (let currentDevice in device) {
          if (device[ currentDevice ] && (device[ currentDevice ].backgroundColor !== undefined || (device[ currentDevice ].images && device[ currentDevice ].images.urls && device[ currentDevice ].images.urls.length))) {
            classes.push(`vce-element--${currentDevice}--has-background`)
          }
        }
      }
    }
    return classes.join(' ')
  }

  applyDO (prop) {
    let propObj = {}

    // checking all
    if (prop === 'all') {
      prop += ` el-${this.props.id}`
      propObj[ 'data-vce-do-apply' ] = prop

      let animationData = this.getAnimationData()
      if (animationData) {
        propObj[ 'data-vce-animate' ] = animationData
      }
      return propObj
    }

    // checking animate
    if (prop.indexOf('animation') >= 0) {
      if (prop !== 'animation') {
        prop = prop.replace('animation', '')
        prop += ` el-${this.props.id}`
        propObj[ 'data-vce-do-apply' ] = prop
      }

      let animationData = this.getAnimationData()
      if (animationData) {
        propObj[ 'data-vce-animate' ] = animationData
      }
      return propObj
    }

    prop += ` el-${this.props.id}`
    propObj[ 'data-vce-do-apply' ] = prop
    return propObj
  }

  getAnimationData () {
    let animationData = ''
    let designOptions = this.props.atts && (this.props.atts.designOptions || this.props.atts.designOptionsAdvanced)

    if (designOptions && designOptions.device) {
      let animations = []
      Object.keys(designOptions.device).forEach((device) => {
        let prefix = (device === 'all') ? '' : device
        if (designOptions.device[ device ].animation) {
          if (prefix) {
            prefix = `-${prefix}`
          }
          animations.push(`vce-o-animate--${designOptions.device[ device ].animation}${prefix}`)
        }
      })
      if (animations.length) {
        animationData = animations.join(' ')
      }
    }
    return animationData
  }

  getMixinData (mixinName) {
    const vcCake = require('vc-cake')
    const assetsStorage = vcCake.getService('modernAssetsStorage').getGlobalInstance()
    let returnData = null
    let mixinData = assetsStorage.getCssMixinsByElement(this.props.atts)
    let { tag } = this.props.atts
    if (mixinData[ tag ] && mixinData[ tag ][ mixinName ]) {
      let mixin = Object.keys(mixinData[ tag ][ mixinName ])
      mixin = mixin.length ? mixin.pop() : null
      if (mixin) {
        returnData = mixinData[ tag ][ mixinName ][ mixin ]
      }
    } else {
      returnData = mixinData[ tag ] || mixinData
    }
    return returnData
  }

  // TODO: Unused method, consider removing?
  getAttributeMixinData (attributeName) {
    const vcCake = require('vc-cake')
    const assetsStorage = vcCake.getService('modernAssetsStorage').getGlobalInstance()
    let returnData = null
    let mixinData = assetsStorage.getAttributesMixinsByElement(this.props.atts)
    let { tag } = this.props.atts
    if (mixinData[ tag ] && mixinData[ tag ][ attributeName ] && mixinData[ tag ][ attributeName ].variables) {
      returnData = mixinData[ tag ][ attributeName ].variables
    }
    return returnData
  }

  getBackgroundTypeContent () {
    let { designOptionsAdvanced } = this.props.atts
    if (lodash.isEmpty(designOptionsAdvanced) || lodash.isEmpty(designOptionsAdvanced.device)) {
      return null
    }
    let { device } = designOptionsAdvanced
    let backgroundData = []
    Object.keys(device).forEach((deviceKey) => {
      let { parallax, gradientOverlay } = device[ deviceKey ]
      let backgroundElements = []
      let reactKey = `${this.props.id}-${deviceKey}-${device[ deviceKey ].backgroundType}`
      switch (device[ deviceKey ].backgroundType) {
        case 'imagesSimple':
          backgroundElements.push(
            <ImageSimpleBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'backgroundZoom':
          backgroundElements.push(
            <ImageBackgroundZoom deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'imagesSlideshow':
          backgroundElements.push(
            <ImageSlideshowBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'videoYoutube':
          backgroundElements.push(
            <YoutubeBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'videoVimeo':
          backgroundElements.push(
            <VimeoBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
        case 'videoEmbed':
          backgroundElements.push(
            <EmbedVideoBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
              key={reactKey} atts={this.props.atts} />)
          break
      }

      // parallax
      if (gradientOverlay) {
        reactKey = `${this.props.id}-${deviceKey}-${device[ deviceKey ]}-gradientOverlay`
        backgroundElements.push(
          <ColorGradientBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
            key={reactKey} atts={this.props.atts} applyBackground={this.applyDO('gradient')} />)
      }

      if (parallax) {
        reactKey = `${this.props.id}-${deviceKey}-${device[ deviceKey ]}-parallax`
        backgroundData.push(
          <ParallaxBackground deviceData={device[ deviceKey ]} deviceKey={deviceKey} reactKey={reactKey}
            key={reactKey} atts={this.props.atts} content={backgroundElements} />)
      } else {
        backgroundData.push(backgroundElements)
      }
    })
    if (backgroundData.length) {
      return <div className='vce-content-background-container'>
        {backgroundData}
      </div>
    }
    return null
  }

  getContainerDivider () {
    let { designOptionsAdvanced, dividers } = this.props.atts

    if (lodash.isEmpty(dividers) || lodash.isEmpty(dividers.device)) {
      return null
    }

    let { device } = dividers
    let dividerElements = []
    let customDevices = []
    let parallaxDevices = []
    let actualDevices = []
    let designOptionsDevices = designOptionsAdvanced && designOptionsAdvanced.device

    designOptionsDevices && Object.keys(designOptionsDevices).forEach((device) => {
      if (device !== 'all') {
        customDevices.push(device)
      }
      if (designOptionsDevices[ device ].hasOwnProperty('parallax')) {
        parallaxDevices.push(device)
      }
    })

    if (customDevices.length && parallaxDevices.length) {
      actualDevices = customDevices
    } else {
      Object.keys(device).forEach((device) => {
        actualDevices.push(device)
      })
    }

    actualDevices.forEach((deviceKey, index) => {
      let dividerDeviceKey = device[ deviceKey ] ? deviceKey : 'all'
      let dividerDeviceData = device[ dividerDeviceKey ]
      let { dividerTop, dividerBottom } = dividerDeviceData
      let parallaxKey = (parallaxDevices.indexOf('all') === -1 && parallaxDevices.indexOf(deviceKey) > -1) ? deviceKey : 'all'

      if (dividerTop) {
        let reactKey = `${this.props.id}-${deviceKey}-top-${index}`
        let dividerElement = (
          <Divider deviceData={dividerDeviceData} deviceKey={deviceKey} type={'Top'}
            metaAssetsPath={this.props.atts.metaAssetsPath} key={reactKey} id={this.props.id}
            applyDivider={this.applyDO('divider')} />
        )

        if (parallaxDevices.indexOf(deviceKey) > -1 || parallaxDevices.indexOf('all') > -1) {
          dividerElements.push(
            <ParallaxBackground deviceData={designOptionsAdvanced.device[ parallaxKey ]} deviceKey={parallaxKey}
              reactKey={reactKey}
              key={reactKey} atts={this.props.atts} content={dividerElement} divider={dividerTop} />
          )
        } else {
          dividerElements.push(dividerElement)
        }
      }

      if (dividerBottom) {
        let reactKey = `${this.props.id}-${deviceKey}-bottom-${index}`

        let dividerElement = (
          <Divider deviceData={dividerDeviceData} deviceKey={deviceKey} type={'Bottom'}
            metaAssetsPath={this.props.atts.metaAssetsPath} key={reactKey} id={this.props.id}
            applyDivider={this.applyDO('divider')} />
        )

        if (parallaxDevices.indexOf(deviceKey) > -1 || parallaxDevices.indexOf('all') > -1) {
          dividerElements.push(
            <ParallaxBackground deviceData={designOptionsAdvanced.device[ parallaxKey ]} deviceKey={parallaxKey}
              reactKey={reactKey}
              key={reactKey} atts={this.props.atts} content={dividerElement} divider={dividerBottom} />
          )
        } else {
          dividerElements.push(dividerElement)
        }
      }
    })

    if (dividerElements.length === 0) {
      return null
    }

    return <div className='vce-dividers-wrapper'>
      {dividerElements}
    </div>
  }

  getImageUrl (image, size) {
    if (!image) {
      return null
    }
    let imageUrl
    // Move it to attribute
    if (size && image && image[ size ]) {
      imageUrl = image[ size ]
    } else {
      if (image instanceof Array || (image.urls && image.urls instanceof Array)) {
        let urls = []
        const images = image.urls || image
        images.forEach((item) => {
          let url = item && item.full && item.id ? item.full : (item && item.full ? this.getPublicImage(item.full) : this.getPublicImage(item))
          urls.push(url)
        })
        imageUrl = urls
      } else {
        imageUrl = image && image.full && image.id ? image.full : (image && image.hasOwnProperty('full') ? this.getPublicImage(image.full) : this.getPublicImage(image))
      }
    }
    return imageUrl
  }

  getPublicImage (filename) {
    let { metaAssetsPath } = this.props.atts
    if (!filename) {
      return ''
    }

    return filename.match('^(https?:)?\\/\\/?') ? filename : metaAssetsPath + filename
  }

  getStickyAttributes (sticky) {
    let attributes = {}
    if (Object.keys(sticky.device).length) {
      let deviceKeys = Object.keys(sticky.device)
      deviceKeys.forEach((deviceKey) => {
        // At the moment allow only for device "all"
        if (deviceKey === 'all') {
          let device = sticky.device[ deviceKey ]
          if (device.stickyEnable) {
            attributes[ 'data-vce-sticky-element' ] = true

            if (device.stickyOffsetTop && device.stickyOffsetTop !== '0') {
              attributes[ 'data-margin-top' ] = device.stickyOffsetTop
            }

            if (device.stickyZIndex) {
              attributes[ 'data-vce-sticky-z-index' ] = device.stickyZIndex
            }

            if (device.stickyContainer) {
              attributes[ 'data-vce-sticky-container' ] = '[data-vce-element-content]'
            }

            if (device.stickyVisibility) {
              attributes[ 'data-vce-sticky-visibility' ] = device.stickyVisibility
            }
          }
        }
      })
    }
    return attributes
  }

  render () {
    return null
  }
}
