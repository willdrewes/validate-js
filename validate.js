/**
 * Validates input based on rules passed in
 * 
 * @param {string} type -> What type we are checking for.
 * @param {*} value -> What the value is.
 * @return {boolean}
 *
 *
 * Validator can take the following types of validation options:
            validationOptions: {
                isRequired: true,
                isNumeric: false,
                hasMinLength: 0,
                hasMaxLength: 9999,
                matchesRegularExpression: '',
                isEmail: false,
                isUrl: false,
                matchesWhiteList: [], // not MSP (yet)
                customFunction: null // not MSP
            }
 */
define(['debug', 'underscore'], function(Debug, _) {

    var CONSTANTS = {
        MAX_SHORT_TEXT_LENGTH   : 128, // assumes varchar(128) in db field
        MAX_TEXTAREA_LENGTH     : 20000, // assumes potential double-encoding in text db field
        EMAIL_REGEX             : /^([a-zA-Z0-9_\-\.\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,5})/i,
        URL_REGEX               : /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2,}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\?[a-z0-9+_\-\.%=&amp;]*)?(\/[a-z0-9_\-\.~%\?\&\=]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)/gi
    }

    'use strict'; // triggers ECMA5 strict mode

    var validators = {

        /**
         * Returns false if input is non-existent, empty string, or empty array/object
         * @param {Object}    input                 Input to be validated
         * @param {bool}      validationRequired    Bool for whether we actually need to check for isRequired. Workaround for edge case in which isRequired can be set as option even if false
         */
        isRequired: function(input, validationRequired) {
            if ( validationRequired === false ) {
                return true; // if we don't care about required status, always return true to pass validator
            }
            if (typeof input === "undefined" || input === null || input === "") {
                return false;
            } else if (typeof input === 'object' && _.isEmpty(input)) {
                return false;
            } else if (typeof input === 'array' && input.length === 0) {
                return false;
            } else {
                return true;
            }
        },

        isNumeric: function(input) {
            return !isNaN(parseFloat(input)) && isFinite(input);
        },

        /**
         * Checks string length
         * @param {String}    input   Input string to be validated
         * @param {Int}       min     Minimum string length
         */
        hasMinLength: function(input, min) {
            if (typeof input !== 'string') {
                Debug.log('String validator cannot parse a non-string');
                return false;
            }

            var inputLength = input.length;

            if (min && inputLength < min) {
                return false;
            }
            
            return true;
        },

        /**
         * Checks string length
         * @param {String}    input   Input string to be validated
         * @param {Int}       max     Maximum string length
         */
        hasMaxLength: function(input, max) {
            if (typeof input !== 'string') {
                Debug.log('String validator cannot parse a non-string');
                return false;
            }

            var inputLength = input.length;

            if (max && inputLength > max) {
                return false;
            }
            
            return true;
        },

        /**
         * Given a string, sees if it matches the regex
         * @param {String}    type       Input string to be validated
         * @param {String}    regex      Regex string to validate against
         */
        matchesRegularExpression: function(input, regex) {
            var matches = input.match(regex);

            if (matches && matches[0] === input) {
                return true;
            }

            return false;
        },

        isEmail: function(input) {
            return validators.matchesRegularExpression(input, CONSTANTS.EMAIL_REGEX);
        },

        /**
         * Given an email string, finds the input via selector and sees if they are equal
         * @param  {string}     input       The string inputted into the confirmEmail field
         * @param  {string}   selector      The string for the selector to get the original email field, defaults to "#ugc_submission_email"
         */
        confirmEmail: function(input, selector) {
            var originalEmailField = Sequencer.$container.find(selector);
            if (!originalEmailField) {
                Debug.log("Validator: No original email in " + selector + " to compare against. Responding with 'valid' to handle.");
                return true;
            }
            var originalEmail = originalEmailField.val();
            if (input === originalEmail) {
                return true;
            } else {
                return false;
            }
        },

        isUrl: function(input) {
            return validators.matchesRegularExpression(input, CONSTANTS.URL_REGEX);
        }

    };

    var Validator = {
        CONSTANTS : CONSTANTS,
        /**
         * Wrapper to validate any data type. Types are predefined as private methods
         * @param {Object}    input      The input to be validated
         * @param {Object}    options    Set of options required to validate the specific input
         * @return { bool }              Did the test pass/fail?
         */
        validate: function(input, options, returnSpecifics) {

            var failures = [];
            _.each(options, function(ruleVal, ruleType) {

                var thisValidator = validators[ruleType];
    
                if (typeof thisValidator !== 'function') {
                    Debug.log('Type: ' + ruleType + ' not recognized');
                }
                if (thisValidator(input, ruleVal) === false) {
                    failures.push(ruleType);
                }
            });

            if (failures.length > 0) {
                if (returnSpecifics === true) {
                    return failures;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        }
    };

    return Validator;
});