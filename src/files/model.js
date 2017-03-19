import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';

//NOTE: Assumes a collection of type Results (see ../results/collection.js)
export default Backbone.Model.extend({
    defaults: function () {
        return {
            extension: '',
            kind: '',
            url: ''
        }
    },

    //Normalises kind to a single non-array value: "processed" or "raw".
    parse: function (response) {
        if (Array.isArray(response.kind)) {
            response.kind = _.find(response.kind, (kind) => {
                return kind === 'processed' || kind === 'raw';
            });
        }

        return response;
    }
});