/*
 * Copyright 2015 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {

  window.KEYS = [
    {
      key: '?',
      info: 'Show help',
      press: function() {
        toggleKeyboardHelp();
      }
    }
  ];

  function createKeyboardHelp() {
    var html = '';

    for (var i = 0; i < KEYS.length; i++) {
      html += '<code>' + KEYS[i].key + '</code> - ' + KEYS[i].info + '<br>';
    }

    $('<div>')
        .attr('class', 'keyboardhelp')
        .html(html)
        .hide()
        .appendTo('body');
  }

  function toggleKeyboardHelp(toggle) {
    if (toggle === false || toggle === true) {
      $('.keyboardhelp').toggle(!!toggle);
    } else {
      $('.keyboardhelp').toggle();
    }
  }

  $(function() {
    $(document).on('keypress', function(e) {
      for (var i = 0; i < KEYS.length; i++) {
        if (KEYS[i].key.charCodeAt(0) == e.keyCode) {
          KEYS[i].press();
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    });

    createKeyboardHelp();
    toggleKeyboardHelp(true);
    setTimeout(function() { toggleKeyboardHelp(false); }, 2000);
  });

})();