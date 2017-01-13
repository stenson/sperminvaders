/*
 Utility functions for (W)eb (A)udio (API)
 */

var waapi = (function() {
  var ___t = 1;
  var context;

  try {
    context = window.AudioContext ? new window.AudioContext() : new window.webkitAudioContext();
    //context.sampleRate = 44100;
  } catch (e) {
    context = null;
  }

  function loadSound(url, callback) {
    var adjUrl = url;
    var request = new XMLHttpRequest();
    request.open('GET', adjUrl + "?t=" + ___t, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
      context.decodeAudioData(request.response, function(buffer) {
        setTimeout(function() {
          callback(buffer);
        }, 0);
      }, function() {
        console.log("ERROR", arguments);
      });
    };
    request.send();
  }

  function loadSounds(urls, callback) {
    var toLoad = urls.length;
    var buffers = {};
    urls.map(function(url) {
      loadSound(url, function(buffer) {
        toLoad -= 1;
        buffers[url] = buffer;
        if (toLoad === 0) {
          callback(buffers);
        }
      });
    });
  }

  return {
    context: context,
    loadSounds: loadSounds,
    destination: function() {
      return context.destination;
    },
    convolver: function(destination) {
      var c = context.createConvolver();
      c.normalize = false;
      if (destination) {
        c.connect(destination);
      }
      return c;
    },
    stereoPanner: function(value) {
      var p = context.createStereoPanner();
      p.pan.value = value;
      return p;
    },
    gain: function(destination) {
      var g = context.createGain();
      if (destination) {
        g.connect(destination);
      }
      return g;
    },
    analyzer: function(destination, fftSize) {
      var a = context.createAnalyser();
      a.maxDecibels = 0.0;
      a.minDecibels = -96.0;
      a.fftSize = fftSize || 2048;
      if (destination) {
        a.connect(destination);
      }
      return a;
    },
    createBufferFromLR: function(l, r) {
      var b = context.createBuffer(2, l.length, 44100);
      var chan1 = b.getChannelData(0);
      var chan2 = b.getChannelData(1);
      for (var i = 0; i < l.length; i++) {
        chan1[i] = l[i];
        chan2[i] = r[i];
      }
      return b;
    },
    playBufferOnce: function(gain, buffer) {
      var source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = false;
      source.connect(gain);
      source.start();
      return source;
    },
    jumpstartFromClick: function() {
      /* weirdly necessary to do something audio-related
       right after a click event on ios */
      (function() {
        var source = waapi.context.createBufferSource();
        var gain = waapi.context.createGain();
        gain.gain.value = 0;
        source.connect(gain);
        gain.connect(waapi.destination());
        source.start(0.0);
      })();
    },
    playSound: function (gain, buffer, startSamples, endSamples, sampleRate) {
      var source = context.createBufferSource();
      var loopStart = startSamples / sampleRate;
      source.buffer = buffer;
      source.loop = false;
      //source.loopStart = loopStart;
      //source.loopEnd = ((endSamples + startSamples) / sampleRate);
      source.connect(gain);
      source.start(0.0, loopStart, 1000);
      return source;
    },
    loopSound: function (gain, buffer, startSamples, endSamples, sampleRate, playbackRate) {
      var source = context.createBufferSource();
      var loopStart = startSamples / sampleRate;
      source.buffer = buffer;
      source.loop = true;
      source.playbackRate.value = playbackRate;
      //source.loopStart = loopStart;
      //source.loopEnd = ((endSamples + startSamples) / sampleRate);
      source.connect(gain);
      source.start(0.0, loopStart, 1000);
      return source;
    },
    rampGain: function(node, to, length) {
      node.gain.linearRampToValueAtTime(to ? 0 : 1, context.currentTime);
      node.gain.linearRampToValueAtTime(to ? 1 : 0, context.currentTime + length);
    },
    resample: function(buffer, toSR, cb) {
      if (buffer.sampleRate == toSR) {
        cb(buffer);
        return;
      }

      try {
        var o = new OfflineAudioContext(2, buffer.length, toSR);
        var source = o.createBufferSource();
        source.buffer = buffer;
        source.connect(o.destination);
        source.start(0);
        o.oncomplete = function(e) {
          cb(e.renderedBuffer);
        };
        o.startRendering();
      } catch(e) {
        cb(buffer);
      }
    }
  };
})();