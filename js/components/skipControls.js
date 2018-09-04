const React = require('react');
const classNames = require('classnames');
const ControlButton = require('./controlButton');
const HoldControlButton = require('./holdControlButton');
const Icon = require('./icon');
const Utils = require('./utils');
const preserveKeyboardFocus = require('./higher-order/preserveKeyboardFocus');
const PropTypes = require('prop-types');
const CONSTANTS = require('../constants/constants');
const MACROS = require('../constants/macros');
const withVideoNavigation = require('./higher-order/withVideoNavigation');

class SkipControls extends React.Component {

  constructor(props) {
    super(props);
    this.storeRef = this.storeRef.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);

    this.handlePlayClick = this.handlePlayClick.bind(this);
  }

  /**
   * Stores a ref to this component's main element.
   * @private
   * @param {HTMLElement} domElement
   */
  storeRef(domElement) {
    this.domElement = domElement;
  }

  /**
   * Fired when the component is mounted. Notifies its parent about it's position
   * and dimensions (client rect).
   * @private
   */
  componentDidMount() {
    if (this.domElement && typeof this.props.onMount === 'function') {
      const clientRect = this.domElement.getBoundingClientRect();
      this.props.onMount(clientRect);
    }
  }

  /**
   * Handles the mouseenter event. Given that the SkipControls have pointer-events
   * set to 'none' in order to allow clicking through them, this event is only fired
   * when the mouse is over a button. Whenever this happens we cancel the auto-hide
   * controls timer.
   * @private
   */
  onMouseEnter() {
    this.props.controller.cancelTimer();
  }

  /**
   *
   */
  handlePlayClick() {
    this.props.controller.togglePlayPause();
  }

  /**
   * Gets a map which contains templates for each of the available buttons in
   * this component.
   * @private
   * @return {object} An object whose keys are the ids of the skip buttons (as
   * defined in the skin.json) and whose values are the button components that
   * match each id.
   */
  getButtonTemplate() {
    const buttonTemplate = {};
    const buttonStyle = {};
    const skipTimes = Utils.getSkipTimes(this.props.skinConfig);

    const skipBackwardAriaLabel = CONSTANTS.ARIA_LABELS.SKIP_BACKWARD.replace(
      MACROS.SECONDS,
      skipTimes.backward
    );
    const skipForwardAriaLabel = CONSTANTS.ARIA_LABELS.SKIP_FORWARD.replace(
      MACROS.SECONDS,
      skipTimes.forward
    );
    // Note that the button elements are still in the DOM even when the controls
    // are hidden. When controls are inactive we disable pointer events so that
    // the user won't accidentally trigger a button when bringing up the controls
    // on touch devices.
    if (this.props.isInactive) {
      buttonStyle.pointerEvents = 'none';
    }

    //TODO: This is duplicate code from controlBar.js
    var playIcon;
    var playPauseAriaLabel;
    var playBtnTooltip;
    if (this.props.controller.state.playerState === CONSTANTS.STATE.PLAYING) {
      playIcon = 'pause';
      playPauseAriaLabel = CONSTANTS.ARIA_LABELS.PAUSE;
      playBtnTooltip = CONSTANTS.SKIN_TEXT.PAUSE;
    } else if (this.props.controller.state.playerState === CONSTANTS.STATE.END) {
      playIcon = 'replay';
      playPauseAriaLabel = CONSTANTS.ARIA_LABELS.REPLAY;
      playBtnTooltip = CONSTANTS.SKIN_TEXT.REPLAY;
    } else {
      playIcon = 'play';
      playPauseAriaLabel = CONSTANTS.ARIA_LABELS.PLAY;
      playBtnTooltip = CONSTANTS.SKIN_TEXT.PLAY;
    }

    buttonTemplate[CONSTANTS.SKIP_CTRLS_KEYS.PREVIOUS_VIDEO] = (
      <ControlButton
        {...this.props}
        key={CONSTANTS.SKIP_CTRLS_KEYS.PREVIOUS_VIDEO}
        focusId={CONSTANTS.SKIP_CTRLS_KEYS.PREVIOUS_VIDEO}
        style={buttonStyle}
        className="oo-previous-video"
        icon="previous"
        ariaLabel={CONSTANTS.ARIA_LABELS.PREVIOUS_VIDEO}
        disabled={!this.props.config.hasPreviousVideos}
        onClick={this.props.onPreviousVideo}>
      </ControlButton>
    );

    buttonTemplate[CONSTANTS.SKIP_CTRLS_KEYS.SKIP_BACKWARD] = (
      <HoldControlButton
        {...this.props}
        key={CONSTANTS.SKIP_CTRLS_KEYS.SKIP_BACKWARD}
        focusId={CONSTANTS.SKIP_CTRLS_KEYS.SKIP_BACKWARD}
        style={buttonStyle}
        className="oo-center-button oo-skip-backward"
        icon="replay"
        ariaLabel={skipBackwardAriaLabel}
        onClick={this.props.onSkipBackward}>
        <span className="oo-btn-counter">{skipTimes.backward}</span>
      </HoldControlButton>
    );

    buttonTemplate[CONSTANTS.SKIP_CTRLS_KEYS.SKIP_FORWARD] = (
      <HoldControlButton
        {...this.props}
        key={CONSTANTS.SKIP_CTRLS_KEYS.SKIP_FORWARD}
        focusId={CONSTANTS.SKIP_CTRLS_KEYS.SKIP_FORWARD}
        style={buttonStyle}
        className="oo-center-button oo-skip-forward"
        icon="forward"
        ariaLabel={skipForwardAriaLabel}
        disabled={this.props.isAtLiveEdge()}
        onClick={this.props.onSkipForward}>
        <span className="oo-btn-counter">{skipTimes.forward}</span>
      </HoldControlButton>
    );

    buttonTemplate[CONSTANTS.SKIP_CTRLS_KEYS.NEXT_VIDEO] = (
      <ControlButton
        {...this.props}
        key={CONSTANTS.SKIP_CTRLS_KEYS.NEXT_VIDEO}
        focusId={CONSTANTS.SKIP_CTRLS_KEYS.NEXT_VIDEO}
        style={buttonStyle}
        className="oo-next-video"
        icon="next"
        ariaLabel={CONSTANTS.ARIA_LABELS.NEXT_VIDEO}
        disabled={!this.props.config.hasNextVideos}
        onClick={this.props.onNextVideo}>
      </ControlButton>
    );

    buttonTemplate[CONSTANTS.SKIP_CTRLS_KEYS.PLAY_PAUSE] = (
      <ControlButton
        {...this.props}
        key={CONSTANTS.CONTROL_BAR_KEYS.PLAY_PAUSE}
        className="oo-play-pause"
        focusId={CONSTANTS.CONTROL_BAR_KEYS.PLAY_PAUSE}
        ariaLabel={playPauseAriaLabel}
        icon={playIcon}
        tooltip={playBtnTooltip}
        onClick={this.handlePlayClick}>
      </ControlButton>
    );

    return buttonTemplate;
  }

  /**
   * Determines whether or not the button with the particular id can be displayed
   * considering the current player state and configuration.
   * @private
   * @param {string} buttonId The id of the button we want to check
   * @param {object} buttonConfig The configuration object from the skin config for the given button
   * @return {boolean} True if the button should be displayed, false otherwise
   */
  shouldDisplayButton(buttonId, buttonConfig) {
    const { config, controller } = this.props;
    const isSingleVideo = !config.hasPreviousVideos && !config.hasNextVideos;
    const duration = Utils.getPropertyValue(controller, 'state.duration');

    const isPrevNextButton = (
      buttonId === CONSTANTS.SKIP_CTRLS_KEYS.PREVIOUS_VIDEO ||
      buttonId === CONSTANTS.SKIP_CTRLS_KEYS.NEXT_VIDEO
    );
    const isSkipButton = (
      buttonId === CONSTANTS.SKIP_CTRLS_KEYS.SKIP_BACKWARD ||
      buttonId === CONSTANTS.SKIP_CTRLS_KEYS.SKIP_FORWARD
    );

    const isDisabled = (
      (isSkipButton && (!duration && !this.props.controller.state.audioOnly)) ||
      (isPrevNextButton && isSingleVideo) ||
      !(buttonConfig && buttonConfig.enabled)
    );
    return !isDisabled;
  }

  /**
   * Parses the skin.json's skip button configuration and returns the ids (button
   * names from the skin config) of the enabled buttons sorted by index in ascending order.
   * @private
   * @return {array} An array of button objects. Each object contains the id and index
   * of the button.
   */
  getSortedButtonEntries() {
    const buttons = [];
    var buttonConfig = Utils.getPropertyValue(
      this.props.skinConfig,
      'skipControls.buttons',
      {}
    );

    if (this.props.controller.state.audioOnly) {
      buttonConfig = Utils.getPropertyValue(
        this.props.skinConfig,
        'skipControls.audioOnlyButtons',
        {}
      );
    }
    // Find the ids and indexes of all enabled buttons
    for (let buttonId in buttonConfig) {
      const button = buttonConfig[buttonId];

      if (this.shouldDisplayButton(buttonId, button)) {
        buttons.push({
          id: buttonId,
          index: button.index
        });
      }
    }
    // Sort by index in ascending order
    buttons.sort(function(a, b) {
      return a.index - b.index;
    });
    return buttons;
  }

  render() {
    const buttons = this.getSortedButtonEntries();
    // Nothing to render if we don't have buttons
    if (!buttons.length) {
      return null;
    }

    const className = classNames('oo-skip-controls', {
      'oo-inactive': this.props.isInactive,
      'oo-in-background': this.props.isInBackground,
      'oo-skip-controls-centered': true,
      'oo-skip-controls-compact': this.props.controller.state.audioOnly
    });
    const buttonTemplate = this.getButtonTemplate();

    return (
      <div
        ref={this.storeRef}
        className={className}
        onMouseEnter={this.onMouseEnter}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}>
        {buttons.map(function(button) {
          return buttonTemplate[button.id];
        })}
      </div>
    );
  }

}

