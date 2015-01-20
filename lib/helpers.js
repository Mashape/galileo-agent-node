'use strict';

var os = require('os');

module.exports = {
  /**
   * get server address from network interface
   */
  getServerAddress: function () {
    var ret = '127.0.0.1';
    var interfaces = os.networkInterfaces();

    Object.keys(interfaces).forEach(function (el) {
      interfaces[el].forEach(function (el2) {
        if (!el2.internal && el2.family === 'IPv4') {
          ret = el2.address;
        }
      });
    });

    return ret;
  },

  /**
   * convert header string to assoc array
   */
  parseResponseHeaderString: function (string) {
    if (!string || string === '' || string.indexOf('\r\n') === -1) {
      return {
        version: 'HTTP/1.1',
        statusText: ''
      };
    }

    var lines = string.split('\r\n');
    var status = lines.shift();

    // Remove empty strings
    lines = lines.filter(Boolean);

    // Parse status line
    var output = this.parseStartLine(status);

    // init headers object & array
    output.headersObj = {};
    output.headersArr = [];

    // Parse headers
    for (var i = lines.length; i--;) {
      var header = this.parseHeaderLine(lines[i]);

      output.headersArr.push(header);
      output.headersObj[header.name] = header.value;
    }

    return output;
  },

  /**
   * parse status line into an object
   */
  parseStartLine: function (line) {
    var pieces = line.split(' ');

    // Header string pieces
    var output = {
      version: pieces.shift(),
      status: parseFloat(pieces.shift()),
      statusText: pieces.join(' ')
    };

    return output;
  },

  /**
   *
   */
  parseHeaderLine: function (line) {
    var pieces = line.split(': ');
    var name = pieces.shift();
    var value = pieces.join(': ');

    return {
      name: name,
      value: value
    };
  },

  /**
   * Transform objects into an array of key value pairs.
   */
  objectToArray: function (obj) {
    if (!obj || typeof obj !== 'object') {
      return [];
    }

    var results = [];
    var names = Object.keys(obj);
    var name;

    while (name = names.pop()) {
      results.push({
        name: name,
        value: obj[name]
      });
    }

    return results;
  },

  /**
   * uses regex to match a header value
   *
   * TODO fall back to manual measurement when Content-Length is not available
   */
  getHeaderValue: function (headers, key, def) {
    if (headers instanceof Array) {
      var regex = new RegExp(key, 'i');
      for (var i in headers) {
        if (regex.test(headers[i].name)) {
          return headers[i].value;
        }
      }
    }

    return def !== undefined ? def : false;
  },

  /**
   * quickly calculates the header size in bytes for a given array of headers
   */
  getReqHeaderSize: function (req) {
    var keys = Object.keys(req.headers);

    var values = keys.map(function (key) {
      return req.headers[key];
    });

    var headers = req.method + req.url + req.versionMajor + req.versionMinor + keys.join() + values.join();

    // startline: [method] [url] HTTP/1.1\r\n = 12
    // endline: \r\n = 2
    // every header + \r\n = * 2
    return new Buffer(headers).length + (keys.length * 2) + 12 + 2;
  }
};