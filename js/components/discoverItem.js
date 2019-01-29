var React = require('react'),
    Utils = require('./utils');
var createReactClass = require('create-react-class');
var PropTypes = require('prop-types');

var DiscoverItem = createReactClass({
  getInitialState: function() {
    return {
      imgError: false
    };
  },

  componentWillMount: function() {
    var img = new Image();
    img.src = this.props.src;

    // check if error occurs while loading img
    img.onerror = function() {
      this.setState({
        imgError: true
      });
    }.bind(this);
  },

  render: function() {
    // handle img error, return null
    if (this.state.imgError) {
      return null;
    }

    var thumbnailStyle = {
      backgroundImage: 'url(\'' + this.props.src + '\')'
    };

    var itemTitleStyle = {
      color: Utils.getPropertyValue(this.props.skinConfig, 'discoveryScreen.contentTitle.font.color'),
      fontFamily: Utils.getPropertyValue(
        this.props.skinConfig,
        'discoveryScreen.contentTitle.font.fontFamily'
      )
    };

    return (
      <div className="oo-discovery-image-wrapper-style">
        <div className="oo-discovery-wrapper">
          <a onClick={this.props.onClickAction}>
            <div className="oo-image-style" style={thumbnailStyle} />
          </a>
          {this.props.children}
        </div>
        <div
          className={this.props.contentTitleClassName}
          style={itemTitleStyle}
          dangerouslySetInnerHTML={Utils.createMarkup(this.props.contentTitle)}
        />
      </div>
    );
  }
});

DiscoverItem.propTypes = {
  skinConfig: PropTypes.shape({
    discoveryScreen: PropTypes.shape({
      contentTitle: PropTypes.shape({
        font: PropTypes.shape({
          color: PropTypes.string,
          fontFamily: PropTypes.string
        })
      })
    })
  })
};

module.exports = DiscoverItem;
