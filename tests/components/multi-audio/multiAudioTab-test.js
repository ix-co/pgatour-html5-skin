jest.dontMock(
  "../../../js/components/close-caption-multi-audio-menu/multiAudioTab"
);
jest.dontMock(
  "../../../js/components/base-components/listWithChoice"
);
jest.dontMock("../../../js/components/closeButton");
jest.dontMock("../../../js/components/higher-order/accessibleMenu");
jest.dontMock("../../../js/constants/constants");
jest.dontMock("classnames");
jest.dontMock("iso-639-3");
jest.dontMock("underscore");

var _ = require("underscore");
var React = require("react");
var TestUtils = require("react-addons-test-utils");
var multiAudioTabModule = require("../../../js/components/close-caption-multi-audio-menu/multiAudioTab");
var ListWithChoice = require("../../../js/components/base-components/listWithChoice");
var CONSTANTS = require("../../../js/constants/constants");
var iso639 = require("iso-639-3");

var getDisplayLabel = multiAudioTabModule.getDisplayLabel;
var getDisplayLanguage = multiAudioTabModule.getDisplayLanguage;
var getDisplayTitle = multiAudioTabModule.getDisplayTitle;
var MultiAudioTab = multiAudioTabModule.MultiAudioTab;

describe("MultiAudioTab", function() {
  var props;
  var currentAudioId;

  describe("getDisplayLanguage function", function() {
    it("should return empty string when can't be matched", function() {
      expect(getDisplayLanguage()).toEqual("");
      expect(getDisplayLanguage([], 2)).toEqual("");
      expect(getDisplayLanguage([], "w00t")).toEqual("");
      expect(getDisplayLanguage([], "und")).toEqual("");
      expect(getDisplayLanguage([], null)).toEqual("");
    });

    it("should return matched english equivalent", function() {
      expect(getDisplayLanguage(iso639, "eng")).toEqual("English");
      expect(getDisplayLanguage(iso639, "en")).toEqual("English");
      expect(getDisplayLanguage(iso639, "ger")).toEqual("German");
      expect(getDisplayLanguage(iso639, "deu")).toEqual("German");
    });
  });

  describe("getDisplayLabel function", function() {
    it("should return label when label is present", function() {
      expect(getDisplayLabel({ label: "sas" })).toEqual("sas");
    });

    it("should return empty string when label is not present", function() {
      expect(getDisplayLabel({})).toEqual("");
      expect(getDisplayLabel(null)).toEqual("");
      expect(getDisplayLabel()).toEqual("");
      expect(getDisplayLabel(1)).toEqual("");
    });

    it("should return empty string when label and lang are equal", function() {
      var audioTrack = {
        label: "eng",
        lang: "eng"
      };

      expect(getDisplayLabel(audioTrack)).toEqual("");
    });
  });

  describe("getDisplayTitle function", function() {
    it("should return title from language and label", function() {
      expect(getDisplayTitle("English", "with Commentary")).toEqual(
        "English with Commentary"
      );
    });

    it("should return title from just language", function() {
      expect(getDisplayTitle("English", "")).toEqual("English");
      expect(getDisplayTitle("English", null)).toEqual("English");
      expect(getDisplayTitle("English", undefined)).toEqual("English");
    });

    it("should return title from just label", function() {
      expect(getDisplayTitle("", "with Commentary")).toEqual("with Commentary");
      expect(getDisplayTitle(null, "with Commentary")).toEqual(
        "with Commentary"
      );
      expect(getDisplayTitle(undefined, "with Commentary")).toEqual(
        "with Commentary"
      );
      expect(getDisplayTitle(undefined, "with Commentary")).toEqual(
        "with Commentary"
      );
    });

    it("should return Undefined language if none of params are provided", function() {
      expect(getDisplayTitle("", "")).toEqual("Undefined language");
      expect(getDisplayTitle(null, null)).toEqual("Undefined language");
      expect(getDisplayTitle(undefined, undefined)).toEqual(
        "Undefined language"
      );
    });
  });

  describe("MultiAudioTab component", function() {
    var props = {
      multiAudio: {
        list: [{
          label: null,
          lang: "eng"
        }, {
          label: null,
          lang: "deu"
        }]
      },
      skinConfig: {},

      handleSelect: function(id) {}
    };

    it("should be rendered", function() {
      var DOM = TestUtils.renderIntoDocument(<MultiAudioTab {...props} />);
    });

    it("should render list component", function() {
      var tree = TestUtils.renderIntoDocument(<MultiAudioTab {...props} />);
      var component = TestUtils.findRenderedComponentWithType(tree, MultiAudioTab);
      var list = TestUtils.scryRenderedComponentsWithType(tree, ListWithChoice);

      expect(list).toBeTruthy();
    })
  });
});