SkipControls.propTypes = {
  isInactive: PropTypes.bool,
  isInBackground: PropTypes.bool,
  language: PropTypes.string,
  localizableStrings: PropTypes.object,
  responsiveView: PropTypes.string.isRequired,
  skinConfig: PropTypes.object.isRequired,
  currentPlayhead: PropTypes.number.isRequired,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  config: PropTypes.shape({
    hasPreviousVideos: PropTypes.bool.isRequired,
    hasNextVideos: PropTypes.bool.isRequired
  }),
  controller: PropTypes.shape({
    state: PropTypes.shape({
      isMobile: PropTypes.bool.isRequired,
      isLiveStream: PropTypes.bool.isRequired,
      duration: PropTypes.number.isRequired,
      scrubberBar: PropTypes.shape({
        isHovering: PropTypes.bool
      })
    }),
    rewindOrRequestPreviousVideo: PropTypes.func.isRequired,
    requestNextVideo: PropTypes.func.isRequired,
    setFocusedControl: PropTypes.func.isRequired,
    startHideControlBarTimer: PropTypes.func.isRequired,
    cancelTimer: PropTypes.func.isRequired,
  }),
  a11yControls: PropTypes.shape({
    seekBy: PropTypes.func.isRequired
  })
};

module.exports = preserveKeyboardFocus(withVideoNavigation(SkipControls));
