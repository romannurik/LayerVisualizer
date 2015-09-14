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

var LAYERVIS_DISABLE_3D_PANNING = false;
var LAYERVIS_ELEVATION_SCALE = 6;
var LAYERVIS_PERSPECTIVE = 1000;

(function() {
  /**
   * Constants
   */
  var MAX_SHADOW_DARK = 0.3;
  var MAX_SHADOW_DARK_AT = 0; // distance
  var MIN_SHADOW_DARK = 0;
  var MIN_SHADOW_DARK_AT = 20; // distance

  var MIN_SHADOW_BLUR = 0;
  var MAX_SHADOW_BLUR = 10;

  var SHADOW_DX = 0;
  var SHADOW_DY = 2;

  /**
   * Main behavior
   */

  $(document).ready(function() {
    LayerVis.make($('.layervis'));
  });

  /**
   * Main API
   */

  var LayerVis = {};
  window.LayerVis = LayerVis;

  LayerVis.make = function($elements) {
    $elements.each(function() {
      var $container = $(this);

      var first = !$container.hasClass('_processed');
      makeOnce($container);

      if (first) {
        if (!LAYERVIS_DISABLE_3D_PANNING) {
          setup3dPan($container);
        }

        LayerVis.changeView($container, 'flat', true);

        setupRescale($container);

        var target = $container.children('.layervis-root').get(0);

        var observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.target == target) {
              return;
            }
            makeOnce($container);
          });
        });

        // configuration of the observer:
        var config = { attributes: true, childList: true, characterData: true, subtree: true };

        // pass in the target node, as well as the observer options
        observer.observe(target, config);
      }
    });
  }

  LayerVis.changeView = function($layervis, view, noAnimate) {
    $layervis.find('.layervis-processed-root')
        .css('transform', '')
        .toggleClass('noanimate', !!noAnimate)
        .each(function() {
          var $pr = $(this);
          var classList = this.className.split(/\s+/);
          $.each(classList, function(index, cls) {
            if (cls.indexOf('view-') >= 0) {
              $pr.removeClass(cls);
            }
          });
        })
        .addClass('view-' + view);
  };

  /**
   * LayerVis subroutines
   */
  function makeOnce($container) {
    $container.removeClass('_processed');
    var $root = $container.children('.layervis-root');
    var rootWidth = $root.width();
    var rootHeight = $root.height();

    var rootOffset = $root.offset();

    var layers = [];

    layers.push({
      $src: $root,
      elevation: 0,
      left: 0,
      top: 0,
      width: rootWidth,
      height: rootHeight
    });

    $root.find('div').each(function() {
      var $layer = $(this);
      if ($layer.hasClass('nolayer')) {
        return;
      }

      var position = $layer.offset();
      position.left -= rootOffset.left;
      position.top -= rootOffset.top;

      var elevation = parseFloat($layer.attr('data-elevation') || 0, 10);

      layers.push({
        $src: $layer,
        elevation: elevation,
        left: position.left,
        top: position.top,
        width: $layer.width(),
        height: $layer.height(),
        noshadow: !!$layer.hasClass('noshadow')
      });
    });

    // sort by elevation
    layers.sort(function(a,b) {
      return a.elevation - b.elevation;
    });

    var $processedRoot = $container.find('.layervis-processed-root');
    if (!$processedRoot.length) {
      $processedRoot = $('<div>')
          .attr('class', 'layervis-processed-root')
          .appendTo($('<div>')
                .attr('class', 'layervis-processed-root-positioner')
                .css({
                  width: rootWidth,
                  height: rootHeight
                })
                .appendTo($container));
    }
    $processedRoot.empty();

    // arrange layers orthographically
    layers.forEach(function(layer) {
      var $layerHolder = $('<div>')
          .addClass('layer-holder')
          .css({
            transform: 'translate3d(0,0,' + (layer.elevation * LAYERVIS_ELEVATION_SCALE) + 'px)'
          })
          .appendTo($processedRoot);
      layer.$ = layer.$src.clone()
          .css({
            // resets
            position: 'absolute',
            left: 'auto',
            top: 'auto',
            right: 'auto',
            bottom: 'auto',
            'margin-left': 0,
            'margin-top': 0,
            'margin-right': 0,
            'margin-bottom': 0,

            // ortho position
            width: layer.width + 'px',
            height: layer.height + 'px',
            transform: 'translate3d(' + layer.left + 'px, ' + layer.top + 'px, 0)'
          })
          .addClass('layer')
          .appendTo($layerHolder);

      layer.$.find('div:not(.nolayer)').remove();
    });

    // create shadows (highest elevation first)
    for (var i = layers.length - 1; i >= 0; i--) {
      for (var j = i - 1; j >= 0; j--) {
        var topLayer = layers[i];
        var bottomLayer = layers[j];
        if (topLayer.elevation == bottomLayer.elevation || topLayer.noshadow) {
          continue;
        }

        // create a shadow (already ortho'd since it'll be inside bottomLayer)
        var distance = topLayer.elevation - bottomLayer.elevation;
        var $shadow = $('<div>')
            .addClass('shadow')
            .css({
              left: (topLayer.left - bottomLayer.left + distance * SHADOW_DX) + 'px',
              top: (topLayer.top - bottomLayer.top + distance * SHADOW_DY) + 'px',
              width: topLayer.width + 'px',
              height: topLayer.height + 'px',
              opacity: interpolateCap(
                  progress(distance, MAX_SHADOW_DARK_AT, MIN_SHADOW_DARK_AT),
                  MAX_SHADOW_DARK, MIN_SHADOW_DARK),
              'filter': 'blur(' + interpolateCap(progress(distance, 0, 5), MIN_SHADOW_BLUR, MAX_SHADOW_BLUR) + 'px)',
              '-webkit-filter': 'blur(' + interpolateCap(progress(distance, 0, 5), MIN_SHADOW_BLUR, MAX_SHADOW_BLUR) + 'px)'
            });

        var computedStyle = getComputedStyle(topLayer.$.get(0));
        $shadow.css('border-radius', computedStyle.borderTopLeftRadius);
        $shadow.appendTo(bottomLayer.$);
      }
    }

    $container.addClass('_processed');
  }

  function setup3dPan($layervis) {
    var ox, oy;
    var cx = 0.5, cy = 0;
    var sx, sy;
    var down;

    var width, height;

    $layervis
        .on('mousedown', function(e) {
          $(this).find('.layervis-processed-root').addClass('noanimate');
          sx = e.clientX;
          sy = e.clientY;
          width = $(this).width() / 5;
          height = $(this).height() / 5;
          ox = cx;
          oy = cy;
          down = true;
        });

    $(document)
        .on('mousemove', function(e) {
          if (!down) {
            return;
          }

          var dx = (e.clientX - sx) / width;
          var dy = (e.clientY - sy) / height;

          cx = interpolate(constrain(ox + dx, 0, 1), 0, 1);
          cy = interpolate(constrain(oy - dy, 0, 1), 0, 1);

          var tx = interpolate(cy, 0, -23);
          var ty = interpolate(cy, 0, 150);
          var rx = interpolate(cy, 0, 70);
          var ry = 0;//interpolate(fx, 0, 30);
          var rz = interpolate(cx, 45, -45);
          var scalePre = interpolate(cy, 0.75, 1);
          var scalePost = interpolate(cy, 1, 0.8);

          var transform = '';

          transform += 'perspective(' + LAYERVIS_PERSPECTIVE + 'px) ';
          transform += 'rotateX(' + rx + 'deg) ';
          transform += 'rotateY(' + ry + 'deg) ';
          transform += 'rotateZ(' + rz + 'deg) ';

          $layervis.find('.layervis-processed-root').css('transform', transform);
        })
        .on('mouseup', function(e) {
          down = false;
        });
  }

  function setupRescale($container) {
    function _rescale() {
      var $inner = $container.find('.layervis-processed-root-positioner');

      var ow = $inner.width();
      var oh = $inner.height();

      var ww = $container.width();
      var wh = $container.height();

      var scale = 1;

      if (ow / oh > ww / wh) {
        scale = ww / ow;
      } else {
        scale = wh / oh;
      }

      scale *= 0.7;

      $inner.css('transform', 'scale(' + scale + ')');
    }

    _rescale();
    $(window).resize(_rescale);
  }

  /**
   * Utilities
   */

  function progress(f, min, max) {
    return (f - min) / (max - min);
  }

  function interpolate(f, min, max) {
    return min + f * (max - min);
  }

  function interpolateCap(f, min, max) {
    if (max < min) {
      return interpolateCap(1 - f, max, min);
    }
    return constrain(interpolate(f, min, max), min, max);
  }

  function constrain(f, min, max) {
    if (f < min) {
      return min;
    } else if (f > max) {
      return max;
    } else {
      return f;
    }
  }
})();