function calculateMoonPhase(unixTime) {
  // Constants
  const referenceNewMoonUnix = 947182440; // Jan 6, 2000, 18:14 UTC
  const synodicMonth = 29.530588861; // Average length of a lunar cycle in days
  const secondsPerDay = 86400; // Number of seconds in a day

  // Calculate the days since the reference New Moon
  const secondsSinceNewMoon = unixTime - referenceNewMoonUnix;
  const daysSinceNewMoon = secondsSinceNewMoon / secondsPerDay;

  // Determine the Moon phase as a fraction of the synodic month
  const phase = daysSinceNewMoon % synodicMonth;
  const phaseFraction = phase / synodicMonth;

  return phaseFraction;
}

// SOURCE: https://github.com/codebox/js-planet-phase
/*
    Defines the function 'drawPlanetPhase' which will render a 'kind of' realistic lunar or planetary disc with
    shadow.

    The simplest way to call the function is like this:

        drawPlanetPhase(document.getElementById('container'), 0.15, true)

    the first argument is the HTML element that you want to contain the disc

    the second argument must be a value between 0 and 1, indicating how large the shadow should be: 
        0 = new moon
        0.25 = crescent
        0.50 = quarter
        0.75 = gibbous
        1.00 = full moon

    the third argument is a boolean value indicating whether the disc should be waxing or waning (ie which 
    side of the disc the shadow should be on):
        true = waxing - shadow on the left
        false = waning - shadow on the right

    the function accepts an optional fourth argument, containing configuration values which change the
    size, colour and appearance of the disc - see the comments on the 'defaultConfig' object for details.

    Copyright 2014 Rob Dawson
    http://codebox.org.uk/pages/planet-phase
*/

var drawPlanetPhase = (function () {
  "use strict";
  /*jslint browser: true, forin: true, white: true */

  function calcInner(outerDiameter, semiPhase) {
    var innerRadius,
      absPhase = Math.abs(semiPhase),
      n = ((1 - absPhase) * outerDiameter) / 2 || 0.01;

    innerRadius = n / 2 + (outerDiameter * outerDiameter) / (8 * n);

    return {
      d: innerRadius * 2,
      o:
        semiPhase > 0
          ? outerDiameter / 2 - n
          : -2 * innerRadius + outerDiameter / 2 + n,
    };
  }

  function setCss(el, props) {
    var p;
    for (p in props) {
      el.style[p] = props[p];
    }
  }
  function drawDiscs(outer, inner, blurSize) {
    var blurredDiameter, blurredOffset;
    setCss(outer.box, {
      position: "absolute",
      height: outer.diameter + "px",
      width: outer.diameter + "px",
      // 'border':   '1px solid black',
      backgroundColor: outer.colour,
      borderRadius: outer.diameter / 2 + "px",
      overflow: "hidden",
      // multiply
      "mix-blend-mode": "multiply",
    });

    blurredDiameter = inner.diameter - blurSize;
    blurredOffset = inner.offset + blurSize / 2;

    setCss(inner.box, {
      position: "absolute",
      backgroundColor: inner.colour,
      borderRadius: blurredDiameter / 2 + "px",
      height: blurredDiameter + "px",
      width: blurredDiameter + "px",
      left: blurredOffset + "px",
      top: (outer.diameter - blurredDiameter) / 2 + "px",
      boxShadow:
        "0px 0px " + blurSize + "px " + blurSize + "px " + inner.colour,
      opacity: inner.opacity,
    });
  }
  function makeDiv(container) {
    var div = document.createElement("div");
    container.appendChild(div);
    return div;
  }
  function setPhase(outerBox, phase, isWaxing, config) {
    var innerBox = makeDiv(outerBox),
      outerColour,
      innerColour,
      innerVals;

    if (phase < 0.5) {
      outerColour = config.lightColour;
      innerColour = config.shadowColour;
      if (isWaxing) {
        phase *= -1;
      }
    } else {
      outerColour = config.shadowColour;
      innerColour = config.lightColour;
      phase = 1 - phase;
      if (!isWaxing) {
        phase *= -1;
      }
    }

    innerVals = calcInner(config.diameter, phase * 2);

    drawDiscs(
      {
        box: outerBox,
        diameter: config.diameter,
        colour: outerColour,
      },
      {
        box: innerBox,
        diameter: innerVals.d,
        colour: innerColour,
        offset: innerVals.o,
        opacity: 1 - config.earthshine,
      },
      config.blur
    );
  }

  var defaultConfig = {
    shadowColour: "rgba(0, 0, 0, 0.8)", // CSS background-colour value for the shaded part of the disc
    lightColour: "white", // CSS background-colour value for the illuminated part of the disc
    diameter: 500, // diameter of the moon/planets disc in pixels
    earthshine: 0.0, // between 0 and 1, the amount of light falling on the shaded part of the disc 0=none, 1=full illumination
    blur: 40, // amount of blur on the terminator in pixels, 0=no blur
  };

  function populateMissingConfigValues(config) {
    var p;
    for (p in defaultConfig) {
      config[p] = config[p] === undefined ? defaultConfig[p] : config[p];
    }
    return config;
  }

  return function (containerEl, phase, isWaxing, config) {
    config = populateMissingConfigValues(Object.create(config || {}));
    var el = makeDiv(containerEl);
    setPhase(el, phase, isWaxing, config);
  };
})();

function moonPhaseDescription(percentage) {
  if (percentage < 0.033863193308711) {
    return "New Moon";
  } else if (percentage < 0.216136806691289) {
    return "Waxing Crescent";
  } else if (percentage < 0.283863193308711) {
    return "First Quarter";
  } else if (percentage < 0.466136806691289) {
    return "Waxing Gibbous";
  } else if (percentage < 0.533863193308711) {
    return "Full";
  } else if (percentage < 0.716136806691289) {
    return "Waning Gibbous";
  } else if (percentage < 0.783863193308711) {
    return "Last Quarter";
  } else if (percentage < 0.966136806691289) {
    return "Waning Crescent";
  } else {
    return "New Moon";
  }
}

function drawMoonPhase(diameter) {
  const unixTime = Math.floor(Date.now() / 1000); // Current Unix time
  const moonPhasePercentage = calculateMoonPhase(unixTime);

  const illumination = 1 - 2 * Math.abs(moonPhasePercentage - 0.5);
  const flipped = moonPhasePercentage < 0.5;

  drawPlanetPhase(document.getElementById("container"), illumination, flipped, {
    diameter,
  });

  document.querySelector(".title_bar .title").innerHTML =
    moonPhaseDescription(moonPhasePercentage);
}
