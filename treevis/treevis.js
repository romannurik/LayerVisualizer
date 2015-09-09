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

  var MIN_WIDTH = 200;
  var MIN_HEIGHT = 200;

  var preview = {};

  $(document).ready(function() {
    preview.width = $('.treevis-root').width();
    preview.height = $('.treevis-root').height();

    $('.treevis')
        .bind('mousedown', function(evt) {
          preview.dragging = true;
          preview.startWidth = preview.width;
          preview.startHeight = preview.height;
          preview.startX = evt.pageX;
          preview.startY = evt.pageY;
        })
        .bind('mousemove', function(evt) {
          if (preview.dragging) {
            preview.width = Math.max(MIN_WIDTH, preview.startWidth + (evt.pageX - preview.startX) * 2);
            preview.height = Math.max(MIN_HEIGHT, preview.startHeight + (evt.pageY - preview.startY) * 2);
            updatePreview();
          }
        })
        .bind('mouseup', function() {
          preview.dragging = false;
        });


    $('.scrollable').on('scroll', updateHighlight);
    $(window).resize(updateHighlight);

    updatePreview();
    createXmlTree();
  });

  function updatePreview() {
    var breakpoints = [400, 600, 800];
    var $body = $('body');
    for (var i = 0; i < breakpoints.length; i++) {
      var b = breakpoints[i];
      $body.toggleClass('bp-' + b, preview.width >= b);
    }
    var classList = document.body.className.split(/\s+/);
    for (var i = 0; i < classList.length; i++) {
       if (classList[i].startsWith('size-')) {
         //do something
       }
    }

    $('.treevis > .treevis-root').css({
      width: preview.width + 'px',
      height: preview.height + 'px'
    });
    updateHighlight();
  }

  function updateHighlight() {
    if (window.hlNode) {
      $('.treevis-highlight').addClass('noanimate');
      highlight(window.hlNode);
      $('.treevis-highlight').removeClass('noanimate');
    }
  }

  function highlight($node) {
    window.hlNode = $node;
    var $hl = $('.treevis-highlight');
    if (!$hl.length) {
      $hl = $('<div>').addClass('treevis-highlight inactive').appendTo('body');
    }

    if (!$node) {
      $hl.addClass('inactive');
      return;
    }

    $hl.css({
      left: $node.offset().left + 'px',
      top: $node.offset().top + 'px',
      width: $node.get(0).offsetWidth + 'px',
      height: $node.get(0).offsetHeight + 'px'
    })
    .removeClass('inactive');
  }

  function createXmlTree() {
    var $xmlTree = $('.xmltree');
    var text = $xmlTree.text();
    $xmlTree.empty();

    var $root = $('<div>').addClass('node-root').appendTo($xmlTree);

    lines = text.split('\n').filter(function(x){ return !!x.replace(/\s+/g, ''); });

    var $lastNode = null;
    var nodeStack = [$root];
    var indentStack = [0];

    lines.forEach(function(line) {
      var nodeSpec = line.split(/\%/g);
      var nodeXml = nodeSpec[0];
      var indent = nodeXml.match(/^\s*/)[0].length;

      var currentIndent = indentStack[indentStack.length - 1];
      if (indent > currentIndent) {
        // further indented
        nodeStack.push($lastNode);
        indentStack.push(indent);
      } else if (indent < currentIndent) {
        // unindented
        do {
          nodeStack.pop();
          indentStack.pop();
        } while (indentStack[indentStack.length - 1] != indent && indentStack.length > 0);
      }

      var components = nodeXml.substring(indent).split(/\s+/g);
      var tagName = components[0];

      var $node = $('<div>')
          .addClass('node')
          .appendTo(nodeStack[nodeStack.length - 1]);

      var $nodeMeta = $('<div>')
          .addClass('node-meta')
          .appendTo($node);

      var $tagName = $('<span>')
          .addClass('node-tagname')
          .text(tagName)
          .appendTo($nodeMeta);
      if (tagName == '...') {
        $node.addClass('ellipsis');
      }

      for (var i = 1; i < components.length; i++) {
        // add attributes
        if (!components[i].length) {
          continue;
        }
        var attr = components[i].split(/=/g);
        $('<div>')
            .addClass('node-attr')
            .append($('<span>').addClass('node-attr-name').text(attr[0]))
            .append($('<span>').addClass('node-attr-value').text(attr[1]))
            .appendTo($nodeMeta);
      }

      $lastNode = $node;

      var nodeHighlight = nodeSpec.length > 1 ? nodeSpec[1] : null;
      if (nodeHighlight) {
        var $nodeHighlight = $(nodeHighlight);
        $nodeMeta.addClass('has-highlight');
        $nodeMeta
            .on('click', function() {
              $('.node-meta').removeClass('active');
              $(this).addClass('active');
              highlight($nodeHighlight);
              return false;
            });
      }
    });

    $('.xmltree').click(function() {
      $('.node-meta').removeClass('active');
      highlight();
    });
  }

})();