jest.dontMock('../../js/components/videoQualityPanel')
    .dontMock('../../js/components/utils')
    .dontMock('../../js/components/icon')
    .dontMock('../../js/components/higher-order/accessibleMenu')
    .dontMock('../../js/components/accessibleButton')
    .dontMock('../../js/components/menuPanel')
    .dontMock('../../js/components/menuPanelItem')
    .dontMock('../../js/constants/constants')
    .dontMock('../../js/constants/macros')
    .dontMock('classnames');

var React = require('react');
var ReactDOM = require('react-dom');
var Enzyme = require('enzyme');
var MACROS = require('../../js/constants/macros');
var CONSTANTS = require('../../js/constants/constants');
var VideoQualityPanel = require('../../js/components/videoQualityPanel');
var MenuPanelItem = require('../../js/components/menuPanelItem');
var AccessibleMenu = require('../../js/components/higher-order/accessibleMenu');
var skinConfig = require('../../config/skin.json');
var Utils = require('../../js/components/utils');
var $ = require('jquery');

// start unit test
describe('VideoQualityPanel', function() {
  var mockController, mockSkinConfig, mockProps;
  var selectedBitrateIdHistory = [];
  var availableBitrates = [{'id':'auto', 'bitrate':0, 'height':0}, {'id':'1', 'bitrate':1000, 'height':10}, {'id':'2', 'bitrate':2000, 'height':20},
                           {'id':'3', 'bitrate':3000, 'height':30}, {'id':'4', 'bitrate':4000, 'height':40}, {'id':'5', 'bitrate':5000, 'height':50},
                           {'id':'6', 'bitrate':1000000, 'height':1000}];
  var bitrateLabels = ['Auto', '1 kbps', '2 kbps','3 kbps','4 kbps','5 kbps','1 mbps'];
  var resolutionLabels = ['Auto', '10p','20p','30p','40p','50p','1000p'];
  var bitrateResolutionLabels = ['Auto', '10p (1 kbps)','20p (2 kbps)','30p (3 kbps)','40p (4 kbps)','50p (5 kbps)','1000p (1 mbps)'];

  beforeEach(function() {
    selectedBitrateIdHistory = [];
    mockController = {
      state: {
        isMobile: false,
        'videoQualityOptions': {
          'showPopover':true
        },
        volumeState: {
          volume: 1
        },
        closedCaptionOptions: {availableLanguages: true}
      },
      sendVideoQualityChangeEvent: function(selectedData) {
        if (selectedData.id) {
          selectedBitrateIdHistory.push(selectedData.id);
        }
        mockProps.videoQualityOptions.selectedBitrate.id = selectedData.id;
      }
    };
    mockSkinConfig = JSON.parse(JSON.stringify(skinConfig));
    mockProps = {
      language: 'en',
      localizableStrings: {},
      controller: mockController,
      videoQualityOptions: {
        availableBitrates: availableBitrates,
        selectedBitrate: {
          id: CONSTANTS.QUALITY_SELECTION.AUTO_QUALITY
        }
      },
      skinConfig: mockSkinConfig
    };
  });

  function checkQualityTexts(wrapper, expectedLabels) {
    var bitrateItems = wrapper.find('.oo-quality-btn').hostNodes();
    expect(bitrateItems.length).toBe(expectedLabels.length);

    for (var i=0; i<bitrateItems.length; i++) {
      var itemText = bitrateItems.at(i).find('.oo-menu-btn-label').getDOMNode().textContent;
      expect(itemText).toEqual(expectedLabels[i]);
    }
  }

  function checkAriaLabels(wrapper, expectedAriaLabels) {
    var qualityButtons = wrapper.find('.oo-quality-btn').hostNodes();
    var qualityButton;

    for (var i = 0; i < qualityButtons.length; i++) {
      qualityButton = qualityButtons.at(i).getDOMNode();
      expect(qualityButton.getAttribute('aria-label')).toBe(expectedAriaLabels[i]);
      expect(qualityButton.getAttribute('role')).toBe('menuitemradio');
      expect(qualityButton.getAttribute('aria-checked')).toBeTruthy();
      var bitrateId = wrapper.find(MenuPanelItem).at(i).props().itemValue;
      expect(qualityButton.getAttribute(CONSTANTS.KEYBD_FOCUS_ID_ATTR)).toBe(
        CONSTANTS.FOCUS_IDS.MENU_ITEM + bitrateId
      );
    }
  }

  it('creates video quality panel with bitrate labels', function() {
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );

    checkQualityTexts(wrapper, bitrateLabels);
  });

  it('selects item from video quality panel', function() {
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );
    var bitrateItems = wrapper.find('.oo-quality-btn.oo-selected').hostNodes();
    expect(bitrateItems.length).toBe(1);
    expect(bitrateItems.at(0).find('.oo-menu-btn-label').getDOMNode().textContent).toBe('Auto');

    bitrateItems = wrapper.find('.oo-quality-btn').hostNodes();
    expect(bitrateItems.length).toBe(availableBitrates.length);

    for (var i=0; i<bitrateItems.length; i++) {
      var newBitrate = bitrateItems.at(i);
      newBitrate.simulate('click');
      expect(mockProps.videoQualityOptions.selectedBitrate.id).toBe(availableBitrates[i].id);
    }
  });

  it('selects item from video quality panel with accent color', function() {
    mockSkinConfig.general.accentColor = 'blue';
    mockSkinConfig.controlBar.iconStyle.active.color = '';

    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );
    var bitrateItems = wrapper.find('.oo-quality-btn.oo-selected').hostNodes();
    expect(bitrateItems.length).toBe(1);
    expect(bitrateItems.at(0).find('.oo-menu-btn-label').getDOMNode().textContent).toBe('Auto');

    var autoBitrate = wrapper.find('.oo-quality-btn').at(0).getDOMNode();
    bitrateItems = wrapper.find('.oo-quality-btn').hostNodes();
    expect(bitrateItems.length).toBe(availableBitrates.length);
    expect(autoBitrate.style.color).toBe('blue');
    expect(bitrateItems.at(1).getDOMNode().style.color).not.toBe('blue');

    for (var i=0; i<bitrateItems.length; i++) {
      var newBitrate = bitrateItems.at(i);
      newBitrate.simulate('click');
      wrapper.setProps(mockProps);
      expect(mockProps.videoQualityOptions.selectedBitrate.id).toBe(availableBitrates[i].id);
      if (bitrateItems.at(i - 1).length) {
        expect(bitrateItems.at(i - 1).getDOMNode().style.color).not.toBe('blue');
      }
      expect(newBitrate.getDOMNode().style.color).toBe('blue');
    }
  });

  it('selects item from video quality panel with controlbar iconStyle color', function() {
    mockSkinConfig.general.accentColor = 'red';

    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );
    var bitrateItems = wrapper.find('.oo-quality-btn.oo-selected').hostNodes();
    expect(bitrateItems.length).toBe(1);
    expect(bitrateItems.at(0).find('.oo-menu-btn-label').getDOMNode().textContent).toBe('Auto');

    var autoBitrate = wrapper.find('.oo-quality-btn').at(0).getDOMNode();
    bitrateItems = wrapper.find('.oo-quality-btn').hostNodes();
    expect(bitrateItems.length).toBe(availableBitrates.length);
    expect(autoBitrate.style.color).toBe('red');
    expect(bitrateItems.at(1).getDOMNode().style.color).not.toBe('red');

    for (var i=0; i<bitrateItems.length; i++) {
      var newBitrate = bitrateItems.at(i);
      newBitrate.simulate('click');
      wrapper.setProps(mockProps);
      expect(mockProps.videoQualityOptions.selectedBitrate.id).toBe(availableBitrates[i].id);
      if (bitrateItems.at(i - 1).length) {
        expect(bitrateItems.at(i - 1).getDOMNode().style.color).not.toBe('red');
      }
      expect(newBitrate.getDOMNode().style.color).toBe('red');
    }
  });

  it('checks selected item is still there', function() {
    mockProps.videoQualityOptions.selectedBitrate = availableBitrates[1];
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );
    var bitrateItems = wrapper.find('.oo-quality-btn.oo-selected').hostNodes();
    expect(bitrateItems.length).toBe(1);
    expect(bitrateItems.at(0).find('.oo-menu-btn-label').getDOMNode().textContent).toBe(bitrateLabels[1]);
  });

  it('should render ARIA attributes on Auto quality button', function() {
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );
    var autoButton = wrapper.find('.oo-quality-btn').at(0).getDOMNode();
    expect(autoButton.getAttribute('aria-label')).toBe(CONSTANTS.ARIA_LABELS.AUTO_QUALITY);
    expect(autoButton.getAttribute('role')).toBe('menuitemradio');
    expect(autoButton.getAttribute('aria-checked')).toBeTruthy();
  });

  it('should render ARIA attributes on quality buttons', function() {
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );
    checkAriaLabels(wrapper, bitrateLabels);
  });

  it('should update aria-checked attribute when bitrate is selected', function() {
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );
    var qualityButton = wrapper.find('.oo-quality-btn').hostNodes().at(2);
    expect(qualityButton.getDOMNode().getAttribute('aria-checked')).toBe('false');
    qualityButton.simulate('click');
    wrapper.setProps(mockProps);
    expect(qualityButton.getDOMNode().getAttribute('aria-checked')).toBe('true');
  });

  it('creates video quality panel with resolution labels', function() {
    mockSkinConfig.controlBar.qualitySelection = {
      'format': 'resolution'
    };
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );
    checkQualityTexts(wrapper, resolutionLabels);

    checkAriaLabels(wrapper, resolutionLabels);
  });

  it('creates video quality panel with duplicate resolution labels', function() {
    mockProps.videoQualityOptions.availableBitrates =
                          [{'id':'auto', 'bitrate':0, 'height':0},
                           {'id':'0', 'bitrate':1, 'height':1}, {'id':'1', 'bitrate':1000, 'height':10}, {'id':'2', 'bitrate':2000, 'height':10},
                           {'id':'3', 'bitrate':3000, 'height':20}, {'id':'4', 'bitrate':4000, 'height':20}, {'id':'5', 'bitrate':5000, 'height':20},
                           {'id':'6', 'bitrate':1000000, 'height':30}, {'id':'7', 'bitrate':1100000, 'height':30}, {'id':'8', 'bitrate':1200000, 'height':30},
                           {'id':'9', 'bitrate':1300000, 'height':30}];

    mockSkinConfig.controlBar.qualitySelection = {
      'format': 'resolution'
    };
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );

    // We don't show the lowest 30p button because there are more than 3 30p resolutions
    var duplicateResolutionLabels = ['Auto', '1p', '10p (Low)','10p (High)','20p (Low)','20p (Medium)','20p (High)','30p (Low)','30p (Medium)','30p (High)'];

    checkQualityTexts(wrapper, duplicateResolutionLabels);

    checkAriaLabels(wrapper, duplicateResolutionLabels);

    var bitrateItems = wrapper.find('.oo-quality-btn').hostNodes();
    for (var i=0; i<bitrateItems.length; i++) {
      var newBitrate = bitrateItems.at(i);
      newBitrate.simulate('click');
    }

    // check order of ids is same as resolution labels
    // The bitrate with id 6 is not available to be clicked since there are ore than 3 30p resolutions
    expect(selectedBitrateIdHistory).toEqual(['auto', '0', '1', '2', '3', '4', '5', '7', '8', '9']);
  });

  it('creates video quality panel with bitrate and resolution labels with wide popover', function() {
    mockSkinConfig.controlBar.qualitySelection = {
      'format': 'resolution bitrate'
    };
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );

    checkQualityTexts(wrapper, bitrateResolutionLabels);

    checkAriaLabels(wrapper, bitrateResolutionLabels);

    var components = wrapper.find('.oo-quality-screen-content').hostNodes();
    expect(components.length).toBe(1);
  });

  it('creates video quality panel with bitrate labels if no resolutions are available', function() {
    mockProps.videoQualityOptions.availableBitrates = [{'id':'auto', 'bitrate':0}, {'id':'1', 'bitrate':1000}, {'id':'2', 'bitrate':2000},
                           {'id':'3', 'bitrate':3000}, {'id':'4', 'bitrate':4000}, {'id':'5', 'bitrate':5000},
                           {'id':'6', 'bitrate':1000000}];
    mockSkinConfig.controlBar.qualitySelection = {
      'format': 'resolution bitrate'
    };
    var wrapper = Enzyme.mount(
      <VideoQualityPanel {...mockProps} />
    );

    checkQualityTexts(wrapper, bitrateLabels);

    checkAriaLabels(wrapper, bitrateLabels);

    var components = wrapper.find('.oo-quality-screen-content-wide').hostNodes();
    expect(components.length).toBe(0);
  });

  describe('keyboard navigation', function() {
    var qualityPanel, qualityButtons, wrapper;

    var getMockKeydownEvent = function(target, keyCode) {
      return new CustomEvent('keydown', {
        detail: {
          _type: 'keydown',
            target: target,
          keyCode: keyCode,
          preventDefault: function() {},
          alex: 'alex'
        }
      });
    };

    beforeEach(function() {
      wrapper = Enzyme.mount(
        <VideoQualityPanel {...mockProps} />
      );
      qualityPanel = wrapper.find('.oo-quality-panel').hostNodes();
      qualityButtons = qualityPanel.getDOMNode().querySelectorAll('[' + CONSTANTS.KEYBD_FOCUS_ID_ATTR + ']');
    });

    afterEach(function() {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    });

    //TODO: I couldn't find an easy way to simulate the keydown event with the proper event target,
      //so I'm calling onKeyDown manually for the below tests for now
    it('should focus on previous menu item when pressing UP or LEFT arrow keys', function() {
      var activeIndex = qualityButtons.length - 1;
      qualityButtons[activeIndex].focus();
      wrapper.instance().ref.current.onKeyDown({
        keyCode: CONSTANTS.KEYCODES.UP_ARROW_KEY,
        target: document.activeElement,
        preventDefault: function() {}
      });
      expect(document.activeElement).toBe(qualityButtons[activeIndex - 1]);
      wrapper.instance().ref.current.onKeyDown({
        keyCode: CONSTANTS.KEYCODES.LEFT_ARROW_KEY,
        target: document.activeElement,
        preventDefault: function() {}
      });
      expect(document.activeElement).toBe(qualityButtons[activeIndex - 2]);
    });

    it('should focus on next menu item when pressing DOWN or RIGHT arrow keys', function() {
      var activeIndex = 0;
      qualityButtons[activeIndex].focus();
      wrapper.instance().ref.current.onKeyDown({
        keyCode: CONSTANTS.KEYCODES.DOWN_ARROW_KEY,
        target: document.activeElement,
        preventDefault: function() {}
      });
      expect(document.activeElement).toBe(qualityButtons[activeIndex + 1]);
      wrapper.instance().ref.current.onKeyDown({
        keyCode: CONSTANTS.KEYCODES.RIGHT_ARROW_KEY,
        target: document.activeElement,
        preventDefault: function() {}
      });
      expect(document.activeElement).toBe(qualityButtons[activeIndex + 2]);
    });

    it('should loop focus when navigating with arrow keys', function() {
      qualityButtons[0].focus();
      wrapper.instance().ref.current.onKeyDown({
        keyCode: CONSTANTS.KEYCODES.UP_ARROW_KEY,
        target: document.activeElement,
        preventDefault: function() {}
      });
      expect(document.activeElement).toBe(qualityButtons[qualityButtons.length - 1]);
      wrapper.instance().ref.current.onKeyDown({
        keyCode: CONSTANTS.KEYCODES.RIGHT_ARROW_KEY,
        target: document.activeElement,
        preventDefault: function() {}
      });
      expect(document.activeElement).toBe(qualityButtons[0]);
    });

  });

});
