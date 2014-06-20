var assert = require("assert");
var AsyncDebouncer = require("async-debouncer");
var noop = require("noop");

describe("AsyncDebouncer(options)", function () {
    it("should be a function", function () {
        assert(typeof AsyncDebouncer === "function");
    });

    it("should not require the new keyword", function () {
        var inst = AsyncDebouncer();
        assert(inst instanceof AsyncDebouncer);
    });

    it("should set the _start property", function () {
        var inst = new AsyncDebouncer({ start: noop });
        assert(inst._start === noop);
    });

    it("should set the _cancel property", function () {
        var inst = new AsyncDebouncer({ cancel: noop });
        assert(inst._cancel === noop);
    });

    it("should use a debounced function for _start", function () {
        var inst = new AsyncDebouncer({ start: noop, rate: 100 });
        assert(inst._start !== noop);
        assert(typeof inst._start === "function");
    });
});

describe("AsyncDebouncer#run(...args)", function () {
    var inst = new AsyncDebouncer({
        start: function (done) {
            assert(typeof done === "function");
            return setTimeout(done, 1);
        },
        cancel: function (id) {
            assert(id);
            return clearTimeout(id);
        }
    });

    beforeEach(function () {
        inst.off();
    });

    it("should pass a smoke test", function (done) {
        inst.on("success", done);

        inst.run();
    });

    it("should cancel a previous call", function (done) {
        inst.on("cancel", function () {
            done();
        });

        inst.run(); // should be cancelled
        inst.run();
    });

    it("should set the inFlight property", function (done) {
        inst.on("success", function () {
            done();
        });

        inst.run();
        assert(inst.inFlight);
    });

    it("should remove the inFlight property after success", function (done) {
        inst.on("success", function () {
            assert(!inst.inFlight);
            done();
        });

        inst.run();
    });

    it("should remove the inFlight property after failure", function (done) {
        var inst = new AsyncDebouncer({
            start: function (done) {
                return setTimeout(function () {
                    done(new Error("fail"));
                }, 1);
            },
            cancel: function (id) {
                return clearTimeout(id);
            }
        });

        inst.on("error", function (err) {
            assert(!inst.inFlight);
            done();
        });

        inst.run();
    });

    it("should emit a run event", function (done) {
        inst.on("run", function () {
            done();
        });
        inst.run();
    });

    it("should forward arguments to _start", function (done) {
        var inst = new AsyncDebouncer({
            start: function (a, b, done) {
                assert(a === "a");
                assert(b === "b");
                assert(typeof done === "function");
                return setTimeout(done, 1);
            },
            cancel: function (id) {
                assert(id);
                return clearTimeout(id);
            }
        });

        inst.on("success", done);
        inst.run("a", "b");
    });

    it("should pass the success value to the event", function (done) {
        var inst = new AsyncDebouncer({
            start: function (done) {
                return setTimeout(function () {
                    done(null, "hello world");
                }, 1);
            },
            cancel: function (id) {
                return clearTimeout(id);
            }
        });

        inst.on("success", function (result) {
            assert(result === "hello world");
            done();
        });

        inst.run();
    });
});

describe("AsyncDebouncer#cancel()", function () {
    var inst = new AsyncDebouncer({
        start: function (done) {
            return setTimeout(done, 25);
        },
        cancel: function (id) {
            return clearTimeout(id);
        }
    });

    beforeEach(function () {
        inst.off();
    });

    it("should emit a cancel event", function (done) {
        inst.on("cancel", function (id) {
            assert(id);
            done();
        });

        inst.run();
        inst.cancel();
    });

    it("should call the _cancel method and pass the inFlight value", function (done) {
        var inst = new AsyncDebouncer({
            cancel: function (id) {
                assert(id === "id");
                done();
            }
        });

        inst.inFlight = "id";
        inst.cancel();
    });
});
