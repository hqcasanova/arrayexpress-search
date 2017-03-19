import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';

export default Backbone.Model.extend({
    defaults: function () {
        return {
            accession: 'E-MEXP-00',
            name: 'empty',
            description: {text: 'none'}
        }
    },

    parse: function (response) {
        var hasType = response.hasOwnProperty('experimenttype');

        response.hasType = hasType;
        return response;
    },

    isOdd: function () {
        return (this.collection.indexOf(this) + 1) % 2;
    }
});