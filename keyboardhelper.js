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