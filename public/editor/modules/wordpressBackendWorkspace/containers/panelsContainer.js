import React from 'react'
import classNames from 'classnames'
import ContentStart from '../../../../resources/components/contentParts/contentStart'
import ContentEnd from '../../../../resources/components/contentParts/contentEnd'
import AddElementPanel from '../../../../resources/components/addElement/addElementPanel'
import AddTemplatePanel from '../../../../resources/components/addTemplate/addTemplatePanel'
import TreeViewLayout from '../../../../resources/components/treeView/treeViewLayout'
import SettingsPanel from '../../../../resources/components/settings/settingsPanel'
import EditElementPanel from '../../../../resources/components/editElement/editElementPanel'
import {getService} from 'vc-cake'

const cook = getService('cook')

export default class PanelsContainer extends React.Component {
  static propTypes = {
    start: React.PropTypes.oneOfType([
      React.PropTypes.arrayOf(React.PropTypes.node),
      React.PropTypes.node
    ]),
    end: React.PropTypes.oneOfType([
      React.PropTypes.arrayOf(React.PropTypes.node),
      React.PropTypes.node
    ]),
    settings: React.PropTypes.object,
    layoutWidth: React.PropTypes.number,
    contentStartId: React.PropTypes.string
  }

  constructor (props) {
    super(props)
    this.state = {
      stack: this.props.layoutWidth < 800
    }
    this.getBarsHeight = this.getBarsHeight.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.layoutWidth < 800 && !this.state.stack) {
      this.setState({ stack: true })
    } else if (nextProps.layoutWidth > 800 && this.state.stack) {
      this.setState({ stack: false })
    }
  }

  /**
   * Get the height of WP admin bar and layoutBar
   * @param layoutBar element
   * @param adminBar element
   * @return barsHeight number
   */
  getBarsHeight (layoutBar, adminBar) {
    let barsHeight = layoutBar.getBoundingClientRect().height
    if (window.getComputedStyle(adminBar).position === 'fixed') {
      barsHeight += adminBar.getBoundingClientRect().height
    }
    return barsHeight
  }

  getStartContent () {
    const { start, contentStartId } = this.props
    if (start === 'treeView') {
      return <TreeViewLayout scrollValue={this.getBarsHeight} contentStartId={contentStartId} />
    }
  }

  getEndContent () {
    const { end, settings } = this.props
    if (end === 'addElement') {
      return <AddElementPanel options={settings || {}} />
    } else if (end === 'addTemplate') {
      return <AddTemplatePanel />
    } else if (end === 'settings') {
      return <SettingsPanel />
    } else if (end === 'editElement') {
      if (settings && settings.element) {
        const activeTabId = settings.tag || ''
        const cookElement = cook.get(settings.element)
        return <EditElementPanel key={`panels-container-edit-element-${cookElement.get('id')}`} element={cookElement} activeTabId={activeTabId} />
      }
    }
  }

  render () {
    const { start, end } = this.props
    const { stack } = this.state
    let layoutClasses = classNames({
      'vcv-layout-bar-content': true,
      'vcv-ui-state--visible': !!(start || end),
      'vcv-layout-bar-content-stack': stack
    })

    return (
      <div className={layoutClasses}>
        <ContentStart>
          {this.getStartContent()}
        </ContentStart>
        <ContentEnd content={end} >
          {this.getEndContent()}
        </ContentEnd>
      </div>
    )
  }
}
