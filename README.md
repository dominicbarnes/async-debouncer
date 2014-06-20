# async-debouncer

Manages asynchronous calls for cases like user search. In this implementation, only the most recent request from
the user matters, and all others are cancelled once a new request is made.

Yeah, the name is really terrible... I couldn't think of what else to call this, so I'm open to suggestions.


## Install

    component install dominicbarnes/async-debouncer


## Usage

The example here is using superagent to request a google search result.

```js
var AsyncDebouncer = require("async-debouncer");
var superagent = require("superagent");

var ad = new AsyncDebouncer({
    start: function (terms, done) {
        // notice we return the `req` object
        return superagent
            .get("http://google.com/")
            .query({ q: terms })
            .on("error", function (err) {
                if (this.aborted) return; // swallow abort errors
                done(err);
            })
            .end(function (res) {
                done(null, res);
            });
    },
    cancel: function (req) {
        req.abort();
    }
});

ad.on("error", function (err) {
    console.error(err);
});

ad.on("success", function (res) {
    console.log(res.text); // the HTML response
});

ad.run("test 1"); // will be cancelled automatically
ad.run("test 2"); // will be cancelled automatically
ad.run("test 3");
```

### options.start

This function can take a variable number of arguments. The last one will be a `done`
callback that must be called upon success or failure. (using the node-style `err`
first convention)

**Note:** if you're working with an AJAX library like superagent, an aborted request
will be treated as an error, so you'll need to make sure to take that into account.
(the example above does just that)

When `run()` is called, all the argument it receives will be forwarded to this function.
Lastly, this function **must** return a value, as it will be the only context that the
corresponding `cancel()` function will have.


### options.cancel

This function takes the value returned by `start()` and cancels the asynchronous operation.
For AJAX libraries, this will like be something along the lines of `req.abort()`, where `req`
is the first argument passed to the function.


### options.rate

This optional configuration allows you to automatically
[debounce](https://github.com/component/debounce) calls to `start()`.
