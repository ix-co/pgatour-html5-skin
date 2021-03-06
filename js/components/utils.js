/**
* Utility class that holds helper functions
*
* @module Utils
*/
var DeepMerge = require('deepmerge');
var CONSTANTS = require('./../constants/constants');

var Utils = {

  /**
   * Searches for focusable elements inside domElement and gives focus to the first one
   * found. Focusable elements are assumed to be those with the data-focus-id attribute which is
   * used for various purposes in this project. If the excludeClass parameter is passed, elements
   * that have a matching class will be excluded from the search.
   * @function autoFocusFirstElement
   * @param {HTMLElement} domElement A DOM element that contains the element we want to focus.
   * @param {String} excludeClass A single className that we want the search query to filter out.
   */
  autoFocusFirstElement: function(domElement, excludeClass) {
    if (!domElement || typeof domElement.querySelector !== 'function') {
      return;
    }
    var query = '[' + CONSTANTS.KEYBD_FOCUS_ID_ATTR + ']';

    if (excludeClass) {
      query += ':not(.' + excludeClass + ')';
    }
    var firstFocusableElement = domElement.querySelector(query);

    if (firstFocusableElement && typeof firstFocusableElement.focus === 'function') {
      firstFocusableElement.focus();
    }
  },

  /**
   * Some browsers give focus to buttons after click, which leaves them highlighted.
   * This can be used to override the browsers' default behavior.
   *
   * @function blurOnMouseUp
   * @param {Event} MouseUp event object.
   */
  blurOnMouseUp: function(event) {
    if (event && event.currentTarget && typeof event.currentTarget.blur === 'function') {
      event.currentTarget.blur();
    }
  },

  /**
   * Converts a value to a number or returns null if it can't be converted or is not finite value.
   *
   * @function ensureNumber
   * @param {Object} value The value to convert.
   * @param {Number} defaultValue A default value to return when the input is not a valid number.
   * @return {Number} The Number equivalent of value if it can be converted and is finite.
   * When value doesn't meet the criteria the function will return either defaultValue (if provided) or null.
   */
  ensureNumber: function(value, defaultValue) {
    var number = Number(value);
    if (!isFinite(number)) {
      return (typeof defaultValue === 'undefined') ? null : defaultValue;
    }
    return number;
  },

  /**
   * Ensures that a number falls within a specified range. When a number is outside of
   * a range the function will return either the minimum or maximum allowed value depending on the case.
   *
   * @function constrainToRange
   * @param {Number} value The numerical value to constrain.
   * @param {Number} min The minimum value of the range.
   * @param {Number} max The maximum value of the range.
   * @return {Number} The Number equivalent of value if it falls between min and max,
   * min if it falls below, max if it falls above.
   */
  constrainToRange: function(value, min, max) {
    value = this.ensureNumber(value, 0);
    min = this.ensureNumber(min, 0);
    max = this.ensureNumber(max, 0);
    return Math.min(Math.max(min, value), max);
  },

  /**
   * Same as Number.toFixed(), except that it returns a Number instead of a string.
   * @function toFixedNumber
   * @param {Object} value The numerical value to process.
   * @param {Number} digits The number of digits to appear after the decimal point.
   * @return {Number} The equivalent of value with the specified precision. Will return 0 if value is not a valid number.
   */
  toFixedNumber: function(value, digits) {
    var result = this.ensureNumber(value, 0);
    result = this.ensureNumber(result.toFixed(digits));
    return result;
  },

  /**
   * Returns the currentTime and totalTime values in HH:MM format that can be used for
   * a video time display UI or for ARIA labels.
   * Note that the meaning of these values changes depending on the type of video:
   * VOD
   *  currentTime: Formatted value of current playhead
   *  totalTime: Formatted value of video duration
   * Live - No DVR
   *  currentTime: Empty string
   *  totalTime: Empty string
   * Live - DVR - useNegativeDvrOffset === true
   *  currentTime: Formatted value of the negative offset from the live playhead. Empty string if playhead is at the Live position
   *  totalTime: Empty string
   * Live - DVR - useNegativeDvrOffset === false
   *  currentTime: Formatted value of the current playhead relative to max time shift
   *  totalTime: Formatted value of the total duration of the DVR window
   * NOTE:
   * Either property can be returned as an empty string if the parameters don't match the requirements.
   *
   * @function getTimeDisplayValues
   * @param {Number} currentPlayhead The current value of the playhead in seconds.
   * @param {Number} duration The total duration of the video in seconds. Should be -0 or Infinity for Live videos with no DVR.
   * @param {Boolean} isLiveStream Indicates whether the video is a livestream or not.
   * @param {Number} useNegativeDvrOffset Whether to display DVR progress as a negative offset value or not.
   * @return {Object} An object with currentTime and totalTime properties in HH:MM format. Either of these
   * might be an empty string depending on the conditions above.
   */
  getTimeDisplayValues: function(currentPlayhead, duration, isLiveStream, useNegativeDvrOffset) {
    currentPlayhead = this.ensureNumber(currentPlayhead);
    duration = this.ensureNumber(duration, 0);

    var currentTime = '';
    var totalTime = '';

    var currentPlayheadInt = parseInt(currentPlayhead, 10);
    var currentPlayheadTime = isFinite(currentPlayheadInt) ? this.formatSeconds(currentPlayheadInt) : null;
    var timeShift = (currentPlayhead || 0) - duration;

    if (duration) {
      totalTime = this.formatSeconds(duration);
    }

    if (isLiveStream) {
      // Checking timeShift < 1 second (not === 0) as processing of the click after we
      // rewinded and then went live may take some time.
      var isLiveNow = Math.abs(timeShift) < 1;

      if (useNegativeDvrOffset) {
        // We don't show current time unless there is a time shift when using
        // negative DVR offset
        currentTime = isLiveNow ? '' : this.formatSeconds(timeShift);
      } else {
        // When not using negative DVR offset, DVR progress is shown in the usual
        // "current time of total time" format, with total time set to the size of DVR window
        currentTime = isLiveNow ? totalTime : this.formatSeconds(Math.ceil(duration + timeShift));
      }
    } else {
      currentTime = currentPlayheadTime;
    }
    // Total time is not displayed when using negative DVR offset, only the
    // timeshift is shown
    if (useNegativeDvrOffset) {
      totalTime = isLiveStream ? '' : totalTime;
    }

    return {
      currentTime: currentTime,
      totalTime: totalTime
    };
  },

  /**
  * Trims the given text to fit inside of the given element, truncating with ellipsis.
  *
  * @function truncateTextToWidth
  * @param {DOMElement} element - The DOM Element to fit text inside
  * @param {String} text - The string to trim
  * @returns {String} String truncated to fit the width of the element
  */
  truncateTextToWidth: function(element, text) {
    var testText = document.createElement("span");
    testText.style.visibility = "hidden";
    testText.style.position = "absolute";
    testText.style.top = "0";
    testText.style.left = "0";
    testText.style.whiteSpace = "nowrap";
    testText.innerHTML = text;
    element.appendChild(testText);
    var actualWidth = element.clientWidth;
    var textWidth = testText.scrollWidth;
    var truncatedText = "";
    if (textWidth > (actualWidth * 1.8)){
      var truncPercent = actualWidth / textWidth;
      var newWidth = (Math.floor(truncPercent * text.length) * 1.8) - 3;
      truncatedText = text.slice(0,newWidth) + "...";
    }
    else {
      truncatedText = text;
    }
    element.removeChild(testText);
    return truncatedText;
  },

  /**
  * Returns a shallow clone of the object given
  *
  * @function clone
  * @param {Object} object - Object to be cloned
  * @returns {Object} Clone of the given object
  */

  clone: function(object) {
    var clonedObj = {};
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        clonedObj[key] = object[key];
      }
    }
    return clonedObj;
  },

  /**
  * Clones the given object and merges in the keys and values of the second object.
  * Attributes in the cloned original will be overwritten.
  *
  * @function extend
  * @param {Object} original - Object to be extended
  * @param {Object} toMerge - Object with properties to be merged in
  * @returns {Object} Cloned and merged object
  */

  extend: function(original, toMerge) {
    var extendedObject = Utils.clone(original);
    for (var key in toMerge) {
      if (toMerge.hasOwnProperty(key)) {
        extendedObject[key] = toMerge[key];
      }
    }
    return extendedObject;
  },

  /**
  * Convert raw seconds into human friendly HH:MM format
  *
  * @function formatSeconds
  * @param {integer} time The time to format in seconds
  * @return {String} The time as a string in the HH:MM format
  */
  formatSeconds: function(time) {
    var timeInSeconds = Math.abs(time);
    var seconds = parseInt(timeInSeconds,10) % 60;
    var hours = parseInt(timeInSeconds / 3600, 10);
    var minutes = parseInt((timeInSeconds - hours * 3600) / 60, 10);

    if (hours < 10) {
      hours = '0' + hours;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    if (seconds < 10) {
      seconds = '0' + seconds;
    }

    var timeStr = (parseInt(hours,10) > 0) ? (hours + ":" + minutes + ":" + seconds) : (minutes + ":" + seconds);
    if (time >= 0) {
      return timeStr;
    } else {
      return "-" + timeStr;
    }
  },

  /**
  * Check if the current browser is Safari
  *
  * @function isSafari
  * @returns {Boolean} Whether the browser is Safari or not
  */
  isSafari: function () {
    return (!!window.navigator.userAgent.match(/AppleWebKit/) &&
            !window.navigator.userAgent.match(/Chrome/));
  },

  /**
   * Check if the current browser is Chrome
   *
   * @function isChrome
   * @returns {Boolean} Whether the browser is Chrome or not
   */
  isChrome: function () {
    return (!!window.navigator.userAgent.match(/Chrome/) && !!window.navigator.vendor.match(/Google Inc/));
  },

  /**
  * Check if the current browser is Edge
  *
  * @function isEdge
  * @returns {Boolean} Whether the browser is Edge or not
  */
  isEdge: function () {
    return (!!window.navigator.userAgent.match(/Edge/));
  },

  /**
  * Check if the current browser is Internet Explorer
  *
  * @function isIE
  * @returns {Boolean} Whether the browser is IE or not
  */
  isIE: function() {
    return (!!window.navigator.userAgent.match(/MSIE/) || !!window.navigator.userAgent.match(/Trident/));
  },

  /**
  * Check if the current device is Android
  *
  * @function isAndroid
  * @returns {Boolean} Whether the browser is running on Android or not
  */
  isAndroid: function() {
    var os = window.navigator.appVersion;
    return !!os.match(/Android/);
  },

  /**
  * Check if the current device is iOS
  *
  * @function isIos
  * @returns {Boolean} Whether the device is iOS or not
  */
  isIos: function() {
    var platform = window.navigator.platform;
    return !!(platform.match(/iPhone/) || platform.match(/iPad/) || platform.match(/iPod/));
  },

  /**
  * Check if the current device is an iPhone
  *
  * @function isIPhone
  * @returns {Boolean} Whether the device is an iPhone or not
  */
  isIPhone: function() {
    var platform = window.navigator.platform;
    return !!(platform.match(/iPhone/) || platform.match(/iPod/));
  },

  /**
  * Check if the current device is a mobile device
  *
  * @function isMobile
  * @returns {Boolean} Whether the browser device a mobile device or not
  */
  isMobile: function() {
    return (this.isAndroid() || this.isIos());
  },

  /**
  * Check if the current browser is Internet Explorer 10
  *
  * @function isIE10
  * @returns {Boolean} Whether the browser is IE10 or not
  */
  isIE10: function() {
    return !!window.navigator.userAgent.match(/MSIE 10/);
  },

  /**
  * Determine the best language to use for localization
  *
  * @function getLanguageToUse
  * @param {Object} skinConfig - The skin configuration file to read languages from
  * @returns {String} The ISO code of the language to use
  */
  getLanguageToUse: function(skinConfig) {
    var localization = skinConfig.localization;
    var language, availableLanguages;

    // set lang to default lang in skin config
    language = localization.defaultLanguage;

    // if no default lang in skin config check browser lang settings
    if(!language) {
      if(window.navigator.languages){
        // A String, representing the language version of the browser.
        // Examples of valid language codes are: "en", "en-US", "de", "fr", etc.
        language = window.navigator.languages[0];
      }
      else {
        // window.navigator.browserLanguage: current operating system language
        // window.navigator.userLanguage: operating system's natural language setting
        // window.navigator.language: the preferred language of the user, usually the language of the browser UI
        language = window.navigator.browserLanguage || window.navigator.userLanguage || window.navigator.language;
      }

      // remove lang sub-code
      var primaryLanguage = language.substr(0,2);

      // check available lang file for browser lang
      for(var i = 0; i < localization.availableLanguageFile.length; i++) {
        availableLanguages = localization.availableLanguageFile[i];
        // if lang file available set lang to browser primary lang
        if (primaryLanguage == availableLanguages.language){
          language = primaryLanguage;
        }
      }
    }
    return language;
  },

  /**
  * Get the localized string for a given localization key
  *
  * @function getLocalizedString
  * @param {String} language - ISO code of the language to use
  * @param {String} stringId - The key of the localized string to retrieve
  * @param {Object} localizedStrings - Mapping of string keys to localized values
  * @returns {String} The localizted string
  */
  getLocalizedString: function(language, stringId, localizedStrings) {
    try {
      return localizedStrings[language][stringId];
    } catch (e) {
      return "";
    }

  },

  /**
  * Get the countdown string that shows the time until a given future timestamp
  *
  * @function getStartCountdown
  * @param {Number} timestamp - The Unix timestamp for the asset flight time start
  * @returns {String} The countdown time string
  */
  getStartCountdown: function(countdownTimestamp) {
    var dayString = "day";
    var hourString = "hour";
    var minuteString = "minute";
    try {
      if (countdownTimestamp < 0) return "";
      var days = Math.floor(countdownTimestamp / (24 * 60 * 60 * 1000));
      if (days != 1) dayString += "s";
      countdownTimestamp -= days * 24 * 60 * 60 * 1000;
      var hours = Math.floor(countdownTimestamp / (60 * 60 * 1000));
      if (hours != 1) hourString += "s";
      countdownTimestamp -= hours * 60 * 60 * 1000;
      var minutes = Math.floor(countdownTimestamp / (60 * 1000));
      if (minutes != 1) minuteString += "s";
      return "" + days + " " + dayString + ", " + hours + " " + hourString + ", and " + minutes + " " + minuteString;
    } catch (e) {
      return "";
    }
  },

  /**
   * Safely gets the value of an object's nested property.
   *
   * @function getPropertyValue
   * @param {Object} object - The object we want to extract the property form
   * @param {String} propertyPath - A path that points to a nested property in the object with a form like 'prop.nestedProp1.nestedProp2'
   * @param {Object} defaltValue - (Optional) A default value to return when the property is undefined
   * @return {Object} - The value of the nested property, the default value if nested property was undefined
   */
  getPropertyValue: function(object, propertyPath, defaltValue) {
    var value = null;
    var currentObject = object;
    var currentProp = null;

    try {
      var props = propertyPath.split('.');

      for (var i = 0; i < props.length; i++) {
        currentProp = props[i];
        currentObject = value = currentObject[currentProp];
      }
      return value || defaltValue;
    } catch (err) {
      return defaltValue;
    }
  },

  /**
   * Converts string value to number (needed for backwards compatibility of skin.json parameters)
   *
   * @function convertStringToInt
   * @param {String} property
   * @return {Number}
   */
  convertStringToNumber: function(property) {
    if (property.toString().indexOf('%') > -1){
      property = parseInt(property)/100;
    }
    return isFinite(Number(property)) ? Number(property) : 0;
  },


  /**
   * Determines whether an element contains a class or not.
   * TODO:
   * classList.contains is much better for this purpose, but our current version
   * of React Test Utils generates events with a null classList, which results in
   * broken unit tests.
   *
   * @param {DOMElement} element The DOM element which we want to check
   * @param {String} className The name of the class we want to match
   * @return {Boolean} True if the element contains the given class, false otherwise
   */
  elementHasClass: function(element, className) {
    if (!element) {
      return false;
    }
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
  },

  /**
   * Returns the icon element associated with an event (usually mouseover or mouseout),
   * which can be either the event's target element itself or a child of the target element.
   * The icon is matched with a class name.
   * This is needed in order to circumvent a Firefox issue that prevents mouse events from
   * being triggered in elements that are children of buttons (such as icons).
   *
   * @param {String} domEvent The event whose icon element we want to extract
   * @param {String} iconClass The class that will be used to match the icon element
   * @return {Object} The element that has been identified as the icon, or null if none was found
   */
  getEventIconElement: function(domEvent, iconClass) {
    var iconElement = null;
    var classToMatch = iconClass || 'oo-icon';
    var currentTarget = domEvent ? domEvent.currentTarget : null;

    if (currentTarget) {
      // Check to see if the target itself is the icon, otherwise get
      // the first icon child
      if (this.elementHasClass(currentTarget, classToMatch)) {
        iconElement = currentTarget;
      } else {
        iconElement = currentTarget.querySelector('.' + classToMatch);
      }
    }
    return iconElement;
  },

  /**
  * Highlight the given element for hover effects
  *
  * @function Highlight
  * @param {DOMElement} target - The element to Highlight
  */
  highlight: function(target, opacity, color) {
    target.style.opacity = opacity;
    target.style.color = color;
    // HEADSUP
    // This is currently the same style as the one used in _mixins.scss.
    // We should change both styles whenever we update this.
    target.style.textShadow = "0px 0px 3px rgba(255, 255, 255, 0.5), 0px 0px 6px rgba(255, 255, 255, 0.5), 0px 0px 9px rgba(255, 255, 255, 0.5)";
  },

  /**
  * Remove the highlight effect of the given element
  *
  * @function removeHighlight
  * @param {DOMElement} target - The element to remove the highlight effect from
  * @param {DOMElement} opacity - The opacity to return the element to
  */
  removeHighlight: function(target, opacity, color) {
    target.style.opacity = opacity;
    target.style.color = color;
    target.style.textShadow = "";
  },

  /**
  * Determine which buttons should be shown in the control bar given the width of the player<br/>
  * Note: items which do not meet the item spec will be removed and not appear in the results.
  *
  * @function collapse
  * @param {Number} barWidth - Width of the control bar
  * @param {Object[]} orderedItems - array of left to right ordered items. Each item meets the skin's "button" schema.
  * @returns {Object} An object of the structure {fit:[], overflow:[]} where the fit object is
  *   an array of buttons that fit in the control bar and overflow are the ones that should be hidden
  */
  collapse: function( barWidth, orderedItems, responsiveUIMultiple ) {
    if( isNaN( barWidth ) || barWidth === undefined ) { return orderedItems; }
    if( ! orderedItems ) { return []; }
    var self = this;
    var validItems = orderedItems.filter( function(item) { return self._isValid(item); } );
    var r = this._collapse( barWidth, validItems, responsiveUIMultiple );
    return r;
  },

  /**
  * Find thumbnail image URL and its index that correspond to given time value
  *
  * @function findThumbnail
  * @param {Object} thumbnails - metadata object containing information about thumbnails
  * @param {Number} hoverTime - time value to find thumbnail for
  * @param {Number} duration - duration of the video
  * @param {Boolean} isVideoVr - if video is vr
  * @returns {Object} object that contains URL and index of requested thumbnail
  */
  findThumbnail: function(thumbnails, hoverTime, duration, isVideoVr) {
    var timeSlices = thumbnails.data.available_time_slices;
    var width = thumbnails.data.available_widths[0]; //choosing the lowest size
    if (isVideoVr && width < CONSTANTS.THUMBNAIL.MAX_VR_THUMBNAIL_BG_WIDTH) {
      // it is necessary to take bigger image for showing part of the image
      // so choose not the lowest size but bigger one, the best width is 380
      var index = (thumbnails.data.available_widths.length - 1) >= CONSTANTS.THUMBNAIL.THUMBNAIL_VR_RATIO ? CONSTANTS.THUMBNAIL.THUMBNAIL_VR_RATIO : thumbnails.data.available_widths.length - 1;
      width = thumbnails.data.available_widths[index];
    }

    var position = Math.floor((hoverTime/duration) * timeSlices.length);
    position = Math.min(position, timeSlices.length - 1);
    position = Math.max(position, 0);

    var selectedTimeSlice = null;
    var selectedPosition = position;

    if (timeSlices[position] >= hoverTime) {
      selectedTimeSlice = timeSlices[0];
      for (var i = position; i >= 0; i--) {
        if (timeSlices[i] <= hoverTime) {
          selectedTimeSlice = timeSlices[i];
          selectedPosition = i;
          break;
        }
      }
    } else {
      selectedTimeSlice = timeSlices[timeSlices.length - 1];
      for (var i = position; i < timeSlices.length; i++) {
        if (timeSlices[i] == hoverTime) {
          selectedTimeSlice = timeSlices[i];
          selectedPosition = i;
          break;
        } else if (timeSlices[i] > hoverTime) {
          selectedTimeSlice = timeSlices[i - 1];
          selectedPosition = i - 1;
          break;
        }
      }
    }

    var selectedThumbnail = thumbnails.data.thumbnails[selectedTimeSlice][width].url;
    var imageWidth = thumbnails.data.thumbnails[selectedTimeSlice][width].width;
    var imageHeight = thumbnails.data.thumbnails[selectedTimeSlice][width].height;
    return { url: selectedThumbnail, pos: selectedPosition, imageWidth: imageWidth, imageHeight: imageHeight };
  },

  /**
  * Check if the current browser is on a touch enabled device.
  * Function from https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
  *
  * @function browserSupportsTouch
  * @returns {Boolean} Whether or not the browser supports touch events.
  */
  browserSupportsTouch: function() {
    return ('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0);
  },

  /**
   * Creates wrapper object with sanitized html. This marked data can subsequently be passed into dangerouslySetInnerHTML
   * See https://facebook.github.io/react/tips/dangerously-set-inner-html.html
   *
   * @function createMarkup
   * @param {String} html - html to be sanitized
   * @returns {Object} Wrapper object for sanitized markup.
   */
  createMarkup: function(html) {
    return {__html: html};
  },

  /**
   * Deep merge arrays and array values
   *
   * @function arrayDeepMerge
   * @param {Array} target - An array that will receive new items if additional items are passed
   * @param {Array} source - An array containing additional items to merge into target
   * @param {Object} optionsArgument - parameters passed to parent DeepMerge function, i.e. -
   *        arrayMerge - https://github.com/KyleAMathews/deepmerge#arraymerge
   *        clone - https://github.com/KyleAMathews/deepmerge#clone
   *        arrayUnionBy - key used to compare Objects being merged, i.e. button name
   *        arrayFusion - method used to merge arrays ['replace', 'deepmerge']
   *        buttonArrayFusion - method used to merge button array ['replace', 'prepend', 'deepmerge']
   *        arraySwap - swaps target/source
   * @returns {Array} new merged array with items from both target and source
   */
  arrayDeepMerge: function(target, source, optionsArgument) {
    if (source && source.length) {
      // if source is button and buttonArrayFusion is 'replace', return source w/o merge
      if (source[0][optionsArgument.arrayUnionBy] && optionsArgument.buttonArrayFusion === 'replace') {
        return source;
      }
      // if source is not button and arrayFusion is 'replace', return source w/o merge
      else if (!source[0][optionsArgument.arrayUnionBy] && optionsArgument.arrayFusion !== 'deepmerge') {
        return source;
      }
    }

    var targetArray = optionsArgument.arraySwap ? source : target;
    var sourceArray = optionsArgument.arraySwap ? target : source;
    var self = this;
    var uniqueSourceArray = sourceArray.slice(); //array used to keep track of objects that do not exist in target
    var destination = targetArray.slice();

    sourceArray.forEach(function(sourceItem, i) {
      if (typeof destination[i] === 'undefined') {
        destination[i] = self._cloneIfNecessary(sourceItem, optionsArgument);
      }
      else if (self._isMergeableObject(sourceItem)) {
        // custom merge for buttons array, used to maintain source sort order
        if (sourceItem[optionsArgument.arrayUnionBy]) {
          targetArray.forEach(function(targetItem, j) {
            // gracefully merge buttons by name
            if (sourceItem[optionsArgument.arrayUnionBy] === targetItem[optionsArgument.arrayUnionBy]) {
              var targetObject = optionsArgument.arraySwap ? sourceItem : targetItem;
              var sourceObject = optionsArgument.arraySwap ? targetItem : sourceItem;
              destination[j] = DeepMerge(targetObject, sourceObject, optionsArgument);

              // prunes uniqueSourceArray to unique items not in target
              if (optionsArgument.buttonArrayFusion === 'prepend' && uniqueSourceArray && uniqueSourceArray.length) {
                for (var x in uniqueSourceArray) {
                  if (uniqueSourceArray[x][optionsArgument.arrayUnionBy] === sourceItem[optionsArgument.arrayUnionBy]) {
                    uniqueSourceArray.splice(x, 1);
                    break;
                  }
                }
              }
            }
          });
        }
        // default array merge
        else {
          destination[i] = DeepMerge(targetArray[i], sourceItem, optionsArgument);
        }
      }
      else if (targetArray.indexOf(sourceItem) === -1) {
        destination.push(self._cloneIfNecessary(sourceItem, optionsArgument));
      }
    });
    // prepend uniqueSourceArray array of unique items to buttons after flexible space
    if (optionsArgument.buttonArrayFusion === 'prepend' && uniqueSourceArray && uniqueSourceArray.length) {
      var flexibleSpaceIndex = null;
      // find flexibleSpace btn index
      for (var y in destination) {
        if (destination[y][optionsArgument.arrayUnionBy] === 'flexibleSpace') {
          flexibleSpaceIndex = parseInt(y);
          break;
        }
      }
      // loop through uniqueSourceArray array, add unique objects
      // to destination array after flexible space btn
      if (flexibleSpaceIndex) {
        flexibleSpaceIndex += 1; //after flexible space
        for (var z in uniqueSourceArray) {
          destination.splice(flexibleSpaceIndex, 0, uniqueSourceArray[z]);
        }
      } else {
        destination = destination.concat(uniqueSourceArray);
      }
    }
    return destination;
  },

  /**
   * Checks if string is valid
   *
   * @function isValidString
   * @param {String} src - string to be validated
   * @returns {Boolean} true if string is valid, false if not
   */
  isValidString: function(src) {
    return (src && (typeof src === 'string' || src instanceof String))
  },

  /**
   * Returns sanitized config data
   *
   * @function sanitizeConfigData
   * @param {Object} data to be sanitized
   * @returns {Object} data if data is valid, empty object if not
   */
  sanitizeConfigData: function(data) {
    if (data && (!Array.isArray(data))) {
      return data
    } else {
      OO.log("Invalid player configuration json data: ", data);
      return {};
    }
  },

  /**
   * Returns whether the OS can render the skin
   * @return {[boolean]} true if the OS can render the skin.
   */
  canRenderSkin: function() {
    var result = !(OO.isIphone && OO.iosMajorVersion < 10);
    return result;
  },

  _isValid: function( item ) {
    var valid = (
      item &&
      item.location == "moreOptions" ||
      (item.location == "controlBar" &&
        item.whenDoesNotFit &&
        item.minWidth !== undefined &&
        item.minWidth >= 0)
    );
    return valid;
  },

  _collapse: function( barWidth, orderedItems, responsiveUIMultiple ) {
    var r = { fit : orderedItems.slice(), overflow : [] };
    var usedWidth = orderedItems.reduce( function(p,c,i,a) { return p + responsiveUIMultiple * c.minWidth; }, 0 );
    for( var i = orderedItems.length-1; i >= 0; --i ) {
      var item = orderedItems[ i ];
      if( this._isOnlyInMoreOptions(item) ) {
        usedWidth = this._collapseLastItemMatching(r, item, usedWidth);
      }
      if( usedWidth > barWidth && this._isCollapsable(item) ) {
        usedWidth = this._collapseLastItemMatching(r, item, usedWidth);
      }
    }
    return r;
  },

  _isOnlyInMoreOptions: function( item ) {
    var must = item.location == "moreOptions";
    return must;
  },

  _isCollapsable: function( item ) {
    var collapsable = item.location == "controlBar" && item.whenDoesNotFit && item.whenDoesNotFit != "keep";
    return collapsable;
  },

  _collapseLastItemMatching: function( results, item, usedWidth ) {
    var i = results.fit.lastIndexOf( item );
    if( i > -1 ) {
      results.fit.splice( i, 1 );
      results.overflow.unshift( item );
      if( item.minWidth ) {
        usedWidth -= item.minWidth;
      }
    }
    return usedWidth;
  },

  _isMergeableObject: function (val) {
    var nonNullObject = val && typeof val === 'object';

    return nonNullObject
      && Object.prototype.toString.call(val) !== '[object RegExp]'
      && Object.prototype.toString.call(val) !== '[object Date]'
  },

  _emptyTarget: function (val) {
    return Array.isArray(val) ? [] : {};
  },

  _cloneIfNecessary: function (value, optionsArgument) {
    var clone = optionsArgument && optionsArgument.clone === true;
    return (clone && this._isMergeableObject(value)) ? DeepMerge(this._emptyTarget(value), value, optionsArgument) : value
  },

  /**
   * @description - returns the correct coordinates of events depending on the platform
   * @param e - event
   * @returns {object} - coordinates x, y
   */
  getCoords: function(e) {
    var coords = {};
    var isMobileTouhes = (OO.isIos || OO.isAndroid) &&
      e.touches &&
      !!e.touches.length;

    if(isMobileTouhes){
      coords.x = e.touches[0].pageX;
      coords.y = e.touches[0].pageY;
    } else {
      coords.x = e.pageX;
      coords.y = e.pageY;
    }

    return coords;
  },
};

module.exports = Utils;
