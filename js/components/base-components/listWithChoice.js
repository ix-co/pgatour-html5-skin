var React = require("react");
var ListItem = require("./listItem");

var ListWithChoice = React.createClass({
  render: function() {
    var list = this.props.list.map(
      function(element, index) {
        return (
          <ListItem
            skinConfig={this.props.skinConfig}
            handleSelect={this.props.handleSelect}
            key={index}
            {...element}
          />
        );
      }.bind(this)
    );

    return (
      <div className="oo-list-with-choice">
        <div className="oo-list-header">{this.props.header}</div>
        <div className="oo-list-body">{list}</div>
      </div>
    );
  }
});

ListWithChoice.propTypes = {
  header: React.PropTypes.string,
  list: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      name: React.PropTypes.string,
      id: React.PropTypes.string,
      selected: React.PropTypes.bool
    })
  ),
  skinConfig: React.PropTypes.object,
  responsiveView: React.PropTypes.string
};

ListWithChoice.defaultProps = {
  header: "",
  list: [
    {
      name: "",
      id: "",
      selected: false
    }
  ],
  skinConfig: {
    responsive: {
      breakpoints: {
        xs: { id: "xs" },
        sm: { id: "sm" },
        md: { id: "md" },
        lg: { id: "lg" }
      }
    }
  },
  responsiveView: "md"
};

module.exports = ListWithChoice;
