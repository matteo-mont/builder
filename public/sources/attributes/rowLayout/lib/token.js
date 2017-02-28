/* eslint react/jsx-no-bind: "off" */
import React from 'react'
import classNames from 'classnames'

import '../css/tokenizationList/token.less'

export default class Token extends React.Component {
  static propTypes = {
    index: React.PropTypes.number.isRequired,
    title: React.PropTypes.string.isRequired,
    removeCallback: React.PropTypes.func.isRequired,
    valid: React.PropTypes.bool
  }
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }
  handleClick () {
    this.props.removeCallback(this.props.index)
  }
  render () {
    let {title, valid} = this.props
    if (title.indexOf('%') >= 0) {
      title = title.indexOf(',') >= 0 ? title.slice(0, (title.indexOf(',') + 3)).replace('%', '') + '%' : title
      title = title.indexOf('.') >= 0 ? title.slice(0, (title.indexOf('.') + 3)).replace('%', '') + '%' : title
    }

    let tagClasses = classNames({
      'vcv-ui-tag-list-item': true,
      'vcv-ui-tag-list-item-error': !valid // add validation
    })
    return <span
      className={tagClasses}
      >
      {title}
      <button className='vcv-ui-tag-list-item-remove' type='button' title='Remove' onClick={this.handleClick}>
        <i className='vcv-ui-icon vcv-ui-icon-close-thin' />
      </button>
    </span>
  }
}
