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

    //Flags experiments that lack the "experimenttype" property (a handful of them)
    parse: function (response) {
        let hasType = response.hasOwnProperty('experimenttype');

        if (!hasType) {
            console.log(`Experiment with ID ${response.id} and accession ${response.accession} has no "experimenttype" property set`);
        }
        response.hasType = hasType;

        return response;
    },

    isOdd: function () {
        return (this.collection.indexOf(this) + 1) % 2;
    }
});