module.exports = function() {
    let the_export = function(app, extra) {
        if (this.was_called) return this.ret_val;
        for (let i = 0; i < this.functions.length; i++) {
            this.functions[i](app, extra);
        }
        this.was_called = true;
        this.ret_val = this.ret_val || {};
        return this.ret_val;
    };
    the_export.ret_val = [];
    the_export.functions = [];
    return the_export;
}
