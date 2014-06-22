// dependencies
var debounce = require("debounce");
var Emitter = require("emitter");
var debug = require("debug")("async-debouncer");


// single export
module.exports = AsyncDebouncer;


// mixins
Emitter(AsyncDebouncer.prototype);


/**
 * Represents a single "queue" of operations. In this implementation, only the **most recent**
 * request matters, all other ones are cancelled. This also exposes a debouncer to limit the
 * number of calls to start if needed.
 *
 * Available options:
 *
 *  - start {Function}   Used to fire off operations. It must return a value that `cancel` can
 *                       use to cancel the corresponding request. The last argument passed is
 *                       a callback that must be called upon success or failure. (node-style)
 *
 *  - cancel {Function}  Used to cancel previous requests. It gets a single argument,
 *                       which is the value returned by `start`
 *
 *  - rate {Number}      If supplied, passed to `debounce` to limit the number of calls
 *                       to `start` internally
 *
 * @param {Object} options
 */
function AsyncDebouncer(options) {
    if (!(this instanceof AsyncDebouncer)) {
        return new AsyncDebouncer(options);
    }

    if (options) {
        if (options.start) {
            if (options.rate) {
                debug("using a debounced function at rate", options.rate);
                this._start = debounce(options.start, options.rate);
            } else {
                this._start = options.start;
            }
        }

        if (options.cancel) {
            this._cancel = options.cancel;
        }
    }
}

/**
 * Calls the user-supplied start function with the supplied arguments
 */
AsyncDebouncer.prototype.run = function () {
    debug("run", "arguments", arguments);
    var self = this;

    this.cancel(); // cancel any previous calls

    var args = [].slice.call(arguments);
    args.push(function (err, results) {
        debug("run", "complete");
        delete self.inFlight;

        if (err) {
            self.emit("error", err);
        } else {
            self.emit("success", results);
        }
    });

    this.emit("run", args);
    this.inFlight = this._start.apply(null, args);
    debug("run", "now in flight", this.inFlight);
};

/**
 * Cancels the currently outstanding in-flight action, if there is one
 */
AsyncDebouncer.prototype.cancel = function () {
    debug("cancel");
    if (this.inFlight) {
        this.emit("cancel", this.inFlight);
        this._cancel(this.inFlight);
    } else {
        debug("cancel", "nothing in flight");
    }
};
